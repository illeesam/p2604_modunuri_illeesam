/**
 * BO (Back Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 모든 초기화 데이터 API 호출
 * - 각 항목을 독립 store로 분산 저장
 * - 로딩 상태, 에러 처리 중앙 관리
 */
window.useBoAppInitStore = Pinia.defineStore('boAppInit', {
  state: () => {
    return {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
    };
  },

  getters: {
    svIsInitialized: (s) => {
      const authStore = window.useBoAuthStore?.();
      return !!(authStore && authStore.svAuthUser && authStore.svAuthUser.authId);
    },
  },

  actions: {
    /**
     * BO 초기화 데이터 조회 (모든 항목)
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^user^role^menu^code^props^app")
     *                        빈 값이면 모든 항목 조회
     */
    async sfFetchBoAppInitData(names = '') {
      if (this.svIsLoading) return;

      this.svIsLoading = true;
      this.svError = null;

      try {
        const res = await boApi.get(`/co/cm/bo-app-store/getInitData?names=${encodeURIComponent(names || '')}`, coUtil.apiHdr('시스템', '초기화데이터조회'));
        console.log('[boAppInitStore] API response:', res);

        if (res?.data?.data) {
          const data = res.data.data;
          console.log('[boAppInitStore] Init data:', data);

          // 각 항목을 해당 store에 분산 저장 (백엔드 응답 키: syAuth[토큰+사용자], syRoles, syMenus, syCodes, syProps, syApp)
          try {
            if (data.syAuth) {
              const authStore = window.useBoAuthStore?.();
              authStore?.sfSetAuth(data.syAuth);
            }

            if (data.syRoles) {
              const roleStore = window.useBoRoleStore?.();
              roleStore?.sfSetRoles(data.syRoles);
            }

            if (data.syMenus) {
              const menuStore = window.useBoMenuStore?.();
              menuStore?.sfSetMenus(data.syMenus);
            }

            if (data.syCodes) {
              const codeStore = window.useBoCodeStore?.();
              codeStore?.sfSetCodes(data.syCodes?.codes);
            }

            if (data.syProps) {
              const propStore = window.useBoPropStore?.();
              propStore?.sfSetProps(data.syProps);
            }

            if (data.syApp) {
              const appStore = window.useBoAppStore?.();
              appStore?.sfSetApp(data.syApp);
            }

            if (data.syPaths) {
              window._boCmPaths = data.syPaths?.paths || data.syPaths || [];
            }

            if (data.syMenus) {
              const menuStore = window.useBoMenuStore?.();
              menuStore?.sfSetMenus(data.syMenus);
              window._boCmMenus = data.syMenus?.menus || data.syMenus || [];
            }

            if (data.syDepts) {
              window._boCmDepts = data.syDepts?.depts || data.syDepts || [];
            }

            if (data.sySites) {
              window._boCmSites = data.sySites?.sites || data.sySites || [];
              if (window._boCmSites.length && boCommonFilter) {
                boCommonFilter.siteId = window._boCmSites[0]?.siteId ?? null;
              }
            }

            this.svLastFetchTime = new Date().getTime();
            console.log('[boAppInitStore] All data stored successfully');
          } catch (storeErr) {
            console.error('[boAppInitStore] Store operation error:', storeErr);
            throw storeErr;
          }
        } else {
          console.warn('[boAppInitStore] No data in response:', res);
        }
      } catch (err) {
        console.error('[boAppInitStore] sfFetchBoAppInitData error:', err);
        this.svError = err.message || 'Failed to fetch init data';
        throw err;
      } finally {
        this.svIsLoading = false;
      }
    },

    /**
     * 특정 항목만 조회
     */
    async sfFetchBoAppInitDataPartial(names) {
      return this.sfFetchBoAppInitData(names);
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    sfClearAll() {
      const authStore = window.useBoAuthStore?.();
      const roleStore = window.useBoRoleStore?.();
      const menuStore = window.useBoMenuStore?.();
      const codeStore = window.useBoCodeStore?.();
      const propStore = window.useBoPropStore?.();
      const appStore = window.useBoAppStore?.();

      authStore?.sfClear();
      roleStore?.sfClear();
      menuStore?.sfClear();
      codeStore?.sfClear();
      propStore?.sfClear();
      appStore?.sfClear();

      this.svLastFetchTime = null;
      this.svError = null;
      this.svIsLoading = false;
    },

    /**
     * localStorage에서 복원
     */
    sfRestoreFromStorage() {
      const authStore = window.useBoAuthStore?.();
      return authStore?.sfRestoreFromStorage() || false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoAppInitStore = () => {
  try {
    return window.useBoAppInitStore?.() || {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
      svIsInitialized: false,
    };
  } catch (e) {
    console.error('[getBoAppInitStore] error:', e);
    return {
      svIsLoading: false,
      svLastFetchTime: null,
      svError: null,
      svIsInitialized: false,
    };
  }
};
