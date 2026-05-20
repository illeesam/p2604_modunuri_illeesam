/* ShopJoy Admin - 주문관리 목록 + 하단 OrderDtl 임베드 */
window.OdOrderMng = {
  name: 'OdOrderMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const orders = reactive([]);
    const members = reactive([]);
    const claims = reactive([]);
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], payment_methods: [], dliv_statuses: [], order_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'orderDate asc', desc: 'orderDate desc' } };

    /* 주문 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 주문 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData();
    };

    /* 주문 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
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

    /* -- 검색 파라미터 -- */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', memberId: '', memberNm: '', dateType: 'order_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31`, status: '' };
    };
    const searchParam = reactive(_initSearchParam());


    /* 주문 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 주문 fnLoadCodes */
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
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 주문 loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 주문 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 주문 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 주문 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* 주문 inlineNavigate */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odOrderMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };
    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 주문 fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 주문 fnStatusBadge — 공통코드 ORDER_STATUS code_opt1 우선, 미매칭 시 로컬 fallback */
    const _ORDER_STATUS_FB = {
      '입금대기': 'badge-orange', '결제완료': 'badge-blue', '상품준비중': 'badge-orange',
      '배송중': 'badge-blue', '배송완료': 'badge-green', '구매확정': 'badge-gray',
      '취소': 'badge-red', '자동취소': 'badge-red',
    };
    const fnStatusBadge = s => coUtil.cofCodeBadge('ORDER_STATUS', s, _ORDER_STATUS_FB[s] || 'badge-gray');

    /* 주문 fnPayStatusBadge */
    const _PAY_STATUS_FB = {
      '미결제':'badge-gray','부분결제':'badge-orange','결제완료':'badge-green',
      '결제실패':'badge-red','환불중':'badge-orange','부분환불':'badge-orange','환불완료':'badge-purple',
    };
    const fnPayStatusBadge = s => coUtil.cofCodeBadge('PAY_STATUS', s, _PAY_STATUS_FB[s] || 'badge-gray');

    /* 주문 목록조회 */
    const onSearch = async () => {
      if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
        props.showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    /* 주문 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchData();
    };
  
    /* 주문 setPage */
    const setPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };

    /* 주문 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 주문 삭제 */
    const handleDelete = async (o) => {
      const ok = await showConfirm('삭제', `[${o.orderId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(orders)) return;
      const idx = orders.findIndex(x => x.orderId === o.orderId);
      if (idx !== -1) orders.splice(idx, 1);
      if (uiStateDetail.selectedId === o.orderId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.odOrder.remove(o.orderId, '주문관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 주문 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(orders, [{label:'주문ID',key:'orderId'},{label:'회원명',key:'userNm'},{label:'상태',key:'statusCd'},{label:'결제금액',key:'totalAmount'},{label:'결제방법',key:'payMethodCd'},{label:'주문일',key:'orderDate'}], '주문목록.csv');

    /* 클레임 조회 */
    const claimByOrder = (orderId) =>
      (Array.isArray(claims) ? claims : []).find(c => c.orderId === orderId);

    /* 주문 fnClaimTypeColor */
    const fnClaimTypeColor = (t) => ({ '취소':'#ef4444', '반품':'#FFBB00', '교환':'#3b82f6' }[t] || '#9ca3af');

    /* 결제수단 색맵 (배지 배경/글자색) */
    const PAY_COLORS = {
      '계좌이체': { bg:'#e3f2fd', fg:'#1565c0' },
      '카드결제': { bg:'#f3e5f5', fg:'#6a1b9a' },
      '캐쉬':     { bg:'#fff3e0', fg:'#e65100' },
    };
    const fnPayMethodStyle = (v) => {
      const c = PAY_COLORS[v] || { bg:'#e8f5e9', fg:'#2e7d32' };
      return `font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:${c.bg};color:${c.fg};`;
    };

    /* 주문 getItemCount */
    const getItemCount = (o) => {
      const m = (o.prodNm || '').match(/외\s*(\d+)/);
      return m ? parseInt(m[1]) + 1 : 1;
    };

    /* 일괄선택 */
    const checked = reactive(new Set());

    /* 주문 toggleCheck */
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };

    /* 주문 isChecked */
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => orders.length > 0 && orders.every(o => checked.has(o.orderId)));

    /* 주문 toggleCheckAll */
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) orders.forEach(o => s.delete(o.orderId));
      else orders.forEach(o => s.add(o.orderId));
      checked = s;
    };
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
    /* 변경작업 모달 */
        const bulkForm = reactive({
      status:'', payMethod:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'주문', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });

    /* 주문 onApprToChange */
    const onApprToChange = () => {
      const m = (members).find(x => String(x.memberId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.memberNm || ''; bulkForm.apprToPhone = m.memberPhone || ''; bulkForm.apprToEmail = m.memberEmail || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };

    /* 주문 onReqTargetChange */
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(orders) ? orders : [], o => ids.includes(o.orderId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')      bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '상품') bulkForm.reqTargetNm = first.prodNm || '';
      else if (bulkForm.reqTarget === '배송') {
        const d = (Array.isArray(deliveries) ? deliveries : []).find(x => x.orderId === first.orderId);
        bulkForm.reqTargetNm = d ? d.dlivId : ('배송('+first.orderId+')');
      } else bulkForm.reqTargetNm = first.orderId || '';
    };
    const cfBuildTmplMsg = computed(() => (bulkForm.tmplMsg || '')
      .replace('{target}', bulkForm.reqTarget || '-')
      .replace('{targetNm}', bulkForm.reqTargetNm || '-')
      .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
      .replace('{reason}', bulkForm.reqReason || '-'));

    /* 주문 openBulk */
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
      if (!uiState.bulkOpen) return '';
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(orders, o => ids.includes(o.orderId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 주문상태 변경: ${o.orderStatusCd || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'payMethod') {
        if (!bulkForm.payMethod) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 결제수단 변경: ${o.payMethodCd || '-'} → ${bulkForm.payMethod}`);
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(o => `- [${o.orderId} / ${o.memberNm}] [주문관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });

    /* 주문 saveBulk */
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
      if (!ok) return;
      if (uiState.bulkTab === 'status')    window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.orderStatusCd = bulkForm.status; });
      if (uiState.bulkTab === 'payMethod') window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) o.payMethodCd = bulkForm.payMethod; });
      if (uiState.bulkTab === 'approval')  window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) { o.apprStatus = bulkForm.apprAction; o.apprComment = bulkForm.apprComment; } });
      if (uiState.bulkTab === 'approvalReq') window.safeArrayUtils.safeForEach(orders, o => { if (ids.includes(o.orderId)) {
        o.apprToUserId = bulkForm.apprToUserId; o.apprToNm = bulkForm.apprToNm;
        o.reqTarget = bulkForm.reqTarget; o.reqTargetNm = bulkForm.reqTargetNm;
        o.reqAmount = Number(bulkForm.reqAmount||0); o.reqReason = bulkForm.reqReason;
      } });
      checked = new Set();
      uiState.bulkOpen = false;
      try {
        const res = await boApiSvc.odOrder.bulkAction(cfg.path, { ids, ...bulkForm, tmplMsgRendered: cfBuildTmplMsg.value }, '주문관리', '목록조회');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast(`${ids.length}건 처리되었습니다.`, 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    /* ── 회원 선택 팝업 ── */
    const memberPick = reactive({ open: false, searchType: '', searchValue: '', rows: [], pageNo: 1, total: 0, totalPage: 1, loading: false });

    /* 주문 openMemberPick */
    const openMemberPick = () => { memberPick.open = true; memberPick.searchType = ''; memberPick.searchValue = ''; memberPick.pageNo = 1; handlePickSearch(); };

    /* 주문 closeMemberPick */
    const closeMemberPick = () => { memberPick.open = false; };

    /* 주문 handlePickSearch */
    const handlePickSearch = async () => {
      memberPick.loading = true;
      try {
        const params = { pageNo: memberPick.pageNo, pageSize: 20, searchValue: memberPick.searchValue || undefined, searchType: memberPick.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,loginId';
        }
        const res = await boApiSvc.mbMember.getPage(params, '주문관리', '회원검색');
        const d = res.data?.data || {};
        memberPick.rows = d.pageList || [];
        memberPick.total = d.pageTotalCount || 0;
        memberPick.totalPage = d.pageTotalPage || 1;
      } catch (_) { showToast('회원 조회 오류', 'error'); }
      finally { memberPick.loading = false; }
    };

    /* 주문 onPickSearch */
    const onPickSearch = () => { memberPick.pageNo = 1; handlePickSearch(); };

    /* 주문 onPickPage */
    const onPickPage = n => { memberPick.pageNo = n; handlePickSearch(); };

    /* 주문 onSelectMember */
    const onSelectMember = m => { searchParam.memberId = m.memberId; searchParam.memberNm = m.memberNm || m.loginId || m.memberId; closeMemberPick(); };

    /* 주문 onClearMember */
    const onClearMember = () => { searchParam.memberId = ''; searchParam.memberNm = ''; };

    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'orderId',   label: '주문ID' },
          { value: 'memberNm',  label: '회원명' },
          { value: 'loginId',   label: '로그인ID' },
          { value: 'recvNm',    label: '수령인' },
          { value: 'recvPhone', label: '수령연락처' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
      { type: 'label', label: '회원' },
      { key: 'memberId', type: 'pick', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => openMemberPick(), onClear: () => onClearMember() },
      { key: 'status', type: 'select', options: () => codes.order_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.order_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
    ];

    /* BoGrid 컬럼 정의 (정렬 sortKey 'reg' 는 SORT_MAP 키와 일치) */
    const fnPayStatusText = (o) => (o.orderStatusCd === '취소' || o.orderStatusCd === '자동취소') ? '환불완료' : o.orderStatusCd === '입금대기' ? '미결제' : '결제완료';
    const listGridColumns = [
      { key: 'orderId',       label: '주문ID', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
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
          if (!c) return 'font-size:11px;color:#ccc;';
          return `font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;font-weight:700;background:${fnClaimTypeColor(c.claimTypeCd)};`;
        } },
      { key: '_site',         label: '사이트명',
        fmt: () => cfSiteNm.value,
        cellStyle: 'color:#2563eb;' },
    ];
    const fnGridRowStyle = (o) =>
      (uiStateDetail.selectedId === o.orderId ? 'background:#fff8f9;' : '')
      + (isChecked(o.orderId) ? 'background:#eef6fd;' : '');

    /* 회원선택 모달 picker BoGrid 컬럼 (행 클릭 시 onSelectMember) */
    const memberPickGridColumns = [
      { key: 'memberNm',       label: '이름',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'loginId',        label: '로그인ID', mono: true, cellStyle: 'font-size:12px;' },
      { key: 'gradeCdNm',      label: '등급',   style: 'width:80px;text-align:center;',
        fmt: (v) => v || '-',
        cellInnerStyle: 'background:#f3e8ff;color:#7c3aed;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;' },
      { key: 'memberStatusCd', label: '상태',   style: 'width:80px;text-align:center;',
        fmt: (v, row) => row.memberStatusCdNm || v || '-',
        cellInnerStyle: (v) => (v==='ACTIVE'?'background:#d1fae5;color:#065f46;':'background:#fee2e2;color:#991b1b;') + 'border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;' },
      { key: 'memberPhone',    label: '연락처', style: 'width:110px;', cellStyle: 'color:#6b7280;', fmt: (v) => v || '-' },
    ];

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), orders, members, claims, uiState, codes, searchParam, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, fnPayStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, claimByOrder, fnClaimTypeColor, getItemCount, checked, toggleCheck, isChecked, cfAllChecked, toggleCheckAll, bulkForm, openBulk, saveBulk, cfBulkPreview, onApprToChange, onReqTargetChange, cfBuildTmplMsg, onSort, sortIcon, memberPick, openMemberPick, closeMemberPick, handlePickSearch, onPickSearch, onPickPage, onSelectMember, onClearMember, baseSearchColumns, listGridColumns, fnGridRowStyle, memberPickGridColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">주문관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" :columns="baseSearchColumns" :param="searchParam" @search="onSearch" @reset="onReset" />
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>주문목록 <span class="list-count">{{ pager.pageTotalCount }}건</span>
        <span v-if="checked.size" style="margin-left:10px;font-size:12px;color:#1565c0;font-weight:700;">선택 {{ checked.size }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="openBulk">📝 변경작업 선택</button>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <bo-grid bare selectable :columns="listGridColumns" :rows="orders" :pager="pager" row-key="orderId"
      :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
      :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
      @sort="onSort" @toggle-check="toggleCheck" @toggle-check-all="toggleCheckAll"
      @row-click="row => handleLoadDetail(row.orderId)"
      @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
      <template #row-actions="{ row }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.orderId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
        </div>
      </template>
    </bo-grid>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 하단 상세: OrderDtl 임베드 -------------------------------------------- -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-order-dtl
      :key="selectedId"
      :navigate="inlineNavigate" :show-ref-modal="showRefModal"
      :show-toast="showToast"
      :show-confirm="showConfirm"
      :set-api-res="setApiRes"
      :dtl-id="cfDetailEditId"
      :dtl-mode="uiStateDetail.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    
    
      :reload-trigger="uiStateDetail.reloadTrigger"
      :on-list-reload="handleSearchData"
  />
  </div>

  <!-- -- 변경작업 모달 -------------------------------------------------------- -->
  <div v-if="bulkOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;" @click.self="bulkOpen=false">
    <div style="background:#fff;border-radius:12px;width:640px;max-width:94vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;max-height:90vh;display:flex;flex-direction:column;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'주문상태'},{id:'payMethod',label:'결제수단'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="uiState.bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">변경할 주문상태</label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="c in codes.order_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div v-if="uiState.bulkTab==='payMethod'">
          <label class="form-label">변경할 결제수단</label>
          <select class="form-control" v-model="bulkForm.payMethod">
            <option value="">선택하세요</option>
            <option v-for="c in codes.payment_methods" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div v-if="uiState.bulkTab==='approval'">
          <div class="form-group">
            <label class="form-label">결재처리 구분</label>
            <select class="form-control" v-model="bulkForm.apprAction">
              <option value="">선택하세요</option>
              <option v-for="a in codes.approval_actions" :key="a.codeValue" :value="a.codeValue">{{ a.codeLabel }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">결재 코멘트</label>
            <textarea class="form-control" v-model="bulkForm.apprComment" rows="2" placeholder="(선택)"></textarea>
          </div>
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">추가결재자 (회원선택)</label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="onApprToChange">
              <option value="">선택하세요</option>
              <option v-for="m in members" :key="m?.memberId" :value="m.memberId">{{ m.memberNm }} ({{ m.memberId }})</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">전화번호</label>
              <input class="form-control" v-model="bulkForm.apprToPhone" readonly />
            </div>
            <div class="form-group">
              <label class="form-label">이메일</label>
              <input class="form-control" v-model="bulkForm.apprToEmail" readonly />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">요청대상</label>
              <select class="form-control" v-model="bulkForm.reqTarget" @change="onReqTargetChange">
                <option v-for="t in codes.req_targets" :key="t.codeValue" :value="t.codeValue">{{ t.codeLabel }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">요청대상명</label>
              <input class="form-control" v-model="bulkForm.reqTargetNm" placeholder="수정 가능" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">요청금액</label>
            <input class="form-control" type="number" v-model.number="bulkForm.reqAmount" />
          </div>
          <div class="form-group">
            <label class="form-label">요청사유</label>
            <textarea class="form-control" v-model="bulkForm.reqReason" rows="2" placeholder="(선택)"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">전송 템플릿 <span style="font-size:10px;color:#888;">(치환: {target} {targetNm} {amount} {reason})</span></label>
            <textarea class="form-control" v-model="bulkForm.tmplMsg" rows="4" style="font-family:monospace;font-size:11.5px;"></textarea>
            <div style="margin-top:6px;padding:8px 10px;background:#f6f8fa;border-radius:6px;font-family:monospace;font-size:11.5px;white-space:pre-wrap;color:#333;border:1px dashed #d0d7de;">{{ cfBuildTmplMsg }}</div>
          </div>
        </div>
      </div>
      <div style="padding:10px 18px 14px;border-top:1px solid #eee;background:#fafafa;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:6px;">📋 작업내용</div>
        <textarea readonly :value="cfBulkPreview || '탭에서 변경값을 선택하면 작업내용이 자동으로 표시됩니다.'"
          style="width:100%;min-height:120px;max-height:200px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fff;resize:vertical;"></textarea>
      </div>
      <div style="padding:12px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:6px;background:#fff;">
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">취소</button>
        <button class="btn btn-primary btn-sm" @click="saveBulk">저장</button>
      </div>
    </div>
  </div>

  <!-- 회원 선택 팝업 -->
  <div v-if="memberPick.open"
       style="position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;"
       @click.self="closeMemberPick">
    <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.22),0 4px 16px rgba(0,0,0,0.10);width:820px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:18px 24px 14px;border-bottom:1px solid #fce7f3;flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:#1e293b;">회원 선택</div>
            <div style="font-size:12px;color:#9ca3af;margin-top:2px;">주문 조회 기준 회원을 선택해주세요</div>
          </div>
          <button @click="closeMemberPick" style="width:32px;height:32px;border-radius:50%;border:none;background:#fff;cursor:pointer;font-size:16px;color:#6b7280;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.background='#fce7f3';this.style.color='#e11d48'" onmouseout="this.style.background='#fff';this.style.color='#6b7280'">✕</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <div style="position:relative;flex:1;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;">🔍</span>
            <bo-multi-check-select
              v-model="memberPick.searchType"
              :options="[
                { value: 'memberNm', label: '이름' },
                { value: 'loginId',  label: '아이디' },
              ]"
              placeholder="검색대상 전체"
              all-label="전체 선택"
              min-width="140px" />
            <input v-model="memberPick.searchValue" @keyup.enter="onPickSearch" class="form-control" placeholder="검색어 입력" style="padding-left:32px;border-radius:8px;" />
          </div>
          <button class="btn btn-primary" @click="onPickSearch" style="border-radius:8px;">검색</button>
        </div>
      </div>
      <div style="padding:8px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;flex-shrink:0;">
        총 <strong style="color:#e11d48;">{{ memberPick.total.toLocaleString() }}</strong>명
      </div>
      <div style="flex:1;overflow-y:auto;">
        <div v-if="memberPick.loading" style="text-align:center;padding:40px;color:#aaa;">조회 중...</div>
        <bo-grid v-else bare row-clickable :columns="memberPickGridColumns" :rows="memberPick.rows" row-key="memberId"
                 :row-style="() => 'cursor:pointer;'" empty-text="조회 결과가 없습니다."
                 @row-click="onSelectMember" row-actions>
      <template #row-actions="{ row }">
        <button class="btn btn-primary btn-xs" @click.stop="onSelectMember(row)" style="border-radius:6px;font-size:11px;">선택</button>
      </template>
        </bo-grid>
      </div>
      <div style="padding:10px 24px;border-top:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;display:flex;justify-content:center;">
        <div class="pager" v-if="memberPick.totalPage > 1">
          <button class="btn btn-secondary btn-sm" :disabled="memberPick.pageNo <= 1" @click="onPickPage(memberPick.pageNo - 1)">이전</button>
          <template v-for="n in memberPick.totalPage" :key="n">
            <button v-if="Math.abs(n - memberPick.pageNo) <= 3" :class="['btn btn-sm', n === memberPick.pageNo ? 'btn-primary' : 'btn-secondary']" @click="onPickPage(n)">{{ n }}</button>
          </template>
          <button class="btn btn-secondary btn-sm" :disabled="memberPick.pageNo >= memberPick.totalPage" @click="onPickPage(memberPick.pageNo + 1)">다음</button>
        </div>
        <span v-else style="font-size:12px;color:#aaa;line-height:32px;">총 {{ memberPick.total }}명</span>
      </div>
    </div>
  </div>
</div>
`
};
