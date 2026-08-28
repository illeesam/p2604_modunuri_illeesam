/* ShopJoy Admin - 브랜드관리 (CRUD 그리드) */
export default {
  name: 'bo-sy-ba-syBrandMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const brands  = reactive([]);                  // 브랜드 목록 (원본)
    const brandCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({ checkAll: false, dragMoved: false, loading: false, error: null, selectedPath: null, focusedIdx: null, dragSrc: null });
    const codes   = reactive({ use_yn: [], date_range_opts: [] });

    // 현재 환경이 local인지 확인
    const cfIsLocalMode = computed(() => {
      try {
        const appStore = window.useBoAppStore?.();
        return appStore?.active === 'local';
      } catch (_) {
        return false;
      }
    });


    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoSyBaSyBrandMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, searchParamInit);
        uiState.selectedPath = null;          // 표시경로 트리 전체로 복귀
        uiState.focusedIdx = null;            // 선택(포커스) 행 정보 초기화 → 파란 외곽선 해제
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-dateRange') {
        boUtil.bofApplyDateRange(searchParam);
        return;
      // 브랜드 그리드 행 추가
      } else if (cmd === 'brands-add') {
        return addRow();
      // 브랜드 그리드 저장
      } else if (cmd === 'brands-save') {
        return handleSave();
      // 체크된 행 일괄 삭제 마킹
      } else if (cmd === 'brands-deleteChecked') {
        return deleteRows();
      // 체크된 행 일괄 취소
      } else if (cmd === 'brands-cancelChecked') {
        return cancelChecked();
      // 엑셀 내보내기
      } else if (cmd === 'brands-excel') {
        return exportExcel();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoSyBaSyBrandMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 경로 트리 노드 선택 → 선택행 강조 해제 후 그리드 재조회
      if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        uiState.focusedIdx = null;            // 선택(포커스) 행 정보 초기화 → 파란 외곽선 해제
        return handleSearchList();
      } else if (cmd === 'brands-rowCancel') {
        return cancelRow(param);
      // 그리드 행 삭제 마킹
      } else if (cmd === 'brands-rowDelete') {
        return deleteRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 등) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'brands-cellChange') {
        return onCellChange(row);
      // 그리드 행 취소
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };

    const searchParam = reactive({ searchType: '', searchValue: '', useYn: '', dateRangeType: '', dateRange: '', dateRangeStart: '', dateRangeEnd: '' }); // 검색조건
    /* searchParamInit — [초기화] 기준값. initPage 끝에서 그때의 searchParam 을 복사해 둔다.
       리터럴 기본값이 아니라 '화면을 열었을 때의 상태'가 기준이라, initPage 가 채운
       기본 기간·사이트 값도 함께 복원된다. (재대입 금지 — Object.assign 으로만 갱신) */
    const searchParamInit = {};

    const gridRows    = reactive([]);              // CRUD 그리드 행
    let   _tempId     = -1;                        // 신규 행 임시 ID
    const EDIT_FIELDS = ['brandCode', 'brandNm', 'brandEnNm', 'pathId', 'logoUrl', 'sortOrd', 'useYn', 'brandRemark'];

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syBrand.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(brandCounts).forEach(k => { delete brandCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) brandCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...coUtil.cofOmitEmpty(searchParam),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'brandCode,brandNm,brandEnNm';
        }
        const res = await boApiSvc.syBrand.getPage(params, '브랜드관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        brands.splice(0, brands.length, ...list);
        gridRows.splice(0);
        list.forEach(b => gridRows.push(makeRow(b)));
        uiState.error = null;
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
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
      /* 필요한 코드그룹만 지연 로딩 — 캐시에 있으면 API 가 나가지 않는다 */
      await codeStore.saLoadCodes(['USE_YN', 'DATE_RANGE_OPT'], {compNm: 'bo-sy-ba-syBrandMng'});
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
    };

    /* makeRow — 행 생성 */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
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
        brandId: _tempId--, brandCode: '', brandNm: '', brandEnNm: '',
        pathId: uiState.selectedPath || 'fashion.misc',
        logoUrl: '', sortOrd: gridRows.length + 1, useYn: 'Y', brandRemark: '',
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
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.brandId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.brandId)) { continue; }
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

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) {
        showToast('변경된 데이터가 없습니다.', 'error'); return;
      }
      for (const r of [...iRows, ...uRows]) {
        if (!r.brandCode || !r.brandNm) {
          showToast('브랜드코드, 브랜드명은 필수 항목입니다.', 'error'); return;
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
        await boApiSvc.syBrand.saveList('base', saveRows, '브랜드관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(coUtil.cofErrMsg(err), 'error', 0);
      }
    };

    /* excelModal — 엑셀 다운로드 (공용 모달) */
    const excelModal = reactive({ show: false });
    const buildExcelParams = () => {
      const params = {
        ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
        ...coUtil.cofOmitEmpty(searchParam),
      };
      if (params.searchValue && !params.searchType) {
        params.searchType = 'brandCode,brandNm,brandEnNm';
      }
      return params;
    };
    const exportExcel = () => { excelModal.show = true; };

    // ★ onMounted
    /* initPage — 화면 로드 시퀀스.
       코드 응답을 받은 뒤 초기 조회를 시작한다 — 코드 기반 select·라벨·기본값이
       빈 상태로 첫 조회가 나가는 것을 막는다(순서가 코드에 드러나도록 한 곳에 모았다). */
    const initPage = async () => {
      /* 검색조건 초기값 (계산이 필요한 항목) */
      const today = new Date();
      const thisYear = today.getFullYear();
      Object.assign(searchParam, { useYn: 'Y', dateRangeType: 'reg_date', dateRangeStart: `${thisYear - 3}-01-01`, dateRangeEnd: `${thisYear}-12-31` });
      await fnLoadCodes();
      /* 공유된 링크(bo-page shareQuery)로 들어온 경우 URL 쿼리의 검색조건을 복원 */
      const _qs = new URLSearchParams(window.location.search);
      const _reserved = ['page','id','orderId','claimId','embed','dtlMode'];
      Object.keys(searchParam).forEach((k) => { if (!_reserved.includes(k) && _qs.has(k)) searchParam[k] = _qs.get(k); });
      await handleSearchList('DEFAULT');
      Object.assign(searchParamInit, searchParam);   // [초기화] 기준값 스냅샷
    };
    onMounted(initPage);

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* fnColTitle — 컬럼 타이틀 (local 모드만 표시) */
    const fnColTitle = (col) => cfIsLocalMode.value ? col.label : '';

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'brandCode', label: '브랜드코드' },
          { value: 'brandNm',   label: '브랜드명' },
          { value: 'brandEnNm', label: '영문명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
      { key: 'dateRange', type: 'dateRange', label: '등록일',
        startKey: 'dateRangeStart', endKey: 'dateRangeEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-dateRange') },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',      label: '표시경로 (예: aa.bb.cc)', style: 'width:170px;max-width:170px;', pathPick: 'sy_brand' },
      { key: 'brandCode',   label: '브랜드코드', style: 'min-width:110px;', edit: 'text', mono: true, placeholder: 'BRAND_CODE' },
      { key: 'brandNm',     label: '브랜드명',  style: 'min-width:130px;', edit: 'text', placeholder: '브랜드명' },
      { key: 'brandEnNm',   label: '영문명',    style: 'min-width:130px;', edit: 'text', placeholder: 'Brand Name' },
      { key: 'logoUrl',     label: '로고 URL',  style: 'min-width:200px;' },
      { key: 'sortOrd',     label: '순서',      cls: 'col-ord', edit: 'number' },
      { key: 'useYn',       label: '사용여부',  cls: 'col-use', edit: 'select', options: () => codes.use_yn },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      brands, uiState, brandCounts, searchParam, gridRows,       // 상태 / 데이터
      excelModal, buildExcelParams, // 엑셀 다운로드 모달
      handleBtnAction, handleSelectAction, handleGridCellAction,                            // dispatch (모든 이벤트 / 액션 라우팅)
      fnColTitle, // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="브랜드관리" :share-query="searchParam">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div class="bo-2col">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_brand" title="표시경로" :show-biz-cd="false" :counts="brandCounts"
      max-height="calc(100vh - 320px)"
      :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    <!-- ===== ■.■. CRUD 그리드 ============================================== -->
    <bo-container bare>
      <bo-grid-crud
        :columns="columns.baseGrid" :rows="gridRows" row-key="brandId"
        list-title="브랜드목록" :show-export="true" max-height="calc(100vh - 320px)"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        :cell-title="fnColTitle"
        @add="handleBtnAction('brands-add')" @save="handleBtnAction('brands-save')"
        @delete-checked="handleBtnAction('brands-deleteChecked')" @cancel-checked="handleBtnAction('brands-cancelChecked')"
        grid-id="brands-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)" @export="handleBtnAction('brands-excel')">
        <template #cell-logoUrl="{ row }">
          <td>
            <div style="display:flex;align-items:center;gap:4px;">
              <input class="grid-input grid-mono" v-model="row.logoUrl"
                :disabled="row._row_status==='D'" @input="handleGridCellAction('brands-cellChange', null, row)"
                placeholder="/images/brand/logo.png" style="flex:1;" :title="fnColTitle({label:'로고 URL'})" />
              <img v-if="row.logoUrl"
                :src="row.logoUrl"
                style="height:22px;max-width:44px;object-fit:contain;border-radius:3px;border:1px solid #e8e8e8;"
                @error="$event.target.style.display='none'"
                @load="$event.target.style.display=''" />
            </div>
          </td>
        </template>
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('brands-rowCancel', idx)" @delete="handleSelectAction('brands-rowDelete', idx)" />
        </template>
      </bo-grid-crud>
      <bo-excel-down-modal :show="excelModal.show" domain="brand" area-nm="브랜드"
        :columns="columns.baseGrid" ui-nm="브랜드관리" :params="buildExcelParams()"
        @close="excelModal.show = false" />
    </bo-container>
  </div>
  <!-- ===== □.□. CRUD 그리드 ============================================== -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
</bo-page>
`,
};

/* PathTreeNode, PathParentSelector, BrandPathTreeNode → components/comp/BoComp.js */
