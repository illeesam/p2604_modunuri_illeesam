/* ShopJoy Admin - ERP 전표대사 */
export default {
  name: 'st-erp-stErpReconMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
const uiState = reactive({ loading: false, error: null, dateRange: '이번달', dateRangeStart: '', dateRangeEnd: ''});
    const codes = reactive({
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
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 페이지 번호 변경
      } else if (cmd === 'recons-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
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
      // 페이지 크기 변경
      } else if (cmd === 'recons-pager-sizeChange') {
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
      await codeStore.saLoadCodes(['ERP_VOUCHER_TYPE_KR', 'ERP_RECON_RESULT', 'DATE_RANGE_OPT'], {compNm: 'StErpReconMng'});
      try {
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        codes.erp_recon_results = codeStore.sgGetGrpCodes('ERP_RECON_RESULT');
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

    const recons = reactive([]);
    const excelModal = reactive({ show: false });   // 엑셀 다운로드 모달 표시 여부

    const searchParam = reactive({ reconStatusCd: '', reconTypeCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfSummary = computed(() => ({
      match:     recons.filter(r=>r.diffStatus==='MATCH').length,
      diff:      recons.filter(r=>r.diffStatus==='DIFF').length,
      noReflect: recons.filter(r=>r.diffStatus==='NOT_APPLIED').length,
      diffAmt:   recons.reduce((s,r)=>s+Math.abs(r.diff||0),0),
    }));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* buildListParams — 검색조건 빌드 (pageNo/pageSize 제외, 목록조회·엑셀다운로드 공용) */
    const buildListParams = () => ({
      dateRangeType: 'reg_date', dateRangeStart: uiState.dateRangeStart, dateRangeEnd: uiState.dateRangeEnd,
      ...coUtil.cofOmitEmpty(searchParam)
    });

    /* buildExcelParams — 엑셀 다운로드 조건 (목록 조회와 동일한 필터 기준) */
    const buildExcelParams = () => buildListParams();

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stErp.getReconPage({
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...buildListParams()
        }, 'ERP전표대사', '목록조회');
        const data = res.data?.data;
        recons.splice(0, recons.length, ...(data?.pageList || data?.list || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || {});
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
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

    /* doFix — 실행 */
    const doFix = async (r) => {
      const ok = await showConfirm('조정처리', '해당 전표 대사 차이를 조정처리 하시겠습니까?');
      if (!ok) { return; }
      r.erpAmt = r.sysAmt; r.diff = 0; r.diffStatus = '일치'; r.remark = '조정처리 완료';
      try {
        const res = await boApiSvc.stErp.fixRecon(r.reconId, {}, 'ERP대사관리', '저장');
        if (showToast) { showToast('조정처리 되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green', '차이':'badge-orange', '미반영':'badge-red' }[s] || 'badge-gray');

    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;





    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };



        /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'dateRange', label: '대사일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'reconTypeCd', label: '유형', type: 'select', options: () => codes.erp_voucher_types, nullLabel: '유형 전체' },
      { key: 'reconStatusCd', label: '대사결과', type: 'select', options: () => codes.erp_recon_results, nullLabel: '결과 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'reconId',    label: '대사ID' },
      { key: 'reconDate',  label: '대사일자',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'slipId',     label: '전표ID', cellStyle: 'font-size:11px' },
      { key: 'slipType',   label: '유형', badge: (row) => fnTypeBadge(row.slipType) },
      { key: 'sysAmt',     label: '시스템금액', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'erpAmt',     label: 'ERP금액', fmt: (v) => v > 0 ? fmtW(v) : '-' },
      { key: 'diff',       label: '차이금액', fmt: (v) => v > 0 ? fmtW(v) : '-',
        cellStyle: (v) => v > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
      { key: 'remark',     label: '비고',
        cellStyle: 'font-size:11px;color:#888;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      { type: 'actions', actions: [
        { label: '조정', cls: 'btn btn-xs btn-primary', visible: (row) => row.diffStatus !== 'MATCH',
          onClick: (row) => handleSelectAction('recons-rowFix', row) },
      ] },
    ];

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=4, labelLeft) */
    columns.summaryForm = [
      { key: '_match',     label: '일치',          fmt: () => `<b style="color:#27ae60;">${cfSummary.value.match}건</b>` },
      { key: '_diff',      label: '금액 차이',     fmt: () => `<b style="color:#e67e22;">${cfSummary.value.diff}건</b>` },
      { key: '_noReflect', label: '미반영',        fmt: () => `<b style="color:#e74c3c;">${cfSummary.value.noReflect}건</b>` },
      { key: '_diffAmt',   label: '차이금액 합계', fmt: () => `<b style="color:#333;">${fmtW(cfSummary.value.diffAmt)}</b>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, baseGridPager, recons, searchParam, excelModal,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, buildExcelParams, // dispatch
    };
  },
  template: /* html */`
<bo-page title="ERP 전표대사" :share-query="searchParam"
  desc-summary="ERP로 전송된 전표와 ERP 처리 결과를 대사하여 불일치 전표를 수정합니다."
  :desc-detail="['• ShopJoy 전표금액 vs ERP 처리금액 차이를 자동 비교합니다.','• 차이 상태: 일치 / 차이발생 / 오류','• [오류수정] 버튼으로 전표 재생성 또는 ERP 수동 반영을 처리합니다.','• 유형 필터: 정산지급 / 수수료 / 조정 / 기타'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 ================================================= -->
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
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="recons" row-key="reconId">
      <template #head-actions>
        액션
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('recons-pager-setPage', n)" :on-size-change="() => handleSelectAction('recons-pager-sizeChange')" />
  </bo-container>
  <bo-excel-down-modal :show="excelModal.show" domain="stRecon" area-nm="ERP전표대사"
    ui-nm="ERP전표대사" :columns="columns.baseGrid" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
