/**
 * 개발도구 — FCM 푸시 알림 테스트
 */
window.ZdTestPushAlimFcm = {
  name: 'ZdTestPushAlimFcm',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      fcmProjectId: '',
      fcmKeyFile:   '',
      apnsEnabled:  false,
    });

    const form = reactive({
      targetType:  'token',  // token | topic | member
      targetValue: '',
      title:       '[ShopJoy] 테스트 푸시 [' + new Date().toISOString().replace('T',' ').slice(0,19) + ']',
      body:        'FCM 연동이 정상적으로 작동하는지 확인하는 테스트 푸시입니다.',
      imageUrl:    '',
      data:        '{"type":"test","url":"/"}',
    });

    const result = reactive({
      status:    '',
      response:  null,
      error:     '',
      logs:      [],
      tokenLogs: [],
    });

    const uiState = reactive({ loading: false, loadingTokens: false });

    // ── 발송 폼 컬럼 ──────────────────────────────────────
    const baseFormColumns = [
      {
        key: 'targetType', label: '대상 유형', type: 'select',
        hint: 'targetType',
        options: [
          { value: 'token',  label: 'FCM Token (단건)' },
          { value: 'topic',  label: 'Topic (구독자)' },
          { value: 'member', label: '회원 ID' },
        ],
      },
      {
        key: 'targetValue', label: '발송 대상',
        hint: 'targetValue',
        type: 'slot', name: 'target-value',
        colSpan: 2,
        required: true,
      },
      { key: 'title',    label: '제목',               type: 'text',     hint: 'title',    colSpan: 2 },
      { key: 'imageUrl', label: '이미지 URL (선택)',  type: 'text',     hint: 'imageUrl', placeholder: 'https://…/image.png' },
      { key: 'body',     label: '본문',               type: 'textarea', hint: 'body',     colSpan: 2 },
      { key: 'data',     label: 'Data Payload (JSON)', type: 'textarea', hint: 'data',    colSpan: 3, mono: true },
    ];

    // ── 디바이스 토큰 그리드 컬럼 ─────────────────────────
    const deviceGridColumns = [
      { key: 'memberId', label: '회원 ID' },
      {
        key: 'platform', label: '플랫폼', align: 'center',
        badge: (row) => row.platform === 'ANDROID' ? 'badge badge-green' : row.platform === 'IOS' ? 'badge badge-blue' : 'badge badge-gray',
      },
      {
        key: '_token', label: '토큰 (앞 30자)', mono: true,
        fmt: (v, row) => ((row.fcmToken || '').substring(0, 30)) + '…',
      },
      { key: 'regDate', label: '등록일' },
      {
        key: '_action', label: '사용', width: '60px', align: 'center',
        cellType: 'slot', name: 'token-action',
      },
    ];

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.push.fcm.project-id,app.push.fcm.key-file,app.push.apns.enabled',
        }, 'FCM 푸시 알림 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => { const rows = list.filter(p => p.propKey === key && p.propValue); const pref = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0]; return pref?.propValue || ''; };
        cfg.fcmProjectId = pickVal('app.push.fcm.project-id');
        cfg.fcmKeyFile   = pickVal('app.push.fcm.key-file');
        const apnsEnabledVal = pickVal('app.push.apns.enabled'); if (apnsEnabledVal) cfg.apnsEnabled = apnsEnabledVal === 'true';
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addLog = (msg, type = 'info') => {
      result.logs.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.logs.length > 30) result.logs.pop();
    };

    const sendPush = async () => {
      if (!form.targetValue) { showToast('푸시 대상을 입력하세요.', 'error'); return; }
      if (!form.title) { showToast('제목을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ 푸시 발송 중…';
      result.error    = '';
      result.response = null;
      addLog('푸시 발송 요청 [' + form.targetType + ']: ' + form.targetValue.substring(0, 30) + '…');
      let dataObj = {};
      try { dataObj = JSON.parse(form.data || '{}'); } catch (e) { /* 무시 */ }
      try {
        const res = await boApi.post('/co/ext/push-fcm-send/send', {
          targetType:  form.targetType,
          targetValue: form.targetValue,
          title:       form.title,
          body:        form.body,
          imageUrl:    form.imageUrl || undefined,
          data:        dataObj,
        }, coUtil.cofApiHdr('FCM 푸시 테스트', '푸시 발송'));
        result.response = res.data?.data || res.data;
        result.status   = '✅ 푸시 발송 완료';
        addLog('✅ 발송 완료 (messageId: ' + (result.response?.messageId || '-') + ')', 'success');
        showToast('FCM 푸시 발송 완료', 'success');
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '알 수 없는 오류';
        result.status = '❌ 푸시 발송 실패';
        addLog('❌ 실패: ' + result.error, 'error');
        showToast('푸시 발송 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const loadDeviceTokens = async () => {
      uiState.loadingTokens = true;
      try {
        const res = await boApi.get('/co/ext/push-fcm-send/tokens', coUtil.cofApiHdr('FCM 푸시 테스트', '토큰 목록'));
        result.tokenLogs = res.data?.data || [];
      } catch (e) {
        showToast('토큰 목록 조회 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      uiState.loadingTokens = false;
    };

    const useToken = (token) => {
      form.targetType  = 'token';
      form.targetValue = token;
      showToast('토큰이 입력란에 설정되었습니다.', 'success');
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'push-send')   return sendPush();
      if (cmd === 'tokens-load') return loadDeviceTokens();
      if (cmd === 'token-use')   return useToken(param);
    };

    return { cfg, form, result, uiState, handleBtnAction, baseFormColumns, deviceGridColumns };
  },

  template: `
<div>
  <div class="page-title">FCM 푸시 알림 테스트</div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">푸시 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('push-send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '🔔 테스트 FCM 푸시 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #target-value>
          <input class="form-control" v-model="form.targetValue"
            :placeholder="form.targetType==='token'?'eXxxxxxx…':form.targetType==='topic'?'all_members':'MB000001'"
            style="font-family:monospace;font-size:12px" />
        </template>
      </bo-form-area>
      <div v-if="result.status" style="margin-top:8px;font-size:13px;font-weight:600">{{ result.status }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px;white-space:pre-wrap">{{ result.error }}</div>
      <div v-if="result.response" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        <pre style="margin:0">{{ JSON.stringify(result.response, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- 디바이스 토큰 목록 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">등록된 디바이스 토큰 (mb_device_token)</span>
      <div style="margin-left:auto">
        <button class="btn btn_search" :disabled="uiState.loadingTokens" @click="handleBtnAction('tokens-load')">
          {{ uiState.loadingTokens ? '⏳ 조회 중…' : '토큰 목록 조회' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="!result.tokenLogs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">
        [토큰 목록 조회] 버튼을 클릭하세요
      </div>
      <div v-else style="max-height:300px;overflow-y:auto">
        <bo-grid :columns="deviceGridColumns" :rows="result.tokenLogs" :show-row-num="true">
          <template #token-action="{ row }">
            <button class="btn btn_row_edit" @click="handleBtnAction('token-use', row.fcmToken)">선택</button>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>

  <!-- 이력 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">발송 이력 (최근 30건)</span></div>
    <div style="padding:12px">
      <div v-if="!result.logs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">발송 이력 없음</div>
      <div v-for="log in result.logs" :key="log.time" style="display:flex;gap:8px;font-size:12px;padding:4px 0;border-bottom:1px solid #f0f0f0">
        <span style="color:#999;white-space:nowrap">{{ log.time }}</span>
        <span :style="log.type==='error'?'color:#b91c1c':log.type==='success'?'color:#15803d':''">{{ log.msg }}</span>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card">
    <div class="toolbar"><span class="list-title">FCM 설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 (JSON 다운로드)<br>
      <b>2.</b> JSON 파일을 서버에 저장 (예: <code>/etc/shopjoy/fcm-service-account.json</code>)<br>
      <b>3.</b> sy_prop <code>app.push.fcm.project-id</code> = Firebase 프로젝트 ID<br>
      <b>4.</b> sy_prop <code>app.push.fcm.key-file</code> = 서비스 계정 JSON 파일 경로<br>
      <b>5.</b> 앱에서 FCM 토큰 발급 → <code>mb_device_token</code> 저장 → 위 토큰 목록 조회<br><br>
      <b>백엔드 API:</b> <code>POST /api/co/ext/push-fcm-send/send</code> → <code>CoExtPushFcmSendController</code> (FCM 시뮬레이션)<br>
      <code>GET /api/co/ext/push-fcm-send/tokens</code> → <code>mb_device_token</code> 조회
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/all" title="application.yml — FCM 푸시 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.push.fcm." default-prop-key-filter="app.push.fcm." />
</div>`,
};
