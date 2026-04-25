/* ShopJoy Admin - 업체-정산 대사 */
window.StReconVendorMng = {
  name: 'StReconVendorMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      vendor_settle_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.vendor_settle_statuses = codeStore.snGetGrpCodes('VENDOR_SETTLE_STATUS') || [];
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
    const cfVendors = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

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
    diff: '', dateEnd: ''});;
  const searchParamOrg = reactive({
    diff: ''
  });
    const pager = reactive({ page: 1, size: 10 });

    const cfRows = computed(() => {
      return cfVendors.value.map(v => {
        const vOrders   = window.safeArrayUtils.safeFilter(cfOrders, o => o.vendorId === v.vendorId && o.status !== '취소됨' && (!uiState.dateStart || o.orderDate.slice(0,10) >= uiState.dateStart) && (!uiState.dateEnd || o.orderDate.slice(0,10) <= uiState.dateEnd));
        const sysAmt    = vOrders.reduce((s, o) => s + Math.round(o.totalPrice * 0.9), 0);
        const vendorAmt = sysAmt + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1000 : -1000) : 0);
        const diff      = sysAmt - Math.round(vendorAmt);
        const diffStatus = Math.abs(diff) < 1 ? '일치' : (diff > 0 ? '시스템과다' : '업체과다');
        return { vendorId: v.vendorId, vendorNm: v.vendorNm, orderCnt: vOrders.length, sysAmt, vendorAmt: Math.round(vendorAmt), diff: Math.round(diff), diffStatus };
      }).filter(r => !searchDiff.value || r.diffStatus === searchDiff.value);
    });

    const cfTotal  = computed(() => cfRows.value.length);
    const cfTotPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList = computed(() => cfRows.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const cfPageNums = computed(() => { const c=pager.page,l=cfTotPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const cfSummary = computed(() => ({
      match: window.safeArrayUtils.safeFilter(cfRows, r=>r.diffStatus==='일치').length,
      over:  window.safeArrayUtils.safeFilter(cfRows, r=>r.diffStatus==='시스템과다').length,
      under: window.safeArrayUtils.safeFilter(cfRows, r=>r.diffStatus==='업체과다').length,
    }));

    const fnDiffBadge = s => ({ '일치':'badge-green','시스템과다':'badge-red','업체과다':'badge-orange' }[s] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.page = 1;
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
  <div class="page-title">업체-정산 대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">업체가 제출한 정산 내역과 시스템 정산 데이터 간 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 시스템 집계금액(sys_amt) vs 업체 제출금액(vendor_amt) 차이를 자동 비교합니다.
• 업체별 정산 명세서와 대조하여 불일치 원인을 파악합니다.
• 차이 발생 시 상호 확인 후 조정(StSettleAdjMng)으로 처리합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt?.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.diff" style="width:120px">
        <option value="">대사결과 전체</option><option>일치</option><option>시스템과다</option><option>업체과다</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4"><div style="font-size:11px;color:#888">일치</div><div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.match }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">시스템과다</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.over }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">업체과다</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.under }}건</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfTotal }}개 업체</span></div>
    <table class="bo-table">
      <thead><tr><th>업체명</th><th>주문건수</th><th>시스템 정산액</th><th>업체 청구액</th><th>차이금액</th><th>대사결과</th></tr></thead>
      <tbody>
        <tr v-for="r in cfPageList" :key="r?.vendorId">
          <td><strong>{{ r.vendorNm }}</strong></td>
          <td>{{ r.orderCnt }}건</td>
          <td>{{ fmtW(r.sysAmt) }}</td>
          <td>{{ fmtW(r.vendorAmt) }}</td>
          <td :style="Math.abs(r.diff)>0?'color:#e74c3c;font-weight:700':''">{{ r.diff !== 0 ? (r.diff > 0 ? '+' : '') + Number(r.diff).toLocaleString() + '원' : '-' }}</td>
          <td><span class="badge" :class="fnDiffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
        </tr>
        <tr v-if="!cfPageList.length"><td colspan="6" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
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
