/* ShopJoy Admin - 정산지급관리 */
window.StSettlePayMng = {
  name: 'StSettlePayMng',
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
      settle_pay_statuses: [],
      date_range_opts: [],
    });

    /* 정산 지급 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.settle_pay_statuses = codeStore.sgGetGrpCodes('SETTLE_PAY_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* 정산 지급 목록조회 */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'payId,vendorNm';
        }
        const res = await boApiSvc.stSettlePay.getPage(params, '정산지급관리', '목록조회');
        const data = res.data?.data;
        payList.splice(0, payList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || payList.length;
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

            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const payList = reactive([]);

  /* 정산 지급 _initSearchParam */
  const _initSearchParam = () => ({ searchType: '', searchValue: '', status: '' });
  const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const cfSummary = computed(() => ({
      total:   payList.reduce((s, r) => s + r.settleAmt, 0),
      paid:    payList.filter(r => r.payStatus === '지급완료').reduce((s, r) => s + r.payAmt, 0),
      pending: payList.filter(r => r.payStatus === '지급대기').reduce((s, r) => s + r.settleAmt, 0),
    }));

    /* doPay — 실행 */
    const doPay = async (r) => {
      const ok = await showConfirm('지급처리', `[${r.vendorNm}]에게 ${Number(r.settleAmt).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) return;
      r.payStatus = '지급완료'; r.payAmt = r.settleAmt; r.payDate = new Date().toISOString().slice(0,10);
      try {
        const res = await boApiSvc.stSettlePay.pay(r.settlePayId || r.payId, { payAmt: r.payAmt ?? r.settleAmt }, '정산지급관리', '저장');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('지급처리가 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '지급완료':'badge-green', '지급대기':'badge-blue', '지급보류':'badge-orange', '지급오류':'badge-red' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

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
      { key: 'dateRange', label: '지급일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'status', label: '상태', type: 'select', options: () => codes.settle_pay_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'payId',    label: '지급ID' },
          { value: 'vendorNm', label: '업체명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    const baseGridColumns = [
      { key: 'payId',      label: '지급ID' },
      { key: 'payDate',    label: '지급일' },
      { key: 'vendorNm',   label: '업체명', cellStyle: 'font-weight:700' },
      { key: 'closeMon',   label: '정산월' },
      { key: 'settleAmt',  label: '정산액', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'payAmt',     label: '지급액',
        fmt: (v) => v > 0 ? fmtW(v) : '-',
        cellStyle: (v) => v > 0 ? 'color:#27ae60;font-weight:700' : 'color:#999' },
      { key: 'bankNm',     label: '은행' },
      { key: 'bankAccount',label: '계좌번호', cellStyle: 'color:#666' },
      { key: 'bankHolder', label: '예금주' },
      { key: 'payStatus',  label: '상태', badge: (row) => fnStatusBadge(row.payStatus) },
      { key: 'regUserNm',  label: '담당자' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return { uiState, codes, handleDateRangeChange, pager, payList, baseSearchColumns, baseGridColumns, cfSummary, doPay, fnStatusBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">정산지급관리</div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">마감된 정산액의 업체별 지급 요청·확인·완료 처리 및 이의신청을 관리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 지급 상태: 지급대기 / 지급요청 / 지급완료 / 이의신청 • [지급처리] 버튼으로 업체 계좌로 정산액 지급 완료 처리합니다. • 이의신청 접수 시 관련 마감을 재오픈하여 재정산할 수 있습니다. • 업체 계좌 정보는 업체관리(SyVendorMng)에서 관리합니다.
    </div>
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">총 정산액</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(cfSummary.total) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0fff4">
        <div style="font-size:11px;color:#888">지급완료</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(cfSummary.paid) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">지급대기</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ fmtW(cfSummary.pending) }}</div>
      </div>
    </div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="payList" :pager="pager" row-key="payId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      @set-page="setPage" @size-change="onSizeChange">
      <template #head-actions>액션</template>
      <template #row-actions="{ row: r }">
        <button v-if="r.payStatus==='지급대기'" class="btn btn-sm btn-green" @click="doPay(r)">지급처리</button>
      </template>
    </bo-grid>
  </div>
</div>
`,
};
