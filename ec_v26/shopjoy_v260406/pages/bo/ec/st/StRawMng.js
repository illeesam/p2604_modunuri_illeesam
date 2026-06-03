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
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
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
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      } else if (cmd === 'searchParam-moreToggle') {
        searchParam.searchMoreOpen = !searchParam.searchMoreOpen;
        return;
      } else if (cmd === 'rawData-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/페이지 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StRawMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'rawData-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
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
            const dateEnd   = ref('');

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };

    // 검색 필드
  const _initSearchParam = () => ({ dateRange: '이번달', dateStart: '', dateEnd: '', searchMoreOpen: false, searchType: '', searchValue: '', type: '', status: '', vendorType: '', payMethod: '', buyConfirm: '', closeYn: '', erpSend: '', period: '', orderStatus: '', amtFrom: '', amtTo: '' });
  const searchParam = reactive(_initSearchParam());
  (() => { const r = boUtil.bofGetDateRange('이번달'); if (r) { searchParam.dateStart = r.from; searchParam.dateEnd = r.to; } })();

    const pager    = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const raws = reactive([]);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.loading = true;
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...Object.fromEntries(Object.entries(searchParam).filter(([k, v]) => k !== 'searchMoreOpen' && v !== '' && v !== null && v !== undefined))
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'rawId,srcId,vendorNm,prodNm,brandNm';
        }
        const res = await boApiSvc.stSettleRaw.getPage(params, '정산데이터관리', '목록조회');
        const data = res.data?.data;
        raws.splice(0, raws.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || raws.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
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

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

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
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onSearch — 조회 */
    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, _initSearchParam()); onSearch(); };

    const expandedRows = reactive(new Set());

    /* toggleRow — 토글 */
    const toggleRow = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded — 여부 확인 */
    const isExpanded = id => expandedRows.has(id);

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
    const fmtW = n => (Number(n || 0) >= 0 ? '' : '-') + Math.abs(Number(n || 0)).toLocaleString() + '원';

    /* fmtPct — 포맷 퍼센트 */
    const fmtPct = n => Number(n || 0).toLocaleString() + '%';

    /* rawGridColumns — BoGrid 컬럼 정의 (특수셀은 #cell- 슬롯 override) */
    const columns = {};
    columns.rawGrid = [
      { key: 'expand',         label: '',         style: 'width:30px',
        align: 'center',
        cellStyle: 'color:#aaa;font-size:11px;user-select:none;',
        fmt: (v, row) => isExpanded(row.settleRawId) ? '▲' : '▼' },
      { key: 'settleRawId',    label: '원장ID',
        cellStyle: 'font-size:12px;color:#555;' },
      { key: 'orderDate',      label: '거래일자',  fmt: (v) => v ? String(v).slice(0, 10) : '-' },
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
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('재수집이 완료되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0); }
      }
    };

    /* summaryFormColumns — 집계 카드 (BoFormArea readonly, cols=7, labelLeft) */
    columns.summaryForm = [
      { key: '_totalCnt',  label: '수집건수',    type: 'readonly', html: true, fmt: () => `<b style="color:#3498db;font-size:15px;">${pager.pageTotalCount.toLocaleString()}건</b>` },
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
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleDateRangeChange() },
      { key: 'type',       type: 'select', label: '유형',
        options: () => codes.raw_types, nullLabel: '유형 전체', width: '100px' },
      { key: 'status',     type: 'select', label: '수집상태',
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
      { key: 'vendorType', type: 'select', label: '업체구분',
        options: () => codes.raw_vendor_divs, nullLabel: '업체구분 전체', width: '110px' },
      { key: 'payMethod',  type: 'select', label: '결제수단',
        options: () => codes.pay_methods, nullLabel: '결제수단 전체', width: '120px' },
      { key: 'buyConfirm', type: 'select', label: '구매확정',
        options: () => codes.confirm_yn_opts, nullLabel: '구매확정 전체', width: '110px' },
      { key: 'closeYn',    type: 'select', label: '마감여부',
        options: () => codes.close_yn_opts, nullLabel: '마감여부 전체', width: '110px' },
      { key: 'erpSend',    type: 'select', label: 'ERP전송',
        options: () => codes.send_yn_opts, nullLabel: 'ERP전송 전체', width: '110px' },
      { key: 'period',     type: 'text',   label: '정산기간', placeholder: '정산기간(YYYY-MM)', width: '150px' },
    ];

    /* moreSearchColumns — 펼침 영역(searchMoreOpen=true) 두번째 검색바 */
    columns.moreSearch = [
      { key: 'orderStatus', type: 'select', label: '주문상태',
        options: () => codes.order_statuses_kr, nullLabel: '주문상태 전체', width: '120px' },
      { key: 'amtFrom',     type: 'text',   label: '수집금액(최소)', placeholder: '최솟값(원)', width: '120px' },
      { key: 'amtTo',       type: 'text',   label: '수집금액(최대)', placeholder: '최댓값(원)', width: '120px' },
    ];

    /* rawExpandColumns — 정산원장 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.rawExpand = [
      { key: '_orderId',      label: '주문ID',     type: 'readonly', fmt: (v, row) => row.orderId || '-' },
      { key: '_orderDate',    label: '거래일자',   type: 'readonly', fmt: (v, row) => row.orderDate || '-' },
      { key: '_orderStatus',  label: '주문상태',   type: 'readonly', fmt: (v, row) => orderStatusLabel(row.orderItemStatusCd) },
      { key: '_payMethod',    label: '결제수단',   type: 'readonly', fmt: (v, row) => row.payMethodCd || '-' },
      { key: '_buyConfirm',   label: '구매확정',   type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${row.buyConfirmYn==='Y'?'badge-green':'badge-gray'}">${row.buyConfirmYn==='Y'?'확정':'미확정'}</span>` + (row.buyConfirmDate ? `<span style="color:#888;margin-left:4px;font-size:11px;">${row.buyConfirmDate}</span>` : '') },
      { key: '_settlePeriod', label: '정산기간',   type: 'readonly', colSpan: 3, fmt: (v, row) => row.settlePeriod || '-' },

      { key: '_prodNm',       label: '상품명',     type: 'readonly', colSpan: 2, fmt: (v, row) => row.prodNm || '-' },
      { key: '_brandNm',      label: '브랜드',     type: 'readonly', fmt: (v, row) => row.brandNm || '-' },
      { key: '_skuId',        label: 'SKU ID',     type: 'readonly', mono: true, fmt: (v, row) => row.skuId || '-' },
      { key: '_normalPrice',  label: '정상가',     type: 'readonly', fmt: (v, row) => fmtW(row.normalPrice) },
      { key: '_unitPrice',    label: '단가',       type: 'readonly', fmt: (v, row) => fmtW(row.unitPrice) },
      { key: '_orderQty',     label: '수량',       type: 'readonly', fmt: (v, row) => (row.orderQty || 0).toLocaleString() + '개' },
      { key: '_itemPrice',    label: '소계',       type: 'readonly', html: true, fmt: (v, row) => `<b>${fmtW(row.itemPrice)}</b>` },

      { key: '_discntAmt',    label: '직접할인',   type: 'readonly', html: true, fmt: (v, row) => row.discntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.discntAmt)}</span>` : '-' },
      { key: '_couponDiscnt', label: '쿠폰할인',   type: 'readonly', html: true, fmt: (v, row) => row.couponDiscntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.couponDiscntAmt)}</span>` : '-' },
      { key: '_promoDiscnt',  label: '프로모션할인',type: 'readonly', html: true, fmt: (v, row) => row.promoDiscntAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.promoDiscntAmt)}</span>` : '-' },
      { key: '_cacheUse',     label: '캐쉬사용',   type: 'readonly', html: true, fmt: (v, row) => row.cacheUseAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.cacheUseAmt)}</span>` : '-' },
      { key: '_mileageUse',   label: '마일리지',   type: 'readonly', html: true, fmt: (v, row) => row.mileageUseAmt ? `<span style="color:#e74c3c;">- ${fmtW(row.mileageUseAmt)}</span>` : '-' },
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
      uiState, handleDateRangeChange,
      searchParam,
      pager, raws, cfSummary,
      handleBtnAction, handleSelectAction,
      expandedRows, toggleRow, isExpanded,
      fnStatusBadge, rawStatusLabel, fnRawStatusBadge, vendorTypeLabel, orderStatusLabel,
      fmtW, fmtPct, doCollect, codes, };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    정산수집원장
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      주문·클레임·결제 데이터를 일별로 수집한 원시 정산 데이터를 조회하고 수동 수집을 실행합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • 정산 조정·마감 전 기초 데이터로, 수정 불가 원장입니다. • 수집 단위: od_order_item / od_claim_item (상품 행 단위) • [재수집] 버튼으로 해당 기간의 데이터를 수동 재수집할 수 있습니다. • 수집 상태: COLLECTED(수집완료) / EXCLUDED(제외) / SETTLED(정산완료)
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 검색 카드 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-moreToggle')" style="min-width:70px">
          {{ searchParam.searchMoreOpen ? '▲ 접기' : '▼ 상세검색' }}
        </button>
      </template>
    </bo-search-area>
    <!-- ===== ■.■. 검색 영역 (펼침) ============================================ -->
    <bo-search-area v-if="searchParam.searchMoreOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="columns.moreSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 카드 =================================================== -->
  <!-- ===== ■. 집계 카드 =================================================== -->
  <div class="card" style="margin-bottom:12px;">
    <bo-form-area :columns="columns.summaryForm" :form="{}" :cols="7" readonly label-left compact :show-actions="false" label-width="100px" />
  </div>
  <!-- ===== □. 집계 카드 =================================================== -->
  <!-- ===== ■. 목록 카드 =================================================== -->
  <bo-grid
    :columns="columns.rawGrid"
    :rows="raws"
    row-key="settleRawId"
    list-title="정산수집원장"
    :is-expanded="(r) => isExpanded(r.settleRawId)"
    empty-text="데이터가 없습니다." row-clickable
    @row-click="(r) => toggleRow(r.settleRawId)">
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
    <template #row-expand="{ row: r, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:12px 20px;border-top:none">
        <bo-form-area :columns="columns.rawExpand" :form="r" :cols="3" readonly label-left compact :show-actions="false" />
      </td>
    </template>
  </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('rawData-pager-setPage', n)" :on-size-change="() => handleSelectAction('rawData-pager-sizeChange')" />
</div>
<!-- ===== □. 목록 카드 =================================================== -->
`,
};
