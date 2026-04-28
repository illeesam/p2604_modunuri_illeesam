/* ShopJoy Admin - ERP 전표조회 */
window.StErpViewMng = {
  name: 'StErpViewMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      erp_statuses: [],
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.getBoCodeStore();
      try {
        codes.erp_statuses = codeStore.snGetGrpCodes('ERP_STATUS') || [];
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
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;
            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = window.boCmUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = window.boCmUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const slips = reactive([]);
    const searchParam = reactive({ kw: '', type: '', status: '', dateEnd: '' });
    const searchParamOrg = reactive({ kw: '', type: '', status: '' });
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const cfPageNums = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await window.boApi.get('/bo/ec/st/erp/slip/page', {
          params: {
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          },
          ...apiHdr('정산ERP조회관리', '목록조회')
        });
        const data = res.data?.data;
        slips.splice(0, slips.length, ...(data?.list || slips));
        pager.pageTotalCount = data?.pageTotalCount || slips.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); Object.assign(searchParamOrg, searchParam); });

    const doResend = async (r) => {
      const ok = await props.showConfirm('재전송', '전표를 ERP로 재전송하시겠습니까?');
      if (!ok) return;
      r.sendStatus = '전송완료'; r.erpRef = 'ERP-JE-RESEND-' + Date.now();
      try {
        const res = await window.boApi.post(`/bo/ec/st/erp/resend/${r.slipId}`, {}, { headers: { 'X-UI-Nm': 'ERP전표조회', 'X-Cmd-Nm': '전송' } });
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('재전송이 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const fnStatusBadge = s => ({ '전송완료':'badge-green', '전송대기':'badge-blue', '오류':'badge-red' }[s] || 'badge-gray');
    const fnTypeBadge   = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // ── return ───────────────────────────────────────────────────────────────

    return { uiState, handleDateRangeChange, DATE_RANGE_OPTIONS, pager, slips, cfPageNums, doResend, fnStatusBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표조회</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">생성된 ERP 전표 목록을 조회하고 전송 상태 및 처리 이력을 확인합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 전표 유형: 정산지급 / 수수료 / 조정 / 기타
• 전송 상태: 미전송 / 전송완료 / 오류
• [재전송] 버튼으로 오류 건을 ERP에 재전송할 수 있습니다.
• 전표 대사 확인은 ERP 전표대사(StErpReconMng)에서 합니다.</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt?.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.type" style="width:120px">
        <option value="">유형 전체</option><option>정산</option><option>수수료</option><option>반품조정</option>
      </select>
      <select v-model="searchParam.status" style="width:110px">
        <option value="">상태 전체</option><option>전송완료</option><option>전송대기</option><option>오류</option>
      </select>
      <input v-model="searchParam.kw" placeholder="전표ID / 적요 검색" style="width:180px" @keyup.enter="() => onSearch?.()" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar"><span class="list-count">총 {{ pager.pageTotalCount }}건</span></div>
    <table class="bo-table">
      <thead><tr><th>전표ID</th><th>전표일자</th><th>유형</th><th>차변계정</th><th>대변계정</th><th>금액</th><th>적요</th><th>ERP전표번호</th><th>전송상태</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="r in slips" :key="r?.slipId">
          <td style="font-size:11px">{{ r.slipId }}</td>
          <td>{{ r.slipDate }}</td>
          <td><span class="badge" :class="fnTypeBadge(r.slipType)">{{ r.slipType }}</span></td>
          <td>{{ r.debit }}</td>
          <td>{{ r.credit }}</td>
          <td style="font-weight:700">{{ fmtW(r.debitAmt) }}</td>
          <td style="font-size:12px;color:#555;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.description }}</td>
          <td style="font-size:11px;color:#888">{{ r.erpRef || '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.sendStatus)">{{ r.sendStatus }}</span></td>
          <td class="actions">
            <button v-if="r.sendStatus!=='전송완료'" class="btn btn-sm btn-blue" @click="doResend(r)">재전송</button>
          </td>
        </tr>
        <tr v-if="!slips.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
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
