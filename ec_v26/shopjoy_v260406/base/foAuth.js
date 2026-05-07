/* ShopJoy - FO Auth Module (Pinia store 위임 + API 흐름 오케스트레이션)
 *
 * 역할 분리:
 *   - 상태(토큰/사용자/localStorage 동기화) → base/stores/fo/foAuthStore.js (Pinia)
 *   - API 흐름(login/logout/signup) + 부트스트랩(F5 검증/폴링/마이그레이션) → 본 파일
 *
 * 호환:
 *   - window.foAuth.state.user     → store.svAuthUser 프록시
 *   - window.foAuth.state.loading  → 로컬 reactive (API 진행 플래그)
 *   - window.sfIsFoLogin           → foAuthStore.js 가 정의 (본 파일은 재정의하지 않음)
 */
(function () {
  /* ── 구 key 마이그레이션: modu-fo-user → modu-fo-authUser ── */
  try {
    const _oldUser = localStorage.getItem('modu-fo-user');
    if (_oldUser && !localStorage.getItem('modu-fo-authUser')) {
      localStorage.setItem('modu-fo-authUser', _oldUser);
    }
    localStorage.removeItem('modu-fo-user');
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

  /* ── 토큰 생성 (소셜 로그인 데모용) ── */
  const _mkToken = () => 'sjt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);

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

    /* 다른 탭에서 localStorage 변경 시 즉시 동기화 */
    window.addEventListener('storage', e => {
      if (e.key === 'modu-fo-accessToken' || e.key === 'modu-fo-authUser') {
        _store.saSyncFromStorage();
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
      loginId: d.loginId || fallbackLoginId || '',
      memberNm: d.userNm || d.memberNm || fallbackMemberNm || '사용자',
      siteId: d.siteId || '',
    };
  };

  /* ── 이메일/비밀번호 로그인 ── */
  const login = async (loginId, loginPwd) => {
    state.loading = true;
    try {
      const loginPwdHash = await coUtil.sha256(loginPwd);
      const res = await coApiSvc.foAuth.login({ loginId, loginPwd: loginPwdHash }, '로그인', '이메일로그인');
      if (res.data?.data) {
        const d = res.data.data;
        _store.saSetSession(_buildAuthUser(d, d.loginId), d.accessToken);

        /* 로그인 후 추가 사용자 정보 조회 */
        try {
          const userRes = await coApiSvc.cmFoAppStore.getUserPost('시스템', '사용자정보조회');
          if (userRes?.data?.data?.member) {
            _store.saSetAuthUser(userRes.data.data.member);
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

  /* ── 소셜 로그인 (데모) ── */
  const loginSocial = provider => {
    const demos = {
      google: { authId: 'g1', memberId: 'g1', userId: null, AppTypeCd: 'FO', loginId: 'google.user@gmail.com', memberNm: 'Google유저', siteId: '' },
      kakao:  { authId: 'k1', memberId: 'k1', userId: null, AppTypeCd: 'FO', loginId: 'kakao.user@kakao.com',  memberNm: 'Kakao유저',  siteId: '' },
      naver:  { authId: 'n1', memberId: 'n1', userId: null, AppTypeCd: 'FO', loginId: 'naver.user@naver.com',  memberNm: 'Naver유저',  siteId: '' },
    };
    const user = demos[provider];
    if (!user) return { ok: false };
    _store.saSetSession(user, _mkToken());
    return { ok: true };
  };

  /* ── 회원가입 ── */
  const signup = async (memberNm, loginId, phone, extra = {}) => {
    state.loading = true;
    try {
      const passwordHash = await coUtil.sha256(extra.password || '');
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
    const refreshToken = localStorage.getItem('modu-fo-refreshToken');
    if (refreshToken) {
      try {
        await coApiSvc.foAuth.logout({ refreshToken }, '로그인', '로그아웃');
      } catch (_) {}
    }
    _store.saClearSession();
  };

  /* sfIsFoLogin 은 foAuthStore.js 가 window 에 정의 — 본 파일은 재정의하지 않음 */
  window.foAuth = { state, init, login, loginSocial, signup, logout };
})();
