/**
 * BO 공통 코드 Pinia 스토어 (그리드 형식)
 * - 시스템 공통 코드 관리
 */
window.useBoCodeStore = Pinia.defineStore('boCode', {
  state: () => {
    return {
      svCodes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
      svIsLoading: false,
    };
  },

  getters: {
    sgIsEmpty: (s) => !Array.isArray(s.svCodes) || s.svCodes.length === 0,
    // 코드 그룹별 조회
    sgGetCodesByGroup: (s) => (grpVal) => {
      if (!Array.isArray(s.svCodes)) return [];
      return s.svCodes.filter(c => c.codeGrp === grpVal);
    },
    // 특정 코드 값 조회
    sgGetCodeByVal: (s) => (grpVal, codeVal) => {
      if (!Array.isArray(s.svCodes)) return null;
      return s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
    },
    // 특정 코드명 조회
    sgGetCodeNmByVal: (s) => (grpVal, codeVal) => {
      if (!Array.isArray(s.svCodes)) return codeVal;
      const code = s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
      return code?.codeNm || codeVal;
    },
    // 코드 그룹을 { codeValue, codeLabel } 형식으로 변환
    snGetGrpCodes: (s) => (grpVal) => {
      if (!Array.isArray(s.svCodes)) return [];
      return s.svCodes
        .filter(c => c.codeGrp === grpVal && c.useYn !== 'N')
        .sort((a, b) => (Number(a.codeSortOrd || 0) - Number(b.codeSortOrd || 0)))
        .map(c => ({ codeValue: c.codeVal, codeLabel: (c.codeNm || c.codeVal) + ' (' + grpVal + ':' + c.codeVal + ')' }));
    },
    // 코드 그룹을 { codeValue, codeLabel } 형식으로 + 초기 항목 추가
    snGetGrpCodesFirstOpt: (s) => (grpVal, initVal, initLabel) => {
      if (!Array.isArray(s.svCodes)) return initVal && initLabel ? [{ codeValue: initVal, codeLabel: initLabel }] : [];
      const codes = s.svCodes
        .filter(c => c.codeGrp === grpVal && c.useYn !== 'N')
        .sort((a, b) => (Number(a.codeSortOrd || 0) - Number(b.codeSortOrd || 0)))
        .map(c => ({ codeValue: c.codeVal, codeLabel: (c.codeNm || c.codeVal) + ' (' + grpVal + ':' + c.codeVal + ')' }));
      return initVal && initLabel ? [{ codeValue: initVal, codeLabel: initLabel }, ...codes] : codes;
    },
  },

  actions: {
    /**
     * 공통 코드 설정 (전체 교체, 그리드 형식)
     */
    saSetCodes(codesData) {
      if (codesData) {
        this.svCodes = Array.isArray(codesData) ? codesData : [];
      }
    },

    /**
     * 코드 항목 추가
     */
    saAddCode(code) {
      if (code) {
        if (!this.svCodes.find(c => c.codeId === code.codeId)) {
          this.svCodes.push(code);
        }
      }
    },

    /**
     * 코드 항목 업데이트
     */
    saUpdateCode(codeId, codeData) {
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
    saRemoveCode(codeId) {
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
    saClear() {
      this.svCodes = [];
      this.svIsLoading = false;
    },
  },
});

// 함수형 유틸리티 제공
window.sfGetBoCodeStore = () => {
  try {
    return window.useBoCodeStore?.() || {
      svCodes: [],
      sgIsEmpty: true,
      svIsLoading: false,
    };
  } catch (e) {
    console.error('[sfGetBoCodeStore] error:', e);
    return {
      svCodes: [],
      sgIsEmpty: true,
      svIsLoading: false,
    };
  }
};
