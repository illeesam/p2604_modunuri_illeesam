/* ShopJoy - 외부 SDK 통합 헬퍼 (FO/BO 공용)
 *
 * 소셜 로그인 + 결제 + 지도를 한 모듈에 모아 키 의존성을 단일 진입점으로 관리.
 *
 * 의존:
 *   - 외부 CDN: Google GIS / Kakao SDK / Naver Login SDK / Toss Payments  (index.html, bo.html 의 <script>)
 *   - Pinia: window.useFoAppStore | window.useBoAppStore (clientId 등 키 보유)
 *
 * 제공 (window.coExtSdk):
 *   ── 소셜 로그인 ──
 *   - loginGoogle()  → Promise<{ provider, accessToken, idToken, profile }>
 *   - loginKakao()   → Promise<{ provider, accessToken, profile }>
 *   - loginNaver()   → Promise<{ provider, accessToken, profile }>
 *   ── 결제 ──
 *   - getTossPayments()  → Promise<TossPaymentsInstance>
 *   ── 지도 ──
 *   - loadKakaoMap()  → Promise<kakao.maps>
 *   - loadNaverMap()  → Promise<naver.maps>
 *
 * 모든 로그인은 팝업 방식. 인증/취소만 책임지며 서버 검증은 호출자가 수행.
 */
