/* ShopJoy - FO Auth Module (Pinia + localStorage token 연계) */
(function () {
  /* ── 초기 상태: 토큰 + 유저 모두 있을 때만 로그인으로 처리 ── */
  const _initToken = localStorage.getItem('modu-front-token');
  let _initUser = null;
  if (_initToken) {
    try { _initUser = JSON.parse(localStorage.getItem('modu-front-user') || 'null'); } catch (e) {}
  }
  if (!_initToken) {
    /* 토큰 없으면 유저 정보도 정리 */
    localStorage.removeItem('modu-front-user');
  }

  /* ── 레거시 reactive state (app.js에서 auth.user 로 참조) ── */
  const state = Vue.reactive({ user: _initToken ? _initUser : null, loading: false });

  /* ── Pinia 스토어 인스턴스 (init() 후 사용 가능) ── */
  let _store = null;

  /* ── 토큰 생성 ── */
  const _mkToken = () => 'sjt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);

  /* ── store → state 동기화 ── */
  const _sync = () => { if (_store) state.user = _store.user; };

  /* ── Pinia 초기화 (app.js에서 호출) ── */
  const init = pinia => {
    _store = window.useFrontAuthStore(pinia);

    /* 초기 동기화 */
    _sync();

    /* 1초마다 localStorage 폴링 → DevTools에서 shopjoy_token 삭제 시 즉시 로그아웃 */
    setInterval(() => {
      _store.syncFromStorage();
      _sync();
    }, 1000);

    /* 다른 탭에서 localStorage 변경 시 즉시 동기화 */
    window.addEventListener('storage', e => {
      if (e.key === 'modu-front-token' || e.key === 'modu-front-user') {
        _store.syncFromStorage();
        _sync();
      }
    });
  };

  /* ── 이메일/비밀번호 로그인 ── */
  const login = async (loginName, loginPwd) => {
    state.loading = true;
    try {
      if (!window.frontApi) throw new Error('no api');
      const res = await window.frontApi.post('/auth/fo/auth/login', { loginName, loginPwd });
      if (res.data?.data) {
        const d = res.data.data;
        const user  = { userId: d.userId, email: d.email, memberNm: d.memberNm, phone: d.phone, gradeCd: d.gradeCd };
        const token = d.accessToken;
        _store.setSession(user, token);
        _sync();
        return { ok: true };
      }
      return { ok: false, msg: res.data?.message || '로그인 실패' };
    } catch (e) {
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
  const signup = async (memberNm, email, phone, extra = {}) => {
    state.loading = true;
    try {
      if (!window.frontApi) throw new Error('no api');
      const body = { memberNm, email, phone, ...extra };
      const res = await window.frontApi.post('/auth/fo/auth/join', body);
      if (res.data?.data) {
        const d = res.data.data;
        const user = { userId: d.userId, email: d.email, memberNm: d.memberNm, phone: d.phone, gradeCd: d.gradeCd };
        const token = d.accessToken;
        _store.setSession(user, token);
        _sync();
        return { ok: true };
      }
      return { ok: false, msg: res.data?.message || '회원가입 실패' };
    } catch (e) {
      return { ok: false, msg: e.response?.data?.message || '회원가입 중 오류가 발생했습니다.' };
    } finally { state.loading = false; }
  };

  /* ── 로그아웃 ── */
  const logout = () => {
    _store.clearSession();
    _sync();
  };

  window.foAuth = { state, init, login, loginSocial, signup, logout };
})();
