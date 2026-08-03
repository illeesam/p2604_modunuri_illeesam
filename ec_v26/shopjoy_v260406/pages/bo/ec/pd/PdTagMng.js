/* ShopJoy Admin - 태그관리 */
window.PdTagMng = {
  name: 'PdTagMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const tags = reactive([]);                    // 태그 목록 원본
    const gridRows = reactive([]);                // 태그 그리드 행 (편집 상태 포함)
    const uiState = reactive({ loading: false, error: null });
    const codes = reactive({ use_yn: [] });
    let _tempId = -1;

    /* ===== 검색조건 ===== */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ PdTagMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        baseGridPager.pageNo = 1;
        return handleSearchList();
      // 태그 그리드 행 추가
      } else if (cmd === 'tags-add') {
        gridRows.unshift({ tagId: 'T' + (_tempId--), siteId: null, tagNm: '', tagDesc: '', useCount: 0, sortOrd: 0, useYn: 'Y', _row_status: 'N' });
        return;
      // 태그 그리드 저장
      } else if (cmd === 'tags-save') {
        return handleSave();
      // 페이지 번호 변경
      } else if (cmd === 'tags-pager-setPage') {
        if (param >= 1 && param <= baseGridPager.pageTotalPage) { baseGridPager.pageNo = param; handleSearchList('PAGE_CLICK'); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/모달 선택 액션 dispatch */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ PdTagMng.js : handleSelectAction -> ', cmd, param);
      // 태그 그리드 행 삭제
      if (cmd === 'tags-rowDelete') {
        return handleDelete(param);
      // 페이지 크기 변경
      } else if (cmd === 'tags-pager-sizeChange') {
        baseGridPager.pageNo = 1;
        return handleSearchList('DEFAULT');
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'tags-cellChange') {
        // 셀 변경 → 수정 마킹
        if (row._row_status !== 'N') { row._row_status = 'U'; }
        return;
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ useYn: '' });
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    /* ===== 페이지네이션 ===== */
    const baseGridPager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.pdTag.getPage({ pageNo: baseGridPager.pageNo, pageSize: baseGridPager.pageSize, ...coUtil.cofOmitEmpty(searchParam) }, '태그관리', '목록조회');
        const data = res.data?.data;
        tags.splice(0, tags.length, ...(data?.pageList || []));
        baseGridPager.pageTotalCount = data?.pageTotalCount || 0;
        baseGridPager.pageTotalPage = data?.pageTotalPage || coUtil.cofTotalPage(baseGridPager);
        coUtil.cofBuildPagerNums(baseGridPager);
        Object.assign(baseGridPager.pageCond, data?.pageCond || baseGridPager.pageCond);
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleDelete — 행 삭제 */
    const handleDelete = async (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'N') { gridRows.splice(idx, 1); return; }
      const ok = await showConfirm('삭제', `[${row.tagNm}] 태그를 삭제하시겠습니까?`);
      if (!ok) { return; }
      const si = tags.findIndex(t => t.tagId === row.tagId); if (si !== -1) tags.splice(si, 1); gridRows.splice(idx, 1);
      try {
        const res = await boApiSvc.pdTag.remove(row.tagId, '태그관리', '삭제');
      } catch (err) {
        console.error('[catch-info]', err);
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const changed = window.safeArrayUtils.safeFilter(gridRows, r => ['N','I','U','D'].includes(r._row_status));
      if (!changed.length) { showToast('변경된 내용이 없습니다.', 'info'); return; }
      for (const row of changed.filter(r => r._row_status !== 'D')) {
        if (!row.tagNm) { showToast('태그명은 필수입니다.', 'error'); return; }
      }
      const ok = await showConfirm('저장', '저장하시겠습니까?');
      if (!ok) { return; }
      const saveRows = changed.map(r => ({ ...r, rowStatus: r._row_status === 'N' ? 'I' : r._row_status }));
      try {
        await boApiSvc.pdTag.saveList('base', saveRows, '태그관리', '저장');
        if (showToast) { showToast('저장되었습니다.', 'success'); }
        await handleSearchList();
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (showToast) { showToast(errMsg, 'error', 0); }
      }
    };




    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = async () => {
      const codeStore = window.sfGetBoCodeStore();
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['USE_YN'], {compNm: 'PdTagMng'});
      try {
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      await fnLoadCodes();
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    watch(tags, (list) => { gridRows.splice(0, gridRows.length, ...list.map(t => ({ ...t, _row_status: 'N' }))); }, { immediate: true });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', label: '태그명', type: 'text', placeholder: '태그명 검색' },
      { key: 'useYn', label: '사용여부', type: 'select', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'tagNm',    label: '태그명', edit: 'text', placeholder: '태그명' },
      { key: 'tagDesc',  label: '설명',   edit: 'text', placeholder: '설명',
        cellStyle: 'color:#888;font-size:12px;' },
      { key: 'useCount', label: '사용수', style: 'width:80px;text-align:right;', align: 'right', fmt: (v) => (v || 0) },
      { key: 'sortOrd',  label: '정렬',   style: 'width:80px;text-align:right;', edit: 'number', align: 'right' },
      { key: 'useYn',    label: '사용',   style: 'width:70px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, searchParam, baseGridPager, gridRows,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, // dispatch
    };
  },
  template: `
<bo-page title="태그관리">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" :columns="columns.baseSearch" :param="searchParam" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 목록 그리드 =================================================== -->
  <bo-container title="태그 목록" :count-text="baseGridPager.pageTotalCount + '건'">
    <template #toolbar-actions>
      <button class="btn btn_new" @click="handleBtnAction('tags-add')">
        + 행추가
      </button>
      <button class="btn btn_save" @click="handleBtnAction('tags-save')">
        저장
      </button>
    </template>
    <bo-grid
      bare max-height="calc(100vh - 320px)"
      :columns="columns.baseGrid" :rows="gridRows" row-key="tagId" row-actions
      :row-class="(row) => row._row_status==='N' ? 'table-rowNew' : (row._row_status==='U' ? 'table-rowMod' : '')"
      grid-id="tags-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
      <template #row-actions="{ idx }">
        <button class="btn btn_row_delete" @click="handleSelectAction('tags-rowDelete', idx)">
          삭제
        </button>
      </template>
    </bo-grid>
    <!-- 페이저는 그리드 밖(컨테이너 안)에 배치 -->
    <bo-pager :pager="baseGridPager" :on-set-page="n => handleBtnAction('tags-pager-setPage', n)" :on-size-change="() => handleSelectAction('tags-pager-sizeChange')" />
  </bo-container>
  <!-- ===== □. 목록 그리드 =================================================== -->
</bo-page>
`
};
