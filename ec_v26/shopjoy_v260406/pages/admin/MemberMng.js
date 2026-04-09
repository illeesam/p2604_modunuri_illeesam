/* ShopJoy Admin - 회원관리 목록 + 하단 MemberDtl 임베드 */
window.MemberMng = {
  name: 'MemberMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchGrade = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'memberMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.members.filter(m => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !m.name.toLowerCase().includes(kw) && !m.email.toLowerCase().includes(kw) && !String(m.userId).includes(kw)) return false;
      if (searchGrade.value && m.grade !== searchGrade.value) return false;
      if (searchStatus.value && m.status !== searchStatus.value) return false;
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

    const gradeBadge = g => ({ 'VIP': 'badge-purple', '우수': 'badge-blue', '일반': 'badge-gray' }[g] || 'badge-gray');
    const statusBadge = s => ({ '활성': 'badge-green', '정지': 'badge-red' }[s] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (m) => {
      const ok = await props.showConfirm('회원 삭제', `[${m.name}] 회원을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.members.findIndex(x => x.userId === m.userId);
      if (idx !== -1) props.adminData.members.splice(idx, 1);
      if (selectedId.value === m.userId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchGrade, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, onSearch, setPage, onSizeChange, gradeBadge, statusBadge, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">회원관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="이름 / 이메일 / ID 검색" @keyup.enter="onSearch" />
      <select v-model="searchGrade" @change="onSearch"><option value="">등급 전체</option><option>VIP</option><option>우수</option><option>일반</option></select>
      <select v-model="searchStatus" @change="onSearch"><option value="">상태 전체</option><option>활성</option><option>정지</option></select>
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
        <th>ID</th><th>이름</th><th>이메일</th><th>연락처</th><th>등급</th><th>상태</th><th>가입일</th><th>주문수</th><th>총구매액</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="m in pageList" :key="m.userId" :style="selectedId===m.userId?'background:#fff8f9;':''">
          <td>{{ m.userId }}</td>
          <td><span class="title-link" @click="loadDetail(m.userId)" :style="selectedId===m.userId?'color:#e8587a;font-weight:700;':''">{{ m.name }}<span v-if="selectedId===m.userId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td>{{ m.email }}</td>
          <td>{{ m.phone }}</td>
          <td><span class="badge" :class="gradeBadge(m.grade)">{{ m.grade }}</span></td>
          <td><span class="badge" :class="statusBadge(m.status)">{{ m.status }}</span></td>
          <td>{{ m.joinDate }}</td>
          <td>{{ m.orderCount }}건</td>
          <td>{{ m.totalPurchase.toLocaleString() }}원</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(m.userId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(m)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="total-label">총 {{ total }}명</span>
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

  <!-- 하단 상세: MemberDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <member-dtl
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
