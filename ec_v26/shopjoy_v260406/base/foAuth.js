/* ShopJoy - FO Auth Module (Pinia + localStorage token 연계) */
(function () {
  /* ── 구 key 마이그레이션: modu-fo-user → modu-fo-authUser ── */
  try {
    const _oldUser = localStorage.getItem('modu-fo-user');
    if (_oldUser && !localStorage.getItem('modu-fo-authUser')) {
      localStorage.setItem('modu-fo-authUser', _oldUser);
    }
    localStorage.removeItem('modu-fo-user');
  } catch (e) {}

  /* ── 초기 상태: 토큰 + 유저 모두 있을 때만 로그인으로 처리 ── */
  const _initToken = localStorage.getItem('modu-fo-accessToken');
  let _initUser = null;
  if (_initToken) {
    try { _initUser = JSON.parse(localStorage.getItem('modu-fo-authUser') || 'null'); } catch (e) {}
  }
  if (!_initToken) {
    /* 토큰 없으면 유저 정보도 정리 */
    localStorage.removeItem('modu-fo-authUser');
  }

  console.log('[foAuth] init _initToken:', !!_initToken);
  console.log('[foAuth] init _initUser:', _initUser);

  /* ── 레거시 reactive state (app.js에서 auth.user 로 참조) ── */
  const state = Vue.reactive({ user: _initToken ? _initUser : null, loading: false });

  /* ── Pinia 스토어 인스턴스 (init() 후 사용 가능) ── */
  let _store = null;

  /* ── 토큰 생성 ── */
  const _mkToken = () => 'sjt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);

  /* ── store → state 동기화 ── */
  const _sync = () => {
    if (_store) {
      state.user = _store.authUser ? { ...(_store.authUser) } : null;
      console.log('[foAuth._sync] state.user updated:', state.user);
    }
  };

  /* ── Pinia 초기화 (app.js에서 호출) ── */
  const init = pinia => {
    _store = window.useFoAuthStore(pinia);

    /* 초기 사용자 정보 로드 (서버 검증 전 임시 표시) */
    if (_initUser && _initToken) {
      _store.authUser = _initUser;
      _store.accessToken = _initToken;
      console.log('[foAuth.init] restored authUser from localStorage:', _initUser);
    }

    /* 초기 동기화 */
    _sync();

    /* ── F5 새로고침 시 init data 재조회 (토큰 유효성 검증 포함) ── */
    if (_initToken) {
      (async () => {
        try {
          const initStore = window.useFoAppInitStore?.();
          if (initStore) await initStore.fetchFoAppInitData();
          _sync();
          console.log('[foAuth.init] init data loaded OK');
        } catch (e) {
          if (e?.response?.status === 401) {
            console.warn('[foAuth.init] token invalid (401), clearing session');
            _store.clearSession();
            _sync();
          } else {
            console.warn('[foAuth.init] fetchFoAppInitData error:', e?.response?.status || e.message);
          }
        }
      })();
    }

    /* 1초마다 localStorage 폴링 → DevTools에서 토큰 삭제 시 즉시 로그아웃 */
    setInterval(() => {
      _store.syncFromStorage();
      _sync();
    }, 1000);

    /* 다른 탭에서 localStorage 변경 시 즉시 동기화 */
    window.addEventListener('storage', e => {
      if (e.key === 'modu-fo-accessToken' || e.key === 'modu-fo-authUser') {
        _store.syncFromStorage();
        _sync();
      }
    });
  };

  /* ── 이메일/비밀번호 로그인 ── */
  const login = async (loginId, loginPwd) => {
    state.loading = true;
    try {
      if (!window.foApi) throw new Error('no api');
      const loginPwdHash = window.CryptoJS ? CryptoJS.SHA256(loginPwd).toString() : loginPwd;
      const res = await window.foApi.post('/auth/fo/auth/login', { loginId, loginPwd: loginPwdHash });
      console.log('[foAuth.login] full response:', res);
      console.log('[foAuth.login] response.data:', res.data);
      console.log('[foAuth.login] response.data.data:', res.data?.data);
      if (res.data?.data) {
        const d = res.data.data;
        console.log('[foAuth.login] data fields:', Object.keys(d));
        // authId: FO = ec_member.member_id (backend LoginRes.authId 또는 memberId)
        const authId = d.authId || d.memberId || d.userId || '';
        const user  = {
          authId,
          memberId: authId,             // FO 전용: ec_member.member_id
          userId: null,                 // BO 전용: FO는 null
          userTypeCd: d.userTypeCd || 'FO',
          loginId: d.loginId || '',
          memberNm: d.userNm || d.memberNm || '사용자',
          siteId: d.siteId || '',
        };
        const token = d.accessToken;
        console.log('[foAuth.login] user object:', user);
        console.log('[foAuth.login] token:', token);
        _store.setSession(user, token);
        _sync();
        console.log('[foAuth.login] state.user after sync:', state.user);

        /* 로그인 후 추가 사용자 정보 조회 */
        try {
          const userRes = await window.foApi.post('/co/cm/fo-app-store/getUser', '');
          if (userRes?.data?.data?.member) {
            const authStore = window.useFoAuthStore?.();
            authStore?.setAuthUser(userRes.data.data.member);
            console.log('[foAuth.login] user info updated from getUser');
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

  /* ── 소셜 로그인 ── */
  const loginSocial = provider => {
    const demos = {
      google: { userId: 'g1', email: 'google.user@gmail.com', name: 'Google유저', provider: 'google' },
      kakao:  { userId: 'k1', email: 'kakao.user@kakao.com',  name: 'Kakao유저',  provider: 'kakao' },
      naver:  { userId: 'n1', email: 'naver.user@naver.com',  name: 'Naver유저',  provider: 'naver' },
    };
    const user = demos[provider];
    if (!user) return { ok: false };
    _store.setSession(user, _mkToken());
    _sync();
    return { ok: true };
  };

  /* ── 회원가입 ── */
  const signup = async (memberNm, loginId, phone, extra = {}) => {
    state.loading = true;
    try {
      if (!window.foApi) throw new Error('no api');
      const passwordHash = window.CryptoJS ? CryptoJS.SHA256(extra.password || '').toString() : extra.password;
      const body = { memberNm, loginId, loginPwdHash: passwordHash, ...extra };
      const res = await window.foApi.post('/auth/fo/auth/join', body);
      console.log('[foAuth.signup] response:', res.data);
      if (res.data?.data) {
        const d = res.data.data;
        const authId = d.authId || d.memberId || d.userId || '';
        const user = {
          authId,
          memberId: authId,
          userId: null,
          userTypeCd: d.userTypeCd || 'FO',
          loginId: d.loginId || loginId,
          memberNm: d.userNm || d.memberNm || memberNm || '사용자',
          siteId: d.siteId || '',
        };
        const token = d.accessToken;
        _store.setSession(user, token);
        _sync();
        return { ok: true };
      }
      return { ok: false, msg: res.data?.message || '회원가입 실패' };
    } catch (e) {
      console.error('[foAuth.signup] error:', e);
      return { ok: false, msg: e.response?.data?.message || '회원가입 중 오류가 발생했습니다.' };
    } finally { state.loading = false; }
  };

  /* ── 로그아웃 ── */
  const logout = () => {
    _store.clearSession();
    _sync();
  };

  /* ── 로그인 상태 체크 ── */
  const isFoLogin = () => !!(state.user?.authId) && !!localStorage.getItem('modu-fo-accessToken');

  window.foAuth = { state, init, login, loginSocial, signup, logout, isFoLogin };
  window.isFoLogin = isFoLogin;
})();
