/* ShopJoy - Sample08: 카테고리 관리 CRUD Grid  (API: GET|POST|PUT|DELETE /api/base/sy/zz-sample1, cdGrp='S08_CATEGORY')
 * ZzSample1 필드 매핑:
 *   sample1Id → categoryId  |  cdNm → categoryNm  |  col01 → parentNm
 *   col02 → depth  |  srtordVl → sortOrd  |  useYn → useYn  |  regDt → regDate
 */
window.XsSample08 = {
  name: 'XsSample08',
  setup() {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, onMounted, watch } = Vue;

    const uiState = reactive({                     // UI 상태
      loading: false, error: null, isPageCodeLoad: false,
      dragSrc: null, focusedIdx: null, dragMoved: false, checkAll: false,
    });
    const codes = reactive({                       // 정적 옵션
      use_yn_opts: [{ value: 'Y', label: 'Y 사용' }, { value: 'N', label: 'N 미사용' }],
    });
    const CD_GRP = 'S08_CATEGORY';                 // 카테고리 코드 그룹
    const EDIT_FIELDS = ['categoryNm', 'parentNm', 'depth', 'sortOrd', 'useYn'];

    /* ===== 검색조건 ===== */
    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '' });
    const searchParamOrg = reactive({ searchType: '', searchValue: '', useYn: '' });

    /* ===== 그리드 데이터 ===== */
    const allDatas    = reactive([]);               // 원본 (서버 응답)
    const gridRows   = reactive([]);               // 화면 표시용 (필터 + 편집)
    let   _tempId    = -1;                         // 신규 행 임시 ID

    /* ===== 페이지네이션 ===== */
    /* pager — FO 클라이언트 페이징 (fnBuildPagerNums 가 직접 갱신) */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageNums: [], pageCond: {} });
    /* ===== 토스트 ===== */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let _tId = null;

    /* showToast — 토스트 표시 */
    const showToast = (msg, type = 'success') => {
      toast.msg = msg; toast.type = type; toast.show = true;
      clearTimeout(_tId);
      _tId = setTimeout(() => { toast.show = false; }, 2500);
    };

    /* ===== 데이터 변환 헬퍼 ===== */
    /* toRow — ZzSample1 → 화면 행 */
    const toRow = d => ({
      categoryId: d.sample1Id, categoryNm: d.cdNm || '', parentNm: d.col01 || '-',
      depth: Number(d.col02) || 1, sortOrd: Number(d.srtordVl) || 1,
      useYn: d.useYn || 'Y', regDate: d.regDt || '',
    });

    /* toPayload — 화면 행 → ZzSample1 페이로드 */
    const toPayload = r => ({
      cdGrp: CD_GRP, cdNm: r.categoryNm, col01: r.parentNm,
      col02: String(r.depth), srtordVl: r.sortOrd, useYn: r.useYn,
    });

    /* makeRow — 편집 상태 포함 행 생성 */
    const makeRow = d => ({
      ...d, _row_status: 'N', _row_check: false,
      _row_org: { categoryNm: d.categoryNm, parentNm: d.parentNm, depth: d.depth, sortOrd: d.sortOrd, useYn: d.useYn },
    });

    /* fnBuildPagerNums — 페이지 번호 배열 빌드 */
    const fnBuildPagerNums = () => {
      pager.pageTotalCount = gridRows.filter(r => r._row_status !== 'D').length;
      pager.pageTotalPage = Math.max(1, Math.ceil(gridRows.length / pager.pageSize));
      const c = pager.pageNo, l = pager.pageTotalPage;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
      pager.pageList = gridRows.slice((pager.pageNo - 1) * pager.pageSize, pager.pageNo * pager.pageSize);
    };





    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Sample08.js : handleBtnAction -> ', cmd, param);
      // 조회 (검색)
      if (cmd === 'search-search') {
        return onSearch();
      // 검색 초기화
      } else if (cmd === 'search-reset') {
        return onReset();
      // 행 추가
      } else if (cmd === 'categories-add') {
        return addRow();
      // 일괄 저장
      } else if (cmd === 'categories-save') {
        return handleSave();
      // 선택 행 삭제
      } else if (cmd === 'categories-deleteChecked') {
        return deleteRows();
      // 선택 행 취소
      } else if (cmd === 'categories-cancelChecked') {
        return cancelChecked();
      // 정렬 변경 알림
      } else if (cmd === 'categories-reorder') {
        return onReorder();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Sample08.js : handleSelectAction -> ', cmd, param);
      // 행 셀 변경
      if (cmd === 'categories-rowCellChange') {
        return onCellChange(param);
      // 행 취소
      } else if (cmd === 'categories-rowCancel') {
        return onRowCancel(param);
      // 행 삭제
      } else if (cmd === 'categories-rowDelete') {
        return onRowDelete(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [03] 초기 함수 (마운트 / 코드 로드 / watch) ############################## */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const res = await foApi.get('api/base/sy/zz-sample1', { params: { cdGrp: CD_GRP } });
        const list = res?.data?.data ?? res?.data ?? [];
        allDatas.splice(0, allDatas.length, ...list.map(toRow));
      } catch (e) { showToast('데이터 로드 실패: ' + (e.message || e), 'error'); }
      gridRows.splice(0); uiState.focusedIdx = null; pager.pageNo = 1;
      allDatas.filter(d => {
        const searchVal = searchParam.searchValue.toLowerCase();
        if (searchVal) {
          const types = searchParam.searchType || 'categoryNm,parentNm';
          const hits = [];
          if (types.includes('categoryNm')) { hits.push(String(d.categoryNm || '').toLowerCase().includes(searchVal)); }
          if (types.includes('parentNm')) { hits.push(String(d.parentNm || '').toLowerCase().includes(searchVal)); }
          if (!hits.some(Boolean)) { return false; }
        }
        if (searchParam.useYn && d.useYn !== searchParam.useYn) { return false; }
        return true;
      }).forEach(d => gridRows.push(makeRow(d)));
      fnBuildPagerNums();
    };

    /* onSearch — 조회 */
    const onSearch = async () => { pager.pageNo = 1; await handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset  = async () => { Object.assign(searchParam, searchParamOrg); pager.pageNo = 1; await handleSearchList('DEFAULT'); };



    /* onCellChange — 셀 변경 */
    const onCellChange = row => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      row._row_status = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f])) ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const at = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(at, 0, { categoryId: _tempId--, categoryNm: '', parentNm: '-', depth: 1, sortOrd: 1, useYn: 'Y', regDate: '', _row_status: 'I', _row_check: false, _row_org: null });
      uiState.focusedIdx = at;
      pager.pageNo = Math.ceil((at + 1) / pager.pageSize);
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = idx => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0)); }
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = idx => {
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
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.categoryId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.categoryId)) { continue; }
        if (row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else {
          if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
          row._row_status = 'N';
        }
      }
    };

    /* handleSave — 일괄 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.categoryNm) { showToast('카테고리명은 필수 항목입니다.', 'error'); return; }
      }
      const parts = [];
      if (iRows.length) { parts.push(`등록 ${iRows.length}건`); }
      if (uRows.length) { parts.push(`수정 ${uRows.length}건`); }
      if (dRows.length) { parts.push(`삭제 ${dRows.length}건`); }
      if (!confirm(`${parts.join(', ')}을(를) 저장하시겠습니까?`)) { return; }
      try {
        for (const r of dRows) { await foApi.delete(`api/base/sy/zz-sample1/${r.categoryId}`); }
        for (const r of uRows) { await foApi.put(`api/base/sy/zz-sample1/${r.categoryId}`, toPayload(r)); }
        for (const r of iRows) { await foApi.post('api/base/sy/zz-sample1', toPayload(r)); }
        showToast(`${parts.join(', ')} 저장되었습니다.`);
        await handleSearchList();
      } catch (e) {
        showToast('저장 실패: ' + (e.response?.data?.message || e.message || e), 'error');
      }
    };









    /* onReorder — 정렬 변경 알림 */
    const onReorder = () => showToast('정렬이 변경되었습니다.');

    /* onRowCancel — 행 취소 이벤트 */
    const onRowCancel = (row) => cancelRow(gridRows.indexOf(row));

    /* onRowDelete — 행 삭제 이벤트 */
    const onRowDelete = (row) => deleteRow(gridRows.indexOf(row));

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */





    /* FoSearchArea :columns 자동 렌더 정의 */
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'categoryNm', label: '카테고리명' },
          { value: 'parentNm',   label: '상위명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '140px' },
      { key: 'searchValue', type: 'text',   label: '검색어', placeholder: '검색어 입력', width: '200px' },
      { key: 'useYn',       type: 'select', label: '사용여부', options: () => codes.use_yn_opts, nullLabel: '사용여부 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'categoryNm', label: '카테고리명', edit: 'text' },
      { key: 'parentNm',   label: '상위카테고리', edit: 'text', width: '120px' },
      { key: 'depth',      label: '뎁스',   edit: 'number', width: '60px', align: 'center' },
      { key: 'sortOrd',    label: '정렬순서', edit: 'number', width: '70px', align: 'center' },
      { key: 'useYn',      label: '사용',   edit: 'select', width: '80px', align: 'center',
        options: codes.use_yn_opts },
      { key: 'regDate',    label: '등록일', width: '100px', align: 'center' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, toast, searchParam, gridRows,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, // dispatch
    };
  },
  template: /* html */`
<fo-page bare>
<div style="padding:clamp(12px,3vw,24px);">
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="toast.show" style="position:fixed;top:20px;right:20px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);pointer-events:none;"
    :style="toast.type==='error'?'background:#fee2e2;color:#991b1b;':toast.type==='info'?'background:#dbeafe;color:#1e40af;':'background:#d1fae5;color:#065f46;'">
    {{ toast.msg }}
  </div>
  <!-- ===== □. 조건부 영역 ================================================== -->
  <!-- ===== ■. 헤더 영역 =================================================== -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    08. 카테고리 관리
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">
      CRUD Grid 예제
    </span>
  </div>
  <!-- ===== □. 헤더 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <fo-search-area :columns="columns.baseSearch" :param="searchParam"
      @search="handleBtnAction('search-search')" @reset="handleBtnAction('search-reset')" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 목록 영역 =================================================== -->
  <fo-grid-crud
    list-title="카테고리 목록" row-key="categoryId"
    :columns="columns.baseGrid" :rows="gridRows"
    v-model:checkAll="uiState.checkAll"
    v-model:focusedIdx="uiState.focusedIdx"
    @add="handleBtnAction('categories-add')" @save="handleBtnAction('categories-save')"
    @delete-checked="handleBtnAction('categories-deleteChecked')" @cancel-checked="handleBtnAction('categories-cancelChecked')"
    @reorder="handleBtnAction('categories-reorder')" @cell-change="handleSelectAction('categories-rowCellChange', $event)">
    <template #row-actions="{ row }">
      <fo-row-cancel-delete :row="row" @cancel="handleSelectAction('categories-rowCancel', row)" @delete="handleSelectAction('categories-rowDelete', row)" />
    </template>
  </fo-grid-crud>
</div>
<!-- ===== □. 목록 영역 =================================================== -->
</fo-page>
`,
};
