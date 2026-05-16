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
 *   AppTypeCd  : "BO"
 */
(function () {
  if (!window.Pinia) {
    console.warn('[boAuthStore] Pinia not loaded');
    return;
  }

  const { defineStore } = Pinia;

  /* _defaultAuthUser */
  const _defaultAuthUser = () => ({
    authId: '',       // 인증 식별자 (sy_user.user_id)
    authNm: '',       // 인증 사용자명 (sy_user.user_nm)
    userId: '',       // BO 전용: sy_user.user_id
    memberId: null,   // FO 전용: BO는 null
    AppTypeCd: 'BO',
    name: '',
    email: '',
    role: '',
    phone: '',
    dept: '',
    siteId: '',
    roleId: '',
    profileAttachId: null,
  });

  window.useBoAuthStore = defineStore('boAuth', {
    state: () => ({
      svAuthUser: _defaultAuthUser(),
      svAccessToken: '',
      svRefreshToken: '',
      svAccessExpiresIn: 0,
      svRefreshExpiresIn: 0,
      svTempAuthInfo: null,
    }),

    getters: {
      sgIsLoggedIn: (state) => !!(state.svAuthUser?.authId) && !!state.svAccessToken,
      sgCurrentUser: (state) => state.svAuthUser || _defaultAuthUser(),
      sgAuthHeader: (state) => (state.svAccessToken ? { Authorization: `Bearer ${state.svAccessToken}` } : {}),
    },

    actions: {
      // 로그인
      async saLogin(loginId, loginPwd, authMethod = '메인') {
        try {
          const loginPwdHash = await coUtil.sha256(loginPwd);
          const res = await coApiSvc.boAuth.login({ loginId, loginPwd: loginPwdHash, authMethod }, '로그인', '이메일로그인');

          const loginData = res.data?.data || {};

          if (loginData.accessToken) {
            this.svAccessToken = loginData.accessToken;
          }
          if (loginData.refreshToken) {
            this.svRefreshToken = loginData.refreshToken;
          }

          // authId: BO = sy_user.user_id (backend LoginRes.authId)
          const authId = loginData.authId || loginData.userId || '';
          this.svAuthUser = {
            authId,
            userId: authId,       // BO 전용
            memberId: null,       // FO 전용: BO는 null
            AppTypeCd: loginData.AppTypeCd || 'BO',
            authNm: loginData.userNm || '',
            name: loginData.userNm || '',
            email: loginData.userEmail || '',
            role: loginData.roleId || '',
            phone: loginData.userPhone || '',
            dept: loginData.deptNm || loginData.userDept || '',
            siteId: loginData.siteId || '',
            roleId: loginData.roleId || '',
            profileAttachId: loginData.profileAttachId || null,
          };

          this.svAccessExpiresIn = loginData.accessExpiresIn || 3600;
          this.svRefreshExpiresIn = loginData.refreshExpiresIn || 604800;


          try {
            if (this.svAccessToken) localStorage.setItem('modu-bo-accessToken', this.svAccessToken);
            if (this.svRefreshToken) localStorage.setItem('modu-bo-refreshToken', this.svRefreshToken);
            if (this.svAuthUser) localStorage.setItem('modu-bo-authUser', JSON.stringify(this.svAuthUser));
            if (this.svAccessExpiresIn) localStorage.setItem('modu-bo-accessExpiresIn', this.svAccessExpiresIn.toString());
            if (this.svRefreshExpiresIn) localStorage.setItem('modu-bo-refreshExpiresIn', this.svRefreshExpiresIn.toString());
          } catch (_) {}

          /* 로그인 후 초기 데이터 조회 */
          try {
            const initRes = await coApiSvc.cmBoAppStore.getInitData('ALL', '시스템', '초기화데이터조회');
            if (initRes?.data?.data) {
              const data = initRes.data.data;

              if (data.syAuth) this.saSetAuth(data.syAuth);
              if (data.syUser) this.saSetAuthUser(data.syUser);

              const roleStore = window.useBoRoleStore?.();
              if (data.syRoles) roleStore?.saSetRoles(data.syRoles);

              const menuStore = window.useBoMenuStore?.();
              if (data.syMenus) menuStore?.saSetMenus(data.syMenus);

              const codeStore = window.useBoCodeStore?.();
              if (data.syCodes?.codes) codeStore?.saSetCodes(data.syCodes.codes);

              const propStore = window.useBoPropStore?.();
              if (data.syProps) propStore?.saSetProps(data.syProps);

              const appStore = window.useBoAppStore?.();
              if (data.syApp) appStore?.saSetApp(data.syApp);

            }
          } catch (e) {
            console.warn('[boAuthStore.saLogin] getInitData failed:', e);
          }

          return this.svAuthUser || {};
        } catch (err) {
          this.saReset();
          throw err;
        }
      },

      // 토큰 갱신
      async saRefreshAccessToken() {
        if (!this.svRefreshToken) { this.saReset(); return false; }
        try {
          const res = await coApiSvc.boAuth.tokenRefresh({ refreshToken: this.svRefreshToken }, '로그인', '토큰갱신');
          this.svAccessToken = res.data?.accessToken || '';
          this.svRefreshToken = res.data?.refreshToken || '';
          this.svAccessExpiresIn = res.data?.accessExpiresIn || 0;
          this.svRefreshExpiresIn = res.data?.refreshExpiresIn || 0;
          try {
            if (this.svAccessToken) localStorage.setItem('modu-bo-accessToken', this.svAccessToken);
            if (this.svRefreshToken) localStorage.setItem('modu-bo-refreshToken', this.svRefreshToken);
          } catch (_) {}
          return true;
        } catch (err) {
          this.saReset();
          return false;
        }
      },

      // 로그아웃
      async saLogout() {
        if (this.svRefreshToken) {
          try {
            await coApiSvc.boAuth.logout({ refreshToken: this.svRefreshToken }, '로그인', '로그아웃');
          } catch (_) {}
        }
        this.saReset();
      },

      // 초기화
      saReset() {
        this.svAuthUser = _defaultAuthUser();
        this.svAccessToken = '';
        this.svRefreshToken = '';
        this.svTempAuthInfo = null;
        try {
          localStorage.removeItem('modu-bo-accessToken');
          localStorage.removeItem('modu-bo-refreshToken');
          localStorage.removeItem('modu-bo-authUser');
          localStorage.removeItem('modu-bo-tempAuthInfo');
        } catch (_) {}
      },

      // 인증 정보 설정 (토큰 + 사용자 정보)
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
          if (this.svAccessToken) localStorage.setItem('modu-bo-accessToken', this.svAccessToken);
          if (this.svRefreshToken) localStorage.setItem('modu-bo-refreshToken', this.svRefreshToken);
          if (this.svAuthUser) localStorage.setItem('modu-bo-authUser', JSON.stringify(this.svAuthUser));
          if (this.svAccessExpiresIn) localStorage.setItem('modu-bo-accessExpiresIn', this.svAccessExpiresIn.toString());
          if (this.svRefreshExpiresIn) localStorage.setItem('modu-bo-refreshExpiresIn', this.svRefreshExpiresIn.toString());
          if (this.svTempAuthInfo) localStorage.setItem('modu-bo-tempAuthInfo', JSON.stringify(this.svTempAuthInfo));
        } catch (_) {}
      },

      // 사용자 정보 설정 (StoreUser → 프론트 authUser 형식으로 정규화)
      saSetAuthUser(authUserData) {
        if (!authUserData) return;
        const authId = authUserData.authId || authUserData.userId || '';
        this.svAuthUser = {
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
          localStorage.setItem('modu-bo-authUser', JSON.stringify(this.svAuthUser));
        } catch (_) {}
      },

      // localStorage에서 복원
      saRestoreFromStorage() {
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
            this.svAccessToken = accessToken;
            this.svRefreshToken = refreshToken || '';
            this.svAuthUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            this.svAccessExpiresIn = accessExpiresIn ? parseInt(accessExpiresIn) : 0;
            this.svRefreshExpiresIn = refreshExpiresIn ? parseInt(refreshExpiresIn) : 0;
            return true;
          }
        } catch (_) {}
        return false;
      },

      // FO syncFromStorage와 동일: 토큰 없으면 리셋, 있으면 복원 (이전 값과 동일하면 reactive 갱신 스킵)
      saSyncFromStorage() {
        try {
          const token        = localStorage.getItem('modu-bo-accessToken')  || '';
          const refreshToken = localStorage.getItem('modu-bo-refreshToken') || '';
          const authUserJson = localStorage.getItem('modu-bo-authUser')     || '';
          if (this.svAccessToken === token
              && this.svRefreshToken === refreshToken
              && this._lastAuthUserJson === authUserJson) {
            return !!token;
          }
          this._lastAuthUserJson = authUserJson;
          if (token) {
            if (this.svAccessToken !== token) this.svAccessToken = token;
            if (refreshToken && this.svRefreshToken !== refreshToken) this.svRefreshToken = refreshToken;
            if (authUserJson) this.svAuthUser = Object.assign(_defaultAuthUser(), JSON.parse(authUserJson) || {});
            else this.svAuthUser = _defaultAuthUser();
          } else {
            if (this.svAccessToken)  this.svAccessToken = '';
            if (this.svRefreshToken) this.svRefreshToken = '';
            this.svAuthUser = _defaultAuthUser();
          }
          return !!token;
        } catch (e) {
          console.error('[boAuthStore] saSyncFromStorage error:', e);
          return false;
        }
      },

      // clear (ZdStore에서 호출)
      saClear() { this.saReset(); },
    },
  });

  // localStorage 변화 감지
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'modu-bo-accessToken' || e.key === 'modu-bo-authUser' || e.key === 'modu-bo-refreshToken') {
        const store = window.useBoAuthStore?.();
        if (store) store.saSyncFromStorage();
      }
    });
  }

  // 함수형 유틸리티
  window.sfGetBoAuthStore = () => {
    try {
      return window.useBoAuthStore?.() || {
        svAuthUser: _defaultAuthUser(), svAccessToken: '', svRefreshToken: '',
        sgIsLoggedIn: false, svAccessExpiresIn: 0, svRefreshExpiresIn: 0,
        sgCurrentUser: _defaultAuthUser(), sgAuthHeader: {},
      };
    } catch (e) {
      console.error('sfGetBoAuthStore error:', e);
      return {
        svAuthUser: _defaultAuthUser(), svAccessToken: '', svRefreshToken: '',
        svAccessExpiresIn: 0, svRefreshExpiresIn: 0, sgIsLoggedIn: false,
        sgCurrentUser: _defaultAuthUser(), sgAuthHeader: {},
      };
    }
  };

  window.sfGetBoAuthUser = () => {
    try {
      const store = window.useBoAuthStore?.();
      return (store?.svAuthUser?.authId) ? store.svAuthUser : _defaultAuthUser();
    } catch (e) { return _defaultAuthUser(); }
  };

  window.sfGetBoAuthToken = () => {
    try { return window.useBoAuthStore?.()?.svAccessToken || ''; }
    catch (e) { return ''; }
  };

  window.sfIsBoAuthLoggedIn = () => {
    try {
      const store = window.useBoAuthStore?.();
      return !!(store?.svAuthUser?.authId && store?.svAccessToken);
    } catch (e) { return false; }
  };

  window.sfIsBoLogin = () => {
    try {
      const store = window.useBoAuthStore?.();
      if (!store?.svAuthUser) return false;
      return !!(store.svAuthUser.authId && store.svAccessToken);
    } catch (e) { return false; }
  };
})();
