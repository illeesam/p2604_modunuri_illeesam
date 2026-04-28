/**
 * FO (Front Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 모든 초기화 데이터 API 호출
 * - 각 항목을 독립 store로 분산 저장
 * - 로딩 상태, 에러 처리 중앙 관리
 */
window.useFoAppInitStore = Pinia.defineStore('foAppInit', {
  state: () => {
    return {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
    };
  },

  getters: {
    svIsInitialized: (s) => {
      const authStore = window.useFoAuthStore?.();
      return !!(authStore && authStore.svAuthUser && authStore.svAuthUser.memberId);
    },
  },
  // FO: memberId가 authId와 동일하므로 memberId로 체크

  actions: {
    /**
     * FO 초기화 데이터 조회 (모든 항목)
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^roles^menus^codes^props^dpDisp^app")
     *                        "ALL" 또는 빈 값이면 모든 항목 조회
     */
    async sfFetchFoAppInitData(names = 'ALL') {
      if (this.svIsLoading) return;

      this.svIsLoading = true;
      this.svError = null;

      try {
        const res = await foApi.get(`/co/cm/fo-app-store/getInitData?names=${encodeURIComponent(names || 'ALL')}`, {
          headers: { 'X-UI-Nm': '시스템', 'X-Cmd-Nm': '초기화데이터조회' }
        });

        if (res?.data?.data) {
          const data = res.data.data;

          // 각 항목을 해당 store에 분산 저장 (백엔드 응답 키: syAuth[토큰+회원], syRoles, syMenus, syCodes, syProps, dpDisp, syApp)
          if (data.syAuth) {
            const authStore = window.useFoAuthStore?.();
            authStore?.sfSetAuth(data.syAuth);
          }

          if (data.syRoles) {
            const roleStore = window.useFoRoleStore?.();
            roleStore?.sfSetRoles(data.syRoles);
          }

          if (data.syMenus) {
            const menuStore = window.useFoMenuStore?.();
            menuStore?.sfSetMenus(data.syMenus);
          }

          if (data.syCodes) {
            const codeStore = window.useFoCodeStore?.();
            codeStore?.sfSetCodes(data.syCodes?.codes);
          }

          if (data.syProps) {
            const propStore = window.useFoPropStore?.();
            propStore?.sfSetProps(data.syProps);
          }

          if (data.dpDisp) {
            const dispStore = window.useFoDispStore?.();
            dispStore?.sfSetDispData({
              dispStruc: data.dpDisp.dpDispStructs,
              dispData: data.dpDisp.dpDispDatas,
              widgets: data.dpDisp.dpDispWidgets,
            });
          }

          if (data.syApp) {
            const appStore = window.useFoAppStore?.();
            appStore?.sfSetApp(data.syApp);
          }

          this.svLastFetchTime = new Date().getTime();
        }
      } catch (err) {
        console.error('[foAppInitStore] sfFetchFoAppInitData error:', err);
        this.svError = err.message || 'Failed to fetch init data';
        throw err;
      } finally {
        this.svIsLoading = false;
      }
    },

    /**
     * 특정 항목만 조회
     */
    async sfFetchFoAppInitDataPartial(names) {
      return this.sfFetchFoAppInitData(names);
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    sfClearAll() {
      const authStore = window.useFoAuthStore?.();
      const roleStore = window.useFoRoleStore?.();
      const menuStore = window.useFoMenuStore?.();
      const codeStore = window.useFoCodeStore?.();
      const propStore = window.useFoPropStore?.();
      const dispStore = window.useFoDispStore?.();
      const appStore = window.useFoAppStore?.();

      authStore?.sfClear();
      roleStore?.sfClear();
      menuStore?.sfClear();
      codeStore?.sfClear();
      propStore?.sfClear();
      dispStore?.sfClear();
      appStore?.sfClear();

      this.svLastFetchTime = null;
      this.svError = null;
      this.svIsLoading = false;
    },

    /**
     * localStorage에서 복원
     */
    sfRestoreFromStorage() {
      const authStore = window.useFoAuthStore?.();
      return authStore?.sfRestoreFromStorage() || false;
    },
  },
});

// 함수형 유틸리티 제공
window.getFoAppInitStore = () => {
  try {
    return window.useFoAppInitStore?.() || {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
      svIsInitialized: false,
    };
  } catch (e) {
    console.error('[getFoAppInitStore] error:', e);
    return {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
      svIsInitialized: false,
    };
  }
};
