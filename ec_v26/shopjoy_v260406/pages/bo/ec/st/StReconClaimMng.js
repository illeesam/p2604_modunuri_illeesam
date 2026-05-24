/* ShopJoy Admin - 클레임-정산 대사 */
window.StReconClaimMng = {
  name: 'StReconClaimMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      claim_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_CLAIM');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const rows = reactive([]);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ diff: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const cfSummary = computed(() => ({
      match: rows.filter(r=>r.diffStatus==='일치').length,
      over:  rows.filter(r=>r.diffStatus==='조정과다').length,
      under: rows.filter(r=>r.diffStatus==='조정부족').length,
    }));

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stRecon.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize, typeCd: 'CLAIM',
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '클레임-정산 대사', '목록조회');
        const data = res.data?.data;
        rows.splice(0, rows.length, ...(data?.pageList || data?.list || rows));
        pager.pageTotalCount = data?.pageTotalCount || rows.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green','조정과다':'badge-red','조정부족':'badge-orange' }[s] || 'badge-gray');

    /* fnTypeBadge */
    const _CLAIM_TYPE_KR_FB = { '취소':'badge-red','반품':'badge-orange','교환':'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('CLAIM_TYPE_KR', t, _CLAIM_TYPE_KR_FB[t] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ['환불완료','취소완료','교환완료'].includes(s) ? 'badge-green' : 'badge-blue';

    /* fmtW — 포맷 W */
    const fmtW = n => Number(n||0).toLocaleString() + '원';

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

        // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'dateRange', label: '요청일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
    ];

    const baseGridColumns = [
      { key: 'claimId',    label: '클레임ID' },
      { key: 'reqDate',    label: '요청일' },
      { key: 'type',       label: '유형', badge: (row) => fnTypeBadge(row.type) },
      { key: 'refundAmt',  label: '환불액', fmt: (v) => v > 0 ? fmtW(v) : '-' },
      { key: 'settleAdj',  label: '정산조정기준', fmt: (v) => v !== 0 ? fmtW(v) : '-',
        cellStyle: (v) => v < 0 ? 'color:#e74c3c' : '' },
      { key: 'reconAdj',   label: '실반영액', fmt: (v) => v !== 0 ? fmtW(v) : '-',
        cellStyle: (v) => v < 0 ? 'color:#e74c3c' : '' },
      { key: 'diff',       label: '차이',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'status',     label: '처리상태', badge: (row) => fnStatusBadge(row.status) },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiState, handleDateRangeChange, codes, pager, rows, baseSearchColumns, baseGridColumns, cfSummary, fnDiffBadge, fnTypeBadge, fnStatusBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">클레임-정산 대사</div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">클레임(취소·반품·교환) 환불 데이터와 정산 조정액 간 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 클레임 환불금액(refund_amt) vs 정산 차감 조정액(settle_adj) 차이를 자동 비교합니다. • 클레임 유형: 취소 / 반품 / 교환 • 차이 발생 건은 조정(StSettleAdjMng) 또는 기타조정(StSettleEtcAdjMng)으로 보정합니다.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4">
        <div style="font-size:11px;color:#888">일치</div>
        <div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.match }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8">
        <div style="font-size:11px;color:#888">조정과다</div>
        <div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.over }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0">
        <div style="font-size:11px;color:#888">조정부족</div>
        <div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.under }}건</div>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="rows" :pager="pager" row-key="claimId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      @set-page="setPage" @size-change="onSizeChange"></bo-grid>
  </div>
</div>

    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->`,
};
