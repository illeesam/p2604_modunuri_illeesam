/* ShopJoy Admin - 회원등급관리 */
window.MbMemGradeMng = {
  name: 'MbMemGradeMng',
  props: ['navigate', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const grades = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, focusedIdx: null});
    const codes = reactive({ member_grades: [], use_yn: [] });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([,v]) => v !== '' && v !== null && v !== undefined)) };
        const res = await boApiSvc.mbMemGrade.getPage(params, '회원등급관리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        grades.splice(0, grades.length, ...list);
        gridRows.splice(0);
        list.forEach(g => gridRows.push({ ...g, _row_status: null }));
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        fnBuildPagerNums();
        Object.assign(pager.pageCond, res.data?.data?.pageCond || pager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
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
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.member_grades = await codeStore.snGetGrpCodes('MEMBER_GRADE') || [];
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

    const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    const gridRows   = reactive([]);
    let   _tempId    = -1;
      const searchParam = reactive({
    kw: '',
    use: ''
  });
  const searchParamOrg = reactive({
    kw: '',
    use: ''
  });
    const FIELDS     = ['gradeCd','gradeNm','gradeRank','minPurchaseAmt','saveRate','useYn'];


    const addRow = () => {
      gridRows.unshift({ gradeId: _tempId--, siteId: 1, gradeCd: '', gradeNm: '', gradeRank: gridRows.length + 1, minPurchaseAmt: 0, saveRate: 1.00, useYn: 'Y', _row_status: 'N' });
      uiState.focusedIdx = 0;
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
        const res = await boApiSvc.mbMemGrade.remove(row.gradeId, '회원등급관리', '삭제');
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
      const changed = window.safeArrayUtils.safeFilter(gridRows, r => ['N','I','U','D'].includes(r._row_status));
      if (!changed.length) { props.showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed.filter(r => r._row_status !== 'D')) {
        if (!row.gradeCd || !row.gradeNm) { props.showToast('등급코드와 등급명은 필수입니다.', 'error'); return; }
      }
      const ok = await props.showConfirm('저장', '변경 내용을 저장하시겠습니까?');
      if (!ok) return;
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status === 'N' ? 'I' : r._row_status }));
      try {
        await boApiSvc.mbMemGrade.saveList(saveRows, '회원등급관리', '저장');
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

    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };

    const setPage  = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList(); };
    const fnYnBadge  = v => v === 'Y' ? 'badge-green' : 'badge-gray';

    // ── return ───────────────────────────────────────────────────────────────

    return { grades, uiState, codes, searchParam, searchParamOrg, pager, setPage, onSearch, onReset,
             gridRows, addRow, onCellChange, handleDeleteRow, handleSaveAll, fnYnBadge, onSizeChange };
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
        <span class="list-title">회원등급 목록</span>
        <span class="list-count">총 {{ pager.pageTotalCount }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-blue btn-sm" @click="handleSaveAll">저장</button>
        </div>
      </div>
      <table class="bo-table">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="width:120px">등급코드</th>
          <th>등급명</th>
          <th style="width:80px;text-align:right">순위</th>
          <th style="width:140px;text-align:right">최소구매금액</th>
          <th style="width:100px;text-align:right">적립률(%)</th>
          <th style="width:70px;text-align:center">사용</th>
          <th style="width:60px;text-align:center">삭제</th>
        </tr></thead>
        <tbody>
          <tr v-for="(row,idx) in gridRows" :key="row?.gradeId" :class="{'table-row-new':row._row_status==='N','table-row-mod':row._row_status==='U'}" @click="uiState.focusedIdx=idx">
            <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
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
              <select v-if="row._row_status" class="form-control" v-model="row.useYn" @change="onCellChange(idx)">
                <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
              <span v-else :class="['badge',fnYnBadge(row.useYn)]">{{ row.useYn }}</span>
            </td>
            <td style="text-align:center"><button class="btn btn-danger btn-xs" @click.stop="handleDeleteRow(idx)">삭제</button></td>
          </tr>
          <tr v-if="!gridRows.length"><td colspan="8" style="text-align:center;padding:30px;color:#aaa">데이터가 없습니다.</td></tr>
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
