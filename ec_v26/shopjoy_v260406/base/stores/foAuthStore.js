/**
 * FO (Front Office) 인증 정보 Pinia 스토어
 * - 토큰, 만료시간 관리
 */
window.useFoAuthStore = Pinia.defineStore('foAuth', {
  state: () => {
    return {
      accessToken: '',
      refreshToken: '',
      accessExpiresIn: 0,
      refreshExpiresIn: 0,
    };
  },

  getters: {
    isTokenValid: (s) => !!(s.accessToken),
  },

  actions: {
    setAuth(authData) {
      if (authData) {
        this.accessToken = authData.accessToken || '';
        this.refreshToken = authData.refreshToken || '';
        this.accessExpiresIn = authData.accessExpiresIn || 0;
        this.refreshExpiresIn = authData.refreshExpiresIn || 0;

        try {
          if (this.accessToken) {
            localStorage.setItem('modu-fo-token', this.accessToken);
          }
          if (this.refreshToken) {
            localStorage.setItem('modu-fo-refresh', this.refreshToken);
          }
        } catch (e) {
          console.error('[foAuthStore] setAuth localStorage error:', e);
        }
      }
    },

    updateAuth(authData) {
      if (authData) {
        this.accessToken = authData.accessToken || this.accessToken;
        this.refreshToken = authData.refreshToken || this.refreshToken;
        this.accessExpiresIn = authData.accessExpiresIn || this.accessExpiresIn;
        this.refreshExpiresIn = authData.refreshExpiresIn || this.refreshExpiresIn;

        try {
          if (this.accessToken) {
            localStorage.setItem('modu-fo-token', this.accessToken);
          }
          if (this.refreshToken) {
            localStorage.setItem('modu-fo-refresh', this.refreshToken);
          }
        } catch (e) {
          console.error('[foAuthStore] updateAuth localStorage error:', e);
        }
      }
    },

    clear() {
      this.accessToken = '';
      this.refreshToken = '';
      this.accessExpiresIn = 0;
      this.refreshExpiresIn = 0;

      try {
        localStorage.removeItem('modu-fo-token');
        localStorage.removeItem('modu-fo-refresh');
      } catch (e) {
        console.error('[foAuthStore] clear localStorage error:', e);
      }
    },

    restoreFromStorage() {
      try {
        const token = localStorage.getItem('modu-fo-token');
        const refreshToken = localStorage.getItem('modu-fo-refresh');

        if (token) {
          this.accessToken = token;
        }

        if (refreshToken) {
          this.refreshToken = refreshToken;
        }

        return !!(token && refreshToken);
      } catch (e) {
        console.error('[foAuthStore] restoreFromStorage error:', e);
        return false;
      }
    },
  },
});
