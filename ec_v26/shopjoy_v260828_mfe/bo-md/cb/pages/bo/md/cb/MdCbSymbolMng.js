/* ShopJoy Admin - 코바늘 기호관리 (CRUD 그리드) */
export default {
  name: 'md-cb-mdCbSymbolMng',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, computed, onMounted } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    const uiState = reactive({ checkAll: false, loading: false, error: null, focusedIdx: null });
    const codes   = reactive({ use_yn: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbSymbolMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'searchParam-list') {
        return handleSearchList();
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        return handleSearchList();
      } else if (cmd === 'symbols-add') {
        return addRow();
      } else if (cmd === 'symbols-save') {
        return handleSave();
      } else if (cmd === 'symbols-deleteChecked') {
        return deleteRows();
      } else if (cmd === 'symbols-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdCbSymbolMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'symbols-rowCancel') {
        return cancelRow(param);
      } else if (cmd === 'symbols-rowDelete') {
        return deleteRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'symbols-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '' });
    const searchParamInit = {};

    const gridRows = reactive([]);
    let   _tempId  = -1;
    const EDIT_FIELDS = ['symbolCd', 'symbolNm', 'symbolChar', 'symbolDesc', 'stitchConsume', 'stitchProduce', 'sortOrd', 'useYn'];

    /* ##### [04] 내장 사용 함수 ############################################### */

    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = { pageNo: 1, pageSize: 10000, ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) params.searchType = 'symbolCd,symbolNm,symbolDesc';
        const res = await mdCbApiSvc.symbol.getPage(params, '코바늘기호관리', '목록조회');
        const list = res.data?.data?.pageList || [];
        gridRows.splice(0);
        list.forEach(s => gridRows.push(makeRow(s)));
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
      await codeStore.saLoadCodes(['USE_YN'], { compNm: 'md-cb-mdCbSymbolMng' });
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    const makeRow = (s) => ({
      ...s,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = s[f]; return acc; }, {}),
    });

    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    const addRow = () => {
      const newRow = {
        symbolId: _tempId--, symbolCd: '', symbolNm: '', symbolChar: '', symbolDesc: '',
        stitchConsume: 1, stitchProduce: 1, sortOrd: gridRows.length + 1, useYn: 'Y',
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
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.symbolId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.symbolId) || row._row_status === 'N') continue;
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
        if (!r.symbolCd || !r.symbolNm || !r.symbolChar) { showToast('기호코드, 기호명, 기호문자는 필수 항목입니다.', 'error'); return; }
      }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await mdCbApiSvc.symbol.saveList('base', saveRows, '코바늘기호관리', '저장');
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
          { value: 'symbolCd', label: '기호코드' },
          { value: 'symbolNm', label: '기호명' },
          { value: 'symbolDesc', label: '기호설명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    columns.baseGrid = [
      { key: 'symbolCd',      label: '기호코드', style: 'min-width:100px;', edit: 'text', mono: true, placeholder: 'SC' },
      { key: 'symbolNm',      label: '기호명',   style: 'min-width:120px;', edit: 'text', placeholder: '짧은뜨기' },
      { key: 'symbolChar',    label: '기호문자', style: 'width:80px;', align: 'center', edit: 'text', mono: true },
      { key: 'symbolDesc',    label: '설명',     style: 'min-width:220px;', edit: 'text' },
      { key: 'stitchConsume', label: '소모코수', style: 'width:80px;', align: 'center', edit: 'number' },
      { key: 'stitchProduce', label: '생성코수', style: 'width:80px;', align: 'center', edit: 'number' },
      { key: 'sortOrd',       label: '순서',     cls: 'col-ord', edit: 'number' },
      { key: 'useYn',         label: '사용여부', cls: 'col-use', edit: 'select', options: () => codes.use_yn },
    ];

    return {
      columns, uiState, searchParam, gridRows,
      handleBtnAction, handleSelectAction, handleGridCellAction,
    };
  },
  template: /* html */`
<bo-page title="코바늘 기호관리" :share-query="searchParam">
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="gridRows" row-key="symbolId"
      list-title="기호목록" max-height="calc(100vh - 320px)"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('symbols-add')" @save="handleBtnAction('symbols-save')"
      @delete-checked="handleBtnAction('symbols-deleteChecked')" @cancel-checked="handleBtnAction('symbols-cancelChecked')"
      grid-id="symbols-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('symbols-rowCancel', idx)" @delete="handleSelectAction('symbols-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
</bo-page>
`,
};
