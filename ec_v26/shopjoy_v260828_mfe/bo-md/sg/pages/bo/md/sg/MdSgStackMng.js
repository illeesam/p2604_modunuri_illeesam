/* ShopJoy Admin - 소스젠 언어/스택관리 (CRUD 그리드 — [소스 생성] 팝오버 체크리스트의 데이터 소스)
   BoGridCrud 표준(SyBrandMng.js 모델) — 체크박스/드래그정렬/행상태뱃지/취소·삭제 버튼 내장. */

/* MD_SG_STACK_CATEGORY_OPTIONS — 구획 select 옵션. FO 팝오버(MdSgSourcegenPage)의
   SG_STACK_SECTIONS 라벨과 맞춘다. */
const MD_SG_STACK_CATEGORY_OPTIONS = [
  { value: 'BACKEND',   label: 'Backend' },
  { value: 'FRONTEND',  label: 'Frontend' },
  { value: 'FULLSTACK', label: 'Fullstack' },
  { value: 'MOBILE',    label: 'Mobile' },
  { value: 'ETC',       label: 'Etc' },
];

export default {
  name: 'md-sg-mdSgStackMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const stacks  = reactive([]);                  // 스택 목록 (원본)
    const uiState = reactive({ checkAll: false, loading: false, error: null, focusedIdx: null });
    const codes   = reactive({ use_yn: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgStackMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        return handleSearchList();
      // 스택 그리드 행 추가
      } else if (cmd === 'stacks-add') {
        return addRow();
      // 스택 그리드 저장
      } else if (cmd === 'stacks-save') {
        return handleSave();
      // 체크된 행 일괄 삭제 마킹
      } else if (cmd === 'stacks-deleteChecked') {
        return deleteRows();
      // 체크된 행 일괄 취소
      } else if (cmd === 'stacks-cancelChecked') {
        return cancelChecked();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ MdSgStackMng.js : handleSelectAction -> ', cmd, param);
      if (cmd === 'stacks-rowCancel') {
        return cancelRow(param);
      // 그리드 행 삭제 마킹
      } else if (cmd === 'stacks-rowDelete') {
        return deleteRow(param);
      // 드래그 정렬 후 sortOrd 재부여
      } else if (cmd === 'stacks-reorder') {
        return handleReorder();
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ categoryCd: '', useYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다. */
    const searchParamInit = {};

    const gridRows    = reactive([]);              // CRUD 그리드 행
    let   _tempId     = -1;                        // 신규 행 임시 ID
    const EDIT_FIELDS = ['categoryCd', 'stackNm', 'stackPrefix', 'versionList', 'defaultVersion', 'sortOrd', 'useYn'];

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 (소규모 카탈로그라 페이징 없이 전체 로드) */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const res = await mdSgApiSvc.stack.getList({ ...coUtil.cofOmitEmpty(searchParam) }, '소스젠언어스택관리', '목록조회');
        stacks.splice(0, stacks.length, ...(res.data?.data || []));
        gridRows.splice(0);
        stacks.forEach(s => gridRows.push(makeRow(s)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      await codeStore.saLoadCodes(['USE_YN'], { compNm: 'md-sg-mdSgStackMng' });
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
    };

    /* makeRow — 행 생성 (BoGridCrud 가 _row_org 스냅샷과 비교해 N→U 전환을 직접 처리) */
    const makeRow = (s) => ({
      ...s,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = s[f]; return acc; }, {}),
    });

    /* addRow — 행 추가 */
    const addRow = () => {
      const newRow = {
        stackId: _tempId--, categoryCd: 'BACKEND', stackNm: '', stackPrefix: '',
        versionList: 'v1', defaultVersion: 'v1', sortOrd: gridRows.length + 1, useYn: 'Y',
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
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.stackId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.stackId)) { continue; }
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

    /* handleReorder — 드래그 정렬 후 호출(BoGridCrud 가 gridRows 를 이미 in-place 재배열함).
       현재 순서대로 sortOrd 재부여 + 순서 바뀐 기존(N) 행을 U 마킹 */
    const handleReorder = () => {
      gridRows.forEach((r, i) => {
        const newOrd = i + 1;
        if (r.sortOrd !== newOrd) {
          r.sortOrd = newOrd;
          if (r._row_status === 'N') { r._row_status = 'U'; }
        }
      });
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
        if (!r.stackNm || !r.stackPrefix) {
          showToast('스택명, 생성 파일 경로 접두어는 필수 항목입니다.', 'error'); return;
        }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?',
        { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await mdSgApiSvc.stack.saveList('base', saveRows, '소스젠언어스택관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    // ★ onMounted
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
      { key: 'categoryCd', type: 'select', label: '구획', options: MD_SG_STACK_CATEGORY_OPTIONS, nullLabel: '전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'categoryCd',     label: '구획',    style: 'width:110px;', edit: 'select', options: MD_SG_STACK_CATEGORY_OPTIONS },
      { key: 'stackNm',        label: '스택명',  style: 'min-width:160px;', edit: 'text', placeholder: '예: JPA' },
      { key: 'stackPrefix',    label: '생성 파일 경로 접두어', style: 'min-width:220px;', edit: 'text', mono: true, placeholder: 'backend_jpa/' },
      { key: 'versionList',    label: '버전목록', style: 'width:120px;', edit: 'text', mono: true, placeholder: 'v1,v2,v3' },
      { key: 'defaultVersion', label: '기본버전', style: 'width:90px;',  edit: 'text', mono: true, placeholder: 'v1' },
      { key: 'sortOrd',        label: '순서',    cls: 'col-ord', edit: 'number' },
      { key: 'useYn',          label: '사용여부', cls: 'col-use', edit: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      stacks, uiState, searchParam, gridRows,       // 상태 / 데이터
      handleBtnAction, handleSelectAction,           // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<bo-page title="소스젠 언어/스택관리" :share-query="searchParam">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. CRUD 그리드 ============================================== -->
  <bo-container bare>
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="gridRows" row-key="stackId" :show-row-id="false"
      list-title="언어/스택 목록" max-height="calc(100vh - 320px)"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      @add="handleBtnAction('stacks-add')" @save="handleBtnAction('stacks-save')"
      @delete-checked="handleBtnAction('stacks-deleteChecked')" @cancel-checked="handleBtnAction('stacks-cancelChecked')"
      @reorder="handleSelectAction('stacks-reorder')"
      grid-id="stacks-cellChange">
      <template #row-actions="{ row, idx }">
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('stacks-rowCancel', idx)" @delete="handleSelectAction('stacks-rowDelete', idx)" />
      </template>
    </bo-grid-crud>
  </bo-container>
  <!-- ===== □. CRUD 그리드 ============================================== -->
</bo-page>
`,
};
