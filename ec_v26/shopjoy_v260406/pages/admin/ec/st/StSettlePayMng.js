/* ShopJoy Admin - 정산지급관리 */
window.StSettlePayMng = {
  name: 'StSettlePayMng',
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

    const searchKw     = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const selected = reactive(new Set());

    const filtered = computed(() => {
      const kw = searchKw.value.trim().toLowerCase();
      return payList.filter(r => {
        if (dateStart.value && r.payDate < dateStart.value) return false;
        if (dateEnd.value   && r.payDate > dateEnd.value)   return false;
        if (searchStatus.value && r.payStatus !== searchStatus.value) return false;
        if (kw && !r.payId.toLowerCase().includes(kw) && !r.vendorNm.toLowerCase().includes(kw)) return false;
        return true;
      });
    });
    const total    = computed(() => filtered.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const summary = computed(() => ({
      total:  filtered.value.reduce((s, r) => s + r.settleAmt, 0),
      paid:   filtered.value.filter(r => r.payStatus === '지급완료').reduce((s, r) => s + r.payAmt, 0),
      pending:filtered.value.filter(r => r.payStatus === '지급대기').reduce((s, r) => s + r.settleAmt, 0),
    }));

    const doPay = async (r) => {
      const ok = await props.showConfirm('지급처리', `[${r.vendorNm}]에게 ${Number(r.settleAmt).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) return;
      r.payStatus = '지급완료'; r.payAmt = r.settleAmt; r.payDate = new Date().toISOString().slice(0,10);
      try {
        const res = await window.adminApi.put(`st/pay/${r.payId}/pay`, { payAmt: r.settleAmt });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('지급처리가 완료되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const statusBadge = s => ({ '지급완료':'badge-green', '지급대기':'badge-blue', '지급보류':'badge-orange', '지급오류':'badge-red' }[s] || 'badge-gray');
    const fmtW = n => Number(n || 0).toLocaleString() + '원';
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchStatus.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const setPage = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { descOpen, DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchKw, searchStatus, pager, filtered, total, totPages, pageList, pageNums, summary, doPay, statusBadge, fmtW, onSearch, onReset , PAGE_SIZES , setPage , onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">정산지급관리</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">마감된 정산액의 업체별 지급 요청·확인·완료 처리 및 이의신청을 관리합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 지급 상태: 지급대기 / 지급요청 / 지급완료 / 이의신청
• [지급처리] 버튼으로 업체 계좌로 정산액 지급 완료 처리합니다.
• 이의신청 접수 시 관련 마감을 재오픈하여 재정산할 수 있습니다.
• 업체 계좌 정보는 업체관리(SyVendorMng)에서 관리합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchStatus" style="width:120px">
        <option value="">상태 전체</option><option>지급대기</option><option>지급완료</option><option>지급보류</option><option>지급오류</option>
      </select>
      <input v-model="searchKw" placeholder="지급ID / 업체명" style="width:180px" @keyup.enter="onSearch" />
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
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(summary.total) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0fff4">
        <div style="font-size:11px;color:#888">지급완료</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(summary.paid) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">지급대기</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ fmtW(summary.pending) }}</div>
      </div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>지급ID</th><th>지급일</th><th>업체명</th><th>정산월</th><th>정산액</th><th>지급액</th><th>은행</th><th>계좌번호</th><th>예금주</th><th>상태</th><th>담당자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.payId">
          <td>{{ r.payId }}</td>
          <td>{{ r.payDate }}</td>
          <td><strong>{{ r.vendorNm }}</strong></td>
          <td>{{ r.closeMon }}</td>
          <td style="font-weight:700">{{ fmtW(r.settleAmt) }}</td>
          <td :style="r.payAmt>0?'color:#27ae60;font-weight:700':'color:#999'">{{ r.payAmt > 0 ? fmtW(r.payAmt) : '-' }}</td>
          <td>{{ r.bankNm }}</td>
          <td style="font-size:12px;color:#666">{{ r.bankAccount }}</td>
          <td>{{ r.bankHolder }}</td>
          <td><span class="badge" :class="statusBadge(r.payStatus)">{{ r.payStatus }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.payStatus==='지급대기'" class="btn btn-sm btn-green" @click="doPay(r)">지급처리</button>
          </td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="12" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
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
