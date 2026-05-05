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
    sgIsEmpty: (s) => !Array.isArray(s.svCodes) || s.svCodes.length === 0,
    // 코드 그룹별 조회
    sgGetCodesByGroup: (s) => (grpVal) => {
      return s.svCodes.filter(c => c.codeGrp === grpVal);
    },
    // 특정 코드 값 조회
    sgGetCodeByVal: (s) => (grpVal, codeVal) => {
      return s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
    },
    // 특정 코드명 조회
    sgGetCodeNmByVal: (s) => (grpVal, codeVal) => {
      const code = s.svCodes.find(c => c.codeGrp === grpVal && c.codeVal === codeVal);
      return code?.codeNm || codeVal;
    },
    // 코드 그룹을 { codeValue, codeLabel } 형식으로 변환
    sgGetGrpCodes: (s) => (grpVal) => {
      if (!Array.isArray(s.svCodes)) return [];
      return s.svCodes
        .filter(c => c.codeGrp === grpVal && c.use_yn === 'Y')
        .sort((a, b) => (a.sort_ord || 0) - (b.sort_ord || 0))
        .map(c => ({ codeValue: c.code_value, codeLabel: `${c.code_label} (${c.codeGrp}:${c.code_value})` })) || [];
    },
    // 코드 그룹을 { codeValue, codeLabel } 형식으로 + 초기 항목 추가
    sgGetGrpCodesFirstOpt: (s) => (grpVal, initVal, initLabel) => {
      if (!Array.isArray(s.svCodes)) return initVal && initLabel ? [{ codeValue: initVal, codeLabel: initLabel }] : [];
      const codes = s.svCodes
        .filter(c => c.codeGrp === grpVal && c.use_yn === 'Y')
        .sort((a, b) => (a.sort_ord || 0) - (b.sort_ord || 0))
        .map(c => ({ codeValue: c.code_value, codeLabel: `${c.code_label} (${c.codeGrp}:${c.code_value})` })) || [];
      return initVal && initLabel ? [{ codeValue: initVal, codeLabel: initLabel }, ...codes] : codes;
    },
    // 트리형 코드 그룹: 레벨/부모 필터
    //   grpVal           : 코드그룹 (예: 'PROD_OPT_CATEGORY')
    //   level            : code_level 값 — null/undefined 면 전체
    //   parentCodeValue  : 부모 code_value — null/undefined 면 전체
    // BO 와 달리 FO 는 응답 키가 snake_case 일 수 있어 양쪽을 모두 허용
    sgGetGrpCodesByLevel: (s) => (grpVal, level, parentCodeValue) => {
      if (!Array.isArray(s.svCodes)) return [];
      const lv = (c) => Number(c.codeLevel ?? c.code_level ?? 1);
      const pv = (c) => c.parentCodeValue ?? c.parent_code_value ?? null;
      const cv = (c) => c.codeVal ?? c.code_value;
      const cl = (c) => c.codeNm ?? c.code_label;
      const cs = (c) => Number(c.codeSortOrd ?? c.sort_ord ?? 0);
      const cu = (c) => c.useYn ?? c.use_yn;
      const cr = (c) => c.codeRemark ?? c.code_remark ?? '';
      return s.svCodes
        .filter(c => c.codeGrp === grpVal && cu(c) !== 'N')
        .filter(c => level == null || lv(c) === Number(level))
        .filter(c => parentCodeValue == null || pv(c) === parentCodeValue)
        .sort((a, b) => cs(a) - cs(b))
        .map(c => ({
          codeValue: cv(c),
          codeLabel: cl(c) || cv(c),
          codeLevel: lv(c),
          parentCodeValue: pv(c),
          codeRemark: cr(c),
        }));
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
    },
  },
});
