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
      tempAuthInfo: null,
      get accessTokenInfo() {
        return this.accessToken ? `(${this.accessToken.length} bytes)` : '(empty)';
      },
      get refreshTokenInfo() {
        return this.refreshToken ? `(${this.refreshToken.length} bytes)` : '(empty)';
      },
    }),

    getters: {
      isLoggedIn: (state) => !!state.user && !!state.accessToken,
      currentUser: (state) => state.user || { boUserId: 0, name: '', email: '', role: '', phone: '', dept: '' },
      authHeader: (state) => (state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {}),
      accessTokenInfo: (state) => state.accessToken ? `(${state.accessToken.length} bytes)` : '(empty)',
      refreshTokenInfo: (state) => state.refreshToken ? `(${state.refreshToken.length} bytes)` : '(empty)',
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

          // 응답 구조: res.data = { ok: true, data: {...}, status: 200 }
          // ApiResponse<LoginRes> 형식이므로 res.data.data에 LoginRes가 있음
          const loginData = res.data?.data || {};
          console.log('[boAuthStore.login] full response:', JSON.stringify(res.data, null, 2));
          console.log('[boAuthStore.login] loginData:', JSON.stringify(loginData, null, 2));

          // LoginRes에서 토큰 추출
          if (loginData.accessToken) {
            this.accessToken = loginData.accessToken;
            console.log('[boAuthStore.login] accessToken set:', this.accessToken.substring(0, 20) + '...');
          }
          if (loginData.refreshToken) {
            this.refreshToken = loginData.refreshToken;
            console.log('[boAuthStore.login] refreshToken set:', this.refreshToken.substring(0, 20) + '...');
          }

          // user 정보: LoginRes에는 userId, siteId, roleId 등이 있음
          this.user = {
            boUserId: loginData.userId || 0,
            name: loginData.userName || '',
            email: loginData.userEmail || '',
            role: loginData.roleId || '',
            phone: loginData.userPhone || '',
            dept: loginData.userDept || '',
            siteId: loginData.siteId || '',
            roleId: loginData.roleId || '',
            userTypeCd: loginData.userTypeCd || ''
          };

          this.accessExpiresIn = loginData.accessExpiresIn || 3600;
          this.refreshExpiresIn = loginData.refreshExpiresIn || 604800;

          console.log('[boAuthStore.login] final state - accessToken length:', this.accessToken.length, 'refreshToken length:', this.refreshToken.length, 'user:', this.user);

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
            const initRes = await window.boApi.get('/co/cm/bo-app-store/getInitData?names=ALL');
            if (initRes?.data?.data) {
              const data = initRes.data.data;

              // syAuth (토큰 + 사용자)
              if (data.syAuth) {
                this.setAuth(data.syAuth);
              }

              // syUser (관리자 정보)
              const userStore = window.useUserStore?.();
              if (data.syUser) {
                userStore?.setUser(data.syUser);
              }

              // syRoles (권한)
              const roleStore = window.useBoRoleStore?.();
              if (data.syRoles) {
                roleStore?.setRoles(data.syRoles);
              }

              // syMenus (메뉴)
              const menuStore = window.useBoMenuStore?.();
              if (data.syMenus) {
                menuStore?.setMenus(data.syMenus);
              }

              // syCodes (공통 코드)
              const codeStore = window.useBoCodeStore?.();
              if (data.syCodes && data.syCodes.codes) {
                codeStore?.setCodes(data.syCodes.codes);
              }

              // syProps (시스템 속성)
              const propStore = window.useBoPropStore?.();
              if (data.syProps) {
                propStore?.setProps(data.syProps);
              }

              // syApp (앱 정보)
              const appStore = window.useBoAppStore?.();
              if (data.syApp) {
                appStore?.setApp(data.syApp);
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
        this.tempAuthInfo = null;

        try {
          localStorage.removeItem('modu-bo-access_token');
          localStorage.removeItem('modu-bo-refresh_token');
          localStorage.removeItem('modu-bo-user');
          localStorage.removeItem('modu-bo-tempAuthInfo');
        } catch (_) {}
      },

      // 인증 정보 설정 (토큰 + 사용자 정보)
      setAuth(authData) {
        if (authData) {
          // 기존 토큰이 있으면 유지, 새 토큰이 있으면 업데이트
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
            if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
            if (this.user) localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
            if (this.accessExpiresIn) localStorage.setItem('modu-bo-access_expires_in', this.accessExpiresIn.toString());
            if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refresh_expires_in', this.refreshExpiresIn.toString());
            if (this.tempAuthInfo) localStorage.setItem('modu-bo-tempAuthInfo', JSON.stringify(this.tempAuthInfo));
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
