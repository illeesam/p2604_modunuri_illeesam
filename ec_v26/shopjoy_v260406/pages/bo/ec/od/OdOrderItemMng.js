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

    const { reactive, computed, onMounted } = Vue;
    const showToast = window.boApp?.showToast || props.showToast;

    const items = reactive([]);
    const listGridPager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [20, 50, 100, 200] });
    const uiState = reactive({ loading: false });
    const codes = reactive({ order_item_statuses: [], od_date_types: [], couriers: [] });

    const searchParam = reactive({
      orderId: '', memberId: '', memberNm: '',
      vendorId: '', vendorNm: '', brandId: '', brandNm: '',
      mdUserId: '', mdUserNm: '', courierCd: '',
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
        searchParam.memberId = result.memberId || ''; searchParam.memberNm = result.memberNm || result.loginId || result.memberId || ''; picks.member = false;
      } else if (popCmd === 'cmPopup-order-pick') {
        searchParam.orderId = result.orderId || ''; picks.order = false;
      } else if (popCmd === 'cmPopup-vendor-pick') {
        searchParam.vendorId = result.vendorId || ''; searchParam.vendorNm = result.vendorNm || result.vendorId || ''; picks.vendor = false;
      } else if (popCmd === 'cmPopup-brand-pick') {
        searchParam.brandId = result.brandId || ''; searchParam.brandNm = result.brandNm || result.brandId || ''; picks.brand = false;
      } else if (popCmd === 'cmPopup-md-pick') {
        searchParam.mdUserId = result.userId || ''; searchParam.mdUserNm = result.userNm || result.loginId || result.userId || ''; picks.md = false;
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
      let cOrdered = 0, cPaid = 0, cPrep = 0, cShip = 0, cDliv = 0, cBuyConf = 0;
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
        status: { ordered: cOrdered, paid: cPaid, prep: cPrep, ship: cShip, dliv: cDliv, buyConf: cBuyConf },
        claimActive: { total: caTotal, cancel: caCancel, return: caReturn, exchange: caExchange, amt: caAmt },
        claimDone:   { total: cdTotal, cancel: cdCancel, return: cdReturn, exchange: cdExchange, amt: cdAmt },
        refund: { count: refCount, amt: refAmt },
        amtProgress, amtConfirmed,
      };
    });

    /* ##### cfSummaryGridRow — 그리드 하단 합계행 데이터 ############################# */

    const cfSummaryGridRow = computed(() => {
      if (!items.length) return null;
      let amtOrder = 0, amtCancel = 0, amtComp = 0, amtDliv = 0, qtyOrder = 0, qtyCancel = 0;
      for (const r of items) {
        qtyOrder  += Number(r.orderQty)         || 0;
        qtyCancel += Number(r.cancelQty)        || 0;
        amtOrder  += Number(r.itemOrderAmt)     || 0;
        amtCancel += Number(r.itemCancelAmt)    || 0;
        amtComp   += Number(r.itemCompletedAmt) || 0;
        amtDliv   += Number(r.dlivAmt)          || 0;
      }
      const s = cfSummary.value;
      return {
        orderQty:         qtyOrder,
        cancelQty:        qtyCancel,
        _progress:        s.qty.progress,
        _qtyConf:         s.qty.confirmed,
        _stPaid:          s.status.paid,
        _stPrep:          s.status.prep,
        _stShip:          s.status.ship,
        _stDliv:          s.status.dliv,
        _stBuyConf:       s.status.buyConf,
        _claimActive:     s.claimActive.total,
        _claimDone:       s.claimDone.total,
        _refund:          s.refund.count,
        itemOrderAmt:     amtOrder,
        itemCancelAmt:    amtCancel,
        itemCompletedAmt: amtComp,
        dlivAmt:          amtDliv,
        _settleDliv:      '',
        _settleOrder:     '',
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
          ...(searchParam.courierCd         && { courierCd:         searchParam.courierCd }),
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
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS', 'ORDER_ITEM_DATE_TYPE', 'COURIER'], { compNm: 'OdOrderItemMng' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS');
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
      { key: '_rowNum',     label: '번호',   width: 34,  slot: true },
      { key: 'orderItemId', label: '항목ID', width: 104,
        titleFmt: (row) => row.orderItemId || '',
        tdStyle:  ()    => 'text-align:center;font-family:monospace;font-size:10px;color:#777;',
        fmt: (row) => row.orderItemId ? row.orderItemId.substring(0, 12) + '..' : '-' },
      { key: 'orderId',     label: '주문ID', width: 90,
        titleFmt: (row) => row.orderId || '',
        tdStyle:  (row) => 'text-align:center;font-family:monospace;font-size:10px;' + (detailPanel.selectedOrderId === row.orderId ? 'color:#e8587a;font-weight:700;' : 'color:#555;'),
        fmt: (row) => row.orderId ? row.orderId.substring(0, 12) + '..' : '-' },

      /* ── 🧾 상품기본정보 ────────────────────────────────────────────────── */
      { key: 'memberNm',   label: '회원명',   colGroup: '🧾 상품기본정보',
        colGroupBg: '#e3f2fd', colGroupColor: '#1565c0', colGroupBorderColor: '#90caf9',
        thBg: '#deeefb', width: 84,
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;text-align:left;',
        fmt: (row) => row.memberNm   || '-' },
      { key: 'categoryNm', label: '카테고리', colGroup: '🧾 상품기본정보',
        thBg: '#deeefb', width: 84,
        tdStyle: () => 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 6px;font-size:11px;color:#666;text-align:left;',
        fmt: (row) => row.categoryNm || '-' },
      { key: 'prodNm',     label: '상품명',   colGroup: '🧾 상품기본정보',
        thBg: '#deeefb', width: 150, slot: true },
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

      /* ── 📦 주문수량 ────────────────────────────────────────────────────── */
      { key: 'orderQty',   label: '주문',   colGroup: '📦 주문수량',
        colGroupBg: '#e8f5e9', colGroupColor: '#2e7d32', colGroupBorderColor: '#a5d6a7',
        thBg: '#daf5da', thColor: '#2e7d32', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => ({ bg: '#16a34a', color: '#fff', value: row.orderQty || 1 }) },
      { key: 'cancelQty',  label: '취소',   colGroup: '📦 주문수량',
        thBg: '#daf5da', thColor: '#c62828', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.cancelQty ? { bg: '#dc2626', color: '#fff', value: row.cancelQty } : null },
      { key: '_progress',  label: '진행중', colGroup: '📦 주문수량',
        thBg: '#daf5da', thColor: '#6a1b9a', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_PROGRESS.includes(row.orderItemStatusCd) ? { bg: '#7c3aed', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_qtyConf',   label: '확정',   colGroup: '📦 주문수량',
        thBg: '#daf5da', thColor: '#1565c0', width: 42,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? { bg: '#1d4ed8', color: '#fff', value: row.orderQty || 1 } : null },

      /* ── 📊 진행상태 ────────────────────────────────────────────────────── */
      { key: '_stPaid',    label: '결제완료', colGroup: '📊 진행상태',
        colGroupBg: '#fff8e1', colGroupColor: '#e65100', colGroupBorderColor: '#ffca28',
        thBg: '#fffde7', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PAID'      ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_stPrep',    label: '준비중',   colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'PREPARING' ? { bg: '#c2410c', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_stShip',    label: '배송중',   colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.orderItemStatusCd === 'SHIPPING'  ? { bg: '#1d4ed8', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_stDliv',    label: '배송완료', colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 50,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_DELIVERED.includes(row.orderItemStatusCd) ? { bg: '#0f766e', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_stBuyConf', label: '구매확정', colGroup: '📊 진행상태',
        thBg: '#fffde7', width: 50,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? { bg: '#15803d', color: '#fff', value: row.orderQty || 1 } : null },

      /* ── ⚠️ 클레임 ──────────────────────────────────────────────────────── */
      { key: '_claimActive', label: '클레임중',  colGroup: '⚠️ 클레임',
        colGroupBg: '#fce4ec', colGroupColor: '#c62828', colGroupBorderColor: '#f48fb1',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#c07030', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_claimDone',   label: '클레임완료', colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 54,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => (row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '')) ? { bg: '#757575', color: '#fff', value: row.orderQty || 1 } : null },
      { key: '_refund',      label: '환불완료',   colGroup: '⚠️ 클레임',
        thBg: '#fce4ec', width: 44,
        tdStyle: () => 'text-align:center;padding:1px 2px;',
        iconBadge: (row) => row.refundCompltYn === 'Y' ? { bg: '#dc2626', color: '#fff', value: row.orderQty || 1 } : null },

      /* ── 💰 금액 ────────────────────────────────────────────────────────── */
      { key: 'itemOrderAmt',     label: '주문금액', colGroup: '💰 금액',
        colGroupBg: '#e8f5e9', colGroupColor: '#1b5e20', colGroupBorderColor: '#a5d6a7',
        thBg: '#daf5e9', thColor: '#1565c0', width: 80,
        tdStyle: ()    => 'text-align:right;padding-right:6px;font-size:11px;color:#1565c0;font-weight:600;',
        fmt: (row) => row.itemOrderAmt     ? Number(row.itemOrderAmt).toLocaleString()     : '-' },
      { key: 'itemCancelAmt',    label: '환불금액', colGroup: '💰 금액',
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
      { key: '_actions', label: '작업', width: 56, align: 'center', slot: true },
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
      { key: 'courierCd', type: 'select', label: '배송사',
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
      cfSummary, cfSummaryGridRow, cfDetailKey,
      handleBtnAction, handleSelectAction, handleRowClick, handleRowEdit,
      fnSettleBadgeCls, fnSettleBadgeLbl, fnVoucherBadge, fnVoucherLbl,
      fnErpVoucherBadge, fnErpVoucherLbl, fnErpVoucherTypeNm,
      inlineNavigate, fnCallbackModal,
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
      :rows="items"
      row-key="orderItemId"
      :selected-key="detailPanel.selectedOrderItemId"
      table-style="min-width:2100px;table-layout:fixed;width:100%;"
      :loading="uiState.loading"
      :summary-row="cfSummaryGridRow"
      summary-pos="top"
      summary-label="tot"
      summary-bg="#1e2f4a"
      summary-border-color="#2563eb"
      summary-text-color="#e8f4ff"
      col-border="1px solid #e2e8f0"
      @cell-click="e => handleRowClick(e.row)">

      <template #cell-_rowNum="{ idx }">
        <span style="color:#999;font-size:11px;">{{ (listGridPager.pageNo - 1) * listGridPager.pageSize + idx + 1 }}</span>
      </template>

      <template #cell-prodNm="{ row }">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;padding:0 6px;text-align:left;" :title="row.prodNm || ''">
          {{ row.prodNm || '-' }}<span v-if="row.prodOptNm1" style="font-size:10px;color:#888;">[{{ row.prodOptNm1 }}{{ row.prodOptNm2 ? '/' + row.prodOptNm2 : '' }}]</span>
        </span>
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
</bo-page>
`
};
