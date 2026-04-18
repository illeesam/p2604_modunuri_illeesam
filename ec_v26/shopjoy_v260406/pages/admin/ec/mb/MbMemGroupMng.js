/* ShopJoy Admin - 회원그룹관리 */
window.MbMemGroupMng = {
  name: 'MbMemGroupMng',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const searchKw  = ref('');
    const searchUse = ref('');
    const applied   = reactive({ kw: '', use: '' });
    const pager     = reactive({ page: 1, size: 20 });

    const filtered = computed(() => {
      const kw = applied.kw.toLowerCase();
      return (props.adminData.memGroups || []).filter(g => {
        if (kw && !g.groupNm.toLowerCase().includes(kw)) return false;
        if (applied.use && g.useYn !== applied.use) return false;
        return true;
      });
    });
    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const gridRows   = reactive([]);
    let   _tempId    = -1;

    const loadGrid = () => { gridRows.splice(0, gridRows.length, ...pageList.value.map(g => ({ ...g, _row_status: null }))); };
    Vue.watch([() => pager.page, applied], loadGrid, { immediate: true });

    const addRow       = () => { gridRows.unshift({ groupId: 'G' + (_tempId--), siteId: 1, groupNm: '', groupMemo: '', memberCnt: 0, useYn: 'Y', _row_status: 'N' }); };
    const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
    const deleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      await window.adminApiCall({
        method: 'delete', path: `mem/groups/${row.groupId}`,
        confirmTitle: '삭제', confirmMsg: `[${row.groupNm}] 그룹을 삭제하시겠습니까?`,
        showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
        onLocal: () => { const si = props.adminData.memGroups.findIndex(g => g.groupId === row.groupId); if (si !== -1) props.adminData.memGroups.splice(si, 1); gridRows.splice(idx, 1); },
      });
    };
    const saveAll = async () => {
      const changed = gridRows.filter(r => r._row_status === 'N' || r._row_status === 'U');
      if (!changed.length) { props.showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.groupNm) { props.showToast('그룹명은 필수입니다.', 'error'); return; }
        await window.adminApiCall({
          method: row._row_status === 'N' ? 'post' : 'put', path: `mem/groups/${row.groupId}`, data: { ...row },
          confirmTitle: '저장', confirmMsg: '저장하시겠습니까?',
          showConfirm: props.showConfirm, showToast: props.showToast, setApiRes: props.setApiRes,
          onLocal: () => {
            const src = props.adminData.memGroups;
            if (row._row_status === 'N') src.push({ ...row });
            else { const si = src.findIndex(g => g.groupId === row.groupId); if (si !== -1) Object.assign(src[si], row); }
            row._row_status = null;
          },
        }); break;
      }
    };
    const onSearch = () => { Object.assign(applied, { kw: searchKw.value, use: searchUse.value }); pager.page = 1; };
    const onReset  = () => { searchKw.value = ''; searchUse.value = ''; Object.assign(applied, { kw: '', use: '' }); pager.page = 1; };
    const setPage  = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const ynBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { searchKw, searchUse, pager, pageNums, totalPages, setPage, total, onSearch, onReset,
             gridRows, addRow, onCellChange, deleteRow, saveAll, ynBadge };
  },
  template: `
<div>
  <div class="page-title">회원그룹관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">그룹명</label>
        <input class="form-control" v-model="searchKw" @keyup.enter="onSearch" placeholder="그룹명 검색">
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
        <span class="list-title">회원그룹 목록</span>
        <span class="list-count">총 {{ total }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="saveAll">저장</button>
        </div>
      </div>
      <table class="admin-table">
        <thead><tr>
          <th>그룹명</th><th>메모</th>
          <th style="width:80px;text-align:right">회원수</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row.groupId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}">
            <td><input v-if="row._row_status" class="form-control" v-model="row.groupNm" @input="onCellChange(idx)"><span v-else>{{ row.groupNm }}</span></td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.groupMemo" @input="onCellChange(idx)"><span v-else>{{ row.groupMemo }}</span></td>
            <td style="text-align:right">{{ (row.memberCnt||0).toLocaleString() }}</td>
            <td style="text-align:center">
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)"><option value="Y">Y</option><option value="N">N</option></select>
              <span v-else :class="['badge',ynBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click="deleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="5" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination" v-if="totalPages > 1">
        <button class="pager" @click="setPage(pager.page-1)" :disabled="pager.page===1">◀</button>
        <button v-for="n in pageNums" :key="n" class="pager" :class="{active:n===pager.page}" @click="setPage(n)">{{ n }}</button>
        <button class="pager" @click="setPage(pager.page+1)" :disabled="pager.page===totalPages">▶</button>
      </div>
    </div>
</div>`
};
