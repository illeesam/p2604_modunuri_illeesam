/* ShopJoy - Sample08: 카테고리 관리 CRUD Grid */
window.XsSample08 = {
  name: 'XsSample08',
  setup() {
    const { ref, reactive, computed, onMounted } = Vue;

    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;
    const showToast = (msg, type = 'success') => { toast.msg = msg; toast.type = type; toast.show = true; clearTimeout(_tId); _tId = setTimeout(() => { toast.show = false; }, 2500); };

    const searchKw    = ref('');
    const searchUseYn = ref('');
    const applied = reactive({ kw: '', useYn: '' });

    const allData    = reactive([]);
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const focusedIdx = ref(null);
    const EDIT_FIELDS = ['categoryNm', 'parentNm', 'depth', 'sortOrd', 'useYn'];

    const makeRow = d => ({ ...d, _row_status: 'N', _row_check: false, _orig: { categoryNm: d.categoryNm, parentNm: d.parentNm, depth: d.depth, sortOrd: d.sortOrd, useYn: d.useYn } });

    const pager      = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [10, 20, 50];
    const total      = computed(() => gridRows.filter(r => r._row_status !== 'D').length);
    const pagedRows  = computed(() => gridRows.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value, s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const getRealIdx = i => (pager.page - 1) * pager.size + i;

    const loadGrid = () => {
      gridRows.splice(0); focusedIdx.value = null; pager.page = 1;
      allData.filter(d => {
        const kw = applied.kw.toLowerCase();
        if (kw && !['categoryNm', 'parentNm'].some(f => String(d[f] || '').toLowerCase().includes(kw))) return false;
        if (applied.useYn && d.useYn !== applied.useYn) return false;
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
    };

    onMounted(async () => {
      try { const r = await window.frontApi.get('xs/sample08.json'); (r.data || []).forEach(d => allData.push(d)); loadGrid(); }
      catch { showToast('데이터 로딩 실패', 'error'); }
    });

    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, useYn: searchUseYn.value }); loadGrid(); };
    const onReset  = () => { searchKw.value = ''; searchUseYn.value = ''; Object.assign(applied, { kw: '', useYn: '' }); loadGrid(); };
    const setFocused   = idx => { focusedIdx.value = idx; };
    const onCellChange = row => { if (row._row_status === 'I' || row._row_status === 'D') return; row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._orig[f])) ? 'U' : 'N'; };

    const addRow = () => {
      const at = focusedIdx.value !== null ? focusedIdx.value + 1 : gridRows.length;
      gridRows.splice(at, 0, { categoryId: _tempId--, categoryNm: '', parentNm: '-', depth: 1, sortOrd: 1, useYn: 'Y', regDate: '', _row_status: 'I', _row_check: false, _orig: null });
      focusedIdx.value = at; pager.page = Math.ceil((at + 1) / pager.size);
    };

    const deleteRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0)); } else row._row_status = 'D'; };
    const cancelRow = idx => { const row = gridRows[idx]; if (row._row_status === 'I') { gridRows.splice(idx, 1); if (focusedIdx.value !== null) focusedIdx.value = Math.max(0, focusedIdx.value - (focusedIdx.value >= idx ? 1 : 0)); } else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; } };
    const deleteRows    = () => { for (let i = gridRows.length - 1; i >= 0; i--) { if (!gridRows[i]._row_check) continue; if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1); else gridRows[i]._row_status = 'D'; } };
    const cancelChecked = () => { const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.categoryId)); if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; } for (let i = gridRows.length - 1; i >= 0; i--) { const row = gridRows[i]; if (!ids.has(row.categoryId)) continue; if (row._row_status === 'N') continue; if (row._row_status === 'I') gridRows.splice(i, 1); else { if (row._orig) EDIT_FIELDS.forEach(f => { row[f] = row._orig[f]; }); row._row_status = 'N'; } } };

    const doSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I'), uRows = gridRows.filter(r => r._row_status === 'U'), dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) { if (!r.categoryNm) { showToast('카테고리명은 필수 항목입니다.', 'error'); return; } }
      const parts = []; if (iRows.length) parts.push(`등록 ${iRows.length}건`); if (uRows.length) parts.push(`수정 ${uRows.length}건`); if (dRows.length) parts.push(`삭제 ${dRows.length}건`);
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) return;
      dRows.forEach(r => { const i = allData.findIndex(d => d.categoryId === r.categoryId); if (i !== -1) allData.splice(i, 1); });
      uRows.forEach(r => { const i = allData.findIndex(d => d.categoryId === r.categoryId); if (i !== -1) EDIT_FIELDS.forEach(f => { allData[i][f] = r[f]; }); });
      let nid = Math.max(...allData.map(d => d.categoryId), 0);
      iRows.forEach(r => { allData.push({ categoryId: ++nid, categoryNm: r.categoryNm, parentNm: r.parentNm, depth: r.depth, sortOrd: r.sortOrd, useYn: r.useYn, regDate: new Date().toISOString().slice(0, 10) }); });
      showToast(`${parts.join(', ')} 저장되었습니다.`); loadGrid();
    };

    const dragSrc = ref(null), dragMoved = ref(false);
    const onDragStart = idx => { dragSrc.value = idx; dragMoved.value = false; };
    const onDragOver  = (e, idx) => { e.preventDefault(); if (dragSrc.value === null || dragSrc.value === idx) return; const m = gridRows.splice(dragSrc.value, 1)[0]; gridRows.splice(idx, 0, m); dragSrc.value = idx; dragMoved.value = true; };
    const onDragEnd   = () => { if (dragMoved.value) showToast('정렬이 변경되었습니다.'); dragSrc.value = null; dragMoved.value = false; };

    const checkAll = ref(false);
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = checkAll.value; }); };
    const statusBadge = s => ({ N: 'background:#f0f0f0;color:#666;', I: 'background:#dbeafe;color:#1e40af;', U: 'background:#fef3c7;color:#92400e;', D: 'background:#fee2e2;color:#991b1b;' }[s] || '');
    const rowBg       = s => ({ I: 'background:#f0fdf4;', U: 'background:#fffbeb;', D: 'background:#fff1f2;opacity:.45;' }[s] || '');

    return {
      toast, searchKw, searchUseYn, onSearch, onReset,
      gridRows, pagedRows, total, pager, PAGE_SIZES, totalPages, pageNums, setPage, getRealIdx,
      focusedIdx, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, doSave,
      dragSrc, onDragStart, onDragOver, onDragEnd,
      checkAll, toggleCheckAll, statusBadge, rowBg,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">{{ toast.msg }}</div>

  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">08. 카테고리 관리 <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">CRUD Grid 예제</span></div>

  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="카테고리명 / 상위명 검색" @keyup.enter="onSearch" style="font-size:12px;padding:5px 10px;border:1px solid #ddd;border-radius:6px;width:200px;outline:none;" />
      <select v-model="searchUseYn" style="font-size:12px;padding:5px 8px;border:1px solid #ddd;border-radius:6px;">
        <option value="">사용여부 전체</option><option value="Y">Y 사용</option><option value="N">N 미사용</option>
      </select>
      <button @click="onSearch" style="font-size:12px;padding:5px 14px;border:none;border-radius:6px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">검색</button>
      <button @click="onReset"  style="font-size:12px;padding:5px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">초기화</button>
    </div>
  </div>

  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #f0f0f0;">
      <span style="font-size:12px;font-weight:700;">카테고리 목록 <span style="color:#e8587a;margin-left:4px;">{{ total }}건</span></span>
      <div style="display:flex;gap:5px;">
        <button @click="addRow"        style="font-size:11px;padding:4px 10px;border:1px solid #34a853;border-radius:5px;background:#e6f4ea;color:#1e7e34;cursor:pointer;font-weight:600;">+ 행추가</button>
        <button @click="deleteRows"    style="font-size:11px;padding:4px 10px;border:1px solid #fca5a5;border-radius:5px;background:#fee2e2;color:#991b1b;cursor:pointer;">행삭제</button>
        <button @click="cancelChecked" style="font-size:11px;padding:4px 10px;border:1px solid #ddd;border-radius:5px;background:#fff;color:#555;cursor:pointer;">취소</button>
        <button @click="doSave"        style="font-size:11px;padding:4px 10px;border:none;border-radius:5px;background:#e8587a;color:#fff;cursor:pointer;font-weight:600;">저장</button>
      </div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:760px;">
        <thead>
          <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
            <th style="width:28px;padding:7px 4px;text-align:center;color:#ccc;font-weight:400;">⠿</th>
            <th style="width:50px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">ID</th>
            <th style="width:36px;padding:7px;text-align:center;font-weight:600;color:#555;font-size:11px;">상태</th>
            <th style="width:28px;padding:7px;text-align:center;"><input type="checkbox" v-model="checkAll" @change="toggleCheckAll" /></th>
            <th style="padding:7px;text-align:left;font-weight:600;color:#555;">카테고리명</th>
            <th style="width:120px;padding:7px;text-align:left;font-weight:600;color:#555;">상위카테고리</th>
            <th style="width:60px;padding:7px;text-align:center;font-weight:600;color:#555;">뎁스</th>
            <th style="width:70px;padding:7px;text-align:center;font-weight:600;color:#555;">정렬순서</th>
            <th style="width:60px;padding:7px;text-align:center;font-weight:600;color:#555;">사용</th>
            <th style="width:96px;padding:7px;text-align:center;font-weight:600;color:#555;">등록일</th>
            <th style="width:48px;"></th><th style="width:48px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="gridRows.length===0"><td colspan="12" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">데이터가 없습니다.</td></tr>
          <tr v-for="(row,idx) in pagedRows" :key="row.categoryId"
            draggable="true" @click="setFocused(getRealIdx(idx))"
            @dragstart="onDragStart(getRealIdx(idx))" @dragover="onDragOver($event,getRealIdx(idx))" @dragend="onDragEnd"
            style="cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
            :style="rowBg(row._row_status)+(focusedIdx===getRealIdx(idx)?'outline:2px solid #93c5fd inset;':'')">
            <td style="text-align:center;color:#ccc;cursor:grab;font-size:14px;">⠿</td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.categoryId > 0 ? row.categoryId : 'NEW' }}</td>
            <td style="text-align:center;"><span style="font-size:9px;padding:2px 5px;border-radius:8px;font-weight:700;" :style="statusBadge(row._row_status)">{{ row._row_status }}</span></td>
            <td style="text-align:center;"><input type="checkbox" v-model="row._row_check" @click.stop /></td>
            <td><input v-model="row.categoryNm" :disabled="row._row_status==='D'" @input="onCellChange(row)"
              style="width:100%;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;border-radius:3px;outline:none;"
              @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" /></td>
            <td><input v-model="row.parentNm" :disabled="row._row_status==='D'" @input="onCellChange(row)"
              style="width:100%;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;border-radius:3px;outline:none;"
              @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" /></td>
            <td style="text-align:center;">
              <input v-model.number="row.depth" type="number" :disabled="row._row_status==='D'" @input="onCellChange(row)"
                style="width:60px;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;text-align:center;border-radius:3px;outline:none;"
                @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" />
            </td>
            <td style="text-align:center;">
              <input v-model.number="row.sortOrd" type="number" :disabled="row._row_status==='D'" @input="onCellChange(row)"
                style="width:60px;border:1px solid transparent;background:transparent;padding:3px 5px;font-size:12px;text-align:center;border-radius:3px;outline:none;"
                @focus="e=>e.target.style.border='1px solid #93c5fd'" @blur="e=>e.target.style.border='1px solid transparent'" />
            </td>
            <td style="text-align:center;">
              <select v-model="row.useYn" :disabled="row._row_status==='D'" @change="onCellChange(row)" style="font-size:11px;padding:2px 4px;border:1px solid #ddd;border-radius:4px;background:#fff;">
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </td>
            <td style="text-align:center;color:#999;font-size:11px;">{{ row.regDate }}</td>
            <td style="text-align:center;"><button v-if="['U','I','D'].includes(row._row_status)" @click.stop="cancelRow(getRealIdx(idx))" style="font-size:10px;padding:2px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">취소</button></td>
            <td style="text-align:center;"><button v-if="['N','U'].includes(row._row_status)" @click.stop="deleteRow(getRealIdx(idx))" style="font-size:10px;padding:2px 7px;border:1px solid #fca5a5;border-radius:4px;background:#fee2e2;color:#991b1b;cursor:pointer;">삭제</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #f0f0f0;">
      <div style="font-size:11px;color:#aaa;">총 {{ total }}건</div>
      <div style="display:flex;gap:3px;">
        <button :disabled="pager.page===1" @click="setPage(1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">«</button>
        <button :disabled="pager.page===1" @click="setPage(pager.page-1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">‹</button>
        <button v-for="n in pageNums" :key="n" @click="setPage(n)" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:4px;cursor:pointer;" :style="pager.page===n?'background:#e8587a;color:#fff;border-color:#e8587a;':'background:#fff;'">{{ n }}</button>
        <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">›</button>
        <button :disabled="pager.page===totalPages" @click="setPage(totalPages)" style="font-size:11px;padding:3px 7px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">»</button>
      </div>
      <select v-model.number="pager.size" @change="()=>{pager.page=1;}" style="font-size:11px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;">
        <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
      </select>
    </div>
  </div>
</div>
  `,
};
