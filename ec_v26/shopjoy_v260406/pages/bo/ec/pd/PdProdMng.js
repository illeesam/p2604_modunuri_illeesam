/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.PdProdMng = {
  name: 'PdProdMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const products = reactive([]);
    const uiState = reactive({ descOpen: false, loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ product_statuses: [], option_types: [], category_depths: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/pd/prod/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        products.splice(0, products.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('PdProd 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    onMounted(() => {
      handleFetchData();
      Object.assign(searchParamOrg, searchParam);
    });

    /* ── 검색 파라미터 ── */
    const searchParam = reactive({
      kw: '',
      dateRange: '',
      dateStart: '',
      dateEnd: '',
      cate: '',
      status: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      dateRange: '',
      dateStart: '',
      dateEnd: '',
      cate: '',
      status: ''
    });

    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = window.boCmUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.page = 1;
    };
    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.product_statuses = await codeStore.snGetGrpCodes('PRODUCT_STATUS') || [];
        codes.option_types = await codeStore.snGetGrpCodes('OPTION_TYPE') || [];
        codes.category_depths = await codeStore.snGetGrpCodes('CATEGORY_DEPTH') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const handleLoadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'pdProdMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const cfIsViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const cfDetailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const cfFiltered = computed(() => window.safeArrayUtils.safeFilter(products, p => {
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !p.prodNm.toLowerCase().includes(kw) && !String(p.productId).includes(kw)) return false;
      if (searchParam.cate && p.category !== searchParam.cate) return false;
      if (searchParam.status && p.status !== searchParam.status) return false;
      const _d = String(p.regDate || '').slice(0, 10);
      if (searchParam.dateStart && _d < searchParam.dateStart) return false;
      if (searchParam.dateEnd && _d > searchParam.dateEnd) return false;
      return true;
    }));
    const cfTotal = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums = computed(() => {
      const cur = pager.page, last = cfTotalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const cfCategories = computed(() => window.safeArrayUtils.safeFilter(cfCategories, c => c.status === '활성').map(c => c.categoryNm));

    /* ── 카테고리 선택 모달 ── */
    const catModal = reactive({ show: false });
    const openCatModal = () => { catModal.show = true; };
    const onCatSelect = (cat) => {
      searchParam.cate = cat.categoryNm || '';
      catModal.show = false;
    };
    const clearCate = () => { searchParam.cate = ''; };

    const fnStatusBadge = s => ({ '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => {
      pager.page = 1;
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      pager.page = 1;
    };
  
    const setPage = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const handleDelete = async (p) => {
      const ok = await props.showConfirm('삭제', `[${p.prodNm}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = products.value.findIndex(x => x.productId === p.productId);
      if (idx !== -1) products.value.splice(idx, 1);
      if (selectedId.value === p.productId) selectedId.value = null;
      try {
        const res = await window.boApi.delete(`/bo/ec/pd/prod/${p.productId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const previewProduct = (pid) => {
      window.open(`${window.pageUrl('index.html')}#page=prod01view&pid=${pid}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    const exportExcel = () => window.boCmUtil.exportCsv(cfFiltered.value, [{label:'ID',key:'productId'},{label:'상품명',key:'prodNm'},{label:'카테고리',key:'category'},{label:'가격',key:'price'},{label:'재고',key:'stock'},{label:'브랜드',key:'brand'},{label:'상태',key:'status'},{label:'등록일',key:'regDate'}], '상품목록.csv');


    return { products, uiState, searchParam, searchParamOrg, DATE_RANGE_OPTIONS, handleDateRangeChange, cfSiteNm, pager, PAGE_SIZES, cfFiltered, cfTotal, cfTotalPages, cfPageList, cfPageNums, cfCategories, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, selectedId, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, previewProduct, catModal, openCatModal, onCatSelect, clearCate, exportExcel };
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
      <input v-model="searchParam.kw" placeholder="상품명 / ID 검색" />
      <div style="display:flex;align-items:center;gap:4px;">
        <input class="form-control" v-model="searchParam.cate" placeholder="카테고리 선택" readonly
          style="width:120px;cursor:pointer;background:#fafafa;" @click="openCatModal" />
        <button type="button" class="btn btn-secondary btn-sm" @click="openCatModal">선택</button>
        <button v-if="searchParam.cate" type="button" class="btn btn-secondary btn-sm" @click="clearCate">✕</button>
      </div>
      <select v-model="searchParam.status"><option value="">상태 전체</option><option>판매중</option><option>품절</option><option>판매중지</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="handleDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o?.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>상품목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>브랜드</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="cfPageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="p in cfPageList" :key="p?.productId" :style="selectedId===p.productId?'background:#fff8f9;':''">
          <td>{{ p.productId }}</td>
          <td><span class="title-link" @click="handleLoadDetail(p.productId)" :style="selectedId===p.productId?'color:#e8587a;font-weight:700;':''">{{ p.prodNm }}<span v-if="selectedId===p.productId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ p.category }}</td>
          <td>{{ p.price.toLocaleString() }}원</td>
          <td>{{ p.stock }}개</td>
          <td>{{ p.brand }}</td>
          <td><span class="badge" :class="fnStatusBadge(p.status)">{{ p.status }}</span></td>
          <td>{{ p.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기" @click="previewProduct(p.productId)">👁</button>
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(p.productId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(p)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 카테고리 선택 모달 -->
  <category-tree-modal
    v-if="catModal && catModal.show"
    :exclude-id="null"
    @select="onCatSelect"
    @close="catModal.show=false" />

  <!-- 하단 상세: ProdDtl 임베드 -->
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
      :edit-id="cfDetailEditId"
    />
  </div>
</div>
`
};
