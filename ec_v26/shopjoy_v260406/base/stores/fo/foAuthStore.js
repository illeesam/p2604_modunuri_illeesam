/**
 * FO (Front Office) 인증 정보 Pinia 스토어
 * - 토큰, 만료시간 관리
 *
 * user 객체 필드 규칙:
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

  const _defaultUser = () => ({
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
        user: _defaultUser(),
        accessToken: '',
        refreshToken: '',
        accessExpiresIn: 0,
        refreshExpiresIn: 0,
        tempAuthInfo: null,
      };
    },

    getters: {
      isLoggedIn: (s) => !!(s.user?.authId) && !!s.accessToken,
      isTokenValid: (s) => !!(s.accessToken),
    },

    actions: {
      setAuth(authData) {
        if (!authData) return;
        if (authData.accessToken) this.accessToken = authData.accessToken;
        if (authData.refreshToken) this.refreshToken = authData.refreshToken;
        if (authData.accessExpiresIn) this.accessExpiresIn = authData.accessExpiresIn;
        if (authData.refreshExpiresIn) this.refreshExpiresIn = authData.refreshExpiresIn;
        if (authData.user) this.user = authData.user;
        if (authData.tempAuthInfo !== undefined) this.tempAuthInfo = authData.tempAuthInfo;
        try {
          if (this.accessToken) localStorage.setItem('modu-fo-accessToken', this.accessToken);
          if (this.refreshToken) localStorage.setItem('modu-fo-refreshToken', this.refreshToken);
          if (this.user) localStorage.setItem('modu-fo-user', JSON.stringify(this.user));
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

      setUser(userData) {
        if (!userData) return;
        this.user = userData;
        try {
          localStorage.setItem('modu-fo-user', JSON.stringify(userData));
        } catch (e) {
          console.error('[foAuthStore] setUser localStorage error:', e);
        }
      },

      setSession(user, accessToken) {
        this.user = user || _defaultUser();
        this.accessToken = accessToken || '';
        try {
          if (this.accessToken) localStorage.setItem('modu-fo-accessToken', this.accessToken);
          if (user) localStorage.setItem('modu-fo-user', JSON.stringify(user));
        } catch (e) {
          console.error('[foAuthStore] setSession localStorage error:', e);
        }
      },

      clearSession() {
        this.user = _defaultUser();
        this.accessToken = '';
        this.refreshToken = '';
        this.accessExpiresIn = 0;
        this.refreshExpiresIn = 0;
        this.tempAuthInfo = null;
        try {
          localStorage.removeItem('modu-fo-accessToken');
          localStorage.removeItem('modu-fo-refreshToken');
          localStorage.removeItem('modu-fo-user');
          localStorage.removeItem('modu-fo-tempAuthInfo');
        } catch (e) {
          console.error('[foAuthStore] clearSession localStorage error:', e);
        }
      },

      clear() {
        this.user = _defaultUser();
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
          const token = localStorage.getItem('modu-fo-accessToken');
          const refreshToken = localStorage.getItem('modu-fo-refreshToken');
          if (token) this.accessToken = token;
          else { this.accessToken = ''; this.refreshToken = ''; }
          if (refreshToken) this.refreshToken = refreshToken;
          return !!token;
        } catch (e) {
          console.error('[foAuthStore] syncFromStorage error:', e);
          return false;
        }
      },

      restoreFromStorage() {
        try {
          const token = localStorage.getItem('modu-fo-accessToken');
          const refreshToken = localStorage.getItem('modu-fo-refreshToken');
          const userJson = localStorage.getItem('modu-fo-user');
          if (token) {
            this.accessToken = token;
            if (refreshToken) this.refreshToken = refreshToken;
            if (userJson) this.user = Object.assign(_defaultUser(), JSON.parse(userJson) || {});
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
    try { return window.useFoAuthStore?.() || { user: _defaultUser(), accessToken: '', isLoggedIn: false }; }
    catch (e) { return { user: _defaultUser(), accessToken: '', isLoggedIn: false }; }
  };

  window.getFoAuthUser = () => {
    try {
      const store = window.useFoAuthStore?.();
      return (store?.user?.memberId) ? store.user : _defaultUser();
    } catch (e) { return _defaultUser(); }
  };

  window.isFoLogin = () => {
    try {
      const store = window.useFoAuthStore?.();
      return !!(store?.user?.memberId && store?.accessToken);
    } catch (e) { return false; }
  };

  window.isFoLogin = window.isFoLogin;
})();
