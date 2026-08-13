/**
 * BO 공통 코드 Pinia 스토어 (그리드 형식)
 * - 시스템 공통 코드 관리
 */
window.useBoCodeStore = Pinia.defineStore('boCode', {
  state: () => ({
    svCodes: [], // 배열: [{ codeGrp, codeId, codeNm, codeVal, ... }, ...]
    /* 지연 로딩 캐시 — 조회 완료한 그룹(빈 결과 포함) / 진행 중 Promise */
    _svLoadedGrps: {},
    _svInflight: {},
  }),

  getters: {
    // 코드 그룹을 { codeValue, codeLabel } 형식으로 변환 — 화면 select 의 표준 입력
    sgGetGrpCodes: (s) => (grpVal) => {
      if (!Array.isArray(s.svCodes)) return [];
      return s.svCodes
        .filter(c => c.codeGrp === grpVal && c.useYn !== 'N')
        .sort((a, b) => (Number(a.codeSortOrd || 0) - Number(b.codeSortOrd || 0)))
        .map(c => ({ codeValue: c.codeVal, codeLabel: (c.codeNm || c.codeVal) }));
    },
    // codeOpt1 조회 (배지 클래스 등) — coUtil.cofCodeBadge 가 사용
    //   codeVal 우선, 없으면 codeNm(라벨)으로도 매칭
    sgGetCodeOpt1: (s) => (grpVal, codeVal) => {
      if (!Array.isArray(s.svCodes)) return '';
      const code = s.svCodes.find(c => c.codeGrp === grpVal && (c.codeVal === codeVal || c.codeNm === codeVal));
      return code?.codeOpt1 || '';
    },
  },

  actions: {
    /**
     * 코드그룹 지연 로딩 — 캐시에 없는 그룹만 배치로 받아 누적한다.
     *
     * <p>부팅 시 전체 코드(133종)를 싣지 않고 화면이 필요한 것만 가져오는 방식.
     * 두 번째 탭부터는 캐시 히트로 API 가 나가지 않는다.</p>
     *
     * <pre>
     * const fnLoadCodes = async () => {
     *   await codeStore.saLoadCodes(['PROD_TYPE_CD', 'PRODUCT_STATUS']);
     *   codes.prod_types = codeStore.sgGetGrpCodes('PROD_TYPE_CD');
     * };
     * </pre>
     *
     * @param {string[]} grps 필요한 코드그룹 목록
     */
    async saLoadCodes(grps, opts = {}) {
      const want = (Array.isArray(grps) ? grps : [grps]).filter(g => g && typeof g === 'string');
      if (!want.length) return;

      /* 이미 적재됐거나(빈 결과 포함) 요청 중인 그룹은 제외 */
      const need = [...new Set(want)].filter(g => !this._svLoadedGrps[g]);
      const inflight = need.filter(g => this._svInflight[g]).map(g => this._svInflight[g]);
      const fresh = need.filter(g => !this._svInflight[g]);

      let p = null;
      if (fresh.length) {
        p = this._saFetchGrps(fresh, opts.compNm);
        /* ① dedupe — 같은 그룹을 동시에 요청하면 이 Promise 를 공유한다 */
        fresh.forEach(g => { this._svInflight[g] = p; });
      }
      /* 남이 이미 요청한 그룹도 끝날 때까지 기다린다 — 안 기다리면 select 가 빈 채로 뜬다 */
      await Promise.all([...inflight, p].filter(Boolean));
    },

    /**
     * 코드 행 필드명 정규화.
     *
     * 이 스토어의 getter·헬퍼(28곳)는 `codeVal` / `codeNm` / `codeSortOrd` 를 읽는다.
     * 그런데 배치 API(`/co/sy/code/groups`) 는 표준 DTO 형태인 `codeValue` / `codeLabel`
     * / `sortOrd` 로 응답한다. 정규화하지 않으면 sgGetGrpCodes 가 `{}` 를 만들어
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
    async _saFetchGrps(grps, compNm) {
      try {
        const svc = window.coApiSvc;
        const res = await svc.syCode.getGrpsCodes(grps, '공통코드', '그룹조회', compNm);
        const rows = this._fnNormCodeRows(res?.data?.data || []);
        if (rows.length) this.svCodes = this.svCodes.concat(rows);
        /* ② negative caching — 응답에 없던 그룹도 "조회 완료" 로 기록해 재요청을 막는다.
           (DB 에 없는 그룹코드를 화면이 요청하는 경우가 실제로 있다) */
        grps.forEach(g => { this._svLoadedGrps[g] = true; });
      } catch (e) {
        console.warn('[codeStore.saLoadCodes] 코드그룹 조회 실패:', grps, e?.message || e);
        /* ③ 실패는 캐시하지 않는다 — 다음 진입에서 재시도할 수 있게 */
      } finally {
        grps.forEach(g => { delete this._svInflight[g]; });
      }
    },

    /** 특정 그룹 캐시 무효화 — 공통코드관리에서 저장한 뒤 호출한다 */
    saInvalidateGrps(grps) {
      const list = (Array.isArray(grps) ? grps : [grps]).filter(Boolean);
      list.forEach(g => { delete this._svLoadedGrps[g]; });
      if (list.length) {
        this.svCodes = this.svCodes.filter(c => !list.includes(c.codeGrp));
      }
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

// 함수형 유틸리티 제공
const _boCodeStoreFallback = {
  svCodes: [],
  sgGetGrpCodes: () => [],
  sgGetCodeOpt1: () => '',
};
window.sfGetBoCodeStore = () => {
  try {
    return window.useBoCodeStore?.() || _boCodeStoreFallback;
  } catch (e) {
    return _boCodeStoreFallback;
  }
};
