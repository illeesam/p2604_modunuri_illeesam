/**
 * FO (Front Office) 인증 정보 Pinia 스토어
 * - 토큰, 만료시간 관리
 */
window.useFoAuthStore = Pinia.defineStore('foAuth', {
  state: () => {
    return {
      user: null,
      accessToken: '',
      refreshToken: '',
      accessExpiresIn: 0,
      refreshExpiresIn: 0,
      tempAuthInfo: null,
    };
  },

  getters: {
    isTokenValid: (s) => !!(s.accessToken),
  },

  actions: {
    setAuth(authData) {
      if (authData) {
        if (authData.accessToken) {
          this.accessToken = authData.accessToken;
        }
        if (authData.refreshToken) {
          this.refreshToken = authData.refreshToken;
        }
        if (authData.accessExpiresIn) {
          this.accessExpiresIn = authData.accessExpiresIn;
        }
        if (authData.refreshExpiresIn) {
          this.refreshExpiresIn = authData.refreshExpiresIn;
        }

        if (authData.user) {
          this.user = authData.user;
        }

        if (authData.tempAuthInfo !== undefined) {
          this.tempAuthInfo = authData.tempAuthInfo;
        }

        try {
          if (this.accessToken) {
            localStorage.setItem('modu-fo-access_token', this.accessToken);
          }
          if (this.refreshToken) {
            localStorage.setItem('modu-fo-refresh_token', this.refreshToken);
          }
          if (this.user) {
            localStorage.setItem('modu-fo-user', JSON.stringify(this.user));
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
            localStorage.setItem('modu-fo-access_token', this.accessToken);
          }
          if (this.refreshToken) {
            localStorage.setItem('modu-fo-refresh_token', this.refreshToken);
          }
        } catch (e) {
          console.error('[foAuthStore] updateAuth localStorage error:', e);
        }
      }
    },

    setUser(userData) {
      if (userData) {
        this.user = userData;
        try {
          if (userData) {
            localStorage.setItem('modu-fo-user', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('[foAuthStore] setUser localStorage error:', e);
        }
      }
    },

    setSession(user, accessToken) {
      this.user = user || null;
      this.accessToken = accessToken || '';
      try {
        if (this.accessToken) {
          localStorage.setItem('modu-fo-access_token', this.accessToken);
        }
        if (user) {
          localStorage.setItem('modu-fo-user', JSON.stringify(user));
        }
      } catch (e) {
        console.error('[foAuthStore] setSession localStorage error:', e);
      }
    },

    clearSession() {
      this.user = null;
      this.accessToken = '';
      this.refreshToken = '';
      this.accessExpiresIn = 0;
      this.refreshExpiresIn = 0;
      this.tempAuthInfo = null;

      try {
        localStorage.removeItem('modu-fo-access_token');
        localStorage.removeItem('modu-fo-refresh_token');
        localStorage.removeItem('modu-fo-user');
      } catch (e) {
        console.error('[foAuthStore] clearSession localStorage error:', e);
      }
    },

    clear() {
      this.accessToken = '';
      this.refreshToken = '';
      this.accessExpiresIn = 0;
      this.refreshExpiresIn = 0;

      try {
        localStorage.removeItem('modu-fo-access_token');
        localStorage.removeItem('modu-fo-refresh_token');
      } catch (e) {
        console.error('[foAuthStore] clear localStorage error:', e);
      }
    },

    syncFromStorage() {
      try {
        const token = localStorage.getItem('modu-fo-access_token');
        const refreshToken = localStorage.getItem('modu-fo-refresh_token');

        if (token) {
          this.accessToken = token;
        } else {
          this.accessToken = '';
          this.refreshToken = '';
        }

        if (refreshToken) {
          this.refreshToken = refreshToken;
        }

        return !!token;
      } catch (e) {
        console.error('[foAuthStore] syncFromStorage error:', e);
        return false;
      }
    },

    restoreFromStorage() {
      try {
        const token = localStorage.getItem('modu-fo-access_token');
        const refreshToken = localStorage.getItem('modu-fo-refresh_token');

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
