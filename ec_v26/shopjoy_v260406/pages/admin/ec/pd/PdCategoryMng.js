/* ShopJoy Admin - 카테고리관리 */
window.PdCategoryMng = {
  name: 'PdCategoryMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    /* ── 트리 expanded 상태 (ref+Set 재할당으로 반응성 보장) ── */
    const expandedSet = ref(new Set());

    /* depth 1 노드 기본 펼침 (2레벨 노출) */
    onMounted(() => {
      expandedSet.value = new Set(
        (props.adminData.categories || []).filter(c => c.depth === 1).map(c => c.categoryId)
      );
    });
    const isExpanded  = id => expandedSet.value.has(id);
    const toggleNode  = id => {
      const s = new Set(expandedSet.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      expandedSet.value = s;
    };
    const expandAll  = () => { expandedSet.value = new Set(props.adminData.categories.map(c => c.categoryId)); };
    const collapseAll = () => { expandedSet.value = new Set(); };

    /* ── 선택된 카테고리 (좌측 트리 클릭) ── */
    const selectedCatId = ref(null);
    const selectNode = id => {
      selectedCatId.value = (selectedCatId.value === id) ? null : id;
    };
    watch(selectedCatId, () => loadGrid());

    /* ── 좌측 트리 빌드 (expanded 반영) ── */
    const catTreeFlat = computed(() => {
      const _ = expandedSet.value; // reactive dependency
      const cats = props.adminData.categories;
      const map = {};
      cats.forEach(c => { map[c.categoryId] = { ...c, _children: [] }; });
      cats.forEach(c => { if (c.parentId && map[c.parentId]) map[c.parentId]._children.push(map[c.categoryId]); });
      const roots = cats.filter(c => !c.parentId).map(c => map[c.categoryId]).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth, _hasChildren: node._children.length > 0 });
        if (isExpanded(node.categoryId))
          [...node._children].sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.forEach(r => traverse(r, 0));
      return result;
    });

    /* ── 검색 ── */
    const searchKw     = ref('');
    const searchDepth  = ref('');
    const searchStatus = ref('');
    const applied = reactive({ kw: '', depth: '', status: '' });

    /* ── 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);
    const pager      = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const EDIT_FIELDS = ['categoryNm', 'parentId', 'sortOrd', 'description', 'status'];

    /* 그리드 트리 평탄화 */
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

    const makeRow = c => ({
      ...c, _depth: c._depth || 0, _row_status: 'N', _row_check: false,
      _orig: { categoryNm: c.categoryNm, parentId: c.parentId, sortOrd: c.sortOrd, description: c.description, status: c.status },
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      const filtered = props.adminData.categories.filter(c => {
        const kw = applied.kw.trim().toLowerCase();
        if (kw && !(c.categoryNm || '').toLowerCase().includes(kw)) return false;
        if (applied.depth  && String(c.depth) !== applied.depth) return false;
        if (applied.status && c.status !== applied.status) return false;
        // 트리에서 선택된 경우: 해당 카테고리 + 직계 자식만
        if (selectedCatId.value !== null)
          return c.categoryId === selectedCatId.value || c.parentId === selectedCatId.value;
        return true;
      });
      buildTreeRows(filtered).forEach(c => gridRows.push(makeRow(c)));
    };

    loadGrid();

    const total      = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const pagedRows  = computed(() => gridRows.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => {
      const c = pager.page, l = totalPages.value, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const setPage       = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange  = () => { pager.page = 1; };
    const getRealIdx    = localIdx => (pager.page - 1) * pager.size + localIdx;

    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, depth: searchDepth.value, status: searchStatus.value }); loadGrid(); };
    const onReset  = () => { searchKw.value = ''; searchDepth.value = ''; searchStatus.value = ''; selectedCatId.value = null; Object.assign(applied, { kw: '', depth: '', status: '' }); loadGrid(); };

    const setFocused = realIdx => { focusedIdx.value = realIdx; };

    const onCellChange = row => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const calcDepth = parentId => {
      if (!parentId) return 1;
      const p = props.adminData.categories.find(c => c.categoryId === parentId);
      return p ? (p.depth || 1) + 1 : 1;
    };

    /* ── 행 추가: selectedCatId 또는 parentRow 하위로 ── */
    const addRow = () => {
      const parentId = selectedCatId.value || null;
      const depth    = calcDepth(parentId);
      const maxSort  = gridRows.filter(r => r.parentId === parentId && r._row_status !== 'D')
                               .reduce((m, r) => Math.max(m, r.sortOrd || 0), 0);
      const newRow = {
        categoryId: _tempId--, categoryNm: '', parentId, depth,
        sortOrd: maxSort + 1, description: '', status: '활성', imgUrl: '',
        _depth: depth - 1, _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    /* ── 행의 하위 카테고리 추가 버튼 ── */
    const addChildRow = (row, realIdx) => {
      const parentId = row.categoryId > 0 ? row.categoryId : null;
      const depth    = calcDepth(parentId);
      const maxSort  = gridRows.filter(r => r.parentId === parentId && r._row_status !== 'D')
                               .reduce((m, r) => Math.max(m, r.sortOrd || 0), 0);
      const newRow = {
        categoryId: _tempId--, categoryNm: '', parentId, depth,
        sortOrd: maxSort + 1, description: '', status: '활성', imgUrl: '',
        _depth: depth - 1, _row_status: 'I', _row_check: false, _orig: null,
      };
      gridRows.splice(realIdx + 1, 0, newRow);
      focusedIdx.value = realIdx + 1;
      pager.page = Math.ceil((realIdx + 2) / pager.size);
    };

    const deleteRow = realIdx => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') gridRows.splice(realIdx, 1);
      else row._row_status = 'D';
    };

    const cancelRow = realIdx => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') gridRows.splice(realIdx, 1);
      else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const cancelChecked = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!row._row_check) continue;
        if (row._row_status === 'I') gridRows.splice(i, 1);
        else if (row._row_status !== 'N') {
          if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
          row._row_status = 'N';
        }
      }
    };

    /* ── 드래그 정렬 ── */
    const dragRowIdx     = ref(null);
    const dragoverRowIdx = ref(null);
    const onRowDragStart = realIdx => { dragRowIdx.value = realIdx; };
    const onRowDragOver  = realIdx => { dragoverRowIdx.value = realIdx; };
    const onRowDrop = () => {
      if (dragRowIdx.value === null || dragRowIdx.value === dragoverRowIdx.value) {
        dragRowIdx.value = dragoverRowIdx.value = null; return;
      }
      const arr = [...gridRows];
      const [moved] = arr.splice(dragRowIdx.value, 1);
      arr.splice(dragoverRowIdx.value, 0, moved);
      arr.forEach((row, i) => {
        row.sortOrd = i + 1;
        if (row._row_status === 'N') row._row_status = 'U';
      });
      gridRows.splice(0, gridRows.length, ...arr);
      dragRowIdx.value = dragoverRowIdx.value = null;
    };

    /* ── 저장 ── */
    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { props.showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!(r.categoryNm || '').trim()) { props.showToast('카테고리명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      dRows.forEach(r => {
        const i = props.adminData.categories.findIndex(c => c.categoryId === r.categoryId);
        if (i !== -1) props.adminData.categories.splice(i, 1);
      });
      uRows.forEach(r => {
        const i = props.adminData.categories.findIndex(c => c.categoryId === r.categoryId);
        if (i !== -1) Object.assign(props.adminData.categories[i], {
          categoryNm: r.categoryNm, parentId: r.parentId || null,
          depth: calcDepth(r.parentId), sortOrd: Number(r.sortOrd) || 1,
          description: r.description, status: r.status,
        });
      });
      let nextId = Math.max(0, ...props.adminData.categories.map(c => c.categoryId));
      iRows.forEach(r => {
        props.adminData.categories.push({
          categoryId: ++nextId, categoryNm: r.categoryNm,
          parentId: r.parentId || null, depth: calcDepth(r.parentId),
          sortOrd: Number(r.sortOrd) || 1, description: r.description,
          status: r.status, imgUrl: '', regDate: new Date().toISOString().slice(0, 10),
        });
      });
      props.showToast([iRows.length && `등록 ${iRows.length}건`, uRows.length && `수정 ${uRows.length}건`, dRows.length && `삭제 ${dRows.length}건`].filter(Boolean).join(', ') + ' 저장되었습니다.');
      loadGrid();
    };

    const checkAll = ref(false);
    const toggleCheckAll = () => { pagedRows.value.forEach(r => { r._row_check = checkAll.value; }); };

    const parentNm = parentId => {
      if (!parentId) return '';
      const p = props.adminData.categories.find(c => c.categoryId === parentId);
      return p ? p.categoryNm : `ID:${parentId}`;
    };

    /* ── 상위카테고리 선택 모달 ── */
    const catPickerModal = reactive({ show: false, targetRow: null, search: '' });
    const catPickerList  = computed(() => {
      const q = catPickerModal.search.trim().toLowerCase();
      return props.adminData.categories.filter(c =>
        (!q || (c.categoryNm || '').toLowerCase().includes(q)) &&
        c.categoryId !== (catPickerModal.targetRow && catPickerModal.targetRow.categoryId)
      );
    });
    const openParentModal = row => { catPickerModal.targetRow = row; catPickerModal.search = ''; catPickerModal.show = true; };
    const onParentSelect  = cat => {
      if (catPickerModal.targetRow) {
        catPickerModal.targetRow.parentId = cat ? cat.categoryId : null;
        catPickerModal.targetRow._depth   = cat ? calcDepth(cat.categoryId) - 1 : 0;
        onCellChange(catPickerModal.targetRow);
      }
      catPickerModal.show = false;
    };

    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];
    const depthBullet   = d => DEPTH_BULLETS[Math.min(d, 3)];
    const depthColor    = d => DEPTH_COLORS[d % 5];
    const statusClass   = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const descOpen = ref(false);
    return {
      descOpen,
      expandedSet, isExpanded, toggleNode, expandAll, collapseAll, catTreeFlat,
      selectedCatId, selectNode,
      searchKw, searchDepth, searchStatus, applied,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, addChildRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      checkAll, toggleCheckAll, parentNm,
      catPickerModal, catPickerList, openParentModal, onParentSelect,
      dragRowIdx, dragoverRowIdx, onRowDragStart, onRowDragOver, onRowDrop,
      depthBullet, depthColor, statusClass,
    };
  },

  template: `
<div>
  <div class="page-title">카테고리관리</div>
  <div style="margin:-8px 0 16px;padding:10px 14px;background:#f0faf4;border-left:3px solid #3ba87a;border-radius:0 6px 6px 0;font-size:13px;color:#444;line-height:1.7">
    <span><strong style="color:#1a7a52">카테고리관리</strong>는 상품 분류를 위한 3단계 계층(대/중/소) 카테고리를 관리합니다.</span>
    <button @click="descOpen=!descOpen" style="margin-left:8px;font-size:12px;color:#3ba87a;background:none;border:none;cursor:pointer;padding:0">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" style="margin-top:6px">
      ✔ 대·중·소 3단계로 카테고리 트리를 구성합니다.<br>
      ✔ 정렬순서·표시여부를 설정하고 상품과 연결합니다.<br>
      ✔ 카테고리 삭제 시 하위 카테고리와 연결 상품을 함께 확인합니다.<br>
      <span style="color:#888;font-size:12px">예) 의류 &gt; 상의 &gt; 티셔츠, 전자기기 &gt; 스마트폰</span>
    </div>
  </div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <label class="search-label">카테고리명</label>
      <input class="form-control" v-model="searchKw" placeholder="카테고리명 검색" style="max-width:240px" @keyup.enter="onSearch">
      <label class="search-label">단계</label>
      <select class="form-control" v-model="searchDepth" style="width:120px">
        <option value="">전체</option>
        <option value="1">1단계 (대)</option>
        <option value="2">2단계 (중)</option>
        <option value="3">3단계 (소)</option>
      </select>
      <label class="search-label">상태</label>
      <select class="form-control" v-model="searchStatus" style="width:100px">
        <option value="">전체</option>
        <option>활성</option>
        <option>비활성</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px;align-items:flex-start">

    <!-- 좌측: 카테고리 트리 -->
    <div class="card" style="padding:12px;position:sticky;top:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#555">📁 카테고리</span>
        <div v-if="selectedCatId" style="font-size:11px;color:#1677ff;cursor:pointer" @click="selectedCatId=null">전체보기</div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px">
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
        <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
      </div>
      <div style="max-height:60vh;overflow-y:auto">
        <div v-for="cat in catTreeFlat" :key="cat.categoryId"
             :style="{ paddingLeft: (cat._depth * 14 + 6) + 'px', cursor:'pointer', padding:'5px 8px',
                       borderRadius:'4px', paddingLeft: (cat._depth * 14 + 6) + 'px',
                       background: selectedCatId===cat.categoryId ? '#fce4ec' : 'transparent',
                       color: selectedCatId===cat.categoryId ? '#e8587a' : '#333',
                       fontWeight: selectedCatId===cat.categoryId ? 600 : 400,
                       borderLeft: selectedCatId===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
             @click="selectNode(cat.categoryId)">
          <span v-if="cat._hasChildren"
                style="display:inline-block;width:14px;text-align:center;font-size:9px;color:#aaa;cursor:pointer;margin-right:2px"
                @click.stop="toggleNode(cat.categoryId)">
            {{ isExpanded(cat.categoryId) ? '▼' : '▶' }}
          </span>
          <span v-else style="display:inline-block;width:16px"></span>
          <span :style="{ fontSize:'11px', fontWeight:600, color:depthColor(cat._depth), marginRight:'5px' }">{{ depthBullet(cat._depth) }}</span>
          <span style="font-size:12px">{{ cat.categoryNm }}</span>
          <span v-if="cat.status==='비활성'" style="font-size:10px;color:#bbb;margin-left:4px">(비활성)</span>
        </div>
        <div v-if="!catTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
      </div>
    </div>

    <!-- 우측: 카테고리 그리드 -->
    <div class="card">
      <div class="toolbar">
        <span class="list-title">
          카테고리 목록
          <span v-if="selectedCatId" style="font-size:12px;color:#1677ff;margin-left:6px">
            — {{ adminData.categories.find(c=>c.categoryId===selectedCatId)&&adminData.categories.find(c=>c.categoryId===selectedCatId).categoryNm }} 하위
          </span>
          <span class="list-count">{{ total }}건</span>
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
          <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
          <button class="btn btn-primary btn-sm" @click="doSave">저장</button>
        </div>
      </div>

      <table class="admin-table" style="table-layout:fixed">
        <colgroup>
          <col style="width:28px"><!-- 드래그 핸들 -->
          <col style="width:36px"><!-- 상태 -->
          <col style="width:32px"><!-- 체크 -->
          <col style="min-width:140px"><!-- 카테고리명 -->
          <col style="min-width:120px"><!-- 상위 -->
          <col style="width:64px"><!-- 순서 -->
          <col><!-- 설명 -->
          <col style="width:70px"><!-- 상태 -->
          <col style="width:32px"><!-- 하위추가 -->
          <col style="width:44px"><!-- 취소 -->
          <col style="width:44px"><!-- 삭제 -->
        </colgroup>
        <thead><tr>
          <th></th>
          <th>상태</th>
          <th><input type="checkbox" v-model="checkAll" @change="toggleCheckAll"></th>
          <th>카테고리명</th>
          <th>상위카테고리</th>
          <th style="text-align:center">순서</th>
          <th>설명</th>
          <th style="text-align:center">활성</th>
          <th></th>
          <th></th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr v-if="!gridRows.length">
            <td colspan="11" style="text-align:center;color:#aaa;padding:30px">
              {{ selectedCatId ? '하위 카테고리가 없습니다. [+ 행추가]로 추가하세요.' : '데이터가 없습니다.' }}
            </td>
          </tr>
          <tr v-for="(row, idx) in pagedRows" :key="row.categoryId"
              :class="[focusedIdx===getRealIdx(idx) ? 'focused' : '', 'status-'+row._row_status]"
              draggable="true"
              @dragstart="onRowDragStart(getRealIdx(idx))"
              @dragover.prevent="onRowDragOver(getRealIdx(idx))"
              @drop="onRowDrop()"
              :style="dragoverRowIdx===getRealIdx(idx) ? 'background:#e6f4ff' : ''"
              @click="setFocused(getRealIdx(idx))">

            <!-- 드래그 핸들 -->
            <td style="text-align:center;cursor:grab;color:#ccc;font-size:16px;user-select:none">≡</td>

            <!-- 행 상태 뱃지 -->
            <td style="text-align:center">
              <span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span>
            </td>

            <!-- 체크박스 -->
            <td style="text-align:center"><input type="checkbox" v-model="row._row_check" @click.stop></td>

            <!-- 카테고리명 (들여쓰기 트리 표현) -->
            <td style="padding:3px 6px">
              <div style="display:flex;align-items:center">
                <span :style="{ marginLeft:(row._depth*12)+'px', marginRight:'5px', fontWeight:700,
                                fontSize: row._depth===0?'8px':'11px', flexShrink:0, color:depthColor(row._depth) }">
                  {{ depthBullet(row._depth) }}
                </span>
                <input class="grid-input" v-model="row.categoryNm" :disabled="row._row_status==='D'"
                       @input="onCellChange(row)" style="flex:1" placeholder="카테고리명">
              </div>
            </td>

            <!-- 상위카테고리 -->
            <td style="padding:3px 8px">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                      :style="row.parentId ? 'color:#444' : 'color:#bbb;font-style:italic'">
                  {{ row.parentId ? parentNm(row.parentId) : '최상위' }}
                </span>
                <button v-if="row._row_status!=='D'" class="btn btn-secondary btn-xs"
                        style="flex-shrink:0;padding:1px 6px;font-size:11px;color:#e8587a"
                        @click.stop="openParentModal(row)" title="상위 선택">🔍</button>
              </div>
            </td>

            <!-- 순서 -->
            <td style="padding:3px 4px">
              <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" style="text-align:center">
            </td>

            <!-- 설명 -->
            <td style="padding:3px 6px">
              <input class="grid-input" v-model="row.description"
                     :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="설명">
            </td>

            <!-- 활성 -->
            <td style="padding:3px 4px;text-align:center">
              <select class="grid-select" v-model="row.status"
                      :disabled="row._row_status==='D'" @change="onCellChange(row)" style="width:58px">
                <option>활성</option>
                <option>비활성</option>
              </select>
            </td>

            <!-- 하위 추가 -->
            <td style="text-align:center;padding:2px">
              <button v-if="row._row_status!=='D' && row.categoryId>0"
                      class="btn btn-xs" style="padding:1px 5px;font-size:11px;background:#f0f7ff;color:#1677ff;border:1px solid #91caff"
                      title="하위 카테고리 추가" @click.stop="addChildRow(row, getRealIdx(idx))">+하위</button>
            </td>

            <!-- 취소 -->
            <td style="text-align:center;padding:2px">
              <button v-if="['U','I','D'].includes(row._row_status)"
                      class="btn btn-secondary btn-xs" @click.stop="cancelRow(getRealIdx(idx))">취소</button>
            </td>

            <!-- 삭제 -->
            <td style="text-align:center;padding:2px">
              <button v-if="['N','U'].includes(row._row_status)"
                      class="btn btn-danger btn-xs" @click.stop="deleteRow(getRealIdx(idx))">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
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
  </div>

  <!-- 상위카테고리 선택 모달 -->
  <teleport to="body" v-if="catPickerModal.show">
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center"
         @click.self="catPickerModal.show=false">
      <div style="background:#fff;border-radius:14px;padding:22px;width:460px;max-height:70vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.22)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <strong style="font-size:15px">상위 카테고리 선택</strong>
          <button class="btn btn-secondary btn-xs" @click="catPickerModal.show=false">닫기</button>
        </div>
        <input class="form-control" v-model="catPickerModal.search" placeholder="카테고리명 검색" style="margin-bottom:10px">
        <div style="overflow-y:auto;flex:1;border:1px solid #eee;border-radius:8px">
          <div style="padding:8px 12px;font-size:12px;border-bottom:1px solid #f0f0f0;cursor:pointer;color:#1677ff"
               @click="onParentSelect(null)">최상위 (상위없음)</div>
          <div v-for="c in catPickerList" :key="c.categoryId"
               style="padding:7px 12px;font-size:13px;border-bottom:1px solid #f9f9f9;cursor:pointer;display:flex;align-items:center;gap:6px"
               :style="{ paddingLeft: (c.depth * 14 + 12) + 'px' }"
               @mouseenter="$event.target.style.background='#f5f5f5'" @mouseleave="$event.target.style.background=''"
               @click="onParentSelect(c)">
            <span :style="{ fontSize:'11px', fontWeight:700, color:depthColor((c.depth||1)-1) }">{{ depthBullet((c.depth||1)-1) }}</span>
            <span>{{ c.categoryNm }}</span>
            <span style="font-size:11px;color:#aaa;margin-left:auto">depth {{ c.depth }}</span>
          </div>
          <div v-if="!catPickerList.length" style="text-align:center;padding:20px;color:#aaa">검색 결과 없음</div>
        </div>
      </div>
    </div>
  </teleport>
</div>`
};
