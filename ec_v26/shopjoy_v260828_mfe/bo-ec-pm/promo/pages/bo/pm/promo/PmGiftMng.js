/* ShopJoy Admin - 판촉사은품 관리 목록 + 하단 PmGiftDtl 임베드 */
export default {
  name: 'pm-promo-pmGiftMng',
  // ===== Props 정의 ========================================================
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
    openNewWindow: { type: Function, default: () => {} }, // 실제 새 브라우저 창으로 열기 (Ctrl+클릭)
  },
  setup(props) {

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* ##### [01] 초기 변수 정의 #################################################### */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PmGiftMng.js : handleBtnAction -> ', cmd, param);
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
      // 사은품 신규 등록 (Ctrl·휠클릭 시 새창)
      } else if (cmd === 'gifts-add') {
        if (param && (param.ctrlKey || param.metaKey || param.button === 1)) { return props.openNewWindow('pmGiftDtl', null, 'new'); }
        return openNew();
      // 사은품 엑셀 다운로드 모달 열기
      } else if (cmd === 'gifts-excel') {
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
      } else if (cmd === 'gifts-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'gifts-pager-setPage') {
        return setPage(param);
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
      console.log(' ■■ PmGiftMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'gifts-pager-sizeChange') {
        return onSizeChange();
      // 셀/카드 본문 클릭 → 상세 보기모드로 열기
      } else if (cmd === 'gifts-rowView') {
        return loadView(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PmGiftMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'gifts-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { return props.openNewWindow('pmGiftDtl', row.giftId, 'edit'); } return handleLoadDetail(row.giftId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          if (e.ctrlKey || e.metaKey || e.button === 1) { return props.openNewWindow('pmGiftDtl', row.giftId); }
          return loadView(row.giftId);
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
    const gifts = reactive([]);
    const uiState = reactive({ loading: false, error: null, giftList: [], tabMode: 'list', sortKey: '', sortDir: 'asc' });
    const codes = reactive({
      gift_statuses: [],
      gift_cond_types: [],
      date_range_opts: [],
      // 기간유형 — 백엔드 baseAndDateRange switch(reg_date/upd_date) 와 정합 (GIFT_DATE_TYPE 코드그룹 미존재 → 정적)
      gift_date_types: [{ value: 'reg_date', label: '등록일' }, { value: 'upd_date', label: '수정일' }],
    });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'view', reloadTrigger: 0, resetSeq: 0, active: false }); // 상세영역 항상 표시 (진입 시 빈 신규 폼, active=false → 버튼 숨김)

    const searchParam = reactive({ searchType: '', searchValue: '', dateRangeType: '', dateRange: '', dateRangeStart: '', dateRangeEnd: '', giftTypeCd: '', giftStatusCd: '',
      memberId: '', memberNm: '', mdUserId: '', mdUserNm: '', prodId: '', prodNm: '', vendorId: '', vendorNm: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};
    const modals = reactive({ isMemberPick: false, isMdPick: false, isProdPick: false, isVendorPick: false });
    // ===== 공통코드 로딩 ===================================================
    /* 사은품 fnLoadCodes */

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ################################# */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['GIFT_STATUS_CD', 'GIFT_COND_KR', 'DATE_RANGE_OPT'], {compNm: 'PmGiftMng'});
      try {
        codes.gift_statuses = codeStore.sgGetGrpCodes('GIFT_STATUS_CD');
        codes.gift_cond_types = codeStore.sgGetGrpCodes('GIFT_COND_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // ===== 정렬 처리 =======================================================
    const SORT_MAP = { nm: { asc: 'giftNm asc', desc: 'giftNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* getSortParam — 조회 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 사은품 onSort */

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



    // ===== 목록 조회 API ===================================================
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'giftNm,giftId';
        }
        const res = await boApiSvc.pmGift.getPage(params, '선물관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gifts.splice(0, gifts.length, ...list);
        baseGridPager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = res.data?.data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, res.data?.data?.pageCond || baseGridPager.pageCond);
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

    // ===== 상세 임베드: 보기/수정/신규/닫기/인라인 이동 ====================
    /* loadView — 뷰 로드 */
    const loadView   = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'view';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 상세 조회 (행 선택 → active=true) */
    const handleLoadDetail = (id) => { detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 열기 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pmGiftMng') { if (opts.reload) handleSearchList('RELOAD'); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') {
        if (detailPanel.selectedId && detailPanel.selectedId !== '__new__') { detailPanel.openMode = 'view'; return; }
        resetDetailToNew(); return;
      }
      if (pg === '__closeDtl__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);

    const cfDetailKey    = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    // ===== 페이저 번호 빌더 ================================================

    // ===== 배지(badge) 헬퍼 ================================================
    /* 사은품 fnTypeBadge — sy_code GIFT_COND_TYPE_KR code_opt1 우선, 없으면 FB */
    const _GIFT_COND_TYPE_FB = { '구매조건': 'badge-blue', '금액조건': 'badge-green', '수량조건': 'badge-orange', '무조건': 'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge   = t => coUtil.cofCodeBadge('GIFT_COND_TYPE_KR', t, _GIFT_COND_TYPE_FB[t] || 'badge-gray');

    /* 사은품 fnStatusBadge */
    const _GIFT_STATUS_FB = { '활성': 'badge-green', '비활성': 'badge-gray', '종료': 'badge-red', '품절': 'badge-orange' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PROMO_STATUS', s, _GIFT_STATUS_FB[s] || 'badge-gray');

    /* setPage — 설정 */
    const setPage = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ===== 삭제 / 엑셀 다운로드 ============================================
    /* handleDelete — 삭제 */
    const handleDelete = async (g) => {
      const ok = await showConfirm('삭제', `[${g.giftNm}] 사은품을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = (gifts || []).findIndex(x => x.giftId === g.giftId);
      if (idx !== -1) { gifts.splice(idx, 1); }
      if (detailPanel.selectedId === g.giftId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.pmGift.remove(g.giftId, '사은품관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ===== 엑셀 다운로드 (공통 모달 — sy_exceldown 기반 동기/비동기) ===== */
    const excelModal = reactive({ show: false });
    const cfExcelDomain  = computed(() => 'pmGift');
    const cfExcelAreaNm  = computed(() => '사은품');
    /* cfExcelColumns — 화면 그리드(columns.baseGrid) 그대로 사용, 엑셀 컬럼/순서/라벨을 화면과 일치시킴 */
    const cfExcelColumns = computed(() => columns.baseGrid);

    /* buildExcelParams — 현재 검색조건을 엑셀 요청 파라미터로 그대로 전달 (페이지 정보 불필요) */
    const buildExcelParams = () => {
      const p = { ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
      if (p.searchValue && !p.searchType) { p.searchType = 'giftNm,giftId'; }
      return p;
    };

    // ===== 탭 모드 (리스트/카드) ===========================================
    const tabMode = Vue.toRef(uiState, 'tabMode');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // ===== 검색영역 컬럼 정의 (BoSearchArea :columns) ======================
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'giftNm', label: '사은품명' },
          { value: 'giftId', label: 'ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'giftTypeCd', type: 'select', label: '유형', options: () => codes.gift_cond_types, nullLabel: '유형 전체' },
      { key: 'giftStatusCd', type: 'select', label: '상태', options: () => codes.gift_statuses, nullLabel: '상태 전체' },
      { key: 'memberId', label: '회원', type: 'pick', nameKey: 'memberNm', display: (p) => p.memberNm, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('memberModal-open'), onClear: () => handleBtnAction('searchParam-memberClear') },
      { key: 'mdUserId', label: '담당MD', type: 'pick', nameKey: 'mdUserNm', display: (p) => p.mdUserNm, placeholder: 'MD 선택',
        onOpen: () => handleBtnAction('mdModal-open'), onClear: () => handleBtnAction('searchParam-mdClear') },
      { key: 'prodId', label: '상품', type: 'pick', nameKey: 'prodNm', display: (p) => p.prodNm, placeholder: '상품 선택',
        onOpen: () => handleBtnAction('prodModal-open'), onClear: () => handleBtnAction('searchParam-prodClear') },
      { key: 'vendorId', label: '업체', type: 'pick', nameKey: 'vendorNm', display: (p) => p.vendorNm, placeholder: '업체 선택',
        onOpen: () => handleBtnAction('vendorModal-open'), onClear: () => handleBtnAction('searchParam-vendorClear') },
      { key: 'dateRange', type: 'dateRange', label: '시작일',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.gift_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'giftNm',       label: '사은품명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'giftTypeCd',   label: '조건유형', badge: (row) => fnTypeBadge(row.giftTypeCd) },
      { key: 'condVal',      label: '조건값',
        fmt: (v, row) => row.giftTypeCd === 'AMOUNT' ? (row.minOrderAmt || 0).toLocaleString() + '원↑'
          : row.giftTypeCd === 'QTY' ? (row.minOrderQty || 0) + '개↑' : '-' },
      { key: 'giftStock',    label: '재고', fmt: (v) => (v || 0).toLocaleString() + '개' },
      { key: 'startDate',    label: '시작일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'endDate',      label: '종료일',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'giftStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.giftStatusCd) },
      { key: 'siteNm',       label: '사이트', cellStyle: 'color:#2563eb' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      gifts, uiState, searchParam, baseGridPager, detailPanel,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                     // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                        // computed
      tabMode, // toRef
      fnTypeBadge, fnStatusBadge,          // 헬퍼
      inlineNavigate,                                      // 콜백 / 전역
      modals, fnCallbackModal,
      excelModal, cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,     // 엑셀 다운로드
    };
  },
  // ===== 템플릿 ===========================================================
  template: /* html */`
<bo-page title="사은품관리" :share-query="searchParam">
  <!-- ===== ■. 검색영역 ==================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록영역 (리스트/카드 토글) ======================================== -->
  <bo-container title="사은품목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <!-- ===== ■.■. 목록 툴바: 탭모드 토글 + 엑셀/신규 ============================ -->
    <template #toolbar-actions>
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
      <button class="btn btn_excel" @click="handleBtnAction('gifts-excel')">
        📥 엑셀
      </button>
      <button class="btn btn_new" title="Ctrl+클릭/휠클릭: 새창"
        @click="handleBtnAction('gifts-add', $event)"
        @auxclick="handleBtnAction('gifts-add', $event)">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 리스트 뷰 (BoGrid) ======================================== -->
    <bo-grid v-if="tabMode==='list'" :bare="true"
      :columns="columns.baseGrid" :rows="gifts" row-key="giftId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(g) => detailPanel.selectedId===g.giftId ? 'background:#fff8f9;' : ''" @sort="key => handleBtnAction('gifts-sort', key)" grid-id="gifts-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
            table-max-height="540px">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: g, gridId }">
        <div class="actions">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', g, $event)" @auxclick.stop="handleGridCellAction(gridId, 'btn_row_edit', g, $event)">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', g)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager v-if="tabMode==='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="n => handleBtnAction('gifts-pager-setPage', n)" :on-size-change="() => handleSelectAction('gifts-pager-sizeChange')" />
    <!-- ===== ■.■. 카드 뷰 ================================================== -->
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:14px;margin-bottom:16px;">
      <div v-if="gifts.length===0" style="grid-column:1/-1;text-align:center;color:#999;padding:60px 20px;">
        데이터가 없습니다.
      </div>
      <div v-for="(g, idx) in gifts" :key="g?.giftId" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all .15s;"
        :style="detailPanel.selectedId===g.giftId?{borderColor:'#e8587a',boxShadow:'0 2px 8px rgba(232,88,122,0.15)'}:{}"
        @click="handleSelectAction('gifts-rowView', g.giftId)">
        <div style="padding:16px;border-bottom:1px solid #f0f0f0;">
          <div style="font-size:12px;color:#999;margin-bottom:6px;">
            <span style="display:inline-block;min-width:20px;font-weight:700;color:#e8587a;">{{ (baseGridPager.pageNo-1)*baseGridPager.pageSize + idx + 1 }}</span> 사은품 #{{ g.giftId }}
          </div>
          <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:8px;" @click="handleSelectAction('gifts-rowView', g.giftId)" :style="detailPanel.selectedId===g.giftId?{color:'#e8587a'}:{}">
            {{ g.giftNm }}
            <span v-if="detailPanel.selectedId===g.giftId" style="font-size:10px;margin-left:4px;">
              ▼
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span class="badge" :class="fnTypeBadge(g.giftTypeCd)" style="font-size:11px;">
              {{ g.giftTypeCd }}
            </span>
            <span class="badge" :class="fnStatusBadge(g.giftStatusCd)" style="font-size:11px;">
              {{ g.giftStatusCd }}
            </span>
          </div>
          <!-- ===== ■.■.■.■.■. 영역 ============================================== -->
          <div style="font-size:12px;color:#666;line-height:1.5;">
            <div>
              🎯 {{ g.giftTypeCd === 'AMOUNT' ? (g.minOrderAmt||0).toLocaleString() + '원↑' : g.giftTypeCd === 'QTY' ? (g.minOrderQty||0) + '개↑' : '-' }}
            </div>
            <div>
              📅 {{ g.startDate }} ~ {{ g.endDate }}
            </div>
            <div style="color:#999;margin-top:4px;">
              재고 {{ (g.giftStock||0).toLocaleString() }}개
            </div>
          </div>
        </div>
        <div style="padding:10px 16px;background:#f9f9f9;display:flex;gap:6px;justify-content:center;align-items:center;">
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction('gifts-cellClick', 'btn_row_edit', g, $event)" @auxclick.stop="handleGridCellAction('gifts-cellClick', 'btn_row_edit', g, $event)" style="font-size:11px;padding:4px 12px;">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction('gifts-cellClick', 'btn_row_delete', g)" style="font-size:11px;padding:4px 12px;">
            삭제
          </button>
          <span style="font-size:11px;color:#999;margin-left:auto;">
            #{{ g.giftId }}
          </span>
        </div>
      </div>
    </div>
    <!-- ===== ■.■. 페이지네이션 ================================================ -->
    <bo-pager v-if="tabMode!=='list' ? (baseGridPager.pageTotalCount > 0) : false" :pager="baseGridPager" :on-set-page="n => handleBtnAction('gifts-pager-setPage', n)" :on-size-change="() => handleSelectAction('gifts-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세영역: PmGiftDtl 인라인 임베드 ============================== -->
  <pm-gift-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />
  <bo-cm-popup-modal v-if="modals.isMemberPick" popup-cmd="cmPopup-member-pick" popup-code="member" :on-callback="fnCallbackModal" @close="modals.isMemberPick = false" />
  <bo-cm-popup-modal v-if="modals.isMdPick" popup-cmd="cmPopup-userMd-pick" popup-code="userMd" :on-callback="fnCallbackModal" @close="modals.isMdPick = false" />
  <bo-cm-popup-modal v-if="modals.isProdPick" popup-cmd="cmPopup-prod-pick" popup-code="prod" :on-callback="fnCallbackModal" @close="modals.isProdPick = false" />
  <bo-cm-popup-modal v-if="modals.isVendorPick" popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :on-callback="fnCallbackModal" @close="modals.isVendorPick = false" />
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" :domain="cfExcelDomain"
    :area-nm="cfExcelAreaNm" :columns="cfExcelColumns" ui-nm="사은품관리" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`
};
