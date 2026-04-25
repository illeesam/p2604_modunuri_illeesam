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
    sfSetMenus(menusData) {
      if (menusData) {
        this.svMenus = menusData;
      }
    },

    sfAddMenu(menu) {
      if (menu) {
        this.svMenus.push(menu);
      }
    },

    sfUpdateMenu(menuId, menu) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.svMenus[idx] = { ...this.svMenus[idx], ...menu };
      }
    },

    sfRemoveMenu(menuId) {
      const idx = this.svMenus.findIndex(m => m.id === menuId);
      if (idx >= 0) {
        this.svMenus.splice(idx, 1);
      }
    },

    sfClear() {
      this.svMenus = [];
    },
  },
});
