/* ShopJoy Admin - API로그조회 (API요청로그 + API오류로그) */
window.SyApiLogMng = {
  name: 'SyApiLogMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showRefModal = window.boApp.showRefModal;

    const uiState = reactive({
      activeTab: 'access',
      descOpen: false, srchOpen: false,
      isPageCodeLoad: false,
      dateRange: '1week',
      dateStart: '',
      dateEnd: '',
      searchKw: '',
      searchMethod: '',
      searchStatus: '',
      searchPath: '',
      searchUserTypeCd: '',
      searchUiNm: '',
      searchTraceId: '',
    });

    const codes = reactive({ date_range_opts: [], http_methods: [], user_types: [] });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.http_methods    = codeStore?.sgGetGrpCodes('HTTP_METHOD')    || [];
      codes.user_types      = codeStore?.sgGetGrpCodes('USER_TYPE')      || [];
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = boUtil.useAppCodeReady(uiState, fnLoadCodes);

    // 기본 기간: 최근 1주일
    (() => {
      const r = boUtil.getDateRange('1week');
      uiState.dateStart = r.from;
      uiState.dateEnd   = r.to;
    })();

    const onDateRangeChange = () => {
      if (uiState.dateRange) {
        const r = boUtil.getDateRange(uiState.dateRange);
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
    const expandedRows = reactive(new Set());
    const toggleRow    = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };
    const isExpanded   = id => expandedRows.has(id);
    const expandAll    = () => { const list = uiState.activeTab === 'access' ? accessLogs : errorLogs; list.forEach((r, i) => expandedRows.add(r.logId || i)); };
    const collapseAll  = () => expandedRows.clear();

    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    const buildSearchParams = () => ({
      pageNo:      pager.pageNo,
      pageSize:    pager.pageSize,
      dateStart:   uiState.dateStart       || undefined,
      dateEnd:     uiState.dateEnd         || undefined,
      kw:          uiState.searchKw        || undefined,
      method:      uiState.searchMethod    || undefined,
      status:      uiState.searchStatus    || undefined,
      path:        uiState.searchPath      || undefined,
      userTypeCd:  uiState.searchUserTypeCd || undefined,
      uiNm:        uiState.searchUiNm      || undefined,
      traceId:     uiState.searchTraceId   || undefined,
    });

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

    const handleSearchList = async () => {
      if (uiState.activeTab === 'access') await handleSearchAccessLog();
      else                                await handleSearchErrorLog();
    };

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    const onTabChange   = (tab) => { uiState.activeTab = tab; pager.pageNo = 1; handleSearchList(); };
    const handleClearLog = async () => {
      const tabNm = uiState.activeTab === 'access' ? 'API요청로그' : 'API오류로그';
      const ok = await window.boApp.showConfirm('로그 비우기', `현재 페이지의 ${tabNm} 목록을 화면에서 지웁니다.\n(DB 데이터는 삭제되지 않습니다)`);
      if (!ok) return;
      if (uiState.activeTab === 'access') { accessLogs.splice(0); tabCounts.access = 0; }
      else                                { errorLogs.splice(0);  tabCounts.error  = 0; }
      pager.pageTotalCount = 0; pager.pageTotalPage = 1;
      expandedRows.clear();
    };
    const onSearch     = () => { pager.pageNo = 1; handleSearchList(); };
    const onReset      = () => {
      Object.assign(uiState, {
        searchKw:'', searchMethod:'', searchStatus:'', searchPath:'',
        searchUserTypeCd:'', searchUiNm:'', searchTraceId:'',
        dateRange:'1week', srchOpen:false,
      });
      const r = boUtil.getDateRange('1week');
      uiState.dateStart = r.from; uiState.dateEnd = r.to;
      pager.pageNo = 1;
      handleSearchList();
    };
    const setPage      = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList(); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };

    const fnMethodBadge = m => ({ GET: 'badge-blue', POST: 'badge-green', PUT: 'badge-orange', PATCH: 'badge-purple', DELETE: 'badge-red' }[m] || 'badge-gray');
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

    // -- return ---------------------------------------------------------------

    return {
      uiState, codes, pager, tabCounts, cfCurrentList,
      onTabChange, onDateRangeChange, onSearch, onReset, setPage, onSizeChange,
      fnMethodBadge, fnStatusBadge,
      expandedRows, toggleRow, isExpanded, expandAll, collapseAll, handleClearLog,
      showRefModal,
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
    <div class="search-bar" style="flex-wrap:wrap;gap:8px">
      <span class="search-label">등록기간</span>
      <input type="date" v-model="uiState.dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="uiState.dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <select v-model="uiState.searchMethod" style="width:100px">
        <option value="">메서드 전체</option>
        <option v-if="!codes.http_methods.length" value="GET">GET</option>
        <option v-if="!codes.http_methods.length" value="POST">POST</option>
        <option v-if="!codes.http_methods.length" value="PUT">PUT</option>
        <option v-if="!codes.http_methods.length" value="PATCH">PATCH</option>
        <option v-if="!codes.http_methods.length" value="DELETE">DELETE</option>
        <option v-for="c in codes.http_methods" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input v-model="uiState.searchPath" placeholder="API 경로 (예: /bo/sy/)" style="width:190px" @keyup.enter="onSearch" />
      <input v-model="uiState.searchKw" placeholder="IP / 사용자ID" style="width:150px" @keyup.enter="onSearch" />
      <button class="btn btn-secondary btn-sm" @click="uiState.srchOpen=!uiState.srchOpen" style="white-space:nowrap">{{ uiState.srchOpen?'▲ 조건닫기':'▼ 조건더보기' }}</button>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <!-- 추가 검색조건 -->
    <div v-if="uiState.srchOpen" class="search-bar" style="flex-wrap:wrap;gap:8px;margin-top:8px;padding-top:8px;border-top:1px dashed #eee;">
      <input v-model="uiState.searchStatus" placeholder="상태코드 (예: 500)" style="width:150px" @keyup.enter="onSearch" />
      <select v-model="uiState.searchUserTypeCd" style="width:120px">
        <option value="">사용자유형 전체</option>
        <option v-if="!codes.user_types.length" value="ADMIN">관리자</option>
        <option v-if="!codes.user_types.length" value="MEMBER">회원</option>
        <option v-if="!codes.user_types.length" value="VENDOR">업체</option>
        <option v-if="!codes.user_types.length" value="ANON">비로그인</option>
        <option v-for="c in codes.user_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">x-헤더</span>
      <input v-model="uiState.searchUiNm"    placeholder="화면명 (x-ui-nm)"   style="width:170px" @keyup.enter="onSearch" />
      <input v-model="uiState.searchTraceId" placeholder="Trace ID"           style="width:200px" @keyup.enter="onSearch" />
    </div>
  </div>

  <!-- -- 탭 + 목록 --------------------------------------------------------- -->
  <div class="card">
    <div class="tab-nav" style="margin-bottom:16px">
      <button class="tab-btn" :class="{active:uiState.activeTab==='access'}" @click="onTabChange('access')">📋 API요청로그 <span class="tab-count">{{ tabCounts.access }}</span></button>
      <button class="tab-btn" :class="{active:uiState.activeTab==='error'}"  @click="onTabChange('error')">🚨 API오류로그 <span class="tab-count">{{ tabCounts.error }}</span></button>
    </div>
    <div class="toolbar">
      <span class="list-title">
        {{ uiState.activeTab === 'access' ? 'API요청로그' : 'API오류로그' }}
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">행 클릭 시 상세정보 펼침</span>
        <button class="btn btn-secondary btn-xs" @click="expandAll">전체펼치기</button>
        <button class="btn btn-secondary btn-xs" @click="collapseAll">전체닫기</button>
        <button class="btn btn-danger btn-xs" @click="handleClearLog">로그비우기</button>
      </div>
    </div>

    <!-- -- API요청로그 탭 -------------------------------------------------- -->
    <div v-if="uiState.activeTab==='access'">
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:20px"></th>
          <th>메서드</th>
          <th>API 경로</th>
          <th style="text-align:center;">상태</th>
          <th style="text-align:right;">ms</th>
          <th>IP</th>
          <th>사용자ID</th>
          <th>화면 > 기능</th>
          <th>Trace ID</th>
          <th>등록일시</th>
        </tr></thead>
        <tbody>
          <tr v-if="cfCurrentList.length===0">
            <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <template v-else v-for="(r, idx) in cfCurrentList" :key="r.logId || idx">
            <tr style="cursor:pointer;" :style="isExpanded(r.logId||idx)?'background:#fafbff;':''" @click="toggleRow(r.logId||idx)">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none;">{{ isExpanded(r.logId||idx) ? '▲' : '▼' }}</td>
              <td><span class="badge" :class="fnMethodBadge(r.reqMethod)">{{ r.reqMethod || '-' }}</span></td>
              <td style="font-family:monospace;font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.reqPath">{{ r.reqPath || '-' }}</td>
              <td style="text-align:center;"><span class="badge" :class="fnStatusBadge(r.respStatus)">{{ r.respStatus || '-' }}</span></td>
              <td style="text-align:right;font-family:monospace;font-size:12px;" :style="r.respTimeMs>1000?'color:#e74c3c;font-weight:700':''">{{ r.respTimeMs != null ? r.respTimeMs : '-' }}</td>
              <td style="font-family:monospace;font-size:12px;">{{ r.reqIp || '-' }}</td>
              <td style="font-size:12px;color:#555;">{{ r.userId || '-' }}</td>
              <td style="font-size:12px;color:#555;">
                <span v-if="r.uiNm" style="color:#e8587a;font-weight:600;">{{ r.uiNm }}</span>
                <span v-if="r.uiNm && r.cmdNm" style="color:#aaa;"> > </span>
                <span v-if="r.cmdNm">{{ r.cmdNm }}</span>
                <span v-if="!r.uiNm && !r.cmdNm" style="color:#ccc;">-</span>
              </td>
              <td style="font-family:monospace;font-size:11px;color:#888;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.traceId">{{ r.traceId || '-' }}</td>
              <td style="font-size:12px;white-space:nowrap;">{{ String(r.regDate || '').slice(0, 19) }}</td>
            </tr>
            <!-- 펼치기 상세 행 -->
            <tr v-if="isExpanded(r.logId||idx)">
              <td colspan="11" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
                  <!-- 요청 정보 -->
                  <div>
                    <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px;">📡 요청 정보</div>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">경로</td><td style="font-family:monospace;word-break:break-all;">{{ r.reqPath }}{{ r.reqQuery ? '?'+r.reqQuery : '' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">메서드</td><td><span class="badge" :class="fnMethodBadge(r.reqMethod)">{{ r.reqMethod }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">상태코드</td><td><span class="badge" :class="fnStatusBadge(r.respStatus)">{{ r.respStatus }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">처리시간</td><td :style="r.respTimeMs>1000?'color:#e74c3c;font-weight:700':''">{{ r.respTimeMs != null ? r.respTimeMs+'ms' : '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">IP</td><td style="font-family:monospace;">{{ r.reqIp || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">Host</td><td style="font-family:monospace;">{{ r.reqHost || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">UA</td><td style="font-size:11px;color:#666;word-break:break-all;">{{ r.reqUa || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">등록일시</td><td>{{ String(r.regDate||'').slice(0,19) }}</td></tr>
                    </table>
                  </div>
                  <!-- x-헤더 (호출 추적) -->
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px;">🏷 X-헤더 (호출 추적)</div>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-ui-nm</td><td style="color:#e8587a;font-weight:600;">{{ r.uiNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-cmd-nm</td><td>{{ r.cmdNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-file-nm</td><td style="font-family:monospace;font-size:11px;">{{ r.fileNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-func-nm</td><td style="font-family:monospace;font-size:11px;">{{ r.funcNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-line-no</td><td style="font-family:monospace;">{{ r.lineNo || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ r.traceId || '-' }}</td></tr>
                    </table>
                  </div>
                  <!-- 인증·서버 정보 -->
                  <div>
                    <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px;">🔐 인증 · 서버</div>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자ID</td><td>{{ r.userId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자유형</td><td>{{ r.userTypeCd || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">역할ID</td><td>{{ r.roleId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">부서ID</td><td>{{ r.deptId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">업체ID</td><td>{{ r.vendorId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">서버</td><td style="font-family:monospace;font-size:11px;">{{ r.serverNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">프로파일</td><td><span v-if="r.profile" class="badge badge-blue" style="font-size:10px;">{{ r.profile }}</span><span v-else>-</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">스레드</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ r.threadNm || '-' }}</td></tr>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- -- API오류로그 탭 -------------------------------------------------- -->
    <div v-if="uiState.activeTab==='error'">
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:20px"></th>
          <th>메서드</th>
          <th>API 경로</th>
          <th>오류유형</th>
          <th>오류메시지</th>
          <th>IP</th>
          <th>사용자ID</th>
          <th>등록일시</th>
        </tr></thead>
        <tbody>
          <tr v-if="cfCurrentList.length===0">
            <td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <template v-else v-for="(r, idx) in cfCurrentList" :key="r.logId || idx">
            <tr style="cursor:pointer;" :style="isExpanded(r.logId||idx)?'background:#fff8f8;':''" @click="toggleRow(r.logId||idx)">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none;">{{ isExpanded(r.logId||idx) ? '▲' : '▼' }}</td>
              <td><span class="badge" :class="fnMethodBadge(r.reqMethod)">{{ r.reqMethod || '-' }}</span></td>
              <td style="font-family:monospace;font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.reqPath">{{ r.reqPath || '-' }}</td>
              <td style="font-size:12px;color:#e74c3c;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.errorType">{{ r.errorType || '-' }}</td>
              <td style="font-size:12px;color:#555;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.errorMsg">{{ r.errorMsg || '-' }}</td>
              <td style="font-family:monospace;font-size:12px;">{{ r.reqIp || '-' }}</td>
              <td style="font-size:12px;color:#555;">{{ r.userId || '-' }}</td>
              <td style="font-size:12px;white-space:nowrap;">{{ String(r.regDate || '').slice(0, 19) }}</td>
            </tr>
            <!-- 펼치기 상세 행 -->
            <tr v-if="isExpanded(r.logId||idx)">
              <td colspan="9" style="background:#fff8f8;padding:16px 20px;border-top:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px;">
                  <!-- 오류 정보 -->
                  <div>
                    <div style="font-weight:700;color:#e74c3c;margin-bottom:8px;border-bottom:1px solid #fcc;padding-bottom:4px;">🚨 오류 정보</div>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">경로</td><td style="font-family:monospace;word-break:break-all;">{{ r.reqPath }}{{ r.reqQuery ? '?'+r.reqQuery : '' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">메서드</td><td><span class="badge" :class="fnMethodBadge(r.reqMethod)">{{ r.reqMethod }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">처리시간</td><td>{{ r.respTimeMs != null ? r.respTimeMs+'ms' : '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">IP</td><td style="font-family:monospace;">{{ r.reqIp || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자ID</td><td>{{ r.userId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">사용자유형</td><td>{{ r.userTypeCd || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">오류유형</td><td style="color:#e74c3c;font-weight:600;word-break:break-all;">{{ r.errorType || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">오류메시지</td><td style="color:#c0392b;word-break:break-all;">{{ r.errorMsg || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">서버</td><td style="font-family:monospace;font-size:11px;">{{ r.serverNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">프로파일</td><td><span v-if="r.profile" class="badge badge-blue" style="font-size:10px;">{{ r.profile }}</span><span v-else>-</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">등록일시</td><td>{{ String(r.regDate||'').slice(0,19) }}</td></tr>
                    </table>
                  </div>
                  <!-- x-헤더 (호출 추적) -->
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px;">🏷 X-헤더 (호출 추적)</div>
                    <table style="width:100%;border-collapse:collapse;">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-ui-nm</td><td style="color:#e8587a;font-weight:600;">{{ r.uiNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-cmd-nm</td><td>{{ r.cmdNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-file-nm</td><td style="font-family:monospace;font-size:11px;">{{ r.fileNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-func-nm</td><td style="font-family:monospace;font-size:11px;">{{ r.funcNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">x-line-no</td><td style="font-family:monospace;">{{ r.lineNo || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ r.traceId || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;">로거</td><td style="font-size:11px;word-break:break-all;">{{ r.loggerNm || '-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;">스레드</td><td style="font-family:monospace;font-size:11px;word-break:break-all;">{{ r.threadNm || '-' }}</td></tr>
                    </table>
                  </div>
                  <!-- 스택트레이스 -->
                  <div>
                    <div style="font-weight:700;color:#c0392b;margin-bottom:8px;border-bottom:1px solid #fcc;padding-bottom:4px;">📋 스택트레이스</div>
                    <div v-if="r.stackTrace" style="font-family:monospace;font-size:11px;color:#555;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;background:#fdf8ff;padding:10px;border-radius:6px;border:1px solid #e8d8f0;">{{ r.stackTrace }}</div>
                    <div v-else style="color:#bbb;font-size:12px;padding:10px 0;">스택트레이스 없음</div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
  </div>
</div>
`,
};
