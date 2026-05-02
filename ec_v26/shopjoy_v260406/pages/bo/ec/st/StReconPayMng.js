/* ShopJoy Admin - 결제-정산 대사 */
window.StReconPayMng = {
  name: 'StReconPayMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      payment_methods: [],
      payment_statuses: [],
      recon_results: [],
      date_range_opts: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.payment_methods = codeStore.snGetGrpCodes('PAYMENT_METHOD') || [];
        codes.payment_statuses = codeStore.snGetGrpCodes('PAYMENT_STATUS') || [];
        codes.recon_results = codeStore.snGetGrpCodes('RECON_RESULT_PAY') || [];
        codes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const rows = reactive([]);
    const _initSearchParam = () => ({ diff: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const cfSummary = computed(() => ({
      match:   rows.filter(r=>r.diffStatus==='일치').length,
      over:    rows.filter(r=>r.diffStatus==='결제과다').length,
      under:   rows.filter(r=>r.diffStatus==='결제부족').length,
      diffAmt: rows.reduce((s,r)=>s+Math.abs(r.diff||0),0),
    }));

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stRecon.getPage({
            pageNo: pager.pageNo, pageSize: pager.pageSize, typeCd: 'PAY',
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }, '결제-정산 대사', '목록조회');
        const data = res.data?.data;
        rows.splice(0, rows.length, ...(data?.list || rows));
        pager.pageTotalCount = data?.pageTotalCount || rows.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    const fnDiffBadge = s => ({ '일치':'badge-green', '결제과다':'badge-red', '결제부족':'badge-orange' }[s] || 'badge-gray');
    const fnPayBadge  = m => ({ '카드결제':'badge-blue', '계좌이체':'badge-green', '캐쉬':'badge-orange', '혼합결제':'badge-purple' }[m] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, handleDateRangeChange, codes, pager, rows, cfSummary, fnDiffBadge, fnPayBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">결제-정산 대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">결제 승인·취소 데이터와 정산 수집원장 간 금액 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• PG사 결제금액(pg_amt) vs 정산 수집금액(settle_amt) 차이를 자동 비교합니다.
• 결제수단: 무통장/가상계좌/토스/카카오/네이버/핸드폰
• 차이 발생 시 PG사 정산 리포트와 대조 후 조정 처리합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.diff" style="width:120px">
        <option value="">대사결과 전체</option><option v-for="c in codes.recon_results" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4"><div style="font-size:11px;color:#888">일치</div><div style="font-size:20px;font-weight:700;color:#27ae60">{{ cfSummary.match }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">결제과다</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.over }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">결제부족</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.under }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa"><div style="font-size:11px;color:#888">차이금액 합계</div><div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(cfSummary.diffAmt) }}</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ pager.pageTotalCount }}건</span></div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>주문ID</th><th>거래일</th><th>결제수단</th><th>주문금액</th><th>PG정산액</th><th>정산기준액</th><th>차이금액</th><th>대사결과</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in rows" :key="r?.orderId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>{{ r.orderId }}</td><td>{{ r.txDate }}</td>
          <td><span class="badge" :class="fnPayBadge(r.payMethod)">{{ r.payMethod }}</span></td>
          <td>{{ fmtW(r.payAmt) }}</td>
          <td>{{ fmtW(r.pgAmt) }}</td>
          <td>{{ fmtW(r.settleAmt) }}</td>
          <td :style="Math.abs(r.diff)>0?'color:#e74c3c;font-weight:700':''">{{ r.diff !== 0 ? (r.diff > 0 ? '+' : '') + Number(r.diff).toLocaleString() + '원' : '-' }}</td>
          <td><span class="badge" :class="fnDiffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
        </tr>
        <tr v-if="!rows.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
      <div class="pager">
        <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
        <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
        <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
        <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
          <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>
</div>
`,
};
