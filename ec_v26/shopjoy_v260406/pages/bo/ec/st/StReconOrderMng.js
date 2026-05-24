/* ShopJoy Admin - 주문-정산 대사 */
window.StReconOrderMng = {
  name: 'StReconOrderMng',
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
      order_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

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

            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const rows = reactive([]);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', diff: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const cfSummary = computed(() => ({
      match:   rows.filter(r => r.diffStatus==='일치').length,
      over:    rows.filter(r => r.diffStatus==='정산과다').length,
      under:   rows.filter(r => r.diffStatus==='정산부족').length,
      diffAmt: rows.reduce((s, r) => s + Math.abs(r.diff||0), 0),
    }));

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize, typeCd: 'ORDER',
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'orderId,custNm';
        }
        const res = await boApiSvc.stRecon.getPage(params, '주문-정산 대사', '목록조회');
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
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green', '정산과다':'badge-red', '정산부족':'badge-orange' }[s] || 'badge-gray');

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
      { key: 'dateRange', label: '주문일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px',
        sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [{ value: 'orderId', label: '주문ID' }, { value: 'custNm', label: '고객명' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    const baseGridColumns = [
      { key: 'orderId',    label: '주문ID' },
      { key: 'orderDate',  label: '주문일' },
      { key: 'vendorNm',   label: '업체' },
      { key: 'orderAmt',   label: '주문금액', fmt: fmtW },
      { key: 'settleAmt',  label: '정산기준액', fmt: fmtW },
      { key: 'reconAmt',   label: '실정산액', fmt: fmtW },
      { key: 'diff',       label: '차이금액',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiState, handleDateRangeChange, codes, pager, rows, baseSearchColumns, baseGridColumns, cfSummary, fnDiffBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">주문-정산 대사</div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">주문 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 주문금액(order_amt) vs 정산수집 금액(recon_amt) 차이를 자동 비교합니다. • 차이 상태: 일치 / 차이발생 / 검토중 / 처리완료 • 차이 발생 건은 원인 파악 후 조정(StSettleAdjMng)으로 처리하거나 수동 대사 확인합니다.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px"
      :columns="baseSearchColumns" :param="searchParam"
      @search="onSearch" @reset="onReset" />
  </div>
    <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4">
        <div style="font-size:11px;color:#888">일치</div>
        <div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.match }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8">
        <div style="font-size:11px;color:#888">정산과다</div>
        <div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.over }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0">
        <div style="font-size:11px;color:#888">정산부족</div>
        <div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.under }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">차이금액 합계</div>
        <div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(cfSummary.diffAmt) }}</div>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="rows" :pager="pager" row-key="orderId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'"
      @set-page="setPage" @size-change="onSizeChange"></bo-grid>
  </div>
</div>

    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 카드 영역 =================================================== -->`,
};
