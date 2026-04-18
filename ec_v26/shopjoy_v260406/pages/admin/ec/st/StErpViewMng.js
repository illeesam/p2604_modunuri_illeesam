/* ShopJoy Admin - ERP 전표조회 */
window.StErpViewMng = {
  name: 'StErpViewMng',
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

    const slips = reactive([
      { slipId: 'ERP-2026-0411-001', slipDate: '2026-04-11', slipType: '정산', debit: '미지급금',  credit: '현금',      debitAmt: 300000, creditAmt: 300000, description: '2026-03 패션스타일 정산지급',  sendStatus: '전송완료', erpRef: 'ERP-JE-20260411-001' },
      { slipId: 'ERP-2026-0411-002', slipDate: '2026-04-11', slipType: '정산', debit: '미지급금',  credit: '현금',      debitAmt: 81000,  creditAmt: 81000,  description: '2026-03 트렌드웨어 정산지급', sendStatus: '전송완료', erpRef: 'ERP-JE-20260411-002' },
      { slipId: 'ERP-2026-0411-003', slipDate: '2026-04-11', slipType: '정산', debit: '미지급금',  credit: '현금',      debitAmt: 54000,  creditAmt: 54000,  description: '2026-03 에코패션 정산지급',    sendStatus: '전송완료', erpRef: 'ERP-JE-20260411-003' },
      { slipId: 'ERP-2026-0410-001', slipDate: '2026-04-10', slipType: '수수료', debit: '수수료수익', credit: '미수금',   debitAmt: 38260,  creditAmt: 38260,  description: '2026-03 수수료 수입 계상',    sendStatus: '전송완료', erpRef: 'ERP-JE-20260410-001' },
      { slipId: 'ERP-2026-0310-001', slipDate: '2026-03-10', slipType: '정산', debit: '미지급금',  credit: '현금',      debitAmt: 280000, creditAmt: 280000, description: '2026-02 패션스타일 정산지급',  sendStatus: '전송완료', erpRef: 'ERP-JE-20260310-001' },
      { slipId: 'ERP-2026-0310-002', slipDate: '2026-03-10', slipType: '정산', debit: '미지급금',  credit: '현금',      debitAmt: 73000,  creditAmt: 73000,  description: '2026-02 트렌드웨어 정산지급', sendStatus: '전송대기', erpRef: '' },
      { slipId: 'ERP-2026-0310-003', slipDate: '2026-03-10', slipType: '반품조정', debit: '매출환불', credit: '미지급금', debitAmt: 22000,  creditAmt: 22000,  description: '반품 정산 재처리',            sendStatus: '오류',    erpRef: '' },
    ]);

    const searchKw     = ref('');
    const searchType   = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 10 });

    const filtered = computed(() => {
      const kw = searchKw.value.trim().toLowerCase();
      return slips.filter(r => {
        if (dateStart.value && r.slipDate < dateStart.value) return false;
        if (dateEnd.value   && r.slipDate > dateEnd.value)   return false;
        if (searchType.value   && r.slipType    !== searchType.value)   return false;
        if (searchStatus.value && r.sendStatus  !== searchStatus.value) return false;
        if (kw && !r.slipId.toLowerCase().includes(kw) && !r.description.toLowerCase().includes(kw)) return false;
        return true;
      });
    });
    const total    = computed(() => filtered.value.length);
    const totPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => { const c=pager.page,l=totPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const doResend = async (r) => {
      await window.adminApiCall({
        method: 'post', path: `st/erp/resend/${r.slipId}`, data: {},
        confirmTitle: '재전송', confirmMsg: '전표를 ERP로 재전송하시겠습니까?',
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        successMsg: '재전송이 완료되었습니다.',
        onLocal: () => { r.sendStatus = '전송완료'; r.erpRef = 'ERP-JE-RESEND-' + Date.now(); },
      });
    };

    const statusBadge = s => ({ '전송완료':'badge-green', '전송대기':'badge-blue', '오류':'badge-red' }[s] || 'badge-gray');
    const typeBadge   = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchType.value = ''; searchStatus.value = ''; dateRange.value = '이번달'; onDateRangeChange(); pager.page = 1; };

    return { DATE_RANGE_OPTIONS, dateRange, dateStart, dateEnd, onDateRangeChange, searchKw, searchType, searchStatus, pager, filtered, total, totPages, pageList, pageNums, doResend, statusBadge, typeBadge, fmtW, onSearch, onReset };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표조회</div>
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
      <select v-model="searchStatus" style="width:110px">
        <option value="">상태 전체</option><option>전송완료</option><option>전송대기</option><option>오류</option>
      </select>
      <input v-model="searchKw" placeholder="전표ID / 적요 검색" style="width:180px" @keyup.enter="onSearch" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar"><span class="list-count">총 {{ total }}건</span></div>
    <table class="admin-table">
      <thead><tr><th>전표ID</th><th>전표일자</th><th>유형</th><th>차변계정</th><th>대변계정</th><th>금액</th><th>적요</th><th>ERP전표번호</th><th>전송상태</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in pageList" :key="r.slipId">
          <td style="font-size:11px">{{ r.slipId }}</td>
          <td>{{ r.slipDate }}</td>
          <td><span class="badge" :class="typeBadge(r.slipType)">{{ r.slipType }}</span></td>
          <td>{{ r.debit }}</td>
          <td>{{ r.credit }}</td>
          <td style="font-weight:700">{{ fmtW(r.debitAmt) }}</td>
          <td style="font-size:12px;color:#555;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.description }}</td>
          <td style="font-size:11px;color:#888">{{ r.erpRef || '-' }}</td>
          <td><span class="badge" :class="statusBadge(r.sendStatus)">{{ r.sendStatus }}</span></td>
          <td class="actions">
            <button v-if="r.sendStatus!=='전송완료'" class="btn btn-sm btn-blue" @click="doResend(r)">재전송</button>
          </td>
        </tr>
        <tr v-if="!pageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <div class="pagination" v-if="totPages > 1">
      <button class="pager" @click="pager.page=Math.max(1,pager.page-1)" :disabled="pager.page===1">‹</button>
      <button v-for="n in pageNums" :key="n" class="pager" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
      <button class="pager" @click="pager.page=Math.min(totPages,pager.page+1)" :disabled="pager.page===totPages">›</button>
    </div>
  </div>
</div>
`,
};
