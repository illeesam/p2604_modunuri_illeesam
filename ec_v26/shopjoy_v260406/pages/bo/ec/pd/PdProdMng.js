/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.PdProdMng = {
  name: 'PdProdMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const products = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false, sortKey: '', sortDir: 'asc' });
    const codes = reactive({ product_statuses: [], option_types: [], category_depths: [], date_range_opts: [] });

    // onMounted에서 API 로드
    const SORT_MAP = { nm: { asc: 'nm_asc', desc: 'nm_desc' }, reg: { asc: 'reg_asc', desc: 'reg_desc' } };
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchList();
    };
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdProd.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '상품관리', '목록조회');
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
      return { searchTypes: '', searchValue: '', dateType: 'reg_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, cate: '', status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.product_statuses = codeStore.sgGetGrpCodes('PRODUCT_STATUS');
      codes.option_types = codeStore.sgGetGrpCodes('OPTION_TYPE');
      codes.category_depths = codeStore.sgGetGrpCodes('CATEGORY_DEPTH');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };
    const closeDetail = () => { uiStateDetail.selectedId = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pdProdMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* -- 카테고리 선택 모달 -- */
    const catModal = reactive({ show: false });
    const openCatModal = async () => { await handleSearchList('DEFAULT'); catModal.show = true; };
    const onCatSelect = (cat) => {
      searchParam.cate = cat.categoryNm || '';
      catModal.show = false;
    };
    const clearCate = () => { searchParam.cate = ''; };

    const fnStatusBadge = s => ({ 'ON_SALE': 'badge-green', 'SOLD_OUT': 'badge-red', 'SUSPENDED': 'badge-gray', 'DRAFT': 'badge-blue', 'REVIEW': 'badge-orange', '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = async () => {
      if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
        props.showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

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

    const previewProduct = (prodId) => {
      window.open(`${window.pageUrl('index.html')}#page=prodView&prodid=${prodId}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    const exportExcel = () => coUtil.exportCsv(products, [{label:'ID',key:'prodId'},{label:'상품명',key:'prodNm'},{label:'카테고리',key:'cateNm'},{label:'가격',key:'listPrice'},{label:'재고',key:'prodStock'},{label:'브랜드',key:'brandNm'},{label:'상태',key:'prodStatusCdNm'},{label:'등록일',key:'regDate'}], '상품목록.csv');


    const selectedId = computed(() => uiStateDetail.selectedId);

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId, products, uiState, codes, searchParam, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewProduct, catModal, openCatModal, onCatSelect, clearCate, exportExcel, onSort, sortIcon };
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
    <div class="search-bar">
      <multi-check-select v-model="searchParam.searchTypes" :options="[
          { value: 'def_prod_id',   label: '상품ID' },
          { value: 'def_prod_nm',   label: '상품명' },
          { value: 'def_prod_code', label: '상품코드' },
          { value: 'def_brand_nm',  label: '브랜드명' },
        ]" placeholder="검색대상 전체" all-label="전체 선택" min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <div style="display:flex;align-items:center;gap:4px;">
        <input class="form-control" v-model="searchParam.cate" placeholder="카테고리 선택" readonly
          style="width:120px;cursor:pointer;background:#fafafa;" @click="openCatModal" />
        <button type="button" class="btn btn-secondary btn-sm" @click="openCatModal">선택</button>
        <button v-if="searchParam.cate" type="button" class="btn btn-secondary btn-sm" @click="clearCate">✕</button>
      </div>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option v-for="c in codes.product_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option></select>
      <select v-model="searchParam.dateType"><option value="reg_date">등록일자</option><option value="upd_date">수정일자</option></select><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>상품목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th><th @click="onSort('nm')" style="cursor:pointer;user-select:none;white-space:nowrap;">상품명 <span :style="uiState.sortKey==='nm'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('nm') }}</span></th><th>카테고리</th><th>가격</th><th>재고</th><th>브랜드</th><th>상태</th><th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">등록일 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="products.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(p, idx) in products" :key="p?.prodId" :style="selectedId===p.prodId?'background:#fff8f9;':''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td><span class="title-link" @click="handleLoadDetail(p.prodId)" :style="selectedId===p.prodId?'color:#e8587a;font-weight:700;':''">{{ p.prodNm }}<span v-if="selectedId===p.prodId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ p.cateNm }}</td>
          <td>{{ (p.listPrice||0).toLocaleString() }}원</td>
          <td>{{ p.prodStock }}개</td>
          <td>{{ p.brandNm }}</td>
          <td><span class="badge" :class="fnStatusBadge(p.prodStatusCd)">{{ p.prodStatusCdNm || p.prodStatusCd }}</span></td>
          <td>{{ p.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기" @click="previewProduct(p.prodId)">👁</button>
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.prodId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(p)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 카테고리 선택 모달 ----------------------------------------------------- -->
  <category-tree-modal
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
