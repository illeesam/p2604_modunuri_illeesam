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
      token: null,
      refreshToken: null,
    }),

    getters: {
      isLoggedIn: (state) => !!state.user && !!state.token,
      currentUser: (state) => state.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' },
      authHeader: (state) => (state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    },

    actions: {
      // 로그인
      async login(loginName, loginPwd, authMethod = '메인') {
        try {
          const res = await window.boApi.post('/auth/bo/auth/login', {
            loginName,
            loginPwd,
            authMethod,
          });

          this.user = res.data || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' };
          this.token = res.data?.accessToken || '';
          this.refreshToken = res.data?.refreshToken || '';

          // localStorage 저장
          try {
            if (this.token) localStorage.setItem('modu-bo-token', this.token);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh', this.refreshToken);
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

          this.token = res.data?.accessToken || '';
          this.refreshToken = res.data?.refreshToken || '';

          try {
            if (this.token) localStorage.setItem('modu-bo-token', this.token);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh', this.refreshToken);
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
        this.token = null;
        this.refreshToken = null;

        try {
          localStorage.removeItem('modu-bo-token');
          localStorage.removeItem('modu-bo-refresh');
          localStorage.removeItem('modu-bo-user');
        } catch (_) {}
      },

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          const token = localStorage.getItem('modu-bo-token');
          const refreshToken = localStorage.getItem('modu-bo-refresh');
          const userJson = localStorage.getItem('modu-bo-user');

          if (token && userJson) {
            this.token = token || '';
            this.refreshToken = refreshToken || '';
            this.user = JSON.parse(userJson) || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' };
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
      if (e.key === 'modu-bo-token' || e.key === 'modu-bo-user' || e.key === 'modu-bo-refresh') {
        const store = window.useAuthStore?.();
        if (store) {
          const token = localStorage.getItem('modu-bo-token');
          if (!token) {
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
        token: null,
        refreshToken: null,
        isLoggedIn: false,
        currentUser: { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' },
        authHeader: {},
      };
    } catch (e) {
      console.error('getAuthStore error:', e);
      return {
        user: null,
        token: null,
        refreshToken: null,
        isLoggedIn: false,
        currentUser: { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' },
        authHeader: {},
      };
    }
  };

  window.getAuthUser = () => {
    try {
      const store = window.useAuthStore?.();
      return store?.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' };
    } catch (e) {
      console.error('getAuthUser error:', e);
      return { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '', password: '' };
    }
  };

  window.getAuthToken = () => {
    try {
      const store = window.useAuthStore?.();
      return store?.token || '';
    } catch (e) {
      console.error('getAuthToken error:', e);
      return '';
    }
  };

  window.isAuthLoggedIn = () => {
    try {
      const store = window.useAuthStore?.();
      return !!(store?.user && store?.token);
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
