/* ShopJoy Admin - 브랜드관리 (CRUD 그리드) */
window.SyBrandMng = {
  name: 'SyBrandMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = Vue.reactive({ show: false, row: null });
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

    const { ref, reactive, computed } = Vue;

    /* 트리 선택 path (loadGrid 보다 먼저 선언) */
    const selectedPath = ref(null);

    /* ── 검색 ── */
    const searchKw        = ref('');
    const searchUseYn     = ref('');
    const searchDateRange = ref(''); const searchDateStart = ref(''); const searchDateEnd = ref('');
    const DATE_RANGE_OPTIONS = window.adminUtil.DATE_RANGE_OPTIONS;
    const onDateRangeChange = () => {
      if (searchDateRange.value) {
        const r = window.adminUtil.getDateRange(searchDateRange.value);
        searchDateStart.value = r ? r.from : ''; searchDateEnd.value = r ? r.to : '';
      }
    };
    const applied = reactive({ kw: '', useYn: '', dateStart: '', dateEnd: '' });

    /* ── CRUD 그리드 ── */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);

    /* ── 페이징 ── */
    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const getRealIdx = (localIdx) => (pager.page - 1) * pager.size + localIdx;

    const EDIT_FIELDS = ['brandCode', 'brandNm', 'brandEnNm', 'dispPath', 'logoUrl', 'sortOrd', 'useYn', 'remark'];

    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check:  false,
      _orig: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      (props.adminData.brands || [])
        .filter(b => {
          const kw = applied.kw.trim().toLowerCase();
          if (kw && !b.brandCode?.toLowerCase().includes(kw)
                 && !b.brandNm?.toLowerCase().includes(kw)
                 && !b.brandEnNm?.toLowerCase().includes(kw)) return false;
          if (applied.useYn && b.useYn !== applied.useYn) return false;
          if (selectedPath.value != null) { const _desc = window.adminUtil.getPathDescendants('sy_brand', selectedPath.value); if (_desc && !_desc.has(b.pathId)) return false; }
          const d = String(b.regDate || '').slice(0, 10);
          if (applied.dateStart && d < applied.dateStart) return false;
          if (applied.dateEnd   && d > applied.dateEnd)   return false;
          return true;
        })
        .forEach(b => gridRows.push(makeRow(b)));
    };

    loadGrid();

    const total = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    const onSearch = () => {
      Object.assign(applied, { kw: searchKw.value, useYn: searchUseYn.value,
        dateStart: searchDateStart.value, dateEnd: searchDateEnd.value });
      loadGrid();
    };
    const onReset = () => {
      searchKw.value = ''; searchUseYn.value = '';
      searchDateStart.value = ''; searchDateEnd.value = ''; searchDateRange.value = '';
      Object.assign(applied, { kw: '', useYn: '', dateStart: '', dateEnd: '' });
      loadGrid();
    };

    const setFocused = (idx) => { focusedIdx.value = idx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const newRow = {
        brandId: _tempId--, brandCode: '', brandNm: '', brandEnNm: '',
        dispPath: selectedPath.value || 'fashion.misc',
        logoUrl: '', sortOrd: gridRows.length + 1, useYn: 'Y', remark: '',
        _row_status: 'I', _row_check: false, _orig: null,
      };
      const insertAt = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      focusedIdx.value = insertAt;
      pager.page = Math.ceil((insertAt + 1) / pager.size);
    };

    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0));
      } else {
        if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.brandId));
      if (!ids.size) { props.showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.brandId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._orig) { EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; }
      }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        props.showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.brandCode || !r.brandNm) {
          props.showToast('브랜드코드, 브랜드명은 필수 항목입니다.', 'error'); return;
        }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await props.showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?',
        { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;

      if (!props.adminData.brands) props.adminData.brands = [];
      dRows.forEach(r => {
        const idx = props.adminData.brands.findIndex(b => b.brandId === r.brandId);
        if (idx !== -1) props.adminData.brands.splice(idx, 1);
      });
      uRows.forEach(r => {
        const idx = props.adminData.brands.findIndex(b => b.brandId === r.brandId);
        if (idx !== -1) Object.assign(props.adminData.brands[idx],
          { brandCode: r.brandCode, brandNm: r.brandNm, brandEnNm: r.brandEnNm,
            logoUrl: r.logoUrl, sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark });
      });
      let nextId = Math.max(...props.adminData.brands.map(b => b.brandId), 0);
      iRows.forEach(r => {
        props.adminData.brands.push({
          brandId: ++nextId, brandCode: r.brandCode, brandNm: r.brandNm, brandEnNm: r.brandEnNm,
          logoUrl: r.logoUrl, sortOrd: r.sortOrd, useYn: r.useYn, remark: r.remark,
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

    /* ── 드래그 ── */
    const dragSrc   = ref(null);
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
      dragSrc.value = null; dragMoved.value = false;
    };

    /* ── 전체 체크 ── */
    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };

    const statusClass  = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const pagedRows    = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.slice(s, s + pager.size); });
    const totalPages   = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums     = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage      = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };

    const exportExcel = () => window.adminUtil.exportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [
        { label: 'ID',       key: 'brandId' },
        { label: '표시경로',   key: 'dispPath' },
        { label: '브랜드코드', key: 'brandCode' },
        { label: '브랜드명',  key: 'brandNm' },
        { label: '영문명',    key: 'brandEnNm' },
        { label: '로고URL',   key: 'logoUrl' },
        { label: '순서',      key: 'sortOrd' },
        { label: '사용여부',  key: 'useYn' },
        { label: '비고',      key: 'remark' },
      ],
      '브랜드목록.csv'
    );

    /* ── 좌측 표시경로 트리 (브랜드의 dispPath 기반) ── */
    const expanded = reactive(new Set(['']));
    const toggleNode = (path) => { if (expanded.has(path)) expanded.delete(path); else expanded.add(path); };
    const selectNode = (path) => { selectedPath.value = path; };
    const tree = Vue.computed(() => window.adminUtil.buildPathTree('sy_brand'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); }; walk(tree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */
    Vue.onMounted(() => {
      const initSet = window.adminUtil.collectExpandedToDepth(tree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });
    Vue.watch(selectedPath, () => loadGrid());

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      searchKw, searchUseYn, searchDateRange, searchDateStart, searchDateEnd,
      DATE_RANGE_OPTIONS, onDateRangeChange, applied,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange, getRealIdx,
      focusedIdx, setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusClass, exportExcel,
      selectedPath, expanded, toggleNode, selectNode, expandAll, collapseAll, tree,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">브랜드관리</div>

  <!-- 검색 -->
  <div class="card">
    <div class="search-bar">
      <input v-model="searchKw" placeholder="브랜드코드 / 브랜드명 / 영문명 검색" />
      <select v-model="searchUseYn">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
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

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로</span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

  <!-- CRUD 그리드 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        브랜드목록
        <span v-if="selectedPath" style="color:#e8587a;font-family:monospace;margin-left:6px;font-size:12px;">{{ selectedPath }}</span>
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

    <table class="admin-table crud-grid">
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
          <th style="min-width:140px;">표시경로 <span style="font-size:10px;color:#aaa;font-weight:400;">(예: aa.bb.cc)</span></th>
          <th style="min-width:110px;">브랜드코드</th>
          <th style="min-width:130px;">브랜드명</th>
          <th style="min-width:130px;">영문명</th>
          <th style="min-width:200px;">로고 URL</th>
          <th class="col-ord">순서</th>
          <th class="col-use">사용여부</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="gridRows.length===0">
          <td colspan="13" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
        </tr>
        <tr v-for="(row, idx) in pagedRows" :key="row.brandId"
          class="crud-row" :class="['status-'+row._row_status, focusedIdx===getRealIdx(idx) ? 'focused' : '']"
          draggable="true"
          @click="setFocused(getRealIdx(idx))"
          @dragstart="onDragStart(getRealIdx(idx))"
          @dragover="onDragOver($event, getRealIdx(idx))"
          @dragend="onDragEnd">

          <td class="drag-handle" title="드래그로 순서 변경">⠿</td>
          <td class="col-id-val">{{ row.brandId > 0 ? row.brandId : 'NEW' }}</td>
          <td class="col-status-val">
            <span class="badge badge-xs" :class="statusClass(row._row_status)">{{ row._row_status }}</span>
          </td>
          <td class="col-check-val">
            <input type="checkbox" v-model="row._row_check" />
          </td>
          <td>
              <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color: row.pathId != null ? '#374151' : '#9ca3af',fontWeight: row.pathId != null ? 600 : 400,display:'flex',alignItems:'center',gap:'6px'}">
                <span style="flex:1;">{{ pathLabel(row.pathId) || '경로 선택...' }}</span>
                <button type="button" @click="openPathPick(row)" title="표시경로 선택"
                  :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}"
                  @mouseover="$event.currentTarget.style.background='#eef2ff'"
                  @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
              </div>
            </td>
          <td>
            <input class="grid-input grid-mono" v-model="row.brandCode"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="BRAND_CODE" />
          </td>
          <td>
            <input class="grid-input" v-model="row.brandNm"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="브랜드명" />
          </td>
          <td>
            <input class="grid-input" v-model="row.brandEnNm"
              :disabled="row._row_status==='D'" @input="onCellChange(row)"
              placeholder="Brand Name" />
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:4px;">
              <input class="grid-input grid-mono" v-model="row.logoUrl"
                :disabled="row._row_status==='D'" @input="onCellChange(row)"
                placeholder="/images/brand/logo.png" style="flex:1;" />
              <img v-if="row.logoUrl"
                :src="row.logoUrl"
                style="height:22px;max-width:44px;object-fit:contain;border-radius:3px;border:1px solid #e8e8e8;"
                @error="$event.target.style.display='none'"
                @load="$event.target.style.display=''" />
            </div>
          </td>
          <td>
            <input class="grid-input grid-num" type="number" v-model.number="row.sortOrd"
              :disabled="row._row_status==='D'" @input="onCellChange(row)" />
          </td>
          <td>
            <select class="grid-select" v-model="row.useYn"
              :disabled="row._row_status==='D'" @change="onCellChange(row)">
              <option value="Y">사용</option><option value="N">미사용</option>
            </select>
          </td>
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
  </div><!-- /grid 25/75 -->

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_brand"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
