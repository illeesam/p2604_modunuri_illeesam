/**
 * 개발도구 — 구글 소셜 로그인 테스트
 */
window.ZdTestSnsLoginGoogle = {
  name: 'ZdTestSnsLoginGoogle',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({ googleClientId: '' });

    const result = reactive({
      sdkStatus:   '',
      sdkUrl:      '',
      initDetail:  '',
      loginStatus: '',
      userInfo:    null,
      rawToken:    '',
      error:       '',
    });

    const uiState = reactive({ loading: false, sdkLoaded: false });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'app.ext-sdk.google-client-id' }, '구글 소셜 로그인 테스트', '키 조회');
        const list = res?.data?.data || [];
        // 동일 propKey가 여러 프로파일 행으로 올 수 있음 → local/dev 우선, 없으면 값 있는 행
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.googleClientId = pickVal('app.ext-sdk.google-client-id');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.google?.accounts?.id);
      uiState.sdkLoaded = ok;
      result.sdkUrl     = 'https://accounts.google.com/gsi/client';
      result.sdkStatus  = ok ? '✅ Google Identity Services SDK 로드됨' : '❌ Google Identity Services SDK 없음 (GSI 스크립트 미로드)';
    };

    const initGsi = () => {
      if (!cfg.googleClientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      if (!window.google?.accounts?.id) { showToast('Google GSI 스크립트가 로드되지 않았습니다.', 'error', 0); return; }
      try {
        window.google.accounts.id.initialize({
          client_id: cfg.googleClientId,
          callback:  handleCredentialResponse,
          auto_select: false,
        });
        uiState.sdkLoaded = true;
        result.sdkStatus  = '✅ Google GSI 초기화 완료';
        result.initDetail = 'Client ID: ' + cfg.googleClientId;
        showToast('Google GSI 초기화 완료', 'success');
      } catch (e) {
        result.initDetail = '❌ ' + e.message;
        result.error = e.message;
        showToast('초기화 실패: ' + e.message, 'error', 0);
      }
    };

    const handleCredentialResponse = (response) => {
      uiState.loading = false;
      if (!response.credential) {
        result.error       = '자격 증명이 없습니다.';
        result.loginStatus = '❌ 로그인 실패';
        return;
      }
      // JWT payload 디코딩 (서명 검증 제외 — 테스트 목적)
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        result.userInfo    = payload;
        result.rawToken    = response.credential;
        result.loginStatus = '✅ 로그인 성공 (ID Token 수신)';
        showToast('구글 로그인 성공', 'success');
      } catch (e) {
        result.error       = 'JWT 디코딩 실패: ' + e.message;
        result.loginStatus = '⚠ 토큰 수신 성공 / 파싱 실패';
      }
    };

    const testLogin = () => {
      if (!uiState.sdkLoaded) { showToast('SDK 초기화 먼저 하세요.', 'error'); return; }
      uiState.loading    = true;
      result.loginStatus = '⏳ Google 로그인 팝업 요청 중…';
      result.error       = '';
      result.userInfo    = null;
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // One Tap 차단 시 OAuth 팝업 fallback
            const client = window.google.accounts.oauth2.initTokenClient({
              client_id: cfg.googleClientId,
              scope:     'openid email profile',
              callback:  (tokenResponse) => {
                if (tokenResponse.error) {
                  result.error       = tokenResponse.error;
                  result.loginStatus = '❌ OAuth 팝업 실패';
                  uiState.loading    = false;
                  return;
                }
                // userinfo 엔드포인트 호출
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: 'Bearer ' + tokenResponse.access_token },
                }).then(r => r.json()).then(info => {
                  result.userInfo    = info;
                  result.rawToken    = JSON.stringify(tokenResponse, null, 2);
                  result.loginStatus = '✅ 로그인 성공 (OAuth)';
                  uiState.loading    = false;
                  showToast('구글 로그인 성공', 'success');
                }).catch(e => {
                  result.error    = e.message;
                  uiState.loading = false;
                });
              },
            });
            client.requestAccessToken({ prompt: 'select_account' });
          }
        });
      } catch (e) {
        result.error    = e.message;
        uiState.loading = false;
        showToast('로그인 팝업 실패: ' + e.message, 'error', 0);
      }
    };

    const saveKey = async () => {
      if (!cfg.googleClientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.google-client-id', propValue: cfg.googleClientId },
        ], coUtil.cofApiHdr('구글 SDK 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-init')   return initGsi();
      if (cmd === 'login-test') return testLogin();
      if (cmd === 'key-save')   return saveKey();
    };

    /* ##### [05] 폼/그리드 컬럼 정의 #################################################### */

    const cfgFormColumns = [
      { key: 'googleClientId', label: 'Google Client ID', type: 'text', hint: 'app.ext-sdk.google-client-id',
        mono: true, colSpan: 3, required: true, placeholder: 'sy_prop: app.ext-sdk.google-client-id' },
    ];

    const userInfoGridColumns = [
      { key: '_label', label: '항목', cellStyle: 'color:#555;width:120px' },
      { key: '_value', label: '값',   type: 'slot', name: 'userInfoValue' },
    ];

    const cfUserInfoRows = () => result.userInfo ? [
      { _label: 'Sub (ID)',      _value: result.userInfo.sub,            _key: 'sub' },
      { _label: '이름',          _value: result.userInfo.name,           _key: 'name' },
      { _label: '이메일',        _value: result.userInfo.email,          _key: 'email' },
      { _label: '이메일 인증',   _value: result.userInfo.email_verified, _key: 'email_verified' },
      { _label: '프로필 이미지', _value: result.userInfo.picture,        _key: 'picture' },
    ] : [];

    return { cfg, result, uiState, handleBtnAction, cfgFormColumns, userInfoGridColumns, cfUserInfoRows };
  },

  template: `
<div>
  <div class="page-title">구글 소셜 로그인 테스트</div>

  <!-- 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 / 키 확인</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="display:flex;gap:6px;margin-top:8px;margin-bottom:8px">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
        <button class="btn btn_apply" @click="handleBtnAction('sdk-init')">GSI 초기화</button>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;line-height:2">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px;">{{ result.sdkUrl }}</span></div>
        <div>초기화 상태: <strong>{{ result.initDetail || (uiState.sdkLoaded ? '초기화 완료' : '미초기화') }}</strong></div>
      </div>
    </div>
  </div>

  <!-- 로그인 테스트 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">로그인 테스트</span>
      <div style="margin-left:auto">
        <button class="btn btn_confirm" :disabled="uiState.loading || !uiState.sdkLoaded" @click="handleBtnAction('login-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '구글 로그인 팝업' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.loginStatus" style="margin-bottom:8px;font-size:13px;font-weight:600">{{ result.loginStatus }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;white-space:pre-wrap;margin-bottom:8px">{{ result.error }}</div>
      <div v-if="result.userInfo" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 사용자 정보 (JWT Payload)</div>
        <bo-grid :columns="userInfoGridColumns" :rows="cfUserInfoRows()" :show-row-num="false">
          <template #userInfoValue="{ row }">
            <span v-if="row._key === 'email_verified'">{{ row._value ? '✅ 인증됨' : '❌ 미인증' }}</span>
            <span v-else-if="row._key === 'picture'">
              <img v-if="row._value" :src="row._value" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;margin-right:6px" />
              <span v-if="!row._value">(없음)</span>
            </span>
            <span v-else>{{ row._value }}</span>
          </template>
        </bo-grid>
      </div>
      <div v-if="result.rawToken" style="margin-top:8px">
        <div style="font-size:11px;color:#888;margin-bottom:4px">Raw Token</div>
        <pre style="background:#1e1e1e;color:#d4d4d4;padding:10px;border-radius:6px;font-size:11px;overflow:auto;max-height:120px;word-break:break-all;white-space:pre-wrap">{{ result.rawToken }}</pre>
      </div>
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/social" title="application.yml — 소셜 로그인 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.,app.auth.social." default-prop-key-filter="app.ext-sdk.google-client" />

  <!-- 흐름 안내 -->
  <div class="card">
    <div class="toolbar"><span class="list-title">연동 흐름</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Google Cloud Console → OAuth 2.0 클라이언트 ID 발급 (Web 유형)<br>
      <b>2.</b> 승인된 JavaScript 원본에 <code>http://127.0.0.1:5501</code>, <code>http://localhost:3000</code> 추가<br>
      <b>3.</b> sy_prop <code>app.ext-sdk.google-client-id</code> 에 Client ID 등록<br>
      <b>4.</b> 로그인 팝업 → ID Token(JWT) 수신 → 백엔드 <code>POST /api/co/fo-auth/social-login</code> 로 전달<br>
      <b>5.</b> 백엔드: Google tokeninfo 엔드포인트로 토큰 검증 후 JWT 발급
    </div>
  </div>
</div>`,
};
