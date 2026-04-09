/* ShopJoy Admin - 배송관리 목록 + 하단 DlivDtl 임베드 */
window.DlivMng = {
  name: 'DlivMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);

    const loadDetail = (dlivId) => {
      if (selectedId.value === dlivId) { selectedId.value = null; return; }
      selectedId.value = dlivId;
    };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };

    /* DlivDtl 에 넘길 navigate: 'dlivMng' 이동 요청 → 패널 닫기로 인터셉트 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'dlivMng') { selectedId.value = null; return; }
      props.navigate(pg, opts);
    };

    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    /* 목록 */
    const filtered = computed(() => props.adminData.deliveries.filter(d => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !d.dlivId.toLowerCase().includes(kw) && !d.orderId.toLowerCase().includes(kw)
            && !d.userName.toLowerCase().includes(kw) && !d.receiver.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && d.status !== searchStatus.value) return false;
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

    const statusBadge = s => ({
      '배송준비': 'badge-orange', '배송중': 'badge-blue', '배송완료': 'badge-green', '반송': 'badge-red'
    }[s] || 'badge-gray');

    const onSearch = () => { pager.page = 1; };
    const setPage  = n  => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (d) => {
      const ok = await props.showConfirm('배송 삭제', `[${d.dlivId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.deliveries.findIndex(x => x.dlivId === d.dlivId);
      if (idx !== -1) props.adminData.deliveries.splice(idx, 1);
      if (selectedId.value === d.dlivId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">배송관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="배송ID / 주문ID / 회원명 / 수령인 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch">
        <option value="">상태 전체</option><option>배송준비</option><option>배송중</option><option>배송완료</option><option>반송</option>
      </select>
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
        <th>배송ID</th><th>주문ID</th><th>회원</th><th>수령인</th><th>택배사</th><th>운송장번호</th><th>배송지</th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="d in pageList" :key="d.dlivId" :style="selectedId===d.dlivId?'background:#fff8f9;':''">
          <td>
            <span class="title-link" @click="loadDetail(d.dlivId)" :style="selectedId===d.dlivId?'color:#e8587a;font-weight:700;':''">
              {{ d.dlivId }}<span v-if="selectedId===d.dlivId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
          </td>
          <td><span class="ref-link" @click="showRefModal('order', d.orderId)">{{ d.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', d.userId)">{{ d.userName }}</span></td>
          <td>{{ d.receiver }}</td>
          <td>{{ d.courier }}</td>
          <td>{{ d.trackingNo || '-' }}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ d.address }}</td>
          <td><span class="badge" :class="statusBadge(d.status)">{{ d.status }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(d.dlivId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(d)">삭제</button>
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

  <!-- 하단 상세: DlivDtl 컴포넌트 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <dliv-dtl
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
