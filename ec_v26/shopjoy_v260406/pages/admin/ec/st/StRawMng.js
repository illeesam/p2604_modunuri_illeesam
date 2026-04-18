/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) { const r = window.adminUtil.getDateRange(dateRange.value); dateStart.value = r ? r.from : ''; dateEnd.value = r ? r.to : ''; }
    };
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    const searchKw     = ref('');
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [10, 20, 50];

    const orders  = computed(() => props.adminData.orders  || []);
    const claims  = computed(() => props.adminData.claims  || []);
    const vendors = computed(() => props.adminData.vendors || []);

    const rawList = computed(() => {
      const rows = [];
      orders.value.forEach(o => {
        const v = vendors.value.find(x => x.vendorId === o.vendorId);
        const isCancelled = o.status === '취소됨';
        rows.push({
          rawId: 'RAW-O-' + o.orderId.replace('ORD-', ''), sourceType: '주문', sourceId: o.orderId,
          txDate: o.orderDate.slice(0, 10), vendorNm: v ? v.vendorNm : '-',
          amount: isCancelled ? 0 : o.totalPrice, status: isCancelled ? '취소' : '정산대상',
          collectYn: isCancelled ? 'N' : 'Y', remark: isCancelled ? '주문취소' : '',
        });
      });
      claims.value.filter(c => ['환불완료','취소완료'].includes(c.status)).forEach(c => {
        const o = orders.value.find(x => x.orderId === c.orderId);
        const v = o ? vendors.value.find(x => x.vendorId === o.vendorId) : null;
        rows.push({
          rawId: 'RAW-C-' + c.claimId.replace('CLM-', ''), sourceType: '클레임', sourceId: c.claimId,
          txDate: c.requestDate.slice(0, 10), vendorNm: v ? v.vendorNm : '-',
          amount: -(c.refundAmount || 0), status: '차감',
          collectYn: 'Y', remark: c.type + '/' + c.status,
        });
      });
      return rows.sort((a, b) => b.txDate.localeCompare(a.txDate));
    });

    const filtered = computed(() => {
      const kw = searchKw.value.trim().toLowerCase();
      return rawList.value.filter(r => {
        if (dateStart.value && r.txDate < dateStart.value) return false;
        if (dateEnd.value   && r.txDate > dateEnd.value)   return false;
        if (searchType.value   && r.sourceType !== searchType.value) return false;
        if (searchStatus.value && r.status      !== searchStatus.value) return false;
        if (kw && !r.rawId.toLowerCase().includes(kw) && !r.sourceId.toLowerCase().includes(kw) && !r.vendorNm.toLowerCase().includes(kw)) return false;
        return true;
      });
    });

    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value, s = Math.max(1, c-2), e = Math.min(l, s+4); return Array.from({length: e-s+1}, (_, i) => s+i); });

    const summary = computed(() => ({
      totalAmt: filtered.value.reduce((s, r) => s + r.amount, 0),
      collectCnt: filtered.value.filter(r => r.collectYn === 'Y').length,
    }));

    const applied = reactive({});
    const onSearch = () => { Object.assign(applied, {}); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const statusBadge = s => ({ '정산대상':'badge-blue', '차감':'badge-red', '취소':'badge-gray' }[s] || 'badge-gray');
    const fmtW = n => Number(n).toLocaleString() + '원';

    const doCollect = () => props.showToast('정산 데이터를 재수집합니다.', 'info');

    return { DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchKw, searchType, searchStatus, pager, PAGE_SIZES, filtered, total, totalPages, pageList, pageNums, summary, onSearch, onReset, statusBadge, fmtW, doCollect };
  },
  template: /* html */`
<div>
  <div class="page-title">정산수집원장</div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchType" style="width:110px">
        <option value="">유형 전체</option><option>주문</option><option>클레임</option>
      </select>
      <select v-model="searchStatus" style="width:110px">
        <option value="">상태 전체</option><option>정산대상</option><option>차감</option><option>취소</option>
      </select>
      <input v-model="searchKw" placeholder="원장ID / 소스ID / 업체명" style="width:200px" @keyup.enter="onSearch" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">수집건수</div>
        <div style="font-size:20px;font-weight:700;color:#3498db">{{ total }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0fff4">
        <div style="font-size:11px;color:#888">정산대상</div>
        <div style="font-size:20px;font-weight:700;color:#27ae60">{{ summary.collectCnt }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">수집금액 합계</div>
        <div style="font-size:20px;font-weight:700" :style="summary.totalAmt>=0?'color:#333':'color:#e74c3c'">{{ fmtW(summary.totalAmt) }}</div>
      </div>
    </div>
    <div class="toolbar">
      <span class="list-count">총 {{ total }}건</span>
      <div style="margin-left:auto"><button class="btn btn-blue btn-sm" @click="doCollect">🔄 재수집</button></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>원장ID</th><th>거래일자</th><th>유형</th><th>소스ID</th><th>업체</th><th>금액</th><th>수집여부</th><th>상태</th><th>비고</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.rawId">
          <td>{{ r.rawId }}</td>
          <td>{{ r.txDate }}</td>
          <td><span class="badge" :class="r.sourceType==='주문'?'badge-blue':'badge-orange'">{{ r.sourceType }}</span></td>
          <td>{{ r.sourceId }}</td>
          <td>{{ r.vendorNm }}</td>
          <td :style="r.amount<0?'color:#e74c3c;font-weight:700':'font-weight:700'">{{ fmtW(r.amount) }}</td>
          <td><span class="badge" :class="r.collectYn==='Y'?'badge-green':'badge-gray'">{{ r.collectYn==='Y'?'수집':'미수집' }}</span></td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
          <td style="color:#888;font-size:12px">{{ r.remark }}</td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination" v-if="totalPages > 1">
      <button class="pager" @click="pager.page=Math.max(1,pager.page-1)" :disabled="pager.page===1">‹</button>
      <button v-for="n in pageNums" :key="n" class="pager" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
      <button class="pager" @click="pager.page=Math.min(totalPages,pager.page+1)" :disabled="pager.page===totalPages">›</button>
    </div>
  </div>
</div>
`,
};
