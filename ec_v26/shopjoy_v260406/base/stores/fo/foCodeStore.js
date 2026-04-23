/**
 * FO (Front Office) 공통 코드 Pinia 스토어 (그리드 형식)
 * - 공통 코드 관리
 */
window.useFoCodeStore = Pinia.defineStore('foCode', {
  state: () => {
    return {
      codes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
    };
  },

  getters: {
    isEmpty: (s) => s.codes.length === 0,
    // 코드 그룹별 조회
    getCodesByGroup: (s) => (grpVal) => {
      return s.codes.filter(c => c.codeGrp === grpVal);
    },
    // 특정 코드 값 조회
    getCodeByVal: (s) => (grpVal, codeVal) => {
      return s.codes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
    },
    // 특정 코드명 조회
    getCodeNmByVal: (s) => (grpVal, codeVal) => {
      const code = s.codes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
      return code?.codeNm || codeVal;
    },
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
    },
  },
});
