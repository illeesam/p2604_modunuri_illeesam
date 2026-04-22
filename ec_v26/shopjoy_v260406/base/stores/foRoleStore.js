/**
 * FO (Front Office) 역할 정보 Pinia 스토어
 */
window.useFoRoleStore = Pinia.defineStore('foRole', {
  state: () => {
    return {
      roles: [],
    };
  },

  actions: {
    setRoles(rolesData) {
      if (rolesData) {
        this.roles = rolesData;
      }
    },

    addRole(role) {
      if (role) {
        this.roles.push(role);
      }
    },

    updateRole(roleId, role) {
      const idx = this.roles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.roles[idx] = { ...this.roles[idx], ...role };
      }
    },

    removeRole(roleId) {
      const idx = this.roles.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        this.roles.splice(idx, 1);
      }
    },

    clear() {
      this.roles = [];
    },
  },
});
