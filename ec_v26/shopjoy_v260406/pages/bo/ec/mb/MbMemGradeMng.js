/* ShopJoy Admin - 회원등급관리 (CRUD 그리드) */
window.MbMemGradeMng = {
  name: 'MbMemGradeMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const uiState = reactive({                     // UI 상태
      loading: false, error: null, checkAll: false, focusedIdx: null,
    });
    const codes = reactive({ member_grades: [], use_yn: [] }); // 공통코드

    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemGradeMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        return handleSearchList();
      // 회원등급 그리드 저장
      } else if (cmd === 'grades-save') {
        return handleSave();
      // 회원등급 그리드 행 추가
      } else if (cmd === 'grades-add') {
        return addRow();
      // 체크된 회원등급 일괄 삭제
      } else if (cmd === 'grades-deleteChecked') {
        return deleteRows();
      // 체크된 회원등급 일괄 취소
      } else if (cmd === 'grades-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MbMemGradeMng.js : handleSelectAction -> ', cmd, param);
      // 회원등급 그리드 행 삭제 마킹
      if (cmd === 'grades-rowDelete') {
        return deleteRow(param);
      // 회원등급 그리드 행 변경 취소
      } else if (cmd === 'grades-rowCancel') {
        return cancelRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'grades-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* ===== CRUD 그리드 ===== */
    const grades = reactive([]);                   // 회원등급 목록 (CRUD 그리드 데이터)
    let _tempId = -1;                              // 신규 행 임시 ID (음수)
    const EDIT_FIELDS = ['gradeCd', 'gradeNm', 'gradeRank', 'minPurchaseAmt', 'saveRate', 'useYn'];

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
          ...coUtil.cofOmitEmpty(searchParam),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'gradeNm,gradeCd';
        }
        const res = await boApiSvc.mbMemGrade.getPage(params, '회원등급관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        grades.splice(0, grades.length, ...list.map(b => makeRow(b)));
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
        memberGradeId: _tempId--, gradeCd: '', gradeNm: '', gradeRank: grades.length + 1,
        minPurchaseAmt: 0, saveRate: 1, useYn: 'Y',
        _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : grades.length;
      grades.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (idx) => {
      const row = grades[idx];
      if (row._row_status === 'I') {
        grades.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        row._row_status = 'D';
      }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (idx) => {
      const row = grades[idx];
      if (row._row_status === 'I') {
        grades.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* deleteRows — 선택 행 삭제 */
    const deleteRows = () => {
      for (let i = grades.length - 1; i >= 0; i--) {
        if (!grades[i]._row_check) { continue; }
        if (grades[i]._row_status === 'I') { grades.splice(i, 1); }
        else { grades[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const ids = new Set(grades.filter(r => r._row_check).map(r => r.memberGradeId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = grades.length - 1; i >= 0; i--) {
        const row = grades[i];
        if (!ids.has(row.memberGradeId)) { continue; }
        if (row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { grades.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = grades.filter(r => r._row_status === 'I');
      const uRows = grades.filter(r => r._row_status === 'U');
      const dRows = grades.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.gradeCd || !r.gradeNm) {
          showToast('등급코드와 등급명은 필수입니다.', 'error'); return;
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
        await boApiSvc.mbMemGrade.saveList('base', saveRows, '회원등급관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['MEMBER_GRADE', 'USE_YN'], {compNm: 'MbMemGradeMng'});
      codes.member_grades = codeStore.sgGetGrpCodes('MEMBER_GRADE');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList();
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */





    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'gradeNm', label: '등급명' },
          { value: 'gradeCd', label: '코드' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'gradeCd',        label: '등급코드',     style: 'width:130px;',
        edit: 'select', options: () => codes.member_grades },
      { key: 'gradeNm',        label: '등급명',       style: 'min-width:150px;',
        edit: 'text', placeholder: '등급명' },
      { key: 'gradeRank',      label: '순위',         style: 'width:80px;text-align:right;',
        edit: 'number' },
      { key: 'minPurchaseAmt', label: '최소구매금액', style: 'width:200px;text-align:right;',
        edit: 'number' },
      { key: 'saveRate',       label: '적립률(%)',    style: 'width:110px;text-align:right;',
        edit: 'number' },
      { key: 'useYn',          label: '사용여부',     style: 'width:90px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, searchParam, grades,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction,                                             // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: `
<bo-page title="회원등급관리">
  <!-- ===== ■. 검색 ======================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ======================================================== -->
  <!-- ===== ■. CRUD 그리드 ================================================ -->
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="grades" row-key="memberGradeId"
      list-title="회원등급 목록" max-height="calc(100vh - 220px)"
      :empty-text="uiState.loading ? '로딩중...' : '데이터가 없습니다.'"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('grades-add')" @save="handleBtnAction('grades-save')"
      @delete-checked="handleBtnAction('grades-deleteChecked')" @cancel-checked="handleBtnAction('grades-cancelChecked')"
      grid-id="grades-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('grades-rowCancel', idx)" @delete="handleSelectAction('grades-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
  <!-- ===== □. CRUD 그리드 ================================================ -->
</bo-page>
`,
};
