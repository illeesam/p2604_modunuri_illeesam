/**
 * FO (Front Office) 전시 정보 Pinia 스토어
 * - foAppInitStore 가 로그인/초기화 시 saSetDispData 로 채운다.
 * - saSetDispStruc / saSetDispDataContent 개별 세터는 호출처가 없어 제거함 (2026-08-01).
 */
window.useFoDispStore = Pinia.defineStore('foDisp', {
  state: () => ({
    svDispStruc: {},
    svDispData: {},
  }),

  actions: {
    saSetDispData(dispData) {
      if (!dispData) return;
      if (dispData.dispStruc) this.svDispStruc = dispData.dispStruc;
      if (dispData.dispData) this.svDispData = dispData.dispData;
    },

    saClear() {
      this.svDispStruc = {};
      this.svDispData = {};
    },
  },
});
