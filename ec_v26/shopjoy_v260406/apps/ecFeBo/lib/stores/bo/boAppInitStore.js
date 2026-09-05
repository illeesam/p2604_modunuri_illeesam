/**
 * BO (Back Office) 애플리케이션 초기화 데이터 Pinia 스토어 (통합 관제)
 * - 로그인 후 필요한 초기화 데이터를 한 번에 받아 각 독립 store 로 분산 저장
 */

/* 로그아웃 시 비울 스토어들 — saClearAll 이 순회한다 */
const _BO_CLEAR_STORES = [
  'useBoAuthStore', 'useBoRoleStore', 'useBoMenuStore',
  'useBoCodeStore', 'useBoPropStore', 'useBoAppStore',
];

window.useBoAppInitStore = Pinia.defineStore('boAppInit', {
  state: () => ({
    svIsLoading: false,   // 중복 조회 방지 가드
  }),

  actions: {
    /**
     * BO 초기화 데이터 조회
     * @param {string} names - 조회할 항목 ('^' 구분자, 예: "auth^user^role^menu^app").
     *                         빈 값/'ALL' 이면 전체.
     */
    async saFetchBoAppInitData(names = 'ALL') {
      if (this.svIsLoading) return;
      this.svIsLoading = true;

      try {
        const res = await coApiSvc.cmBoAppStore.getInitData(names || 'ALL', '시스템', '초기화데이터조회');
        const data = res?.data?.data;
        if (!data) {
          console.warn('[boAppInitStore] 초기화 데이터가 비어 있습니다:', res);
          return;
        }

        /* 백엔드 응답 키 → 각 스토어 (syAuth[토큰+사용자] / syRoles / syMenus / syCodes / syProps / syApp) */
        if (data.syAuth)  { window.useBoAuthStore?.()?.saSetAuth(data.syAuth); }
        if (data.syRoles) { window.useBoRoleStore?.()?.saSetRoles(data.syRoles); }
        if (data.syCodes) { window.useBoCodeStore?.()?.saSetCodes(data.syCodes?.codes); }
        if (data.syProps) { window.useBoPropStore?.()?.saSetProps(data.syProps); }
        if (data.syApp)   { window.useBoAppStore?.()?.saSetApp(data.syApp); }

        /* 메뉴는 스토어 + 공통 필터용 전역 양쪽에 넣는다
           (예전엔 이 블록이 위아래로 두 번 있어 saSetMenus 가 중복 호출됐다) */
        if (data.syMenus) {
          window.useBoMenuStore?.()?.saSetMenus(data.syMenus);
          window._boCmMenus = data.syMenus?.menus || data.syMenus || [];
        }

        /* 공통 필터/피커가 쓰는 전역 참조 데이터 */
        if (data.syPaths) { window._boCmPaths = data.syPaths?.paths || data.syPaths || []; }
        if (data.syDepts) { window._boCmDepts = data.syDepts?.depts || data.syDepts || []; }
        if (data.sySites) {
          window._boCmSites = data.sySites?.sites || data.sySites || [];
          if (window._boCmSites.length && boCommonFilter) {
            boCommonFilter.siteId = window._boCmSites[0]?.siteId ?? null;
          }
        }
      } catch (err) {
        console.error('[boAppInitStore] saFetchBoAppInitData error:', err);
        throw err;                       // 401 판정 등은 호출자가 한다
      } finally {
        this.svIsLoading = false;
      }
    },

    /**
     * 전체 초기화 (로그아웃 시)
     */
    saClearAll() {
      _BO_CLEAR_STORES.forEach((n) => { window[n]?.()?.saClear?.(); });
      this.svIsLoading = false;
    },

    /**
     * localStorage 에서 복원
     */
    saRestoreFromStorage() {
      return window.useBoAuthStore?.()?.saRestoreFromStorage() || false;
    },
  },
});
