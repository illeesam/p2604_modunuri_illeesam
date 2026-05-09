/* ShopJoy Admin - 회원등급관리 (CRUD 그리드) */
window.MbMemGradeMng = {
  name: 'MbMemGradeMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;
    const showConfirm  = window.boApp.showConfirm;
    const showRefModal = window.boApp.showRefModal;
    const setApiRes    = window.boApp.setApiRes;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, checkAll: false, focusedIdx: null });
    const codes = reactive({ member_grades: [], use_yn: [] });
    const searchParam = reactive({ use: '' });
    const gridRows = reactive([]);
    let _tempId = -1;

    const EDIT_FIELDS = ['gradeCd', 'gradeNm', 'gradeRank', 'minPurchaseAmt', 'saveRate', 'useYn'];

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);

    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check: false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
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

    const onSearch = async () => { await handleSearchList(); };
    const onReset = () => { Object.assign(searchParam, { use: '' }); handleSearchList(); };

    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const newRow = {
        gradeId: _tempId--, gradeCd: '', gradeNm: '', gradeRank: gridRows.length + 1,
        minPurchaseAmt: 0, saveRate: 1, useYn: 'Y',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

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

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.gradeId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.gradeId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

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

    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const cfVisibleCount = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

    return {
      uiState, codes, searchParam, gridRows,
      onSearch, onReset, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, toggleCheckAll,
      handleSave, fnStatusClass, cfVisibleCount,
    };
  },
  template: `
<div>
  <div class="page-title">회원등급관리</div>

  <div class="card">
    <div class="search-bar">
      <label class="search-label">등급명/코드</label>
      <input class="form-control" v-model="searchParam.searchValue" @keyup.enter="onSearch" placeholder="등급명 또는 코드 검색">
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
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        회원등급 목록
        <span class="list-count">{{ cfVisibleCount }}건</span>
      </span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-green btn-sm" @click="addRow">+ 행추가</button>
        <button class="btn btn-danger btn-sm" @click="deleteRows">행삭제</button>
        <button class="btn btn-secondary btn-sm" @click="cancelChecked">취소</button>
        <button class="btn btn-primary btn-sm" @click="handleSave">저장</button>
      </div>
    </div>

    <div style="max-height:480px;overflow-y:auto;">
      <table class="bo-table crud-grid">
        <thead><tr>
          <th style="width:36px;text-align:center;">번호</th>
          <th class="col-id">ID</th>
          <th class="col-status">상태</th>
          <th class="col-check"><input type="checkbox" v-model="uiState.checkAll" @change="toggleCheckAll"></th>
          <th style="width:130px;">등급코드</th>
          <th style="min-width:150px;">등급명</th>
          <th style="width:80px;text-align:right;">순위</th>
          <th style="width:150px;text-align:right;">최소구매금액</th>
          <th style="width:110px;text-align:right;">적립률(%)</th>
          <th style="width:90px;text-align:center;">사용여부</th>
          <th class="col-act-cancel"></th>
          <th class="col-act-delete"></th>
        </tr></thead>
        <tbody>
          <tr v-if="uiState.loading">
            <td colspan="12" style="text-align:center;padding:30px;color:#aaa;">로딩중...</td>
          </tr>
          <tr v-else-if="!gridRows.length">
            <td colspan="12" style="text-align:center;padding:30px;color:#aaa;">데이터가 없습니다.</td>
          </tr>
          <tr v-else v-for="(row, idx) in gridRows" :key="row.gradeId"
              class="crud-row" :class="['status-'+row._row_status, uiState.focusedIdx===idx ? 'focused' : '']"
              @click="setFocused(idx)">
            <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
            <td class="col-id-val">{{ row.gradeId > 0 ? row.gradeId : 'NEW' }}</td>
            <td class="col-status-val">
              <span class="badge badge-xs" :class="fnStatusClass(row._row_status)">{{ row._row_status }}</span>
            </td>
            <td class="col-check-val"><input type="checkbox" v-model="row._row_check"></td>
            <td>
              <select class="grid-select" v-model="row.gradeCd"
                :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option value="">선택</option>
                <option v-for="c in codes.member_grades" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
            </td>
            <td>
              <input class="grid-input" v-model="row.gradeNm"
                :disabled="row._row_status==='D'" @input="onCellChange(row)" placeholder="등급명">
            </td>
            <td>
              <input class="grid-input grid-num" type="number" v-model.number="row.gradeRank"
                :disabled="row._row_status==='D'" @input="onCellChange(row)">
            </td>
            <td>
              <input class="grid-input grid-num" type="number" v-model.number="row.minPurchaseAmt"
                :disabled="row._row_status==='D'" @input="onCellChange(row)">
            </td>
            <td>
              <input class="grid-input grid-num" type="number" step="0.01" v-model.number="row.saveRate"
                :disabled="row._row_status==='D'" @input="onCellChange(row)">
            </td>
            <td>
              <select class="grid-select" v-model="row.useYn"
                :disabled="row._row_status==='D'" @change="onCellChange(row)">
                <option v-for="c in codes.use_yn" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
              </select>
            </td>
            <td class="col-act-cancel-val">
              <button v-if="['U','I','D'].includes(row._row_status)"
                class="btn btn-secondary btn-xs" @click.stop="cancelRow(idx)">취소</button>
            </td>
            <td class="col-act-delete-val">
              <button v-if="['N','U'].includes(row._row_status)"
                class="btn btn-danger btn-xs" @click.stop="deleteRow(idx)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`
};
