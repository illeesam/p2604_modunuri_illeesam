/* ShopJoy Admin - 사용자로그인이력 */
window.SyUserLoginHist = {
  name: 'SyUserLoginHist',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, onMounted } = Vue;

    /* ===== 검색조건 + UI 상태 (uiState 가 검색 파라미터 역할까지 겸함) ===== */
    const searchParam = reactive({
      descOpen: false, isPageCodeLoad: false, srchOpen: false,
      activeTab: 'log',
      dateRange: '1week', dateStart: '', dateEnd: '',
      searchType: '', searchValue: '', searchResultCd: '', searchIp: '',
      searchUiNm: '', searchTraceId: '',
    });

    /* 초기 1주일 범위 설정 */
    boUtil.bofApplyDateRange(searchParam, '1week');

    const codes = reactive({ login_results: [], token_actions: [], date_range_opts: [] });

    /* ===== 페이지네이션 ===== */
    const logGridPager = reactive({ pageType:'PAGE', pageNo:1, pageSize:20, pageTotalCount:0, pageTotalPage:1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond:{} });

    /* ===== 목록 데이터 ===== */
    const logs   = reactive([]);                  // 로그인 로그
    const tokens = reactive([]);                  // 토큰 이력
    const tabCounts = reactive({ log:0, token:0 });  // 탭별 카운트
    // Hist 탭 정의 (표준 bo-tab-bar, 뷰모드 없음)
    const histTabs = reactive([
      { id: 'log',   label: '로그인 로그', get count() { return tabCounts.log; } },
      { id: 'token', label: '토큰 이력',   get count() { return tabCounts.token; } },
    ]);

    /* ===== 행 펼치기 상태 ===== */
    const expandedRows    = reactive(new Set());
    const allExpanded     = reactive({ value: false });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserLoginHist.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        logGridPager.pageNo = 1;
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, { searchType:'', searchValue:'', searchResultCd:'', searchIp:'', searchUiNm:'', searchTraceId:'', dateRange:'1week', srchOpen:false });
        onDateRangeChange();
        logGridPager.pageNo = 1;
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 펼침 검색조건 토글
      } else if (cmd === 'searchParam-toggleMore') {
        searchParam.srchOpen = !searchParam.srchOpen;
        return;
      // 행 펼침 전체 토글
      } else if (cmd === 'histList-toggleExpandAll') {
        return toggleExpandAll();
      // 로그 비우기
      } else if (cmd === 'histList-clearLog') {
        return handleClearLog();
      // 페이지 번호 클릭
      } else if (cmd === 'histList-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyUserLoginHist.js : handleSelectAction -> ', cmd, param);
      // 탭 변경 (log / token)
      if (cmd === 'searchParam-tabChange') {
        searchParam.activeTab = param;
        logGridPager.pageNo = 1;
        allExpanded.value = false;
        return handleSearchList();
      // 페이지 크기 변경
      } else if (cmd === 'histList-pager-sizeChange') {
        return onSizeChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭/액션 라우터. colKey 기준 분기 (행 액션 버튼·토글 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyUserLoginHist.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'histList-cellClick') {
        // 펼침 토글 아이콘 (_exp / colKey='btn_row_expand')
        if (colKey === 'btn_row_expand') { return toggleRow(row.logId); }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      searchParam.isPageCodeLoad = true;
      const cs = window.sfGetBoCodeStore();
      codes.login_results   = cs?.sgGetGrpCodes('LOGIN_RESULT')   || [];
      codes.token_actions   = cs?.sgGetGrpCodes('TOKEN_ACTION')   || [];
      codes.date_range_opts = cs?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
    };
    const isAppReady = coUtil.cofUseAppCodeReady(searchParam, fnLoadCodes);

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      logGridPager.pageTotalPage = Math.max(1, Math.ceil(logGridPager.pageTotalCount / logGridPager.pageSize));
      const c = logGridPager.pageNo, l = logGridPager.pageTotalPage, s = Math.max(1,c-2), e = Math.min(l,s+4);
      logGridPager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };

    /* toggleRow — 행 펼침 토글 */
    const toggleRow       = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded — 펼침 여부 */
    const isExpanded      = id => expandedRows.has(id);

    /* toggleExpandAll — 전체 펼침 토글 */
    const toggleExpandAll = () => {
      const list = searchParam.activeTab==='log' ? logs : tokens;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r,i) => expandedRows.add(r.logId||i)); allExpanded.value = true; }
    };

    /* buildParams — 검색 파라미터 빌드 */
    const buildParams = () => {
      const p = {
        pageNo: logGridPager.pageNo, pageSize: logGridPager.pageSize,
        dateStart:  searchParam.dateStart    || undefined,
        dateEnd:    searchParam.dateEnd      || undefined,
        resultCd:   searchParam.searchResultCd || undefined,
        ip:         searchParam.searchIp     || undefined,
        uiNm:       searchParam.searchUiNm   || undefined,
        traceId:    searchParam.searchTraceId || undefined,
        searchType: searchParam.searchType  || undefined,
        searchValue: searchParam.searchValue    || undefined,
      };
      if (p.searchValue && !p.searchType) {
        p.searchType = 'userId,loginId';
      }
      return p;
    };

    /* handleSearchLog — 로그인 로그 조회 */
    const handleSearchLog = async () => {
      try {
        const res = await boApiSvc.syUserLoginLog.getPage(buildParams(), '사용자로그인이력', '로그인로그조회');
        const d = res.data?.data;
        logs.splice(0, logs.length, ...(d?.pageList || []));
        logGridPager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.log = logGridPager.pageTotalCount;
        fnBuildPagerNums(); expandedRows.clear();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSearchToken — 토큰 이력 조회 */
    const handleSearchToken = async () => {
      try {
        const res = await boApiSvc.syUserTokenLog.getPage(buildParams(), '사용자로그인이력', '토큰이력조회');
        const d = res.data?.data;
        tokens.splice(0, tokens.length, ...(d?.pageList || []));
        logGridPager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.token = logGridPager.pageTotalCount;
        fnBuildPagerNums(); expandedRows.clear();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSearchList — 목록 조회 (탭별 디스패치) */
    const handleSearchList = async () => {
      if (searchParam.activeTab === 'log') { await handleSearchLog(); }
      else { await handleSearchToken(); }
    };

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList(); });

    /* setPage — 페이지 번호 변경 */
    const setPage      = n => { if (n>=1 && n<=logGridPager.pageTotalPage) { logGridPager.pageNo=n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { logGridPager.pageNo=1; handleSearchList(); };

    /* handleClearLog — 로그 전체 삭제 */
    const handleClearLog = async () => {
      const tabNm = searchParam.activeTab==='log' ? '사용자로그인 로그' : '사용자토큰 이력';
      const ok = await props.showConfirm('로그 비우기', `[${tabNm}] 테이블의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`);
      if (!ok) { return; }
      try {
        if (searchParam.activeTab==='log') { await window.boApi.delete('/bo/sy/user-login-log/all', coUtil.cofApiHdr('사용자로그인이력', '로그비우기')); }
        else { await window.boApi.delete('/bo/sy/user-token-log/all', coUtil.cofApiHdr('사용자로그인이력', '로그비우기')); }
        props.showToast(`${tabNm} 전체 삭제 완료`, 'success');
        if (searchParam.activeTab==='log') { logs.splice(0); tabCounts.log=0; }
        else                           { tokens.splice(0); tabCounts.token=0; }
        logGridPager.pageTotalCount=0; logGridPager.pageTotalPage=1; expandedRows.clear(); allExpanded.value=false;
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfCurrentList = computed(() => searchParam.activeTab==='log' ? logs : tokens);

    /* fnResultBadge — 로그인결과 배지 */
    const fnResultBadge = cd => ({'SUCCESS':'badge-green','LOGOUT':'badge-blue','FAIL_PW':'badge-red','FAIL_LOCKED':'badge-orange','FAIL_NOT_FOUND':'badge-gray','FAIL_IP':'badge-purple'}[cd]||'badge-gray');

    /* fnResultLabel — 로그인결과 라벨 */
    const fnResultLabel = cd => ({'SUCCESS':'성공','LOGOUT':'로그아웃','FAIL_PW':'비밀번호오류','FAIL_LOCKED':'계정잠금','FAIL_NOT_FOUND':'없는계정','FAIL_IP':'IP차단'}[cd]||cd||'-');

    /* fnActionBadge — 토큰액션 배지 */
    const fnActionBadge = boUtil.bofTokenActionBadge;

    /* fnActionLabel — 토큰액션 라벨 */
    const fnActionLabel = boUtil.bofTokenActionLabel;

    /* fnTypeBadge — 토큰유형 배지 */
    const fnTypeBadge   = boUtil.bofTokenTypeBadge;

    /* fnDecode — URI 디코드 */
    const fnDecode = coUtil.cofDecodeUri;

    /* fnRowExpanded — 행 펼침 여부 */
    const fnRowExpanded = (r, idx) => isExpanded(r.logId || idx);

    /* fnRowClickStyle — 펼친 행 배경 강조 (펼침은 _exp 아이콘 클릭으로만) */
    const fnRowClickStyle = (r, idx) => isExpanded(r.logId || idx) ? 'background:#fafbff;' : '';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'dateRange', type: 'dateRange', label: '등록기간',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'searchResultCd', type: 'select', label: '로그인결과',
        options: () => codes.login_results, nullLabel: '로그인결과 전체' },
      { key: 'searchIp', type: 'text', label: 'IP 주소', placeholder: 'IP 주소', width: '140px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [{ value: 'userId', label: '사용자ID' }, { value: 'loginId', label: '로그인ID' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '170px' },
    ];

    /* moreSearchColumns — 펼침 영역(srchOpen=true) 두번째 검색바 */
    columns.moreSearch = [
      { key: 'searchUiNm',    type: 'text', label: 'x-헤더 화면명', placeholder: '화면명 (x-ui-nm)', width: '170px' },
      { key: 'searchTraceId', type: 'text', label: 'Trace ID',  placeholder: 'Trace ID',         width: '200px' },
    ];

    // 로그 그리드
    columns.logGrid = [
      { key: '_exp', label: '', style: 'width:24px', align: 'center',
        linkToggle: { active: (row) => isExpanded(row.logId), title: '펼치기/닫기', onClick: (row) => handleGridCellAction('histList-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'logId',    label: '로그ID',     mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'loginDate',label: '로그인일시', cellStyle: 'white-space:nowrap', fmt: (v, row) => coUtil.cofYmdHms(row.loginDate || row.regDate || '') },
      { key: '_user',    label: '사용자',
        fmt: (v, row) => `${row.userNm || row.userId || '-'}  #${row.userId}` },
      { key: 'loginId',  label: '로그인ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: 'resultCd', label: '결과', badge: (row) => fnResultBadge(row.resultCd), fmt: (v) => fnResultLabel(v) },
      { key: 'failCnt',  label: '실패',      style: 'text-align:center;', align: 'center', cellStyle: (v, row) => row.failCnt > 0 ? 'color:#e74c3c;font-weight:700' : '', fmt: (v) => v > 0 ? v + '회' : '-' },
      { key: 'ip',       label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: '_browser', label: 'OS/브라우저', cellStyle: 'font-size:11px;color:#666;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => (row.browser || '') + (row.os ? ' / ' + row.os : ''), fmt: (v, row) => row.browser || row.device || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => coUtil.cofUiNmCmdNm(row.uiNm, row.cmdNm) },
      { key: 'traceId',  label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',  label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => coUtil.cofYmdHms(v || '') },
    ];

    // 토큰 그리드
    columns.tokenGrid = [
      { key: '_exp', label: '', style: 'width:24px', align: 'center',
        linkToggle: { active: (row) => isExpanded(row.logId), title: '펼치기/닫기', onClick: (row) => handleGridCellAction('histList-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'logId',         label: '토큰로그ID', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'regDate',       label: '일시', cellStyle: 'white-space:nowrap', fmt: (v) => coUtil.cofYmdHms(v || '') },
      { key: '_user',         label: '사용자',
        fmt: (v, row) => `${row.userNm || row.userId || '-'}  #${row.userId}` },
      { key: 'actionCd',      label: '액션', badge: (row) => fnActionBadge(row.actionCd), fmt: (v) => fnActionLabel(v) },
      { key: 'tokenTypeCd',   label: '토큰유형', badge: (row) => fnTypeBadge(row.tokenTypeCd), cellStyle: 'font-size:11px', fmt: (v) => v || '-' },
      { key: 'accessTokenExp',label: 'AT만료', cellStyle: 'color:#8e44ad', fmt: (v) => coUtil.cofYmdHms(v || '') || '-' },
      { key: 'tokenExp',      label: 'RT만료', cellStyle: (v, row) => (row.actionCd === 'EXPIRE' || row.actionCd === 'REVOKE') ? 'color:#e74c3c' : '', fmt: (v) => coUtil.cofYmdHms(v || '') || '-' },
      { key: 'ip',            label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => coUtil.cofUiNmCmdNm(row.uiNm, row.cmdNm) },
      { key: 'traceId',       label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'revokeReason',  label: '폐기사유', cellStyle: 'color:#e74c3c', fmt: (v) => v || '-' },
    ];

    /* logExpandColumns — 로그인 로그 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.logExpand = [
      { key: '_loginDate',  label: '로그인일시', type: 'readonly', fmt: (v, row) => coUtil.cofYmdHms(row.loginDate || row.regDate || '') || '-' },
      { key: '_ip',         label: 'IP',         type: 'readonly', mono: true, fmt: (v, row) => row.ip || '-' },
      { key: '_os',         label: 'OS',         type: 'readonly', fmt: (v, row) => row.os || '-' },
      { key: '_browser',    label: '브라우저',    type: 'readonly', fmt: (v, row) => row.browser || '-' },
      { key: '_failCnt',    label: '연속실패',    type: 'readonly', fmt: (v, row) => row.failCnt > 0 ? (row.failCnt + '회') : '-' },
      { key: '_result',     label: '결과',       type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnResultBadge(row.resultCd)}">${fnResultLabel(row.resultCd)}</span>` },
      { key: '_uiNm',       label: 'x-ui-nm',    type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',      label: 'x-cmd-nm',   type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',     label: 'x-file-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',     label: 'x-func-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',     label: 'x-line-no',  type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',    label: 'x-trace-id', type: 'readonly', mono: true, fmt: (v, row) => row.traceId || '-' },
      { key: '_userId',     label: '사용자ID',   type: 'readonly', fmt: (v, row) => row.userId || '-' },
      { key: '_loginId',    label: '로그인ID',   type: 'readonly', fmt: (v, row) => row.loginId || '-' },
      { key: '_site',       label: '사이트',     type: 'readonly', fmt: (v, row) => row.siteNm || row.siteId || '-' },
      { key: '_atExp',      label: 'AT만료',     type: 'readonly', fmt: (v, row) => row.accessTokenExp || '-' },
      { key: '_accessToken',label: 'AccessToken',type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => row.accessToken || '미발급' },
    ];

    /* tokenExpandColumns — 토큰 이력 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.tokenExpand = [
      { key: '_action',      label: '액션',     type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnActionBadge(row.actionCd)}">${fnActionLabel(row.actionCd)}</span>` },
      { key: '_tokenType',   label: '토큰유형', type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnTypeBadge(row.tokenTypeCd)}">${row.tokenTypeCd || '-'}</span>` },
      { key: '_atExp',       label: 'AT만료',   type: 'readonly', fmt: (v, row) => coUtil.cofYmdHms(row.accessTokenExp || '') || '-' },
      { key: '_rtExp',       label: 'RT만료',   type: 'readonly', fmt: (v, row) => coUtil.cofYmdHms(row.tokenExp || '') || '-' },
      { key: '_ip',          label: 'IP',       type: 'readonly', mono: true, fmt: (v, row) => row.ip || '-' },
      { key: '_userId',      label: '사용자ID', type: 'readonly', fmt: (v, row) => row.userId || '-' },
      { key: '_revokeReason',label: '폐기사유', type: 'readonly', visible: (row) => !!row.revokeReason, fmt: (v, row) => row.revokeReason || '-' },
      { key: '_uiNm',        label: 'x-ui-nm',  type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',       label: 'x-cmd-nm', type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',      label: 'x-file-nm',type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',      label: 'x-func-nm',type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',      label: 'x-line-no',type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',     label: 'x-trace-id',type: 'readonly', mono: true, colSpan: 2, fmt: (v, row) => row.traceId || '-' },
      { key: '_curToken',    label: '현재 토큰', type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => row.accessToken || '-' },
      { key: '_prevToken',   label: '이전 토큰', type: 'readonly', mono: true, colSpan: 4, visible: (row) => !!row.prevToken, fmt: (v, row) => row.prevToken || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      searchParam, codes, logGridPager, tabCounts, histTabs, cfCurrentList, allExpanded,                       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                                                              // dispatch (모든 이벤트 / 액션 라우팅)
      fnResultBadge, fnResultLabel, fnActionBadge, fnActionLabel, fnTypeBadge, fnDecode,                // template 표현식에서 사용
      fnRowExpanded, fnRowClickStyle,                                                                   // 행 표시
    };
  },
  template: /* html */`
<bo-page title="사용자로그인이력"
  desc-summary="관리자 사용자의 로그인 로그·토큰 생애주기(발급·갱신·폐기·만료)를 조회합니다."
  desc-detail="• 로그인 로그: syh_user_login_log — 로그인 시도·결과·IP·디바이스·x-헤더&#10;• 토큰 이력: syh_user_token_log — 토큰 액션 (ISSUE발급/REFRESH갱신/REVOKE폐기/EXPIRE만료)&#10;• 행 클릭 → 상세정보 펼치기 (x-헤더 포함)&#10;• 이상 로그인(외부IP/연속실패/REVOKE)은 보안 담당자에게 즉시 보고하세요.">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-toggleMore')" style="padding:0 8px;" :title="searchParam.srchOpen?'조건닫기':'조건더보기'">
          {{ searchParam.srchOpen?'▲':'▼' }}
        </button>
      </template>
    </bo-search-area>
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 검색 영역 (펼침) ============================================ -->
    <bo-search-area v-if="searchParam.srchOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="columns.moreSearch" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 (펼침) ============================================ -->
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 탭 + 목록 (한 카드) ========================================= -->
  <bo-container title="로그인/토큰 이력" :count-text="logGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <span style="font-size:11px;color:#aaa;">
        행 클릭 시 상세정보 펼침
      </span>
      <button class="btn btn-secondary btn-xs" @click="handleBtnAction('histList-toggleExpandAll')">
        {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
      </button>
      <button class="btn btn-danger btn-xs" @click="handleBtnAction('histList-clearLog')">
        로그비우기
      </button>
    </template>
    <bo-tab-bar :tabs="histTabs" :tab="searchParam.activeTab" :show-modes="false"
      @tab-select="id => handleSelectAction('searchParam-tabChange', id)" />
  <!-- ===== ■. 로그인 로그 탭 ================================================ -->
  <bo-grid v-if="searchParam.activeTab==='log'" bare
    :columns="columns.logGrid" :rows="cfCurrentList" row-key="logId"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded">
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#eef2fb;padding:10px 14px;border-top:none;border-left:3px solid #2563eb;box-shadow:inset 0 1px 0 #d6deef">
        <bo-form-area :columns="columns.logExpand" :form="row" :cols="3" readonly label-left compact :show-actions="false" />
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 로그인 로그 탭 ================================================ -->
  <!-- ===== ■. 토큰 이력 탭 ================================================= -->
  <bo-grid v-if="searchParam.activeTab==='token'" bare
    :columns="columns.tokenGrid" :rows="cfCurrentList" row-key="logId"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded">
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#eef2fb;padding:10px 14px;border-top:none;border-left:3px solid #2563eb;box-shadow:inset 0 1px 0 #d6deef">
        <bo-form-area :columns="columns.tokenExpand" :form="row" :cols="3" readonly label-left compact :show-actions="false" />
        <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">
          ℹ SHA-256 해시. 원문 복원 불가 — syh_user_token_log
        </div>
      </td>
    </template>
  </bo-grid>
  <bo-pager :pager="logGridPager" :on-set-page="n => handleBtnAction('histList-pager-setPage', n)" :on-size-change="() => handleSelectAction('histList-pager-sizeChange')" />
  <!-- ===== □. 토큰 이력 탭 ================================================= -->
  </bo-container>
</bo-page>
`,
};
