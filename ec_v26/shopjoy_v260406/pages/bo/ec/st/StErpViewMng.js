/* ShopJoy Admin - ERP 전표조회 */
window.StErpViewMng = {
  name: 'StErpViewMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      erp_statuses: [],
      erp_voucher_types: [],
      erp_voucher_statuses: [],
      date_range_opts: [],
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.erp_statuses = codeStore.sgGetGrpCodes('ERP_STATUS');
        codes.erp_voucher_types = codeStore.sgGetGrpCodes('ERP_VOUCHER_TYPE_KR');
        codes.erp_voucher_statuses = codeStore.sgGetGrpCodes('ERP_VOUCHER_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


            const dateEnd   = ref('');
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const slips = reactive([]);
    const _initSearchParam = () => ({ searchTypes: '', searchValue: '', type: '', status: '' });
    const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        slips.splice(0, slips.length);
        pager.pageTotalCount = 0;
        pager.pageTotalPage = 1;
        fnBuildPagerNums();
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT'); });

    const doResend = async (r) => {
      const ok = await showConfirm('재전송', '전표를 ERP로 재전송하시겠습니까?');
      if (!ok) return;
      r.sendStatus = '전송완료'; r.erpRef = 'ERP-JE-RESEND-' + Date.now();
      try {
        const res = await boApiSvc.stErp.resend(r.slipId, {}, 'ERP전표조회', '전송');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('재전송이 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const fnStatusBadge = s => ({ '전송완료':'badge-green', '전송대기':'badge-blue', '오류':'badge-red' }[s] || 'badge-gray');
    const fnTypeBadge   = t => ({ '정산':'badge-blue', '수수료':'badge-orange', '반품조정':'badge-red' }[t] || 'badge-gray');
    const fmtW = n => Number(n||0).toLocaleString() + '원';
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // -- return ---------------------------------------------------------------

    return { uiState, handleDateRangeChange, codes, pager, slips, doResend, fnStatusBadge, fnTypeBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
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
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.type" style="width:120px">
        <option value="">유형 전체</option><option v-for="c in codes.erp_voucher_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.status" style="width:110px">
        <option value="">상태 전체</option><option v-for="c in codes.erp_voucher_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <multi-check-select
        v-model="searchParam.searchTypes"
        :options="[
          { value: 'def_slipId', label: '전표ID' },
          { value: 'def_summary', label: '적요' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" style="width:180px" @keyup.enter="() => onSearch?.()" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="toolbar"><span class="list-count">총 {{ pager.pageTotalCount }}건</span></div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>전표ID</th><th>전표일자</th><th>유형</th><th>차변계정</th><th>대변계정</th><th>금액</th><th>적요</th><th>ERP전표번호</th><th>전송상태</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in slips" :key="r?.slipId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
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
        <tr v-if="!slips.length"><td colspan="11" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>
`,
};
