/* ShopJoy Admin - 결제-정산 대사 */
window.StReconPayMng = {
  name: 'StReconPayMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const descOpen = ref(false);
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const dateRange = ref('이번달');
    const dateStart = ref('');
    const dateEnd   = ref('');
    const onDateRangeChange = () => {
      if (dateRange.value) { const r = window.adminUtil.getDateRange(dateRange.value); dateStart.value = r ? r.from : ''; dateEnd.value = r ? r.to : ''; }
    };
    (() => { const r = window.adminUtil.getDateRange('이번달'); if (r) { dateStart.value = r.from; dateEnd.value = r.to; } })();

    const orders = computed(() => props.adminData.orders || []);
    const searchDiff = ref('');
    const pager = reactive({ page: 1, size: 10 });

    const PAY_METHODS = ['카드결제','계좌이체','캐쉬','혼합결제'];
    const rows = computed(() => {
      return orders.value.filter(o => {
        if (dateStart.value && o.orderDate.slice(0,10) < dateStart.value) return false;
        if (dateEnd.value   && o.orderDate.slice(0,10) > dateEnd.value)   return false;
        return true;
      }).map(o => {
        const payAmt    = o.status === '취소됨' ? 0 : o.totalPrice;
        const pgAmt     = payAmt + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 500 : -500) : 0);
        const settleAmt = Math.round(payAmt * 0.9);
        const diff      = payAmt - Math.round(pgAmt);
        const diffStatus = Math.abs(diff) < 1 ? '일치' : (diff > 0 ? '결제과다' : '결제부족');
        return { orderId: o.orderId, txDate: o.orderDate.slice(0,10), payMethod: o.payMethod, payAmt, pgAmt: Math.round(pgAmt), settleAmt, diff: Math.round(diff), diffStatus };
      }).filter(r => !searchDiff.value || r.diffStatus === searchDiff.value);
    });

    const total    = computed(() => rows.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => rows.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const summary  = computed(() => ({
      match:   rows.value.filter(r=>r.diffStatus==='일치').length,
      over:    rows.value.filter(r=>r.diffStatus==='결제과다').length,
      under:   rows.value.filter(r=>r.diffStatus==='결제부족').length,
      diffAmt: rows.value.reduce((s,r)=>s+Math.abs(r.diff),0),
    }));

    const diffBadge = s => ({ '일치':'badge-green', '결제과다':'badge-red', '결제부족':'badge-orange' }[s] || 'badge-gray');
    const payBadge  = m => ({ '카드결제':'badge-blue', '계좌이체':'badge-green', '캐쉬':'badge-orange', '혼합결제':'badge-purple' }[m] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchDiff.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const setPage = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { descOpen, DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchDiff, pager, rows, total, totPages, pageList, pageNums, summary, diffBadge, payBadge, fmtW, onSearch, onReset , PAGE_SIZES , setPage , onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">결제-정산 대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">결제 승인·취소 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• PG사 결제금액(pg_amt) vs 정산 수집금액(settle_amt) 차이를 자동 비교합니다.
• 결제수단: 무통장/가상계좌/토스/카카오/네이버/핸드폰
• 차이 발생 시 PG사 정산 리포트와 대조 후 조정 처리합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchDiff" style="width:120px">
        <option value="">대사결과 전체</option><option>일치</option><option>결제과다</option><option>결제부족</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4"><div style="font-size:11px;color:#888">일치</div><div style="font-size:20px;font-weight:700;color:#27ae60">{{ summary.match }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">결제과다</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ summary.over }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">결제부족</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ summary.under }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa"><div style="font-size:11px;color:#888">차이금액 합계</div><div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(summary.diffAmt) }}</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>주문ID</th><th>거래일</th><th>결제수단</th><th>주문금액</th><th>PG정산액</th><th>정산기준액</th><th>차이금액</th><th>대사결과</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.orderId">
          <td>{{ r.orderId }}</td><td>{{ r.txDate }}</td>
          <td><span class="badge" :class="payBadge(r.payMethod)">{{ r.payMethod }}</span></td>
          <td>{{ fmtW(r.payAmt) }}</td>
          <td>{{ fmtW(r.pgAmt) }}</td>
          <td>{{ fmtW(r.settleAmt) }}</td>
          <td :style="Math.abs(r.diff)>0?'color:#e74c3c;font-weight:700':''">{{ r.diff !== 0 ? (r.diff > 0 ? '+' : '') + Number(r.diff).toLocaleString() + '원' : '-' }}</td>
          <td><span class="badge" :class="diffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===totPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===totPages" @click="setPage(totPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>
</div>
`,
};
