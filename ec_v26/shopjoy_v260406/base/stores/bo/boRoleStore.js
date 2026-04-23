/**
 * BO 역할 정보 Pinia 스토어
 * - 관리자 역할/권한 관리
 */
window.useBoRoleStore = Pinia.defineStore('boRole', {
  state: () => {
    return {
      roles: [],
      isLoading: false,
    };
  },

  getters: {
    isEmpty: (s) => !Array.isArray(s.roles) || s.roles.length === 0,
  },

  actions: {
    /**
     * 역할 정보 설정
     */
    setRoles(rolesData) {
      this.roles = rolesData || [];
    },

    /**
     * 역할 추가
     */
    addRole(role) {
      if (role && !this.roles.find(r => r.id === role.id)) {
        this.roles.push(role);
      }
    },

    /**
     * 역할 업데이트
     */
    updateRole(roleId, roleData) {
      const idx = this.roles.findIndex(r => r.id === roleId);
      if (idx !== -1) {
        this.roles[idx] = { ...this.roles[idx], ...roleData };
      }
    },

    /**
     * 역할 삭제
     */
    removeRole(roleId) {
      const idx = this.roles.findIndex(r => r.id === roleId);
      if (idx !== -1) {
        this.roles.splice(idx, 1);
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.roles = [];
      this.isLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoRoleStore = () => {
  try {
    return window.useBoRoleStore?.() || {
      roles: [],
      isEmpty: true,
      isLoading: false,
    };
  } catch (e) {
    console.error('[getBoRoleStore] error:', e);
    return {
      roles: [],
      isEmpty: true,
      isLoading: false,
    };
  }
};
