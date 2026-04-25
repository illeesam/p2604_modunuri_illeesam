/* ShopJoy Admin - 주문-정산 대사 */
window.StReconOrderMng = {
  name: 'StReconOrderMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      order_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.order_statuses = codeStore.snGetGrpCodes('ORDER_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = window.boCmUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = window.boCmUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const orderList = reactive([]);
    const vendorList = reactive([]);
    const cfOrders  = computed(() => orderList);
    const cfVendors = computed(() => vendorList);

    const handleFetchData = async () => {
      try {
        const [resO, resV] = await Promise.all([
          window.boApi.get('/bo/ec/od/order/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/sy/vendor/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        orderList.splice(0, orderList.length, ...(resO.data?.data?.list || []));
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.list || []));
      } catch (_) {
      console.error('[catch-info]', _);}
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });

  const searchParam = reactive({
    kw: '',
    diff: '', dateEnd: ''});;
  const searchParamOrg = reactive({
    kw: '',
    diff: ''
  });
    const pager = reactive({ page: 1, size: 10 });

    const cfRows = computed(() => {
      const kw = (searchParam.kw || '').trim().toLowerCase();
      return window.safeArrayUtils.safeFilter(cfOrders, o => {
        if (uiState.dateStart && o.orderDate.slice(0,10) < uiState.dateStart) return false;
        if (uiState.dateEnd   && o.orderDate.slice(0,10) > uiState.dateEnd)   return false;
        if (kw && !o.orderId.toLowerCase().includes(kw) && !o.userNm.toLowerCase().includes(kw)) return false;
        return true;
      }).map(o => {
        const v = cfVendors.value.find(x => x.vendorId === o.vendorId);
        const orderAmt   = o.status === '취소됨' ? 0 : o.totalPrice;
        const settleAmt  = Math.round(orderAmt * 0.9); // 수수료 10% 차감 가정
        const reconAmt   = settleAmt + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 100 : -200) : 0); // 일부 차이
        const diff       = settleAmt - reconAmt;
        const diffStatus = Math.abs(diff) < 1 ? '일치' : (diff > 0 ? '정산과다' : '정산부족');
        return { orderId: o.orderId, orderDate: o.orderDate.slice(0,10), vendorNm: v ? v.vendorNm : '-', orderAmt, settleAmt, reconAmt: Math.round(reconAmt), diff: Math.round(diff), diffStatus };
      }).filter(r => !searchParam.diff || r.diffStatus === searchParam.diff);
    });

    const cfTotal  = computed(() => cfRows.value.length);
    const cfTotPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfRows.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const cfPageNums = computed(() => { const c=pager.page,l=cfTotPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const cfSummary = computed(() => ({
      match:   window.safeArrayUtils.safeFilter(cfRows, r => r.diffStatus==='일치').length,
      over:    window.safeArrayUtils.safeFilter(cfRows, r => r.diffStatus==='정산과다').length,
      under:   window.safeArrayUtils.safeFilter(cfRows, r => r.diffStatus==='정산부족').length,
      diffAmt: cfRows.value.reduce((s, r) => s + Math.abs(r.diff), 0),
    }));

    const fnDiffBadge = s => ({ '일치':'badge-green', '정산과다':'badge-red', '정산부족':'badge-orange' }[s] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.page = 1;
      await handleFetchData();
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  

    const setPage = n => { if (n >= 1 && n <= cfTotPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { uiState, handleDateRangeChange, DATE_RANGE_OPTIONS, pager, cfRows, cfTotal, cfTotPages, cfPageList, cfPageNums, cfSummary, fnDiffBadge, fmtW, onSearch, onReset, searchParam, PAGE_SIZES, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">주문-정산 대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">주문 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 주문금액(order_amt) vs 정산수집 금액(recon_amt) 차이를 자동 비교합니다.
• 차이 상태: 일치 / 차이발생 / 검토중 / 처리완료
• 차이 발생 건은 원인 파악 후 조정(StSettleAdjMng)으로 처리하거나 수동 대사 확인합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt?.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.diff" style="width:110px">
        <option value="">대사결과 전체</option><option>일치</option><option>정산과다</option><option>정산부족</option>
      </select>
      <input v-model="searchParam.kw" placeholder="주문ID / 고객명" style="width:180px" @keyup.enter="() => onSearch?.()" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4"><div style="font-size:11px;color:#888">일치</div><div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.match }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">정산과다</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.over }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">정산부족</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.under }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa"><div style="font-size:11px;color:#888">차이금액 합계</div><div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(cfSummary.diffAmt) }}</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfTotal }}건</span></div>
    <table class="bo-table">
      <thead><tr><th>주문ID</th><th>주문일</th><th>업체</th><th>주문금액</th><th>정산기준액</th><th>실정산액</th><th>차이금액</th><th>대사결과</th></tr></thead>
      <tbody>
        <tr v-for="r in cfPageList" :key="r?.orderId">
          <td>{{ r.orderId }}</td><td>{{ r.orderDate }}</td><td>{{ r.vendorNm }}</td>
          <td>{{ fmtW(r.orderAmt) }}</td>
          <td>{{ fmtW(r.settleAmt) }}</td>
          <td>{{ fmtW(r.reconAmt) }}</td>
          <td :style="Math.abs(r.diff)>0?'color:#e74c3c;font-weight:700':''">{{ r.diff !== 0 ? (r.diff > 0 ? '+' : '') + Number(r.diff).toLocaleString() + '원' : '-' }}</td>
          <td><span class="badge" :class="fnDiffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
        </tr>
        <tr v-if="!cfPageList.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===cfTotPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===cfTotPages" @click="setPage(cfTotPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>
</div>
`,
};
