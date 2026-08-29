/* ShopJoy Admin - 주문관리 목록 + 하단 OrderDtl 임베드 */
export default {
  name: 'od-order-odOrderMng',
  props: {
    navigate:          { type: Function, required: true }, // 페이지 이동
    openNewWindow:     { type: Function, default: () => {} }, // 실제 새 브라우저 창으로 열기 (Ctrl+클릭)
    initSearchValue:   { type: String,   default: null },  // ZdSimul BO상세 자동 조회값
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const orders = reactive([]);                                                // 주문 목록 (메인 그리드 데이터)
    const members = reactive([]);                                               // 회원 목록 (추가결재요청 picker)
    const claims = reactive([]);                                                // 클레임 목록 (셀 렌더용)
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], payment_methods: [], dliv_statuses: [], order_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });
    const siteOptions = reactive([]);  // 사이트 선택 옵션 (BO 는 강제 필터 없음 — 선택적 검색용)

    const SORT_MAP = { reg: { asc: 'orderDate asc', desc: 'orderDate desc' } };


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateRangeStart || searchParam.dateRangeEnd) && !searchParam.dateRangeType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        listGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchData();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 신규 주문 등록 (인라인 Dtl / Ctrl·휠클릭 시 새창)
      } else if (cmd === 'orders-add') {
        if (param && (param.ctrlKey || param.metaKey || param.button === 1)) { return props.openNewWindow('odOrderDtl', null, 'new'); }
        detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++;
        return;
      // 변경작업 모달 열기
      } else if (cmd === 'actionsModal-open') {
        return openBulk();
      // 변경작업 모달 닫기
      } else if (cmd === 'actionsModal-close') {
        uiState.bulkOpen = false;
        return;
      // 변경작업 모달 탭 전환
      } else if (cmd === 'actionsModal-tabChange') {
        uiState.bulkTab = param;
        Object.keys(bulkErrors).forEach(k => delete bulkErrors[k]);
        return;
      // 변경작업 모달 저장
      } else if (cmd === 'actionsModal-apply') {
        return saveBulk();
      // 추가결재자 변경
      } else if (cmd === 'actionsModal-apprToChange') {
        return onApprToChange();
      // 요청대상 변경
      } else if (cmd === 'actionsModal-reqTargetChange') {
        return onReqTargetChange();
      // 상세 인라인 패널 닫기 → 빈 신규 폼(비활성)으로 초기화 (영역 유지)
      } else if (cmd === 'detailPanel-close') {
        return resetDetailToNew();
      // 회원 선택 모달 열기
      } else if (cmd === 'memberPickModal-open') {
        memberPick.open = true;
        return;
      // 회원 선택 모달 닫기
      } else if (cmd === 'memberPickModal-close') {
        memberPick.open = false;
        return;
      // 회원 선택 해제
      } else if (cmd === 'memberPickModal-clear') {
        searchParam.memberId = ''; searchParam.memberNm = '';
        return;
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'orders-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'orders-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'orders-pager-sizeChange') {
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 그리드 행 참조 모달 열기
      } else if (cmd === 'orders-rowRefClick') {
        return showRefModal(param.type, param.id);
      // 그리드 행 체크 토글
      } else if (cmd === 'orders-rowToggleCheck') {
        if (checked.has(param)) { checked.delete(param); }
        else { checked.add(param); }
        return;
      // 그리드 전체 체크 토글
      } else if (cmd === 'orders-rowToggleCheckAll') {
        if (cfAllChecked.value) { orders.forEach(o => checked.delete(o.orderId)); }
        else { orders.forEach(o => checked.add(o.orderId)); }
        return;
      // 회원 선택 모달에서 회원 선택
      } else if (cmd === 'memberPickModal-select') {
        searchParam.memberId = param.memberId;
        searchParam.memberNm = param.memberNm || param.loginId || param.memberId;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 라우터 (cmd: '{영역명}-cellClick'). e.colKey 로 컬럼별 분기 가능 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ OdOrderMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'orders-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit') {
          if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { return props.openNewWindow('odOrderDtl', row.orderId, 'edit'); }
          if (window._odOrderDtlState) window._odOrderDtlState.activeTab = 'items';
          detailPanel.selectedId = row.orderId; detailPanel.openMode = 'edit'; detailPanel.active = true; detailPanel.reloadTrigger++;
          return;
        }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        if (colKey === 'btn_row_kanban') {
          // Ctrl+클릭/휠클릭: 같은 칸반을 탭 대신 별도 창으로 — 목록을 보면서 상태를 옮길 때 사용
          if (e && (e.ctrlKey || e.metaKey || e.button === 1)) { return fnOpenKanbanPopup(row.orderId); }
          props.navigate('odOrderKanban', { orderId: row.orderId });
          return;
        }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          if (e.ctrlKey || e.metaKey || e.button === 1) { return props.openNewWindow('odOrderDtl', row.orderId); }
          if (window._odOrderDtlState) window._odOrderDtlState.activeTab = 'items';
          detailPanel.selectedId = row.orderId; detailPanel.openMode = 'view'; detailPanel.active = true; detailPanel.reloadTrigger++;
          return;
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (popCmd, param, result) => {
      console.log(' ■■ OdOrderMng : fnCallbackModal -> ', popCmd, param, result);
      if (popCmd === 'cmPopup-member-pick') {
        if (result == null) { memberPick.open = false; return; }
        searchParam.memberId = result.selId;
        searchParam.memberNm = result.selName || result.loginId || result.selId;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown popCmd:', popCmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', memberId: '', memberNm: '', dateRangeType: '', dateRange: '', dateRangeStart: '', dateRangeEnd: '', orderStatusCd: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    const listGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 하단 상세 (인라인 Dtl) — 항상 표시. 진입 시 빈 신규 폼(비활성) */
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'view', reloadTrigger: 0, active: false, resetSeq: 0 });

    /* 일괄선택 */
    const checked = reactive(new Set());

    const DEFAULT_TMPL = boConsts.APPROVAL_TMPL;

    /* 변경작업 모달 (actionsModal) */
    const bulkForm = reactive({
      status:'', payMethod:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });
    const bulkErrors = reactive({}); // 변경작업 모달 검증 오류 (항목 아래 빨간 라벨)

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      listGridPager.pageNo = 1;
      handleSearchData();
    };



    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'orderId,memberNm,loginId,recvNm,recvPhone';
        }
        const [ordersRes, membersRes] = await Promise.all([
          boApiSvc.odOrder.getPage(params, '주문관리', '목록조회').catch(() => ({ data: { data: { pageList: [], pageTotalCount: 0 } } })),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '주문관리', '목록조회').catch(() => ({ data: { data: { pageList: [] } } })),
        ]);
        orders.splice(0, orders.length, ...(ordersRes.data?.data?.pageList || ordersRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        claims.splice(0, claims.length);
        listGridPager.pageTotalCount = ordersRes.data?.data?.pageTotalCount || 0;
        listGridPager.pageTotalPage = ordersRes.data?.data?.pageTotalPage || coUtil.cofTotalPage(listGridPager);
        coUtil.cofBuildPagerNums(listGridPager);
        Object.assign(listGridPager.pageCond, ordersRes.data?.data?.pageCond || listGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        orders.splice(0, orders.length);
        members.splice(0, members.length);
        claims.splice(0, claims.length);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      listGridPager.pageNo = 1;
    };


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['ORDER_STATUS_CD', 'PAYMENT_METHOD', 'DLIV_STATUS', 'ORDER_DATE_TYPE', 'APPROVAL_ACTION', 'REQ_TARGET', 'DATE_RANGE_OPT'], {compNm: 'OdOrderMng'});
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS_CD');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      codes.order_date_types = codeStore.sgGetGrpCodes('ORDER_DATE_TYPE');
      codes.approval_actions = codeStore.sgGetGrpCodes('APPROVAL_ACTION');
      codes.req_targets = codeStore.sgGetGrpCodes('REQ_TARGET');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
            siteOptions.splice(0, siteOptions.length, ...(await window.boUtil.bofLoadSiteOptions()));
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      /* 검색조건 초기값 (계산이 필요한 항목) */
      const today = new Date();
      const thisYear = today.getFullYear();
      Object.assign(searchParam, { dateRangeType: 'order_date', dateRangeStart: `${thisYear - 3}-01-01`, dateRangeEnd: `${thisYear}-12-31` });
      await fnLoadCodes();
      if (props.initSearchValue) {
        searchParam.searchValue = props.initSearchValue;
        searchParam.dateRangeStart = ''; searchParam.dateRangeEnd = '';
      }
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchData('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'view';
      detailPanel.active = false;   // 버튼 숨김
      detailPanel.resetSeq++;       // :key 재마운트 → 폼 초기화
    };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng') { if (opts.reload) { handleSearchData('RELOAD'); } resetDetailToNew(); return; }
      if (pg === '__cancelEdit__') {
        if (detailPanel.selectedId && detailPanel.selectedId !== '__new__') { detailPanel.openMode = 'view'; return; }
        resetDetailToNew(); return;
      }
      if (pg === '__closeDtl__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);

    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);


    /* 주문 fnStatusBadge — 공통코드 ORDER_STATUS code_opt1 우선, 미매칭 시 로컬 fallback */
    const _ORDER_STATUS_FB = boConsts.ORDER_STATUS_BADGE;
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('ORDER_STATUS_CD', s, _ORDER_STATUS_FB[s] || 'badge-gray');

    /* 주문 fnPayStatusBadge */
    const _PAY_STATUS_FB = boConsts.PAY_STATUS_BADGE;
    /* fnPayStatusBadge — 유틸 */
    const fnPayStatusBadge = s => coUtil.cofCodeBadge('PAY_STATUS', s, _PAY_STATUS_FB[s] || 'badge-gray');

    /* handleDelete — 삭제 */
    const handleDelete = async (o) => {
      const ok = await showConfirm('삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(orders)) { return; }
      const idx = orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) { orders.splice(idx, 1); }
      if (detailPanel.selectedId === o.orderId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.odOrder.remove(o.orderId, '주문관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* ===== 엑셀 다운로드 =====
       domain 키는 백엔드 OdPdCmExcelDomainConfig 의 @Bean 등록명과 일치해야 한다. */
    const excelModal = reactive({ show: false });

    /* buildExcelParams — 엑셀은 현재 검색조건 전체를 그대로 넘긴다(페이지 번호/크기 없이 서버가 전건 청크 처리) */
    const buildExcelParams = () => {
      const p = { ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
      if (p.searchValue && !p.searchType) { p.searchType = 'orderId,memberNm,loginId,recvNm,recvPhone'; }
      return p;
    };

    /* claimByOrder — 클레임 으로 주문 */
    const claimByOrder = (orderId) =>
      (Array.isArray(claims) ? claims : []).find(c => c.orderId === orderId);

    /* fnClaimTypeColor — 유틸 */
    const fnClaimTypeColor = (t) => coConsts.claimTypeColor(t);

    /* 결제수단 색맵 (배지 배경/글자색) */
    const PAY_COLORS = {
      '계좌이체': { bg:'#e3f2fd', fg:'#1565c0' },
      '카드결제': { bg:'#f3e5f5', fg:'#6a1b9a' },
      '캐쉬':     { bg:'#fff3e0', fg:'#e65100' },
    };
    /* fnPayMethodStyle — 유틸 */
    const fnPayMethodStyle = (v) => {
      const c = PAY_COLORS[v] || { bg:'#e8f5e9', fg:'#2e7d32' };
      return `font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:${c.bg};color:${c.fg};`;
    };

    /* getItemCount — 주문항목 수.
       백엔드가 od_order_item 을 집계한 orderItemCnt 를 쓴다.
       예전에는 상품명의 "외 N" 을 파싱해 추정했는데, 항목이 0건인 주문(시뮬 생성분 등)도
       1개로 표시돼 실제 항목 기준인 칸반과 어긋났다. 값이 없으면 옛 방식으로 폴백. */
    const getItemCount = (o) => {
      if (o.orderItemCnt != null) { return Number(o.orderItemCnt); }
      const m = (o.prodNm || '').match(/외\s*(\d+)/);
      return m ? parseInt(m[1]) + 1 : 1;
    };

    /* isChecked — 여부 확인 */
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => orders.length > 0 && orders.every(o => checked.has(o.orderId)));

    /* onApprToChange — 추가결재자 변경 */
    const onApprToChange = () => {
      const m = (members).find(x => String(x.memberId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.memberNm || ''; bulkForm.apprToPhone = m.memberPhone || ''; bulkForm.apprToEmail = m.memberEmail || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };

    /* onReqTargetChange — 요청대상 변경 */
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(orders) ? orders : [], o => ids.includes(o.orderId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문') { bulkForm.reqTargetNm = first.orderId || ''; }
      else if (bulkForm.reqTarget === '상품') { bulkForm.reqTargetNm = first.prodNm || ''; }
      else if (bulkForm.reqTarget === '배송') {
        bulkForm.reqTargetNm = '배송('+first.orderId+')';
      } else { bulkForm.reqTargetNm = first.orderId || ''; }
    };
    const cfBuildTmplMsg = computed(() => (bulkForm.tmplMsg || '')
      .replace('{target}', bulkForm.reqTarget || '-')
      .replace('{targetNm}', bulkForm.reqTargetNm || '-')
      .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
      .replace('{reason}', bulkForm.reqReason || '-'));

    /* openBulk — 변경작업 모달 열기 */
    const openBulk = () => {
      if (!checked.size) { showToast('항목을 선택하세요.', 'error'); return; }
      uiState.bulkTab = 'status';
      Object.assign(bulkForm, {
        status:'', payMethod:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      uiState.bulkOpen = true;
      Object.keys(bulkErrors).forEach(k => delete bulkErrors[k]);
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) { return ''; }
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(orders, o => ids.includes(o.orderId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) { return ''; }
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 주문상태 변경: ${o.orderStatusCd || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'payMethod') {
        if (!bulkForm.payMethod) { return ''; }
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 결제수단 변경: ${o.payMethodCd || '-'} → ${bulkForm.payMethod}`);
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { return ''; }
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { return ''; }
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) { return ''; }
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });

    /* saveBulk — 변경작업 저장 */
    const saveBulk = async () => {
      const ids = Array.from(checked);
      if (!ids.length) { showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      const cfg = {
        status:     { field:'status',       label:'주문상태',     path:'orders/bulk-status' },
        payMethod:  { field:'payMethod',    label:'결제수단',     path:'orders/bulk-payMethod' },
        approval:   { field:'apprAction',   label:'결재처리',     path:'orders/bulk-approval' },
        approvalReq:{ field:'apprToUserId', label:'추가결재요청', path:'orders/bulk-approvalReq' },
      }[uiState.bulkTab];
      Object.keys(bulkErrors).forEach(k => delete bulkErrors[k]);
      const val = bulkForm[cfg.field];
      if (!val) {
        bulkErrors[cfg.field] = `${cfg.label}을(를) 선택해주세요.`;
        showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      const ok = await showConfirm(`일괄 ${cfg.label}`, `선택한 ${ids.length}건에 대해 ${cfg.label} 작업을 진행하시겠습니까?`);
      if (!ok) { return; }
      let rows = [];
      if (uiState.bulkTab === 'status') {
        window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.orderStatusCd = bulkForm.status; });
        rows = ids.map(id => ({ orderId: id, orderStatusCd: bulkForm.status }));
      }
      if (uiState.bulkTab === 'payMethod') {
        window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.payMethodCd = bulkForm.payMethod; });
        rows = ids.map(id => ({ orderId: id, payMethodCd: bulkForm.payMethod }));
      }
      if (uiState.bulkTab === 'approval') {
        window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) { o.apprStatus = bulkForm.apprAction; o.apprComment = bulkForm.apprComment; } });
        rows = ids.map(id => ({ orderId: id }));
      }
      if (uiState.bulkTab === 'approvalReq') {
        window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) {
          o.apprToUserId = bulkForm.apprToUserId; o.apprToNm = bulkForm.apprToNm;
          o.reqTarget = bulkForm.reqTarget; o.reqTargetNm = bulkForm.reqTargetNm;
          o.reqAmount = Number(bulkForm.reqAmount||0); o.reqReason = bulkForm.reqReason;
        } });
        rows = ids.map(id => ({ orderId: id }));
      }
      checked.clear();
      uiState.bulkOpen = false;
      try {
        const res = await boApiSvc.odOrder.saveList(uiState.bulkTab, rows, '주문관리', '목록조회');
        if (showToast) { showToast(`${ids.length}건 처리되었습니다.`, 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnOpenKanbanPopup — [📋 칸반] Ctrl+클릭/휠클릭 시 칸반 보드를 별도 창으로 (클레임관리와 공통 로직) */
    const fnOpenKanbanPopup = (orderId) => boUtil.bofOpenKanbanPopup(orderId, null, props.showToast);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'orderId',   label: '주문ID' },
          { value: 'memberNm',  label: '회원명' },
          { value: 'loginId',   label: '로그인ID' },
          { value: 'recvNm',    label: '수령인' },
          { value: 'recvPhone', label: '수령연락처' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'memberId', type: 'pick', label: '회원', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('memberPickModal-open'),
        onClear: () => handleBtnAction('memberPickModal-clear') },
      { key: 'orderStatusCd', type: 'select', label: '상태', options: () => codes.order_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '주문일',
        typeKey: 'dateRangeType', startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        typeOptions: () => codes.order_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
          { key: 'siteId', type: 'select', label: '사이트', options: () => siteOptions, nullLabel: '전체' },
    ];

    /* fnPayStatusText — 유틸 */
    const fnPayStatusText = (o) => (o.orderStatusCd === 'CANCELED' || o.orderStatusCd === '자동취소') ? '환불완료' : o.orderStatusCd === '입금대기' ? '미결제' : '결제완료';
    // 목록 그리드
    columns.listGrid = [
      { key: 'orderId',       label: '주문ID', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'memberNm',      label: '회원', refLink: 'member', refKey: 'memberId',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'orderDate',     label: '주문일시', sortKey: 'reg', style: 'white-space:nowrap;',  fmt: (v) => v ? String(v).slice(0, 16) : '-' },
      { key: 'prodNm',        label: '상품',
        fmt: (v, row) => `${row.prodNm || ''} (${getItemCount(row)}개)` },
      { key: 'payAmt',        label: '결제금액', fmt: (v) => coUtil.cofWon(v) },
      { key: 'payMethodCd',   label: '결제수단',
        fmt: (v, row) => row.payMethodCdNm || row.payMethodCd || '-',
        cellInnerStyle: (v) => fnPayMethodStyle(v) },
      { key: '_payStatus',    label: '결제상태',
        fmt: (v, row) => fnPayStatusText(row),
        badge: (row) => fnPayStatusBadge(fnPayStatusText(row)) },
      { key: 'orderStatusCd', label: '주문상태',
        fmt: (v, row) => row.orderStatusCdNm || row.orderStatusCd,
        badge: (row) => fnStatusBadge(row.orderStatusCd) },
      { key: '_claim',        label: '클레임상태',
        fmt: (v, row) => {
          const c = claimByOrder(row.orderId);
          return c ? `${c.claimTypeCd} · ${c.claimStatusCdNm || c.claimStatusCd}` : '-';
        },
        cellInnerStyle: (v, row) => {
          const c = claimByOrder(row.orderId);
          if (!c) { return 'font-size:11px;color:#ccc;'; }
          return `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${fnClaimTypeColor(c.claimTypeCd)};`;
        } },
      { key: 'siteNm',         label: '사이트명',
        cellStyle: 'color:#2563eb;' },
    ];
    /* fnGridRowStyle — 유틸 */
    const fnGridRowStyle = (o) =>
      (detailPanel.selectedId === o.orderId ? 'background:#fff8f9;' : '')
      + (isChecked(o.orderId) ? 'background:#eef6fd;' : '');

    /* 회원선택 그리드 컬럼은 OdMemberPickModal 내장 */

    columns.apprContactForm = [
      { key: 'apprToUserId', label: '추가결재자', type: 'select', colSpan: 2, nullLabel: '선택하세요', required: true,
        options: () => members.map(m => ({ value: m.memberId, label: `${m.memberNm} (${m.memberId})` })),
        onChange: () => handleBtnAction('actionsModal-apprToChange') },
      { key: 'apprToPhone', label: '전화번호', type: 'text', readonly: true },
      { key: 'apprToEmail', label: '이메일',   type: 'text', readonly: true },
    ];
    // 결재 대상 폼
    columns.apprTargetForm = [
      { key: 'reqTarget',   label: '요청대상', type: 'select', nullable: false,
        options: () => codes.req_targets, onChange: () => handleBtnAction('actionsModal-reqTargetChange') },
      { key: 'reqTargetNm', label: '요청대상명', type: 'text', placeholder: '수정 가능' },
    ];
    // 결재 상세 폼
    columns.apprDetailForm = [
      { key: 'reqAmount', label: '요청금액', type: 'number', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'reqReason', label: '요청사유', type: 'textarea', rows: 2, placeholder: '(선택)' },
      { type: 'rowBreak' },
      { key: 'tmplMsg',   label: '전송 템플릿', type: 'slot', name: 'tmplMsg', colSpan: 2,
        hint: '치환: {target} {targetNm} {amount} {reason}' },
    ];
    // 결재처리구분/결재코멘트 (approval 탭)
    columns.bulkApprovalForm = [
      { key: 'apprAction',  label: '결재처리 구분', type: 'select', nullLabel: '선택하세요', required: true,
        options: () => codes.approval_actions, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'apprComment', label: '결재 코멘트', type: 'textarea', rows: 2,
        placeholder: '(선택)' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      excelModal, buildExcelParams,                                                                                    // 엑셀 다운로드
      orders, members, uiState, codes, searchParam, listGridPager, detailPanel, checked, bulkForm, bulkErrors, bulkOpen, memberPick,        // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                           // dispatch (모든 이벤트 / 액션 라우팅) + 모달 통합 콜백
      cfDetailEditId, cfDetailKey, cfAllChecked, cfBuildTmplMsg, cfBulkPreview,                        // computed
      selectedId: computed(() => detailPanel.selectedId),                                                                  // template 직접 참조
      isChecked, fnGridRowStyle,                                           // 헬퍼
      inlineNavigate,                                                                                                      // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="주문관리" :share-query="searchParam">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="주문목록" :count-text="listGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <span v-if="checked.size" style="margin-right:10px;font-size:12px;color:#1565c0;font-weight:700;">
        선택 {{ checked.size }}건
      </span>
      <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="handleBtnAction('actionsModal-open')">
        📝 변경작업 선택
      </button>
      <button class="btn btn_excel" @click="excelModal.show = true">
        📥 엑셀
      </button>
      <button class="btn btn_new" title="Ctrl+클릭/휠클릭: 새창"
        @click="handleBtnAction('orders-add', $event)"
        @auxclick="handleBtnAction('orders-add', $event)">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 그리드 (기본 약 10행 높이 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:340px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare selectable :columns="columns.listGrid" :rows="orders" row-key="orderId" :selected-key="detailPanel.selectedId"
        :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
        :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
        @sort="key => handleBtnAction('orders-sort', key)"
        @toggle-check="id => handleSelectAction('orders-rowToggleCheck', id)"
        @toggle-check-all="handleSelectAction('orders-rowToggleCheckAll')"
        grid-id="orders-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
        @ref-click="({type,id}) => handleSelectAction('orders-rowRefClick', {type, id})" row-actions
            table-max-height="540px">
        <template #row-actions="{ row, gridId }">
          <div class="actions">
            <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row, $event)" @auxclick.stop="handleGridCellAction(gridId, 'btn_row_edit', row, $event)">수정</button>
            <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">삭제</button>
            <button class="btn btn_row_kanban" title="Ctrl+클릭/휠클릭: 새 창으로 칸반 열기" style="background:#8b5cf6;color:#fff;border:none;border-radius:5px;padding:3px 7px;font-size:11px;font-weight:600;cursor:pointer;" @click.stop="handleGridCellAction(gridId, 'btn_row_kanban', row, $event)" @auxclick.stop="handleGridCellAction(gridId, 'btn_row_kanban', row, $event)">📋 칸반</button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="listGridPager" :on-set-page="n => handleBtnAction('orders-pager-setPage', n)"
        :on-size-change="() => handleSelectAction('orders-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </bo-container>
  <!-- ===== ■. 하단 상세: OrderDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ===================== -->
  <od-order-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />
  <!-- ===== □. 하단 상세: OrderDtl 임베드 ===================================== -->
  <!-- ===== ■. 변경작업 모달 (actionsModal) ===================================== -->
  <bo-modal :show="bulkOpen" :title="'📝 변경작업 (' + checked.size + '건 선택)'" width="640px" max-height="90vh" box-pad="0" @close="handleBtnAction('actionsModal-close')">
    <div style="display:flex;flex-direction:column;max-height:76vh;">
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'주문상태'},{id:'payMethod',label:'결제수단'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="handleBtnAction('actionsModal-tabChange', t.id)"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">
          {{ t.label }}
        </button>
      </div>
      <div style="padding:20px 18px;flex:1;overflow-y:auto;min-height:280px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">
            변경할 주문상태
          </label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="c in codes.order_statuses" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
          <span v-if="bulkErrors.status" class="field-error">{{ bulkErrors.status }}</span>
        </div>
        <div v-if="uiState.bulkTab==='payMethod'">
          <label class="form-label">
            변경할 결제수단
          </label>
          <select class="form-control" v-model="bulkForm.payMethod">
            <option value="">선택하세요</option>
            <option v-for="c in codes.payment_methods" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
          <span v-if="bulkErrors.payMethod" class="field-error">{{ bulkErrors.payMethod }}</span>
        </div>
        <!-- ===== ■.■.■.■. 결재처리 (BoFormArea 자동 렌더) =========================== -->
        <div v-if="uiState.bulkTab==='approval'">
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.bulkApprovalForm" :form="bulkForm" :errors="bulkErrors"
            :cols="2" :show-actions="false" />
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <bo-form-area :columns="columns.apprContactForm" :form="bulkForm" :errors="bulkErrors"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청대상/요청대상명 (BoFormArea 자동 렌더) =================== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.apprTargetForm" :form="bulkForm" :errors="bulkErrors"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청금액/요청사유/전송템플릿 (BoFormArea 자동 렌더) ============== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.apprDetailForm" :form="bulkForm" :errors="bulkErrors"
            :cols="2" :show-actions="false">
            <template #tmplMsg>
              <textarea class="form-control" v-model="bulkForm.tmplMsg" rows="4" style="font-family:monospace;font-size:11.5px;"></textarea>
                <div style="margin-top:6px;padding:8px 10px;background:#f6f8fa;border-radius:6px;font-family:monospace;font-size:11.5px;white-space:pre-wrap;color:#333;border:1px dashed #d0d7de;">
                  {{ cfBuildTmplMsg }}
                </div>
              </template>
            </bo-form-area>
        </div>
      </div>
      <!-- 탭 본문 끝 (위 div는 padding:20px 18px;flex:1;overflow-y:auto;) -->
      <div style="padding:10px 18px 14px;border-top:1px solid #eee;background:#fafafa;flex-shrink:0;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">
          📋 작업내용
        </div>
        <textarea readonly :value="cfBulkPreview || '탭에서 변경값을 선택하면 작업내용이 자동으로 표시됩니다.'"
          style="width:100%;min-height:120px;max-height:200px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fff;resize:vertical;"></textarea>
      </div>
      <div style="padding:12px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:6px;background:#fff;flex-shrink:0;">
        <button class="btn btn_cancel" @click="handleBtnAction('actionsModal-close')">
          취소
        </button>
        <button class="btn btn_save" @click="handleBtnAction('actionsModal-apply')">
          저장
        </button>
      </div>
    </div>
  </bo-modal>
  <!-- ===== □. 변경작업 모달 ================================================= -->
  <!-- ===== ■. 회원 선택 팝업 ================================================ -->
  <bo-cm-popup-modal popup-cmd="cmPopup-member-pick" popup-code="member" :show="memberPick.open" :on-callback="fnCallbackModal" />
  <!-- ===== □. 회원 선택 팝업 ================================================ -->
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" domain="odOrder"
    area-nm="주문관리" :columns="columns.listGrid" ui-nm="주문관리" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`
};
