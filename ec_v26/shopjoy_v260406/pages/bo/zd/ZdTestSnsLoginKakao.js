/**
 * 개발도구 — 카카오 소셜 로그인 테스트
 */
window.ZdTestSnsLoginKakao = {
  name: 'ZdTestSnsLoginKakao',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      kakaoJsKey:       '',
      naverClientId:    '',
      naverCallbackUrl: '',
    });

    const result = reactive({
      sdkStatus:   '',
      sdkUrl:      '',
      initDetail:  '',
      loginStatus: '',
      userInfo:    null,
      rawResponse: '',
      tokenRaw:    '',
      error:       '',
    });

    const uiState = reactive({
      loading:    false,
      sdkLoaded:  false,
      loggedIn:   false,
    });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      // sy_prop 에서 키 조회
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'app.ext-sdk.kakao-js-key,app.ext-sdk.naver-client-id,app.ext-sdk.naver-callback-url' }, '카카오 소셜 로그인 테스트', '키 조회');
        const list = res?.data?.data || [];
        // 동일 propKey가 여러 프로파일 행으로 올 수 있음 → local/dev 우선, 없으면 값 있는 행
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const preferred = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return preferred?.propValue || '';
        };
        cfg.kakaoJsKey       = pickVal('app.ext-sdk.kakao-js-key');
        cfg.naverClientId    = pickVal('app.ext-sdk.naver-client-id');
        cfg.naverCallbackUrl = pickVal('app.ext-sdk.naver-callback-url');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdkStatus();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdkStatus = () => {
      const kakaoOk = !!(window.Kakao && window.Kakao.isInitialized?.());
      uiState.sdkLoaded = kakaoOk;
      result.sdkUrl     = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      result.sdkStatus  = kakaoOk
        ? '✅ Kakao SDK 로드됨 (초기화 완료)'
        : (window.Kakao ? '⚠ Kakao SDK 로드됨 (미초기화)' : '❌ Kakao SDK 없음');
      result.initDetail = window.Kakao?.isInitialized()
        ? '앱키: ' + (cfg.kakaoJsKey || '(키 미입력)')
        : '';
    };

    const initKakaoSdk = () => {
      if (!cfg.kakaoJsKey) { showToast('JS Key 를 입력하세요.', 'error'); return; }
      try {
        if (!window.Kakao) throw new Error('Kakao SDK 스크립트가 로드되지 않았습니다.');
        if (!window.Kakao.isInitialized()) window.Kakao.init(cfg.kakaoJsKey);
        uiState.sdkLoaded = true;
        result.sdkStatus  = '✅ Kakao SDK 초기화 완료';
        result.initDetail = '앱키: ' + cfg.kakaoJsKey;
        showToast('Kakao SDK 초기화 완료', 'success');
      } catch (e) {
        result.initDetail = '❌ ' + e.message;
        result.error = e.message;
        showToast('초기화 실패: ' + e.message, 'error', 0);
      }
    };

    const testLogin = () => {
      if (!cfg.kakaoJsKey) { showToast('JS Key 를 입력하세요.', 'error'); return; }
      result.loginStatus = '';
      result.error       = '';
      result.userInfo    = null;

      /* Kakao.Auth.login() 팝업은 도메인 미등록/팝업차단 시 콜백 자체가 안 와서 무한 대기.
       * 대신 OAuth 인증 URL을 직접 구성해 새 탭으로 열고, 발급된 토큰을 수동 입력받는다. */
      const redirectUri = window.location.origin + '/oauth/callback/kakao';
      const authUrl = 'https://kauth.kakao.com/oauth/authorize'
        + '?client_id='    + encodeURIComponent(cfg.kakaoJsKey)
        + '&redirect_uri=' + encodeURIComponent(redirectUri)
        + '&response_type=token'
        + '&scope=profile_nickname,profile_image,account_email';

      window.open(authUrl, 'kakaoLogin', 'width=500,height=700,left=200,top=100');
      result.loginStatus = '⏳ 카카오 인증 탭 열림 — 로그인 완료 후 발급된 Access Token을 아래에 붙여넣으세요.';
      showToast('새 탭에서 로그인 후 Access Token을 복사해 붙여넣으세요.', 'success');
    };

    const fetchUserInfo = async () => {
      if (!result.tokenRaw) { showToast('Access Token 을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.error    = '';
      try {
        /* 백엔드 프록시 경유 (CORS) */
        const res = await boApi.post('/co/ext/sns-kakao/profile',
          { accessToken: result.tokenRaw },
          coUtil.cofApiHdr('카카오 로그인 테스트', '프로필 조회'));
        result.userInfo    = res.data?.data || res.data;
        result.loginStatus = '✅ 로그인 성공';
        uiState.loggedIn   = true;
        showToast('카카오 프로필 조회 성공', 'success');
      } catch (e) {
        result.error       = e.response?.data?.message || e.message || '프로필 조회 실패';
        result.loginStatus = '❌ 프로필 조회 실패';
        showToast(result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const testLogout = () => {
      if (!uiState.loggedIn) { showToast('로그인 상태가 아닙니다.', 'error'); return; }
      window.Kakao.Auth.logout(() => {
        result.loginStatus = '⊘ 로그아웃 완료';
        result.userInfo    = null;
        uiState.loggedIn   = false;
        showToast('카카오 로그아웃 완료', 'success');
      });
    };

    const saveKey = async () => {
      if (!cfg.kakaoJsKey) { showToast('JS Key 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.kakao-js-key', propValue: cfg.kakaoJsKey },
        ], coUtil.cofApiHdr('카카오 SDK 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-init')      return initKakaoSdk();
      if (cmd === 'login-test')    return testLogin();
      if (cmd === 'profile-fetch') return fetchUserInfo();
      if (cmd === 'logout-test')   return testLogout();
      if (cmd === 'key-save')      return saveKey();
    };

    /* ##### [05] 폼/그리드 컬럼 정의 #################################################### */

    const cfgFormColumns = [
      { key: 'kakaoJsKey', label: 'Kakao JS Key', type: 'text', hint: 'app.ext-sdk.kakao-js-key',
        mono: true, colSpan: 3, required: true, placeholder: 'sy_prop: app.ext-sdk.kakao-js-key' },
    ];

    const tokenFormColumns = [
      { key: 'tokenRaw', label: 'Access Token (인증 완료 후 붙여넣기)', type: 'slot', name: 'tokenRawSlot', colSpan: 3 },
    ];

    const userInfoGridColumns = [
      { key: '_label', label: '항목', cellStyle: 'color:#555;width:120px' },
      { key: '_value', label: '값',   type: 'slot', name: 'userInfoValue' },
    ];

    const cfUserInfoRows = () => result.userInfo ? [
      { _label: 'ID',          _value: result.userInfo.id,                              _key: 'id' },
      { _label: '닉네임',      _value: result.userInfo.properties?.nickname,            _key: 'nickname' },
      { _label: '이메일',      _value: result.userInfo.kakao_account?.email,            _key: 'email' },
      { _label: '프로필 이미지', _value: result.userInfo.properties?.profile_image,     _key: 'profile_image' },
    ] : [];

    return { cfg, result, uiState, handleBtnAction, cfgFormColumns, tokenFormColumns, userInfoGridColumns, cfUserInfoRows };
  },

  template: `
<div>
  <div class="page-title">카카오 소셜 로그인 테스트</div>

  <!-- 설정 정보 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 / 키 확인</span></div>
    <div style="padding:12px">
      <bo-form-area :columns="cfgFormColumns" :form="cfg" :errors="{}" :cols="3" :show-actions="false" :readonly="false" />
      <div style="display:flex;gap:6px;margin-top:8px;margin-bottom:8px">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
        <button class="btn btn_apply" @click="handleBtnAction('sdk-init')">SDK 초기화</button>
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
      <span class="list-title">로그인 / 로그아웃 테스트</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_confirm" @click="handleBtnAction('login-test')">🟡 카카오 인증 열기</button>
        <button class="btn btn_cancel" :disabled="!uiState.loggedIn" @click="handleBtnAction('logout-test')">로그아웃</button>
      </div>
    </div>
    <div style="padding:12px">
      <div style="font-size:12px;color:#666;margin-bottom:10px;padding:8px;background:#fffbeb;border-radius:4px;line-height:1.6">
        ⓘ 카카오 OAuth 인증 창이 열립니다. 로그인 완료 후 리다이렉트 URL의 <b>#access_token=…</b> 값을 복사해 아래에 붙여넣고 [프로필 조회] 하세요.
      </div>
      <bo-form-area :columns="tokenFormColumns" :form="result" :errors="{}" :cols="3" :show-actions="false" :readonly="false">
        <template #tokenRawSlot>
          <div style="display:flex;gap:8px;align-items:flex-end">
            <input class="form-control" v-model="result.tokenRaw" placeholder="예: AAABxxxxx…" style="font-family:monospace;font-size:12px;flex:1" />
            <button class="btn btn_search" :disabled="uiState.loading" @click="handleBtnAction('profile-fetch')">
              {{ uiState.loading ? '⏳' : '프로필 조회' }}
            </button>
          </div>
        </template>
      </bo-form-area>
      <div v-if="result.loginStatus" style="margin-top:8px;margin-bottom:8px;font-size:13px;font-weight:600">{{ result.loginStatus }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;white-space:pre-wrap;margin-bottom:8px">{{ result.error }}</div>
      <!-- 사용자 정보 -->
      <div v-if="result.userInfo" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 사용자 정보</div>
        <bo-grid :columns="userInfoGridColumns" :rows="cfUserInfoRows()" :show-row-num="false">
          <template #userInfoValue="{ row }">
            <span v-if="row._key === 'profile_image'">
              <img v-if="row._value" :src="row._value" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;margin-right:6px" />
              <span v-if="!row._value">(없음)</span>
            </span>
            <span v-else>{{ row._value }}</span>
          </template>
        </bo-grid>
      </div>
    </div>
  </div>

  <!-- 연동 흐름 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">연동 흐름</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> sy_prop <code>app.ext-sdk.kakao-js-key</code> 에 카카오 앱 JS 키 등록<br>
      <b>2.</b> 카카오 개발자 콘솔 → 앱 → 플랫폼 → Web 사이트 도메인 등록 (<code>http://127.0.0.1:5501</code>)<br>
      <b>3.</b> 동의 항목 → profile, account_email 활성화<br>
      <b>4.</b> SDK 초기화 → 로그인 팝업 → 사용자 정보 확인<br>
      <b>5.</b> 실제 로그인은 <code>POST /api/co/fo-auth/social-login</code> (백엔드 토큰 검증) 로 연결
    </div>
  </div>

  <bo-zd-yml-grid endpoint="/bo/sy/app-config/social" title="application.yml — 소셜 로그인 설정" />
  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.,app.auth.social." default-prop-key-filter="app.ext-sdk.kakao" />
</div>`,
};
