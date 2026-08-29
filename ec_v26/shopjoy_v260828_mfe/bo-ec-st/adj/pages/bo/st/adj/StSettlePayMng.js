/* ShopJoy Admin - 정산지급관리 */
export default {
  name: 'st-adj-stSettlePayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
const uiState = reactive({ error: null, dateRange: '이번달', dateRangeStart: '', dateRangeEnd: ''});
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
        Object.assign(searchParam, searchParamInit);
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
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['SETTLE_PAY_STATUS_KR', 'DATE_RANGE_OPT'], {compNm: 'StSettlePayMng'});
      try {
        codes.settle_pay_statuses = codeStore.sgGetGrpCodes('SETTLE_PAY_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
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
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
    };
    boUtil.bofApplyDateRange(uiState, '이번달');

    const pays = reactive([]);
    const excelModal = reactive({ show: false });   // 엑셀 다운로드 모달 표시 여부

  const searchParam = reactive({ searchType: '', searchValue: '', payStatusCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });


    /* ⚠ 상태는 한글 라벨이 아니라 코드값으로 비교해야 한다.
       실 데이터는 SETTLE_PAY_STATUS 코드(PENDING/COMPLT/FAILED/CANCELLED/…)이고
       '지급완료' 같은 라벨과 비교하면 항상 false 라 집계가 0 으로 나온다.
       settleAmt 는 백엔드 Item 에 없어 payAmt 로 집계한다. */
    const cfSummary = computed(() => ({
      total:   pays.reduce((s, r) => s + (r.payAmt || 0), 0),
      paid:    pays.filter(r => r.payStatusCd === 'COMPLT').reduce((s, r) => s + (r.payAmt || 0), 0),
      pending: pays.filter(r => r.payStatusCd === 'PENDING').reduce((s, r) => s + (r.payAmt || 0), 0),
    }));

    /* doPay — 실행 */
    const doPay = async (r) => {
      const ok = await showConfirm('지급처리', `[${r.vendorId}] 업체에 ${Number(r.payAmt || 0).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) { return; }
      r.payStatusCd = 'COMPLT'; r.payDate = coUtil.cofToYmd(new Date());
      try {
        const res = await boApiSvc.stSettlePay.pay(r.settlePayId, { payAmt: r.payAmt }, '정산지급관리', '저장');
        if (showToast) { showToast('지급처리가 완료되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnStatusBadge — 상태 배지 */
    /* SETTLE_PAY_STATUS 코드값 기준 (한글 라벨 아님 — 실 데이터가 코드다) */
    const fnStatusBadge = s => ({ COMPLT:'badge-green', PENDING:'badge-blue', FAILED:'badge-red',
      CANCELLED:'badge-gray', PARTIAL_REFUND:'badge-orange', REFUNDED:'badge-orange' }[s] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'dateRange', label: '지급일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'payStatusCd', label: '상태', type: 'select', options: () => codes.settle_pay_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'payId',    label: '지급ID' },
          { value: 'vendorNm', label: '업체명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    /* 기본 그리드
       ⚠ key 는 백엔드 StSettlePayDto.Item 필드명과 일치해야 값이 표시된다.
          이름이 다르면 에러 없이 빈 칸으로만 보인다.
       제거한 컬럼: closeMon(정산월) / settleAmt(정산액) — 백엔드 Item 에 대응 필드가 없어
          항상 빈 값이었다. 필요하면 백엔드에 st_settle 조인으로 추가할 것.
       vendorNm / regUserNm 도 조인 필드가 없어 ID(vendorId/regBy)로 표시한다.
       상세 → _doc/정책서/ec/st/st.06.정산화면-백엔드불일치.md */
    columns.baseGrid = [
      { key: 'settlePayId', label: '지급ID' },
      { key: 'payDate',    label: '지급일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'vendorId',   label: '업체', cellStyle: 'font-weight:700' },
      { key: 'payAmt',     label: '지급액',
        fmt: (v) => v > 0 ? fmtW(v) : '-',
        cellStyle: (v) => v > 0 ? 'color:#27ae60;font-weight:700' : 'color:#999' },
      { key: 'bankNm',     label: '은행' },
      { key: 'bankAccount',label: '계좌번호', cellStyle: 'color:#666' },
      { key: 'bankHolder', label: '예금주' },
      { key: 'payStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.payStatusCd) },
      { key: 'regBy',      label: '담당자' },
      { type: 'actions', actions: [
        { label: '지급처리', cls: 'btn btn-xs btn-green', visible: (row) => row.payStatusCd === 'PENDING',
          onClick: (row) => handleSelectAction('settlePays-rowPay', row) },
      ] },
    ];

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=3, labelLeft) */
    columns.summaryForm = [
      { key: '_total',   label: '총 정산액', fmt: () => `<b style="color:#333;">${fmtW(cfSummary.value.total)}</b>` },
      { key: '_paid',    label: '지급완료',  fmt: () => `<b style="color:#27ae60;">${fmtW(cfSummary.value.paid)}</b>` },
      { key: '_pending', label: '지급대기',  fmt: () => `<b style="color:#3498db;">${fmtW(cfSummary.value.pending)}</b>` },
    ];

    /* buildExcelParams — 엑셀 다운로드 조건 (목록 조회와 동일한 필터 기준) */
    const buildExcelParams = () => coUtil.cofOmitEmpty(searchParam);

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, baseGridPager, pays, searchParam, excelModal,
      handleBtnAction, handleSelectAction, buildExcelParams,
    };
  },
  template: /* html */`
<bo-page title="정산지급관리" :share-query="searchParam"
  desc-summary="마감된 정산액의 업체별 지급 요청·확인·완료 처리 및 이의신청을 관리합니다."
  :desc-detail="['• 지급 상태: 지급대기 / 지급요청 / 지급완료 / 이의신청','• [지급처리] 버튼으로 업체 계좌로 정산액 지급 완료 처리합니다.','• 이의신청 접수 시 관련 마감을 재오픈하여 재정산할 수 있습니다.','• 업체 계좌 정보는 업체관리(SyVendorMng)에서 관리합니다.'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 ================================================= -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 집계 영역 ================================================= -->
  <bo-container>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;padding:8px 14px;background:#f8f9fb;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;">
      <span v-for="c in columns.summaryForm" :key="c.key" style="color:#666;">
        {{ c.label }}: <span v-html="c.fmt()"></span>
      </span>
    </div>
  </bo-container>
  <!-- ===== ■. 목록 영역 ================================================= -->
  <bo-container title="목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="pays" row-key="payId">
      <template #head-actions>
        액션
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('settlePays-pager-setPage', n)" :on-size-change="() => handleSelectAction('settlePays-pager-sizeChange')" />
  </bo-container>
  <bo-excel-down-modal :show="excelModal.show" domain="stSettlePay" area-nm="정산지급관리"
    ui-nm="정산지급관리" :columns="columns.baseGrid" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
