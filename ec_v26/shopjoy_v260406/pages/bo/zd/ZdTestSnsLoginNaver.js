/**
 * 개발도구 — 네이버 소셜 로그인 테스트
 */
window.ZdTestSnsLoginNaver = {
  name: 'ZdTestSnsLoginNaver',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      clientId:     '',
      clientSecret: '',
      callbackUrl:  window.location.origin + '/oauth/callback/naver',
    });

    const result = reactive({
      sdkStatus:   '',
      sdkUrl:      '',
      initDetail:  '',
      loginResult: null,
      profile:     null,
      error:       '',
      tokenRaw:    '',
    });

    const uiState = reactive({ sdkLoaded: false, loggedIn: false, loading: false });

    const STATE_KEY = 'naver_oauth_state_' + Math.random().toString(36).slice(2);

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.ext-sdk.naver-client-id,app.ext-sdk.naver-client-secret',
        }, '네이버 소셜 로그인 테스트', '키 조회');
        const list = res?.data?.data || [];
        // 동일 propKey가 여러 프로파일 행으로 올 수 있음 → local/dev 우선, 없으면 값 있는 행
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.clientId     = pickVal('app.ext-sdk.naver-client-id');
        cfg.clientSecret = pickVal('app.ext-sdk.naver-client-secret');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.naver?.LoginWithNaverId);
      uiState.sdkLoaded = ok;
      result.sdkUrl     = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
      result.sdkStatus  = ok ? '✅ 네이버 로그인 SDK 로드됨' : '❌ SDK 없음 — [SDK 로드] 클릭';
    };

    const loadSdk = () => {
      if (window.naver?.LoginWithNaverId) { checkSdk(); return; }
      const script = document.createElement('script');
      script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
      script.onload = () => { checkSdk(); showToast('네이버 로그인 SDK 로드 완료', 'success'); };
      script.onerror = () => { result.sdkStatus = '❌ SDK 로드 실패'; showToast('SDK 로드 실패', 'error', 0); };
      document.head.appendChild(script);
    };

    const initAndLogin = () => {
      if (!cfg.clientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      if (!window.naver?.LoginWithNaverId) { showToast('SDK 를 먼저 로드하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      result.profile  = null;
      result.tokenRaw = '';
      try {
        /*
         * 네이버 SDK는 login() 메서드가 없음.
         * getLoginURL()로 인증 URL을 구한 뒤 window.open()으로 직접 팝업을 연다.
         * loginButton 옵션 생략 — DOM 컨테이너가 없으면 .firstChild NPE 발생.
         */
        const naverLogin = new naver.LoginWithNaverId({
          clientId:    cfg.clientId,
          callbackUrl: cfg.callbackUrl,
          isPopup:     true,
        });
        naverLogin.init();
        const loginUrl = naverLogin.generateState
          ? (naverLogin.getLoginURL ? naverLogin.getLoginURL() : null)
          : null;

        /* getLoginURL 없는 구버전 SDK 대비: state를 직접 조립 */
        const state  = Math.random().toString(36).slice(2);
        const authUrl = 'https://nid.naver.com/oauth2.0/authorize'
          + '?response_type=token'
          + '&client_id='    + encodeURIComponent(cfg.clientId)
          + '&redirect_uri=' + encodeURIComponent(cfg.callbackUrl)
          + '&state='        + state;

        const popup = window.open(loginUrl || authUrl, 'naverLogin',
          'width=500,height=600,left=200,top=100,scrollbars=yes');
        if (!popup) {
          showToast('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.', 'error', 0);
          uiState.loading = false;
          return;
        }
        result.initDetail = 'Client ID: ' + cfg.clientId;
        uiState.loading = false;
        showToast('네이버 로그인 팝업 열림 — 완료 후 발급된 Access Token을 아래에 붙여넣고 [프로필 조회] 클릭', 'success');
      } catch (e) {
        uiState.loading = false;
        result.error = e.message || '로그인 초기화 오류';
        showToast(result.error, 'error', 0);
      }
    };

    const fetchProfile = async () => {
      if (!result.tokenRaw) { showToast('Access Token 을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      try {
        // 백엔드 프록시 경유 (CORS 문제로 프론트 직접 호출 불가)
        const res = await boApi.post('/co/ext/sns-naver/profile', {
          accessToken: result.tokenRaw,
        }, coUtil.cofApiHdr('네이버 로그인 테스트', '프로필 조회'));
        result.profile    = res.data?.data || res.data;
        uiState.loggedIn  = true;
        showToast('프로필 조회 성공', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message || '프로필 조회 실패';
        showToast(result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const saveKey = async () => {
      if (!cfg.clientId) { showToast('Client ID 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.naver-client-id',     propValue: cfg.clientId },
          { propKey: 'app.ext-sdk.naver-client-secret', propValue: cfg.clientSecret },
        ], coUtil.cofApiHdr('네이버 로그인 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    const logout = () => {
      result.profile   = null;
      result.tokenRaw  = '';
      result.loginResult = null;
      uiState.loggedIn = false;
      showToast('로그아웃 (로컬 상태 초기화)', 'success');
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-load')      return loadSdk();
      if (cmd === 'login')         return initAndLogin();
      if (cmd === 'profile-fetch') return fetchProfile();
      if (cmd === 'key-save')      return saveKey();
      if (cmd === 'logout')        return logout();
    };

    return { cfg, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">네이버 소셜 로그인 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Client ID <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="cfg.clientId" placeholder="sy_prop: app.ext-sdk.naver-client-id" style="font-family:monospace" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Client Secret</label>
          <input class="form-control" v-model="cfg.clientSecret" placeholder="sy_prop: app.ext-sdk.naver-client-secret" />
        </div>
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <label class="form-label">Callback URL (네이버 앱 등록 시 사용)</label>
        <input class="form-control" v-model="cfg.callbackUrl" style="font-family:monospace;font-size:12px" readonly />
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
        <button class="btn btn_apply" @click="handleBtnAction('sdk-load')">SDK 로드</button>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;margin-top:8px;line-height:2">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px;">{{ result.sdkUrl }}</span></div>
        <div>초기화 상태: <strong>{{ result.initDetail || (uiState.sdkLoaded ? '초기화 완료' : '미초기화') }}</strong></div>
      </div>
    </div>
  </div>

  <!-- 로그인 테스트 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">로그인 테스트</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_apply" :disabled="uiState.loading" @click="handleBtnAction('login')">🟢 네이버 로그인 팝업</button>
        <button v-if="uiState.loggedIn" class="btn btn_cancel" @click="handleBtnAction('logout')">로그아웃</button>
      </div>
    </div>
    <div style="padding:12px">
      <!-- 팝업 흐름 안내 + 직접 토큰 입력 -->
      <div style="font-size:12px;color:#666;margin-bottom:8px;padding:8px;background:#f0f4ff;border-radius:4px;line-height:1.6">
        ⓘ 네이버 로그인은 팝업 → 리다이렉트 구조입니다. 팝업 로그인 완료 후 발급된 <b>Access Token</b>을 아래에 붙여넣고 [프로필 조회] 하세요.
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Access Token (팝업 완료 후 붙여넣기)</label>
          <input class="form-control" v-model="result.tokenRaw" placeholder="AAAAxxxxx…" style="font-family:monospace;font-size:12px" />
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:1px">
          <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('profile-fetch')">
            {{ uiState.loading ? '⏳' : '프로필 조회' }}
          </button>
        </div>
      </div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c">{{ result.error }}</div>
    </div>
  </div>

  <!-- 프로필 결과 -->
  <div v-if="result.profile" class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">✅ 로그인 결과 — 프로필</span></div>
    <div style="padding:12px;display:flex;gap:16px;align-items:flex-start">
      <img v-if="result.profile.profile_image" :src="result.profile.profile_image"
        style="width:64px;height:64px;border-radius:50%;border:2px solid #03c75a;object-fit:cover" />
      <div style="font-size:13px;line-height:2">
        <div><b>닉네임</b>: {{ result.profile.nickname }}</div>
        <div><b>이름</b>: {{ result.profile.name }}</div>
        <div><b>이메일</b>: {{ result.profile.email }}</div>
        <div><b>ID</b>: <code>{{ result.profile.id }}</code></div>
        <div><b>성별</b>: {{ result.profile.gender }}</div>
        <div><b>생일</b>: {{ result.profile.birthday }}</div>
        <div><b>연령대</b>: {{ result.profile.age }}</div>
      </div>
    </div>
    <div style="padding:0 12px 12px">
      <details style="font-size:11px">
        <summary style="cursor:pointer;color:#888">전체 응답 JSON 보기</summary>
        <pre style="background:#f8f9fa;padding:8px;border-radius:4px;margin-top:6px;overflow-x:auto">{{ JSON.stringify(result.profile, null, 2) }}</pre>
      </details>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> <a href="https://developers.naver.com/apps" target="_blank">네이버 개발자센터</a> → 애플리케이션 등록<br>
      <b>2.</b> 네이버 로그인 사용 API 추가 → 권한: 이름/이메일/닉네임/프로필사진<br>
      <b>3.</b> 서비스 URL: <code>{{ cfg.callbackUrl.split('/oauth')[0] }}</code><br>
      <b>4.</b> Callback URL: <code>{{ cfg.callbackUrl }}</code><br>
      <b>5.</b> sy_prop <code>app.ext-sdk.naver-client-id</code> / <code>app.ext-sdk.naver-client-secret</code> 등록<br><br>
      <b>백엔드 API:</b> <code>POST /api/co/ext/sns-naver/profile</code> → 네이버 userinfo 프록시 호출
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/social" title="application.yml — 소셜 로그인 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.,app.auth.social." default-prop-key-filter="app.ext-sdk.naver-client" />
</div>`,
};
