/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달

    /* -- 코드 -- */
    const codes = reactive({ use_yn: [] });
    const uiStateCode = reactive({ isPageCodeLoad: false });

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiStateCode.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {

      return { searchType: '', searchValue: '', bizCd: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* -- 트리용 전체 경로 (path_id + parent_path_id 기반) -- */
    const allPaths = reactive([]);

    const cfTree = computed(() => {
      const map = {};
      allPaths.forEach(r => { map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.parentPathId != null && map[r.parentPathId]) { map[r.parentPathId].children.push(map[r.pathId]); }
        else { roots.push(map[r.pathId]); }
      });

      /* sort — 정렬 */
      const sort = (arr) => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

      /* sortDeep — 정렬 */
      const sortDeep = (nodes) => { sort(nodes).forEach(n => sortDeep(n.children)); return nodes; };
      sortDeep(roots);
      return { pathId: null, pathLabel: '전체', children: roots, count: allPaths.length };
    });

    const expanded = reactive(new Set([null]));
    const uiState = reactive({ selectedPathId: null });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* toggleNode — 노드 토글 */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* selectNode — 노드 선택 */
    const selectNode = (id) => {
      uiState.selectedPathId = (uiState.selectedPathId === id) ? null : id;
      pager.pageNo = 1;
      handleGridSearch();
    };

    /* expandAll — 펼치기 전체 */
    const expandAll = () => {
      expanded.clear(); expanded.add(null);

      /* walk — walk */
      const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); };
      cfTree.value.children.forEach(walk);
    };

    /* collapseAll — 접기 전체 */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* -- 그리드 -- */
    const gridRows = reactive([]);
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [10, 20, 50, 100], pageCond: {} });
    let _newId = -1;

    /* fnBuildPagerNums — 유틸 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* handleSearchTree — 처리 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '경로관리', '트리조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        allPaths.splice(0, allPaths.length, ...list);
        expanded.clear(); expanded.add(null);
        allPaths.filter(r => r.parentPathId == null).forEach(r => expanded.add(r.pathId));
      } catch (e) { console.error('[handleSearchTree]', e); }
    };

    /* handleGridSearch — 처리 */
    const handleGridSearch = async () => {
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...searchParam };
        if (uiState.selectedPathId != null) { params.parentPathId = uiState.selectedPathId; }
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathLabel,pathRemark';
        }
        const res = await boApiSvc.syPath.getPage(params, '경로관리', '목록조회');
        const data = res.data?.data || {};
        const list = data.pageList || data.list || [];
        gridRows.splice(0, gridRows.length, ...list.map(r => ({ ...r, _status: null, _row_org: { ...r } })));
        pager.pageTotalCount = data.pageTotalCount ?? data.totalCount ?? list.length;
        pager.pageTotalPage  = data.pageTotalPage  ?? Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
        fnBuildPagerNums();
      } catch (e) { console.error('[handleGridSearch]', e); }
    };

    onMounted(async () => {
      await handleSearchTree();
      await handleGridSearch();
    });

    /* onSearch — 조회 */

    const onSearch = async () => { pager.pageNo = 1; await handleGridSearch(); };

    /* onReset — 초기화 */
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.selectedPathId = null;
      pager.pageNo = 1;
      await handleGridSearch();
    };

    /* setPage — 설정 */
    const setPage = async (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleGridSearch(); } };

    /* onSizeChange — 페이지 크기 변경 */
    const onSizeChange = async () => { pager.pageNo = 1; await handleGridSearch(); };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (!row._status) { row._status = 'U'; }
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      gridRows.unshift({
        pathId: _newId--,
        bizCd: searchParam.bizCd || '',
        parentPathId: uiState.selectedPathId,
        pathLabel: '',
        sortOrd: 0,
        useYn: 'Y',
        pathRemark: '',
        _status: 'N',
        _row_org: null,
      });
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (row) => {
      if (row._status === 'N') {
        const idx = gridRows.findIndex(r => r.pathId === row.pathId);
        if (idx !== -1) { gridRows.splice(idx, 1); }
      } else if (row._row_org) {
        Object.assign(row, row._row_org, { _status: null });
      }
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = async (row) => {
      if (row._status === 'N') { cancelRow(row); return; }
      const ok = await showConfirm?.('삭제', `[${row.pathLabel}] 경로를 삭제하시겠습니까?`);
      if (!ok) { return; }
      try {
        const res = await boApiSvc.syPath.remove(row.pathId, '경로관리', '삭제');
        if (setApiRes) { setApiRes({ ok: true, status: res.status, data: res.data }); }
        showToast?.('삭제되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (setApiRes) { setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message }); }
        showToast?.(msg, 'error', 0);
      }
    };

    const cfDirtyRows = computed(() => gridRows.filter(r => r._status === 'N' || r._status === 'U'));

    /* handleSave — 저장 */
    const handleSave = async () => {
      const changed = cfDirtyRows.value;
      if (!changed.length) { showToast?.('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.pathLabel) { showToast?.('경로 라벨은 필수입니다.', 'error'); return; }
      }
      const ok = await showConfirm?.('저장', `${changed.length}건을 저장하시겠습니까?`);
      if (!ok) { return; }
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status || r._status }));
      try {
        await boApiSvc.syPath.saveList(saveRows, '경로관리', '저장');
        showToast?.('저장되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* -- 부모경로 선택 모달 -- */
    const parentModal = reactive({ show: false, targetRow: null, expanded: new Set([null]) });

    const cfParentTree = computed(() => {
      const exclude = parentModal.targetRow?.pathId;
      const map = {};
      allPaths.forEach(r => { if (r.pathId !== exclude) map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.pathId === exclude) { return; }
        if (r.parentPathId != null && map[r.parentPathId]) { map[r.parentPathId].children.push(map[r.pathId]); }
        else { roots.push(map[r.pathId]); }
      });
      return { pathId: null, pathLabel: '전체', children: roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)) };
    });

    /* openParentModal — 열기 */
    const openParentModal = async (row) => {
      parentModal.targetRow = row;
      parentModal.expanded.clear();
      parentModal.expanded.add(null);
      await handleSearchTree();
      allPaths.filter(r => r.parentPathId == null && r.pathId !== row.pathId).forEach(r => parentModal.expanded.add(r.pathId));
      parentModal.show = true;
    };

    /* closeParentModal — 닫기 */
    const closeParentModal = () => { parentModal.show = false; parentModal.targetRow = null; };

    /* toggleParentNode — 토글 */
    const toggleParentNode = (id) => { if (parentModal.expanded.has(id)) parentModal.expanded.delete(id); else parentModal.expanded.add(id); };

    /* selectParent — 선택 */
    const selectParent = (pathId) => {
      if (parentModal.targetRow) { onCellChange(parentModal.targetRow, 'parentPathId', pathId); }
      closeParentModal();
    };

    /* getParentLabel — 조회 */
    const getParentLabel = (pathId) => {
      if (pathId == null) { return '(루트)'; }
      return allPaths.find(r => r.pathId === pathId)?.pathLabel || String(pathId);
    };

    /* BoGrid 컬럼 정의 — 전 셀 슬롯 (기존 onCellChange 변경추적 보존) */

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'bizCd', type: 'text', label: '업무코드', placeholder: 'biz_cd 검색', width: '180px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'pathLabel',  label: '라벨' },
          { value: 'pathRemark', label: '비고' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '320px' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseGridColumns = [
      { key: 'rowStatus',    label: '상태',     style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => 'badge-xs ' + (row._status === 'N' ? 'badge-green' : row._status === 'U' ? 'badge-orange' : 'badge-gray'),
        fmt: (v, row) => row._status || 'N' },
      { key: 'pathId',       label: 'ID',       style: 'width:60px;text-align:center;', align: 'center',
        cellStyle: 'font-size:11px;color:#999;',
        fmt: (v, row) => row.pathId > 0 ? row.pathId : 'NEW' },
      { key: 'bizCd',        label: '업무코드', style: 'width:120px;', edit: 'text', placeholder: 'biz_cd' },
      { key: 'parentPathId', label: '부모경로', style: 'width:160px;',
        linkButton: { label: (row) => getParentLabel(row.parentPathId), onClick: openParentModal } },
      { key: 'pathLabel',    label: '경로 라벨', edit: 'text', placeholder: '경로 라벨' },
      { key: 'sortOrd',      label: '정렬',     style: 'width:60px;text-align:center;', edit: 'number', align: 'center' },
      { key: 'useYn',        label: '사용',     style: 'width:70px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
      { key: 'pathRemark',   label: '비고',     style: 'width:160px;', edit: 'text', placeholder: '비고' },
    ];
    /* fnRowClass — 유틸 */
    const fnRowClass = (r) => 'status-' + (r._status || '');

    // ===== return (템플릿 노출) ===============================================

    return {
      uiState, searchParam, codes,
      cfTree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      gridRows, cfDirtyRows, pager, setPage, onSizeChange, baseSearchColumns, baseGridColumns, fnRowClass,
      onSearch, onReset, onCellChange, addRow, cancelRow, deleteRow, handleSave,
      parentModal, cfParentTree, openParentModal, closeParentModal, toggleParentNode, selectParent, getParentLabel,
    };
  },

  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">표시경로</div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-local-tree-card title="경로 트리" biz-cd="sy_path" :sticky="true"
      :node="cfTree" :expanded="expanded" :selected="uiState.selectedPathId"
      :on-toggle="toggleNode"
      @select="selectNode" @expand-all="expandAll" @collapse-all="collapseAll" />
    <!-- ===== □.□. 트리 ==================================================== -->
    <!-- ===== ■.■. 그리드 =================================================== -->
    <!-- ===== ■.■. 목록 영역 ================================================= -->
    <bo-grid
      :columns="baseGridColumns" :rows="gridRows" :pager="pager" row-key="pathId"
      list-title="경로 목록" :count-text="pager.pageTotalCount + '건'"
      :row-class="fnRowClass" :show-save="true" :row-actions="true"
      @save="handleSave" @set-page="setPage" @size-change="onSizeChange" @cell-change="onCellChange">
      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
      </template>
      <template #head-actions>관리</template>
      <template #row-actions="{ row }">
        <button v-if="row._status==='N'" class="btn btn-secondary btn-xs" @click.stop="cancelRow(row)">취소</button>
        <button v-else class="btn btn-danger btn-xs" @click.stop="deleteRow(row)">삭제</button>
      </template>
    </bo-grid>
  </div>
    <!-- ===== □.□. 목록 영역 ================================================= -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
  <!-- ===== ■. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->
  <bo-tree-selector-modal :show="parentModal.show" title="부모경로 선택"
    :node="cfParentTree" :expanded="parentModal.expanded" :on-toggle="toggleParentNode"
    root-label="(루트 — 상위없음)"
    @select="selectParent" @close="closeParentModal" />
</div>

  <!-- ===== □. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->`,
};

/* PathTreeNode, PathParentSelector → components/comp/BoComp.js */
