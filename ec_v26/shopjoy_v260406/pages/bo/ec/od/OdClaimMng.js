/* ShopJoy Admin - 클레임관리 목록 + 하단 ClaimDtl 임베드 */
window.OdClaimMng = {
  name: 'OdClaimMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    const claims = reactive([]);                                                // 클레임 목록 (메인 그리드 데이터)
    const members = reactive([]);                                               // 회원 목록 (추가결재요청 picker)
    const uiState = reactive({ bulkOpen: false, loading: false, error: null, isPageCodeLoad: false, bulkTab: 'status', sortKey: '', sortDir: 'asc' });
    const codes = reactive({ order_statuses: [], claim_types: [], claim_statuses: [], dliv_statuses: [], payment_methods: [], claim_date_types: [], approval_actions: [], req_targets: [], date_range_opts: [] });

    const SORT_MAP = { reg: { asc: 'regDate asc', desc: 'regDate desc' } };

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimMng.js : handleBtnAction -> ', cmd, param);
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
      // 신규 클레임 등록 (인라인 Dtl) → 빈 폼 + 활성(저장/취소 노출)
      } else if (cmd === 'claims-add') {
        return openNew();
      // 엑셀 내보내기
      } else if (cmd === 'claims-excel') {
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
        return closeDetail();
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
      } else if (cmd === 'claims-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'claims-pager-setPage') {
        if (param >= 1 && param <= listGridPager.pageTotalPage) { listGridPager.pageNo = param; handleSearchData('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OdClaimMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'claims-pager-sizeChange') {
        listGridPager.pageNo = 1;
        return handleSearchData('DEFAULT');
      // 그리드 행 수정 → 행 선택(저장/취소 노출)
      } else if (cmd === 'claims-rowEdit') {
        return selectRow(param);
      // 칸반 보드 열기 (주문ID 기준 조회, 클레임ID 강조)
      } else if (cmd === 'claims-rowKanban') {
        window._odKanbanParams = { orderId: param.orderId, claimId: param.claimId };
        return props.navigate('odOrderKanban', { id: param.orderId });
      // 그리드 행 삭제
      } else if (cmd === 'claims-rowDelete') {
        return handleDelete(param);
      // 그리드 행 참조 모달 열기
      } else if (cmd === 'claims-rowRefClick') {
        return showRefModal(param.type, param.id);
      // 그리드 행 체크 토글
      } else if (cmd === 'claims-rowToggleCheck') {
        if (checked.has(param)) { checked.delete(param); }
        else { checked.add(param); }
        return;
      // 그리드 전체 체크 토글
      } else if (cmd === 'claims-rowToggleCheckAll') {
        if (cfAllChecked.value) { claims.forEach(c => checked.delete(c.claimId)); }
        else { claims.forEach(c => checked.add(c.claimId)); }
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
      console.log(' ■■ OdClaimMng : fnCallbackModal -> ', cmd, param, result);
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
      return { searchType: '', searchValue: '', memberId: '', memberNm: '', claimTypeCd: '', claimStatusCd: '', dateType: 'request_date', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    const listGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* 하단 상세 (인라인 Dtl) — 항상 표시. 진입 시 빈 신규 폼(비활성) */
    const detailPanel = reactive({ selectedId: '__new__', openMode: 'edit', reloadTrigger: 0, resetSeq: 0, active: false }); // active=false → 저장/취소 숨김 (행 미선택 안내). resetSeq → :key 재마운트로 폼 초기화

    /* 일괄선택 */
    const checked = reactive(new Set());

    const DEFAULT_TMPL = boConsts.APPROVAL_TMPL;

    /* 변경작업 모달 (actionsModal) */
    const bulkForm = reactive({
      statusByType: { '취소':'', '반품':'', '교환':'' }, type: '',
      apprAction:'', apprComment:'',
      apprToUserId:'', apprToNm:'', apprToPhone:'', apprToEmail:'',
      reqTarget:'추가결재', reqTargetNm:'', reqAmount:0, reqReason:'', tmplMsg: DEFAULT_TMPL,
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



    /* handleSearchData — 처리 */
    const handleSearchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: listGridPager.pageNo, pageSize: listGridPager.pageSize, ...getSortParam(), ...coUtil.cofOmitEmpty(searchParam) };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'claimId,orderId,memberNm,prodNm';
        }
        const [claimsRes, membersRes] = await Promise.all([
          boApiSvc.odClaim.getPage(params, '클레임관리', '조회').catch(() => ({ data: { data: { pageList: [], pageTotalCount: 0 } } })),
          boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 10000 }, '클레임관리', '조회').catch(() => ({ data: { data: { pageList: [] } } }))
        ]);
        claims.splice(0, claims.length, ...(claimsRes.data?.data?.pageList || claimsRes.data?.data?.list || []));
        members.splice(0, members.length, ...(membersRes.data?.data?.pageList || membersRes.data?.data?.list || []));
        listGridPager.pageTotalCount = claimsRes.data?.data?.pageTotalCount || 0;
        listGridPager.pageTotalPage = claimsRes.data?.data?.pageTotalPage || Math.ceil(listGridPager.pageTotalCount / listGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(listGridPager);
        Object.assign(listGridPager.pageCond, claimsRes.data?.data?.pageCond || listGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        claims.splice(0, claims.length);
        members.splice(0, members.length);
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
      codes.claim_types = codeStore.sgGetGrpCodes('CLAIM_TYPE');
      codes.claim_statuses = codeStore.sgGetGrpCodes('CLAIM_STATUS');
      codes.dliv_statuses = codeStore.sgGetGrpCodes('DLIV_STATUS');
      codes.payment_methods = codeStore.sgGetGrpCodes('PAYMENT_METHOD');
      codes.claim_date_types = codeStore.sgGetGrpCodes('CLAIM_DATE_TYPE');
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

    /* selectRow — 그리드 행 선택 → 편집 패널 활성(저장/취소 노출) */
    const selectRow = (id) => {
      if (window._odClaimDtlState) window._odClaimDtlState.activeTab = 'items'; // 클레임항목 탭 기본
      detailPanel.selectedId = id;
      detailPanel.openMode = 'edit';
      detailPanel.active = true;     // 행 선택 → 저장/취소 노출
      detailPanel.reloadTrigger++;
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailPanel.selectedId = '__new__';
      detailPanel.openMode = 'edit';
      detailPanel.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailPanel.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 이동 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'odClaimMng') {
        /* 저장 완료 등: 목록 재조회 + 영역은 유지하고 빈 신규 폼으로 초기화 */
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

    const cfDetailKey = computed(() => `${detailPanel.selectedId}_${detailPanel.openMode}_${detailPanel.resetSeq}`);


    /* 클레임(취소/반품/교환) fnTypeBadge — 공통코드 CLAIM_TYPE_KR 우선, 미매칭 시 로컬 fallback */



    /* fnClaimTypeColor — 유틸 */
    const fnClaimTypeColor = (t) => coConsts.claimTypeColor(t);

    /* 클레임(취소/반품/교환) fnStatusBadge — 공통코드 CLAIM_STATUS_KR 우선, 미매칭 시 로컬 fallback */



    /* handleDelete — 삭제 */
    const handleDelete = async (c) => {
      const ok = await showConfirm('삭제', `[${c.claimId}]를 삭제하시겠습니까?`);
      if (!ok) { return; }
      if (!Array.isArray(claims)) { return; }
      const idx = claims.findIndex(x => x.claimId === c.claimId);
      if (idx !== -1) { claims.splice(idx, 1); }
      if (detailPanel.selectedId === c.claimId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.odClaim.remove(c.claimId, '클레임관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(claims, [{label:'클레임ID',key:'claimId'},{label:'회원명',key:'userNm'},{label:'주문ID',key:'orderId'},{label:'유형',key:'type'},{label:'상태',key:'statusCd'},{label:'상품명',key:'prodNm'},{label:'사유',key:'reasonCd'},{label:'요청일',key:'requestDate'}], '클레임목록.csv');

    /* isChecked — 여부 확인 */
    const isChecked = (id) => checked.has(id);
    const cfAllChecked = computed(() => claims.length > 0 && claims.every(c => checked.has(c.claimId)));

    const claimStatusCodes = (codes.claim_statuses || [])
      .filter(c => c.codeGrp === 'CLAIM_STATUS' && c.useYn === 'Y')
      .sort((a, b) => a.sortOrd - b.sortOrd);

    /* claimStatusForType — 클레임 상태 For 유형 */
    const claimStatusForType = type => claimStatusCodes
      .filter(c => !c.parentCodeValues || c.parentCodeValues.includes('^' + type + '^'))
      .map(c => c.codeLabel);
    const CLAIM_STATUS_BY_TYPE = { '취소': claimStatusForType('CANCEL'), '반품': claimStatusForType('RETURN'), '교환': claimStatusForType('EXCHANGE') };
    const CLAIM_TYPE_OPTIONS = ['취소','반품','교환'];

    /* onApprToChange — 추가결재자 변경 */
    const onApprToChange = () => {
      const m = (members).find(x => String(x.memberId) === String(bulkForm.apprToUserId));
      if (m) { bulkForm.apprToNm = m.memberNm || ''; bulkForm.apprToPhone = m.memberPhone || ''; bulkForm.apprToEmail = m.memberEmail || ''; }
      else   { bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = ''; }
    };

    /* onReqTargetChange — 요청대상 변경 */
    const onReqTargetChange = () => {
      const ids = Array.from(checked);
      const first = window.safeArrayUtils.safeFind(Array.isArray(claims) ? claims : [], c => ids.includes(c.claimId));
      if (!first) { bulkForm.reqTargetNm = ''; return; }
      if (bulkForm.reqTarget === '주문') { bulkForm.reqTargetNm = first.orderId || ''; }
      else if (bulkForm.reqTarget === '상품') { bulkForm.reqTargetNm = first.prodNm || ''; }
      else if (bulkForm.reqTarget === '배송') { bulkForm.reqTargetNm = first.dlivId || (first.orderId ? '배송('+first.orderId+')' : ''); }
      else { bulkForm.reqTargetNm = first.claimId || ''; }
    };
    const cfBuildTmplMsg = computed(() => {
      return (bulkForm.tmplMsg || '')
        .replace('{target}', bulkForm.reqTarget || '-')
        .replace('{targetNm}', bulkForm.reqTargetNm || '-')
        .replace('{amount}', Number(bulkForm.reqAmount||0).toLocaleString())
        .replace('{reason}', bulkForm.reqReason || '-');
    });
    const cfCheckedByType = computed(() => {
      const r = { '취소':[], '반품':[], '교환':[] };
      window.safeArrayUtils.safeForEach(claims, c => { if (checked.has(c.claimId) && r[c.claimTypeCd]) r[c.claimTypeCd].push(c.claimId); });
      return r;
    });

    /* openBulk — 변경작업 모달 열기 */
    const openBulk = () => {
      if (!checked.size) { showToast('항목을 선택하세요.', 'error'); return; }
      uiState.bulkTab = 'status';
      bulkForm.statusByType = { '취소':'', '반품':'', '교환':'' };
      bulkForm.type = '';
      bulkForm.apprAction = ''; bulkForm.apprComment = '';
      bulkForm.apprToUserId = ''; bulkForm.apprToNm = ''; bulkForm.apprToPhone = ''; bulkForm.apprToEmail = '';
      bulkForm.reqTarget = '추가결재'; bulkForm.reqTargetNm = ''; bulkForm.reqAmount = 0; bulkForm.reqReason = ''; bulkForm.tmplMsg = DEFAULT_TMPL;
      onReqTargetChange();
      uiState.bulkOpen = true;
    };
    const cfBulkPreview = computed(() => {
      if (!uiState.bulkOpen) { return ''; }
      const ids = Array.from(checked);
      const selected = window.safeArrayUtils.safeFilter(claims, c => ids.includes(c.claimId));
      let rows = [];
      if (uiState.bulkTab === 'status') {
        rows = selected
          .filter(c => bulkForm.statusByType[c.claimTypeCd])
          .map(c => `- [${c.claimId} / ${c.memberNm} (${c.claimTypeCd})] [클레임관리] 클레임상태 변경: ${c.claimStatusCd || '-'} → ${bulkForm.statusByType[c.claimTypeCd]}`);
      } else if (uiState.bulkTab === 'type') {
        if (!bulkForm.type) { return ''; }
        rows = selected.map(c => `- [${c.claimId} / ${c.memberNm}] [클레임관리] 클레임유형 변경: ${c.claimTypeCd || '-'} → ${bulkForm.type}`);
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { return ''; }
        rows = selected.map(c => `- [${c.claimId} / ${c.memberNm}] [클레임관리] 결재처리: ${bulkForm.apprAction}${bulkForm.apprComment ? ' / '+bulkForm.apprComment : ''}`);
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { return ''; }
        rows = selected.map(c => `- [${c.claimId} / ${c.memberNm}] [클레임관리] 추가결재요청 → ${bulkForm.apprToNm}(${bulkForm.apprToUserId}) / 대상:${bulkForm.reqTarget}-${bulkForm.reqTargetNm} / 금액:${Number(bulkForm.reqAmount||0).toLocaleString()}원`);
      }
      if (!rows.length) { return ''; }
      return `※ 총 ${rows.length}건\n` + rows.join('\n');
    });

    /* saveBulk — 변경작업 저장 */
    const saveBulk = async () => {
      if (!checked.size) { showToast('항목을 선택하세요.', 'error'); uiState.bulkOpen = false; return; }
      if (uiState.bulkTab === 'status') {
        const changes = CLAIM_TYPE_OPTIONS
          .filter(t => bulkForm.statusByType[t] && cfCheckedByType.value[t].length)
          .map(t => ({ type: t, status: bulkForm.statusByType[t], ids: cfCheckedByType.value[t] }));
        if (!changes.length) { showToast('변경할 상태를 선택하세요.', 'error'); return; }
        const totalCnt = changes.reduce((s,c)=>s+c.ids.length,0);
        const msg = changes.map(c => `[${c.type}] ${c.ids.length}건 → ${c.status}`).join('\n');
        const ok = await showConfirm('일괄 클레임상태 변경', `${msg}\n\n총 ${totalCnt}건을 변경하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(changes, ch => {
          window.safeArrayUtils.safeForEach(claims, c => { if (ch.ids.includes(c.claimId)) c.claimStatusCd = ch.status; });
        });
        const rows = changes.flatMap(ch => ch.ids.map(id => ({ claimId: id, claimStatusCd: ch.status })));
        checked.clear();
        uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.saveList('status', rows, '클레임관리', '일괄처리');
          if (showToast) { showToast(`${totalCnt}건 변경되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'type') {
        const val = bulkForm.type;
        if (!val) { showToast('변경할 클레임유형을 선택하세요.', 'error'); return; }
        const ids = Array.from(checked);
        const ok = await showConfirm('일괄 클레임유형 변경', `선택한 ${ids.length}건의 클레임유형을 [${val}](으)로 변경하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) c.claimTypeCd = val; });
        const rows = ids.map(id => ({ claimId: id, claimTypeCd: val }));
        checked.clear();
        uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.saveList('type', rows, '클레임관리', '일괄처리');
          if (showToast) { showToast(`${ids.length}건 변경되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'approval') {
        if (!bulkForm.apprAction) { showToast('결재처리 구분을 선택하세요.', 'error'); return; }
        const ids = Array.from(checked);
        const ok = await showConfirm('일괄 결재처리', `선택한 ${ids.length}건을 [${bulkForm.apprAction}] 처리하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) { c.apprStatus = bulkForm.apprAction; c.apprComment = bulkForm.apprComment; } });
        const rows = ids.map(id => ({ claimId: id }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.saveList('approval', rows, '클레임관리', '결재처리');
          if (showToast) { showToast(`${ids.length}건 처리되었습니다.`, 'success'); }
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (showToast) { showToast(errMsg, 'error', 0); }
        }
      } else if (uiState.bulkTab === 'approvalReq') {
        if (!bulkForm.apprToUserId) { showToast('추가결재자(회원)를 선택하세요.', 'error'); return; }
        const ids = Array.from(checked);
        const ok = await showConfirm('일괄 추가결재요청', `선택한 ${ids.length}건을 [${bulkForm.apprToNm}](으)로 추가결재요청 하시겠습니까?`);
        if (!ok) { return; }
        window.safeArrayUtils.safeForEach(claims, c => { if (ids.includes(c.claimId)) {
          c.apprToUserId = bulkForm.apprToUserId; c.apprToNm = bulkForm.apprToNm;
          c.reqTarget = bulkForm.reqTarget; c.reqTargetNm = bulkForm.reqTargetNm;
          c.reqAmount = Number(bulkForm.reqAmount||0); c.reqReason = bulkForm.reqReason;
        } });
        const rows = ids.map(id => ({ claimId: id }));
        checked.clear(); uiState.bulkOpen = false;
        try {
          const res = await boApiSvc.odClaim.saveList('approvalReq', rows, '클레임관리', '추가결재요청');
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
          { value: 'claimId',  label: '클레임ID' },
          { value: 'orderId',  label: '주문ID' },
          { value: 'memberNm', label: '회원명' },
          { value: 'prodNm',   label: '상품명' },
          { value: 'loginId',  label: '로그인ID' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'memberId', type: 'pick', label: '회원', nameKey: 'memberNm',
        display: (p) => p.memberNm || p.memberId, placeholder: '회원 선택',
        onOpen: () => handleBtnAction('memberPickModal-open'),
        onClear: () => handleBtnAction('memberPickModal-clear') },
      { key: 'claimTypeCd', type: 'select', label: '유형', options: () => codes.claim_types, nullLabel: '유형 전체' },
      { key: 'claimStatusCd', type: 'select', label: '상태', options: () => codes.claim_statuses, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '신청일',
        typeKey: 'dateType', startKey: 'dateStart', endKey: 'dateEnd',
        typeOptions: () => codes.claim_date_types,
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 목록 그리드
    columns.listGrid = [
      { key: 'claimId',       label: '클레임ID', link: true,
        cellInnerStyle: (v) => detailPanel.selectedId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'memberNm',      label: '회원', refLink: 'member', refKey: 'memberId',
        fmt: (v, row) => `${row.memberNm || '-'}  #${row.memberId || row.sessionKey || '-'}` },
      { key: 'orderId',       label: '주문ID', refLink: 'order' },
      { key: 'prodNm',        label: '상품' },
      { key: 'reasonDetail',  label: '사유' },
      { key: '_claimStatus',  label: '클레임상태',
        fmt: (v, row) => `${row.claimTypeCdNm || row.claimTypeCd} · ${row.claimStatusCdNm || row.claimStatusCd}`,
        cellInnerStyle: (v, row) => `font-size:10px;padding:2px 8px;border-radius:10px;color:#fff;font-weight:700;background:${fnClaimTypeColor(row.claimTypeCd)};` },
      { key: 'requestDate',   label: '신청일', sortKey: 'reg', style: 'white-space:nowrap;',
        fmt: (v) => (v || '').slice(0, 10) },
      { key: '_site',         label: '사이트명',
        fmt: () => cfSiteNm.value,
        cellStyle: 'color:#2563eb;' },
    ];
    /* fnGridRowStyle — 유틸 */
    const fnGridRowStyle = (c) =>
      (detailPanel.selectedId === c.claimId ? 'background:#fff8f9;' : '')
      + (isChecked(c.claimId) ? 'background:#eef6fd;' : '');

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
    // 요청금액 / 요청사유 / 전송 템플릿 (3 fields)
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
      { key: 'apprAction',  label: '결재처리 구분', type: 'select', nullLabel: '선택하세요',
        options: () => codes.approval_actions, colSpan: 2 },
      { type: 'rowBreak' },
      { key: 'apprComment', label: '결재 코멘트', type: 'textarea', rows: 2,
        placeholder: '(선택)' },
    ];

    /* ##### [06] 클레임 금액 계산 ##################################################### */

    const mngCalcDialog = reactive({ show: false, loading: false, claimId: '', claimType: '', data: null, showPayInfo: false, showRefundInfo: false, orderClaims: [], switchLoading: false });

    const fnMngCalcAmt = function (claimData, orderData) {
      var items     = claimData.claimItems || [];
      var itemAmt   = items.reduce(function (s, it) {
        return s + (it.itemAmt || it.item_amt || (it.unitPrice || it.unit_price || 0) * (it.claimQty || it.claim_qty || 1));
      }, 0);
      var orderTotalAmt = orderData.payAmt || orderData.pay_amt || orderData.totalAmt || orderData.total_amt || 0;
      var orderItemAmt  = (orderData.orderItems || []).reduce(function (s, it) {
        return s + (it.itemOrderAmt || it.item_order_amt || (it.unitPrice || it.unit_price || it.salePrice || 0) * (it.orderQty || it.order_qty || 1));
      }, 0);
      var ratio = orderItemAmt > 0 ? itemAmt / orderItemAmt : (orderTotalAmt > 0 ? itemAmt / orderTotalAmt : 0);
      if (ratio > 1) ratio = 1;
      var couponDiscAmt = Math.round((orderData.couponDiscntAmt || orderData.couponDiscAmt || orderData.coupon_disc_amt || 0) * ratio);
      var saveUsedAmt   = Math.round((orderData.saveUseAmt || orderData.saveUsedAmt || orderData.save_used_amt || 0) * ratio);
      var cacheUsedAmt  = Math.round((orderData.cacheUsedAmt || orderData.cache_used_amt || 0) * ratio);
      var totalClaimQty = items.reduce(function (s, it) { return s + (it.claimQty || it.claim_qty || 1); }, 0);
      var totalOrderQty = (orderData.orderItems || []).reduce(function (s, it) { return s + (it.orderQty || it.order_qty || 1); }, 0);
      var isFullCancel  = totalOrderQty > 0 && totalClaimQty >= totalOrderQty;
      var dlivFeeRefund = isFullCancel ? (orderData.shippingFee || orderData.dlivFee || orderData.dliv_fee || 0) : 0;
      var refundBase    = Math.max(0, itemAmt - couponDiscAmt - saveUsedAmt - cacheUsedAmt + dlivFeeRefund);
      return { itemAmt, couponDiscAmt, saveUsedAmt, cacheUsedAmt, dlivFeeRefund, refundBase, isFullCancel, ratio,
               orderTotalAmt, couponNm: orderData.couponNm || '', saveGradePct: orderData.saveGradePct || 0 };
    };

    const fnLoadMngCalcData = async function (claimId, orderId) {
      var cr = await boApiSvc.odClaim.getById(claimId, '클레임관리', '계산조회');
      var claimData = (cr.data && cr.data.data) || cr.data || {};
      var resolvedOrderId = orderId || claimData.orderId || '';
      var orderData = {};
      if (resolvedOrderId) {
        var or = await boApiSvc.odOrder.getById(resolvedOrderId, '클레임관리', '주문조회');
        orderData = (or.data && or.data.data) || or.data || {};
      }
      var hr = await boApiSvc.odClaim.getStatusHist(claimId, '클레임관리', '상태이력');
      var statusHist = (hr.data && hr.data.data) || [];
      return { claimData, orderData, statusHist, resolvedOrderId };
    };

    const handleOpenMngCalc = async function (row) {
      mngCalcDialog.claimId      = row.claimId || '';
      mngCalcDialog.claimType    = row.claimTypeCd || '';
      mngCalcDialog.data         = null;
      mngCalcDialog.orderClaims  = [];
      mngCalcDialog.loading      = true;
      mngCalcDialog.show         = true;
      try {
        var { claimData, orderData, statusHist, resolvedOrderId } = await fnLoadMngCalcData(row.claimId, row.orderId || '');
        mngCalcDialog.claimType = claimData.claimTypeCd || mngCalcDialog.claimType;
        mngCalcDialog.data = { claim: claimData, order: orderData, calc: fnMngCalcAmt(claimData, orderData), statusHist };
        if (resolvedOrderId) {
          var lor = await boApiSvc.odClaim.getPage({ orderId: resolvedOrderId, pageNo: 1, pageSize: 100 }, '클레임관리', '주문클레임목록').catch(function () { return null; });
          var allClaims = (lor && (lor.data?.data?.pageList || lor.data?.data?.list || [])) || [];
          mngCalcDialog.orderClaims = allClaims.length ? allClaims : [claimData];
        }
      } catch (e) {
        showToast('계산 정보 조회 중 오류가 발생했습니다.', 'error', 0);
        mngCalcDialog.show = false;
      } finally {
        mngCalcDialog.loading = false;
      }
    };

    const handleMngCalcSwitch = async function (claimId) {
      if (!claimId || claimId === mngCalcDialog.claimId) return;
      mngCalcDialog.switchLoading = true;
      try {
        var targetClaim = mngCalcDialog.orderClaims.find(function (c) { return c.claimId === claimId; }) || {};
        var { claimData, orderData, statusHist } = await fnLoadMngCalcData(claimId, targetClaim.orderId || mngCalcDialog.data.claim.orderId || '');
        mngCalcDialog.claimId   = claimId;
        mngCalcDialog.claimType = claimData.claimTypeCd || '';
        mngCalcDialog.data = { claim: claimData, order: orderData, calc: fnMngCalcAmt(claimData, orderData), statusHist };
      } catch (e) {
        showToast('클레임 전환 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        mngCalcDialog.switchLoading = false;
      }
    };

    const handleCloseMngCalc = function () { mngCalcDialog.show = false; };

    /* ##### [07] return (템플릿 노출) ############################################## */

    return {
      columns,
      claims, members, uiState, codes, searchParam, listGridPager, detailPanel, checked, bulkForm, bulkOpen, memberPick, // 상태 / 데이터
      handleBtnAction, handleSelectAction, fnCallbackModal, // dispatch + 모달 통합 콜백
      cfDetailEditId, cfDetailKey, cfAllChecked, cfBuildTmplMsg, cfBulkPreview, cfCheckedByType,                        // computed
      selectedId: computed(() => detailPanel.selectedId),                                                                 // template 직접 참조
      CLAIM_STATUS_BY_TYPE,                    // 상수
      isChecked, fnGridRowStyle,                                      // 헬퍼
      inlineNavigate,                                                                                                     // Dtl 콜백 (closure 필요)
      mngCalcDialog, handleOpenMngCalc, handleCloseMngCalc, handleMngCalcSwitch, // 계산 모달
    };
  },
  template: /* html */`
<bo-page title="클레임관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 목록 영역 =================================================== -->
  <bo-container title="클레임목록" :count-text="listGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <span v-if="checked.size" style="margin-right:10px;font-size:12px;color:#1565c0;font-weight:700;">
        선택 {{ checked.size }}건
      </span>
      <button class="btn btn-blue btn-sm" :disabled="!checked.size" @click="handleBtnAction('actionsModal-open')">
        📝 변경작업 선택
      </button>
      <button class="btn btn_excel" @click="handleBtnAction('claims-excel')">
        📥 엑셀
      </button>
      <button class="btn btn_new" @click="handleBtnAction('claims-add')">
        + 신규
      </button>
    </template>
    <!-- ===== ■.■. 그리드 (기본 10개 영역 + 화면 높이 반응형 확장, 초과 시 내부 스크롤) =========== -->
    <div style="max-height:calc(100vh - 340px);min-height:480px;overflow-y:auto;border:1px solid #eef0f3;border-radius:6px;background:#fff;">
      <!-- ===== ■.■.■. 목록 영역 =============================================== -->
      <bo-grid bare selectable :columns="columns.listGrid" :rows="claims" row-key="claimId" :selected-key="detailPanel.selectedId"
        :sort-state="uiState" :is-checked="isChecked" :all-checked="cfAllChecked"
        :row-style="fnGridRowStyle" empty-text="데이터가 없습니다."
        @sort="key => handleBtnAction('claims-sort', key)"
        grid-id="claims-cellClick" @cell-click="e => { if (e.col?.link) handleSelectAction('claims-rowEdit', e.row.claimId); }"
        @toggle-check="id => handleSelectAction('claims-rowToggleCheck', id)"
        @toggle-check-all="handleSelectAction('claims-rowToggleCheckAll')"
        @ref-click="({type,id}) => handleSelectAction('claims-rowRefClick', {type, id})" row-actions>
        <template #row-actions="{ row }">
          <div class="actions">
            <button class="btn btn_row_edit" @click="handleSelectAction('claims-rowEdit', row.claimId)">
              수정
            </button>
            <button class="btn btn_row_delete" @click="handleSelectAction('claims-rowDelete', row)">
              삭제
            </button>
            <button class="btn btn-xs" style="background:#059669;color:#fff;border:none;"
              @click="handleOpenMngCalc(row)">
              💰 계산
            </button>
            <button v-if="row.orderId" class="btn btn-xs" style="background:#3b82f6;color:#fff;border:none;"
              @click="handleSelectAction('claims-rowKanban', { orderId: row.orderId, claimId: row.claimId })">
              칸반
            </button>
          </div>
        </template>
      </bo-grid>
    </div>
    <!-- ===== ■.■. 페이저: 한 줄 표시 + 카드 하단 깔끔 마감 ============================= -->
    <div style="margin-top:6px;white-space:nowrap;overflow-x:auto;">
      <bo-pager :pager="listGridPager" :on-set-page="n => handleBtnAction('claims-pager-setPage', n)"
        :on-size-change="() => handleSelectAction('claims-pager-sizeChange')"
        style="margin-top:0;min-height:34px;" />
    </div>
  </bo-container>
  <!-- ===== ■. 하단 상세: ClaimDtl 임베드 (항상 표시, 진입 시 빈 신규 폼) ============= -->
  <od-claim-dtl
    :key="cfDetailKey"
    :navigate="inlineNavigate"
    :dtl-id="cfDetailEditId"
    :dtl-mode="detailPanel.openMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailPanel.active"
    :reload-trigger="detailPanel.reloadTrigger"
    />
  <!-- ===== □. 하단 상세: ClaimDtl 임베드 ===================================== -->
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
        <button v-for="t in [{id:'status',label:'클레임상태'},{id:'type',label:'클레임유형'},{id:'approval',label:'결재처리'},{id:'approvalReq',label:'추가결재요청'}]" :key="t?.id"
          @click="handleBtnAction('actionsModal-tabChange', t.id)"
          :style="{flex:1,padding:'8px 12px',border:'none',cursor:'pointer',fontSize:'12.5px',borderRadius:'8px 8px 0 0',fontWeight: uiState.bulkTab===t.id?800:600,background: uiState.bulkTab===t.id?'#fff':'transparent',color: uiState.bulkTab===t.id?'#e8587a':'#888',borderBottom: uiState.bulkTab===t.id?'2px solid #e8587a':'2px solid transparent'}">
          {{ t.label }}
        </button>
      </div>
      <div style="padding:20px 18px;flex:1;overflow-y:auto;min-height:280px;">
        <div v-if="uiState.bulkTab==='status'">
          <div v-for="t in codes.claim_types.map(c=>c.codeValue)" :key="Math.random()" class="form-group" :style="{opacity: (cfCheckedByType[t]||[]).length ? 1 : 0.4}">
            <label class="form-label">
              <span :style="{display:'inline-block',fontSize:'10px',padding:'2px 8px',borderRadius:'10px',color:'#fff',fontWeight:700,marginRight:'6px',background: t==='취소'?'#ef4444':t==='반품'?'#FFBB00':'#3b82f6'}">
                {{ t }}
              </span>
              상태
              <span style="font-size:11px;color:#1565c0;margin-left:4px;">
                (대상 {{ (cfCheckedByType[t]||[]).length }}건)
              </span>
            </label>
            <select class="form-control" v-model="bulkForm.statusByType[t]" :disabled="!(cfCheckedByType[t]||[]).length">
              <option value="">
                {{ (cfCheckedByType[t]||[]).length ? '선택하세요 (미선택시 변경안함)' : '선택된 항목 없음' }}
              </option>
              <option v-for="s in CLAIM_STATUS_BY_TYPE[t]" :key="Math.random()" :value="s">
                {{ s }}
              </option>
            </select>
          </div>
        </div>
        <div v-if="uiState.bulkTab==='type'">
          <label class="form-label">
            변경할 클레임유형
          </label>
          <select class="form-control" v-model="bulkForm.type">
            <option value="">
              선택하세요
            </option>
            <option v-for="c in codes.claim_types" :key="c.codeValue" :value="c.codeValue">
              {{ c.codeLabel }}
            </option>
          </select>
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
        <button class="btn btn_cancel" @click="handleBtnAction('actionsModal-close')">
          취소
        </button>
        <button class="btn btn_save" @click="handleBtnAction('actionsModal-apply')">
          저장
        </button>
      </div>
    </div>
  </div>
  <!-- ===== □. 변경작업 모달 ================================================= -->
  <!-- ===== ■. 회원 선택 팝업 ================================================ -->
  <od-member-pick-modal :show="memberPick.open" ui-nm="클레임관리"
    subtitle="클레임 조회 기준 회원을 선택해주세요" modal-name="member-pick" :on-callback="fnCallbackModal" />
  <!-- ===== □. 회원 선택 팝업 ================================================ -->
  <!-- ===== ■. 클레임 금액 계산 모달 ========================================= -->
  <od-claim-calc-modal :show="mngCalcDialog.show" :claim-id="mngCalcDialog.claimId" @close="handleCloseMngCalc" />
  <!-- ===== (구 인라인 모달 — OdClaimCalcModal 컴포넌트로 대체됨) -->
  <bo-modal :show="false" title="환불 (예정) 계산" width="760px" @close="handleCloseMngCalc">
    <template #default>
      <div v-if="mngCalcDialog.loading" style="text-align:center;padding:40px;color:#94a3b8;">⏳ 계산 중...</div>
      <template v-else-if="mngCalcDialog.data">
        <!-- ① 메타 바: 회원·주문·클레임·신청일·상태 한 줄 -->
        <div style="display:grid;grid-template-columns:auto auto 1fr auto auto;gap:0;align-items:stretch;margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;font-size:11px;">
          <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
            <div style="color:#94a3b8;margin-bottom:2px;">회원</div>
            <div style="font-weight:700;color:#111;white-space:nowrap;">{{ mngCalcDialog.data.claim.memberNm || mngCalcDialog.data.claim.member_nm || '-' }}</div>
          </div>
          <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
            <div style="color:#94a3b8;margin-bottom:2px;">주문번호</div>
            <div style="font-weight:700;color:#1d4ed8;font-family:monospace;white-space:nowrap;">{{ mngCalcDialog.data.claim.orderId || mngCalcDialog.data.order.orderId || '-' }}</div>
          </div>
          <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
            <div style="color:#94a3b8;margin-bottom:2px;">클레임번호</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-weight:700;font-family:monospace;color:#111;">{{ mngCalcDialog.claimId }}</span>
              <span style="padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;"
                :style="mngCalcDialog.claimType==='CANCEL'?'background:#fee2e2;color:#b91c1c':mngCalcDialog.claimType==='RETURN'?'background:#fff7ed;color:#9a3412':'background:#dbeafe;color:#1d4ed8'">
                {{ mngCalcDialog.claimType==='CANCEL'?'취소':mngCalcDialog.claimType==='RETURN'?'반품':'교환' }}
              </span>
            </div>
          </div>
          <div style="padding:8px 14px;background:#f1f5f9;border-right:1px solid #e2e8f0;">
            <div style="color:#94a3b8;margin-bottom:2px;">신청일</div>
            <div style="font-weight:600;color:#111;white-space:nowrap;">{{ (mngCalcDialog.data.claim.requestDate || mngCalcDialog.data.claim.request_date || '').replace('T',' ').slice(0,10) || '-' }}</div>
          </div>
          <div style="padding:8px 14px;background:#f1f5f9;">
            <div style="color:#94a3b8;margin-bottom:2px;">상태</div>
            <div style="font-weight:700;">
              <span style="padding:2px 8px;border-radius:6px;font-size:10px;"
                :style="(mngCalcDialog.data.claim.claimStatusCd||'').includes('COMPLT')?'background:#dcfce7;color:#15803d':(mngCalcDialog.data.claim.claimStatusCd||'').includes('CANCEL')?'background:#fee2e2;color:#b91c1c':'background:#fef9c3;color:#92400e'">
                {{ {'REQUEST':'접수','PROCESS':'처리중','COMPLT':'완료','CANCEL':'취소'}[mngCalcDialog.data.claim.claimStatusCd] || mngCalcDialog.data.claim.claimStatusCd || '-' }}
              </span>
            </div>
          </div>
        </div>
        <!-- ② 클레임 전환 선택바 -->
        <div v-if="mngCalcDialog.orderClaims.length >= 1" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:11px;">
          <span style="color:#6b7280;white-space:nowrap;">이 주문의 클레임</span>
          <span style="font-weight:700;color:#1d4ed8;">{{ mngCalcDialog.orderClaims.length }}건</span>
          <select :value="mngCalcDialog.claimId" @change="handleMngCalcSwitch($event.target.value)" :disabled="mngCalcDialog.switchLoading"
            style="flex:1;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;background:#fff;cursor:pointer;">
            <option v-for="c in mngCalcDialog.orderClaims" :key="c.claimId" :value="c.claimId">
              {{ c.claimId }} — {{ c.claimTypeCd==='CANCEL'?'취소':c.claimTypeCd==='RETURN'?'반품':'교환' }} / {{ c.claimStatusCd==='REQUEST'?'접수':c.claimStatusCd==='PROCESS'?'처리중':c.claimStatusCd==='COMPLT'?'완료':c.claimStatusCd==='CANCEL'?'취소':c.claimStatusCd }}
            </option>
          </select>
          <span v-if="mngCalcDialog.switchLoading" style="color:#94a3b8;">⏳</span>
        </div>
        <!-- ③ 상품 정보 카드 (3열: 현재 주문상품 정보 | 클레임 신청 후 (환불 예정) | 최종 정보) -->
        <div style="border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="padding:8px 12px;background:#f1f5f9;font-size:11px;font-weight:800;color:#374151;border-bottom:1px solid #e2e8f0;">🛍 상품 정보</div>
          <div style="padding:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start;">
          <!-- 1열: 현재 주문상품 정보 -->
          <div style="border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
            <div style="padding:7px 10px;background:#f8fafc;font-size:11px;font-weight:700;color:#374151;border-bottom:1px solid #e2e8f0;">🛒 현재 주문상품 정보</div>
            <div style="padding:10px 12px;">
              <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
                <thead><tr style="background:#f8fafc;">
                  <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">상품명</th>
                  <th style="padding:4px 6px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">수량</th>
                  <th style="padding:4px 6px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;white-space:nowrap;">금액</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(it, i) in (mngCalcDialog.data.order.orderItems || mngCalcDialog.data.claim.claimItems || [])" :key="i">
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:center;">{{ it.orderQty || it.order_qty || it.claimQty || 1 }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:monospace;">{{ ((it.itemAmt || it.item_amt || (it.salePrice || it.sale_price || 0) * (it.orderQty || it.order_qty || 1)) || 0).toLocaleString() }}원</td>
                  </tr>
                  <tr v-if="!(mngCalcDialog.data.order.orderItems || mngCalcDialog.data.claim.claimItems || []).length">
                    <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">-</td>
                  </tr>
                </tbody>
              </table>
              <div style="border-top:1px solid #e5e7eb;padding-top:6px;font-size:11px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>상품 합계</span><span style="font-family:monospace;">{{ (mngCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.shippingFee || mngCalcDialog.data.order.dlivFee" style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>배송비</span><span style="font-family:monospace;">{{ (mngCalcDialog.data.order.shippingFee || mngCalcDialog.data.order.dlivFee || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>쿠폰 할인</span><span style="font-family:monospace;">- {{ (mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>적립금 사용</span><span style="font-family:monospace;">- {{ (mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.cacheUsedAmt" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>충전금 사용</span><span style="font-family:monospace;">- {{ (mngCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-weight:800;border-top:1px solid #e2e8f0;margin-top:3px;">
                  <span>실 결제액</span>
                  <span style="font-family:monospace;color:#1d4ed8;">{{ (mngCalcDialog.data.order.payAmt || mngCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 2열: 클레임 신청 후 (환불 예정) -->
          <div style="border-radius:8px;border:1px solid #bbf7d0;overflow:hidden;">
            <div style="padding:7px 10px;background:#f0fdf4;font-size:11px;font-weight:700;color:#14532d;border-bottom:1px solid #bbf7d0;">♻️ 클레임 신청 후 (환불 예정)</div>
            <div style="padding:10px 12px;">
              <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px;">
                <thead><tr style="background:#f0fdf4;">
                  <th style="padding:4px 6px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;">상품명</th>
                  <th style="padding:4px 6px;text-align:center;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">수량</th>
                  <th style="padding:4px 6px;text-align:right;color:#15803d;font-weight:600;border-bottom:1px solid #bbf7d0;white-space:nowrap;">항목금액</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(it, i) in (mngCalcDialog.data.claim.claimItems || [])" :key="i">
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:center;">{{ it.claimQty || it.claim_qty || 1 }}</td>
                    <td style="padding:4px 6px;border-bottom:1px solid #f0fdf4;text-align:right;font-family:monospace;">{{ (it.itemAmt || it.item_amt || 0).toLocaleString() }}원</td>
                  </tr>
                  <tr v-if="!(mngCalcDialog.data.claim.claimItems || []).length">
                    <td colspan="3" style="text-align:center;padding:8px;color:#94a3b8;">항목 없음</td>
                  </tr>
                </tbody>
              </table>
              <div style="border-top:1px solid #bbf7d0;padding-top:6px;font-size:11px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>클레임 항목 금액</span><span style="font-family:monospace;">{{ (mngCalcDialog.data.calc.itemAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.dlivFeeRefund > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                  <span>배송비 환불 (전체취소)</span><span style="font-family:monospace;">+ {{ mngCalcDialog.data.calc.dlivFeeRefund.toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.couponDiscAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>쿠폰 차감 (비례)</span><span style="font-family:monospace;">- {{ mngCalcDialog.data.calc.couponDiscAmt.toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.saveUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>적립금 차감 (비례)</span><span style="font-family:monospace;">- {{ mngCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.cacheUsedAmt > 0" style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626;">
                  <span>충전금 차감 (비례)</span><span style="font-family:monospace;">- {{ mngCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 1px;font-size:13px;font-weight:800;border-top:1px solid #bbf7d0;margin-top:3px;">
                  <span>환불 예정액</span>
                  <span style="font-family:monospace;color:#059669;">{{ (mngCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 3열: 최종 정보 -->
          <div style="border-radius:8px;border:1px solid #a5b4fc;overflow:hidden;">
            <div style="padding:7px 10px;background:#eef2ff;font-size:11px;font-weight:700;color:#3730a3;border-bottom:1px solid #a5b4fc;">✅ 최종 정보</div>
            <div style="padding:10px 12px;font-size:11px;">
              <!-- 유지되는 상품 목록 -->
              <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">유지되는 주문상품</div>
              <div style="background:#f5f3ff;border-radius:6px;padding:6px 8px;margin-bottom:8px;">
                <template v-if="(mngCalcDialog.data.order.orderItems || []).length > (mngCalcDialog.data.claim.claimItems || []).length">
                  <div v-for="(it, i) in (mngCalcDialog.data.order.orderItems || [])" :key="i"
                    style="display:flex;justify-content:space-between;padding:2px 0;color:#374151;">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;" :title="it.prodNm || it.prod_nm">{{ it.prodNm || it.prod_nm || '-' }}</span>
                    <span style="font-family:monospace;white-space:nowrap;margin-left:4px;">{{ it.orderQty || it.order_qty || 1 }}개</span>
                  </div>
                </template>
                <div v-else style="color:#94a3b8;font-size:11px;text-align:center;padding:4px 0;">전량 클레임 처리</div>
              </div>
              <!-- 최종 금액 요약 -->
              <div style="font-size:10px;font-weight:700;color:#4f46e5;margin-bottom:4px;">최종 금액 요약</div>
              <div style="display:flex;flex-direction:column;gap:3px;">
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#6b7280;">
                  <span>원 결제액</span>
                  <span style="font-family:monospace;">{{ (mngCalcDialog.data.order.payAmt || mngCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:2px 0;color:#059669;">
                  <span>환불 예정액</span>
                  <span style="font-family:monospace;font-weight:700;">- {{ (mngCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:5px 0 2px;font-weight:800;border-top:1px solid #a5b4fc;margin-top:2px;">
                  <span style="color:#3730a3;">최종 부담액</span>
                  <span style="font-family:monospace;color:#1d4ed8;">
                    {{ ((mngCalcDialog.data.order.payAmt || mngCalcDialog.data.calc.orderTotalAmt || 0) - (mngCalcDialog.data.calc.refundBase || 0)).toLocaleString() }}원
                  </span>
                </div>
                <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                  비례율 {{ Math.round((mngCalcDialog.data.calc.ratio || 0) * 100) }}% 적용
                </div>
              </div>
            </div>
          </div>
        </div><!-- /grid -->
        </div><!-- /상품 정보 카드 -->
        <!-- ③ 결제 정보 카드 (3열: 결제 상세 | 환불 예정 결제수단 | 최종 결제 요약) -->
        <div style="margin-top:12px;border-radius:10px;border:1px solid #bfdbfe;overflow:hidden;">
          <div style="padding:8px 12px;background:#eff6ff;font-size:11px;font-weight:800;color:#1e40af;border-bottom:1px solid #bfdbfe;">💳 결제 정보</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
            <!-- 결제 상세 -->
            <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
              <div style="font-size:10px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">📌 결제 상세</div>
              <template v-if="(mngCalcDialog.data.order.orderPays || []).length">
                <div v-for="(pay, pi) in (mngCalcDialog.data.order.orderPays || [])" :key="pi"
                  style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #dbeafe;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                    <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">{{ (pay.payAmt || 0).toLocaleString() }}원</span>
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:3px;color:#94a3b8;font-size:10px;">
                    <span>{{ pay.payStatusCdNm || pay.payStatusCd || '' }}</span>
                    <span>{{ (pay.payDate || '').replace('T',' ').slice(0,16) }}</span>
                    <span v-if="pay.cardNo">카드 {{ pay.cardNo }}</span>
                    <span v-if="pay.pgTransactionId" style="font-family:monospace;">PG {{ pay.pgTransactionId }}</span>
                  </div>
                </div>
              </template>
              <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f8fafc;border-radius:6px;text-align:center;">결제 데이터 없음</div>
            </div>
            <!-- 환불 예정 결제수단 -->
            <div style="padding:10px 14px;border-right:1px solid #bfdbfe;">
              <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:6px;">♻️ 환불 예정 결제수단</div>
              <template v-if="(mngCalcDialog.data.order.orderPays || []).length">
                <div v-for="(pay, pi) in (mngCalcDialog.data.order.orderPays || [])" :key="pi"
                  style="font-size:11px;padding:5px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#374151;font-weight:700;">{{ pay.payMethodCdNm || pay.payMethodCd || '-' }}</span>
                    <span style="font-family:monospace;color:#059669;font-weight:700;">
                      {{ Math.round((pay.payAmt || 0) * (mngCalcDialog.data.calc.ratio || 0)).toLocaleString() }}원 예정
                    </span>
                  </div>
                  <div style="font-size:10px;color:#6b9b7a;margin-top:2px;">
                    원결제 {{ (pay.payAmt || 0).toLocaleString() }}원의 {{ Math.round((mngCalcDialog.data.calc.ratio || 0) * 100) }}%
                  </div>
                </div>
              </template>
              <div v-else style="font-size:11px;color:#94a3b8;padding:6px 8px;background:#f0fdf4;border-radius:6px;text-align:center;">결제 데이터 없음</div>
            </div>
            <!-- 최종 결제 요약 -->
            <div style="padding:10px 14px;background:#f8faff;">
              <div style="font-size:10px;font-weight:700;color:#6366f1;margin-bottom:6px;">✅ 최종 결제 요약</div>
              <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;color:#6b7280;">
                  <span>원 결제액</span>
                  <span style="font-family:monospace;">{{ (mngCalcDialog.data.order.payAmt || mngCalcDialog.data.calc.orderTotalAmt || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;color:#059669;">
                  <span>환불 예정액</span>
                  <span style="font-family:monospace;font-weight:700;">{{ (mngCalcDialog.data.calc.refundBase || 0).toLocaleString() }}원</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #e2e8f0;margin-top:2px;font-weight:800;">
                  <span style="color:#374151;">최종 부담액</span>
                  <span style="font-family:monospace;color:#1d4ed8;">
                    {{ ((mngCalcDialog.data.order.payAmt || mngCalcDialog.data.calc.orderTotalAmt || 0) - (mngCalcDialog.data.calc.refundBase || 0)).toLocaleString() }}원
                  </span>
                </div>
                <div style="margin-top:6px;padding:5px 8px;background:#e0e7ff;border-radius:6px;text-align:center;font-size:10px;color:#4338ca;font-weight:700;">
                  비례율 {{ Math.round((mngCalcDialog.data.calc.ratio || 0) * 100) }}% 적용
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ④ 프로모션 정보 카드 (3열: 사용된 | 복구되는 | 최종 프로모션 현황) -->
        <div style="margin-top:12px;border-radius:10px;border:1px solid #e9d5ff;overflow:hidden;">
          <div style="padding:8px 12px;background:#f5f3ff;font-size:11px;font-weight:800;color:#6d28d9;border-bottom:1px solid #e9d5ff;">🎁 프로모션 정보</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;">
            <!-- 사용된 프로모션 (주문 시) -->
            <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
              <div style="font-size:10px;font-weight:700;color:#7c3aed;margin-bottom:8px;">📌 사용된 프로모션 (주문 시)</div>
              <div v-if="!(mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt) &amp;&amp; !(mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt) &amp;&amp; !mngCalcDialog.data.order.cacheUsedAmt"
                style="font-size:11px;color:#94a3b8;padding:4px 0;">사용된 프로모션 없음</div>
              <template v-else>
                <div v-if="mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <div>
                    <span style="color:#7c3aed;font-weight:700;">🎟 쿠폰 할인</span>
                    <span v-if="mngCalcDialog.data.calc.couponNm" style="color:#94a3b8;font-size:10px;margin-left:4px;">{{ mngCalcDialog.data.calc.couponNm }}</span>
                  </div>
                  <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <span style="color:#7c3aed;font-weight:700;">⭐ 적립금 사용</span>
                  <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.order.cacheUsedAmt"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <span style="color:#7c3aed;font-weight:700;">💰 충전금 사용</span>
                  <span style="font-family:monospace;color:#dc2626;font-weight:700;">-{{ (mngCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</span>
                </div>
              </template>
            </div>
            <!-- 복구되는 프로모션 (클레임 완료 후) -->
            <div style="padding:10px 14px;border-right:1px solid #e9d5ff;">
              <div style="font-size:10px;font-weight:700;color:#059669;margin-bottom:8px;">♻️ 복구되는 프로모션 (클레임 완료 후)</div>
              <div v-if="!(mngCalcDialog.data.calc.couponDiscAmt > 0) &amp;&amp; !(mngCalcDialog.data.calc.saveUsedAmt > 0) &amp;&amp; !(mngCalcDialog.data.calc.cacheUsedAmt > 0)"
                style="font-size:11px;color:#94a3b8;padding:4px 0;">복구되는 프로모션 없음</div>
              <template v-else>
                <div v-if="mngCalcDialog.data.calc.couponDiscAmt > 0"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                  <div>
                    <span style="color:#059669;font-weight:700;">🎟 쿠폰</span>
                    <span v-if="mngCalcDialog.data.calc.couponNm" style="color:#94a3b8;font-size:10px;margin-left:4px;">{{ mngCalcDialog.data.calc.couponNm }}</span>
                  </div>
                  <span style="background:#ffedd5;color:#c2410c;padding:1px 8px;border-radius:8px;font-size:10px;font-weight:700;">재발급 필요</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.saveUsedAmt > 0"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                  <span style="color:#059669;font-weight:700;">⭐ 적립금 복구</span>
                  <span style="font-family:monospace;color:#059669;font-weight:700;">+{{ mngCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</span>
                </div>
                <div v-if="mngCalcDialog.data.calc.cacheUsedAmt > 0"
                  style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;margin-bottom:4px;background:#fff;border-radius:6px;border:1px solid #bbf7d0;font-size:11px;">
                  <span style="color:#059669;font-weight:700;">💰 충전금 복구</span>
                  <span style="font-family:monospace;color:#1d4ed8;font-weight:700;">+{{ mngCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</span>
                </div>
              </template>
            </div>
            <!-- 최종 프로모션 현황 -->
            <div style="padding:10px 14px;background:#faf5ff;">
              <div style="font-size:10px;font-weight:700;color:#6d28d9;margin-bottom:8px;">✅ 최종 프로모션 현황</div>
              <div style="font-size:11px;display:flex;flex-direction:column;gap:4px;">
                <!-- 쿠폰 최종 -->
                <div v-if="mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt"
                  style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#6b7280;">🎟 쿠폰 잔여</span>
                    <span v-if="mngCalcDialog.data.calc.couponDiscAmt > 0" style="background:#ffedd5;color:#c2410c;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:700;">재발급 필요</span>
                    <span v-else style="color:#94a3b8;font-size:10px;">해당없음</span>
                  </div>
                </div>
                <!-- 적립금 최종 -->
                <div v-if="mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt"
                  style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <div style="display:flex;justify-content:space-between;color:#6b7280;">
                    <span>⭐ 적립금</span>
                    <div style="text-align:right;">
                      <div style="color:#dc2626;">사용 -{{ (mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt || 0).toLocaleString() }}원</div>
                      <div v-if="mngCalcDialog.data.calc.saveUsedAmt > 0" style="color:#059669;">복구 +{{ mngCalcDialog.data.calc.saveUsedAmt.toLocaleString() }}원</div>
                      <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                        순차감 {{ ((mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt || 0) - (mngCalcDialog.data.calc.saveUsedAmt || 0)).toLocaleString() }}원
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 충전금 최종 -->
                <div v-if="mngCalcDialog.data.order.cacheUsedAmt"
                  style="padding:4px 8px;background:#fff;border-radius:6px;border:1px solid #e9d5ff;font-size:11px;">
                  <div style="display:flex;justify-content:space-between;color:#6b7280;">
                    <span>💰 충전금</span>
                    <div style="text-align:right;">
                      <div style="color:#dc2626;">사용 -{{ (mngCalcDialog.data.order.cacheUsedAmt || 0).toLocaleString() }}원</div>
                      <div v-if="mngCalcDialog.data.calc.cacheUsedAmt > 0" style="color:#059669;">복구 +{{ mngCalcDialog.data.calc.cacheUsedAmt.toLocaleString() }}원</div>
                      <div style="font-weight:700;color:#374151;border-top:1px solid #e9d5ff;margin-top:2px;padding-top:2px;">
                        순차감 {{ ((mngCalcDialog.data.order.cacheUsedAmt || 0) - (mngCalcDialog.data.calc.cacheUsedAmt || 0)).toLocaleString() }}원
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!(mngCalcDialog.data.order.couponDiscntAmt || mngCalcDialog.data.order.couponDiscAmt) &amp;&amp; !(mngCalcDialog.data.order.saveUseAmt || mngCalcDialog.data.order.saveUsedAmt) &amp;&amp; !mngCalcDialog.data.order.cacheUsedAmt"
                  style="font-size:11px;color:#94a3b8;padding:4px 0;">프로모션 없음</div>
              </div>
            </div>
          </div>
        </div>
        <!-- ③ 사유 (있을 때만) -->
        <div v-if="mngCalcDialog.data.claim.reasonDetail || mngCalcDialog.data.claim.reason_detail"
          style="margin-top:10px;padding:8px 12px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;font-size:11px;">
          <span style="color:#9ca3af;margin-right:8px;">상세 사유</span>
          <span style="color:#374151;">{{ mngCalcDialog.data.claim.reasonDetail || mngCalcDialog.data.claim.reason_detail }}</span>
        </div>
        <!-- ④ 진행 이력 타임라인 -->
        <div v-if="(mngCalcDialog.data.statusHist || []).length"
          style="margin-top:10px;padding:10px 14px;background:#fafafa;border-radius:8px;border:1px solid #e5e7eb;">
          <div style="font-size:10px;color:#6b7280;font-weight:700;margin-bottom:10px;">📋 진행 이력</div>
          <div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:4px;">
            <template v-for="(h, i) in (mngCalcDialog.data.statusHist || [])" :key="i">
              <div style="display:flex;flex-direction:column;align-items:center;min-width:90px;max-width:110px;">
                <div style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;white-space:nowrap;margin-bottom:4px;"
                  :style="(h.claimStatusCd||'').indexOf('COMPLT')>=0?'background:#dcfce7;color:#15803d':(h.claimStatusCd||'').indexOf('CANCEL')>=0?'background:#fee2e2;color:#b91c1c':'background:#dbeafe;color:#1d4ed8'">
                  {{ {'REQUEST':'접수','RECEIPT':'접수','PROCESS':'처리중','INSPECT':'검수중','COMPLT':'완료','CANCEL':'취소','REJECT':'반려','HOLD':'보류'}[h.claimStatusCd] || h.claimStatusCd }}
                </div>
                <div style="font-size:9px;color:#9ca3af;text-align:center;">{{ (h.chgDate||'').replace('T',' ').slice(0,16) }}</div>
                <div v-if="h.chgUserId" style="font-size:9px;color:#cbd5e1;text-align:center;margin-top:1px;">{{ h.chgUserId }}</div>
              </div>
              <div v-if="i < (mngCalcDialog.data.statusHist||[]).length - 1"
                style="flex-shrink:0;padding:0 4px;color:#d1d5db;font-size:14px;margin-top:6px;">›</div>
            </template>
          </div>
        </div>
        <!-- ⑤ 안내 -->
        <div style="margin-top:8px;font-size:10px;color:#9ca3af;padding:5px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #e5e7eb;">
          ※ 실제 환불액은 결제 수단별 환불 정책에 따라 달라질 수 있습니다. 비례율 {{ Math.round(mngCalcDialog.data.calc.ratio * 100) }}% 적용
        </div>
      </template>
    </template>
  </bo-modal>
  <!-- ===== □. 클레임 금액 계산 모달 ========================================= -->
</bo-page>
`
};
