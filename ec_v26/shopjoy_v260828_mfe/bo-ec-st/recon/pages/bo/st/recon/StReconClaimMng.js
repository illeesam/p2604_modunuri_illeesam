/* ShopJoy Admin - 클레임-정산 대사 */
export default {
  name: 'st-recon-stReconClaimMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ error: null, dateRange: '이번달', dateRangeStart: '', dateRangeEnd: ''});
    const codes = reactive({
      claim_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StReconClaimMng.js : handleBtnAction -> ', cmd, param);
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
      } else if (cmd === 'reconClaims-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StReconClaimMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'reconClaims-pager-sizeChange') {
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
      await codeStore.saLoadCodes(['CLAIM_STATUS_CD', 'RECON_RESULT_CLAIM', 'DATE_RANGE_OPT'], {compNm: 'StReconClaimMng'});
      try {
        codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS_CD');
        codes.recon_results = codeStore.sgGetGrpCodes('RECON_RESULT_CLAIM');
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
    const excelModal = reactive({ show: false });   // 엑셀 다운로드 모달 표시 여부

    const searchParam = reactive({ diff: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfSummary = computed(() => ({
      match: rows.filter(r=>r.diffStatus==='MATCH').length,
      over:  rows.filter(r=>r.diffStatus==='ADJ_EXCESS').length,
      under: rows.filter(r=>r.diffStatus==='ADJ_SHORTAGE').length,
    }));

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* buildListParams — 검색조건 빌드 (pageNo/pageSize 제외, 목록조회·엑셀다운로드 공용).
       ⚠ reconTypeCd 가 StReconDto.Request 의 실제 필드명이다 — 이전에는 존재하지 않는
          typeCd 로 보내 서버가 조용히 무시하고 전체 유형이 섞여 나왔다. */
    const buildListParams = () => ({ reconTypeCd: 'CLAIM', ...coUtil.cofOmitEmpty(searchParam) });

    /* buildExcelParams — 엑셀 다운로드 조건 (목록 조회와 동일한 필터 기준) */
    const buildExcelParams = () => buildListParams();

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stRecon.getPage({
            pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
            ...buildListParams()
          }, '클레임-정산 대사', '목록조회');
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
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* fnDiffBadge — 유틸 */
    const fnDiffBadge = s => ({ '일치':'badge-green','조정과다':'badge-red','조정부족':'badge-orange' }[s] || 'badge-gray');

    /* fnTypeBadge */
    const _CLAIM_TYPE_KR_FB = { '취소':'badge-red','반품':'badge-orange','교환':'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('CLAIM_TYPE_KR', t, _CLAIM_TYPE_KR_FB[t] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ['환불완료','취소완료','교환완료'].includes(s) ? 'badge-green' : 'badge-blue';

    /* fmtW — 포맷 W */
    const fmtW = coUtil.cofWon;





    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };



        /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

        // --- [컬럼 정의] ---

        const columns = {};
        columns.baseSearch = [
      { key: 'dateRange', label: '요청일', type: 'dateRange', paramObj: uiState,
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        rangeFirst: true, dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'diff', label: '대사결과', type: 'select', options: () => codes.recon_results, nullLabel: '대사결과 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'claimId',    label: '클레임ID' },
      { key: 'reqDate',    label: '요청일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'type',       label: '유형', badge: (row) => fnTypeBadge(row.type) },
      { key: 'refundAmt',  label: '환불액', fmt: (v) => v > 0 ? fmtW(v) : '-' },
      { key: 'settleAdj',  label: '정산조정기준', fmt: (v) => v !== 0 ? fmtW(v) : '-',
        cellStyle: (v) => v < 0 ? 'color:#e74c3c' : '' },
      { key: 'reconAdj',   label: '실반영액', fmt: (v) => v !== 0 ? fmtW(v) : '-',
        cellStyle: (v) => v < 0 ? 'color:#e74c3c' : '' },
      { key: 'diff',       label: '차이',
        fmt: (v) => v !== 0 ? (v > 0 ? '+' : '') + Number(v).toLocaleString() + '원' : '-',
        cellStyle: (v) => Math.abs(v) > 0 ? 'color:#e74c3c;font-weight:700' : '' },
      { key: 'status',     label: '처리상태', badge: (row) => fnStatusBadge(row.status) },
      { key: 'diffStatus', label: '대사결과', badge: (row) => fnDiffBadge(row.diffStatus) },
    ];

    /* summaryFormColumns — 집계 카드 (BoFormArea, cols=3, labelLeft) */
    columns.summaryForm = [
      { key: '_match', label: '일치',     fmt: () => `<b style="color:#27ae60;">${cfSummary.value.match}건</b>` },
      { key: '_over',  label: '조정과다', fmt: () => `<b style="color:#e74c3c;">${cfSummary.value.over}건</b>` },
      { key: '_under', label: '조정부족', fmt: () => `<b style="color:#e67e22;">${cfSummary.value.under}건</b>` },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, baseGridPager, rows, searchParam, excelModal,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, buildExcelParams, // dispatch
    };
  },
  template: /* html */`
<bo-page title="클레임-정산 대사" :share-query="searchParam"
  desc-summary="클레임(취소·반품·교환) 환불 데이터와 정산 조정액 간 불일치를 검출하고 대사 처리합니다."
  :desc-detail="['• 클레임 환불금액(refund_amt) vs 정산 차감 조정액(settle_adj) 차이를 자동 비교합니다.','• 클레임 유형: 취소 / 반품 / 교환','• 차이 발생 건은 조정(StSettleAdjMng) 또는 기타조정(StSettleEtcAdjMng)으로 보정합니다.'].join(String.fromCharCode(10))">
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
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="rows" row-key="claimId" />
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('reconClaims-pager-setPage', n)" :on-size-change="() => handleSelectAction('reconClaims-pager-sizeChange')" />
  </bo-container>
  <bo-excel-down-modal :show="excelModal.show" domain="stRecon" area-nm="클레임-정산 대사"
    ui-nm="클레임-정산 대사" :columns="columns.baseGrid" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
