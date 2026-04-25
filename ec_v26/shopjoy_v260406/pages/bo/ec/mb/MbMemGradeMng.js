/* ShopJoy Admin - 회원등급관리 */
window.MbMemGradeMng = {
  name: 'MbMemGradeMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const grades = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({ member_grades: [] });

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/ec/mb/member-grade/page', {
          params: { pageNo: 1, pageSize: 10000 }
        });
        grades.splice(0, grades.length, ...(res.data?.data?.list || []));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('MbMemGrade 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    onMounted(() => { handleFetchData();
    Object.assign(searchParamOrg, searchParam); });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.member_grades = await codeStore.snGetGrpCodes('MEMBER_GRADE') || [];
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

    const pager     = reactive({ page: 1, size: 20 });

    const cfFiltered = computed(() => {
      const kw = searchParam.kw.toLowerCase();
      if (!Array.isArray(grades)) return [];
      return grades.filter(g => {
        if (kw && !g.gradeNm.toLowerCase().includes(kw) && !g.gradeCd.toLowerCase().includes(kw)) return false;
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
    const focusedIdx = ref(null);
  const searchParam = reactive({
    kw: '',
    use: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    use: ''
  });
    const FIELDS     = ['gradeCd','gradeNm','gradeRank','minPurchaseAmt','saveRate','useYn'];

    const handleLoadGrid = () => {
      gridRows.splice(0, gridRows.length, ...cfPageList.value.map(g => ({ ...g, _row_status: null })));
    };
    watch([() => pager.page, () => pager.size, searchParam], handleLoadGrid, { immediate: true });

    const addRow = () => {
      gridRows.unshift({ gradeId: _tempId--, siteId: 1, gradeCd: '', gradeNm: '', gradeRank: gridRows.length + 1, minPurchaseAmt: 0, saveRate: 1.00, useYn: 'Y', _row_status: 'N' });
      focusedIdx.value = 0;
    };
    const onCellChange = (idx) => { if (gridRows[idx]._row_status !== 'N') gridRows[idx]._row_status = 'U'; };
    const handleDeleteRow    = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await props.showConfirm('삭제', `[${row.gradeNm}] 등급을 삭제하시겠습니까?`);
      if (!ok) return;
      const src = grades;
      const si = src.findIndex(g => g.gradeId === row.gradeId);
      if (si !== -1) src.splice(si, 1);
      gridRows.splice(idx, 1);
      try {
        const res = await window.boApi.delete(`/bo/ec/mb/member-grade/${row.gradeId}`);
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
        if (!row.gradeCd || !row.gradeNm) { props.showToast('등급코드와 등급명은 필수입니다.', 'error'); return; }
        const ok = await props.showConfirm('저장', '변경 내용을 저장하시겠습니까?');
        if (!ok) return;
        const isNewRow = row._row_status === 'N';
        const src = grades;
        if (isNewRow) { row.gradeId = 'G' + String(Date.now()).slice(-6); src.push({ ...row }); }
        else { const si = src.findIndex(g => g.gradeId === row.gradeId); if (si !== -1) Object.assign(src[si], row); }
        row._row_status = null;
        try {
          const res = await (isNewRow ? window.boApi.post(`/bo/ec/mb/member-grade/${row.gradeId}`, { ...row }) : window.boApi.put(`/bo/ec/mb/member-grade/${row.gradeId}`, { ...row }));
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

    return { grades, uiState, codes, searchParam, searchParamOrg, pager, cfPageNums, cfTotalPages, setPage, cfTotal, onSearch, onReset,
             gridRows, addRow, onCellChange, handleDeleteRow, handleSaveAll, focusedIdx, fnYnBadge, PAGE_SIZES, onSizeChange };
  },
  template: `
<div>
  <div class="page-title">회원등급관리</div>
    <div class="card">
      <div class="search-bar">
        <label class="search-label">등급명/코드</label>
        <input class="form-control" v-model="searchParam.kw" @keyup.enter="() => onSearch?.()" placeholder="등급명 또는 코드 검색">
        <label class="search-label">사용여부</label>
        <select class="form-control" v-model="searchParam.use">
          <option value="">전체</option><option value="Y">Y</option><option value="N">N</option>
        </select>
        <div class="search-actions">
          <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
          <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="toolbar">
        <span class="list-title">회원등급 목록</span>
        <span class="list-count">총 {{ cfTotal }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="handleSaveAll">저장</button>
        </div>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:120px">등급코드</th>
          <th>등급명</th>
          <th style="width:80px;text-align:right">순위</th>
          <th style="width:140px;text-align:right">최소구매금액</th>
          <th style="width:100px;text-align:right">적립률(%)</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row?.gradeId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}" @click="focusedIdx=idx">
            <td>
              <select v-if="row._row_status" class="form-control" v-model="row.gradeCd" @change="onCellChange(idx)">
                <option value="">선택</option>
                <option v-for="c in codes.member_grades" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
              <span v-else>{{ row.gradeCd }}</span>
            </td>
            <td><input v-if="row._row_status" class="form-control" v-model="row.gradeNm" @input="onCellChange(idx)"><span v-else>{{ row.gradeNm }}</span></td>
            <td style="text-align:right"><input v-if="row._row_status" class="form-control" style="text-align:right" type="number" v-model.number="row.gradeRank" @input="onCellChange(idx)"><span v-else>{{ row.gradeRank }}</span></td>
            <td style="text-align:right"><input v-if="row._row_status" class="form-control" style="text-align:right" type="number" v-model.number="row.minPurchaseAmt" @input="onCellChange(idx)"><span v-else>{{ (row.minPurchaseAmt||0).toLocaleString() }}</span></td>
            <td style="text-align:right"><input v-if="row._row_status" class="form-control" style="text-align:right" type="number" step="0.01" v-model.number="row.saveRate" @input="onCellChange(idx)"><span v-else>{{ row.saveRate }}%</span></td>
            <td style="text-align:center">
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)"><option value="Y">Y</option><option value="N">N</option></select>
              <span v-else :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click.stop="handleDeleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="7" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
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
