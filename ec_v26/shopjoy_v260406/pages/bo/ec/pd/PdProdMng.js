/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.PdProdMng = {
  name: 'PdProdMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const products = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ product_statuses: [], option_types: [], category_depths: [], prod_date_types: [], date_range_opts: [] });

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'prodNm asc', desc: 'prodNm desc' }, reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 상품 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 상품 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };

    /* 상품 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* 상품 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'prodId,prodNm,prodCode';
        }
        const res = await boApiSvc.pdProd.getPage(params, '상품관리', '목록조회');
        const data = res.data?.data;
        products.splice(0, products.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };


    /* -- 검색 파라미터 -- */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, cate: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 상품 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 상품 fnLoadCodes */
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
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 상품 loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 상품 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 상품 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 상품 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 상품 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pdProdMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 상품 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* -- 카테고리 선택 모달 -- */
    const catModal = reactive({ show: false });

    /* 상품 openCatModal */
    const openCatModal = async () => { await handleSearchList('DEFAULT'); catModal.show = true; };

    /* 상품 onCatSelect */
    const onCatSelect = (cat) => {
      searchParam.cate = cat.categoryNm || '';
      catModal.show = false;
    };

    /* 상품 clearCate */
    const clearCate = () => { searchParam.cate = ''; };

    /* 상품 fnStatusBadge */
    const _PROD_STATUS_FB = { 'ON_SALE': 'badge-green', 'SOLD_OUT': 'badge-red', 'SUSPENDED': 'badge-gray', 'DRAFT': 'badge-blue', 'REVIEW': 'badge-orange', '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' };
    const fnStatusBadge = s => coUtil.cofCodeBadge('PRODUCT_STATUS', s, _PROD_STATUS_FB[s] || 'badge-gray');

    /* 상품 목록조회 */
    const onSearch = async () => {
      if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
        props.showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    /* 상품 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    /* 상품 setPage */
    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };

    /* 상품 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 상품 삭제 */
    const handleDelete = async (p) => {
      const ok = await showConfirm('삭제', `[${p.prodNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = products.findIndex(x => x.prodId === p.prodId);
      if (idx !== -1) products.splice(idx, 1);
      if (uiStateDetail.selectedId === p.prodId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.pdProd.remove(p.prodId, '상품관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 상품 previewProduct */
    const previewProduct = (prodId) => {
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    /* 상품 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(products, [{label:'ID',key:'prodId'},{label:'상품명',key:'prodNm'},{label:'카테고리',key:'cateNm'},{label:'가격',key:'listPrice'},{label:'재고',key:'prodStock'},{label:'브랜드',key:'brandNm'},{label:'상태',key:'prodStatusCdNm'},{label:'등록일',key:'regDate'}], '상품목록.csv');


    const selectedId = computed(() => uiStateDetail.selectedId);

    // -- return ---------------------------------------------------------------

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
        openLabel: '선택', onOpen: () => openCatModal(), onClear: () => clearCate() },
      { key: 'status', label: '상태', type: 'select', options: () => codes.product_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', label: '등록일', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.prod_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
    ];

    const baseGridColumns = [
      { key: 'prodNm',       label: '상품명', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'cateNm',       label: '카테고리' },
      { key: 'listPrice',    label: '가격', fmt: (v) => ((v || 0).toLocaleString() + '원') },
      { key: 'prodStock',    label: '재고', fmt: (v) => (v + '개') },
      { key: 'brandNm',      label: '브랜드' },
      { key: 'prodStatusCd', label: '상태', badge: (p) => fnStatusBadge(p.prodStatusCd), fmt: (v, p) => (p.prodStatusCdNm || p.prodStatusCd) },
      { key: 'regDate',      label: '등록일', sortKey: 'reg' },
      { key: 'siteNm',       label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    return { uiStateDetail, selectedId, products, uiState, codes, searchParam, baseSearchColumns, baseGridColumns, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewProduct, catModal, openCatModal, onCatSelect, clearCate, exportExcel, onSort, sortIcon };
  },
  template: /* html */`
<div>
  <div class="page-title">상품관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">상품관리</strong>는 판매 상품의 기본정보·가격·재고·옵션을 등록하고 관리합니다.</span>
    <button @click="descOpen=!descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" style="margin-top:6px">
      ✔ 단품/묶음/세트 상품 유형별 등록·수정·삭제를 처리합니다.<br>
      ✔ 옵션(1단/2단) 및 SKU별 가격·재고를 설정합니다.<br>
      ✔ 상품 상태(임시저장→검수→판매중→품절·중단)를 관리합니다.<br>
      <span style="color:#888;font-size:12px">예) 단품 의류 등록, 옵션(색상·사이즈) 설정, 재고 이력 확인</span>
    </div>
  </div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="onSearch" @reset="onReset" />
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>상품목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <bo-grid
      :columns="baseGridColumns" :rows="products" :pager="pager" row-key="prodId"
      list-title="목록" :count-text="pager.pageTotalCount + '건'" :row-actions="true"
      :sort-state="{ sortKey: uiState.sortKey, sortDir: uiState.sortDir }"
      :row-style="(p) => selectedId===p.prodId ? 'background:#fff8f9;' : ''"
      @sort="onSort" @set-page="setPage" @size-change="onSizeChange" @row-click="p => handleLoadDetail(p.prodId)">
      <template #head-actions>관리</template>
      <template #row-actions="{ row: p }">
        <div class="actions">
          <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기" @click="previewProduct(p.prodId)">👁</button>
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.prodId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(p)">삭제</button>
        </div>
      </template>
    </bo-grid>
  </div>

  <!-- -- 카테고리 선택 모달 ----------------------------------------------------- -->
  <bo-category-tree-modal
    v-if="catModal && catModal.show"
    :exclude-id="null"
    @select="onCatSelect"
    @close="catModal.show=false" />

  <!-- -- 하단 상세: ProdDtl 임베드 --------------------------------------------- -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <pd-prod-dtl
      :key="selectedId"
      :navigate="inlineNavigate"

      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchList"
    />
  </div>
</div>
`
};
