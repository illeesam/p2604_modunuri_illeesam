/* ShopJoy Admin - 태그관리 */
window.PdTagMng = {
  name: 'PdTagMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const tags = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ use_yn: [] });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      try {
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
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

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdTag.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) }, '태그관리', '목록조회');
        const data = res.data?.data;
        tags.splice(0, tags.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };
    /* ── 검색 파라미터 ── */
    const searchParam = reactive({
      kw: '',
      use: ''
    });
    const searchParamOrg = reactive({
      kw: '',
      use: ''
    });

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
      Object.assign(searchParamOrg, searchParam);
    });

const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const gridRows   = reactive([]);
    let   _tempId    = -1;

    watch(tags, (list) => { gridRows.splice(0, gridRows.length, ...list.map(t => ({ ...t, _row_status: null }))); }, { immediate: true });

    const addRow       = () => { gridRows.unshift({ tagId: 'T' + (_tempId--), siteId: 1, tagNm: '', tagDesc: '', useCount: 0, sortOrd: 0, useYn: 'Y', _row_status: 'N' }); };
    const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
    const deleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await props.showConfirm('삭제', `[${row.tagNm}] 태그를 삭제하시겠습니까?`);
      if (!ok) return;
      const si = tags.findIndex(t => t.tagId === row.tagId); if (si !== -1) tags.splice(si, 1); gridRows.splice(idx, 1);
      try {
        const res = await boApiSvc.pdTag.remove(row.tagId, '태그관리', '삭제');
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const saveAll = async () => {
      const changed = window.safeArrayUtils.safeFilter(gridRows, r => ['N','I','U','D'].includes(r._row_status));
      if (!changed.length) { props.showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed.filter(r => r._row_status !== 'D')) {
        if (!row.tagNm) { props.showToast('태그명은 필수입니다.', 'error'); return; }
      }
      const ok = await props.showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status === 'N' ? 'I' : r._row_status }));
      try {
        await boApiSvc.pdTag.saveList(saveRows, '태그관리', '저장');
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };
    const onSearch = async () => {
      pager.pageNo = 1;
      await handleSearchList('DEFAULT');
    };
    const onReset = async () => {
      Object.assign(searchParam, searchParamOrg);
      pager.pageNo = 1;
      await handleSearchList();
    };

    const setPage  = async n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; await handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ── return ───────────────────────────────────────────────────────────────

    return { tags, uiState, codes, searchParam, searchParamOrg, pager, setPage, onSearch, onReset,
             gridRows, addRow, onCellChange, deleteRow, saveAll, fnYnBadge, onSizeChange };
  },
  template: `
<div>
  <div class="page-title">태그관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">태그명</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="태그명 검색">
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchParam.use">
          <option value="">전체</option>
          <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">태그 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="saveAll">저장</button>
        </div>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th>태그명</th><th>설명</th>
          <th style="width:80px;text-align:right">사용수</th>
          <th style="width:80px;text-align:right">정렬</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row?.tagId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.tagNm" @input="onCellChange(idx)"><span v-else><span class="badge badge-blue">#</span> {{ row.tagNm }}</span></td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.tagDesc" @input="onCellChange(idx)"><span v-else style="color:#888;font-size:12px">{{ row.tagDesc }}</span></td>
            <td style="text-align:right">{{ (row.useCount||0) }}</td>
            <td style="text-align:right"><input v-if="row._row_status" class="form-control" style="text-align:right" type="number" v-model.number="row.sortOrd" @input="onCellChange(idx)"><span v-else>{{ row.sortOrd }}</span></td>
            <td style="text-align:center">
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)">
                <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
              <span v-else :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click="deleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
        </tbody>
      </table>
      <div class="pagination">
         <div></div>
         <div class="pager">
           <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
           <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
           <button v-for="n in pager.pageNums" :key="Math.random()" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
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
