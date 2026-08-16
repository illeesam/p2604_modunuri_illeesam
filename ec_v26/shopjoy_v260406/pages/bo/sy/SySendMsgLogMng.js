/* ShopJoy Admin - 메시지발송이력 (메일 / 메시지(SMS·카카오) / 시스템알림) */
window.SySendMsgLogMng = {
  name: 'SySendMsgLogMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast = window.boApp.showToast;  // 토스트 알림

    // 탭: email(메일) / msg(메시지 SMS·카카오) / alarm(시스템알림)
    const uiState = reactive({
      loading: false, hasMore: true,   // 무한 스크롤: 중복요청 가드 / 더 받을 게 있는지
      activeTab: 'email',
      dateRange: '1week',
      dateRangeStart: '',
      dateRangeEnd: '',
      searchValue: '',
      searchResult: '',   // 발송결과 (SUCCESS/FAILED/PENDING)
      searchChannel: '',  // 메시지 탭 채널 (SMS/KAKAO/PUSH)
    });

    const codes = reactive({ date_range_opts: [], send_results: [], msg_channels: [] });

    const baseGridPager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 100, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100], pageCond: {},
    });

    const emailLogs = reactive([]);
    const msgLogs   = reactive([]);
    const alarmLogs = reactive([]);
    const tabCounts = reactive({ email: 0, msg: 0, alarm: 0 });

    /* tabs — 탭 정의 (BoTabBar 데이터) */
    const tabs = reactive([
      { id: 'email', label: '메일', icon: '📧', get count() { return tabCounts.email; } },
      { id: 'msg',   label: '메시지(SMS·카카오)', icon: '💬', get count() { return tabCounts.msg; } },
      { id: 'alarm', label: '시스템알림', icon: '🔔', get count() { return tabCounts.alarm; } },
    ]);

    const columns = {};

    // 행 펼침
    const expandedRows  = reactive(new Set());
    const allExpanded   = reactive({ value: false });
    const detailCache   = reactive({});
    const detailLoading = reactive(new Set());

    boUtil.bofApplyDateRange(uiState, '1week');

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SySendMsgLogMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        return onSearch();
      } else if (cmd === 'searchParam-reset') {
        return onReset();
      } else if (cmd === 'searchParam-dateRange') {
        return onDateRangeChange();
      } else if (cmd === 'sendLogs-toggleExpandAll') {
        return toggleExpandAll();
      } else if (cmd === 'sendLogs-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/탭 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SySendMsgLogMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'tabs-select') {
        return onTabChange(param);
      } else if (cmd === 'sendLogs-pager-sizeChange') {
        return onSizeChange();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 라우터 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'sendLogs-cellClick') {
        if (colKey === 'isExpanded') { return fnRowExpanded(row, e); }
        if (colKey === 'rowStyle')   { return fnRowClickStyle(row, e); }
        console.log(' ■■ SySendMsgLogMng.js : handleGridCellAction -> ', cmd, colKey, row);
        if (colKey === 'btn_row_expand') { return toggleRow(fnRowId(row)); }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['DATE_RANGE_OPT', 'SEND_RESULT', 'MSG_CHANNEL'], {compNm: 'SySendMsgLogMng'});
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.send_results    = codeStore?.sgGetGrpCodes('SEND_RESULT')    || [];
      codes.msg_channels    = codeStore?.sgGetGrpCodes('MSG_CHANNEL')    || [];
    };

    /* onDateRangeChange — 기간 변경 */
    const onDateRangeChange = () => {
      boUtil.bofApplyDateRange(uiState);
      baseGridPager.pageNo = 1;
    };

    /* fnRowId — 행 PK (email/msg=logId, alarm=sendHistId) */
    const fnRowId = (row) => uiState.activeTab === 'alarm' ? row.sendHistId : row.logId;

    /* fnCurSvc — 현재 탭 API 서비스 */
    const fnCurSvc = () => {
      if (uiState.activeTab === 'email') { return boApiSvc.sySendEmailLog; }
      if (uiState.activeTab === 'msg')   { return boApiSvc.sySendMsgLog; }
      return boApiSvc.syAlarmSendHist;
    };

    /* fnCacheKey — 캐시 키 (탭+id) */
    const fnCacheKey = id => `${uiState.activeTab}:${id}`;

    /* fnFetchDetail — 행 상세 API(getById) 조회 후 캐시 적재 */
    const fnFetchDetail = async (id) => {
      if (id == null) { return; }
      const key = fnCacheKey(id);
      if (detailCache[key] || detailLoading.has(key)) { return; }
      detailLoading.add(key);
      try {
        const res = await fnCurSvc().getById(id, '메시지발송이력', '상세조회');
        detailCache[key] = res.data?.data || res.data || {};
      } catch (err) {
        if (showToast) { showToast(err.response?.data?.message || err.message || '상세 조회 오류', 'error', 0); }
      } finally {
        detailLoading.delete(key);
      }
    };

    /* toggleRow — 행 펼침 토글 */
    const toggleRow = id => {
      if (expandedRows.has(id)) { expandedRows.delete(id); }
      else { expandedRows.add(id); fnFetchDetail(id); }
    };

    /* isExpanded — 여부 */
    const isExpanded = id => expandedRows.has(id);

    /* fnRowDetail — 펼침 상세 데이터 (캐시 우선, 미조회 시 row 폴백) */
    const fnRowDetail = (row) => detailCache[fnCacheKey(fnRowId(row))] || row;

    /* fnRowDetailLoading — 행 상세 조회중 여부 */
    const fnRowDetailLoading = (row) => detailLoading.has(fnCacheKey(fnRowId(row)));

    /* toggleExpandAll — 전체 펼침 토글 */
    const toggleExpandAll = () => {
      const list = cfCurrentList.value;
      if (allExpanded.value) { expandedRows.clear(); allExpanded.value = false; }
      else { list.forEach((r, i) => { const id = fnRowId(r) || i; expandedRows.add(id); fnFetchDetail(id); }); allExpanded.value = true; }
    };


    /* ===== 엑셀 다운로드 =====
       탭마다 대상 테이블이 달라 domain/areaNm 을 탭값으로 매핑한다.
       domain 키는 백엔드 ExcelDomainConfig 의 @Bean 등록명과 일치해야 한다. */
    const excelModal = reactive({ show: false });
    const EXCEL_MAP = {
      'email': { domain: 'sendEmailLog', areaNm: '이메일 발송이력' },
      'msg': { domain: 'sendMsgLog', areaNm: '메시지 발송이력' }
    };
    const cfExcelDomain = computed(() => (EXCEL_MAP[uiState.activeTab] || EXCEL_MAP['email']).domain);
    const cfExcelAreaNm = computed(() => (EXCEL_MAP[uiState.activeTab] || EXCEL_MAP['email']).areaNm);

    /* cfExcelColumns — 현재 탭의 그리드 헤더. 엑셀 컬럼/순서/라벨을 화면과 일치시키기 위해
       모달에 넘긴다(안 넘기면 서버가 Entity 필드로 만들어 화면과 어긋난다). */
    const cfExcelColumns = computed(() => {
      if (uiState.activeTab === 'email') { return columns.emailGrid || []; }
      if (uiState.activeTab === 'msg') { return columns.msgGrid || []; }
      if (uiState.activeTab === 'alarm') { return columns.alarmGrid || []; }
      return columns.emailGrid || [];
    });

    /* buildExcelParams — 엑셀은 현재 검색조건 전체를 그대로 넘긴다.
       페이지 번호/크기는 의미가 없어 제거한다(서버가 조건 전체를 청크로 훑는다). */
    const buildExcelParams = () => {
      const p = { ...buildSearchParams() };
      delete p.pageNo; delete p.pageSize;
      return p;
    };

    /* buildSearchParams — 검색 파라미터 빌드 */
    const buildSearchParams = () => {
      const p = {
        pageNo:      baseGridPager.pageNo,
        pageSize:    baseGridPager.pageSize,
        dateRangeType:    'send_date',
        dateRangeStart:   uiState.dateRangeStart  || undefined,
        dateRangeEnd:     uiState.dateRangeEnd    || undefined,
        searchValue: uiState.searchValue || undefined,
      };
      // 발송결과 필터 (3탭 공통)
      if (uiState.searchResult) { p.resultCd = uiState.searchResult; p.status = uiState.searchResult; }
      // 메시지 탭: 채널 필터
      if (uiState.activeTab === 'msg' && uiState.searchChannel) { p.channelCd = uiState.searchChannel; p.typeCd = uiState.searchChannel; }
      return p;
    };

    /* handleSearchList — 현재 탭 목록 조회 */
    const handleSearchList = async (append = false) => {
      if (uiState.loading) { return; }
      if (append && !uiState.hasMore) { return; }
      if (!append) { baseGridPager.pageNo = 1; uiState.hasMore = true; }
      uiState.loading = true;
      try {
        const res = await fnCurSvc().getPage(buildSearchParams(), '메시지발송이력', '조회',
          append ? { isProgress: false } : undefined);
        const data = res.data?.data;
        const list = data?.pageList || [];
        const target = uiState.activeTab === 'email' ? emailLogs : (uiState.activeTab === 'msg' ? msgLogs : alarmLogs);
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        tabCounts[uiState.activeTab] = baseGridPager.pageTotalCount;
        if (append) {
          target.push(...list);
        } else {
          target.splice(0, target.length, ...list);
          expandedRows.clear(); Object.keys(detailCache).forEach(k => delete detailCache[k]); allExpanded.value = false;
        }
        /* 더 받을 게 있는지 */
        uiState.hasMore = list.length >= baseGridPager.pageSize && target.length < baseGridPager.pageTotalCount;
        if (uiState.hasMore) { baseGridPager.pageNo += 1; }
      } catch (err) {
        console.error('[handleSearchList]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      } finally {
        uiState.loading = false;
      }
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
    const onTabChange = (tab) => { uiState.activeTab = tab; baseGridPager.pageNo = 1; allExpanded.value = false; handleSearchList(); };

    /* onSearch — 조회 */
    const onSearch = () => { baseGridPager.pageNo = 1; handleSearchList(); };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(uiState, { searchValue: '', searchResult: '', searchChannel: '', dateRange: '1week' });
      boUtil.bofApplyDateRange(uiState, '1week');
      baseGridPager.pageNo = 1;
      handleSearchList();
    };

    /* setPage — 페이지 이동 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList(); };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnResultBadge — 발송결과 배지 (sy_code SEND_RESULT code_opt1 우선) */
    const _SEND_RESULT_FB = { SUCCESS: 'badge-green', FAILED: 'badge-red', PENDING: 'badge-gray' };
    const fnResultBadge = r => coUtil.cofCodeBadge('SEND_RESULT', r, _SEND_RESULT_FB[r] || 'badge-gray');

    /* fnChannelBadge — 채널 배지 */
    const _CHANNEL_FB = { EMAIL: 'badge-blue', SMS: 'badge-orange', KAKAO: 'badge-purple', PUSH: 'badge-green', SYSTEM: 'badge-gray' };
    const fnChannelBadge = c => coUtil.cofCodeBadge('MSG_CHANNEL', c, _CHANNEL_FB[c] || 'badge-gray');

    /* fnHistStatusBadge — 알림 발송상태 (SENT/FAILED) */
    const fnHistStatusBadge = s => s === 'SENT' ? 'badge-green' : (s === 'FAILED' ? 'badge-red' : 'badge-gray');

    const cfCurrentList = computed(() => uiState.activeTab === 'email' ? emailLogs : (uiState.activeTab === 'msg' ? msgLogs : alarmLogs));

    const fnEllip = 'max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';

    /* 기본 검색 (3탭 공통) */
    columns.baseSearch = [
      { key: 'dateRange', type: 'dateRange', label: '발송기간',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        dateWidth: '140px', sepStyle: 'line-height:32px',
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
      { key: 'searchResult', type: 'select', label: '발송결과',
        options: () => codes.send_results, nullLabel: '결과 전체' },
      { key: 'searchValue', type: 'text', label: '검색어',
        placeholder: '수신처/제목/내용', width: '200px' },
    ];
    /* 메시지 탭 전용 채널 필터 (slot 으로 추가) */
    columns.msgChannelSearch = [
      { key: 'searchChannel', type: 'select', label: '채널',
        options: () => codes.msg_channels, nullLabel: '채널 전체' },
    ];

    /* _exp 펼침 아이콘 컬럼 (공통) */
    const expCol = {
      key: '_exp', label: '', style: 'width:24px', align: 'center',
      linkToggle: { active: (row) => isExpanded(fnRowId(row)), title: '펼치기/닫기',
        onClick: (row) => handleGridCellAction('sendLogs-cellClick', 'btn_row_expand', row),
        activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
      fmt: (v, row) => isExpanded(fnRowId(row)) ? '▲' : '▼',
    };
    // 번호 컬럼은 BoGrid 가 showRowNo(기본 true)로 자동 렌더 — 직접 추가 금지(중복 '번호')
    const resultCol = { key: 'resultCd', label: '결과', style: 'text-align:center;', align: 'center',
      badge: (row) => fnResultBadge(row.resultCd), fmt: (v) => v || '-' };
    const dateCol = { key: 'sendDate', label: '발송일시', cellStyle: 'white-space:nowrap', fmt: (v) => coUtil.cofYmdHms(v || '') };

    /* 메일 그리드 */
    columns.emailGrid = [
      expCol,
      { key: 'toAddr',       label: '수신 이메일', mono: true, cellStyle: 'color:#333', fmt: (v) => v || '-' },
      { key: 'subject',      label: '제목', cellStyle: fnEllip, cellTitle: (v, row) => row.subject, fmt: (v) => v || '-' },
      { key: 'templateCode', label: '템플릿코드', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      resultCol,
      { key: 'failReason',   label: '실패사유', cellStyle: 'color:#c0392b;' + fnEllip, cellTitle: (v, row) => row.failReason, fmt: (v) => v || '-' },
      dateCol,
    ];
    /* 메시지(SMS·카카오) 그리드 */
    columns.msgGrid = [
      expCol,
      { key: 'channelCd',    label: '채널', style: 'text-align:center;', align: 'center', badge: (row) => fnChannelBadge(row.channelCd), fmt: (v) => v || '-' },
      { key: 'recvPhone',    label: '수신번호', mono: true, fmt: (v) => v || '-' },
      { key: 'content',      label: '내용', cellStyle: fnEllip, cellTitle: (v, row) => row.content, fmt: (v) => v || '-' },
      { key: 'kakaoTplCode', label: '카카오템플릿', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      resultCol,
      { key: 'failReason',   label: '실패사유', cellStyle: 'color:#c0392b;' + fnEllip, cellTitle: (v, row) => row.failReason, fmt: (v) => v || '-' },
      dateCol,
    ];
    /* 시스템알림 그리드 */
    columns.alarmGrid = [
      { key: '_exp', label: '', style: 'width:24px', align: 'center',
        linkToggle: { active: (row) => isExpanded(row.sendHistId), title: '펼치기/닫기',
          onClick: (row) => handleGridCellAction('sendLogs-cellClick', 'btn_row_expand', row),
          activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
        fmt: (v, row) => isExpanded(row.sendHistId) ? '▲' : '▼' },
      { key: 'channel',  label: '채널', style: 'text-align:center;', align: 'center', badge: (row) => fnChannelBadge(row.channel), fmt: (v) => v || '-' },
      { key: 'sendTo',   label: '수신처', cellStyle: 'color:#333', fmt: (v) => v || '-' },
      { key: 'memberId', label: '회원ID', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'userId',   label: '사용자ID', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'alarmId',  label: '알림ID', mono: true, cellStyle: 'font-size:11px;color:#888', fmt: (v) => v || '-' },
      { key: 'sendHistStatusCd', label: '결과', style: 'text-align:center;', align: 'center', badge: (row) => fnHistStatusBadge(row.sendHistStatusCd), fmt: (v) => v || '-' },
      { key: 'errorMsg', label: '오류메시지', cellStyle: 'color:#c0392b;' + fnEllip, cellTitle: (v, row) => row.errorMsg, fmt: (v) => v || '-' },
      dateCol,
    ];

    /* 펼침 상세 (탭별 BoFormArea 컬럼) */
    columns.emailDetail = [
      { key: '_to',     label: '수신', type: 'readonly', mono: true, fmt: (v, r) => r.toAddr || '-' },
      { key: '_from',   label: '발신', type: 'readonly', mono: true, fmt: (v, r) => r.fromAddr || '-' },
      { key: '_result', label: '결과', type: 'readonly', html: true, fmt: (v, r) => `<span class="badge ${fnResultBadge(r.resultCd)}">${r.resultCd || '-'}</span>` },
      { key: '_subject', label: '제목', type: 'readonly', colSpan: 3, fmt: (v, r) => r.subject || '-' },
      { key: '_tpl',    label: '템플릿', type: 'readonly', mono: true, fmt: (v, r) => (r.templateCode || '-') + (r.templateNm ? ' (' + r.templateNm + ')' : '') },
      { key: '_ref',    label: '연관', type: 'readonly', fmt: (v, r) => (r.refTypeCd || '-') + (r.refId ? ' / ' + r.refId : '') },
      { key: '_fail',   label: '실패사유', type: 'readonly', colSpan: 3, fmt: (v, r) => r.failReason || '-' },
      { key: '_content', label: '내용', type: 'slot', name: 'emailContent', colSpan: 3 },
    ];
    columns.msgDetail = [
      { key: '_channel', label: '채널', type: 'readonly', html: true, fmt: (v, r) => `<span class="badge ${fnChannelBadge(r.channelCd)}">${r.channelCd || '-'}</span>` },
      { key: '_phone',  label: '수신번호', type: 'readonly', mono: true, fmt: (v, r) => r.recvPhone || '-' },
      { key: '_result', label: '결과', type: 'readonly', html: true, fmt: (v, r) => `<span class="badge ${fnResultBadge(r.resultCd)}">${r.resultCd || '-'}</span>` },
      { key: '_tpl',    label: '템플릿', type: 'readonly', mono: true, fmt: (v, r) => r.templateCode || '-' },
      { key: '_kakao',  label: '카카오템플릿', type: 'readonly', mono: true, fmt: (v, r) => r.kakaoTplCode || '-' },
      { key: '_resultMsg', label: '응답', type: 'readonly', fmt: (v, r) => r.resultMsg || '-' },
      { key: '_ref',    label: '연관', type: 'readonly', fmt: (v, r) => (r.refTypeCd || '-') + (r.refId ? ' / ' + r.refId : '') },
      { key: '_fail',   label: '실패사유', type: 'readonly', colSpan: 2, fmt: (v, r) => r.failReason || '-' },
      { key: '_content', label: '내용', type: 'readonly', colSpan: 3, fmt: (v, r) => r.content || '-' },
    ];
    columns.alarmDetail = [
      { key: '_channel', label: '채널', type: 'readonly', html: true, fmt: (v, r) => `<span class="badge ${fnChannelBadge(r.channel)}">${r.channel || '-'}</span>` },
      { key: '_to',     label: '수신처', type: 'readonly', fmt: (v, r) => r.sendTo || '-' },
      { key: '_status', label: '결과', type: 'readonly', html: true, fmt: (v, r) => `<span class="badge ${fnHistStatusBadge(r.sendHistStatusCd)}">${r.sendHistStatusCd || '-'}</span>` },
      { key: '_alarmId', label: '알림ID', type: 'readonly', mono: true, fmt: (v, r) => r.alarmId || '-' },
      { key: '_member', label: '회원ID', type: 'readonly', mono: true, fmt: (v, r) => r.memberId || '-' },
      { key: '_user',   label: '사용자ID', type: 'readonly', mono: true, fmt: (v, r) => r.userId || '-' },
      { key: '_date',   label: '발송일시', type: 'readonly', fmt: (v, r) => coUtil.cofYmdHms(r.sendDate || '') || '-' },
      { key: '_error',  label: '오류메시지', type: 'readonly', colSpan: 3, fmt: (v, r) => r.errorMsg || '-' },
    ];

    /* fnRowExpanded — 행 펼침 여부 (조회형 prop) */
    const fnRowExpanded = (r, idx) => isExpanded(fnRowId(r) || idx);
    /* fnRowClickStyle — 펼친 행 배경 강조 */
    const fnRowClickStyle = (r, idx) => isExpanded(fnRowId(r) || idx) ? 'background:#fafbff;' : '';

    /* fnCurDetailCols — 현재 탭 펼침 컬럼 */
    const cfCurDetailCols = computed(() => uiState.activeTab === 'email' ? columns.emailDetail : (uiState.activeTab === 'msg' ? columns.msgDetail : columns.alarmDetail));
    /* cfCurGridCols — 현재 탭 그리드 컬럼 */
    const cfCurGridCols = computed(() => uiState.activeTab === 'email' ? columns.emailGrid : (uiState.activeTab === 'msg' ? columns.msgGrid : columns.alarmGrid));
    /* cfCurRowKey — 현재 탭 행 키 */
    const cfCurRowKey = computed(() => uiState.activeTab === 'alarm' ? 'sendHistId' : 'logId');
    /* cfTabTitle — 현재 탭 제목 */
    const cfTabTitle = computed(() => uiState.activeTab === 'email' ? '메일 발송이력' : (uiState.activeTab === 'msg' ? '메시지(SMS·카카오) 발송이력' : '시스템알림 발송이력'));

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      excelModal, cfExcelDomain, cfExcelAreaNm, cfExcelColumns, buildExcelParams,   // 엑셀 다운로드
      onScrollEnd,                       // 무한 스크롤 (하단 도달 시 다음 100건)
      cofCountText: coUtil.cofCountText, // 하단 건수 문구
      uiState, baseGridPager, tabCounts, tabs, allExpanded, codes,                 // 상태 / 데이터
      columns,                                                                // 컬럼 정의 모음
      handleBtnAction, handleSelectAction, handleGridCellAction,              // dispatch
      cfCurrentList, cfCurDetailCols, cfCurGridCols, cfCurRowKey, cfTabTitle, // computed
      fnRowDetail, fnRowDetailLoading,                                        // 행 펼침 상세
    };
  },
  template: /* html */`
<bo-page title="메시지발송이력"
  desc-summary="메일(syh_send_email_log) / 메시지·카카오(syh_send_msg_log) / 시스템알림(syh_alarm_send_hist) 발송 이력을 조회합니다."
  desc-detail="• 메일: 고객센터 문의접수 등 발송된 이메일 이력 (수신처, 제목, 발송결과) • 메시지: SMS·카카오 알림톡 발송 이력 (채널, 수신번호, 카카오템플릿) • 시스템알림: 관리자 시스템 알림 발송 이력 • 행 클릭 → 발송 내용 상세 펼침 • 기본 조회기간: 최근 1주일.">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :columns="columns.baseSearch" :param="uiState"
      @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')">
      <template #actions-before>
        <template v-if="uiState.activeTab==='msg'">
          <label class="search-label" style="margin-left:4px;">채널</label>
          <select class="form-control" style="width:120px;" v-model="uiState.searchChannel" @change="handleBtnAction('searchParam-list')">
            <option value="">채널 전체</option>
            <option v-for="c in codes.msg_channels" :key="c.codeValue || c.value" :value="c.codeValue || c.value">
              {{ c.codeLabel || c.label }}
            </option>
          </select>
        </template>
      </template>
    </bo-search-area>
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 영역 (탭 + 그리드 + 페이저) ============================ -->
  <bo-container :title="cfTabTitle"
    :count-text="cofCountText(baseGridPager.pageTotalCount, cfCurrentList.length)">
    <template #top>
      <bo-tab-bar :tabs="tabs" :tab="uiState.activeTab" :show-modes="false" bg="#f0fdf4"
        @tab-select="id => handleSelectAction('tabs-select', id)" />
    </template>
    <template #toolbar-actions>
      <button class="btn btn_excel" @click="excelModal.show = true">엑셀</button>
      <span style="font-size:11px;color:#aaa;">행 클릭 시 발송 내용 펼침</span>
      <button class="btn btn-secondary btn-sm" @click="handleBtnAction('sendLogs-toggleExpandAll')">
        {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
      </button>
    </template>
    <bo-grid bare
      :columns="cfCurGridCols" :rows="cfCurrentList" :row-key="cfCurRowKey"
      fit-bottom @scroll-end="onScrollEnd"
      :row-style="(r, idx) => handleGridCellAction('sendLogs-cellClick', 'rowStyle', r, idx)"
      :is-expanded="(r, idx) => handleGridCellAction('sendLogs-cellClick', 'isExpanded', r, idx)">
      <template #row-expand="{ row, colspan }">
        <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
          <div v-if="fnRowDetailLoading(row)" style="font-size:12px;color:#888;padding:4px 2px;">⏳ 상세 정보를 불러오는 중…</div>
          <bo-form-area plain-readonly :columns="cfCurDetailCols" :form="fnRowDetail(row)" :cols="3" readonly label-left compact :show-actions="false">
            <template #emailContent>
              <div v-if="fnRowDetail(row).content" style="max-height:360px;overflow:auto;border:1px solid #e8d8f0;border-radius:6px;padding:10px;background:#fff;font-size:12px;"
                v-html="fnRowDetail(row).content"></div>
              <div v-else style="color:#bbb;font-size:12px;padding:10px;">내용 없음</div>
            </template>
          </bo-form-area>
        </td>
      </template>
    </bo-grid>
    <bo-pager :pager="{ pageTotalCount: baseGridPager.pageTotalCount }"
      :show-pages="false" :loaded-count="cfCurrentList.length" />
  </bo-container>
  <!-- ===== ■. 엑셀 다운로드 모달 (즉시/예약 + 진행중 안내 + 강제취소) ========== -->
  <bo-excel-down-modal :show="excelModal.show" :domain="cfExcelDomain"
    :area-nm="cfExcelAreaNm" :columns="cfExcelColumns" ui-nm="메시지발송이력" :params="buildExcelParams()"
    @close="excelModal.show = false" />
</bo-page>
`,
};
