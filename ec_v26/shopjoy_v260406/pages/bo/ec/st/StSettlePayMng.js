/* ShopJoy Admin - 정산지급관리 */
window.StSettlePayMng = {
  name: 'StSettlePayMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, dateRange: '이번달', dateStart: '', dateEnd: ''});
    const codes = reactive({
      settle_pay_statuses: [],
      date_range_opts: [],
    });

    /* 정산 지급 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.settle_pay_statuses = codeStore.sgGetGrpCodes('SETTLE_PAY_STATUS_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    /* 정산 지급 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'payId,vendorNm';
        }
        const res = await boApiSvc.stSettlePay.getPage(params, '정산지급관리', '목록조회');
        const data = res.data?.data;
        payList.splice(0, payList.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || payList.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (_) {
        console.error('[catch-info]', _);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

            const dateEnd   = ref('');

    /* 정산 지급 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    const payList = reactive([]);

  /* 정산 지급 _initSearchParam */
  const _initSearchParam = () => ({ searchType: '', searchValue: '', status: '' });
  const searchParam = reactive(_initSearchParam());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 정산 지급 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const cfSummary = computed(() => ({
      total:   payList.reduce((s, r) => s + r.settleAmt, 0),
      paid:    payList.filter(r => r.payStatus === '지급완료').reduce((s, r) => s + r.payAmt, 0),
      pending: payList.filter(r => r.payStatus === '지급대기').reduce((s, r) => s + r.settleAmt, 0),
    }));

    /* 정산 지급 doPay */
    const doPay = async (r) => {
      const ok = await showConfirm('지급처리', `[${r.vendorNm}]에게 ${Number(r.settleAmt).toLocaleString()}원을 지급하시겠습니까?`);
      if (!ok) return;
      r.payStatus = '지급완료'; r.payAmt = r.settleAmt; r.payDate = new Date().toISOString().slice(0,10);
      try {
        const res = await boApiSvc.stSettlePay.pay(r.settlePayId || r.payId, { payAmt: r.payAmt ?? r.settleAmt }, '정산지급관리', '저장');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('지급처리가 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 정산 지급 fnStatusBadge */
    const fnStatusBadge = s => ({ '지급완료':'badge-green', '지급대기':'badge-blue', '지급보류':'badge-orange', '지급오류':'badge-red' }[s] || 'badge-gray');

    /* 정산 지급 fmtW */
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

    /* 정산 지급 목록조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 정산 지급 onReset */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    /* 정산 지급 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* 정산 지급 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    // -- return ---------------------------------------------------------------

    return { uiState, codes, handleDateRangeChange, pager, payList, cfSummary, doPay, fnStatusBadge, fmtW, onSearch, onReset, searchParam, setPage, onSizeChange };
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
        <option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" /><span style="line-height:32px">~</span><input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="searchParam.status" style="width:120px">
        <option value="">상태 전체</option><option v-for="c in codes.settle_pay_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'payId',    label: '지급ID' },
          { value: 'vendorNm', label: '업체명' },
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
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>
`,
};
