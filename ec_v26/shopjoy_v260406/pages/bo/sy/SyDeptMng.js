/* ShopJoy Admin - 부서관리 (Tree CRUD 그리드) */
window.SyDeptMng = {
  name: 'SyDeptMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const depts = reactive([]);
    const uiState = reactive({ checkAll: false, loading: false, error: null, isPageCodeLoad: false, selectedTreeId: null, focusedIdx: null});
    const codes = reactive({ dept_status: [], use_yn: [], dept_types: ['경영','운영','기술','마케팅','CS','물류','재무','인사','법무','기타'] });

    // 트리용 전체 로드 (dept_id, parent_dept_id, dept_nm 만)
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchTree — 처리 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syDept.getTree('부서관리', '트리조회');
        const list = res.data?.data || [];
        depts.splice(0, depts.length, ...list);
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };

    // 그리드용 조회 (트리 노드 선택 or 검색 조건 기반)
    /* handleGridSearch — 처리 */
    const handleGridSearch = async () => {
      uiState.loading = true;
      try {
        const { type, ...restParam } = searchParam;
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(type ? { typeCd: type } : {}),
          ...(uiState.selectedTreeId != null ? { parentDeptId: uiState.selectedTreeId } : {}),
        };
        const res = await boApiSvc.syDept.getPage(params, '부서관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0);
        buildTreeRows(list).forEach(d => gridRows.push(makeRow(d)));
        uiState.error = null;
      } catch (err) {
        console.error('[handleGridSearch]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchList — 목록 조회 */

    const handleSearchList = async () => {
      await handleSearchTree();
      await handleGridSearch();
    };

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {

      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* 좌측 부서 트리 */
    const expanded = reactive(new Set([null]));

    /* toggleNode — 노드 토글 */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* selectNode — 노드 선택 */
    const selectNode = (id) => { uiState.selectedTreeId = id; handleGridSearch(); };

    /* buildTree — 빌드 */
    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId].children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });

      /* sort — 정렬 */
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));

      /* sortAll — 정렬 */
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));

    /* expandAll — 펼치기 전체 */
    const expandAll = () => {
      /* walk — walk */
      const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); };
      cfTree.value.children.forEach(walk);
      expanded.add(null);
    };

    /* collapseAll — 접기 전체 */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      await handleSearchTree();
      expanded.add(null);
      await handleGridSearch();
    });

    /* fnLoadCodes — 공통코드 로드 */

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.dept_status = codeStore.sgGetGrpCodes('DEPT_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };

    const cfTypeOptions = computed(() => [...new Set(depts.map(d => d.deptTypeCd))].sort());

    /* -- CRUD 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;

    const EDIT_FIELDS = ['deptCode', 'deptNm', 'parentDeptId', 'deptTypeCd', 'sortOrd', 'useYn', 'deptRemark'];

    /* buildTreeRows — 빌드 */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, _children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId]._children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });
      const result = [];

      /* traverse — traverse */
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    /* makeRow — 행 생성 */
    const makeRow = (d) => ({
      ...d, _depth: d._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { deptCode: d.deptCode, deptNm: d.deptNm, parentDeptId: d.parentDeptId,
               deptTypeCd: d.deptTypeCd, sortOrd: d.sortOrd, useYn: d.useYn, deptRemark: d.deptRemark },
    });

    /* onSearch — 조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    /* setFocused — 포커스 설정 */
    const setFocused = (realIdx) => { uiState.focusedIdx = realIdx; };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        deptId: _tempId--, deptCode: '', deptNm: '', parentDeptId: ref ? ref.parentDeptId : null,
        deptTypeCd: ref ? ref.deptTypeCd : '운영',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', deptRemark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else {
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.deptId));
      if (!checkedIds.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.deptId)) continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_status !== 'N') {
          if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
          row._row_status = 'N';
        }
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.deptCode || !r.deptNm) { showToast('부서코드와 부서명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syDept.saveList(saveRows, '부서관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* parentNm — 상위 Nm */
    const parentNm = (parentDeptId) => {
      if (!parentDeptId) return '';
      const p = depts.find(d => d.deptId === parentDeptId);
      return p ? p.deptNm : `ID:${parentDeptId}`;
    };

    const deptTreeModal = reactive({ show: false, targetRow: null });

    /* openParentModal — 열기 */
    const openParentModal = async (row) => { deptTreeModal.targetRow = row; await handleSearchList(); deptTreeModal.show = true; };

    /* onParentSelect — 이벤트 */
    const onParentSelect  = (dept) => {
      if (deptTreeModal.targetRow) { deptTreeModal.targetRow.parentDeptId = dept.deptId; deptTreeModal.targetRow._depth = 0; onCellChange(deptTreeModal.targetRow); }
      deptTreeModal.show = false;
    };

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* depthBullet — 깊이 글머리 */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* depthColor — 깊이 색상 */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ null: 'badge-gray', N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'deptId'},{label:'부서코드',key:'deptCode'},{label:'부서명',key:'deptNm'},{label:'상위ID',key:'parentDeptId'},{label:'유형',key:'deptTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'deptRemark'}],
      '부서목록.csv'
    );

    /* BoGridCrud 컬럼 정의 (특수셀은 cell/head 슬롯으로 override) */

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'deptCode', label: '부서코드' },
          { value: 'deptNm',   label: '부서명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => cfTypeOptions.value, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseGridColumns = [
      { key: 'deptCode',     label: '부서코드', style: 'width:110px;',    edit: 'text', mono: true },
      { key: 'deptNm',       label: '부서명',   style: 'min-width:190px;', edit: 'text',
        treeDepth: true, treeBullet: depthBullet, treeColor: depthColor },
      { key: 'parentDeptId', label: '상위부서', style: 'min-width:150px;',
        parentPick: { label: parentNm, open: openParentModal, title: '상위부서 선택' } },
      { key: 'deptTypeCd',   label: '유형',     style: 'width:90px;',     edit: 'select', options: codes.dept_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',      label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',        label: '사용여부', cls: 'col-use',  edit: 'select', options: codes.use_yn },
      { key: 'deptRemark',   label: '비고',     edit: 'text' },
      { key: 'siteNm',       label: '사이트명', style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    // ===== return (템플릿 노출) ===============================================

    return { depts, uiState, codes, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      searchParam, cfTypeOptions,
      cfSiteNm, baseSearchColumns, baseGridColumns,
      gridRows,
      setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      toggleCheckAll, parentNm,
      deptTreeModal, openParentModal, onParentSelect,
      depthBullet, depthColor, fnStatusClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">부서관리</div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 부서</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedTreeId" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>
    <div>
      <!-- ===== ■.■.■. CRUD 그리드 ============================================ -->
      <bo-grid-crud
        :columns="baseGridColumns" :rows="gridRows" row-key="deptId"
        list-title="부서목록" :show-export="true" :draggable="false"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="addRow" @save="handleSave"
        @delete-checked="deleteRows" @cancel-checked="cancelChecked"
        @cell-change="onCellChange" @export="exportExcel">
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row" :allow-delete-null="true"
            @cancel="cancelRow(idx)" @delete="deleteRow(idx)" />
        </template>
      </bo-grid-crud>
      <dept-tree-modal
        v-if="deptTreeModal && deptTreeModal.show" :exclude-id="deptTreeModal.targetRow && deptTreeModal.targetRow.deptId > 0 ? deptTreeModal.targetRow.deptId : null"
        @select="onParentSelect"
        @close="deptTreeModal.show=false" />
    </div>
  </div>
</div>
`,
};

window.DeptTreeNode = {
  name: 'DeptTreeNode',
  props: {
    node:     { type: Object, default: () => ({}) }, // 전달값
    expanded: { type: Boolean, default: false }, // 전달값
    selected: { type: Boolean, default: false }, // 전달값
    onToggle: { type: Function, default: () => {} }, // 콜백 함수
    onSelect: { type: Function, default: () => {} }, // 콜백 함수
    depth:    { type: Number, default: 0 }, // 전달값
  },
  components: { 'dept-tree-node': null },
  created() { this.$options.components['dept-tree-node'] = window.DeptTreeNode; },
  template: `
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div :style="{ paddingLeft: (depth * 14) + 'px', display:'flex', alignItems:'center',
    cursor:'pointer', padding:'4px 6px 4px ' + (depth*14+6) + 'px',
    borderRadius:'4px', background: selected === node.deptId ? '#ffeef2' : 'transparent',
    fontWeight: selected === node.deptId ? '600' : 'normal',
    color: selected === node.deptId ? '#e8587a' : '#333' }"
    @click.stop="onSelect(node.deptId)">
    <span v-if="node.children && node.children.length"
      @click.stop="onToggle(node.deptId)"
      style="margin-right:4px;font-size:10px;width:14px;text-align:center;flex-shrink:0;">
      {{ expanded.has(node.deptId) ? '▼' : '▶' }}
    </span>
    <span v-else style="margin-right:4px;width:14px;flex-shrink:0;"></span>
    <span style="font-size:13px;">{{ node.deptNm }}</span>
  </div>
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <template v-if="node.children && node.children.length && expanded.has(node.deptId)">
    <dept-tree-node v-for="child in node.children" :key="child.deptId"
      :node="child" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth + 1" />
  </template>
</div>
`
};
