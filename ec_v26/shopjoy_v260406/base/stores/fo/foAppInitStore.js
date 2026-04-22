/**
 * FO (Front Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 모든 초기화 데이터 API 호출
 * - 각 항목을 독립 store로 분산 저장
 * - 로딩 상태, 에러 처리 중앙 관리
 */
window.useFoAppInitStore = Pinia.defineStore('foAppInit', {
  state: () => {
    return {
      isLoading: false,
      lastFetchTime: null,
      error: null,
    };
  },

  getters: {
    isInitialized: (s) => {
      const memberStore = window.useFoMemberStore?.();
      return !!(memberStore && memberStore.member && memberStore.member.memberId);
    },
  },

  actions: {
    /**
     * FO 초기화 데이터 조회 (모든 항목)
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^member^role^menu^code^props^disp^app")
     *                        빈 값이면 모든 항목 조회
     */
    async fetchFoAppInitData(names = '') {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      try {
        const res = await window.foApi.post('/co/cm/fo-app-store/getInitData', names || '');

        if (res?.data?.data) {
          const data = res.data.data;

          // 각 항목을 해당 store에 분산 저장
          if (data.auth) {
            const authStore = window.useFoAuthStore?.();
            authStore?.setAuth(data.auth);
          }

          if (data.member) {
            const memberStore = window.useFoMemberStore?.();
            memberStore?.setMember(data.member);
          }

          if (data.roles) {
            const roleStore = window.useFoRoleStore?.();
            roleStore?.setRoles(data.roles);
          }

          if (data.menus) {
            const menuStore = window.useFoMenuStore?.();
            menuStore?.setMenus(data.menus);
          }

          if (data.codes) {
            const codeStore = window.useFoCodeStore?.();
            codeStore?.setCodes(data.codes);
          }

          if (data.props) {
            const propStore = window.useFoPropStore?.();
            propStore?.setProps(data.props);
          }

          if (data.dispStruc || data.dispData) {
            const dispStore = window.useFoDispStore?.();
            dispStore?.setDispData({
              dispStruc: data.dispStruc,
              dispData: data.dispData,
            });
          }

          if (data.app) {
            const appStore = window.useFoAppStore?.();
            appStore?.setApp(data.app);
          }

          this.lastFetchTime = new Date().getTime();
        }
      } catch (err) {
        console.error('[foAppInitStore] fetchFoAppInitData error:', err);
        this.error = err.message || 'Failed to fetch init data';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 특정 항목만 조회
     */
    async fetchFoAppInitDataPartial(names) {
      return this.fetchFoAppInitData(names);
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    clearAll() {
      const authStore = window.useFoAuthStore?.();
      const memberStore = window.useFoMemberStore?.();
      const roleStore = window.useFoRoleStore?.();
      const menuStore = window.useFoMenuStore?.();
      const codeStore = window.useFoCodeStore?.();
      const propStore = window.useFoPropStore?.();
      const dispStore = window.useFoDispStore?.();
      const appStore = window.useFoAppStore?.();

      authStore?.clear();
      memberStore?.clear();
      roleStore?.clear();
      menuStore?.clear();
      codeStore?.clear();
      propStore?.clear();
      dispStore?.clear();
      appStore?.clear();

      this.lastFetchTime = null;
      this.error = null;
      this.isLoading = false;
    },

    /**
     * localStorage에서 복원
     */
    restoreFromStorage() {
      const memberStore = window.useFoMemberStore?.();
      return memberStore?.restoreFromStorage() || false;
    },
  },
});

// 함수형 유틸리티 제공
window.getFoAppInitStore = () => {
  try {
    return window.useFoAppInitStore?.() || {
      isLoading: false,
      lastFetchTime: null,
      error: null,
      isInitialized: false,
    };
  } catch (e) {
    console.error('[getFoAppInitStore] error:', e);
    return {
      isLoading: false,
      lastFetchTime: null,
      error: null,
      isInitialized: false,
    };
  }
};
