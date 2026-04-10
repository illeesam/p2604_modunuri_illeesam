/* ShopJoy Admin - 업체정보 목록 */
window.VendorMng = {
  name: 'VendorMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref('3months');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchType = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50];

    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg) => { if (pg === 'vendorMng') { selectedId.value = null; } };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.vendors.filter(v => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !v.vendorName.toLowerCase().includes(kw) && !v.bizNo.includes(kw)) return false;
      if (searchType.value && v.vendorType !== searchType.value) return false;
      if (searchStatus.value && v.status !== searchStatus.value) return false;
      if (!window.adminUtil.isInRange(v.contractDate, searchDateRange.value)) return false;
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

    const typeBadge = t => ({ '판매업체': 'badge-blue', '배송업체': 'badge-orange' }[t] || 'badge-gray');
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (v) => {
      const ok = await props.showConfirm('업체 삭제', `[${v.vendorName}] 업체를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.vendors.findIndex(x => x.vendorId === v.vendorId);
      if (idx !== -1) props.adminData.vendors.splice(idx, 1);
      if (selectedId.value === v.vendorId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, DATE_RANGE_OPTIONS, siteName, searchKw, searchType, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, onSearch, setPage, onSizeChange, typeBadge, statusBadge, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">업체정보</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="업체명 / 사업자번호 검색" @keyup.enter="onSearch" />
      <select v-model="searchType" @change="onSearch">
        <option value="">유형 전체</option><option>판매업체</option><option>배송업체</option>
      </select>
      <select v-model="searchStatus" @change="onSearch">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
      </select>
      <select v-model="searchDateRange" @change="onSearch"><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <button class="btn btn-primary" @click="onSearch">검색</button>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span style="font-size:13px;color:#555;">검색결과 <b>{{ total }}</b>건</span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>업체유형</th><th>업체명</th><th>대표자</th><th>사업자번호</th><th>전화번호</th><th>이메일</th><th>계약일</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="v in pageList" :key="v.vendorId" :style="selectedId===v.vendorId?'background:#fff8f9;':''">
          <td>{{ v.vendorId }}</td>
          <td><span class="badge" :class="typeBadge(v.vendorType)">{{ v.vendorType }}</span></td>
          <td><span class="title-link" @click="loadDetail(v.vendorId)" :style="selectedId===v.vendorId?'color:#e8587a;font-weight:700;':''">{{ v.vendorName }}<span v-if="selectedId===v.vendorId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ v.ceo }}</td>
          <td>{{ v.bizNo }}</td>
          <td>{{ v.phone }}</td>
          <td style="font-size:12px;">{{ v.email }}</td>
          <td>{{ v.contractDate }}</td>
          <td><span class="badge" :class="statusBadge(v.status)">{{ v.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(v.vendorId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(v)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="total-label">총 {{ total }}건</span>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <vendor-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :edit-id="detailEditId" />
  </div>
</div>
`
};
