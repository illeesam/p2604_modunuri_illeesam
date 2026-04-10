/* ShopJoy Admin - 이벤트관리 목록 + 하단 EventDtl 임베드 */
window.EventMng = {
  name: 'EventMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref('3months');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'eventMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.events.filter(e => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !e.title.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && e.status !== searchStatus.value) return false;
      if (!window.adminUtil.isInRange(e.regDate, searchDateRange.value)) return false;
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
    const statusBadge = s => ({ '진행중': 'badge-green', '예정': 'badge-blue', '종료': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (e) => {
      const ok = await props.showConfirm('이벤트 삭제', `[${e.title}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.events.findIndex(x => x.eventId === e.eventId);
      if (idx !== -1) props.adminData.events.splice(idx, 1);
      if (selectedId.value === e.eventId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, DATE_RANGE_OPTIONS, siteName, searchKw, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">이벤트관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="이벤트 제목 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch"><option value="">상태 전체</option><option>진행중</option><option>예정</option><option>종료</option></select>
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
      <thead><tr><th>ID</th><th>이벤트 제목</th><th>대상상품</th><th>인증필요</th><th>시작일</th><th>종료일</th><th>상태</th><th>등록일</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="e in pageList" :key="e.eventId" :style="selectedId===e.eventId?'background:#fff8f9;':''">
          <td>{{ e.eventId }}</td>
          <td><span class="title-link" @click="loadDetail(e.eventId)" :style="selectedId===e.eventId?'color:#e8587a;font-weight:700;':''">{{ e.title }}<span v-if="selectedId===e.eventId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ e.targetProducts.length }}개 상품</td>
          <td><span class="badge" :class="e.authRequired ? 'badge-orange' : 'badge-gray'">{{ e.authRequired ? '필요' : '불필요' }}</span></td>
          <td>{{ e.startDate }}</td><td>{{ e.endDate }}</td>
          <td><span class="badge" :class="statusBadge(e.status)">{{ e.status }}</span></td>
          <td>{{ e.regDate }}</td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(e.eventId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(e)">삭제</button>
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

  <!-- 하단 상세: EventDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <event-dtl
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
