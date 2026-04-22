/**
 * BO 공통 코드 Pinia 스토어
 * - 시스템 공통 코드 관리 (코드그룹별)
 */
window.useBoCodeStore = Pinia.defineStore('boCode', {
  state: () => {
    return {
      codes: {},
      isLoading: false,
    };
  },

  getters: {
    isEmpty: (s) => Object.keys(s.codes).length === 0,
    getCodesByGrp: (s) => (grp) => s.codes[grp] || [], // 코드그룹으로 조회
    getCodeValue: (s) => (grp, code) => {
      const list = s.codes[grp] || [];
      return list.find(c => c.code === code); // 특정 코드값 조회
    },
    getAllGrps: (s) => Object.keys(s.codes), // 모든 코드그룹 목록
  },

  actions: {
    /**
     * 공통 코드 설정 (전체 교체)
     */
    setCodes(codesData) {
      this.codes = codesData || {};
    },

    /**
     * 코드 그룹 추가
     */
    addCodeGrp(grp, codeList) {
      if (grp && codeList) {
        this.codes[grp] = codeList;
      }
    },

    /**
     * 코드 항목 추가
     */
    addCode(grp, code) {
      if (grp && code) {
        if (!this.codes[grp]) {
          this.codes[grp] = [];
        }
        if (!this.codes[grp].find(c => c.code === code.code)) {
          this.codes[grp].push(code);
        }
      }
    },

    /**
     * 코드 항목 업데이트
     */
    updateCode(grp, code, codeData) {
      if (grp && code) {
        const list = this.codes[grp];
        if (list) {
          const idx = list.findIndex(c => c.code === code);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...codeData };
          }
        }
      }
    },

    /**
     * 코드 항목 삭제
     */
    removeCode(grp, code) {
      if (grp && code) {
        const list = this.codes[grp];
        if (list) {
          const idx = list.findIndex(c => c.code === code);
          if (idx !== -1) {
            list.splice(idx, 1);
          }
        }
      }
    },

    /**
     * 코드 그룹 삭제
     */
    removeCodeGrp(grp) {
      if (grp && this.codes[grp]) {
        delete this.codes[grp];
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.codes = {};
      this.isLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoCodeStore = () => {
  try {
    return window.useBoCodeStore?.() || {
      codes: {},
      isEmpty: true,
      isLoading: false,
    };
  } catch (e) {
    console.error('[getBoCodeStore] error:', e);
    return {
      codes: {},
      isEmpty: true,
      isLoading: false,
    };
  }
};
