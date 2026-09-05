/**
 * FO (Front Office) 시스템 속성 Pinia 스토어 (sy_prop 키-값)
 * - foAppInitStore 가 로그인 시 saSetProps 로 채운다.
 * - 개별 set/remove/has 액션은 호출처가 없어 제거함 (2026-08-01).
 *   값이 필요하면 store.svProps[key] 로 직접 읽는다.
 */
window.useFoPropStore = Pinia.defineStore('foProp', {
  state: () => ({
    svProps: {},
  }),

  actions: {
    saSetProps(propsData) { this.svProps = propsData || {}; },
    saClear() { this.svProps = {}; },
  },
});
