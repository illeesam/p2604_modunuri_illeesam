/* ShopJoy Admin - 브랜드관리 (CRUD 그리드) */
window.SyBrandMng = {
  name: 'SyBrandMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const showRefModal = window.boApp.showRefModal; // 참조 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const brands  = reactive([]);                  // 브랜드 목록 (원본)
    const uiState = reactive({ checkAll: false, dragMoved: false, loading: false, error: null, isPageCodeLoad: false, selectedPath: null, focusedIdx: null, dragSrc: null });
    const codes   = reactive({ brand_status: [], use_yn: [], date_range_opts: [] });

    // 현재 환경이 local인지 확인
    const cfIsLocalMode = computed(() => {
      try {
        const appStore = window.useBoAppStore?.();
        return appStore?.active === 'local';
      } catch (_) {
        return false;
      }
    });

    /* _initSearchParam — 초기화 */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyBrandMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        return handleSearchList();
      // 기간 옵션 변경
      } else if (cmd === 'searchParam-date-range') {
        if (searchParam.dateRange) {
          const r = boUtil.bofGetDateRange(searchParam.dateRange);
          searchParam.dateStart = r ? r.from : '';
          searchParam.dateEnd = r ? r.to : '';
        }
        return;
      // 브랜드 그리드 행 추가
      } else if (cmd === 'brands-add') {
        return addRow();
      // 브랜드 그리드 저장
      } else if (cmd === 'brands-save') {
        return handleSave();
      // 체크된 행 일괄 삭제 마킹
      } else if (cmd === 'brands-delete-checked') {
        return deleteRows();
      // 체크된 행 일괄 취소
      } else if (cmd === 'brands-cancel-checked') {
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
      console.log(' ■■ SyBrandMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 경로 트리 노드 선택 → 그리드 재조회
      if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        return handleSearchList();
      // 그리드 셀 변경 감지
      } else if (cmd === 'brands-cell-change') {
        return onCellChange(param);
      // 그리드 행 취소
      } else if (cmd === 'brands-row-cancel') {
        return cancelRow(param);
      // 그리드 행 삭제 마킹
      } else if (cmd === 'brands-row-delete') {
        return deleteRow(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', bizCd: '', useYn: 'Y', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건

    const gridRows    = reactive([]);              // CRUD 그리드 행
    let   _tempId     = -1;                        // 신규 행 임시 ID
    const EDIT_FIELDS = ['brandCode', 'brandNm', 'brandEnNm', 'pathId', 'logoUrl', 'sortOrd', 'useYn', 'brandRemark'];
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
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
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.brand_status = codeStore.sgGetGrpCodes('BRAND_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

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
        await boApiSvc.syBrand.saveList(saveRows, '브랜드관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [
        { label: 'ID',       key: 'brandId' },
        { label: '표시경로',   key: 'pathId' },
        { label: '브랜드코드', key: 'brandCode' },
        { label: '브랜드명',  key: 'brandNm' },
        { label: '영문명',    key: 'brandEnNm' },
        { label: '로고URL',   key: 'logoUrl' },
        { label: '순서',      key: 'sortOrd' },
        { label: '사용여부',  key: 'useYn' },
        { label: '비고',      key: 'brandRemark' },
      ],
      '브랜드목록.csv'
    );

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    // ===== 사용자 함수 (헬퍼 / 컬럼 정의) ====================================

    /* fnColTitle — 컬럼 타이틀 (local 모드만 표시) */
    const fnColTitle = (col) => cfIsLocalMode.value ? col.label : '';

    const baseSearchColumns = [
      { key: 'bizCd', type: 'text', label: '업무코드', placeholder: 'biz_cd 검색', width: '160px' },
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
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleBtnAction('searchParam-date-range') },
    ];

    const baseGridColumns = [
      { key: 'pathId',      label: '표시경로 (예: aa.bb.cc)', style: 'min-width:140px;', pathPick: 'sy_brand' },
      { key: 'brandCode',   label: '브랜드코드', style: 'min-width:110px;', edit: 'text', mono: true, placeholder: 'BRAND_CODE' },
      { key: 'brandNm',     label: '브랜드명',  style: 'min-width:130px;', edit: 'text', placeholder: '브랜드명' },
      { key: 'brandEnNm',   label: '영문명',    style: 'min-width:130px;', edit: 'text', placeholder: 'Brand Name' },
      { key: 'logoUrl',     label: '로고 URL',  style: 'min-width:200px;' },
      { key: 'sortOrd',     label: '순서',      cls: 'col-ord', edit: 'number' },
      { key: 'useYn',       label: '사용여부',  cls: 'col-use', edit: 'select', options: codes.use_yn },
    ];

    // ===== return (템플릿 노출) ===============================================

    return {
      brands, uiState, codes, searchParam, gridRows,                  // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                             // 컬럼 정의
      handleBtnAction, handleSelectAction,                            // dispatch (모든 이벤트 / 액션 라우팅)
      cfIsLocalMode,                                                  // computed
      fnColTitle,                                                     // 헬퍼
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    브랜드관리
  </div>
  <!-- ===== ■. 검색 ====================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_brand" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    <!-- ===== ■.■. CRUD 그리드 ============================================== -->
    <bo-grid-crud
      :columns="baseGridColumns" :rows="gridRows" row-key="brandId"
      list-title="브랜드목록" :show-export="true"
      v-model:focusedIdx="uiState.focusedIdx"
      v-model:checkAll="uiState.checkAll"
      :cell-title="fnColTitle"
      @add="handleBtnAction('brands-add')" @save="handleBtnAction('brands-save')"
      @delete-checked="handleBtnAction('brands-delete-checked')" @cancel-checked="handleBtnAction('brands-cancel-checked')"
      @cell-change="row => handleSelectAction('brands-cell-change', row)" @export="handleBtnAction('brands-excel')">
      <template #cell-logoUrl="{ row }">
        <td>
          <div style="display:flex;align-items:center;gap:4px;">
            <input class="grid-input grid-mono" v-model="row.logoUrl"
              :disabled="row._row_status==='D'" @input="handleSelectAction('brands-cell-change', row)"
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
        <bo-row-cancel-delete :row="row" @cancel="handleSelectAction('brands-row-cancel', idx)" @delete="handleSelectAction('brands-row-delete', idx)" />
      </template>
    </bo-grid-crud>
  </div>
  <!-- ===== □.□. CRUD 그리드 ============================================== -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
</div>
`,
};

/* PathTreeNode, PathParentSelector, BrandPathTreeNode → components/comp/BoComp.js */
