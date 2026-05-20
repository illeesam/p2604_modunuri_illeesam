/* ShopJoy Admin - API로그조회 (API요청로그 + API오류로그) */
window.SyApiLogMng = {
  name: 'SyApiLogMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showRefModal = window.boApp.showRefModal;  // 참조 모달

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

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.http_methods    = codeStore?.sgGetGrpCodes('HTTP_METHOD')    || [];
      codes.app_types      = codeStore?.sgGetGrpCodes('APP_TYPE')      || [];
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // 기본 기간: 최근 1주일
    (() => {
      const r = boUtil.bofGetDateRange('1week');
      uiState.dateStart = r.from;
      uiState.dateEnd   = r.to;
    })();

    /* onDateRangeChange */
    const onDateRangeChange = () => {
      if (uiState.dateRange) {
        const r = boUtil.bofGetDateRange(uiState.dateRange);
        uiState.dateStart = r ? r.from : '';
        uiState.dateEnd   = r ? r.to   : '';
      }
      pager.pageNo = 1;
    };

    const pager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100], pageCond: {},
    });

    const accessLogs = reactive([]);
    const errorLogs  = reactive([]);
    const tabCounts  = reactive({ access: 0, error: 0 });

    // 펼쳐진 행 ID 집합
    const expandedRows  = reactive(new Set());
    const allExpanded   = reactive({ value: false });

    /* toggleRow */
    const toggleRow     = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded */
    const isExpanded    = id => expandedRows.has(id);

    /* toggleExpandAll */
    const toggleExpandAll = () => {
      const list = uiState.activeTab === 'access' ? accessLogs : errorLogs;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r, i) => expandedRows.add(r.logId || i)); allExpanded.value = true; }
    };

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* buildSearchParams */
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

    /* handleSearchAccessLog */
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
        if (showToast) showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSearchErrorLog */
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
        if (showToast) showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      if (uiState.activeTab === 'access') await handleSearchAccessLog();
      else                                await handleSearchErrorLog();
    };

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* onTabChange */
    const onTabChange   = (tab) => { uiState.activeTab = tab; pager.pageNo = 1; allExpanded.value = false; handleSearchList(); };

    /* handleClearLog */
    const handleClearLog = async () => {
      const tabNm = uiState.activeTab === 'access' ? 'API요청로그' : 'API오류로그';
      const ok = await window.boApp.showConfirm('로그 비우기', `[${tabNm}] 테이블의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`);
      if (!ok) return;
      try {
        if (uiState.activeTab === 'access') await window.boApi.delete('/bo/sy/access-log/all', coUtil.cofApiHdr('API로그조회', '로그비우기'));
        else                                await window.boApi.delete('/bo/sy/access-error-log/all', coUtil.cofApiHdr('API로그조회', '로그비우기'));
        if (showToast) showToast(`${tabNm} 전체 삭제 완료`, 'success');
        if (uiState.activeTab === 'access') { accessLogs.splice(0); tabCounts.access = 0; }
        else                                { errorLogs.splice(0);  tabCounts.error  = 0; }
        pager.pageTotalCount = 0; pager.pageTotalPage = 1;
        expandedRows.clear(); allExpanded.value = false;
      } catch (err) {
        if (showToast) showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    /* 목록조회 */
    const onSearch     = () => { pager.pageNo = 1; handleSearchList(); };

    /* onReset */
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

    /* setPage */
    const setPage      = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    /* fnMethodBadge — sy_code HTTP_METHOD code_opt1 우선, 없으면 FB */
    const _HTTP_METHOD_FB = { GET: 'badge-blue', POST: 'badge-green', PUT: 'badge-orange', PATCH: 'badge-purple', DELETE: 'badge-red' };
    const fnMethodBadge = m => coUtil.cofCodeBadge('HTTP_METHOD', m, _HTTP_METHOD_FB[m] || 'badge-gray');

    /* fnStatusBadge */
    const fnStatusBadge = s => {
      if (!s) return 'badge-gray';
      const n = Number(s);
      if (n >= 500) return 'badge-red';
      if (n >= 400) return 'badge-orange';
      if (n >= 300) return 'badge-blue';
      if (n >= 200) return 'badge-green';
      return 'badge-gray';
    };

    const cfCurrentList = computed(() => uiState.activeTab === 'access' ? accessLogs : errorLogs);

    /* fnDecode */
    const fnDecode = s => { try { return s ? decodeURIComponent(s) : ''; } catch { return s || ''; } };

    /* BoGridReadonly 컬럼 정의 (행펼침 #row-expand) */
    const baseSearchColumns = [
      { type: 'label', label: '등록기간' },
      { key: 'dateRange', type: 'dateRange',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => onDateRangeChange() },
      { key: 'searchMethod', type: 'select',
        options: () => codes.http_methods, nullLabel: '메서드 전체' },
      { key: 'searchPath', type: 'text',
        placeholder: 'API 경로 (예: /bo/sy/)', width: '190px' },
      { key: 'searchType', type: 'multiCheck',
        options: [{ value: 'reqIp', label: 'IP' }, { value: 'userId', label: '사용자ID' }],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text',
        placeholder: '검색어 입력', width: '150px' },
    ];

    /* 펼침 영역(srchOpen=true) 두번째 BoSearchArea 용 columns */
    const moreSearchColumns = [
      { key: 'searchStatus',    type: 'text',   placeholder: '상태코드 (예: 500)', width: '150px' },
      { key: 'searchAppTypeCd', type: 'select', options: () => codes.app_types, nullLabel: '앱유형 전체' },
      { type: 'label', label: 'x-헤더' },
      { key: 'searchUiNm',      type: 'text',   placeholder: '화면명 (x-ui-nm)', width: '170px' },
      { key: 'searchTraceId',   type: 'text',   placeholder: 'Trace ID',         width: '200px' },
    ];

    const accessGridColumns = [
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
    const errorGridColumns = [
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
    /* BoGridReadonly isExpanded prop 래퍼 (row,idx)=>bool */
    const fnRowExpanded = (r, idx) => isExpanded(r.logId || idx);
    const fnRowClickStyle = (r, idx) => {
      const exp = isExpanded(r.logId || idx);
      const bg = uiState.activeTab === 'access' ? '#fafbff' : '#fff8f8';
      return 'cursor:pointer;' + (exp ? ('background:' + bg + ';') : '');
    };

    // -- return ---------------------------------------------------------------

    return {
      uiState, codes, pager, tabCounts, cfCurrentList,
      onTabChange, onDateRangeChange, onSearch, onReset, setPage, onSizeChange,
      fnMethodBadge, fnStatusBadge, fnDecode,
      expandedRows, toggleRow, isExpanded, toggleExpandAll, allExpanded, handleClearLog,
      showRefModal,
      baseSearchColumns, moreSearchColumns, accessGridColumns, errorGridColumns, fnRowExpanded, fnRowClickStyle,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">API로그조회</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">syh_access_log(API요청로그)와 syh_access_error_log(API오류로그)를 조회합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• API요청로그(syh_access_log): 모든 API 요청/응답 기록 — 메서드, 경로, 상태코드, 처리시간, IP, x-헤더 포함
• API오류로그(syh_access_error_log): HTTP 4xx/5xx 오류 및 예외 상세 — 에러메시지, 스택트레이스 포함
• 행 클릭 → 상세정보 펼치기 (x-헤더, 쿼리, UA, 서버환경 등)
• 기본 조회기간: 최근 1주일.</div>
  </div>

  <!-- -- 검색 ------------------------------------------------------------- -->
  <div class="card">
    <bo-search-area :columns="baseSearchColumns" :param="uiState" @search="onSearch" @reset="onReset">
      <template #actions-after>
        <button class="btn btn-secondary btn-sm" @click="uiState.srchOpen=!uiState.srchOpen" style="padding:0 8px;" :title="uiState.srchOpen?'조건닫기':'조건더보기'">{{ uiState.srchOpen?'▲':'▼' }}</button>
      </template>
    </bo-search-area>
    <bo-search-area v-if="uiState.srchOpen" :show-actions="false"
      bar-style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;"
      :columns="moreSearchColumns" :param="uiState"
      @search="onSearch" />
  </div>

  <!-- -- 탭 + 목록 --------------------------------------------------------- -->
  <div class="tab-nav" style="margin-bottom:16px">
    <button class="tab-btn" :class="{active:uiState.activeTab==='access'}" @click="onTabChange('access')">📋 API요청로그 <span class="tab-count">{{ tabCounts.access }}</span></button>
    <button class="tab-btn" :class="{active:uiState.activeTab==='error'}"  @click="onTabChange('error')">🚨 API오류로그 <span class="tab-count">{{ tabCounts.error }}</span></button>
  </div>

  <!-- -- API요청로그 탭 -------------------------------------------------- -->
  <bo-grid-readonly v-if="uiState.activeTab==='access'"
    :columns="accessGridColumns" :rows="cfCurrentList" :pager="pager" row-key="logId"
    list-title="API요청로그" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @set-page="setPage" @size-change="onSizeChange" @row-click="row => toggleRow(row.logId)">

    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">행 클릭 시 상세정보 펼침</span>
        <button class="btn btn-secondary btn-xs" @click="toggleExpandAll">{{ allExpanded.value ? '전체닫기' : '전체펼치기' }}</button>
        <button class="btn btn-danger btn-xs" @click="handleClearLog">로그비우기</button>
      </div>
    </template>

    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px;">📡 요청 정보</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">경로</td><td style="font-family:monospace;word-break:break-all;">{{ row.reqPath }}{{ row.reqQuery ? '?'+row.reqQuery : '' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">메서드</td><td><span class="badge" :class="fnMethodBadge(row.reqMethod)">{{ row.reqMethod }}</span></td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">상태코드</td><td><span class="badge" :class="fnStatusBadge(row.respStatus)">{{ row.respStatus }}</span></td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">처리시간</td><td :style="row.respTimeMs>1000?'color:#e74c3c;font-weight:700':''">{{ row.respTimeMs != null ? row.respTimeMs+'ms' : '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">IP</td><td style="font-family:monospace;">{{ row.reqIp || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">Host</td><td style="font-family:monospace;">{{ row.reqHost || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">UA</td><td style="font-size:11px;color:#666;word-break:break-all;">{{ row.reqUa || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">등록일시</td><td>{{ String(row.regDate||'').slice(0,19) }}</td></tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px;">🏷 X-헤더 (호출 추적)</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-ui-nm</td><td style="color:#e8587a;font-weight:600;">{{ fnDecode(row.uiNm) || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-cmd-nm</td><td>{{ fnDecode(row.cmdNm) || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-file-nm</td><td style="font-family:monospace;font-size:11px;">{{ row.fileNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-func-nm</td><td style="font-family:monospace;font-size:11px;">{{ row.funcNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-line-no</td><td style="font-family:monospace;">{{ row.lineNo || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ row.traceId || '-' }}</td></tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px;">🔐 인증 · 서버</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자ID</td><td>{{ row.userId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">앱유형</td><td>{{ row.appTypeCd || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">역할ID</td><td>{{ row.roleId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">부서ID</td><td>{{ row.deptId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">업체ID</td><td>{{ row.vendorId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">서버</td><td style="font-family:monospace;font-size:11px;">{{ row.serverNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">프로파일</td><td><span v-if="row.profile" class="badge badge-blue" style="font-size:10px;">{{ row.profile }}</span><span v-else>-</span></td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">스레드</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ row.threadNm || '-' }}</td></tr>
            </table>
          </div>
        </div>
      </td>
    </template>
  </bo-grid-readonly>

  <!-- -- API오류로그 탭 -------------------------------------------------- -->
  <bo-grid-readonly v-if="uiState.activeTab==='error'"
    :columns="errorGridColumns" :rows="cfCurrentList" :pager="pager" row-key="logId"
    list-title="API오류로그" :count-text="pager.pageTotalCount + '건'"
    :row-style="fnRowClickStyle" :is-expanded="fnRowExpanded" row-clickable
    @set-page="setPage" @size-change="onSizeChange" @row-click="row => toggleRow(row.logId)">

    <template #toolbar-actions>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">행 클릭 시 상세정보 펼침</span>
        <button class="btn btn-secondary btn-xs" @click="toggleExpandAll">{{ allExpanded.value ? '전체닫기' : '전체펼치기' }}</button>
        <button class="btn btn-danger btn-xs" @click="handleClearLog">로그비우기</button>
      </div>
    </template>

    <template #row-expand="{ row, colspan }">
      <td :colspan="colspan" style="background:#fff8f8;padding:16px 20px;border-top:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
          <div>
            <div style="font-weight:700;color:#e74c3c;margin-bottom:8px;border-bottom:1px solid #fcc;padding-bottom:4px;">🚨 오류 정보</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">경로</td><td style="font-family:monospace;word-break:break-all;">{{ row.reqPath }}{{ row.reqQuery ? '?'+row.reqQuery : '' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">메서드</td><td><span class="badge" :class="fnMethodBadge(row.reqMethod)">{{ row.reqMethod }}</span></td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">처리시간</td><td>{{ row.respTimeMs != null ? row.respTimeMs+'ms' : '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">IP</td><td style="font-family:monospace;">{{ row.reqIp || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자ID</td><td>{{ row.userId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">앱유형</td><td>{{ row.appTypeCd || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">오류유형</td><td style="color:#e74c3c;font-weight:600;word-break:break-all;">{{ row.errorType || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">오류메시지</td><td style="color:#c0392b;word-break:break-all;">{{ row.errorMsg || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">서버</td><td style="font-family:monospace;font-size:11px;">{{ row.serverNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">프로파일</td><td><span v-if="row.profile" class="badge badge-blue" style="font-size:10px;">{{ row.profile }}</span><span v-else>-</span></td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">등록일시</td><td>{{ String(row.regDate||'').slice(0,19) }}</td></tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px;">🏷 X-헤더 (호출 추적)</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-ui-nm</td><td style="color:#e8587a;font-weight:600;">{{ fnDecode(row.uiNm) || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-cmd-nm</td><td>{{ fnDecode(row.cmdNm) || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-file-nm</td><td style="font-family:monospace;font-size:11px;">{{ row.fileNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-func-nm</td><td style="font-family:monospace;font-size:11px;">{{ row.funcNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-line-no</td><td style="font-family:monospace;">{{ row.lineNo || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ row.traceId || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">로거</td><td style="font-size:11px;word-break:break-all;">{{ row.loggerNm || '-' }}</td></tr>
              <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">스레드</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ row.threadNm || '-' }}</td></tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#c0392b;margin-bottom:8px;border-bottom:1px solid #fcc;padding-bottom:4px;">📋 스택트레이스</div>
            <div v-if="row.stackTrace" style="font-family:monospace;font-size:11px;color:#555;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;background:#fdf8ff;padding:10px;border-radius:6px;border:1px solid #e8d8f0;">{{ row.stackTrace }}</div>
            <div v-else style="color:#bbb;font-size:12px;padding:10px 0;">스택트레이스 없음</div>
          </div>
        </div>
      </td>
    </template>
  </bo-grid-readonly>
</div>
`,
};
