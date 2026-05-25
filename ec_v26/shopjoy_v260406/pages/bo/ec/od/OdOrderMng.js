/* ShopJoy Admin - 주문관리 목록 + 하단 OrderDtl 임베드 */
window.OdOrderMng = {
  name: 'OdOrderMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    const orders = reactive([]);                                                // 주문 목록 (메인 그리드 데이터)
    const members = reactive([]);                                               // 회원 목록 (추가결재요청 picker)
    const claims = reactive([]);                                                // 클레임 목록 (셀 렌더용)
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], payment_methods: [], dliv_statuses: [], order_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'orderDate asc', desc: 'orderDate desc' } };

    /* _initSearchParam — 초기화 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        pager.pageNo = 1;
        return handleSearchData();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-date-range') {
        return handleDateRangeChange();
      // 신규 주문 등록 (인라인 Dtl)
      } else if (cmd === 'orders-add') {
        detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++;
        return;
      // 엑셀 내보내기
      } else if (cmd === 'orders-excel') {
        return exportExcel();
      // 변경작업 모달 열기
      } else if (cmd === 'actionsModal-open') {
        return openBulk();
      // 변경작업 모달 닫기
      } else if (cmd === 'actionsModal-close') {
        uiState.bulkOpen = false;
        return;
      // 변경작업 모달 탭 전환
      } else if (cmd === 'actionsModal-tab-change') {
        uiState.bulkTab = param;
        return;
      // 변경작업 모달 저장
      } else if (cmd === 'actionsModal-apply') {
        return saveBulk();
      // 추가결재자 변경
      } else if (cmd === 'actionsModal-appr-to-change') {
        return onApprToChange();
      // 요청대상 변경
      } else if (cmd === 'actionsModal-req-target-change') {
        return onReqTargetChange();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        detailPanel.selectedId = null;
        return;
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
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdOrderMng.js : handleSelectAction -> ', cmd, param);
      // 그리드 정렬 헤더 클릭
      if (cmd === 'orders-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'orders-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'orders-pager-sizeChange') {
        pager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 그리드 행 클릭 → 편집 인라인 패널 열기
      } else if (cmd === 'orders-rowEdit') {
        detailPanel.selectedId = param; detailPanel.openMode = 'edit'; detailPanel.reloadTrigger++;
        return;
      // 그리드 행 보기
      } else if (cmd === 'orders-rowView') {
        detailPanel.selectedId = param; detailPanel.openMode = 'view'; detailPanel.reloadTrigger++;
        return;
      // 그리드 행 삭제
      } else if (cmd === 'orders-rowDelete') {
        return handleDelete(param);
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

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', memberId: '', memberNm: '', dateType: 'order_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());

    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 하단 상세 (인라인 Dtl) */
    const detailPanel = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 일괄선택 */
    const checked = reactive(new Set());

    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';

    /* 변경작업 모달 (actionsModal) */
    const bulkForm = reactive({
      status:'', payMethod:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });
    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ============================

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
      pager.pageNo = 1;
      handleSearchData();
    };

    /* sortIcon — 정렬 아이콘 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
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
        pager.pageTotalCount = ordersRes.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = ordersRes.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, ordersRes.data?.data?.pageCond || pager.pageCond);
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
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      codes.order_date_types = codeStore.sgGetGrpCodes('ORDER_DATE_TYPE');
      codes.approval_actions = codeStore.sgGetGrpCodes('APPROVAL_ACTION');
      codes.req_targets = codeStore.sgGetGrpCodes('REQ_TARGET');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData('DEFAULT');
    });

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng') { detailPanel.selectedId = null; if (opts.reload) { handleSearchData('RELOAD'); } return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}`);

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 주문 fnStatusBadge — 공통코드 ORDER_STATUS code_opt1 우선, 미매칭 시 로컬 fallback */
    const _ORDER_STATUS_FB = {
      '입금대기': 'badge-orange', '결제완료': 'badge-blue', '상품준비중': 'badge-orange',
      '배송중': 'badge-blue', '배송완료': 'badge-green', '구매확정': 'badge-gray',
      '취소': 'badge-red', '자동취소': 'badge-red',
    };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('ORDER_STATUS', s, _ORDER_STATUS_FB[s] || 'badge-gray');

    /* 주문 fnPayStatusBadge */
    const _PAY_STATUS_FB = {
      '미결제':'badge-gray','부분결제':'badge-orange','결제완료':'badge-green',
      '결제실패':'badge-red','환불중':'badge-orange','부분환불':'badge-orange','환불완료':'badge-purple',
    };
    /* fnPayStatusBadge — 유틸 */
    const fnPayStatusBadge = s => coUtil.cofCodeBadge('PAY_STATUS', s, _PAY_STATUS_FB[s] || 'badge-gray');

    /* handleDelete — 삭제 */
    const handleDelete = async (o) => {
      const ok = await showConfirm('삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(orders)) { return; }
      const idx = orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) { orders.splice(idx, 1); }
      if (detailPanel.selectedId === o.orderId) { detailPanel.selectedId = null; }
      try {
        const res = await boApiSvc.odOrder.remove(o.orderId, '주문관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(orders, [{label:'주문ID',key:'orderId'},{label:'회원명',key:'userNm'},{label:'상태',key:'statusCd'},{label:'결제금액',key:'totalAmount'},{label:'결제방법',key:'payMethodCd'},{label:'주문일',key:'orderDate'}], '주문목록.csv');

    /* claimByOrder — 클레임 으로 주문 */
    const claimByOrder = (orderId) =>
      (Array.isArray(claims) ? claims : []).find(c => c.orderId === orderId);

    /* fnClaimTypeColor — 유틸 */
    const fnClaimTypeColor = (t) => ({ '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' }[t] || '#9ca3af');

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

    /* getItemCount — 조회 */
    const getItemCount = (o) => {
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
      const val = bulkForm[cfg.field];
      if (!val) { showToast(`${cfg.label} 입력값을 확인하세요.`, 'error'); return; }
      const ok = await showConfirm(`일괄 ${cfg.label}`, `선택한 ${ids.length}건에 대해 ${cfg.label} 작업을 진행하시겠습니까?`);
      if (!ok) { return; }
      if (uiState.bulkTab === 'status') { window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.orderStatusCd = bulkForm.status; }); }
      if (uiState.bulkTab === 'payMethod') { window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.payMethodCd = bulkForm.payMethod; }); }
      if (uiState.bulkTab === 'approval') { window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) { o.apprStatus = bulkForm.apprAction; o.apprComment = bulkForm.apprComment; } }); }
      if (uiState.bulkTab === 'approvalReq') window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) {
        o.apprToUserId = bulkForm.apprToUserId; o.apprToNm = bulkForm.apprToNm;
        o.reqTarget = bulkForm.reqTarget; o.reqTargetNm = bulkForm.reqTargetNm;
        o.reqAmount = Number(bulkForm.reqAmount||0); o.reqReason = bulkForm.reqReason;
      } });
      checked.clear();
      uiState.bulkOpen = false;
      try {
        const res = await boApiSvc.odOrder.bulkAction(cfg.path, { ids, ...bulkForm, tmplMsgRendered: cfBuildTmplMsg.value }, '주문관리', '목록조회');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        if (showToast) { showToast(`${ids.length}건 처리되었습니다.`, 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    // 기본 검색
    const baseSearchColumns = [
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
      { key: 'status', type: 'select', label: '상태', options: () => codes.order_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '주문일',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.order_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    /* fnPayStatusText — 유틸 */
    const fnPayStatusText = (o) => (o.orderStatusCd === '취소' || o.orderStatusCd === '자동취소') ? '환불완료' : o.orderStatusCd === '입금대기' ? '미결제' : '결제완료';
    // 목록 그리드
    const listGridColumns = [
      { key: 'orderId',       label: '주문ID', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'memberNm',      label: '회원', refLink: 'member', refKey: 'memberId',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'orderDate',     label: '주문일시', sortKey: 'reg', style: 'white-space:nowrap;' },
      { key: 'prodNm',        label: '상품',
        fmt: (v, row) => `${row.prodNm || ''} (${getItemCount(row)}개)` },
      { key: 'payAmt',        label: '결제금액', fmt: (v) => (v || 0).toLocaleString() + '원' },
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
      { key: '_site',         label: '사이트명',
        fmt: () => cfSiteNm.value,
        cellStyle: 'color:#2563eb;' },
    ];
    /* fnGridRowStyle — 유틸 */
    const fnGridRowStyle = (o) =>
      (detailPanel.selectedId === o.orderId ? 'background:#fff8f9;' : '')
      + (isChecked(o.orderId) ? 'background:#eef6fd;' : '');

    /* 회원선택 그리드 컬럼은 OdMemberPickModal 내장 */

    const apprContactFormColumns = [
      { key: 'apprToPhone', label: '전화번호', type: 'text', readonly: true },
      { key: 'apprToEmail', label: '이메일',   type: 'text', readonly: true },
    ];
    // 결재 대상 폼
    const apprTargetFormColumns = [
      { key: 'reqTarget',   label: '요청대상', type: 'select', nullable: false,
        options: () => codes.req_targets, onChange: () => handleBtnAction('actionsModal-req-target-change') },
      { key: 'reqTargetNm', label: '요청대상명', type: 'text', placeholder: '수정 가능' },
    ];
    // 결재 상세 폼
    const apprDetailFormColumns = [
      { key: 'reqAmount', label: '요청금액', type: 'number', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'reqReason', label: '요청사유', type: 'textarea', rows: 2, placeholder: '(선택)', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'tmplMsg',   label: '전송 템플릿', type: 'slot', name: 'tmplMsg', colSpan: 2,
        hint: '치환: {target} {targetNm} {amount} {reason}' },
    ];
    // 결재처리구분/결재코멘트 (approval 탭)
    const bulkApprovalFormColumns = [
      { key: 'apprAction',  label: '결재처리 구분', type: 'select', nullLabel: '선택하세요',
        options: () => codes.approval_actions, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'apprComment', label: '결재 코멘트', type: 'textarea', rows: 2,
        placeholder: '(선택)', colSpan: 2 },
    ];

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      orders, members, claims, uiState, codes, searchParam, pager, detailPanel, checked, bulkForm, bulkOpen, memberPick,  // 상태 / 데이터
      baseSearchColumns, listGridColumns, apprContactFormColumns, apprTargetFormColumns, apprDetailFormColumns, bulkApprovalFormColumns, // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                                // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfIsViewMode, cfDetailKey, cfAllChecked, cfBuildTmplMsg, cfBulkPreview, cfSiteNm,                    // computed
      selectedId: computed(() => detailPanel.selectedId),                                                                  // template 직접 참조
      isChecked, fnGridRowStyle, sortIcon, fnStatusBadge, fnPayStatusBadge,                                                // 헬퍼
      inlineNavigate,                                                                                                      // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    주문관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">
          ●
        </span>
        주문목록
        <span class="list-count">
          {{ pager.pageTotalCount }}건
        </span>
        <span v-if="checked.size" style="margin-left:10px;font-size:12px;color:#1565c0;font-weight:700;">
          선택 {{ checked.size }}건
        </span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="handleBtnAction('actionsModal-open')">
          📝 변경작업 선택
        </button>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('orders-excel')">
          📥 엑셀
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('orders-add')">
          + 신규
        </button>
      </div>
    </div>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare selectable :columns="listGridColumns" :rows="orders" :pager="pager" row-key="orderId"
        :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
        :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
        @sort="key => handleSelectAction('orders-sort', key)"
        @toggle-check="id => handleSelectAction('orders-rowToggleCheck', id)"
        @toggle-check-all="handleSelectAction('orders-rowToggleCheckAll')"
        @row-click="row => handleSelectAction('orders-rowEdit', row.orderId)"
        @ref-click="({type,id}) => handleSelectAction('orders-rowRefClick', {type, id})" row-actions>
        <template #row-actions="{ row }">
          <div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleSelectAction('orders-rowEdit', row.orderId)">
              수정
            </button>
            <button class="btn btn-danger btn-sm" @click="handleSelectAction('orders-rowDelete', row)">
              삭제
            </button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== □.□. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <!-- ===== ■.■. /그리드 스크롤 컨테이너 ========================================= -->
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('orders-pager-setPage', n)"
        :on-size-change="() => handleSelectAction('orders-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </div>
  <!-- ===== □.□. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 하단 상세: OrderDtl 임베드 ===================================== -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <od-order-dtl
      :key="selectedId"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :reload-trigger="detailPanel.reloadTrigger"
      />
  </div>
  <!-- ===== □. 하단 상세: OrderDtl 임베드 ===================================== -->
  <!-- ===== ■. 변경작업 모달 (actionsModal) ===================================== -->
  <div v-if="bulkOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;" @click.self="handleBtnAction('actionsModal-close')">
    <div style="background:#fff;border-radius:12px;width:640px;max-width:94vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;max-height:90vh;display:flex;flex-direction:column;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">
          변경작업
          <span style="color:#1565c0;">
            ({{ checked.size }}건 선택)
          </span>
        </b>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('actionsModal-close')">
          ✕
        </button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'주문상태'},{id:'payMethod',label:'결제수단'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="handleBtnAction('actionsModal-tab-change', t.id)"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">
          {{ t.label }}
        </button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">
            변경할 주문상태
          </label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">
              선택하세요
            </option>
            <option v-for="c in codes.order_statuses" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
        </div>
        <div v-if="uiState.bulkTab==='payMethod'">
          <label class="form-label">
            변경할 결제수단
          </label>
          <select class="form-control" v-model="bulkForm.payMethod">
            <option value="">
              선택하세요
            </option>
            <option v-for="c in codes.payment_methods" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
        </div>
        <!-- ===== ■.■.■.■. 결재처리 (BoFormArea 자동 렌더) =========================== -->
        <div v-if="uiState.bulkTab==='approval'">
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="bulkApprovalFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">
              추가결재자 (회원선택)
            </label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="handleBtnAction('actionsModal-appr-to-change')">
              <option value="">
                선택하세요
              </option>
              <option v-for="m in members" :key="m?.memberId" :value="m.memberId">
                {{ m.memberNm }} ({{ m.memberId }})
              </option>
            </select>
          </div>
          <!-- ===== ■.■.■.■.■. 전화번호/이메일 (BoFormArea 자동 렌더, readonly) =========== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="apprContactFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청대상/요청대상명 (BoFormArea 자동 렌더) =================== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="apprTargetFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청금액/요청사유/전송템플릿 (BoFormArea 자동 렌더) ============== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="apprDetailFormColumns" :form="bulkForm" :errors="{}"
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
        <div style="padding:10px 18px 14px;border-top:1px solid #eee;background:#fafafa;">
          <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">
            📋 작업내용
          </div>
          <textarea readonly :value="cfBulkPreview || '탭에서 변경값을 선택하면 작업내용이 자동으로 표시됩니다.'"
          style="width:100%;min-height:120px;max-height:200px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fff;resize:vertical;"></textarea>
          </div>
          <div style="padding:12px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:6px;background:#fff;">
            <button class="btn btn-secondary btn-sm" @click="handleBtnAction('actionsModal-close')">
              취소
            </button>
            <button class="btn btn-primary btn-sm" @click="handleBtnAction('actionsModal-apply')">
              저장
            </button>
          </div>
        </div>
      </div>
      <!-- ===== □. 변경작업 모달 ================================================= -->
      <!-- ===== ■. 회원 선택 팝업 ================================================ -->
      <!-- ===== ■. 영역 ====================================================== -->
      <od-member-pick-modal :show="memberPick.open" ui-nm="주문관리"
    subtitle="주문 조회 기준 회원을 선택해주세요"
    @select="m => handleSelectAction('memberPickModal-select', m)"
    @close="handleBtnAction('memberPickModal-close')" />
    </div>
    <!-- ===== □. 영역 ====================================================== -->
`
};
