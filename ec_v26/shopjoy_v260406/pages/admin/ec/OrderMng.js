/* ShopJoy Admin - 주문관리 목록 + 하단 OrderDtl 임베드 */
window.OrderMng = {
  name: 'OrderMng',
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
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    /* 하단 상세 */
    const selectedId = ref(null);
    const loadDetail = (id) => { if (selectedId.value === id) { selectedId.value = null; return; } selectedId.value = id; };
    const openNew = () => { selectedId.value = '__new__'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'ecOrderMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const applied = Vue.reactive({ kw: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.orders.filter(o => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !o.orderId.toLowerCase().includes(kw) && !o.userName.toLowerCase().includes(kw) && !o.productName.toLowerCase().includes(kw)) return false;
      if (applied.status && o.status !== applied.status) return false;
      const _d = String(o.orderDate || '').slice(0, 10);
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

    const statusBadge = s => ({
      '주문완료': 'badge-blue', '결제완료': 'badge-orange', '배송준비중': 'badge-orange',
      '배송중': 'badge-blue', '배송완료': 'badge-green', '완료': 'badge-gray', '취소됨': 'badge-red'
    }[s] || 'badge-gray');
    const onSearch = () => {
      Object.assign(applied, {
        kw: searchKw.value,
        status: searchStatus.value,
        dateStart: searchDateStart.value,
        dateEnd: searchDateEnd.value,
      });
      pager.page = 1;
    };
    const onReset = () => {
      searchKw.value = '';
      searchStatus.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', status: '', dateStart: '', dateEnd: '' });
      pager.page = 1;
    };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (o) => {
      const ok = await props.showConfirm('주문 삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) props.adminData.orders.splice(idx, 1);
      if (selectedId.value === o.orderId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteName, searchKw, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">주문관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="주문ID / 회원명 / 상품명 검색" />
      <select v-model="searchStatus">
        <option value="">상태 전체</option>
        <option>주문완료</option><option>결제완료</option><option>배송준비중</option>
        <option>배송중</option><option>배송완료</option><option>완료</option><option>취소됨</option>
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
      <span class="list-title">주문목록 <span class="list-count">{{ total }}건</span></span>
      <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>주문ID</th><th>회원</th><th>주문일시</th><th>상품</th><th>결제금액</th><th>결제수단</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="o in pageList" :key="o.orderId" :style="selectedId===o.orderId?'background:#fff8f9;':''">
          <td><span class="title-link" @click="loadDetail(o.orderId)" :style="selectedId===o.orderId?'color:#e8587a;font-weight:700;':''">{{ o.orderId }}<span v-if="selectedId===o.orderId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><span class="ref-link" @click="showRefModal('member', o.userId)">{{ o.userName }}</span></td>
          <td>{{ o.orderDate }}</td>
          <td>{{ o.productName }}</td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>{{ o.payMethod }}</td>
          <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(o.orderId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(o)">삭제</button>
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

  <!-- 하단 상세: OrderDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <order-dtl
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
