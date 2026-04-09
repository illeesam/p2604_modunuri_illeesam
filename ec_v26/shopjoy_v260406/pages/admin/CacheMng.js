/* ShopJoy Admin - 캐쉬관리 목록 + 하단 CacheDtl 임베드 */
window.CacheMng = {
  name: 'CacheMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchType = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'cacheMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.cacheList.filter(c => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !c.userName.toLowerCase().includes(kw) && !c.desc.toLowerCase().includes(kw) && !String(c.userId).includes(kw)) return false;
      if (searchType.value && c.type !== searchType.value) return false;
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

    const typeBadge = t => ({ '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' }[t] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('캐쉬 내역 삭제', `[${c.desc}] 내역을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.cacheList.findIndex(x => x.cacheId === c.cacheId);
      if (idx !== -1) props.adminData.cacheList.splice(idx, 1);
      if (selectedId.value === c.cacheId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchType, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, typeBadge, onSearch, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">캐쉬관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="회원명 / 회원ID / 내용 검색" @keyup.enter="onSearch" />
      <select v-model="searchType" @change="onSearch"><option value="">유형 전체</option><option>충전</option><option>사용</option><option>환불</option><option>소멸</option></select>
      <button class="btn btn-primary" @click="onSearch">검색</button>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span style="font-size:13px;color:#555;">검색결과 <b>{{ total }}</b>건</span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>회원</th><th>일시</th><th>유형</th><th>금액</th><th>잔액</th><th>내용</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.cacheId" :style="selectedId===c.cacheId?'background:#fff8f9;':''">
          <td>{{ c.cacheId }}</td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userName }}</span></td>
          <td>{{ c.date }}</td>
          <td><span class="badge" :class="typeBadge(c.type)">{{ c.type }}</span></td>
          <td :style="c.amount > 0 ? 'color:#389e0d;font-weight:600' : 'color:#cf1322;font-weight:600'">{{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원</td>
          <td>{{ c.balance.toLocaleString() }}원</td>
          <td><span class="title-link" @click="loadDetail(c.cacheId)" :style="selectedId===c.cacheId?'color:#e8587a;font-weight:700;':''">{{ c.desc }}<span v-if="selectedId===c.cacheId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.cacheId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
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

  <!-- 하단 상세: CacheDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <cache-dtl
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
