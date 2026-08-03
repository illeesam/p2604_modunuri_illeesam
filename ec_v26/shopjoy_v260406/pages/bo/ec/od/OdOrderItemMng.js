/* ShopJoy Admin - 주문항목관리 목록 */
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
    const listGridPager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageNums: [1], pageSizes: [10, 20, 30, 50, 100] });
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

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'searchParam-list') {
        listGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        listGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'items-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchList(); }
        return;
      } else {
        console.warn('[OdOrderItemMng] handleBtnAction unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'items-pager-sizeChange') {
        listGridPager.pageNo = 1;
        return handleSearchList();
      } else if (cmd === 'items-navOrder') {
        if (param) props.navigate('odOrderMng', { initSearchValue: param });
        return;
      } else {
        console.warn('[OdOrderItemMng] handleSelectAction unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 #################################################### */

    const fnStatusBadge = (cd) => {
      const m = { ORDERED: 'badge-blue', PAID: 'badge-green', PREPARING: 'badge-orange', SHIPPING: 'badge-purple', DELIVERED: 'badge-blue', CONFIRMED: 'badge-green', CANCELLED: 'badge-red' };
      return m[cd] || 'badge-gray';
    };
    const fnYnBadge = (v) => v === 'Y' ? 'badge-green' : 'badge-gray';
    const fnPrice   = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';
    const fnDate    = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';

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
      { key: 'orderId',            label: '주문ID',   style: 'width:170px;',
        link: true, mono: true, cellStyle: 'font-size:11px;cursor:pointer;',
        fmt: (v) => v || '-' },
      { key: 'prodNm',             label: '상품명',   style: 'min-width:180px;',
        fmt: (v, row) => {
          const opts = [row.prodOptNm1, row.prodOptNm2].filter(Boolean);
          return opts.length ? v + ' [' + opts.join('/') + ']' : (v || '-');
        } },
      { key: 'brandNm',            label: '브랜드',   style: 'width:100px;', fmt: (v) => v || '-' },
      { key: 'orderQty',           label: '수량',     style: 'width:50px;',  align: 'center', cellStyle: 'font-weight:600;' },
      { key: 'itemOrderAmt',       label: '주문금액', style: 'width:100px;', align: 'right',  fmt: (v) => fnPrice(v) },
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
      items, listGridPager, searchParam, uiState, codes,
      handleBtnAction, handleSelectAction,
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
    <bo-grid v-else bare :columns="columns.listGrid" :rows="items" row-key="orderItemId"
      empty-text="조회 결과가 없습니다."
      @cell-click="(cmd, colKey, row) => colKey === 'orderId' && handleSelectAction('items-navOrder', row.orderId)" />
    <bo-pager v-if="listGridPager.pageTotalCount > 0" :pager="listGridPager"
      :on-set-page="n => handleBtnAction('items-pager-setPage', n)"
      :on-size-change="() => handleSelectAction('items-pager-sizeChange')" />
  </bo-container>
</bo-page>
`
};
