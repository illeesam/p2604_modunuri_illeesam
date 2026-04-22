/**
 * BO (Back Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 모든 초기화 데이터 API 호출
 * - 각 항목을 독립 store로 분산 저장
 * - 로딩 상태, 에러 처리 중앙 관리
 */
window.useBoAppInitStore = Pinia.defineStore('boAppInit', {
  state: () => {
    return {
      isLoading: false,
      lastFetchTime: null,
      error: null,
    };
  },

  getters: {
    isInitialized: (s) => {
      const userStore = window.useBoUserStore?.();
      return !!(userStore && userStore.user && userStore.user.userId);
    },
  },

  actions: {
    /**
     * BO 초기화 데이터 조회 (모든 항목)
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^user^role^menu^code^props^app")
     *                        빈 값이면 모든 항목 조회
     */
    async fetchBoAppInitData(names = '') {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      try {
        const params = {};
        if (names) {
          params.names = names;
        }

        const res = await window.boApi.post('/cm/bo-app-store/getInitData', names || '');

        if (res?.data?.data) {
          const data = res.data.data;

          // 각 항목을 해당 store에 분산 저장
          if (data.user) {
            const userStore = window.useBoUserStore?.();
            userStore?.setUser(data.user);
          }

          if (data.roles) {
            const roleStore = window.useBoRoleStore?.();
            roleStore?.setRoles(data.roles);
          }

          if (data.menus) {
            const menuStore = window.useBoMenuStore?.();
            menuStore?.setMenus(data.menus);
          }

          if (data.codes) {
            const codeStore = window.useBoCodeStore?.();
            codeStore?.setCodes(data.codes);
          }

          if (data.props) {
            const propStore = window.useBoPropStore?.();
            propStore?.setProps(data.props);
          }

          if (data.app) {
            const appStore = window.useBoAppStore?.();
            appStore?.setApp(data.app);
          }

          this.lastFetchTime = new Date().getTime();
        }
      } catch (err) {
        console.error('[boAppInitStore] fetchBoAppInitData error:', err);
        this.error = err.message || 'Failed to fetch init data';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 특정 항목만 조회
     */
    async fetchBoAppInitDataPartial(names) {
      return this.fetchBoAppInitData(names);
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    clearAll() {
      const userStore = window.useBoUserStore?.();
      const roleStore = window.useBoRoleStore?.();
      const menuStore = window.useBoMenuStore?.();
      const codeStore = window.useBoCodeStore?.();
      const propStore = window.useBoPropStore?.();
      const appStore = window.useBoAppStore?.();

      userStore?.clear();
      roleStore?.clear();
      menuStore?.clear();
      codeStore?.clear();
      propStore?.clear();
      appStore?.clear();

      this.lastFetchTime = null;
      this.error = null;
      this.isLoading = false;
    },

    /**
     * localStorage에서 복원
     */
    restoreFromStorage() {
      const userStore = window.useBoUserStore?.();
      return userStore?.restoreFromStorage() || false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoAppInitStore = () => {
  try {
    return window.useBoAppInitStore?.() || {
      isLoading: false,
      lastFetchTime: null,
      error: null,
      isInitialized: false,
    };
  } catch (e) {
    console.error('[getBoAppInitStore] error:', e);
    return {
      isLoading: false,
      lastFetchTime: null,
      error: null,
      isInitialized: false,
    };
  }
};
