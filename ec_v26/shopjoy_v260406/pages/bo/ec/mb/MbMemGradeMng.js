/* ShopJoy Admin - 회원등급관리 (CRUD 그리드) */
window.MbMemGradeMng = {
  name: 'MbMemGradeMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, checkAll: false, focusedIdx: null });
    const codes = reactive({ member_grades: [], use_yn: [] });
    const searchParam = reactive({ searchType: '', searchValue: '', use: '' });
    const gridRows = reactive([]);
    let _tempId = -1;

    const EDIT_FIELDS = ['gradeCd', 'gradeNm', 'gradeRank', 'minPurchaseAmt', 'saveRate', 'useYn'];

    const gridColumns = [
      { key: 'gradeCd',        label: '등급코드',     style: 'width:130px;',
        edit: 'select', options: () => codes.member_grades },
      { key: 'gradeNm',        label: '등급명',       style: 'min-width:150px;',
        edit: 'text', placeholder: '등급명' },
      { key: 'gradeRank',      label: '순위',         style: 'width:80px;text-align:right;',
        edit: 'number' },
      { key: 'minPurchaseAmt', label: '최소구매금액', style: 'width:150px;text-align:right;',
        edit: 'number' },
      { key: 'saveRate',       label: '적립률(%)',    style: 'width:110px;text-align:right;',
        edit: 'number' },
      { key: 'useYn',          label: '사용여부',     style: 'width:90px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* makeRow */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check: false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });

    /* 목록조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'gradeNm,gradeCd';
        }
        const res = await boApiSvc.mbMemGrade.getPage(params, '회원등급관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0, gridRows.length, ...list.map(b => makeRow(b)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    /* 목록조회 */
    const onSearch = async () => { await handleSearchList(); };

    /* onReset */
    const onReset = () => { Object.assign(searchParam, { searchType: '', searchValue: '', use: '' }); handleSearchList(); };

    /* setFocused */
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    /* onCellChange */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow */
    const addRow = () => {
      const newRow = {
        memberGradeId: _tempId--, gradeCd: '', gradeNm: '', gradeRank: gridRows.length + 1,
        minPurchaseAmt: 0, saveRate: 1, useYn: 'Y',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    /* cancelRow */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    /* deleteRows */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* cancelChecked */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.memberGradeId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.memberGradeId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* toggleCheckAll */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.gradeCd || !r.gradeNm) {
          showToast('등급코드와 등급명은 필수입니다.', 'error'); return;
        }
      }
      const details = [];
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.mbMemGrade.saveList(saveRows, '회원등급관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnStatusClass */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const cfVisibleCount = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    return {
      uiState, codes, searchParam, gridRows, gridColumns,
      onSearch, onReset, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, toggleCheckAll,
      handleSave, fnStatusClass, cfVisibleCount,
    };
  },
  template: `
<div>
  <div class="page-title">회원등급관리</div>

  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset">
      <label class="search-label">등급명/코드</label>
      <bo-multi-check-select
        v-model="searchParam.searchType"
        :options="[
          { value: 'gradeNm', label: '등급명' },
          { value: 'gradeCd', label: '코드' },
        ]"
        placeholder="검색대상 전체"
        all-label="전체 선택"
        min-width="160px" />
      <input class="form-control" v-model="searchParam.searchValue" @keyup.enter="onSearch" placeholder="검색어 입력">
      <label class="search-label">사용여부</label>
      <select class="form-control" v-model="searchParam.use">
        <option value="">전체</option>
        <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </bo-search-area>
  </div>

  <bo-grid-crud
    :columns="gridColumns" :rows="gridRows" row-key="memberGradeId"
    list-title="회원등급 목록"
    :empty-text="uiState.loading ? '로딩중...' : '데이터가 없습니다.'"
    v-model:focusedIdx="uiState.focusedIdx"
    v-model:checkAll="uiState.checkAll"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @cell-change="onCellChange">


    <template #row-actions="{ row, idx }">
      <button v-if="['U','I','D'].includes(row._row_status)"
        class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
      <button v-if="['N','U'].includes(row._row_status)"
        class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
    </template>
  </bo-grid-crud>
</div>`
};
