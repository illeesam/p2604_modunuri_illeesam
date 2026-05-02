/* ShopJoy Admin - 공통코드관리 (CRUD 그리드) */
window.SyCodeMng = {
  name: 'SyCodeMng',
  props: ['navigate', 'showToast', 'showConfirm'],
  setup(props) {
    const { reactive, computed, watch, onMounted } = Vue;

    // ── 선언부 ────────────────────────────────────────────────────────────────

    const pageCodes   = reactive({ use_yn: [], date_range_opts: [] });
    const uiState     = reactive({
      checkAll: false, dragMoved: false, loading: false,
      isPageCodeLoad: false, selectedGrp: '', grpSelectedPath: '',
      focusedIdx: null, selectedCodeId: null, dragSrc: null, activeCodeTab: '일반',
      isTreeType: false,
      grpDirtyCount: 0,
    });

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      const threeYearsAgo = thisYear - 3;
      return {
        kw: '', grp: '', useYn: 'Y', dateRange: '',
        dateStart: `${threeYearsAgo}-01-01`,
        dateEnd:   `${thisYear}-12-31`,
      };
    };

    const searchParam    = reactive(_initSearchParam());
    const searchParamOrg = reactive(_initSearchParam());
    const gridRows       = reactive([]);    // 현재 선택 그룹 코드 행
    const grpRows        = reactive([]);    // 코드그룹 CRUD 그리드 전체 행
    const visibleGrpRows = reactive([]);    // 필터 적용된 그룹 행 (템플릿 직접 바인딩)
    const pathPickModal  = reactive({ show: false, row: null });
    const treeExpanded   = reactive(new Set());
    const parentOpts     = reactive([]);
    const flatTree       = reactive([]);

    const siteNm = boUtil.getSiteNm();   // 매 행마다 호출 방지용 상수 캐시

    let _tempId    = -1;
    let _grpTempId = -1;
    const EDIT_FIELDS = ['codeGrp', 'codeLabel', 'codeValue', 'sortOrd', 'useYn', 'remark', 'parentCodeValue'];
    const GRP_FIELDS  = ['codeGrp', 'grpNm', 'pathId', 'description', 'type', 'useYn'];

    const codeTotal = () => gridRows.filter(r => r._row_status !== 'D').length;
    const grpCount  = () => visibleGrpRows.filter(r => r._row_status !== 'D').length;

    // grpDirtyCount: grpRows 변경 시 갱신 (템플릿에서 함수 반복 호출 대신 값 참조)
    const syncGrpDirty = () => { uiState.grpDirtyCount = grpRows.filter(r => r._row_status !== 'N').length; };

    // ── 트리 갱신 ─────────────────────────────────────────────────────────────

    const rebuildTree = () => {
      parentOpts.splice(0);
      if (uiState.isTreeType) {
        const visible = gridRows.filter(r => r._row_status !== 'D');
        const byValue = new Map(visible.map(c => [c.codeValue, c]));
        visible.forEach(r => {
          let depth = 0, cur = r.parentCodeValue ? byValue.get(r.parentCodeValue) : null;
          while (cur) { depth++; cur = cur.parentCodeValue ? byValue.get(cur.parentCodeValue) : null; }
          parentOpts.push({
            label: `${r.codeLabel}(${r.codeValue})`,
            value: r.codeValue,
            displayLabel: '　'.repeat(depth) + `${r.codeLabel}(${r.codeValue})`,
          });
        });
      }
      flatTree.splice(0);
      if (!uiState.selectedGrp) return;
      const visible = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(visible.map(c => [c.codeValue, c]));
      const childMap = new Map();
      visible.forEach(c => {
        const pv = c.parentCodeValue || null;
        if (!pv || !byValue.has(pv)) return;
        if (!childMap.has(pv)) childMap.set(pv, []);
        childMap.get(pv).push(c);
      });
      const roots = visible.filter(c => !c.parentCodeValue || !byValue.has(c.parentCodeValue));
      const build = (c) => ({ value: c.codeValue, label: c.codeLabel, code: c, children: (childMap.get(c.codeValue) || []).map(build) });
      const walk = (node, depth) => {
        flatTree.push({ node, depth, isExpanded: treeExpanded.has(node.value) });
        if (treeExpanded.has(node.value)) node.children.forEach(child => walk(child, depth + 1));
      };
      roots.map(build).forEach(node => walk(node, 0));
    };

    // ── watch ─────────────────────────────────────────────────────────────────

    // isAppReady: Pinia store 준비 완료 시 pageCodes 로드 (computed 제거 → store 직접 확인)
    const checkAndLoadCodes = () => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      if (!initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad)
        fnLoadCodes();
    };
    watch(() => window.sfGetBoCodeStore?.()?.svCodes?.length, checkAndLoadCodes);

    watch(() => uiState.grpSelectedPath, () => { uiState.selectedGrp = ''; handleLoadAllGroups(); });
    watch(() => uiState.selectedGrp, () => { handleSearchList(); });

    // ── 초기화 ────────────────────────────────────────────────────────────────

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (codeStore?.snGetGrpCodes) {
          pageCodes.use_yn = await codeStore.snGetGrpCodes('USE_YN') || [];
          pageCodes.date_range_opts = codeStore.snGetGrpCodes('DATE_RANGE_OPT') || [];
        }
        uiState.isPageCodeLoad = true;
      } catch (err) { console.error('[fnLoadCodes]', err); }
    };

    onMounted(() => {
      checkAndLoadCodes();
      handleLoadAllGroups();
      Object.assign(searchParamOrg, searchParam);
    });

    // ── 이벤트 함수 ──────────────────────────────────────────────────────────

    const onSearch = () => handleLoadAllGroups();
    const onReset  = () => { Object.assign(searchParam, _initSearchParam()); handleLoadAllGroups(); };

    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : '';
      }
    };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    const onGrpChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = GRP_FIELDS.some(f => String(row[f] || '') !== String(row._row_org[f] || '')) ? 'U' : 'N';
      syncGrpDirty();
    };

    const onGrpRowClick = () => {};

    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) { row.pathId = pathId; if (row._row_status === 'N') { row._row_status = 'U'; syncGrpDirty(); } }
    };

    const onDragStart = (idx) => { uiState.dragSrc = idx; uiState.dragMoved = false; };
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (uiState.dragSrc === null || uiState.dragSrc === idx) return;
      const moved = gridRows.splice(uiState.dragSrc, 1)[0];
      gridRows.splice(idx, 0, moved);
      uiState.dragSrc = idx; uiState.dragMoved = true;
    };
    const onDragEnd = () => {
      if (uiState.dragMoved) {
        // 드래그 후 sortOrd 재부여 + 변경된 행 U 마킹 (즉시 저장 아님)
        gridRows.forEach((r, i) => {
          const newOrd = i + 1;
          if (r.sortOrd !== newOrd) {
            r.sortOrd = newOrd;
            if (r._row_status === 'N') r._row_status = 'U';
          }
        });
      }
      uiState.dragSrc = null; uiState.dragMoved = false;
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    // ── 일반 함수 ─────────────────────────────────────────────────────────────

    const handleLoadAllGroups = async () => {
      try {
        const grpParams = {
          ...Object.fromEntries(Object.entries(searchParam).filter(([k, v]) => k !== 'dateRange' && v !== '' && v !== null && v !== undefined)),
          ...(uiState.grpSelectedPath ? { pathId: uiState.grpSelectedPath } : {}),
        };

        const [grpRes, codeRes] = await Promise.all([
          boApiSvc.syCodeGrp.getAll(grpParams, '코드관리', '그룹목록조회'),
          boApiSvc.syCode.getPage({ pageNo: 1, pageSize: 100000 }, '코드관리', '코드수집계'),
        ]);
        const grpList  = grpRes.data?.data  || [];
        const codeList = codeRes.data?.data?.pageList || codeRes.data?.data?.list || [];
        const countMap = new Map();
        codeList.forEach(c => countMap.set(c.codeGrp, (countMap.get(c.codeGrp) || 0) + 1));
        grpRows.splice(0);
        grpList.forEach(g => grpRows.push({
          codeGrpId:   g.codeGrpId,
          siteId:      g.siteId    || null,
          codeGrp:     g.codeGrp,
          grpNm:       g.grpNm,
          pathId:      g.pathId    || null,
          description: g.codeGrpDesc || '',
          useYn:       g.useYn || 'Y',
          _row_status: 'N',
          codeCount: countMap.get(g.codeGrp) ?? 0,
          _row_org: { codeGrp: g.codeGrp, grpNm: g.grpNm, pathId: g.pathId || null, description: g.codeGrpDesc || '', useYn: g.useYn || 'Y' },
        }));
        syncGrpDirty();
        visibleGrpRows.splice(0, visibleGrpRows.length, ...grpRows);
        gridRows.splice(0); uiState.focusedIdx = null;
      } catch (_) {}
    };

    const handleSearchList = async () => {
      if (!uiState.selectedGrp) { gridRows.splice(0); uiState.isTreeType = false; rebuildTree(); return; }
      try {
        uiState.loading = true;
        const res = await boApiSvc.syCode.getPage({ pageNo: 1, pageSize: 10000, codeGrp: uiState.selectedGrp }, '코드관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0, gridRows.length, ...list.map(c => makeRow(c)));
        uiState.focusedIdx = null;
        const grp = grpRows.find(r => r.codeGrp === uiState.selectedGrp);
        uiState.isTreeType = grp?.type === '트리';
        rebuildTree();
      } catch (_) {} finally { uiState.loading = false; }
    };

    const makeRow = (c) => ({
      ...c, _row_status: 'N', _row_check: false,
      _row_org: { codeGrp: c.codeGrp, codeLabel: c.codeLabel, codeValue: c.codeValue,
               sortOrd: c.sortOrd, useYn: c.useYn, remark: c.remark, parentCodeValue: c.parentCodeValue || null },
    });

    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    const addRow = () => {
      const grp = uiState.selectedGrp;
      const maxSort = gridRows.reduce((m, r) => r._row_status !== 'D' ? Math.max(m, r.sortOrd || 0) : m, 0);
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      const newRow = {
        codeId: _tempId--, codeGrp: grp, codeLabel: '', codeValue: '',
        sortOrd: maxSort + 1, useYn: 'Y', remark: '', parentCodeValue: null,
        _row_status: 'I', _row_check: false,
        _row_org: { codeGrp: grp, codeLabel: '', codeValue: '', sortOrd: maxSort + 1, useYn: 'Y', remark: '', parentCodeValue: null },
      };
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!ids.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.codeId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.codeGrp || !r.codeLabel || !r.codeValue) { props.showToast('코드그룹, 코드라벨, 코드값은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      try {
        uiState.loading = true;
        const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({
          ...r, rowStatus: r._row_status,
        }));
        await boApi.post('/bo/sy/code/save-list', saveRows, coUtil.apiHdr('공통코드관리', '저장'));
        const toastParts = [];
        if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
        if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
        if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
        props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
        await handleSearchList();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      } finally { uiState.loading = false; }
    };

    const addGrp = () => {
      grpRows.push({
        codeGrp: 'NEW_GRP', grpNm: '신규 그룹', pathId: 'new.path', description: '', type: '일반', useYn: 'Y',
        _row_status: 'I', _tempId: _grpTempId--, _row_org: {},
      });
      syncGrpDirty();
      visibleGrpRows.splice(0, visibleGrpRows.length, ...grpRows);
    };

    const handleDeleteGrp = (idx) => {
      const r = visibleGrpRows[idx];
      if (r._row_status === 'I') { grpRows.splice(grpRows.indexOf(r), 1); }
      else { r._row_status = r._row_status === 'D' ? 'N' : 'D'; }
      syncGrpDirty();
      visibleGrpRows.splice(0, visibleGrpRows.length, ...grpRows);
    };

    const cancelGrp = (idx) => {
      const r = visibleGrpRows[idx];
      if (r._row_status === 'I') { grpRows.splice(grpRows.indexOf(r), 1); }
      else { Object.assign(r, r._row_org); r._row_status = 'N'; }
      syncGrpDirty();
      visibleGrpRows.splice(0, visibleGrpRows.length, ...grpRows);
    };

    const handleSaveGrp = async () => {
      if (!uiState.grpDirtyCount) { props.showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await props.showConfirm('저장', `${uiState.grpDirtyCount}건 저장하시겠습니까?`);
      if (!ok) return;
      const saveRows = grpRows
        .filter(r => r._row_status !== 'N')
        .map(r => ({
          codeGrpId: r.codeGrpId || null,
          siteId:    r.siteId    || null,
          codeGrp:   r.codeGrp,
          grpNm:     r.grpNm,
          pathId:    r.pathId    || null,
          codeGrpDesc: r.description || null,
          useYn:     r.useYn,
          rowStatus: r._row_status,
        }));
      try {
        await boApiSvc.syCodeGrp.saveList(saveRows, '공통코드그룹관리', '저장');
        props.showToast('저장되었습니다.', 'success');
        await handleLoadAllGroups();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    const openPathPick  = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    const openGrpSetting = (g, e) => { e.stopPropagation(); uiState.selectedGrp = g.codeGrp; };

    const grpSelectNode = (path) => { uiState.grpSelectedPath = path; };

    const codeToggleNode = (codeValue) => {
      if (treeExpanded.has(codeValue)) treeExpanded.delete(codeValue);
      else treeExpanded.add(codeValue);
      rebuildTree();
    };

    const handleLoadDetail = (codeId) => { uiState.selectedCodeId = codeId; };
    const closeDetail       = () => { uiState.selectedCodeId = null; };

    const statusBadgeCls = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const exportExcel = () => boUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{ label: 'ID', key: 'codeId' }, { label: '코드그룹', key: 'codeGrp' }, { label: '코드라벨', key: 'codeLabel' },
       { label: '코드값', key: 'codeValue' }, { label: '순서', key: 'sortOrd' }, { label: '사용여부', key: 'useYn' }, { label: '비고', key: 'remark' }],
      '공통코드목록.csv'
    );

    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    // ── return ────────────────────────────────────────────────────────────────

    return {
      uiState, pageCodes, siteNm,
      codeTotal, grpCount,
      searchParam, handleDateRangeChange,
      gridRows, visibleGrpRows, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      onDragStart, onDragOver, onDragEnd, toggleCheckAll, statusBadgeCls, exportExcel,
      addGrp, handleDeleteGrp, cancelGrp, handleSaveGrp, onGrpChange,
      grpSelectNode, onGrpRowClick,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      openGrpSetting,
      treeExpanded, codeToggleNode, flatTree, parentOpts,
      handleLoadDetail, closeDetail, setFocused,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>

  <!-- ── 검색 영역 ──────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="코드그룹 / 라벨 / 코드값 검색" @keyup.enter="onSearch" />
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option>
        <option v-for="o in pageCodes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in pageCodes.date_range_opts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ── 표시경로 트리 + 코드그룹 CRUD ─────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;margin-bottom:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_code_grp</span></span>
        <span v-if="uiState.grpSelectedPath" @click="grpSelectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:50vh;overflow:auto;">
        <path-tree biz-cd="sy_code_grp" :selected="uiState.grpSelectedPath" @select="grpSelectNode" />
      </div>
    </div>

    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          공통코드그룹관리
          <span v-if="uiState.grpSelectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">#{{ uiState.grpSelectedPath }}</span>
          <span class="list-count">{{ grpCount() }}건</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="addGrp">+ 행추가</button>
          <button class="btn btn-primary btn-sm" @click="handleSaveGrp" :disabled="!uiState.grpDirtyCount">저장 <span v-if="uiState.grpDirtyCount">({{ uiState.grpDirtyCount }})</span></button>
        </div>
      </div>
      <div style="max-height:480px;overflow-y:auto;">
      <table class="bo-table crud-grid">
        <thead style="position:sticky;top:0;background:#fff;z-index:10;">
          <tr>
            <th style="width:36px;text-align:center;">번호</th>
            <th class="col-status">상태</th>
            <th>표시경로 <span style="font-size:10px;color:#aaa;font-weight:400;">(예: aa.bb.cc)</span></th>
            <th>코드그룹</th>
            <th>그룹명</th>
            <th style="width:70px;">유형</th>
            <th>설명</th>
            <th class="col-use">사용</th>
            <th class="col-act-cancel"></th>
            <th style="width:44px;"></th>
            <th class="col-act-delete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="visibleGrpRows.length===0">
            <td colspan="11" style="text-align:center;color:#999;padding:20px;">데이터가 없습니다.</td>
          </tr>
          <tr v-else v-for="(g, idx) in visibleGrpRows" :key="g.codeGrp + (g._tempId || '')"
            class="crud-row"
            :class="['status-'+g._row_status, uiState.selectedGrp===g.codeGrp ? 'focused' : '']"
            style="cursor:pointer;"
            @click="onGrpRowClick(g)">
            <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
            <td class="col-status-val"><span class="badge badge-xs" :class="statusBadgeCls(g._row_status)">{{ g._row_status }}</span></td>
            <td>
              <div :style="{padding:'5px 6px 5px 10px', border:'1px solid #e5e7eb', borderRadius:'5px', fontSize:'12px', minHeight:'26px',
                            background:'#f5f5f7',
                            color: g.pathId != null ? '#374151' : '#9ca3af',
                            fontWeight: g.pathId != null ? 600 : 400,
                            display:'flex',alignItems:'center',gap:'6px'}">
                <span style="flex:1;">{{ pathLabel(g.pathId) || '경로 선택...' }}</span>
                <button type="button" :disabled="g._row_status==='D'"
                  @click="openPathPick(g)" @dblclick.stop="openPathPick(g)"
                  title="표시경로 선택"
                  :style="{cursor: g._row_status==='D' ? 'not-allowed' : 'pointer', display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0',opacity: g._row_status==='D' ? 0.4 : 1}"
                  @mouseover="(g._row_status!=='D') && ($event.currentTarget.style.background='#eef2ff')"
                  @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
              </div>
            </td>
            <td><input class="grid-input grid-mono" v-model="g.codeGrp" :disabled="g._row_status==='D'" @input="onGrpChange(g)" /></td>
            <td>
              <div style="display:flex;gap:8px;align-items:center;">
                <input class="grid-input" v-model="g.grpNm" :disabled="g._row_status==='D'" @input="onGrpChange(g)" style="flex:1;" />
                <span v-if="g._row_status !== 'D'" style="font-size:11px;color:#666;font-weight:500;white-space:nowrap;padding:4px 8px;background:#f3f4f6;border-radius:4px;">
                  {{ g.codeCount ?? '-' }}개
                </span>
              </div>
            </td>
            <td style="text-align:center;">
              <span v-if="g.type" style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;"
                :style="g.type==='트리' ? {background:'#fecaca',color:'#991b1b'} : {background:'#dbeafe',color:'#1e40af'}">
                {{ g.type }}
              </span>
            </td>
            <td><input class="grid-input" v-model="g.description" :disabled="g._row_status==='D'" @input="onGrpChange(g)" /></td>
            <td>
              <select class="grid-select" v-model="g.useYn" :disabled="g._row_status==='D'" @change="onGrpChange(g)">
                <option v-for="o in pageCodes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
              </select>
            </td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(g._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelGrp(idx)">취소</button>
            </td>
            <td style="text-align:center;padding:2px 3px;">
              <button class="btn btn-xs" @click.stop="openGrpSetting(g, $event)"
                style="background:#f0f4ff;border:1px solid #c7d2fe;color:#4338ca;font-weight:600;"
                title="코드관리">코드관리</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(g._row_status)" class="btn btn-danger btn-xs" @click.stop="handleDeleteGrp(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>

  <!-- ── 코드 목록 영역 ──────────────────────────────────────────────────── -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title" style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;">
        <span style="color:#e8587a;font-size:8px;vertical-align:middle;">●</span>코드목록
        <span class="list-count">{{ codeTotal() }}건</span>
        <span v-if="uiState.selectedGrp"
          style="font-family:monospace;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;background:#fff0f4;border:1px solid #fbb;color:#c0173a;">
          {{ uiState.selectedGrp }}
        </span>
        <span v-else-if="uiState.grpSelectedPath"
          style="font-family:monospace;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;background:#f3f4f6;border:1px solid #e5e7eb;color:#6b7280;">
          {{ uiState.grpSelectedPath }}
        </span>
      </span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
      </div>
    </div>

    <!-- ── 일반/트리 탭 ──────────────────────────────────────────────────── -->
    <div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
      <button @click="uiState.activeCodeTab='일반'"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='일반' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">일반</button>
      <button @click="uiState.activeCodeTab='트리'" :disabled="!uiState.selectedGrp"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='트리' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">트리</button>
    </div>

    <!-- ── 일반 탭 ────────────────────────────────────────────────────────── -->
    <div v-if="uiState.activeCodeTab==='일반'" style="overflow-y:auto;max-height:400px;border:1px solid #e5e7eb;">
      <table class="bo-table crud-grid">
        <thead style="position:sticky;top:0;background:#fff;z-index:10;">
          <tr>
            <th class="col-drag"></th>
            <th class="col-status">상태</th>
            <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
            <th>코드그룹</th>
            <th style="width:60px;">유형</th>
            <th>코드라벨</th>
            <th>코드값</th>
            <th v-if="uiState.isTreeType" style="width:140px;">상위코드값</th>
            <th class="col-ord">순서</th>
            <th class="col-use">사용여부</th>
            <th>비고</th>
            <th style="width:80px;">사이트명</th>
            <th class="col-act-cancel"></th>
            <th class="col-act-delete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="gridRows.length===0">
            <td :colspan="uiState.isTreeType ? 14 : 13" style="text-align:center;color:#999;padding:30px;">{{ uiState.selectedGrp ? '데이터가 없습니다.' : '그룹을 선택해주세요.' }}</td>
          </tr>
          <tr v-for="(row, idx) in gridRows" :key="row.codeId"
            class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===idx ? 'focused' : '']"
            draggable="true"
            @click="setFocused(idx)"
            @dblclick="handleLoadDetail(row.codeId)"
            @dragstart="onDragStart(idx)"
            @dragover="onDragOver($event, idx)"
            @dragend="onDragEnd">
            <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
            <td class="col-status-val">
              <span class="badge badge-xs" :class="statusBadgeCls(row._row_status)">{{ row._row_status }}</span>
            </td>
            <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
            <td><input class="grid-input" v-model="row.codeGrp" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td style="text-align:center;">
              <span style="display:inline-block;padding:3px 6px;border-radius:3px;font-size:10px;font-weight:600;"
                :style="uiState.isTreeType ? {background:'#fecaca',color:'#991b1b'} : {background:'#dbeafe',color:'#1e40af'}">
                {{ uiState.isTreeType ? '트리' : '일반' }}
              </span>
            </td>
            <td><input class="grid-input" v-model="row.codeLabel" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td><input class="grid-input grid-mono" v-model="row.codeValue" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td v-if="uiState.isTreeType">
              <select class="grid-select" v-model="row.parentCodeValue" :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option :value="null">-- 없음 --</option>
                <option v-for="opt in parentOpts" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td>
              <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option v-for="o in pageCodes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
              </select>
            </td>
            <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(row._row_status)"
                class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(row._row_status)"
                class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── 트리 탭 ────────────────────────────────────────────────────────── -->
    <div v-if="uiState.activeCodeTab==='트리' && uiState.selectedGrp">
      <div class="toolbar" style="background:#f9fafb;padding:12px;border-bottom:1px solid #e5e7eb;">
        <span class="list-title">트리 형식 편집</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
          <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
        </div>
      </div>
      <div style="overflow-y:auto;max-height:400px;border:1px solid #e5e7eb;">
        <table class="bo-table crud-grid" style="margin-top:0;">
        <thead>
          <tr>
            <th class="col-status">상태</th>
            <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
            <th style="min-width:220px;">코드라벨</th>
            <th>코드값</th>
            <th style="width:140px;">상위코드값</th>
            <th class="col-ord">순서</th>
            <th class="col-use">사용여부</th>
            <th>비고</th>
            <th style="width:80px;">사이트명</th>
            <th class="col-act-cancel"></th>
            <th class="col-act-delete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="flatTree.length===0">
            <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="(row, idx) in flatTree" :key="row.node.value"
            class="crud-row" :class="['status-'+row.node.code._row_status]"
            style="user-select:none;"
            @click="setFocused(gridRows.indexOf(row.node.code))">
            <td class="col-status-val">
              <span class="badge badge-xs" :class="statusBadgeCls(row.node.code._row_status)">{{ row.node.code._row_status }}</span>
            </td>
            <td class="col-check-val"><input type="checkbox" v-model="row.node.code._row_check" /></td>
            <td style="padding-left:0;">
              <div style="display:flex;align-items:center;gap:0;">
                <span :style="{ minWidth: (row.depth * 20 + 4) + 'px', flexShrink: 0 }"></span>
                <span v-if="row.node.children.length > 0"
                  @click.stop="codeToggleNode(row.node.value)"
                  style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:#6b7280;font-size:12px;flex-shrink:0;">
                  {{ treeExpanded.has(row.node.value) ? '▼' : '▶' }}
                </span>
                <span v-else style="width:20px;flex-shrink:0;"></span>
                <span v-if="row.depth > 0" style="color:#bfdbfe;margin-right:2px;font-weight:300;font-size:11px;">├</span>
                <input class="grid-input" style="flex:1;" v-model="row.node.code.codeLabel" :disabled="row.node.code._row_status==='D'" @input="onCellChange(row.node.code)" />
              </div>
            </td>
            <td><input class="grid-input grid-mono" v-model="row.node.code.codeValue" :disabled="row.node.code._row_status==='D'" @input="onCellChange(row.node.code)" /></td>
            <td>
              <select class="grid-select" style="font-size:12px;" v-model="row.node.code.parentCodeValue" :disabled="row.node.code._row_status==='D'" @change="onCellChange(row.node.code)">
                <option :value="null">-- 없음 --</option>
                <option v-for="opt in parentOpts" :key="opt.value" :value="opt.value">{{ opt.displayLabel }}</option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" v-model.number="row.node.code.sortOrd" :disabled="row.node.code._row_status==='D'" @input="onCellChange(row.node.code)" /></td>
            <td>
              <select class="grid-select" v-model="row.node.code.useYn" :disabled="row.node.code._row_status==='D'" @change="onCellChange(row.node.code)">
                <option v-for="o in pageCodes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
              </select>
            </td>
            <td><input class="grid-input" v-model="row.node.code.remark" :disabled="row.node.code._row_status==='D'" @input="onCellChange(row.node.code)" /></td>
            <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(row.node.code._row_status)"
                class="btn btn-secondary btn-xs" @click.stop="cancelRow(gridRows.indexOf(row.node.code))">취소</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(row.node.code._row_status)"
                class="btn btn-danger btn-xs" @click.stop="deleteRow(gridRows.indexOf(row.node.code))">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>

  <!-- ── 표시경로 선택 모달 ────────────────────────────────────────────── -->
  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_code_grp"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    title="공통코드그룹 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />

  <!-- ── 코드 상세 패널 (인라인 임베드) ───────────────────────────────── -->
  <div v-if="uiState.selectedCodeId" style="margin-top:20px;padding:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
      <h3 style="margin:0;font-size:16px;font-weight:600;color:#1f2937;">코드 상세</h3>
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-code-dtl :navigate="navigate" :show-toast="showToast"
      :show-confirm="showConfirm" :set-api-res="() => {}" :edit-id="uiState.selectedCodeId" />
  </div>
</div>
`,
};
