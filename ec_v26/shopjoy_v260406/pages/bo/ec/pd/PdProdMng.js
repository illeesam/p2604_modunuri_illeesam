/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.PdProdMng = {
  name: 'PdProdMng',
  props: {
    navigate:          { type: Function, required: true }, // 페이지 이동
    initSearchValue:   { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
    fixedProdTypeCd:   { type: String,   default: null },  // 상품유형 고정 (단품/옵션/묶음/세트/사은품 개별 메뉴 진입 시)
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const modals = reactive({ isCatModal: false, isOptCodeModal: false, isMdPick: false });   // 모달 표시 상태
    const products = reactive([]);                 // 상품 목록 (메인 그리드 데이터)
    const vendors  = reactive([]);                 // 판매업체 목록 (검색조건 select)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ product_statuses: [], option_types: [], category_depths: [], prod_date_types: [], date_range_opts: [], prod_types: [] });
    const SORT_MAP = { nm: { asc: 'prodNm asc', desc: 'prodNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateRangeStart || searchParam.dateRangeEnd) && !searchParam.dateRangeType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 카테고리 모달 열기
      } else if (cmd === 'catModal-open') {
        return openCatModal();
      // 카테고리 모달 닫기
      } else if (cmd === 'catModal-close') {
        modals.isCatModal = false;
        return;
      // 카테고리 선택 비우기
      } else if (cmd === 'searchParam-cateClear') {
        searchParam.cate = '';
        searchParam.categoryId = '';
        return;
      // 상품 신규 등록 (인라인 패널)
      } else if (cmd === 'prods-add') {
        return openNew();
      // 상품 목록 재조회
      } else if (cmd === 'prods-reload') {
        return handleSearchList('RELOAD');
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'prods-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'prods-pager-setPage') {
        return setPage(param);
      // 상품옵션코드 관리 팝업 열기
      } else if (cmd === 'optCodeMng-open') {
        return fnOpenOptCodeMng();
      // 담당MD 선택 모달 열기
      } else if (cmd === 'mdModal-open') {
        modals.isMdPick = true;
        return;
      // 담당MD 선택 초기화
      } else if (cmd === 'searchParam-mdClear') {
        searchParam.mdUserId = '';
        searchParam.mdUserNm = '';
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'prods-pager-sizeChange') {
        return onSizeChange();
      // 그리드 행 미리보기 (새창)
      } else if (cmd === 'prods-rowPreview') {
        return previewProduct(param);
      // 카테고리 모달에서 카테고리 선택
      } else if (cmd === 'catModal-select') {
        return onCatSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ PdProdMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'prods-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { return handleLoadDetail(row.prodId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        if (colKey === 'btn_row_hist')   { return openHist(row.prodId); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.prodId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ PdProdMng : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-category-pick') {
        if (result == null) { modals.isCatModal = false; return; }
        return onCatSelect(result);
      } else if (popCmd === 'cmPopup-userMd-pick') {
        if (result == null) { modals.isMdPick = false; return; }
        searchParam.mdUserId = result.selId || '';
        searchParam.mdUserNm = result.selName || '';
        modals.isMdPick = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };
    const searchParam = reactive({
      /* ⚠ 검색 키는 백엔드 PdProdDto.Request 필드명과 일치해야 한다.
         이름이 다르면 Spring 바인딩에서 조용히 버려져 "필터가 안 걸리는" 버그가 된다(에러 없음).
         cate 는 표시용 카테고리명, categoryId 가 실제 서버 전송 값. */
      searchType: '', searchValue: '', dateRangeType: '', dateRange: '', dateRangeStart: '', dateRangeEnd: '',
      cate: '', categoryId: '', prodStatusCd: '',
      prodTypeCd: '',
      vendorId: '',   // initPage 에서 로그인 사용자의 소속 업체로 기본값 설정
      mdUserId: '',   // 담당MD 사용자ID (type:pick 검색 파라미터)
      mdUserNm: '',   // 담당MD 표시명 (type:pick 표시용 — API 전송 X, cofOmitEmpty 로 제외됨)
    });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 카테고리 선택 모달 ===== */

    /* ===== 상세 인라인 패널 ===== */
    const detailPanel = reactive({                 // 인라인 Dtl 패널 상태 (항상 표시, 진입 시 빈 신규 폼)
      selectedId: '__new__',                       // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      openMode: 'view',                            // 'view' | 'edit' — 기본은 항상 view (정책: 행 미선택/초기 진입은 편집 상태로 보이면 안 됨)
      reloadTrigger: 0,
      resetSeq: 0,                                 // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                               // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ===== 이력 인라인 패널 =====
     *   상세와 달리 항상 표시하지 않는다 — 관리컬럼 [이력] 클릭 시에만 prodId 가 채워져 렌더된다.
     *   [이력] 이 아닌 모든 동작(행 클릭·[수정]·[신규]·[취소]·조회·페이징·삭제)에서는 닫는다.
     *   닫지 않으면 한 번 연 뒤로 계속 남아 "항상 보인다" 가 되고,
     *   상세는 B상품인데 이력은 A상품이 남는 불일치도 생긴다. */
    const histPanel = reactive({ prodId: null });

    /* openHist — 관리컬럼 [이력] 클릭 → 목록 하단에 해당 상품 이력 표시 */
    const openHist = (id) => { histPanel.prodId = id; };

    /* closeHist — 이력 패널 닫기 */
    const closeHist = () => { histPanel.prodId = null; };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

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
      closeHist();   // 목록이 바뀌면 이력 대상 행이 화면에서 사라지므로 함께 닫는다
      uiState.loading = true;
      try {
        const params = { pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'prodId,prodNm,prodCode';
        }
        const res = await boApiSvc.pdProd.getPage(params, '상품관리', '목록조회');
        const data = res.data?.data;
        products.splice(0, products.length, ...(data?.pageList || []));
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

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'view';   // 행 미선택 안내 상태 — 편집 가능한 것처럼 보이면 안 됨
      detailPanel.active = false;      // 버튼 숨김
      detailPanel.resetSeq++;          // :key 재마운트 → 폼 초기화
      closeHist();
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { closeHist(); detailPanel.selectedId = id; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 (행 선택 → 저장/취소 노출) */
    const handleLoadDetail = (id) => { closeHist(); detailPanel.selectedId = id; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++; };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => { closeHist(); detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++; };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pdProdMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = async n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (p) => {
      const ok = await showConfirm('삭제', `[${p.prodNm}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = products.findIndex(x => x.prodId === p.prodId);
      if (idx !== -1) { products.splice(idx, 1); }
      if (detailPanel.selectedId === p.prodId) { resetDetailToNew(); }
      if (histPanel.prodId === p.prodId) { closeHist(); }
      try {
        const res = await boApiSvc.pdProd.remove(p.prodId, '상품관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* previewProduct — 미리보기 (새창) */
    const previewProduct = (prodId) => {
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    /* openCatModal — 카테고리 모달 열기 */
    const openCatModal = async () => { await handleSearchList('DEFAULT'); modals.isCatModal = true; };

    /* onCatSelect — 카테고리 선택 */
    const onCatSelect = (cat) => {
      /* 트리에서 '선택 안함' 을 고르면 categoryNm 이 빈 값으로 와 검색조건이 비워진다 */
      searchParam.cate       = (cat ? cat.categoryNm : '') || '';   // 화면 표시용
      searchParam.categoryId = (cat ? cat.categoryId : '') || '';   // 실제 필터 값(서버 전송)
      modals.isCatModal = false;
    };

    /* ===== 엑셀 다운로드 =====
       domain 키는 백엔드 OdPdCmExcelDomainConfig 의 @Bean 등록명과 일치해야 한다. */
    const excelModal = reactive({ show: false });

    /* buildExcelParams — 엑셀은 현재 검색조건 전체를 그대로 넘긴다(페이지 번호/크기 없이 서버가 전건 청크 처리) */
    const buildExcelParams = () => {
      const p = { ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
      if (p.searchValue && !p.searchType) { p.searchType = 'prodId,prodNm,prodCode'; }
      return p;
    };


    /* 상품 상태 배지 */
    const _PROD_STATUS_FB = { 'ON_SALE': 'badge-green', 'SOLD_OUT': 'badge-red', 'SUSPENDED': 'badge-gray', 'DRAFT': 'badge-blue', 'REVIEW': 'badge-orange', '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PRODUCT_STATUS', s, _PROD_STATUS_FB[s] || 'badge-gray');

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['PRODUCT_STATUS', 'OPT_TYPE', 'CATEGORY_DEPTH', 'PROD_DATE_TYPE', 'DATE_RANGE_OPT', 'PROD_TYPE_CD'], {compNm: 'PdProdMng'});
      codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
      codes.option_types = codeStore.sgGetGrpCodes('OPT_TYPE');
      codes.category_depths = codeStore.sgGetGrpCodes('CATEGORY_DEPTH');
      codes.prod_date_types = codeStore.sgGetGrpCodes('PROD_DATE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      codes.prod_types = codeStore.sgGetGrpCodes('PROD_TYPE_CD');
    };

    /* fnLoadVendorsAndMdUsers — 검색조건 판매업체 select 목록 로드 */
    const fnLoadVendorsAndMdUsers = async () => {
      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 500 }, '상품관리', '업체목록조회');
        vendors.splice(0, vendors.length, ...(res.data?.data?.pageList || []));
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    /* fnApplyLoginDefaults — 로그인 사용자의 소속 업체·담당MD 를 검색조건 기본값으로 설정 (fixedProdTypeCd 진입 시에도 유지) */
    const fnApplyLoginDefaults = async () => {
      const authUser = window.useBoAuthStore?.().sgCurrentUser;
      if (!authUser?.authId) return;
      // mdUserId 는 초기 자동 설정하지 않음 — 전체 상품 조회가 기본값
      // (담당 MD 검색은 사용자가 직접 선택하여 필터)
      try {
        const res = await boApiSvc.syVendorUser.getList({ userId: authUser.authId }, '상품관리', '소속업체조회');
        const rows = res.data?.data || [];
        if (rows[0]?.vendorId) { searchParam.vendorId = rows[0].vendorId; }
      } catch (err) {
        console.error('[catch-info]', err);
      }
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      /* 검색조건 초기값 (계산이 필요한 항목) */
      const today = new Date(); const thisYear = today.getFullYear();
      Object.assign(searchParam, {
        dateRangeType: 'reg_date',
        dateRangeStart: `${thisYear - 3}-01-01`,
        dateRangeEnd: `${thisYear}-12-31`,
        prodTypeCd: props.fixedProdTypeCd || '',
      });
      await fnLoadCodes();
      if (props.initSearchValue) {
        searchParam.searchValue = props.initSearchValue;
        searchParam.dateRangeStart = ''; searchParam.dateRangeEnd = '';
      }
      await Promise.all([fnLoadVendorsAndMdUsers(), fnApplyLoginDefaults()]);
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);

    /* cfPageTitle — 유형별 개별 메뉴 진입 시 화면 제목 (fixedProdTypeCd 지정) */
    const _PROD_TYPE_TITLE = { SINGLE: '단품상품등록', OPTION: '옵션상품등록', GROUP: '묶음상품등록', SET: '세트상품등록', GIFT: '사은상품등록' };
    const cfPageTitle = computed(() => _PROD_TYPE_TITLE[props.fixedProdTypeCd] || '상품관리');

    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', label: '검색대상', type: 'multiCheck',
        options: [
          { value: 'prodId',   label: '상품ID' },
          { value: 'prodNm',   label: '상품명' },
          { value: 'prodCode', label: '상품코드' },
          { value: 'brandNm',  label: '브랜드명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', label: '검색어', type: 'text', placeholder: '검색어 입력' },
      { key: 'cate', label: '카테고리', type: 'pick',
        display: (p) => p.cate, placeholder: '카테고리 선택', width: '120px',
        openLabel: '선택', onOpen: () => handleBtnAction('catModal-open'), onClear: () => handleBtnAction('searchParam-cateClear') },
      /* 상품유형 — 항상 검색조건에 노출한다.
         유형별 개별 메뉴(단품/옵션/묶음/세트/사은)는 값을 해당 유형으로 고정하고 disabled 처리한다.
         숨기지 않는 이유: 어떤 유형으로 걸러진 목록인지 화면에서 바로 보여야 한다
         (숨기면 '상품관리와 건수가 왜 다르지?' 를 사용자가 확인할 방법이 없다).
         '상품관리' 메뉴는 fixedProdTypeCd 가 없으므로 전체 유형 선택 가능. */
      { key: 'prodTypeCd', label: '상품유형', type: 'select',
        options: () => codes.prod_types,
        nullLabel: '유형 전체',
        nullable: !props.fixedProdTypeCd,          // 고정 메뉴에서는 '유형 전체' 선택지 자체를 없앤다
        disabled: () => !!props.fixedProdTypeCd },
      { key: 'vendorId', label: '판매업체', type: 'select',
        options: () => vendors.map(v => ({ value: v.vendorId, label: v.vendorNm })), nullLabel: '업체 전체' },
      { key: 'mdUserId', label: '담당MD', type: 'pick',
        display: (p) => p.mdUserNm, placeholder: 'MD 선택', width: '120px',
        openLabel: '선택', onOpen: () => handleBtnAction('mdModal-open'), onClear: () => handleBtnAction('searchParam-mdClear') },
      { key: 'prodStatusCd', label: '상태', type: 'select', options: () => codes.product_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', label: '등록일', type: 'dateRange',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.prod_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'prodNm',       label: '상품명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'prodTypeCdNm', label: '상품유형', align: 'center', fmt: (v, p) => v || p.prodTypeCd || '-' },
      { key: 'cateNm',       label: '카테고리' },
      { key: 'listPrice',    label: '가격', fmt: (v) => (coUtil.cofWon(v)) },
      { key: 'prodStock',    label: '재고', fmt: (v) => (v + '개') },
      { key: 'brandNm',      label: '브랜드' },
      { key: 'prodStatusCd', label: '상태', badge: (p) => fnStatusBadge(p.prodStatusCd), fmt: (v, p) => (p.prodStatusCdNm || p.prodStatusCd) },
      { key: 'regDate',      label: '등록일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    /* 상품옵션코드관리 모달 (별도 창 대신 iframe 인라인 — bo-pd-opt-code-mng.html 재사용) */
    const fnOpenOptCodeMng = () => { modals.isOptCodeModal = true; };
    const cfOptCodeMngUrl = computed(() => window.pageUrl('bo-pd-opt-code-mng.html'));

    return {

      modals,   // 모달 표시 상태 모음
      columns,
      excelModal, buildExcelParams,                                                                                    // 엑셀 다운로드
      products, uiState, searchParam, baseGridPager, detailPanel, histPanel, // 상태 / 데이터
      cfOptCodeMngUrl,                                    // 외부URL 모달 경로 표시
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                         // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                          // computed
      inlineNavigate,                                                              // Dtl 콜백 (closure 필요)
      closeHist,                                             // 이력 패널 닫기 (Hist 임베드 전달용)
      handleSearchList,                                      // Dtl 임베드 전달용
      fnOpenOptCodeMng,
      fixedProdTypeCd: props.fixedProdTypeCd,             // 유형별 개별 메뉴 진입 시 Dtl 신규등록 초기값 전달용
      cfPageTitle,
    };
  },
  template: /* html */`
<bo-page :title="cfPageTitle"
  desc-summary="상품관리 는 판매 상품의 기본정보·가격·재고·옵션을 등록하고 관리합니다."
  :desc-detail="['✔ 단품/묶음/세트 상품 유형별 등록·수정·삭제를 처리합니다.','✔ 옵션(1단/2단) 및 SKU별 가격·재고를 설정합니다.','✔ 상품 상태(임시저장→검수→판매중→품절·중단)를 관리합니다.','예) 단품 의류 등록, 옵션(색상·사이즈) 설정, 재고 이력 확인'].join(String.fromCharCode(10))">
  <template #actions>
    <button class="btn btn-secondary btn-sm" style="font-size:12px;" @click="handleBtnAction('optCodeMng-open')">
      ⚙ 상품옵션코드관리
    </button>
  </template>
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 ====================================================== -->
  <bo-container title="상품목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">
        📥 엑셀
      </button>
      <button class="btn btn_new" @click="handleBtnAction('prods-add')">
        + 신규
      </button>
    </template>
    <bo-grid bare
      :columns="columns.baseGrid" :rows="products" row-key="prodId" :selected-key="detailPanel.selectedId"
      :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(p) => detailPanel.selectedId===p.prodId ? 'background:#fff8f9;' : ''"
      @sort="key => handleBtnAction('prods-sort', key)"
      grid-id="prods-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
            table-max-height="540px">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: p, gridId }">
        <div class="actions">
          <button class="btn btn-xs" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기"
            @click.stop="handleSelectAction('prods-rowPreview', p.prodId)">
            👁
          </button>
          <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', p)">
            수정
          </button>
          <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', p)">
            삭제
          </button>
          <button class="btn btn_row_hist" @click.stop="handleGridCellAction(gridId, 'btn_row_hist', p)">
            이력
          </button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('prods-pager-setPage', n)" :on-size-change="() => handleSelectAction('prods-pager-sizeChange')" />
  </bo-container>
  <!-- ===== □. 목록 ======================================================= -->
  <!-- ===== ■. 카테고리 선택 모달 ============================================== -->
  <bo-cm-popup-modal v-if="modals.isCatModal"
    popup-cmd="cmPopup-category-pick" popup-code="category" clearable
    :on-callback="fnCallbackModal" @close="modals.isCatModal = false" />
  <!-- ===== □. 카테고리 선택 모달 ============================================== -->
  <!-- ===== ■. 담당MD 선택 모달 (공통팝업 userMd — PROD_ADMIN 역할 고정 필터) ======== -->
  <bo-cm-popup-modal v-if="modals.isMdPick"
    popup-cmd="cmPopup-userMd-pick" popup-code="userMd"
    :on-callback="fnCallbackModal" @close="modals.isMdPick = false" />
  <!-- ===== □. 담당MD 선택 모달 =============================================== -->
  <!-- ===== ■. 하단 상세: ProdDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ============== -->
  <pd-prod-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    :on-list-reload="handleSearchList"
    :fixed-prod-type-cd="fixedProdTypeCd"
    />
  <!-- ===== □. 하단 상세: ProdDtl 임베드 ====================================== -->
  <!-- ===== ■. 하단 이력: 관리컬럼 [이력] 클릭 시에만 노출 ========================= -->
  <div v-if="histPanel.prodId" style="margin-top:12px;">
    <pd-prod-hist :key="histPanel.prodId" :prod-id="histPanel.prodId"
      :navigate="inlineNavigate" :on-close="closeHist" />
  </div>
  <!-- ===== □. 하단 이력 ==================================================== -->
  <!-- ===== ■. 상품옵션코드관리 모달 (bo-pd-opt-code-mng.html iframe 인라인) ============== -->
  <bo-modal v-if="modals.isOptCodeModal" :show="true" title="⚙ 상품옵션코드관리" width="1100px" height="720px" body-pad="0"
    @close="modals.isOptCodeModal = false">
    <template #header-extra>
      <span style="font-size:11px;color:#bbb;">{{ cfOptCodeMngUrl }}</span>
    </template>
    <div style="position:relative;width:100%;height:660px;overflow:hidden;">
      <iframe src="bo-pd-opt-code-mng.html" style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe>
    </div>
  </bo-modal>
  <!-- ===== □. 상품옵션코드관리 모달 ============================================ -->
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" domain="pdProd"
    area-nm="상품관리" :columns="columns.baseGrid" ui-nm="상품관리" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
