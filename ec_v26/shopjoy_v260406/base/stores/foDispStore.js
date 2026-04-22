/**
 * FO (Front Office) 전시 정보 Pinia 스토어
 * - 전시 구조(dispStruc)와 전시 데이터(dispData) 관리
 */
window.useFoDispStore = Pinia.defineStore('foDisp', {
  state: () => {
    return {
      dispStruc: {},
      dispData: {},
    };
  },

  actions: {
    setDispData(dispData) {
      if (dispData) {
        if (dispData.dispStruc) {
          this.dispStruc = dispData.dispStruc;
        }
        if (dispData.dispData) {
          this.dispData = dispData.dispData;
        }
      }
    },

    setDispStruc(dispStruc) {
      if (dispStruc) {
        this.dispStruc = dispStruc;
      }
    },

    setDispDataContent(dispData) {
      if (dispData) {
        this.dispData = dispData;
      }
    },

    clear() {
      this.dispStruc = {};
      this.dispData = {};
    },
  },
});
