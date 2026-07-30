/**
 * FO (Front Office) 공통 코드 Pinia 스토어 (그리드 형식)
 * - 공통 코드 관리
 */
window.useFoCodeStore = Pinia.defineStore('foCode', {
  state: () => {
    return {
      svCodes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
      /* 지연 로딩 캐시 — 조회 완료한 그룹(빈 결과 포함) / 진행 중 Promise */
      _svLoadedGrps: {},
      _svInflight: {},
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

      /* lv */
      const lv = (c) => Number(c.codeLevel ?? c.code_level ?? 1);

      /* pv */
      const pv = (c) => c.parentCodeValue ?? c.parent_code_value ?? null;

      /* cv */
      const cv = (c) => c.codeVal ?? c.code_value;

      /* cl */
      const cl = (c) => c.codeNm ?? c.code_label;

      /* cs */
      const cs = (c) => Number(c.codeSortOrd ?? c.sort_ord ?? 0);

      /* cu */
      const cu = (c) => c.useYn ?? c.use_yn;

      /* cr */
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
     * 코드그룹 지연 로딩 — 캐시에 없는 그룹만 배치로 받아 누적한다.
     * (BO codeStore.saLoadCodes 와 같은 규약)
     */
    async saLoadCodes(grps) {
      const want = (Array.isArray(grps) ? grps : [grps]).filter(g => g && typeof g === 'string');
      if (!want.length) return;
      const need = [...new Set(want)].filter(g => !this._svLoadedGrps[g]);
      const inflight = need.filter(g => this._svInflight[g]).map(g => this._svInflight[g]);
      const fresh = need.filter(g => !this._svInflight[g]);
      let p = null;
      if (fresh.length) {
        p = this._saFetchGrps(fresh);
        fresh.forEach(g => { this._svInflight[g] = p; });
      }
      await Promise.all([...inflight, p].filter(Boolean));
    },

    /**
     * 코드 행 필드명 정규화.
     *
     * 이 스토어의 getter 는 `codeVal` / `codeNm` / `codeSortOrd` 를 읽는데,
     * 배치 API(`/co/sy/code/groups`) 는 표준 DTO 형태인 `codeValue` / `codeLabel`
     * / `sortOrd` 로 응답한다. 정규화하지 않으면 getter 가 `{}` 를 만들어
     * **모든 코드 select 의 라벨이 빈칸으로 렌더된다**(옵션 개수는 맞아서 눈에 안 띈다).
     * 원본 키는 남겨 둔다 — 어느 이름으로 읽든 동작하도록.
     */
    _fnNormCodeRows(rows) {
      return (rows || []).map(r => ({
        ...r,
        codeVal:     r.codeVal     != null ? r.codeVal     : r.codeValue,
        codeNm:      r.codeNm      != null ? r.codeNm      : r.codeLabel,
        codeSortOrd: r.codeSortOrd != null ? r.codeSortOrd : r.sortOrd,
      }));
    },

    /** 배치 호출 1회 — 실패해도 화면을 죽이지 않는다(로그만) */
    async _saFetchGrps(grps) {
      try {
        const res = await window.coApiSvc.syCode.getGrpsCodes(grps, '공통코드', '그룹조회');
        const rows = this._fnNormCodeRows(res?.data?.data || []);
        if (rows.length) this.svCodes = this.svCodes.concat(rows);
        /* 응답에 없던 그룹도 조회 완료로 기록 — 매번 재요청 방지 */
        grps.forEach(g => { this._svLoadedGrps[g] = true; });
      } catch (e) {
        console.warn('[foCodeStore.saLoadCodes] 코드그룹 조회 실패:', grps, e?.message || e);
      } finally {
        grps.forEach(g => { delete this._svInflight[g]; });
      }
    },

    /** 특정 그룹 캐시 무효화 */
    saInvalidateGrps(grps) {
      const list = (Array.isArray(grps) ? grps : [grps]).filter(Boolean);
      list.forEach(g => { delete this._svLoadedGrps[g]; });
      if (list.length) this.svCodes = this.svCodes.filter(c => !list.includes(c.codeGrp));
    },

    /**
     * 공통 코드 설정 (전체 교체, 그리드 형식)
     */
    saSetCodes(codesData) {
      if (codesData) {
        this.svCodes = this._fnNormCodeRows(Array.isArray(codesData) ? codesData : []);
        /* 전량 교체 → 지연 로딩 캐시도 같이 맞춘다 (2026-07-30).
           실려온 그룹을 적재 완료로 표시하지 않으면, 배열은 교체됐는데
           _svLoadedGrps 는 이전 상태라 saLoadCodes 가 필요한 재조회를 건너뛴다. */
        const loaded = {};
        this.svCodes.forEach(c => { if (c && c.codeGrp) loaded[c.codeGrp] = true; });
        this._svLoadedGrps = loaded;
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
      this._svLoadedGrps = {};
      this._svInflight = {};
    },
  },
});
