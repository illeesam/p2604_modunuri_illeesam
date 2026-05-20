/* ShopJoy Admin - 배치스케즐관리 (CRUD 그리드) */
window.SyBatchMng = {
  name: 'SyBatchMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const batches = reactive([]);
    const uiState = reactive({ checkAll: false, dragMoved: false, loading: false, error: null, isPageCodeLoad: false, selectedPath: null, focusedIdx: null});
    const codes = reactive({ batch_status: [], active_statuses: [], batch_run_statuses: [], date_range_opts: [] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syBatch.getPage({ pageNo: 1, pageSize: 10000, ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}) }, '배치관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        batches.splice(0, batches.length, ...list);
        gridRows.splice(0);
        list.forEach(b => gridRows.push(makeRow(b)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* -- 표시경로 선택 모달 (sy_path) -- */
    const pathPickModal = reactive({ show: false, row: null });

    /* 배치 openPathPick */
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };

    /* 배치 closePathPick */
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    /* 배치 onPathPicked */
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };

    /* 배치 pathLabel */
    const pathLabel = (id) => boUtil.bofGetPathLabel(id) || (id == null ? '' : ('#' + id));


    /* -- 좌측 표시경로 트리 -- */
    const selectNode = (path) => { uiState.selectedPath = path; handleSearchList(); };


    /* 배치 fnLoadCodes */
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
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    /* -- 검색 -- */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', status: '', runStatus: '', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* 배치 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
    };
    /* -- CRUD 그리드 -- */
    const gridRows = reactive([]);
    let _tempId = -1;

    const EDIT_FIELDS = ['batchNm', 'batchCode', 'cronExpr', 'batchStatusCd', 'batchDesc'];

    /* 배치 makeRow */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N', _row_check: false,
      _row_org: { batchNm: b.batchNm, batchCode: b.batchCode, cronExpr: b.cronExpr, batchStatusCd: b.batchStatusCd, batchDesc: b.batchDesc },
    });


    /* 배치 목록조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* 배치 onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      onSearch();
    };

    /* 배치 setFocused */
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    /* 배치 onCellChange */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* 배치 addRow */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        batchId: _tempId--, batchNm: '', batchCode: '',
        cronExpr: ref ? ref.cronExpr : '0 0 * * *',
        batchStatusCd: '활성', batchDesc: '',
        batchLastRun: '-', batchNextRun: '-', batchRunCount: 0, batchRunStatus: '대기',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* 배치 deleteRow */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    /* 배치 cancelRow */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    /* 배치 cancelChecked */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.batchId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.batchId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* 배치 deleteRows */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* 배치 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.batchNm || !r.batchCode || !r.cronExpr) { showToast('배치명, 배치코드, Cron 표현식은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syBatch.saveList(saveRows, '배치관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* -- 즉시 실행 -- */
    const runNow = async (row) => {
      const ok = await showConfirm('즉시 실행', `[${row.batchNm}] 배치를 즉시 실행하시겠습니까?`);
      if (!ok) return;
      const src = batches.find(x => x.batchId === row.batchId);
      row.batchRunStatus = '실행중';
      if (src) src.batchRunStatus = '실행중';
      showToast('배치 실행을 시작했습니다.');
      setTimeout(() => {
        const now = new Date().toLocaleString('ko-KR').slice(0, 16);
        row.batchRunStatus = '성공'; row.batchLastRun = now; row.batchRunCount = (row.batchRunCount || 0) + 1;
        if (src) { src.batchRunStatus = '성공'; src.batchLastRun = now; src.batchRunCount = row.batchRunCount; }
      }, 1500);
    };

    /* -- Cron 편집 모달 (BoCronModal 컴포넌트로 위임) -- */
    const cronModal = reactive({ show: false, rowIdx: null, value: '0 0 * * *' });

    /* 배치 openCronPicker — 행의 cronExpr 로 모달 오픈 */
    const openCronPicker = (realIdx) => {
      const row = gridRows[realIdx];
      if (!row || row._row_status === 'D') return;
      cronModal.rowIdx = realIdx;
      cronModal.value  = row.cronExpr || '0 0 * * *';
      cronModal.show   = true;
    };

    /* 배치 onCronApply — BoCronModal @apply(cronExpr) */
    const onCronApply = (cronExpr) => {
      if (cronModal.rowIdx !== null) {
        const row = gridRows[cronModal.rowIdx];
        if (row) { row.cronExpr = cronExpr; onCellChange(row); }
      }
    };

    /* -- 드래그 -- */
    const onDragStart = (idx) => { dragSrc.value = idx; uiState.dragMoved = false; };

    /* 배치 onDragOver */
    const onDragOver = (e, idx) => {
      e.preventDefault();
      if (dragSrc.value === null || dragSrc.value === idx) return;
      const moved = gridRows.splice(dragSrc.value, 1)[0];
      gridRows.splice(idx, 0, moved);
      dragSrc.value = idx; uiState.dragMoved = true;
    };

    /* 배치 onDragEnd */
    const onDragEnd = () => { if (uiState.dragMoved) showToast('정렬정보가 저장되었습니다.'); dragSrc.value = null; uiState.dragMoved = false; };

    /* -- 체크 -- */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* 배치 fnStatusBadge */
    const _USE_YN_FB = { '활성': 'badge-green', '비활성': 'badge-gray' };
    const fnStatusBadge  = s => coUtil.cofCodeBadge('USE_YN', s, _USE_YN_FB[s] || 'badge-gray');

    /* 배치 fnRunBadge */
    const fnRunBadge     = s => ({ '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' }[s] || 'badge-gray');

    /* 배치 fnStatusClass */
    const fnStatusClass  = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const cfSiteNm     = computed(() => boUtil.bofGetSiteNm());


    /* 배치 exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'batchId'},{label:'배치명',key:'batchNm'},{label:'배치코드',key:'batchCode'},{label:'Cron',key:'cronExpr'},{label:'최근실행',key:'batchLastRun'},{label:'실행횟수',key:'batchRunCount'},{label:'활성',key:'batchStatusCd'},{label:'실행상태',key:'batchRunStatus'},{label:'설명',key:'batchDesc'}],
      '배치목록.csv'
    );
    /* 트리 path 변경 시 자동 fetch */



    /* BoGridCrud 컬럼 정의 (특수셀은 cell/head 슬롯으로 override) */
    const baseGridColumns = [
      { key: 'pathId',        label: '표시경로',     style: 'min-width:140px;',
        pathLabelOpen: { label: pathLabel, open: openPathPick, placeholder: '경로 선택...' } },
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

    // -- return ---------------------------------------------------------------

    return { batches, uiState, codes, pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      selectNode, baseGridColumns,
      cfSiteNm, searchParam, handleDateRangeChange,
      gridRows,
      setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave, runNow,
      cronModal, openCronPicker, onCronApply,
      onDragStart, onDragOver, onDragEnd,
      uiState, toggleCheckAll, fnStatusBadge, fnRunBadge, fnStatusClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">배치스케즐관리</div>  <!-- -- 검색 ------------------------------------------------------------- -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'batchNm',   label: '배치명' },
          { value: 'batchCode', label: '배치코드' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
      <select v-model="searchParam.status">
        <option value="">활성여부 전체</option>
        <option v-for="c in codes.active_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <select v-model="searchParam.runStatus">
        <option value="">실행상태 전체</option>
        <option v-for="c in codes.batch_run_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in codes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
    </bo-search-area>
  </div>

  




  <!-- -- 좌 트리 + 우 영역 ---------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_batch" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <div>
<!-- -- CRUD 그리드 --------------------------------------------------------- -->
  <bo-grid-crud
    :columns="baseGridColumns" :rows="gridRows" row-key="batchId"
    list-title="배치목록" :show-export="true"
    v-model:focusedIdx="uiState.focusedIdx"
    v-model:checkAll="uiState.checkAll"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @cell-change="onCellChange" @export="exportExcel">


    <template #cell-cronExpr="{ row, idx }">
      <td>
        <div style="display:flex;align-items:center;gap:3px;">
          <input class="grid-input grid-mono" v-model="row.cronExpr" :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="0 0 * * *" style="flex:1;color:#2563eb;min-width:0;" />
          <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs" style="flex-shrink:0;padding:2px 5px;font-size:11px;" title="Cron 편집" @click.stop="openCronPicker(idx)">🕐</button>
        </div>
      </td>
    </template>

    <template #row-actions="{ row, idx }">
      <button v-if="row._row_status!=='I' && row._row_status!=='D'" class="btn btn-secondary btn-xs" title="즉시실행" @click.stop="runNow(row)">▶</button>
      <button v-if="['U','I','D'].includes(row._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
      <button v-if="['N','U'].includes(row._row_status)" class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
    </template>
  </bo-grid-crud>

  <!-- -- Cron 편집 모달 (BoCronModal 컴포넌트) -- -->
  <bo-cron-modal :show="cronModal.show" :value="cronModal.value"
    @apply="onCronApply" @close="cronModal.show=false" />
</div>

  <!-- -- 배치 실행이력 (grid 직접 자식 → 전체 폭) -- -->
  <div class="card" style="margin-top:4px;">
    <sy-batch-hist />
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_batch"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
