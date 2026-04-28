/* ShopJoy Admin - 회원그룹관리 */
window.MbMemGroupMng = {
  name: 'MbMemGroupMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const groups = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ member_group_types: [] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        const res = await boApi.get('/bo/ec/mb/member-group/page', { params, ...coUtil.apiHdr('회원그룹관리', '조회') });
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        groups.splice(0, groups.length, ...list);
        gridRows.splice(0);
        list.forEach(g => gridRows.push({ ...g, _row_status: null }));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('MbMemGroup 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleSearchList('DEFAULT');
    Object.assign(searchParamOrg, searchParam); });
const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.member_group_types = await codeStore.snGetGrpCodes('MEMBER_GROUP_TYPE') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

  const searchParam = reactive({
    kw: '',
    use: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    use: ''
  });
    const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const cfPageNums   = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    const gridRows   = reactive([]);
    let   _tempId    = -1;


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
        const res = await boApi.delete(`/bo/ec/mb/member-group/${row.groupId}`, { ...coUtil.apiHdr('회원그룹관리', '삭제') });
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
          const res = await (isNewRow ? boApi.post(`/bo/ec/mb/member-group/${row.groupId}`, { ...row }, { ...coUtil.apiHdr('회원그룹관리', '등록') }) : boApi.put(`/bo/ec/mb/member-group/${row.groupId}`, { ...row }, { ...coUtil.apiHdr('회원그룹관리', '저장') }));
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
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };

    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };

    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ── return ───────────────────────────────────────────────────────────────

    return { groups, uiState, codes, searchParam, searchParamOrg, pager, cfPageNums, setPage, onSearch, onReset,
             gridRows, addRow, onCellChange, handleDeleteRow, handleSaveAll, fnYnBadge, onSizeChange };
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
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
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
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in cfPageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
           <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
         </div>
         <div class="pager-right">
           <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
             <option v-for="s in pager.pageSizes" :key="Math.random()" :value="s">{{ s }}개</option>
           </select>
         </div>
       </div>
    </div>
</div>`
};
