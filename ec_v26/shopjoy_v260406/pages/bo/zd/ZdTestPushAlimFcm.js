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
      title:       '[ShopJoy] 테스트 푸시',
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


    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.push.fcm.project-id,app.push.fcm.key-file,app.push.apns.enabled',
        }, 'FCM 푸시 알림 테스트', '키 조회');
        const list = res?.data?.data || [];
        list.forEach(p => {
          if (p.propKey === 'app.push.fcm.project-id')  cfg.fcmProjectId = p.propValue || '';
          if (p.propKey === 'app.push.fcm.key-file')    cfg.fcmKeyFile   = p.propValue || '';
          if (p.propKey === 'app.push.apns.enabled')    cfg.apnsEnabled  = p.propValue === 'true';
        });
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
        const res = await boApi.post('/bo/sy/test/push/fcm', {
          targetType:  form.targetType,
          targetValue: form.targetValue,
          title:       form.title,
          body:        form.body,
          imageUrl:    form.imageUrl || undefined,
          data:        dataObj,
        }, coUtil.apiHdr('FCM 푸시 테스트', '푸시 발송'));
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
        const res = await boApi.get('/bo/sy/test/push/tokens', coUtil.apiHdr('FCM 푸시 테스트', '토큰 목록'));
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

    return { cfg, form, result, uiState, handleBtnAction };
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
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">대상 유형</label>
          <select class="form-control" v-model="form.targetType">
            <option value="token">FCM Token (단건)</option>
            <option value="topic">Topic (구독자)</option>
            <option value="member">회원 ID</option>
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">
            {{ form.targetType === 'token' ? 'FCM Registration Token' : form.targetType === 'topic' ? 'Topic 명' : '회원 ID' }}
            <span style="color:#e74c3c">*</span>
          </label>
          <input class="form-control" v-model="form.targetValue"
            :placeholder="form.targetType==='token'?'eXxxxxxx…':form.targetType==='topic'?'all_members':'MB000001'"
            style="font-family:monospace;font-size:12px" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">제목</label>
          <input class="form-control" v-model="form.title" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">이미지 URL (선택)</label>
          <input class="form-control" v-model="form.imageUrl" placeholder="https://…/image.png" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">본문</label>
          <textarea class="form-control" v-model="form.body" rows="2" style="resize:vertical"></textarea>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Data Payload (JSON)</label>
          <textarea class="form-control" v-model="form.data" rows="2" style="font-family:monospace;font-size:12px;resize:vertical"></textarea>
        </div>
      </div>
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
        <table class="admin-table" style="font-size:11px">
          <thead><tr>
            <th style="width:36px">번호</th>
            <th>회원 ID</th>
            <th>플랫폼</th>
            <th>토큰 (앞 30자)</th>
            <th>등록일</th>
            <th style="width:60px">사용</th>
          </tr></thead>
          <tbody>
            <tr v-for="(t, idx) in result.tokenLogs" :key="t.deviceTokenId">
              <td style="text-align:center">{{ idx + 1 }}</td>
              <td>{{ t.memberId }}</td>
              <td><span :class="t.platform==='ANDROID'?'badge badge-green':t.platform==='IOS'?'badge badge-blue':'badge badge-gray'">{{ t.platform }}</span></td>
              <td style="font-family:monospace">{{ (t.fcmToken || '').substring(0, 30) }}…</td>
              <td>{{ t.regDate }}</td>
              <td style="text-align:center">
                <button class="btn btn_row_edit" @click="handleBtnAction('token-use', t.fcmToken)">선택</button>
              </td>
            </tr>
          </tbody>
        </table>
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
      <b>백엔드 API:</b> <code>POST /api/bo/sy/test/push/fcm</code> → <code>CmPushSendService.sendFcm()</code><br>
      <code>GET /api/bo/sy/test/push/tokens</code> → <code>mb_device_token</code> 조회
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.push.fcm." default-prop-key-filter="app.push.fcm." />
</div>`,
};
