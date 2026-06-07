/* ShopJoy Admin - 배송관리 목록 + 하단 DlivDtl 임베드 */
window.OdDlivMng = {
  name: 'OdDlivMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const dlivs = reactive([]);                                                 // 배송 목록 (메인 그리드 데이터)
    const members = reactive([]);                                               // 회원 목록 (추가결재요청 picker)
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], dliv_statuses: [], dliv_types: [], payment_methods: [], courier_codes: [], dliv_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        if ((searchParam.dateStart || searchParam.dateEnd) && !searchParam.dateType) {
          showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
          return;
        }
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        listGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchData();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 신규 배송 등록 (인라인 Dtl) — 빈 폼 + 활성(저장/취소 노출)
      } else if (cmd === 'dlivs-add') {
        detailPanel.selectedId = '__new__'; detailPanel.openMode = 'edit';
        detailPanel.active = true; detailPanel.resetSeq++; detailPanel.reloadTrigger++;
        return;
      // 엑셀 내보내기
      } else if (cmd === 'dlivs-excel') {
        return exportExcel();
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
      } else if (cmd === 'dlivs-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'dlivs-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdDlivMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'dlivs-pager-sizeChange') {
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 그리드 행 수정 → 해당 행 선택 + 활성(저장/취소 노출)
      } else if (cmd === 'dlivs-rowEdit') {
        detailPanel.selectedId = param; detailPanel.openMode = 'edit';
        detailPanel.active = true; detailPanel.reloadTrigger++;
        return;
      // 그리드 행 삭제
      } else if (cmd === 'dlivs-rowDelete') {
        return handleDelete(param);
      // 그리드 행 참조 모달 열기
      } else if (cmd === 'dlivs-rowRefClick') {
        return showRefModal(param.type, param.id);
      // 그리드 행 체크 토글
      } else if (cmd === 'dlivs-rowToggleCheck') {
        if (checked.has(param)) { checked.delete(param); }
        else { checked.add(param); }
        return;
      // 그리드 전체 체크 토글
      } else if (cmd === 'dlivs-rowToggleCheckAll') {
        if (cfAllChecked.value) { dlivs.forEach(d => checked.delete(d.dlivId)); }
        else { dlivs.forEach(d => checked.add(d.dlivId)); }
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

    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ OdDlivMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'member-pick') {
        if (result == null) { memberPick.open = false; return; }
        searchParam.memberId = result.memberId;
        searchParam.memberNm = result.memberNm || result.loginId || result.memberId;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', memberId: '', memberNm: '', status: '', dateType: 'dliv_ship_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    const listGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 하단 상세 (인라인 Dtl) — 진입 시 빈 신규 폼(비활성), 항상 표시 */
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, active: false, resetSeq: 0 });

    /* 일괄선택 */
    const checked = reactive(new Set());

    const COURIER_OPTIONS = ['CJ대한통운','롯데택배','한진택배','우체국택배','로젠택배'];
    const DEFAULT_TMPL = '[결재요청]\n요청대상: {target} - {targetNm}\n요청금액: {amount}원\n내용: {reason}\n\n위 건에 대한 추가결재 부탁드립니다.';

    /* 변경작업 모달 (actionsModal) */
    const bulkForm = reactive({
      status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
    });

    /* ── 회원 선택 팝업 (OdMemberPickModal 사용) ── */
    const memberPick = reactive({ open: false });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* getSortParam — 조회 */
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

    /* sortIcon — 정렬 */
    const sortIcon = (key) => uiState.sortKey !== key ? '⇅' : uiState.sortDir === 'asc' ? '↑' : '↓';

    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'dlivId,orderId,memberNm,recvNm,outboundTrackingNo';
        }
        const [delivRes, membersRes] = await Promise.all([
          boApiSvc.odDliv.getPage(params, '배송관리', '목록조회'),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '배송관리', '목록조회')
        ]);
        dlivs.splice(0, dlivs.length, ...(delivRes.data?.data?.pageList || delivRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        listGridPager.pageTotalCount = delivRes.data?.data?.pageTotalCount || 0;
        listGridPager.pageTotalPage = delivRes.data?.data?.pageTotalPage || Math.ceil(listGridPager.pageTotalCount / listGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(listGridPager);
        Object.assign(listGridPager.pageCond, delivRes.data?.data?.pageCond || listGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDateRangeChange — 기간 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      listGridPager.pageNo = 1;
    };

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* fnLoadCodes — 공통코드 로드 */
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
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchData('DEFAULT');
    });

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = false;    // 버튼 숨김
      detailPanel.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odDlivMng') {
        /* 저장 완료 등: 목록 재조회 후 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchData('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailPanel.openMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    const cfDetailEditId = computed(() => detailPanel.selectedId === '__new__' ? null : detailPanel.selectedId);
    const cfIsViewMode = computed(() => detailPanel.openMode === 'view' && detailPanel.selectedId !== '__new__');
    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);


    /* 배송 fnStatusBadge — 공통코드 DLIV_STATUS 우선, 미매칭 시 로컬 fallback */
    const _DLIV_STATUS_FB = {
      '준비중': 'badge-orange', '출고완료': 'badge-blue', '배송중': 'badge-blue',
      '배송완료': 'badge-green', '배송실패': 'badge-red',
    };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('DLIV_STATUS', s, _DLIV_STATUS_FB[s] || 'badge-gray');

    /* handleDelete — 삭제 */
    const handleDelete = async (d) => {
      const ok = await showConfirm('삭제', `[${d.dlivId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(dlivs)) { return; }
      const idx = dlivs.findIndex(x => x.dlivId === d.dlivId);
      if (idx !== -1) { dlivs.splice(idx, 1); }
      if (detailPanel.selectedId === d.dlivId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.odDliv.remove(d.dlivId, '배송관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(dlivs, [{label:'배송ID',key:'deliveryId'},{label:'주문ID',key:'orderId'},{label:'수령인',key:'receiverName'},{label:'연락처',key:'receiverPhone'},{label:'주소',key:'address'},{label:'택배사',key:'courierCd'},{label:'운송장',key:'trackingNo'},{label:'상태',key:'statusCd'},{label:'등록일',key:'regDate'}], '배송목록.csv');

    /* isChecked — 여부 확인 */
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => dlivs.length > 0 && dlivs.every(d => checked.has(d.dlivId)));

    /* onApprToChange — 추가결재자 변경 */
    const onApprToChange = () => {
      const m = (members).find(x => String(x.memberId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.memberNm || ''; bulkForm.apprToPhone = m.memberPhone || ''; bulkForm.apprToEmail = m.memberEmail || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };

    /* onReqTargetChange — 요청대상 변경 */
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(dlivs) ? dlivs : [], d => ids.includes(d.dlivId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문') { bulkForm.reqTargetNm = first.orderId || ''; }
      else if (bulkForm.reqTarget === '배송') { bulkForm.reqTargetNm = first.dlivId || ''; }
      else if (bulkForm.reqTarget === '상품') {
        bulkForm.reqTargetNm = first.prodNm || '';
      } else { bulkForm.reqTargetNm = first.dlivId || ''; }
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
        status:'', courier:'', trackingNo:'', apprAction:'', apprComment:'',
        apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
        reqTarget:'배송', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
      });
      onReqTargetChange();
      uiState.bulkOpen = true;
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) { return ''; }
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(dlivs, d => ids.includes(d.dlivId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) { return ''; }
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 배송상태 변경: ${d.dlivStatusCd || '-'} → ${bulkForm.status}`);
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) { return ''; }
        rows = selected.map(d => {
          const parts = [];
          if (bulkForm.courier) { parts.push(`택배사: ${d.outboundCourierCd || '-'} → ${bulkForm.courier}`); }
          if (bulkForm.trackingNo) { parts.push(`운송장: ${d.outboundTrackingNo || '-'} → ${bulkForm.trackingNo}`); }
          return `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 택배정보 변경: ${parts.join(', ')}`;
        });
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { return ''; }
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { return ''; }
        rows = selected.map(d => `- [${d.dlivId} / ${d.recvNm || d.memberNm}] [배송관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) { return ''; }
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });

    /* saveBulk — 변경작업 저장 */
    const saveBulk = async () => {
      const ids = Array.from(checked);
      if (!ids.length) { showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      if (uiState.bulkTab === 'status') {
        if (!bulkForm.status) { showToast('변경할 배송상태를 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 배송상태 변경', `선택한 ${ids.length}건을 [${bulkForm.status}] 상태로 변경하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(dlivs, d => { if (ids.includes(d.dlivId)) d.dlivStatusCd = bulkForm.status; });
        const rows = ids.map(id => ({ dlivId: id, dlivStatusCd: bulkForm.status }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.saveList('status', rows, '배송관리', '일괄처리');
          if (showToast) { showToast(`${ids.length}건 변경되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'courier') {
        if (!bulkForm.courier && !bulkForm.trackingNo) { showToast('택배사 또는 운송장번호를 입력하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 택배정보 변경', `선택한 ${ids.length}건의 택배정보를 변경하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(dlivs, d => {
          if (ids.includes(d.dlivId)) {
            if (bulkForm.courier) { d.outboundCourierCd = bulkForm.courier; }
            if (bulkForm.trackingNo) { d.outboundTrackingNo = bulkForm.trackingNo; }
          }
        });
        const rows = ids.map(id => ({ dlivId: id, outboundCourierCd: bulkForm.courier || null, outboundTrackingNo: bulkForm.trackingNo || null }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.saveList('courier', rows, '배송관리', '택배정보');
          if (showToast) { showToast(`${ids.length}건 변경되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(dlivs, d => { if (ids.includes(d.dlivId)) { d.apprStatus = bulkForm.apprAction; d.apprComment = bulkForm.apprComment; } });
        const rows = ids.map(id => ({ dlivId: id }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.saveList('approval', rows, '배송관리', '결재처리');
          if (showToast) { showToast(`${ids.length}건 처리되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ok = await showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(dlivs, d => { if (ids.includes(d.dlivId)) {
          d.apprToUserId = bulkForm.apprToUserId; d.apprToNm = bulkForm.apprToNm;
          d.reqTarget = bulkForm.reqTarget; d.reqTargetNm = bulkForm.reqTargetNm;
          d.reqAmount = Number(bulkForm.reqAmount||0); d.reqReason = bulkForm.reqReason;
        } });
        const rows = ids.map(id => ({ dlivId: id }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odDliv.saveList('approvalReq', rows, '배송관리', '추가결재요청');
          if (showToast) { showToast(`${ids.length}건 요청되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      }
    };

    const bulkOpen = Vue.toRef(uiState, 'bulkOpen');

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'dlivId',  label: '배송ID' },
          { value: 'orderId', label: '주문ID' },
          { value: 'memberNm', label: '회원명' },
          { value: 'recvNm',  label: '수령인' },
          { value: 'outboundTrackingNo', label: '송장번호' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'memberId', type: 'pick', label: '회원', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('memberPickModal-open'),
        onClear: () => handleBtnAction('memberPickModal-clear') },
      { key: 'status', type: 'select', label: '상태', options: () => codes.dliv_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '배송일',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.dliv_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 목록 그리드
    columns.listGrid = [
      { key: 'dlivId',           label: '배송ID', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
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
    /* fnGridRowStyle — 유틸 */
    const fnGridRowStyle = (d) =>
      (detailPanel.selectedId === d.dlivId ? 'background:#fff8f9;' : '')
      + (isChecked(d.dlivId) ? 'background:#eef6fd;' : '');

    // 결재 문의 폼
    columns.apprContactForm = [
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
    // 택배사/운송장번호 (courier 탭) — courier_codes 가 비어있으면 COURIER_OPTIONS 폴백
    const cfCourierOpts = computed(() => {
      const arr = codes.courier_codes;
      if (arr && arr.length) { return arr; }
      return COURIER_OPTIONS.map(v => ({ codeValue: v, codeLabel: v }));
    });
    // 일괄 택배 폼
    columns.bulkCourierForm = [
      { key: 'courier',    label: '택배사', type: 'select', nullLabel: '선택하세요',
        options: () => cfCourierOpts.value, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'trackingNo', label: '운송장번호', type: 'text',
        placeholder: '(선택한 항목 모두 동일 번호로 변경)', colSpan: 2 },
    ];
    // 결재처리구분/결재코멘트 (approval 탭)
    columns.bulkApprovalForm = [
      { key: 'apprAction',  label: '결재처리 구분', type: 'select', nullLabel: '선택하세요',
        options: () => codes.approval_actions, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'apprComment', label: '결재 코멘트', type: 'textarea', rows: 2,
        placeholder: '(선택)' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      dlivs, members, uiState, codes, searchParam, listGridPager, detailPanel, checked, bulkForm, bulkOpen, memberPick,           // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal,                                                                 // dispatch + 모달 통합 콜백
      cfDetailEditId, cfIsViewMode, cfDetailKey, cfAllChecked, cfBuildTmplMsg, cfBulkPreview, cfSiteNm,                    // computed
      selectedId: computed(() => detailPanel.selectedId),                                                                 // template 직접 참조
      isChecked, fnGridRowStyle, sortIcon, fnStatusBadge,                                                                 // 헬퍼
      inlineNavigate,                                                                                                     // Dtl 콜백 (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="배송관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container bare title="배송목록" :count-text="listGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <span v-if="checked.size" style="margin-right:10px;font-size:12px;color:#1565c0;font-weight:700;">
        선택 {{ checked.size }}건
      </span>
      <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="handleBtnAction('actionsModal-open')">
        📝 변경작업 선택
      </button>
      <button class="btn btn-green btn-sm" @click="handleBtnAction('dlivs-excel')">
        📥 엑셀
      </button>
      <button class="btn btn-primary btn-sm" @click="handleBtnAction('dlivs-add')">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare selectable :columns="columns.listGrid" :rows="dlivs" row-key="dlivId" :selected-key="detailPanel.selectedId"
        :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
        :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
        @sort="key => handleBtnAction('dlivs-sort', key)"
        grid-id="dlivs-cellClick" @cell-click="e => { if (e.col && e.col.link) handleSelectAction('dlivs-rowEdit', e.row.dlivId); }"
        @toggle-check="id => handleSelectAction('dlivs-rowToggleCheck', id)"
        @toggle-check-all="handleSelectAction('dlivs-rowToggleCheckAll')"
        @ref-click="({type,id}) => handleSelectAction('dlivs-rowRefClick', {type, id})" row-actions>
        <template #row-actions="{ row }">
          <div class="actions">
            <button class="btn btn-blue btn-xs" @click="handleSelectAction('dlivs-rowEdit', row.dlivId)">
              수정
            </button>
            <button class="btn btn-danger btn-xs" @click="handleSelectAction('dlivs-rowDelete', row)">
              삭제
            </button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="listGridPager" :on-set-page="n => handleBtnAction('dlivs-pager-setPage', n)"
        :on-size-change="() => handleSelectAction('dlivs-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </bo-container>
  <!-- ===== ■. 하단 상세: DlivDtl 컴포넌트 임베드 (항상 표시, 전체 폭) ================= -->
  <bo-container bare>
    <div v-if="detailPanel.active" style="display:flex;justify-content:flex-end;padding:10px 0 0;">
      <button data-hide-close style="display:none;" class="btn btn-secondary btn-sm" @click="handleBtnAction('detailPanel-close')">
        ✕ 닫기
      </button>
    </div>
    <od-dliv-dtl
      :key="cfDetailKey"
      :navigate="inlineNavigate"
      :dtl-id="cfDetailEditId"
      :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
      :active="detailPanel.active"
      :reload-trigger="detailPanel.reloadTrigger"
      />
  </bo-container>
  <!-- ===== ■. 변경작업 모달 (actionsModal) ===================================== -->
  <div v-if="bulkOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;" @click.self="handleBtnAction('actionsModal-close')">
    <div style="background:#fff;border-radius:12px;width:480px;max-width:92vw;box-shadow:0 20px 50px rgba(0,0,0,0.3);overflow:hidden;">
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
        <button v-for="t in [{id:'status',label:'배송상태'},{id:'courier',label:'택배사·운송장'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="handleBtnAction('actionsModal-tabChange', t.id)"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">
          {{ t.label }}
        </button>
      </div>
      <div style="padding:20px 18px;flex:1;overflow-y:auto;min-height:280px;">
        <div v-if="uiState.bulkTab==='status'">
          <label class="form-label">
            변경할 배송상태
          </label>
          <select class="form-control" v-model="bulkForm.status">
            <option value="">
              선택하세요
            </option>
            <option v-for="c in codes.dliv_statuses" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
        </div>
        <!-- ===== ■.■.■.■. 택배사/운송장번호 (BoFormArea 자동 렌더) ====================== -->
        <div v-if="uiState.bulkTab==='courier'">
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.bulkCourierForm" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
        </div>
        <!-- ===== ■.■.■.■. 결재처리 (BoFormArea 자동 렌더) =========================== -->
        <div v-if="uiState.bulkTab==='approval'">
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.bulkApprovalForm" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
        </div>
        <div v-if="uiState.bulkTab==='approvalReq'">
          <div class="form-group">
            <label class="form-label">
              추가결재자 (회원선택)
            </label>
            <select class="form-control" v-model="bulkForm.apprToUserId" @change="handleBtnAction('actionsModal-apprToChange')">
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
          <bo-form-area :columns="columns.apprContactForm" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청대상/요청대상명 (BoFormArea 자동 렌더) =================== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.apprTargetForm" :form="bulkForm" :errors="{}"
            :cols="2" :show-actions="false" />
          <!-- ===== ■.■.■.■.■. 요청금액/요청사유/전송템플릿 (BoFormArea 자동 렌더) ============== -->
          <!-- ===== ■.■.■.■.■. 폼 영역 ============================================ -->
          <bo-form-area :columns="columns.apprDetailForm" :form="bulkForm" :errors="{}"
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
  <od-member-pick-modal :show="memberPick.open" ui-nm="배송관리"
    subtitle="배송 조회 기준 회원을 선택해주세요" modal-name="member-pick" :on-callback="fnCallbackModal" />
</bo-page>
`
};
