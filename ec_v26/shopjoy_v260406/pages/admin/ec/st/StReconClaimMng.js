/* ShopJoy Admin - 클레임-정산 대사 */
window.StReconClaimMng = {
  name: 'StReconClaimMng',
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

    const claims  = computed(() => props.adminData.claims  || []);
    const searchDiff = ref('');
    const pager = reactive({ page: 1, size: 10 });

    const rows = computed(() => {
      return claims.value.filter(c => {
        if (dateStart.value && c.requestDate.slice(0,10) < dateStart.value) return false;
        if (dateEnd.value   && c.requestDate.slice(0,10) > dateEnd.value)   return false;
        return true;
      }).map(c => {
        const refundAmt  = c.refundAmount || 0;
        const settleAdj  = ['환불완료','취소완료'].includes(c.status) ? -refundAmt : 0;
        const reconAdj   = settleAdj + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 200 : -200) : 0);
        const diff       = settleAdj - Math.round(reconAdj);
        const diffStatus = Math.abs(diff) < 1 ? '일치' : (diff > 0 ? '조정과다' : '조정부족');
        return { claimId: c.claimId, reqDate: c.requestDate.slice(0,10), type: c.type, status: c.status, refundAmt, settleAdj, reconAdj: Math.round(reconAdj), diff: Math.round(diff), diffStatus };
      }).filter(r => !searchDiff.value || r.diffStatus === searchDiff.value);
    });

    const total    = computed(() => rows.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => rows.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const summary  = computed(() => ({
      match: rows.value.filter(r=>r.diffStatus==='일치').length,
      over:  rows.value.filter(r=>r.diffStatus==='조정과다').length,
      under: rows.value.filter(r=>r.diffStatus==='조정부족').length,
    }));

    const diffBadge = s => ({ '일치':'badge-green','조정과다':'badge-red','조정부족':'badge-orange' }[s] || 'badge-gray');
    const typeBadge = t => ({ '취소':'badge-red','반품':'badge-orange','교환':'badge-purple' }[t] || 'badge-gray');
    const statusBadge = s => ['환불완료','취소완료','교환완료'].includes(s) ? 'badge-green' : 'badge-blue';
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchDiff.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const setPage = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { descOpen, DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchDiff, pager, rows, total, totPages, pageList, pageNums, summary, diffBadge, typeBadge, statusBadge, fmtW, onSearch, onReset , PAGE_SIZES , setPage , onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">클레임-정산 대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">클레임(취소·반품·교환) 환불 데이터와 정산 조정액 간 불일치를 검출하고 대사 처리합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 클레임 환불금액(refund_amt) vs 정산 차감 조정액(settle_adj) 차이를 자동 비교합니다.
• 클레임 유형: 취소 / 반품 / 교환
• 차이 발생 건은 조정(StSettleAdjMng) 또는 기타조정(StSettleEtcAdjMng)으로 보정합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchDiff" style="width:120px">
        <option value="">대사결과 전체</option><option>일치</option><option>조정과다</option><option>조정부족</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4"><div style="font-size:11px;color:#888">일치</div><div style="font-size:20px;font-weight:700;color:#27ae60">{{ summary.match }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">조정과다</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ summary.over }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">조정부족</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ summary.under }}건</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>클레임ID</th><th>요청일</th><th>유형</th><th>환불액</th><th>정산조정기준</th><th>실반영액</th><th>차이</th><th>처리상태</th><th>대사결과</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.claimId">
          <td>{{ r.claimId }}</td><td>{{ r.reqDate }}</td>
          <td><span class="badge" :class="typeBadge(r.type)">{{ r.type }}</span></td>
          <td>{{ r.refundAmt > 0 ? fmtW(r.refundAmt) : '-' }}</td>
          <td :style="r.settleAdj<0?'color:#e74c3c':''">{{ r.settleAdj !== 0 ? fmtW(r.settleAdj) : '-' }}</td>
          <td :style="r.reconAdj<0?'color:#e74c3c':''">{{ r.reconAdj !== 0 ? fmtW(r.reconAdj) : '-' }}</td>
          <td :style="Math.abs(r.diff)>0?'color:#e74c3c;font-weight:700':''">{{ r.diff !== 0 ? (r.diff > 0 ? '+' : '') + Number(r.diff).toLocaleString() + '원' : '-' }}</td>
          <td><span class="badge" :class="statusBadge(r.status)">{{ r.status }}</span></td>
          <td><span class="badge" :class="diffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
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
