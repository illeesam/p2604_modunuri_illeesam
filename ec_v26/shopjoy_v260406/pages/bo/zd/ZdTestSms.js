/**
 * 개발도구 — SMS 문자 발송 테스트
 */
window.ZdTestSms = {
  name: 'ZdTestSms',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      enabled:   false,
      provider:  '',
      apiKey:    '',
      apiSecret: '',
      from:      '',
    });

    const form = reactive({
      toPhone: '01038050206',
      message: '[ShopJoy] SMS 연동 테스트 메시지입니다. [' + new Date().toISOString().replace('T',' ').slice(0,19) + ']',
    });

    const result = reactive({
      status:   '',
      response: null,
      error:    '',
      logs:     [],
    });

    const uiState = reactive({ loading: false });

    const PROVIDER_LABELS = {
      aligo:    'Aligo 알리고',
      coolsms:  'CoolSMS 쿨SMS',
      ncp:      'Naver Cloud Platform SMS',
      twilio:   'Twilio',
    };

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.sms.provider,app.sms.from',
        }, 'SMS 문자 발송 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => { const rows = list.filter(p => p.propKey === key && p.propValue); const pref = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0]; return pref?.propValue || ''; };
        cfg.provider = pickVal('app.sms.provider');
        cfg.from     = pickVal('app.sms.from');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addLog = (msg, type = 'info') => {
      result.logs.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.logs.length > 20) result.logs.pop();
    };

    const sendTestSms = async () => {
      if (!form.toPhone) { showToast('수신 번호를 입력하세요.', 'error'); return; }
      if (!form.message) { showToast('메시지를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ SMS 발송 중…';
      result.error    = '';
      result.response = null;
      addLog('SMS 발송 요청: ' + form.toPhone);
      try {
        const res = await boApi.post('/co/ext/sms-send/send', {
          toPhone: form.toPhone,
          message: form.message,
        }, coUtil.cofApiHdr('SMS 테스트', '발송'));
        result.response = res.data?.data || res.data;
        result.status   = '✅ SMS 발송 성공';
        addLog('✅ 발송 완료 → ' + form.toPhone, 'success');
        showToast('SMS 발송 완료', 'success');
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '알 수 없는 오류';
        result.status = '❌ SMS 발송 실패';
        addLog('❌ 실패: ' + result.error, 'error');
        showToast('SMS 발송 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sms-send') return sendTestSms();
    };

    const fnProviderLabel = (p) => PROVIDER_LABELS[p] || p || '(not configured)';

    return { cfg, form, result, uiState, handleBtnAction, fnProviderLabel };
  },

  template: `
<div>
  <div class="page-title">SMS 문자 발송 테스트</div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">테스트 SMS 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('sms-send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '📱 테스트 SMS 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:0 0 220px">
          <label class="form-label">수신 번호 <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="form.toPhone" placeholder="01012345678 (하이픈 제외)" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">메시지 (90자 이내 = SMS, 초과 = LMS)</label>
          <div style="display:flex;gap:4px;align-items:flex-start">
            <textarea class="form-control" v-model="form.message" rows="3" style="flex:1;font-size:12px;resize:vertical"></textarea>
            <span style="font-size:11px;color:#888;white-space:nowrap;padding-top:4px">{{ form.message.length }}자</span>
          </div>
        </div>
      </div>

      <!-- 결과 -->
      <div v-if="result.status" style="margin-top:8px;font-size:13px;font-weight:600">{{ result.status }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px;white-space:pre-wrap">{{ result.error }}</div>
      <div v-if="result.response" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        <pre style="margin:0">{{ JSON.stringify(result.response, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- 발송 이력 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">발송 이력 (최근 20건)</span></div>
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
    <div class="toolbar"><span class="list-title">Provider 별 설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>Aligo</b>: 알리고 API → sy_prop <code>app.sms.api-key</code> (userId), <code>app.sms.api-secret</code> (key)<br>
      <b>CoolSMS</b>: 솔라API → sy_prop <code>app.sms.api-key</code>, <code>app.sms.api-secret</code><br>
      <b>NCP</b>: Naver Cloud → Access Key/Secret → SMS 서비스 ID 필요<br>
      <b>Twilio</b>: AccountSID(api-key), AuthToken(api-secret)<br><br>
      <b>백엔드 API:</b> <code>POST /api/co/ext/sms-send/send</code> → <code>CoExtSmsSendController → CmSmsSendService.sendSms()</code>
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/all" title="application.yml — SMS 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.sms." default-prop-key-filter="app.sms." />
</div>`,
};
