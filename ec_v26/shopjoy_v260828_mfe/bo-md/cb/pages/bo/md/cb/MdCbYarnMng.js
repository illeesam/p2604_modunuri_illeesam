/* ShopJoy Admin - 코바늘 실관리 (CRUD 그리드) */
export default {
  name: 'md-cb-mdCbYarnMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState = reactive({ checkAll: false, loading: false, error: null, focusedIdx: null });
    const codes   = reactive({ use_yn: [], weight_cd: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbYarnMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        return handleSearchList();
      } else if (cmd === 'yarns-add') {
        return addRow();
      } else if (cmd === 'yarns-save') {
        return handleSave();
      } else if (cmd === 'yarns-deleteChecked') {
        return deleteRows();
      } else if (cmd === 'yarns-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbYarnMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'yarns-rowCancel') {
        return cancelRow(param);
      } else if (cmd === 'yarns-rowDelete') {
        return deleteRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'yarns-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', weightCd: '', useYn: '' });
    const searchParamInit = {};

    const gridRows = reactive([]);
    let   _tempId  = -1;
    const EDIT_FIELDS = ['yarnNm', 'colorHex', 'weightCd', 'brandNm', 'useYn'];

    /* ##### [04] 내장 사용 함수 ############################################### */

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: 1, pageSize: 10000, ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) params.searchType = 'yarnNm,brandNm';
        const res = await mdCbApiSvc.yarn.getPage(params, '코바늘실관리', '목록조회');
        const list = res.data?.data?.pageList || [];
        gridRows.splice(0);
        list.forEach(y => gridRows.push(makeRow(y)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['USE_YN', 'CB_YARN_WEIGHT_CD'], { compNm: 'md-cb-mdCbYarnMng' });
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.weight_cd = codeStore.sgGetGrpCodes('CB_YARN_WEIGHT_CD');
    };

    const makeRow = (y) => ({
      ...y,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = y[f]; return acc; }, {}),
    });

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const newRow = {
        yarnId: _tempId--, yarnNm: '', colorHex: '#ffffff', weightCd: '', brandNm: '', useYn: 'Y',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') { gridRows.splice(idx, 1); }
      else { row._row_status = 'D'; }
    };

    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') { gridRows.splice(idx, 1); }
      else {
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.yarnId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.yarnId) || row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.yarnNm || !r.colorHex) { showToast('실 이름, 색상은 필수 항목입니다.', 'error'); return; }
      }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await mdCbApiSvc.yarn.saveList('base', saveRows, '코바늘실관리', '저장');
        showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);
    };
    onMounted(initPage);

    /* ##### [05] 컬럼정의 #################### */

    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'yarnNm', label: '실이름' },
          { value: 'brandNm', label: '브랜드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'weightCd', type: 'select', label: '실굵기', options: () => codes.weight_cd, nullLabel: '실굵기 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    columns.baseGrid = [
      { key: 'yarnNm',   label: '실 이름', style: 'min-width:160px;', edit: 'text', placeholder: '코튼워시드 아이보리' },
      { key: 'colorHex', label: '색상',   style: 'width:100px;', align: 'center', edit: 'text', mono: true, placeholder: '#RRGGBB' },
      { key: 'weightCd', label: '굵기',   style: 'width:120px;', edit: 'select', options: () => codes.weight_cd },
      { key: 'brandNm',  label: '브랜드', style: 'min-width:140px;', edit: 'text' },
      { key: 'useYn',    label: '사용여부', cls: 'col-use', edit: 'select', options: () => codes.use_yn },
    ];

    return {
      columns, uiState, searchParam, gridRows,
      handleBtnAction, handleSelectAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="코바늘 실관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="gridRows" row-key="yarnId"
      list-title="실목록" max-height="calc(100vh - 320px)"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('yarns-add')" @save="handleBtnAction('yarns-save')"
      @delete-checked="handleBtnAction('yarns-deleteChecked')" @cancel-checked="handleBtnAction('yarns-cancelChecked')"
      grid-id="yarns-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('yarns-rowCancel', idx)" @delete="handleSelectAction('yarns-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
</bo-page>
`,
};
