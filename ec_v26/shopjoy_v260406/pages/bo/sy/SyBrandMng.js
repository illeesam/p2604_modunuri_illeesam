/* ShopJoy Admin - 브랜드관리 (CRUD 그리드) */
window.SyBrandMng = {
  name: 'SyBrandMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const brands = reactive([]);
    const uiState = reactive({ checkAll: false, dragMoved: false, loading: false, error: null, isPageCodeLoad: false, selectedPath: null, focusedIdx: null, dragSrc: null});
    const codes = reactive({ brand_status: [], use_yn: [], date_range_opts: [] });

    // 현재 환경이 local인지 확인
    const cfIsLocalMode = computed(() => {
      try {
        const appStore = window.useBoAppStore?.();
        return appStore?.active === 'local';
      } catch (_) {
        return false;
      }
    });

    // onMounted에서 API 로드
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          ...(uiState.selectedPath != null ? { pathId: uiState.selectedPath } : {}),
          ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
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

    /* 표시경로 선택 → bo-path-pick-field 컴포넌트 내장. 변경 추적만 보존 */
    const onPathChange = (row) => { if (row && row._row_status === 'N') row._row_status = 'U'; };


    /* 트리 선택 path (loadGrid 보다 먼저 선언) */
    
    /* -- 검색 -- */
    const _initSearchParam = () => {
      const today = new Date();
      const thisYear = today.getFullYear();
      return { searchType: '', searchValue: '', bizCd: '', useYn: 'Y', dateRange: '', dateStart: `${thisYear - 3}-01-01`, dateEnd: `${thisYear}-12-31` };
    };
    const searchParam = reactive(_initSearchParam());

    /* 브랜드 handleDateRangeChange */
    const handleDateRangeChange = () => {
      if (searchParam.dateRange) {
        const r = boUtil.bofGetDateRange(searchParam.dateRange);
        searchParam.dateStart = r ? r.from : '';
        searchParam.dateEnd = r ? r.to : '';
      }
    };

    /* -- CRUD 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    

    const EDIT_FIELDS = ['brandCode', 'brandNm', 'brandEnNm', 'pathId', 'logoUrl', 'sortOrd', 'useYn', 'brandRemark'];

    /* 브랜드 fnLoadCodes */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.brand_status = codeStore.sgGetGrpCodes('BRAND_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      codes.date_range_opts = codeStore.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);


    /* 브랜드 makeRow */
    const makeRow = (b) => ({
      ...b,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = b[f]; return acc; }, {}),
    });


    /* 브랜드 목록조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* 브랜드 onReset */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    /* 브랜드 setFocused */
    const setFocused = (idx) => { uiState.focusedIdx = idx; };

    /* 브랜드 onCellChange */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* 브랜드 addRow */
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

    /* 브랜드 deleteRow */
    const deleteRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        row._row_status = 'D';
      }
    };

    /* 브랜드 cancelRow */
    const cancelRow = (idx) => {
      const row = gridRows[idx];
      if (row._row_status === 'I') {
        gridRows.splice(idx, 1);
        if (uiState.focusedIdx !== null) uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= idx ? 1 : 0));
      } else {
        if (row._row_org) EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; });
        row._row_status = 'N';
      }
    };

    /* 브랜드 cancelChecked */
    const cancelChecked = () => {
      const ids = new Set(gridRows.filter(r => r._row_check).map(r => r.brandId));
      if (!ids.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!ids.has(row.brandId)) continue;
        if (row._row_status === 'N') continue;
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* 브랜드 deleteRows */
    const deleteRows = () => {
      for (let i = gridRows.length - 1; i >= 0; i--) {
        if (!gridRows[i]._row_check) continue;
        if (gridRows[i]._row_status === 'I') gridRows.splice(i, 1);
        else gridRows[i]._row_status = 'D';
      }
    };

    /* 브랜드 저장 */
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
      if (iRows.length) details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' });
      if (uRows.length) details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' });
      if (dRows.length) details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' });
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?',
        { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) return;
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syBrand.saveList(saveRows, '브랜드관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* -- 드래그 -- */
    const dragSrc   = ref(null);

    /* 브랜드 onDragStart */
    const onDragStart = (idx) => { uiState.dragSrc = idx; uiState.dragMoved = false; };

    /* 브랜드 onDragOver */
    const onDragOver  = (e, idx) => {
      e.preventDefault();
      if (uiState.dragSrc === null || uiState.dragSrc === idx) return;
      const moved = gridRows.splice(uiState.dragSrc, 1)[0];
      gridRows.splice(idx, 0, moved);
      uiState.dragSrc = idx;
      uiState.dragMoved = true;
    };

    /* 브랜드 onDragEnd */
    const onDragEnd = () => {
      if (uiState.dragMoved) showToast('정렬정보가 저장되었습니다.');
      uiState.dragSrc = null; uiState.dragMoved = false;
    };

    /* -- 전체 체크 -- */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* 브랜드 fnStatusClass */
    const fnStatusClass  = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');
;

    /* 브랜드 exportExcel */
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

    /* 브랜드 onPathSelect */
    const onPathSelect = (pathId) => { uiState.selectedPath = pathId; handleSearchList(); };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });


    // -- return ---------------------------------------------------------------

    /* BoGridCrud 호환 — 컬럼 정의 + local 모드 컬럼 hint */
    const baseSearchColumns = [
      { type: 'label', label: '업무코드' },
      { key: 'bizCd', type: 'text', placeholder: 'biz_cd 검색', width: '160px' },
      { key: 'searchType', type: 'multiCheck',
        options: [
          { value: 'brandCode', label: '브랜드코드' },
          { value: 'brandNm',   label: '브랜드명' },
          { value: 'brandEnNm', label: '영문명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', placeholder: '검색어 입력' },
      { key: 'useYn', type: 'select', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
      { type: 'label', label: '등록일' },
      { key: 'dateRange', type: 'dateRange',
        startKey: 'dateStart', endKey: 'dateEnd',
        rangeOptions: () => codes.date_range_opts,
        onRangeChange: () => handleDateRangeChange() },
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
    const fnColTitle = (col) => cfIsLocalMode.value ? col.label : '';

    return { brands, uiState, codes, onPathChange,
      searchParam, handleDateRangeChange,
      gridRows, baseSearchColumns, baseGridColumns, fnColTitle,
      setFocused, onSearch, onReset, onCellChange, cfIsLocalMode,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      onDragStart, onDragOver, onDragEnd,
      uiState, toggleCheckAll, fnStatusClass, exportExcel, onPathSelect,
    };
  },
  template: /* html */`
<div>
  <div class="page-title">브랜드관리</div>

  <!-- -- 검색 ------------------------------------------------------------- -->
  <div class="card">
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>

  <!-- -- 좌 트리 + 우 그리드 --------------------------------------------------- -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <bo-path-tree-card biz-cd="sy_brand" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="onPathSelect" />

  <!-- -- CRUD 그리드 ------------------------------------------------------- -->
  <bo-grid-crud
    :columns="baseGridColumns" :rows="gridRows" row-key="brandId"
    list-title="브랜드목록" :show-export="true"
    v-model:focusedIdx="uiState.focusedIdx"
    v-model:checkAll="uiState.checkAll"
    :cell-title="fnColTitle"
    @add="addRow" @save="handleSave"
    @delete-checked="deleteRows" @cancel-checked="cancelChecked"
    @cell-change="onCellChange" @export="exportExcel">


    <template #cell-logoUrl="{ row }">
      <td>
        <div style="display:flex;align-items:center;gap:4px;">
          <input class="grid-input grid-mono" v-model="row.logoUrl"
            :disabled="row._row_status==='D'" @input="onCellChange(row)"
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
      <bo-row-cancel-delete :row="row" @cancel="cancelRow(idx)" @delete="deleteRow(idx)" />
    </template>
  </bo-grid-crud>
  </div><!-- -- /grid 25/75 ------------------------------------------------------ -->
</div>
`,
};

/* PathTreeNode, PathParentSelector, BrandPathTreeNode → components/comp/BoComp.js */
