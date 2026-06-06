/* ShopJoy Admin - 정산지급관리 */
window.StSettlePayMng = {
  name: 'StSettlePayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      settle_pay_statuses: [],
      date_range_opts: [],
    });

    /* 정산 지급 fnLoadCodes */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StSettlePayMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'settlePays-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StSettlePayMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'settlePays-rowPay') {
        return doPay(param);
      } else if (cmd === 'settlePays-pager-sizeChange') {
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
        codes.settle_pay_statuses = codeStore.sgGetGrpCodes('SETTLE_PAY_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);
    /* 정산 지급 목록조회 */
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...coUtil.cofOmitEmpty(searchParam)
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'payId,vendorNm';
        }
        const res = await boApiSvc.stSettlePay.getPage(params, '정산지급관리', '목록조회');
        const data = res.data?.data;
        pays.splice(0, pays.length, ...(data?.pageList || data?.list || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || pays.length;
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

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
    };
    boUtil.bofApplyDateRange(uiState, '이번달');

    const pays = reactive([]);

  /* 정산 지급 _initSearchParam */
  const _initSearchParam = () => ({ searchType: '', searchValue: '', status: '' });
  const searchParam = reactive(_initSearchParam());
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });


    const cfSummary = computed(() => ({
      total:   pays.reduce((s, r) => s + r.settleAmt, 0),
      paid:    pays.filter(r => r.payStatus === '지급완료').reduce((s, r) => s + r.payAmt, 0),
      pending: pays.filter(r => r.payStatus === '지급대기').reduce((s, r) => s + r.settleAmt, 0),
    }));

    /* doPay — 실행 */
    const doPay = async (r) => {
      const ok = await showConfirm('지급처리', `[${r.vendorNm}]에게 ${Number(r.settleAmt).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) { return; }
      r.payStatus = '지급완료'; r.payAmt = r.settleAmt; r.payDate = new Date().toISOString().slice(0,10);
      try {
        const res = await boApiSvc.stSettlePay.pay(r.settlePayId || r.payId, { payAmt: r.payAmt ?? r.settleAmt }, '정산지급관리', '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('지급처리가 완료되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ '지급완료':'badge-green', '지급대기':'badge-blue', '지급보류':'badge-orange', '지급오류':'badge-red' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
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

    // 기본 그리드
    columns.baseGrid = [
      { key: 'payId',      label: '지급ID' },
      { key: 'payDate',    label: '지급일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
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

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=3, labelLeft) */
    columns.summaryForm = [
      { key: '_total',   label: '총 정산액', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSummary.value.total)}</b>` },
      { key: '_paid',    label: '지급완료',  type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${fmtW(cfSummary.value.paid)}</b>` },
      { key: '_pending', label: '지급대기',  type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:15px;">${fmtW(cfSummary.value.pending)}</b>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, baseGridPager, pays, searchParam,
      handleBtnAction, handleSelectAction,
      cfSummary, fnStatusBadge, fmtW,
    };
  },
  template: /* html */`
<bo-page title="정산지급관리"
  desc-summary="마감된 정산액의 업체별 지급 요청·확인·완료 처리 및 이의신청을 관리합니다."
  desc-detail="• 지급 상태: 지급대기 / 지급요청 / 지급완료 / 이의신청&#10;• [지급처리] 버튼으로 업체 계좌로 정산액 지급 완료 처리합니다.&#10;• 이의신청 접수 시 관련 마감을 재오픈하여 재정산할 수 있습니다.&#10;• 업체 계좌 정보는 업체관리(SyVendorMng)에서 관리합니다.">
  <!-- ===== ■. 검색 영역 ================================================= -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 집계 영역 ================================================= -->
  <bo-container>
    <bo-form-area :columns="columns.summaryForm" :form="{}" :cols="3" readonly label-left compact :show-actions="false" label-width="100px" />
  </bo-container>
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <bo-grid bare
      :columns="columns.baseGrid" :rows="pays" row-key="payId"
      :row-actions="true">
      <template #head-actions>
        <th style="text-align:right">액션</th>
      </template>
      <template #row-actions="{ row: r }">
        <button v-if="r.payStatus==='지급대기'" class="btn btn-xs btn-green" @click="handleSelectAction('settlePays-rowPay', r)">
          지급처리
        </button>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('settlePays-pager-setPage', n)" :on-size-change="() => handleSelectAction('settlePays-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
