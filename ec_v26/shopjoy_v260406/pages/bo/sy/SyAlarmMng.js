/* ShopJoy Admin - 알림관리 */
window.SyAlarmMng = {
  name: 'SyAlarmMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const alarms = reactive([]);                   // 알림 목록 (메인 그리드 데이터)
    const alarmCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null, sortKey: '', sortDir: 'asc',
    });
    const codes = reactive({ alarm_type: [], alarm_status: [], date_range_opts: [] });
    const SORT_MAP = { nm: { asc: 'alarmTitle asc', desc: 'alarmTitle desc' }, reg: { asc: 'alarmSendDate asc', desc: 'alarmSendDate desc' } };

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회 (표시경로 트리도 전체로)
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.sortKey = ''; uiState.sortDir = 'asc';
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        baseGridPager.pageNo = 1;
        resetDetailToNew();
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 알림 신규 등록 (인라인 패널)
      } else if (cmd === 'alarms-add') {
        return openNew();
      // 알림 목록 엑셀 내보내기
      } else if (cmd === 'alarms-excel') {
        return exportExcel();
      // 상세 인라인 패널 닫기
      } else if (cmd === 'detailPanel-close') {
        return closeDetail();
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      // 그리드 정렬 헤더 클릭
      } else if (cmd === 'alarms-sort') {
        return onSort(param);
      // 페이지 번호 클릭
      } else if (cmd === 'alarms-pager-setPage') {
        return setPage(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyAlarmMng.js : handleSelectAction -> ', cmd, param);
      // 페이지 크기 변경
      if (cmd === 'alarms-pager-sizeChange') {
        return onSizeChange();
      // 좌측 경로 트리 노드 선택 → 우측 목록/상세 초기화 후 경로 기준 재조회
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        baseGridPager.pageNo = 1;
        resetDetailToNew();                  // 알림 상세 패널 초기화(빈 신규 폼 + 선택 해제)
        return handleSearchList();
      // 표시경로 picker 열기 (행 단위)
      } else if (cmd === 'pathModal-open') {
        return openPathPick(param);
      // 표시경로 선택 → 행 pathId 갱신
      } else if (cmd === 'pathModal-pick') {
        return onPathPicked(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 클릭 dispatch. cmd='{영역}-cellClick', e={row,col,colKey,colIndex,rowIndex}.
       e.colKey(클릭 컬럼명) 기준으로 셀별 동작 분기, e.row 행 객체 활용 */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      console.log(' ■■ SyAlarmMng.js : handleGridCellAction -> ', cmd, colKey, row);
      if (cmd === 'alarms-cellClick') {
        // 행 액션 버튼 (colKey='btn_*') — [수정]/[삭제] 등
        if (colKey === 'btn_row_edit')   { return handleLoadDetail(row.alarmId); }
        if (colKey === 'btn_row_delete') { return handleDelete(row); }
        // 보기모드 트리거 컬럼: 제목(link) 셀 + 행번호(__no__) + VIEW_COLS 명시 헤더명
        const VIEW_COLS = ['__no__'];
        if ((e.col && e.col.link) || VIEW_COLS.includes(colKey)) {
          return loadView(row.alarmId);
        }
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyAlarmMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) { return closePathPick(); }
        return onPathPicked(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', typeCd: '', status: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 5, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ===== 표시경로 선택 모달 (sy_path) ===== */
    const pathPickModal = reactive({ show: false, row: null });

    /* ===== 상세 인라인 패널 ===== */
    const detailModal = reactive({   // 인라인 Dtl 패널 상태 (modal_reload_trigger 표준)
      show: true,                    // 상세영역 항상 표시 (진입 시 빈 신규 폼)
      dtlId: '__new__',              // 초기: 신규(빈) 폼. 행 클릭 시 해당 ID 로 전환
      dtlMode: 'edit',               // 'view' | 'edit'
      reloadTrigger: 0,              // 부모→Dtl 재조회 신호 (modal_reload_trigger 표준)
      resetSeq: 0,                   // 취소 시 ++ → :key 재마운트로 상세 폼 초기화
      active: false,                 // 행 선택/신규 시 true → 저장/취소 노출. 초기/취소 시 false → 버튼 숨김
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* getSortParam — 정렬 파라미터 */
    const getSortParam = () => {
      const { sortKey, sortDir } = uiState;
      if (!sortKey || !SORT_MAP[sortKey]) { return {}; }
      return { sort: SORT_MAP[sortKey][sortDir] };
    };

    /* onSort — 정렬 */
    const onSort = (key) => {
      if (uiState.sortKey === key) {
        if (uiState.sortDir === 'asc') { uiState.sortDir = 'desc'; }
        else { uiState.sortKey = ''; uiState.sortDir = 'asc'; }
      } else { uiState.sortKey = key; uiState.sortDir = 'asc'; }
      baseGridPager.pageNo = 1;
      handleSearchList();
    };
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syAlarm.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(alarmCounts).forEach(k => { delete alarmCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) alarmCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };


    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize,
          ...getSortParam(),
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...coUtil.cofOmitEmpty(searchParam),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'alarmTitle,alarmMsg';
        }
        const res = await boApiSvc.syAlarm.getPage(params, '알람관리', '목록조회');
        const data = res.data?.data;
        alarms.splice(0, alarms.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || alarms.length;
        baseGridPager.pageTotalPage = data?.pageTotalPage || Math.ceil(baseGridPager.pageTotalCount / baseGridPager.pageSize) || 1;
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* openPathPick — 표시경로 선택 모달 열기 */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* closePathPick — 표시경로 선택 모달 닫기 */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* onPathPicked — 표시경로 선택 결과 적용 + 즉시 저장
     *   알림목록은 별도 [저장] 버튼이 없어 행의 pathId 가 바뀌면 바로 서버에 반영.
     *   selective update — body 에 pathId 만 담아 다른 컬럼 보존. */
    const onPathPicked = async (pathId) => {
      const row = pathPickModal.row;
      if (!row || !row.alarmId) { return; }
      const prevPathId = row.pathId;
      row.pathId = pathId;
      try {
        await boApiSvc.syAlarm.update(row.alarmId, { pathId }, '알림관리', '표시경로변경');
        showToast?.('표시경로가 저장되었습니다.', 'success');
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[onPathPicked] save failed', err);
        row.pathId = prevPathId;   // 실패 시 롤백
        showToast?.(err.response?.data?.message || '표시경로 저장 실패', 'error', 0);
      }
    };

    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      boUtil.bofApplyDateRange(searchParam);
      baseGridPager.pageNo = 1;
    };

    /* loadView — 인라인 패널 뷰 모드로 열기 (토글) */
    const loadView = (id) => {
      if (detailModal.dtlId === id && detailModal.dtlMode === 'view') {
        resetDetailToNew(); return;
      }
      detailModal.dtlId = id;
      detailModal.dtlMode = 'view';
      detailModal.show = true;
      detailModal.active = true;     // 행 선택 → 저장/취소 노출
      detailModal.reloadTrigger++;
    };

    /* resetDetailToNew — 상세영역을 빈 신규 폼(비활성)으로 초기화 (영역은 항상 표시 유지)
     *   active=false → 저장/취소 등 버튼 숨김 (행 미선택 안내 상태) */
    const resetDetailToNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = false;    // 버튼 숨김
      detailModal.resetSeq++;        // :key 재마운트 → 폼 초기화
    };

    /* handleLoadDetail — 그리드 행 클릭 시 해당 ID 상세 로드 (재클릭 시 신규 폼으로 초기화) */
    const handleLoadDetail = (id) => {
      detailModal.dtlId = id;
      detailModal.dtlMode = 'edit';
      detailModal.show = true;
      detailModal.active = true;     // 행 선택 → 저장/취소 노출
      detailModal.reloadTrigger++;
    };

    /* openNew — 신규 등록 (빈 폼 + 활성 → 저장/취소 노출) */
    const openNew = () => {
      detailModal.show = true;
      detailModal.dtlId = '__new__';
      detailModal.dtlMode = 'edit';
      detailModal.active = true;     // 신규 입력 가능 → 저장/취소 노출
      detailModal.resetSeq++;
    };

    /* closeDetail — 상세 닫기 = 빈 신규 폼(비활성)으로 초기화 (영역 유지) */
    const closeDetail = () => { resetDetailToNew(); };

    /* inlineNavigate — 인라인 Dtl 의 navigate 콜백 */
    const inlineNavigate = (pg, opts = {}) => {
      if (pg === 'syAlarmMng') {
        /* 저장 완료 등: 영역은 유지하고 빈 신규 폼으로 초기화 */
        if (opts.reload) { handleSearchList('RELOAD'); }
        resetDetailToNew();
        return;
      }
      /* 취소: 패널은 그대로 두고 상세영역만 빈 신규 폼으로 초기화 */
      if (pg === '__cancelEdit__') { resetDetailToNew(); return; }
      if (pg === '__switchToEdit__') { detailModal.dtlMode = 'edit'; return; }
      props.navigate(pg, opts);
    };

    /* setPage — 페이지 번호 변경 */
    const setPage = n => { if (n >= 1 && n <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = () => { baseGridPager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* handleDelete — 삭제 */
    const handleDelete = async (a) => {
      const ok = await showConfirm('삭제', `[${a.alarmTitle}]을 삭제하시겠습니까?`);
      if (!ok) { return; }
      const idx = alarms.findIndex(x => x.alarmId === a.alarmId);
      if (idx !== -1) { alarms.splice(idx, 1); }
      if (detailModal.dtlId === a.alarmId) { resetDetailToNew(); }
      try {
        const res = await boApiSvc.syAlarm.remove(a.alarmId, '알람관리', '삭제');
        if (showToast) { showToast('삭제되었습니다.', 'success'); }
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(alarms, [
      { label: 'ID', key: 'alarmId' }, { label: '유형', key: 'alarmTypeCd' },
      { label: '채널', key: 'channelCd' }, { label: '제목', key: 'alarmTitle' },
      { label: '메시지', key: 'alarmMsg' }, { label: '상태', key: 'alarmStatusCd' },
      { label: '발송일', key: 'alarmSendDate' },
    ], '알림목록.csv');


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.alarm_type = codeStore.sgGetGrpCodes('ALARM_TYPE');
      codes.alarm_status = codeStore.sgGetGrpCodes('ALARM_STATUS');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* 알람 fnStatusBadge */
    const _ALARM_STATUS_FB = { '발송완료': 'badge-green', '예약': 'badge-blue', '실패': 'badge-red', '임시': 'badge-gray' };
    /* fnStatusBadge — 상태 배지 */
    const fnStatusBadge = s => coUtil.cofCodeBadge('ALARM_STATUS', s, _ALARM_STATUS_FB[s] || 'badge-gray');

    /* 알람 fnTypeBadge */
    const _ALARM_TYPE_FB = { '푸시': 'badge-blue', '이메일': 'badge-orange', 'SMS': 'badge-green', '인앱': 'badge-gray' };
    /* fnTypeBadge — 유형 배지 */
    const fnTypeBadge = t => coUtil.cofCodeBadge('ALARM_TYPE', t, _ALARM_TYPE_FB[t] || 'badge-gray');

    /* 알람 fnTargetBadge */
    const _ALARM_TARGET_TYPE_FB = { '전체': 'badge-red', 'VIP': 'badge-orange', '우수': 'badge-blue', '일반': 'badge-gray' };
    /* fnTargetBadge — 대상 배지 */
    const fnTargetBadge = t => coUtil.cofCodeBadge('ALARM_TARGET_TYPE', t, _ALARM_TARGET_TYPE_FB[t] || 'badge-gray');

    /* fnRowStyle — 행 스타일 (선택 행 강조) */
    const fnRowStyle = (a) => detailModal.dtlId === a.alarmId ? 'background:#fff8f9;' : '';

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfDetailEditId = computed(() => detailModal.dtlId === '__new__' ? null : detailModal.dtlId);

    const cfDetailKey = computed(() => `${detailModal.dtlId}_${detailModal.dtlMode}_${detailModal.resetSeq}`);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'alarmTitle', label: '제목' },
          { value: 'alarmMsg',   label: '메시지' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'typeCd', type: 'select', label: '유형', options: () => codes.alarm_type, nullLabel: '유형 전체' },
      { key: 'status', type: 'select', label: '상태', options: () => codes.alarm_status, nullLabel: '상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '발송일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',        label: '표시경로', style: 'width:170px;max-width:170px;',
        pathLabelOpen: { label: pathLabel, open: (row) => handleSelectAction('pathModal-open', row),
          clear: (row) => { pathPickModal.row = row; onPathPicked(null); }, placeholder: '경로 선택...' } },
      { key: 'alarmTypeCd',   label: '유형', badge: (row) => fnTypeBadge(row.alarmTypeCd) },
      { key: 'alarmTitle',    label: '제목', sortKey: 'nm', link: true,
        cellInnerStyle: (v) => detailModal.dtlId === v ? 'color:#e8587a;font-weight:700;' : '' },
      { key: 'alarmMsg',      label: '메시지', cellStyle: 'max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' },
      { key: 'targetTypeCd',  label: '대상', badge: (row) => fnTargetBadge(row.targetTypeCd) },
      { key: 'alarmSendDate', label: '발송일', fmt: (v) => v || '-' },
      { key: 'alarmStatusCd', label: '상태', badge: (row) => fnStatusBadge(row.alarmStatusCd) },
      { key: 'siteNm',        label: '사이트명', cellStyle: 'color:#2563eb;', fmt: () => cfSiteNm.value },
      { key: 'regDate',       label: '등록일', sortKey: 'reg',  fmt: (v) => coUtil.cofYmd(v) || '-' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      alarms, uiState, alarmCounts, searchParam, baseGridPager, detailModal, pathPickModal,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                       // dispatch (모든 이벤트 / 액션 라우팅)
      cfDetailEditId, cfDetailKey,                        // computed
      fnRowStyle, // 헬퍼
      inlineNavigate, showToast, showConfirm, // Dtl props (closure 필요)
    };
  },
  template: /* html */`
<bo-page title="알림관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 영역 ============================================= -->
  <div class="bo-2col">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-container bare>
      <bo-path-tree-card biz-cd="sy_alarm" title="표시경로" :show-biz-cd="false" :counts="alarmCounts"
        :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■.■. 목록 그리드 ============================================ -->
    <bo-container title="알림목록" :count-text="baseGridPager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <div style="display:flex;gap:6px;">
          <button class="btn btn_excel" @click="handleBtnAction('alarms-excel')">
            📥 엑셀
          </button>
          <button class="btn btn_new" @click="handleBtnAction('alarms-add')">
            + 신규
          </button>
        </div>
      </template>
      <bo-grid bare
        :columns="columns.baseGrid" :rows="alarms" row-key="alarmId" :selected-key="detailModal.dtlId"
        :sort-state="uiState" :row-style="fnRowStyle"
        @sort="key => handleBtnAction('alarms-sort', key)"
        grid-id="alarms-cellClick" @cell-click="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <template #head-actions>
          <th style="text-align:right">
            관리
          </th>
        </template>
        <template #row-actions="{ row, gridId }">
          <td style="white-space:nowrap;">
            <div class="actions" style="white-space:nowrap;flex-wrap:nowrap;">
              <button class="btn btn_row_edit" @click.stop="handleGridCellAction(gridId, 'btn_row_edit', row)">
                수정
              </button>
              <button class="btn btn_row_delete" @click.stop="handleGridCellAction(gridId, 'btn_row_delete', row)">
                삭제
              </button>
            </div>
          </td>
        </template>
      </bo-grid>
      <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('alarms-pager-setPage', n)" :on-size-change="() => handleSelectAction('alarms-pager-sizeChange')" />
    </bo-container>
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
  <!-- ===== ■. 상세 인라인 패널 (.bo-2col 바깥 → 전체 폭, 항상 표시) ===================== -->
  <sy-alarm-dtl :key="cfDetailKey" :navigate="inlineNavigate" :dtl-id="cfDetailEditId"
    :dtl-mode="detailModal.dtlMode === 'edit' ? (cfDetailEditId ? 'edit' : 'new') : 'view'"
    :active="detailModal.active"
    :reload-trigger="detailModal.reloadTrigger" />
  <!-- ===== ■. 표시경로 선택 모달 ========================================== -->
  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_alarm" :value="pathPickModal.row ? pathPickModal.row.pathId : null" modal-name="path-pick" :on-callback="fnCallbackModal" />
</bo-page>
`,
};
