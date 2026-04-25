/**
 * BO 메뉴 정보 Pinia 스토어
 * - 관리자가 접근 가능한 메뉴 관리
 */
window.useBoMenuStore = Pinia.defineStore('boMenu', {
  state: () => {
    return {
      svMenus: [],
      svIsLoading: false,
    };
  },

  getters: {
    svIsEmpty: (s) => !Array.isArray(s.svMenus) || s.svMenus.length === 0,
    svGetMenuById: (s) => (menuId) => s.svMenus.find(m => m.id === menuId),
  },

  actions: {
    /**
     * 메뉴 정보 설정
     */
    sfSetMenus(menusData) {
      this.svMenus = menusData || [];
    },

    /**
     * 메뉴 추가
     */
    sfAddMenu(menu) {
      if (menu && !this.svMenus.find(m => m.id === menu.id)) {
        this.svMenus.push(menu);
      }
    },

    /**
     * 메뉴 업데이트
     */
    sfUpdateMenu(menuId, menuData) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx !== -1) {
        this.svMenus[idx] = { ...this.svMenus[idx], ...menuData };
      }
    },

    /**
     * 메뉴 삭제
     */
    sfRemoveMenu(menuId) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx !== -1) {
        this.svMenus.splice(idx, 1);
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    sfClear() {
      this.svMenus = [];
      this.svIsLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoMenuStore = () => {
  try {
    return window.useBoMenuStore?.() || {
      svMenus: [],
      svIsEmpty: true,
      svIsLoading: false,
    };
  } catch (e) {
    console.error('[getBoMenuStore] error:', e);
    return {
      svMenus: [],
      svIsEmpty: true,
      svIsLoading: false,
    };
  }
};
