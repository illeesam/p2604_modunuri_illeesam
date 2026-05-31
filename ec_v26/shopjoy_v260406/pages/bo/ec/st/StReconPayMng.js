/* ShopJoy Admin - 결제-정산 대사 */
window.StReconPayMng = {
  name: 'StReconPayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      payment_methods: [],
      payment_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StReconPayMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
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
      console.log(' ■■ StReconPayMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'reconPays-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else if (cmd === 'reconPays-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
        codes.payment_statuses = codeStore.sgGetGrpCodes('PAYMENT_STATUS');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_PAY');
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
      match:   rows.filter(r=>r.diffStatus==='일치').length,
      over:    rows.filter(r=>r.diffStatus==='결제과다').length,
      under:   rows.filter(r=>r.diffStatus==='결제부족').length,
      diffAmt: rows.reduce((s,r)=>s+Math.abs(r.diff||0),0),
    }));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stRecon.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize, typeCd: 'PAY',
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '결제-정산 대사', '목록조회');
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
    const fnDiffBadge = s => ({ '일치':'badge-green', '결제과다':'badge-red', '결제부족':'badge-orange' }[s] || 'badge-gray');

    /* fnPayBadge — 결제 배지 */
    const fnPayBadge  = m => ({ '카드결제':'badge-blue', '계좌이체':'badge-green', '캐쉬':'badge-orange', '혼합결제':'badge-purple' }[m] || 'badge-gray');

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

        /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'dateRange', label: '거래일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'orderId',    label: '주문ID' },
      { key: 'txDate',     label: '거래일' },
      { key: 'payMethod',  label: '결제수단', badge: (row) => fnPayBadge(row.payMethod) },
      { key: 'payAmt',     label: '주문금액', fmt: fmtW },
      { key: 'pgAmt',      label: 'PG정산액', fmt: fmtW },
      { key: 'settleAmt',  label: '정산기준액', fmt: fmtW },
      { key: 'diff',       label: '차이금액',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=4, labelLeft) */
    const summaryFormColumns = [
      { key: '_match',   label: '일치',         type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:16px;">${cfSummary.value.match}건</b>` },
      { key: '_over',    label: '결제과다',     type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:16px;">${cfSummary.value.over}건</b>` },
      { key: '_under',   label: '결제부족',     type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:16px;">${cfSummary.value.under}건</b>` },
      { key: '_diffAmt', label: '차이금액 합계', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    return {
      uiState, codes, pager, rows, searchParam,
      baseSearchColumns, baseGridColumns, summaryFormColumns,
      handleBtnAction, handleSelectAction,
      cfSummary,
      fnDiffBadge, fnPayBadge, fmtW,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    결제-정산 대사
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      결제 승인·취소 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • PG사 결제금액(pg_amt) vs 정산 수집금액(settle_amt) 차이를 자동 비교합니다. • 결제수단: 무통장/가상계좌/토스/카카오/네이버/핸드폰 • 차이 발생 시 PG사 정산 리포트와 대조 후 조정 처리합니다.
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
    <bo-form-area :columns="summaryFormColumns" :form="{}" :cols="3" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="rows" row-key="orderId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      @set-page="n => handleSelectAction('reconPays-pager-setPage', n)" @size-change="handleSelectAction('reconPays-pager-sizeChange')">
    </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('reconPays-pager-setPage', n)" :on-size-change="() => handleSelectAction('reconPays-pager-sizeChange')" />
  </div>
</div>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. 카드 영역 =================================================== -->
`,
};
