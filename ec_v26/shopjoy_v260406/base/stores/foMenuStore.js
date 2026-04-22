/**
 * FO (Front Office) 메뉴 정보 Pinia 스토어
 */
window.useFoMenuStore = Pinia.defineStore('foMenu', {
  state: () => {
    return {
      menus: [],
    };
  },

  actions: {
    setMenus(menusData) {
      if (menusData) {
        this.menus = menusData;
      }
    },

    addMenu(menu) {
      if (menu) {
        this.menus.push(menu);
      }
    },

    updateMenu(menuId, menu) {
      const idx = this.menus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.menus[idx] = { ...this.menus[idx], ...menu };
      }
    },

    removeMenu(menuId) {
      const idx = this.menus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.menus.splice(idx, 1);
      }
    },

    clear() {
      this.menus = [];
    },
  },
});
