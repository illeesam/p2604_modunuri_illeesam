/* ShopJoy Admin - 배송관리 목록 + 하단 DlivDtl 임베드 */
window.OdDlivMng = {
  name: 'OdDlivMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const deliveries = reactive([]);
    const members = reactive([]);
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], dliv_statuses: [], dliv_types: [], payment_methods: [], courier_codes: [], approval_actions: ['승인','반려','보류'], req_targets: ['주문','상품','배송','추가결재'], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* 배송 getSortParam */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) return {};
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* 배송 onSort */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') uiState.sortDir = 'desc';
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      pager.pageNo = 1;
      handleSearchData();
    };

    /* 배송 sortIcon */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    // onMounted에서 API 로드
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...getSortParam(), ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'def_dliv_id,def_order_id,def_member_nm,def_recv_nm,def_invoice_no';
        }
        const [delivRes, membersRes] = await Promise.all([
          boApiSvc.odDliv.getPage(params, '배송관리', '목록조회'),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '배송관리', '목록조회')
        ]);
        deliveries.splice(0, deliveries.length, ...(delivRes.data?.data?.pageList || delivRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        pager.pageTotalCount = delivRes.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = delivRes.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, delivRes.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* -- 검색 파라미터 -- */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', memberId: '', memberNm: '', status: '', dateType: 'dliv_ship_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());


    /* 배송 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 배송 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS');
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      codes.dliv_types = codeStore.sgGetGrpCodes('DLIV_TYPE');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.courier_codes = codeStore.sgGetGrpCodes('COURIER');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchData('DEFAULT');
    });

    /* 하단 상세 */
    const uiStateDetail = reactive({ selectedId: null, openMode: 'view', reloadTrigger: 0 });

    /* 배송 loadView */
    const loadView = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'view'; uiStateDetail.reloadTrigger++; };

    /* 배송 상세조회 */
    const handleLoadDetail = (id) => { uiStateDetail.selectedId = id; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 배송 openNew */
    const openNew = () => { uiStateDetail.selectedId = '__new__'; uiStateDetail.openMode = 'edit'; uiStateDetail.reloadTrigger++; };

    /* 배송 closeDetail */
    const closeDetail = () => { uiStateDetail.selectedId = null; };

    /* DlivDtl 에 넘길 navigate: 'odDlivMng' 이동 요청 → 패널 닫기로 인터셉트 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odDlivMng') { uiStateDetail.selectedId = null; if (opts.reload) handleSearchList('RELOAD'); return; }
      if (pg === '__switchToEdit__') { uiStateDetail.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const cfDetailEditId = computed(() => uiStateDetail.selectedId === '__new__' ? null : uiStateDetail.selectedId);
    const cfIsViewMode = computed(() => uiStateDetail.openMode === 'view' && uiStateDetail.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${uiStateDetail.selectedId}_${uiStateDetail.openMode}`);

    /* 목록 */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* 배송 fnStatusBadge */
    const fnStatusBadge = s => ({
      '준비중': 'badge-orange', '출고완료': 'badge-blue', '배송중': 'badge-blue',
      '배송완료': 'badge-green', '배송실패': 'badge-red',
    }[s] || 'badge-gray');

    /* 배송 목록조회 */
    const onSearch = async () => {
      if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
        props.showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1;
      await handleSearchData('DEFAULT');
    };

    /* 배송 onReset */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.sortKey = ''; uiState.sortDir = 'asc';
      pager.pageNo = 1;
      await handleSearchData();
    };

    /* 배송 setPage */
    const setPage  = n  => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchData('PAGE_CLICK'); } };

    /* 배송 onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchData('DEFAULT'); };

    /* 배송 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.dlivId}]를 삭제하시겠습니까?`);
      if (!ok) return;
      if (!Array.isArray(deliveries)) return;
      const idx = deliveries.findIndex(x => x.dlivId === d.dlivId);
      if (idx !== -1) deliveries.splice(idx, 1);
      if (uiStateDetail.selectedId === d.dlivId) uiStateDetail.selectedId = null;
      try {
        const res = await boApiSvc.odDliv.remove(d.dlivId, '배송관리', '삭제');
        if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
        if (showToast) showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (showToast) showToast(errMsg, 'error', 0);
      }
    };

    /* 배송 exportExcel */
    const exportExcel = () => coUtil.exportCsv(deliveries, [{label:'배송ID',key:'deliveryId'},{label:'주문ID',key:'orderId'},{label:'수령인',key:'receiverName'},{label:'연락처',key:'receiverPhone'},{label:'주소',key:'address'},{label:'택배사',key:'courierCd'},{label:'운송장',key:'trackingNo'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '배송목록.csv');

    /* 일괄선택 */
    const checked = reactive(new Set());

    /* 배송 toggleCheck */
    const toggleCheck = (id) => { const s = new Set(checked); if (s.has(id)) s.delete(id); else s.add(id); checked = s; };

    /* 배송 isChecked */
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => deliveries.length > 0 && deliveries.every(d => checked.has(d.dlivId)));

    /* 배송 toggleCheckAll */
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) deliveries.forEach(d => s.delete(d.dlivId));
      else deliveries.forEach(d => s.add(d.dlivId));
      checked = s;
    };
    const COURIER_OPTIONS = ['CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';
        const bulkForm = reactive({
      status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });

    /* 배송 onApprToChange */
    const onApprToChange = () => {
      const m = (members).find(x => String(x.userId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.userNm || ''; bulkForm.apprToPhone = m.phone || ''; bulkForm.apprToEmail = m.email || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };

    /* 배송 onReqTargetChange */
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(deliveries) ? deliveries : [], d => ids.includes(d.dlivId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문')      bulkForm.reqTargetNm = first.orderId || '';
      else if (bulkForm.reqTarget === '배송') bulkForm.reqTargetNm = first.dlivId || '';
      else if (bulkForm.reqTarget === '상품') {
        const o = (Array.isArray(orders) ? orders : []).find(x => x.orderId === first.orderId);
        bulkForm.reqTargetNm = o ? (o.prodNm || '') : '';
      } else bulkForm.reqTargetNm = first.dlivId || '';
    };
    const cfBuildTmplMsg = computed(() => (bulkForm.tmplMsg || '')
      .replace('{target}', bulkForm.reqTarget || '-')
      .replace('{targetNm}', bulkForm.reqTargetNm || '-')
      .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
      .replace('{reason}', bulkForm.reqReason || '-'));

    /* 배송 openBulk */
    const openBulk = () => {
      if (!checked.size) { showToast('항목을 선택하세요.', 'error'); return; }
      uiState.bulkTab = 'status';
      Object.assign(bulkForm, {
        status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      uiState.bulkOpen = true;
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) return '';
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(deliveries, d => ids.includes(d.dlivId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 배송상태 변경: ${d.status || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) return '';
        rows = selected.map(d => {
          const parts = [];
          if (bulkForm.courier) parts.push(`택배사: ${d.courier || '-'} → ${bulkForm.courier}`);
          if (bulkForm.trackingNo) parts.push(`운송장: ${d.trackingNo || '-'} → ${bulkForm.trackingNo}`);
          return `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 택배정보 변경: ${parts.join(', ')}`;
        });
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.receiver || d.userNm}] [배송관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) return '';
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });

    /* 배송 saveBulk */
    const saveBulk = async () => {
      const ids = Array.from(checked);
      if (!ids.length) { showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) { showToast('변경할 배송상태를 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 배송상태 변경', `선택한 ${ids.length}건을 [${bulkForm.status}] 상태로 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) d.status = bulkForm.status; });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkStatus({ ids, status: bulkForm.status }, '배송관리', '일괄처리');
          if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
          if (showToast) showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (showToast) showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) { showToast('택배사 또는 운송장번호를 입력하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 택배정보 변경', `선택한 ${ids.length}건의 택배정보를 변경하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => {
          if (ids.includes(d.dlivId)) {
            if (bulkForm.courier) d.courier = bulkForm.courier;
            if (bulkForm.trackingNo) d.trackingNo = bulkForm.trackingNo;
          }
        });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkCourier({ ids, courier: bulkForm.courier, trackingNo: bulkForm.trackingNo }, '배송관리', '택배정보');
          if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
          if (showToast) showToast(`${ids.length}건 변경되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (showToast) showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) { d.apprStatus = bulkForm.apprAction; d.apprComment = bulkForm.apprComment; } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkApproval({ ids, action: bulkForm.apprAction, comment: bulkForm.apprComment }, '배송관리', '결재처리');
          if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
          if (showToast) showToast(`${ids.length}건 처리되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (showToast) showToast(errMsg, 'error', 0);
        }
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) return;
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) {
          d.apprToUserId = bulkForm.apprToUserId; d.apprToNm = bulkForm.apprToNm;
          d.reqTarget = bulkForm.reqTarget; d.reqTargetNm = bulkForm.reqTargetNm;
          d.reqAmount = Number(bulkForm.reqAmount||0); d.reqReason = bulkForm.reqReason;
        } });
        checked = new Set(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.bulkApprovalReq({ ids, ...bulkForm, tmplMsgRendered: cfBuildTmplMsg.value }, '배송관리', '추가결재요청');
          if (setApiRes) setApiRes({ ok: true, status: res.status, data: res.data });
          if (showToast) showToast(`${ids.length}건 요청되었습니다.`, 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (setApiRes) setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (showToast) showToast(errMsg, 'error', 0);
        }
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    /* ── 회원 선택 팝업 ── */
    const memberPick = reactive({ open: false, searchType: '', searchValue: '', rows: [], pageNo: 1, total: 0, totalPage: 1, loading: false });

    /* 배송 openMemberPick */
    const openMemberPick = () => { memberPick.open = true; memberPick.searchType = ''; memberPick.searchValue = ''; memberPick.pageNo = 1; handlePickSearch(); };

    /* 배송 closeMemberPick */
    const closeMemberPick = () => { memberPick.open = false; };

    /* 배송 handlePickSearch */
    const handlePickSearch = async () => {
      memberPick.loading = true;
      try {
        const params = { pageNo: memberPick.pageNo, pageSize: 20, searchValue: memberPick.searchValue || undefined, searchType: memberPick.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'def_nm,def_loginId';
        }
        const res = await boApiSvc.mbMember.getPage(params, '배송관리', '회원검색');
        const d = res.data?.data || {};
        memberPick.rows = d.pageList || [];
        memberPick.total = d.pageTotalCount || 0;
        memberPick.totalPage = d.pageTotalPage || 1;
      } catch (_) { showToast('회원 조회 오류', 'error'); }
      finally { memberPick.loading = false; }
    };

    /* 배송 onPickSearch */
    const onPickSearch = () => { memberPick.pageNo = 1; handlePickSearch(); };

    /* 배송 onPickPage */
    const onPickPage = n => { memberPick.pageNo = n; handlePickSearch(); };

    /* 배송 onSelectMember */
    const onSelectMember = m => { searchParam.memberId = m.memberId; searchParam.memberNm = m.memberNm || m.loginId || m.memberId; closeMemberPick(); };

    /* 배송 onClearMember */
    const onClearMember = () => { searchParam.memberId = ''; searchParam.memberNm = ''; };

    // -- return ---------------------------------------------------------------

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), deliveries, members, uiState, codes, searchParam, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, checked, toggleCheck, isChecked, cfAllChecked, toggleCheckAll, COURIER_OPTIONS, bulkForm, openBulk, saveBulk, cfBulkPreview, onApprToChange, onReqTargetChange, cfBuildTmplMsg, onSort, sortIcon, memberPick, openMemberPick, closeMemberPick, handlePickSearch, onPickSearch, onPickPage, onSelectMember, onClearMember };
  },
  template: /* html */`
<div>
  <div class="page-title">배송관리</div>
  <div class="card">
    <div class="search-bar">
      <multi-check-select v-model="searchParam.searchType" :options="[
          { value: 'def_dliv_id',     label: '배송ID' },
          { value: 'def_order_id',    label: '주문ID' },
          { value: 'def_tracking',    label: '운송장번호' },
          { value: 'def_recv_nm',     label: '수령인' },
          { value: 'def_recv_phone',  label: '수령연락처' },
          { value: 'def_member_nm',   label: '회원명' },
        ]" placeholder="검색대상 전체" all-label="전체 선택" min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <span class="search-label">회원</span>
      <div style="display:inline-flex;align-items:center;gap:4px;">
        <input :value="searchParam.memberNm || searchParam.memberId" readonly placeholder="회원 선택"
               class="form-control" style="width:140px;background:#f9f9f9;cursor:pointer;"
               @click="openMemberPick" />
        <button class="btn btn-secondary btn-sm" @click="openMemberPick">검색</button>
        <button v-if="searchParam.memberId" class="btn btn-sm" style="padding:2px 6px;font-size:11px;color:#999;background:none;border:1px solid #ddd;" @click="onClearMember">✕</button>
      </div>
      <select v-model="searchParam.status">
        <option value="">상태 전체</option>
        <option v-for="c in codes.dliv_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.dateType"><option value="dliv_ship_date">출고일자</option><option value="dliv_date">배송완료일</option><option value="reg_date">등록일자</option><option value="upd_date">수정일자</option></select><input type="date" v-model="searchParam.dateStart" class="date-range-input" /><span class="date-range-sep">~</span><input type="date" v-model="searchParam.dateEnd" class="date-range-input" /><select v-model="searchParam.dateRange" @change="onDateRangeChange"><option value="">옵션선택</option><option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option></select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>배송목록 <span class="list-count">{{ pager.pageTotalCount }}건</span>
        <span v-if="checked.size" style="margin-left:10px;font-size:12px;color:#1565c0;font-weight:700;">선택 {{ checked.size }}건</span>
      </span>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="openBulk">📝 변경작업 선택</button>
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-primary btn-sm" @click="openNew">+ 신규</button>
      </div>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th style="width:36px;text-align:center;"><input type="checkbox" :checked="cfAllChecked" @change="toggleCheckAll" /></th>
        <th style="width:36px;text-align:center;">번호</th><th>배송ID</th><th>주문ID</th><th>회원</th><th>수령인</th><th>택배사</th><th>운송장번호</th><th>배송지</th>
        <th @click="onSort('reg')" style="cursor:pointer;user-select:none;white-space:nowrap;">상태 <span :style="uiState.sortKey==='reg'?{color:'#e8587a',fontWeight:'bold'}:{color:'#bbb'}">{{ sortIcon('reg') }}</span></th>
        <th>사이트명</th><th style="text-align:right">관리</th>
      </tr></thead>
      <tbody>
        <tr v-if="deliveries.length===0"><td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
        <tr v-else v-for="(d, idx) in deliveries" :key="d?.dlivId"
          :style="(selectedId===d.dlivId?'background:#fff8f9;':'') + (isChecked(d.dlivId)?'background:#eef6fd;':'')">
          <td style="text-align:center;"><input type="checkbox" :checked="isChecked(d.dlivId)" @change="toggleCheck(d.dlivId)" /></td>
          <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <td>
            <span class="title-link" @click="handleLoadDetail(d.dlivId)" :style="selectedId===d.dlivId?'color:#e8587a;font-weight:700;':''">
              {{ d.dlivId }}<span v-if="selectedId===d.dlivId" style="font-size:10px;margin-left:3px;">▼</span>
            </span>
          </td>
          <td><span class="ref-link" @click="showRefModal('order', d.orderId)">{{ d.orderId }}</span></td>
          <td><span class="ref-link" @click="showRefModal('member', d.userId)">{{ d.userNm }}</span></td>
          <td>{{ d.receiver }}</td>
          <td>{{ d.courier }}</td>
          <td>{{ d.trackingNo || '-' }}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ d.address }}</td>
          <td><span class="badge" :class="fnStatusBadge(d.status)">{{ d.status }}</span></td>
          <td style="font-size:12px;color:#2563eb;">{{ cfSiteNm }}</td>
          <td><div class="actions">
            <button class="btn btn-blue btn-sm" @click="handleLoadDetail(d.dlivId)">수정</button>
            <button class="btn btn-danger btn-sm" @click="handleDelete(d)">삭제</button>
          </div></td>
        </tr>
      </tbody>
    </table>
    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>

  <!-- -- 하단 상세: DlivDtl 컴포넌트 임베드 ---------------------------------------- -->
  <div v-if="selectedId" style="margin-top:4px;">
    <div style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <od-dliv-dtl
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
    <div style="background:#fff;border-radius:12px;width:480px;max-width:92vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <b style="font-size:14px;">변경작업 <span style="color:#1565c0;">({{ checked.size }}건 선택)</span></b>
        <button class="btn btn-secondary btn-sm" @click="bulkOpen=false">✕</button>
      </div>
      <div style="display:flex;gap:6px;padding:10px 14px 0;background:#fafafa;">
        <button v-for="t in [{id:'status',label:'배송상태'},{id:'courier',label:'택배사·운송장'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="uiState.bulkTab=t.id"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">{{ t.label }}</button>
      </div>
      <div style="padding:20px 18px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">변경할 배송상태</label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">선택하세요</option>
            <option v-for="c in codes.dliv_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
          </select>
        </div>
        <div v-if="uiState.bulkTab==='courier'">
          <div class="form-group">
            <label class="form-label">택배사</label>
            <select class="form-control" v-model="bulkForm.courier">
              <option value="">선택하세요</option>
              <option v-for="c in (codes.courier_codes.length ? codes.courier_codes : COURIER_OPTIONS.map(v=>({codeValue:v,codeLabel:v})))" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">운송장번호</label>
            <input class="form-control" v-model="bulkForm.trackingNo" placeholder="(선택한 항목 모두 동일 번호로 변경)" />
          </div>
        </div>
        <div v-if="uiState.bulkTab==='approval'">
          <div class="form-group">
            <label class="form-label">결재처리 구분</label>
            <select class="form-control" v-model="bulkForm.apprAction">
              <option value="">선택하세요</option>
              <option v-for="a in codes.approval_actions" :key="Math.random()" :value="a">{{ a }}</option>
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
              <option v-for="m in members" :key="m?.userId" :value="m.userId">{{ m.userNm }} ({{ m.userId }})</option>
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
                <option v-for="t in codes.req_targets" :key="Math.random()" :value="t">{{ t }}</option>
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
            <div style="font-size:12px;color:#9ca3af;margin-top:2px;">배송 조회 기준 회원을 선택해주세요</div>
          </div>
          <button @click="closeMemberPick" style="width:32px;height:32px;border-radius:50%;border:none;background:#fff;cursor:pointer;font-size:16px;color:#6b7280;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.background='#fce7f3';this.style.color='#e11d48'" onmouseout="this.style.background='#fff';this.style.color='#6b7280'">✕</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <div style="position:relative;flex:1;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;">🔍</span>
            <multi-check-select
              v-model="memberPick.searchType"
              :options="[
                { value: 'def_nm',      label: '이름' },
                { value: 'def_loginId', label: '아이디' },
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
        <table v-else class="admin-table" style="margin:0;">
          <thead>
            <tr>
              <th style="width:40px;text-align:center;">번호</th>
              <th>이름</th>
              <th>로그인ID</th>
              <th style="width:80px;text-align:center;">등급</th>
              <th style="width:80px;text-align:center;">상태</th>
              <th style="width:110px;">연락처</th>
              <th style="width:70px;text-align:center;">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!memberPick.rows.length">
              <td colspan="7" style="text-align:center;padding:32px;color:#bbb;">조회 결과가 없습니다.</td>
            </tr>
            <tr v-for="(m, idx) in memberPick.rows" :key="m.memberId" style="cursor:pointer;" @click="onSelectMember(m)" onmouseover="this.style.background='#fff5f8'" onmouseout="this.style.background=''">
              <td style="text-align:center;color:#999;font-size:12px;">{{ (memberPick.pageNo - 1) * 20 + idx + 1 }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f472b6,#e11d48);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">{{ m.memberNm ? m.memberNm.charAt(0) : '?' }}</div>
                  <span style="font-weight:600;font-size:13px;">{{ m.memberNm || '-' }}</span>
                </div>
              </td>
              <td><span style="font-family:monospace;font-size:12px;">{{ m.loginId }}</span></td>
              <td style="text-align:center;"><span style="background:#f3e8ff;color:#7c3aed;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;">{{ m.gradeCdNm || '-' }}</span></td>
              <td style="text-align:center;"><span :style="m.memberStatusCd==='ACTIVE'?'background:#d1fae5;color:#065f46;':'background:#fee2e2;color:#991b1b;'" style="border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;">{{ m.memberStatusCdNm || m.memberStatusCd || '-' }}</span></td>
              <td style="font-size:12px;color:#6b7280;">{{ m.memberPhone || '-' }}</td>
              <td style="text-align:center;"><button class="btn btn-primary btn-xs" @click.stop="onSelectMember(m)" style="border-radius:6px;font-size:11px;">선택</button></td>
            </tr>
          </tbody>
        </table>
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
