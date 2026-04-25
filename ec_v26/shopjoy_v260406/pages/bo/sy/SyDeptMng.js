/* ShopJoy Admin - 부서관리 (Tree CRUD 그리드) */
window.SyDeptMng = {
  name: 'SyDeptMng',
  props: ['navigate', 'showToast', 'showConfirm'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const depts = reactive([]);
    const uiState = reactive({ checkAll: false, loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ dept_status: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/dept/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        depts = res.data?.data?.list || [];
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyDept 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* 좌측 부서 트리 */
    const selectedTreeId = ref(null);
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedTreeId.value = id; };
    const cfTree = computed(() => window.boCmUtil.buildDeptTree());
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      handleFetchData();
      Object.assign(searchParamOrg, searchParam);
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.dept_status = await codeStore.snGetGrpCodes('DEPT_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    const cfAllowedTreeIds = computed(() => {
      if (selectedTreeId.value == null) return null;
      return window.boCmUtil.collectDescendantIds(depts, 'deptId', 'parentId', selectedTreeId.value);
    });
    watch(selectedTreeId, () => { if (typeof handleLoadGrid === 'function') handleLoadGrid(); });


    /* ── 검색 ── */
    const searchParam = reactive({
      kw: '', type: '', useYn: ''
    });
    const searchParamOrg = reactive({
      kw: '', type: '', useYn: ''
    });
    const cfTypeOptions = computed(() => [...new Set(depts.map(d => d.deptTypeCd))].sort());

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    const EDIT_FIELDS = ['deptCode', 'deptNm', 'parentId', 'deptTypeCd', 'sortOrd', 'useYn', 'remark'];
    const DEPT_TYPES  = ['경영', '운영', '기술', '마케팅', 'CS', '물류', '재무', '인사', '법무', '기타'];

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const cfPagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const cfPageNums   = computed(() => { const c = pager.page, l = cfTotalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const getRealIdx   = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    /* ── 트리 정렬 ── */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, _children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentId && map[d.parentId]) map[d.parentId]._children.push(map[d.deptId]);
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
      ...d, _depth: d._depth || 0, _row_status: 'N', _row_check: false,
      _orig: { deptCode: d.deptCode, deptNm: d.deptNm, parentId: d.parentId,
               deptTypeCd: d.deptTypeCd, sortOrd: d.sortOrd, useYn: d.useYn, remark: d.remark },
    });

    const handleLoadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      const filtered = depts.filter(d => {
        if (cfAllowedTreeIds.value && !cfAllowedTreeIds.value.has(d.deptId)) return false;
        const kw = searchParam.kw.trim().toLowerCase();
        if (kw && !d.deptCode.toLowerCase().includes(kw) && !d.deptNm.toLowerCase().includes(kw)) return false;
        if (searchParam.type  && d.deptTypeCd !== searchParam.type)  return false;
        if (searchParam.useYn && d.useYn    !== searchParam.useYn) return false;
        return true;
      });
      buildTreeRows(filtered).forEach(d => gridRows.push(makeRow(d)));
    };

    handleLoadGrid();

    const cfTotal = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = () => {
      handleLoadGrid();
    };
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      handleLoadGrid();
    };

    const setFocused = (realIdx) => { focusedIdx.value = realIdx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const ref = focusedIdx.value !== null ? gridRows[focusedIdx.value] : null;
      const newRow = {
        deptId: _tempId--, deptCode: '', deptNm: '', parentId: ref ? ref.parentId : null,
        deptTypeCd: ref ? ref.deptTypeCd : '운영',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', remark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= realIdx ? 1 : 0));
      } else { row._row_status = 'D'; }
    };

    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= realIdx ? 1 : 0));
      } else {
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
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
          if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
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
      dRows.forEach(r => { const i = depts.findIndex(d => d.deptId === r.deptId); if (i !== -1) depts.splice(i, 1); });
      uRows.forEach(r => { const i = depts.findIndex(d => d.deptId === r.deptId); if (i !== -1) Object.assign(depts[i], { deptCode: r.deptCode, deptNm: r.deptNm, parentId: r.parentId || null, deptTypeCd: r.deptTypeCd, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, remark: r.remark }); });
      let nextId = Math.max(...depts.map(d => d.deptId), 0);
      iRows.forEach(r => { depts.push({ deptId: ++nextId, deptCode: r.deptCode, deptNm: r.deptNm, parentId: r.parentId || null, deptTypeCd: r.deptTypeCd, sortOrd: Number(r.sortOrd) || 1, useYn: r.useYn, remark: r.remark, regDate: new Date().toISOString().slice(0, 10) }); });
      const toastParts = [];
      if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
      if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
      if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
      handleLoadGrid();
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = depts.find(d => d.deptId === parentId);
      return p ? p.deptNm : `ID:${parentId}`;
    };

    const deptTreeModal = reactive({ show: false, targetRow: null });
    const openParentModal = (row) => { deptTreeModal.targetRow = row; deptTreeModal.show = true; };
    const onParentSelect  = (dept) => {
      if (deptTreeModal.targetRow) { deptTreeModal.targetRow.parentId = dept.deptId; deptTreeModal.targetRow._depth = 0; onCellChange(deptTreeModal.targetRow); }
      deptTreeModal.show = false;
    };

    const cfSiteNm = computed(() => window.boCmUtil.getSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor  = (d) => DEPTH_COLORS[d % 5];
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const exportExcel = () => window.boCmUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'deptId'},{label:'부서코드',key:'deptCode'},{label:'부서명',key:'deptNm'},{label:'상위ID',key:'parentId'},{label:'유형',key:'deptTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'remark'}],
      '부서목록.csv'
    );

    return { depts, uiState, codes, selectedTreeId, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      searchParam, searchParamOrg, cfTypeOptions, DEPT_TYPES,
      cfSiteNm,
      gridRows, cfPagedRows, cfTotal, pager, PAGE_SIZES, cfTotalPages, cfPageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      uiState, toggleCheckAll, parentNm,
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
        <option value="">사용여부 전체</option><option value="Y">사용</option><option value="N">미사용</option>
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
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="selectedTreeId" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
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

    <table class="bo-table crud-grid">
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
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
          <td colspan="13" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in cfPagedRows" :key="row.deptId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          @click="setFocused(getRealIdx(idx))">

          <td class="col-id-val">{{ row.deptId > 0 ? row.deptId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>
          <td><input class="grid-input grid-mono" v-model="row.deptCode" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>

          <!-- 부서명 (불릿 트리) -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0 ? '7px' : '12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.deptNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- 상위부서 -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentId)">{{ parentNm(row.parentId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위부서 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td>
            <select class="grid-select" v-model="row.deptTypeCd" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option v-for="t in DEPT_TYPES" :key="t">{{ t }}</option>
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

    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="pager.page===1" @click="setPage(1)">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
        <button v-for="n in cfPageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
        <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
      </div>
      <div class="pager-right">
        <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
        </select>
      </div>
    </div>
  </div>

  <dept-tree-modal
    v-if="deptTreeModal && deptTreeModal.show" :exclude-id="deptTreeModal.targetRow && deptTreeModal.targetRow.deptId > 0 ? deptTreeModal.targetRow.deptId : null"
    @select="onParentSelect"
    @close="deptTreeModal.show=false" />
</div>
`,
};
