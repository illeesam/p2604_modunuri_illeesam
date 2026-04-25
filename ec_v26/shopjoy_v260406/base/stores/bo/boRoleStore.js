/**
 * BO 역할 정보 Pinia 스토어
 * - 관리자 역할/권한 관리
 */
window.useBoRoleStore = Pinia.defineStore('boRole', {
  state: () => {
    return {
      svRoles: [],
      svIsLoading: false,
    };
  },

  getters: {
    svIsEmpty: (s) => !Array.isArray(s.svRoles) || s.svRoles.length === 0,
  },

  actions: {
    /**
     * 역할 정보 설정
     */
    sfSetRoles(rolesData) {
      this.svRoles = rolesData || [];
    },

    /**
     * 역할 추가
     */
    sfAddRole(role) {
      if (role && !this.svRoles.find(r => r.id === role.id)) {
        this.svRoles.push(role);
      }
    },

    /**
     * 역할 업데이트
     */
    sfUpdateRole(roleId, roleData) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx !== -1) {
        this.svRoles[idx] = { ...this.svRoles[idx], ...roleData };
      }
    },

    /**
     * 역할 삭제
     */
    sfRemoveRole(roleId) {
      const idx = this.svRoles.findIndex(r => r.id === roleId);
      if (idx !== -1) {
        this.svRoles.splice(idx, 1);
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    sfClear() {
      this.svRoles = [];
      this.svIsLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoRoleStore = () => {
  try {
    return window.useBoRoleStore?.() || {
      svRoles: [],
      svIsEmpty: true,
      svIsLoading: false,
    };
  } catch (e) {
    console.error('[getBoRoleStore] error:', e);
    return {
      svRoles: [],
      svIsEmpty: true,
      svIsLoading: false,
    };
  }
};
