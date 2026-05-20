/* ShopJoy Admin - 공통코드관리 (CRUD 그리드) */
window.SyCodeMng = {
  name: 'SyCodeMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { reactive, watch, onMounted, nextTick } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    // -- 선언부 ----------------------------------------------------------------

    const pageCodes   = reactive({ use_yn: [], date_range_opts: [] });
    const uiState     = reactive({
      checkAll: false, dragMoved: false, loading: false,
      isPageCodeLoad: false, selectedGrp: '', grpSelectedPath: '',
      focusedIdx: null, selectedCodeId: null, codeReloadTrigger: 0, dragSrc: null, activeCodeTab: '일반',
      isTreeType: false,
      grpDirtyCount: 0,
      grpSortKey: '', grpSortDir: 'asc',
      grpRows: [],
      gridRows: [],
    });

    /* _initSearchParam */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      const threeYearsAgo = thisYear - 3;
      return {
        searchType: '', searchValue: '',
        grp: '', useYn: 'Y', dateRange: '',
        dateStart: `${threeYearsAgo}-01-01`,
        dateEnd:   `${thisYear}-12-31`,
      };
    };

    const searchParam    = reactive(_initSearchParam());
    const searchParamOrg = reactive(_initSearchParam());
    const treeExpanded   = reactive(new Set());
    const parentOpts     = reactive([]);
    const flatTree       = reactive([]);

    const siteNm = boUtil.bofGetSiteNm();   // 매 행마다 호출 방지용 상수 캐시

    let _tempId    = -1;
    let _grpTempId = -1;
    let _grpLoadSeq = 0;
    const EDIT_FIELDS = ['codeGrp', 'codeLabel', 'codeValue', 'sortOrd', 'useYn', 'codeOpt1', 'codeRemark', 'parentCodeValue'];
    const GRP_FIELDS  = ['codeGrp', 'grpNm', 'pathId', 'description', 'type', 'useYn'];

    /* codeTotal */
    const codeTotal = () => uiState.gridRows.filter(r => r._row_status !== 'D').length;

    /* fnCodeListTitle: 코드목록 제목에 선택 그룹코드/경로 표기 부착 */
    const fnCodeListTitle = () => {
      const tag = uiState.selectedGrp || uiState.grpSelectedPath || '';
      return tag ? `코드목록  [ ${tag} ]` : '코드목록';
    };

    /* grpCount */
    const grpCount  = () => uiState.grpRows.filter(r => r._row_status !== 'D').length;

    // grpDirtyCount: uiState.grpRows 변경 시 갱신
    const syncGrpDirty = () => { uiState.grpDirtyCount = uiState.grpRows.filter(r => r._row_status !== 'N').length; };

    // -- 트리 갱신 -------------------------------------------------------------

    /* rebuildTree */
    const rebuildTree = () => {
      parentOpts.splice(0);
      if (uiState.isTreeType) {
        const visible = uiState.gridRows.filter(r => r._row_status !== 'D');
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
      const visible = uiState.gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(visible.map(c => [c.codeValue, c]));
      const childMap = new Map();
      visible.forEach(c => {
        const pv = c.parentCodeValue || null;
        if (!pv || !byValue.has(pv)) return;
        if (!childMap.has(pv)) childMap.set(pv, []);
        childMap.get(pv).push(c);
      });
      const roots = visible.filter(c => !c.parentCodeValue || !byValue.has(c.parentCodeValue));

      /* build */
      const build = (c) => ({ value: c.codeValue, label: c.codeLabel, code: c, children: (childMap.get(c.codeValue) || []).map(build) });

      /* walk */
      const walk = (node, depth) => {
        flatTree.push({ node, depth, isExpanded: treeExpanded.has(node.value) });
        if (treeExpanded.has(node.value)) node.children.forEach(child => walk(child, depth + 1));
      };
      roots.map(build).forEach(node => walk(node, 0));
    };

    // -- watch -----------------------------------------------------------------

    // isAppReady: Pinia store 준비 완료 시 pageCodes 로드 ( 제거 → store 직접 확인)
    const checkAndLoadCodes = () => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore();
      if (!initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad)
        fnLoadCodes();
    };
    watch(() => window.sfGetBoCodeStore()?.svCodes?.length, checkAndLoadCodes);

    // -- 초기화 ----------------------------------------------------------------

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      pageCodes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        pageCodes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      checkAndLoadCodes();
      handleLoadAllGroups();
      Object.assign(searchParamOrg, searchParam);
    });

    // -- 이벤트 함수 ----------------------------------------------------------

    /* 목록조회 */
    const onSearch = () => handleLoadAllGroups();

    /* onReset */
    const onReset  = () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.grpSortKey = '';
      uiState.grpSortDir = 'asc';
      uiState.grpSelectedPath = '';
      uiState.selectedGrp = '';
      uiState.grpRows = [];
      uiState.gridRows = [];
      uiState.focusedIdx = null;
      handleLoadAllGroups();
    };

    /* handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : '';
      }
    };

    /* onCellChange */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* onGrpChange */
    const onGrpChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      row._row_status = GRP_FIELDS.some(f => String(row[f] || '') !== String(row._row_org[f] || '')) ? 'U' : 'N';
      syncGrpDirty();
    };

    /* onGrpRowClick */
    const onGrpRowClick = () => {};

    /* 표시경로 변경 → bo-path-pick-field 가 row.pathId 갱신. 변경 추적만 보존 */
    const onPathChange = (row) => {
      if (row && row._row_status === 'N') { row._row_status = 'U'; syncGrpDirty(); }
    };

    /* onDragStart */
    const onDragStart = (idx) => { uiState.dragSrc = idx; uiState.dragMoved = false; };

    /* onDragOver */
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (uiState.dragSrc === null || uiState.dragSrc === idx) return;
      const moved = uiState.gridRows.splice(uiState.dragSrc, 1)[0];
      uiState.gridRows.splice(idx, 0, moved);
      uiState.dragSrc = idx; uiState.dragMoved = true;
    };

    /* onDragEnd */
    const onDragEnd = () => {
      if (uiState.dragMoved) {
        // 드래그 후 sortOrd 재부여 + 변경된 행 U 마킹 (즉시 저장 아님)
        uiState.gridRows.forEach((r, i) => {
          const newOrd = i + 1;
          if (r.sortOrd !== newOrd) {
            r.sortOrd = newOrd;
            if (r._row_status === 'N') r._row_status = 'U';
          }
        });
      }
      uiState.dragSrc = null; uiState.dragMoved = false;
    };

    /* toggleCheckAll */
    const toggleCheckAll = () => { uiState.gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    // -- 일반 함수 -------------------------------------------------------------

    // grpSortKey → API sort 파라미터 매핑
    const GRP_SORT_MAP = {
      codeGrp: { asc: 'codeGrp asc', desc: 'codeGrp desc' },
      grpNm:   { asc: 'grpNm asc',   desc: 'grpNm desc'   },
    };

    /* cfGrpSortParam */
    const cfGrpSortParam = () => {
      const { grpSortKey, grpSortDir } = uiState;
      if (!grpSortKey || !GRP_SORT_MAP[grpSortKey]) return {};
      return { sort: GRP_SORT_MAP[grpSortKey][grpSortDir] };
    };

    /* onGrpSort */
    const onGrpSort = (key) => {
      if (uiState.grpSortKey === key) {
        if (uiState.grpSortDir === 'asc') {
          uiState.grpSortDir = 'desc';
        } else {
          uiState.grpSortKey = '';
          uiState.grpSortDir = 'asc';
        }
      } else {
        uiState.grpSortKey = key;
        uiState.grpSortDir = 'asc';
      }
      handleLoadAllGroups();
    };

    /* grpSortIcon */
    const grpSortIcon = (key) => {
      if (uiState.grpSortKey !== key) return '⇅';
      return uiState.grpSortDir === 'asc' ? '↑' : '↓';
    };

    /* handleLoadAllGroups */
    const handleLoadAllGroups = async () => {
      const seq = ++_grpLoadSeq;
      try {
        const grpParams = {
          ...Object.fromEntries(Object.entries(searchParam).filter(([k, v]) => k !== 'dateRange' && v !== '' && v !== null && v !== undefined)),
          ...(uiState.grpSelectedPath ? { pathId: uiState.grpSelectedPath } : {}),
          ...cfGrpSortParam(),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (grpParams.searchValue && !grpParams.searchType) {
          grpParams.searchType = 'codeGrp,codeLabel,codeValue';
        }

        const [grpRes, codeRes] = await Promise.all([
          boApiSvc.syCodeGrp.getAll(grpParams, '코드관리', '그룹목록조회'),
          boApiSvc.syCode.getPage({ pageNo: 1, pageSize: 100000 }, '코드관리', '코드수집계'),
        ]);

        if (seq !== _grpLoadSeq) return;

        const grpList  = grpRes.data?.data  || [];
        const codeList = codeRes.data?.data?.pageList || codeRes.data?.data?.list || [];
        const countMap = new Map();
        codeList.forEach(c => countMap.set(c.codeGrp, (countMap.get(c.codeGrp) || 0) + 1));
        const newGrpRows = grpList.map(g => ({
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
        uiState.grpRows = [];
        uiState.gridRows = [];
        await nextTick();
        if (seq !== _grpLoadSeq) return;
        uiState.grpRows = newGrpRows;
        syncGrpDirty();
        uiState.focusedIdx = null;
      } catch (_) {}
    };

    /* 목록조회 */
    const handleSearchList = async () => {
      if (!uiState.selectedGrp) { uiState.gridRows = []; uiState.isTreeType = false; rebuildTree(); return; }
      try {
        uiState.loading = true;
        const res = await boApiSvc.syCode.getPage({ pageNo: 1, pageSize: 10000, codeGrp: uiState.selectedGrp }, '코드관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        uiState.gridRows = list.map(c => makeRow(c));
        uiState.focusedIdx = null;
        const grp = uiState.grpRows.find(r => r.codeGrp === uiState.selectedGrp);
        uiState.isTreeType = grp?.type === '트리';
        rebuildTree();
      } catch (_) {} finally { uiState.loading = false; }
    };

    /* makeRow */
    const makeRow = (c) => ({
      ...c, _row_status: 'N', _row_check: false,
      codeOpt1: c.codeOpt1 || '',
      _row_org: { codeGrp: c.codeGrp, codeLabel: c.codeLabel, codeValue: c.codeValue,
               sortOrd: c.sortOrd, useYn: c.useYn, codeRemark: c.codeRemark, codeOpt1: c.codeOpt1 || '', parentCodeValue: c.parentCodeValue || null },
    });

    /* setFocused */
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    /* addRow */
    const addRow = () => {
      const grp = uiState.selectedGrp;
      const maxSort = uiState.gridRows.reduce((m, r) => r._row_status !== 'D' ? Math.max(m, r.sortOrd || 0) : m, 0);
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : uiState.gridRows.length;
      const newRow = {
        codeId: _tempId--, codeGrp: grp, codeLabel: '', codeValue: '',
        sortOrd: maxSort + 1, useYn: 'Y', codeOpt1: '', codeRemark: '', parentCodeValue: null,
  _row_status: 'I', _row_check: false,
        _row_org: { codeGrp: grp, codeLabel: '', codeValue: '', sortOrd: maxSort + 1, useYn: 'Y', codeOpt1: '', codeRemark: '', parentCodeValue: null },
      };
      uiState.gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow */
    const deleteRow = (idx) => {
      const row = uiState.gridRows[idx];
      if (row._row_status === 'I') {
        uiState.gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    /* cancelRow */
    const cancelRow = (idx) => {
      const row = uiState.gridRows[idx];
      if (row._row_status === 'I') {
        uiState.gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
    };

    /* cancelChecked */
    const cancelChecked = () => {
      const ids = new Set(uiState.gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = uiState.gridRows.length - 1; i >= 0; i--) {
        const row = uiState.gridRows[i];
        if (!ids.has(row.codeId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { uiState.gridRows.splice(i, 1); }
        else { if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* deleteRows */
    const deleteRows = () => {
      for (let i = uiState.gridRows.length - 1; i >= 0; i--) {
        if (!uiState.gridRows[i]._row_check) continue;
        if (uiState.gridRows[i]._row_status === 'I') uiState.gridRows.splice(i, 1);
        else uiState.gridRows[i]._row_status = 'D';
      }
    };

    /* 저장 */
    const handleSave = async () => {
      const iRows = uiState.gridRows.filter(r => r._row_status === 'I');
      const uRows = uiState.gridRows.filter(r => r._row_status === 'U');
      const dRows = uiState.gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.codeGrp || !r.codeLabel || !r.codeValue) { showToast('코드그룹, 코드라벨, 코드값은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      try {
        uiState.loading = true;
        const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({
          ...r, rowStatus: r._row_status,
        }));
        await boApi.post('/bo/sy/code/save-list', saveRows, coUtil.cofApiHdr('공통코드관리', '저장'));
        const toastParts = [];
        if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
        if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
        if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
        showToast(`${toastParts.join(', ')} 저장되었습니다.`);
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      } finally { uiState.loading = false; }
    };

    /* addGrp */
    const addGrp = () => {
      uiState.grpRows = [...uiState.grpRows, {
        codeGrp: 'NEW_GRP', grpNm: '신규 그룹', pathId: 'new.path', description: '', type: '일반', useYn: 'Y',
        _row_status: 'I', _tempId: _grpTempId--, _row_org: {},
      }];
      syncGrpDirty();
    };

    /* handleDeleteGrp */
    const handleDeleteGrp = (idx) => {
      const rows = uiState.grpRows;
      const r = rows[idx];
      if (r._row_status === 'I') { uiState.grpRows = rows.filter((_, i) => i !== idx); }
      else { r._row_status = r._row_status === 'D' ? 'N' : 'D'; }
      syncGrpDirty();
    };

    /* cancelGrp */
    const cancelGrp = (idx) => {
      const rows = uiState.grpRows;
      const r = rows[idx];
      if (r._row_status === 'I') { uiState.grpRows = rows.filter((_, i) => i !== idx); }
      else { Object.assign(r, r._row_org); r._row_status = 'N'; }
      syncGrpDirty();
    };

    /* handleSaveGrp */
    const handleSaveGrp = async () => {
      if (!uiState.grpDirtyCount) { showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await showConfirm('저장', `${uiState.grpDirtyCount}건 저장하시겠습니까?`);
      if (!ok) return;
      const saveRows = uiState.grpRows
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
        showToast('저장되었습니다.', 'success');
        await handleLoadAllGroups();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '저장 중 오류가 발생했습니다.', 'error', 0);
      }
    };


    /* openGrpSetting */
    const openGrpSetting = (g, e) => {
      e.stopPropagation();
      uiState.selectedGrp = g.codeGrp;
      handleSearchList();
    };

    /* grpSelectNode */
    const grpSelectNode = (path) => {
      uiState.grpSelectedPath = path;
      uiState.selectedGrp = '';
      handleLoadAllGroups();
    };

    /* 전체펼치기 / 전체접기 — 자식이 있는 모든 노드의 codeValue 를 treeExpanded 에 add 또는 clear */
    const codeExpandAll = () => {
      treeExpanded.clear();
      const visible = uiState.gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(visible.map(c => [c.codeValue, c]));
      const parentVals = new Set();
      visible.forEach(c => {
        const pv = c.parentCodeValue;
        if (pv && byValue.has(pv)) parentVals.add(pv);
      });
      parentVals.forEach(v => treeExpanded.add(v));
      rebuildTree();
    };

    /* codeCollapseAll */
    const codeCollapseAll = () => {
      treeExpanded.clear();
      rebuildTree();
    };

    /* codeToggleNode */
    const codeToggleNode = (codeValue) => {
      if (treeExpanded.has(codeValue)) treeExpanded.delete(codeValue);
      else treeExpanded.add(codeValue);
      rebuildTree();
    };

    /* 상세조회 */
    const handleLoadDetail = (codeId) => { uiState.selectedCodeId = codeId; uiState.codeReloadTrigger++; };

    /* closeDetail */
    const closeDetail       = () => { uiState.selectedCodeId = null; };

    /* statusBadgeCls */
    const statusBadgeCls = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* exportExcel */
    const exportExcel = () => coUtil.cofExportCsv(
      uiState.gridRows.filter(r => r._row_status !== 'D'),
      [{ label: 'ID', key: 'codeId' }, { label: '코드그룹', key: 'codeGrp' }, { label: '코드라벨', key: 'codeLabel' },
       { label: '코드값', key: 'codeValue' }, { label: '순서', key: 'sortOrd' }, { label: '사용여부', key: 'useYn' }, { label: '비고', key: 'codeRemark' }],
      '공통코드목록.csv'
    );

    /* BoGridCrud 컬럼 정의 (코드목록 일반 탭 / 특수셀은 #cell-{key} 슬롯 override)
       parentCodeValue 는 트리타입에서만 노출 → 헤더·셀 정합 위해 columns 자체를 동적 구성 */
    const fnCodeGridColumns = () => {
      const cols = [
        { key: 'codeGrp',    label: '코드그룹',          edit: 'text' },
        { key: 'type',       label: '유형',             style: 'width:60px;', align: 'center',
          fmt: () => uiState.isTreeType ? '트리' : '일반',
          cellInnerStyle: () => 'display:inline-block;padding:3px 6px;border-radius:3px;font-size:10px;font-weight:600;'
            + (uiState.isTreeType ? 'background:#fecaca;color:#991b1b;' : 'background:#dbeafe;color:#1e40af;') },
        { key: 'codeLabel',  label: '코드라벨',          edit: 'text' },
        { key: 'codeValue',  label: '코드값',           edit: 'text', mono: true },
      ];
      if (uiState.isTreeType) {
        cols.push({ key: 'parentCodeValue', label: '상위코드값', style: 'width:140px;',
          edit: 'select', nullable: true, nullLabel: '-- 없음 --',
          options: () => parentOpts.map(o => ({ value: o.value, label: o.label })) });
      }
      cols.push(
        { key: 'sortOrd',    label: '순서',             cls: 'col-ord', edit: 'number' },
        { key: 'useYn',      label: '사용여부',          cls: 'col-use',
          edit: 'select', options: () => pageCodes.use_yn },
        { key: 'codeOpt1',   label: '스타일 (code_opt1)', style: 'width:140px;', edit: 'text', mono: true,
          placeholder: '#000000 / fa-icon' },
        { key: 'codeRemark', label: '비고',             edit: 'text' },
        { key: 'siteNm',     label: '사이트명',          style: 'width:80px;', align: 'center',
          cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => siteNm },
      );
      return cols;
    };

    /* 트리 탭 그리드 — codeLabel(트리 들여쓰기 UI)·parentCodeValue(displayLabel) 만 슬롯 KEEP.
     * BoGridCrud 트리 모드: flat-rows=flatTree, row-accessor=it=>it.node.code */
    const treeGridColumns = [
      { key: 'codeLabel',       label: '코드라벨',          style: 'min-width:220px;' },
      { key: 'codeValue',       label: '코드값',            edit: 'text', mono: true },
      { key: 'parentCodeValue', label: '상위코드값',        style: 'width:140px;',
        edit: 'select', nullable: true, nullLabel: '-- 없음 --',
        options: () => parentOpts.map(o => ({ value: o.value, label: o.displayLabel || o.label })) },
      { key: 'sortOrd',         label: '순서',             cls: 'col-ord', edit: 'number' },
      { key: 'useYn',           label: '사용여부',          cls: 'col-use', edit: 'select', options: () => pageCodes.use_yn },
      { key: 'codeOpt1',        label: '스타일 (code_opt1)', style: 'width:140px;', edit: 'text', mono: true,
        placeholder: '#000000 / fa-icon' },
      { key: 'codeRemark',      label: '비고',             edit: 'text' },
      { key: 'siteNm',          label: '사이트명',          style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => siteNm },
    ];
    const treeRowAccessor = (it) => it.node.code;
    const treeRowKeyFn    = (it) => it.node.value;

    /* 코드그룹 그리드 — BoGridCrud 자동 edit/표시. pathId(커스텀 컴포넌트)·grpNm(input+카운트박지) 만 슬롯 KEEP */
    const grpGridColumns = [
      { key: 'pathId',      label: '표시경로 (예: aa.bb.cc)' },
      { key: 'codeGrp',     label: '코드그룹', sortKey: 'codeGrp', edit: 'text', mono: true },
      { key: 'grpNm',       label: '그룹명',   sortKey: 'grpNm' },
      { key: 'type',        label: '유형',     style: 'width:70px;', align: 'center',
        cellInnerStyle: (v) => v ? 'display:inline-block;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;'
          + (v==='트리' ? 'background:#fecaca;color:#991b1b;' : 'background:#dbeafe;color:#1e40af;') : '' },
      { key: 'description', label: '설명',     sortKey: 'description', edit: 'text' },
      { key: 'useYn',       label: '사용',     cls: 'col-use',
        edit: 'select', options: () => pageCodes.use_yn },
    ];

    // -- return ----------------------------------------------------------------

    return {
      uiState, pageCodes, siteNm,
      fnCodeGridColumns, grpGridColumns, treeGridColumns, treeRowAccessor, treeRowKeyFn,
      codeTotal, grpCount, fnCodeListTitle,
      searchParam, handleDateRangeChange,
      onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      onDragStart, onDragOver, onDragEnd, toggleCheckAll, statusBadgeCls, exportExcel,
      addGrp, handleDeleteGrp, cancelGrp, handleSaveGrp, onGrpChange,
      grpSelectNode, onGrpRowClick, onGrpSort, grpSortIcon,
      onPathChange,
      openGrpSetting,
      treeExpanded, codeToggleNode, codeExpandAll, codeCollapseAll, flatTree, parentOpts,
      handleLoadDetail, closeDetail, setFocused,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>

  <!-- -- 검색 영역 -------------------------------------------------------- -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'codeGrp',   label: '코드그룹' },
          { value: 'codeLabel', label: '라벨' },
          { value: 'codeValue', label: '코드값' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input v-model="searchParam.searchValue" placeholder="검색어 입력" @keyup.enter="onSearch" />
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
    </bo-search-area>
  </div>

  <!-- -- 표시경로 트리 + 코드그룹 CRUD ----------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;margin-bottom:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_code_grp" title="표시경로" :show-biz-cd="true"
      :selected="uiState.grpSelectedPath" @select="grpSelectNode" />

    <bo-grid-crud
      :columns="grpGridColumns" :rows="uiState.grpRows" row-key="codeGrp"
      list-title="공통코드그룹관리"
      :show-row-id="false" :show-row-check="false" :draggable="false"
      :show-add="false" :show-save="false"
      :sort-state="{ sortKey: uiState.grpSortKey, sortDir: uiState.grpSortDir }"
      @sort="onGrpSort" @cell-change="onGrpChange">

      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="addGrp">+ 행추가</button>
        <button class="btn btn-primary btn-sm" @click="handleSaveGrp" :disabled="!uiState.grpDirtyCount">저장 <span v-if="uiState.grpDirtyCount">({{ uiState.grpDirtyCount }})</span></button>
      </template>

      <template #cell-pathId="{ row: g }">
        <bo-path-pick-field biz-cd="sy_code_grp" :row="g"
          :disabled="g._row_status==='D'" @change="onPathChange(g)" />
      </template>
      <template #cell-grpNm="{ row: g }">
        <td>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="grid-input" v-model="g.grpNm" :disabled="g._row_status==='D'" @input="onGrpChange(g)" style="flex:1;" />
            <span v-if="g._row_status !== 'D'" style="font-size:11px;color:#666;font-weight:500;white-space:nowrap;padding:4px 8px;background:#f3f4f6;border-radius:4px;">
              {{ g.codeCount != null ? g.codeCount : '-' }}개
            </span>
          </div>
        </td>
      </template>
      <template #row-actions="{ row: g, idx }">
        <button v-if="g._row_status !== 'D'" class="btn btn-xs" @click.stop="openGrpSetting(g, $event)"
          style="background:#f0f4ff;border:1px solid #c7d2fe;color:#4338ca;font-weight:600;"
          title="코드관리">코드관리</button>
        <button v-if="['U','I','D'].includes(uiState.grpRows[idx]._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelGrp(idx)">취소</button>
        <button v-if="['N','U'].includes(uiState.grpRows[idx]._row_status)" class="btn btn-danger btn-xs" @click.stop="handleDeleteGrp(idx)">삭제</button>
      </template>
    </bo-grid-crud>
  </div>

  <!-- -- 코드 목록 영역 ---------------------------------------------------- -->
  <div class="card">
    <!-- -- 일반/트리 탭 ---------------------------------------------------- -->
    <div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
      <button @click="uiState.activeCodeTab='일반'"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='일반' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">일반</button>
      <button @click="uiState.activeCodeTab='트리'" :disabled="!uiState.selectedGrp"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='트리' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">트리</button>
    </div>

    <!-- -- 일반 탭 ---------------------------------------------------------- -->
    <div v-if="uiState.activeCodeTab==='일반'">
      <bo-grid-crud
        :columns="fnCodeGridColumns()" :rows="uiState.gridRows" row-key="codeId"
        :list-title="fnCodeListTitle()" :show-export="true" :draggable="true"
        max-height="400px"
        :empty-text="uiState.selectedGrp ? '데이터가 없습니다.' : '그룹을 선택해주세요.'"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="addRow" @save="handleSave"
        @delete-checked="deleteRows" @cancel-checked="cancelChecked"
        @cell-change="onCellChange" @export="exportExcel" @reorder="onDragEnd"
        @row-dblclick="row => handleLoadDetail(row.codeId)">

        <template #row-actions="{ row, idx }">
          <button v-if="['U','I','D'].includes(row._row_status)"
            class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
          <button v-if="['N','U'].includes(row._row_status)"
            class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
        </template>
      </bo-grid-crud>
    </div>

    <!-- -- 트리 탭 (BoGridCrud 트리 모드) ----------------------------------- -->
    <div v-if="uiState.activeCodeTab==='트리' && uiState.selectedGrp">
      <bo-grid-crud
        :columns="treeGridColumns"
        :rows="uiState.gridRows" row-key="codeId"
        :flat-rows="flatTree" :row-accessor="treeRowAccessor" :tree-row-key="treeRowKeyFn"
        list-title="트리 형식 편집" max-height="400px"
        @add="addRow" @save="handleSave"
        @delete-checked="deleteRows" @cancel-checked="cancelChecked"
        v-model:checkAll="uiState.checkAll" v-model:focusedIdx="uiState.focusedIdx"
        @cell-change="onCellChange">

        <template #toolbar-actions>
          <div style="display:inline-flex;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;align-self:center;">
            <button type="button" @click="codeExpandAll"
              style="border:none;background:#fff;color:#374151;font-size:11px;padding:4px 10px;cursor:pointer;border-right:1px solid #d1d5db;"
              title="모든 노드 펼치기">▼ 전체펼치기</button>
            <button type="button" @click="codeCollapseAll"
              style="border:none;background:#fff;color:#374151;font-size:11px;padding:4px 10px;cursor:pointer;"
              title="모든 노드 접기">▶ 전체접기</button>
          </div>
        </template>

        <template #cell-codeLabel="{ row, node }">
          <td style="padding-left:0;">
            <div style="display:flex;align-items:center;gap:4px;">
              <span :style="{ minWidth: (node.depth * 20 + 4) + 'px', flexShrink: 0 }"></span>
              <span v-if="node.node.children.length > 0"
                @click.stop="codeToggleNode(node.node.value)"
                style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:#6b7280;font-size:12px;flex-shrink:0;">
                {{ treeExpanded.has(node.node.value) ? '▼' : '▶' }}
              </span>
              <span v-else style="width:20px;flex-shrink:0;"></span>
              <span v-if="node.depth > 0" style="color:#bfdbfe;margin-right:2px;font-weight:300;font-size:11px;">├</span>
              <span :style="'flex-shrink:0;font-size:10px;font-weight:700;padding:1px 5px;border-radius:3px;'+
                (node.depth===0?'background:#dbeafe;color:#1e40af;':node.depth===1?'background:#dcfce7;color:#166534;':'background:#fef3c7;color:#92400e;')"
                :title="'레벨 ' + (node.depth+1)">L{{ node.depth+1 }}</span>
              <input class="grid-input" style="flex:1;" v-model="row.codeLabel" :disabled="row._row_status==='D'" @input="onCellChange(row)" />
              <span v-if="node.node.children.length > 0" style="flex-shrink:0;font-size:10px;color:#6b7280;background:#f3f4f6;padding:1px 5px;border-radius:3px;"
                :title="'직속 자식 ' + node.node.children.length + '개'">↳ {{ node.node.children.length }}</span>
            </div>
          </td>
        </template>

        <template #row-actions="{ row }">
          <button v-if="['U','I','D'].includes(row._row_status)"
            class="btn btn-secondary btn-xs" @click.stop="cancelRow(uiState.gridRows.indexOf(row))">취소</button>
          <button v-if="['N','U'].includes(row._row_status)"
            class="btn btn-danger btn-xs" @click.stop="deleteRow(uiState.gridRows.indexOf(row))">삭제</button>
        </template>
      </bo-grid-crud>
    </div>
  </div>

  <!-- -- 코드 상세 패널 (인라인 임베드) --------------------------------- -->
  <div v-if="uiState.selectedCodeId" style="margin-top:20px;padding:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
      <h3 style="margin:0;font-size:16px;font-weight:600;color:#1f2937;">코드 상세</h3>
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-code-dtl :navigate="navigate" :show-toast="showToast"
      :show-confirm="showConfirm" 
      :set-api-res="() => {}" 
      :on-list-reload="handleSearchList"
      :reload-trigger="uiState.codeReloadTrigger"
      :dtl-id="uiState.selectedCodeId"
      :dtl-mode="uiState.selectedCodeId ? 'edit' : 'new'" />
  </div>
</div>
`,
};
