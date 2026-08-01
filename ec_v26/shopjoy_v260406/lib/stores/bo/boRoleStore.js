/**
 * BO 역할 정보 Pinia 스토어
 * - boAppInitStore / boAuthStore 가 로그인 시 saSetRoles 로 채운다.
 * - 개별 add/update/remove 액션은 호출처가 없어 제거함 (2026-08-01). 역할 변경은 서버가 하고
 *   클라이언트는 로그인/초기화 때 통째로 받는다.
 */
window.useBoRoleStore = Pinia.defineStore('boRole', {
  state: () => ({
    svRoles: [],
  }),

  actions: {
    saSetRoles(rolesData) { this.svRoles = rolesData || []; },
    saClear() { this.svRoles = []; },
  },
});

/* sfGetBoRoleStore — Pinia 미초기화 구간에서도 안전하게 접근 */
window.sfGetBoRoleStore = () => {
  try {
    return window.useBoRoleStore?.() || { svRoles: [] };
  } catch (e) {
    console.error('[sfGetBoRoleStore] error:', e);
    return { svRoles: [] };
  }
};
