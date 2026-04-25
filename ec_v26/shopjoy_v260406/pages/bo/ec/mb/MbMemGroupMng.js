/* ShopJoy Admin - 회원그룹관리 */
window.MbMemGroupMng = {
  name: 'MbMemGroupMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const groups = reactive([]);
    const uiState = reactive({ loading: false });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/mb/member-group/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        groups.splice(0, groups.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('MbMemGroup 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
  const searchParam = reactive({
    kw: '',
    use: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    use: ''
  });
    const pager     = reactive({ page: 1, size: 20 });

    const cfFiltered = computed(() => {
      const kw = searchParam.kw.toLowerCase();
      if (!Array.isArray(groups)) return [];
      return groups.filter(g => {
        if (kw && !g.groupNm.toLowerCase().includes(kw)) return false;
        if (searchParam.use && g.useYn !== searchParam.use) return false;
        return true;
      });
      error: null,
      error: null,
    });
    const cfTotal      = computed(() => cfFiltered.value.length);
    const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfTotal.value / pager.size)));
    const cfPageList   = computed(() => cfFiltered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const cfPageNums   = computed(() => { const c=pager.page,l=cfTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const gridRows   = reactive([]);
    let   _tempId    = -1;

    const handleLoadGrid = () => { gridRows.splice(0, gridRows.length, ...cfPageList.value.map(g => ({ ...g, _row_status: null }))); };
    watch([() => pager.page, searchParam], handleLoadGrid, { immediate: true });

    const addRow       = () => { gridRows.unshift({ groupId: 'G' + (_tempId--), siteId: 1, groupNm: '', groupMemo: '', memberCnt: 0, useYn: 'Y', _row_status: 'N' }); };
    const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
    const handleDeleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await props.showConfirm('삭제', `[${row.groupNm}] 그룹을 삭제하시겠습니까?`);
      if (!ok) return;
      const si = groups.findIndex(g => g.groupId === row.groupId);
      if (si !== -1) groups.splice(si, 1);
      gridRows.splice(idx, 1);
      try {
        const res = await window.boApi.delete(`/bo/ec/mb/member-group/${row.groupId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const handleSaveAll = async () => {
      const changed = window.safeArrayUtils.safeFilter(gridRows, r => r._row_status === 'N' || r._row_status === 'U');
      if (!changed.length) { props.showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed) {
        if (!row.groupNm) { props.showToast('그룹명은 필수입니다.', 'error'); return; }
        const ok = await props.showConfirm('저장', '저장하시겠습니까?');
        if (!ok) return;
        const isNewRow = row._row_status === 'N';
        const src = groups;
        if (isNewRow) src.push({ ...row });
        else { const si = src.findIndex(g => g.groupId === row.groupId); if (si !== -1) Object.assign(src[si], row); }
        row._row_status = null;
        try {
          const res = await (isNewRow ? window.boApi.post(`/bo/ec/mb/member-group/${row.groupId}`, { ...row }) : window.boApi.put(`/bo/ec/mb/member-group/${row.groupId}`, { ...row }));
          if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
          if (props.showToast) props.showToast('저장되었습니다.', 'success');
        } catch (err) {
          console.error('[catch-info]', err);
          const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
          if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
          if (props.showToast) props.showToast(errMsg, 'error', 0);
        }
        break;
      }
    };
    const onSearch = async () => {
    try {
      const params = { pageNo: 1, pageSize: 100000, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)) };
      const res = await window.boApi.get('/bo/ec/resource/page', { params });
      // TODO: Update items array based on response
      pager.page = 1;
    } catch (err) {
      console.error('[catch-info]', err);
      if (props.showToast) props.showToast('조회 실패', 'error');
    }
  };
  
    const onReset = () => {
    Object.assign(searchParam, searchParamOrg);
    onSearch();
  };
  
    const setPage  = n => { if (n >= 1 && n <= cfTotalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    return { groups, uiState; searchParam, searchParamOrg, pager, cfPageNums, cfTotalPages, setPage, cfTotal, onSearch, onReset,
             gridRows, addRow, onCellChange, handleDeleteRow, handleSaveAll, fnYnBadge , PAGE_SIZES , onSizeChange };
  },
  template: `
<div>
  <div class="page-title">회원그룹관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">그룹명</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="그룹명 검색">
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchParam.use"><option value="">전체</option><option value="Y">Y</option><option value="N">N</option></select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">회원그룹 목록</span>
        <span class="list-count">총 {{ cfTotal }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="handleSaveAll">저장</button>
        </div>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th>그룹명</th><th>메모</th>
          <th style="width:80px;text-align:right">회원수</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row?.groupId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}">
            <td><input v-if="row._row_status" class="form-control" v-model="row.groupNm" @input="onCellChange(idx)"><span v-else>{{ row.groupNm }}</span></td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.groupMemo" @input="onCellChange(idx)"><span v-else>{{ row.groupMemo }}</span></td>
            <td style="text-align:right">{{ (row.memberCnt||0).toLocaleString() }}</td>
            <td style="text-align:center">
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)"><option value="Y">Y</option><option value="N">N</option></select>
              <span v-else :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click="handleDeleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="5" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.page===1" @click="setPage(1)">«</button>
           <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.page===cfTotalPages" @click="setPage(pager.page+1)">›</button>
           <button :disabled="pager.page===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
             <option v-for="s in PAGE_SIZES" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
</div>`
};
