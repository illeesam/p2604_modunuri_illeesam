/* ShopJoy Admin - 공통코드관리 (CRUD 그리드) */
window.SyCodeMng = {
  name: 'SyCodeMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* ── 트리/그룹 선택 상태 (loadGrid 보다 먼저 선언) ── */
    const selectedGrp = ref('');
    const grpSelectedPath = ref('');

    /* ── 검색 ── */
    const searchKw        = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.adminUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : '';
      }
    };
    const searchGrp   = ref('');
    const searchUseYn = ref('');
    const grpOptions  = computed(() => [...new Set(props.adminData.codes.map(c => c.codeGrp))].sort());
    const applied     = Vue.reactive({ kw: '', grp: '', useYn: '', dateStart: '', dateEnd: '' });

    /* ── CRUD 그리드 데이터 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['codeGrp', 'codeLabel', 'codeValue', 'sortOrd', 'useYn', 'remark', 'parentCodeValue'];

    /* ═══════════════════════════════════════════════════════
       상단 섹션: 표시경로 트리 + 코드그룹 CRUD 그리드
    ═══════════════════════════════════════════════════════ */
    const grpRows = reactive([]);
    let _grpTempId = -1;
    const GRP_FIELDS = ['codeGrp', 'grpNm', 'pathId', 'description', 'type', 'useYn'];

    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));
    const loadGrp = () => {
      grpRows.splice(0);
      (props.adminData.codeGroups || []).forEach(g => grpRows.push({
        ...g,
        _row_status: 'N',
        pathId: g.pathId == null ? null : g.pathId,
        _orig: { codeGrp: g.codeGrp, grpNm: g.grpNm, pathId: g.pathId == null ? null : g.pathId, description: g.description || '', type: g.type || '일반', useYn: g.useYn || 'Y' },
      }));
    };
    loadGrp();
    const onGrpChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = GRP_FIELDS.some(f => String(row[f] || '') !== String(row._orig[f] || ''));
      row._row_status = changed ? 'U' : 'N';
    };
    const addGrp = () => {
      grpRows.push({
        codeGrp: 'NEW_GRP', grpNm: '신규 그룹', pathId: null, dispPath: 'new.path', description: '', type: '일반', useYn: 'Y',
        _row_status: 'I', _tempId: _grpTempId--, _orig: {},
      });
    };
    const delGrp = (idx) => {
      const r = grpRows[idx];
      if (r._row_status === 'I') grpRows.splice(idx, 1);
      else r._row_status = r._row_status === 'D' ? 'N' : 'D';
    };
    const cancelGrp = (idx) => {
      const r = grpRows[idx];
      if (r._row_status === 'I') { grpRows.splice(idx, 1); return; }
      Object.assign(r, r._orig); r._row_status = 'N';
    };
    const grpDirty = computed(() => grpRows.filter(r => r._row_status !== 'N').length);
    const saveGrp = async () => {
      if (!grpDirty.value) { props.showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await props.showConfirm('저장', `${grpDirty.value}건 저장하시겠습니까?`);
      if (!ok) return;
      props.adminData.codeGroups = grpRows.filter(r => r._row_status !== 'D').map(r => ({
        codeGrp: r.codeGrp, grpNm: r.grpNm, pathId: r.pathId, dispPath: r.dispPath, description: r.description, type: r.type, useYn: r.useYn,
      }));
      loadGrp();
      props.showToast('저장되었습니다.', 'success');
    };

    /* 좌측 표시경로 트리 (codeGroups의 dispPath 기반) */
    const grpExpanded = reactive(new Set(['']));
    const grpToggleNode = (path) => { if (grpExpanded.has(path)) grpExpanded.delete(path); else grpExpanded.add(path); };
    const grpSelectNode = (path) => { grpSelectedPath.value = path; };
    const grpExpandAll = () => { const walk = (n) => { grpExpanded.add(n.path); n.children.forEach(walk); }; walk(grpTree.value); };
    const grpCollapseAll = () => { grpExpanded.clear(); grpExpanded.add(''); };
    /* _expand3_grp: 그룹 트리 3레벨 펼침 */
    Vue.onMounted(() => {
      const initSet = window.adminUtil.collectExpandedToDepth(grpTree.value, 2);
      grpExpanded.clear(); initSet.forEach(v => grpExpanded.add(v));
    });
    const grpTree = computed(() => window.adminUtil.buildPathTree('sy_code_grp'));
    const filteredGrpRows = computed(() => {
      const sp = grpSelectedPath.value;
      if (!sp) return grpRows;
      return grpRows.filter(r => (r.dispPath || '').startsWith(sp));
    });

    /* 공통코드그룹 페이징 (default 5건) */
    const grpPager = reactive({ page: 1, size: 5 });
    const GRP_PAGE_SIZES = [5, 10, 20, 50, 100];
    const grpTotalPages = computed(() => Math.max(1, Math.ceil(filteredGrpRows.value.length / grpPager.size)));
    const grpPageNums = computed(() => { const c = grpPager.page, l = grpTotalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setGrpPage = n => { if (n >= 1 && n <= grpTotalPages.value) grpPager.page = n; };
    const onGrpSizeChange = () => { grpPager.page = 1; };
    const grpPagedRows = computed(() => { const s = (grpPager.page - 1) * grpPager.size; return filteredGrpRows.value.slice(s, s + grpPager.size); });
    Vue.watch(() => filteredGrpRows.value.length, () => { if (grpPager.page > grpTotalPages.value) grpPager.page = Math.max(1, grpTotalPages.value); });
    /* 트리 path 변경 시: 그룹 페이지 리셋 + selectedGrp 해제 + 코드목록 재조회 */
    Vue.watch(grpSelectedPath, () => { grpPager.page = 1; selectedGrp.value = ''; loadGrid(); });
    /* selectedGrp 변경 시 코드목록 재조회 */
    Vue.watch(selectedGrp, () => loadGrid());

    /* 그룹 행 클릭 → 코드목록 필터 (토글) */
    const onGrpRowClick = (g) => {
      selectedGrp.value = (selectedGrp.value === g.codeGrp) ? '' : g.codeGrp;
    };

    const makeRow = (c) => ({
      ...c,
      _row_status: 'N',
      _row_check:  false,
      _orig: { codeGrp: c.codeGrp, codeLabel: c.codeLabel, codeValue: c.codeValue,
               sortOrd: c.sortOrd, useYn: c.useYn, remark: c.remark, parentCodeValue: c.parentCodeValue || null },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      /* 트리 선택 시 해당 path에 속하는 codeGrp 집합 */
      const allowedGrps = grpSelectedPath.value
        ? new Set((props.adminData.codeGroups || [])
            .filter(g => (g.dispPath || '').startsWith(grpSelectedPath.value))
            .map(g => g.codeGrp))
        : null;
      props.adminData.codes
        .filter(c => {
          const kw = applied.kw.trim().toLowerCase();
          if (kw && !c.codeGrp.toLowerCase().includes(kw)
                 && !c.codeLabel.toLowerCase().includes(kw)
                 && !c.codeValue.toLowerCase().includes(kw)) return false;
          if (applied.grp   && c.codeGrp !== applied.grp)   return false;
          if (applied.useYn && c.useYn   !== applied.useYn) return false;
          if (selectedGrp.value && c.codeGrp !== selectedGrp.value) return false;
          if (allowedGrps && !allowedGrps.has(c.codeGrp)) return false;
          const _d = String(c.regDate || '').slice(0, 10);
          if (applied.dateStart && _d < applied.dateStart) return false;
          if (applied.dateEnd   && _d > applied.dateEnd)   return false;
          return true;
        })
        .forEach(c => gridRows.push(makeRow(c)));
    };

    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    /* 상세 조회 */
    const selectedCodeId = ref(null);
    const loadDetail = (codeId) => { selectedCodeId.value = codeId; };
    const closeDetail = () => { selectedCodeId.value = null; };

    /* 트리 탭 페이징 */
    const treePager = reactive({ page: 1, size: 10 });
    const TREE_PAGE_SIZES = [5, 10, 20, 50, 100];
    const treeTotalPages = computed(() => Math.max(1, Math.ceil(flatTreeRows.value.length / treePager.size)));
    const treePageNums = computed(() => { const c = treePager.page, l = treeTotalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setTreePage = n => { if (n >= 1 && n <= treeTotalPages.value) treePager.page = n; };
    const onTreeSizeChange = () => { treePager.page = 1; };
    const pagedTreeRows = computed(() => { const s = (treePager.page - 1) * treePager.size; return flatTreeRows.value.slice(s, s + treePager.size); });

    /* 현재 선택된 그룹이 트리형인지 여부 */
    const isTreeTypeGrp = computed(() => {
      if (!selectedGrp.value || !props.adminData?.codeGroups) return false;
      const grp = props.adminData.codeGroups.find(g => g.codeGrp === selectedGrp.value);
      return grp?.type === '트리';
    });

    /* 코드값으로 전체 계층 경로 구성 (루트부터 현재까지) */
    const getCodeHierarchyPath = (codeValue) => {
      if (!codeValue) return '';
      const codes = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(codes.map(c => [c.codeValue, c]));
      const path = [];
      let current = byValue.get(codeValue);
      while (current) {
        path.unshift(`${current.codeLabel}(${current.codeValue})`);
        current = current.parentCodeValue ? byValue.get(current.parentCodeValue) : null;
      }
      return path.length > 0 ? path.join(' > ') : '';
    };

    /* 트리형 코드 그룹일 때 상위코드 목록 (트리 형식 표시용) */
    const parentCodeOptions = computed(() => {
      if (!isTreeTypeGrp.value) return [];
      const codes = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(codes.map(c => [c.codeValue, c]));

      return codes.map(r => {
        // 계층 깊이 계산
        let depth = 0;
        let current = r.parentCodeValue ? byValue.get(r.parentCodeValue) : null;
        while (current) {
          depth++;
          current = current.parentCodeValue ? byValue.get(current.parentCodeValue) : null;
        }
        const indent = '　'.repeat(depth); // 전각 공백으로 들여쓰기
        return {
          label: `${r.codeLabel}(${r.codeValue})`,
          value: r.codeValue,
          path: getCodeHierarchyPath(r.codeValue),
          displayLabel: `${indent}${r.codeLabel}(${r.codeValue})`
        };
      });
    });

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, grp: searchGrp.value, useYn: searchUseYn.value,
                                dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchGrp.value = ''; searchUseYn.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', grp: '', useYn: '', dateStart: '', dateEnd: '' });
      loadGrid();
    };

    /* ── 포커스 행 설정 ── */
    const setFocused = (idx) => { focusedIdx.value = idx; };

    /* ── 셀 변경 → 행상태 갱신 ── */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* ── 행추가: 포커스 행 아래 삽입, 없으면 끝에 추가 ── */
    const addRow = () => {
      const ref = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        codeId: _tempId--, codeGrp: ref ? ref.codeGrp : '', codeLabel: '', codeValue: '',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', remark: '', parentCodeValue: null,
        _row_status: 'I', _row_check: false,
        _orig: { codeGrp: ref ? ref.codeGrp : '', codeLabel: '', codeValue: '', sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1, useYn: 'Y', remark: '', parentCodeValue: null },
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    /* ── 행 단건 삭제 버튼: N/U 에 표시 (I는 표시 안함) ── */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    /* ── 취소 버튼: U/I/D 에 표시 ── */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        // U / D: 원래값 복원 → N
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    /* ── 툴바 [취소]: 체크된 행만 취소, 없으면 변경된 전체 취소 ── */
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!checkedIds.size) {
        props.showToast('취소할 행을 선택해주세요.', 'info');
        return;
      }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.codeId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') {
          gridRows.splice(i, 1);
        } else if (row._row_status === 'U' || row._row_status === 'D') {
          if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
          row._row_status = 'N';
        }
      }
    };

    /* ── 체크된 행 일괄 삭제 ── */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') {
          gridRows.splice(i, 1);
        } else {
          gridRows[i]._row_status = 'D';
        }
      }
    };

    /* ── 저장 ── */
    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        props.showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.codeGrp || !r.codeLabel || !r.codeValue) {
          props.showToast('코드그룹, 코드라벨, 코드값은 필수 항목입니다.', 'error'); return;
        }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?',
        { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;

      dRows.forEach(r => {
        const idx = props.adminData.codes.findIndex(c => c.codeId === r.codeId);
        if (idx !== -1) props.adminData.codes.splice(idx, 1);
      });
      uRows.forEach(r => {
        const idx = props.adminData.codes.findIndex(c => c.codeId === r.codeId);
        if (idx !== -1) Object.assign(props.adminData.codes[idx],
          { codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue,
            sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark, parentCodeValue: r.parentCodeValue || null });
      });
      let nextId = Math.max(...props.adminData.codes.map(c => c.codeId), 0);
      iRows.forEach(r => {
        props.adminData.codes.push({
          codeId: ++nextId, codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue,
          sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark, parentCodeValue: r.parentCodeValue || null,
          regDate: new Date().toISOString().slice(0, 10),
        });
      });
      const toastParts = [];
      if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
      if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
      if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    /* ── 드래그 이동 ── */
    const dragSrc  = ref(null);
    const dragMoved = ref(false);
    const onDragStart = (idx) => { dragSrc.value = idx; dragMoved.value = false; };
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (dragSrc.value === null || dragSrc.value === idx) return;
      const moved = gridRows.splice(dragSrc.value, 1)[0];
      gridRows.splice(idx, 0, moved);
      dragSrc.value = idx;
      dragMoved.value = true;
    };
    const onDragEnd = () => {
      if (dragMoved.value) props.showToast('정렬정보가 저장되었습니다.');
      dragSrc.value = null;
      dragMoved.value = false;
    };

    /* ── 전체 체크 (D 행 포함) ── */
    const checkAll = ref(false);
    const toggleCheckAll = () => {
      gridRows.forEach(r => { r._row_check = checkAll.value; });
    };

    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const statusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'codeId'},{label:'코드그룹',key:'codeGrp'},{label:'코드레이블',key:'codeLabel'},{label:'코드값',key:'codeValue'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'remark'}],
      '공통코드목록.csv'
    );

    /* ── 코드 트리 탭 ── */
    const activeCodeTab = ref('일반');
    const codeTreeExpanded = reactive(new Set());
    const codeToggleNode = (codeValue) => {
      if (codeTreeExpanded.has(codeValue)) codeTreeExpanded.delete(codeValue);
      else codeTreeExpanded.add(codeValue);
    };
    const codeTree = computed(() => {
      if (!selectedGrp.value) return { value: '__root__', label: 'Root', children: [], count: 0 };
      const visible = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map();
      visible.forEach(c => { byValue.set(c.codeValue, c); });
      const roots = [];
      const children = new Map(); // parentValue -> [children]
      visible.forEach(c => {
        const parentVal = c.parentCodeValue || null;
        if (!parentVal || !byValue.has(parentVal)) {
          roots.push(c);
        } else {
          if (!children.has(parentVal)) children.set(parentVal, []);
          children.get(parentVal).push(c);
        }
      });
      const build = (c) => ({
        value: c.codeValue,
        label: c.codeLabel,
        code: c,
        children: (children.get(c.codeValue) || []).map(build),
      });
      const walk = (nodes) => nodes.length + nodes.reduce((sum, n) => sum + walk(n.children), 0);
      const rootNodes = roots.map(build);
      return { value: '__root__', label: 'Root', children: rootNodes, count: walk(rootNodes) };
    });

    /* 트리를 평탄화된 행 목록으로 변환 (렌더링용) */
    const flatTreeRows = computed(() => {
      const result = [];
      const walk = (node, depth) => {
        result.push({ node, depth, isExpanded: codeTreeExpanded.has(node.value) });
        if (codeTreeExpanded.has(node.value)) {
          node.children.forEach(child => walk(child, depth + 1));
        }
      };
      codeTree.value.children.forEach(node => walk(node, 0));
      return result;
    });

    return {
      siteNm,
      searchDateRange, searchDateStart, searchDateEnd, DATE_RANGE_OPTIONS, onDateRangeChange,
      searchKw, searchGrp, searchUseYn, grpOptions, applied,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusClass,
      exportExcel,
      grpRows, grpDirty, addGrp, delGrp, cancelGrp, saveGrp, onGrpChange,
      grpTree, grpExpanded, grpToggleNode, grpSelectNode, grpExpandAll, grpCollapseAll, grpSelectedPath, filteredGrpRows,
      grpPager, GRP_PAGE_SIZES, grpTotalPages, grpPageNums, setGrpPage, onGrpSizeChange, grpPagedRows,
      selectedGrp, onGrpRowClick,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      activeCodeTab, codeTree, codeTreeExpanded, codeToggleNode, flatTreeRows, parentCodeOptions, isTreeTypeGrp,
      selectedCodeId, loadDetail, closeDetail, getCodeHierarchyPath,
      treePager, TREE_PAGE_SIZES, treeTotalPages, treePageNums, setTreePage, onTreeSizeChange, pagedTreeRows,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="코드그룹 / 라벨 / 코드값 검색" />
      <select v-model="searchGrp">
        <option value="">그룹 전체</option>
        <option v-for="g in grpOptions" :key="g">{{ g }}</option>
      </select>
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchDateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchDateEnd" class="date-range-input" />
      <select v-model="searchDateRange" @change="onDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ═══ 상단: 표시경로 트리 + 코드그룹 CRUD ═══ -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;margin-bottom:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span class="list-count">{{ grpTree.count }}</span></span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="grpExpandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="grpCollapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:50vh;overflow:auto;">
        <prop-tree-node :node="grpTree" :expanded="grpExpanded" :selected="grpSelectedPath"
          :on-toggle="grpToggleNode" :on-select="grpSelectNode" :depth="0" />
      </div>
    </div>

    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          공통코드그룹관리
          <span v-if="grpSelectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ grpSelectedPath }}</span>
          <span class="list-count">{{ filteredGrpRows.filter(r=>r._row_status!=='D').length }}건</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="addGrp">+ 행추가</button>
          <button class="btn btn-primary btn-sm" @click="saveGrp" :disabled="!grpDirty">저장 <span v-if="grpDirty">({{ grpDirty }})</span></button>
        </div>
      </div>
      <table class="admin-table crud-grid">
        <thead>
          <tr>
            <th class="col-status">상태</th>
            <th>표시경로 <span style="font-size:10px;color:#aaa;font-weight:400;">(예: aa.bb.cc)</span></th>
            <th>코드그룹</th>
            <th>그룹명</th>
            <th style="width:70px;">유형</th>
            <th>설명</th>
            <th class="col-use">사용</th>
            <th class="col-act-cancel"></th>
            <th class="col-act-delete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="grpPagedRows.length===0">
            <td colspan="8" style="text-align:center;color:#999;padding:20px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="(g, idx) in grpPagedRows" :key="g.codeGrp + (g._tempId || '')"
            class="crud-row"
            :class="['status-'+g._row_status, selectedGrp===g.codeGrp ? 'focused' : '']"
            style="cursor:pointer;"
            @click="onGrpRowClick(g)">
            <td class="col-status-val"><span class="badge badge-xs" :class="statusClass(g._row_status)">{{ g._row_status }}</span></td>
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
            <td><input class="grid-input" v-model="g.grpNm" :disabled="g._row_status==='D'" @input="onGrpChange(g)" /></td>
            <td style="text-align:center;">
              <span v-if="g.type" style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;"
                :style="g.type==='트리' ? {background:'#fecaca',color:'#991b1b'} : {background:'#dbeafe',color:'#1e40af'}">
                {{ g.type }}
              </span>
            </td>
            <td><input class="grid-input" v-model="g.description" :disabled="g._row_status==='D'" @input="onGrpChange(g)" /></td>
            <td>
              <select class="grid-select" v-model="g.useYn" :disabled="g._row_status==='D'" @change="onGrpChange(g)">
                <option value="Y">사용</option><option value="N">미사용</option>
              </select>
            </td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(g._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelGrp(idx)">취소</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(g._row_status)" class="btn btn-danger btn-xs" @click.stop="delGrp(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="grpPager.page===1" @click="setGrpPage(1)">«</button>
          <button :disabled="grpPager.page===1" @click="setGrpPage(grpPager.page-1)">‹</button>
          <button v-for="n in grpPageNums" :key="n" :class="{active:grpPager.page===n}" @click="setGrpPage(n)">{{ n }}</button>
          <button :disabled="grpPager.page===grpTotalPages" @click="setGrpPage(grpPager.page+1)">›</button>
          <button :disabled="grpPager.page===grpTotalPages" @click="setGrpPage(grpTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="grpPager.size" @change="onGrpSizeChange">
            <option v-for="s in GRP_PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- CRUD 그리드 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>코드목록
        <span v-if="selectedGrp" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ selectedGrp }}</span>
        <span v-else-if="grpSelectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ grpSelectedPath }}</span>
        <span class="list-count">{{ total }}건</span>
      </span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
      </div>
    </div>

    <!-- 일반/트리 탭 -->
    <div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
      <button @click="activeCodeTab='일반'" :class="{active: activeCodeTab==='일반'}"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="activeCodeTab==='일반' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">일반</button>
      <button @click="activeCodeTab='트리'" :disabled="!selectedGrp" :class="{active: activeCodeTab==='트리'}"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="activeCodeTab==='트리' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}"
        :disabled="!selectedGrp">트리</button>
    </div>

    <!-- 일반 탭: 테이블 -->
    <table v-if="activeCodeTab==='일반'" class="admin-table crud-grid">
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th>코드그룹</th>
          <th>코드라벨</th>
          <th>코드값</th>
          <th v-if="isTreeTypeGrp" style="width:140px;">상위코드값</th>
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
          <td :colspan="isTreeTypeGrp ? 13 : 12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.codeId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          draggable="true"
          @click="setFocused(getRealIdx(idx))"
          @dblclick="loadDetail(row.codeId)"
          @dragstart="onDragStart(getRealIdx(idx))"
          @dragover="onDragOver($event, getRealIdx(idx))"
          @dragend="onDragEnd">

          <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
          <td class="col-id-val">{{ row.codeId > 0 ? row.codeId : 'NEW' }}</td>
          <td class="col-status-val">
            <span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span>
          </td>
          <td class="col-check-val">
            <input type="checkbox" v-model="row._row_check" />
          </td>
          <td><input class="grid-input" v-model="row.codeGrp"   :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input" v-model="row.codeLabel"  :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input grid-mono" v-model="row.codeValue" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td v-if="isTreeTypeGrp">
            <select class="grid-select" v-model="row.parentCodeValue" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option :value="null">-- 없음 --</option>
              <option v-for="opt in parentCodeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </td>
          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="Y">사용</option><option value="N">미사용</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ siteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="['N','U'].includes(row._row_status)"
              class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>

    <!-- 트리 탭: 편집 가능한 테이블 형식 -->
    <div v-if="activeCodeTab==='트리' && selectedGrp">
      <div class="toolbar" style="background:#f9fafb;padding:12px;border-bottom:1px solid #e5e7eb;">
        <span class="list-title">트리 형식 편집</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
          <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
        </div>
      </div>
      <table class="admin-table crud-grid" style="margin-top:0;">
        <thead>
          <tr>
            <th class="col-status">상태</th>
            <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
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
          <tr v-if="codeTree.count===0">
            <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-else v-for="(row, idx) in pagedTreeRows" :key="row.node.value" class="crud-row" :class="['status-'+row.node.code._row_status]" style="user-select:none;" @click="setFocused(gridRows.indexOf(row.node.code))">
            <td class="col-status-val">
              <span class="badge badge-xs" :class="statusClass(row.node.code._row_status)">{{ row.node.code._row_status }}</span>
            </td>
            <td class="col-check-val">
              <input type="checkbox" v-model="row.node.code._row_check" />
            </td>
            <td style="padding-left:0;">
              <div style="display:flex;align-items:center;gap:0;">
                <span :style="{ minWidth: (row.depth * 20 + 4) + 'px', flexShrink: 0 }"></span>
                <span v-if="row.node.children.length > 0"
                  @click.stop="codeToggleNode(row.node.value)"
                  style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;color:#6b7280;font-size:12px;flex-shrink:0;">
                  {{ codeTreeExpanded.has(row.node.value) ? '▼' : '▶' }}
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
                <option v-for="opt in parentCodeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.displayLabel }}
                </option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" v-model.number="row.node.code.sortOrd" :disabled="row.node.code._row_status==='D'" @input="onCellChange(row.node.code)" /></td>
            <td>
              <select class="grid-select" v-model="row.node.code.useYn" :disabled="row.node.code._row_status==='D'" @change="onCellChange(row.node.code)">
                <option value="Y">사용</option><option value="N">미사용</option>
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

      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="treePager.page===1" @click="setTreePage(1)">«</button>
          <button :disabled="treePager.page===1" @click="setTreePage(treePager.page-1)">‹</button>
          <button v-for="n in treePageNums" :key="n" :class="{active:treePager.page===n}" @click="setTreePage(n)">{{ n }}</button>
          <button :disabled="treePager.page===treeTotalPages" @click="setTreePage(treePager.page+1)">›</button>
          <button :disabled="treePager.page===treeTotalPages" @click="setTreePage(treeTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="treePager.size" @change="onTreeSizeChange">
            <option v-for="s in TREE_PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- 표시경로 선택 모달 -->
  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_code_grp"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    title="공통코드그룹 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />

  <!-- 코드 상세 조회 (인라인 임베드) -->
  <div v-if="selectedCodeId" style="margin-top:20px;padding:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">
      <h3 style="margin:0;font-size:16px;font-weight:600;color:#1f2937;">코드 상세</h3>
      <button class="btn btn-secondary btn-sm" @click="closeDetail">✕ 닫기</button>
    </div>
    <sy-code-dtl :navigate="navigate" :admin-data="adminData" :show-toast="showToast"
      :show-confirm="showConfirm" :set-api-res="() => {}" :edit-id="selectedCodeId" />
  </div>
</div>
`,
};
