/* ShopJoy Admin - 부서관리 (Tree CRUD 그리드) */
window.SyDeptMng = {
  name: 'SyDeptMng',
  props: ['navigate', 'showToast', 'showConfirm'],
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const depts = reactive([]);
    const uiState = reactive({ checkAll: false, loading: false, error: null, isPageCodeLoad: false, selectedTreeId: null, focusedIdx: null});
    const codes = reactive({ dept_status: [], use_yn: [], dept_types: ['경영','운영','기술','마케팅','CS','물류','재무','인사','법무','기타'] });

    // 트리용 전체 로드 (dept_id, parent_dept_id, dept_nm 만)
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

    const handleSearchList = async () => {
      await handleSearchTree();
      await handleGridSearch();
    };
    /* ── 검색 ── */
    const searchParam = reactive({
      kw: '', type: '', useYn: ''
    });
    const searchParamOrg = reactive({
      kw: '', type: '', useYn: ''
    });

    /* 좌측 부서 트리 */
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedTreeId = id; handleGridSearch(); };

    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId].children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));
    const expandAll = () => {
      const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); };
      cfTree.value.children.forEach(walk);
      expanded.add(null);
    };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(async () => {
      if (isAppReady.value) fnLoadCodes();
      Object.assign(searchParamOrg, searchParam);
      await handleSearchTree();
      expanded.add(null);
      await handleGridSearch();
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.dept_status = await codeStore.snGetGrpCodes('DEPT_STATUS') || [];
        codes.use_yn = await codeStore.snGetGrpCodes('USE_YN') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });


    const cfTypeOptions = computed(() => [...new Set(depts.map(d => d.deptTypeCd))].sort());

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    
    const EDIT_FIELDS = ['deptCode', 'deptNm', 'parentDeptId', 'deptTypeCd', 'sortOrd', 'useYn', 'deptRemark'];


    /* ── 트리 정렬 ── */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, _children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) map[d.parentDeptId]._children.push(map[d.deptId]);
        else roots.push(map[d.deptId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = (d) => ({
      ...d, _depth: d._depth || 0, _row_status: null, _row_check: false,
      _row_org: { deptCode: d.deptCode, deptNm: d.deptNm, parentDeptId: d.parentDeptId,
               deptTypeCd: d.deptTypeCd, sortOrd: d.sortOrd, useYn: d.useYn, deptRemark: d.deptRemark },
    });


    const cfTotal = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      handleSearchList();
    };

    const setFocused = (realIdx) => { uiState.focusedIdx = realIdx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

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

    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

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

    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.deptId));
      if (!checkedIds.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
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
        if (!r.deptCode || !r.deptNm) { props.showToast('부서코드와 부서명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syDept.saveList(saveRows, '부서관리', '저장');
        props.showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    const parentNm = (parentDeptId) => {
      if (!parentDeptId) return '';
      const p = depts.find(d => d.deptId === parentDeptId);
      return p ? p.deptNm : `ID:${parentDeptId}`;
    };

    const deptTreeModal = reactive({ show: false, targetRow: null });
    const openParentModal = async (row) => { deptTreeModal.targetRow = row; await handleSearchList(); deptTreeModal.show = true; };
    const onParentSelect  = (dept) => {
      if (deptTreeModal.targetRow) { deptTreeModal.targetRow.parentDeptId = dept.deptId; deptTreeModal.targetRow._depth = 0; onCellChange(deptTreeModal.targetRow); }
      deptTreeModal.show = false;
    };

    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor  = (d) => DEPTH_COLORS[d % 5];
    const fnStatusClass = s => ({ null: 'badge-gray', N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const exportExcel = () => boUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'deptId'},{label:'부서코드',key:'deptCode'},{label:'부서명',key:'deptNm'},{label:'상위ID',key:'parentDeptId'},{label:'유형',key:'deptTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'deptRemark'}],
      '부서목록.csv'
    );

    // ── return ───────────────────────────────────────────────────────────────

    return { depts, uiState, codes, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      searchParam, searchParamOrg, cfTypeOptions,
      cfSiteNm,
      gridRows, cfTotal,
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
  <div class="page-title">부서관리</div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchParam.kw" placeholder="부서코드 / 부서명 검색" />
      <select v-model="searchParam.type">
        <option value="">유형 전체</option>
        <option v-for="t in cfTypeOptions" :key="t">{{ t }}</option>
      </select>
      <select v-model="searchParam.useYn">
        <option value="">사용여부 전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
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

  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>부서목록 <span class="list-count">{{ cfTotal }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
      </div>
    </div>

    <div style="max-height:480px;overflow-y:auto;">
    <table class="bo-table crud-grid">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll" /></th>
          <th style="width:110px;">부서코드</th>
          <th style="min-width:190px;">부서명</th>
          <th style="min-width:150px;">상위부서</th>
          <th style="width:90px;">유형</th>
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
          <td colspan="14" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in gridRows" :key="row.deptId"
          class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===idx ? 'focused' : '']"
          @click="setFocused(idx)">

          <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
          <td class="col-id-val">{{ row.deptId > 0 ? row.deptId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input grid-mono" v-model="row.deptCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>

          <!-- ── 부서명 (불릿 트리) ──────────────────────────────────────────── -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0 ? '7px' : '12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.deptNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- ── 상위부서 ─────────────────────────────────────────────────── -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentDeptId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentDeptId)">{{ parentNm(row.parentDeptId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위부서 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td>
            <select class="grid-select" v-model="row.deptTypeCd" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="t in codes.dept_types" :key="t">{{ t }}</option>
            </select>
          </td>
          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
            </select>
          </td>
          <td><input class="grid-input" v-model="row.deptRemark" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td style="font-size:11px;color:#2563eb;text-align:center;">{{ cfSiteNm }}</td>
          <td class="col-act-cancel-val">
            <button v-if="['U','I','D'].includes(row._row_status)"
              class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
          </td>
          <td class="col-act-delete-val">
            <button v-if="row._row_status == null || ['N','U'].includes(row._row_status)"
              class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>

  <dept-tree-modal
    v-if="deptTreeModal && deptTreeModal.show" :exclude-id="deptTreeModal.targetRow && deptTreeModal.targetRow.deptId > 0 ? deptTreeModal.targetRow.deptId : null"
    @select="onParentSelect"
    @close="deptTreeModal.show=false" />
</div>
`,
};

window.DeptTreeNode = {
  name: 'DeptTreeNode',
  props: ['node', 'expanded', 'selected', 'onToggle', 'onSelect', 'depth'],
  components: { 'dept-tree-node': null },
  created() { this.$options.components['dept-tree-node'] = window.DeptTreeNode; },
  template: `
<div>
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
  <template v-if="node.children && node.children.length && expanded.has(node.deptId)">
    <dept-tree-node v-for="child in node.children" :key="child.deptId"
      :node="child" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth + 1" />
  </template>
</div>
`
};
