/* ShopJoy Admin - 주문관리 목록 */
window.OrderMng = {
  name: 'OrderMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100];

    const filtered = computed(() => props.adminData.orders.filter(o => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !o.orderId.toLowerCase().includes(kw) && !o.userName.toLowerCase().includes(kw) && !o.productName.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && o.status !== searchStatus.value) return false;
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

    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (o) => {
      const ok = await props.showConfirm('주문 삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) props.adminData.orders.splice(idx, 1);
      props.showToast('삭제되었습니다.');
    };

    return { searchKw, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, statusBadge, onSearch, setPage, onSizeChange, doDelete };
  },
  template: /* html */`
<div>
  <div class="page-title">주문관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="주문ID / 회원명 / 상품명 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch">
        <option value="">상태 전체</option>
        <option>주문완료</option><option>결제완료</option><option>배송준비중</option>
        <option>배송중</option><option>배송완료</option><option>완료</option><option>취소됨</option>
      </select>
      <button class="btn btn-primary" @click="onSearch">검색</button>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span style="font-size:13px;color:#555;">검색결과 <b>{{ total }}</b>건</span>
      <button class="btn btn-primary btn-sm" @click="navigate('orderDtl', {id:null})">+ 신규</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>주문ID</th><th>회원</th><th>주문일시</th><th>상품</th><th>결제금액</th><th>결제수단</th><th>상태</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="8" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="o in pageList" :key="o.orderId">
          <td><span class="title-link" @click="navigate('orderDtl',{id:o.orderId})">{{ o.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', o.userId)">{{ o.userName }}</span></td>
          <td>{{ o.orderDate }}</td>
          <td>{{ o.productName }}</td>
          <td>{{ o.totalPrice.toLocaleString() }}원</td>
          <td>{{ o.payMethod }}</td>
          <td><span class="badge" :class="statusBadge(o.status)">{{ o.status }}</span></td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="navigate('orderDtl',{id:o.orderId})">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(o)">삭제</button>
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
</div>
`
};
