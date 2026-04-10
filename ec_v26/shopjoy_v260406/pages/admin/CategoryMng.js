/* ShopJoy Admin - 카테고리관리 목록 */
window.CategoryMng = {
  name: 'CategoryMng',
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
    const searchStatus = ref('');
    const searchDepth = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50];

    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg) => { if (pg === 'categoryMng') { selectedId.value = null; } };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', status: '', depth: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.categories.filter(c => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !c.categoryName.toLowerCase().includes(kw)) return false;
      if (applied.status && c.status !== applied.status) return false;
      if (applied.depth && String(c.depth) !== applied.depth) return false;
      const _d = String(c.regDate || '').slice(0, 10);
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

    const getParentName = (parentId) => {
      if (!parentId) return '-';
      return props.adminData.categories.find(c => c.categoryId === parentId)?.categoryName || '-';
    };
    const depthLabel = d => d === 1 ? '1단계(대)' : d === 2 ? '2단계(중)' : `${d}단계`;
    const depthBadge = d => d === 1 ? 'badge-blue' : d === 2 ? 'badge-green' : 'badge-gray';
    const statusBadge = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        status: searchStatus.value,
        depth: searchDepth.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchStatus.value = '';
      searchDepth.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', status: '', depth: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const hasChildren = props.adminData.categories.some(x => x.parentId === c.categoryId);
      if (hasChildren) { props.showToast('하위 카테고리가 있어 삭제할 수 없습니다.', 'error'); return; }
      const ok = await props.showConfirm('카테고리 삭제', `[${c.categoryName}] 카테고리를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.categories.findIndex(x => x.categoryId === c.categoryId);
      if (idx !== -1) props.adminData.categories.splice(idx, 1);
      if (selectedId.value === c.categoryId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchStatus, searchDepth, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, onSearch, onReset, setPage, onSizeChange, getParentName, depthLabel, depthBadge, statusBadge, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">카테고리관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="카테고리명 검색" />
      <select v-model="searchDepth">
        <option value="">depth 전체</option><option value="1">1단계(대)</option><option value="2">2단계(중)</option><option value="3">3단계(소)</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
      </select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">카테고리목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>ID</th><th>depth</th><th>상위카테고리</th><th>카테고리명</th><th>정렬</th><th>설명</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.categoryId" :style="selectedId===c.categoryId?'background:#fff8f9;':''">
          <td>{{ c.categoryId }}</td>
          <td><span class="badge" :class="depthBadge(c.depth)">{{ depthLabel(c.depth) }}</span></td>
          <td style="color:#666;font-size:12px;">{{ getParentName(c.parentId) }}</td>
          <td>
            <span :style="c.depth===2?'padding-left:16px;':c.depth===3?'padding-left:32px;':''">
              <span v-if="c.depth>1" style="color:#ccc;margin-right:4px;">└</span>
              <span class="title-link" @click="loadDetail(c.categoryId)" :style="selectedId===c.categoryId?'color:#e8587a;font-weight:700;':''">{{ c.categoryName }}<span v-if="selectedId===c.categoryId" style="font-size:10px;margin-left:3px;">▼</span></span>
            </span>
          </td>
          <td>{{ c.sortOrd }}</td>
          <td style="font-size:12px;color:#666;">{{ c.description }}</td>
          <td><span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.categoryId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
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
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <category-dtl :key="selectedId" :navigate="inlineNavigate" :admin-data="adminData" :show-toast="showToast" :edit-id="detailEditId" />
  </div>
</div>
`
};
