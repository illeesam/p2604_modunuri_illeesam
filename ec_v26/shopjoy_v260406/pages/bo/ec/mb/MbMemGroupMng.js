/* ShopJoy Admin - 회원그룹관리 (CRUD 그리드) */
window.MbMemGroupMng = {
  name: 'MbMemGroupMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      checkAll: false, focusedIdx: null,
    });
    const codes = reactive({ use_yn: [] }); // 공통코드

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemGroupMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        return handleSearchList();
      // 회원그룹 그리드 저장
      } else if (cmd === 'groups-save') {
        return handleSave();
      // 회원그룹 그리드 행 추가
      } else if (cmd === 'groups-add') {
        return addRow();
      // 체크된 회원그룹 일괄 삭제
      } else if (cmd === 'groups-deleteChecked') {
        return deleteRows();
      // 체크된 회원그룹 일괄 취소
      } else if (cmd === 'groups-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemGroupMng.js : handleSelectAction -> ', cmd, param);
      // 회원그룹 그리드 행 삭제 마킹
      if (cmd === 'groups-rowDelete') {
        return deleteRow(param);
      // 회원그룹 그리드 행 변경 취소
      } else if (cmd === 'groups-rowCancel') {
        return cancelRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'groups-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => ({ searchValue: '', use: '' });
    const searchParam = reactive(_initSearchParam());

    /* ===== CRUD 그리드 ===== */
    const groups = reactive([]);                   // 회원그룹 목록 (CRUD 그리드 데이터)
    let _tempId = -1;                              // 신규 행 임시 ID (음수)
    const EDIT_FIELDS = ['groupNm', 'groupMemo', 'useYn'];
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* makeRow — 행 생성 */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check: false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });

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
        groups.splice(0, groups.length, ...list.map(b => makeRow(b)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* onCellChange — 셀 변경 감지 */
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
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : groups.length;
      groups.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (idx) => {
      const row = groups[idx];
      if (row._row_status === 'I') {
        groups.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        row._row_status = 'D';
      }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (idx) => {
      const row = groups[idx];
      if (row._row_status === 'I') {
        groups.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = groups.length - 1; i >= 0; i--) {
        if (!groups[i]._row_check) { continue; }
        if (groups[i]._row_status === 'I') { groups.splice(i, 1); }
        else { groups[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(groups.filter(r => r._row_check).map(r => r.memberGroupId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = groups.length - 1; i >= 0; i--) {
        const row = groups[i];
        if (!ids.has(row.memberGroupId)) { continue; }
        if (row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { groups.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = groups.filter(r => r._row_status === 'I');
      const uRows = groups.filter(r => r._row_status === 'U');
      const dRows = groups.filter(r => r._row_status === 'D');
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
        await boApiSvc.mbMemGroup.saveList('base', saveRows, '회원그룹관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };

    // ★ onMounted — 진입 시 목록 초기 조회
    onMounted(() => {
      handleSearchList();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    const cfVisibleCount = computed(() => groups.filter(r => r._row_status !== 'D').length);

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '그룹명', placeholder: '그룹명 검색' },
      { key: 'use', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'groupNm',   label: '그룹명',   style: 'min-width:180px;',
        edit: 'text', placeholder: '그룹명' },
      { key: 'groupMemo', label: '메모',     style: 'min-width:260px;',
        edit: 'text', placeholder: '메모' },
      { key: 'memberCnt', label: '회원수',   style: 'width:90px;text-align:right;',
        align: 'right', fmt: (v) => (v || 0).toLocaleString() },
      { key: 'useYn',     label: '사용여부', style: 'width:90px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, codes, searchParam, groups,                                             // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
      cfVisibleCount,                                                                  // computed
      fnStatusClass,                                                                   // 헬퍼
    };
  },
  template: `
<bo-page title="회원그룹관리">
  <!-- ===== ■. 검색 ======================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. CRUD 그리드 ================================================ -->
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="groups" row-key="memberGroupId"
      list-title="회원그룹 목록"
      :empty-text="uiState.loading ? '로딩중...' : '데이터가 없습니다.'"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('groups-add')" @save="handleBtnAction('groups-save')"
      @delete-checked="handleBtnAction('groups-deleteChecked')" @cancel-checked="handleBtnAction('groups-cancelChecked')"
      grid-id="groups-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('groups-rowCancel', idx)" @delete="handleSelectAction('groups-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
  <!-- ===== □. CRUD 그리드 ================================================ -->
</bo-page>
`,
};
