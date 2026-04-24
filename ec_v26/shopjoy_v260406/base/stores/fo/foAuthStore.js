/**
 * FO (Front Office) 인증 정보 Pinia 스토어
 * - 토큰, 만료시간 관리
 *
 * authUser 객체 필드 규칙:
 *   authId      : 인증 식별자 (FO = ec_member.member_id), JWT subject와 동일
 *   memberId    : ec_member.member_id (authId와 동일값, 명시적 접근용)
 *   userId      : null (BO 전용)
 *   userTypeCd  : "FO"
 */
(function () {
  if (!window.Pinia) {
    console.warn('[foAuthStore] Pinia not loaded');
    return;
  }

  const _defaultAuthUser = () => ({
    authId: '',         // 인증 식별자 (ec_member.member_id)
    authNm: '',         // 인증 사용자명 (ec_member.member_nm)
    memberId: '',       // FO 전용: ec_member.member_id
    userId: null,       // BO 전용: FO는 null
    userTypeCd: 'FO',
    loginId: '',
    memberNm: '',
    siteId: '',
  });

  window.useFoAuthStore = Pinia.defineStore('foAuth', {
    state: () => {
      return {
        authUser: _defaultAuthUser(),
        accessToken: '',
        refreshToken: '',
        accessExpiresIn: 0,
        refreshExpiresIn: 0,
        tempAuthInfo: null,
      };
    },

    getters: {
      isLoggedIn: (s) => !!(s.authUser?.authId) && !!s.accessToken,
      isTokenValid: (s) => !!(s.accessToken),
    },

    actions: {
      setAuth(authData) {
        if (!authData) return;
        if (authData.accessToken) this.accessToken = authData.accessToken;
        if (authData.refreshToken) this.refreshToken = authData.refreshToken;
        if (authData.accessExpiresIn) this.accessExpiresIn = authData.accessExpiresIn;
        if (authData.refreshExpiresIn) this.refreshExpiresIn = authData.refreshExpiresIn;
        if (authData.authUser) this.authUser = authData.authUser;
        else if (authData.user) this.setAuthUser(authData.user); // StoreAuth.user 필드 호환
        if (authData.tempAuthInfo !== undefined) this.tempAuthInfo = authData.tempAuthInfo;
        try {
          if (this.accessToken) localStorage.setItem('modu-fo-accessToken', this.accessToken);
          if (this.refreshToken) localStorage.setItem('modu-fo-refreshToken', this.refreshToken);
          if (this.authUser) localStorage.setItem('modu-fo-authUser', JSON.stringify(this.authUser));
          if (this.tempAuthInfo) localStorage.setItem('modu-fo-tempAuthInfo', JSON.stringify(this.tempAuthInfo));
        } catch (e) {
          console.error('[foAuthStore] setAuth localStorage error:', e);
        }
      },

      updateAuth(authData) {
        if (!authData) return;
        this.accessToken = authData.accessToken || this.accessToken;
        this.refreshToken = authData.refreshToken || this.refreshToken;
        this.accessExpiresIn = authData.accessExpiresIn || this.accessExpiresIn;
        this.refreshExpiresIn = authData.refreshExpiresIn || this.refreshExpiresIn;
        try {
          if (this.accessToken) localStorage.setItem('modu-fo-accessToken', this.accessToken);
          if (this.refreshToken) localStorage.setItem('modu-fo-refreshToken', this.refreshToken);
        } catch (e) {
          console.error('[foAuthStore] updateAuth localStorage error:', e);
        }
      },

      setAuthUser(authUserData) {
        if (!authUserData) return;
        this.authUser = authUserData;
        try {
          localStorage.setItem('modu-fo-authUser', JSON.stringify(authUserData));
        } catch (e) {
          console.error('[foAuthStore] setAuthUser localStorage error:', e);
        }
      },

      setSession(authUser, accessToken) {
        this.authUser = authUser || _defaultAuthUser();
        this.accessToken = accessToken || '';
        try {
          if (this.accessToken) localStorage.setItem('modu-fo-accessToken', this.accessToken);
          if (authUser) localStorage.setItem('modu-fo-authUser', JSON.stringify(authUser));
        } catch (e) {
          console.error('[foAuthStore] setSession localStorage error:', e);
        }
      },

      clearSession() {
        this.authUser = _defaultAuthUser();
        this.accessToken = '';
        this.refreshToken = '';
        this.accessExpiresIn = 0;
        this.refreshExpiresIn = 0;
        this.tempAuthInfo = null;
        try {
          localStorage.removeItem('modu-fo-accessToken');
          localStorage.removeItem('modu-fo-refreshToken');
          localStorage.removeItem('modu-fo-authUser');
          localStorage.removeItem('modu-fo-tempAuthInfo');
        } catch (e) {
          console.error('[foAuthStore] clearSession localStorage error:', e);
        }
      },

      clear() {
        this.authUser = _defaultAuthUser();
        this.accessToken = '';
        this.refreshToken = '';
        this.accessExpiresIn = 0;
        this.refreshExpiresIn = 0;
        this.tempAuthInfo = null;
        try {
          localStorage.removeItem('modu-fo-accessToken');
          localStorage.removeItem('modu-fo-refreshToken');
          localStorage.removeItem('modu-fo-tempAuthInfo');
        } catch (e) {
          console.error('[foAuthStore] clear localStorage error:', e);
        }
      },

      syncFromStorage() {
        try {
          const token        = localStorage.getItem('modu-fo-accessToken');
          const refreshToken = localStorage.getItem('modu-fo-refreshToken');
          const authUserJson = localStorage.getItem('modu-fo-authUser');
          if (token) {
            this.accessToken = token;
            if (refreshToken) this.refreshToken = refreshToken;
            if (authUserJson) this.authUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            else this.authUser = _defaultAuthUser();
          } else {
            this.accessToken = '';
            this.refreshToken = '';
            this.authUser = _defaultAuthUser();
          }
          return !!token;
        } catch (e) {
          console.error('[foAuthStore] syncFromStorage error:', e);
          return false;
        }
      },

      restoreFromStorage() {
        try {
          const token         = localStorage.getItem('modu-fo-accessToken');
          const refreshToken  = localStorage.getItem('modu-fo-refreshToken');
          const authUserJson  = localStorage.getItem('modu-fo-authUser');
          if (token) {
            this.accessToken = token;
            if (refreshToken) this.refreshToken = refreshToken;
            if (authUserJson) this.authUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
          }
          return !!(token && refreshToken);
        } catch (e) {
          console.error('[foAuthStore] restoreFromStorage error:', e);
          return false;
        }
      },
    },
  });

  // 함수형 유틸리티
  window.getFoAuthStore = () => {
    try { return window.useFoAuthStore?.() || { authUser: _defaultAuthUser(), accessToken: '', isLoggedIn: false }; }
    catch (e) { return { authUser: _defaultAuthUser(), accessToken: '', isLoggedIn: false }; }
  };

  window.getFoAuthUser = () => {
    try {
      const store = window.useFoAuthStore?.();
      return (store?.authUser?.authId) ? store.authUser : _defaultAuthUser();
    } catch (e) { return _defaultAuthUser(); }
  };

  window.isFoLogin = () => {
    try {
      const store = window.useFoAuthStore?.();
      return !!(store?.authUser?.authId && store?.accessToken);
    } catch (e) { return false; }
  };

  window.isFoLogin = window.isFoLogin;
})();
