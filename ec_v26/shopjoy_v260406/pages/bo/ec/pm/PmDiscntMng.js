/* ShopJoy Admin - 판촉할인 관리 목록 + 하단 PmDiscntDtl 임베드 */
window.PmDiscntMng = {
  name: 'PmDiscntMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    openNewWindow: { type: Function, default: () => {} }, // 실제 새 브라우저 창으로 열기 (Ctrl+클릭)
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* ##### [01] 초기 변수 정의 ################################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmDiscntMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
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
      // 할인 신규 등록 (인라인 패널 / Ctrl·휠클릭 시 새창)
      } else if (cmd === 'discnts-add') {
        if (param && (param.ctrlKey || param.metaKey || param.button === 1)) { return props.openNewWindow('pmDiscntDtl', null, 'new'); }
        return openNew();
      // 할인 목록 엑셀 다운로드 모달 열기
      } else if (cmd === 'discnts-excel') {
        excelModal.show = true;
        return;
      // 탭 모드 변경 (list/card)
      } else if (cmd === 'tab-mode') {
        uiState.tabMode = param;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 페이지 번호 클릭
      } else if (cmd === 'discnts-pager-setPage') {
        return setPage(param);
      // 카드뷰 — 보기 모드로 열기
      } else if (cmd === 'discnts-card-view') {
        return loadView(param);
      // 카드뷰 — 수정 모드로 열기
      } else if (cmd === 'discnts-card-edit') {
        return handleLoadDetail(param);
      // 카드뷰 — 삭제
      } else if (cmd === 'discnts-card-delete') {
        return handleDelete(param);
      } else if (cmd === 'memberModal-open') { modals.isMemberPick = true;
      } else if (cmd === 'searchParam-memberClear') { searchParam.memberId = ''; searchParam.memberNm = '';
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
      console.log(' ■■ PmDiscntMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'discnts-sort') {
        return onSort(param);
      // 페이지 크기 변경
      } else if (cmd === 'discnts-pager-sizeChange') {
        return onSizeChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmDiscntMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'discnts-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { return props.openNewWindow('pmDiscntDtl', row.discntId, 'edit'); } return handleLoadDetail(row.discntId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          if (e.ctrlKey || e.metaKey || e.button === 1) { return props.openNewWindow('pmDiscntDtl', row.discntId); }
          return loadView(row.discntId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모달 callback dispatch */
    const fnCallbackModal = (popCmd, param, result) => {
      if (popCmd === 'cmPopup-member-pick') {
        searchParam.memberId = result?.selId || '';
        searchParam.memberNm = result?.selName || '';
        modals.isMemberPick = false;
      } else if (popCmd === 'cmPopup-userMd-pick') {
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

    // ===== Vue Composition API / boApp 전역 의존 ===========================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    // ===== 상태(reactive) 선언 =============================================
    const discounts = reactive([]);
    const uiState = reactive({ loading: false, error: null, tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      discount_types: [],
      discount_statuses: [],
      discnt_types: [],
      promo_statuses: [],
      date_range_opts: [],
    });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)

    // ===== 공통코드 로딩 ===================================================
    /* 할인 fnLoadCodes */

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['DISCOUNT_TYPE', 'DISCNT_STATUS_CD', 'DISCNT_TYPE', 'PROMO_STATUS', 'DATE_RANGE_OPT'], {compNm: 'PmDiscntMng'});
      try {
        codes.discount_types = codeStore.sgGetGrpCodes('DISCOUNT_TYPE');
        codes.discount_statuses = codeStore.sgGetGrpCodes('DISCNT_STATUS_CD');
        codes.discnt_types = codeStore.sgGetGrpCodes('DISCNT_TYPE');
        codes.promo_statuses = codeStore.sgGetGrpCodes('PROMO_STATUS');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };
    // ===== 정렬 처리 =======================================================
    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'discntNm asc', desc: 'discntNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 할인 onSort */

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'discntNm,discntId';
        }
        const res = await boApiSvc.pmDiscnt.getPage(params, '할인관리', '목록조회');
        const data = res.data?.data;
        discounts.splice(0, discounts.length, ...(data?.pageList || []));
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

    // ===== 검색 파라미터 + 라이프사이클 ====================================
    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      /* 검색조건 초기값 (계산이 필요한 항목) */
      const today = new Date(); const thisYear = today.getFullYear();
      Object.assign(searchParam, { dateRangeType: 'reg_date', dateRangeStart: `${thisYear - 3}-01-01`, dateRangeEnd: `${thisYear}-12-31` });
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    // ===== 날짜 범위 변경 / 사이트명 / 페이저 / 하단 상세 상태 ===============
    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };
     // 'list' | 'card'
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const uiStateDetail = reactive({ selectedId: '__new__', openMode: 'view', reloadTrigger: 0, resetSeq: 0, active: false });
  const searchParam = reactive({ searchType: '', searchValue: '', dateRange: '', dateRangeType: '', dateRangeStart: '', dateRangeEnd: '', discntTypeCd: '', discntStatusCd: '',
    memberId: '', memberNm: '', mdUserId: '', mdUserNm: '', prodId: '', prodNm: '', vendorId: '', vendorNm: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const modals = reactive({ isMemberPick: false, isMdPick: false, isProdPick: false, isVendorPick: false });

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.active = true; uiStateDetail.reloadTrigger++; };

    /* handleLoadDetail — 상세 조회 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.active = true; uiStateDetail.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.active = true; uiStateDetail.resetSeq++; uiStateDetail.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      uiStateDetail.selectedId = '__new__';
      uiStateDetail.openMode = 'view';
      uiStateDetail.active = false;
      uiStateDetail.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmDiscntMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') {
        if (uiStateDetail.selectedId && uiStateDetail.selectedId !== '__new__') { uiStateDetail.openMode = 'view'; return; }
        resetDetailToNew(); return;
      }
      if (pg === '__closeDtl__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode   = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey    = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}_${uiStateDetail.resetSeq}`);

    // ===== 페이저 번호 빌더 ================================================

    // ===== 배지(badge) 헬퍼 ================================================
    /* fnTypeBadge — 유형 배지 (DISCNT_TYPE: PROD/ORDER/SHIP/SHIP_FREE) */
    const _DISCNT_TYPE_FB = { PROD: 'badge-blue', ORDER: 'badge-purple', SHIP: 'badge-green', SHIP_FREE: 'badge-orange' };
    const fnTypeBadge   = t => coUtil.cofCodeBadge('DISCNT_TYPE', t, _DISCNT_TYPE_FB[t] || 'badge-gray');

    /* 할인 fnStatusBadge */
    const _DISCNT_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _DISCNT_STATUS_FB[s] || 'badge-gray');

    // ===== 검색 / 리셋 / 페이지 변경 =======================================
    /* onSearch — 조회 */
    const onSearch = async () => {
      baseGridPager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, searchParamInit);
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      baseGridPager.pageNo = 1;
      await handleSearchList();
    };

    /* setPage — 설정 */
    const setPage      = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* handleDelete — 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.discntNm}] 할인을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = (discounts || []).findIndex(x => x.discntId === d.discntId);
      if (idx !== -1) { discounts.splice(idx, 1); }
      if (uiStateDetail.selectedId === d.discntId) { uiStateDetail.selectedId = null; }
      try {
        const res = await boApiSvc.pmDiscnt.remove(d.discntId, '할인관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ===== 엑셀 다운로드 (공통 모달 — sy_exceldown 기반 동기/비동기) ===== */
    const excelModal = reactive({ show: false });
    const cfExcelDomain  = computed(() => 'pmDiscnt');
    const cfExcelAreaNm  = computed(() => '할인');
    /* cfExcelColumns — 화면 그리드(columns.baseGrid) 그대로 사용, 엑셀 컬럼/순서/라벨을 화면과 일치시킴 */
    const cfExcelColumns = computed(() => columns.baseGrid);

    /* buildExcelParams — 현재 검색조건을 엑셀 요청 파라미터로 그대로 전달 (페이지 정보 불필요) */
    const buildExcelParams = () => {
      const p = { ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
      if (p.searchValue && !p.searchType) { p.searchType = 'discntNm,discntId'; }
      return p;
    };

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
        // --- [컬럼 정의] ---
        const columns = {};
        columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'discntNm', label: '할인명' },
          { value: 'discntId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'discntTypeCd', type: 'select', label: '유형', options: () => codes.discnt_types, nullLabel: '유형 전체' },
      { key: 'discntStatusCd', type: 'select', label: '상태', options: () => codes.promo_statuses, nullLabel: '상태 전체' },
      { key: 'memberId', label: '회원', type: 'pick', nameKey: 'memberNm', display: (p) => p.memberNm, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('memberModal-open'), onClear: () => handleBtnAction('searchParam-memberClear') },
      { key: 'mdUserId', label: '담당MD', type: 'pick', nameKey: 'mdUserNm', display: (p) => p.mdUserNm, placeholder: 'MD 선택',
        onOpen: () => handleBtnAction('mdModal-open'), onClear: () => handleBtnAction('searchParam-mdClear') },
      { key: 'prodId', label: '상품', type: 'pick', nameKey: 'prodNm', display: (p) => p.prodNm, placeholder: '상품 선택',
        onOpen: () => handleBtnAction('prodModal-open'), onClear: () => handleBtnAction('searchParam-prodClear') },
      { key: 'vendorId', label: '업체', type: 'pick', nameKey: 'vendorNm', display: (p) => p.vendorNm, placeholder: '업체 선택',
        onOpen: () => handleBtnAction('vendorModal-open'), onClear: () => handleBtnAction('searchParam-vendorClear') },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 그리드
    columns.baseGrid = [
      { key: 'discntNm',       label: '할인명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'discntTypeCd',   label: '유형', badge: (row) => fnTypeBadge(row.discntTypeCd) },
      { key: 'discntValue',    label: '할인값',
        fmt: (v, row) => row.discntTypeCd === 'SHIP_FREE' ? '무료배송'
          : row.discntValTypeCd === 'RATE' ? (row.discntValue + '%')
          : coUtil.cofWon(row.discntValue) },
      { key: 'discntTargetCd', label: '적용대상', cellStyle: 'color:#555',
        fmt: (v) => v || '전체상품' },
      { key: 'startDate',      label: '시작일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'endDate',        label: '종료일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'discntStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.discntStatusCd) },
      { key: 'siteNm',         label: '사이트', cellStyle: 'color:#2563eb' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns, uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), discounts, uiState, codes, searchParam, onDateRangeChange: handleDateRangeChange, baseGridPager, fnTypeBadge, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, onSort, sortIcon, handleBtnAction, handleSelectAction, handleGridCellAction,
      modals, fnCallbackModal,
      excelModal, cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,     // 엑셀 다운로드
      get tabMode() { return uiState.tabMode; }, set tabMode(v) { uiState.tabMode = v; } };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<bo-page title="할인관리" :share-query="searchParam">
  <!-- ===== ■. 검색영역 ==================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <bo-container title="할인목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <!-- ===== ■.■. 목록 툴바: 탭모드 토글 + 엑셀/신규 ============================ -->
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
        <button class="btn btn_excel" @click="handleBtnAction('discnts-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" title="Ctrl+클릭/휠클릭: 새창"
          @click="handleBtnAction('discnts-add', $event)"
          @auxclick="handleBtnAction('discnts-add', $event)">
          + 신규
        </button>
      </div>
    </template>
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="discounts" row-key="discntId" :selected-key="selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(d) => selectedId===d.discntId ? 'background:#fff8f9;' : ''"
      @sort="onSort"
      grid-id="discnts-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
            table-max-height="540px">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: d, gridId }">
        <div class="actions">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', d, $event)" @auxclick.stop="handleGridCellAction(gridId, 'btn_row_edit', d, $event)">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleBtnAction('discnts-card-delete', d)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="n => handleBtnAction('discnts-pager-setPage', n)" :on-size-change="() => handleSelectAction('discnts-pager-sizeChange')" />
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="discounts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(d, idx) in discounts" :key="d?.discntId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="selectedId===d.discntId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleBtnAction('discnts-card-view', d.discntId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (baseGridPager.pageNo-1)*baseGridPager.pageSize + idx + 1 }}</span> 할인 #{{ d.discntId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleBtnAction('discnts-card-view', d.discntId)" :style="selectedId===d.discntId?{color:'#e8587a'}:{}">
            {{ d.discntNm }}
            <span v-if="selectedId===d.discntId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(d.discntTypeCd)" style="font-size:11px;">
              {{ d.discntTypeCd }}
            </span>
            <span class="badge" :class="fnStatusBadge(d.discntStatusCd)" style="font-size:11px;">
              {{ d.discntStatusCd }}
            </span>
          </div>
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ d.discntTypeCd === 'SHIP_FREE' ? '무료배송' : d.discntValTypeCd === 'RATE' ? (d.discntValue + '%') : coUtil.cofWon(d.discntValue) }}
            </div>
            <div>
              📅 {{ d.startDate }} ~ {{ d.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              {{ d.discntTargetCd || '전체상품' }}
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction('discnts-cellClick', 'btn_row_edit', d, $event)" @auxclick.stop="handleGridCellAction('discnts-cellClick', 'btn_row_edit', d, $event)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn_delete" @click.stop="handleBtnAction('discnts-card-delete', d)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ d.discntId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== □.□. 카드 뷰 ================================================== -->
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager v-if="tabMode!=='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </bo-container>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세영역: PmDiscntDtl 인라인 임베드 ============================ -->
  <!-- ===== ■. 상세 패널 (인라인 임베드) ========================================= -->
  <pm-discnt-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="uiStateDetail.active"
    :reload-trigger="uiStateDetail.reloadTrigger"
    />
  <bo-cm-popup-modal v-if="modals.isMemberPick" popup-cmd="cmPopup-member-pick" popup-code="member" :on-callback="fnCallbackModal" @close="modals.isMemberPick = false" />
  <bo-cm-popup-modal v-if="modals.isMdPick" popup-cmd="cmPopup-userMd-pick" popup-code="userMd" :on-callback="fnCallbackModal" @close="modals.isMdPick = false" />
  <bo-cm-popup-modal v-if="modals.isProdPick" popup-cmd="cmPopup-prod-pick" popup-code="prod" :on-callback="fnCallbackModal" @close="modals.isProdPick = false" />
  <bo-cm-popup-modal v-if="modals.isVendorPick" popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :on-callback="fnCallbackModal" @close="modals.isVendorPick = false" />
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" :domain="cfExcelDomain"
    :area-nm="cfExcelAreaNm" :columns="cfExcelColumns" ui-nm="할인관리" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
<!-- ===== □. 상세 패널 (인라인 임베드) ========================================= -->
`
};
