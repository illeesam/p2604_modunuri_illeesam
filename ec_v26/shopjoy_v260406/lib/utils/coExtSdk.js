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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  🔑 키 발급처 → 저장 위치 → 코드 사용처  (어디서 얻어 어디에 넣는가)
 * ═══════════════════════════════════════════════════════════════════════════
 *  모든 외부 키는 _key('svXxx') 로 AppStore(Pinia)에서 읽는다.
 *  AppStore 값은 로그인 시 서버 init data 로 주입된다:
 *    coApiSvc.cmBoAppStore.getInitData() → 응답 data.syApp.{xxx} → boAppStore.saSetApp()
 *    → svXxx 로 저장 (FO 는 foAppStore 동일 구조)
 *  ※ BO 로그인 화면은 로그인 *전* 이라 syApp 이 아직 없음 → svXxx 가 '' → "키 미설정" 안내가 정상.
 *  ※ 데모/로컬에서 로그인 전에도 창을 띄우려면 boAppStore/foAppStore state 의 svXxx 기본값에 실키를 시드.
 *
 *  ┌─────────────┬──────────────────────┬──────────────────────────────────────────────┐
 *  │ 용도        │ AppStore 키 (코드)   │ 발급처 (외부 콘솔)                            │
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 구글 로그인 │ svGoogleClientId     │ console.cloud.google.com → API 및 서비스 →    │
 *  │             │ (syApp.googleClientId)│  사용자 인증 정보 → OAuth 2.0 클라이언트 ID    │
 *  │             │                      │  (웹) → "클라이언트 ID". 승인된 JS 원본에      │
 *  │             │                      │  http://127.0.0.1:5501 등록.                  │
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 카카오 로그인│ svKakaoJsKey         │ developers.kakao.com → 내 애플리케이션 →      │
 *  │             │ (syApp.kakaoJsKey)   │  앱 설정 → 앱 키 → "JavaScript 키".            │
 *  │             │                      │  플랫폼 → Web 에 127.0.0.1:5501 도메인 등록 +  │
 *  │             │                      │  카카오 로그인 활성화 ON + Redirect URI 등록.  │
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 네이버 로그인│ svNaverClientId      │ developers.naver.com → Application →           │
 *  │             │ svNaverCallbackUrl   │  애플리케이션 등록 → "Client ID".              │
 *  │             │ (syApp.naverClientId,│  서비스 URL·Callback URL 에 127.0.0.1:5501 등록.│
 *  │             │  syApp.naverCallbackUrl)│ Callback 미설정 시 현재 origin+pathname 사용.│
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 토스 결제   │ svTossClientKey      │ developers.tosspayments.com → 내 개발정보 →   │
 *  │             │ (syApp.tossClientKey)│  "클라이언트 키"(결제위젯 연동 키, gck/ck).    │
 *  │             │                      │  미설정 시 toss.TEST_CLIENT_KEY 로 폴백(테스트).│
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 카카오 지도 │ svKakaoMapJsKey      │ 카카오 디벨로퍼스의 JavaScript 키(로그인과 별개 │
 *  │             │ (syApp.kakaoMapJsKey)│  앱 가능). 플랫폼 Web 도메인 등록 필요.        │
 *  ├─────────────┼──────────────────────┼──────────────────────────────────────────────┤
 *  │ 네이버 지도 │ svNaverMapClientId   │ console.ncloud.com → Maps → Application 등록 → │
 *  │             │ (syApp.naverMapClientId)│ "Client ID"(ncpClientId).                    │
 *  └─────────────┴──────────────────────┴──────────────────────────────────────────────┘
 *
 *  넣는 방법 (택1):
 *   A) 운영/정식: 관리자 → 사이트 설정(AppStore)에 키 저장 → 서버 init data 로 자동 주입.
 *   B) 데모/로컬: lib/stores/{bo,fo}/{bo,fo}AppStore.js 의 state svXxx 기본값에 실키를 직접 시드.
 *      (saSetApp 이 서버 빈 값으로 덮어쓰지 않도록 'appData[k] || this.svXxx' 보정 권장)
 *  ※ 발급처 표준 URL/엔드포인트는 lib/env/{fo,bo}EnvConsts.js 에 상수로 관리.
 * ═══════════════════════════════════════════════════════════════════════════
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

  /* _env — env 상수 안전 접근 (path: 'toss.SDK_V2_URL'). 미로드 시 fallback.
   * coExtSdk 는 공통(co) 레이어이므로 FO(foEnvConsts)/BO(boEnvConsts) 중 로드된 쪽을 사용 */
  const _envConsts = () => window.foEnvConsts || window.boEnvConsts;
  const _env = (path, fallback) => {
    try {
      let v = _envConsts();
      for (const k of path.split('.')) { v = v && v[k]; }
      return (v != null) ? v : fallback;
    } catch (_) { return fallback; }
  };

  /* ──────────────────────────────────────────────────────────
   * 개발용 디버그 훅 — 소셜/결제 창을 띄우기 직전 URL·파라미터를 노출.
   *   화면에서 coExtSdk.setDebugHook((label, info) => showToast(...)) 로 등록.
   *   훅 미등록 시 console.log 폴백. 운영에서 끄려면 setDebugHook(null).
   * ────────────────────────────────────────────────────────── */
  let _debugHook = null;
  const setDebugHook = (fn) => { _debugHook = (typeof fn === 'function') ? fn : null; };
  const _debug = (label, info) => {
    try {
      if (_debugHook) _debugHook(label, info);
      else console.log('[coExtSdk:debug]', label, info);
    } catch (_) {}
  };
  /* _fmtParams — 파라미터 객체를 한 줄 문자열로 (긴 값/시크릿은 잘라서 표시) */
  const _fmtParams = (obj) => {
    try {
      return Object.entries(obj || {})
        .map(([k, v]) => {
          let s = (v == null) ? '' : String(v);
          if (s.length > 80) s = s.slice(0, 77) + '…';
          return `${k}=${s}`;
        })
        .join('\n');
    } catch (_) { return ''; }
  };

  /* _errMsg — "원인 — 해결방법" 형식의 표준 에러 메시지 생성.
   * 호출자(화면)는 catch 후 showToast(e.message, 'error') 로 그대로 노출한다.
   * SDK 창(팝업/위젯)이 안 뜨는 대표 원인별 안내를 한 곳에서 관리. */
  const _errMsg = (reason, howto) => `${reason}\n→ 해결: ${howto}`;

  /* _isPopupBlocked — window.open 결과가 차단되었는지 판정 */
  const _isPopupBlocked = (win) => (!win || win.closed || typeof win.closed === 'undefined');

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
      throw new Error(_errMsg('Google 로그인 창을 열 수 없습니다 — Google Identity Services(GIS) 스크립트가 로드되지 않았습니다.',
        'index.html/bo.html 의 accounts.google.com/gsi/client 스크립트 로드와 네트워크/광고차단 확장을 확인하세요.'));
    }
    const clientId = _key('svGoogleClientId');
    if (!clientId) throw new Error(_errMsg('Google 로그인 창을 열 수 없습니다 — Google Client ID(svGoogleClientId) 가 설정되지 않았습니다.',
      'console.cloud.google.com → API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID(웹) 의 "클라이언트 ID" 를 발급받아 '
      + '사이트 설정(AppStore)의 svGoogleClientId(syApp.googleClientId) 에 등록하세요. '
      + '승인된 JavaScript 원본에 현재 도메인(예: http://127.0.0.1:5501)을 추가해야 합니다. '
      + '(BO 는 로그인 전이면 키가 없을 수 있습니다)'));

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
          const r = await fetch(_env('oauth.GOOGLE_USERINFO_URL', 'https://www.googleapis.com/oauth2/v3/userinfo'), {
            headers: { Authorization: 'Bearer ' + accessToken },
          });
          const profile = await r.json();
          resolve({ provider: 'google', accessToken, idToken: null, profile });
        } catch (e) {
          resolve({ provider: 'google', accessToken, idToken: null, profile: null });
        }
      };
      /* 팝업이 안 뜨거나 닫힘 → error_callback 으로 사유 전달 (GIS 지원) */
      client.error_callback = (err) => {
        const t = err && err.type;
        if (t === 'popup_failed_to_open') {
          reject(new Error(_errMsg('Google 로그인 창이 열리지 않았습니다 — 브라우저 팝업이 차단되었습니다.',
            '주소창 우측 팝업 차단 아이콘에서 이 사이트의 팝업을 허용한 뒤 다시 시도하세요.')));
        } else if (t === 'popup_closed') {
          reject(new Error('Google 로그인이 취소되었습니다 (창을 닫음).'));
        } else {
          reject(new Error(_errMsg('Google 로그인 창을 여는 중 오류가 발생했습니다 (' + (t || 'unknown') + ').',
            '팝업 차단 해제·네트워크 상태를 확인하고 다시 시도하세요.')));
        }
      };
      _debug('Google 로그인 창', {
        sdk: 'Google Identity Services (oauth2 token popup)',
        client_id: _key('svGoogleClientId'),
        scope: 'openid email profile',
        prompt: 'consent',
        userinfo_url: _env('oauth.GOOGLE_USERINFO_URL', 'https://www.googleapis.com/oauth2/v3/userinfo'),
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) { reject(e); }
  });

  /* ── Kakao: Kakao SDK login + 사용자 정보 요청 ── */
  const _initKakao = () => {
    if (!window.Kakao) throw new Error(_errMsg('카카오 로그인 창을 열 수 없습니다 — Kakao SDK 가 로드되지 않았습니다.',
      'index.html/bo.html 의 kakao SDK(t1.kakaocdn.net) 스크립트 로드와 네트워크/광고차단 확장을 확인하세요.'));
    const jsKey = _key('svKakaoJsKey');
    if (!jsKey) throw new Error(_errMsg('카카오 로그인 창을 열 수 없습니다 — Kakao JavaScript Key(svKakaoJsKey) 가 설정되지 않았습니다.',
      'developers.kakao.com → 내 애플리케이션 → 앱 설정 → 앱 키 → "JavaScript 키" 를 발급받아 '
      + '사이트 설정(AppStore)의 svKakaoJsKey(syApp.kakaoJsKey) 에 등록하세요. '
      + '카카오 디벨로퍼스에서 [카카오 로그인] 활성화 ON + 플랫폼(Web)에 현재 도메인(예: http://127.0.0.1:5501) 등록 + Redirect URI 설정이 필요합니다. '
      + '(BO 는 로그인 전이면 서버 init data 로 키가 주입되기 전이라 비어 있을 수 있습니다)'));
    try {
      if (typeof Kakao.isInitialized === 'function' ? !Kakao.isInitialized() : true) Kakao.init(jsKey);
    } catch (e) {
      throw new Error(_errMsg('카카오 로그인 창을 열 수 없습니다 — Kakao SDK 초기화에 실패했습니다 (' + (e && e.message || '키 오류') + ').',
        'svKakaoJsKey 가 유효한 JavaScript 키인지, 카카오 디벨로퍼스에 현재 도메인이 등록됐는지 확인하세요.'));
    }
    /* Kakao.Auth.login 함수 존재 확인 — 잘못된 키/초기화 시 Auth 모듈이 안 붙어 "is not a function" 발생 */
    if (!Kakao.Auth || typeof Kakao.Auth.login !== 'function') {
      throw new Error(_errMsg('카카오 로그인 창을 열 수 없습니다 — Kakao SDK 가 정상 초기화되지 않았습니다 (Kakao.Auth.login 없음).',
        'svKakaoJsKey(JavaScript 키)가 유효한지와 카카오 디벨로퍼스 앱에 현재 도메인(예: 127.0.0.1:5501)이 플랫폼 등록됐는지 확인하세요. 키 미설정 시 로그인 후 서버 init data 로 주입됩니다.'));
    }
  };

  /* loginKakao */
  const loginKakao = () => new Promise((resolve, reject) => {
    try {
      _initKakao();
      _debug('카카오 로그인 창', {
        sdk: 'Kakao JS SDK (Kakao.Auth.login)',
        jsKey: _key('svKakaoJsKey'),
        scope: 'profile_nickname,account_email',
        userinfo_url: _env('oauth.KAKAO_USERINFO_URL', 'https://kapi.kakao.com/v2/user/me'),
      });
      Kakao.Auth.login({
        scope: 'profile_nickname,account_email',
        success: (authObj) => {
          /* Kakao.API.request 의 url 은 SDK 가 kapi.kakao.com 을 자동 prefix 하므로 경로만 전달.
           * 상수(oauth.KAKAO_USERINFO_URL)는 전체 URL 보관 → pathname 만 추출해 단일 소스 유지 */
          let kakaoMePath = '/v2/user/me';
          try { kakaoMePath = new URL(_env('oauth.KAKAO_USERINFO_URL', 'https://kapi.kakao.com/v2/user/me')).pathname; } catch (_) {}
          Kakao.API.request({
            url: kakaoMePath,
            success: (profile) => resolve({ provider: 'kakao', accessToken: authObj.access_token, profile }),
            fail:    ()         => resolve({ provider: 'kakao', accessToken: authObj.access_token, profile: null }),
          });
        },
        fail: (err) => {
          const msg = (err && (err.error_description || err.error)) || '';
          /* 팝업 차단/창 미오픈 추정 (Kakao 는 표준 코드가 일정치 않아 메시지 키워드로 판정) */
          if (/popup|차단|blocked|window/i.test(msg)) {
            reject(new Error(_errMsg('카카오 로그인 창이 열리지 않았습니다 — 브라우저 팝업이 차단되었습니다.',
              '주소창 우측 팝업 차단 아이콘에서 이 사이트의 팝업을 허용한 뒤 다시 시도하세요.')));
          } else {
            reject(new Error(msg || '카카오 로그인이 취소되었거나 실패했습니다.'));
          }
        },
      });
    } catch (e) { reject(e); }
  });

  /* ── Naver: naveridlogin SDK (popup 모드) ── */
  let _naverInstance = null;

  /* _initNaver */
  const _initNaver = () => {
    if (_naverInstance) return _naverInstance;
    if (!window.naver || !naver.LoginWithNaverId) {
      throw new Error(_errMsg('네이버 로그인 창을 열 수 없습니다 — Naver Login SDK 가 로드되지 않았습니다.',
        'index.html/bo.html 의 네이버 로그인 SDK 스크립트 로드와 네트워크/광고차단 확장을 확인하세요.'));
    }
    const clientId = _key('svNaverClientId');
    const callbackUrl = _key('svNaverCallbackUrl') || (window.location.origin + window.location.pathname);
    if (!clientId) throw new Error(_errMsg('네이버 로그인 창을 열 수 없습니다 — Naver Client ID(svNaverClientId) 가 설정되지 않았습니다.',
      'developers.naver.com → Application → 애플리케이션 등록 후 "Client ID" 를 발급받아 '
      + '사이트 설정(AppStore)의 svNaverClientId(syApp.naverClientId) 에 등록하세요. '
      + '서비스 URL·Callback URL 에 현재 도메인(예: http://127.0.0.1:5501)을 등록해야 하며, '
      + 'Callback 을 따로 지정하려면 svNaverCallbackUrl(syApp.naverCallbackUrl) 도 설정하세요(미설정 시 현재 URL 사용). '
      + '(BO 는 로그인 전이면 키가 없을 수 있습니다)'));

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
      const _naverAuthBase = _env('oauth.NAVER_AUTHORIZE_URL', 'https://nid.naver.com/oauth2.0/authorize');
      const _naverRedirect = _key('svNaverCallbackUrl') || (window.location.origin + window.location.pathname);

      // SDK 가 자동 생성한 a 태그를 찾아 클릭 → 팝업 트리거. 없으면 직접 OAuth URL 팝업.
      let popup = null;   // window.open 경로일 때만 핸들 보유 (닫힘 감지용)
      const a = document.querySelector('#naverIdLogin a, #naverIdLogin_loginButton');
      if (a) {
        _debug('네이버 로그인 창', {
          sdk: 'Naver Login SDK (a-tag click popup)',
          authorize_url: _naverAuthBase,
          client_id: _key('svNaverClientId'),
          redirect_uri: _naverRedirect,
          response_type: 'token',
        });
        a.click();
      } else {
        const state = Math.random().toString(36).slice(2);
        const url = _naverAuthBase
          + '?response_type=token'
          + '&client_id=' + encodeURIComponent(_key('svNaverClientId'))
          + '&redirect_uri=' + encodeURIComponent(_naverRedirect)
          + '&state=' + state;
        _debug('네이버 로그인 창', { sdk: 'Naver OAuth (window.open)', url });
        popup = window.open(url, 'naverLogin', 'width=500,height=650');
        if (_isPopupBlocked(popup)) {
          reject(new Error(_errMsg('네이버 로그인 창이 열리지 않았습니다 — 브라우저 팝업이 차단되었습니다.',
            '주소창 우측 팝업 차단 아이콘에서 이 사이트의 팝업을 허용한 뒤 다시 시도하세요.')));
          return;
        }
      }

      const started = Date.now();
      let closedAt = 0;   // 팝업 닫힘 최초 감지 시각 (성공 직후 자동 닫힘 레이스 대비 2초 유예)
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
        /* 사용자가 팝업을 직접 닫음 → 2초 내 로그인 상태가 안 잡히면 취소 처리 (60초 대기 방지) */
        if (popup && popup.closed) {
          if (!closedAt) closedAt = Date.now();
          else if (Date.now() - closedAt > 2000) {
            clearInterval(timer);
            reject(new Error('네이버 로그인이 취소되었습니다 (창을 닫음).'));
            return;
          }
        }
        if (Date.now() - started > 60000) {
          clearInterval(timer);
          reject(new Error('네이버 로그인 시간이 초과되었습니다.\n→ 해결: 개발자센터의 Callback URL 이 현재 주소와 일치하는지 확인하세요.'));
        }
      }, 500);
    } catch (e) { reject(e); }
  });

  /* ════════════════════════════════════════════════════════════
   * 2) 결제 - Toss Payments
   * ════════════════════════════════════════════════════════════ */
  let _tossInstance = null;

  /* 토스 공식 문서용 테스트 클라이언트 키 (결제위젯). svTossClientKey 미설정 시 폴백.
   * 상수는 foEnvConsts/boEnvConsts 에서 가져옴 (미로드 시 안전 폴백). 실 결제는 사이트 설정의 tossClientKey 필요. */
  const TOSS_TEST_CLIENT_KEY = _env('toss.TEST_CLIENT_KEY', 'test_gck_docs_Ovk5rk1gB5Nrm6CzWlVWax');

  /* 마지막 getTossPayments 호출이 테스트 키 폴백을 썼는지 (호출자 안내용) */
  let _usedTestKey = false;
  const isTossTestKey = () => _usedTestKey;

  /* getTossPayments */
  const getTossPayments = async () => {
    if (_tossInstance) return _tossInstance;
    if (!window.TossPayments) throw new Error(_errMsg('결제창을 열 수 없습니다 — Toss Payments SDK 가 로드되지 않았습니다.',
      'index.html/bo.html 의 js.tosspayments.com/v2/standard 스크립트 로드와 네트워크/광고차단 확장을 확인하세요.'));
    let clientKey = _key('svTossClientKey');
    if (!clientKey) { clientKey = TOSS_TEST_CLIENT_KEY; _usedTestKey = true; }
    else { _usedTestKey = false; }
    _debug('토스 결제 SDK 초기화', {
      sdk: _env('toss.SDK_V2_URL', 'https://js.tosspayments.com/v2/standard'),
      clientKey,
      keyType: _usedTestKey ? '테스트키(폴백)' : '운영키(svTossClientKey)',
    });
    _tossInstance = TossPayments(clientKey);
    return _tossInstance;
  };

  /* getTossPaymentWidgets — Toss v2 결제위젯 인스턴스 생성 (customerKey 별).
   * 사용: const w = await coExtSdk.getTossPaymentWidgets(customerKey);
   *       await w.setAmount({ currency:'KRW', value }); await w.renderPaymentMethods({ selector });
   *       await w.renderAgreement({ selector }); await w.requestPayment({ orderId, orderName, successUrl, failUrl }); */
  const getTossPaymentWidgets = async (customerKey) => {
    const toss = await getTossPayments();
    if (typeof toss.widgets !== 'function') throw new Error(_errMsg('결제위젯을 표시할 수 없습니다 — 이 Toss SDK 버전은 결제위젯(widgets)을 지원하지 않습니다.',
      '결제 스크립트를 v2/standard(js.tosspayments.com/v2/standard) 로 교체하세요.'));
    /* 비회원/게스트 결제는 customerKey 대신 'ANONYMOUS' 센티넬 사용 (Toss v2 규약).
     * 회원은 2~50자 불투명 키 권장 (회원ID 그대로는 비권장이나 프로토타입에선 허용). */
    const k = String(customerKey || '');
    const ck = (k.length >= 2 && k.length <= 50) ? k : 'ANONYMOUS';
    _debug('토스 결제위젯 생성', { customerKey: ck, testKey: _usedTestKey });
    return toss.widgets({ customerKey: ck });
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
    const src = _env('map.KAKAO_SDK_URL', 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services,clusterer&appkey=') + encodeURIComponent(appKey);
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
    const src = _env('map.NAVER_SDK_URL', 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=') + encodeURIComponent(clientId);
    _naverMapPromise = _loadScript(src).then(() => naver.maps);
    return _naverMapPromise;
  };

  window.coExtSdk = {
    // 소셜 로그인
    loginGoogle, loginKakao, loginNaver,
    // 결제
    getTossPayments, getTossPaymentWidgets, isTossTestKey,
    // 지도
    loadKakaoMap, loadNaverMap,
    // 개발용 디버그 훅 (창 띄울 때 URL·파라미터 노출) + 포맷터
    setDebugHook, _fmtParams,
  };
})();
