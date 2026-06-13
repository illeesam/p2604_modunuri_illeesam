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
      activeTab: 'email',
      isPageCodeLoad: false,
      dateRange: '1week',
      dateStart: '',
      dateEnd: '',
      searchValue: '',
      searchResult: '',   // 발송결과 (SUCCESS/FAILED/PENDING)
      searchChannel: '',  // 메시지 탭 채널 (SMS/KAKAO/PUSH)
    });

    const codes = reactive({ date_range_opts: [], send_results: [], msg_channels: [] });

    const baseGridPager = reactive({
      pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [10, 20, 30, 50, 100], pageCond: {},
    });

    const emailLogs = reactive([]);
    const msgLogs   = reactive([]);
    const alarmLogs = reactive([]);
    const tabCounts = reactive({ email: 0, msg: 0, alarm: 0 });

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
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.date_range_opts = codeStore?.sgGetGrpCodes('DATE_RANGE_OPT') || [];
      codes.send_results    = codeStore?.sgGetGrpCodes('SEND_RESULT')    || [];
      codes.msg_channels    = codeStore?.sgGetGrpCodes('MSG_CHANNEL')    || [];
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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

    /* buildSearchParams — 검색 파라미터 빌드 */
    const buildSearchParams = () => {
      const p = {
        pageNo:      baseGridPager.pageNo,
        pageSize:    baseGridPager.pageSize,
        dateType:    'send_date',
        dateStart:   uiState.dateStart  || undefined,
        dateEnd:     uiState.dateEnd    || undefined,
        searchValue: uiState.searchValue || undefined,
      };
      // 발송결과 필터 (3탭 공통)
      if (uiState.searchResult) { p.resultCd = uiState.searchResult; p.status = uiState.searchResult; }
      // 메시지 탭: 채널 필터
      if (uiState.activeTab === 'msg' && uiState.searchChannel) { p.channelCd = uiState.searchChannel; p.typeCd = uiState.searchChannel; }
      return p;
    };

    /* handleSearchList — 현재 탭 목록 조회 */
    const handleSearchList = async () => {
      try {
        const res = await fnCurSvc().getPage(buildSearchParams(), '메시지발송이력', '조회');
        const data = res.data?.data;
        const list = data?.pageList || [];
        const target = uiState.activeTab === 'email' ? emailLogs : (uiState.activeTab === 'msg' ? msgLogs : alarmLogs);
        target.splice(0, target.length, ...list);
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage  = data?.pageTotalPage  || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        tabCounts[uiState.activeTab] = baseGridPager.pageTotalCount;
        coUtil.cofBuildPagerNums(baseGridPager);
        expandedRows.clear(); Object.keys(detailCache).forEach(k => delete detailCache[k]); allExpanded.value = false;
      } catch (err) {
        console.error('[handleSearchList]', err);
        if (showToast) { showToast(err.response?.data?.message || err.message || '조회 오류', 'error', 0); }
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

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
        startKey: 'dateStart', endKey: 'dateEnd',
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
      uiState, baseGridPager, tabCounts, allExpanded, codes,                 // 상태 / 데이터
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
  <bo-container :title="cfTabTitle" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #top>
      <div class="tab-nav" style="margin-bottom:12px">
        <button class="tab-btn" :class="{active:uiState.activeTab==='email'}" @click="handleSelectAction('tabs-select', 'email')">
          📧 메일
          <span class="tab-count">{{ tabCounts.email }}</span>
        </button>
        <button class="tab-btn" :class="{active:uiState.activeTab==='msg'}" @click="handleSelectAction('tabs-select', 'msg')">
          💬 메시지(SMS·카카오)
          <span class="tab-count">{{ tabCounts.msg }}</span>
        </button>
        <button class="tab-btn" :class="{active:uiState.activeTab==='alarm'}" @click="handleSelectAction('tabs-select', 'alarm')">
          🔔 시스템알림
          <span class="tab-count">{{ tabCounts.alarm }}</span>
        </button>
      </div>
    </template>
    <template #toolbar-actions>
      <span style="font-size:11px;color:#aaa;">행 클릭 시 발송 내용 펼침</span>
      <button class="btn btn-secondary btn-xs" @click="handleBtnAction('sendLogs-toggleExpandAll')">
        {{ allExpanded.value ? '전체닫기' : '전체펼치기' }}
      </button>
    </template>
    <bo-grid bare
      :columns="cfCurGridCols" :rows="cfCurrentList" :row-key="cfCurRowKey"
      :row-style="(r, idx) => handleGridCellAction('sendLogs-cellClick', 'rowStyle', r, idx)"
      :is-expanded="(r, idx) => handleGridCellAction('sendLogs-cellClick', 'isExpanded', r, idx)">
      <template #row-expand="{ row, colspan }">
        <td :colspan="colspan" style="background:#f4f6fb;padding:16px 20px;border-top:none;">
          <div v-if="fnRowDetailLoading(row)" style="font-size:12px;color:#888;padding:4px 2px;">⏳ 상세 정보를 불러오는 중…</div>
          <bo-form-area :columns="cfCurDetailCols" :form="fnRowDetail(row)" :cols="3" readonly label-left compact :show-actions="false">
            <template #emailContent>
              <div v-if="fnRowDetail(row).content" style="max-height:360px;overflow:auto;border:1px solid #e8d8f0;border-radius:6px;padding:10px;background:#fff;font-size:12px;"
                v-html="fnRowDetail(row).content"></div>
              <div v-else style="color:#bbb;font-size:12px;padding:10px;">내용 없음</div>
            </template>
          </bo-form-area>
        </td>
      </template>
    </bo-grid>
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('sendLogs-pager-setPage', n)" :on-size-change="() => handleSelectAction('sendLogs-pager-sizeChange')" />
  </bo-container>
</bo-page>
`,
};
