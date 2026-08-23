/* ShopJoy Admin - 주문항목관리 목록 + 하단 OdOrderItemDtl 임베드 */
window.OdOrderItemMng = {
  name: 'OdOrderItemMng',
  props: {
    navigate:    { type: Function, required: true },
    showToast:   { type: Function, default: () => {} },
    showConfirm: { type: Function, default: () => Promise.resolve(true) },
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted, onBeforeUnmount } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;

    /* 진행상태/클레임 뱃지 클릭 → 주문 칸반 보드를 별도 창(window.open)으로 연다.
     *   최초엔 인라인 팝오버(문서 클릭 감지로 닫힘)로 만들었으나, od-order-kanban 내부가
     *   <teleport to="body"> 를 쓰는 하위 모달을 갖고 있어 그 위 클릭이 팝오버 DOM 바깥으로 판정되어
     *   "칸반 보드 안을 클릭해도 닫힘" 버그가 났다 — 별도 창이면 이 문제 자체가 생기지 않는다.
     *   boUtil.bofOpenKanbanPopup 이 창 이름을 고정(odKanbanBoard)해 재사용하므로, 다른 뱃지를 눌러도
     *   같은 창이 새 주문으로 바로 전환된다. 닫힘은 window.closed 폴링으로 감지해 목록을 재조회한다. */
    let statusPopupWin = null;
    let statusPopupTimer = null;
    const openStatusPopover = (row) => {
      statusPopupWin = window.boUtil.bofOpenKanbanPopup(row.orderId, null, showToast, row.orderItemId);
      if (!statusPopupWin) { return; }
      detailPanel.selectedOrderItemId = row.orderItemId;
      detailPanel.selectedOrderId     = row.orderId;
      detailPanel.openMode = 'view'; detailPanel.active = true;
      if (statusPopupTimer) { clearInterval(statusPopupTimer); }
      statusPopupTimer = setInterval(() => {
        if (!statusPopupWin || statusPopupWin.closed) {
          clearInterval(statusPopupTimer);
          statusPopupTimer = null;
          detailPanel.reloadTrigger++;
          handleSearchList();
        }
      }, 600);
    };
    onBeforeUnmount(() => { if (statusPopupTimer) { clearInterval(statusPopupTimer); } });

    /* promoModal — 프로모션(할인/쿠폰/적립금/사은품) 열의 🔍 아이콘 클릭 시 열리는 상세 모달.
     *   4종 아이콘 전부 같은 모달을 연다 — 종류별로 좁게 나누는 대신 한 번에 전체 적용내역 +
     *   금액계산 정보를 보여주는 편이 실용적이라 판단(요청의 "프로모션 마지막 열" 상세와 동일 화면 재사용). */
    const promoModal = reactive({ show: false, loading: false, row: null, discounts: [], coupons: [], saves: [] });
    const openPromoModal = async (row) => {
      promoModal.row = row;
      promoModal.show = true;
      promoModal.loading = true;
      promoModal.discounts = []; promoModal.coupons = []; promoModal.saves = [];
      try {
        const [dRes, cRes, sRes] = await Promise.all([
          boApiSvc.pmDiscntUsage.getPage({ orderItemId: row.orderItemId, pageSize: 50 }),
          boApiSvc.pmCouponUsage.getPage({ orderItemId: row.orderItemId, pageSize: 50 }),
          boApiSvc.pmSaveUsage.getPage({ orderItemId: row.orderItemId, pageSize: 50 }),
        ]);
        promoModal.discounts = dRes.data?.data?.pageList || [];
        promoModal.coupons   = cRes.data?.data?.pageList || [];
        promoModal.saves     = sRes.data?.data?.pageList || [];
      } catch (err) {
        showToast(err.response?.data?.message || '프로모션 정보 조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        promoModal.loading = false;
      }
    };
    const closePromoModal = () => { promoModal.show = false; };

    /* 주문ID 그룹헤더 우측 [주문상세]/[프로모션상세] — 둘 다 새 창(window.open) 팝업으로 연다.
     *   주문상세: bo.html 앱 셸을 새 창에 그대로 열어 기존 OdOrderDtl 페이지로 라우팅(클레임 탭 포함,
     *   신규 화면 없이 기존 인프라 재사용). 프로모션상세: 주문 전체 항목의 프로모션 적용내역을
     *   보여주는 전용 팝업 페이지(bo-od-order-promo-pop.html, 칸반 팝업과 동일한 독립 HTML 패턴). */
    const openOrderDtlPop = (orderId) => {
      if (!orderId) { return; }
      /* boAppBase.js 해시 라우터는 상세ID 파라미터로 'id' 만 읽는다('orderId'는 칸반 전용) —
         dtlId= 로 넘기면 dtlId.value 가 계속 null 로 남아 cfIsNew=true(신규 등록 화면)로 빠진다. */
      /* BO 라우팅은 쿼리스트링 기반(?page=) — 2026-08-22 해시(#)에서 전환 */
      const url = window.pageUrl('bo.html') + '?page=odOrderDtl&id=' + encodeURIComponent(orderId);
      window.open(url, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    };
    const openOrderPromoPop = (orderId) => {
      if (!orderId) { return; }
      const url = window.pageUrl('bo-od-order-promo-pop.html') + '?orderId=' + encodeURIComponent(orderId);
      window.open(url, '_blank', 'width=1200,height=860,scrollbars=yes,resizable=yes');
    };
    /* 주문항목 상세 — 여러 화면에서 재사용해야 해서 인라인 임베드 대신 별도 창(window.open)으로 뗐다.
       bo.html 앱 셸을 새 창에 그대로 열어 odOrderItemDtl 페이지로 라우팅(inlineNavigate 없이 표준 navigate 그대로 사용). */
    const openOrderItemDtlPop = (orderItemId) => {
      if (!orderItemId) { return; }
      /* BO 라우팅은 쿼리스트링 기반(?page=) — 2026-08-22 해시(#)에서 전환 */
      const url = window.pageUrl('bo.html') + '?page=odOrderItemDtl&id=' + encodeURIComponent(orderItemId);
      window.open(url, '_blank', 'width=1300,height=880,scrollbars=yes,resizable=yes');
    };

    /* excelModal — 엑셀 다운로드 (공용 모달). buildExcelParams 는 buildListParams (아래) 를 그대로 재사용 —
       목록 조회와 다운로드 조건이 항상 같아야 해서, 위쪽으로 옮기지 않고 여기서 buildListParams 를 참조한다. */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => buildListParams();

    const items = reactive([]);
    const listGridPager = reactive({ pageNo: 1, pageSize: 50, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [20, 50, 100, 200] });
    const uiState = reactive({ loading: false });
    const codes = reactive({ order_item_statuses: [], od_date_types: [], couriers: [], claim_types: [], claim_statuses: [] });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)

    const searchParam = reactive({
      orderId: '', memberId: '', memberNm: '',
      vendorId: '', vendorNm: '', brandId: '', brandNm: '',
      mdUserId: '', mdUserNm: '', dlivCourierCd: '',
      orderItemStatusCds: '', claimCombos: '',
      searchType: '', searchValue: '',
      dateRangeType: 'reg_date', dateRangeStart: '', dateRangeEnd: '', _dateRange: '',
    });

    const picks = reactive({ member: false, order: false, vendor: false, brand: false, md: false });
    const searchParamInit = {};

    /* 하단 상세 — active 항상 true, 미선택 시 안내 메시지 표시 */
    const detailPanel = reactive({ selectedOrderItemId: null, selectedOrderId: null, openMode: 'view', reloadTrigger: 0, active: true, resetSeq: 0 });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'searchParam-list') { listGridPager.pageNo = 1; return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit); listGridPager.pageNo = 1; resetDetailToNew(); return handleSearchList();
      } else if (cmd === 'searchParam-dateRange') {
        return window.boUtil.bofApplyDateRange(searchParam, undefined, 'dateRangeStart', 'dateRangeEnd', '_dateRange');
      } else if (cmd === 'items-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchList(); } return;
      } else if (cmd === 'pick-member-open') { picks.member = true; return;
      } else if (cmd === 'pick-order-open')  { picks.order  = true; return;
      } else if (cmd === 'pick-vendor-open') { picks.vendor = true; return;
      } else if (cmd === 'pick-brand-open')  { picks.brand  = true; return;
      } else if (cmd === 'pick-md-open')     { picks.md     = true; return;
      } else if (cmd === 'pick-member-clear') { searchParam.memberId = ''; searchParam.memberNm = ''; return;
      } else if (cmd === 'pick-order-clear')  { searchParam.orderId  = ''; return;
      } else if (cmd === 'pick-vendor-clear') { searchParam.vendorId = ''; searchParam.vendorNm = ''; return;
      } else if (cmd === 'pick-brand-clear')  { searchParam.brandId  = ''; searchParam.brandNm  = ''; return;
      } else if (cmd === 'pick-md-clear')     { searchParam.mdUserId = ''; searchParam.mdUserNm = ''; return;
      } else { console.warn('[OdOrderItemMng] unknown cmd:', cmd); }
    };

    const fnCallbackModal = (popCmd, param, result) => {
      if (result == null) { picks.member = picks.order = picks.vendor = picks.brand = picks.md = false; return; }
      if (popCmd === 'cmPopup-member-pick') {
        searchParam.memberId = result?.selId || '';
        searchParam.memberNm = result?.selName || result?.loginId || result?.selId || '';
        picks.member = false;
      } else if (popCmd === 'cmPopup-order-pick') {
        searchParam.orderId = result?.selId || '';
        picks.order = false;
      } else if (popCmd === 'cmPopup-vendor-pick') {
        searchParam.vendorId = result?.selId || '';
        searchParam.vendorNm = result?.selName || result?.selId || '';
        picks.vendor = false;
      } else if (popCmd === 'cmPopup-brand-pick') {
        searchParam.brandId = result?.selId || '';
        searchParam.brandNm = result?.selName || result?.selId || '';
        picks.brand = false;
      } else if (popCmd === 'cmPopup-md-pick') {
        searchParam.mdUserId = result?.selId || '';
        searchParam.mdUserNm = result?.selName || result?.loginId || result?.selId || '';
        picks.md = false;
      }
    };

    const handleSelectAction = (cmd) => {
      if (cmd === 'items-pager-sizeChange') { listGridPager.pageNo = 1; return handleSearchList(); }
    };

    /* 행 클릭 / [수정] — 인라인 패널이 팝업으로 대체되어 둘 다 새 창으로 상세를 연다 */
    const handleRowClick = (row) => openOrderItemDtlPop(row.orderItemId);
    const handleRowEdit  = (row) => openOrderItemDtlPop(row.orderItemId);

    /* ##### [03] 인라인 Dtl 헬퍼 #################################################### */

    const resetDetailToNew = () => {
      detailPanel.selectedOrderItemId = null; detailPanel.selectedOrderId = null;
      detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.resetSeq++;
    };

    /* ===== 주문ID별 트리 그룹핑 (기본 펼치기) ===== */
    const groupCollapsed = reactive(new Set());   // 접힌 주문ID 집합 — 비어있으면 전부 펼침(기본)
    const toggleGroup = (orderId) => {
      if (groupCollapsed.has(orderId)) { groupCollapsed.delete(orderId); }
      else { groupCollapsed.add(orderId); }
    };
    /* cfDisplayRows — items(현재 페이지) 를 주문ID 기준으로 묶어 그룹헤더 의사행을 끼워넣은 그리드 표시용 배열.
       items 자체는 그대로 두고(합계 등 기존 로직 영향 없음) 화면 렌더용으로만 가공한다. */
    const cfDisplayRows = computed(() => {
      const groups = new Map();
      for (const it of items) {
        if (!groups.has(it.orderId)) { groups.set(it.orderId, []); }
        groups.get(it.orderId).push(it);
      }
      const out = [];
      let seq = 0;   // 접힘 여부와 무관하게 번호는 실제 항목 순서대로 증가(재펼침 시 번호 안 흔들림)
      for (const [orderId, groupItems] of groups) {
        const collapsed = groupCollapsed.has(orderId);
        out.push({
          _groupHeader: true, orderItemId: '_grp_' + orderId, orderId,
          memberNm: groupItems[0].memberNm, itemCount: groupItems.length, collapsed,
        });
        for (const it of groupItems) { it._displayIdx = seq++; if (!collapsed) { out.push(it); } }
      }
      return out;
    });

    /* ##### [04] 상수 및 헬퍼 함수 ################################################## */

    const STS_PROGRESS  = ['ORDERED', 'PAID', 'PREPARING', 'SHIPPING', 'WAIT_DEPOSIT'];
    const STS_DELIVERED = ['DELIVERED', 'DLIV_COMPLT'];
    const STS_CONFIRMED = ['CONFIRMED', 'COMPLT', 'BUY_CONFIRMED'];
    const STS_CLM_DONE  = ['COMPLT', 'DONE', 'COMPLETE', 'REJECTED'];
    /* fnClaimTypeLabel — 클레임유형 코드값 → 라벨. 공통코드(CLAIM_TYPE_CD, codes.claim_types)로 이미 로드해둔 걸
       그대로 조회한다 — 별도 하드코딩 맵을 만들지 않는다("select는 공통코드에 등록" 정책, 2026-08-18). */
    const fnClaimTypeLabel = (cd) => (codes.claim_types.find(c => c.codeValue === cd) || {}).codeLabel || cd;
    /* CLAIM_ITEM_STATUS_CD 값별로 실제 발생 가능한 클레임유형(코드값) — 클레임상세 매트릭스 피커에서
       해당 조합이 없는 칸은 체크박스 자체를 안 보여줄 때 쓴다.
       IN_PICKUP(수거중)은 물건을 회수해야 하는 반품/교환에만, IN_TRANSIT(교환출고중)은 교환에만 발생한다. */
    const CLAIM_STATUS_TYPE_CODES = {
      REQUESTED: ['CANCEL', 'RETURN', 'EXCHANGE'], APPROVED: ['CANCEL', 'RETURN', 'EXCHANGE'], PROCESSING: ['CANCEL', 'RETURN', 'EXCHANGE'],
      COMPLT: ['CANCEL', 'RETURN', 'EXCHANGE'], REJECTED: ['CANCEL', 'RETURN', 'EXCHANGE'], CANCELLED: ['CANCEL', 'RETURN', 'EXCHANGE'],
      IN_PICKUP: ['RETURN', 'EXCHANGE'], IN_TRANSIT: ['EXCHANGE'],
    };
    const fnClaimCellValid = (statusCd, typeCd) => (CLAIM_STATUS_TYPE_CODES[statusCd] || []).includes(typeCd);
    /* fnClaimStatusOpts / fnClaimTypeOpts — 매트릭스 피커 행(상태)/열(유형) 옵션. 공통코드 {codeValue,codeLabel} → {value,label} */
    const fnClaimStatusOpts = () => codes.claim_statuses.map(c => ({ value: c.codeValue, label: c.codeLabel }));
    const fnClaimTypeOpts   = () => codes.claim_types.map(c => ({ value: c.codeValue, label: c.codeLabel }));

    const fnStatusBadge = (cd) => {
      const m = { ORDERED:'badge-blue', WAIT_DEPOSIT:'badge-blue', PAID:'badge-green', PREPARING:'badge-orange', SHIPPING:'badge-purple', DELIVERED:'badge-blue', DLIV_COMPLT:'badge-blue', CONFIRMED:'badge-green', COMPLT:'badge-green', BUY_CONFIRMED:'badge-green', CANCELLED:'badge-red' };
      return m[cd] || 'badge-gray';
    };
    const fnYnBadge  = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';

    /* ##### cfSummary — 3섹션 집계 ################################################# */

    const cfSummary = computed(() => {
      let qtyOrder = 0, qtyCancel = 0, qtyProgress = 0, qtyConfirmed = 0;
      let cOrdered = 0, cPaid = 0, cPrep = 0, cShip = 0, cDliv = 0, cBuyConf = 0, cCancelled = 0;
      let caTotal = 0, caCancel = 0, caReturn = 0, caExchange = 0, caAmt = 0;
      let cdTotal = 0, cdCancel = 0, cdReturn = 0, cdExchange = 0, cdAmt = 0;
      let refCount = 0, refAmt = 0;
      let amtProgress = 0, amtConfirmed = 0;

      for (const r of items) {
        const qty       = Number(r.orderQty)        || 1;
        const st        = r.orderItemStatusCd        || '';
        const orderAmt  = Number(r.itemOrderAmt)     || 0;
        const cancelAmt = Number(r.itemCancelAmt)    || 0;
        const compAmt   = Number(r.itemCompletedAmt) || 0;
        qtyOrder += qty;
        if (STS_PROGRESS.includes(st))  { qtyProgress  += qty; amtProgress  += orderAmt; }
        if (STS_CONFIRMED.includes(st)) { qtyConfirmed += qty; amtConfirmed += compAmt || orderAmt; }
        if      (st === 'ORDERED' || st === 'WAIT_DEPOSIT') cOrdered++;
        else if (st === 'PAID')                              cPaid++;
        else if (st === 'PREPARING')                         cPrep++;
        else if (st === 'SHIPPING')                          cShip++;
        else if (STS_DELIVERED.includes(st))                 cDliv++;
        else if (STS_CONFIRMED.includes(st))                 cBuyConf++;
        else if (st === 'CANCELLED')                         cCancelled++;
        if (r.claimYn === 'Y') {
          const done = STS_CLM_DONE.includes(r.claimStatusCd || '');
          const t = r.claimTypeCd || '';
          if (done) {
            cdTotal++; cdAmt += cancelAmt; qtyCancel += qty;
            if (t === 'CANCEL') cdCancel++; else if (t === 'RETURN') cdReturn++; else if (t === 'EXCHANGE') cdExchange++;
          } else {
            caTotal++; caAmt += orderAmt;
            if (t === 'CANCEL') caCancel++; else if (t === 'RETURN') caReturn++; else if (t === 'EXCHANGE') caExchange++;
          }
        }
        if (r.cancelQty) qtyCancel = Math.max(qtyCancel, Number(r.cancelQty));
        if (r.refundCompltYn === 'Y') { refCount++; refAmt += cancelAmt; }
      }
      return {
        qty: { order: qtyOrder, cancel: qtyCancel, progress: qtyProgress, confirmed: qtyConfirmed },
        status: { ordered: cOrdered, paid: cPaid, prep: cPrep, ship: cShip, dliv: cDliv, buyConf: cBuyConf, cancelled: cCancelled },
        claimActive: { total: caTotal, cancel: caCancel, return: caReturn, exchange: caExchange, amt: caAmt },
        claimDone:   { total: cdTotal, cancel: cdCancel, return: cdReturn, exchange: cdExchange, amt: cdAmt },
        refund: { count: refCount, amt: refAmt },
        amtProgress, amtConfirmed,
      };
    });

    /* ##### cfSummaryGridRow — 그리드 하단 합계행 데이터 ############################# */

    const cfSummaryGridRow = computed(() => {
      if (!items.length) return null;
      let amtOrder = 0, amtDiscount = 0, amtCancel = 0, amtComp = 0, amtDliv = 0, qtyOrder = 0, qtyCancel = 0;
      let amtSettleSale = 0, amtSettleCommission = 0, amtSettleVendor = 0, amtSaveSchd = 0;
      let amtDiscntUsage = 0, amtCouponUsage = 0;
      for (const r of items) {
        qtyOrder    += Number(r.orderQty)         || 0;
        qtyCancel   += Number(r.cancelQty)        || 0;
        amtOrder    += Number(r.itemOrderAmt)     || 0;
        amtDiscount += Number(r.orgDiscountAmt)   || 0;
        amtCancel   += Number(r.itemCancelAmt)    || 0;
        amtComp     += Number(r.itemCompletedAmt) || 0;
        amtDliv     += Number(r.outboundShippingFee) || 0;
        amtSettleSale       += Number(r.settleSaleAmt)       || 0;
        amtSettleCommission += Number(r.settleCommissionAmt) || 0;
        amtSettleVendor     += Number(r.settleVendorAmt)     || 0;
        amtSaveSchd          += Number(r.saveSchdAmt)        || 0;
        amtDiscntUsage       += Number(r.discntUsageAmt)     || 0;
        amtCouponUsage       += Number(r.couponUsageAmt)     || 0;
      }
      const s = cfSummary.value;
      return {
        orderQty:         qtyOrder,
        cancelQty:        qtyCancel,
        _progress:        s.qty.progress,
        _qtyConf:         s.qty.confirmed,
        _stOrdered:       s.status.ordered,
        _stPaid:          s.status.paid,
        _stPrep:          s.status.prep,
        _stShip:          s.status.ship,
        _stDliv:          s.status.dliv,
        _stBuyConf:       s.status.buyConf,
        _stCancelled:     s.status.cancelled,
        _claimActive:     s.claimActive.total,
        _claimDone:       s.claimDone.total,
        _refund:          s.refund.count,
        discntUsageNm:   amtDiscntUsage ? ('-' + amtDiscntUsage.toLocaleString() + '원') : '',
        couponUsageNm:   amtCouponUsage ? ('-' + amtCouponUsage.toLocaleString() + '원') : '',
        saveSchdAmt:     amtSaveSchd    ? ('+' + amtSaveSchd.toLocaleString())           : '',
        itemOrderAmt:       amtOrder,
        orgDiscountAmt:     amtDiscount,
        itemCancelAmt:      amtCancel,
        itemCompletedAmt:   amtComp,
        outboundShippingFee: amtDliv,
        settleSaleAmt:       amtSettleSale,
        settleCommissionAmt: amtSettleCommission,
        settleVendorAmt:     amtSettleVendor,
        _settleShipFee:      amtDliv,
        _settleStatus:       '',
        settleDate:          '',
      };
    });

    /* ##### [05] 조회 / 코드 로딩 ################################################## */

    /* buildListParams — 검색조건 빌드. 목록 조회(handleSearchList)와 엑셀 다운로드(buildExcelParams)가
       같은 조건을 쓰도록 한 곳에 모은다 — 둘이 갈리면 화면과 다운로드 결과가 어긋난다. */
    const buildListParams = () => {
      const params = {
        ...(searchParam.memberId          && { memberId:          searchParam.memberId }),
        ...(searchParam.memberNm          && { memberNm:          searchParam.memberNm }),
        ...(searchParam.orderId           && { orderId:           searchParam.orderId }),
        ...(searchParam.vendorId          && { vendorId:          searchParam.vendorId }),
        ...(searchParam.vendorNm          && { vendorNm:          searchParam.vendorNm }),
        ...(searchParam.brandId           && { brandId:           searchParam.brandId }),
        ...(searchParam.brandNm           && { brandNm:           searchParam.brandNm }),
        ...(searchParam.mdUserId          && { mdUserId:          searchParam.mdUserId }),
        ...(searchParam.mdUserNm          && { mdUserNm:          searchParam.mdUserNm }),
        ...(searchParam.dlivCourierCd         && { dlivCourierCd:         searchParam.dlivCourierCd }),
        ...(() => { const s = searchParam.orderItemStatusCds ? searchParam.orderItemStatusCds.split(',').filter(Boolean) : []; return s.length ? { orderItemStatusCds: s } : {}; })(),
        ...(() => {
          const raw = searchParam.claimCombos;
          if (!raw) { return {}; }                                    // 빈값 = 전체(필터 없음)
          if (raw === '__NONE__') { return { claimCombos: ['__NONE__'] }; } // 전체선택 해제 = 아무 것도 매칭 안 함
          const s = raw.split(',').filter(Boolean);
          return s.length ? { claimCombos: s } : {};
        })(),
        ...(searchParam.searchType        && { searchType:        searchParam.searchType }),
        ...(searchParam.searchValue       && { searchValue:       searchParam.searchValue }),
        ...(searchParam.dateRangeType     && { dateRangeType:     searchParam.dateRangeType }),
        ...(searchParam.dateRangeStart    && { dateRangeStart:    searchParam.dateRangeStart }),
        ...(searchParam.dateRangeEnd      && { dateRangeEnd:      searchParam.dateRangeEnd }),
      };
      if (params.searchValue && !params.searchType) { params.searchType = 'prodNm,brandNm'; }
      return params;
    };

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize, ...buildListParams() };
        const res = await boApiSvc.odOrderItem.getPage(params, '주문항목관리', '조회');
        const d = res.data?.data || {};
        items.splice(0, items.length, ...(d.pageList || []));
        listGridPager.pageTotalCount = d.pageTotalCount || 0;
        listGridPager.pageTotalPage  = d.pageTotalPage  || 1;
        const tp = listGridPager.pageTotalPage, cur = listGridPager.pageNo;
        const from = Math.max(1, cur - 4), to = Math.min(tp, from + 9);
        listGridPager.pageNums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
        if (detailPanel.selectedOrderItemId && !items.some(r => r.orderItemId === detailPanel.selectedOrderItemId)) resetDetailToNew();
      } catch (err) {
        showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally { uiState.loading = false; }
    };

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS_CD', 'ORDER_ITEM_DATE_TYPE', 'COURIER', 'CLAIM_TYPE_CD', 'CLAIM_ITEM_STATUS_CD'], { compNm: 'OdOrderItemMng' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS_CD');
        codes.od_date_types       = codeStore.sgGetGrpCodes('ORDER_ITEM_DATE_TYPE');
        codes.couriers            = codeStore.sgGetGrpCodes('COURIER');
        codes.claim_types         = codeStore.sgGetGrpCodes('CLAIM_TYPE_CD');
        codes.claim_statuses      = codeStore.sgGetGrpCodes('CLAIM_ITEM_STATUS_CD');
      } catch (_) {}
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    const initPage = async () => {
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      Object.assign(searchParamInit, searchParam);
      await handleSearchList();
    };

    onMounted(() => { initPage(); });

    /* ##### [05-1] 템플릿 헬퍼 (&&를 속성값에서 제거) ################################# */

    const fnClmActiveStyle = (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? 'color:#c07030;font-weight:700;' : 'color:#e0e0e0;';
    const fnClmDoneStyle   = (row) => (row.claimYn === 'Y' &&  STS_CLM_DONE.includes(row.claimStatusCd || '')) ? 'color:#757575;font-weight:700;' : 'color:#e0e0e0;';
    const fnClmActiveText  = (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? (row.claimTypeCd ? fnClaimTypeLabel(row.claimTypeCd) : '진행') : '·';
    const fnClmDoneText    = (row) => (row.claimYn === 'Y' &&  STS_CLM_DONE.includes(row.claimStatusCd || '')) ? (row.claimTypeCd ? fnClaimTypeLabel(row.claimTypeCd) : '완료') : '·';

    const fnSettleBadgeCls = (row) => row.settleYn === 'Y' ? 'badge-green' : row.settleYn === 'P' ? 'badge-blue' : 'badge-gray';
    const fnSettleBadgeLbl = (row) => row.settleYn === 'Y' ? '완료' : row.settleYn === 'P' ? '부분완료' : '대기';
    const fnVoucherBadge     = (v) => ({ ISSUED: 'badge-green', PENDING: 'badge-orange', CANCELLED: 'badge-red' })[v] || 'badge-gray';
    const fnVoucherLbl       = (v) => ({ ISSUED: '발행완료', PENDING: '대기', CANCELLED: '취소' })[v] || (v || '-');
    /* ERP 전표 상태 배지 (DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR) */
    const fnErpVoucherBadge  = (v) => ({ DRAFT: 'badge-gray', CONFIRMED: 'badge-blue', SENT: 'badge-green', MATCHED: 'badge-green', MISMATCH: 'badge-orange', ERROR: 'badge-red' })[v] || 'badge-gray';
    const fnErpVoucherLbl    = (v) => ({ DRAFT: '임시', CONFIRMED: '확정', SENT: '발송', MATCHED: '매칭', MISMATCH: '불일치', ERROR: '오류' })[v] || (v || '-');
    /* ERP 전표 유형 한글 축약 (SETTLE/RETURN/ADJ/PAY) */
    const fnErpVoucherTypeNm = (v) => ({ SETTLE: '정산', RETURN: '반품', ADJ: '조정', PAY: '결제' })[v] || v || '전표';

    /* ##### [06] 컬럼 정의 ########################################################## */

    const columns = {};

    /* listGrid — 2행 그룹 헤더 (BoGroupTable 전용) */
    columns.listGrid = [
      /* ── Fixed (헤더 전체 행 span) ─────────────────────────────────────── */
      { key: '_rowNum',     label: '번호',   width: 34,  slot: true, pin: 'left' },
      { key: 'orderItemId', label: '항목ID/주문ID', width: 108, pin: 'left', slot: true,
        titleFmt: (row) => (row.orderItemId || '-') + ' / ' + (row.orderId || '-') },
      { key: 'memberNm',    label: '회원명', width: 84,  pin: 'left',
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;text-align:left;',
        fmt: (row) => row.memberNm   || '-' },
      { key: 'prodNm',      label: '상품명', width: 150, pin: 'left', slot: true,
        tdStyle: () => 'overflow:hidden;' },
      /* ── 📦 수량 (상품명 우측 고정) ────────────────────────────────────────── */
      { key: 'orderQty',   label: '주문',   colGroup: '📦 수량', pin: 'left',
        colGroupBg: '#e8f5e9', colGroupColor: '#2e7d32', colGroupBorderColor: '#a5d6a7',
        thBg: '#daf5da', thColor: '#2e7d32', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;font-size:11px;color:#2e7d32;',
        fmt: (row) => row.orderQty || '' },
      { key: 'cancelQty',  label: '취소',   colGroup: '📦 수량', pin: 'left',
        thBg: '#daf5da', thColor: '#c62828', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;font-size:11px;color:#c62828;',
        fmt: (row) => row.cancelQty || '' },

      /* ── 🧾 상품기본정보 ────────────────────────────────────────────────── */
      { key: 'categoryNm', label: '카테고리', colGroup: '🧾 상품기본정보',
        colGroupBg: '#e3f2fd', colGroupColor: '#1565c0', colGroupBorderColor: '#90caf9',
        thBg: '#deeefb', width: 84,
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;font-size:11px;color:#666;text-align:left;',
        fmt: (row) => row.categoryNm || '-' },
      { key: 'brandNm',    label: '브랜드',   colGroup: '🧾 상품기본정보',
        thBg: '#deeefb', width: 76,
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;font-size:11px;text-align:left;',
        fmt: (row) => row.brandNm    || '-' },
      { key: 'vendorNm',   label: '판매업체', colGroup: '🧾 상품기본정보',
        thBg: '#deeefb', width: 84,
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;font-size:11px;text-align:left;',
        fmt: (row) => row.vendorNm   || '-' },
      { key: 'mdUserNm',   label: 'MD',       colGroup: '🧾 상품기본정보',
        thBg: '#deeefb', width: 64, align: 'center',
        fmt: (row) => row.mdUserNm   || '-' },

      /* ── 📊 진행상태 (od.01 상태표 order_item_status_cd 흐름: ORDERED→PAID→PREPARING→SHIPPING→DELIVERED→CONFIRMED, 종결 CANCELLED)
             뱃지 클릭 시 해당 행 주문 1건의 진행상태 칸반 팝오버(openStatusPopover) — 드래그로 실제 상태 변경 가능 ── */
      { key: '_stOrdered', label: '주문완료', colGroup: '📊 주문항목진행상태',
        colGroupBg: '#fff8e1', colGroupColor: '#e65100', colGroupBorderColor: '#ffca28',
        thBg: '#fffde7', width: 50,
        headerTip: '주문 접수 완료 · 무통장 입금대기 상태 (ORDERED / WAIT_DEPOSIT)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.orderItemStatusCd === 'ORDERED' || row.orderItemStatusCd === 'WAIT_DEPOSIT') ? { bg: '#2563eb', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row),
        /* 진행상태 8칸은 화면 전용 아이콘 뱃지라 엑셀엔 그대로 못 실음(BoExcelDownModal 규칙) —
           대표로 이 칸에 excelKeys 를 걸어 실제 텍스트 필드(orderItemStatusCdNm)로 1컬럼만 내보낸다. */
        excelKeys: [{ key: 'orderItemStatusCdNm', label: '진행상태' }] },
      { key: '_stPaid',    label: '결제완료', colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '결제 완료 상태 (PAID)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PAID'      ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_stPrep',    label: '준비중',   colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '상품 준비중 상태 (PREPARING)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PREPARING' ? { bg: '#c2410c', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_stShip',    label: '배송중',   colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '배송 중 상태 (SHIPPING)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'SHIPPING'  ? { bg: '#1d4ed8', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_stDliv',    label: '배송완료', colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 50,
        headerTip: '배송 완료 상태 (DELIVERED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_DELIVERED.includes(row.orderItemStatusCd) ? { bg: '#0f766e', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_stBuyConf', label: '구매확정', colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 50,
        headerTip: '구매확정 완료 상태 (CONFIRMED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_stCancelled', label: '취소',   colGroup: '📊 주문항목진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '주문 취소 상태 (CANCELLED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'CANCELLED' ? { bg: '#dc2626', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },

      /* ── ⚠️ 클레임 (뱃지 클릭 시 진행상태와 동일하게 해당 행 주문 1건 칸반 팝오버 — 클레임 보드도 함께 표시됨) ── */
      { key: '_claimActive', label: '클레임중',  colGroup: '⚠️ 클레임',
        colGroupBg: '#fce4ec', colGroupColor: '#c62828', colGroupBorderColor: '#f48fb1',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#c07030', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_claimDone',   label: '클레임완료', colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#757575', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },
      { key: '_refund',      label: '환불완료',   colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.refundCompltYn === 'Y' ? { bg: '#dc2626', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row) => openStatusPopover(row) },

      /* ── 🎁 프로모션 (pm_discnt_usage/pm_coupon_usage/pm_save_usage + pm_gift, order_item_id 상관)
             할인/쿠폰: 1행 이름(🔍 아이콘 포함)+2행 금액. 적립금: 사용액이 아니라 구매확정 후 적립
             예정액(save_schd_amt, 미래시점)이라 "(완료후) +N" 형식으로 별도 표기.
             이름 우측 🔍 아이콘 클릭 시 openPromoModal — 적용내역 + 금액계산 정보를 한 모달에서 확인 ── */
      { key: 'discntUsageNm', label: '할인', colGroup: '🎁 프로모션',
        colGroupBg: '#fff3e0', colGroupColor: '#e65100', colGroupBorderColor: '#ffcc80',
        thBg: '#fff8ee', thColor: '#e65100', width: 92,
        headerTip: '적용된 할인(주문할인/상품할인) — pm_discnt_usage', slot: true },
      { key: 'couponUsageNm', label: '쿠폰', colGroup: '🎁 프로모션',
        thBg: '#fff8ee', thColor: '#e65100', width: 92,
        headerTip: '적용된 쿠폰 — pm_coupon_usage', slot: true },
      { key: 'saveSchdAmt', label: '적립금', colGroup: '🎁 프로모션',
        thBg: '#fff8ee', thColor: '#e65100', width: 78,
        headerTip: '구매확정 후 적립 예정 — od_order_item.save_schd_amt', slot: true },
      { key: 'giftNm', label: '사은품', colGroup: '🎁 프로모션',
        thBg: '#fff8ee', thColor: '#e65100', width: 92,
        headerTip: '지급된 사은품 — pm_gift', slot: true },

      /* ── 💰 금액 ────────────────────────────────────────────────────────── */
      { key: 'itemOrderAmt',     label: '주문금액', colGroup: '💰 금액',
        colGroupBg: '#e8f5e9', colGroupColor: '#1b5e20', colGroupBorderColor: '#a5d6a7',
        thBg: '#daf5e9', thColor: '#1565c0', width: 80,
        headerTip: '주문금액 = 판매단가 × 주문수량 (unit_price × order_qty)',
        tdStyle: ()    => 'text-align:right;padding-right:6px;font-size:11px;color:#1565c0;font-weight:600;',
        titleFmt: () => '주문금액 = 판매단가 × 주문수량',
        fmt: (row) => row.itemOrderAmt     ? Number(row.itemOrderAmt).toLocaleString()     : '-' },
      { key: 'orgDiscountAmt',   label: '할인금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#c2410c', width: 75,
        headerTip: '할인금액 = 주문 확정 시점 스냅샷 할인액 (org_discount_amt)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.orgDiscountAmt ? 'color:#c2410c;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '할인금액 = 주문 확정 시점 할인 스냅샷',
        fmt: (row) => row.orgDiscountAmt ? Number(row.orgDiscountAmt).toLocaleString() : '-' },
      { key: 'itemCancelAmt',    label: '취소금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#dc2626', width: 75,
        headerTip: '취소금액 = 클레임(취소/반품) 누적 취소액',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.itemCancelAmt    ? 'color:#dc2626;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '취소금액 = 클레임(취소/반품) 누적 취소액',
        fmt: (row) => row.itemCancelAmt    ? Number(row.itemCancelAmt).toLocaleString()    : '-' },
      { key: 'itemCompletedAmt', label: '확정금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#15803d', width: 75,
        headerTip: '확정금액 = 주문금액 - 취소금액 (item_order_amt - item_cancel_amt)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.itemCompletedAmt ? 'color:#15803d;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '확정금액 = 주문금액 - 취소금액',
        fmt: (row) => row.itemCompletedAmt ? Number(row.itemCompletedAmt).toLocaleString() : '-' },
      { key: 'outboundShippingFee', label: '배송비', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#dc2626', width: 68,
        headerTip: '배송비 = 해당 항목의 출고 배송료 (부분배송 시 항목별 안분)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.outboundShippingFee ? 'color:#dc2626;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '배송비 = 해당 항목의 출고 배송료',
        fmt: (row) => row.outboundShippingFee ? Number(row.outboundShippingFee).toLocaleString() : '-' },

      /* ── 💵 정산금액 (st_settle_item 기준, 정산 처리 전 항목은 '-') ──────────────── */
      { key: 'settleSaleAmt',       label: '판매금액', colGroup: '💵 정산금액',
        colGroupBg: '#f3e5f5', colGroupColor: '#6a1b9a', colGroupBorderColor: '#ce93d8',
        thBg: '#ede7f6', thColor: '#1565c0', width: 76,
        headerTip: '판매금액 = 정산 항목 판매가 합계 (st_settle_item.item_price)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.settleSaleAmt ? 'color:#1565c0;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '판매금액 = 정산 항목 판매가 합계',
        fmt: (row) => row.settleSaleAmt ? Number(row.settleSaleAmt).toLocaleString() : '-' },
      { key: 'settleCommissionAmt', label: '플랫폼수수료', colGroup: '💵 정산금액',
        thBg: '#ede7f6', thColor: '#c2410c', width: 80,
        headerTip: '플랫폼수수료 = 판매금액 × 업체별 수수료율',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.settleCommissionAmt ? 'color:#c2410c;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '플랫폼수수료 = 판매금액 × 수수료율',
        fmt: (row) => row.settleCommissionAmt ? Number(row.settleCommissionAmt).toLocaleString() : '-' },
      { key: 'settleVendorAmt',     label: '판매자금액', colGroup: '💵 정산금액',
        thBg: '#ede7f6', thColor: '#15803d', width: 76,
        headerTip: '판매자금액 = 판매금액 - 플랫폼수수료 (업체 실지급액)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.settleVendorAmt ? 'color:#15803d;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '판매자금액 = 판매금액 - 플랫폼수수료',
        fmt: (row) => row.settleVendorAmt ? Number(row.settleVendorAmt).toLocaleString() : '-' },
      { key: '_settleShipFee',      label: '배송비', colGroup: '💵 정산금액',
        thBg: '#ede7f6', thColor: '#6a1b9a', width: 68,
        headerTip: '배송비(정산) = 업체 정산 시 가산되는 출고 배송료 (금액 그룹의 배송비와 동일 값)',
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.outboundShippingFee ? 'color:#6a1b9a;font-weight:600;' : 'color:#d8d8d8;'),
        titleFmt: () => '배송비(정산) = 정산 시 가산되는 출고 배송료',
        fmt: (row) => row.outboundShippingFee ? Number(row.outboundShippingFee).toLocaleString() : '-' },

      /* ── 📅 정산마감 (od_order_item.settle_yn/settle_date) ──────────────────────── */
      { key: '_settleStatus', label: '정산상태', colGroup: '📅 정산마감',
        colGroupBg: '#e0f2f1', colGroupColor: '#00695c', colGroupBorderColor: '#80cbc4',
        thBg: '#e0f2f1', thColor: '#00695c', width: 62,
        headerTip: '정산 마감 처리 여부 (od_order_item.settle_yn)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        badge: (row) => fnSettleBadgeCls(row), badgeLabel: (row) => fnSettleBadgeLbl(row) },
      { key: 'settleDate', label: '정산일', colGroup: '📅 정산마감',
        thBg: '#e0f2f1', thColor: '#00695c', width: 78,
        headerTip: '정산 마감 처리일시 (od_order_item.settle_date)',
        tdStyle: () => 'text-align:center;padding:1px 2px;font-size:10px;color:#555;',
        fmt: (row) => row.settleDate ? String(row.settleDate).substring(0, 10) : '-' },

      /* ── 📋 전표 ────────────────────────────────────────────────────────── */
      { key: '_vouchers', label: '발급 전표', colGroup: '📋 전표',
        colGroupBg: '#e8eaf6', colGroupColor: '#283593', colGroupBorderColor: '#9fa8da',
        thBg: '#e8eaf6', thColor: '#283593', width: 136,
        tdStyle: () => 'text-align:left;padding:4px 6px;vertical-align:middle;',
        slot: true },

      /* ── Fixed action ────────────────────────────────────────────────── */
      { key: '_actions', label: '작업', width: 56, align: 'center', slot: true, pin: 'right' },
          { key: 'siteNm', label: '사이트' },
    ];

    columns.baseSearch = [
      { key: 'memberId',  type: 'pick', label: '회원', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('pick-member-open'), onClear: () => handleBtnAction('pick-member-clear') },
      { key: 'orderId',   type: 'pick', label: '주문', nameKey: 'orderId',
        display: (p) => p.orderId, placeholder: '주문 선택',
        onOpen: () => handleBtnAction('pick-order-open'),  onClear: () => handleBtnAction('pick-order-clear') },
      { key: 'vendorId',  type: 'pick', label: '판매업체', nameKey: 'vendorNm',
        display: (p) => p.vendorNm || p.vendorId, placeholder: '업체 선택',
        onOpen: () => handleBtnAction('pick-vendor-open'), onClear: () => handleBtnAction('pick-vendor-clear') },
      { key: 'brandId', type: 'pick', label: '브랜드', nameKey: 'brandNm',
        placeholder: '브랜드명 입력',
        onOpen: () => handleBtnAction('pick-brand-open'), onClear: () => handleBtnAction('pick-brand-clear') },
      { key: 'mdUserId',  type: 'pick', label: 'MD', nameKey: 'mdUserNm',
        display: (p) => p.mdUserNm || p.mdUserId, placeholder: 'MD 선택',
        onOpen: () => handleBtnAction('pick-md-open'),     onClear: () => handleBtnAction('pick-md-clear') },
      { key: 'dlivCourierCd', type: 'select', label: '배송사',
        options: () => codes.couriers, nullLabel: '전체' },
      { key: 'orderItemStatusCds', type: 'multiCheck', label: '주문항목상태',
        options: () => codes.order_item_statuses, placeholder: '전체', allLabel: '전체 선택' },
      { key: '_claimCombo', type: 'slot', name: 'claimCombo' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [{ value: 'prodNm', label: '상품명' }, { value: 'brandNm', label: '브랜드명' }],
        placeholder: '전체', allLabel: '전체 선택', minWidth: '112px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '180px' },
      { key: '_dateRange', type: 'dateRange',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.od_date_types, dateWidth: '136px',
        rangeOptions: () => window.boUtil.bofDateRangeOptions,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    /* ##### [07] return ########################################################## */

    return {
      columns, items, listGridPager, searchParam, uiState, codes, detailPanel, picks,
      cfSummary, cfSummaryGridRow, cfDisplayRows, toggleGroup,
      handleBtnAction, handleSelectAction, handleRowClick, handleRowEdit,
      fnClaimStatusOpts, fnClaimTypeOpts, fnClaimCellValid,
      fnSettleBadgeCls, fnSettleBadgeLbl, fnVoucherBadge, fnVoucherLbl,
      fnErpVoucherBadge, fnErpVoucherLbl, fnErpVoucherTypeNm,
      fnCallbackModal,
      promoModal, openPromoModal, closePromoModal,
      openOrderDtlPop, openOrderPromoPop,
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
    };
  },
  template: `
<bo-page title="주문항목관리" :share-query="searchParam">

  <!-- ===== ■. 검색 ============================================================ -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :max-rows="2"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #claimCombo>
        <div class="search-field">
          <label class="search-label">클레임상세</label>
          <bo-combo-matrix-select v-model="searchParam.claimCombos"
            :row-options="fnClaimStatusOpts()" :col-options="fnClaimTypeOpts()"
            :cell-valid="fnClaimCellValid" min-width="120px" />
        </div>
      </template>
    </bo-search-area>
  </bo-container>

  <!-- ===== ■. 목록 =========================================================== -->
  <bo-container title="주문항목 목록" :count-text="'총 ' + listGridPager.pageTotalCount.toLocaleString() + '건'">
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
    </template>
    <bo-group-table
      :columns="columns.listGrid"
      :rows="cfDisplayRows"
      row-key="orderItemId"
      :selected-key="detailPanel.selectedOrderItemId"
      max-height="calc(100vh - 360px)"
      table-style="min-width:2200px;table-layout:fixed;width:100%;"
      :loading="uiState.loading"
      :summary-row="cfSummaryGridRow"
      summary-pos="top"
      summary-label="tot"
      summary-bg="#1e2f4a"
      summary-border-color="#2563eb"
      summary-text-color="#e8f4ff"
      col-border="1px solid #e2e8f0"
      @cell-click="e => handleRowClick(e.row)">

      <template #cell-_rowNum="{ row }">
        <span style="color:#999;font-size:11px;">{{ (listGridPager.pageNo - 1) * listGridPager.pageSize + row._displayIdx + 1 }}</span>
      </template>

      <template #cell-orderItemId="{ row }">
        <div style="text-align:center;line-height:1.35;">
          <div style="font-family:monospace;font-size:10px;color:#777;">{{ row.orderItemId ? row.orderItemId.substring(0, 12) + '..' : '-' }}</div>
          <div style="font-family:monospace;font-size:9px;" :style="detailPanel.selectedOrderId === row.orderId ? 'color:#e8587a;font-weight:700;' : 'color:#aaa;'">{{ row.orderId ? row.orderId.substring(0, 12) + '..' : '-' }}</div>
        </div>
      </template>

      <template #group-header="{ row }">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#dbe5f7;border-top:1px solid #bccdea;border-bottom:1px solid #bccdea;cursor:pointer;"
          @click="toggleGroup(row.orderId)">
          <span style="font-size:11px;color:#64748b;width:14px;display:inline-block;text-align:center;">{{ row.collapsed ? '▶' : '▼' }}</span>
          <span style="font-size:12px;font-weight:700;color:#334155;font-family:monospace;">{{ row.orderId }}</span>
          <span style="font-size:12px;color:#555;">{{ row.memberNm || '-' }}</span>
          <span style="font-size:11px;color:#94a3b8;">{{ row.itemCount }}건</span>
          <span style="display:flex;gap:4px;" @click.stop>
            <button type="button" class="btn btn-secondary btn-xs" @click="openOrderDtlPop(row.orderId)">주문상세</button>
            <button type="button" class="btn btn-secondary btn-xs" @click="openOrderPromoPop(row.orderId)">프로모션상세</button>
          </span>
        </div>
      </template>

      <template #cell-prodNm="{ row }">
        <div style="overflow:hidden;padding:0 6px;max-width:100%;">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;" :title="row.prodNm || ''">{{ row.prodNm || '-' }}</div>
          <div v-if="row.prodOptNm1" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;font-size:10px;color:#888;">
            [{{ row.prodOptNm1 }}{{ row.prodOptNm2 ? '/' + row.prodOptNm2 : '' }}]
          </div>
        </div>
      </template>

      <template #cell-discntUsageNm="{ row }">
        <div v-if="row.discntUsageCount" style="padding:0 4px;overflow:hidden;line-height:1.3;">
          <div style="display:flex;align-items:center;gap:2px;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#e65100;flex:1;"
              :title="row.discntUsageNm || row.discntUsageTopId || ''">{{ row.discntUsageNm || row.discntUsageTopId || '-' }}</span>
            <button type="button" title="적용된 할인 보기"
              style="border:none;background:none;padding:0;margin-left:1px;font-size:8px;line-height:1;color:#999;cursor:pointer;flex-shrink:0;"
              @click.stop="openPromoModal(row)">🔍</button>
          </div>
          <div style="font-size:9px;color:#c2410c;">{{ '-' + Number(row.discntUsageAmt || 0).toLocaleString() + '원' }}</div>
        </div>
        <span v-else style="color:#d8d8d8;font-size:13px;">-</span>
      </template>

      <template #cell-couponUsageNm="{ row }">
        <div v-if="row.couponUsageCount" style="padding:0 4px;overflow:hidden;line-height:1.3;">
          <div style="display:flex;align-items:center;gap:2px;">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#e65100;flex:1;"
              :title="row.couponUsageNm || row.couponUsageTopId || ''">{{ row.couponUsageNm || row.couponUsageTopId || '-' }}</span>
            <button type="button" title="적용된 쿠폰 보기"
              style="border:none;background:none;padding:0;margin-left:1px;font-size:8px;line-height:1;color:#999;cursor:pointer;flex-shrink:0;"
              @click.stop="openPromoModal(row)">🔍</button>
          </div>
          <div style="font-size:9px;color:#c2410c;">{{ '-' + Number(row.couponUsageAmt || 0).toLocaleString() + '원' }}</div>
        </div>
        <span v-else style="color:#d8d8d8;font-size:13px;">-</span>
      </template>

      <template #cell-saveSchdAmt="{ row }">
        <div v-if="row.saveSchdAmt" style="display:flex;align-items:center;justify-content:flex-end;gap:2px;padding:0 4px;overflow:hidden;">
          <span style="font-size:9px;color:#6a1b9a;" title="구매확정 후 적립 예정 금액">{{ '(완료후) +' + Number(row.saveSchdAmt).toLocaleString() }}</span>
          <button type="button" title="적립금 내역 보기"
            style="border:none;background:none;padding:0;margin-left:1px;font-size:8px;line-height:1;color:#999;cursor:pointer;flex-shrink:0;"
            @click.stop="openPromoModal(row)">🔍</button>
        </div>
        <span v-else style="color:#d8d8d8;font-size:13px;">-</span>
      </template>

      <template #cell-giftNm="{ row }">
        <div v-if="row.giftId" style="display:flex;align-items:center;gap:2px;padding:0 4px;overflow:hidden;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#e65100;flex:1;"
            :title="row.giftNm || row.giftId || ''">{{ row.giftNm || row.giftId || '-' }}</span>
          <button type="button" title="지급된 사은품 보기"
            style="border:none;background:none;padding:0;margin-left:1px;font-size:8px;line-height:1;color:#999;cursor:pointer;flex-shrink:0;"
            @click.stop="openPromoModal(row)">🔍</button>
        </div>
        <span v-else style="color:#d8d8d8;font-size:13px;">-</span>
      </template>

      <template #cell-_vouchers="{ row }">
        <template v-if="row.erpVouchers ? row.erpVouchers.length : false">
          <div v-for="v in row.erpVouchers" :key="v.typeCd"
            style="display:flex;align-items:center;gap:3px;margin-bottom:2px;white-space:nowrap;">
            <span style="font-size:9px;color:#555;font-family:monospace;min-width:20px;">{{ fnErpVoucherTypeNm(v.typeCd) }}</span>
            <span :class="'badge ' + fnErpVoucherBadge(v.statusCd)" style="font-size:9px;padding:0 3px;">{{ fnErpVoucherLbl(v.statusCd) }}</span>
            <span v-if="v.voucherNo" style="font-size:9px;color:#777;font-family:monospace;">{{ v.voucherNo.substring(0, 8) }}</span>
          </div>
        </template>
        <span v-else-if="row.voucherStatusCd" :class="'badge ' + fnVoucherBadge(row.voucherStatusCd)" style="font-size:10px;">{{ fnVoucherLbl(row.voucherStatusCd) }}</span>
        <span v-else style="color:#d8d8d8;font-size:13px;">·</span>
      </template>

      <template #cell-_actions="{ row }">
        <div class="actions" @click.stop>
          <button class="btn btn_row_edit" @click.stop="handleRowEdit(row)">수정</button>
        </div>
      </template>

    </bo-group-table>
    <bo-pager v-if="listGridPager.pageTotalCount > 0" :pager="listGridPager"
      :on-set-page="n => handleBtnAction('items-pager-setPage', n)"
      :on-size-change="() => handleSelectAction('items-pager-sizeChange')" />
    <bo-excel-down-modal :show="excelModal.show" domain="odOrderItem" area-nm="주문항목"
      :columns="columns.listGrid" ui-nm="주문항목관리" :params="buildExcelParams()"
      @close="excelModal.show = false" />
  </bo-container>

  <!-- ===== ■. 선택 팝업 ======================================================= -->
  <bo-cm-popup-modal popup-cmd="cmPopup-member-pick" popup-code="member" :show="picks.member" :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-order-pick"  popup-code="order"  :show="picks.order"  :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :show="picks.vendor" :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-brand-pick"  popup-code="brand"  :show="picks.brand"  :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-md-pick"     popup-code="user"   :show="picks.md"     :on-callback="fnCallbackModal" />

  <!-- ===== ■. 프로모션 상세 모달 (할인/쿠폰/적립금/사은품 🔍 아이콘 공용) ======================= -->
  <bo-modal :show="promoModal.show" title="적용된 프로모션 상세" width="720px" @close="closePromoModal">
    <div v-if="promoModal.row">
      <div style="font-size:13px;color:#333;margin-bottom:10px;">
        <b>{{ promoModal.row.prodNm || '-' }}</b>
        <span style="color:#999;font-size:11px;margin-left:6px;">#{{ promoModal.row.orderItemId }}</span>
      </div>

      <div class="card" style="padding:10px 14px;margin-bottom:12px;background:#fafafa;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">금액계산</div>
        <div style="display:flex;flex-direction:column;gap:3px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;">
            <span>주문금액</span><span>{{ Number(promoModal.row.itemOrderAmt || 0).toLocaleString() }}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#c2410c;">
            <span>- 할인 적용액</span><span>{{ Number(promoModal.row.discntUsageAmt || 0).toLocaleString() }}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#c2410c;">
            <span>- 쿠폰 할인액</span><span>{{ Number(promoModal.row.couponUsageAmt || 0).toLocaleString() }}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #e0e0e0;padding-top:4px;font-weight:700;color:#15803d;">
            <span>= 확정금액</span><span>{{ Number(promoModal.row.itemCompletedAmt || 0).toLocaleString() }}원</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#6a1b9a;margin-top:4px;">
            <span>적립금 사용 (별도 결제수단, 상품금액 계산과 무관)</span><span>{{ Number(promoModal.row.saveUsageAmt || 0).toLocaleString() }}원</span>
          </div>
        </div>
      </div>

      <div v-if="promoModal.loading" style="text-align:center;padding:20px;color:#999;">불러오는 중...</div>
      <template v-else>
        <div style="margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:4px;">할인 ({{ promoModal.discounts.length }}건)</div>
          <table v-if="promoModal.discounts.length" class="admin-table" style="font-size:11px;">
            <thead><tr><th>할인명</th><th>유형</th><th>값</th><th>할인금액</th><th>적용일시</th></tr></thead>
            <tbody>
              <tr v-for="d in promoModal.discounts" :key="d.discntUsageId">
                <td>{{ d.discntNm || d.discntId }}</td>
                <td style="text-align:center;">{{ d.discntTypeCd || '-' }}</td>
                <td style="text-align:right;">{{ d.discntValue != null ? d.discntValue : '-' }}</td>
                <td style="text-align:right;">{{ Number(d.discntAmt || 0).toLocaleString() }}원</td>
                <td style="text-align:center;">{{ d.usedDate ? String(d.usedDate).substring(0, 16).replace('T', ' ') : '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="color:#bbb;font-size:11px;">적용된 할인 없음</div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:4px;">쿠폰 ({{ promoModal.coupons.length }}건)</div>
          <table v-if="promoModal.coupons.length" class="admin-table" style="font-size:11px;">
            <thead><tr><th>쿠폰명</th><th>코드</th><th>할인금액</th><th>사용일시</th></tr></thead>
            <tbody>
              <tr v-for="c in promoModal.coupons" :key="c.couponUsageId">
                <td>{{ c.couponNm || c.couponId }}</td>
                <td style="font-family:monospace;">{{ c.couponCode || '-' }}</td>
                <td style="text-align:right;">{{ Number(c.discountAmt || 0).toLocaleString() }}원</td>
                <td style="text-align:center;">{{ c.usedDate ? String(c.usedDate).substring(0, 16).replace('T', ' ') : '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="color:#bbb;font-size:11px;">적용된 쿠폰 없음</div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:4px;">적립금 사용 ({{ promoModal.saves.length }}건)</div>
          <table v-if="promoModal.saves.length" class="admin-table" style="font-size:11px;">
            <thead><tr><th>사용금액</th><th>사용 후 잔액</th><th>사용일시</th></tr></thead>
            <tbody>
              <tr v-for="s in promoModal.saves" :key="s.saveUsageId">
                <td style="text-align:right;">{{ Number(s.useAmt || 0).toLocaleString() }}원</td>
                <td style="text-align:right;">{{ Number(s.balanceAmt || 0).toLocaleString() }}원</td>
                <td style="text-align:center;">{{ s.usedDate ? String(s.usedDate).substring(0, 16).replace('T', ' ') : '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else style="color:#bbb;font-size:11px;">적립금 사용 내역 없음</div>
        </div>

        <div>
          <div style="font-size:12px;font-weight:700;color:#e65100;margin-bottom:4px;">사은품</div>
          <div v-if="promoModal.row.giftId" style="font-size:12px;">
            {{ promoModal.row.giftNm || promoModal.row.giftId }}
            <span style="color:#999;font-size:10px;margin-left:6px;">#{{ promoModal.row.giftId }}</span>
          </div>
          <div v-else style="color:#bbb;font-size:11px;">지급된 사은품 없음</div>
        </div>
      </template>
    </div>
  </bo-modal>
</bo-page>
`
};
