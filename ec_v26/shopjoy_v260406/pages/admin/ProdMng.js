/* ShopJoy Admin - 상품관리 목록 + 하단 ProdDtl 임베드 */
window.ProdMng = {
  name: 'ProdMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchCate = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'prodMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', cate: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.products.filter(p => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !p.productName.toLowerCase().includes(kw) && !String(p.productId).includes(kw)) return false;
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

    const categories = computed(() => [...new Set(props.adminData.products.map(p => p.category))]);
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
      const ok = await props.showConfirm('상품 삭제', `[${p.productName}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.products.findIndex(x => x.productId === p.productId);
      if (idx !== -1) props.adminData.products.splice(idx, 1);
      if (selectedId.value === p.productId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    const previewProduct = (pid) => {
      window.open(`http://127.0.0.1:5502/ec_v26/shopjoy_v260406/index.html#page=detail&pid=${pid}`, '_blank', 'width=1200,height=800,scrollbars=yes');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchCate, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, categories, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate, previewProduct };
  },
  template: /* html */`
<div>
  <div class="page-title">상품관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="상품명 / ID 검색" />
      <select v-model="searchCate"><option value="">카테고리 전체</option><option v-for="c in categories" :key="c">{{ c }}</option></select>
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
      <span class="list-title">상품목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>브랜드</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="p in pageList" :key="p.productId" :style="selectedId===p.productId?'background:#fff8f9;':''">
          <td>{{ p.productId }}</td>
          <td><span class="title-link" @click="loadDetail(p.productId)" :style="selectedId===p.productId?'color:#e8587a;font-weight:700;':''">{{ p.productName }}<span v-if="selectedId===p.productId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ p.category }}</td>
          <td>{{ p.price.toLocaleString() }}원</td>
          <td>{{ p.stock }}개</td>
          <td>{{ p.brand }}</td>
          <td><span class="badge" :class="statusBadge(p.status)">{{ p.status }}</span></td>
          <td>{{ p.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
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

  <!-- 하단 상세: ProdDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <prod-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};
