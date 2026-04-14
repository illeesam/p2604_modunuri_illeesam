/* ShopJoy Admin - 쿠폰관리 목록 + 하단 CouponDtl 임베드 */
window.EcCouponMng = {
  name: 'EcCouponMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) { const r = window.adminUtil.getDateRange(searchDateRange.value); searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : ''; }
      pager.page = 1;
    };
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    /* 하단 상세 */
    const selectedId = ref(null);
    const openMode = ref('view'); // 'view' | 'edit'
    const loadView = (id) => { if (selectedId.value === id && openMode.value === 'view') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'view'; };
    const loadDetail = (id) => { if (selectedId.value === id && openMode.value === 'edit') { selectedId.value = null; return; } selectedId.value = id; openMode.value = 'edit'; };
    const openNew = () => { selectedId.value = '__new__'; openMode.value = 'edit'; };
    const closeDetail = () => { selectedId.value = null; };
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'ecCouponMng') { selectedId.value = null; return; }
      if (pg === '__switchToEdit__') { openMode.value = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const detailEditId = computed(() => selectedId.value === '__new__' ? null : selectedId.value);
    const isViewMode = computed(() => openMode.value === 'view' && selectedId.value !== '__new__');
    const detailKey = computed(() => `${selectedId.value}_${openMode.value}`);

    const applied = Vue.reactive({ kw: '', status: '', dateStart: '', dateEnd: '' });

    const filtered = computed(() => props.adminData.coupons.filter(c => {
      const kw = applied.kw.trim().toLowerCase();
      if (kw && !c.name.toLowerCase().includes(kw) && !c.code.toLowerCase().includes(kw)) return false;
      if (applied.status && c.statusCd !== applied.status) return false;
      const _d = String(c.expiry || '').slice(0, 10);
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

    const discountLabel = c => c.discountTypeCd === 'rate' ? c.discountValue + '%' : c.discountTypeCd === 'shipping' ? '무료배송' : c.discountValue.toLocaleString() + '원';
    const statusBadge = s => ({ '활성': 'badge-green', '만료': 'badge-red', '비활성': 'badge-gray' }[s] || 'badge-gray');
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

    const doDelete = async (c) => {
      await window.adminApiCall({
        method: 'delete',
        path: `coupons/${c.couponId}`,
        confirmTitle: '삭제',
        confirmMsg: `[${c.name}]을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: '삭제되었습니다.',
        onLocal: () => {
          const idx = props.adminData.coupons.findIndex(x => x.couponId === c.couponId);
          if (idx !== -1) props.adminData.coupons.splice(idx, 1);
          if (selectedId.value === c.couponId) selectedId.value = null;
        },
      });
    };

    const exportExcel = () => window.adminUtil.exportCsv(filtered.value, [{label:'ID',key:'couponId'},{label:'쿠폰명',key:'couponNm'},{label:'유형',key:'discountTypeCd'},{label:'할인값',key:'discountValue'},{label:'최소금액',key:'minOrderAmount'},{label:'상태',key:'statusCd'},{label:'유효기간(시작)',key:'validFrom'},{label:'유효기간(종료)',key:'validTo'}], '쿠폰목록.csv');

    return { searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange, siteNm, searchKw, searchStatus, pager, PAGE_SIZES, applied, filtered, total, totalPages, pageList, pageNums, discountLabel, statusBadge, onSearch, onReset, setPage, onSizeChange, doDelete, selectedId, detailEditId, loadView, loadDetail, openNew, closeDetail, inlineNavigate, isViewMode, detailKey, exportExcel };
  },
  template: /* html */`
<div>
  <div class="page-title">쿠폰관리</div>
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="쿠폰명 / 코드 검색" />
      <select v-model="searchStatus"><option value="">상태 전체</option><option>활성</option><option>만료</option><option>비활성</option></select>
      <span class="search-label">등록일</span><input type="date" v-model="searchDateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchDateEnd" class="date-range-input" /><select v-model="searchDateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>쿠폰목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
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
          <td><span class="badge" :class="statusBadge(c.statusCd)">{{ c.statusCd }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ siteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="loadDetail(c.couponId)">수정</button>
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

  <!-- 하단 상세: CouponDtl 임베드 -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <ec-coupon-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :admin-data="adminData"
      :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :edit-id="detailEditId"
    />
  </div>
</div>
`
};
