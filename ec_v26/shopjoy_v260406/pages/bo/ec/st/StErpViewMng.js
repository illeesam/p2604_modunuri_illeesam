/* ShopJoy Admin - ERP 전표조회 */
window.StErpViewMng = {
  name: 'StErpViewMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, onMounted } = Vue;
    const { showToast, showConfirm } = window.boApp;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, dateType: 'voucher_date', dateRange: '이번달', dateStart: '', dateEnd: '' });
    const codes = reactive({ erp_statuses: [], erp_voucher_types: [], erp_voucher_statuses: [], date_range_opts: [] });
    const slips = reactive([]);

    const _initSearchParam = () => ({ searchType: '', searchValue: '', erpVoucherTypeCd: '', erpVoucherStatusCd: '' });
    const searchParam = reactive(_initSearchParam());
    boUtil.bofApplyDateRange(uiState, '이번달'); // 진입 시 기본 기간 적용

    /* baseGrid — pager + 페이지 액션 캡슐 (수동) */
    const baseGrid = reactive({
      pager: { pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1,
               pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageNums: [], pageCond: {} },
      setPage: (n) => { if (n >= 1 && n <= baseGrid.pager.pageTotalPage) { baseGrid.pager.pageNo = n; handleSearchList(); } },
      onSizeChange: () => { baseGrid.pager.pageNo = 1; handleSearchList(); },
      reset: () => { baseGrid.pager.pageNo = 1; },
      applyPage: (d) => {
        d = d || {};
        baseGrid.pager.pageTotalCount = d.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage  = d.pageTotalPage  || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGrid.pager);
        Object.assign(baseGrid.pager.pageCond, d.pageCond || {});
        return d.pageList || [];
      },
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param) => {
      if (cmd === 'searchParam-list')      { baseGrid.pager.pageNo = 1; return handleSearchList(); }
      if (cmd === 'searchParam-reset')     { Object.assign(searchParam, _initSearchParam()); baseGrid.reset(); return handleSearchList(); }
      if (cmd === 'searchParam-dateRange') { boUtil.bofApplyDateRange(uiState); baseGrid.pager.pageNo = 1; return; }
      if (cmd === 'slips-pager-setPage')   return baseGrid.setPage(param);
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param) => {
      if (cmd === 'slips-rowResend')       return handleResend(param);
      if (cmd === 'slips-pager-sizeChange') return baseGrid.onSizeChange();
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.erp_statuses         = s.sgGetGrpCodes('ERP_STATUS');
      codes.erp_voucher_types    = s.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
      codes.erp_voucher_statuses = s.sgGetGrpCodes('ERP_VOUCHER_STATUS_KR');
      codes.date_range_opts      = s.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      try {
        slips.splice(0, slips.length);
        baseGrid.applyPage({});
      } catch (err) { uiState.error = err.message; }
    };

    /* handleResend — 전표 ERP 재전송 */
    const handleResend = async (r) => {
      if (!(await showConfirm('재전송', '전표를 ERP로 재전송하시겠습니까?'))) return;
      r.sendStatus = '전송완료'; r.erpRef = 'ERP-JE-RESEND-' + Date.now();
      try {
        await boApiSvc.stErp.resend(r.erpVoucherId || r.slipId, {}, 'ERP전표조회', '전송');
        showToast('재전송이 완료되었습니다.', 'success');
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 컬럼정의) #################################### */

    const _STATUS_FB = { '전송완료': 'badge-green', '전송대기': 'badge-blue', '오류': 'badge-red' };
    const _TYPE_FB   = { '정산': 'badge-blue', '수수료': 'badge-orange', '반품조정': 'badge-red' };

    const columns = {};
    columns.baseSearch = [
      { key: 'dateRange', label: '전표일', type: 'dateRange', paramObj: uiState,
        typeKey: 'dateType',
        typeOptions: [
          { value: 'voucher_date', label: '전표일자' },
          { value: 'reg_date', label: '등록일' },
          { value: 'upd_date', label: '수정일' },
        ],
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'erpVoucherTypeCd', label: '유형', type: 'select', options: () => codes.erp_voucher_types, nullLabel: '유형 전체' },
      { key: 'erpVoucherStatusCd', label: '상태', type: 'select', options: () => codes.erp_voucher_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'erpVoucherId', label: '전표ID' },
          { value: 'erpVoucherDesc', label: '적요' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    columns.baseGrid = [
      { key: 'slipId',     label: '전표ID', cellStyle: 'font-size:11px' },
      { key: 'slipDate',   label: '전표일자',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'slipType',   label: '유형', badge: (row) => coUtil.cofCodeBadge('ERP_VOUCHER_TYPE_KR', row.slipType, _TYPE_FB[row.slipType] || 'badge-gray') },
      { key: 'debit',      label: '차변계정' },
      { key: 'credit',     label: '대변계정' },
      { key: 'debitAmt',   label: '금액', fmt: coUtil.cofWon, cellStyle: 'font-weight:700' },
      { key: 'description',label: '적요',
        cellStyle: 'color:#555;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { key: 'erpRef',     label: 'ERP전표번호', cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'sendStatus', label: '전송상태', badge: (row) => coUtil.cofCodeBadge('ERP_STATUS', row.sendStatus, _STATUS_FB[row.sendStatus] || 'badge-gray') },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, slips, searchParam, baseGrid,
      handleBtnAction, handleSelectAction,
    };
  },
  template: /* html */`
<bo-page title="ERP 전표조회"
  desc-summary="생성된 ERP 전표 목록을 조회하고 전송 상태 및 처리 이력을 확인합니다."
  :desc-detail="'• 전표 유형: 정산지급 / 수수료 / 조정 / 기타\n• 전송 상태: 미전송 / 전송완료 / 오류\n• [재전송] 버튼으로 오류 건을 ERP에 재전송할 수 있습니다.\n• 전표 대사 확인은 ERP 전표대사(StErpReconMng)에서 합니다.'">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="목록" :count-text="baseGrid.pager.pageTotalCount + '건'">
    <bo-grid bare
      :columns="columns.baseGrid" :rows="slips" :pager="baseGrid.pager" row-key="slipId"
      :row-actions="true">
      <template #head-actions>
        <th style="text-align:right">액션</th>
      </template>
      <template #row-actions="{ row: r }">
        <div class="actions">
          <button v-if="r.sendStatus!=='전송완료'" class="btn btn-xs btn-blue" @click="handleSelectAction('slips-rowResend', r)">
            재전송
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGrid.pager" :on-set-page="n => handleBtnAction('slips-pager-setPage', n)" :on-size-change="() => handleSelectAction('slips-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
