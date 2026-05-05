/**
 * FO (Front Office) 인증 정보 Pinia 스토어
 * - 토큰, 만료시간 관리
 *
 * authUser 객체 필드 규칙:
 *   authId      : 인증 식별자 (FO = ec_member.member_id), JWT subject와 동일
 *   memberId    : ec_member.member_id (authId와 동일값, 명시적 접근용)
 *   userId      : null (BO 전용)
 *   AppTypeCd  : "FO"
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
    AppTypeCd: 'FO',
    loginId: '',
    memberNm: '',
    siteId: '',
  });

  window.useFoAuthStore = Pinia.defineStore('foAuth', {
    state: () => {
      return {
        svAuthUser: _defaultAuthUser(),
        svAccessToken: '',
        svRefreshToken: '',
        svAccessExpiresIn: 0,
        svRefreshExpiresIn: 0,
        svTempAuthInfo: null,
      };
    },

    getters: {
      sgIsLoggedIn: (s) => !!(s.svAuthUser?.authId) && !!s.svAccessToken,
      sgIsTokenValid: (s) => !!(s.svAccessToken),
    },

    actions: {
      saSetAuth(authData) {
        if (!authData) return;
        if (authData.accessToken) this.svAccessToken = authData.accessToken;
        if (authData.refreshToken) this.svRefreshToken = authData.refreshToken;
        if (authData.accessExpiresIn) this.svAccessExpiresIn = authData.accessExpiresIn;
        if (authData.refreshExpiresIn) this.svRefreshExpiresIn = authData.refreshExpiresIn;
        if (authData.authUser) this.svAuthUser = authData.authUser;
        else if (authData.user) this.saSetAuthUser(authData.user); // StoreAuth.user 필드 호환
        if (authData.tempAuthInfo !== undefined) this.svTempAuthInfo = authData.tempAuthInfo;
        try {
          if (this.svAccessToken) localStorage.setItem('modu-fo-accessToken', this.svAccessToken);
          if (this.svRefreshToken) localStorage.setItem('modu-fo-refreshToken', this.svRefreshToken);
          if (this.svAuthUser) localStorage.setItem('modu-fo-authUser', JSON.stringify(this.svAuthUser));
          if (this.svTempAuthInfo) localStorage.setItem('modu-fo-tempAuthInfo', JSON.stringify(this.svTempAuthInfo));
        } catch (e) {
          console.error('[foAuthStore] saSetAuth localStorage error:', e);
        }
      },

      saUpdateAuth(authData) {
        if (!authData) return;
        this.svAccessToken = authData.accessToken || this.svAccessToken;
        this.svRefreshToken = authData.refreshToken || this.svRefreshToken;
        this.svAccessExpiresIn = authData.accessExpiresIn || this.svAccessExpiresIn;
        this.svRefreshExpiresIn = authData.refreshExpiresIn || this.svRefreshExpiresIn;
        try {
          if (this.svAccessToken) localStorage.setItem('modu-fo-accessToken', this.svAccessToken);
          if (this.svRefreshToken) localStorage.setItem('modu-fo-refreshToken', this.svRefreshToken);
        } catch (e) {
          console.error('[foAuthStore] saUpdateAuth localStorage error:', e);
        }
      },

      saSetAuthUser(authUserData) {
        if (!authUserData) return;
        this.svAuthUser = authUserData;
        try {
          localStorage.setItem('modu-fo-authUser', JSON.stringify(authUserData));
        } catch (e) {
          console.error('[foAuthStore] saSetAuthUser localStorage error:', e);
        }
      },

      saSetSession(authUser, accessToken) {
        this.svAuthUser = authUser || _defaultAuthUser();
        this.svAccessToken = accessToken || '';
        try {
          if (this.svAccessToken) localStorage.setItem('modu-fo-accessToken', this.svAccessToken);
          if (authUser) localStorage.setItem('modu-fo-authUser', JSON.stringify(authUser));
        } catch (e) {
          console.error('[foAuthStore] saSetSession localStorage error:', e);
        }
      },

      saClearSession() {
        this.svAuthUser = _defaultAuthUser();
        this.svAccessToken = '';
        this.svRefreshToken = '';
        this.svAccessExpiresIn = 0;
        this.svRefreshExpiresIn = 0;
        this.svTempAuthInfo = null;
        try {
          localStorage.removeItem('modu-fo-accessToken');
          localStorage.removeItem('modu-fo-refreshToken');
          localStorage.removeItem('modu-fo-authUser');
          localStorage.removeItem('modu-fo-tempAuthInfo');
        } catch (e) {
          console.error('[foAuthStore] saClearSession localStorage error:', e);
        }
      },

      saClear() {
        this.svAuthUser = _defaultAuthUser();
        this.svAccessToken = '';
        this.svRefreshToken = '';
        this.svAccessExpiresIn = 0;
        this.svRefreshExpiresIn = 0;
        this.svTempAuthInfo = null;
        try {
          localStorage.removeItem('modu-fo-accessToken');
          localStorage.removeItem('modu-fo-refreshToken');
          localStorage.removeItem('modu-fo-tempAuthInfo');
        } catch (e) {
          console.error('[foAuthStore] saClear localStorage error:', e);
        }
      },

      saSyncFromStorage() {
        try {
          const token        = localStorage.getItem('modu-fo-accessToken');
          const refreshToken = localStorage.getItem('modu-fo-refreshToken');
          const authUserJson = localStorage.getItem('modu-fo-authUser');
          if (token) {
            this.svAccessToken = token;
            if (refreshToken) this.svRefreshToken = refreshToken;
            if (authUserJson) this.svAuthUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            else this.svAuthUser = _defaultAuthUser();
          } else {
            this.svAccessToken = '';
            this.svRefreshToken = '';
            this.svAuthUser = _defaultAuthUser();
          }
          return !!token;
        } catch (e) {
          console.error('[foAuthStore] saSyncFromStorage error:', e);
          return false;
        }
      },

      saRestoreFromStorage() {
        try {
          const token         = localStorage.getItem('modu-fo-accessToken');
          const refreshToken  = localStorage.getItem('modu-fo-refreshToken');
          const authUserJson  = localStorage.getItem('modu-fo-authUser');
          if (token) {
            this.svAccessToken = token;
            if (refreshToken) this.svRefreshToken = refreshToken;
            if (authUserJson) this.svAuthUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
          }
          return !!(token && refreshToken);
        } catch (e) {
          console.error('[foAuthStore] saRestoreFromStorage error:', e);
          return false;
        }
      },
    },
  });

  // 함수형 유틸리티
  window.sfGetFoAuthStore = () => {
    try { return window.useFoAuthStore?.() || { svAuthUser: _defaultAuthUser(), svAccessToken: '', sgIsLoggedIn: false }; }
    catch (e) { return { svAuthUser: _defaultAuthUser(), svAccessToken: '', sgIsLoggedIn: false }; }
  };

  window.sfGetFoAuthUser = () => {
    try {
      const store = window.useFoAuthStore?.();
      return (store?.svAuthUser?.authId) ? store.svAuthUser : _defaultAuthUser();
    } catch (e) { return _defaultAuthUser(); }
  };

  window.sfIsFoLogin = () => {
    try {
      const store = window.useFoAuthStore?.();
      return !!(store?.svAuthUser?.authId && store?.svAccessToken);
    } catch (e) { return false; }
  };
})();
