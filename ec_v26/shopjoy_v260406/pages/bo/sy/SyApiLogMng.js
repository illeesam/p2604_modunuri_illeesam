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
      loading: false, hasMore: true,   // 무한 스크롤: 중복요청 가드 / 더 받을 게 있는지
      activeTab: 'access',
      srchOpen: false,
      dateRange: '1week',
      dateRangeStart: '',
      dateRangeEnd: '',
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

    const accessGridPager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 100, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100], pageCond: {},
    });

    const accessLogs = reactive([]);
    const errorLogs  = reactive([]);
    const tabCounts  = reactive({ access: 0, error: 0 });

    /* tabs — 탭 정의 (BoTabBar 데이터) */
    const tabs = reactive([
      { id: 'access', label: 'API요청로그', icon: '📋', get count() { return tabCounts.access; } },
      { id: 'error',  label: 'API오류로그', icon: '🚨', get count() { return tabCounts.error; } },
    ]);

    // 컬럼 정의 모음 (정적 — reactive 불필요). template: columns.baseSearch 등으로 접근
    const columns = {};

    // 펼쳐진 행 ID 집합
    const expandedRows  = reactive(new Set());
    const allExpanded   = reactive({ value: false });
    /* 펼침 시 상세 API(getById) 조회 결과 캐시 — 한 번 조회한 행은 재펼침 시 재조회 안 함.
       키: '{탭}:{logId}' (요청/오류 탭이 logId 를 공유할 수 있어 탭 구분) */
    const detailCache   = reactive({});
    const detailLoading = reactive(new Set());   // 조회 중인 캐시키 집합

    // 기본 기간: 최근 1주일
    boUtil.bofApplyDateRange(uiState, '1week');

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
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 라우터. cmd 1개(apiLogs-cellClick)에 colKey(2번째 인자)로 동작 구분 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'apiLogs-cellClick') {
        // 조회형 (렌더 prop) — 매 행 렌더마다 호출되므로 로그 없이 값 반환. colKey 자리에 idx 전달
        if (colKey === 'isExpanded') { return fnRowExpanded(row, e); }
        if (colKey === 'rowStyle')   { return fnRowClickStyle(row, e); }
        // 액션형 (클릭/토글)
        console.log(' ■■ SyApiLogMng.js : handleGridCellAction -> ', cmd, colKey, row);
        if (colKey === 'btn_row_expand') { return toggleRow(row.logId); }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['DATE_RANGE_OPT', 'HTTP_METHOD', 'APP_TYPE'], {compNm: 'SyApiLogMng'});
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.http_methods    = codeStore?.sgGetGrpCodes('HTTP_METHOD')    || [];
      codes.app_types      = codeStore?.sgGetGrpCodes('APP_TYPE')      || [];
    };

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
      accessGridPager.pageNo = 1;
    };

    /* fnCacheKey — 캐시 키 (탭+logId) */
    const fnCacheKey = id => `${uiState.activeTab}:${id}`;

    /* fnFetchDetail — 행 상세 API(getById) 조회 후 캐시 적재. 이미 캐시/조회중이면 skip */
    const fnFetchDetail = async (id) => {
      if (id == null) { return; }
      const key = fnCacheKey(id);
      if (detailCache[key] || detailLoading.has(key)) { return; }   // 재펼침 시 재조회 안 함
      detailLoading.add(key);
      try {
        const svc = uiState.activeTab === 'access' ? boApiSvc.syAccessLog : boApiSvc.syAccessErrorLog;
        const res = await svc.getById(id, 'API로그조회', '상세조회');
        detailCache[key] = res.data?.data || res.data || {};
      } catch (err) {
        if (showToast) { showToast(err.response?.data?.message || err.message || '상세 조회 오류', 'error', 0); }
      } finally {
        detailLoading.delete(key);
      }
    };

    /* toggleRow — 행 펼침 토글 (펼칠 때만 상세 조회) */
    const toggleRow     = id => {
      if (expandedRows.has(id)) { expandedRows.delete(id); }
      else { expandedRows.add(id); fnFetchDetail(id); }
    };

    /* isExpanded — 여부 확인 */
    const isExpanded    = id => expandedRows.has(id);

    /* fnRowDetail — 펼침 상세 폼 데이터 (캐시 우선, 미조회 시 목록 row 폴백) */
    const fnRowDetail = (row) => detailCache[fnCacheKey(row.logId)] || row;

    /* fnRowDetailLoading — 해당 행 상세 조회중 여부 */
    const fnRowDetailLoading = (row) => detailLoading.has(fnCacheKey(row.logId));

    /* toggleExpandAll — 토글 (펼칠 때 각 행 상세 조회) */
    const toggleExpandAll = () => {
      const list = uiState.activeTab === 'access' ? accessLogs : errorLogs;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r, i) => { expandedRows.add(r.logId || i); fnFetchDetail(r.logId); }); allExpanded.value = true; }
    };



    /* ===== 엑셀 다운로드 =====
       탭마다 대상 테이블이 달라 domain/areaNm 을 탭값으로 매핑한다.
       domain 키는 백엔드 ExcelDomainConfig 의 @Bean 등록명과 일치해야 한다. */
    const excelModal = reactive({ show: false });
    const EXCEL_MAP = {
      'access': { domain: 'accessLog', areaNm: 'API 접근 로그' },
      'error': { domain: 'accessErrorLog', areaNm: 'API 오류 로그' }
    };
    const cfExcelDomain = computed(() => (EXCEL_MAP[uiState.activeTab] || EXCEL_MAP['access']).domain);
    const cfExcelAreaNm = computed(() => (EXCEL_MAP[uiState.activeTab] || EXCEL_MAP['access']).areaNm);

    /* cfExcelColumns — 현재 탭의 그리드 헤더. 엑셀 컬럼/순서/라벨을 화면과 일치시키기 위해
       모달에 넘긴다(안 넘기면 서버가 Entity 필드로 만들어 화면과 어긋난다). */
    const cfExcelColumns = computed(() => {
      if (uiState.activeTab === 'access') { return columns.accessGrid || []; }
      if (uiState.activeTab === 'error') { return columns.errorGrid || []; }
      return columns.accessGrid || [];
    });

    /* buildExcelParams — 엑셀은 현재 검색조건 전체를 그대로 넘긴다.
       페이지 번호/크기는 의미가 없어 제거한다(서버가 조건 전체를 청크로 훑는다). */
    const buildExcelParams = () => {
      const p = { ...buildSearchParams() };
      delete p.pageNo; delete p.pageSize;
      return p;
    };

    /* buildSearchParams — 빌드 */
    const buildSearchParams = () => {
      const p = {
        pageNo:      accessGridPager.pageNo,
        pageSize:    accessGridPager.pageSize,
        dateRangeType:    'reg_date',
        dateRangeStart:   uiState.dateRangeStart       || undefined,
        dateRangeEnd:     uiState.dateRangeEnd         || undefined,
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
    const handleSearchAccessLog = async (append = false) => {
      if (uiState.loading) { return; }
      if (append && !uiState.hasMore) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAccessLog.getPage(buildSearchParams(), 'API로그조회', '요청로그조회',
          append ? { isProgress: false } : undefined);
        const data = res.data?.data;
        const list = data?.pageList || [];
        accessGridPager.pageTotalCount = data?.pageTotalCount || 0;
        tabCounts.access = accessGridPager.pageTotalCount;
        if (append) {
          accessLogs.push(...list);
        } else {
          accessLogs.splice(0, accessLogs.length, ...list);
          expandedRows.clear(); Object.keys(detailCache).forEach(k => delete detailCache[k]);
        }
        /* 더 받을 게 있는지 */
        uiState.hasMore = list.length >= accessGridPager.pageSize && accessLogs.length < accessGridPager.pageTotalCount;
        if (uiState.hasMore) { accessGridPager.pageNo += 1; }
      } catch (err) {
        console.error('[handleSearchAccessLog]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchErrorLog — 에러 로그 조회 */
    const handleSearchErrorLog = async (append = false) => {
      if (uiState.loading) { return; }
      if (append && !uiState.hasMore) { return; }
      uiState.loading = true;
      try {
        const res = await boApiSvc.syAccessErrorLog.getPage(buildSearchParams(), 'API로그조회', '오류로그조회',
          append ? { isProgress: false } : undefined);
        const data = res.data?.data;
        const list = data?.pageList || [];
        accessGridPager.pageTotalCount = data?.pageTotalCount || 0;
        tabCounts.error = accessGridPager.pageTotalCount;
        if (append) {
          errorLogs.push(...list);
        } else {
          errorLogs.splice(0, errorLogs.length, ...list);
          expandedRows.clear(); Object.keys(detailCache).forEach(k => delete detailCache[k]);
        }
        /* 더 받을 게 있는지 */
        uiState.hasMore = list.length >= accessGridPager.pageSize && errorLogs.length < accessGridPager.pageTotalCount;
        if (uiState.hasMore) { accessGridPager.pageNo += 1; }
      } catch (err) {
        console.error('[handleSearchErrorLog]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (append = false) => {
      if (!append) { accessGridPager.pageNo = 1; uiState.hasMore = true; }
      if (uiState.activeTab === 'access') { await handleSearchAccessLog(append); }
      else { await handleSearchErrorLog(append); }
    };

    /* onScrollEnd — 스크롤 하단 근접 시 다음 100건 */
    const onScrollEnd = () => { handleSearchList(true); };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList();
    };
    onMounted(initPage);

    /* onTabChange — 탭 변경 */
    const onTabChange   = (tab) => { uiState.activeTab = tab; accessGridPager.pageNo = 1; allExpanded.value = false; handleSearchList(); };

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
        accessGridPager.pageTotalCount = 0; accessGridPager.pageTotalPage = 1;
        expandedRows.clear(); allExpanded.value = false;
      } catch (err) {
        if (showToast) { showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0); }
      }
    };

    /* onSearch — 조회 */
    const onSearch     = () => { accessGridPager.pageNo = 1; handleSearchList(); };

    /* onReset — 초기화 */
    const onReset      = () => {
      Object.assign(uiState, {
        searchType:'', searchValue:'', searchMethod:'', searchStatus:'', searchPath:'',
        searchAppTypeCd:'', searchUiNm:'', searchTraceId:'',
        dateRange:'1week', srchOpen:false,
      });
      boUtil.bofApplyDateRange(uiState, '1week');
      accessGridPager.pageNo = 1;
      handleSearchList();
    };

    /* setPage — 설정 */
    const setPage      = n => { if (n >= 1 && n <= accessGridPager.pageTotalPage) { accessGridPager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { accessGridPager.pageNo = 1; handleSearchList(); };

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
    const fnDecode = coUtil.cofDecodeUri;

    // 기본 검색
    columns.baseSearch = [
      { key: 'dateRange', type: 'dateRange', label: '등록기간',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
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
      { key: '_exp', label: '', style: 'width:24px', align: 'center',
        linkToggle: { active: (row) => isExpanded(row.logId), title: '펼치기/닫기', onClick: (row) => handleGridCellAction('apiLogs-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'reqMethod',  label: '메서드', badge: (row) => fnMethodBadge(row.reqMethod), fmt: (v) => v || '-' },
      { key: 'reqPath',    label: 'API 경로', mono: true, cellStyle: 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'respStatus', label: '상태',      style: 'text-align:center;', align: 'center', badge: (row) => fnStatusBadge(row.respStatus), fmt: (v) => v || '-' },
      { key: 'respTimeMs', label: 'ms',        style: 'text-align:right;', align: 'right', mono: true, cellStyle: (v, row) => row.respTimeMs > 1000 ? 'color:#e74c3c;font-weight:700' : '', fmt: (v) => v != null ? v : '-' },
      { key: 'reqIp',      label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: 'userId',     label: '사용자ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => coUtil.cofUiNmCmdNm(row.uiNm, row.cmdNm) },
      { key: '_fileFuncLine', label: 'file · func · line', mono: true,
        cellStyle: 'font-size:11px;color:#6d5fa8;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        cellTitle: (v, row) => [row.fileNm, row.funcNm, row.lineNo ? 'L'+row.lineNo : ''].filter(Boolean).join(' · '),
        fmt: (v, row) => {
          const parts = [row.fileNm, row.funcNm, row.lineNo ? 'L'+row.lineNo : ''].filter(Boolean);
          return parts.length ? parts.join(' · ') : '-';
        }
      },
      { key: 'traceId',    label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',    label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => coUtil.cofYmdHms(v || '') },
    ];
    // 오류 로그 그리드
    columns.errorGrid = [
      { key: '_exp', label: '', style: 'width:24px', align: 'center',
        linkToggle: { active: (row) => isExpanded(row.logId), title: '펼치기/닫기', onClick: (row) => handleGridCellAction('apiLogs-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.logId) ? '▲' : '▼' },
      { key: 'reqMethod',  label: '메서드', badge: (row) => fnMethodBadge(row.reqMethod), fmt: (v) => v || '-' },
      { key: 'reqPath',    label: 'API 경로', mono: true, cellStyle: 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: '_errorType', label: '오류유형', cellStyle: 'color:#e74c3c;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => row.errorType, fmt: (v, row) => row.errorType || '-' },
      { key: '_errorMsg',  label: '오류메시지', cellStyle: 'color:#555;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', cellTitle: (v, row) => row.errorMsg, fmt: (v, row) => row.errorMsg || '-' },
      { key: 'reqIp',      label: 'IP', mono: true, fmt: (v) => v || '-' },
      { key: 'userId',     label: '사용자ID', cellStyle: 'color:#555', fmt: (v) => v || '-' },
      { key: '_uiNm', label: '화면 > 기능', cellStyle: 'color:#555;font-size:12px;', fmt: (v, row) => coUtil.cofUiNmCmdNm(row.uiNm, row.cmdNm) },
      { key: '_fileFuncLine', label: 'file · func · line', mono: true,
        cellStyle: 'font-size:11px;color:#6d5fa8;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        cellTitle: (v, row) => [row.fileNm, row.funcNm, row.lineNo ? 'L'+row.lineNo : ''].filter(Boolean).join(' · '),
        fmt: (v, row) => {
          const parts = [row.fileNm, row.funcNm, row.lineNo ? 'L'+row.lineNo : ''].filter(Boolean);
          return parts.length ? parts.join(' · ') : '-';
        }
      },
      { key: 'traceId',    label: 'Trace ID', mono: true, cellStyle: 'font-size:11px;color:#888;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', fmt: (v) => v || '-' },
      { key: 'regDate',    label: '등록일시', cellStyle: 'white-space:nowrap', fmt: (v) => coUtil.cofYmdHms(v || '') },
    ];
    /* fnRowExpanded — 행 펼침 여부 */
    const fnRowExpanded = (r, idx) => isExpanded(r.logId || idx);
    /* fnRowClickStyle — 펼친 행 배경 강조 (펼침은 _exp 아이콘 클릭으로만) */
    const fnRowClickStyle = (r, idx) => {
      const exp = isExpanded(r.logId || idx);
      const bg = uiState.activeTab === 'access' ? '#fafbff' : '#fff8f8';
      return exp ? ('background:' + bg + ';') : '';
    };

    /* accessGridRowDetail — API요청로그 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.accessGridRowDetail = [
      { type: 'group', label: '요청정보' },
      { key: '_path',     label: '경로',     type: 'readonly', mono: true, colSpan: 4, fmt: (v, row) => (row.reqPath || '') + (row.reqQuery ? '?' + row.reqQuery : '') },
      { key: '_method',   label: '메서드',   type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnMethodBadge(row.reqMethod)}">${row.reqMethod || '-'}</span>` },
      { key: '_status',   label: '상태코드', type: 'readonly', html: true, fmt: (v, row) => `<span class="badge ${fnStatusBadge(row.respStatus)}">${row.respStatus || '-'}</span>` },
      { key: '_respTime', label: '처리시간', type: 'readonly', fmt: (v, row) => row.respTimeMs != null ? row.respTimeMs + 'ms' : '-' },
      { key: '_ip',       label: 'IP',       type: 'readonly', mono: true, fmt: (v, row) => row.reqIp || '-' },
      { key: '_host',     label: 'Host',     type: 'readonly', mono: true, fmt: (v, row) => row.reqHost || '-' },
      { key: '_ua',       label: 'UA',       type: 'readonly', colSpan: 3, fmt: (v, row) => row.reqUa || '-' },
      { type: 'group', label: '요청헤더 (X-*)' },
      { key: '_uiNm',     label: 'x-ui-nm',  type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',    label: 'x-cmd-nm', type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',   label: 'x-file-nm',type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',   label: 'x-func-nm',type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',   label: 'x-line-no',type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',  label: 'x-trace-id',type: 'readonly', mono: true, colSpan: 3, fmt: (v, row) => row.traceId || '-' },
      { type: 'group', label: '사용자 · 권한 · 서버' },
      { key: '_userId',   label: '사용자ID', type: 'readonly', fmt: (v, row) => row.userId || '-' },
      { key: '_appType',  label: '앱유형',   type: 'readonly', fmt: (v, row) => row.appTypeCd || '-' },
      { key: '_roleId',   label: '역할ID',   type: 'readonly', fmt: (v, row) => row.roleId || '-' },
      { key: '_deptId',   label: '부서ID',   type: 'readonly', fmt: (v, row) => row.deptId || '-' },
      { key: '_vendorId', label: '업체ID',   type: 'readonly', fmt: (v, row) => row.vendorId || '-' },
      { key: '_server',   label: '서버',     type: 'readonly', mono: true, fmt: (v, row) => row.serverNm || '-' },
      { key: '_profile',  label: '프로파일', type: 'readonly', html: true, fmt: (v, row) => row.profile ? `<span class="badge badge-blue" style="font-size:10px;">${row.profile}</span>` : '-' },
      { key: '_thread',   label: '스레드',   type: 'readonly', mono: true, colSpan: 3, fmt: (v, row) => row.threadNm || '-' },
      { key: '_regDate',  label: '등록일시', type: 'readonly', fmt: (v, row) => coUtil.cofYmdHms(row.regDate || '') || '-' },
    ];

    /* errorGridRowDetail — API오류로그 행 펼침 BoFormArea 컬럼 (cols=4, labelLeft) */
    columns.errorGridRowDetail = [
      { type: 'group', label: '요청 · 오류정보' },
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
      { type: 'group', label: '요청헤더 (X-*)' },
      { key: '_uiNm',     label: 'x-ui-nm',    type: 'readonly', fmt: (v, row) => fnDecode(row.uiNm) || '-' },
      { key: '_cmdNm',    label: 'x-cmd-nm',   type: 'readonly', fmt: (v, row) => fnDecode(row.cmdNm) || '-' },
      { key: '_fileNm',   label: 'x-file-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.fileNm || '-' },
      { key: '_funcNm',   label: 'x-func-nm',  type: 'readonly', mono: true, fmt: (v, row) => row.funcNm || '-' },
      { key: '_lineNo',   label: 'x-line-no',  type: 'readonly', mono: true, fmt: (v, row) => row.lineNo || '-' },
      { key: '_traceId',  label: 'x-trace-id', type: 'readonly', mono: true, fmt: (v, row) => row.traceId || '-' },
      { key: '_logger',   label: '로거',       type: 'readonly', colSpan: 2, fmt: (v, row) => row.loggerNm || '-' },
      { key: '_thread',   label: '스레드',     type: 'readonly', mono: true, colSpan: 2, fmt: (v, row) => row.threadNm || '-' },
      { key: '_regDate',  label: '등록일시',   type: 'readonly', fmt: (v, row) => coUtil.cofYmdHms(row.regDate || '') || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      excelModal, cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,   // 엑셀 다운로드
      uiState, accessGridPager, tabCounts, tabs, allExpanded,                     // 상태 / 데이터
      columns,                                                                              // 컬럼 정의 모음 (baseSearch/moreSearch/accessGrid/errorGrid/accessGridRowDetail/errorGridRowDetail)
      handleBtnAction, handleSelectAction, handleGridCellAction,                                                  // dispatch (모든 이벤트 / 액션 라우팅)
      cfCurrentList, // computed
      onScrollEnd,                       // 무한 스크롤 (하단 도달 시 다음 100건)
      cofCountText: coUtil.cofCountText, // 하단 건수 문구
      fnRowDetail, fnRowDetailLoading,                                                                            // 행 펼침 상세 (캐시)
    };
  },
  template: /* html */`
<bo-page title="API로그조회"
  desc-summary="syh_access_log(API요청로그)와 syh_access_error_log(API오류로그)를 조회합니다."
  desc-detail="• API요청로그(syh_access_log): 모든 API 요청/응답 기록 — 메서드, 경로, 상태코드, 처리시간, IP, x-헤더 포함 • API오류로그(syh_access_error_log): HTTP 4xx/5xx 오류 및 예외 상세 — 에러메시지, 스택트레이스 포함 • 행 클릭 → 상세정보 펼치기 (x-헤더, 쿼리, UA, 서버환경 등) • 기본 조회기간: 최근 1주일.">
  <!-- ===== □. 페이지 타이틀 ================================================== -->
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
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
  </bo-container>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 영역 (bo-container 1개: 탭 + 제목 + 두 그리드 + accessGridPager) ============ -->
  <bo-container :title="uiState.activeTab==='access' ? 'API요청로그' : 'API오류로그'"
    :count-text="cofCountText(accessGridPager.pageTotalCount, cfCurrentList.length)">
    <!-- 탭 버튼 (영역 안 상단) -->
    <template #top>
      <bo-tab-bar :tabs="tabs" :tab="uiState.activeTab" :show-modes="false" bg="#f0fdf4"
        @tab-select="id => handleSelectAction('tabs-select', id)" />
    </template>
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <span style="font-size:11px;color:#aaa;">
        행 클릭 시 상세정보 펼침
      </span>
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('apiLogs-toggleExpandAll')">
        {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
      </button>
      <button class="btn btn-danger btn-sm" @click="handleBtnAction('apiLogs-clear')">
        로그비우기
      </button>
    </template>
    <!-- ===== ■.■. API요청로그 탭 =========================================== -->
    <bo-grid v-if="uiState.activeTab==='access'" bare fit-bottom @scroll-end="onScrollEnd"
      :columns="columns.accessGrid" :rows="cfCurrentList" row-key="logId"
      :row-style="(r, idx) => handleGridCellAction('apiLogs-cellClick', 'rowStyle', r, idx)" :is-expanded="(r, idx) => handleGridCellAction('apiLogs-cellClick', 'isExpanded', r, idx)">
      <template #row-expand="{ row, colspan }">
        <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
          <div v-if="fnRowDetailLoading(row)" style="font-size:12px;color:#888;padding:4px 2px;">⏳ 상세 정보를 불러오는 중…</div>
          <bo-form-area plain-readonly :columns="columns.accessGridRowDetail" :form="fnRowDetail(row)" :cols="3" readonly label-left compact :show-actions="false" />
        </td>
      </template>
    </bo-grid>
    <!-- ===== ■.■. API오류로그 탭 =========================================== -->
    <bo-grid v-if="uiState.activeTab==='error'" bare fit-bottom @scroll-end="onScrollEnd"
      :columns="columns.errorGrid" :rows="cfCurrentList" row-key="logId"
      :row-style="(r, idx) => handleGridCellAction('apiLogs-cellClick', 'rowStyle', r, idx)" :is-expanded="(r, idx) => handleGridCellAction('apiLogs-cellClick', 'isExpanded', r, idx)">
      <template #row-expand="{ row, colspan }">
        <td :colspan="colspan" style="background:#fff8f8;padding:16px 20px;border-top:none;">
          <div v-if="fnRowDetailLoading(row)" style="font-size:12px;color:#888;padding:4px 2px;">⏳ 상세 정보를 불러오는 중…</div>
          <bo-form-area plain-readonly :columns="columns.errorGridRowDetail" :form="fnRowDetail(row)" :cols="3" readonly label-left compact :show-actions="false" />
          <div style="margin-top:12px;">
            <div style="font-weight:700;color:#c0392b;margin-bottom:6px;border-bottom:1px solid #fcc;padding-bottom:4px;font-size:12px;">
              📋 스택트레이스
            </div>
            <div v-if="fnRowDetail(row).stackTrace" style="font-family:monospace;font-size:11px;color:#555;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;background:#fdf8ff;padding:10px;border-radius:6px;border:1px solid #e8d8f0;">
              {{ fnRowDetail(row).stackTrace }}
            </div>
            <div v-else style="color:#bbb;font-size:12px;padding:10px 0;">
              스택트레이스 없음
            </div>
          </div>
        </td>
      </template>
    </bo-grid>
    <!-- ===== ■.■. 페이저 (두 탭 공통 1개, 그리드 바깥) ========================== -->
    <bo-pager :pager="{ pageTotalCount: accessGridPager.pageTotalCount }"
      :show-pages="false" :loaded-count="cfCurrentList.length" />
  </bo-container>
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" :domain="cfExcelDomain"
    :area-nm="cfExcelAreaNm" :columns="cfExcelColumns" ui-nm="API로그조회" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
