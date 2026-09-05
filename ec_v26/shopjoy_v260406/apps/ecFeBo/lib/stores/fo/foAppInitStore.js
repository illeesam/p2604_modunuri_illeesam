/**
 * FO (Front Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 모든 초기화 데이터 API 호출
 * - 각 항목을 독립 store로 분산 저장
 * - 로딩 상태, 에러 처리 중앙 관리
 */
/* 로그아웃 시 비울 스토어들 — saClearAll 이 순회한다 */
const _FO_CLEAR_STORES = [
  'useFoAuthStore', 'useFoRoleStore', 'useFoMenuStore',
  'useFoCodeStore', 'useFoPropStore', 'useFoDispStore', 'useFoAppStore',
];

window.useFoAppInitStore = Pinia.defineStore('foAppInit', {
  state: () => ({
    svIsLoading: false,   // 중복 조회 방지 가드
  }),

  actions: {
    /**
     * FO 초기화 데이터 조회 (모든 항목)
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^roles^menus^codes^props^dpDisp^app")
     *                        "ALL" 또는 빈 값이면 모든 항목 조회
     */
    async saFetchFoAppInitData(names = 'ALL') {
      if (this.svIsLoading) return;

      this.svIsLoading = true;

      try {
        const res = await coApiSvc.cmFoAppStore.getInitData(names || 'ALL', '시스템', '초기화데이터조회');

        if (res?.data?.data) {
          const data = res.data.data;

          // 각 항목을 해당 store에 분산 저장 (백엔드 응답 키: syAuth[토큰+회원], syRoles, syMenus, syCodes, syProps, dpDisp, syApp)
          if (data.syAuth) {
            const authStore = window.useFoAuthStore?.();
            authStore?.saSetAuth(data.syAuth);
          }

          if (data.syRoles) {
            const roleStore = window.useFoRoleStore?.();
            roleStore?.saSetRoles(data.syRoles);
          }

          if (data.syMenus) {
            const menuStore = window.useFoMenuStore?.();
            menuStore?.saSetMenus(data.syMenus);
          }

          if (data.syCodes) {
            const codeStore = window.useFoCodeStore?.();
            codeStore?.saSetCodes(data.syCodes?.codes);
          }

          if (data.syProps) {
            const propStore = window.useFoPropStore?.();
            propStore?.saSetProps(data.syProps);
          }

          if (data.dpDisp) {
            const dispStore = window.useFoDispStore?.();
            dispStore?.saSetDispData({
              dispStruc: data.dpDisp.dpDispStructs,
              dispData: data.dpDisp.dpDispDatas,
              widgets: data.dpDisp.dpDispWidgets,
            });
          }

          if (data.syApp) {
            const appStore = window.useFoAppStore?.();
            appStore?.saSetApp(data.syApp);
          }

        }
      } catch (err) {
        console.error('[foAppInitStore] saFetchFoAppInitData error:', err);
        throw err;                       // 401 판정 등은 호출자(foAuth.init)가 한다
      } finally {
        this.svIsLoading = false;
      }
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    saClearAll() {
      _FO_CLEAR_STORES.forEach((n) => { window[n]?.()?.saClear?.(); });
      this.svIsLoading = false;
    },

    /**
     * localStorage에서 복원
     */
    saRestoreFromStorage() {
      const authStore = window.useFoAuthStore?.();
      return authStore?.saRestoreFromStorage() || false;
    },
  },
});

