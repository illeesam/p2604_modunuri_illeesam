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
      accessToken: null,
      refreshToken: null,
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

          this.user = res.data || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
          this.accessToken = res.data?.accessToken || '';
          this.refreshToken = res.data?.refreshToken || '';

          // localStorage 저장
          try {
            if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
            if (this.user) localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
          } catch (_) {}

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

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          const accessToken = localStorage.getItem('modu-bo-access_token');
          const refreshToken = localStorage.getItem('modu-bo-refresh_token');
          const userJson = localStorage.getItem('modu-bo-user');

          if (accessToken && userJson) {
            this.accessToken = accessToken || '';
            this.refreshToken = refreshToken || '';
            this.user = JSON.parse(userJson) || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' };
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
        currentUser: { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' },
        authHeader: {},
      };
    } catch (e) {
      console.error('getAuthStore error:', e);
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
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
