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
    const { reactive, computed, onMounted } = Vue;

    // ── 상태 ──────────────────────────────────────────────────────────────
    const uiState = reactive({
      descOpen: false, isPageCodeLoad: false, srchOpen: false,
      activeTab: 'log',
      dateRange: '1week', dateStart: '', dateEnd: '',
      searchType: '', searchValue: '', searchResultCd: '', searchIp: '',
      searchUiNm: '', searchTraceId: '',
    });

    (() => { const r = boUtil.getDateRange('1week'); if (r) { uiState.dateStart = r.from; uiState.dateEnd = r.to; } })();

    /* onDateRangeChange */
    const onDateRangeChange = () => {
      if (uiState.dateRange) { const r = boUtil.getDateRange(uiState.dateRange); uiState.dateStart = r ? r.from : ''; uiState.dateEnd = r ? r.to : ''; }
    };

    const codes = reactive({ login_results: [], date_range_opts: [] });

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      uiState.isPageCodeLoad = true;
      const cs = window.sfGetBoCodeStore();
      codes.login_results   = cs?.sgGetGrpCodes('LOGIN_RESULT')   || [];
      codes.date_range_opts = cs?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    // ── 페이저 ────────────────────────────────────────────────────────────
    const pager = reactive({ pageType:'PAGE', pageNo:1, pageSize:20, pageTotalCount:0, pageTotalPage:1, pageSizes:[10,20,50,100], pageCond:{} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => {
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1,c-2), e = Math.min(l,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };

    // ── 데이터 ────────────────────────────────────────────────────────────
    const logList   = reactive([]);
    const tokenList = reactive([]);
    const tabCounts = reactive({ log:0, token:0 });

    const expandedRows    = reactive(new Set());
    const allExpanded     = reactive({ value: false });

    /* toggleRow */
    const toggleRow       = id => { if (expandedRows.has(id)) expandedRows.delete(id); else expandedRows.add(id); };

    /* isExpanded */
    const isExpanded      = id => expandedRows.has(id);

    /* toggleExpandAll */
    const toggleExpandAll = () => {
      const list = uiState.activeTab==='log' ? logList : tokenList;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r,i) => expandedRows.add(r.logId||i)); allExpanded.value = true; }
    };

    // ── 검색 ─────────────────────────────────────────────────────────────
    const buildParams = () => {
      const p = {
        pageNo: pager.pageNo, pageSize: pager.pageSize,
        dateStart:  uiState.dateStart   || undefined,
        dateEnd:    uiState.dateEnd     || undefined,
        resultCd:   uiState.searchResultCd || undefined,
        ip:         uiState.searchIp    || undefined,
        uiNm:       uiState.searchUiNm  || undefined,
        traceId:    uiState.searchTraceId || undefined,
        searchType: uiState.searchType || undefined,
        searchValue: uiState.searchValue   || undefined,
      };
      // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
      if (p.searchValue && !p.searchType) {
        p.searchType = 'memberId,loginId';
      }
      return p;
    };

    /* handleSearchLog */
    const handleSearchLog = async () => {
      try {
        const res = await boApiSvc.mbMemberLoginLog.getPage(buildParams(), '회원로그인이력', '로그인로그조회');
        const d = res.data?.data;
        logList.splice(0, logList.length, ...(d?.pageList || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.log = pager.pageTotalCount;
        fnBuildPagerNums(); expandedRows.clear();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* handleSearchToken */
    const handleSearchToken = async () => {
      try {
        const res = await boApiSvc.mbMemberTokenLog.getPage(buildParams(), '회원로그인이력', '토큰이력조회');
        const d = res.data?.data;
        tokenList.splice(0, tokenList.length, ...(d?.pageList || []));
        pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.token = pager.pageTotalCount;
        fnBuildPagerNums(); expandedRows.clear();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0);
      }
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      if (uiState.activeTab === 'log') await handleSearchLog();
      else                             await handleSearchToken();
    };

    onMounted(() => { if (isAppReady.value) fnLoadCodes(); handleSearchList(); });

    // ── 이벤트 ───────────────────────────────────────────────────────────
    const onTabChange = tab => { uiState.activeTab = tab; pager.pageNo = 1; allExpanded.value = false; handleSearchList(); };

    /* 목록조회 */
    const onSearch    = () => { pager.pageNo = 1; handleSearchList(); };

    /* onReset */
    const onReset     = () => {
      Object.assign(uiState, { searchType:'', searchValue:'', searchResultCd:'', searchIp:'', searchUiNm:'', searchTraceId:'', dateRange:'1week', srchOpen:false });
      onDateRangeChange(); pager.pageNo = 1; handleSearchList();
    };

    /* setPage */
    const setPage      = n => { if (n>=1 && n<=pager.pageTotalPage) { pager.pageNo=n; handleSearchList(); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo=1; handleSearchList(); };

    /* handleClearLog */
    const handleClearLog = async () => {
      const tabNm = uiState.activeTab==='log' ? '회원로그인 로그' : '회원토큰 이력';
      const ok = await props.showConfirm('로그 비우기', `[${tabNm}] 테이블의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`);
      if (!ok) return;
      try {
        if (uiState.activeTab==='log') await window.boApi.delete('/bo/ec/mb/member-login-log/all', coUtil.apiHdr('회원로그인이력', '로그비우기'));
        else                           await window.boApi.delete('/bo/ec/mb/member-token-log/all', coUtil.apiHdr('회원로그인이력', '로그비우기'));
        props.showToast(`${tabNm} 전체 삭제 완료`, 'success');
        if (uiState.activeTab==='log') { logList.splice(0); tabCounts.log=0; }
        else                           { tokenList.splice(0); tabCounts.token=0; }
        pager.pageTotalCount=0; pager.pageTotalPage=1; expandedRows.clear(); allExpanded.value=false;
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    // ── 표시용 ───────────────────────────────────────────────────────────
    const cfCurrentList = computed(() => uiState.activeTab==='log' ? logList : tokenList);

    /* fnResultBadge */
    const fnResultBadge = cd => ({'SUCCESS':'badge-green','LOGOUT':'badge-blue','FAIL_PW':'badge-red','FAIL_LOCKED':'badge-orange','FAIL_NOT_FOUND':'badge-gray','FAIL_DORMANT':'badge-purple'}[cd]||'badge-gray');

    /* fnResultLabel */
    const fnResultLabel = cd => ({'SUCCESS':'성공','LOGOUT':'로그아웃','FAIL_PW':'비밀번호오류','FAIL_LOCKED':'계정잠금','FAIL_NOT_FOUND':'없는계정','FAIL_DORMANT':'휴면계정'}[cd]||cd||'-');

    /* fnActionBadge */
    const fnActionBadge = cd => ({'ISSUE':'badge-blue','REFRESH':'badge-green','REVOKE':'badge-red','EXPIRE':'badge-orange','LOGOUT':'badge-gray'}[cd]||'badge-gray');

    /* fnActionLabel */
    const fnActionLabel = cd => ({'ISSUE':'발급','REFRESH':'갱신','REVOKE':'폐기','EXPIRE':'만료','LOGOUT':'로그아웃'}[cd]||cd||'-');

    /* fnTypeBadge */
    const fnTypeBadge   = cd => ({'ACCESS':'badge-purple','REFRESH':'badge-blue'}[cd]||'badge-gray');

    /* fnDecode */
    const fnDecode = s => { try { return s ? decodeURIComponent(s) : ''; } catch { return s || ''; } };

    return {
      uiState, codes, pager, tabCounts, cfCurrentList,
      expandedRows, toggleRow, isExpanded, toggleExpandAll, allExpanded,
      fnResultBadge, fnResultLabel, fnActionBadge, fnActionLabel, fnTypeBadge, fnDecode,
      onTabChange, onDateRangeChange, onSearch, onReset, setPage, onSizeChange, handleClearLog,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">회원로그인이력</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">회원의 로그인 로그·토큰 생애주기(발급·갱신·폐기·만료)를 조회합니다.</span>
    <button class="page-desc-toggle" @click="uiState.descOpen=!uiState.descOpen">{{ uiState.descOpen?'▲ 접기':'▼ 더보기' }}</button>
    <div v-if="uiState.descOpen" class="page-desc-detail">• 로그인 로그: mbh_member_login_log — 로그인 시도·결과·IP·디바이스·x-헤더
• 토큰 이력: mbh_member_token_log — 토큰 액션 (ISSUE발급/REFRESH갱신/REVOKE폐기/EXPIRE만료)
• 행 클릭 → 상세정보 펼치기 (x-헤더 포함)</div>
  </div>

  <!-- ── 검색 ──────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <span class="search-label">등록기간</span>
      <input type="date" v-model="uiState.dateStart" style="width:140px" />
      <span style="line-height:32px">~</span>
      <input type="date" v-model="uiState.dateEnd" style="width:140px" />
      <select v-model="uiState.dateRange" @change="onDateRangeChange" style="min-width:110px">
        <option value="">기간선택</option>
        <option v-for="opt in codes.date_range_opts" :key="opt.codeValue" :value="opt.codeValue">{{ opt.codeLabel }}</option>
      </select>
      <select v-model="uiState.searchResultCd" style="width:130px">
        <option value="">로그인결과 전체</option>
        <option v-for="c in codes.login_results" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input v-model="uiState.searchIp" placeholder="IP 주소" style="width:140px" @keyup.enter="onSearch" />
      <bo-multi-check-select
        v-model="uiState.searchType"
        :options="[
          { value: 'memberId', label: '회원ID' },
          { value: 'loginId',  label: '로그인ID' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="uiState.searchValue" placeholder="검색어 입력" style="width:170px" @keyup.enter="onSearch" />
      <div class="search-actions" style="margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0;">
        <button class="btn btn-secondary btn-sm" @click="uiState.srchOpen=!uiState.srchOpen" style="padding:0 8px;" :title="uiState.srchOpen?'조건닫기':'조건더보기'">{{ uiState.srchOpen?'▲':'▼' }}</button>
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <div v-if="uiState.srchOpen" class="search-bar" style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e0e8;">
      <span class="search-label">x-헤더</span>
      <input v-model="uiState.searchUiNm"    placeholder="화면명 (x-ui-nm)"  style="width:170px" @keyup.enter="onSearch" />
      <input v-model="uiState.searchTraceId" placeholder="Trace ID"          style="width:200px" @keyup.enter="onSearch" />
    </div>
  </div>

  <!-- ── 탭 + 목록 ─────────────────────────────────────────────────── -->
  <div class="card">
    <div class="tab-nav" style="margin-bottom:16px">
      <button class="tab-btn" :class="{active:uiState.activeTab==='log'}"   @click="onTabChange('log')">로그인 로그 <span class="tab-count">{{ tabCounts.log }}</span></button>
      <button class="tab-btn" :class="{active:uiState.activeTab==='token'}" @click="onTabChange('token')">토큰 이력 <span class="tab-count">{{ tabCounts.token }}</span></button>
    </div>
    <div class="toolbar">
      <span class="list-title">
        {{ uiState.activeTab==='log' ? '로그인 로그' : '토큰 이력' }}
        <span class="list-count">{{ pager.pageTotalCount }}건</span>
      </span>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#aaa;">행 클릭 시 상세정보 펼침</span>
        <button class="btn btn-secondary btn-xs" @click="toggleExpandAll">{{ allExpanded.value ? '전체닫기' : '전체펼치기' }}</button>
        <button class="btn btn-danger btn-xs"    @click="handleClearLog">로그비우기</button>
      </div>
    </div>

    <!-- ── 로그인 로그 탭 ──────────────────────────────────────────── -->
    <div v-if="uiState.activeTab==='log'">
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:20px"></th>
          <th>로그ID</th><th>로그인일시</th><th>회원</th><th>로그인ID</th>
          <th>결과</th><th>실패</th><th>IP</th><th>OS/브라우저</th>
          <th>화면>기능</th><th>Trace ID</th><th>등록일시</th>
        </tr></thead>
        <tbody>
          <tr v-if="cfCurrentList.length===0">
            <td colspan="13" style="text-align:center;color:#999;padding:30px">데이터가 없습니다.</td>
          </tr>
          <template v-else v-for="(r,idx) in cfCurrentList" :key="r.logId||idx">
            <tr style="cursor:pointer" :style="isExpanded(r.logId||idx)?'background:#fafbff':''" @click="toggleRow(r.logId||idx)">
              <td style="text-align:center;font-size:11px;color:#999">{{ (pager.pageNo-1)*pager.pageSize+idx+1 }}</td>
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.logId||idx)?'▲':'▼' }}</td>
              <td style="font-family:monospace;font-size:11px;color:#888">{{ r.logId||'-' }}</td>
              <td style="white-space:nowrap;font-size:12px">{{ String(r.loginDate||r.regDate||'').slice(0,19) }}</td>
              <td><div style="font-weight:600">{{ r.memberNm||r.memberId||'-' }}</div><div style="font-size:11px;color:#aaa">{{ r.memberId }}</div></td>
              <td style="font-size:12px;color:#555">{{ r.loginId||'-' }}</td>
              <td><span class="badge" :class="fnResultBadge(r.resultCd)">{{ fnResultLabel(r.resultCd) }}</span></td>
              <td style="text-align:center" :style="r.failCnt>0?'color:#e74c3c;font-weight:700':''">{{ r.failCnt>0?r.failCnt+'회':'-' }}</td>
              <td style="font-family:monospace;font-size:12px">{{ r.ip||'-' }}</td>
              <td style="font-size:11px;color:#666;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="r.browser+' / '+r.os">{{ r.browser||r.device||'-' }}</td>
              <td style="font-size:12px">
                <span v-if="r.uiNm" style="color:#e8587a;font-weight:600">{{ fnDecode(r.uiNm) }}</span>
                <span v-if="r.uiNm&&r.cmdNm" style="color:#aaa"> > </span>
                <span v-if="r.cmdNm">{{ fnDecode(r.cmdNm) }}</span>
                <span v-if="!r.uiNm&&!r.cmdNm" style="color:#ccc">-</span>
              </td>
              <td style="font-family:monospace;font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="r.traceId">{{ r.traceId||'-' }}</td>
              <td style="font-size:12px;white-space:nowrap">{{ String(r.regDate||'').slice(0,19) }}</td>
            </tr>
            <tr v-if="isExpanded(r.logId||idx)">
              <td colspan="13" style="background:#f4f6fb;padding:16px 20px;border-top:none">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px">
                  <div>
                    <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px">📡 접속 정보</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">로그인일시</td><td>{{ String(r.loginDate||r.regDate||'').slice(0,19) }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">IP</td><td style="font-family:monospace">{{ r.ip||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">OS</td><td>{{ r.os||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">브라우저</td><td>{{ r.browser||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">국가</td><td>{{ r.country||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">연속실패</td><td :style="r.failCnt>0?'color:#e74c3c;font-weight:700':''">{{ r.failCnt>0?r.failCnt+'회':'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">결과</td><td><span class="badge" :class="fnResultBadge(r.resultCd)">{{ fnResultLabel(r.resultCd) }}</span></td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px">🏷 X-헤더 (호출 추적)</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-ui-nm</td><td style="color:#e8587a;font-weight:600">{{ fnDecode(r.uiNm)||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-cmd-nm</td><td>{{ fnDecode(r.cmdNm)||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-file-nm</td><td style="font-family:monospace;font-size:11px">{{ r.fileNm||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-func-nm</td><td style="font-family:monospace;font-size:11px">{{ r.funcNm||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-line-no</td><td style="font-family:monospace">{{ r.lineNo||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all">{{ r.traceId||'-' }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px">🔐 인증 · 토큰</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">회원ID</td><td>{{ r.memberId||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">로그인ID</td><td>{{ r.loginId||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">사이트</td><td>{{ r.siteNm||r.siteId||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">AccessToken</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.accessToken||'미발급' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">AT만료</td><td style="color:#8e44ad">{{ r.accessTokenExp||'-' }}</td></tr>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ── 토큰 이력 탭 ────────────────────────────────────────────── -->
    <div v-if="uiState.activeTab==='token'">
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:20px"></th>
          <th>토큰로그ID</th><th>일시</th><th>회원</th>
          <th>액션</th><th>토큰유형</th><th>AT만료</th><th>RT만료</th><th>IP</th>
          <th>화면>기능</th><th>Trace ID</th><th>폐기사유</th>
        </tr></thead>
        <tbody>
          <tr v-if="cfCurrentList.length===0">
            <td colspan="13" style="text-align:center;color:#999;padding:30px">데이터가 없습니다.</td>
          </tr>
          <template v-else v-for="(r,idx) in cfCurrentList" :key="r.logId||idx">
            <tr style="cursor:pointer" :style="isExpanded(r.logId||idx)?'background:#fafbff':''" @click="toggleRow(r.logId||idx)">
              <td style="text-align:center;font-size:11px;color:#999">{{ (pager.pageNo-1)*pager.pageSize+idx+1 }}</td>
              <td style="text-align:center;color:#bbb;font-size:11px;user-select:none">{{ isExpanded(r.logId||idx)?'▲':'▼' }}</td>
              <td style="font-family:monospace;font-size:11px;color:#888">{{ r.logId||'-' }}</td>
              <td style="white-space:nowrap;font-size:12px">{{ String(r.regDate||'').slice(0,19) }}</td>
              <td><div style="font-weight:600">{{ r.memberNm||r.memberId||'-' }}</div><div style="font-size:11px;color:#aaa">{{ r.memberId }}</div></td>
              <td><span class="badge" :class="fnActionBadge(r.actionCd)">{{ fnActionLabel(r.actionCd) }}</span></td>
              <td><span class="badge" :class="fnTypeBadge(r.tokenTypeCd)" style="font-size:11px">{{ r.tokenTypeCd||'-' }}</span></td>
              <td style="font-size:12px;color:#8e44ad">{{ String(r.accessTokenExp||'').slice(0,19)||'-' }}</td>
              <td style="font-size:12px" :style="r.actionCd==='EXPIRE'||r.actionCd==='REVOKE'?'color:#e74c3c':''">{{ String(r.tokenExp||'').slice(0,19)||'-' }}</td>
              <td style="font-family:monospace;font-size:12px">{{ r.ip||'-' }}</td>
              <td style="font-size:12px">
                <span v-if="r.uiNm" style="color:#e8587a;font-weight:600">{{ fnDecode(r.uiNm) }}</span>
                <span v-if="r.uiNm&&r.cmdNm" style="color:#aaa"> > </span>
                <span v-if="r.cmdNm">{{ fnDecode(r.cmdNm) }}</span>
                <span v-if="!r.uiNm&&!r.cmdNm" style="color:#ccc">-</span>
              </td>
              <td style="font-family:monospace;font-size:11px;color:#888;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" :title="r.traceId">{{ r.traceId||'-' }}</td>
              <td style="font-size:12px;color:#e74c3c">{{ r.revokeReason||'-' }}</td>
            </tr>
            <tr v-if="isExpanded(r.logId||idx)">
              <td colspan="13" style="background:#f4f6fb;padding:16px 20px;border-top:none">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px">
                  <div>
                    <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px">🔑 토큰 정보</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">액션</td><td><span class="badge" :class="fnActionBadge(r.actionCd)">{{ fnActionLabel(r.actionCd) }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">토큰유형</td><td><span class="badge" :class="fnTypeBadge(r.tokenTypeCd)">{{ r.tokenTypeCd }}</span></td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">AT만료</td><td style="color:#8e44ad">{{ String(r.accessTokenExp||'').slice(0,19)||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">RT만료</td><td :style="r.actionCd==='EXPIRE'||r.actionCd==='REVOKE'?'color:#e74c3c;font-weight:700':''">{{ String(r.tokenExp||'').slice(0,19)||'-' }}</td></tr>
                      <tr v-if="r.revokeReason"><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">폐기사유</td><td style="color:#e74c3c;font-weight:600">{{ r.revokeReason }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">IP</td><td style="font-family:monospace">{{ r.ip||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">회원ID</td><td>{{ r.memberId||'-' }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px">🏷 X-헤더 (호출 추적)</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-ui-nm</td><td style="color:#e8587a;font-weight:600">{{ fnDecode(r.uiNm)||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-cmd-nm</td><td>{{ fnDecode(r.cmdNm)||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-file-nm</td><td style="font-family:monospace;font-size:11px">{{ r.fileNm||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-func-nm</td><td style="font-family:monospace;font-size:11px">{{ r.funcNm||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">x-line-no</td><td style="font-family:monospace">{{ r.lineNo||'-' }}</td></tr>
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">x-trace-id</td><td style="font-family:monospace;font-size:11px;word-break:break-all">{{ r.traceId||'-' }}</td></tr>
                    </table>
                  </div>
                  <div>
                    <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px">🔐 토큰 해시</div>
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">현재 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">{{ r.accessToken||'-' }}</td></tr>
                      <tr v-if="r.prevToken"><td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">이전 토큰</td><td style="font-family:monospace;font-size:11px;word-break:break-all;color:#aaa">{{ r.prevToken }}</td></tr>
                    </table>
                    <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">ℹ SHA-256 해시. 원문 복원 불가</div>
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
