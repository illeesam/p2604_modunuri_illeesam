/* ShopJoy Admin - ERP 전표대사 */
window.StErpReconMng = {
  name: 'StErpReconMng',
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

    const reconList = reactive([
      { reconId: 'ERECON-001', reconDate: '2026-04-12', slipId: 'ERP-2026-0411-001', slipType: '정산',    sysAmt: 300000, erpAmt: 300000, diff: 0,     diffStatus: '일치',  remark: '' },
      { reconId: 'ERECON-002', reconDate: '2026-04-12', slipId: 'ERP-2026-0411-002', slipType: '정산',    sysAmt: 81000,  erpAmt: 81000,  diff: 0,     diffStatus: '일치',  remark: '' },
      { reconId: 'ERECON-003', reconDate: '2026-04-12', slipId: 'ERP-2026-0411-003', slipType: '정산',    sysAmt: 54000,  erpAmt: 54000,  diff: 0,     diffStatus: '일치',  remark: '' },
      { reconId: 'ERECON-004', reconDate: '2026-04-12', slipId: 'ERP-2026-0410-001', slipType: '수수료',  sysAmt: 38260,  erpAmt: 38260,  diff: 0,     diffStatus: '일치',  remark: '' },
      { reconId: 'ERECON-005', reconDate: '2026-03-11', slipId: 'ERP-2026-0310-001', slipType: '정산',    sysAmt: 280000, erpAmt: 280000, diff: 0,     diffStatus: '일치',  remark: '' },
      { reconId: 'ERECON-006', reconDate: '2026-03-11', slipId: 'ERP-2026-0310-002', slipType: '정산',    sysAmt: 73000,  erpAmt: 72500,  diff: 500,   diffStatus: '차이',  remark: 'ERP 입력 오류 확인 필요' },
      { reconId: 'ERECON-007', reconDate: '2026-03-11', slipId: 'ERP-2026-0310-003', slipType: '반품조정', sysAmt: 22000, erpAmt: 0,      diff: 22000, diffStatus: '미반영', remark: 'ERP 전송 오류로 미반영' },
    ]);

    const searchDiff   = ref('');
    const searchType   = ref('');
    const pager = reactive({ page: 1, size: 10 });

    const filtered = computed(() => {
      return reconList.filter(r => {
        if (dateStart.value && r.reconDate < dateStart.value) return false;
        if (dateEnd.value   && r.reconDate > dateEnd.value)   return false;
        if (searchDiff.value && r.diffStatus !== searchDiff.value) return false;
        if (searchType.value && r.slipType   !== searchType.value) return false;
        return true;
      });
    });
    const total    = computed(() => filtered.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const summary  = computed(() => ({
      match:    filtered.value.filter(r=>r.diffStatus==='일치').length,
      diff:     filtered.value.filter(r=>r.diffStatus==='차이').length,
      noReflect:filtered.value.filter(r=>r.diffStatus==='미반영').length,
      diffAmt:  filtered.value.reduce((s,r)=>s+Math.abs(r.diff),0),
    }));

    const doFix = async (r) => {
      const ok = await props.showConfirm('조정처리', '해당 전표 대사 차이를 조정처리 하시겠습니까?');
      if (!ok) return;
      r.erpAmt = r.sysAmt; r.diff = 0; r.diffStatus = '일치'; r.remark = '조정처리 완료';
      try {
        const res = await window.adminApi.put(`st/erp/recon/${r.reconId}/fix`, {});
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('조정처리 되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const diffBadge = s => ({ '일치':'badge-green', '차이':'badge-orange', '미반영':'badge-red' }[s] || 'badge-gray');
    const typeBadge = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchDiff.value = ''; searchType.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    const setPage = n => { if (n >= 1 && n <= totPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    return { descOpen, DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchDiff, searchType, pager, filtered, total, totPages, pageList, pageNums, summary, doFix, diffBadge, typeBadge, fmtW, onSearch, onReset , PAGE_SIZES , setPage , onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">ERP로 전송된 전표와 ERP 처리 결과를 대사하여 불일치 전표를 수정합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• ShopJoy 전표금액 vs ERP 처리금액 차이를 자동 비교합니다.
• 차이 상태: 일치 / 차이발생 / 오류
• [오류수정] 버튼으로 전표 재생성 또는 ERP 수동 반영을 처리합니다.
• 유형 필터: 정산지급 / 수수료 / 조정 / 기타</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="dateEnd" style="width:140px" />
      <select v-model="searchType" style="width:120px">
        <option value="">유형 전체</option><option>정산</option><option>수수료</option><option>반품조정</option>
      </select>
      <select v-model="searchDiff" style="width:110px">
        <option value="">결과 전체</option><option>일치</option><option>차이</option><option>미반영</option>
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
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">금액 차이</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ summary.diff }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">미반영</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ summary.noReflect }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa"><div style="font-size:11px;color:#888">차이금액 합계</div><div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(summary.diffAmt) }}</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>대사ID</th><th>대사일자</th><th>전표ID</th><th>유형</th><th>시스템금액</th><th>ERP금액</th><th>차이금액</th><th>대사결과</th><th>비고</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.reconId">
          <td>{{ r.reconId }}</td>
          <td>{{ r.reconDate }}</td>
          <td style="font-size:11px">{{ r.slipId }}</td>
          <td><span class="badge" :class="typeBadge(r.slipType)">{{ r.slipType }}</span></td>
          <td style="font-weight:700">{{ fmtW(r.sysAmt) }}</td>
          <td>{{ r.erpAmt > 0 ? fmtW(r.erpAmt) : '-' }}</td>
          <td :style="r.diff>0?'color:#e74c3c;font-weight:700':''">{{ r.diff > 0 ? fmtW(r.diff) : '-' }}</td>
          <td><span class="badge" :class="diffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
          <td style="font-size:11px;color:#888;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.remark }}</td>
          <td class="actions">
            <button v-if="r.diffStatus!=='일치'" class="btn btn-sm btn-primary" @click="doFix(r)">조정</button>
          </td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
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
