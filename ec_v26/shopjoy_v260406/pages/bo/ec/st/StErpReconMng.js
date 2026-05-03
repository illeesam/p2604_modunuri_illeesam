/* ShopJoy Admin - ERP 전표대사 */
window.StErpReconMng = {
  name: 'StErpReconMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      erp_recon_statuses: [],
      erp_voucher_types: [],
      erp_recon_results: [],
      date_range_opts: [],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.erp_recon_statuses = codeStore.sgGetGrpCodes('ERP_RECON_STATUS');
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        codes.erp_recon_results = codeStore.sgGetGrpCodes('ERP_RECON_RESULT');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);


            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const reconList = reactive([]);
    const _initSearchParam = () => ({ diff: '', type: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const cfSummary = computed(() => ({
      match:     reconList.filter(r=>r.diffStatus==='일치').length,
      diff:      reconList.filter(r=>r.diffStatus==='차이').length,
      noReflect: reconList.filter(r=>r.diffStatus==='미반영').length,
      diffAmt:   reconList.reduce((s,r)=>s+Math.abs(r.diff||0),0),
    }));

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await boApiSvc.stErp.getReconPage({
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          dateStart: uiState.dateStart, dateEnd: uiState.dateEnd,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        }, 'ERP전표대사', '목록조회');
        const data = res.data?.data;
        reconList.splice(0, reconList.length, ...(data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || {});
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    const doFix = async (r) => {
      const ok = await props.showConfirm('조정처리', '해당 전표 대사 차이를 조정처리 하시겠습니까?');
      if (!ok) return;
      r.erpAmt = r.sysAmt; r.diff = 0; r.diffStatus = '일치'; r.remark = '조정처리 완료';
      try {
        const res = await boApiSvc.stErp.fixRecon(r.reconId, {}, 'ERP대사관리', '저장');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('조정처리 되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const fnDiffBadge = s => ({ '일치':'badge-green', '차이':'badge-orange', '미반영':'badge-red' }[s] || 'badge-gray');
    const fnTypeBadge = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // -- return ---------------------------------------------------------------

    return { uiState, handleDateRangeChange, codes, pager, reconList, cfSummary, doFix, fnDiffBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
  },
  template: /* html */`
<div>
  <div class="page-title">ERP 전표대사</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">ERP로 전송된 전표와 ERP 처리 결과를 대사하여 불일치 전표를 수정합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• ShopJoy 전표금액 vs ERP 처리금액 차이를 자동 비교합니다.
• 차이 상태: 일치 / 차이발생 / 오류
• [오류수정] 버튼으로 전표 재생성 또는 ERP 수동 반영을 처리합니다.
• 유형 필터: 정산지급 / 수수료 / 조정 / 기타</div>
  </div>
  <div class="card">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="handleDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.type" style="width:120px">
        <option value="">유형 전체</option><option v-for="c in codes.erp_voucher_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.diff" style="width:110px">
        <option value="">결과 전체</option><option v-for="c in codes.erp_recon_results" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0"><div style="font-size:11px;color:#888">금액 차이</div><div style="font-size:20px;font-weight:700;color:#e67e22">{{ cfSummary.diff }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8"><div style="font-size:11px;color:#888">미반영</div><div style="font-size:20px;font-weight:700;color:#e74c3c">{{ cfSummary.noReflect }}건</div></div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa"><div style="font-size:11px;color:#888">차이금액 합계</div><div style="font-size:20px;font-weight:700;color:#333">{{ fmtW(cfSummary.diffAmt) }}</div></div>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ pager.pageTotalCount }}건</span></div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>대사ID</th><th>대사일자</th><th>전표ID</th><th>유형</th><th>시스템금액</th><th>ERP금액</th><th>차이금액</th><th>대사결과</th><th>비고</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in reconList" :key="r?.reconId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>{{ r.reconId }}</td>
          <td>{{ r.reconDate }}</td>
          <td style="font-size:11px">{{ r.slipId }}</td>
          <td><span class="badge" :class="fnTypeBadge(r.slipType)">{{ r.slipType }}</span></td>
          <td style="font-weight:700">{{ fmtW(r.sysAmt) }}</td>
          <td>{{ r.erpAmt > 0 ? fmtW(r.erpAmt) : '-' }}</td>
          <td :style="r.diff>0?'color:#e74c3c;font-weight:700':''">{{ r.diff > 0 ? fmtW(r.diff) : '-' }}</td>
          <td><span class="badge" :class="fnDiffBadge(r.diffStatus)">{{ r.diffStatus }}</span></td>
          <td style="font-size:11px;color:#888;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.remark }}</td>
          <td class="actions">
            <button v-if="r.diffStatus!=='일치'" class="btn btn-sm btn-primary" @click="doFix(r)">조정</button>
          </td>
        </tr>
        <tr v-if="!reconList.length"><td colspan="11" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>
`,
};
