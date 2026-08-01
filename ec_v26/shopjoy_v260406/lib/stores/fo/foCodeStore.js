/**
 * FO (Front Office) 공통 코드 Pinia 스토어 (그리드 형식)
 * - 화면 단위 지연 로딩(saLoadCodes)으로 필요한 코드그룹만 받아 svCodes 에 누적한다.
 * - FO 화면은 svCodes 를 직접 읽는다 (Sample11~14 등).
 *
 * ※ 게터(sgGetGrpCodes 등)는 2026-08-01 제거했다. 호출처가 하나도 없었고,
 *   내용도 snake_case(use_yn/code_value)를 읽어 _fnNormCodeRows 의 camelCase 정규화와
 *   어긋나 있어 호출했어도 빈 배열이 나왔을 코드였다.
 *   FO 에서 select 용 목록이 필요해지면 BO(boCodeStore.sgGetGrpCodes)를 기준으로 새로 만들 것.
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
     * 초기화 (로그아웃 시)
     */
    saClear() {
      this.svCodes = [];
      this._svLoadedGrps = {};
      this._svInflight = {};
    },
  },
});
