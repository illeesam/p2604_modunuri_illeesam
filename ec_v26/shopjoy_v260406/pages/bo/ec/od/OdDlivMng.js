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
    const codes = reactive({ order_statuses: [], dliv_statuses: [], dliv_types: [], payment_methods: [], courier_codes: [], dliv_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });

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
          params.searchType = 'dlivId,orderId,memberNm,recvNm,outboundTrackingNo';
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
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
      pager.pageNo = 1;
    };
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 배송 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.order_statuses = codeStore.sgGetGrpCodes('ORDER_STATUS');
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      codes.dliv_types = codeStore.sgGetGrpCodes('DLIV_TYPE');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.courier_codes = codeStore.sgGetGrpCodes('COURIER');
      codes.dliv_date_types = codeStore.sgGetGrpCodes('DLIV_DATE_TYPE');
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

    /* 배송 fnStatusBadge — 공통코드 DLIV_STATUS 우선, 미매칭 시 로컬 fallback */
    const _DLIV_STATUS_FB = {
      '준비중': 'badge-orange', '출고완료': 'badge-blue', '배송중': 'badge-blue',
      '배송완료': 'badge-green', '배송실패': 'badge-red',
    };
    const fnStatusBadge = s => coUtil.cofCodeBadge('DLIV_STATUS', s, _DLIV_STATUS_FB[s] || 'badge-gray');

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
    const exportExcel = () => coUtil.cofExportCsv(deliveries, [{label:'배송ID',key:'deliveryId'},{label:'주문ID',key:'orderId'},{label:'수령인',key:'receiverName'},{label:'연락처',key:'receiverPhone'},{label:'주소',key:'address'},{label:'택배사',key:'courierCd'},{label:'운송장',key:'trackingNo'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '배송목록.csv');

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
      const m = (members).find(x => String(x.memberId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.memberNm || ''; bulkForm.apprToPhone = m.memberPhone || ''; bulkForm.apprToEmail = m.memberEmail || ''; }
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
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 배송상태 변경: ${d.dlivStatusCd || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) return '';
        rows = selected.map(d => {
          const parts = [];
          if (bulkForm.courier) parts.push(`택배사: ${d.outboundCourierCd || '-'} → ${bulkForm.courier}`);
          if (bulkForm.trackingNo) parts.push(`운송장: ${d.outboundTrackingNo || '-'} → ${bulkForm.trackingNo}`);
          return `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 택배정보 변경: ${parts.join(', ')}`;
        });
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) return '';
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
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
        window.safeArrayUtils.safeForEach(deliveries, d => { if (ids.includes(d.dlivId)) d.dlivStatusCd = bulkForm.status; });
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
            if (bulkForm.courier) d.outboundCourierCd = bulkForm.courier;
            if (bulkForm.trackingNo) d.outboundTrackingNo = bulkForm.trackingNo;
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

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });
    const openMemberPick = () => { memberPick.open = true; };
    const onSelectMember = m => { searchParam.memberId = m.memberId; searchParam.memberNm = m.memberNm || m.loginId || m.memberId; };
    const onClearMember  = () => { searchParam.memberId = ''; searchParam.memberNm = ''; };

    /* BoGrid 컬럼 정의 (정렬 sortKey 'reg' 는 SORT_MAP 키와 일치) */
        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'dlivId',  label: '배송ID' },
          { value: 'orderId', label: '주문ID' },
          { value: 'memberNm', label: '회원명' },
          { value: 'recvNm',  label: '수령인' },
          { value: 'outboundTrackingNo', label: '송장번호' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
      { type: 'label', label: '회원' },
      { key: 'memberId', type: 'pick', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => openMemberPick(), onClear: () => onClearMember() },
      { key: 'status', type: 'select', options: () => codes.dliv_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.dliv_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => onDateRangeChange() },
    ];

    const listGridColumns = [
      { key: 'dlivId',           label: '배송ID', link: true,
        cellInnerStyle: (v) => uiStateDetail.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'orderId',          label: '주문ID', refLink: 'order' },
      { key: 'memberNm',         label: '회원', refLink: 'member', refKey: 'memberId',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'recvNm',           label: '수령인' },
      { key: '_courier',         label: '택배사',
        fmt: (v, row) => row.outboundCourierCdNm || row.outboundCourierCd },
      { key: 'outboundTrackingNo', label: '운송장번호',
        fmt: (v) => v || '-' },
      { key: 'recvAddr',         label: '배송지',
        cellStyle: 'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' },
      { key: '_dlivStatus',      label: '상태', sortKey: 'reg', style: 'white-space:nowrap;',
        fmt: (v, row) => row.dlivStatusCdNm || row.dlivStatusCd,
        badge: (row) => fnStatusBadge(row.dlivStatusCd) },
      { key: '_site',            label: '사이트명',
        fmt: () => cfSiteNm.value,
        cellStyle: 'color:#2563eb;' },
    ];
    const fnGridRowStyle = (d) =>
      (uiStateDetail.selectedId === d.dlivId ? 'background:#fff8f9;' : '')
      + (isChecked(d.dlivId) ? 'background:#eef6fd;' : '');

    /* 회원선택 그리드 컬럼은 OdMemberPickModal 내장 */

    // -- return ---------------------------------------------------------------

    // ===== 폼 컬럼 정의 (BoFormArea :columns) - 일괄결재요청 모달 ============
    const apprContactFormColumns = [
      { key: 'apprToPhone', label: '전화번호', type: 'text', readonly: true },
      { key: 'apprToEmail', label: '이메일',   type: 'text', readonly: true },
    ];
    const apprTargetFormColumns = [
      { key: 'reqTarget',   label: '요청대상', type: 'select', nullable: false,
        options: () => codes.req_targets, onChange: () => onReqTargetChange() },
      { key: 'reqTargetNm', label: '요청대상명', type: 'text', placeholder: '수정 가능' },
    ];
    const apprDetailFormColumns = [
      { key: 'reqAmount', label: '요청금액', type: 'number', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'reqReason', label: '요청사유', type: 'textarea', rows: 2, placeholder: '(선택)', colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'tmplMsg',   label: '전송 템플릿', type: 'slot', name: 'tmplMsg', colSpan: 2,
        hint: '치환: {target} {targetNm} {amount} {reason}' },
    ];
    // 택배사/운송장번호 (courier 탭) — courier_codes 가 비어있으면 COURIER_OPTIONS 폴백
    const cfCourierOpts = Vue.computed(() => {
      const arr = codes.courier_codes;
      if (arr && arr.length) return arr;
      return COURIER_OPTIONS.map(v => ({ codeValue: v, codeLabel: v }));
    });
    const bulkCourierFormColumns = [
      { key: 'courier',    label: '택배사', type: 'select', nullLabel: '선택하세요',
        options: () => cfCourierOpts.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'trackingNo', label: '운송장번호', type: 'text',
        placeholder: '(선택한 항목 모두 동일 번호로 변경)', colSpan: 2 },
    ];
    // 결재처리구분/결재코멘트 (approval 탭)
    const bulkApprovalFormColumns = [
      { key: 'apprAction',  label: '결재처리 구분', type: 'select', nullLabel: '선택하세요',
        options: () => codes.approval_actions, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'apprComment', label: '결재 코멘트', type: 'textarea', rows: 2,
        placeholder: '(선택)', colSpan: 2 },
    ];

    return { uiStateDetail, selectedId: computed(() => uiStateDetail.selectedId), deliveries, members, uiState, codes, searchParam, handleDateRangeChange, cfSiteNm, pager, fnStatusBadge, onSearch, onReset, setPage, onSizeChange, handleDelete, cfDetailEditId, loadView, handleLoadDetail, openNew, closeDetail, inlineNavigate, cfIsViewMode, cfDetailKey, exportExcel, checked, toggleCheck, isChecked, cfAllChecked, toggleCheckAll, COURIER_OPTIONS, bulkForm, openBulk, saveBulk, cfBulkPreview, onApprToChange, onReqTargetChange, cfBuildTmplMsg, onSort, sortIcon, memberPick, openMemberPick, onSelectMember, onClearMember, showRefModal, baseSearchColumns, listGridColumns, fnGridRowStyle, apprContactFormColumns, apprTargetFormColumns, apprDetailFormColumns, bulkCourierFormColumns, bulkApprovalFormColumns };
  },
  template: /* html */`
<div>
  <div class="page-title">배송관리</div>
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
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
    <bo-grid bare selectable :columns="listGridColumns" :rows="deliveries" :pager="pager" row-key="dlivId"
      :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
      :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
      @sort="onSort" @toggle-check="toggleCheck" @toggle-check-all="toggleCheckAll" @ref-click="({type,id}) => showRefModal(type, id)" row-actions>
      <template #row-actions="{ row }">
        <div class="actions">
          <button class="btn btn-blue btn-sm" @click="handleLoadDetail(row.dlivId)">수정</button>
          <button class="btn btn-danger btn-sm" @click="handleDelete(row)">삭제</button>
        </div>
      </template>
    </bo-grid>
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
        <!-- 택배사/운송장번호 (BoFormArea 자동 렌더) -->
        <div v-if="uiState.bulkTab==='courier'">
          <bo-form-area :columns="bulkCourierFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
        </div>
        <!-- 결재처리 (BoFormArea 자동 렌더) -->
        <div v-if="uiState.bulkTab==='approval'">
          <bo-form-area :columns="bulkApprovalFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">추가결재자 (회원선택)</label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="onApprToChange">
              <option value="">선택하세요</option>
              <option v-for="m in members" :key="m?.memberId" :value="m.memberId">{{ m.memberNm }} ({{ m.memberId }})</option>
            </select>
          </div>
          <!-- 전화번호/이메일 (BoFormArea 자동 렌더, readonly) -->
          <bo-form-area :columns="apprContactFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- 요청대상/요청대상명 (BoFormArea 자동 렌더) -->
          <bo-form-area :columns="apprTargetFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- 요청금액/요청사유/전송템플릿 (BoFormArea 자동 렌더) -->
          <bo-form-area :columns="apprDetailFormColumns" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false">
            <template #tmplMsg>
              <textarea class="form-control" v-model="bulkForm.tmplMsg" rows="4" style="font-family:monospace;font-size:11.5px;"></textarea>
              <div style="margin-top:6px;padding:8px 10px;background:#f6f8fa;border-radius:6px;font-family:monospace;font-size:11.5px;white-space:pre-wrap;color:#333;border:1px dashed #d0d7de;">{{ cfBuildTmplMsg }}</div>
            </template>
          </bo-form-area>
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
  <od-member-pick-modal :show="memberPick.open" ui-nm="배송관리"
    subtitle="배송 조회 기준 회원을 선택해주세요"
    @select="onSelectMember" @close="memberPick.open=false" />
</div>
`
};
