/* ShopJoy Admin - 회원로그인이력 */
window.SyMemberLoginHist = {
  name: 'SyMemberLoginHist',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showRefModal: { type: Function, default: () => {} },                    // 참조 모달 열기
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
    setApiRes:    { type: Function, default: () => {} },                    // API 결과 전달
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, onMounted } = Vue;

    /* ===== 검색조건 + UI 상태 (searchParam 이 검색 + 탭 상태 겸함) ===== */
    const searchParam = reactive({
      descOpen: false, isPageCodeLoad: false, srchOpen: false,
      activeTab: 'log',
      dateRange: '1week', dateStart: '', dateEnd: '',
      searchType: '', searchValue: '', searchResultCd: '', searchIp: '',
      searchUiNm: '', searchTraceId: '',
    });

    /* 초기 1주일 범위 설정 */
    (() => { const r = boUtil.bofGetDateRange('1week'); if (r) { searchParam.dateStart = r.from; searchParam.dateEnd = r.to; } })();

    const codes = reactive({ login_results: [], date_range_opts: [] });

    /* ===== 페이지네이션 ===== */
    const baseGrid = coUtil.cofGrid(() => handleSearchList(), { pageSize: 20 });

    /* ===== 목록 데이터 ===== */
    const logs   = reactive([]);                  // 로그인 로그
    const tokens = reactive([]);                  // 토큰 이력
    const tabCounts = reactive({ log:0, token:0 });  // 탭별 카운트

    /* ===== 행 펼치기 상태 ===== */
    const expandedRows    = reactive(new Set());
    const allExpanded     = reactive({ value: false });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyMemberLoginHist.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGrid.pager.pageNo = 1;
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, { searchType:'', searchValue:'', searchResultCd:'', searchIp:'', searchUiNm:'', searchTraceId:'', dateRange:'1week', srchOpen:false });
        onDateRangeChange();
        baseGrid.pager.pageNo = 1;
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 펼침 검색조건 토글
      } else if (cmd === 'searchParam-toggleMore') {
        searchParam.srchOpen = !searchParam.srchOpen;
        return;
      // 페이지 설명 토글
      } else if (cmd === 'searchParam-toggleDesc') {
        searchParam.descOpen = !searchParam.descOpen;
        return;
      // 행 펼침 전체 토글
      } else if (cmd === 'histList-toggleExpandAll') {
        return toggleExpandAll();
      // 로그 비우기
      } else if (cmd === 'histList-clearLog') {
        return handleClearLog();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyMemberLoginHist.js : handleSelectAction -> ', cmd, param);
      // 탭 변경 (log / token)
      if (cmd === 'searchParam-tabChange') {
        searchParam.activeTab = param;
        baseGrid.pager.pageNo = 1;
        allExpanded.value = false;
        return handleSearchList();
      // 페이지 번호 클릭
      } else if (cmd === 'histList-pager-setPage') {
        return baseGrid.setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'histList-pager-sizeChange') {
        return baseGrid.onSizeChange();
      // 행 클릭 → 펼침 토글
      } else if (cmd === 'histList-rowToggle') {
        return toggleRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      searchParam.isPageCodeLoad = true;
      const cs = window.sfGetBoCodeStore();
      codes.login_results   = cs?.sgGetGrpCodes('LOGIN_RESULT')   || [];
      codes.date_range_opts = cs?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
    };
    const isAppReady = coUtil.cofUseAppCodeReady(searchParam, fnLoadCodes);

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };
    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
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
        pageNo: baseGrid.pager.pageNo, pageSize: baseGrid.pager.pageSize,
        dateStart:  searchParam.dateStart   || undefined,
        dateEnd:    searchParam.dateEnd     || undefined,
        resultCd:   searchParam.searchResultCd || undefined,
        ip:         searchParam.searchIp    || undefined,
        uiNm:       searchParam.searchUiNm  || undefined,
        traceId:    searchParam.searchTraceId || undefined,
        searchType: searchParam.searchType || undefined,
        searchValue: searchParam.searchValue   || undefined,
      };
      if (p.searchValue && !p.searchType) {
        p.searchType = 'memberId,loginId';
      }
      return p;
    };

    /* handleSearchLog — 로그인 로그 조회 */
    const handleSearchLog = async () => {
      try {
        const res = await boApiSvc.mbMemberLoginLog.getPage(buildParams(), '회원로그인이력', '로그인로그조회');
        const d = res.data?.data;
        logs.splice(0, logs.length, ...(d?.pageList || []));
        baseGrid.pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.log = baseGrid.pager.pageTotalCount; expandedRows.clear();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSearchToken — 토큰 이력 조회 */
    const handleSearchToken = async () => {
      try {
        const res = await boApiSvc.mbMemberTokenLog.getPage(buildParams(), '회원로그인이력', '토큰이력조회');
        const d = res.data?.data;
        tokens.splice(0, tokens.length, ...(d?.pageList || []));
        baseGrid.pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.token = baseGrid.pager.pageTotalCount; expandedRows.clear();
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
    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfCurrentList = computed(() => searchParam.activeTab==='log' ? logs : tokens);

    /* fnResultBadge — 로그인결과 배지 */
    const fnResultBadge = cd => ({'SUCCESS':'badge-green','LOGOUT':'badge-blue','FAIL_PW':'badge-red','FAIL_LOCKED':'badge-orange','FAIL_NOT_FOUND':'badge-gray','FAIL_DORMANT':'badge-purple'}[cd]||'badge-gray');

    /* fnResultLabel — 로그인결과 라벨 */
    const fnResultLabel = cd => ({'SUCCESS':'성공','LOGOUT':'로그아웃','FAIL_PW':'비밀번호오류','FAIL_LOCKED':'계정잠금','FAIL_NOT_FOUND':'없는계정','FAIL_DORMANT':'휴면계정'}[cd]||cd||'-');

    /* fnActionBadge — 토큰액션 배지 */
    const fnActionBadge = cd => ({'ISSUE':'badge-blue','REFRESH':'badge-green','REVOKE':'badge-red','EXPIRE':'badge-orange','LOGOUT':'badge-gray'}[cd]||'badge-gray');

    /* fnActionLabel — 토큰액션 라벨 */
    const fnActionLabel = cd => ({'ISSUE':'발급','REFRESH':'갱신','REVOKE':'폐기','EXPIRE':'만료','LOGOUT':'로그아웃'}[cd]||cd||'-');

    /* fnTypeBadge — 토큰유형 배지 */
    const fnTypeBadge   = cd => ({'ACCESS':'badge-purple','REFRESH':'badge-blue'}[cd]||'badge-gray');

    /* fnDecode — URI 디코드 */
    const fnDecode = s => { try { return s ? decodeURIComponent(s) : ''; } catch { return s || ''; } };

    /* fnRowExpanded — 행 펼침 여부 */
    const fnRowExpanded = (r, idx) => isExpanded(r.logId || idx);

    /* fnRowClickStyle — 행 클릭 스타일 */
    const fnRowClickStyle = (r, idx) => 'cursor:pointer;' + (isExpanded(r.logId || idx) ? 'background:#fafbff;' : '');

    // 기본 검색
    const baseSearchColumns = [
      { key: 'dateRange', type: 'dateRange', label: '등록기간',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'searchResultCd', type: 'select', label: '로그인결과',
        options: () => codes.login_results, nullLabel: '로그인결과 전체' },
      { key: 'searchIp', type: 'text', label: 'IP 주소', placeholder: 'IP 주소', width: '140px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [{ value: 'memberId', label: '회원ID' }, { value: 'loginId', label: '로그인ID' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '170px' },
    ];

    /* moreSearchColumns — 펼침 영역(srchOpen=true) 두번째 검색바 */
    const moreSearchColumns = [
      { key: 'searchUiNm',    type: 'text', label: 'x-헤더 화면명', placeholder: '화면명 (x-ui-nm)', width: '170px' },
      { key: 'searchTraceId', type: 'text', label: 'Trace ID',  placeholder: 'Trace ID',         width: '200px' },
    ];

    // 로그 그리드
    const logGridColumns = [
      { key: '_exp',     label: '',          style: 'width:20px', align: 'center', cellStyle: 'color:#bbb;font-size:11px;user-select:none', fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'logId',    label: '로그ID',     mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'loginDate',label: '로그인일시', cellStyle: 'white-space:nowrap', fmt: (v, row) => String(row.loginDate || row.regDate || '').slice(0, 19) },
      { key: '_member',  label: '회원',
        fmt: (v, row) => `${row.memberNm || row.memberId || '-'}  #${row.memberId}` },
      { key: 'loginId',  label: '로그인ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: 'resultCd', label: '결과', badge: (row) => fnResultBadge(row.resultCd), fmt: (v) => fnResultLabel(v) },
      { key: 'failCnt',  label: '실패',      style: 'text-align:center;', align: 'center', cellStyle: (v, row) => row.failCnt > 0 ? 'color:#e74c3c;font-weight:700' : '', fmt: (v) => v > 0 ? v + '회' : '-' },
      { key: 'ip',       label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: '_browser', label: 'OS/브라우저', cellStyle: 'font-size:11px;color:#666;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => row.browser + ' / ' + row.os, fmt: (v, row) => row.browser || row.device || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => { const u = row.uiNm?fnDecode(row.uiNm):''; const m = row.cmdNm?fnDecode(row.cmdNm):''; return u && m ? `${u} > ${m}` : (u || m || '-'); } },
      { key: 'traceId',  label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',  label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => String(v || '').slice(0, 19) },
    ];

    // 토큰 그리드
    const tokenGridColumns = [
      { key: '_exp',          label: '',          style: 'width:20px', align: 'center', cellStyle: 'color:#bbb;font-size:11px;user-select:none', fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'logId',         label: '토큰로그ID', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'regDate',       label: '일시', cellStyle: 'white-space:nowrap', fmt: (v) => String(v || '').slice(0, 19) },
      { key: '_member',       label: '회원',
        fmt: (v, row) => `${row.memberNm || row.memberId || '-'}  #${row.memberId}` },
      { key: 'actionCd',      label: '액션', badge: (row) => fnActionBadge(row.actionCd), fmt: (v) => fnActionLabel(v) },
      { key: 'tokenTypeCd',   label: '토큰유형', badge: (row) => fnTypeBadge(row.tokenTypeCd), cellStyle: 'font-size:11px', fmt: (v) => v || '-' },
      { key: 'accessTokenExp',label: 'AT만료', cellStyle: 'color:#8e44ad', fmt: (v) => String(v || '').slice(0, 19) || '-' },
      { key: 'tokenExp',      label: 'RT만료', cellStyle: (v, row) => (row.actionCd === 'EXPIRE' || row.actionCd === 'REVOKE') ? 'color:#e74c3c' : '', fmt: (v) => String(v || '').slice(0, 19) || '-' },
      { key: 'ip',            label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => { const u = row.uiNm?fnDecode(row.uiNm):''; const m = row.cmdNm?fnDecode(row.cmdNm):''; return u && m ? `${u} > ${m}` : (u || m || '-'); } },
      { key: 'traceId',       label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'revokeReason',  label: '폐기사유', cellStyle: 'color:#e74c3c', fmt: (v) => v || '-' },
    ];

    /* logExpandColumns — 로그인 로그 행 펼침 BoFormArea 컬럼 (cols=6, 라벨+값 그대로) */
    const logExpandColumns = [
      { key: '_loginDate',  label: '로그인일시', type: 'readonly', fmt: (v, row) => String(row.loginDate || row.regDate || '').slice(0, 19) || '-' },
      { key: '_ip',         label: 'IP',         type: 'readonly', mono: true, fmt: (v, row) => row.ip || '-' },
      { key: '_os',         label: 'OS',         type: 'readonly', fmt: (v, row) => row.os || '-' },
      { key: '_browser',    label: '브라우저',    type: 'readonly', fmt: (v, row) => row.browser || '-' },
      { key: '_country',    label: '국가',       type: 'readonly', fmt: (v, row) => row.country || '-' },
      { key: '_failCnt',    label: '연속실패',    type: 'readonly', fmt: (v, row) => row.failCnt > 0 ? (row.failCnt + '회') : '-' },
      { key: '_result',     label: '결과',       type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnResultBadge(row.resultCd)}">${fnResultLabel(row.resultCd)}</span>` },
      { key: '_uiNm',       label: 'x-ui-nm',    type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',      label: 'x-cmd-nm',   type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',     label: 'x-file-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',     label: 'x-func-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',     label: 'x-line-no',  type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',    label: 'x-trace-id', type: 'readonly', mono: true, fmt: (v, row) => row.traceId || '-' },
      { key: '_memberId',   label: '회원ID',     type: 'readonly', fmt: (v, row) => row.memberId || '-' },
      { key: '_loginId',    label: '로그인ID',   type: 'readonly', fmt: (v, row) => row.loginId || '-' },
      { key: '_site',       label: '사이트',     type: 'readonly', fmt: (v, row) => row.siteNm || row.siteId || '-' },
      { key: '_accessToken',label: 'AccessToken',type: 'readonly', mono: true, colSpan: 2, fmt: (v, row) => row.accessToken || '미발급' },
      { key: '_atExp',      label: 'AT만료',     type: 'readonly', fmt: (v, row) => row.accessTokenExp || '-' },
    ];

    /* tokenExpandColumns — 토큰 이력 행 펼침 BoFormArea 컬럼 (cols=6) */
    const tokenExpandColumns = [
      { key: '_action',      label: '액션',     type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnActionBadge(row.actionCd)}">${fnActionLabel(row.actionCd)}</span>` },
      { key: '_tokenType',   label: '토큰유형', type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnTypeBadge(row.tokenTypeCd)}">${row.tokenTypeCd || '-'}</span>` },
      { key: '_atExp',       label: 'AT만료',   type: 'readonly', fmt: (v, row) => String(row.accessTokenExp || '').slice(0, 19) || '-' },
      { key: '_rtExp',       label: 'RT만료',   type: 'readonly', fmt: (v, row) => String(row.tokenExp || '').slice(0, 19) || '-' },
      { key: '_ip',          label: 'IP',       type: 'readonly', mono: true, fmt: (v, row) => row.ip || '-' },
      { key: '_memberId',    label: '회원ID',   type: 'readonly', fmt: (v, row) => row.memberId || '-' },
      { key: '_revokeReason',label: '폐기사유', type: 'readonly', visible: (row) => !!row.revokeReason, fmt: (v, row) => row.revokeReason || '-' },
      { key: '_uiNm',        label: 'x-ui-nm',  type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',       label: 'x-cmd-nm', type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',      label: 'x-file-nm',type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',      label: 'x-func-nm',type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',      label: 'x-line-no',type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',     label: 'x-trace-id',type: 'readonly', mono: true, colSpan: 2, fmt: (v, row) => row.traceId || '-' },
      { key: '_curToken',    label: '현재 토큰', type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => row.accessToken || '-' },
      { key: '_prevToken',   label: '이전 토큰', type: 'readonly', mono: true, colSpan: 6, visible: (row) => !!row.prevToken, fmt: (v, row) => row.prevToken || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      baseGrid,
      searchParam, codes,  tabCounts, cfCurrentList, allExpanded,                                // 상태 / 데이터
      baseSearchColumns, moreSearchColumns, logGridColumns, tokenGridColumns,                          // 컬럼 정의
      logExpandColumns, tokenExpandColumns,                                                             // 행 펼침 폼 컬럼 정의
      handleBtnAction, handleSelectAction,                                                              // dispatch (모든 이벤트 / 액션 라우팅)
      fnResultBadge, fnResultLabel, fnActionBadge, fnActionLabel, fnTypeBadge, fnDecode,                // template 표현식에서 사용
      fnRowExpanded, fnRowClickStyle,                                                                   // 행 표시
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    회원로그인이력
  </div>
  <!-- ===== ■. 페이지 설명 ================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      회원의 로그인 로그·토큰 생애주기(발급·갱신·폐기·만료)를 조회합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('searchParam-toggleDesc')">
      {{ searchParam.descOpen?'▲ 접기':'▼ 더보기' }}
    </button>
    <div v-if="searchParam.descOpen" class="page-desc-detail">
      • 로그인 로그: mbh_member_login_log — 로그인 시도·결과·IP·디바이스·x-헤더 • 토큰 이력: mbh_member_token_log — 토큰 액션 (ISSUE발급/REFRESH갱신/REVOKE폐기/EXPIRE만료) • 행 클릭 → 상세정보 펼치기 (x-헤더 포함)
    </div>
  </div>
  <!-- ===== □. 페이지 설명 ================================================== -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :columns="baseSearchColumns" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
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
      :columns="moreSearchColumns" :param="searchParam"
      @search="handleBtnAction('searchParam-list')" />
    <!-- ===== □.□. 검색 영역 (펼침) ============================================ -->
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 탭 ======================================================== -->
  <div class="tab-nav" style="margin-bottom:16px">
    <button class="tab-btn" :class="{active:searchParam.activeTab==='log'}" @click="handleSelectAction('searchParam-tabChange', 'log')">
      로그인 로그
      <span class="tab-count">
        {{ tabCounts.log }}
      </span>
    </button>
    <button class="tab-btn" :class="{active:searchParam.activeTab==='token'}" @click="handleSelectAction('searchParam-tabChange', 'token')">
      토큰 이력
      <span class="tab-count">
        {{ tabCounts.token }}
      </span>
    </button>
  </div>
  <!-- ===== □. 탭 ======================================================== -->
  <!-- ===== ■. 로그인 로그 탭 ================================================ -->
  <bo-grid v-if="searchParam.activeTab==='log'"
    :columns="logGridColumns" :rows="cfCurrentList" :pager="baseGrid.pager" row-key="logId"
    list-title="로그인 로그" :count-text="baseGrid.pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @set-page="n => handleSelectAction('histList-pager-setPage', n)"
    @size-change="handleSelectAction('histList-pager-sizeChange')"
    @row-click="row => handleSelectAction('histList-rowToggle', row.logId)">
    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">
          행 클릭 시 상세정보 펼침
        </span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('histList-toggleExpandAll')">
          {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
        </button>
        <button class="btn btn-danger btn-xs" @click="handleBtnAction('histList-clearLog')">
          로그비우기
        </button>
      </div>
    </template>
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none">
        <bo-form-area :columns="logExpandColumns" :form="row" :cols="4" readonly label-left :show-actions="false" />
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 로그인 로그 탭 ================================================ -->
  <!-- ===== ■. 토큰 이력 탭 ================================================= -->
  <bo-grid v-if="searchParam.activeTab==='token'"
    :columns="tokenGridColumns" :rows="cfCurrentList" :pager="baseGrid.pager" row-key="logId"
    list-title="토큰 이력" :count-text="baseGrid.pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @set-page="n => handleSelectAction('histList-pager-setPage', n)"
    @size-change="handleSelectAction('histList-pager-sizeChange')"
    @row-click="row => handleSelectAction('histList-rowToggle', row.logId)">
    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">
          행 클릭 시 상세정보 펼침
        </span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('histList-toggleExpandAll')">
          {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
        </button>
        <button class="btn btn-danger btn-xs" @click="handleBtnAction('histList-clearLog')">
          로그비우기
        </button>
      </div>
    </template>
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none">
        <bo-form-area :columns="tokenExpandColumns" :form="row" :cols="4" readonly label-left :show-actions="false" />
        <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">
          ℹ SHA-256 해시. 원문 복원 불가
        </div>
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 토큰 이력 탭 ================================================= -->
</div>
`,
};
