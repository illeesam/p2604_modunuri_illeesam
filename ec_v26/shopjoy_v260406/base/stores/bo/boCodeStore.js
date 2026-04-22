/**
 * BO 공통 코드 Pinia 스토어 (그리드 형식)
 * - 시스템 공통 코드 관리
 */
window.useBoCodeStore = Pinia.defineStore('boCode', {
  state: () => {
    return {
      codes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
      isLoading: false,
    };
  },

  getters: {
    isEmpty: (s) => s.codes.length === 0,
  },

  actions: {
    /**
     * 공통 코드 설정 (전체 교체, 그리드 형식)
     */
    setCodes(codesData) {
      if (codesData) {
        this.codes = Array.isArray(codesData) ? codesData : [];
      }
    },

    /**
     * 코드 항목 추가
     */
    addCode(code) {
      if (code) {
        if (!this.codes.find(c => c.codeId === code.codeId)) {
          this.codes.push(code);
        }
      }
    },

    /**
     * 코드 항목 업데이트
     */
    updateCode(codeId, codeData) {
      if (codeId) {
        const idx = this.codes.findIndex(c => c.codeId === codeId);
        if (idx !== -1) {
          this.codes[idx] = { ...this.codes[idx], ...codeData };
        }
      }
    },

    /**
     * 코드 항목 삭제
     */
    removeCode(codeId) {
      if (codeId) {
        const idx = this.codes.findIndex(c => c.codeId === codeId);
        if (idx !== -1) {
          this.codes.splice(idx, 1);
        }
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    clear() {
      this.codes = [];
      this.isLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.getBoCodeStore = () => {
  try {
    return window.useBoCodeStore?.() || {
      codes: [],
      isEmpty: true,
      isLoading: false,
    };
  } catch (e) {
    console.error('[getBoCodeStore] error:', e);
    return {
      codes: [],
      isEmpty: true,
      isLoading: false,
    };
  }
};
