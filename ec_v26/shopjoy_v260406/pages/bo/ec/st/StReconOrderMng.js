/* ShopJoy Admin - 주문-정산 대사 */
window.StReconOrderMng = {
  name: 'StReconOrderMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      order_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StReconOrderMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'reconOrders-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StReconOrderMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'reconOrders-pager-sizeChange') {
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
        codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_ORDER');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleDateRangeChange — 기간 변경 (searchParam.dateRange → dateStart/dateEnd) */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
    };

    const rows = reactive([]);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', reconStatusCd: '', dateType: 'reg_date', dateRange: '', dateStart: '', dateEnd: '' });
    const searchParam = reactive(_initSearchParam());
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });


    const cfSummary = computed(() => ({
      match:   rows.filter(r => r.diffStatus==='일치').length,
      over:    rows.filter(r => r.diffStatus==='정산과다').length,
      under:   rows.filter(r => r.diffStatus==='정산부족').length,
      diffAmt: rows.reduce((s, r) => s + Math.abs(r.diff||0), 0),
    }));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, typeCd: 'ORDER',
          ...coUtil.cofOmitEmpty(searchParam)
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'refId,refNo';
        }
        const res = await boApiSvc.stRecon.getPage(params, '주문-정산 대사', '목록조회');
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
    const fnDiffBadge = s => ({ '일치':'badge-green', '정산과다':'badge-red', '정산부족':'badge-orange' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;





    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };



    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // --- [컬럼 정의] ---

    const columns = {};
    columns.baseSearch = [
      { key: 'dateRange', label: '대사일', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => [{ value: 'reg_date', label: '등록일' }, { value: 'upd_date', label: '수정일' }],
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px',
        sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'reconStatusCd', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [{ value: 'refId', label: '주문ID' }, { value: 'refNo', label: '주문번호' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'orderId',    label: '주문ID' },
      { key: 'orderDate',  label: '주문일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'vendorNm',   label: '업체' },
      { key: 'orderAmt',   label: '주문금액', fmt: fmtW },
      { key: 'settleAmt',  label: '정산기준액', fmt: fmtW },
      { key: 'reconAmt',   label: '실정산액', fmt: fmtW },
      { key: 'diff',       label: '차이금액',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=4, labelLeft) */
    columns.summaryForm = [
      { key: '_match',   label: '일치',         type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:16px;">${cfSummary.value.match}건</b>` },
      { key: '_over',    label: '정산과다',     type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:16px;">${cfSummary.value.over}건</b>` },
      { key: '_under',   label: '정산부족',     type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:16px;">${cfSummary.value.under}건</b>` },
      { key: '_diffAmt', label: '차이금액 합계', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, baseGridPager, rows, searchParam,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, // dispatch
    };
  },
  template: /* html */`
<bo-page title="주문-정산 대사"
  desc-summary="주문 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다."
  :desc-detail="'• 주문금액(order_amt) vs 정산수집 금액(recon_amt) 차이를 자동 비교합니다.\n• 차이 상태: 일치 / 차이발생 / 검토중 / 처리완료\n• 차이 발생 건은 원인 파악 후 조정(StSettleAdjMng)으로 처리하거나 수동 대사 확인합니다.'">
  <!-- ===== ■. 검색 영역 ================================================= -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-form-area :columns="columns.summaryForm" :form="{}" :cols="3" readonly label-left compact :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="rows" row-key="orderId" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('reconOrders-pager-setPage', n)" :on-size-change="() => handleSelectAction('reconOrders-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
