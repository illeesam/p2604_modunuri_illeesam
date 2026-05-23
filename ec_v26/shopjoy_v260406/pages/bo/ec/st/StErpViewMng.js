/* ShopJoy Admin - ERP 전표조회 */
window.StErpViewMng = {
  name: 'StErpViewMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      erp_statuses: [],
      erp_voucher_types: [],
      erp_voucher_statuses: [],
      date_range_opts: [],
    });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.erp_statuses = codeStore.sgGetGrpCodes('ERP_STATUS');
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        codes.erp_voucher_statuses = codeStore.sgGetGrpCodes('ERP_VOUCHER_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

            const dateEnd   = ref('');

    /* handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.bofGetDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const slips = reactive([]);

    /* _initSearchParam */
    const _initSearchParam = () => ({ searchType: '', searchValue: '', type: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        slips.splice(0, slips.length);
        pager.pageTotalCount = 0;
        pager.pageTotalPage = 1;
        fnBuildPagerNums();
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    /* doResend */
    const doResend = async (r) => {
      const ok = await showConfirm('재전송', '전표를 ERP로 재전송하시겠습니까?');
      if (!ok) return;
      r.sendStatus = '전송완료'; r.erpRef = 'ERP-JE-RESEND-' + Date.now();
      try {
        const res = await boApiSvc.stErp.resend(r.erpVoucherId || r.slipId, {}, 'ERP전표조회', '전송');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('재전송이 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* fnStatusBadge — sy_code ERP_STATUS code_opt1 우선, 없으면 FB */
    const _ERP_STATUS_FB = { '전송완료':'badge-green', '전송대기':'badge-blue', '오류':'badge-red' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('ERP_STATUS', s, _ERP_STATUS_FB[s] || 'badge-gray');

    /* fnTypeBadge — sy_code ERP_VOUCHER_TYPE_KR code_opt1 우선, 없으면 FB */
    const _ERP_VOUCHER_TYPE_FB = { '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' };
    const fnTypeBadge   = t => coUtil.cofCodeBadge('ERP_VOUCHER_TYPE_KR', t, _ERP_VOUCHER_TYPE_FB[t] || 'badge-gray');

    /* fmtW */
    const fmtW = n => Number(n||0).toLocaleString() + '원';

    /* 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // -- return ---------------------------------------------------------------

        const baseSearchColumns = [
      { key: 'dateRange', label: '전표일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'type', label: '유형', type: 'select', options: () => codes.erp_voucher_types, nullLabel: '유형 전체' },
      { key: 'status', label: '상태', type: 'select', options: () => codes.erp_voucher_statuses, nullLabel: '상태 전체' },
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'slipId', label: '전표ID' },
          { value: 'summary', label: '적요' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력', width: '180px' },
    ];

    const baseGridColumns = [
      { key: 'slipId',     label: '전표ID', cellStyle: 'font-size:11px' },
      { key: 'slipDate',   label: '전표일자' },
      { key: 'slipType',   label: '유형', badge: (row) => fnTypeBadge(row.slipType) },
      { key: 'debit',      label: '차변계정' },
      { key: 'credit',     label: '대변계정' },
      { key: 'debitAmt',   label: '금액', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'description',label: '적요',
        cellStyle: 'color:#555;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { key: 'erpRef',     label: 'ERP전표번호', cellStyle: 'font-size:11px;color:#888',
        fmt: (v) => v || '-' },
      { key: 'sendStatus', label: '전송상태', badge: (row) => fnStatusBadge(row.sendStatus) },
    ];

    return { uiState, handleDateRangeChange, codes, pager, slips, baseSearchColumns, baseGridColumns, doResend, fnStatusBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표조회</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">생성된 ERP 전표 목록을 조회하고 전송 상태 및 처리 이력을 확인합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 전표 유형: 정산지급 / 수수료 / 조정 / 기타 • 전송 상태: 미전송 / 전송완료 / 오류 • [재전송] 버튼으로 오류 건을 ERP에 재전송할 수 있습니다. • 전표 대사 확인은 ERP 전표대사(StErpReconMng)에서 합니다.
    </div>
  </div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" bar-style="flex-wrap:wrap;gap:8px" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <div class="card" style="margin-top:12px">
    <bo-grid
      :columns="baseGridColumns" :rows="slips" :pager="pager" row-key="slipId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      @set-page="setPage" @size-change="onSizeChange">
      <template #head-actions>액션</template>
      <template #row-actions="{ row: r }">
        <button v-if="r.sendStatus!=='전송완료'" class="btn btn-sm btn-blue" @click="doResend(r)">재전송</button>
      </template>
    </bo-grid>
  </div>
</div>
`,
};
