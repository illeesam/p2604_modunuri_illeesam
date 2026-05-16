/* ShopJoy Admin - 정산현황 (업체별/주문별/클레임별/프로모션별/정산별) */
window.StStatusMng = {
  name: 'StStatusMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, activeTab: 'vendor', dateRange: '이번달', dateStart: '', dateEnd: '', vendorSearchValue: '', orderSearchValue: '', orderSearchStatus: '', claimSearchType: '', claimSearchStatus: '', promoSearchValue: '', promoSearchType: '', settleSearchMonth: ''});;
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const codes = reactive({ st_order_statuses: [], claim_types_kr: [], claim_statuses_kr: [], promo_types_kr: [], date_range_opts: [] });


    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.st_order_statuses = codeStore.sgGetGrpCodes('ST_STATUS_ORDER');
        codes.claim_types_kr = codeStore.sgGetGrpCodes('CLAIM_TYPE_KR');
        codes.claim_statuses_kr = codeStore.sgGetGrpCodes('CLAIM_STATUS_KR');
        codes.promo_types_kr = codeStore.sgGetGrpCodes('PROMO_TYPE_KR');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    // -- watch ----------------------------------------------------------------

    /* -- 탭 -- */
        const TABS = [
      { id: 'vendor',    label: '업체별현황' },
      { id: 'order',     label: '주문별현황' },
      { id: 'claim',     label: '클레임별현황' },
      { id: 'promo',     label: '프로모션별현황' },
      { id: 'settle',    label: '정산별현황' },
    ];

    /* -- 공통 날짜 필터 -- */
            const dateEnd   = ref('');

    /* onDateRangeChange */
    const onDateRangeChange = () => {
      if (uiState.dateRange) {
        const r = boUtil.getDateRange(uiState.dateRange);
        uiState.dateStart = r ? r.from : '';
        uiState.dateEnd   = r ? r.to   : '';
      }
    };
    /* 초기 날짜 설정 */
    (() => { const r = boUtil.getDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    /* -- 원본 데이터 -- */
    const orderList = reactive([]);
    const claimList = reactive([]);
    const vendorList = reactive([]);
    const couponList = reactive([]);
    const cacheDataList = reactive([]);

    /* 목록조회 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        const [resO, resC, resV, resCp, resCa] = await Promise.all([
          boApiSvc.odOrder.getPage({ pageNo: 1, pageSize: 10000 }, '정산상태관리', '목록조회'),
          boApiSvc.odClaim.getPage({ pageNo: 1, pageSize: 10000 }, '정산상태관리', '목록조회'),
          boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '정산상태관리', '목록조회'),
          boApiSvc.pmCoupon.getPage({ pageNo: 1, pageSize: 10000 }, '정산상태관리', '목록조회'),
          boApiSvc.pmCache.getPage({ pageNo: 1, pageSize: 10000 }, '정산상태관리', '목록조회'),
        ]);
        orderList.splice(0, orderList.length, ...(resO.data?.data?.list || []));
        claimList.splice(0, claimList.length, ...(resC.data?.data?.list || []));
        vendorList.splice(0, vendorList.length, ...(resV.data?.data?.list || []));
        couponList.splice(0, couponList.length, ...(resCp.data?.data?.list || []));
        cacheDataList.splice(0, cacheDataList.length, ...(resCa.data?.data?.list || []));
      } catch (_) {}
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT'); });
    const cfVendors  = computed(() => vendorList.filter(v => v.vendorType === '판매업체'));

    const COMM_RATE = 0.10; // 수수료율 10%

    /* inRange */
    const inRange = (dateStr) => {
      const d = String(dateStr || '').slice(0, 10);
      if (uiState.dateStart && d < uiState.dateStart) return false;
      if (uiState.dateEnd   && d > uiState.dateEnd)   return false;
      return true;
    };

    /* ════════════════════════════════════════════════
     * 1. 업체별현황
     * ════════════════════════════════════════════════ */
    const vendorSearchValue  = ref('');
    const vendorPager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfVendorRows = computed(() => {
      const filteredOrders = window.safeArrayUtils.safeFilter(orderList, o => inRange(o.orderDate) && o.status !== '취소됨');
      return cfVendors.value.map(v => {
        const vOrders = window.safeArrayUtils.safeFilter(filteredOrders, o => o.vendorId === v.vendorId);
        const sales   = vOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const refund  = claimList
          .filter(c => inRange(c.requestDate) && ['환불완료','취소완료'].includes(c.status))
          .filter(c => { const o = orderList.find(x => x.orderId === c.orderId); return o && o.vendorId === v.vendorId; })
          .reduce((s, c) => s + (c.refundAmount || 0), 0);
        const netSales = sales - refund;
        const comm     = Math.round(netSales * COMM_RATE);

    // -- return ---------------------------------------------------------------

        return { vendorId: v.vendorId, vendorNm: v.vendorNm, orderCnt: vOrders.length, sales, refund, netSales, comm, settle: netSales - comm };
      }).filter(r => !uiState.vendorSearchValue || r.vendorNm.includes(uiState.vendorSearchValue));
    });
    const cfVendorTotal = computed(() => cfVendorRows.value.length);
    const cfVendorPages = computed(() => Math.max(1, Math.ceil(cfVendorTotal.value / vendorPager.size)));
    const cfVendorPageList = computed(() => cfVendorRows.value.slice((vendorPager.page - 1) * vendorPager.size, vendorPager.page * vendorPager.size));
    const cfVendorSummary  = computed(() => cfVendorRows.value.reduce((a, r) => ({ sales: a.sales + r.sales, refund: a.refund + r.refund, comm: a.comm + r.comm, settle: a.settle + r.settle }), { sales: 0, refund: 0, comm: 0, settle: 0 }));

    /* ════════════════════════════════════════════════
     * 2. 주문별현황
     * ════════════════════════════════════════════════ */
    const orderSearchValue  = ref('');
        const orderPager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfOrderRows = computed(() => {
      const searchVal = uiState.orderSearchValue.trim().toLowerCase();
      return window.safeArrayUtils.safeFilter(orderList, o => {
        if (!inRange(o.orderDate)) return false;
        if (uiState.orderSearchStatus && o.status !== uiState.orderSearchStatus) return false;
        if (searchVal && !o.orderId.toLowerCase().includes(searchVal) && !o.userNm.toLowerCase().includes(searchVal) && !o.prodNm.toLowerCase().includes(searchVal)) return false;
        return true;
      }).map(o => {
        const vendor = cfVendors.value.find(v => v.vendorId === o.vendorId);
        const isCancelled = o.status === '취소됨';
        const comm   = isCancelled ? 0 : Math.round((o.totalPrice || 0) * COMM_RATE);
        const settle = isCancelled ? 0 : (o.totalPrice || 0) - comm;

    // -- return ---------------------------------------------------------------

        return { ...o, vendorNm: vendor ? vendor.vendorNm : '-', comm, settle, isCancelled };
      });
    });
    const cfOrderTotal = computed(() => cfOrderRows.value.length);
    const cfOrderPages = computed(() => Math.max(1, Math.ceil(cfOrderTotal.value / orderPager.size)));
    const cfOrderPageList = computed(() => cfOrderRows.value.slice((orderPager.page - 1) * orderPager.size, orderPager.page * orderPager.size));
    const cfOrderSummary  = computed(() => {
      const valid = window.safeArrayUtils.safeFilter(cfOrderRows.value, r => !r.isCancelled);

    // -- return ---------------------------------------------------------------

      return { cnt: valid.length, sales: valid.reduce((s, r) => s + r.totalPrice, 0), comm: valid.reduce((s, r) => s + r.comm, 0), settle: valid.reduce((s, r) => s + r.settle, 0) };
    });

    /* ════════════════════════════════════════════════
     * 3. 클레임별현황
     * ════════════════════════════════════════════════ */
    const claimSearchType   = ref('');
        const claimPager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfClaimRows = computed(() => {
      return window.safeArrayUtils.safeFilter(claimList, c => {
        if (!inRange(c.requestDate)) return false;
        if (uiState.claimSearchType   && c.type   !== uiState.claimSearchType)   return false;
        if (uiState.claimSearchStatus && c.status !== uiState.claimSearchStatus) return false;
        return true;
      }).map(c => {
        const isCompleted = ['환불완료','취소완료','교환완료'].includes(c.status);
        const settleImpact = ['환불완료','취소완료'].includes(c.status) ? -(c.refundAmount || 0) : 0;

    // -- return ---------------------------------------------------------------

        return { ...c, isCompleted, settleImpact };
      });
    });
    const cfClaimTotal = computed(() => cfClaimRows.value.length);
    const cfClaimPages = computed(() => Math.max(1, Math.ceil(cfClaimTotal.value / claimPager.size)));
    const cfClaimPageList = computed(() => cfClaimRows.value.slice((claimPager.page - 1) * claimPager.size, claimPager.page * claimPager.size));
    const cfClaimSummary  = computed(() => ({
      cnt:     cfClaimRows.value.length,
      refund:  cfClaimRows.value.reduce((s, r) => s + (r.refundAmount || 0), 0),
      impact:  cfClaimRows.value.reduce((s, r) => s + r.settleImpact, 0),
      cancel:  cfClaimRows.value.filter(r => r.type === '취소').length,
      return_: cfClaimRows.value.filter(r => r.type === '반품').length,
      exchange:cfClaimRows.value.filter(r => r.type === '교환').length,
    }));

    /* ════════════════════════════════════════════════
     * 4. 프로모션별현황
     * ════════════════════════════════════════════════ */
    const promoSearchValue   = ref('');
        const promoPager      = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfPromoRows = computed(() => {
      const searchVal = uiState.promoSearchValue.trim().toLowerCase();
      const couponRows = couponList.map(c => {
        const discountAmt = c.discountType === 'amount' ? c.discountValue * c.useCount
          : c.discountType === 'rate' ? Math.round(50000 * (c.discountValue / 100) * c.useCount) // 평균 주문금액 가정
          : 3000 * c.useCount;

    // -- return ---------------------------------------------------------------

        return {
          promoId: 'CPN-' + c.couponId, promoType: '쿠폰', promoNm: c.name,
          issueCnt: c.issueCount, useCnt: c.useCount,
          discountAmt, status: c.status,
          period: `~${c.expiry}`,
        };
      });
      const cacheRows = [
        { promoId: 'CCH-001', promoType: '캐쉬', promoNm: '캐쉬 사용 합산', issueCnt: cacheDataList.filter(x => x.type==='충전').length, useCnt: cacheDataList.filter(x => x.type==='사용').length, discountAmt: cacheDataList.filter(x => x.type==='사용').reduce((s,x) => s + Math.abs(x.amount), 0), status: '진행중', period: '상시' },
      ];
      const allRows = [...couponRows, ...cacheRows];
      return allRows.filter(r => {
        if (uiState.promoSearchType && r.promoType !== uiState.promoSearchType) return false;
        if (searchVal && !r.promoNm.toLowerCase().includes(searchVal) && !r.promoType.toLowerCase().includes(searchVal)) return false;
        return true;
      });
    });
    const cfPromoTotal    = computed(() => cfPromoRows.value.length);
    const cfPromoPages    = computed(() => Math.max(1, Math.ceil(cfPromoTotal.value / promoPager.size)));
    const cfPromoPageList = computed(() => cfPromoRows.value.slice((promoPager.page - 1) * promoPager.size, promoPager.page * promoPager.size));
    const cfPromoSummary  = computed(() => ({
      cnt:      cfPromoRows.value.length,
      totalUse: cfPromoRows.value.reduce((s, r) => s + r.useCnt, 0),
      totalDiscount: cfPromoRows.value.reduce((s, r) => s + r.discountAmt, 0),
    }));

    /* ════════════════════════════════════════════════
     * 5. 정산별현황 (월별 요약)
     * ════════════════════════════════════════════════ */
        const settlePager       = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfSettleRows = computed(() => {
      const monthMap = {};
      window.safeArrayUtils.safeForEach(orderList, o => {
        const m = String(o.orderDate || '').slice(0, 7);
        if (!m) return;
        if (!monthMap[m]) monthMap[m] = { month: m, orderCnt: 0, sales: 0, refund: 0, commAmt: 0, promoAmt: 0 };
        if (o.status !== '취소됨') { monthMap[m].orderCnt++; monthMap[m].sales += o.totalPrice || 0; }
      });
      window.safeArrayUtils.safeForEach(claimList, c => {
        const m = String(c.requestDate || '').slice(0, 7);
        if (m && monthMap[m] && ['환불완료','취소완료'].includes(c.status)) monthMap[m].refund += c.refundAmount || 0;
      });
      return Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month)).map(r => {
        const net  = r.sales - r.refund;
        const comm = Math.round(net * COMM_RATE);
        const promo = Math.round(net * 0.03); // 프로모션 비용 가정 3%
        const settle = net - comm - promo;

    // -- return ---------------------------------------------------------------

        return { ...r, net, comm, promo, settle, statusCd: settle > 0 ? '정산예정' : '마감' };
      }).filter(r => !uiState.settleSearchMonth || r.month.includes(uiState.settleSearchMonth));
    });
    const cfSettleTotal    = computed(() => cfSettleRows.value.length);
    const cfSettlePages    = computed(() => Math.max(1, Math.ceil(cfSettleTotal.value / settlePager.size)));
    const cfSettlePageList = computed(() => cfSettleRows.value.slice((settlePager.page - 1) * settlePager.size, settlePager.page * settlePager.size));
    const cfSettleSummary  = computed(() => cfSettleRows.value.reduce((a, r) => ({ sales: a.sales + r.sales, refund: a.refund + r.refund, comm: a.comm + r.comm, settle: a.settle + r.settle }), { sales: 0, refund: 0, comm: 0, settle: 0 }));

    /* -- 공통 유틸 -- */
    const fmt  = n => Number(n || 0).toLocaleString();

    /* fmtW */
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

    /* fnStatusBadge */
    const fnStatusBadge = s => ({
      '완료':'badge-green', '정산예정':'badge-blue', '마감':'badge-gray',
      '취소완료':'badge-red', '환불완료':'badge-red', '교환완료':'badge-purple',
      '활성':'badge-green', '만료':'badge-gray', '진행중':'badge-blue',
    }[s] || 'badge-gray');

    /* fnTypeBadge */
    const fnTypeBadge = t => ({ '취소':'badge-red', '반품':'badge-orange', '교환':'badge-purple' }[t] || 'badge-gray');

    /* 목록조회 */
    const onSearch = async () => {
      vendorPager.page = 1; orderPager.page = 1; claimPager.page = 1; promoPager.page = 1; settlePager.page = 1;
      await handleSearchData('DEFAULT');
    };

    /* onReset */
    const onReset  = () => {
      uiState.vendorSearchValue = ''; uiState.orderSearchValue = ''; uiState.orderSearchStatus = '';
      uiState.claimSearchType = ''; uiState.claimSearchStatus = ''; uiState.promoSearchValue = ''; uiState.promoSearchType = ''; uiState.settleSearchMonth = '';
      onSearch();
    };

    /* pageNums */
    const pageNums = (cur, last) => { const s = Math.max(1, cur-2), e = Math.min(last, s+4); return Array.from({length: e-s+1}, (_,i) => s+i); };

    /* setVendorPage */
    const setVendorPage = n => { if (n >= 1 && n <= cfVendorPages.value) vendorPager.page = n; };

    /* onVendorSizeChange */
    const onVendorSizeChange = () => { vendorPager.page = 1; };

    /* setOrderPage */
    const setOrderPage = n => { if (n >= 1 && n <= cfOrderPages.value) orderPager.page = n; };

    /* onOrderSizeChange */
    const onOrderSizeChange = () => { orderPager.page = 1; };

    /* setClaimPage */
    const setClaimPage = n => { if (n >= 1 && n <= cfClaimPages.value) claimPager.page = n; };

    /* onClaimSizeChange */
    const onClaimSizeChange = () => { claimPager.page = 1; };

    /* setPromoPage */
    const setPromoPage = n => { if (n >= 1 && n <= cfPromoPages.value) promoPager.page = n; };

    /* onPromoSizeChange */
    const onPromoSizeChange = () => { promoPager.page = 1; };

    /* setSettlePage */
    const setSettlePage = n => { if (n >= 1 && n <= cfSettlePages.value) settlePager.page = n; };

    /* onSettleSizeChange */
    const onSettleSizeChange = () => { settlePager.page = 1; };

    /* exportTab */
    const exportTab = () => {
      const tab = window.safeArrayUtils.safeFind(TABS, t => t.id === uiState.activeTab);
      showToast && showToast(`${tab.label} 데이터를 Excel로 내보냅니다.`, 'info');
    };

    // -- return ---------------------------------------------------------------

    return {
      uiState, TABS,
      onDateRangeChange,
      /* vendor */ vendorPager, cfVendorRows, cfVendorTotal, cfVendorPages, cfVendorPageList, cfVendorSummary,
      /* order  */ orderPager, cfOrderRows, cfOrderTotal, cfOrderPages, cfOrderPageList, cfOrderSummary,
      /* claim  */ claimPager, cfClaimRows, cfClaimTotal, cfClaimPages, cfClaimPageList, cfClaimSummary,
      /* promo  */ promoPager, cfPromoRows, cfPromoTotal, cfPromoPages, cfPromoPageList, cfPromoSummary,
      /* settle */ settlePager, cfSettleRows, cfSettleTotal, cfSettlePages, cfSettlePageList, cfSettleSummary,
      fmt, fmtW, fnStatusBadge, fnTypeBadge, onSearch, onReset, pageNums, exportTab, COMM_RATE, codes,
      setVendorPage, onVendorSizeChange,
      setOrderPage, onOrderSizeChange,
      setClaimPage, onClaimSizeChange,
      setPromoPage, onPromoSizeChange,
      setSettlePage, onSettleSizeChange,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">정산현황</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">업체별·기간별 정산 진행 현황을 집계 탭으로 조회합니다. 수집~지급 전 단계 금액과 건수를 확인할 수 있습니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 탭 구성: 업체별 / 주문별 / 클레임별 / 프로모션별 / 정산집계
• 업체별 탭: 매출·환불·순매출·수수료·정산예정액 집계
• 정산집계 탭: 마감 기준 월별 최종 정산액 목록
• CSV 내보내기를 지원합니다.</div>
  </div>

  <!-- -- 공통 날짜 필터 ------------------------------------------------------- -->
  <div class="card" style="margin-bottom:12px">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <select v-model="uiState.dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간 선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <input type="date" v-model="uiState.dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="uiState.dateEnd"   style="width:140px" />
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
        <button class="btn btn-secondary" @click="exportTab">📥 Excel</button>
      </div>
    </div>
  </div>

  <!-- -- 탭 -------------------------------------------------------------- -->
  <div class="tab-bar-row" style="margin-bottom:0">
    <div class="tab-nav">
      <button v-for="t in TABS" :key="t?.id" class="tab-btn" :class="{active: uiState.activeTab===t.id}" @click="uiState.activeTab=t.id">{{ t.label }}</button>
    </div>
  </div>

  <!-- -- ══ 1. 업체별현황 ══ ------------------------------------------------- -->
  <div v-if="uiState.activeTab==='vendor'" class="card" style="border-radius:0 8px 8px 8px">
    <!-- -- 요약 카드 -------------------------------------------------------- -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 매출</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(cfVendorSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">환불액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(cfVendorSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 (10%)</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(cfVendorSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산예정액</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(cfVendorSummary.settle) }}</div>
      </div>
    </div>
    <!-- -- 검색 ----------------------------------------------------------- -->
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="uiState.vendorSearchValue" placeholder="업체명 검색" style="width:200px" @keyup.enter="() => onSearch?.()" />
    </div>
    <!-- -- 테이블 ---------------------------------------------------------- -->
    <div class="toolbar"><span class="list-count">총 {{ cfVendorTotal }}개 업체</span></div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th><th>업체명</th><th>주문건수</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료(10%)</th><th>정산예정액</th>
      </tr></thead>
      <tbody>
        <tr v-for="(r, idx) in cfVendorPageList" :key="r?.vendorId">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (vendorPager.page - 1) * vendorPager.size + idx + 1 }}</td>
          <td><strong>{{ r.vendorNm }}</strong></td>
          <td>{{ r.orderCnt }}건</td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ r.refund > 0 ? '-'+fmtW(r.refund) : '-' }}</td>
          <td><strong>{{ fmtW(r.netSales) }}</strong></td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#27ae60;font-weight:700">{{ fmtW(r.settle) }}</td>
        </tr>
        <tr v-if="!cfVendorPageList.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- ══ 2. 주문별현황 ══ ------------------------------------------------- -->
  <div v-if="uiState.activeTab==='order'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">유효 주문수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ cfOrderSummary.cnt }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0f4ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">주문 매출</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ fmtW(cfOrderSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 합계</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(cfOrderSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산 합계</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(cfOrderSummary.settle) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="uiState.orderSearchValue" placeholder="주문ID / 고객명 / 상품명" style="width:220px" @keyup.enter="() => onSearch?.()" />
      <select v-model="uiState.orderSearchStatus" style="width:130px">
        <option value="">상태 전체</option>
        <option v-for="c in codes.st_order_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfOrderTotal }}건</span></div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;">번호</th><th>주문ID</th><th>주문일시</th><th>고객명</th><th>업체</th><th>상품명</th><th>결제금액</th><th>수수료</th><th>정산액</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="(r, idx) in cfOrderPageList" :key="r?.orderId" :style="r.isCancelled ? 'color:#bbb' : ''">
          <td style="text-align:center;font-size:11px;color:#999;">{{ (orderPager.page - 1) * orderPager.size + idx + 1 }}</td>
          <td>{{ r.orderId }}</td>
          <td>{{ r.orderDate }}</td>
          <td>{{ r.userNm }}</td>
          <td>{{ r.vendorNm }}</td>
          <td>{{ r.prodNm }}</td>
          <td>{{ fmtW(r.totalPrice) }}</td>
          <td style="color:#e67e22">{{ r.isCancelled ? '-' : fmtW(r.comm) }}</td>
          <td style="font-weight:700" :style="r.isCancelled ? 'color:#bbb' : 'color:#27ae60'">{{ r.isCancelled ? '-' : fmtW(r.settle) }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!cfOrderPageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- ══ 3. 클레임별현황 ══ ------------------------------------------------ -->
  <div v-if="uiState.activeTab==='claim'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">클레임 건수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ cfClaimSummary.cnt }}건</div>
        <div style="font-size:11px;color:#999;margin-top:4px">취소 {{ cfClaimSummary.cancel }} / 반품 {{ cfClaimSummary.return_ }} / 교환 {{ cfClaimSummary.exchange }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">환불요청액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(cfClaimSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff0f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">정산 차감액</div>
        <div style="font-size:18px;font-weight:700;color:#c0392b">{{ fmtW(Math.abs(cfClaimSummary.impact)) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0f4ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">처리율</div>
        <div style="font-size:18px;font-weight:700;color:#3498db">{{ cfClaimSummary.cnt > 0 ? Math.round(cfClaimRows.filter(r=>r.isCompleted).length / cfClaimSummary.cnt * 100) : 0 }}%</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <select v-model="uiState.claimSearchType" style="width:120px">
        <option value="">유형 전체</option><option v-for="c in codes.claim_types_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="uiState.claimSearchStatus" style="width:140px">
        <option value="">상태 전체</option>
        <option v-for="c in codes.claim_statuses_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfClaimTotal }}건</span></div>
    <table class="bo-table">
      <thead><tr>
        <th>클레임ID</th><th>요청일시</th><th>고객명</th><th>주문ID</th><th>상품명</th><th>유형</th><th>사유</th><th>환불액</th><th>정산차감</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in cfClaimPageList" :key="r?.claimId">
          <td>{{ r.claimId }}</td>
          <td>{{ r.requestDate }}</td>
          <td>{{ r.userNm }}</td>
          <td>{{ r.orderId }}</td>
          <td>{{ r.prodNm }}</td>
          <td><span class="badge" :class="fnTypeBadge(r.type)">{{ r.type }}</span></td>
          <td>{{ r.reason }}</td>
          <td>{{ r.refundAmount > 0 ? fmtW(r.refundAmount) : '-' }}</td>
          <td style="color:#e74c3c;font-weight:700">{{ r.settleImpact < 0 ? '-'+fmtW(Math.abs(r.settleImpact)) : '-' }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!cfClaimPageList.length"><td colspan="10" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- ══ 4. 프로모션별현황 ══ ----------------------------------------------- -->
  <div v-if="uiState.activeTab==='promo'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">프로모션 수</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ cfPromoSummary.cnt }}개</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fdf5ff">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 사용건수</div>
        <div style="font-size:18px;font-weight:700;color:#9b59b6">{{ cfPromoSummary.totalUse }}건</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 할인/지원액</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(cfPromoSummary.totalDiscount) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <select v-model="uiState.promoSearchType" style="width:110px">
        <option value="">유형 전체</option>
        <option v-for="c in codes.promo_types_kr" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input v-model="uiState.promoSearchValue" placeholder="프로모션명 검색" style="width:180px" @keyup.enter="() => onSearch?.()" />
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfPromoTotal }}개</span></div>
    <table class="bo-table">
      <thead><tr>
        <th>ID</th><th>유형</th><th>프로모션명</th><th>발급/충전수</th><th>사용건수</th><th>할인/지원액</th><th>기간</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in cfPromoPageList" :key="r?.promoId">
          <td>{{ r.promoId }}</td>
          <td><span class="badge badge-blue">{{ r.promoType }}</span></td>
          <td>{{ r.promoNm }}</td>
          <td>{{ fmt(r.issueCnt) }}</td>
          <td>{{ fmt(r.useCnt) }}</td>
          <td style="color:#e74c3c;font-weight:700">{{ fmtW(r.discountAmt) }}</td>
          <td style="font-size:12px;color:#888">{{ r.period }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.status)">{{ r.status }}</span></td>
        </tr>
        <tr v-if="!cfPromoPageList.length"><td colspan="8" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- ══ 5. 정산별현황 ══ ------------------------------------------------- -->
  <div v-if="uiState.activeTab==='settle'" class="card" style="border-radius:0 8px 8px 8px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:12px 8px;background:#f8f9fa">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 매출</div>
        <div style="font-size:18px;font-weight:700;color:#333">{{ fmtW(cfSettleSummary.sales) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fff8f8">
        <div style="font-size:11px;color:#888;margin-bottom:4px">총 환불</div>
        <div style="font-size:18px;font-weight:700;color:#e74c3c">{{ fmtW(cfSettleSummary.refund) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#fffbf0">
        <div style="font-size:11px;color:#888;margin-bottom:4px">수수료 합계</div>
        <div style="font-size:18px;font-weight:700;color:#e67e22">{{ fmtW(cfSettleSummary.comm) }}</div>
      </div>
      <div class="card" style="text-align:center;padding:12px 8px;background:#f0fff4">
        <div style="font-size:11px;color:#888;margin-bottom:4px">순 정산액</div>
        <div style="font-size:18px;font-weight:700;color:#27ae60">{{ fmtW(cfSettleSummary.settle) }}</div>
      </div>
    </div>
    <div class="search-bar" style="margin-bottom:12px">
      <input v-model="uiState.settleSearchMonth" placeholder="월 검색 (예: 2026-04)" style="width:180px" @keyup.enter="() => onSearch?.()" />
    </div>
    <div class="toolbar"><span class="list-count">총 {{ cfSettleTotal }}개월</span></div>
    <table class="bo-table">
      <thead><tr>
        <th>정산월</th><th>주문건수</th><th>매출액</th><th>환불액</th><th>순매출</th><th>수수료(10%)</th><th>프로모션비(3%)</th><th>순정산액</th><th>상태</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in cfSettlePageList" :key="r?.month">
          <td><strong>{{ r.month }}</strong></td>
          <td>{{ r.orderCnt }}건</td>
          <td>{{ fmtW(r.sales) }}</td>
          <td style="color:#e74c3c">{{ r.refund > 0 ? '-'+fmtW(r.refund) : '-' }}</td>
          <td><strong>{{ fmtW(r.net) }}</strong></td>
          <td style="color:#e67e22">{{ fmtW(r.comm) }}</td>
          <td style="color:#9b59b6">{{ fmtW(r.promo) }}</td>
          <td style="font-weight:700" :style="r.settle >= 0 ? 'color:#27ae60' : 'color:#e74c3c'">{{ fmtW(r.settle) }}</td>
          <td><span class="badge" :class="fnStatusBadge(r.statusCd)">{{ r.statusCd }}</span></td>
        </tr>
        <tr v-if="!cfSettlePageList.length"><td colspan="9" style="text-align:center;color:#999;padding:24px">데이터가 없습니다.</td></tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>
`,
};
