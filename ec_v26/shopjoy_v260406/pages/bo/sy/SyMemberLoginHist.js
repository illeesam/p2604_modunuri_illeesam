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
    // ===== [01] 초기 변수 정의 ====================================================
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
    const pager = reactive({ pageType:'PAGE', pageNo:1, pageSize:20, pageTotalCount:0, pageTotalPage:1, pageSizes:[10,20,50,100], pageCond:{} });

    /* ===== 목록 데이터 ===== */
    const logs   = reactive([]);                  // 로그인 로그
    const tokens = reactive([]);                  // 토큰 이력
    const tabCounts = reactive({ log:0, token:0 });  // 탭별 카운트

    /* ===== 행 펼치기 상태 ===== */
    const expandedRows    = reactive(new Set());
    const allExpanded     = reactive({ value: false });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyMemberLoginHist.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, { searchType:'', searchValue:'', searchResultCd:'', searchIp:'', searchUiNm:'', searchTraceId:'', dateRange:'1week', srchOpen:false });
        onDateRangeChange();
        pager.pageNo = 1;
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
        pager.pageNo = 1;
        allExpanded.value = false;
        return handleSearchList();
      // 페이지 번호 클릭
      } else if (cmd === 'histList-pager-setPage') {
        return setPage(param);
      // 페이지 크기 변경
      } else if (cmd === 'histList-pager-sizeChange') {
        return onSizeChange();
      // 행 클릭 → 펼침 토글
      } else if (cmd === 'histList-rowToggle') {
        return toggleRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* onDateRangeChange — 기간 옵션 변경 */
    const onDateRangeChange = () => {
      if (searchParam.dateRange) { const r = boUtil.bofGetDateRange(searchParam.dateRange); searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : ''; }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      searchParam.isPageCodeLoad = true;
      const cs = window.sfGetBoCodeStore();
      codes.login_results   = cs?.sgGetGrpCodes('LOGIN_RESULT')   || [];
      codes.date_range_opts = cs?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
    };
    const isAppReady = coUtil.cofUseAppCodeReady(searchParam, fnLoadCodes);

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      pager.pageTotalPage = Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
      const c = pager.pageNo, l = pager.pageTotalPage, s = Math.max(1,c-2), e = Math.min(l,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
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
        pageNo: pager.pageNo, pageSize: pager.pageSize,
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
        pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.log = pager.pageTotalCount;
        fnBuildPagerNums(); expandedRows.clear();
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
        pager.pageTotalCount = d?.pageTotalCount || 0;
        tabCounts.token = pager.pageTotalCount;
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
    const setPage      = n => { if (n>=1 && n<=pager.pageTotalPage) { pager.pageNo=n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { pager.pageNo=1; handleSearchList(); };

    /* handleClearLog — 로그 전체 삭제 */
    const handleClearLog = async () => {
      const tabNm = searchParam.activeTab==='log' ? '회원로그인 로그' : '회원토큰 이력';
      const ok = await props.showConfirm('로그 비우기', `[${tabNm}] 테이블의 모든 데이터를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`);
      if (!ok) { return; }
      try {
        if (searchParam.activeTab==='log') { await window.boApi.delete('/bo/ec/mb/member-login-log/all', coUtil.cofApiHdr('회원로그인이력', '로그비우기')); }
        else { await window.boApi.delete('/bo/ec/mb/member-token-log/all', coUtil.cofApiHdr('회원로그인이력', '로그비우기')); }
        props.showToast(`${tabNm} 전체 삭제 완료`, 'success');
        if (searchParam.activeTab==='log') { logs.splice(0); tabCounts.log=0; }
        else                           { tokens.splice(0); tabCounts.token=0; }
        pager.pageTotalCount=0; pager.pageTotalPage=1; expandedRows.clear(); allExpanded.value=false;
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '삭제 오류', 'error', 0);
      }
    };

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

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

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      searchParam, codes, pager, tabCounts, cfCurrentList, allExpanded,                                // 상태 / 데이터
      baseSearchColumns, moreSearchColumns, logGridColumns, tokenGridColumns,                          // 컬럼 정의
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
    :columns="logGridColumns" :rows="cfCurrentList" :pager="pager" row-key="logId"
    list-title="로그인 로그" :count-text="pager.pageTotalCount + '건'"
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
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px">
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px">
              📡 접속 정보
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  로그인일시
                </td>
                <td>
                  {{ String(row.loginDate||row.regDate||'').slice(0,19) }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  IP
                </td>
                <td style="font-family:monospace">
                  {{ row.ip||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  OS
                </td>
                <td>
                  {{ row.os||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  브라우저
                </td>
                <td>
                  {{ row.browser||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  국가
                </td>
                <td>
                  {{ row.country||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  연속실패
                </td>
                <td :style="row.failCnt>0?'color:#e74c3c;font-weight:700':''">
                  {{ row.failCnt>0?row.failCnt+'회':'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  결과
                </td>
                <td>
                  <span class="badge" :class="fnResultBadge(row.resultCd)">
                    {{ fnResultLabel(row.resultCd) }}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px">
              🏷 X-헤더 (호출 추적)
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-ui-nm
                </td>
                <td style="color:#e8587a;font-weight:600">
                  {{ fnDecode(row.uiNm)||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-cmd-nm
                </td>
                <td>
                  {{ fnDecode(row.cmdNm)||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-file-nm
                </td>
                <td style="font-family:monospace;font-size:11px">
                  {{ row.fileNm||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-func-nm
                </td>
                <td style="font-family:monospace;font-size:11px">
                  {{ row.funcNm||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-line-no
                </td>
                <td style="font-family:monospace">
                  {{ row.lineNo||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">
                  x-trace-id
                </td>
                <td style="font-family:monospace;font-size:11px;word-break:break-all">
                  {{ row.traceId||'-' }}
                </td>
              </tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px">
              🔐 인증 · 토큰
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  회원ID
                </td>
                <td>
                  {{ row.memberId||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  로그인ID
                </td>
                <td>
                  {{ row.loginId||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  사이트
                </td>
                <td>
                  {{ row.siteNm||row.siteId||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">
                  AccessToken
                </td>
                <td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">
                  {{ row.accessToken||'미발급' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  AT만료
                </td>
                <td style="color:#8e44ad">
                  {{ row.accessTokenExp||'-' }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 로그인 로그 탭 ================================================ -->
  <!-- ===== ■. 토큰 이력 탭 ================================================= -->
  <bo-grid v-if="searchParam.activeTab==='token'"
    :columns="tokenGridColumns" :rows="cfCurrentList" :pager="pager" row-key="logId"
    list-title="토큰 이력" :count-text="pager.pageTotalCount + '건'"
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
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12px">
          <div>
            <div style="font-weight:700;color:#e91e8c;margin-bottom:8px;border-bottom:1px solid #f0c0d0;padding-bottom:4px">
              🔑 토큰 정보
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  액션
                </td>
                <td>
                  <span class="badge" :class="fnActionBadge(row.actionCd)">
                    {{ fnActionLabel(row.actionCd) }}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  토큰유형
                </td>
                <td>
                  <span class="badge" :class="fnTypeBadge(row.tokenTypeCd)">
                    {{ row.tokenTypeCd }}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  AT만료
                </td>
                <td style="color:#8e44ad">
                  {{ String(row.accessTokenExp||'').slice(0,19)||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  RT만료
                </td>
                <td :style="row.actionCd==='EXPIRE'||row.actionCd==='REVOKE'?'color:#e74c3c;font-weight:700':''">
                  {{ String(row.tokenExp||'').slice(0,19)||'-' }}
                </td>
              </tr>
              <tr v-if="row.revokeReason">
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  폐기사유
                </td>
                <td style="color:#e74c3c;font-weight:600">
                  {{ row.revokeReason }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  IP
                </td>
                <td style="font-family:monospace">
                  {{ row.ip||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  회원ID
                </td>
                <td>
                  {{ row.memberId||'-' }}
                </td>
              </tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#8e44ad;margin-bottom:8px;border-bottom:1px solid #e0c0f0;padding-bottom:4px">
              🏷 X-헤더 (호출 추적)
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-ui-nm
                </td>
                <td style="color:#e8587a;font-weight:600">
                  {{ fnDecode(row.uiNm)||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-cmd-nm
                </td>
                <td>
                  {{ fnDecode(row.cmdNm)||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-file-nm
                </td>
                <td style="font-family:monospace;font-size:11px">
                  {{ row.fileNm||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-func-nm
                </td>
                <td style="font-family:monospace;font-size:11px">
                  {{ row.funcNm||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap">
                  x-line-no
                </td>
                <td style="font-family:monospace">
                  {{ row.lineNo||'-' }}
                </td>
              </tr>
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">
                  x-trace-id
                </td>
                <td style="font-family:monospace;font-size:11px;word-break:break-all">
                  {{ row.traceId||'-' }}
                </td>
              </tr>
            </table>
          </div>
          <div>
            <div style="font-weight:700;color:#2980b9;margin-bottom:8px;border-bottom:1px solid #c0d8f0;padding-bottom:4px">
              🔐 토큰 해시
            </div>
            <!-- ===== ■.■.■.■.■.■. 테이블 =========================================== -->
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">
                  현재 토큰
                </td>
                <td style="font-family:monospace;font-size:11px;word-break:break-all;color:#555">
                  {{ row.accessToken||'-' }}
                </td>
              </tr>
              <tr v-if="row.prevToken">
                <td style="color:#888;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top">
                  이전 토큰
                </td>
                <td style="font-family:monospace;font-size:11px;word-break:break-all;color:#aaa">
                  {{ row.prevToken }}
                </td>
              </tr>
            </table>
            <div style="margin-top:6px;padding:5px 8px;background:#fdf8ff;border-radius:4px;font-size:11px;color:#888">
              ℹ SHA-256 해시. 원문 복원 불가
            </div>
          </div>
        </div>
      </td>
    </template>
  </bo-grid>
  <!-- ===== □. 토큰 이력 탭 ================================================= -->
</div>
`,
};
