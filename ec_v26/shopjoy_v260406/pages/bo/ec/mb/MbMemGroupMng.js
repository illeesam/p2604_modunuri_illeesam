/* ShopJoy Admin - 회원그룹관리 (CRUD 그리드) */
window.MbMemGroupMng = {
  name: 'MbMemGroupMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, checkAll: false, focusedIdx: null });
    const codes = reactive({ use_yn: [] });
    const searchParam = reactive({ use: '' });
    const gridRows = reactive([]);
    let _tempId = -1;

    const EDIT_FIELDS = ['groupNm', 'groupMemo', 'useYn'];

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };

    /* makeRow — 행 생성 */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check: false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        const res = await boApiSvc.mbMemGroup.getPage(params, '회원그룹관리', '목록조회');
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
      handleSearchList();
    });

    /* onSearch — 조회 */
    const onSearch = async () => { await handleSearchList(); };

    /* onReset — 초기화 */
    const onReset = () => { Object.assign(searchParam, { use: '' }); handleSearchList(); };

    /* setFocused — 포커스 설정 */
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const newRow = {
        memberGroupId: _tempId--, groupNm: '', groupMemo: '', memberCnt: 0, useYn: 'Y',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        row._row_status = 'D';
      }
    };

    /* cancelRow — 행 취소 */
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

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) { continue; }
        if (gridRows[i]._row_status === 'I') { gridRows.splice(i, 1); }
        else { gridRows[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.memberGroupId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.memberGroupId)) { continue; }
        if (row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.groupNm) {
          showToast('그룹명은 필수입니다.', 'error'); return;
        }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.mbMemGroup.saveList(saveRows, '회원그룹관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
    const cfVisibleCount = computed(() => gridRows.filter(r => r._row_status !== 'D').length);

        // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'searchValue', type: 'text', label: '그룹명', placeholder: '그룹명 검색' },
      { key: 'use', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    const baseGridColumns = [
      { key: 'groupNm',   label: '그룹명',   style: 'min-width:180px;',
        edit: 'text', placeholder: '그룹명' },
      { key: 'groupMemo', label: '메모',     style: 'min-width:260px;',
        edit: 'text', placeholder: '메모' },
      { key: 'memberCnt', label: '회원수',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'useYn',     label: '사용여부', style: 'width:90px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    // ===== return (템플릿 노출) ===============================================


    return {
      uiState, codes, searchParam, gridRows, baseSearchColumns, baseGridColumns,
      onSearch, onReset, setFocused, onCellChange,
      addRow, deleteRow, cancelRow, deleteRows, cancelChecked, toggleCheckAll,
      handleSave, fnStatusClass, cfVisibleCount,
    };
  },
  template: `
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">회원그룹관리</div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. CRUD 그리드 ================================================ -->
  <bo-grid-crud
    :columns="baseGridColumns" :rows="gridRows" row-key="memberGroupId"
    list-title="회원그룹 목록"
    :empty-text="uiState.loading ? '로딩중...' : '데이터가 없습니다.'"
    v-model:focusedIdx="uiState.focusedIdx"
    v-model:checkAll="uiState.checkAll"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @cell-change="onCellChange">
    <template #row-actions="{ row, idx }">
      <bo-row-cancel-delete :row="row" @cancel="cancelRow(idx)" @delete="deleteRow(idx)" />
    </template>
  </bo-grid-crud>
</div>

  <!-- ===== □. CRUD 그리드 ================================================ -->`
};
