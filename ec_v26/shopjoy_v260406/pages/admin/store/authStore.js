/**
 * 관리자 인증 Pinia 스토어
 * - 토큰 관리
 * - 로그인 사용자 정보
 * - 로그인/로그아웃
 */
(function () {
  if (!window.Pinia) {
    console.warn('[authStore] Pinia not loaded');
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
      currentUser: (state) => state.user,
      authHeader: (state) => state.token ? { Authorization: `Bearer ${state.token}` } : {},
    },

    actions: {
      // 로그인
      async login(email, password, authMethod = '메인') {
        try {
          const res = await window.adminApi.post('/auth/bo/auth/login', {
            email,
            password,
            authMethod,
          });

          this.user = res.data;
          this.token = res.data.accessToken;
          this.refreshToken = res.data.refreshToken;

          // localStorage 저장
          try {
            localStorage.setItem('modu-admin-token', this.token);
            localStorage.setItem('modu-admin-refresh', this.refreshToken);
            localStorage.setItem('modu-admin-user', JSON.stringify(this.user));
          } catch (_) {}

          return res.data;
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
          const res = await window.adminApi.post('/auth/bo/auth/refresh', {
            refreshToken: this.refreshToken,
          });

          this.token = res.data.accessToken;
          this.refreshToken = res.data.refreshToken;

          try {
            localStorage.setItem('modu-admin-token', this.token);
            localStorage.setItem('modu-admin-refresh', this.refreshToken);
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
            await window.adminApi.post('/auth/bo/auth/logout', {
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
          localStorage.removeItem('modu-admin-token');
          localStorage.removeItem('modu-admin-refresh');
          localStorage.removeItem('modu-admin-user');
        } catch (_) {}
      },

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          const token = localStorage.getItem('modu-admin-token');
          const refreshToken = localStorage.getItem('modu-admin-refresh');
          const userJson = localStorage.getItem('modu-admin-user');

          if (token && userJson) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = JSON.parse(userJson);
            return true;
          }
        } catch (_) {}
        return false;
      },
    },
  });
})();
