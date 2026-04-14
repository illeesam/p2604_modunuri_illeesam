/* ShopJoy Admin - 카테고리관리 (Tree CRUD 그리드) */
window.EcCategoryMng = {
  name: 'EcCategoryMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* ── 검색 ── */
    const searchKw     = ref('');
    const searchDepth  = ref('');
    const searchStatus = ref('');
    const applied = Vue.reactive({ kw: '', depth: '', status: '' });

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [10, 20, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['categoryNm', 'parentId', 'sortOrd', 'description', 'status', 'imgUrl'];

    /* ── 트리 정렬 ── */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(c => { map[c.categoryId] = { ...c, _children: [] }; });
      const roots = [];
      items.forEach(c => {
        if (c.parentId && map[c.parentId]) map[c.parentId]._children.push(map[c.categoryId]);
        else roots.push(map[c.categoryId]);
      });
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    const makeRow = (c) => ({
      ...c, _depth: c._depth || 0, _row_status: 'N', _row_check: false,
      _orig: { categoryNm: c.categoryNm, parentId: c.parentId,
               sortOrd: c.sortOrd, description: c.description, status: c.status, imgUrl: c.imgUrl },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      const filtered = props.adminData.categories.filter(c => {
        const kw = applied.kw.trim().toLowerCase();
        if (kw && !c.categoryNm.toLowerCase().includes(kw)) return false;
        if (applied.depth  && String(c.depth) !== applied.depth) return false;
        if (applied.status && c.status !== applied.status) return false;
        return true;
      });
      buildTreeRows(filtered).forEach(c => gridRows.push(makeRow(c)));
    };

    loadGrid();

    const total      = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, depth: searchDepth.value, status: searchStatus.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchDepth.value = ''; searchStatus.value = '';
      Object.assign(applied, { kw: '', depth: '', status: '' });
      loadGrid();
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
        categoryId: _tempId--, categoryNm: '', parentId: ref ? ref.parentId : null,
        depth: ref ? (ref.parentId ? calcDepth(ref.parentId) : 1) : 1,
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        description: '', status: '활성', imgUrl: '',
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
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.categoryId));
      if (!checkedIds.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.categoryId)) continue;
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

    /* depth 계산: parentId로부터 */
    const calcDepth = (parentId) => {
      if (!parentId) return 1;
      const parent = props.adminData.categories.find(c => c.categoryId === parentId);
      return parent ? parent.depth + 1 : 1;
    };

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.categoryNm) { props.showToast('카테고리명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      dRows.forEach(r => { const i = props.adminData.categories.findIndex(c => c.categoryId === r.categoryId); if (i !== -1) props.adminData.categories.splice(i, 1); });
      uRows.forEach(r => { const i = props.adminData.categories.findIndex(c => c.categoryId === r.categoryId); if (i !== -1) Object.assign(props.adminData.categories[i], { categoryNm: r.categoryNm, parentId: r.parentId || null, depth: calcDepth(r.parentId), sortOrd: Number(r.sortOrd) || 1, description: r.description, status: r.status, imgUrl: r.imgUrl }); });
      let nextId = Math.max(...props.adminData.categories.map(c => c.categoryId), 0);
      iRows.forEach(r => { props.adminData.categories.push({ categoryId: ++nextId, categoryNm: r.categoryNm, parentId: r.parentId || null, depth: calcDepth(r.parentId), sortOrd: Number(r.sortOrd) || 1, description: r.description, status: r.status, imgUrl: r.imgUrl || '', regDate: new Date().toISOString().slice(0, 10) }); });
      const toastParts = [];
      if (iRows.length) toastParts.push(`등록 ${iRows.length}건`);
      if (uRows.length) toastParts.push(`수정 ${uRows.length}건`);
      if (dRows.length) toastParts.push(`삭제 ${dRows.length}건`);
      props.showToast(`${toastParts.join(', ')} 저장되었습니다.`);
      loadGrid();
    };

    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const parentNm = (parentId) => {
      if (!parentId) return '';
      const p = props.adminData.categories.find(c => c.categoryId === parentId);
      return p ? p.categoryNm : `ID:${parentId}`;
    };

    /* ── 상위카테고리 선택 모달 ── */
    const catTreeModal = Vue.reactive({ show: false, targetRow: null });
    const openParentModal = (row) => { catTreeModal.targetRow = row; catTreeModal.show = true; };
    const onParentSelect  = (cat) => {
      if (catTreeModal.targetRow) {
        catTreeModal.targetRow.parentId = cat.categoryId;
        catTreeModal.targetRow._depth   = cat.categoryId ? calcDepth(cat.categoryId) - 1 : 0;
        onCellChange(catTreeModal.targetRow);
      }
      catTreeModal.show = false;
    };

    const siteNm     = computed(() => window.adminUtil.getSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet  = (d) => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor   = (d) => DEPTH_COLORS[d % 5];
    const statusClass  = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const statusBadge  = s => ({ '활성': 'badge-green', '비활성': 'badge-gray' }[s] || 'badge-gray');

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'categoryId'},{label:'카테고리명',key:'categoryNm'},{label:'상위ID',key:'parentId'},{label:'순서',key:'sortOrd'},{label:'설명',key:'description'},{label:'상태',key:'status'}],
      '카테고리목록.csv'
    );

    return {
      searchKw, searchDepth, searchStatus, applied,
      siteNm,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      checkAll, toggleCheckAll, parentNm,
      catTreeModal, openParentModal, onParentSelect,
      depthBullet, depthColor, statusClass, statusBadge,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">카테고리관리</div>

  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="카테고리명 검색" />
      <select v-model="searchDepth">
        <option value="">depth 전체</option>
        <option value="1">1단계(대)</option><option value="2">2단계(중)</option><option value="3">3단계(소)</option>
      </select>
      <select v-model="searchStatus">
        <option value="">상태 전체</option><option>활성</option><option>비활성</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>카테고리목록 <span class="list-count">{{ total }}건</span></span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="exportExcel">📥 엑셀</button>
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
      </div>
    </div>

    <table class="admin-table crud-grid">
      <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th style="min-width:160px;">카테고리명</th>
          <th style="min-width:140px;">상위카테고리</th>
          <th class="col-ord">순서</th>
          <th style="min-width:180px;">설명</th>
          <th style="width:70px;">상태</th>
          <th style="width:80px;">사이트명</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.categoryId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          @click="setFocused(getRealIdx(idx))">

          <td class="col-id-val">{{ row.categoryId > 0 ? row.categoryId : 'NEW' }}</td>
          <td class="col-status-val"><span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span></td>
          <td class="col-check-val"><input type="checkbox" v-model="row._row_check" /></td>

          <!-- 카테고리명 (블릿 트리) -->
          <td style="padding:3px 6px;">
            <div style="display:flex;align-items:center;">
              <span :style="{ marginLeft:(row._depth*14)+'px', marginRight:'6px', fontWeight:'700',
                              fontSize: row._depth===0 ? '7px' : '12px', flexShrink:0,
                              color: depthColor(row._depth) }">{{ depthBullet(row._depth) }}</span>
              <input class="grid-input" v-model="row.categoryNm" :disabled="row._row_status==='D'"
                @input="onCellChange(row)" style="flex:1;" />
            </div>
          </td>

          <!-- 상위카테고리 -->
          <td style="padding:3px 8px;">
            <div style="display:flex;align-items:center;gap:5px;">
              <span v-if="row.parentId"
                style="flex:1;font-size:12px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                :title="parentNm(row.parentId)">{{ parentNm(row.parentId) }}</span>
              <span v-else style="flex:1;font-size:11px;color:#bbb;font-style:italic;">최상위</span>
              <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                style="flex-shrink:0;padding:2px 7px;font-size:12px;line-height:1.4;color:#e8587a;" title="상위카테고리 선택"
                @click.stop="openParentModal(row)">🔍</button>
            </div>
          </td>

          <td><input class="grid-input grid-num" type="number" v-model.number="row.sortOrd" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td><input class="grid-input" v-model="row.description" :disabled="row._row_status==='D'" @input="onCellChange(row)" /></td>
          <td>
            <select class="grid-select" v-model="row.status" :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option>활성</option><option>비활성</option>
            </select>
          </td>
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
  </div>

  <category-tree-modal
    v-if="catTreeModal.show"
    :disp-dataset="adminData"
    :exclude-id="catTreeModal.targetRow && catTreeModal.targetRow.categoryId > 0 ? catTreeModal.targetRow.categoryId : null"
    @select="onParentSelect"
    @close="catTreeModal.show=false" />
</div>
`,
};
