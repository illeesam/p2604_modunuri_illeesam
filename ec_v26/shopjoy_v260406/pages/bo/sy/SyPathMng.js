/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const codes        = reactive({ use_yn: [] });        // 공통코드
    const uiStateCode  = reactive({ isPageCodeLoad: false }); // 코드 로드 플래그

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyPathMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleGridSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.selectedPathId = null;
        pager.pageNo = 1;
        return handleGridSearch();
      // 경로 그리드 행 추가
      } else if (cmd === 'paths-add') {
        return addRow();
      // 경로 그리드 저장
      } else if (cmd === 'paths-save') {
        return handleSave();
      // 좌측 트리 전체 펼치기
      } else if (cmd === 'pathTree-expandAll') {
        expanded.clear(); expanded.add(null);
        /* walk — 모든 노드 펼치기 */
        const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); };
        cfTree.value.children.forEach(walk);
        return;
      // 좌측 트리 전체 접기
      } else if (cmd === 'pathTree-collapseAll') {
        expanded.clear();
        expanded.add(null);
        return;
      // 좌측 트리 노드 펼침/접힘 토글
      } else if (cmd === 'pathTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 부모경로 모달 닫기
      } else if (cmd === 'parentModal-close') {
        return closeParentModal();
      // 부모경로 모달 노드 펼침/접힘 토글
      } else if (cmd === 'parentModal-toggle') {
        if (parentModal.expanded.has(param)) { parentModal.expanded.delete(param); } else { parentModal.expanded.add(param); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyPathMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 트리 노드 선택 → 그리드 필터링
      if (cmd === 'pathTree-select') {
        uiState.selectedPathId = (uiState.selectedPathId === param) ? null : param;
        pager.pageNo = 1;
        return handleGridSearch();
      // 그리드 셀 변경 감지
      } else if (cmd === 'paths-cellChange') {
        return onCellChange(param);
      // 그리드 행 취소
      } else if (cmd === 'paths-rowCancel') {
        return cancelRow(param);
      // 그리드 행 삭제 (서버 호출)
      } else if (cmd === 'paths-rowDelete') {
        return deleteRow(param);
      // 그리드 행 [부모경로] 컬럼 클릭 → 모달 열기
      } else if (cmd === 'parentModal-open') {
        return openParentModal(param);
      // 페이지 번호 클릭
      } else if (cmd === 'paths-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleGridSearch(); }
        return;
      // 페이지 크기 변경
      } else if (cmd === 'paths-pager-sizeChange') {
        pager.pageNo = 1;
        return handleGridSearch();
      // 부모경로 모달에서 노드 선택 → 행 parentPathId 갱신
      } else if (cmd === 'parentModal-select') {
        return selectParent(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyPathMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'parent-path') {
        if (result == null) {
            return closeParentModal();
        }
        return selectParent(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', bizCd: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건

    const allPaths  = reactive([]);                   // 트리용 전체 경로 (path_id + parent_path_id)
    const expanded  = reactive(new Set([null]));      // 트리 펼친 노드 Set
    const uiState   = reactive({ selectedPathId: null }); // UI 상태

    const gridRows  = reactive([]);                   // 그리드 행
    const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    let _newId      = -1;                             // 신규 행 임시 ID

    /* -- 부모경로 선택 모달 -- */
    const parentModal = reactive({ show: false, targetRow: null, expanded: new Set([null]) }); // 부모경로 선택 모달 상태

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
      /* sortDeep — 깊이별 정렬 */
      const sortDeep = (nodes) => { sort(nodes).forEach(n => sortDeep(n.children)); return nodes; };
      sortDeep(roots);
      return { pathId: null, pathLabel: '전체', children: roots, count: allPaths.length };
    });

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

    const cfDirtyRows = computed(() => gridRows.filter(r => r._status === 'N' || r._status === 'U'));
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
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

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* handleSearchTree — 트리 조회 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '경로관리', '트리조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        allPaths.splice(0, allPaths.length, ...list);
        expanded.clear(); expanded.add(null);
        allPaths.filter(r => r.parentPathId == null).forEach(r => expanded.add(r.pathId));
      } catch (e) { console.error('[handleSearchTree]', e); }
    };

    /* handleGridSearch — 그리드 조회 */
    const handleGridSearch = async () => {
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...searchParam };
        if (uiState.selectedPathId != null) { params.parentPathId = uiState.selectedPathId; }
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
      fnLoadCodes();
      await handleSearchTree();
      await handleGridSearch();
    });

    /* onCellChange — 셀 변경 감지 */
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

    /* deleteRow — 행 삭제 (서버 호출) */
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
        await boApiSvc.syPath.saveList('base', saveRows, '경로관리', '저장');
        showToast?.('저장되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* openParentModal — 부모경로 모달 열기 */
    const openParentModal = async (row) => {
      parentModal.targetRow = row;
      parentModal.expanded.clear();
      parentModal.expanded.add(null);
      await handleSearchTree();
      allPaths.filter(r => r.parentPathId == null && r.pathId !== row.pathId).forEach(r => parentModal.expanded.add(r.pathId));
      parentModal.show = true;
    };

    /* closeParentModal — 부모경로 모달 닫기 */
    const closeParentModal = () => { parentModal.show = false; parentModal.targetRow = null; };

    /* selectParent — 부모경로 선택 */
    const selectParent = (pathId) => {
      if (parentModal.targetRow) {
        parentModal.targetRow.parentPathId = pathId;
        onCellChange(parentModal.targetRow);
      }
      closeParentModal();
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* getParentLabel — 부모경로 라벨 조회 */
    const getParentLabel = (pathId) => {
      if (pathId == null) { return '(루트)'; }
      return allPaths.find(r => r.pathId === pathId)?.pathLabel || String(pathId);
    };

    // 기본 검색
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

    // 기본 그리드
    const baseGridColumns = [
      { key: 'rowStatus',    label: '상태',     style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => 'badge-xs ' + (row._status === 'N' ? 'badge-green' : row._status === 'U' ? 'badge-orange' : 'badge-gray'),
        fmt: (v, row) => row._status || 'N' },
      { key: 'pathId',       label: 'ID',       style: 'width:60px;text-align:center;', align: 'center',
        cellStyle: 'font-size:11px;color:#999;',
        fmt: (v, row) => row.pathId > 0 ? row.pathId : 'NEW' },
      { key: 'bizCd',        label: '업무코드', style: 'width:120px;', edit: 'text', placeholder: 'biz_cd' },
      { key: 'parentPathId', label: '부모경로', style: 'width:160px;',
        linkButton: { label: (row) => getParentLabel(row.parentPathId), onClick: (row) => handleSelectAction('parentModal-open', row) } },
      { key: 'pathLabel',    label: '경로 라벨', edit: 'text', placeholder: '경로 라벨' },
      { key: 'sortOrd',      label: '정렬',     style: 'width:60px;text-align:center;', edit: 'number', align: 'center' },
      { key: 'useYn',        label: '사용',     style: 'width:70px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
      { key: 'pathRemark',   label: '비고',     style: 'width:160px;', edit: 'text', placeholder: '비고' },
    ];

    /* fnRowClass — 행 클래스 */
    const fnRowClass = (r) => 'status-' + (r._status || '');

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      uiState, searchParam, codes, expanded, gridRows, pager, parentModal,         // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                          // 컬럼 정의
      handleBtnAction, handleSelectAction, fnCallbackModal,                                         // dispatch (모든 이벤트 / 액션 라우팅)
      cfTree, cfParentTree, cfDirtyRows,                                           // computed
      fnRowClass,                                                                  // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    표시경로
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-local-tree-card title="경로 트리" biz-cd="sy_path" :sticky="true"
      :node="cfTree" :expanded="expanded" :selected="uiState.selectedPathId"
      :on-toggle="id => handleBtnAction('pathTree-toggle', id)"
      @select="id => handleSelectAction('pathTree-select', id)" @expand-all="handleBtnAction('pathTree-expandAll')" @collapse-all="handleBtnAction('pathTree-collapseAll')" />
    <!-- ===== □.□. 트리 ==================================================== -->
    <!-- ===== ■.■. 그리드 =================================================== -->
    <bo-grid
      :columns="baseGridColumns" :rows="gridRows" row-key="pathId"
      list-title="경로 목록" :count-text="pager.pageTotalCount + '건'"
      :row-class="fnRowClass" :show-save="true" :row-actions="true"
      @save="handleBtnAction('paths-save')"
      @set-page="n => handleSelectAction('paths-pager-setPage', n)"
      @size-change="handleSelectAction('paths-pager-sizeChange')"
      @cell-change="row => handleSelectAction('paths-cellChange', row)">
      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('paths-add')">
          + 행추가
        </button>
      </template>
      <template #head-actions>
        관리
      </template>
      <template #row-actions="{ row }">
        <button v-if="row._status==='N'" class="btn btn-secondary btn-xs" @click.stop="handleSelectAction('paths-rowCancel', row)">
          취소
        </button>
        <button v-else class="btn btn-danger btn-xs" @click.stop="handleSelectAction('paths-rowDelete', row)">
          삭제
        </button>
      </template>
    </bo-grid>
        <bo-pager :pager="pager" :on-set-page="n => handleSelectAction('paths-pager-setPage', n)" :on-size-change="() => handleSelectAction('paths-pager-sizeChange')" />
  </div>
  <!-- ===== □.□. 그리드 =================================================== -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
  <!-- ===== ■. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->
  <bo-tree-selector-modal :show="parentModal.show" title="부모경로 선택"
    :node="cfParentTree" :expanded="parentModal.expanded"
    :on-toggle="id => handleBtnAction('parentModal-toggle', id)"
    root-label="(루트 — 상위없음)" modal-name="parent-path" :on-callback="fnCallbackModal" />
  <!-- ===== □. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->
</div>
`,
};
