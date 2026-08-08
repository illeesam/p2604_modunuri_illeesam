/* ShopJoy Admin - 결제-정산 대사 */
window.StReconPayMng = {
  name: 'StReconPayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ error: null, dateRange: '이번달', dateRangeStart: '', dateRangeEnd: ''});
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
        Object.assign(searchParam, searchParamInit);
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['PAYMENT_METHOD', 'PAYMENT_STATUS', 'RECON_RESULT_PAY', 'DATE_RANGE_OPT'], {compNm: 'StReconPayMng'});
      try {
        codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
        codes.payment_statuses = codeStore.sgGetGrpCodes('PAYMENT_STATUS');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_PAY');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
    };
    boUtil.bofApplyDateRange(uiState, '이번달');

    const rows = reactive([]);

    const searchParam = reactive({ diff: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
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
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green', '결제과다':'badge-red', '결제부족':'badge-orange' }[s] || 'badge-gray');

    /* fnPayBadge — 결제 배지 */
    const fnPayBadge  = m => ({ '카드결제':'badge-blue', '계좌이체':'badge-green', '캐쉬':'badge-orange', '혼합결제':'badge-purple' }[m] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;





    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };



        /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'dateRange', label: '거래일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
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
      { key: '_match',   label: '일치',          fmt: () => `<b style="color:#27ae60;">${cfSummary.value.match}건</b>` },
      { key: '_over',    label: '결제과다',      fmt: () => `<b style="color:#e74c3c;">${cfSummary.value.over}건</b>` },
      { key: '_under',   label: '결제부족',      fmt: () => `<b style="color:#e67e22;">${cfSummary.value.under}건</b>` },
      { key: '_diffAmt', label: '차이금액 합계', fmt: () => `<b style="color:#333;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    return {
      columns,
      uiState, baseGridPager, rows, searchParam,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="결제-정산 대사" desc-summary="결제 승인·취소 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다." :desc-detail="['• PG사 결제금액(pg_amt) vs 정산 수집금액(settle_amt) 차이를 자동 비교합니다.','• 결제수단: 무통장/가상계좌/토스/카카오/네이버/핸드폰','• 차이 발생 시 PG사 정산 리포트와 대조 후 조정 처리합니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 집계 영역 =================================================== -->
  <bo-container>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;padding:8px 14px;background:#f8f9fb;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;">
      <span v-for="c in columns.summaryForm" :key="c.key" style="color:#666;">
        {{ c.label }}: <span v-html="c.fmt()"></span>
      </span>
    </div>
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid bare :columns="columns.baseGrid" :rows="rows" row-key="orderId" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('reconPays-pager-setPage', n)" :on-size-change="() => handleSelectAction('reconPays-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
