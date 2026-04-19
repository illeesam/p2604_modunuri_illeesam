/* ShopJoy Admin - 태그관리 */
window.PdTagMng = {
  name: 'PdTagMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const searchKw  = ref('');
    const searchUse = ref('');
    const applied   = reactive({ kw: '', use: '' });
    const pager     = reactive({ page: 1, size: 20 });

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.tags || []).filter(t => {
        if (kw && !t.tagNm.toLowerCase().includes(kw)) return false;
        if (applied.use && t.useYn !== applied.use) return false;
        return true;
      });
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const gridRows   = reactive([]);
    let   _tempId    = -1;

    const loadGrid = () => { gridRows.splice(0, gridRows.length, ...pageList.value.map(t => ({ ...t, _row_status: null }))); };
    Vue.watch([() => pager.page, applied], loadGrid, { immediate: true });

    const addRow       = () => { gridRows.unshift({ tagId: 'T' + (_tempId--), siteId: 1, tagNm: '', tagDesc: '', useCount: 0, sortOrd: 0, useYn: 'Y', _row_status: 'N' }); };
    const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
    const deleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await props.showConfirm('삭제', `[${row.tagNm}] 태그를 삭제하시겠습니까?`);
      if (!ok) return;
      const si = props.adminData.tags.findIndex(t => t.tagId === row.tagId); if (si !== -1) props.adminData.tags.splice(si, 1); gridRows.splice(idx, 1);
      try {
        const res = await window.adminApi.delete(`pd/tags/${row.tagId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const saveAll = async () => {
      const changed = gridRows.filter(r => r._row_status === 'N' || r._row_status === 'U');
      if (!changed.length) { props.showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.tagNm) { props.showToast('태그명은 필수입니다.', 'error'); return; }
        const ok = await props.showConfirm('저장', '저장하시겠습니까?');
        if (!ok) return;
        const isNewRow = row._row_status === 'N';
        const src = props.adminData.tags;
        if (isNewRow) src.push({ ...row });
        else { const si = src.findIndex(t => t.tagId === row.tagId); if (si !== -1) Object.assign(src[si], row); }
        row._row_status = null;
        try {
          const res = await (isNewRow ? window.adminApi.post(`pd/tags/${row.tagId}`, { ...row }) : window.adminApi.put(`pd/tags/${row.tagId}`, { ...row }));
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast('저장되었습니다.', 'success');
        } catch (err) {
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
        break;
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, use: searchUse.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchUse.value = ''; Object.assign(applied, { kw: '', use: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchKw, searchUse, pager, pageNums, totalPages, setPage, total, onSearch, onReset,
             gridRows, addRow, onCellChange, deleteRow, saveAll, ynBadge , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">태그관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">태그명</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="태그명 검색">
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchUse"><option value="">전체</option><option value="Y">Y</option><option value="N">N</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">검색</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">태그 목록</span>
        <span class="list-count">총 {{ total }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="saveAll">저장</button>
        </div>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>태그명</th><th>설명</th>
          <th style="width:80px;text-align:right">사용수</th>
          <th style="width:80px;text-align:right">정렬</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row.tagId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}">
            <td><input v-if="row._row_status" class="form-control" v-model="row.tagNm" @input="onCellChange(idx)"><span v-else><span class="badge badge-blue">#</span> {{ row.tagNm }}</span></td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.tagDesc" @input="onCellChange(idx)"><span v-else style="color:#888;font-size:12px">{{ row.tagDesc }}</span></td>
            <td style="text-align:right">{{ (row.useCount||0) }}</td>
            <td style="text-align:right"><input v-if="row._row_status" class="form-control" style="text-align:right" type="number" v-model.number="row.sortOrd" @input="onCellChange(idx)"><span v-else>{{ row.sortOrd }}</span></td>
            <td style="text-align:center">
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)"><option value="Y">Y</option><option value="N">N</option></select>
              <span v-else :class="['badge',ynBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click="deleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="6" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
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
</div>`
};
