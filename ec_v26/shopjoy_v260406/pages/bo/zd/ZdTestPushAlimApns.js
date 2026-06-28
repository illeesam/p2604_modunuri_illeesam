/**
 * 개발도구 — APNs (Apple Push Notification service) 테스트
 */
window.ZdTestPushAlimApns = {
  name: 'ZdTestPushAlimApns',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      keyId:      '',   // APNs Auth Key ID (10자리)
      teamId:     '',   // Apple Team ID (10자리)
      keyFile:    '',   // .p8 키 파일 경로
      bundleId:   '',   // 앱 Bundle ID
      production: false, // true=production / false=sandbox
    });

    const form = reactive({
      deviceToken: '',
      title:       '[ShopJoy] APNs 테스트 [' + new Date().toISOString().replace('T',' ').slice(0,19) + ']',
      body:        'APNs 연동이 정상적으로 작동하는지 확인하는 테스트 푸시입니다.',
      badge:       1,
      sound:       'default',
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

    // ── APNs 설정 폼 컬럼 ─────────────────────────────────
    const cfgFormColumns = [
      { key: 'keyId',   label: 'Key ID (10자리)',  type: 'text',   hint: 'keyId',   placeholder: 'ABCD1234EF', mono: true },
      { key: 'teamId',  label: 'Team ID (10자리)', type: 'text',   hint: 'teamId',  placeholder: 'AB12CD34EF', mono: true },
      { key: 'bundleId', label: 'Bundle ID',       type: 'text',   hint: 'bundleId', placeholder: 'com.shopjoy.app', mono: true },
      {
        key: 'keyFile', label: '.p8 Key 파일 경로', type: 'text',  hint: 'keyFile',
        placeholder: '/etc/shopjoy/AuthKey_ABCD1234EF.p8', mono: true, colSpan: 2,
      },
      {
        key: 'production', label: '환경', type: 'select',
        hint: 'production',
        options: [
          { value: false, label: 'Sandbox (개발)' },
          { value: true,  label: 'Production (운영)' },
        ],
      },
    ];

    // ── 설정 요약 그리드 컬럼 ─────────────────────────────
    const configSummaryGridColumns = [
      { key: 'label', label: '항목', width: '160px', cellStyle: 'color:#555' },
      { key: 'value', label: '값',   cellType: 'slot', name: 'cfg-value' },
    ];

    const configSummaryRows = [
      { label: 'Key ID',    cfgKey: 'keyId' },
      { label: 'Team ID',   cfgKey: 'teamId' },
      { label: 'Bundle ID', cfgKey: 'bundleId' },
      { label: '환경',      cfgKey: 'production', isBadge: true },
    ];

    // ── 발송 폼 컬럼 ──────────────────────────────────────
    const baseFormColumns = [
      { key: 'deviceToken', label: 'iOS Device Token', type: 'text',     hint: 'deviceToken', placeholder: 'a1b2c3d4e5f6…(64자 hex)', mono: true, colSpan: 3, required: true },
      { key: 'title',       label: '제목',              type: 'text',     hint: 'title',    colSpan: 2 },
      { key: 'badge',       label: 'Badge',             type: 'number',   hint: 'badge' },
      { key: 'body',        label: '본문',              type: 'textarea', hint: 'body',     colSpan: 2 },
      { key: 'sound',       label: 'Sound',             type: 'text',     hint: 'sound',    placeholder: 'default' },
      { key: 'data',        label: 'Custom Data (JSON)', type: 'textarea', hint: 'data',    colSpan: 3, mono: true },
    ];

    // ── 디바이스 토큰 그리드 컬럼 ─────────────────────────
    const deviceGridColumns = [
      { key: 'memberId', label: '회원 ID' },
      {
        key: '_token', label: '토큰 (앞 20자)', mono: true,
        fmt: (v, row) => ((row.fcmToken || row.apnsToken || '').substring(0, 20)) + '…',
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
          propKeys: 'app.push.apns.key-id,app.push.apns.team-id,app.push.apns.key-file,app.push.apns.bundle-id,app.push.apns.production',
        }, 'APNs 푸시 알림 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => { const rows = list.filter(p => p.propKey === key && p.propValue); const pref = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0]; return pref?.propValue || ''; };
        cfg.keyId    = pickVal('app.push.apns.key-id');
        cfg.teamId   = pickVal('app.push.apns.team-id');
        cfg.keyFile  = pickVal('app.push.apns.key-file');
        cfg.bundleId = pickVal('app.push.apns.bundle-id');
        const prodVal = pickVal('app.push.apns.production'); if (prodVal) cfg.production = prodVal === 'true';
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
      if (!form.deviceToken) { showToast('Device Token 을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ APNs 푸시 발송 중…';
      result.error    = '';
      result.response = null;
      addLog('APNs 발송 요청 → ' + form.deviceToken.substring(0, 20) + '…');
      let dataObj = {};
      try { dataObj = JSON.parse(form.data || '{}'); } catch (e) { /* 무시 */ }
      try {
        const res = await boApi.post('/co/ext/push-apns-send/send', {
          deviceToken: form.deviceToken,
          title:       form.title,
          body:        form.body,
          badge:       form.badge,
          sound:       form.sound,
          data:        dataObj,
        }, coUtil.cofApiHdr('APNs 테스트', '푸시 발송'));
        result.response = res.data?.data || res.data;
        result.status   = '✅ APNs 발송 완료';
        addLog('✅ 발송 완료 (apnsId: ' + (result.response?.apnsId || '-') + ')', 'success');
        showToast('APNs 푸시 발송 완료', 'success');
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '알 수 없는 오류';
        result.status = '❌ 발송 실패';
        addLog('❌ ' + result.error, 'error');
        showToast('APNs 발송 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const loadIosTokens = async () => {
      uiState.loadingTokens = true;
      try {
        const res = await boApi.get('/co/ext/push-apns-send/tokens', coUtil.cofApiHdr('APNs 테스트', 'iOS 토큰 목록'));
        result.tokenLogs = res.data?.data || [];
      } catch (e) {
        showToast('토큰 목록 조회 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      uiState.loadingTokens = false;
    };

    const useToken = (token) => {
      form.deviceToken = token;
      showToast('토큰이 입력란에 설정되었습니다.', 'success');
    };

    const saveKey = async () => {
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.push.apns.key-id',     propValue: cfg.keyId },
          { propKey: 'app.push.apns.team-id',    propValue: cfg.teamId },
          { propKey: 'app.push.apns.key-file',   propValue: cfg.keyFile },
          { propKey: 'app.push.apns.bundle-id',  propValue: cfg.bundleId },
          { propKey: 'app.push.apns.production', propValue: String(cfg.production) },
        ], coUtil.cofApiHdr('APNs 테스트', '설정 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'push-send')     return sendPush();
      if (cmd === 'tokens-load')   return loadIosTokens();
      if (cmd === 'token-use')     return useToken(param);
      if (cmd === 'key-save')      return saveKey();
    };

    return {
      cfg, form, result, uiState, handleBtnAction,
      cfgFormColumns, baseFormColumns, deviceGridColumns,
      configSummaryGridColumns, configSummaryRows,
    };
  },

  template: `
<div>
  <div class="page-title">APNs (iOS 푸시 알림) 테스트</div>

  <!-- 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">APNs 설정</span>
      <div style="margin-left:auto">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="margin-top:12px">
        <bo-grid :columns="configSummaryGridColumns" :rows="configSummaryRows" :show-row-num="false">
          <template #cfg-value="{ row }">
            <template v-if="row.isBadge">
              <span :class="cfg.production ? 'badge badge-red' : 'badge badge-blue'">{{ cfg.production ? 'Production' : 'Sandbox' }}</span>
            </template>
            <template v-else>
              <code>{{ cfg[row.cfgKey] || '(not set)' }}</code>
            </template>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">푸시 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('push-send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '🍎 테스트 APNs 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <bo-form-area :columns="baseFormColumns" :form="form" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div v-if="result.status" style="margin-top:8px;font-size:13px;font-weight:600">{{ result.status }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px;white-space:pre-wrap">{{ result.error }}</div>
      <div v-if="result.response" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        <pre style="margin:0">{{ JSON.stringify(result.response, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- iOS 디바이스 토큰 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">등록된 iOS 디바이스 토큰 (mb_device_token)</span>
      <div style="margin-left:auto">
        <button class="btn btn_search" :disabled="uiState.loadingTokens" @click="handleBtnAction('tokens-load')">
          {{ uiState.loadingTokens ? '⏳' : 'iOS 토큰 목록 조회' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="!result.tokenLogs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">
        [iOS 토큰 목록 조회] 버튼을 클릭하세요
      </div>
      <div v-else style="max-height:280px;overflow-y:auto">
        <bo-grid :columns="deviceGridColumns" :rows="result.tokenLogs" :show-row-num="true">
          <template #token-action="{ row }">
            <button class="btn btn_row_edit" @click="handleBtnAction('token-use', row.fcmToken || row.apnsToken)">선택</button>
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
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">APNs 설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Apple Developer → Certificates → Keys → New Key → APNs 체크 → 다운로드 (.p8)<br>
      <b>2.</b> Key ID (10자리), Team ID (10자리) 확인<br>
      <b>3.</b> .p8 파일을 서버에 저장 → sy_prop <code>app.push.apns.key-file</code> 에 경로 등록<br>
      <b>4.</b> Bundle ID = Xcode 앱 Bundle Identifier<br>
      <b>5.</b> Sandbox(개발기기) vs Production(App Store 배포) 구분<br><br>
      <b>백엔드 API:</b> <code>POST /api/co/ext/push-apns-send/send</code> → <code>CoExtPushApnsSendController</code> (APNs 시뮬레이션)<br>
      <code>GET /api/co/ext/push-apns-send/tokens</code> → iOS <code>mb_device_token</code> 조회<br>
      라이브러리: <code>com.eatthepath:pushy</code> (Netty 기반 HTTP/2 APNs 클라이언트) 권장
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/all" title="application.yml — APNs 푸시 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.push.apns." default-prop-key-filter="app.push.apns." />
</div>`,
};
