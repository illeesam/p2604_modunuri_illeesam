/**
 * FO (Front Office) 공통 코드 Pinia 스토어 (그리드 형식)
 * - 공통 코드 관리
 */
window.useFoCodeStore = Pinia.defineStore('foCode', {
  state: () => {
    return {
      svCodes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
    };
  },

  getters: {
    svIsEmpty: (s) => !Array.isArray(s.svCodes) || s.svCodes.length === 0,
    // 코드 그룹별 조회
    svGetCodesByGroup: (s) => (grpVal) => {
      return s.svCodes.filter(c => c.codeGrp === grpVal);
    },
    // 특정 코드 값 조회
    svGetCodeByVal: (s) => (grpVal, codeVal) => {
      return s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
    },
    // 특정 코드명 조회
    svGetCodeNmByVal: (s) => (grpVal, codeVal) => {
      const code = s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
      return code?.codeNm || codeVal;
    },
  },

  actions: {
    /**
     * 공통 코드 설정 (전체 교체, 그리드 형식)
     */
    sfSetCodes(codesData) {
      if (codesData) {
        this.svCodes = Array.isArray(codesData) ? codesData : [];
      }
    },

    /**
     * 코드 항목 추가
     */
    sfAddCode(code) {
      if (code) {
        if (!this.svCodes.find(c => c.codeId === code.codeId)) {
          this.svCodes.push(code);
        }
      }
    },

    /**
     * 코드 항목 업데이트
     */
    sfUpdateCode(codeId, codeData) {
      if (codeId) {
        const idx = this.svCodes.findIndex(c => c.codeId === codeId);
        if (idx !== -1) {
          this.svCodes[idx] = { ...this.svCodes[idx], ...codeData };
        }
      }
    },

    /**
     * 코드 항목 삭제
     */
    sfRemoveCode(codeId) {
      if (codeId) {
        const idx = this.svCodes.findIndex(c => c.codeId === codeId);
        if (idx !== -1) {
          this.svCodes.splice(idx, 1);
        }
      }
    },

    /**
     * 초기화 (로그아웃 시)
     */
    sfClear() {
      this.svCodes = [];
    },
  },
});
