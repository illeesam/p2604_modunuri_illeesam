/* ShopJoy Admin - 채팅관리 목록 + 하단 ChattDtl 임베드 */
window.ChattMng = {
  name: 'ChattMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'chattMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const sorted = computed(() => [...props.adminData.chats].sort((a, b) => b.date.localeCompare(a.date)));
    const filtered = computed(() => sorted.value.filter(c => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !c.userName.toLowerCase().includes(kw) && !c.subject.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && c.status !== searchStatus.value) return false;
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
    const statusBadge = s => ({ '진행중': 'badge-green', '종료': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('채팅 삭제', `[${c.subject}] 채팅을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.chats.findIndex(x => x.chatId === c.chatId);
      if (idx !== -1) props.adminData.chats.splice(idx, 1);
      if (selectedId.value === c.chatId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">채팅관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="회원명 / 제목 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch"><option value="">상태 전체</option><option>진행중</option><option>종료</option></select>
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
        <th>ID</th><th>회원</th><th>제목</th><th>마지막 메시지</th><th>메시지수</th><th>미읽음</th><th>상태</th><th>일시</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.chatId" :style="selectedId===c.chatId?'background:#fff8f9;':''">
          <td>{{ c.chatId }}</td>
          <td><span class="ref-link" @click="showRefModal('member', c.userId)">{{ c.userName }}</span></td>
          <td><span class="title-link" @click="loadDetail(c.chatId)" :style="selectedId===c.chatId?'color:#e8587a;font-weight:700;':''">{{ c.subject }}<span v-if="selectedId===c.chatId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888;">{{ c.lastMsg || '-' }}</td>
          <td>{{ c.messages.length }}개</td>
          <td>
            <span v-if="c.unread > 0" class="badge badge-red">{{ c.unread }}</span>
            <span v-else class="badge badge-gray">0</span>
          </td>
          <td><span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span></td>
          <td>{{ c.date }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.chatId)">보기</button>
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

  <!-- 하단 상세: ChattDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <chatt-dtl
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
