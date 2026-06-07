/* ShopJoy Admin - 결제-정산 대사 */
window.StReconPayMng = {
  name: 'StReconPayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
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
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'reconPays-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StReconPayMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'reconPays-pager-sizeChange') {
        baseGridPager.pageNo = 1;
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

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
    };
    boUtil.bofApplyDateRange(uiState, '이번달');

    const rows = reactive([]);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ diff: '' });
    const searchParam = reactive(_initSearchParam());
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

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
            pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, typeCd: 'PAY',
            ...coUtil.cofOmitEmpty(searchParam)
          }, '결제-정산 대사', '목록조회');
        const data = res.data?.data;
        rows.splice(0, rows.length, ...(data?.pageList || data?.list || rows));
        baseGridPager.pageTotalCount = data?.pageTotalCount || rows.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
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
    const fmtW = coUtil.cofWon;

    /* onSearch — 조회 */
    const onSearch = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

        /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'dateRange', label: '거래일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'orderId',    label: '주문ID' },
      { key: 'txDate',     label: '거래일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
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
    columns.summaryForm = [
      { key: '_match',   label: '일치',         type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:16px;">${cfSummary.value.match}건</b>` },
      { key: '_over',    label: '결제과다',     type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:16px;">${cfSummary.value.over}건</b>` },
      { key: '_under',   label: '결제부족',     type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:16px;">${cfSummary.value.under}건</b>` },
      { key: '_diffAmt', label: '차이금액 합계', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    return {
      columns,
      uiState, codes, baseGridPager, rows, searchParam,
      handleBtnAction, handleSelectAction,
      cfSummary,
      fnDiffBadge, fnPayBadge, fmtW,
    };
  },
  template: /* html */`
<bo-page title="결제-정산 대사" desc-summary="결제 승인·취소 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다." desc-detail="• PG사 결제금액(pg_amt) vs 정산 수집금액(settle_amt) 차이를 자동 비교합니다.&#10;• 결제수단: 무통장/가상계좌/토스/카카오/네이버/핸드폰&#10;• 차이 발생 시 PG사 정산 리포트와 대조 후 조정 처리합니다.">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 집계 영역 =================================================== -->
  <bo-container>
    <bo-form-area :columns="columns.summaryForm" :form="{}" :cols="3" readonly label-left compact :show-actions="false" label-width="100px" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid bare :columns="columns.baseGrid" :rows="rows" row-key="orderId" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('reconPays-pager-setPage', n)" :on-size-change="() => handleSelectAction('reconPays-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
