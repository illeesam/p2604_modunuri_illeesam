/* ShopJoy Admin - 정산지급관리 */
window.StSettlePayMng = {
  name: 'StSettlePayMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      settle_pay_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.settle_pay_statuses = codeStore.snGetGrpCodes('SETTLE_PAY_STATUS') || [];
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
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApi.get('/bo/ec/st/pay/page', {
          params: {
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          },
          ...coUtil.apiHdr('정산지급관리', '목록조회')
        });
        const data = res.data?.data;
        payList.splice(0, payList.length, ...(data?.list || payList));
        pager.pageTotalCount = data?.pageTotalCount || payList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      Object.assign(searchParamOrg, searchParam);
    });

    const DATE_RANGE_OPTIONS = boUtil.DATE_RANGE_OPTIONS;
            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const payList = reactive([
      { payId: 'PAY-2026-009', payDate: '2026-04-10', vendorId: 1, vendorNm: '패션스타일 주식회사', closeMon: '2026-03', settleAmt: 300000, payAmt: 300000, bankNm: '국민은행', bankAccount: '123-45-678901', bankHolder: '패션스타일', payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-008', payDate: '2026-04-10', vendorId: 2, vendorNm: '트렌드웨어 LLC',     closeMon: '2026-03', settleAmt: 81000,  payAmt: 81000,  bankNm: '신한은행', bankAccount: '987-65-432100', bankHolder: '트렌드웨어',  payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-007', payDate: '2026-04-10', vendorId: 3, vendorNm: '에코패션 Co.',       closeMon: '2026-03', settleAmt: 54000,  payAmt: 54000,  bankNm: '하나은행', bankAccount: '321-65-987654', bankHolder: '에코패션',    payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-006', payDate: '2026-04-10', vendorId: 4, vendorNm: '럭셔리브랜드 Inc.',  closeMon: '2026-03', settleAmt: 45000,  payAmt: 0,      bankNm: '우리은행', bankAccount: '111-22-333444', bankHolder: '럭셔리브랜드', payStatus: '지급대기', regUserNm: '이관리자' },
      { payId: 'PAY-2026-005', payDate: '2026-03-10', vendorId: 1, vendorNm: '패션스타일 주식회사', closeMon: '2026-02', settleAmt: 280000, payAmt: 280000, bankNm: '국민은행', bankAccount: '123-45-678901', bankHolder: '패션스타일', payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-004', payDate: '2026-03-10', vendorId: 2, vendorNm: '트렌드웨어 LLC',     closeMon: '2026-02', settleAmt: 73000,  payAmt: 73000,  bankNm: '신한은행', bankAccount: '987-65-432100', bankHolder: '트렌드웨어',  payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-003', payDate: '2026-03-10', vendorId: 3, vendorNm: '에코패션 Co.',       closeMon: '2026-02', settleAmt: 49000,  payAmt: 49000,  bankNm: '하나은행', bankAccount: '321-65-987654', bankHolder: '에코패션',    payStatus: '지급완료', regUserNm: '이관리자' },
      { payId: 'PAY-2026-002', payDate: '2026-03-10', vendorId: 4, vendorNm: '럭셔리브랜드 Inc.',  closeMon: '2026-02', settleAmt: 38000,  payAmt: 38000,  bankNm: '우리은행', bankAccount: '111-22-333444', bankHolder: '럭셔리브랜드', payStatus: '지급완료', regUserNm: '이관리자' },
    ]);

  const searchParam = reactive({
    kw: '',
    status: '', dateEnd: ''});;
  const searchParamOrg = reactive({
    kw: '',
    status: ''
  });
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const cfPageNums = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const cfSummary = computed(() => ({
      total:   payList.reduce((s, r) => s + r.settleAmt, 0),
      paid:    payList.filter(r => r.payStatus === '지급완료').reduce((s, r) => s + r.payAmt, 0),
      pending: payList.filter(r => r.payStatus === '지급대기').reduce((s, r) => s + r.settleAmt, 0),
    }));

    const doPay = async (r) => {
      const ok = await props.showConfirm('지급처리', `[${r.vendorNm}]에게 ${Number(r.settleAmt).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) return;
      r.payStatus = '지급완료'; r.payAmt = r.settleAmt; r.payDate = new Date().toISOString().slice(0,10);
      try {
        const res = await boApi.put(`/bo/ec/st/pay/${r.payId}/pay`, { payAmt: r.settleAmt }, { ...coUtil.apiHdr('정산지급관리', '저장') });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('지급처리가 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const fnStatusBadge = s => ({ '지급완료':'badge-green', '지급대기':'badge-blue', '지급보류':'badge-orange', '지급오류':'badge-red' }[s] || 'badge-gray');
    const fmtW = n => Number(n || 0).toLocaleString() + '원';
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, handleDateRangeChange, DATE_RANGE_OPTIONS, pager, payList, cfPageNums, cfSummary, doPay, fnStatusBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">정산지급관리</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">마감된 정산액의 업체별 지급 요청·확인·완료 처리 및 이의신청을 관리합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 지급 상태: 지급대기 / 지급요청 / 지급완료 / 이의신청
• [지급처리] 버튼으로 업체 계좌로 정산액 지급 완료 처리합니다.
• 이의신청 접수 시 관련 마감을 재오픈하여 재정산할 수 있습니다.
• 업체 계좌 정보는 업체관리(SyVendorMng)에서 관리합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt?.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.status" style="width:120px">
        <option value="">상태 전체</option><option>지급대기</option><option>지급완료</option><option>지급보류</option><option>지급오류</option>
      </select>
      <input v-model="searchParam.kw" placeholder="지급ID / 업체명" style="width:180px" @keyup.enter="() => onSearch?.()" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">총 정산액</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(cfSummary.total) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0fff4">
        <div style="font-size:11px;color:#888">지급완료</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(cfSummary.paid) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">지급대기</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ fmtW(cfSummary.pending) }}</div>
      </div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ pager.pageTotalCount }}건</span></div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>지급ID</th><th>지급일</th><th>업체명</th><th>정산월</th><th>정산액</th><th>지급액</th><th>은행</th><th>계좌번호</th><th>예금주</th><th>상태</th><th>담당자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in payList" :key="r?.payId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>{{ r.payId }}</td>
          <td>{{ r.payDate }}</td>
          <td><strong>{{ r.vendorNm }}</strong></td>
          <td>{{ r.closeMon }}</td>
          <td style="font-weight:700">{{ fmtW(r.settleAmt) }}</td>
          <td :style="r.payAmt>0?'color:#27ae60;font-weight:700':'color:#999'">{{ r.payAmt > 0 ? fmtW(r.payAmt) : '-' }}</td>
          <td>{{ r.bankNm }}</td>
          <td style="font-size:12px;color:#666">{{ r.bankAccount }}</td>
          <td>{{ r.bankHolder }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.payStatus)">{{ r.payStatus }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.payStatus==='지급대기'" class="btn btn-sm btn-green" @click="doPay(r)">지급처리</button>
          </td>
        </tr>
        <tr v-if="!payList.length"><td colspan="13" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
  </div>
</div>
`,
};
