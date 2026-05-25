/* ShopJoy Admin - 정산현황 (업체별/주문별/클레임별/프로모션별/정산별) */
window.StStatusMng = {
  name: 'StStatusMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 ################################################## */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    /* 적용된 검색조건 스냅샷 — 입력(uiState.*)은 즉시 화면에 반영하지 않고, [조회] 시점에만 이 값으로 동기화 (UI/UX 검색 방식 정책) */
    const applied = reactive({
      vendorSearchValue: '', orderSearchValue: '', orderSearchStatus: '',
      claimSearchType: '', claimSearchStatus: '', promoSearchValue: '', promoSearchType: '', settleSearchMonth: '',
    });
    const showToast    = window.boApp.showToast;  // 토스트 알림
const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, activeTab: 'vendor', dateRange: '이번달', dateStart: '', dateEnd: '', vendorSearchValue: '', orderSearchValue: '', orderSearchStatus: '', claimSearchType: '', claimSearchStatus: '', promoSearchValue: '', promoSearchType: '', settleSearchMonth: ''});;
    const activeTab = Vue.toRef(uiState, 'activeTab');
    const codes = reactive({ st_order_statuses: [], claim_types_kr: [], claim_statuses_kr: [], promo_types_kr: [], date_range_opts: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StStatusMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 탭 전환
      } else if (cmd === 'tab-select') {
        uiState.activeTab = param;
        return;
      // 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      // 엑셀 내보내기
      } else if (cmd === 'statuses-export') {
        return exportTab();
      // 페이지 크기 변경 — 영역별
      } else if (cmd === 'statuses-vendorPagerSizeChange') {
        return onVendorSizeChange();
      } else if (cmd === 'statuses-orderPagerSizeChange') {
        return onOrderSizeChange();
      } else if (cmd === 'statuses-claimPagerSizeChange') {
        return onClaimSizeChange();
      } else if (cmd === 'statuses-promoPagerSizeChange') {
        return onPromoSizeChange();
      } else if (cmd === 'statuses-settlePagerSizeChange') {
        return onSettleSizeChange();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 페이지/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StStatusMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 번호 클릭 — 영역별
      if (cmd === 'statuses-vendorPagerSetPage') {
        return setVendorPage(param);
      } else if (cmd === 'statuses-orderPagerSetPage') {
        return setOrderPage(param);
      } else if (cmd === 'statuses-claimPagerSetPage') {
        return setClaimPage(param);
      } else if (cmd === 'statuses-promoPagerSetPage') {
        return setPromoPage(param);
      } else if (cmd === 'statuses-settlePagerSetPage') {
        return setSettlePage(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */
    /* fnLoadCodes — 공통코드 로드 */
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
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      if (uiState.dateRange) {
        const r = boUtil.bofGetDateRange(uiState.dateRange);
        uiState.dateStart = r ? r.from : '';
        uiState.dateEnd   = r ? r.to   : '';
      }
    };
    /* 초기 날짜 설정 */
    (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    /* -- 원본 데이터 -- */
    const orders = reactive([]);
    const claims = reactive([]);
    const vendors = reactive([]);
    const coupons = reactive([]);
    const cacheDatas = reactive([]);

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      try {
        // 기간(uiState.dateStart~dateEnd)을 서버 검색 파라미터로 전달.
        // 빈 값이면 날짜조건 미전달(전체). 클라이언트 inRange 는 집계 정합성 위해 유지(서버가 거른 데이터에 동일조건 재적용 → 결과 불변).
        const dS = uiState.dateStart, dE = uiState.dateEnd;
        const dateP = (dateType) => (dS || dE) ? { dateType, dateStart: dS, dateEnd: dE } : {};
        const PG = { pageNo: 1, pageSize: 10000 };
        const [resO, resC, resV, resCp, resCa] = await Promise.all([
          boApiSvc.odOrder.getPage({ ...PG, ...dateP('order_date') }, '정산상태관리', '목록조회'),
          boApiSvc.odClaim.getPage({ ...PG, ...dateP('request_date') }, '정산상태관리', '목록조회'),
          boApiSvc.syVendor.getPage(PG, '정산상태관리', '목록조회'),
          boApiSvc.pmCoupon.getPage(PG, '정산상태관리', '목록조회'),
          boApiSvc.pmCache.getPage({ ...PG, ...dateP('reg_date') }, '정산상태관리', '목록조회'),
        ]);
        orders.splice(0, orders.length, ...(resO.data?.data?.pageList || resO.data?.data?.list || []));
        claims.splice(0, claims.length, ...(resC.data?.data?.pageList || resC.data?.data?.list || []));
        vendors.splice(0, vendors.length, ...(resV.data?.data?.pageList || resV.data?.data?.list || []));
        coupons.splice(0, coupons.length, ...(resCp.data?.data?.pageList || resCp.data?.data?.list || []));
        cacheDatas.splice(0, cacheDatas.length, ...(resCa.data?.data?.pageList || resCa.data?.data?.list || []));
      } catch (_) {}
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchData('DEFAULT'); });
    const cfVendors  = computed(() => vendors.filter(v => v.vendorType === '판매업체'));

    const COMM_RATE = 0.10; // 수수료율 10%

    /* inRange — 에서 범위 */
    const inRange = (dateStr) => {
      const d = String(dateStr || '').slice(0, 10);
      if (uiState.dateStart && d < uiState.dateStart) { return false; }
      if (uiState.dateEnd   && d > uiState.dateEnd) { return false; }
      return true;
    };

    /* ════════════════════════════════════════════════
     * 1. 업체별현황
     * ════════════════════════════════════════════════ */
    const vendorSearchValue  = ref('');
    const vendorPager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfVendorRows = computed(() => {
      const filteredOrders = window.safeArrayUtils.safeFilter(orders, o => inRange(o.orderDate) && o.status !== '취소됨');
      return cfVendors.value.map(v => {
        const vOrders = window.safeArrayUtils.safeFilter(filteredOrders, o => o.vendorId === v.vendorId);
        const sales   = vOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
        const refund  = claims
          .filter(c => inRange(c.requestDate) && ['환불완료','취소완료'].includes(c.status))
          .filter(c => { const o = orders.find(x => x.orderId === c.orderId); return o && o.vendorId === v.vendorId; })
          .reduce((s, c) => s + (c.refundAmount || 0), 0);
        const netSales = sales - refund;
        const comm     = Math.round(netSales * COMM_RATE);

        /* ##### [06] return (템플릿 노출) ############################################## */
        return { vendorId: v.vendorId, vendorNm: v.vendorNm, orderCnt: vOrders.length, sales, refund, netSales, comm, settle: netSales - comm };
      }).filter(r => !applied.vendorSearchValue || r.vendorNm.includes(applied.vendorSearchValue));
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
      const searchVal = applied.orderSearchValue.trim().toLowerCase();
      return window.safeArrayUtils.safeFilter(orders, o => {
        if (!inRange(o.orderDate)) { return false; }
        if (applied.orderSearchStatus && o.status !== applied.orderSearchStatus) { return false; }
        if (searchVal && !o.orderId.toLowerCase().includes(searchVal) && !o.userNm.toLowerCase().includes(searchVal) && !o.prodNm.toLowerCase().includes(searchVal)) { return false; }
        return true;
      }).map(o => {
        const vendor = cfVendors.value.find(v => v.vendorId === o.vendorId);
        const isCancelled = o.status === '취소됨';
        const comm   = isCancelled ? 0 : Math.round((o.totalPrice || 0) * COMM_RATE);
        const settle = isCancelled ? 0 : (o.totalPrice || 0) - comm;

        return { ...o, vendorNm: vendor ? vendor.vendorNm : '-', comm, settle, isCancelled };
      });
    });
    const cfOrderTotal = computed(() => cfOrderRows.value.length);
    const cfOrderPages = computed(() => Math.max(1, Math.ceil(cfOrderTotal.value / orderPager.size)));
    const cfOrderPageList = computed(() => cfOrderRows.value.slice((orderPager.page - 1) * orderPager.size, orderPager.page * orderPager.size));
    const cfOrderSummary  = computed(() => {
      const valid = window.safeArrayUtils.safeFilter(cfOrderRows.value, r => !r.isCancelled);

      return { cnt: valid.length, sales: valid.reduce((s, r) => s + r.totalPrice, 0), comm: valid.reduce((s, r) => s + r.comm, 0), settle: valid.reduce((s, r) => s + r.settle, 0) };
    });

    /* ════════════════════════════════════════════════
     * 3. 클레임별현황
     * ════════════════════════════════════════════════ */
    const claimSearchType   = ref('');
        const claimPager        = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfClaimRows = computed(() => {
      return window.safeArrayUtils.safeFilter(claims, c => {
        if (!inRange(c.requestDate)) { return false; }
        if (applied.claimSearchType   && c.type   !== applied.claimSearchType) { return false; }
        if (applied.claimSearchStatus && c.status !== applied.claimSearchStatus) { return false; }
        return true;
      }).map(c => {
        const isCompleted = ['환불완료','취소완료','교환완료'].includes(c.status);
        const settleImpact = ['환불완료','취소완료'].includes(c.status) ? -(c.refundAmount || 0) : 0;

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
      const searchVal = applied.promoSearchValue.trim().toLowerCase();
      const couponRows = coupons.map(c => {
        const discountAmt = c.discountType === 'amount' ? c.discountValue * c.useCount
          : c.discountType === 'rate' ? Math.round(50000 * (c.discountValue / 100) * c.useCount) // 평균 주문금액 가정
          : 3000 * c.useCount;

        return {
          promoId: 'CPN-' + c.couponId, promoType: '쿠폰', promoNm: c.name,
          issueCnt: c.issueCount, useCnt: c.useCount,
          discountAmt, status: c.status,
          period: `~${c.expiry}`,
        };
      });
      const cacheRows = [
        { promoId: 'CCH-001', promoType: '캐쉬', promoNm: '캐쉬 사용 합산', issueCnt: cacheDatas.filter(x => x.type==='충전').length, useCnt: cacheDatas.filter(x => x.type==='사용').length, discountAmt: cacheDatas.filter(x => x.type==='사용').reduce((s,x) => s + Math.abs(x.amount), 0), status: '진행중', period: '상시' },
      ];
      const allRows = [...couponRows, ...cacheRows];
      return allRows.filter(r => {
        if (applied.promoSearchType && r.promoType !== applied.promoSearchType) { return false; }
        if (searchVal && !r.promoNm.toLowerCase().includes(searchVal) && !r.promoType.toLowerCase().includes(searchVal)) { return false; }
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
      window.safeArrayUtils.safeForEach(orders, o => {
        const m = String(o.orderDate || '').slice(0, 7);
        if (!m) { return; }
        if (!monthMap[m]) { monthMap[m] = { month: m, orderCnt: 0, sales: 0, refund: 0, commAmt: 0, promoAmt: 0 }; }
        if (o.status !== '취소됨') { monthMap[m].orderCnt++; monthMap[m].sales += o.totalPrice || 0; }
      });
      window.safeArrayUtils.safeForEach(claims, c => {
        const m = String(c.requestDate || '').slice(0, 7);
        if (m && monthMap[m] && ['환불완료','취소완료'].includes(c.status)) { monthMap[m].refund += c.refundAmount || 0; }
      });
      return Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month)).map(r => {
        const net  = r.sales - r.refund;
        const comm = Math.round(net * COMM_RATE);
        const promo = Math.round(net * 0.03); // 프로모션 비용 가정 3%
        const settle = net - comm - promo;

        return { ...r, net, comm, promo, settle, statusCd: settle > 0 ? '정산예정' : '마감' };
      }).filter(r => !applied.settleSearchMonth || r.month.includes(applied.settleSearchMonth));
    });
    const cfSettleTotal    = computed(() => cfSettleRows.value.length);
    const cfSettlePages    = computed(() => Math.max(1, Math.ceil(cfSettleTotal.value / settlePager.size)));
    const cfSettlePageList = computed(() => cfSettleRows.value.slice((settlePager.page - 1) * settlePager.size, settlePager.page * settlePager.size));
    const cfSettleSummary  = computed(() => cfSettleRows.value.reduce((a, r) => ({ sales: a.sales + r.sales, refund: a.refund + r.refund, comm: a.comm + r.comm, settle: a.settle + r.settle }), { sales: 0, refund: 0, comm: 0, settle: 0 }));

    /* fmt — 포맷 */
    const fmt  = n => Number(n || 0).toLocaleString();

    /* fmtW — 포맷 W */
    const fmtW = n => Number(n || 0).toLocaleString() + '원';

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({
      '완료':'badge-green', '정산예정':'badge-blue', '마감':'badge-gray',
      '취소완료':'badge-red', '환불완료':'badge-red', '교환완료':'badge-purple',
      '활성':'badge-green', '만료':'badge-gray', '진행중':'badge-blue',
    }[s] || 'badge-gray');

    /* fnTypeBadge */
    const _CLAIM_TYPE_KR_FB = { '취소':'badge-red', '반품':'badge-orange', '교환':'badge-purple' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('CLAIM_TYPE_KR', t, _CLAIM_TYPE_KR_FB[t] || 'badge-gray');

    /* 입력값(uiState.*) → 적용 스냅샷(applied.*) 동기화 */
    /* fnSyncApplied — 유틸 */
    const fnSyncApplied = () => {
      applied.vendorSearchValue = uiState.vendorSearchValue;
      applied.orderSearchValue  = uiState.orderSearchValue;
      applied.orderSearchStatus = uiState.orderSearchStatus;
      applied.claimSearchType   = uiState.claimSearchType;
      applied.claimSearchStatus = uiState.claimSearchStatus;
      applied.promoSearchValue  = uiState.promoSearchValue;
      applied.promoSearchType   = uiState.promoSearchType;
      applied.settleSearchMonth = uiState.settleSearchMonth;
    };

    /* onSearch — 조회 */
    const onSearch = async () => {
      vendorPager.page = 1; orderPager.page = 1; claimPager.page = 1; promoPager.page = 1; settlePager.page = 1;
      fnSyncApplied();
      await handleSearchData('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset  = () => {
      uiState.vendorSearchValue = ''; uiState.orderSearchValue = ''; uiState.orderSearchStatus = '';
      uiState.claimSearchType = ''; uiState.claimSearchStatus = ''; uiState.promoSearchValue = ''; uiState.promoSearchType = ''; uiState.settleSearchMonth = '';
      onSearch();
    };

    /* pageNums — 페이지 Nums */
    const pageNums = (cur, last) => { const s = Math.max(1, cur-2), e = Math.min(last, s+4); return Array.from({length: e-s+1}, (_,i) => s+i); };

    /* setVendorPage — 설정 */
    const setVendorPage = n => { if (n >= 1 && n <= cfVendorPages.value) vendorPager.page = n; };

    /* onVendorSizeChange — 이벤트 */
    const onVendorSizeChange = () => { vendorPager.page = 1; };

    /* setOrderPage — 설정 */
    const setOrderPage = n => { if (n >= 1 && n <= cfOrderPages.value) orderPager.page = n; };

    /* onOrderSizeChange — 이벤트 */
    const onOrderSizeChange = () => { orderPager.page = 1; };

    /* setClaimPage — 설정 */
    const setClaimPage = n => { if (n >= 1 && n <= cfClaimPages.value) claimPager.page = n; };

    /* onClaimSizeChange — 이벤트 */
    const onClaimSizeChange = () => { claimPager.page = 1; };

    /* setPromoPage — 설정 */
    const setPromoPage = n => { if (n >= 1 && n <= cfPromoPages.value) promoPager.page = n; };

    /* onPromoSizeChange — 이벤트 */
    const onPromoSizeChange = () => { promoPager.page = 1; };

    /* setSettlePage — 설정 */
    const setSettlePage = n => { if (n >= 1 && n <= cfSettlePages.value) settlePager.page = n; };

    /* onSettleSizeChange — 이벤트 */
    const onSettleSizeChange = () => { settlePager.page = 1; };

    /* exportTab — 내보내기 */
    const exportTab = () => {
      const tab = window.safeArrayUtils.safeFind(TABS, t => t.id === uiState.activeTab);
      showToast && showToast(`${tab.label} 데이터를 Excel로 내보냅니다.`, 'info');
    };

    /* BoGrid 컬럼 정의 — 특수셀은 #cell- 슬롯 override */
    const vendorGridColumns = [
      { key: 'vendorNm',  label: '업체명', cellStyle: 'font-weight:700' },
      { key: 'orderCnt',  label: '주문건수', fmt: (v) => v + '건' },
      { key: 'sales',     label: '매출액', fmt: fmtW },
      { key: 'refund',    label: '환불액', cellStyle: 'color:#e74c3c',
        fmt: (v) => v > 0 ? '-' + fmtW(v) : '-' },
      { key: 'netSales',  label: '순매출', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'comm',      label: '수수료(10%)', fmt: fmtW, cellStyle: 'color:#e67e22' },
      { key: 'settle',    label: '정산예정액', fmt: fmtW, cellStyle: 'color:#27ae60;font-weight:700' },
    ];
    // 주문 그리드
    const orderGridColumns = [
      { key: 'orderId',    label: '주문ID' },
      { key: 'orderDate',  label: '주문일시' },
      { key: 'userNm',     label: '고객명' },
      { key: 'vendorNm',   label: '업체' },
      { key: 'prodNm',     label: '상품명' },
      { key: 'totalPrice', label: '결제금액', fmt: fmtW },
      { key: 'comm',       label: '수수료', cellStyle: 'color:#e67e22',
        fmt: (v, row) => row.isCancelled ? '-' : fmtW(v) },
      { key: 'settle',     label: '정산액',
        fmt: (v, row) => row.isCancelled ? '-' : fmtW(v),
        cellStyle: (v, row) => 'font-weight:700;' + (row.isCancelled ? 'color:#bbb' : 'color:#27ae60') },
      { key: 'status',     label: '상태', badge: (row) => fnStatusBadge(row.status) },
    ];
    // 클레임 그리드
    const claimGridColumns = [
      { key: 'claimId',      label: '클레임ID' },
      { key: 'requestDate',  label: '요청일시' },
      { key: 'userNm',       label: '고객명' },
      { key: 'orderId',      label: '주문ID' },
      { key: 'prodNm',       label: '상품명' },
      { key: 'type',         label: '유형', badge: (row) => fnTypeBadge(row.type) },
      { key: 'reason',       label: '사유' },
      { key: 'refundAmount', label: '환불액', fmt: (v) => v > 0 ? fmtW(v) : '-' },
      { key: 'settleImpact', label: '정산차감', cellStyle: 'color:#e74c3c;font-weight:700',
        fmt: (v) => v < 0 ? '-' + fmtW(Math.abs(v)) : '-' },
      { key: 'status',       label: '상태', badge: (row) => fnStatusBadge(row.status) },
    ];
    // 프로모션 그리드
    const promoGridColumns = [
      { key: 'promoId',     label: 'ID' },
      { key: 'promoType',   label: '유형', badge: () => 'badge-blue' },
      { key: 'promoNm',     label: '프로모션명' },
      { key: 'issueCnt',    label: '발급/충전수', fmt: (v) => fmt(v) },
      { key: 'useCnt',      label: '사용건수', fmt: (v) => fmt(v) },
      { key: 'discountAmt', label: '할인/지원액', fmt: fmtW, cellStyle: 'color:#e74c3c;font-weight:700' },
      { key: 'period',      label: '기간', cellStyle: 'color:#888' },
      { key: 'status',      label: '상태', badge: (row) => fnStatusBadge(row.status) },
    ];
    // 정산 그리드
    const settleGridColumns = [
      { key: 'month',     label: '정산월', cellStyle: 'font-weight:700' },
      { key: 'orderCnt',  label: '주문건수', fmt: (v) => v + '건' },
      { key: 'sales',     label: '매출액', fmt: fmtW },
      { key: 'refund',    label: '환불액', cellStyle: 'color:#e74c3c',
        fmt: (v) => v > 0 ? '-' + fmtW(v) : '-' },
      { key: 'net',       label: '순매출', fmt: fmtW, cellStyle: 'font-weight:700' },
      { key: 'comm',      label: '수수료(10%)', fmt: fmtW, cellStyle: 'color:#e67e22' },
      { key: 'promo',     label: '프로모션비(3%)', fmt: fmtW, cellStyle: 'color:#9b59b6' },
      { key: 'settle',    label: '순정산액', fmt: fmtW,
        cellStyle: (v) => 'font-weight:700;' + (v >= 0 ? 'color:#27ae60' : 'color:#e74c3c') },
      { key: 'statusCd',  label: '상태', badge: (row) => fnStatusBadge(row.statusCd) },
    ];
    /* 검색바 :columns 자동 렌더 정의 — 모두 uiState 공유 */
    const dateSearchColumns = [
      { key: 'dateRange', label: '기간', type: 'select', options: () => codes.date_range_opts,
        nullLabel: '기간 선택', onChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'dateStart', type: 'date' },
      { type: 'label', label: '~' },
      { key: 'dateEnd',   type: 'date' },
    ];
    // 판매업체 검색
    const vendorSearchColumns = [
      { key: 'vendorSearchValue', label: '업체', type: 'text', placeholder: '업체명 검색', width: '200px' },
    ];
    // 주문 검색
    const orderSearchColumns = [
      { key: 'orderSearchValue',  label: '검색어', type: 'text',   placeholder: '주문ID / 고객명 / 상품명', width: '220px' },
      { key: 'orderSearchStatus', label: '상태', type: 'select', options: () => codes.st_order_statuses,  nullLabel: '상태 전체' },
    ];
    // 클레임 검색
    const claimSearchColumns = [
      { key: 'claimSearchType',   label: '유형', type: 'select', options: () => codes.claim_types_kr,    nullLabel: '유형 전체' },
      { key: 'claimSearchStatus', label: '상태', type: 'select', options: () => codes.claim_statuses_kr, nullLabel: '상태 전체' },
    ];
    // 프로모션 검색
    const promoSearchColumns = [
      { key: 'promoSearchType',  label: '유형', type: 'select', options: () => codes.promo_types_kr, nullLabel: '유형 전체' },
      { key: 'promoSearchValue', label: '검색어', type: 'text',   placeholder: '프로모션명 검색', width: '180px' },
    ];
    // 정산 검색
    const settleSearchColumns = [
      { key: 'settleSearchMonth', label: '정산월', type: 'text', placeholder: '월 검색 (예: 2026-04)', width: '180px' },
    ];

    /* 탭별 요약 카드 BoFormArea 컬럼 */
    const vendorSummaryColumns = [
      { key: '_sales',  label: '총 매출',     type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfVendorSummary.value.sales)}</b>` },
      { key: '_refund', label: '환불액',      type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:15px;">${fmtW(cfVendorSummary.value.refund)}</b>` },
      { key: '_comm',   label: '수수료(10%)', type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:15px;">${fmtW(cfVendorSummary.value.comm)}</b>` },
      { key: '_settle', label: '정산예정액',  type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${fmtW(cfVendorSummary.value.settle)}</b>` },
    ];
    const orderSummaryColumns = [
      { key: '_cnt',    label: '주문건수',    type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:16px;">${cfOrderSummary.value.cnt}건</b>` },
      { key: '_sales',  label: '매출액',      type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:15px;">${fmtW(cfOrderSummary.value.sales)}</b>` },
      { key: '_comm',   label: '수수료',      type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:15px;">${fmtW(cfOrderSummary.value.comm)}</b>` },
      { key: '_settle', label: '정산예정',    type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${fmtW(cfOrderSummary.value.settle)}</b>` },
    ];
    const claimSummaryColumns = [
      { key: '_cnt',     label: '클레임건수',   type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:16px;">${cfClaimSummary.value.cnt}건</b><div style="font-size:10px;color:#888;">취소 ${cfClaimSummary.value.cancel} / 반품 ${cfClaimSummary.value.return_} / 교환 ${cfClaimSummary.value.exchange}</div>` },
      { key: '_refund',  label: '환불액',       type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:15px;">${fmtW(cfClaimSummary.value.refund)}</b>` },
      { key: '_impact',  label: '정산영향액',   type: 'readonly', html: true, fmt: () => `<b style="color:#9b59b6;font-size:15px;">${fmtW(Math.abs(cfClaimSummary.value.impact))}</b>` },
      { key: '_pct',     label: '완료율',       type: 'readonly', html: true, fmt: () => { const c = cfClaimSummary.value.cnt; const pct = c > 0 ? Math.round(cfClaimRows.value.filter(r=>r.isCompleted).length / c * 100) : 0; return `<b style="color:#27ae60;font-size:16px;">${pct}%</b>`; } },
    ];
    const promoSummaryColumns = [
      { key: '_cnt',       label: '진행 프로모션', type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:16px;">${cfPromoSummary.value.cnt}개</b>` },
      { key: '_totalUse',  label: '총 사용건수',  type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:16px;">${cfPromoSummary.value.totalUse}건</b>` },
      { key: '_totalDisc', label: '총 할인액',    type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:15px;">${fmtW(cfPromoSummary.value.totalDiscount)}</b>` },
    ];
    const settleSummaryColumns = [
      { key: '_sales',  label: '총 매출',     type: 'readonly', html: true, fmt: () => `<b style="color:#333;font-size:15px;">${fmtW(cfSettleSummary.value.sales)}</b>` },
      { key: '_refund', label: '환불액',      type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:15px;">${fmtW(cfSettleSummary.value.refund)}</b>` },
      { key: '_comm',   label: '수수료',      type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:15px;">${fmtW(cfSettleSummary.value.comm)}</b>` },
      { key: '_settle', label: '정산액',      type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${fmtW(cfSettleSummary.value.settle)}</b>` },
    ];

    return {
      uiState, codes, TABS,                                                         // 상태 / 데이터
      vendorGridColumns, orderGridColumns, claimGridColumns, promoGridColumns, settleGridColumns,             // 컬럼 정의
      dateSearchColumns, vendorSearchColumns, orderSearchColumns, claimSearchColumns, promoSearchColumns, settleSearchColumns, // 검색 컬럼 정의
      vendorSummaryColumns, orderSummaryColumns, claimSummaryColumns, promoSummaryColumns, settleSummaryColumns,               // 요약 카드 컬럼 정의
      handleBtnAction, handleSelectAction,                                          // dispatch (모든 이벤트 / 액션 라우팅)
      vendorPager, cfVendorTotal, cfVendorPageList, cfVendorSummary,                // vendor
      orderPager, cfOrderTotal, cfOrderPageList, cfOrderSummary,                    // order
      claimPager, cfClaimRows, cfClaimTotal, cfClaimPageList, cfClaimSummary,       // claim
      promoPager, cfPromoTotal, cfPromoPageList, cfPromoSummary,                    // promo
      settlePager, cfSettleTotal, cfSettlePageList, cfSettleSummary,                // settle
      fmt, fmtW, fnStatusBadge, fnTypeBadge,                                        // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    정산현황
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      업체별·기간별 정산 진행 현황을 집계 탭으로 조회합니다. 수집~지급 전 단계 금액과 건수를 확인할 수 있습니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 탭 구성: 업체별 / 주문별 / 클레임별 / 프로모션별 / 정산집계 • 업체별 탭: 매출·환불·순매출·수수료·정산예정액 집계 • 정산집계 탭: 마감 기준 월별 최종 정산액 목록 • CSV 내보내기를 지원합니다.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 공통 날짜 필터 ================================================ -->
  <div class="card" style="margin-bottom:12px">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :bar-style="'flex-wrap:wrap;gap:8px'"
      :columns="dateSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary" @click="handleBtnAction('statuses-export')">
          📥 Excel
        </button>
      </template>
    </bo-search-area>
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 공통 날짜 필터 ================================================ -->
  <!-- ===== ■. 탭 ======================================================= -->
  <div class="tab-bar-row" style="margin-bottom:0">
    <div class="tab-nav">
      <button v-for="t in TABS" :key="t?.id" class="tab-btn" :class="{active: uiState.activeTab===t.id}" @click="handleBtnAction('tab-select', t.id)">
        {{ t.label }}
      </button>
    </div>
  </div>
  <!-- ===== □. 탭 ======================================================= -->
  <!-- ===== ■. ══ 1. 업체별현황 ══ ========================================== -->
  <div v-if="uiState.activeTab==='vendor'" class="card" style="border-radius:0 8px 8px 8px">
    <!-- ===== ■.■. 요약 카드 ================================================= -->
    <bo-form-area :columns="vendorSummaryColumns" :form="{}" :cols="4" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== □.□. 요약 카드 ================================================= -->
    <!-- ===== ■.■. 검색 ==================================================== -->
    <bo-search-area :show-actions="false" :bar-style="'margin-bottom:12px'"
      :columns="vendorSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 ==================================================== -->
    <!-- ===== ■.■. 테이블 =================================================== -->
    <bo-grid
      :columns="vendorGridColumns"
      :rows="cfVendorPageList"
      :pager="vendorPager"
      row-key="vendorId"
      list-title="업체별현황"
      :count-text="'총 ' + cfVendorTotal + '개 업체'"
      empty-text="데이터가 없습니다."
      @set-page="n => handleSelectAction('statuses-vendorPagerSetPage', n)"
      @size-change="handleBtnAction('statuses-vendorPagerSizeChange')">
    </bo-grid>
  </div>
  <!-- ===== □.□. 테이블 =================================================== -->
  <!-- ===== □. ══ 1. 업체별현황 ══ ========================================== -->
  <!-- ===== ■. ══ 2. 주문별현황 ══ ========================================== -->
  <div v-if="uiState.activeTab==='order'" class="card" style="border-radius:0 8px 8px 8px">
    <bo-form-area :columns="orderSummaryColumns" :form="{}" :cols="4" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :show-actions="false" :bar-style="'margin-bottom:12px'"
      :columns="orderSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="orderGridColumns"
      :rows="cfOrderPageList"
      :pager="orderPager"
      row-key="orderId"
      list-title="주문별현황"
      :count-text="'총 ' + cfOrderTotal + '건'"
      :row-style="(r) => r.isCancelled ? 'color:#bbb' : ''"
      empty-text="데이터가 없습니다."
      @set-page="n => handleSelectAction('statuses-orderPagerSetPage', n)"
      @size-change="handleBtnAction('statuses-orderPagerSizeChange')">
    </bo-grid>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. ══ 2. 주문별현황 ══ ========================================== -->
  <!-- ===== ■. ══ 3. 클레임별현황 ══ ========================================= -->
  <div v-if="uiState.activeTab==='claim'" class="card" style="border-radius:0 8px 8px 8px">
    <bo-form-area :columns="claimSummaryColumns" :form="{}" :cols="4" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :show-actions="false" :bar-style="'margin-bottom:12px'"
      :columns="claimSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="claimGridColumns"
      :rows="cfClaimPageList"
      :pager="claimPager"
      row-key="claimId"
      list-title="클레임별현황"
      :count-text="'총 ' + cfClaimTotal + '건'"
      empty-text="데이터가 없습니다."
      @set-page="n => handleSelectAction('statuses-claimPagerSetPage', n)"
      @size-change="handleBtnAction('statuses-claimPagerSizeChange')">
    </bo-grid>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. ══ 3. 클레임별현황 ══ ========================================= -->
  <!-- ===== ■. ══ 4. 프로모션별현황 ══ ======================================== -->
  <div v-if="uiState.activeTab==='promo'" class="card" style="border-radius:0 8px 8px 8px">
    <bo-form-area :columns="promoSummaryColumns" :form="{}" :cols="3" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :show-actions="false" :bar-style="'margin-bottom:12px'"
      :columns="promoSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="promoGridColumns"
      :rows="cfPromoPageList"
      :pager="promoPager"
      row-key="promoId"
      list-title="프로모션별현황"
      :count-text="'총 ' + cfPromoTotal + '개'"
      empty-text="데이터가 없습니다."
      @set-page="n => handleSelectAction('statuses-promoPagerSetPage', n)"
      @size-change="handleBtnAction('statuses-promoPagerSizeChange')">
    </bo-grid>
  </div>
  <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. ══ 4. 프로모션별현황 ══ ======================================== -->
  <!-- ===== ■. ══ 5. 정산별현황 ══ ========================================== -->
  <div v-if="uiState.activeTab==='settle'" class="card" style="border-radius:0 8px 8px 8px">
    <bo-form-area :columns="settleSummaryColumns" :form="{}" :cols="4" readonly label-left :show-actions="false" label-width="100px" />
    <div style="height:12px"></div>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :show-actions="false" :bar-style="'margin-bottom:12px'"
      :columns="settleSearchColumns" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="settleGridColumns"
      :rows="cfSettlePageList"
      :pager="settlePager"
      row-key="month"
      list-title="정산별현황"
      :count-text="'총 ' + cfSettleTotal + '개월'"
      empty-text="데이터가 없습니다."
      @set-page="n => handleSelectAction('statuses-settlePagerSetPage', n)"
      @size-change="handleBtnAction('statuses-settlePagerSizeChange')">
    </bo-grid>
  </div>
</div>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. ══ 5. 정산별현황 ══ ========================================== -->
`,
};
