/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.PdProdMng = {
  name: 'PdProdMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달
    const products = reactive([]);                 // 상품 목록 (메인 그리드 데이터)
    const uiState = reactive({                     // UI 상태
      descOpen: false, loading: false, error: null, isPageCodeLoad: false,
    });
    const codes = reactive({ product_statuses: [], option_types: [], category_depths: [], prod_date_types: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'prodNm asc', desc: 'prodNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        baseGrid.pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        baseGrid.sortKey = ''; baseGrid.sortDir = 'asc';
        baseGrid.pager.pageNo = 1;
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 카테고리 모달 열기
      } else if (cmd === 'catModal-open') {
        return openCatModal();
      // 카테고리 모달 닫기
      } else if (cmd === 'catModal-close') {
        catModal.show = false;
        return;
      // 카테고리 선택 비우기
      } else if (cmd === 'searchParam-cateClear') {
        searchParam.cate = '';
        return;
      // 상품 신규 등록 (인라인 패널)
      } else if (cmd === 'prods-add') {
        return openNew();
      // 상품 목록 엑셀 내보내기
      } else if (cmd === 'prods-excel') {
        return exportExcel();
      // 상품 목록 재조회
      } else if (cmd === 'prods-reload') {
        return handleSearchList('RELOAD');
      // 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      // 상세 인라인 패널 닫기
      } else if (cmd === 'baseDetail-close') {
        return closeDetail();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdProdMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'prods-sort') {
        return baseGrid.onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'prods-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'prods-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 그리드 행 클릭 → 상세 편집 패널 열기
      } else if (cmd === 'prods-rowEdit') {
        return handleLoadDetail(param);
      // 그리드 행 미리보기 (새창)
      } else if (cmd === 'prods-rowPreview') {
        return previewProduct(param);
      // 그리드 행 삭제
      } else if (cmd === 'prods-rowDelete') {
        return handleDelete(param);
      // 카테고리 모달에서 카테고리 선택
      } else if (cmd === 'catModal-select') {
        return onCatSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, cate: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* baseGrid — + 정렬 + 페이지 액션 (coUtil.cofGrid) */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { sortMap: SORT_MAP, pageSize: 5 });

    /* ===== 카테고리 선택 모달 ===== */
    const catModal = reactive({ show: false });    // 카테고리 선택 모달 상태

    /* ===== 상세 인라인 패널 (coUtil.cofDetail) ===== */
    const baseDetail = coUtil.cofDetail();
    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
      codes.option_types = codeStore.sgGetGrpCodes('OPTION_TYPE');
      codes.category_depths = codeStore.sgGetGrpCodes('CATEGORY_DEPTH');
      codes.prod_date_types = codeStore.sgGetGrpCodes('PROD_DATE_TYPE');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize, ...baseGrid.sortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'prodId,prodNm,prodCode';
        }
        const res = await boApiSvc.pdProd.getPage(params, '상품관리', '목록조회');
        const data = res.data?.data;
        products.splice(0, products.length, ...(data?.pageList || []));
        baseGrid.pager.pageTotalCount = data?.pageTotalCount || 0;
        baseGrid.pager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGrid.pager.pageTotalCount / baseGrid.pager.pageSize) || 1;
        Object.assign(baseGrid.pager.pageCond, data?.pageCond || baseGrid.pager.pageCond);
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
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      baseGrid.pager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 */
    const loadView = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'view'; baseDetail.reloadTrigger++; };

    /* handleLoadDetail — 인라인 패널 편집 모드로 열기 */
    const handleLoadDetail = (id) => { baseDetail.selectedId = id; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* openNew — 신규 등록 */
    const openNew = () => { baseDetail.selectedId = '__new__'; baseDetail.openMode = 'edit'; baseDetail.reloadTrigger++; };

    /* closeDetail — 상세 닫기 */
    const closeDetail = () => { baseDetail.selectedId = null; };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pdProdMng') { baseDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { baseDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    /* previewProduct — 미리보기 (새창) */
    const previewProduct = (prodId) => {
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    /* openCatModal — 카테고리 모달 열기 */
    const openCatModal = async () => { await handleSearchList('DEFAULT'); catModal.show = true; };

    /* onCatSelect — 카테고리 선택 */
    const onCatSelect = (cat) => {
      searchParam.cate = cat.categoryNm || '';
      catModal.show = false;
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(products, [
      { label:'ID', key:'prodId' }, { label:'상품명', key:'prodNm' }, { label:'카테고리', key:'cateNm' },
      { label:'가격', key:'listPrice' }, { label:'재고', key:'prodStock' }, { label:'브랜드', key:'brandNm' },
      { label:'상태', key:'prodStatusCdNm' }, { label:'등록일', key:'regDate' },
    ], '상품목록.csv');
    /* 상품 상태 배지 */
    const _PROD_STATUS_FB = { 'ON_SALE': 'badge-green', 'SOLD_OUT': 'badge-red', 'SUSPENDED': 'badge-gray', 'DRAFT': 'badge-blue', 'REVIEW': 'badge-orange', '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' };

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('PRODUCT_STATUS', s, _PROD_STATUS_FB[s] || 'badge-gray');
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => baseDetail.selectedId === '__new__' ? null : baseDetail.selectedId);
    const cfIsViewMode = computed(() => baseDetail.openMode === 'view' && baseDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${baseDetail.selectedId}_${baseDetail.openMode}`);

    // 기본 검색
    const baseSearchColumns = [
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
      { key: 'status', label: '상태', type: 'select', options: () => codes.product_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', label: '등록일', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.prod_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'prodNm',       label: '상품명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => baseDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'cateNm',       label: '카테고리' },
      { key: 'listPrice',    label: '가격', fmt: (v) => ((v || 0).toLocaleString() + '원') },
      { key: 'prodStock',    label: '재고', fmt: (v) => (v + '개') },
      { key: 'brandNm',      label: '브랜드' },
      { key: 'prodStatusCd', label: '상태', badge: (p) => fnStatusBadge(p.prodStatusCd), fmt: (v, p) => (p.prodStatusCdNm || p.prodStatusCd) },
      { key: 'regDate',      label: '등록일', sortKey: 'reg' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      products, uiState, codes, searchParam,  baseDetail, catModal,        // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                          // 컬럼 정의
      handleBtnAction, handleSelectAction,                                         // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfDetailEditId, cfIsViewMode, cfDetailKey,                         // computed
      fnStatusBadge,                                                      // 헬퍼
      inlineNavigate,                                                              // Dtl 콜백 (closure 필요)
      showRefModal, showToast, showConfirm, setApiRes, handleSearchList,           // Dtl 임베드 전달용
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    상품관리
  </div>
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span>
      <strong style="color:#1a7a52">
        상품관리
      </strong>
      는 판매 상품의 기본정보·가격·재고·옵션을 등록하고 관리합니다.
    </span>
    <button @click="handleBtnAction('desc-toggle')" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" style="margin-top:6px">
      ✔ 단품/묶음/세트 상품 유형별 등록·수정·삭제를 처리합니다.
      <br>
      ✔ 옵션(1단/2단) 및 SKU별 가격·재고를 설정합니다.
      <br>
      ✔ 상품 상태(임시저장→검수→판매중→품절·중단)를 관리합니다.
      <br>
      <span style="color:#888;font-size:12px">
        예) 단품 의류 등록, 옵션(색상·사이즈) 설정, 재고 이력 확인
      </span>
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 ======================================================= -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        상품목록
        <span class="list-count">
          {{ baseGrid.pager.pageTotalCount }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="handleBtnAction('prods-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('prods-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 목록 그리드 ================================================ -->
    <bo-grid
      :columns="baseGridColumns" :rows="products" :pager="baseGrid.pager" row-key="prodId"
      list-title="목록" :count-text="baseGrid.pager.pageTotalCount + '건'" :row-actions="true"
      :sort-state="{ sortKey: baseGrid.sortKey, sortDir: baseGrid.sortDir }"
      :row-style="(p) => baseDetail.selectedId===p.prodId ? 'background:#fff8f9;' : ''"
      @sort="key => handleSelectAction('prods-sort', key)"
      @set-page="n => handleSelectAction('prods-pager-setPage', n)"
      @size-change="handleSelectAction('prods-pager-sizeChange')"
      @row-click="p => handleSelectAction('prods-rowEdit', p.prodId)">
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row: p }">
        <div class="actions">
          <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기"
            @click="handleSelectAction('prods-rowPreview', p.prodId)">
            👁
          </button>
          <button class="btn btn-blue btn-sm" @click="handleSelectAction('prods-rowEdit', p.prodId)">
            수정
          </button>
          <button class="btn btn-danger btn-sm" @click="handleSelectAction('prods-rowDelete', p)">
            삭제
          </button>
        </div>
      </template>
    </bo-grid>
  </div>
  <!-- ===== □. 목록 ======================================================= -->
  <!-- ===== ■. 카테고리 선택 모달 ============================================== -->
  <bo-category-tree-modal
    v-if="catModal && catModal.show"
    :exclude-id="null"
    @select="cat => handleSelectAction('catModal-select', cat)"
    @close="handleBtnAction('catModal-close')" />
  <!-- ===== □. 카테고리 선택 모달 ============================================== -->
  <!-- ===== ■. 하단 상세: ProdDtl 임베드 ====================================== -->
  <div v-if="baseDetail.selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('baseDetail-close')">
        ✕ 닫기
      </button>
    </div>
    <pd-prod-dtl
      :key="baseDetail.selectedId"
      :navigate="inlineNavigate"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="baseDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="baseDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
      />
  </div>
  <!-- ===== □. 하단 상세: ProdDtl 임베드 ====================================== -->
</div>
`,
};
