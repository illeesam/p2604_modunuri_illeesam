/* ShopJoy Admin - 정산수집원장 */
window.StRawMng = {
  name: 'StRawMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const uiState = reactive({ descOpen: false, error: null, isPageCodeLoad: false, loading: false });
    const codes = reactive({ raw_types: [], raw_collect_statuses: [], raw_vendor_divs: [], pay_methods: [], order_statuses_kr: [],
      confirm_yn_opts: [], close_yn_opts: [], send_yn_opts: [],
      date_range_opts: [],
    });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        rawGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        rawGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'searchParam-moreToggle') {
        searchParam.searchMoreOpen = !searchParam.searchMoreOpen;
        return;
      } else if (cmd === 'rawData-pager-setPage') {
        if (param >= 1 && param <= rawGridPager.pageTotalPage) { rawGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'rawData-pager-sizeChange') {
        rawGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭/액션 라우터. colKey 기준 분기 (행 액션 버튼·토글 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ StRawMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'rawData-cellClick') {
        // 펼침 토글 아이콘 (_exp / colKey='btn_row_expand')
        if (colKey === 'btn_row_expand') { return toggleRow(row.settleRawId); }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.raw_types = codeStore.sgGetGrpCodes('RAW_TYPE_KR');
        codes.raw_collect_statuses = codeStore.sgGetGrpCodes('RAW_COLLECT_STATUS');
        codes.raw_vendor_divs = codeStore.sgGetGrpCodes('RAW_VENDOR_DIV');
        codes.pay_methods = codeStore.sgGetGrpCodes('PAY_METHOD_KR');
        codes.order_statuses_kr = codeStore.sgGetGrpCodes('ORDER_STATUS_KR');
        codes.confirm_yn_opts = codeStore.sgGetGrpCodes('CONFIRM_YN');
        codes.close_yn_opts = codeStore.sgGetGrpCodes('CLOSE_YN');
        codes.send_yn_opts = codeStore.sgGetGrpCodes('SEND_YN');
        codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
    };

    // 검색 필드
  const _initSearchParam = () => ({ dateRange: '이번달', dateType: 'order_date', dateStart: '', dateEnd: '', searchMoreOpen: false, searchType: '', searchValue: '', rawTypeCd: '', rawStatusCd: '', vendorTypeCd: '', payMethodCd: '', buyConfirmYn: '', closeYn: '', erpSendYn: '', settlePeriod: '', orderItemStatusCd: '', amtFrom: '', amtTo: '' });
  const searchParam = reactive(_initSearchParam());
  boUtil.bofApplyDateRange(searchParam, '이번달');

    const rawGridPager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const raws = reactive([]);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.loading = true;
        const params = {
          pageNo: rawGridPager.pageNo, pageSize: rawGridPager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([k, v]) => k !== 'searchMoreOpen' && v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'rawId,srcId,vendorNm,prodNm,brandNm';
        }
        const res = await boApiSvc.stSettleRaw.getPage(params, '정산데이터관리', '목록조회');
        const data = res.data?.data;
        raws.splice(0, raws.length, ...(data?.pageList || data?.list || []));
        expandedRows.clear(); Object.keys(detailCache).forEach(k => delete detailCache[k]);
        rawGridPager.pageTotalCount = data?.pageTotalCount || raws.length;
        rawGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(rawGridPager.pageTotalCount / rawGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(rawGridPager);
        Object.assign(rawGridPager.pageCond, data?.pageCond || rawGridPager.pageCond);
      } catch (err) {
        console.error('[handleSearchList]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) {
        fnLoadCodes();
        handleSearchList('DEFAULT');
      }
    });


    const cfSummary = computed(() => ({
      totalAmt:   raws.reduce((s, r) => s + (r.settleTargetAmt || 0), 0),
      collectCnt: raws.filter(r => r.rawStatusCd === 'COLLECTED').length,
      settleAmt:  raws.reduce((s, r) => s + (r.settleAmt || 0), 0),
      feeAmt:     raws.reduce((s, r) => s + (r.settleFeeAmt || 0), 0),
      closeCnt:   raws.filter(r => r.closeYn === 'Y').length,
      erpCnt:     raws.filter(r => r.erpSendYn === 'Y').length,
      confirmCnt: raws.filter(r => r.buyConfirmYn === 'Y').length,
    }));

    /* setPage — 설정 */
    const setPage = n => { if (n >= 1 && n <= rawGridPager.pageTotalPage) { rawGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };







    const expandedRows = reactive(new Set());
    /* 펼침 시 상세 API(getById) 조회 결과 캐시 — 한 번 조회한 행은 재펼침 시 재조회 안 함. 키: settleRawId */
    const detailCache   = reactive({});
    const detailLoading = reactive(new Set());   // 조회 중인 settleRawId 집합

    /* fnFetchDetail — 행 상세 API(getById) 조회 후 캐시 적재. 이미 캐시/조회중이면 skip */
    const fnFetchDetail = async (id) => {
      if (id == null) { return; }
      if (detailCache[id] || detailLoading.has(id)) { return; }   // 재펼침 시 재조회 안 함
      detailLoading.add(id);
      try {
        const res = await boApiSvc.stSettleRaw.getById(id, '정산데이터관리', '상세조회');
        detailCache[id] = res.data?.data || res.data || {};
      } catch (err) {
        if (showToast) { showToast(err.response?.data?.message || err.message || '상세 조회 오류', 'error', 0); }
      } finally {
        detailLoading.delete(id);
      }
    };

    /* toggleRow — 토글 (펼칠 때만 상세 조회) */
    const toggleRow = id => { if (expandedRows.has(id)) { expandedRows.delete(id); } else { expandedRows.add(id); fnFetchDetail(id); } };

    /* isExpanded — 여부 확인 */
    const isExpanded = id => expandedRows.has(id);

    /* fnRowDetail — 펼침 상세 폼 데이터 (캐시 우선, 미조회 시 목록 row 폴백) */
    const fnRowDetail = (r) => detailCache[r.settleRawId] || r;

    /* fnRowDetailLoading — 해당 행 상세 조회중 여부 */
    const fnRowDetailLoading = (r) => detailLoading.has(r.settleRawId);

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => ({ 'COLLECTED':'badge-green', 'EXCLUDED':'badge-gray', 'SETTLED':'badge-purple', 'PENDING':'badge-blue' }[s] || 'badge-gray');

    /* rawStatusLabel — 원본 상태 라벨 */
    const rawStatusLabel = s => ({ 'COLLECTED':'수집완료', 'EXCLUDED':'제외', 'SETTLED':'정산완료', 'PENDING':'대기' }[s] || s || '-');

    /* fnRawStatusBadge — 유틸 */
    const fnRawStatusBadge = s => fnStatusBadge(s);

    /* vendorTypeLabel — 업체 유형 라벨 */
    const vendorTypeLabel = s => ({ 'SALE':'판매업체', 'DLIV':'배송업체', 'EXTERNAL':'외부업체' }[s] || s || '-');

    /* orderStatusLabel — 주문 상태 라벨 */
    const orderStatusLabel = s => ({ 'ORDERED':'주문완료', 'PAID':'결제완료', 'PREPARING':'준비중', 'SHIPPING':'배송중', 'DELIVERED':'배송완료', 'CONFIRMED':'구매확정', 'CANCELLED':'취소' }[s] || s || '-');

    /* fmtW — 포맷 W */
    const fmtW = n => coUtil.cofWon(n, true);

    /* fmtPct — 포맷 퍼센트 */
    const fmtPct = n => Number(n || 0).toLocaleString() + '%';

    /* rawGridColumns — BoGrid 컬럼 정의 (특수셀은 #cell- 슬롯 override) */
    const columns = {};
    columns.rawGrid = [
      { key: '_exp',           label: '',         style: 'width:24px',
        align: 'center',
        linkToggle: { active: (row) => isExpanded(row.settleRawId), title: '펼치기/닫기', onClick: (row) => handleGridCellAction('rawData-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.settleRawId) ? '▲' : '▼' },
      { key: 'settleRawId',    label: '원장ID',
        cellStyle: 'font-size:12px;color:#555;' },
      { key: 'orderDate',      label: '거래일자',  fmt: (v) => coUtil.cofYmd(v) || '-' },
      { key: 'rawTypeCd',      label: '유형',
        badge: (row) => row.rawTypeCd === 'ORDER' ? 'badge-blue' : 'badge-orange' },
      { key: 'orderId',        label: '소스ID', cellStyle: 'color:#555' },
      { key: 'vendorNm',       label: '업체',
        fmt: (v, row) => `${row.vendorNm || ''} / ${vendorTypeLabel(row.vendorTypeCd) || ''}` },
      { key: 'prodNm',         label: '상품명',
        cellStyle: 'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        fmt: (v, row) => row.brandNm ? `${row.prodNm || ''} / ${row.brandNm}` : (row.prodNm || ''),
        cellTitle: true },
      { key: 'orderQty',       label: '수량',         style: 'text-align:right',
        align: 'right', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'settleTargetAmt', label: '정산대상금액', style: 'text-align:right',
        align: 'right', fmt: fmtW,
        cellStyle: (v) => 'font-weight:600;' + (v < 0 ? 'color:#e74c3c' : '') },
      { key: 'settleFeeAmt',   label: '수수료',       style: 'text-align:right',
        align: 'right', fmt: fmtW, cellStyle: 'color:#e74c3c' },
      { key: 'settleAmt',      label: '정산금액',     style: 'text-align:right',
        align: 'right', fmt: fmtW,
        cellStyle: (v) => 'font-weight:700;' + (v < 0 ? 'color:#e74c3c' : 'color:#2980b9') },
      { key: 'rawStatusCd',    label: '수집상태',
        badge: (row) => fnRawStatusBadge(row.rawStatusCd), fmt: (v) => rawStatusLabel(v) },
      { key: 'closeYn',        label: '마감',
        badge: (row) => row.closeYn === 'Y' ? 'badge-purple' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '마감' : '미마감' },
      { key: 'erpSendYn',      label: 'ERP',
        badge: (row) => row.erpSendYn === 'Y' ? 'badge-green' : 'badge-gray',
        fmt: (v) => v === 'Y' ? '전송' : '미전송' },
    ];

    /* doCollect — 실행 */
    const doCollect = async () => {
      const ok = await showConfirm('재수집', '해당 기간 정산 데이터를 재수집하시겠습니까?');
      if (!ok) { return; }
      try {
        const res = await boApiSvc.stSettleRaw.collect({ dateStart: searchParam.dateStart, dateEnd: searchParam.dateEnd }, '원장관리', '저장');
        if (showToast) { showToast('재수집이 완료되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0); }
      }
    };

    /* summaryFormColumns — 집계 카드 (BoFormArea readonly, cols=7, labelLeft) */
    columns.summaryForm = [
      { key: '_totalCnt',  label: '수집건수',    type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:15px;">${rawGridPager.pageTotalCount.toLocaleString()}건</b>` },
      { key: '_collectCnt',label: '정산대상',    type: 'readonly', html: true, fmt: () => `<b style="color:#27ae60;font-size:15px;">${cfSummary.value.collectCnt.toLocaleString()}건</b>` },
      { key: '_confirmCnt',label: '구매확정',    type: 'readonly', html: true, fmt: () => `<b style="color:#e67e22;font-size:15px;">${cfSummary.value.confirmCnt.toLocaleString()}건</b>` },
      { key: '_closeCnt',  label: '마감완료',    type: 'readonly', html: true, fmt: () => `<b style="color:#8e44ad;font-size:15px;">${cfSummary.value.closeCnt.toLocaleString()}건</b>` },
      { key: '_totalAmt',  label: '수집금액 합계',type: 'readonly', html: true, fmt: () => `<b style="color:${cfSummary.value.totalAmt>=0?'#333':'#e74c3c'};font-size:14px;">${fmtW(cfSummary.value.totalAmt)}</b>` },
      { key: '_feeAmt',    label: '수수료 합계',  type: 'readonly', html: true, fmt: () => `<b style="color:#e74c3c;font-size:14px;">${fmtW(cfSummary.value.feeAmt)}</b>` },
      { key: '_settleAmt', label: '정산금액 합계',type: 'readonly', html: true, fmt: () => `<b style="color:#2980b9;font-size:14px;">${fmtW(cfSummary.value.settleAmt)}</b>` },
    ];

    /* baseSearchColumns — 검색 영역 컬럼 (1+2행 평면화) */
    columns.baseSearch = [
      { key: 'dateRange', type: 'dateRange', label: '기간',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => [{ value: 'order_date', label: '거래일' }, { value: 'reg_date', label: '등록일' }, { value: 'upd_date', label: '수정일' }],
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'rawTypeCd',  type: 'select', label: '유형',
        options: () => codes.raw_types, nullLabel: '유형 전체', width: '100px' },
      { key: 'rawStatusCd', type: 'select', label: '수집상태',
        options: () => codes.raw_collect_statuses, nullLabel: '수집상태 전체', width: '110px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'rawId',    label: '원장ID' },
          { value: 'srcId',    label: '소스ID' },
          { value: 'vendorNm', label: '업체명' },
          { value: 'prodNm',   label: '상품명' },
          { value: 'brandNm',  label: '브랜드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '230px' },
      { key: 'vendorTypeCd', type: 'select', label: '업체구분',
        options: () => codes.raw_vendor_divs, nullLabel: '업체구분 전체', width: '110px' },
      { key: 'payMethodCd', type: 'select', label: '결제수단',
        options: () => codes.pay_methods, nullLabel: '결제수단 전체', width: '120px' },
      { key: 'buyConfirmYn', type: 'select', label: '구매확정',
        options: () => codes.confirm_yn_opts, nullLabel: '구매확정 전체', width: '110px' },
      { key: 'closeYn',    type: 'select', label: '마감여부',
        options: () => codes.close_yn_opts, nullLabel: '마감여부 전체', width: '110px' },
      { key: 'erpSendYn',  type: 'select', label: 'ERP전송',
        options: () => codes.send_yn_opts, nullLabel: 'ERP전송 전체', width: '110px' },
      { key: 'settlePeriod', type: 'text', label: '정산기간', placeholder: '정산기간(YYYY-MM)', width: '150px' },
    ];

    /* moreSearchColumns — 펼침 영역(searchMoreOpen=true) 두번째 검색바 */
    columns.moreSearch = [
      { key: 'orderItemStatusCd', type: 'select', label: '주문상태',
        options: () => codes.order_statuses_kr, nullLabel: '주문상태 전체', width: '120px' },
      { key: 'amtFrom',     type: 'text',   label: '수집금액(최소)', placeholder: '최솟값(원)', width: '120px' },
      { key: 'amtTo',       type: 'text',   label: '수집금액(최대)', placeholder: '최댓값(원)', width: '120px' },
    ];

    /* rawGridRowDetail — 정산원장 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.rawGridRowDetail = [
      { key: '_orderId',      label: '주문ID',     type: 'readonly', fmt: (v, row) => row.orderId || '-' },
      { key: '_orderDate',    label: '거래일자',   type: 'readonly', fmt: (v, row) => row.orderDate || '-' },
      { key: '_orderStatus',  label: '주문상태',   type: 'readonly', fmt: (v, row) => orderStatusLabel(row.orderItemStatusCd) },
      { key: '_payMethod',    label: '결제수단',   type: 'readonly', fmt: (v, row) => row.payMethodCd || '-' },
      { key: '_buyConfirm',   label: '구매확정',   type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${row.buyConfirmYn==='Y'?'badge-green':'badge-gray'}">${row.buyConfirmYn==='Y'?'확정':'미확정'}</span>` + (row.buyConfirmDate ? `<span style="color:#888;margin-left:4px;font-size:11px;">${row.buyConfirmDate}</span>` : '') },
      { key: '_settlePeriod', label: '정산기간',   type: 'readonly', colSpan: 3, fmt: (v, row) => row.settlePeriod || '-' },

      { key: '_prodNm',       label: '상품명',     type: 'readonly', colSpan: 2, fmt: (v, row) => row.prodNm || '-' },
      { key: '_brandNm',      label: '브랜드',     type: 'readonly', fmt: (v, row) => row.brandNm || '-' },
      { key: '_skuId',        label: 'SKU ID',     type: 'readonly', mono: true, fmt: (v, row) => row.prodSkuId || '-' },
      { key: '_normalPrice',  label: '정상가',     type: 'readonly', fmt: (v, row) => fmtW(row.normalPrice) },
      { key: '_unitPrice',    label: '단가',       type: 'readonly', fmt: (v, row) => fmtW(row.unitPrice) },
      { key: '_orderQty',     label: '수량',       type: 'readonly', fmt: (v, row) => (row.orderQty || 0).toLocaleString() + '개' },
      { key: '_itemPrice',    label: '소계',       type: 'readonly', html: true, fmt: (v, row) => `<b>${fmtW(row.itemPrice)}</b>` },

      { key: '_discntAmt',    label: '직접할인',   type: 'readonly', html: true, fmt: (v, row) => row.discntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.discntAmt)}</span>` : '-' },
      { key: '_couponDiscnt', label: '쿠폰할인',   type: 'readonly', html: true, fmt: (v, row) => row.couponDiscntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.couponDiscntAmt)}</span>` : '-' },
      { key: '_promoDiscnt',  label: '프로모션할인',type: 'readonly', html: true, fmt: (v, row) => row.promoDiscntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.promoDiscntAmt)}</span>` : '-' },
      { key: '_cacheUse',     label: '캐쉬사용',   type: 'readonly', html: true, fmt: (v, row) => row.cacheUseAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.cacheUseAmt)}</span>` : '-' },
      { key: '_mileageUse',   label: '적립금사용', type: 'readonly', html: true, fmt: (v, row) => row.mileageUseAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.mileageUseAmt)}</span>` : '-' },
      { key: '_voucherUse',   label: '상품권',     type: 'readonly', html: true, fmt: (v, row) => row.voucherUseAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.voucherUseAmt)}</span>` : '-' },
      { key: '_giftAmt',      label: '사은품원가', type: 'readonly', html: true, fmt: (v, row) => row.giftAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.giftAmt)}</span>` : '-' },
      { key: '_saveSchd',     label: '적립예정',   type: 'readonly', html: true, fmt: (v, row) => row.saveSchdAmt ? `<span style="color:#27ae60;">${fmtW(row.saveSchdAmt)}</span>` : '-' },

      { key: '_settleTarget', label: '정산대상금액',type: 'readonly', html: true, fmt: (v, row) => `<b>${fmtW(row.settleTargetAmt)}</b>` },
      { key: '_feeRate',      label: '수수료율',   type: 'readonly', fmt: (v, row) => fmtPct(row.settleFeeRate) },
      { key: '_feeAmt',       label: '수수료금액', type: 'readonly', html: true, fmt: (v, row) => `<span style="color:#e74c3c;">${fmtW(row.settleFeeAmt)}</span>` },
      { key: '_settleAmt',    label: '정산금액',   type: 'readonly', html: true, fmt: (v, row) => `<b style="color:#2980b9;">${fmtW(row.settleAmt)}</b>` },
      { key: '_closeYn',      label: '마감여부',   type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${row.closeYn==='Y'?'badge-purple':'badge-gray'}">${row.closeYn==='Y'?'마감완료':'미마감'}</span>` + (row.closeDate ? `<span style="color:#888;font-size:11px;margin-left:4px;">${row.closeDate}</span>` : '') },
      { key: '_erpSend',      label: 'ERP전송',    type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${row.erpSendYn==='Y'?'badge-green':'badge-gray'}">${row.erpSendYn==='Y'?'전송완료':'미전송'}</span>` },
      { key: '_remark',       label: '비고',       type: 'readonly', colSpan: 2, visible: (row) => !!row.remark, fmt: (v, row) => row.remark || '-' },
    ];

  /* ##### [06] return (템플릿 노출) ############################################## */

  return {
      columns,
      searchParam,
      rawGridPager, raws, cfSummary,
      handleBtnAction, handleSelectAction, toggleRow, isExpanded,
      fnRowDetail, fnRowDetailLoading,
      doCollect, };
  },
  template: /* html */`
<bo-page title="정산수집원장"
  desc-summary="주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다."
  :desc-detail="['• 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다.','• 수집 단위: od_order_item / od_claim_item (상품 행 단위)','• [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다.','• 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)'].join(String.fromCharCode(10))">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-moreToggle')" style="min-width:70px">
          {{ searchParam.searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </template>
    </bo-search-area>
    <bo-search-area v-if="searchParam.searchMoreOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="columns.moreSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" />
  </bo-container>
  <!-- ===== ■. 집계 (라벨:건수/금액 인라인 스트립) ============================== -->
  <bo-container body-style="padding:7px 12px;">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;font-size:12px;color:#666;">
      <span>수집건수:<b style="color:#3498db;margin-left:3px;">{{ rawGridPager.pageTotalCount.toLocaleString() }}건</b></span>
      <span>정산대상:<b style="color:#27ae60;margin-left:3px;">{{ cfSummary.collectCnt.toLocaleString() }}건</b></span>
      <span>구매확정:<b style="color:#e67e22;margin-left:3px;">{{ cfSummary.confirmCnt.toLocaleString() }}건</b></span>
      <span>마감완료:<b style="color:#8e44ad;margin-left:3px;">{{ cfSummary.closeCnt.toLocaleString() }}건</b></span>
      <span>수집금액:<b :style="{color: cfSummary.totalAmt>=0?'#333':'#e74c3c', marginLeft:'3px'}">{{ cfSummary.totalAmt.toLocaleString() }}원</b></span>
      <span>수수료:<b style="color:#e74c3c;margin-left:3px;">{{ cfSummary.feeAmt.toLocaleString() }}원</b></span>
      <span>정산금액:<b style="color:#2980b9;margin-left:3px;">{{ cfSummary.settleAmt.toLocaleString() }}원</b></span>
    </div>
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="정산수집원장" :count-text="rawGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn-secondary btn-sm" @click="() => { raws.forEach(r => { if(!isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▼ 전체펼치기
      </button>
      <button class="btn btn-secondary btn-sm" @click="() => { raws.forEach(r => { if(isExpanded(r.settleRawId)) toggleRow(r.settleRawId); }) }">
        ▲ 전체접기
      </button>
      <button class="btn btn-blue btn-sm" @click="doCollect">
        🔄 재수집
      </button>
    </template>
    <bo-grid bare
      :columns="columns.rawGrid"
      :rows="raws"
      row-key="settleRawId"
      :is-expanded="(r) => isExpanded(r.settleRawId)"
      empty-text="데이터가 없습니다.">
      <template #row-expand="{ row: r, colspan }">
        <td :colspan="colspan" style="background:#f4f6fb;padding:12px 20px;border-top:none">
          <div v-if="fnRowDetailLoading(r)" style="font-size:12px;color:#888;padding:4px 2px;">⏳ 상세 정보를 불러오는 중…</div>
          <bo-form-area :columns="columns.rawGridRowDetail" :form="fnRowDetail(r)" :cols="3" readonly label-left compact :show-actions="false" />
        </td>
      </template>
    </bo-grid>
    <bo-pager :pager="rawGridPager" :on-set-page="n => handleBtnAction('rawData-pager-setPage', n)" :on-size-change="() => handleSelectAction('rawData-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
