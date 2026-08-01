/**
 * BO 시스템 속성 Pinia 스토어 (sy_prop 키-값)
 * - boAppInitStore 가 로그인 시, SyPropMng 의 [런타임 프로퍼티 갱신] 이 수동으로 saSetProps 호출.
 * - 개별 set/remove/has 액션과 sgGetProp/sgGetAllKeys 게터는 호출처가 없어 제거함 (2026-08-01).
 *   값이 필요하면 store.svProps[key] 로 직접 읽는다.
 */
window.useBoPropStore = Pinia.defineStore('boProp', {
  state: () => ({
    svProps: {},
  }),

  actions: {
    saSetProps(propsData) { this.svProps = propsData || {}; },
    saClear() { this.svProps = {}; },
  },
});
