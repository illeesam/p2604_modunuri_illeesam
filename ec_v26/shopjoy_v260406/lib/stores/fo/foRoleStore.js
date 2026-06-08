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
    saSetRoles(rolesData) {
      if (rolesData) {
        this.svRoles = rolesData;
      }
    },

    saAddRole(role) {
      if (role) {
        this.svRoles.push(role);
      }
    },

    saUpdateRole(roleId, role) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.svRoles[idx] = { ...this.svRoles[idx], ...role };
      }
    },

    saRemoveRole(roleId) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.svRoles.splice(idx, 1);
      }
    },

    saClear() {
      this.svRoles = [];
    },
  },
});
