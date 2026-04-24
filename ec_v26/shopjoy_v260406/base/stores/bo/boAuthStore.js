/**
 * BO 인증 Pinia 스토어 + 함수형 유틸리티
 * - 토큰 관리
 * - 로그인 사용자 정보
 * - 로그인/로그아웃
 *
 * user 객체 필드 규칙:
 *   authId      : 인증 식별자 (BO = sy_user.user_id), JWT subject와 동일
 *   userId      : sy_user.user_id (authId와 동일값, 명시적 접근용)
 *   memberId    : null (FO 전용)
 *   userTypeCd  : "BO"
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boAuthStore] Pinia not loaded');
    return;
  }

  const { defineStore } = Pinia;

  const _defaultUser = () => ({
    authId: '',       // 인증 식별자 (sy_user.user_id)
    userId: '',       // BO 전용: sy_user.user_id
    memberId: null,   // FO 전용: BO는 null
    userTypeCd: 'BO',
    name: '',
    email: '',
    role: '',
    phone: '',
    dept: '',
    siteId: '',
    roleId: '',
  });

  window.useBoAuthStore = defineStore('boAuth', {
    state: () => ({
      user: _defaultUser(),
      accessToken: '',
      refreshToken: '',
      accessExpiresIn: 0,
      refreshExpiresIn: 0,
      tempAuthInfo: null,
    }),

    getters: {
      isLoggedIn: (state) => !!(state.user?.userId) && !!state.accessToken,
      currentUser: (state) => state.user || _defaultUser(),
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

          const loginData = res.data?.data || {};
          console.log('[boAuthStore.login] loginData:', JSON.stringify(loginData, null, 2));

          if (loginData.accessToken) {
            this.accessToken = loginData.accessToken;
          }
          if (loginData.refreshToken) {
            this.refreshToken = loginData.refreshToken;
          }

          // authId: BO = sy_user.user_id (backend LoginRes.authId)
          const authId = loginData.authId || loginData.userId || '';
          this.user = {
            authId,
            userId: authId,       // BO 전용
            memberId: null,       // FO 전용: BO는 null
            userTypeCd: loginData.userTypeCd || 'BO',
            name: loginData.userNm || loginData.userName || '',
            email: loginData.userEmail || '',
            role: loginData.roleId || '',
            phone: loginData.userPhone || '',
            dept: loginData.userDept || '',
            siteId: loginData.siteId || '',
            roleId: loginData.roleId || '',
          };

          this.accessExpiresIn = loginData.accessExpiresIn || 3600;
          this.refreshExpiresIn = loginData.refreshExpiresIn || 604800;

          console.log('[boAuthStore.login] user:', this.user);

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

              if (data.syAuth) this.setAuth(data.syAuth);
              if (data.syUser) this.setUser(data.syUser);

              const roleStore = window.useBoRoleStore?.();
              if (data.syRoles) roleStore?.setRoles(data.syRoles);

              const menuStore = window.useBoMenuStore?.();
              if (data.syMenus) menuStore?.setMenus(data.syMenus);

              const codeStore = window.useBoCodeStore?.();
              if (data.syCodes?.codes) codeStore?.setCodes(data.syCodes.codes);

              const propStore = window.useBoPropStore?.();
              if (data.syProps) propStore?.setProps(data.syProps);

              const appStore = window.useBoAppStore?.();
              if (data.syApp) appStore?.setApp(data.syApp);

              console.log('[boAuthStore.login] init data loaded');
            }
          } catch (e) {
            console.warn('[boAuthStore.login] getInitData failed:', e);
          }

          return this.user || {};
        } catch (err) {
          this.reset();
          throw err;
        }
      },

      // 토큰 갱신
      async refreshAccessToken() {
        if (!this.refreshToken) { this.reset(); return false; }
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
            await window.boApi.post('/auth/bo/auth/logout', { refreshToken: this.refreshToken });
          } catch (_) {}
        }
        this.reset();
      },

      // 초기화
      reset() {
        this.user = _defaultUser();
        this.accessToken = '';
        this.refreshToken = '';
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
        if (!authData) return;
        if (authData.accessToken) this.accessToken = authData.accessToken;
        if (authData.refreshToken) this.refreshToken = authData.refreshToken;
        if (authData.accessExpiresIn) this.accessExpiresIn = authData.accessExpiresIn;
        if (authData.refreshExpiresIn) this.refreshExpiresIn = authData.refreshExpiresIn;
        if (authData.user) this.user = authData.user;
        if (authData.tempAuthInfo !== undefined) this.tempAuthInfo = authData.tempAuthInfo;
        try {
          if (this.accessToken) localStorage.setItem('modu-bo-access_token', this.accessToken);
          if (this.refreshToken) localStorage.setItem('modu-bo-refresh_token', this.refreshToken);
          if (this.user) localStorage.setItem('modu-bo-user', JSON.stringify(this.user));
          if (this.accessExpiresIn) localStorage.setItem('modu-bo-access_expires_in', this.accessExpiresIn.toString());
          if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refresh_expires_in', this.refreshExpiresIn.toString());
          if (this.tempAuthInfo) localStorage.setItem('modu-bo-tempAuthInfo', JSON.stringify(this.tempAuthInfo));
        } catch (_) {}
      },

      // 사용자 정보 설정
      setUser(userData) {
        if (!userData) return;
        this.user = userData;
        try {
          localStorage.setItem('modu-bo-user', JSON.stringify(userData));
        } catch (_) {}
      },

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          const accessToken  = localStorage.getItem('modu-bo-access_token');
          const refreshToken = localStorage.getItem('modu-bo-refresh_token');
          const userJson     = localStorage.getItem('modu-bo-user');
          const accessExpiresIn  = localStorage.getItem('modu-bo-access_expires_in');
          const refreshExpiresIn = localStorage.getItem('modu-bo-refresh_expires_in');

          if (accessToken && userJson) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken || '';
            this.user = Object.assign(_defaultUser(), JSON.parse(userJson) || {});
            this.accessExpiresIn = accessExpiresIn ? parseInt(accessExpiresIn) : 0;
            this.refreshExpiresIn = refreshExpiresIn ? parseInt(refreshExpiresIn) : 0;
            return true;
          }
        } catch (_) {}
        return false;
      },

      // clear (ZdStore에서 호출)
      clear() { this.reset(); },
    },
  });

  // localStorage 변화 감지
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'modu-bo-access_token' || e.key === 'modu-bo-user' || e.key === 'modu-bo-refresh_token') {
        const store = window.useBoAuthStore?.();
        if (store) {
          const accessToken = localStorage.getItem('modu-bo-access_token');
          if (!accessToken) store.reset();
          else store.restoreFromStorage();
        }
      }
    });
  }

  // 함수형 유틸리티
  window.getBoAuthStore = () => {
    try {
      return window.useBoAuthStore?.() || {
        user: _defaultUser(), accessToken: '', refreshToken: '',
        isLoggedIn: false, accessExpiresIn: 0, refreshExpiresIn: 0,
        currentUser: _defaultUser(), authHeader: {},
      };
    } catch (e) {
      console.error('getBoAuthStore error:', e);
      return {
        user: _defaultUser(), accessToken: '', refreshToken: '',
        accessExpiresIn: 0, refreshExpiresIn: 0, isLoggedIn: false,
        currentUser: _defaultUser(), authHeader: {},
      };
    }
  };

  window.getBoAuthUser = () => {
    try {
      const store = window.useBoAuthStore?.();
      return (store?.user?.userId) ? store.user : _defaultUser();
    } catch (e) { return _defaultUser(); }
  };

  window.getBoAuthToken = () => {
    try { return window.useBoAuthStore?.()?.accessToken || ''; }
    catch (e) { return ''; }
  };

  window.isBoAuthLoggedIn = () => {
    try {
      const store = window.useBoAuthStore?.();
      return !!(store?.user?.userId && store?.accessToken);
    } catch (e) { return false; }
  };

  window.isBoLogin = () => {
    try {
      const store = window.useBoAuthStore?.();
      if (!store?.user) return false;
      return !!(store.user.userId && store.accessToken);
    } catch (e) { return false; }
  };
})();
