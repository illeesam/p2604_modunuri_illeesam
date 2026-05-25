/* ShopJoy Admin - 업체-정산 대사 */
window.StReconVendorMng = {
  name: 'StReconVendorMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      vendor_settle_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StReconVendorMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-date-range') {
        return handleDateRangeChange();
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StReconVendorMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'reconVendors-set-page') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else if (cmd === 'reconVendors-size-change') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [03] 초기 함수 (마운트 / 코드 로드 / watch) ==============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.vendor_settle_statuses = codeStore.sgGetGrpCodes('VENDOR_SETTLE_STATUS');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_VENDOR');
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
      over:  rows.filter(r=>r.diffStatus==='시스템과다').length,
      under: rows.filter(r=>r.diffStatus==='업체과다').length,
    }));

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stRecon.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize, typeCd: 'VENDOR',
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '업체-정산 대사', '목록조회');
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
    const fnDiffBadge = s => ({ '일치':'badge-green','시스템과다':'badge-red','업체과다':'badge-orange' }[s] || 'badge-gray');

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

        // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'dateRange', label: '정산일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
    ];

    const baseGridColumns = [
      { key: 'vendorNm',   label: '업체명', cellStyle: 'font-weight:700' },
      { key: 'orderCnt',   label: '주문건수', fmt: (v) => v + '건' },
      { key: 'sysAmt',     label: '시스템 정산액', fmt: fmtW },
      { key: 'vendorAmt',  label: '업체 청구액', fmt: fmtW },
      { key: 'diff',       label: '차이금액',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, pager, rows, searchParam,
      baseSearchColumns, baseGridColumns,
      handleBtnAction, handleSelectAction,
      cfSummary, fnDiffBadge, fmtW,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    업체-정산 대사
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      업체가 제출한 정산 내역과 시스템 정산 데이터 간 불일치를 검출하고 대사 처리합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 시스템 집계금액(sys_amt) vs 업체 제출금액(vendor_amt) 차이를 자동 비교합니다. • 업체별 정산 명세서와 대조하여 불일치 원인을 파악합니다. • 차이 발생 시 상호 확인 후 조정(StSettleAdjMng)으로 처리합니다.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4">
        <div style="font-size:11px;color:#888">
          일치
        </div>
        <div style="font-size:20px;font-weight:700;color:#27ae60">
          {{ cfSummary.match }}건
        </div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8">
        <div style="font-size:11px;color:#888">
          시스템과다
        </div>
        <div style="font-size:20px;font-weight:700;color:#e74c3c">
          {{ cfSummary.over }}건
        </div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0">
        <div style="font-size:11px;color:#888">
          업체과다
        </div>
        <div style="font-size:20px;font-weight:700;color:#e67e22">
          {{ cfSummary.under }}건
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="rows" :pager="pager" row-key="vendorId"
      list-title="목록" :count-text="pager.pageTotalCount + '개 업체'"
      @set-page="n => handleSelectAction('reconVendors-set-page', n)" @size-change="handleSelectAction('reconVendors-size-change')">
    </bo-grid>
  </div>
</div>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. 카드 영역 =================================================== -->
`,
};
