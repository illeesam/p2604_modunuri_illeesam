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

    const { reactive, computed, ref, onMounted, onBeforeUnmount } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm || props.showConfirm;

    /* statusPopover — 진행상태/클레임 뱃지 클릭 시 클릭 행의 주문 1건에 대한 칸반 팝오버 (od-order-kanban 재사용)
     *   전체화면 오버레이로 막지 않고 "바깥 클릭 감지"(document 리스너)로 닫는다 — 오버레이 방식은
     *   다른 뱃지 클릭까지 가로채서 "다른 진행상태 클릭하면 팝오버가 닫히기만 함" 버그가 났었다.
     *   뱃지 클릭 핸들러(handleBadgeClick, BoAreaComp.js)가 이미 stopPropagation 하므로, 뱃지를 눌러
     *   바로 다른 주문으로 전환할 때는 이 바깥클릭 리스너가 아예 발동하지 않고 openStatusPopover 만 실행된다. */
    const statusPopover = reactive({ show: false, orderId: null, orderItemId: null, top: 0, left: 0 });
    const statusPopoverPanelRef = ref(null);
    const openStatusPopover = (row, e) => {
      /* position:fixed 패널이라 뷰포트 기준 좌표 그대로 사용(스크롤 오프셋 더하지 않음) */
      const rect = e.currentTarget.getBoundingClientRect();
      statusPopover.top = Math.min(rect.bottom + 6, window.innerHeight - 100);
      statusPopover.left = Math.min(rect.left, window.innerWidth - 960);
      statusPopover.orderId = row.orderId;
      statusPopover.orderItemId = row.orderItemId;
      statusPopover.show = true;
    };
    /* closeStatusPopover — 팝오버 닫기. 칸반 드래그로 실제 상태가 바뀌었을 수 있으므로 목록 재조회.
     *   팝오버가 열려있는 동안의 강조(cfGridSelectedKey)는 statusPopover.orderItemId 기준이었는데,
     *   닫히면서 show=false 가 되면 그 강조가 바로 detailPanel.selectedOrderItemId 로 넘어가야
     *   재조회 후에도 "방금 다루던 행"이 계속 선택 상태로 남는다 — 그래서 여기서 넘겨준다. */
    const closeStatusPopover = () => {
      if (statusPopover.orderItemId) {
        detailPanel.selectedOrderItemId = statusPopover.orderItemId;
        detailPanel.selectedOrderId     = statusPopover.orderId;
        detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++;
      }
      statusPopover.show = false;
      handleSearchList();
    };
    /* onDocClickForPopover — 팝오버 바깥 클릭 시 닫기. 뱃지 클릭은 stopPropagation 되어 여기 도달하지 않음 */
    const onDocClickForPopover = (e) => {
      if (!statusPopover.show) { return; }
      if (statusPopoverPanelRef.value && statusPopoverPanelRef.value.contains(e.target)) { return; }
      closeStatusPopover();
    };
    onMounted(() => { document.addEventListener('click', onDocClickForPopover); });
    onBeforeUnmount(() => { document.removeEventListener('click', onDocClickForPopover); });

    const items = reactive([]);
    const listGridPager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [20, 50, 100, 200] });
    const uiState = reactive({ loading: false });
    const codes = reactive({ order_item_statuses: [], od_date_types: [], couriers: [] });

    const searchParam = reactive({
      orderId: '', memberId: '', memberNm: '',
      vendorId: '', vendorNm: '', brandId: '', brandNm: '',
      mdUserId: '', mdUserNm: '', dlivCourierCd: '',
      orderItemStatusCds: '', claimYn: '',
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

    const handleRowClick = (row) => {
      detailPanel.selectedOrderItemId = row.orderItemId;
      detailPanel.selectedOrderId     = row.orderId;
      detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++;
    };

    const handleRowEdit = (row) => {
      detailPanel.selectedOrderItemId = row.orderItemId;
      detailPanel.selectedOrderId     = row.orderId;
      detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++;
    };

    /* ##### [03] 인라인 Dtl 헬퍼 #################################################### */

    const resetDetailToNew = () => {
      detailPanel.selectedOrderItemId = null; detailPanel.selectedOrderId = null;
      detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.resetSeq++;
    };

    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng')       { if (opts.reload) handleSearchList(); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__')   { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const cfDetailKey = computed(() => `${detailPanel.selectedOrderItemId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    /* cfGridSelectedKey — 진행상태 팝오버가 열려있는 동안은 그 행(orderItemId 기준)을 우선 강조.
       orderItemId 로 매칭하므로 목록이 재조회되어 items 배열이 통째로 교체돼도 강조가 유지된다. */
    const cfGridSelectedKey = computed(() => statusPopover.show ? statusPopover.orderItemId : detailPanel.selectedOrderItemId);

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
    const STS_CLM_TYPE  = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };

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
      let amtSettleSale = 0, amtSettleCommission = 0, amtSettleVendor = 0;
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

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize,
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
          ...(searchParam.claimYn           && { claimYn:           searchParam.claimYn }),
          ...(searchParam.searchType        && { searchType:        searchParam.searchType }),
          ...(searchParam.searchValue       && { searchValue:       searchParam.searchValue }),
          ...(searchParam.dateRangeType     && { dateRangeType:     searchParam.dateRangeType }),
          ...(searchParam.dateRangeStart    && { dateRangeStart:    searchParam.dateRangeStart }),
          ...(searchParam.dateRangeEnd      && { dateRangeEnd:      searchParam.dateRangeEnd }),
        };
        if (params.searchValue && !params.searchType) params.searchType = 'prodNm,brandNm';
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
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS_CD', 'ORDER_ITEM_DATE_TYPE', 'COURIER'], { compNm: 'OdOrderItemMng' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS_CD');
        codes.od_date_types       = codeStore.sgGetGrpCodes('ORDER_ITEM_DATE_TYPE');
        codes.couriers            = codeStore.sgGetGrpCodes('COURIER');
      } catch (_) {}
    };

    const initPage = async () => { await fnLoadCodes(); Object.assign(searchParamInit, searchParam); await handleSearchList(); };

    onMounted(() => { initPage(); });

    /* ##### [05-1] 템플릿 헬퍼 (&&를 속성값에서 제거) ################################# */

    const fnClmActiveStyle = (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? 'color:#c07030;font-weight:700;' : 'color:#e0e0e0;';
    const fnClmDoneStyle   = (row) => (row.claimYn === 'Y' &&  STS_CLM_DONE.includes(row.claimStatusCd || '')) ? 'color:#757575;font-weight:700;' : 'color:#e0e0e0;';
    const fnClmActiveText  = (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? (STS_CLM_TYPE[row.claimTypeCd] || '진행') : '·';
    const fnClmDoneText    = (row) => (row.claimYn === 'Y' &&  STS_CLM_DONE.includes(row.claimStatusCd || '')) ? (STS_CLM_TYPE[row.claimTypeCd] || '완료') : '·';

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
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => ({ bg: '#16a34a', color: '#fff', value: row.orderQty || 1 }) },
      { key: 'cancelQty',  label: '취소',   colGroup: '📦 수량', pin: 'left',
        thBg: '#daf5da', thColor: '#c62828', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.cancelQty ? { bg: '#dc2626', color: '#fff', value: row.cancelQty } : null },

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
      { key: '_stOrdered', label: '주문완료', colGroup: '📊 진행상태',
        colGroupBg: '#fff8e1', colGroupColor: '#e65100', colGroupBorderColor: '#ffca28',
        thBg: '#fffde7', width: 50,
        headerTip: '주문 접수 완료 · 무통장 입금대기 상태 (ORDERED / WAIT_DEPOSIT)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.orderItemStatusCd === 'ORDERED' || row.orderItemStatusCd === 'WAIT_DEPOSIT') ? { bg: '#2563eb', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stPaid',    label: '결제완료', colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '결제 완료 상태 (PAID)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PAID'      ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stPrep',    label: '준비중',   colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '상품 준비중 상태 (PREPARING)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PREPARING' ? { bg: '#c2410c', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stShip',    label: '배송중',   colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '배송 중 상태 (SHIPPING)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'SHIPPING'  ? { bg: '#1d4ed8', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stDliv',    label: '배송완료', colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 50,
        headerTip: '배송 완료 상태 (DELIVERED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_DELIVERED.includes(row.orderItemStatusCd) ? { bg: '#0f766e', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stBuyConf', label: '구매확정', colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 50,
        headerTip: '구매확정 완료 상태 (CONFIRMED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_stCancelled', label: '취소',   colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        headerTip: '주문 취소 상태 (CANCELLED)',
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'CANCELLED' ? { bg: '#dc2626', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },

      /* ── ⚠️ 클레임 (뱃지 클릭 시 진행상태와 동일하게 해당 행 주문 1건 칸반 팝오버 — 클레임 보드도 함께 표시됨) ── */
      { key: '_claimActive', label: '클레임중',  colGroup: '⚠️ 클레임',
        colGroupBg: '#fce4ec', colGroupColor: '#c62828', colGroupBorderColor: '#f48fb1',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#c07030', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_claimDone',   label: '클레임완료', colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#757575', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },
      { key: '_refund',      label: '환불완료',   colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.refundCompltYn === 'Y' ? { bg: '#dc2626', color: '#fff', value: row.orderQty || 1 } : null,
        onBadgeClick: (row, col, e) => openStatusPopover(row, e) },

      /* ── 💰 금액 ────────────────────────────────────────────────────────── */
      { key: 'itemOrderAmt',     label: '주문금액', colGroup: '💰 금액',
        colGroupBg: '#e8f5e9', colGroupColor: '#1b5e20', colGroupBorderColor: '#a5d6a7',
        thBg: '#daf5e9', thColor: '#1565c0', width: 80,
        tdStyle: ()    => 'text-align:right;padding-right:6px;font-size:11px;color:#1565c0;font-weight:600;',
        fmt: (row) => row.itemOrderAmt     ? Number(row.itemOrderAmt).toLocaleString()     : '-' },
      { key: 'orgDiscountAmt',   label: '할인금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#c2410c', width: 75,
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.orgDiscountAmt ? 'color:#c2410c;font-weight:600;' : 'color:#d8d8d8;'),
        fmt: (row) => row.orgDiscountAmt ? Number(row.orgDiscountAmt).toLocaleString() : '-' },
      { key: 'itemCancelAmt',    label: '취소금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#dc2626', width: 75,
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.itemCancelAmt    ? 'color:#dc2626;font-weight:600;' : 'color:#d8d8d8;'),
        fmt: (row) => row.itemCancelAmt    ? Number(row.itemCancelAmt).toLocaleString()    : '-' },
      { key: 'itemCompletedAmt', label: '확정금액', colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#15803d', width: 75,
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.itemCompletedAmt ? 'color:#15803d;font-weight:600;' : 'color:#d8d8d8;'),
        fmt: (row) => row.itemCompletedAmt ? Number(row.itemCompletedAmt).toLocaleString() : '-' },
      { key: 'dlivAmt',          label: '배송비',   colGroup: '💰 금액',
        thBg: '#daf5e9', thColor: '#dc2626', width: 68,
        tdStyle: (row) => 'text-align:right;padding-right:6px;font-size:11px;' + (row.dlivAmt ? 'color:#dc2626;font-weight:600;' : 'color:#d8d8d8;'),
        fmt: (row) => row.dlivAmt ? Number(row.dlivAmt).toLocaleString() : '-' },

      /* ── 🧾 정산 ────────────────────────────────────────────────────────── */
      { key: '_settleDliv',  label: '배송비정산', colGroup: '🧾 정산',
        colGroupBg: '#f3e5f5', colGroupColor: '#6a1b9a', colGroupBorderColor: '#ce93d8',
        thBg: '#ede7f6', thColor: '#6a1b9a', width: 64, slot: true },
      { key: '_settleOrder', label: '주문정산',   colGroup: '🧾 정산',
        thBg: '#ede7f6', thColor: '#6a1b9a', width: 64, slot: true },

      /* ── 📋 전표 ────────────────────────────────────────────────────────── */
      { key: '_vouchers', label: '발급 전표', colGroup: '📋 전표',
        colGroupBg: '#e8eaf6', colGroupColor: '#283593', colGroupBorderColor: '#9fa8da',
        thBg: '#e8eaf6', thColor: '#283593', width: 136,
        tdStyle: () => 'text-align:left;padding:4px 6px;vertical-align:middle;',
        slot: true },

      /* ── Fixed action ────────────────────────────────────────────────── */
      { key: '_actions', label: '작업', width: 56, align: 'center', slot: true, pin: 'right' },
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
        options: () => codes.couriers, nullLabel: '배송사 전체' },
      { key: 'orderItemStatusCds', type: 'multiCheck', label: '품목상태',
        options: () => codes.order_item_statuses, placeholder: '상태 전체', allLabel: '전체 선택' },
      { key: 'claimYn', type: 'select', label: '클레임',
        options: [{ value: 'Y', label: '클레임 있음' }, { value: 'N', label: '클레임 없음' }], nullLabel: '전체' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [{ value: 'prodNm', label: '상품명' }, { value: 'brandNm', label: '브랜드명' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '112px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '180px' },
      { key: '_dateRange', type: 'dateRange',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.od_date_types, dateWidth: '136px',
        rangeOptions: () => window.boUtil.bofDateRangeOptions,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    /* ##### [07] return ########################################################## */

    return {
      columns, items, listGridPager, searchParam, uiState, codes, detailPanel, picks,
      cfSummary, cfSummaryGridRow, cfDetailKey, cfGridSelectedKey, cfDisplayRows, toggleGroup,
      handleBtnAction, handleSelectAction, handleRowClick, handleRowEdit,
      fnSettleBadgeCls, fnSettleBadgeLbl, fnVoucherBadge, fnVoucherLbl,
      fnErpVoucherBadge, fnErpVoucherLbl, fnErpVoucherTypeNm,
      inlineNavigate, fnCallbackModal,
      statusPopover, closeStatusPopover, showToast, showConfirm,
    };
  },
  template: `
<bo-page title="주문항목관리">

  <!-- ===== ■. 검색 ============================================================ -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :max-rows="2"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
    </bo-search-area>
  </bo-container>

  <!-- ===== ■. 목록 =========================================================== -->
  <bo-container title="주문항목 목록" :count-text="'총 ' + listGridPager.pageTotalCount.toLocaleString() + '건'">
    <bo-group-table
      :columns="columns.listGrid"
      :rows="cfDisplayRows"
      row-key="orderItemId"
      :selected-key="cfGridSelectedKey"
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
        <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#eef2f9;border-top:1px solid #dbe3ef;border-bottom:1px solid #dbe3ef;cursor:pointer;"
          @click="toggleGroup(row.orderId)">
          <span style="font-size:11px;color:#64748b;width:14px;display:inline-block;text-align:center;">{{ row.collapsed ? '▶' : '▼' }}</span>
          <span style="font-size:12px;font-weight:700;color:#334155;font-family:monospace;">{{ row.orderId }}</span>
          <span style="font-size:12px;color:#555;">{{ row.memberNm || '-' }}</span>
          <span style="font-size:11px;color:#94a3b8;">{{ row.itemCount }}건</span>
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

      <template #cell-_settleDliv="{ row }">
        <span v-if="row.dlivAmt" :class="'badge ' + fnSettleBadgeCls(row)" style="font-size:10px;display:block;">{{ fnSettleBadgeLbl(row) }}</span>
        <span v-else style="color:#d8d8d8;font-size:13px;">·</span>
      </template>

      <template #cell-_settleOrder="{ row }">
        <span :class="'badge ' + fnSettleBadgeCls(row)" style="font-size:10px;display:block;margin-bottom:1px;">{{ fnSettleBadgeLbl(row) }}</span>
        <div v-if="row.settleAmt" style="font-size:10px;color:#6a1b9a;font-weight:600;">{{ Number(row.settleAmt).toLocaleString() }}</div>
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
  </bo-container>

  <!-- ===== ■. 하단 상세 (항상 표시) =========================================== -->
  <od-order-item-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="detailPanel.selectedOrderItemId"
    :dtl-mode="detailPanel.openMode"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />

  <!-- ===== ■. 선택 팝업 ======================================================= -->
  <bo-cm-popup-modal popup-cmd="cmPopup-member-pick" popup-code="member" :show="picks.member" :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-order-pick"  popup-code="order"  :show="picks.order"  :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-vendor-pick" popup-code="vendor" :show="picks.vendor" :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-brand-pick"  popup-code="brand"  :show="picks.brand"  :on-callback="fnCallbackModal" />
  <bo-cm-popup-modal popup-cmd="cmPopup-md-pick"     popup-code="user"   :show="picks.md"     :on-callback="fnCallbackModal" />

  <!-- ===== ■. 진행상태 뱃지 클릭 팝오버 (클릭 행의 주문 1건 칸반, 드래그로 실제 상태변경) ===== -->
  <div v-if="statusPopover.show" ref="statusPopoverPanelRef"
    style="position:fixed;z-index:1200;box-shadow:0 12px 36px rgba(0,0,0,.22);border-radius:12px;max-width:960px;width:calc(100vw - 32px);max-height:70vh;overflow:auto;"
    :style="{ top: statusPopover.top + 'px', left: statusPopover.left + 'px' }">
    <od-order-kanban v-if="statusPopover.orderId"
      :key="statusPopover.orderId"
      :order-id="statusPopover.orderId" :order-item-id="statusPopover.orderItemId"
      mode="bo" as-modal :on-close="closeStatusPopover"
      :show-toast="showToast" :show-confirm="showConfirm" />
  </div>
</bo-page>
`
};
