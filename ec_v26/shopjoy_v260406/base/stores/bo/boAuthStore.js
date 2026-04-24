/**
 * BO 인증 Pinia 스토어 + 함수형 유틸리티
 * - 토큰 관리
 * - 로그인 사용자 정보
 * - 로그인/로그아웃
 *
 * authUser 객체 필드 규칙:
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

  const _defaultAuthUser = () => ({
    authId: '',       // 인증 식별자 (sy_user.user_id)
    authNm: '',       // 인증 사용자명 (sy_user.user_nm)
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
      authUser: _defaultAuthUser(),
      accessToken: '',
      refreshToken: '',
      accessExpiresIn: 0,
      refreshExpiresIn: 0,
      tempAuthInfo: null,
    }),

    getters: {
      isLoggedIn: (state) => !!(state.authUser?.authId) && !!state.accessToken,
      currentUser: (state) => state.authUser || _defaultAuthUser(),
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

          if (loginData.accessToken) {
            this.accessToken = loginData.accessToken;
          }
          if (loginData.refreshToken) {
            this.refreshToken = loginData.refreshToken;
          }

          // authId: BO = sy_user.user_id (backend LoginRes.authId)
          const authId = loginData.authId || loginData.userId || '';
          this.authUser = {
            authId,
            userId: authId,       // BO 전용
            memberId: null,       // FO 전용: BO는 null
            userTypeCd: loginData.userTypeCd || 'BO',
            name: loginData.userNm || '',
            email: loginData.userEmail || '',
            role: loginData.roleId || '',
            phone: loginData.userPhone || '',
            dept: loginData.userDept || '',
            siteId: loginData.siteId || '',
            roleId: loginData.roleId || '',
          };

          this.accessExpiresIn = loginData.accessExpiresIn || 3600;
          this.refreshExpiresIn = loginData.refreshExpiresIn || 604800;


          try {
            if (this.accessToken) localStorage.setItem('modu-bo-accessToken', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refreshToken', this.refreshToken);
            if (this.authUser) localStorage.setItem('modu-bo-authUser', JSON.stringify(this.authUser));
            if (this.accessExpiresIn) localStorage.setItem('modu-bo-accessExpiresIn', this.accessExpiresIn.toString());
            if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refreshExpiresIn', this.refreshExpiresIn.toString());
          } catch (_) {}

          /* 로그인 후 초기 데이터 조회 */
          try {
            const initRes = await window.boApi.get('/co/cm/bo-app-store/getInitData?names=ALL');
            if (initRes?.data?.data) {
              const data = initRes.data.data;

              if (data.syAuth) this.setAuth(data.syAuth);
              if (data.syUser) this.setAuthUser(data.syUser);

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

            }
          } catch (e) {
            console.warn('[boAuthStore.login] getInitData failed:', e);
          }

          return this.authUser || {};
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
            if (this.accessToken) localStorage.setItem('modu-bo-accessToken', this.accessToken);
            if (this.refreshToken) localStorage.setItem('modu-bo-refreshToken', this.refreshToken);
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
        this.authUser = _defaultAuthUser();
        this.accessToken = '';
        this.refreshToken = '';
        this.tempAuthInfo = null;
        try {
          localStorage.removeItem('modu-bo-accessToken');
          localStorage.removeItem('modu-bo-refreshToken');
          localStorage.removeItem('modu-bo-authUser');
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
        if (authData.authUser) this.authUser = authData.authUser;
        else if (authData.user) this.setAuthUser(authData.user); // StoreAuth.user 필드 호환
        if (authData.tempAuthInfo !== undefined) this.tempAuthInfo = authData.tempAuthInfo;
        try {
          if (this.accessToken) localStorage.setItem('modu-bo-accessToken', this.accessToken);
          if (this.refreshToken) localStorage.setItem('modu-bo-refreshToken', this.refreshToken);
          if (this.authUser) localStorage.setItem('modu-bo-authUser', JSON.stringify(this.authUser));
          if (this.accessExpiresIn) localStorage.setItem('modu-bo-accessExpiresIn', this.accessExpiresIn.toString());
          if (this.refreshExpiresIn) localStorage.setItem('modu-bo-refreshExpiresIn', this.refreshExpiresIn.toString());
          if (this.tempAuthInfo) localStorage.setItem('modu-bo-tempAuthInfo', JSON.stringify(this.tempAuthInfo));
        } catch (_) {}
      },

      // 사용자 정보 설정 (StoreUser → 프론트 authUser 형식으로 정규화)
      setAuthUser(authUserData) {
        if (!authUserData) return;
        const authId = authUserData.authId || authUserData.userId || '';
        this.authUser = {
          ...authUserData,
          authId,
          userId: authId,
          name:   authUserData.name || authUserData.userNm || '',
          email:  authUserData.email || authUserData.userEmail || '',
          phone:  authUserData.phone || authUserData.userHpNo || authUserData.userPhone || '',
          dept:   authUserData.dept || authUserData.deptNm || '',
          role:   authUserData.role || authUserData.roleId || '',
        };
        try {
          localStorage.setItem('modu-bo-authUser', JSON.stringify(this.authUser));
        } catch (_) {}
      },

      // localStorage에서 복원
      restoreFromStorage() {
        try {
          // 구 key 마이그레이션: modu-bo-user → modu-bo-authUser
          const _oldUser = localStorage.getItem('modu-bo-user');
          if (_oldUser && !localStorage.getItem('modu-bo-authUser')) {
            localStorage.setItem('modu-bo-authUser', _oldUser);
          }
          if (_oldUser) localStorage.removeItem('modu-bo-user');
        } catch (_) {}
        try {
          const accessToken      = localStorage.getItem('modu-bo-accessToken');
          const refreshToken     = localStorage.getItem('modu-bo-refreshToken');
          const authUserJson     = localStorage.getItem('modu-bo-authUser');
          const accessExpiresIn  = localStorage.getItem('modu-bo-accessExpiresIn');
          const refreshExpiresIn = localStorage.getItem('modu-bo-refreshExpiresIn');

          if (accessToken && authUserJson) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken || '';
            this.authUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            this.accessExpiresIn = accessExpiresIn ? parseInt(accessExpiresIn) : 0;
            this.refreshExpiresIn = refreshExpiresIn ? parseInt(refreshExpiresIn) : 0;
            return true;
          }
        } catch (_) {}
        return false;
      },

      // FO syncFromStorage와 동일: 토큰 없으면 리셋, 있으면 복원
      syncFromStorage() {
        try {
          const token        = localStorage.getItem('modu-bo-accessToken');
          const refreshToken = localStorage.getItem('modu-bo-refreshToken');
          const authUserJson = localStorage.getItem('modu-bo-authUser');
          if (token) {
            this.accessToken = token;
            if (refreshToken) this.refreshToken = refreshToken;
            if (authUserJson) this.authUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            else this.authUser = _defaultAuthUser();
          } else {
            this.accessToken = '';
            this.refreshToken = '';
            this.authUser = _defaultAuthUser();
          }
          return !!token;
        } catch (e) {
          console.error('[boAuthStore] syncFromStorage error:', e);
          return false;
        }
      },

      // clear (ZdStore에서 호출)
      clear() { this.reset(); },
    },
  });

  // localStorage 변화 감지
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'modu-bo-accessToken' || e.key === 'modu-bo-authUser' || e.key === 'modu-bo-refreshToken') {
        const store = window.useBoAuthStore?.();
        if (store) store.syncFromStorage();
      }
    });
  }

  // 함수형 유틸리티
  window.getBoAuthStore = () => {
    try {
      return window.useBoAuthStore?.() || {
        authUser: _defaultAuthUser(), accessToken: '', refreshToken: '',
        isLoggedIn: false, accessExpiresIn: 0, refreshExpiresIn: 0,
        currentUser: _defaultAuthUser(), authHeader: {},
      };
    } catch (e) {
      console.error('getBoAuthStore error:', e);
      return {
        authUser: _defaultAuthUser(), accessToken: '', refreshToken: '',
        accessExpiresIn: 0, refreshExpiresIn: 0, isLoggedIn: false,
        currentUser: _defaultAuthUser(), authHeader: {},
      };
    }
  };

  window.getBoAuthUser = () => {
    try {
      const store = window.useBoAuthStore?.();
      return (store?.authUser?.authId) ? store.authUser : _defaultAuthUser();
    } catch (e) { return _defaultAuthUser(); }
  };

  window.getBoAuthToken = () => {
    try { return window.useBoAuthStore?.()?.accessToken || ''; }
    catch (e) { return ''; }
  };

  window.isBoAuthLoggedIn = () => {
    try {
      const store = window.useBoAuthStore?.();
      return !!(store?.authUser?.authId && store?.accessToken);
    } catch (e) { return false; }
  };

  window.isBoLogin = () => {
    try {
      const store = window.useBoAuthStore?.();
      if (!store?.authUser) return false;
      return !!(store.authUser.authId && store.accessToken);
    } catch (e) { return false; }
  };
})();
