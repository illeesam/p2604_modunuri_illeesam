/**
 * FO (Front Office) 메뉴 정보 Pinia 스토어
 */
window.useFoMenuStore = Pinia.defineStore('foMenu', {
  state: () => {
    return {
      svMenus: [],
    };
  },

  actions: {
    saSetMenus(menusData) {
      if (menusData) {
        this.svMenus = menusData;
      }
    },

    saAddMenu(menu) {
      if (menu) {
        this.svMenus.push(menu);
      }
    },

    saUpdateMenu(menuId, menu) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.svMenus[idx] = { ...this.svMenus[idx], ...menu };
      }
    },

    saRemoveMenu(menuId) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.svMenus.splice(idx, 1);
      }
    },

    saClear() {
      this.svMenus = [];
    },
  },
});
