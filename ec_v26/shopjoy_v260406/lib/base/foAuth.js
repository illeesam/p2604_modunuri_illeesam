/* ShopJoy - FO Auth Module (Pinia store 위임 + API 흐름 오케스트레이션)
 *
 * 역할 분리:
 *   - 상태(토큰/사용자/localStorage 동기화) → lib/stores/fo/foAuthStore.js (Pinia)
 *   - API 흐름(login/logout/signup) + 부트스트랩(F5 검증/폴링/마이그레이션) → 본 파일
 *
 * 호환:
 *   - window.foAuth.state.user     → store.svAuthUser 프록시
 *   - window.foAuth.state.loading  → 로컬 reactive (API 진행 플래그)
 *   - window.sfIsFoLogin           → foAuthStore.js 가 정의 (본 파일은 재정의하지 않음)
 */
(function () {
  /* ── 구 key 마이그레이션: modu-fo-auth-user → modu-fo-auth-authUser ── */
  try {
    const _oldUser = localStorage.getItem('modu-fo-auth-user');
    if (_oldUser && !localStorage.getItem('modu-fo-auth-authUser')) {
      localStorage.setItem('modu-fo-auth-authUser', _oldUser);
    }
    localStorage.removeItem('modu-fo-auth-user');
  } catch (e) {}

  /* ── Pinia 스토어 인스턴스 (init() 후 사용 가능) ── */
  let _store = null;

  /* ── 외부 호환용 state: user 는 store 위임, loading 은 로컬 ──
   *   기존 외부 코드(foAuth.state.user / foAuth.state.loading)와 호환.
   *   user 는 별도 보관하지 않고 항상 store 의 svAuthUser 를 반환한다. */
  const _localState = Vue.reactive({ loading: false });
  const state = Vue.reactive({});
  Object.defineProperty(state, 'user', {
    enumerable: true,
    get() { return _store ? (_store.svAuthUser || null) : null; },
  });
  Object.defineProperty(state, 'loading', {
    enumerable: true,
    get() { return _localState.loading; },
    set(v) { _localState.loading = v; },
  });

  /* ── Pinia 초기화 (foApp.js 에서 호출) ── */
  const init = pinia => {
    _store = window.useFoAuthStore(pinia);

    /* localStorage → store 복원 (토큰 + 사용자 정보) */
    _store.saRestoreFromStorage();

    /* ── F5 새로고침 시 init data 재조회 (토큰 유효성 검증 포함) ── */
    if (_store.svAccessToken) {
      (async () => {
        try {
          const initStore = window.useFoAppInitStore?.();
          if (initStore) await initStore.saFetchFoAppInitData();
          console.log('[foAuth.init] init data loaded OK');
        } catch (e) {
          if (e?.response?.status === 401) {
            console.warn('[foAuth.init] token invalid (401), clearing session');
            _store.saClearSession();
          } else {
            console.warn('[foAuth.init] saFetchFoAppInitData error:', e?.response?.status || e.message);
          }
        }
      })();
    }

    /* 폴링 주기 — DevTools 에서 토큰 삭제 시 자동 로그아웃 (가드: 중복 setInterval 방지) */
    if (!window._foAuthSyncTimer) {
      window._foAuthSyncTimer = setInterval(() => { _store.saSyncFromStorage(); }, 3000);
    }

    /* 다른 탭에서 localStorage 변경 시 즉시 동기화.
     * 교차탭 계정변경 보안: 로그인돼 있던 회원이 다른 탭에서 로그아웃되거나 다른 계정으로 바뀌면
     * 이 탭 메모리에 이전 회원 데이터(마이페이지 주문/캐시 등 개인정보)가 남으므로 reload 한다.
     * 단 '비로그인 → 로그인'(prevAuthId='')은 둘러보던 상태에 개인정보가 없으므로 reload 생략(장바구니 등 보존). */
    /* 인증 필요 페이지 — 로그아웃/계정변경 reload 시 이 해시에 머물면 home 으로 전환 후 reload */
    const AUTH_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt', 'order', 'blogEdit'];
    window.addEventListener('storage', e => {
      if (e.key === 'modu-fo-auth-accessToken' || e.key === 'modu-fo-auth-authUser') {
        const prevAuthId = _store.svAuthUser?.authId || '';
        _store.saSyncFromStorage();
        const nextAuthId = _store.svAuthUser?.authId || '';
        /* 이전에 로그인 상태였고(prev !== '') 사용자가 바뀐 경우에만 reload */
        if (prevAuthId && prevAuthId !== nextAuthId) {
          /* 인증 필요 페이지(마이페이지/주문 등)에 머물러 있으면 reload 후 다시 진입하지 않도록 home 으로 해시 변경.
           * 로그아웃·타계정 변경 후 이전 회원의 인증 페이지에 남는 것 방지. */
          const curPage = (new URLSearchParams((location.hash || '').replace(/^#/, ''))).get('page') || '';
          if (AUTH_PAGES.includes(curPage)) {
            location.hash = '#page=home';
          }
          location.reload();
        }
      }
    });
  };

  /* ── 로그인 응답 → authUser 객체 정규화 ── */
  const _buildAuthUser = (d, fallbackLoginId, fallbackMemberNm) => {
    const authId = d.authId || d.memberId || d.userId || '';
    return {
      authId,
      memberId: authId,             // FO 전용: ec_member.member_id
      userId: null,                 // BO 전용: FO 는 null
      AppTypeCd: d.AppTypeCd || 'FO',
      loginId: d.loginId || d.userEmail || fallbackLoginId || '',
      memberNm: d.userNm || d.memberNm || fallbackMemberNm || '사용자',
      email: d.userEmail || d.email || d.loginId || '',
      phone: d.userPhone || d.memberPhone || d.phone || '',
      siteId: d.siteId || '',
    };
  };

  /* ── 이메일/비밀번호 로그인 ── */
  const login = async (loginId, loginPwd) => {
    state.loading = true;
    try {
      const loginPwdHash = await coUtil.cofSha256(loginPwd);
      const res = await coApiSvc.foAuth.login({ loginId, loginPwd: loginPwdHash }, '로그인', '이메일로그인');
      if (res.data?.data) {
        const d = res.data.data;
        _store.saSetSession(_buildAuthUser(d, d.loginId), d.accessToken);

        /* 로그인 후 추가 사용자 정보 조회 (GET — 백엔드 getUser 는 @GetMapping) */
        try {
          const userRes = await coApiSvc.cmFoAppStore.getUser('시스템', '사용자정보조회');
          const userData = userRes?.data?.data?.syUser;
          if (userData) {
            _store.saSetAuthUser(userData);
          }
        } catch (e) {
          console.warn('[foAuth.login] getUser fetch failed:', e);
        }

        return { ok: true };
      }
      return { ok: false, msg: res.data?.message || '로그인 실패' };
    } catch (e) {
      console.error('[foAuth.login] error:', e);
      return { ok: false, msg: e.response?.data?.message || '로그인 중 오류가 발생했습니다.' };
    } finally { state.loading = false; }
  };

  /* 소셜 로그인은 co 모듈로 이관됨 → window.coAuth.socialLogin('fo', provider) 사용 */

  /* ── 회원가입 ── */
  const signup = async (memberNm, loginId, phone, extra = {}) => {
    state.loading = true;
    try {
      const passwordHash = await coUtil.cofSha256(extra.password || '');
      const body = { memberNm, loginId, loginPwdHash: passwordHash, ...extra };
      const res = await coApiSvc.foAuth.join(body, '회원가입', '가입');
      if (res.data?.data) {
        const d = res.data.data;
        _store.saSetSession(_buildAuthUser(d, loginId, memberNm), d.accessToken);
        return { ok: true };
      }
      return { ok: false, msg: res.data?.message || '회원가입 실패' };
    } catch (e) {
      console.error('[foAuth.signup] error:', e);
      return { ok: false, msg: e.response?.data?.message || '회원가입 중 오류가 발생했습니다.' };
    } finally { state.loading = false; }
  };

  /* ── 로그아웃 ── */
  const logout = async () => {
    const refreshToken = localStorage.getItem('modu-fo-auth-refreshToken');
    if (refreshToken) {
      try {
        await coApiSvc.foAuth.logout({ refreshToken }, '로그인', '로그아웃');
      } catch (_) {}
    }
    _store.saClearSession();
  };

  /* sfIsFoLogin 은 foAuthStore.js 가 window 에 정의 — 본 파일은 재정의하지 않음 */
  window.foAuth = { state, init, login, signup, logout };
})();
