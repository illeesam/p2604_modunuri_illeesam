/* ShopJoy Admin - 쿠폰관리 목록 + 하단 CouponDtl 임베드 */
window.CouponMng = {
  name: 'CouponMng',
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
    const inlineNavigate = (pg, opts = {}) => { if (pg === 'couponMng') { selectedId.value = null; return; } props.navigate(pg, opts); };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);

    const filtered = computed(() => props.adminData.coupons.filter(c => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !c.name.toLowerCase().includes(kw) && !c.code.toLowerCase().includes(kw)) return false;
      if (searchStatus.value && c.status !== searchStatus.value) return false;
      if (!window.adminUtil.isInRange(c.expiry, searchDateRange.value)) return false;
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

    const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '%' : c.discountType === 'shipping' ? '무료배송' : c.discountValue.toLocaleString() + '원';
    const statusBadge = s => ({ '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' }[s] || 'badge-gray');
    const onSearch = () => { pager.page = 1; };
    const setPage = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('쿠폰 삭제', `[${c.name}]을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = props.adminData.coupons.findIndex(x => x.couponId === c.couponId);
      if (idx !== -1) props.adminData.coupons.splice(idx, 1);
      if (selectedId.value === c.couponId) selectedId.value = null;
      props.showToast('삭제되었습니다.');
    };

    return { searchDateRange, DATE_RANGE_OPTIONS, siteName, searchKw, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, discountLabel, statusBadge, onSearch, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadDetail, openNew, closeDetail, inlineNavigate };
  },
  template: /* html */`
<div>
  <div class="page-title">쿠폰관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="쿠폰명 / 코드 검색" @keyup.enter="onSearch" />
      <select v-model="searchStatus" @change="onSearch"><option value="">상태 전체</option><option>활성</option><option>만료</option><option>비활성</option></select>
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
      <thead><tr><th>ID</th><th>쿠폰명</th><th>코드</th><th>할인</th><th>최소주문</th><th>발급대상</th><th>발급/사용</th><th>만료일</th><th>상태</th><th>사이트명</th><th style="text-align:right">관리</th></tr></thead>
      <tbody>
        <tr v-if="pageList.length===0"><td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-for="c in pageList" :key="c.couponId" :style="selectedId===c.couponId?'background:#fff8f9;':''">
          <td>{{ c.couponId }}</td>
          <td><span class="title-link" @click="loadDetail(c.couponId)" :style="selectedId===c.couponId?'color:#e8587a;font-weight:700;':''">{{ c.name }}<span v-if="selectedId===c.couponId" style="font-size:10px;margin-left:3px;">▼</span></span></td>
          <td><code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;">{{ c.code }}</code></td>
          <td>{{ discountLabel(c) }}</td>
          <td>{{ c.minOrder ? c.minOrder.toLocaleString()+'원↑' : '-' }}</td>
          <td>{{ c.issueTo }}</td>
          <td>{{ c.issueCount }} / {{ c.useCount }}</td>
          <td>{{ c.expiry }}</td>
          <td><span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteName }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.couponId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="doDelete(c)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <span class="total-label">총 {{ total }}개</span>
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

  <!-- 하단 상세: CouponDtl 임베드 -->
  <div v-if="selectedId" style="border-top:2px solid #e8587a;margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <coupon-dtl
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
