/* ShopJoy Admin - API로그조회 (API요청로그 + API오류로그) */
window.SyApiLogMng = {
  name: 'SyApiLogMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    // --- Vue API / boApp 전역 함수 참조 ---
    const { reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

    // --- 화면 상태 / 코드 / 페이저 / 행 펼침 ---
    const uiState = reactive({
      activeTab: 'access',
      descOpen: false, srchOpen: false,
      isPageCodeLoad: false,
      dateRange: '1week',
      dateStart: '',
      dateEnd: '',
      searchType: '',
      searchValue: '',
      searchMethod: '',
      searchStatus: '',
      searchPath: '',
      searchAppTypeCd: '',
      searchUiNm: '',
      searchTraceId: '',
    });

    const codes = reactive({ date_range_opts: [], http_methods: [], app_types: [] });

    const pager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100], pageCond: {},
    });

    const accessLogs = reactive([]);
    const errorLogs  = reactive([]);
    const tabCounts  = reactive({ access: 0, error: 0 });

    // 컬럼 정의 모음 (정적 — reactive 불필요). template: columns.baseSearch 등으로 접근
    const columns = {};

    // 펼쳐진 행 ID 집합
    const expandedRows  = reactive(new Set());
    const allExpanded   = reactive({ value: false });

    // 기본 기간: 최근 1주일
    (() => {
      const r = boUtil.bofGetDateRange('1week');
      uiState.dateStart = r.from;
      uiState.dateEnd   = r.to;
    })();

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyApiLogMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return onSearch();
      // 검색조건 초기화
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      // 펼침/접기 토글 (more search)
      } else if (cmd === 'searchParam-toggleMore') {
        uiState.srchOpen = !uiState.srchOpen;
        return;
      // 페이지 설명 토글
      } else if (cmd === 'desc-toggle') {
        uiState.descOpen = !uiState.descOpen;
        return;
      // 활성 탭(요청로그/오류로그) 전체 행 펼침 토글
      } else if (cmd === 'apiLogs-toggleExpandAll') {
        return toggleExpandAll();
      // 활성 탭 로그 전체 삭제
      } else if (cmd === 'apiLogs-clear') {
        return handleClearLog();
      // 페이지 번호 클릭
      } else if (cmd === 'apiLogs-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyApiLogMng.js : handleSelectAction -> ', cmd, param);
      // 탭 전환 (access/error)
      if (cmd === 'tabs-select') {
        return onTabChange(param);
      // 페이지 크기 변경
      } else if (cmd === 'apiLogs-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 상세정보 펼침 토글
      } else if (cmd === 'apiLogs-rowToggle') {
        return toggleRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.http_methods    = codeStore?.sgGetGrpCodes('HTTP_METHOD')    || [];
      codes.app_types      = codeStore?.sgGetGrpCodes('APP_TYPE')      || [];
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      if (uiState.dateRange) {
        const r = boUtil.bofGetDateRange(uiState.dateRange);
        uiState.dateStart = r ? r.from : '';
        uiState.dateEnd   = r ? r.to   : '';
      }
      pager.pageNo = 1;
    };

    /* toggleRow — 토글 */
    const toggleRow     = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded — 여부 확인 */
    const isExpanded    = id => expandedRows.has(id);

    /* toggleExpandAll — 토글 */
    const toggleExpandAll = () => {
      const list = uiState.activeTab === 'access' ? accessLogs : errorLogs;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r, i) => expandedRows.add(r.logId || i)); allExpanded.value = true; }
    };

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* buildSearchParams — 빌드 */
    const buildSearchParams = () => {
      const p = {
        pageNo:      pager.pageNo,
        pageSize:    pager.pageSize,
        dateStart:   uiState.dateStart       || undefined,
        dateEnd:     uiState.dateEnd         || undefined,
        searchType: uiState.searchType      || undefined,
        searchValue: uiState.searchValue        || undefined,
        method:      uiState.searchMethod    || undefined,
        status:      uiState.searchStatus    || undefined,
        path:        uiState.searchPath      || undefined,
        appTypeCd: uiState.searchAppTypeCd || undefined,
        uiNm:        uiState.searchUiNm      || undefined,
        traceId:     uiState.searchTraceId   || undefined,
      };
      // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
      if (p.searchValue && !p.searchType) {
        p.searchType = 'reqIp,userId';
      }
      return p;
    };

    /* handleSearchAccessLog — 접근 이력 조회 */
    const handleSearchAccessLog = async () => {
      try {
        const res = await boApiSvc.syAccessLog.getPage(buildSearchParams(), 'API로그조회', '요청로그조회');
        const data = res.data?.data;
        accessLogs.splice(0, accessLogs.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        tabCounts.access = pager.pageTotalCount;
        fnBuildPagerNums();
        expandedRows.clear();
      } catch (err) {
        console.error('[handleSearchAccessLog]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      }
    };

    /* handleSearchErrorLog — 에러 로그 조회 */
    const handleSearchErrorLog = async () => {
      try {
        const res = await boApiSvc.syAccessErrorLog.getPage(buildSearchParams(), 'API로그조회', '오류로그조회');
        const data = res.data?.data;
        errorLogs.splice(0, errorLogs.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        tabCounts.error = pager.pageTotalCount;
        fnBuildPagerNums();
        expandedRows.clear();
      } catch (err) {
        console.error('[handleSearchErrorLog]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      if (uiState.activeTab === 'access') { await handleSearchAccessLog(); }
      else { await handleSearchErrorLog(); }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    /* onTabChange — 탭 변경 */
    const onTabChange   = (tab) => { uiState.activeTab = tab; pager.pageNo = 1; allExpanded.value = false; handleSearchList(); };

    /* handleClearLog — 로그 비우기 */
    const handleClearLog = async () => {
      const tabNm = uiState.activeTab === 'access' ? 'API요청로그' : 'API오류로그';
      const ok = await window.boApp.showConfirm('로그 비우기', `[${tabNm}] 테이블의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`);
      if (!ok) { return; }
      try {
        if (uiState.activeTab === 'access') { await window.boApi.delete('/bo/sy/access-log/all', coUtil.cofApiHdr('API로그조회', '로그비우기')); }
        else { await window.boApi.delete('/bo/sy/access-error-log/all', coUtil.cofApiHdr('API로그조회', '로그비우기')); }
        if (showToast) { showToast(`${tabNm} 전체 삭제 완료`, 'success'); }
        if (uiState.activeTab === 'access') { accessLogs.splice(0); tabCounts.access = 0; }
        else                                { errorLogs.splice(0);  tabCounts.error  = 0; }
        pager.pageTotalCount = 0; pager.pageTotalPage = 1;
        expandedRows.clear(); allExpanded.value = false;
      } catch (err) {
        if (showToast) { showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0); }
      }
    };

    /* onSearch — 조회 */
    const onSearch     = () => { pager.pageNo = 1; handleSearchList(); };

    /* onReset — 초기화 */
    const onReset      = () => {
      Object.assign(uiState, {
        searchType:'', searchValue:'', searchMethod:'', searchStatus:'', searchPath:'',
        searchAppTypeCd:'', searchUiNm:'', searchTraceId:'',
        dateRange:'1week', srchOpen:false,
      });
      const r = boUtil.bofGetDateRange('1week');
      uiState.dateStart = r.from; uiState.dateEnd = r.to;
      pager.pageNo = 1;
      handleSearchList();
    };

    /* setPage — 설정 */
    const setPage      = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* fnMethodBadge — sy_code HTTP_METHOD code_opt1 우선, 없으면 FB */
    const _HTTP_METHOD_FB = { GET: 'badge-blue', POST: 'badge-green', PUT: 'badge-orange', PATCH: 'badge-purple', DELETE: 'badge-red' };
    /* fnMethodBadge — 유틸 */
    const fnMethodBadge = m => coUtil.cofCodeBadge('HTTP_METHOD', m, _HTTP_METHOD_FB[m] || 'badge-gray');

    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => {
      if (!s) { return 'badge-gray'; }
      const n = Number(s);
      if (n >= 500) { return 'badge-red'; }
      if (n >= 400) { return 'badge-orange'; }
      if (n >= 300) { return 'badge-blue'; }
      if (n >= 200) { return 'badge-green'; }
      return 'badge-gray';
    };

    const cfCurrentList = computed(() => uiState.activeTab === 'access' ? accessLogs : errorLogs);

    /* fnDecode — 유틸 */
    const fnDecode = s => { try { return s ? decodeURIComponent(s) : ''; } catch { return s || ''; } };

    // 기본 검색
    columns.baseSearch = [
      { key: 'dateRange', type: 'dateRange', label: '등록기간',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'searchMethod', type: 'select', label: '메서드',
        options: () => codes.http_methods, nullLabel: '메서드 전체' },
      { key: 'searchPath', type: 'text', label: 'API 경로',
        placeholder: 'API 경로 (예: /bo/sy/)', width: '190px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [{ value: 'reqIp', label: 'IP' }, { value: 'userId', label: '사용자ID' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text', label: '검색어',
        placeholder: '검색어 입력', width: '150px' },
    ];

    /* 펼침 영역(srchOpen=true) 두번째 BoSearchArea 용 columns */
    columns.moreSearch = [
      { key: 'searchStatus',    type: 'text',   label: '상태코드', placeholder: '상태코드 (예: 500)', width: '150px' },
      { key: 'searchAppTypeCd', type: 'select', label: '앱유형', options: () => codes.app_types, nullLabel: '앱유형 전체' },
      { key: 'searchUiNm',      type: 'text',   label: 'x-헤더 화면명', placeholder: '화면명 (x-ui-nm)', width: '170px' },
      { key: 'searchTraceId',   type: 'text',   label: 'Trace ID',  placeholder: 'Trace ID',         width: '200px' },
    ];

    // 접근 로그 그리드
    columns.accessGrid = [
      { key: '_exp',       label: '',          style: 'width:20px', align: 'center', cellStyle: 'color:#bbb;font-size:11px;user-select:none', fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'reqMethod',  label: '메서드', badge: (row) => fnMethodBadge(row.reqMethod), fmt: (v) => v || '-' },
      { key: 'reqPath',    label: 'API 경로', mono: true, cellStyle: 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'respStatus', label: '상태',      style: 'text-align:center;', align: 'center', badge: (row) => fnStatusBadge(row.respStatus), fmt: (v) => v || '-' },
      { key: 'respTimeMs', label: 'ms',        style: 'text-align:right;', align: 'right', mono: true, cellStyle: (v, row) => row.respTimeMs > 1000 ? 'color:#e74c3c;font-weight:700' : '', fmt: (v) => v != null ? v : '-' },
      { key: 'reqIp',      label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: 'userId',     label: '사용자ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => { const u = row.uiNm?fnDecode(row.uiNm):''; const m = row.cmdNm?fnDecode(row.cmdNm):''; return u && m ? `${u} > ${m}` : (u || m || '-'); } },
      { key: 'traceId',    label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',    label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => String(v || '').slice(0, 19) },
    ];
    // 오류 로그 그리드
    columns.errorGrid = [
      { key: '_exp',       label: '',          style: 'width:20px', align: 'center', cellStyle: 'color:#bbb;font-size:11px;user-select:none', fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'reqMethod',  label: '메서드', badge: (row) => fnMethodBadge(row.reqMethod), fmt: (v) => v || '-' },
      { key: 'reqPath',    label: 'API 경로', mono: true, cellStyle: 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: '_errorType', label: '오류유형', cellStyle: 'color:#e74c3c;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => row.errorType, fmt: (v, row) => row.errorType || '-' },
      { key: '_errorMsg',  label: '오류메시지', cellStyle: 'color:#555;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => row.errorMsg, fmt: (v, row) => row.errorMsg || '-' },
      { key: 'reqIp',      label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: 'userId',     label: '사용자ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => { const u = row.uiNm?fnDecode(row.uiNm):''; const m = row.cmdNm?fnDecode(row.cmdNm):''; return u && m ? `${u} > ${m}` : (u || m || '-'); } },
      { key: 'traceId',    label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',    label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => String(v || '').slice(0, 19) },
    ];
    /* fnRowExpanded — 행 펼침 여부 */
    const fnRowExpanded = (r, idx) => isExpanded(r.logId || idx);
    /* fnRowClickStyle — 행 클릭 스타일 */
    const fnRowClickStyle = (r, idx) => {
      const exp = isExpanded(r.logId || idx);
      const bg = uiState.activeTab === 'access' ? '#fafbff' : '#fff8f8';
      return 'cursor:pointer;' + (exp ? ('background:' + bg + ';') : '');
    };

    /* accessExpand — API요청로그 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.accessExpand = [
      { key: '_path',     label: '경로',     type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => (row.reqPath || '') + (row.reqQuery ? '?' + row.reqQuery : '') },
      { key: '_method',   label: '메서드',   type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnMethodBadge(row.reqMethod)}">${row.reqMethod || '-'}</span>` },
      { key: '_status',   label: '상태코드', type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnStatusBadge(row.respStatus)}">${row.respStatus || '-'}</span>` },
      { key: '_respTime', label: '처리시간', type: 'readonly', fmt: (v, row) => row.respTimeMs != null ? row.respTimeMs + 'ms' : '-' },
      { key: '_ip',       label: 'IP',       type: 'readonly', mono: true, fmt: (v, row) => row.reqIp || '-' },
      { key: '_host',     label: 'Host',     type: 'readonly', mono: true, fmt: (v, row) => row.reqHost || '-' },
      { key: '_ua',       label: 'UA',       type: 'readonly', colSpan: 3, fmt: (v, row) => row.reqUa || '-' },
      { key: '_uiNm',     label: 'x-ui-nm',  type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',    label: 'x-cmd-nm', type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',   label: 'x-file-nm',type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',   label: 'x-func-nm',type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',   label: 'x-line-no',type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',  label: 'x-trace-id',type: 'readonly', mono: true, colSpan: 3, fmt: (v, row) => row.traceId || '-' },
      { key: '_userId',   label: '사용자ID', type: 'readonly', fmt: (v, row) => row.userId || '-' },
      { key: '_appType',  label: '앱유형',   type: 'readonly', fmt: (v, row) => row.appTypeCd || '-' },
      { key: '_roleId',   label: '역할ID',   type: 'readonly', fmt: (v, row) => row.roleId || '-' },
      { key: '_deptId',   label: '부서ID',   type: 'readonly', fmt: (v, row) => row.deptId || '-' },
      { key: '_vendorId', label: '업체ID',   type: 'readonly', fmt: (v, row) => row.vendorId || '-' },
      { key: '_server',   label: '서버',     type: 'readonly', mono: true, fmt: (v, row) => row.serverNm || '-' },
      { key: '_profile',  label: '프로파일', type: 'readonly', html: true, fmt: (v, row) => row.profile ? `<span class="badge badge-blue" style="font-size:10px;">${row.profile}</span>` : '-' },
      { key: '_thread',   label: '스레드',   type: 'readonly', mono: true, colSpan: 3, fmt: (v, row) => row.threadNm || '-' },
      { key: '_regDate',  label: '등록일시', type: 'readonly', fmt: (v, row) => String(row.regDate || '').slice(0, 19) || '-' },
    ];

    /* errorExpand — API오류로그 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.errorExpand = [
      { key: '_path',     label: '경로',       type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => (row.reqPath || '') + (row.reqQuery ? '?' + row.reqQuery : '') },
      { key: '_method',   label: '메서드',     type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnMethodBadge(row.reqMethod)}">${row.reqMethod || '-'}</span>` },
      { key: '_respTime', label: '처리시간',   type: 'readonly', fmt: (v, row) => row.respTimeMs != null ? row.respTimeMs + 'ms' : '-' },
      { key: '_ip',       label: 'IP',         type: 'readonly', mono: true, fmt: (v, row) => row.reqIp || '-' },
      { key: '_userId',   label: '사용자ID',   type: 'readonly', fmt: (v, row) => row.userId || '-' },
      { key: '_appType',  label: '앱유형',     type: 'readonly', fmt: (v, row) => row.appTypeCd || '-' },
      { key: '_errorType',label: '오류유형',   type: 'readonly', colSpan: 3, fmt: (v, row) => row.errorType || '-' },
      { key: '_errorMsg', label: '오류메시지', type: 'readonly', colSpan: 4, fmt: (v, row) => row.errorMsg || '-' },
      { key: '_server',   label: '서버',       type: 'readonly', mono: true, fmt: (v, row) => row.serverNm || '-' },
      { key: '_profile',  label: '프로파일',   type: 'readonly', html: true, fmt: (v, row) => row.profile ? `<span class="badge badge-blue" style="font-size:10px;">${row.profile}</span>` : '-' },
      { key: '_uiNm',     label: 'x-ui-nm',    type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',    label: 'x-cmd-nm',   type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',   label: 'x-file-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',   label: 'x-func-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',   label: 'x-line-no',  type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',  label: 'x-trace-id', type: 'readonly', mono: true, fmt: (v, row) => row.traceId || '-' },
      { key: '_logger',   label: '로거',       type: 'readonly', colSpan: 2, fmt: (v, row) => row.loggerNm || '-' },
      { key: '_thread',   label: '스레드',     type: 'readonly', mono: true, colSpan: 2, fmt: (v, row) => row.threadNm || '-' },
      { key: '_regDate',  label: '등록일시',   type: 'readonly', fmt: (v, row) => String(row.regDate || '').slice(0, 19) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, codes, pager, tabCounts, expandedRows, allExpanded,                          // 상태 / 데이터
      columns,                                                                              // 컬럼 정의 모음 (baseSearch/moreSearch/accessGrid/errorGrid/accessExpand/errorExpand)
      handleBtnAction, handleSelectAction,                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfCurrentList,                                                                        // computed
      fnMethodBadge, fnStatusBadge, fnDecode, fnRowExpanded, fnRowClickStyle, showRefModal, // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    API로그조회
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="page-desc-bar">
    <span class="page-desc-summary">
      syh_access_log(API요청로그)와 syh_access_error_log(API오류로그)를 조회합니다.
    </span>
    <button class="page-desc-toggle" @click="handleBtnAction('desc-toggle')">
      {{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}
    </button>
    <div v-if="uiState.descOpen" class="page-desc-detail">
      • API요청로그(syh_access_log): 모든 API 요청/응답 기록 — 메서드, 경로, 상태코드, 처리시간, IP, x-헤더 포함 • API오류로그(syh_access_error_log): HTTP 4xx/5xx 오류 및 예외 상세 — 에러메시지, 스택트레이스 포함 • 행 클릭 → 상세정보 펼치기 (x-헤더, 쿼리, UA, 서버환경 등) • 기본 조회기간: 최근 1주일.
    </div>
  </div>
  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :columns="columns.baseSearch" :param="uiState" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="handleBtnAction('searchParam-toggleMore')" style="padding:0 8px;" :title="uiState.srchOpen?'조건닫기':'조건더보기'">
          {{ uiState.srchOpen?'▲':'▼' }}
        </button>
      </template>
    </bo-search-area>
    <!-- ===== □.□. 검색 영역 ================================================= -->
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area v-if="uiState.srchOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="columns.moreSearch" :param="uiState"
      @search="handleBtnAction('searchParam-list')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 탭 + 목록 ================================================== -->
  <div class="tab-nav" style="margin-bottom:16px">
    <button class="tab-btn" :class="{active:uiState.activeTab==='access'}" @click="handleSelectAction('tabs-select', 'access')">
      📋 API요청로그
      <span class="tab-count">
        {{ tabCounts.access }}
      </span>
    </button>
    <button class="tab-btn" :class="{active:uiState.activeTab==='error'}"  @click="handleSelectAction('tabs-select', 'error')">
      🚨 API오류로그
      <span class="tab-count">
        {{ tabCounts.error }}
      </span>
    </button>
  </div>
  <!-- ===== □. 탭 + 목록 ================================================== -->
  <!-- ===== ■. API요청로그 탭 =============================================== -->
  <bo-grid v-if="uiState.activeTab==='access'"
    :columns="columns.accessGrid" :rows="cfCurrentList" row-key="logId"
    list-title="API요청로그" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @row-click="row => handleSelectAction('apiLogs-rowToggle', row.logId)">
    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">
          행 클릭 시 상세정보 펼침
        </span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('apiLogs-toggleExpandAll')">
          {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
        </button>
        <button class="btn btn-danger btn-xs" @click="handleBtnAction('apiLogs-clear')">
          로그비우기
        </button>
      </div>
    </template>
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
        <bo-form-area :columns="columns.accessExpand" :form="row" :cols="3" readonly label-left :show-actions="false" />
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. API요청로그 탭 =============================================== -->
  <!-- ===== ■. API오류로그 탭 =============================================== -->
  <bo-grid v-if="uiState.activeTab==='error'"
    :columns="columns.errorGrid" :rows="cfCurrentList" row-key="logId"
    list-title="API오류로그" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @row-click="row => handleSelectAction('apiLogs-rowToggle', row.logId)">
    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">
          행 클릭 시 상세정보 펼침
        </span>
        <button class="btn btn-secondary btn-xs" @click="handleBtnAction('apiLogs-toggleExpandAll')">
          {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
        </button>
        <button class="btn btn-danger btn-xs" @click="handleBtnAction('apiLogs-clear')">
          로그비우기
        </button>
      </div>
    </template>
    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#fff8f8;padding:16px 20px;border-top:none;">
        <bo-form-area :columns="columns.errorExpand" :form="row" :cols="3" readonly label-left :show-actions="false" />
        <div style="margin-top:12px;">
          <div style="font-weight:700;color:#c0392b;margin-bottom:6px;border-bottom:1px solid #fcc;padding-bottom:4px;font-size:12px;">
            📋 스택트레이스
          </div>
          <div v-if="row.stackTrace" style="font-family:monospace;font-size:11px;color:#555;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;background:#fdf8ff;padding:10px;border-radius:6px;border:1px solid #e8d8f0;">
            {{ row.stackTrace }}
          </div>
          <div v-else style="color:#bbb;font-size:12px;padding:10px 0;">
            스택트레이스 없음
          </div>
        </div>
      </td>
    </template>
  </bo-grid>
  <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('apiLogs-pager-setPage', n)" :on-size-change="() => handleSelectAction('apiLogs-pager-sizeChange')" />
</div>
<!-- ===== □. API오류로그 탭 =============================================== -->
`,
};
