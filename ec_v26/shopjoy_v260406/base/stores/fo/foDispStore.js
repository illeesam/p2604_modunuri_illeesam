/**
 * FO (Front Office) 전시 정보 Pinia 스토어
 * - 전시 구조(dispStruc)와 전시 데이터(dispData) 관리
 */
window.useFoDispStore = Pinia.defineStore('foDisp', {
  state: () => {
    return {
      svDispStruc: {},
      svDispData: {},
    };
  },

  actions: {
    saSetDispData(dispData) {
      if (dispData) {
        if (dispData.dispStruc) {
          this.svDispStruc = dispData.dispStruc;
        }
        if (dispData.dispData) {
          this.svDispData = dispData.dispData;
        }
      }
    },

    saSetDispStruc(dispStruc) {
      if (dispStruc) {
        this.svDispStruc = dispStruc;
      }
    },

    saSetDispDataContent(dispData) {
      if (dispData) {
        this.svDispData = dispData;
      }
    },

    saClear() {
      this.svDispStruc = {};
      this.svDispData = {};
    },
  },
});
