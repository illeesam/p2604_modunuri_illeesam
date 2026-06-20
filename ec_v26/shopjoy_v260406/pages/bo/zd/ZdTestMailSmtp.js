/**
 * 개발도구 — SMTP 메일 발송 테스트
 */
window.ZdTestMailSmtp = {
  name: 'ZdTestMailSmtp',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      smtpHost:     '',
      smtpPort:     '',
      username:     '',
      password:     '',
      from:         '',
      fromNm:       '',
    });

    const form = reactive({
      toEmail:  'illeesam@gmail.com',
      toName:   '송성일',
      subject:  '[ShopJoy] SMTP 테스트 메일 [' + new Date().toISOString().replace('T',' ').slice(0,19) + ']',
      body:     'SMTP 연동이 정상적으로 작동하는지 확인하는 테스트 메일입니다.\n\n발송 시각: ' + new Date().toISOString().replace('T',' ').slice(0,19),
    });

    const result = reactive({
      status:   '',
      response: null,
      error:    '',
      logs:     [],
    });

    const uiState = reactive({ loading: false });


    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'site.email.smtp.host,site.email.smtp.port,app.mail.from,app.mail.from-nm',
        }, 'SMTP 메일 발송 테스트', '키 조회');
        const list = res?.data?.data || [];
        // 동일 propKey가 여러 프로파일 행으로 올 수 있음 → local/dev 우선, 없으면 값 있는 행
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.smtpHost = pickVal('site.email.smtp.host');
        cfg.smtpPort = pickVal('site.email.smtp.port');
        cfg.from     = pickVal('app.mail.from');
        cfg.fromNm   = pickVal('app.mail.from-nm');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      // application-local.yml 값은 서버 API 통해 가져옴
      try {
        const appRes = await boApi.get('/bo/sy/app-config/mail', coUtil.cofApiHdr('SMTP 테스트', '설정 조회'));
        const d = appRes?.data?.data || {};
        if (d.username) cfg.username = d.username;
      } catch (e) { /* 엔드포인트 없으면 무시 */ }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addLog = (msg, type = 'info') => {
      result.logs.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.logs.length > 20) result.logs.pop();
    };

    const sendTestMail = async () => {
      if (!form.toEmail) { showToast('수신자 이메일을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ 메일 발송 중…';
      result.error    = '';
      result.response = null;
      addLog('메일 발송 요청: ' + form.toEmail);
      try {
        const res = await boApi.post('/co/ext/mail-send/send', {
          toEmail:  form.toEmail,
          toName:   form.toName,
          subject:  form.subject,
          body:     form.body,
        }, coUtil.cofApiHdr('SMTP 테스트', '메일 발송'));
        result.response = res.data?.data || res.data;
        const ok = result.response?.success !== false;
        result.status   = ok ? 'success' : 'fail';
        addLog((ok ? '✅' : '⚠️') + ' 발송 ' + (ok ? '완료' : '실패(서버응답)') + ' → ' + form.toEmail, ok ? 'success' : 'error');
        showToast('테스트 메일 ' + (ok ? '발송 완료' : '발송 실패: ' + (result.response?.failReason || '')), ok ? 'success' : 'error', ok ? undefined : 0);
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '알 수 없는 오류';
        result.status = 'error';
        addLog('❌ 실패: ' + result.error, 'error');
        showToast('메일 발송 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'mail-send') return sendTestMail();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">SMTP 메일 발송 테스트</div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">테스트 메일 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('mail-send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '📧 테스트 메일 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">수신자 이메일 <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="form.toEmail" placeholder="test@example.com" type="email" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">수신자 이름</label>
          <input class="form-control" v-model="form.toName" placeholder="홍길동" />
        </div>
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <label class="form-label">제목</label>
        <input class="form-control" v-model="form.subject" />
      </div>
      <div class="form-group">
        <label class="form-label">본문 (plain text)</label>
        <textarea class="form-control" v-model="form.body" rows="5" style="font-size:12px;font-family:monospace;resize:vertical"></textarea>
      </div>

      <!-- 결과 -->
      <div v-if="uiState.loading" style="margin-top:12px;font-size:13px;font-weight:600;color:#6b7280;">⏳ 메일 발송 중…</div>
      <div v-if="result.response || result.error" style="margin-top:12px;border-radius:6px;overflow:hidden;border:1px solid;"
        :style="result.status==='success' ? 'border-color:#86efac;' : 'border-color:#fca5a5;'">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;font-size:13px;font-weight:600;"
          :style="result.status==='success' ? 'background:#f0fdf4;color:#15803d;' : 'background:#fff5f5;color:#b91c1c;'">
          <span>메일 발송 결과</span>
          <span style="font-size:18px;">{{ result.status==='success' ? '✅' : result.status==='fail' ? '⚠️' : '❌' }}</span>
        </div>
        <div v-if="result.error" style="padding:8px 12px;font-size:12px;color:#b91c1c;white-space:pre-wrap;background:#fff5f5;">{{ result.error }}</div>
        <div v-if="result.response" style="padding:8px 12px;font-size:12px;"
          :style="result.status==='success' ? 'background:#f0fdf4;' : 'background:#fff5f5;'">
          <pre style="margin:0;">{{ JSON.stringify(result.response, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- 발송 로그 -->
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
    <div class="toolbar"><span class="list-title">SMTP 설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>Gmail 기준:</b><br>
      Host: <code>smtp.gmail.com</code> / Port: <code>587</code> (TLS)<br>
      구글 계정 → 보안 → 2단계 인증 활성화 → 앱 비밀번호 생성 → application-local.yml 에 설정<br><br>
      <b>백엔드 API:</b> <code>POST /api/co/ext/mail-send/send</code> → <code>CoExtMailSendController → CmMailSendService.sendMail()</code>
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/mail" title="application.yml — 메일(SMTP) 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.mail.,spring.mail." default-prop-key-filter="app.mail." />
</div>`,
};
