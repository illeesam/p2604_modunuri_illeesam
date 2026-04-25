/**
 * FO (Front Office) 역할 정보 Pinia 스토어
 */
window.useFoRoleStore = Pinia.defineStore('foRole', {
  state: () => {
    return {
      svRoles: [],
    };
  },

  actions: {
    sfSetRoles(rolesData) {
      if (rolesData) {
        this.svRoles = rolesData;
      }
    },

    sfAddRole(role) {
      if (role) {
        this.svRoles.push(role);
      }
    },

    sfUpdateRole(roleId, role) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.svRoles[idx] = { ...this.svRoles[idx], ...role };
      }
    },

    sfRemoveRole(roleId) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.svRoles.splice(idx, 1);
      }
    },

    sfClear() {
      this.svRoles = [];
    },
  },
});
