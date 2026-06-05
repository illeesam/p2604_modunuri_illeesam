/* ShopJoy Admin - 배치스케즐관리 (CRUD 그리드) */
window.SyBatchMng = {
  name: 'SyBatchMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달

    const batches = reactive([]);                  // 배치 목록 (서버 raw 데이터)
    const batchCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      checkAll: false, dragMoved: false, loading: false, error: null, isPageCodeLoad: false,
      selectedPath: null, focusedIdx: null,
    });
    const codes = reactive({ batch_status: [], active_statuses: [], batch_run_statuses: [], date_range_opts: [] });

    const histReloadTrigger = ref(0);              // 배치 실행이력(SyBatchHist) 재조회/초기화 신호 (++ 로 증가)
    const histFilterBatchId = ref(null);           // 배치 실행이력 필터 배치ID (null=전체, 값=해당 배치만)

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBatchMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        resetSelectionAndHist();              // 선택정보 + 배치 실행이력 초기화
        return handleSearchList('DEFAULT');
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        return handleDateRangeChange();
      // 배치 그리드 저장
      } else if (cmd === 'batches-save') {
        return handleSave();
      // 배치 그리드 행 추가
      } else if (cmd === 'batches-add') {
        return addRow();
      // 체크된 배치 일괄 삭제
      } else if (cmd === 'batches-deleteChecked') {
        return deleteRows();
      // 체크된 배치 일괄 취소
      } else if (cmd === 'batches-cancelChecked') {
        return cancelChecked();
      // 배치 목록 엑셀 내보내기
      } else if (cmd === 'batches-excel') {
        return exportExcel();
      // Cron 편집 모달 닫기
      } else if (cmd === 'cronModal-close') {
        cronModal.show = false;
        return;
      // 표시경로 선택 모달 닫기
      } else if (cmd === 'pathModal-close') {
        return closePathPick();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyBatchMng.js : handleSelectAction -> ', cmd, param);
      // 배치 그리드 행 클릭(포커스) → focusedIdx 갱신 + 해당 배치 실행이력 표시
      if (cmd === 'batches-rowSelect') {
        uiState.focusedIdx = param;
        return onBatchRowSelect(param);
      // 배치 그리드 행 삭제 마킹
      } else if (cmd === 'batches-rowDelete') {
        return deleteRow(param);
      // 배치 그리드 행 변경 취소
      } else if (cmd === 'batches-rowCancel') {
        return cancelRow(param);
      } else if (cmd === 'batches-rowRunNow') {
        return runNow(param);
      // Cron 편집 모달 열기
      } else if (cmd === 'cronModal-open') {
        return openCronPicker(param);
      // Cron 편집 모달에서 적용
      } else if (cmd === 'cronModal-apply') {
        return onCronApply(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링 + 선택정보/실행이력 초기화
      } else if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        resetSelectionAndHist();              // 선택정보 + 배치 실행이력 초기화
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

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'batches-cellChange') {
        return onCellChange(row);
      // 배치 즉시 실행
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyBatchMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'path-pick') {
        if (result == null) { return closePathPick(); }
        return onPathPicked(result);
      } else if (cmd === 'cron') {
        if (result == null) {
            cronModal.show = false;
            return;
        }
          return onCronApply(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', status: '', runStatus: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== CRUD 그리드 ===== */
    const gridRows = reactive([]);                 // 편집 상태 포함 그리드 행
    let _tempId = -1;                              // 신규 행 임시 ID (음수)
    const EDIT_FIELDS = ['batchNm', 'batchCode', 'cronExpr', 'batchStatusCd', 'batchDesc'];
    const dragSrc = ref(null);                     // 드래그 소스 인덱스

    /* ===== 표시경로 선택 모달 (sy_path) ===== */
    const pathPickModal = reactive({ show: false, row: null });

    /* ===== Cron 편집 모달 ===== */
    const cronModal = reactive({ show: false, rowIdx: null, value: '0 0 * * *' });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syBatch.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(batchCounts).forEach(k => { delete batchCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) batchCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* resetSelectionAndHist — 좌측 트리/초기화 시 배치목록 선택정보 + 배치 실행이력(전체) 초기화 */
    const resetSelectionAndHist = () => {
      uiState.focusedIdx = null;             // 배치목록 선택(포커스) 행 해제 → 파란 테두리 제거
      uiState.checkAll = false;              // 헤더 체크올 해제
      gridRows.forEach(r => { r._row_check = false; }); // 행 체크 일괄 해제
      histFilterBatchId.value = null;        // 배치 실행이력 필터 해제 → 전체 이력 표시
      histReloadTrigger.value++;             // 배치 실행이력 초기화/재조회 신호
    };

    /* onBatchRowSelect — 배치목록 행 클릭(포커스) → 해당 배치 실행이력만 표시 */
    const onBatchRowSelect = (idx) => {
      const row = (idx != null && idx >= 0) ? gridRows[idx] : null;
      // 신규(미저장, batchId<=0) 행은 이력이 없으므로 전체로 둠
      histFilterBatchId.value = (row && Number(row.batchId) > 0) ? row.batchId : null;
      histReloadTrigger.value++;             // 배치 실행이력 재조회 신호
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBatch.getPage({ pageNo: 1, pageSize: 10000, ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}) }, '배치관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        batches.splice(0, batches.length, ...list);
        gridRows.splice(0);
        list.forEach(b => gridRows.push(makeRow(b)));
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

    /* onPathPicked — 표시경로 선택 결과 적용 */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') { row._row_status = 'U'; }
      }
    };

    /* pathLabel — 경로 라벨 변환 */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));

    /* handleDateRangeChange — 기간 옵션 변경 */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
    };

    /* makeRow — 행 생성 */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N', _row_check: false,
      _row_org: { batchNm: b.batchNm, batchCode: b.batchCode, cronExpr: b.cronExpr, batchStatusCd: b.batchStatusCd, batchDesc: b.batchDesc },
    });

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const refRow = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        batchId: _tempId--, batchNm: '', batchCode: '',
        cronExpr: refRow ? refRow.cronExpr : '0 0 * * *',
        batchStatusCd: '활성', batchDesc: '',
        batchLastRun: '-', batchNextRun: '-', batchRunCount: 0, batchRunStatus: '대기',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.batchId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.batchId) || row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) { continue; }
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.batchNm || !r.batchCode || !r.cronExpr) { showToast('배치명, 배치코드, Cron 표현식은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syBatch.saveList('base', saveRows, '배치관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* cfShowRunNow — 즉시실행 버튼 노출 여부 */
    const cfShowRunNow = (row) => row._row_status !== 'I' && row._row_status !== 'D';

    /* runNow — 즉시 실행 */
    const runNow = async (row) => {
      const ok = await showConfirm('즉시 실행', `[${row.batchNm}] 배치를 즉시 실행하시겠습니까?`);
      if (!ok) { return; }
      const src = batches.find(x => x.batchId === row.batchId);
      row.batchRunStatus = '실행중';
      if (src) { src.batchRunStatus = '실행중'; }
      showToast('배치 실행을 시작했습니다.');
      setTimeout(() => {
        const now = new Date().toLocaleString('ko-KR').slice(0, 16);
        row.batchRunStatus = '성공'; row.batchLastRun = now; row.batchRunCount = (row.batchRunCount || 0) + 1;
        if (src) { src.batchRunStatus = '성공'; src.batchLastRun = now; src.batchRunCount = row.batchRunCount; }
      }, 1500);
    };

    /* openCronPicker — Cron 편집 모달 열기 */
    const openCronPicker = (realIdx) => {
      const row = gridRows[realIdx];
      if (!row || row._row_status === 'D') { return; }
      cronModal.rowIdx = realIdx;
      cronModal.value  = row.cronExpr || '0 0 * * *';
      cronModal.show   = true;
    };

    /* onCronApply — Cron 편집 모달 적용 */
    const onCronApply = (cronExpr) => {
      if (cronModal.rowIdx !== null) {
        const row = gridRows[cronModal.rowIdx];
        if (row) { row.cronExpr = cronExpr; onCellChange(row); }
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [
        { label: 'ID', key: 'batchId' }, { label: '배치명', key: 'batchNm' },
        { label: '배치코드', key: 'batchCode' }, { label: 'Cron', key: 'cronExpr' },
        { label: '최근실행', key: 'batchLastRun' }, { label: '실행횟수', key: 'batchRunCount' },
        { label: '활성', key: 'batchStatusCd' }, { label: '실행상태', key: 'batchRunStatus' },
        { label: '설명', key: 'batchDesc' },
      ],
      '배치목록.csv'
    );

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.batch_status = codeStore.sgGetGrpCodes('BATCH_STATUS');
      codes.active_statuses = codeStore.sgGetGrpCodes('ACTIVE_STATUS');
      codes.batch_run_statuses = codeStore.sgGetGrpCodes('BATCH_RUN_STATUS');
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
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'batchNm',   label: '배치명' },
          { value: 'batchCode', label: '배치코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'status', type: 'select', label: '활성여부', options: () => codes.active_statuses, nullLabel: '활성여부 전체' },
      { key: 'runStatus', type: 'select', label: '실행상태', options: () => codes.batch_run_statuses, nullLabel: '실행상태 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',        label: '표시경로',     style: 'width:170px;max-width:170px;',
        pathLabelOpen: { label: pathLabel, open: (row) => handleSelectAction('pathModal-open', row), placeholder: '경로 선택...' } },
      { key: 'batchNm',       label: '배치명',       style: 'min-width:120px;', edit: 'text', placeholder: '배치명' },
      { key: 'batchCode',     label: '배치코드',     style: 'min-width:160px;', edit: 'text', mono: true, placeholder: 'BATCH_CODE' },
      { key: 'cronExpr',      label: 'Cron 표현식',  style: 'min-width:170px;' },
      { key: 'batchStatusCd', label: '활성',         style: 'width:62px;',
        edit: 'select', options: () => codes.active_statuses },
      { key: 'batchDesc',     label: '설명',         style: 'min-width:130px;', edit: 'text', placeholder: '설명' },
      { key: 'batchLastRun',  label: '최근실행',     style: 'width:110px;', align: 'center',
        cellStyle: 'font-size:11px;color:#555;white-space:nowrap;' },
      { key: 'batchRunStatus',label: '실행상태',     style: 'width:72px;', align: 'center',
        badge: (row) => 'badge-xs ' + (({ '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' }[row.batchRunStatus]) || 'badge-gray') },
      { key: 'siteNm',        label: '사이트',       style: 'width:55px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      batches, uiState, batchCounts, codes, searchParam, gridRows, pathPickModal, cronModal, histReloadTrigger, histFilterBatchId, // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                               // dispatch (모든 이벤트 / 액션 라우팅)
      cfSiteNm, cfShowRunNow,                                                            // computed / 헬퍼
    };
  },
  template: /* html */`
<bo-page title="배치스케즐관리">
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
      <bo-path-tree-card biz-cd="sy_batch" title="표시경로" :show-biz-cd="false" :counts="batchCounts"
        :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <bo-container bare>
      <!-- ===== ■.■.■. CRUD 그리드 ============================================ -->
      <bo-grid-crud
        :columns="columns.baseGrid" :rows="gridRows" row-key="batchId"
        list-title="배치목록" :show-export="true"
        :selected-key="histFilterBatchId"
        :focusedIdx="uiState.focusedIdx" @update:focusedIdx="idx => handleSelectAction('batches-rowSelect', idx)"
        v-model:checkAll="uiState.checkAll"
        @add="handleBtnAction('batches-add')" @save="handleBtnAction('batches-save')"
        @delete-checked="handleBtnAction('batches-deleteChecked')" @cancel-checked="handleBtnAction('batches-cancelChecked')"
        grid-id="batches-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" @export="handleBtnAction('batches-excel')">
        <template #cell-cronExpr="{ row, idx }">
          <td>
            <div style="display:flex;align-items:center;gap:3px;">
              <input class="grid-input grid-mono" v-model="row.cronExpr" :disabled="row._row_status==='D'" @input="handleGridCellAction('batches-cellChange', null, row)" placeholder="0 0 * * *" style="flex:1;color:#2563eb;min-width:0;" />
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs" style="flex-shrink:0;padding:2px 5px;font-size:11px;" title="Cron 편집" @click.stop="handleSelectAction('cronModal-open', idx)">
                🕐
              </button>
            </div>
          </td>
        </template>
        <template #row-actions="{ row, idx }">
          <span style="display:inline-flex;flex-wrap:nowrap;align-items:center;gap:3px;white-space:nowrap;">
            <button v-if="cfShowRunNow(row)" class="btn btn-secondary btn-xs" title="즉시실행" @click.stop="handleSelectAction('batches-rowRunNow', row)">
              ▶
            </button>
            <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('batches-rowCancel', idx)" @delete="handleSelectAction('batches-rowDelete', idx)" />
          </span>
        </template>
      </bo-grid-crud>
      <!-- ===== ■.■.■. Cron 편집 모달 (BoCronModal 컴포넌트) ======================= -->
      <bo-cron-modal :show="cronModal.show" :value="cronModal.value"
        @apply="expr => handleSelectAction('cronModal-apply', expr)"
        @close="handleBtnAction('cronModal-close')" />
    </bo-container>
    <!-- ===== □.□. 경로 트리 ================================================= -->
  </div>
  <!-- ===== □. 좌 트리 + 우 영역 ============================================= -->
  <!-- ===== ■. 배치 실행이력 (전체 폭) ========================================== -->
  <bo-container bare>
    <div class="card" style="margin-top:12px;width:100%;">
      <sy-batch-hist :reload-trigger="histReloadTrigger" :filter-batch-id="histFilterBatchId" />
    </div>
  </bo-container>
  <!-- ===== □. 배치 실행이력 (전체 폭) ========================================== -->
  <!-- ===== ■. 표시경로 선택 모달 ============================================= -->
  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_batch" :value="pathPickModal.row ? pathPickModal.row.pathId : null" modal-name="path-pick" :on-callback="fnCallbackModal" />
  <!-- ===== □. 표시경로 선택 모달 ============================================= -->
</bo-page>
`,
};
