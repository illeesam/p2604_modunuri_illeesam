/**
 * BO 메뉴 정보 Pinia 스토어
 * - 관리자가 접근 가능한 메뉴 관리
 */
window.useBoMenuStore = Pinia.defineStore('boMenu', {
  state: () => {
    return {
      menus: [],
      isLoading: false,
    };
  },

  getters: {
    isEmpty: (s) => s.menus.length === 0,
    getMenuById: (s) => (menuId) => s.menus.find(m => m.id === menuId),
  },

  actions: {
    /**
     * 메뉴 정보 설정
     */
    setMenus(menusData) {
      this.menus = menusData || [];
    },

    /**
     * 메뉴 추가
     */
    addMenu(menu) {
      if (menu && !this.menus.find(m => m.id === menu.id)) {
        this.menus.push(menu);
      }
    },

    /**
     * 메뉴 업데이트
     */
    updateMenu(menuId, menuData) {
      const idx = this.menus.findIndex(m => m.id === menuId);
      if (idx !== -1) {
        this.menus[idx] = { ...this.menus[idx], ...menuData };
      }
    },

    /**
     * 메뉴 삭제
     */
    removeMenu(menuId) {
      const idx = this.menus.findIndex(m => m.id === menuId);
      if (idx !== -1) {
        this.menus.splice(idx, 1);
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.menus = [];
      this.isLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoMenuStore = () => {
  try {
    return window.useBoMenuStore?.() || {
      menus: [],
      isEmpty: true,
      isLoading: false,
    };
  } catch (e) {
    console.error('[getBoMenuStore] error:', e);
    return {
      menus: [],
      isEmpty: true,
      isLoading: false,
    };
  }
};
