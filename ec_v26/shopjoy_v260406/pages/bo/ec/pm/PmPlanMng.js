/* ShopJoy Admin - 기획전관리 목록 + 하단 PlanDtl 임베드 */
window.PmPlanMng = {
  name: 'PmPlanMng',
  props: {
    navigate:          { type: Function, required: true }, // 페이지 이동
    initSearchValue:   { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const plans = reactive([]);
    const uiState = reactive({ loading: false, error: null, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      plan_statuses: [],
      date_range_opts: [],
    });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 하단 상세 (진입 시 빈 신규 폼, 항상 표시) */
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'view', reloadTrigger: 0, resetSeq: 0, active: false });


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmPlanMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        Object.assign(baseGridPager.pageCond, searchParam);
        return handleSearchList('SEARCH');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('SEARCH');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 기획전 신규 등록
      } else if (cmd === 'plans-add') {
        return openNew();
      // 기획전 엑셀 다운로드 모달 열기
      } else if (cmd === 'plans-excel') {
        excelModal.show = true;
        return;
      // 탭 모드 변경
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬
      } else if (cmd === 'plans-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'plans-pager-setPage') {
        return setPage(param);
      } else if (cmd === 'mdModal-open') { modals.isMdPick = true;
      } else if (cmd === 'searchParam-mdClear') { searchParam.mdUserId = ''; searchParam.mdUserNm = '';
      } else if (cmd === 'prodModal-open') { modals.isProdPick = true;
      } else if (cmd === 'searchParam-prodClear') { searchParam.prodId = ''; searchParam.prodNm = '';
      } else if (cmd === 'vendorModal-open') { modals.isVendorPick = true;
      } else if (cmd === 'searchParam-vendorClear') { searchParam.vendorId = ''; searchParam.vendorNm = '';
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PmPlanMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'plans-pager-sizeChange') {
        return onSizeChange();
      // 행/셀 클릭 → 상세 보기
      } else if (cmd === 'plans-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 기준 컬럼별 분기 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmPlanMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'plans-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { return handleLoadDetail(row.planId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.planId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 callback dispatch */
    const fnCallbackModal = (popCmd, param, result) => {
      if (popCmd === 'cmPopup-userMd-pick') {
        searchParam.mdUserId = result?.selId || '';
        searchParam.mdUserNm = result?.selName || '';
        modals.isMdPick = false;
      } else if (popCmd === 'cmPopup-prod-pick') {
        searchParam.prodId = result?.selId || '';
        searchParam.prodNm = result?.selName || '';
        modals.isProdPick = false;
      } else if (popCmd === 'cmPopup-vendor-pick') {
        searchParam.vendorId = result?.selId || '';
        searchParam.vendorNm = result?.selName || '';
        modals.isVendorPick = false;
      }
    };

    const searchParam = reactive({ searchValue: '', dateRange: '', dateRangeType: '', dateRangeStart: '', dateRangeEnd: '', planStatusCd: '',
      mdUserId: '', mdUserNm: '', prodId: '', prodNm: '', vendorId: '', vendorNm: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const modals = reactive({ isMdPick: false, isProdPick: false, isVendorPick: false });
    /* 프로모션 플랜 fnLoadCodes */

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['PLAN_STATUS_KR', 'DATE_RANGE_OPT'], {compNm: 'PmPlanMng'});
      try {
        codes.plan_statuses = codeStore.sgGetGrpCodes('PLAN_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'planNm asc', desc: 'planNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 프로모션 플랜 onSort */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };



    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pmPlan.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...(searchType === 'PAGE_CLICK' ? baseGridPager.pageCond : searchParam) }, '요금제관리', '목록조회');
        const data = res.data?.data;
        plans.splice(0, plans.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      /* 검색조건 초기값 (계산이 필요한 항목) */
      const today = new Date(); const thisYear = today.getFullYear();
      Object.assign(searchParam, { dateRangeType: 'reg_date', dateRangeStart: `${thisYear - 3}-01-01`, dateRangeEnd: `${thisYear}-12-31` });
      await fnLoadCodes();
      if (props.initSearchValue) {
        searchParam.searchValue = props.initSearchValue;
        searchParam.dateRangeStart = ''; searchParam.dateRangeEnd = '';
      }
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    /* loadView — 뷰 로드 */
    const loadView = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'view';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmPlanMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);

    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);


    /* 프로모션 플랜 fnStatusBadge */
    const _PLAN_STATUS_FB = { '활성': 'badge-green', '예정': 'badge-blue', '비활성': 'badge-gray', '종료': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PLAN_STATUS_KR', s, _PLAN_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (p) => {
      const ok = await showConfirm('삭제', `[${p.planNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = plans.findIndex(x => x.planId === p.planId);
      if (idx !== -1) { plans.splice(idx, 1); }
      if (detailPanel.selectedId === p.planId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmPlan.remove(p.planId, '기획전관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ===== 엑셀 다운로드 (공통 모달 — sy_exceldown 기반 동기/비동기) ===== */
    const excelModal = reactive({ show: false });
    const cfExcelDomain  = computed(() => 'pmPlan');
    const cfExcelAreaNm  = computed(() => '기획전');
    /* cfExcelColumns — 화면 그리드(columns.baseGrid) 그대로 사용, 엑셀 컬럼/순서/라벨을 화면과 일치시킴 */
    const cfExcelColumns = computed(() => columns.baseGrid);

    /* buildExcelParams — 현재 검색조건을 엑셀 요청 파라미터로 그대로 전달 (페이지 정보 불필요) */
    const buildExcelParams = () => ({ ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) });

    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '기획전명', placeholder: '기획전명 검색' },
      { key: 'planStatusCd', type: 'select', label: '상태', options: () => codes.plan_statuses, nullLabel: '상태 전체' },
      { key: 'mdUserId', label: '담당MD', type: 'pick', nameKey: 'mdUserNm', display: (p) => p.mdUserNm, placeholder: 'MD 선택',
        onOpen: () => handleBtnAction('mdModal-open'), onClear: () => handleBtnAction('searchParam-mdClear') },
      { key: 'prodId', label: '상품', type: 'pick', nameKey: 'prodNm', display: (p) => p.prodNm, placeholder: '상품 선택',
        onOpen: () => handleBtnAction('prodModal-open'), onClear: () => handleBtnAction('searchParam-prodClear') },
      { key: 'vendorId', label: '업체', type: 'pick', nameKey: 'vendorNm', display: (p) => p.vendorNm, placeholder: '업체 선택',
        onOpen: () => handleBtnAction('vendorModal-open'), onClear: () => handleBtnAction('searchParam-vendorClear') },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'planNm',       label: '기획전명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'category',     label: '카테고리',
        cellInnerStyle: 'font-size:11px;background:#e8f0fe;color:#1577db;border-radius:4px;padding:2px 8px;' },
      { key: 'theme',        label: '테마' },
      { key: 'productIds',   label: '상품수',
        fmt: (v) => (v || []).length + '개' },
      { key: 'planStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.planStatusCd) },
      { key: 'viewCount',    label: '조회수', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'period',       label: '기간', cellStyle: 'font-size:11px;color:#666',
        fmt: (v, row) => row.startDate + ' ~ ' + row.endDate },
      { key: 'regDate',      label: '등록일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      plans, uiState, searchParam, baseGridPager, detailPanel,                   // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                        // computed
      tabMode, // toRef
      fnStatusBadge,          // 헬퍼
      inlineNavigate,                                      // 콜백 / 전역
      modals, fnCallbackModal,
      excelModal, cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,     // 엑셀 다운로드
    };
  },
  template: /* html */`
<bo-page title="기획전관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="기획전목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
          <button @click="handleBtnAction('tab-mode', 'list')" style="font-size:11px;padding:4px 10px;border:none;transition:all .15s;"
            :style="tabMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ☰ 리스트
          </button>
          <button @click="handleBtnAction('tab-mode', 'card')" style="font-size:11px;padding:4px 10px;border:none;border-left:1px solid #ddd;transition:all .15s;"
            :style="tabMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 카드
          </button>
        </div>
        <button class="btn btn_excel" @click="handleBtnAction('plans-excel')">
          📥 엑셀
        </button>
        <button class="btn btn_new" @click="handleBtnAction('plans-add')">
          + 신규
        </button>
      </div>
    </template>
    <!-- ===== ■.■. 리스트 뷰 ================================================= -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="plans" row-key="planId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(p) => detailPanel.selectedId===p.planId ? 'background:#fff8f9;' : ''" @sort="key => handleBtnAction('plans-sort', key)" grid-id="plans-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
            table-max-height="540px">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: p, gridId }">
        <div class="actions">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', p)">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', p)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="plans.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(p, idx) in plans" :key="p?.planId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="detailPanel.selectedId===p.planId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('plans-rowView', p.planId)">
        <!-- ===== ■.■.■. 배너 이미지 ============================================== -->
        <div v-if="p.bannerImage" style="padding:12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;" v-html="p.bannerImage">
        </div>
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            기획전 #{{ p.planId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('plans-rowView', p.planId)" :style="detailPanel.selectedId===p.planId?{color:'#e8587a'}:{}">
            {{ p.planNm }}
            <span v-if="detailPanel.selectedId===p.planId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnStatusBadge(p.planStatusCd)" style="font-size:11px;">
              {{ p.planStatusCd }}
            </span>
            <span class="badge badge-blue" style="font-size:11px;">
              {{ p.category }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ p.theme }} {{ (p.productIds||[]).length }}개 상품
            </div>
            <div>
              📅 {{ p.startDate }} ~ {{ p.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              👁 {{ (p.viewCount||0).toLocaleString() }} 조회
            </div>
            <div style="color:#999;">
              📅 등록 {{ p.regDate }}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction('plans-cellClick', 'btn_row_edit', p)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction('plans-cellClick', 'btn_row_delete', p)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ p.planId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이저 ==================================================== -->
    <bo-pager v-if="baseGridPager.pageTotalCount > 0" :pager="baseGridPager" :on-set-page="n => handleBtnAction('plans-pager-setPage', n)" :on-size-change="() => handleSelectAction('plans-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세: PlanDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ============= -->
  <pm-plan-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />
  <bo-cm-popup-modal v-if="modals.isMdPick" popup-cmd="cmPopup-userMd-pick" popup-code="userMd" :on-callback="fnCallbackModal" @close="modals.isMdPick = false" />
  <bo-cm-popup-modal v-if="modals.isProdPick" popup-cmd="cmPopup-prod-pick" popup-code="prod" :on-callback="fnCallbackModal" @close="modals.isProdPick = false" />
  <bo-cm-popup-modal v-if="modals.isVendorPick" popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :on-callback="fnCallbackModal" @close="modals.isVendorPick = false" />
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" :domain="cfExcelDomain"
    :area-nm="cfExcelAreaNm" :columns="cfExcelColumns" ui-nm="기획전관리" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`
};
