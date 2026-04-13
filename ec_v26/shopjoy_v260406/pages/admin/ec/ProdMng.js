/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.EcProdMng = {
  name: 'EcProdMng',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchCate = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'ecProdMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', cate: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.dispDataset.products.filter(p => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !p.prodNm.toLowerCase().includes(kw) && !String(p.productId).includes(kw)) return false;
      if (applied.cate && p.category !== applied.cate) return false;
      if (applied.status && p.status !== applied.status) return false;
      const _d = String(p.regDate || '').slice(0, 10);
      if (applied.dateStart && _d < applied.dateStart) return false;
      if (applied.dateEnd && _d > applied.dateEnd) return false;
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const start = Math.max(1, cur - 2), end = Math.min(last, start + 4);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    const categories = computed(() => props.dispDataset.categories.filter(c => c.status === '활성').map(c => c.categoryNm));

    /* ── 카테고리 선택 모달 ── */
    const catModal = Vue.reactive({ show: false });
    const openCatModal = () => { catModal.show = true; };
    const onCatSelect = (cat) => {
      searchCate.value = cat.categoryNm || '';
      catModal.show = false;
    };
    const clearCate = () => { searchCate.value = ''; };

    const statusBadge = s => ({ '판매중': 'badge-green', '품절': 'badge-red', '판매중지': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        cate: searchCate.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchCate.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', cate: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (p) => {
      await window.adminApiCall({
        method: 'delete',
        path: `products/${p.productId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${p.prodNm}]을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.dispDataset.products.findIndex(x => x.productId === p.productId);
          if (idx !== -1) props.dispDataset.products.splice(idx, 1);
          if (selectedId.value === p.productId) selectedId.value = null;
        },
      });
    };

    const previewProduct = (pid) => {
      window.open(`${window.pageUrl('index.html')}#page=prod01view&pid=${pid}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'productId'},{label:'상품명',key:'prodNm'},{label:'카테고리',key:'category'},{label:'가격',key:'price'},{label:'재고',key:'stock'},{label:'브랜드',key:'brand'},{label:'상태',key:'status'},{label:'등록일',key:'regDate'}], '상품목록.csv');

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchCate, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, categories, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, previewProduct, catModal, openCatModal, onCatSelect, clearCate, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">상품관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="상품명 / ID 검색" />
      <div style="display:flex;align-items:center;gap:4px;">
        <input class="form-control" v-model="searchCate" placeholder="카테고리 선택" readonly
          style="width:120px;cursor:pointer;background:#fafafa;" @click="openCatModal" />
        <button type="button" class="btn btn-secondary btn-sm" @click="openCatModal">선택</button>
        <button v-if="searchCate" type="button" class="btn btn-secondary btn-sm" @click="clearCate">✕</button>
      </div>
      <select v-model="searchStatus"><option value="">상태 전체</option><option>판매중</option><option>품절</option><option>판매중지</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>상품목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>브랜드</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="p in pageList" :key="p.productId" :style="selectedId===p.productId?'background:#fff8f9;':''">
          <td>{{ p.productId }}</td>
          <td><span class="title-link" @click="loadDetail(p.productId)" :style="selectedId===p.productId?'color:#e8587a;font-weight:700;':''">{{ p.prodNm }}<span v-if="selectedId===p.productId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ p.category }}</td>
          <td>{{ p.price.toLocaleString() }}원</td>
          <td>{{ p.stock }}개</td>
          <td>{{ p.brand }}</td>
          <td><span class="badge" :class="statusBadge(p.status)">{{ p.status }}</span></td>
          <td>{{ p.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-sm" style="background:#fff;border:1px solid #d9d9d9;color:#555;" title="미리보기" @click="previewProduct(p.productId)">👁</button>
            <button class="btn btn-blue btn-sm" @click="loadDetail(p.productId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(p)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 카테고리 선택 모달 -->
  <category-tree-modal
    v-if="catModal.show"
    :disp-dataset="dispDataset"
    :exclude-id="null"
    @select="onCatSelect"
    @close="catModal.show=false" />

  <!-- 하단 상세: ProdDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <prod-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="dispDataset"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};
