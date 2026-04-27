/* ShopJoy Admin - 공통코드관리 (CRUD 그리드) */
window.SyCodeMng = {
  name: 'SyCodeMng',
  props: ['navigate', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // ── 선언부 ────────────────────────────────────────────────────────────────

    const codes          = reactive([]);                    // 전체 코드 목록 (DB 기준)
    const codeGroups     = reactive([]);                    // 코드그룹 목록 (codes 에서 추출)
    const pageCodeGroups = reactive({});                    // 페이지 전용 코드 캐시
    const uiState        = reactive({                       // UI 상태
      checkAll: false, dragMoved: false, loading: false, error: null,
      isPageCodeLoad: false, selectedGrp: '', grpSelectedPath: '',
      focusedIdx: null, selectedCodeId: null, dragSrc: null, activeCodeTab: '일반',
    });

    const searchParam    = reactive({                       // 검색 조건
      kw: '', grp: '', useYn: '', dateRange: '', dateStart: '', dateEnd: '', dragSrc: null,
    });
    const searchParamOrg = reactive({                       // 검색 초기값 (리셋용)
      kw: '', grp: '', useYn: '', dateRange: '', dateStart: '', dateEnd: '',
    });
    const DATE_RANGE_OPTIONS = window.boCmUtil.DATE_RANGE_OPTIONS;

    const gridRows  = reactive([]);                         // 코드 CRUD 그리드 행
    const grpRows   = reactive([]);                         // 코드그룹 CRUD 그리드 행
    const dragSrc   = ref(null);                            // 드래그 소스 인덱스
    const pager     = reactive({                            // 코드 목록 페이징
      pageType: 'PAGE', pageNo: 1, pageSize: 10,
      pageTotalCount: 0, pageTotalPage: 1,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {},
    });
    const grpPager  = reactive({                            // 코드그룹 페이징
      pageType: 'PAGE', page: 1, size: 5,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {},
    });
    const treePager = reactive({                            // 트리 탭 페이징
      pageType: 'PAGE', page: 1, size: 10,
      pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {},
    });
    const pathPickModal     = reactive({ show: false, row: null }); // 표시경로 선택 모달
    const grpExpanded       = reactive(new Set(['']));              // 그룹 트리 펼침 상태
    const cfCodeTreeExpanded = reactive(new Set());                 // 코드 트리 펼침 상태

    let _tempId    = -1;
    let _grpTempId = -1;
    const EDIT_FIELDS  = ['codeGrp', 'codeLabel', 'codeValue', 'sortOrd', 'useYn', 'remark', 'parentCodeValue'];
    const GRP_FIELDS   = ['codeGrp', 'grpNm', 'pathId', 'description', 'type', 'useYn'];
    const GRP_PAGE_SIZES  = [5, 10, 20, 50, 100];
    const TREE_PAGE_SIZES = [5, 10, 20, 50, 100];

    const getRealIdx = (localIdx) => (pager.pageNo - 1) * pager.pageSize + localIdx;

    // ── computed ──────────────────────────────────────────────────────────────

    const isAppReady = computed(() => {                     // 앱 초기화 완료 여부
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const cfSiteNm         = computed(() => window.boCmUtil.getSiteNm()); // 현재 사이트명
    const cfGrpOptions     = computed(() => [...new Set(codes.map(c => c.codeGrp))].sort()); // 그룹 선택 옵션

    const cfGrpTree        = computed(() => window.boCmUtil.buildPathTree('sy_code_grp')); // 표시경로 트리
    const cfFilteredGrpRows = computed(() => {              // 트리 선택 경로로 필터된 그룹 행
      const sp = uiState.grpSelectedPath;
      if (!sp) return grpRows;
      return grpRows.filter(r => (r.dispPath || '').startsWith(sp));
    });

    const cfGrpTotalPages  = computed(() => Math.max(1, Math.ceil(cfFilteredGrpRows.value.length / grpPager.size)));
    const cfGrpPageNums    = computed(() => {               // 그룹 페이지 번호 배열
      const c = grpPager.page, l = cfGrpTotalPages.value;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const cfGrpPagedRows   = computed(() => {               // 그룹 현재 페이지 행
      const s = (grpPager.page - 1) * grpPager.size;
      return cfFilteredGrpRows.value.slice(s, s + grpPager.size);
    });

    const cfFilteredRows   = computed(() => {               // 선택된 그룹으로 필터된 행
      if (!uiState.selectedGrp) return gridRows;
      return gridRows.filter(r => r.codeGrp === uiState.selectedGrp && r._row_status !== 'D');
    });
    const cfTotal          = computed(() => cfFilteredRows.value.length); // 코드 유효 건수
    const cfGrpDirty       = computed(() => grpRows.filter(r => r._row_status !== 'N').length); // 그룹 변경 건수
    const cfPagedRows      = computed(() => {               // 코드 현재 페이지 행 (스크롤용 전체)
      return cfFilteredRows.value;
    });
    const cfTotalPages     = computed(() => Math.max(1, Math.ceil(cfFilteredRows.value.length / pager.pageSize)));
    const cfPageNums       = computed(() => {               // 코드 페이지 번호 배열
      const c = pager.pageNo, l = cfTotalPages.value;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });

    const fnGetCodeCountByGrp = (grpCode) => {              // 그룹별 코드 개수 계산
      return gridRows.filter(r => r.codeGrp === grpCode && r._row_status !== 'D').length;
    };

    const cfIsTreeTypeGrp  = computed(() => {               // 선택 그룹이 트리형 여부
      if (!uiState.selectedGrp || !codeGroups?.length) return false;
      const grp = codeGroups.find(g => g.codeGrp === uiState.selectedGrp);
      return grp?.type === '트리';
    });

    const cfParentCodeOptions = computed(() => {            // 트리형 상위코드 선택 옵션
      if (!cfIsTreeTypeGrp.value) return [];
      const rows = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(rows.map(c => [c.codeValue, c]));
      return rows.map(r => {
        let depth = 0;
        let current = r.parentCodeValue ? byValue.get(r.parentCodeValue) : null;
        while (current) { depth++; current = current.parentCodeValue ? byValue.get(current.parentCodeValue) : null; }
        const indent = '　'.repeat(depth);
        return {
          label: `${r.codeLabel}(${r.codeValue})`,
          value: r.codeValue,
          path: getCodeHierarchyPath(r.codeValue),
          displayLabel: `${indent}${r.codeLabel}(${r.codeValue})`,
        };
      });
    });

    const cfCodeTree       = computed(() => {               // 코드 트리 구조
      if (!uiState.selectedGrp) return { value: '__root__', label: 'Root', children: [], count: 0 };
      const visible = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map();
      visible.forEach(c => { byValue.set(c.codeValue, c); });
      const roots = [];
      const children = new Map();
      visible.forEach(c => {
        const parentVal = c.parentCodeValue || null;
        if (!parentVal || !byValue.has(parentVal)) { roots.push(c); }
        else {
          if (!children.has(parentVal)) children.set(parentVal, []);
          children.get(parentVal).push(c);
        }
      });
      const build = (c) => ({
        value: c.codeValue, label: c.codeLabel, code: c,
        children: (children.get(c.codeValue) || []).map(build),
      });
      const walk = (nodes) => nodes.length + nodes.reduce((sum, n) => sum + walk(n.children), 0);
      const rootNodes = roots.map(build);
      return { value: '__root__', label: 'Root', children: rootNodes, count: walk(rootNodes) };
    });

    const cfFlatTreeRows   = computed(() => {               // 트리 평탄화 행 목록 (렌더링용)
      const result = [];
      const walk = (node, depth) => {
        result.push({ node, depth, isExpanded: cfCodeTreeExpanded.has(node.value) });
        if (cfCodeTreeExpanded.has(node.value)) node.children.forEach(child => walk(child, depth + 1));
      };
      cfCodeTree.value.children.forEach(node => walk(node, 0));
      return result;
    });

    const cfTreeTotalPages = computed(() => Math.max(1, Math.ceil(cfFlatTreeRows.value.length / treePager.size)));
    const cfTreePageNums   = computed(() => {               // 트리 페이지 번호 배열
      const c = treePager.page, l = cfTreeTotalPages.value;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const cfPagedTreeRows  = computed(() => {               // 트리 현재 페이지 행
      const s = (treePager.page - 1) * treePager.size;
      return cfFlatTreeRows.value.slice(s, s + treePager.size);
    });

    // ── watch ─────────────────────────────────────────────────────────────────

    // 앱 준비 완료 시 코드 로드 트리거
    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    // 그룹 필터 결과 변경 시 페이지 초과 방지
    watch(() => cfFilteredGrpRows.value.length, () => {
      if (grpPager.page > cfGrpTotalPages.value) grpPager.page = Math.max(1, cfGrpTotalPages.value);
    });

    // 트리 path 변경 시 — 그룹 페이지 리셋 + selectedGrp 해제 + 코드목록 재조회
    watch(() => uiState.grpSelectedPath, () => { grpPager.page = 1; uiState.selectedGrp = ''; handleSearchList(); });

    // selectedGrp 변경 시 코드목록 재조회 + 페이지 리셋
    watch(() => uiState.selectedGrp, () => { pager.pageNo = 1; handleSearchList(); });

    // ── 초기화부 ──────────────────────────────────────────────────────────────

    // 코드그룹 목록 갱신 — codes 배열 기준으로 codeGroups 동기화
    const updateCodeGroups = () => {
      const grps = new Map();
      codes.forEach(c => {
        if (c.codeGrp && !grps.has(c.codeGrp)) {
          grps.set(c.codeGrp, { codeGrp: c.codeGrp, grpNm: c.codeGrp, type: 'general', useYn: 'Y', pathId: null });
        }
      });
      codeGroups.splice(0, codeGroups.length, ...Array.from(grps.values()));
    };

    // 코드그룹 그리드 행 초기화
    const loadGrp = () => {
      grpRows.splice(0);
      (codeGroups || []).forEach(g => grpRows.push({
        ...g,
        _row_status: 'N',
        pathId: g.pathId == null ? null : g.pathId,
        _orig: { codeGrp: g.codeGrp, grpNm: g.grpNm, pathId: g.pathId == null ? null : g.pathId, description: g.description || '', type: g.type || '일반', useYn: g.useYn || 'Y' },
      }));
    };

    // 페이지 진입 시 코드 로드 상태 플래그 설정
    const fnLoadCodes = async () => {
      try { uiState.isPageCodeLoad = true; }
      catch (err) { console.error('[fnLoadCodes]', err); }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      updateCodeGroups();
      loadGrp();
      handleSearchList('DEFAULT');
      Object.assign(searchParamOrg, searchParam);
      const initSet = window.boCmUtil.collectExpandedToDepth(cfGrpTree.value, 2);
      grpExpanded.clear(); initSet.forEach(v => grpExpanded.add(v));
    });

    // ── 이벤트 함수 모음 ──────────────────────────────────────────────────────

    // 조회 버튼 클릭
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    // 초기화 버튼 클릭
    const onReset = () => { Object.assign(searchParam, searchParamOrg); onSearch(); };

    // 날짜 범위 옵션 변경
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = window.boCmUtil.getDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : ''; searchParam.dateEnd = r ? r.to : '';
      }
    };

    // 셀 내용 변경 → 행 상태 갱신
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    // 그룹 셀 변경 → 그룹 행 상태 갱신
    const onGrpChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = GRP_FIELDS.some(f => String(row[f] || '') !== String(row._orig[f] || ''));
      row._row_status = changed ? 'U' : 'N';
    };

    // 그룹 행 클릭 → 코드목록 필터 토글
    const onGrpRowClick = (g) => {
      uiState.selectedGrp = (uiState.selectedGrp === g.codeGrp) ? '' : g.codeGrp;
    };

    // 표시경로 선택 완료
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) { row.pathId = pathId; if (row._row_status === 'N') row._row_status = 'U'; }
    };

    // 드래그 시작
    const onDragStart = (idx) => { uiState.dragSrc = idx; uiState.dragMoved = false; };

    // 드래그 이동 중 — 행 순서 즉시 변경
    const onDragOver = (e, idx) => {
      e.preventDefault();
      if (uiState.dragSrc === null || uiState.dragSrc === idx) return;
      const moved = gridRows.splice(uiState.dragSrc, 1)[0];
      gridRows.splice(idx, 0, moved);
      uiState.dragSrc = idx;
      uiState.dragMoved = true;
    };

    // 드래그 완료 — 이동 시 토스트
    const onDragEnd = () => {
      if (uiState.dragMoved) props.showToast('정렬정보가 저장되었습니다.');
      uiState.dragSrc = null; uiState.dragMoved = false;
    };

    // 전체 체크 토글
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    // 페이지 크기 변경
    const onSizeChange    = () => { pager.pageNo = 1; };
    const onGrpSizeChange = () => { grpPager.page = 1; };
    const onTreeSizeChange = () => { treePager.page = 1; };

    // ── 일반 함수 모음 ────────────────────────────────────────────────────────

    // 코드 목록 조회 — API 호출 후 gridRows/codeGroups 갱신
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        uiState.loading = true;
        const res = await window.boApi.get('/bo/sy/code/page', {
          params: { pageNo: 1, pageSize: 100000 },
          headers: { 'X-UI-Nm': '공통코드관리', 'X-Cmd-Nm': '조회' },
        });
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        codes.splice(0, codes.length, ...list);
        updateCodeGroups();
        loadGrp();
        gridRows.splice(0); uiState.focusedIdx = null; pager.pageNo = 1;
        codes.forEach(c => gridRows.push(makeRow(c)));
      } catch (_) {} finally { uiState.loading = false; }
    };

    // 코드 행 생성 헬퍼
    const makeRow = (c) => ({
      ...c,
      _row_status: 'N',
      _row_check: false,
      _orig: { codeGrp: c.codeGrp, codeLabel: c.codeLabel, codeValue: c.codeValue,
               sortOrd: c.sortOrd, useYn: c.useYn, remark: c.remark, parentCodeValue: c.parentCodeValue || null },
    });

    // 코드값 계층 경로 반환 — 루트부터 현재까지 > 연결
    const getCodeHierarchyPath = (codeValue) => {
      if (!codeValue) return '';
      const rows = gridRows.filter(r => r._row_status !== 'D');
      const byValue = new Map(rows.map(c => [c.codeValue, c]));
      const path = [];
      let current = byValue.get(codeValue);
      while (current) {
        path.unshift(`${current.codeLabel}(${current.codeValue})`);
        current = current.parentCodeValue ? byValue.get(current.parentCodeValue) : null;
      }
      return path.length > 0 ? path.join(' > ') : '';
    };

    // 포커스 행 설정
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    // 행 추가 — 포커스 행 아래 삽입, 없으면 끝에 추가
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        codeId: _tempId--, codeGrp: ref ? ref.codeGrp : '', codeLabel: '', codeValue: '',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1, useYn: 'Y', remark: '', parentCodeValue: null,
        _row_status: 'I', _row_check: false,
        _orig: { codeGrp: ref ? ref.codeGrp : '', codeLabel: '', codeValue: '', sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1, useYn: 'Y', remark: '', parentCodeValue: null },
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
      pager.pageNo = Math.ceil((insertAt + 1) / pager.pageSize);
    };

    // 행 단건 삭제 — I면 제거, 나머지는 D 표시
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    // 행 단건 취소 — I면 제거, U/D면 원래값 복원
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
    };

    // 체크된 행 일괄 취소
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.codeId));
      if (!checkedIds.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.codeId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
      }
    };

    // 체크된 행 일괄 삭제
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    // 코드 저장 — I/U/D 행 분류 후 확인 → 코드 배열 직접 반영
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
      dRows.forEach(r => { const idx = codes.findIndex(c => c.codeId === r.codeId); if (idx !== -1) codes.splice(idx, 1); });
      uRows.forEach(r => { const idx = codes.findIndex(c => c.codeId === r.codeId); if (idx !== -1) Object.assign(codes[idx], { codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue, sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark, parentCodeValue: r.parentCodeValue || null }); });
      let nextId = Math.max(...codes.map(c => c.codeId), 0);
      iRows.forEach(r => { codes.push({ codeId: ++nextId, codeGrp: r.codeGrp, codeLabel: r.codeLabel, codeValue: r.codeValue, sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark, parentCodeValue: r.parentCodeValue || null, regDate: new Date().toISOString().slice(0, 10) }); });
      const toastParts = [];
      if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
      if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
      if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
      await handleSearchList();
    };

    // 코드그룹 행 추가
    const addGrp = () => {
      grpRows.push({
        codeGrp: 'NEW_GRP', grpNm: '신규 그룹', pathId: null, dispPath: 'new.path', description: '', type: '일반', useYn: 'Y',
        _row_status: 'I', _tempId: _grpTempId--, _orig: {},
      });
    };

    // 코드그룹 행 삭제
    const handleDeleteGrp = (idx) => {
      const r = grpRows[idx];
      if (r._row_status === 'I') grpRows.splice(idx, 1);
      else r._row_status = r._row_status === 'D' ? 'N' : 'D';
    };

    // 코드그룹 행 취소
    const cancelGrp = (idx) => {
      const r = grpRows[idx];
      if (r._row_status === 'I') { grpRows.splice(idx, 1); return; }
      Object.assign(r, r._orig); r._row_status = 'N';
    };

    // 코드그룹 저장
    const handleSaveGrp = async () => {
      if (!cfGrpDirty.value) { props.showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await props.showConfirm('저장', `${cfGrpDirty.value}건 저장하시겠습니까?`);
      if (!ok) return;
      codeGroups.splice(0, codeGroups.length, ...grpRows.filter(r => r._row_status !== 'D').map(r => ({
        codeGrp: r.codeGrp, grpNm: r.grpNm, pathId: r.pathId, dispPath: r.dispPath, description: r.description, type: r.type, useYn: r.useYn,
      })));
      loadGrp();
      props.showToast('저장되었습니다.', 'success');
    };

    // 표시경로 선택 모달 열기/닫기
    const openPathPick  = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };

    // 그룹 트리 펼침/닫힘/선택
    const grpToggleNode  = (path) => { if (grpExpanded.has(path)) grpExpanded.delete(path); else grpExpanded.add(path); };
    const grpSelectNode  = (path) => { uiState.grpSelectedPath = path; };
    const grpExpandAll   = () => { const walk = (n) => { grpExpanded.add(n.path); n.children.forEach(walk); }; walk(cfGrpTree.value); };
    const grpCollapseAll = () => { grpExpanded.clear(); grpExpanded.add(''); };

    // 코드 트리 노드 펼침 토글
    const codeToggleNode = (codeValue) => {
      if (cfCodeTreeExpanded.has(codeValue)) cfCodeTreeExpanded.delete(codeValue);
      else cfCodeTreeExpanded.add(codeValue);
    };

    // 상세 조회/닫기
    const handleLoadDetail = (codeId) => { uiState.selectedCodeId = codeId; };
    const closeDetail       = () => { uiState.selectedCodeId = null; };

    // 페이지 이동
    const setPage     = n => { if (n >= 1 && n <= pager.pageTotalPage) pager.pageNo = n; };
    const setGrpPage  = n => { if (n >= 1 && n <= cfGrpTotalPages.value) grpPager.page = n; };
    const setTreePage = n => { if (n >= 1 && n <= cfTreeTotalPages.value) treePager.page = n; };

    // 상태 배지 클래스
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    // 엑셀 내보내기
    const exportExcel = () => window.boCmUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{ label: 'ID', key: 'codeId' }, { label: '코드그룹', key: 'codeGrp' }, { label: '코드라벨', key: 'codeLabel' },
       { label: '코드값', key: 'codeValue' }, { label: '순서', key: 'sortOrd' }, { label: '사용여부', key: 'useYn' }, { label: '비고', key: 'remark' }],
      '공통코드목록.csv'
    );

    // 표시경로 라벨 반환
    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    // ── return ────────────────────────────────────────────────────────────────

    return {
      uiState, pageCodeGroups,
      cfSiteNm, cfGrpOptions, cfTotal, cfGrpDirty,
      searchParam, searchParamOrg, DATE_RANGE_OPTIONS, handleDateRangeChange,
      gridRows, cfFilteredRows, cfPagedRows, cfTotalPages, cfPageNums, setPage, onSizeChange, getRealIdx,
      pager, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      dragSrc, onDragStart, onDragOver, onDragEnd, toggleCheckAll, fnStatusClass, exportExcel,
      fnGetCodeCountByGrp,
      codeGroups,
      grpRows, addGrp, handleDeleteGrp, cancelGrp, handleSaveGrp, onGrpChange,
      cfGrpTree, grpExpanded, grpToggleNode, grpSelectNode, grpExpandAll, grpCollapseAll,
      cfFilteredGrpRows, cfGrpPagedRows, cfGrpTotalPages, cfGrpPageNums,
      grpPager, GRP_PAGE_SIZES, setGrpPage, onGrpSizeChange, onGrpRowClick,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      cfCodeTree, cfCodeTreeExpanded, codeToggleNode, cfFlatTreeRows,
      cfParentCodeOptions, cfIsTreeTypeGrp, getCodeHierarchyPath,
      cfPagedTreeRows, cfTreeTotalPages, cfTreePageNums,
      treePager, TREE_PAGE_SIZES, setTreePage, onTreeSizeChange,
      handleLoadDetail, closeDetail,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">공통코드관리</div>

  <!-- ── 검색 영역 ──────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="코드그룹 / 라벨 / 코드값 검색" />
      <select v-model="searchParam.grp">
        <option value="">그룹 전체</option>
        <option v-for="g in cfGrpOptions" :key="g">{{ g }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
      </select>
      <span class="search-label">등록일</span>
      <input type="date" v-model="searchParam.dateStart" class="date-range-input" />
      <span class="date-range-sep">~</span>
      <input type="date" v-model="searchParam.dateEnd" class="date-range-input" />
      <select v-model="searchParam.dateRange" @change="handleDateRangeChange">
        <option value="">옵션선택</option>
        <option v-for="o in DATE_RANGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
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
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span class="list-count">{{ cfGrpTree.count }}</span></span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="grpExpandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="grpCollapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:50vh;overflow:auto;">
        <prop-tree-node :node="cfGrpTree" :expanded="grpExpanded" :selected="uiState.grpSelectedPath"
          :on-toggle="grpToggleNode" :on-select="grpSelectNode" :depth="0" />
      </div>
    </div>

    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          공통코드그룹관리
          <span v-if="uiState.grpSelectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ uiState.grpSelectedPath }}</span>
          <span class="list-count">{{ cfFilteredGrpRows.filter(r=>r._row_status!=='D').length }}건</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" @click="addGrp">+ 행추가</button>
          <button class="btn btn-primary btn-sm" @click="handleSaveGrp" :disabled="!cfGrpDirty">저장 <span v-if="cfGrpDirty">({{ cfGrpDirty }})</span></button>
        </div>
      </div>
      <table class="bo-table crud-grid">
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
          <tr v-if="cfGrpPagedRows.length===0">
            <td colspan="8" style="text-align:center;color:#999;padding:20px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="(g, idx) in cfGrpPagedRows" :key="g.codeGrp + (g._tempId || '')"
            class="crud-row"
            :class="['status-'+g._row_status, uiState.selectedGrp===g.codeGrp ? 'focused' : '']"
            style="cursor:pointer;"
            @click="onGrpRowClick(g)">
            <td class="col-status-val"><span class="badge badge-xs" :class="fnStatusClass(g._row_status)">{{ g._row_status }}</span></td>
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
                <span v-if="g._row_status !== 'D'" style="font-size:11px;color:#666;font-weight:500;white-space:nowrap;padding:4px 8px;background:#f3f4f6;border-radius:4px;">{{ fnGetCodeCountByGrp(g.codeGrp) }}개</span>
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
                <option value="Y">사용</option><option value="N">미사용</option>
              </select>
            </td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(g._row_status)" class="btn btn-secondary btn-xs" @click.stop="cancelGrp(idx)">취소</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(g._row_status)" class="btn btn-danger btn-xs" @click.stop="handleDeleteGrp(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ── 그룹 페이징 ───────────────────────────────────────────────── -->
      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="grpPager.page===1" @click="setGrpPage(1)">«</button>
          <button :disabled="grpPager.page===1" @click="setGrpPage(grpPager.page-1)">‹</button>
          <button v-for="n in cfGrpPageNums" :key="n" :class="{active:grpPager.page===n}" @click="setGrpPage(n)">{{ n }}</button>
          <button :disabled="grpPager.page===cfGrpTotalPages" @click="setGrpPage(grpPager.page+1)">›</button>
          <button :disabled="grpPager.page===cfGrpTotalPages" @click="setGrpPage(cfGrpTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="grpPager.size" @change="onGrpSizeChange">
            <option v-for="s in GRP_PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 코드 목록 영역 ──────────────────────────────────────────────────── -->
  <div class="card">
    <!-- ── 툴바 ──────────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>코드목록
        <span v-if="uiState.selectedGrp" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ uiState.selectedGrp }}</span>
        <span v-else-if="uiState.grpSelectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ uiState.grpSelectedPath }}</span>
        <span class="list-count">{{ cfTotal }}건</span>
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
      <button @click="uiState.activeCodeTab='일반'" :class="{active: uiState.activeCodeTab==='일반'}"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='일반' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}">일반</button>
      <button @click="uiState.activeCodeTab='트리'" :disabled="!uiState.selectedGrp" :class="{active: uiState.activeCodeTab==='트리'}"
        style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-weight:500;transition:all 0.2s;"
        :style="uiState.activeCodeTab==='트리' ? {borderBottomColor:'#e8587a',color:'#e8587a'} : {}"
        :disabled="!uiState.selectedGrp">트리</button>
    </div>

    <!-- ── 일반 탭: 테이블 (스크롤) ────────────────────────────────────── -->
    <div v-if="uiState.activeCodeTab==='일반'" style="overflow-y:auto;max-height:400px;border:1px solid #e5e7eb;">
      <table class="bo-table crud-grid">
        <thead style="position:sticky;top:0;background:#fff;z-index:10;">
          <tr>
            <th class="col-drag"></th>
            <th class="col-id">ID</th>
            <th class="col-status">상태</th>
            <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
            <th>코드그룹</th>
            <th style="width:60px;">유형</th>
            <th>코드라벨</th>
            <th>코드값</th>
            <th v-if="cfIsTreeTypeGrp" style="width:140px;">상위코드값</th>
            <th class="col-ord">순서</th>
            <th class="col-use">사용여부</th>
            <th>비고</th>
            <th style="width:80px;">사이트명</th>
            <th class="col-act-cancel"></th>
            <th class="col-act-delete"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cfFilteredRows.length===0">
            <td :colspan="cfIsTreeTypeGrp ? 13 : 12" style="text-align:center;color:#999;padding:30px;">{{ uiState.selectedGrp ? '데이터가 없습니다.' : '그룹을 선택해주세요.' }}</td>
          </tr>
          <tr v-for="(row, idx) in cfPagedRows" :key="row.codeId"
            class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===getRealIdx(idx) ? 'focused' : '']"
            draggable="true"
            @click="setFocused(getRealIdx(idx))"
            @dblclick="handleLoadDetail(row.codeId)"
            @dragstart="onDragStart(getRealIdx(idx))"
            @dragover="onDragOver($event, getRealIdx(idx))"
            @dragend="onDragEnd">
            <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
            <td class="col-id-val">{{ row.codeId > 0 ? row.codeId : 'NEW' }}</td>
            <td class="col-status-val">
              <span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span>
            </td>
            <td class="col-check-val">
              <input type="checkbox" v-model="row._row_check" />
            </td>
            <td><input class="grid-input" v-model="row.codeGrp"   :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td style="text-align:center;">
              <span v-if="codeGroups.find(g => g.codeGrp === row.codeGrp)" style="display:inline-block;padding:3px 6px;border-radius:3px;font-size:10px;font-weight:600;"
                :style="codeGroups.find(g => g.codeGrp === row.codeGrp)?.type === '트리' ? {background:'#fecaca',color:'#991b1b'} : {background:'#dbeafe',color:'#1e40af'}">
                {{ codeGroups.find(g => g.codeGrp === row.codeGrp)?.type || '-' }}
              </span>
              <span v-else style="color:#999;">-</span>
            </td>
            <td><input class="grid-input" v-model="row.codeLabel"  :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td><input class="grid-input grid-mono" v-model="row.codeValue" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td v-if="cfIsTreeTypeGrp">
              <select class="grid-select" v-model="row.parentCodeValue" :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option :value="null">-- 없음 --</option>
                <option v-for="opt in cfParentCodeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td>
              <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option value="Y">사용</option><option value="N">미사용</option>
              </select>
            </td>
            <td><input class="grid-input" v-model="row.remark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
            <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
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
    </div>

    <!-- ── 트리 탭: 편집 가능한 테이블 (스크롤) ────────────────────────── -->
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
          <tr v-if="cfCodeTree.count===0">
            <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-else v-for="(row, idx) in cfFlatTreeRows" :key="row.node.value" class="crud-row" :class="['status-'+row.node.code._row_status]" style="user-select:none;" @click="setFocused(gridRows.indexOf(row.node.code))">
            <td class="col-status-val">
              <span class="badge badge-xs" :class="fnStatusClass(row.node.code._row_status)">{{ row.node.code._row_status }}</span>
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
                  {{ cfCodeTreeExpanded.has(row.node.value) ? '▼' : '▶' }}
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
                <option v-for="opt in cfParentCodeOptions" :key="opt.value" :value="opt.value">
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
            <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
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
