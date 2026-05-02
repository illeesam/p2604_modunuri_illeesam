/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],

  setup(props) {
    const { reactive, computed, watch, onMounted } = Vue;

    /* ── 코드 ── */
    const codes = reactive({ use_yn: [] });
    const uiStateCode = reactive({ isPageCodeLoad: false });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiStateCode.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
        uiStateCode.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });

    /* ── 검색 파라미터 ── */
    const _initSearchParam = () => {
      return { bizCd: '', kw: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ── 트리용 전체 경로 (path_id + parent_path_id 기반) ── */
    const allPaths = reactive([]);

    const cfTree = computed(() => {
      const map = {};
      allPaths.forEach(r => { map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.parentPathId != null && map[r.parentPathId]) map[r.parentPathId].children.push(map[r.pathId]);
        else roots.push(map[r.pathId]);
      });
      const sort = (arr) => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortDeep = (nodes) => { sort(nodes).forEach(n => sortDeep(n.children)); return nodes; };
      sortDeep(roots);
      return { pathId: null, pathLabel: '전체', children: roots, count: allPaths.length };
    });

    const expanded = reactive(new Set([null]));
    const uiState = reactive({ selectedPathId: null });

    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPathId = (uiState.selectedPathId === id) ? null : id; };
    const expandAll = () => {
      expanded.clear(); expanded.add(null);
      const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); };
      cfTree.value.children.forEach(walk);
    };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* ── 그리드 ── */
    const gridRows = reactive([]);
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [10, 20, 50, 100], pageCond: {} });
    let _newId = -1;

    const fnBuildPagerNums = () => {
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };

    /* ── 트리 전체 조회 (path_id / parent_path_id 기반) ── */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '경로관리', '트리조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        allPaths.splice(0, allPaths.length, ...list);
        expanded.clear(); expanded.add(null);
        allPaths.filter(r => r.parentPathId == null).forEach(r => expanded.add(r.pathId));
      } catch (e) { console.error('[handleSearchTree]', e); }
    };

    /* ── 그리드 조회 ── */
    const handleGridSearch = async () => {
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...searchParam };
        if (uiState.selectedPathId != null) params.parentPathId = uiState.selectedPathId;
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

    watch(() => uiState.selectedPathId, async () => { pager.pageNo = 1; await handleGridSearch(); });

    const onSearch = async () => { pager.pageNo = 1; await handleGridSearch(); };
    const onReset = async () => {
      Object.assign(searchParam, _initSearchParam());
      uiState.selectedPathId = null;
      pager.pageNo = 1;
      await handleGridSearch();
    };
    const setPage = async (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleGridSearch(); } };
    const onSizeChange = async () => { pager.pageNo = 1; await handleGridSearch(); };

    /* ── 행 편집 ── */
    const onCellChange = (row, field, val) => {
      row[field] = val;
      if (!row._status) row._status = 'U';
    };

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

    const cancelRow = (row) => {
      if (row._status === 'N') {
        const idx = gridRows.findIndex(r => r.pathId === row.pathId);
        if (idx !== -1) gridRows.splice(idx, 1);
      } else if (row._row_org) {
        Object.assign(row, row._row_org, { _status: null });
      }
    };

    const deleteRow = async (row) => {
      if (row._status === 'N') { cancelRow(row); return; }
      const ok = await props.showConfirm?.('삭제', `[${row.pathLabel}] 경로를 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        const res = await boApiSvc.syPath.remove(row.pathId, '경로관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        props.showToast?.('삭제되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        props.showToast?.(msg, 'error', 0);
      }
    };

    const cfDirtyRows = computed(() => gridRows.filter(r => r._status === 'N' || r._status === 'U'));

    const handleSave = async () => {
      const changed = cfDirtyRows.value;
      if (!changed.length) { props.showToast?.('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.pathLabel) { props.showToast?.('경로 라벨은 필수입니다.', 'error'); return; }
      }
      const ok = await props.showConfirm?.('저장', `${changed.length}건을 저장하시겠습니까?`);
      if (!ok) return;
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status || r._status }));
      try {
        await boApiSvc.syPath.saveList(saveRows, '경로관리', '저장');
        props.showToast?.('저장되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        props.showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ── 부모경로 선택 모달 ── */
    const parentModal = reactive({ show: false, targetRow: null, expanded: new Set([null]) });

    const cfParentTree = computed(() => {
      const exclude = parentModal.targetRow?.pathId;
      const map = {};
      allPaths.forEach(r => { if (r.pathId !== exclude) map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.pathId === exclude) return;
        if (r.parentPathId != null && map[r.parentPathId]) map[r.parentPathId].children.push(map[r.pathId]);
        else roots.push(map[r.pathId]);
      });
      return { pathId: null, pathLabel: '전체', children: roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)) };
    });

    const openParentModal = async (row) => {
      parentModal.targetRow = row;
      parentModal.expanded.clear();
      parentModal.expanded.add(null);
      await handleSearchTree();
      allPaths.filter(r => r.parentPathId == null && r.pathId !== row.pathId).forEach(r => parentModal.expanded.add(r.pathId));
      parentModal.show = true;
    };
    const closeParentModal = () => { parentModal.show = false; parentModal.targetRow = null; };
    const toggleParentNode = (id) => { if (parentModal.expanded.has(id)) parentModal.expanded.delete(id); else parentModal.expanded.add(id); };
    const selectParent = (pathId) => {
      if (parentModal.targetRow) onCellChange(parentModal.targetRow, 'parentPathId', pathId);
      closeParentModal();
    };
    const getParentLabel = (pathId) => {
      if (pathId == null) return '(루트)';
      return allPaths.find(r => r.pathId === pathId)?.pathLabel || String(pathId);
    };

    if (isAppReady.value) fnLoadCodes();

    return {
      uiState, searchParam, codes,
      cfTree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      gridRows, cfDirtyRows, pager, setPage, onSizeChange,
      onSearch, onReset, onCellChange, addRow, cancelRow, deleteRow, handleSave,
      parentModal, cfParentTree, openParentModal, closeParentModal, toggleParentNode, selectParent, getParentLabel,
    };
  },

  template: /* html */`
<div>
  <div class="page-title">표시경로</div>

  <!-- ── 검색 ── -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">업무코드</label>
      <input class="form-control" v-model="searchParam.bizCd" placeholder="biz_cd 검색" style="width:180px" @keyup.enter="onSearch">
      <label class="search-label">라벨/비고</label>
      <input class="form-control" v-model="searchParam.kw" placeholder="라벨 / 비고 검색" style="min-width:200px;flex:1;max-width:320px" @keyup.enter="onSearch">
      <label class="search-label">사용여부</label>
      <select class="form-control" v-model="searchParam.useYn" style="width:120px">
        <option value="">전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- ── 좌 트리 + 우 그리드 ── -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- 트리 -->
    <div class="card" style="padding:12px;position:sticky;top:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📂 경로 트리 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_path</span></span>
        <div v-if="uiState.selectedPathId != null" style="font-size:11px;color:#1677ff;cursor:pointer" @click="selectNode(null)">전체보기</div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto">
        <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPathId"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <!-- 그리드 -->
    <div class="card">
      <div class="toolbar">
        <span class="list-title">
          경로 목록
          <span v-if="uiState.selectedPathId != null" style="font-size:12px;color:#1677ff;margin-left:6px">
            — {{ getParentLabel(uiState.selectedPathId) }} 하위
          </span>
          <span class="list-count">{{ pager.pageTotalCount }}건</span>
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
        </div>
      </div>

      <table class="bo-table" style="table-layout:fixed">
        <colgroup>
          <col style="width:40px">
          <col style="width:60px">
          <col style="width:120px">
          <col style="width:160px">
          <col>
          <col style="width:60px">
          <col style="width:70px">
          <col style="width:160px">
          <col style="width:50px">
        </colgroup>
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>상태</th>
          <th>ID</th>
          <th>업무코드</th>
          <th>부모경로</th>
          <th>경로 라벨</th>
          <th style="text-align:center">정렬</th>
          <th style="text-align:center">사용</th>
          <th>비고</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr v-if="!gridRows.length">
            <td colspan="10" style="text-align:center;color:#aaa;padding:30px">데이터가 없습니다.</td>
          </tr>
          <tr v-else v-for="(r, idx) in gridRows" :key="r.pathId" :class="'status-' + (r._status || '')">
            <td style="text-align:center;font-size:11px;color:#999">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td style="text-align:center">
              <span class="badge badge-xs"
                :class="{ 'badge-green': r._status==='N', 'badge-orange': r._status==='U', 'badge-gray': !r._status }">
                {{ r._status || 'N' }}
              </span>
            </td>
            <td style="text-align:center;font-size:11px;color:#999">{{ r.pathId > 0 ? r.pathId : 'NEW' }}</td>
            <td style="padding:3px 6px">
              <input class="grid-input" :value="r.bizCd" @input="onCellChange(r,'bizCd',$event.target.value)" placeholder="biz_cd">
            </td>
            <td style="padding:3px 6px">
              <button class="btn btn-secondary btn-xs" style="font-size:11px;width:100%;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                @click.stop="openParentModal(r)">
                {{ getParentLabel(r.parentPathId) }} ▼
              </button>
            </td>
            <td style="padding:3px 6px">
              <input class="grid-input" :value="r.pathLabel" @input="onCellChange(r,'pathLabel',$event.target.value)" placeholder="경로 라벨">
            </td>
            <td style="padding:3px 4px">
              <input class="grid-input grid-num" type="number" :value="r.sortOrd" @input="onCellChange(r,'sortOrd',Number($event.target.value))" style="text-align:center">
            </td>
            <td style="padding:3px 4px;text-align:center">
              <select class="grid-select" :value="r.useYn" @change="onCellChange(r,'useYn',$event.target.value)" style="width:52px">
                <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
              </select>
            </td>
            <td style="padding:3px 6px">
              <input class="grid-input" :value="r.pathRemark" @input="onCellChange(r,'pathRemark',$event.target.value)" placeholder="비고">
            </td>
            <td style="text-align:center;padding:2px">
              <button v-if="r._status==='N'" class="btn btn-secondary btn-xs" @click.stop="cancelRow(r)">취소</button>
              <button v-else class="btn btn-danger btn-xs" @click.stop="deleteRow(r)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
          <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
          <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
          <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
          <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
            <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 부모경로 선택 모달 ── -->
  <teleport to="body" v-if="parentModal.show">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="closeParentModal">
      <div style="background:#fff;border-radius:14px;padding:22px;width:420px;max-height:70vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">부모경로 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="closeParentModal">닫기</button>
        </div>
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <div style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff"
               @click="selectParent(null)">(루트 — 상위없음)</div>
          <path-parent-selector :node="cfParentTree" :expanded="parentModal.expanded"
            :on-toggle="toggleParentNode" :on-select="selectParent" :depth="0" />
        </div>
      </div>
    </div>
  </teleport>
</div>`,
};

/* PathTreeNode, PathParentSelector → components/comp/BoComp.js */
