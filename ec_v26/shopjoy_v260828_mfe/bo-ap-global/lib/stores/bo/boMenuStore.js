/**
 * BO 메뉴 정보 Pinia 스토어
 * - 관리자가 접근 가능한 메뉴. boAppInitStore 가 로그인 시 saSetMenus 로 채운다.
 * - 개별 add/update/remove 액션과 sgGetMenuById 게터는 호출처가 없어 제거함 (2026-08-01).
 */
window.useBoMenuStore = Pinia.defineStore('boMenu', {
  state: () => ({
    svMenus: [],
  }),

  actions: {
    saSetMenus(menusData) { this.svMenus = menusData || []; },
    saClear() { this.svMenus = []; },
  },
});
