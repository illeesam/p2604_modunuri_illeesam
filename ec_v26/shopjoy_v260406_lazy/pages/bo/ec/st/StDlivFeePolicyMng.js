/* ShopJoy Admin - 배송수수료정책 (CRUD 그리드) — 배송방법(DLIV_METHOD_CD)별 플랫폼 수수료율/정액 관리 */
window.StDlivFeePolicyMng = {
  name: 'StDlivFeePolicyMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const uiState = reactive({ checkAll: false, loading: false, focusedIdx: null });
    const codes   = reactive({ dliv_methods: [], use_yn: [] });

    const gridRows = reactive([]);              // CRUD 그리드 행
    let   _tempId  = -1;                        // 신규 행 임시 ID
    const EDIT_FIELDS = ['dlivMethodCd', 'feeRate', 'feeAmt', 'sortOrd', 'useYn', 'remark'];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ StDlivFeePolicyMng.js : handleBtnAction -> ', cmd, param);
      if (cmd === 'policies-add') {
        return addRow();
      } else if (cmd === 'policies-save') {
        return handleSave();
      } else if (cmd === 'policies-deleteChecked') {
        return deleteRows();
      } else if (cmd === 'policies-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ StDlivFeePolicyMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'policies-rowCancel') {
        return cancelRow(param);
      } else if (cmd === 'policies-rowDelete') {
        return deleteRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경 라우터 */
    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'policies-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* makeRow — 행 생성 */
    const makeRow = (p) => ({
      ...p,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = p[f]; return acc; }, {}),
    });

    /* onCellChange — 셀 변경 감지 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const newRow = {
        dlivFeePolicyId: _tempId--, dlivMethodCd: '', feeRate: null, feeAmt: null,
        sortOrd: gridRows.length + 1, useYn: 'Y', remark: '',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 마킹 */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        row._row_status = 'D';
      }
    };

    /* cancelRow — 행 변경 취소 */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* cancelChecked — 체크된 행 일괄 취소 */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.dlivFeePolicyId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.dlivFeePolicyId)) { continue; }
        if (row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* deleteRows — 체크된 행 일괄 삭제 마킹 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) { continue; }
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* handleSearchList — 목록 조회 (페이징 없음 — CRUD 그리드) */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.stDlivFeePolicy.getPage({ pageNo: 1, pageSize: 500, sort: 'sortOrd asc' }, '배송수수료정책관리', '목록조회');
        const list = res.data?.data?.pageList || [];
        gridRows.splice(0);
        list.forEach(p => gridRows.push(makeRow(p)));
      } catch (err) {
        showToast(coUtil.cofErrMsg(err, '조회 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.dlivMethodCd) { showToast('배송방법은 필수 항목입니다.', 'error'); return; }
        if (r.feeRate == null && r.feeAmt == null) { showToast('수수료율 또는 수수료 정액 중 하나는 입력해야 합니다.', 'error'); return; }
      }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.stDlivFeePolicy.saveList('base', saveRows, '배송수수료정책관리', '저장');
        showToast('저장되었습니다.', 'success');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['DLIV_METHOD_CD', 'USE_YN'], { compNm: 'StDlivFeePolicyMng' });
      codes.dliv_methods = codeStore.sgGetGrpCodes('DLIV_METHOD_CD');
      codes.use_yn        = codeStore.sgGetGrpCodes('USE_YN');
    };

    /* initPage — 화면 로드 시퀀스 */
    const initPage = async () => { await fnLoadCodes(); await handleSearchList(); };
    onMounted(initPage);

    /* ##### [05] 컬럼 정의 ########################################################## */

    const columns = {};
    columns.baseGrid = [
      { key: 'dlivMethodCd', label: '배송방법', style: 'min-width:150px;', edit: 'select', options: () => codes.dliv_methods },
      { key: 'feeRate',      label: '수수료율(%)', cls: 'col-ord', edit: 'number' },
      { key: 'feeAmt',       label: '수수료 정액(원)', cls: 'col-ord', edit: 'number' },
      { key: 'sortOrd',      label: '순서', cls: 'col-ord', edit: 'number' },
      { key: 'useYn',        label: '사용여부', cls: 'col-use', edit: 'select', options: () => codes.use_yn },
      { key: 'remark',       label: '비고', style: 'min-width:220px;', edit: 'text', placeholder: '예: 오지/도서산간 배송 - 정률+정액 가산' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, gridRows,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<bo-page title="배송수수료정책">
  <!-- ===== ■. CRUD 그리드 ================================================= -->
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="gridRows" row-key="dlivFeePolicyId"
      list-title="배송수수료정책" max-height="480px"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('policies-add')" @save="handleBtnAction('policies-save')"
      @delete-checked="handleBtnAction('policies-deleteChecked')" @cancel-checked="handleBtnAction('policies-cancelChecked')"
      grid-id="policies-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('policies-rowCancel', idx)" @delete="handleSelectAction('policies-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
</bo-page>
`,
};
