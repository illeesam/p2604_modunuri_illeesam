/**
 * FO (Front Office) 역할 정보 Pinia 스토어
 * - foAppInitStore 가 로그인 시 saSetRoles 로 채운다.
 * - 개별 add/update/remove 액션은 호출처가 없어 제거함 (2026-08-01).
 */
window.useFoRoleStore = Pinia.defineStore('foRole', {
  state: () => ({
    svRoles: [],
  }),

  actions: {
    saSetRoles(rolesData) { this.svRoles = rolesData || []; },
    saClear() { this.svRoles = []; },
  },
});
