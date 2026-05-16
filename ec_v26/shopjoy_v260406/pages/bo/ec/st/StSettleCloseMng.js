/* ShopJoy Admin - 정산마감 */
window.StSettleCloseMng = {
  name: 'StSettleCloseMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false });
    const codes = reactive({
      settle_statuses: [],
      settle_close_statuses: [],
    });


    /* 정산 마감 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.settle_statuses = codeStore.sgGetGrpCodes('SETTLE_STATUS');
        codes.settle_close_statuses = codeStore.sgGetGrpCodes('SETTLE_CLOSE_STATUS_KR');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);



    const orders  = reactive([]);
    const claims  = reactive([]);
    const vendorList = reactive([]);

    /* 정산 마감 목록조회 */
    const handleSearchData = async () => {
      try {
        const [resO, resC, resV, resCL] = await Promise.all([
          boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산마감관리', '목록조회'),
          boApiSvc.stSettleClose.getPage({
            searchValue: searchValue.value, status: searchStatus.value, pageNo: 1, pageSize: 100
          }, '정산마감관리', '이력조회'),
        ]);
        orders.splice(0, orders.length, ...(resO.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resC.data?.data?.list || []));
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.list || []));
        closeList.splice(0, closeList.length, ...(resCL.data?.data?.list || []));
      } catch (_) { console.error('[catch-info]', _); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT'); });
    const cfVendors = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

    const searchType = ref('');
    const searchValue = ref('');
    const searchStatus = ref('');

    /* 정산 마감 목록조회 */
    const onSearch = async () => {
      await handleSearchData('DEFAULT');
    };

    /* 정산 마감 onReset */
    const onReset = () => {
      searchType.value = '';
      searchValue.value = '';
      searchStatus.value = '';
      onSearch();
    };

    const closeList = reactive([]);

    // 이번달 집계
    const thisMonth = new Date().toISOString().slice(0, 7);
    const cfThisMonthOrders = computed(() => window.safeArrayUtils.safeFilter(orders, o => o.orderDate.startsWith(thisMonth) && o.status !== '취소됨'));
    const cfThisMonthSales  = computed(() => cfThisMonthOrders.value.reduce((s, o) => s + o.totalPrice, 0));
    const cfThisMonthRefund = computed(() => window.safeArrayUtils.safeFilter(claims, c => c.requestDate.startsWith(thisMonth) && ['환불완료','취소완료'].includes(c.status)).reduce((s, c) => s + c.refundAmount, 0));
    const cfThisMonthNet    = computed(() => cfThisMonthSales.value - cfThisMonthRefund.value);
    const cfThisMonthComm   = computed(() => Math.round(cfThisMonthNet.value * 0.10));
    const cfThisMonthPromo  = computed(() => Math.round(cfThisMonthNet.value * 0.03));
    const cfThisMonthSettle = computed(() => cfThisMonthNet.value - cfThisMonthComm.value - cfThisMonthPromo.value);

    const cfAlreadyClosed = computed(() => window.safeArrayUtils.safeSome(closeList, c => c.closeMon === thisMonth));

    /* 정산 마감 doClose */
    const doClose = async () => {
      if (cfAlreadyClosed.value) { showToast('이미 마감된 월입니다.', 'error'); return; }
      const ok = await showConfirm('정산마감', `${thisMonth} 정산을 마감하시겠습니까?\n마감 후에는 수정이 제한됩니다.`);
      if (!ok) return;
      closeList.unshift({
        closeId: 'CLS-' + thisMonth, closeMon: thisMonth,
        sales: cfThisMonthSales.value, refund: cfThisMonthRefund.value, net: cfThisMonthNet.value,
        comm: cfThisMonthComm.value, promo: cfThisMonthPromo.value, settle: cfThisMonthSettle.value,
        status: '마감완료', closeDate: new Date().toISOString().slice(0,10), regUserNm: '관리자',
      });
      try {
        const res = await boApiSvc.stSettleClose.create({ closeMon: thisMonth, sales: cfThisMonthSales.value, refund: cfThisMonthRefund.value, net: cfThisMonthNet.value, comm: cfThisMonthComm.value, promo: cfThisMonthPromo.value, settle: cfThisMonthSettle.value }, '정산마감관리', '저장');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('정산마감이 완료되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 정산 마감 doReopen */
    const doReopen = async (r) => {
      const ok = await showConfirm('마감취소', `${r.closeMon} 정산마감을 취소하시겠습니까?`);
      if (!ok) return;
      r.status = '마감취소';
      try {
        const res = await boApiSvc.stSettleClose.reopen(r.closeId, {}, '정산마감관리', '상태변경');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('마감이 취소되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 정산 마감 fnStatusBadge */
    const fnStatusBadge = s => ({ '마감완료':'badge-green', '마감예정':'badge-blue', '마감취소':'badge-red' }[s] || 'badge-gray');

    /* 정산 마감 fmtW */
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

    const cfFilteredClose = computed(() => closeList.filter(r => {
      if (searchValue.value) {
        const types = searchType.value || 'def_closeMon,def_regUserNm';
        const hits = [];
        if (types.includes('def_closeMon')) hits.push(r.closeMon && r.closeMon.includes(searchValue.value));
        if (types.includes('def_regUserNm')) hits.push(r.regUserNm && r.regUserNm.includes(searchValue.value));
        if (!hits.some(Boolean)) return false;
      }
      if (searchStatus.value && r.status !== searchStatus.value) return false;
      return true;
    }));

    // -- return ---------------------------------------------------------------

    return { uiState, closeList, cfFilteredClose, searchType, searchValue, searchStatus, onSearch, onReset, thisMonth, cfThisMonthSales, cfThisMonthRefund, cfThisMonthNet, cfThisMonthComm, cfThisMonthPromo, cfThisMonthSettle, cfAlreadyClosed, doClose, doReopen, fnStatusBadge, fmtW, codes };
  },
  template: /* html */`
<div>
  <div class="page-title">정산마감</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">월별 업체 정산을 확정하는 마감 처리를 수행합니다. 마감 후 원장·조정 데이터 수정이 불가합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 마감 처리 시 해당 월의 수집원장 + 조정 + 기타조정 금액을 최종 집계합니다.
• 마감 상태: 미마감 / 마감완료 / 지급완료
• [재오픈] 기능으로 마감을 취소하고 수정 후 재마감할 수 있습니다.
• 자동마감 설정(StConfigMng) 시 지급일에 자동 마감됩니다.</div>
  </div>

  <!-- -- 이번달 마감 대상 ------------------------------------------------------ -->
  <div class="card">
    <div style="font-weight:700;font-size:15px;margin-bottom:12px">{{ thisMonth }} 정산마감 대상</div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:10px;background:#f0f4ff">
        <div style="font-size:11px;color:#888">매출액</div>
        <div style="font-size:16px;font-weight:700;color:#3498db">{{ fmtW(cfThisMonthSales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fff8f8">
        <div style="font-size:11px;color:#888">환불액</div>
        <div style="font-size:16px;font-weight:700;color:#e74c3c">{{ fmtW(cfThisMonthRefund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#f8f9fa">
        <div style="font-size:11px;color:#888">순매출</div>
        <div style="font-size:16px;font-weight:700;color:#333">{{ fmtW(cfThisMonthNet) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fffbf0">
        <div style="font-size:11px;color:#888">수수료(10%)</div>
        <div style="font-size:16px;font-weight:700;color:#e67e22">{{ fmtW(cfThisMonthComm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#fdf5ff">
        <div style="font-size:11px;color:#888">프로모션(3%)</div>
        <div style="font-size:16px;font-weight:700;color:#9b59b6">{{ fmtW(cfThisMonthPromo) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:10px;background:#f0fff4">
        <div style="font-size:11px;color:#888">정산예정액</div>
        <div style="font-size:16px;font-weight:700;color:#27ae60">{{ fmtW(cfThisMonthSettle) }}</div>
      </div>
    </div>
    <div style="text-align:right">
      <button v-if="!cfAlreadyClosed" class="btn btn-primary" @click="doClose">📋 {{ thisMonth }} 정산마감 실행</button>
      <span v-else class="badge badge-green" style="font-size:13px;padding:8px 16px">✓ 마감완료</span>
    </div>
  </div>

  <!-- -- 마감 이력 ---------------------------------------------------------- -->
  <div class="card" style="margin-top:12px">
    <div class="search-bar" style="margin-bottom:12px">
      <bo-multi-check-select
        v-model="searchType"
        :options="[
          { value: 'def_closeMon',  label: '정산월' },
          { value: 'def_regUserNm', label: '담당자' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchValue" placeholder="검색어 입력" style="width:180px" @keyup.enter="onSearch" />
      <select v-model="searchStatus" style="width:130px">
        <option value="">상태 전체</option>
        <option v-for="c in codes.settle_close_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
    <div class="toolbar"><span class="list-title">정산마감 이력</span><span class="list-count">총 {{ cfFilteredClose.length }}건</span></div>
    <table class="bo-table">
      <thead><tr><th style="width:36px;text-align:center;">번호</th><th>정산월</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료</th><th>프로모션비</th><th>정산액</th><th>마감일</th><th>상태</th><th>담당자</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="(r, idx) in cfFilteredClose" :key="r?.closeId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td><strong>{{ r.closeMon }}</strong></td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ fmtW(r.refund) }}</td>
          <td>{{ fmtW(r.net) }}</td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#9b59b6">{{ fmtW(r.promo) }}</td>
          <td style="color:#27ae60;font-weight:700">{{ fmtW(r.settle) }}</td>
          <td>{{ r.closeDate }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.status)">{{ r.status }}</span></td>
          <td>{{ r.regUserNm }}</td>
          <td class="actions">
            <button v-if="r.status==='마감완료'" class="btn btn-sm btn-secondary" @click="doReopen(r)">마감취소</button>
          </td>
        </tr>
        <tr v-if="!closeList.length"><td colspan="12" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
  </div>
</div>
`,
};
