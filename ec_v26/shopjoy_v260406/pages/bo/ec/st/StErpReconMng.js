/* ShopJoy Admin - ERP 전표대사 */
window.StErpReconMng = {
  name: 'StErpReconMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      erp_recon_statuses: [],
      erp_voucher_types: [],
      erp_recon_results: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StErpReconMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 안내 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StErpReconMng.js : handleSelectAction -> ', cmd, param);
      // 대사 차이 조정 처리
      if (cmd === 'recons-rowFix') {
        return doFix(param);
      // 페이지 번호 변경
      } else if (cmd === 'recons-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'recons-pager-sizeChange') {
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
        codes.erp_recon_statuses = codeStore.sgGetGrpCodes('ERP_RECON_STATUS');
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        codes.erp_recon_results = codeStore.sgGetGrpCodes('ERP_RECON_RESULT');
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

    const recons = reactive([]);

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => ({ diff: '', type: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const cfSummary = computed(() => ({
      match:     recons.filter(r=>r.diffStatus==='일치').length,
      diff:      recons.filter(r=>r.diffStatus==='차이').length,
      noReflect: recons.filter(r=>r.diffStatus==='미반영').length,
      diffAmt:   recons.reduce((s,r)=>s+Math.abs(r.diff||0),0),
    }));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stErp.getReconPage({
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          dateStart: uiState.dateStart, dateEnd: uiState.dateEnd,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        }, 'ERP전표대사', '목록조회');
        const data = res.data?.data;
        recons.splice(0, recons.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || {});
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    /* doFix — 실행 */
    const doFix = async (r) => {
      const ok = await showConfirm('조정처리', '해당 전표 대사 차이를 조정처리 하시겠습니까?');
      if (!ok) { return; }
      r.erpAmt = r.sysAmt; r.diff = 0; r.diffStatus = '일치'; r.remark = '조정처리 완료';
      try {
        const res = await boApiSvc.stErp.fixRecon(r.reconId, {}, 'ERP대사관리', '저장');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('조정처리 되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green', '차이':'badge-orange', '미반영':'badge-red' }[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');

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
      { key: 'dateRange', label: '대사일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'type', label: '유형', type: 'select', options: () => codes.erp_voucher_types, nullLabel: '유형 전체' },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.erp_recon_results, nullLabel: '결과 전체' },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'reconId',    label: '대사ID' },
      { key: 'reconDate',  label: '대사일자' },
      { key: 'slipId',     label: '전표ID', cellStyle: 'font-size:11px' },
      { key: 'slipType',   label: '유형', badge: (row) => fnTypeBadge(row.slipType) },
      { key: 'sysAmt',     label: '시스템금액', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'erpAmt',     label: 'ERP금액', fmt: (v) => v > 0 ? fmtW(v) : '-' },
      { key: 'diff',       label: '차이금액', fmt: (v) => v > 0 ? fmtW(v) : '-',
        cellStyle: (v) => v > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
      { key: 'remark',     label: '비고',
        cellStyle: 'font-size:11px;color:#888;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
    ];

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=4, labelLeft) */
    const summaryFormColumns = [
      { key: '_match',     label: '일치',          type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:16px;">${cfSummary.value.match}건</b>` },
      { key: '_diff',      label: '금액 차이',     type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:16px;">${cfSummary.value.diff}건</b>` },
      { key: '_noReflect', label: '미반영',        type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:16px;">${cfSummary.value.noReflect}건</b>` },
      { key: '_diffAmt',   label: '차이금액 합계', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes, pager, recons, searchParam,                                  // 상태 / 데이터
      baseSearchColumns, baseGridColumns, summaryFormColumns,                          // 컬럼 정의
      handleBtnAction, handleSelectAction,                                             // dispatch
      cfSummary,                                                                       // computed
      fnDiffBadge, fnTypeBadge, fmtW,                                                  // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    ERP 전표대사
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      ERP로 전송된 전표와 ERP 처리 결과를 대사하여 불일치 전표를 수정합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • ShopJoy 전표금액 vs ERP 처리금액 차이를 자동 비교합니다. • 차이 상태: 일치 / 차이발생 / 오류 • [오류수정] 버튼으로 전표 재생성 또는 ERP 수동 반영을 처리합니다. • 유형 필터: 정산지급 / 수수료 / 조정 / 기타
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
    <bo-form-area :columns="summaryFormColumns" :form="{}" :cols="4" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="recons" :pager="pager" row-key="reconId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      @set-page="n => handleSelectAction('recons-pager-setPage', n)" @size-change="handleSelectAction('recons-pager-sizeChange')">
      <template #head-actions>
        액션
      </template>
      <template #row-actions="{ row: r }">
        <button v-if="r.diffStatus!=='일치'" class="btn btn-sm btn-primary" @click="handleSelectAction('recons-rowFix', r)">
          조정
        </button>
      </template>
    </bo-grid>
  </div>
</div>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. 카드 영역 =================================================== -->
`,
};
