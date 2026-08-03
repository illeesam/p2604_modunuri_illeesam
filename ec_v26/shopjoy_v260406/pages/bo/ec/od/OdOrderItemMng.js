/* ShopJoy Admin - 주문항목관리 목록 + 하단 OrderDtl 임베드 */
window.OdOrderItemMng = {
  name: 'OdOrderItemMng',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;

    /* ── 목록 상태 ── */
    const items = reactive([]);
    const listGridPager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [10, 20, 30, 50, 100] });
    const uiState = reactive({ loading: false });
    const codes = reactive({ order_item_statuses: [], od_date_types: [] });

    const searchParam = reactive({
      orderId: '',
      orderItemStatusCd: '',
      claimYn: '',
      searchType: '',
      searchValue: '',
      dateRangeType: 'reg_date',
      dateRangeStart: '',
      dateRangeEnd: '',
    });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 스냅샷 저장. */
    const searchParamInit = {};

    /* 하단 상세 (인라인 Dtl) — 항상 표시. 진입 시 빈 신규 폼(비활성) */
    const detailPanel = reactive({ selectedOrderItemId: null, selectedOrderId: null, openMode: 'view', reloadTrigger: 0, active: false, resetSeq: 0 });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'searchParam-list') {
        listGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        listGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList();
      } else if (cmd === 'items-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchList(); }
        return;
      } else if (cmd === 'detailPanel-close') {
        return resetDetailToNew();
      } else {
        console.warn('[OdOrderItemMng] handleBtnAction unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'items-pager-sizeChange') {
        listGridPager.pageNo = 1;
        return handleSearchList();
      } else {
        console.warn('[OdOrderItemMng] handleSelectAction unknown cmd:', cmd);
      }
    };

    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'items-cellClick') {
        if (colKey === 'btn_row_edit') {
          detailPanel.selectedOrderItemId = row.orderItemId;
          detailPanel.selectedOrderId     = row.orderId;
          detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++;
          return;
        }
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          detailPanel.selectedOrderItemId = row.orderItemId;
          detailPanel.selectedOrderId     = row.orderId;
          detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++;
          return;
        }
      } else {
        console.warn('[OdOrderItemMng] handleGridCellAction unknown cmd:', cmd);
      }
    };

    /* ##### [03] 인라인 Dtl 헬퍼 #################################################### */

    const resetDetailToNew = () => {
      detailPanel.selectedOrderItemId = null;
      detailPanel.selectedOrderId     = null;
      detailPanel.openMode  = 'view';
      detailPanel.active    = false;
      detailPanel.resetSeq++;
    };

    /* inlineNavigate — 인라인 Dtl 내부에서 navigate 호출 시 가로채기 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng') { if (opts.reload) handleSearchList(); resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const cfDetailKey = computed(() => `${detailPanel.selectedOrderItemId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);

    const STS_PROGRESS  = ['ORDERED', 'PAID', 'PREPARING', 'SHIPPING', 'WAIT_DEPOSIT'];
    const STS_DELIVERED = ['DELIVERED', 'DLIV_COMPLT'];
    const STS_CONFIRMED = ['CONFIRMED', 'COMPLT', 'BUY_CONFIRMED'];
    const STS_CLM_DONE  = ['COMPLT', 'DONE', 'COMPLETE', 'REJECTED'];
    const STS_CLM_TYPE  = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };

    const cfSummary = computed(() => {
      const IN_PROGRESS  = STS_PROGRESS;
      const IN_DELIVERED = STS_DELIVERED;
      const IN_CONFIRMED = STS_CONFIRMED;
      const CLM_DONE     = STS_CLM_DONE;
      let inProgress = 0, delivered = 0, confirmed = 0, refund = 0;
      let caTotal = 0, caCancel = 0, caReturn = 0, caExchange = 0;
      let cdTotal = 0, cdCancel = 0, cdReturn = 0, cdExchange = 0;
      let amtProgress = 0, amtDelivered = 0, amtConfirmed = 0;
      let amtClaimActive = 0, amtClaimDone = 0, amtRefund = 0;
      for (const r of items) {
        const st          = r.orderItemStatusCd || '';
        const orderAmt    = Number(r.itemOrderAmt)     || 0;
        const cancelAmt   = Number(r.itemCancelAmt)    || 0;
        const completedAmt = Number(r.itemCompletedAmt) || 0;
        if (IN_PROGRESS.includes(st))       { inProgress++; amtProgress   += orderAmt; }
        else if (IN_DELIVERED.includes(st)) { delivered++;  amtDelivered  += orderAmt; }
        else if (IN_CONFIRMED.includes(st)) { confirmed++;  amtConfirmed  += completedAmt || orderAmt; }
        if (r.claimYn === 'Y') {
          const done = CLM_DONE.includes(r.claimStatusCd || '');
          const t = r.claimTypeCd || '';
          if (done) { cdTotal++; amtClaimDone   += cancelAmt; if (t === 'CANCEL') cdCancel++; else if (t === 'RETURN') cdReturn++; else if (t === 'EXCHANGE') cdExchange++; }
          else      { caTotal++; amtClaimActive += orderAmt;  if (t === 'CANCEL') caCancel++; else if (t === 'RETURN') caReturn++; else if (t === 'EXCHANGE') caExchange++; }
        }
        if (r.refundCompltYn === 'Y') { refund++; amtRefund += cancelAmt; }
      }
      return {
        inProgress, delivered, confirmed, refund,
        amtProgress, amtDelivered, amtConfirmed,
        amtClaimActive, amtClaimDone, amtRefund,
        claimActive: { total: caTotal, cancel: caCancel, return: caReturn, exchange: caExchange },
        claimDone:   { total: cdTotal, cancel: cdCancel, return: cdReturn, exchange: cdExchange },
        isPartial:   listGridPager.pageTotalCount > items.length,
      };
    });

    /* ##### [04] 내장 사용 함수 #################################################### */

    const fnStatusBadge = (cd) => {
      const m = { ORDERED: 'badge-blue', PAID: 'badge-green', PREPARING: 'badge-orange', SHIPPING: 'badge-purple', DELIVERED: 'badge-blue', CONFIRMED: 'badge-green', CANCELLED: 'badge-red' };
      return m[cd] || 'badge-gray';
    };
    const fnYnBadge  = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';
    const fnPrice    = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';
    const fnDate     = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';
    const fnAmtShort = (v) => {
      const n = Number(v) || 0;
      if (!n) return '-';
      if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '억원';
      if (n >= 10000)     return Math.round(n / 10000) + '만원';
      return n.toLocaleString() + '원';
    };

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo:   listGridPager.pageNo,
          pageSize: listGridPager.pageSize,
          ...(searchParam.orderId             && { orderId:             searchParam.orderId }),
          ...(searchParam.orderItemStatusCd   && { orderItemStatusCd:   searchParam.orderItemStatusCd }),
          ...(searchParam.claimYn             && { claimYn:             searchParam.claimYn }),
          ...(searchParam.searchType          && { searchType:          searchParam.searchType }),
          ...(searchParam.searchValue         && { searchValue:         searchParam.searchValue }),
          ...(searchParam.dateRangeType       && { dateRangeType:       searchParam.dateRangeType }),
          ...(searchParam.dateRangeStart      && { dateRangeStart:      searchParam.dateRangeStart }),
          ...(searchParam.dateRangeEnd        && { dateRangeEnd:        searchParam.dateRangeEnd }),
        };
        if (params.searchValue && !params.searchType) params.searchType = 'prodNm,brandNm';
        const res = await boApiSvc.odOrderItem.getPage(params, '주문항목관리', '조회');
        const d = res.data?.data || {};
        items.splice(0, items.length, ...(d.pageList || []));
        listGridPager.pageTotalCount = d.pageTotalCount || 0;
        listGridPager.pageTotalPage  = d.pageTotalPage  || 1;
        const tp = listGridPager.pageTotalPage;
        const cur = listGridPager.pageNo;
        const from = Math.max(1, cur - 4);
        const to   = Math.min(tp, from + 9);
        listGridPager.pageNums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
        /* 조회 후 선택한 항목이 목록에 없으면 상세 초기화 */
        if (detailPanel.selectedOrderItemId) {
          const still = items.some(r => r.orderItemId === detailPanel.selectedOrderItemId);
          if (!still) resetDetailToNew();
        }
      } catch (err) {
        showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 화면 단위 코드 지연 로딩 */
    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        await codeStore.saLoadCodes(['ORDER_ITEM_STATUS', 'OD_DATE_TYPE'], { compNm: 'OdOrderItemMng' });
        codes.order_item_statuses = codeStore.sgGetGrpCodes('ORDER_ITEM_STATUS');
        codes.od_date_types       = codeStore.sgGetGrpCodes('OD_DATE_TYPE');
      } catch (_) {}
    };

    /* initPage — 코드 로딩 → 초기 조회 */
    const initPage = async () => {
      await fnLoadCodes();
      Object.assign(searchParamInit, searchParam);
      await handleSearchList();
    };
    onMounted(initPage);

    /* ##### [05] 컬럼 정의 ######################################################### */

    const columns = {};

    columns.baseSearch = [
      { key: 'orderId', type: 'text', label: '주문ID', placeholder: '주문ID 입력', width: '180px', mono: true },
      { key: 'orderItemStatusCd', type: 'select', label: '품목상태',
        options: () => codes.order_item_statuses, nullLabel: '상태 전체' },
      { key: 'claimYn', type: 'select', label: '클레임',
        options: [{ value: 'Y', label: '클레임 있음' }, { value: 'N', label: '클레임 없음' }],
        nullLabel: '전체' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'prodNm',   label: '상품명' },
          { value: 'brandNm',  label: '브랜드명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '180px' },
      { key: '_dateRange', type: 'dateRange', label: '기간',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.od_date_types, dateWidth: '136px' },
    ];

    columns.listGrid = [
      { key: 'orderItemId',        label: '주문항목ID', style: 'width:110px;',
        mono: true, cellStyle: 'font-size:11px;', fmt: (v) => v || '-' },
      { key: 'orderId',            label: '주문ID',   style: 'width:130px;',
        link: true, mono: true, cellStyle: 'font-size:11px;cursor:pointer;',
        fmt: (v, row) => v || '-',
        cellInnerStyle: (v) => detailPanel.selectedOrderId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'prodNm',             label: '상품명',   style: 'min-width:180px;',
        fmt: (v, row) => {
          const opts = [row.prodOptNm1, row.prodOptNm2].filter(Boolean);
          return opts.length ? v + ' [' + opts.join('/') + ']' : (v || '-');
        } },
      { key: 'brandNm',            label: '브랜드',   style: 'width:100px;', fmt: (v) => v || '-' },
      { key: 'orderQty',           label: '수량',     style: 'width:50px;',  align: 'center', cellStyle: 'font-weight:600;' },
      { key: '_sProg', label: '주문중',   style: 'width:44px;', align: 'center',
        fmt: (v, row) => STS_PROGRESS.includes(row.orderItemStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_PROGRESS.includes(row.orderItemStatusCd) ? 'color:#3a6ecf;font-weight:700;' : '' },
      { key: '_sDliv', label: '배송완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => STS_DELIVERED.includes(row.orderItemStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_DELIVERED.includes(row.orderItemStatusCd) ? 'color:#5a8080;font-weight:700;' : '' },
      { key: '_sConf', label: '주문완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? '1' : '',
        cellStyle: (v, row) => STS_CONFIRMED.includes(row.orderItemStatusCd) ? 'color:#2a7d52;font-weight:700;' : '' },
      { key: '_sCa', label: '클레임중', style: 'width:54px;', align: 'center',
        fmt: (v, row) => row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '') ? (STS_CLM_TYPE[row.claimTypeCd] || '진행') : '',
        cellStyle: (v, row) => row.claimYn === 'Y' && !STS_CLM_DONE.includes(row.claimStatusCd || '') ? 'color:#c07030;font-size:11px;font-weight:700;' : '' },
      { key: '_sCd', label: '클레임완료', style: 'width:58px;', align: 'center',
        fmt: (v, row) => row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '') ? (STS_CLM_TYPE[row.claimTypeCd] || '완료') : '',
        cellStyle: (v, row) => row.claimYn === 'Y' && STS_CLM_DONE.includes(row.claimStatusCd || '') ? 'color:#888;font-size:11px;' : '' },
      { key: '_sRef', label: '환불완료', style: 'width:52px;', align: 'center',
        fmt: (v, row) => row.refundCompltYn === 'Y' ? '1' : '',
        cellStyle: (v, row) => row.refundCompltYn === 'Y' ? 'color:#d95050;font-weight:700;' : '' },
      { key: 'itemOrderAmt',    label: '주문금액', style: 'width:90px;',  align: 'right', fmt: (v) => fnPrice(v) },
      { key: 'itemCancelAmt',   label: '환불금액', style: 'width:90px;',  align: 'right',
        fmt: (v) => v ? fnPrice(v) : '-',
        cellStyle: (v) => v ? 'color:#d95050;' : 'color:#d0d0d0;' },
      { key: 'itemCompletedAmt', label: '확정금액', style: 'width:90px;', align: 'right',
        fmt: (v) => v ? fnPrice(v) : '-',
        cellStyle: (v) => v ? 'color:#2a7d52;font-weight:600;' : 'color:#d0d0d0;' },
      { key: 'orderItemStatusCd',  label: '품목상태', style: 'width:80px;',  align: 'center',
        fmt: (v, row) => row.orderItemStatusCdNm || v,
        badge: (row) => fnStatusBadge(row.orderItemStatusCd) },
      { key: 'claimYn',            label: '클레임',   style: 'width:66px;',  align: 'center',
        fmt: (v) => v === 'Y' ? '클레임' : '정상',
        badge: (row) => fnYnBadge(row.claimYn) },
      { key: 'buyConfirmYn',       label: '구매확정', style: 'width:70px;',  align: 'center',
        fmt: (v) => v === 'Y' ? '확정' : '미확정',
        badge: (row) => fnYnBadge(row.buyConfirmYn) },
      { key: 'settleYn',           label: '정산',     style: 'width:54px;',  align: 'center',
        fmt: (v) => v === 'Y' ? '완료' : '미처리',
        badge: (row) => fnYnBadge(row.settleYn) },
      { key: 'regDate',            label: '등록일시', style: 'width:130px;',
        fmt: (v) => fnDate(v), cellStyle: 'font-size:11px;color:#888;' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      items, listGridPager, searchParam, uiState, codes, detailPanel,
      handleBtnAction, handleSelectAction, handleGridCellAction,
      inlineNavigate, cfDetailKey, cfSummary, fnAmtShort,
    };
  },
  template: `
<bo-page title="주문항목관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading"
      :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 ====================================================== -->
  <bo-container title="주문항목 목록" :count-text="'총 ' + listGridPager.pageTotalCount.toLocaleString() + '건'">
    <div v-if="uiState.loading" style="text-align:center;padding:48px;color:#bbb;">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>
      조회 중...
    </div>
    <template v-else>
      <div v-if="items.length" style="display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #ede6e6;border-radius:8px;overflow:hidden;margin-bottom:10px;">
        <div style="padding:9px 12px;text-align:center;background:#f4f8ff;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#8a9bbf;font-weight:600;margin-bottom:4px;">주문중</div>
          <div style="font-size:16px;font-weight:700;color:#3a6ecf;">{{ cfSummary.inProgress }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#8ab0e0;margin-top:2px;">{{ fnAmtShort(cfSummary.amtProgress) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f4f8f7;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#7a9595;font-weight:600;margin-bottom:4px;">배송완료</div>
          <div style="font-size:16px;font-weight:700;color:#5a8080;">{{ cfSummary.delivered }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#7aa0a0;margin-top:2px;">{{ fnAmtShort(cfSummary.amtDelivered) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f4fbf7;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#6a9580;font-weight:600;margin-bottom:4px;">주문완료</div>
          <div style="font-size:16px;font-weight:700;color:#2a7d52;">{{ cfSummary.confirmed }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#6aaa80;margin-top:2px;">{{ fnAmtShort(cfSummary.amtConfirmed) }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#fff8f0;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#b08050;font-weight:600;margin-bottom:4px;">클레임진행중</div>
          <div style="font-size:16px;font-weight:700;color:#c07030;">{{ cfSummary.claimActive.total }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#c0905a;margin-top:2px;">{{ fnAmtShort(cfSummary.amtClaimActive) }}</div>
          <div style="font-size:10px;color:#c0a080;margin-top:2px;">취소:{{ cfSummary.claimActive.cancel }} 반품:{{ cfSummary.claimActive.return }} 교환:{{ cfSummary.claimActive.exchange }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#f9f9f9;border-right:1px solid #ede6e6;">
          <div style="font-size:10px;color:#909090;font-weight:600;margin-bottom:4px;">클레임완료</div>
          <div style="font-size:16px;font-weight:700;color:#808080;">{{ cfSummary.claimDone.total }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#a0a0a0;margin-top:2px;">{{ fnAmtShort(cfSummary.amtClaimDone) }}</div>
          <div style="font-size:10px;color:#b0b0b0;margin-top:2px;">취소:{{ cfSummary.claimDone.cancel }} 반품:{{ cfSummary.claimDone.return }} 교환:{{ cfSummary.claimDone.exchange }}</div>
        </div>
        <div style="padding:9px 12px;text-align:center;background:#fff5f5;">
          <div style="font-size:10px;color:#c08080;font-weight:600;margin-bottom:4px;">환불완료</div>
          <div style="font-size:16px;font-weight:700;color:#d95050;">{{ cfSummary.refund }}<span style="font-size:11px;font-weight:400;">건</span></div>
          <div style="font-size:11px;color:#e07070;margin-top:2px;">{{ fnAmtShort(cfSummary.amtRefund) }}</div>
        </div>
      </div>
      <div v-if="cfSummary.isPartial" style="text-align:right;font-size:10px;color:#ccc;margin:-6px 0 6px;">* 현재 페이지 기준</div>
      <bo-grid bare selectable :columns="columns.listGrid" :rows="items"
        row-key="orderItemId" :selected-key="detailPanel.selectedOrderItemId"
        empty-text="조회 결과가 없습니다." row-actions
        grid-id="items-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #row-actions="{ row, gridId }">
          <div class="actions">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">수정</button>
          </div>
        </template>
      </bo-grid>
    </template>
    <bo-pager v-if="listGridPager.pageTotalCount > 0" :pager="listGridPager"
      :on-set-page="n => handleBtnAction('items-pager-setPage', n)"
      :on-size-change="() => handleSelectAction('items-pager-sizeChange')" />
  </bo-container>
  <!-- ===== ■. 하단 상세: OdOrderItemDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ===================== -->
  <od-order-item-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="detailPanel.selectedOrderItemId"
    :dtl-mode="detailPanel.openMode"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />
</bo-page>
`
};