(function () {
  /* ──────────────────────────────────────────────────────────
   * 공통 유틸: AppStore 키 읽기 (FO/BO 자동 판별)
   * ────────────────────────────────────────────────────────── */
  const _getAppStore = () => {
    try { if (typeof window.useFoAppStore === 'function') return window.useFoAppStore(); } catch (_) {}
    try { if (typeof window.useBoAppStore === 'function') return window.useBoAppStore(); } catch (_) {}
    return null;
  };

  /* _key */
  const _key = (name) => {
    const s = _getAppStore();
    return s ? (s[name] || '') : '';
  };

  /* _loadScript */
  const _loadScript = (src) => new Promise((resolve, reject) => {
    const existing = Array.from(document.querySelectorAll('script')).find((s) => s.src === src);
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const sc = document.createElement('script');
    sc.src = src;
    sc.async = true;
    sc.onload = () => { sc.dataset.loaded = '1'; resolve(); };
    sc.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(sc);
  });

  /* ════════════════════════════════════════════════════════════
   * 1) 소셜 로그인
   * ════════════════════════════════════════════════════════════ */

  /* ── Google: GIS OAuth2 access-token popup ── */
  let _googleClient = null;

  /* _initGoogle */
  const _initGoogle = () => {
    if (_googleClient) return _googleClient;
    if (!window.google || !google.accounts || !google.accounts.oauth2) {
      throw new Error('Google Identity Services 가 로드되지 않았습니다.');
    }
    const clientId = _key('svGoogleClientId');
    if (!clientId) throw new Error('Google Client ID 가 설정되지 않았습니다.');

    _googleClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: () => {},  // 매 호출마다 동적 교체
    });
    return _googleClient;
  };

  /* loginGoogle */
  const loginGoogle = () => new Promise((resolve, reject) => {
    try {
      const client = _initGoogle();
      client.callback = async (resp) => {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        const accessToken = resp.access_token;
        try {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: 'Bearer ' + accessToken },
          });
          const profile = await r.json();
          resolve({ provider: 'google', accessToken, idToken: null, profile });
        } catch (e) {
          resolve({ provider: 'google', accessToken, idToken: null, profile: null });
        }
      };
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) { reject(e); }
  });

  /* ── Kakao: Kakao SDK login + 사용자 정보 요청 ── */
  const _initKakao = () => {
    if (!window.Kakao) throw new Error('Kakao SDK 가 로드되지 않았습니다.');
    const jsKey = _key('svKakaoJsKey');
    if (!jsKey) throw new Error('Kakao JavaScript Key 가 설정되지 않았습니다.');
    if (!Kakao.isInitialized()) Kakao.init(jsKey);
  };

  /* loginKakao */
  const loginKakao = () => new Promise((resolve, reject) => {
    try {
      _initKakao();
      Kakao.Auth.login({
        scope: 'profile_nickname,account_email',
        success: (authObj) => {
          Kakao.API.request({
            url: '/v2/user/me',
            success: (profile) => resolve({ provider: 'kakao', accessToken: authObj.access_token, profile }),
            fail:    ()         => resolve({ provider: 'kakao', accessToken: authObj.access_token, profile: null }),
          });
        },
        fail: (err) => reject(new Error(err?.error_description || '카카오 로그인 실패')),
      });
    } catch (e) { reject(e); }
  });

  /* ── Naver: naveridlogin SDK (popup 모드) ── */
  let _naverInstance = null;

  /* _initNaver */
  const _initNaver = () => {
    if (_naverInstance) return _naverInstance;
    if (!window.naver || !naver.LoginWithNaverId) {
      throw new Error('Naver Login SDK 가 로드되지 않았습니다.');
    }
    const clientId = _key('svNaverClientId');
    const callbackUrl = _key('svNaverCallbackUrl') || (window.location.origin + window.location.pathname);
    if (!clientId) throw new Error('Naver Client ID 가 설정되지 않았습니다.');

    _naverInstance = new naver.LoginWithNaverId({
      clientId,
      callbackUrl,
      isPopup: true,
      loginButton: { color: 'green', type: 3, height: 40 },
      callbackHandle: true,
    });
    _naverInstance.init();
    return _naverInstance;
  };

  /* loginNaver */
  const loginNaver = () => new Promise((resolve, reject) => {
    try {
      const inst = _initNaver();

      // SDK 가 자동 생성한 a 태그를 찾아 클릭 → 팝업 트리거. 없으면 직접 OAuth URL 팝업.
      const a = document.querySelector('#naverIdLogin a, #naverIdLogin_loginButton');
      if (a) {
        a.click();
      } else {
        const state = Math.random().toString(36).slice(2);
        const url = 'https://nid.naver.com/oauth2.0/authorize'
          + '?response_type=token'
          + '&client_id=' + encodeURIComponent(_key('svNaverClientId'))
          + '&redirect_uri=' + encodeURIComponent(_key('svNaverCallbackUrl') || (window.location.origin + window.location.pathname))
          + '&state=' + state;
        window.open(url, 'naverLogin', 'width=500,height=650');
      }

      const started = Date.now();
      const timer = setInterval(() => {
        try {
          inst.getLoginStatus((status) => {
            if (status) {
              clearInterval(timer);
              const u = inst.user || {};
              resolve({
                provider: 'naver',
                accessToken: inst.accessToken?.accessToken || inst.accessToken || '',
                profile: { id: u.id, email: u.email, name: u.name, nickname: u.nickname, profile_image: u.profile_image },
              });
            }
          });
        } catch (_) {}
        if (Date.now() - started > 60000) {
          clearInterval(timer);
          reject(new Error('네이버 로그인 시간이 초과되었습니다.'));
        }
      }, 500);
    } catch (e) { reject(e); }
  });

  /* ════════════════════════════════════════════════════════════
   * 2) 결제 - Toss Payments
   * ════════════════════════════════════════════════════════════ */
  let _tossInstance = null;

  /* getTossPayments */
  const getTossPayments = async () => {
    if (_tossInstance) return _tossInstance;
    if (!window.TossPayments) throw new Error('Toss Payments SDK 가 로드되지 않았습니다.');
    const clientKey = _key('svTossClientKey');
    if (!clientKey) throw new Error('Toss Client Key 가 설정되지 않았습니다.');
    _tossInstance = TossPayments(clientKey);
    return _tossInstance;
  };

  /* ════════════════════════════════════════════════════════════
   * 3) 지도 - Kakao Map / Naver Map (동적 로드)
   * ════════════════════════════════════════════════════════════ */
  let _kakaoMapPromise = null;

  /* loadKakaoMap */
  const loadKakaoMap = () => {
    if (_kakaoMapPromise) return _kakaoMapPromise;
    const appKey = _key('svKakaoMapJsKey');
    if (!appKey) return Promise.reject(new Error('Kakao Map JS Key 가 설정되지 않았습니다.'));
    const src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services,clusterer&appkey=' + encodeURIComponent(appKey);
    _kakaoMapPromise = _loadScript(src).then(() => new Promise((resolve) => {
      kakao.maps.load(() => resolve(kakao.maps));
    }));
    return _kakaoMapPromise;
  };

  let _naverMapPromise = null;

  /* loadNaverMap */
  const loadNaverMap = () => {
    if (_naverMapPromise) return _naverMapPromise;
    const clientId = _key('svNaverMapClientId');
    if (!clientId) return Promise.reject(new Error('Naver Map Client ID 가 설정되지 않았습니다.'));
    const src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' + encodeURIComponent(clientId);
    _naverMapPromise = _loadScript(src).then(() => naver.maps);
    return _naverMapPromise;
  };

  window.coExtSdk = {
    // 소셜 로그인
    loginGoogle, loginKakao, loginNaver,
    // 결제
    getTossPayments,
    // 지도
    loadKakaoMap, loadNaverMap,
  };
})();
