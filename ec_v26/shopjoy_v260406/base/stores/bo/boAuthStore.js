/**
 * BO 인증 Pinia 스토어 + 함수형 유틸리티
 * - 토큰 관리
 * - 로그인 사용자 정보
 * - 로그인/로그아웃
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boAuthStore] Pinia not loaded');
    return;
  }

  const { defineStore } = Pinia;

  window.useAuthStore = defineStore('auth', {
    state: () => ({
      user: null,
      accessToken: '',
      refreshToken: '',
      accessExpiresIn: 0,
      refreshExpiresIn: 0,
    }),

    getters: {
      isLoggedIn: (state) => !!state.user && !!state.accessToken,
      currentUser: (state) => state.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' },
      authHeader: (state) => (state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {}),
    },

    actions: {
      // 로그인
      async login(loginId, loginPwd, authMethod = '메인') {
        try {
          const loginPwdHash = window.CryptoJS ? CryptoJS.SHA256(loginPwd).toString() : loginPwd;
          const res = await window.boApi.post('/auth/bo/auth/login', {
            loginId,
            loginPwd: loginPwdHash,
            authMethod,
          });

          const loginData = res.data?.data || res.data || {};
          this.user = loginData.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
          this.accessToken = loginData.accessToken || '';
          this.refreshToken = loginData.refreshToken || '';
          this.accessExpiresIn = loginData.accessExpiresIn || 0;
          this.refreshExpiresIn = loginData.refreshExpiresIn || 0;

          // localStorage 저장
          try {
            if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
            if (this.user) localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
            if (this.accessExpiresIn) localStorage.setItem('modu-bo-access_expires_in', this.accessExpiresIn.toString());
            if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refresh_expires_in', this.refreshExpiresIn.toString());
          } catch (_) {}

          /* 로그인 후 초기 데이터 조회 */
          try {
            const initRes = await window.boApi.post('/co/cm/bo-app-store/getInitData', { names: 'ALL' });
            if (initRes?.data?.data) {
              const userStore = window.useUserStore?.();
              if (initRes.data.data.user) {
                userStore?.setUser(initRes.data.data.user);
              }
              console.log('[boAuthStore.login] admin init data loaded from getInitData');
            }
          } catch (e) {
            console.warn('[boAuthStore.login] getInitData fetch failed:', e);
          }

          return this.user || {};
        } catch (err) {
          this.reset();
          throw err;
        }
      },

      // 토큰 갱신
      async refreshAccessToken() {
        if (!this.refreshToken) {
          this.reset();
          return false;
        }

        try {
          const res = await window.boApi.post('/auth/bo/auth/refresh', {
            refreshToken: this.refreshToken,
          });

          this.accessToken = res.data?.accessToken || '';
          this.refreshToken = res.data?.refreshToken || '';
          this.accessExpiresIn = res.data?.accessExpiresIn || 0;
          this.refreshExpiresIn = res.data?.refreshExpiresIn || 0;

          try {
            if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
          } catch (_) {}

          return true;
        } catch (err) {
          this.reset();
          return false;
        }
      },

      // 로그아웃
      async logout() {
        if (this.refreshToken) {
          try {
            await window.boApi.post('/auth/bo/auth/logout', {
              refreshToken: this.refreshToken,
            });
          } catch (_) {}
        }
        this.reset();
      },

      // 초기화
      reset() {
        this.user = null;
        this.accessToken = null;
        this.refreshToken = null;

        try {
          localStorage.removeItem('modu-bo-access_token');
          localStorage.removeItem('modu-bo-refresh_token');
          localStorage.removeItem('modu-bo-user');
        } catch (_) {}
      },

      // 인증 정보 설정 (토큰 + 사용자 정보)
      setAuth(authData) {
        if (authData) {
          this.accessToken = authData.accessToken || '';
          this.refreshToken = authData.refreshToken || '';
          this.accessExpiresIn = authData.accessExpiresIn || 0;
          this.refreshExpiresIn = authData.refreshExpiresIn || 0;

          if (authData.user) {
            this.user = authData.user;
          }

          try {
            if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
            if (this.user) localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
            if (this.accessExpiresIn) localStorage.setItem('modu-bo-access_expires_in', this.accessExpiresIn.toString());
            if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refresh_expires_in', this.refreshExpiresIn.toString());
          } catch (_) {}
        }
      },

      // 사용자 정보 설정 (init store에서 호출)
      setUser(userData) {
        if (userData) {
          this.user = userData;
          try {
            if (userData) localStorage.setItem('modu-bo-user', JSON.stringify(userData));
          } catch (_) {}
        }
      },

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          const accessToken = localStorage.getItem('modu-bo-access_token');
          const refreshToken = localStorage.getItem('modu-bo-refresh_token');
          const userJson = localStorage.getItem('modu-bo-user');
          const accessExpiresIn = localStorage.getItem('modu-bo-access_expires_in');
          const refreshExpiresIn = localStorage.getItem('modu-bo-refresh_expires_in');

          if (accessToken && userJson) {
            this.accessToken = accessToken || '';
            this.refreshToken = refreshToken || '';
            this.user = JSON.parse(userJson) || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
            this.accessExpiresIn = accessExpiresIn ? parseInt(accessExpiresIn) : 0;
            this.refreshExpiresIn = refreshExpiresIn ? parseInt(refreshExpiresIn) : 0;
            return true;
          }
        } catch (_) {}
        return false;
      },
    },
  });

  // localStorage 변화 실시간 감지 (같은 탭 또는 다른 탭에서 토큰 삭제 시)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'modu-bo-access_token' || e.key === 'modu-bo-user' || e.key === 'modu-bo-refresh_token') {
        const store = window.useAuthStore?.();
        if (store) {
          const accessToken = localStorage.getItem('modu-bo-access_token');
          if (!accessToken) {
            // 토큰 삭제됨 → 스토어 초기화
            store.reset();
          } else {
            // localStorage 복원
            store.restoreFromStorage();
          }
        }
      }
    });
  }

  // 함수형 유틸리티 제공
  window.getAuthStore = () => {
    try {
      const store = window.useAuthStore?.();
      return store || {
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoggedIn: false,
        accessExpiresIn: 0,
        refreshExpiresIn: 0,
        currentUser: { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' },
        authHeader: {},
      };
    } catch (e) {
      console.error('getAuthStore error:', e);
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        accessExpiresIn: 0,
        refreshExpiresIn: 0,

        isLoggedIn: false,
        currentUser: { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' },
        authHeader: {},
      };
    }
  };

  window.getAuthUser = () => {
    try {
      const store = window.useAuthStore?.();
      return store?.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
    } catch (e) {
      console.error('getAuthUser error:', e);
      return { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
    }
  };

  window.getAuthToken = () => {
    try {
      const store = window.useAuthStore?.();
      return store?.accessToken || '';
    } catch (e) {
      console.error('getAuthToken error:', e);
      return '';
    }
  };

  window.isAuthLoggedIn = () => {
    try {
      const store = window.useAuthStore?.();
      return !!(store?.user && store?.accessToken);
    } catch (e) {
      console.error('isAuthLoggedIn error:', e);
      return false;
    }
  };

  window.isLogin = () => {
    try {
      const store = window.useAuthStore?.();
      if (!store?.user) return false;
      const userId = store.user.boUserId || store.user.memberId;
      return userId && String(userId).length > 3;
    } catch (e) {
      console.error('isLogin error:', e);
      return false;
    }
  };
})();
