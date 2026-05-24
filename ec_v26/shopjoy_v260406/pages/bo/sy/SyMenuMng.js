/* ShopJoy Admin - 메뉴관리 (Tree CRUD 그리드) */
window.SyMenuMng = {
  name: 'SyMenuMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const menus = reactive([]);
    const uiState = reactive({ checkAll: false, loading: false, error: null, isPageCodeLoad: false, selectedTreeId: null, focusedIdx: null});
    const codes = reactive({ menu_type: [], menu_status: [], use_yn: [], menu_types: ['페이지','폴더','외부링크','구분선'] });

    // onMounted에서 API 로드

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await boApiSvc.syMenu.getPage({ pageNo: 1, pageSize: 10000 }, '메뉴관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        menus.splice(0, menus.length, ...list);
        gridRows.splice(0);
        buildTreeRows(list).forEach(m => gridRows.push(makeRow(m)));
        uiState.error = null;
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* _initSearchParam — 초기화 */
    const _initSearchParam = () => {

      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* selectNode — 노드 선택 */
    const selectNode = (id) => { uiState.selectedTreeId = id; handleSearchList(); };

    /* fnLoadCodes — 공통코드 로드 */

    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.menu_type = codeStore.sgGetGrpCodes('MENU_TYPE');
      codes.menu_status = codeStore.sgGetGrpCodes('MENU_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList('DEFAULT');
    });

    const cfAllowedTreeIds = computed(() => {
      if (uiState.selectedTreeId == null) { return null; }
      return coUtil.cofCollectDescendantIds(menus, 'menuId', 'parentMenuId', uiState.selectedTreeId);
    });

    /* -- CRUD 그리드 -- */
    const gridRows   = reactive([]);
    let   _tempId    = -1;

    const EDIT_FIELDS = ['menuCode', 'menuNm', 'parentMenuId', 'menuUrl', 'menuTypeCd', 'sortOrd', 'useYn', 'menuRemark'];

    /* buildTreeRows — 빌드 */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(m => { map[m.menuId] = { ...m, _children: [] }; });
      const roots = [];
      items.forEach(m => {
        if (m.parentMenuId && map[m.parentMenuId]) { map[m.parentMenuId]._children.push(map[m.menuId]); }
        else { roots.push(map[m.menuId]); }
      });
      const result = [];

      /* traverse — traverse */
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth });
        node._children.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => traverse(c, depth + 1));
      };
      roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(r => traverse(r, 0));
      return result;
    };

    /* makeRow — 행 생성 */
    const makeRow = (m) => ({
      ...m, _depth: m._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { menuCode: m.menuCode, menuNm: m.menuNm, parentMenuId: m.parentMenuId,
               menuUrl: m.menuUrl, menuTypeCd: m.menuTypeCd, sortOrd: m.sortOrd, useYn: m.useYn, menuRemark: m.menuRemark },
    });

    /* onSearch — 조회 */
    const onSearch = async () => {
      await handleSearchList('DEFAULT');
    };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, _initSearchParam());
      handleSearchList();
    };

    /* setFocused — 포커스 설정 */
    const setFocused = (realIdx) => { uiState.focusedIdx = realIdx; };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        menuId: _tempId--, menuCode: '', menuNm: '', parentMenuId: ref ? ref.parentMenuId : null,
        menuUrl: '', menuTypeCd: ref ? ref.menuTypeCd : '페이지',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', menuRemark: '',
        _depth: ref ? ref._depth : 0, _row_status: 'I', _row_check: false, _row_org: null,
      };
      const insertAt = uiState.focusedIdx !== null ? uiState.focusedIdx + 1 : gridRows.length;
      gridRows.splice(insertAt, 0, newRow);
      uiState.focusedIdx = insertAt;
    };

    /* deleteRow — 행 삭제 */
    const deleteRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0)); }
      } else { row._row_status = 'D'; }
    };

    /* cancelRow — 행 취소 */
    const cancelRow = (realIdx) => {
      const row = gridRows[realIdx];
      if (row._row_status === 'I') {
        gridRows.splice(realIdx, 1);
        if (uiState.focusedIdx !== null) { uiState.focusedIdx = Math.max(0, uiState.focusedIdx - (uiState.focusedIdx >= realIdx ? 1 : 0)); }
      } else {
        if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
        row._row_status = 'N';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.menuId));
      if (!checkedIds.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.menuId)) { continue; }
        if (row._row_status === 'I') { gridRows.splice(i, 1); }
        else if (row._row_status !== 'N') {
          if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); }
          row._row_status = 'N';
        }
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

    /* handleSave — 저장 */
    const handleSave = async () => {
      const iRows = gridRows.filter(r => r._row_status === 'I');
      const uRows = gridRows.filter(r => r._row_status === 'U');
      const dRows = gridRows.filter(r => r._row_status === 'D');
      if (!iRows.length && !uRows.length && !dRows.length) { showToast('변경된 데이터가 없습니다.', 'error'); return; }
      for (const r of [...iRows, ...uRows]) {
        if (!r.menuCode || !r.menuNm) { showToast('메뉴코드와 메뉴명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syMenu.saveList(saveRows, '메뉴관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* toggleCheckAll — 전체 체크 토글 */
    const toggleCheckAll = () => { gridRows.forEach(r => { r._row_check = uiState.checkAll; }); };

    /* parentNm — 상위 Nm */
    const parentNm = (parentId) => {
      if (!parentId) { return ''; }
      const p = menus.find(m => m.menuId === parentId);
      return p ? p.menuNm : `ID:${parentId}`;
    };

    const menuTreeModal = reactive({ show: false, targetRow: null });

    /* openParentModal — 열기 */
    const openParentModal = async (row) => { menuTreeModal.targetRow = row; await handleSearchList('DEFAULT'); menuTreeModal.show = true; };

    /* onParentSelect — 이벤트 */
    const onParentSelect  = (menu) => {
      if (menuTreeModal.targetRow) { menuTreeModal.targetRow.parentMenuId = menu.menuId; menuTreeModal.targetRow._depth = 0; onCellChange(menuTreeModal.targetRow); }
      menuTreeModal.show = false;
    };

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* depthBullet — 깊이 글머리 */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* depthColor — 깊이 색상 */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* fnStatusClass — 상태 배지 클래스 */
    const fnStatusClass = s => ({ N: 'badge-gray', I: 'badge-blue', U: 'badge-orange', D: 'badge-red' }[s] || 'badge-gray');

    /* fnTypeClass — 유틸 */
    const fnTypeClass   = t => ({ '페이지': 'badge-blue', '폴더': 'badge-gray', '외부링크': 'badge-green', '구분선': 'badge-orange' }[t] || 'badge-gray');

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'menuId'},{label:'메뉴코드',key:'menuCode'},{label:'메뉴명',key:'menuNm'},{label:'상위ID',key:'parentMenuId'},{label:'URL',key:'menuUrl'},{label:'유형',key:'menuTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'menuRemark'}],
      '메뉴목록.csv'
    );

    /* BoGridCrud 컬럼 정의 (특수셀은 cell/head 슬롯으로 override) */

        // --- [컬럼 정의] ---

        const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'menuCode', label: '메뉴코드' },
          { value: 'menuNm',   label: '메뉴명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => codes.menu_types, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    const baseGridColumns = [
      { key: 'menuCode',   label: '메뉴코드', style: 'width:110px;',    edit: 'text', mono: true },
      { key: 'menuNm',     label: '메뉴명',   style: 'min-width:180px;', edit: 'text',
        treeDepth: true, treeBullet: depthBullet, treeColor: depthColor },
      { key: 'parentMenuId', label: '상위메뉴', style: 'min-width:140px;',
        parentPick: { label: parentNm, open: openParentModal, title: '상위메뉴 선택' } },
      { key: 'menuUrl',    label: '메뉴URL',  style: 'min-width:160px;', edit: 'text', placeholder: '/path' },
      { key: 'menuTypeCd', label: '유형',     style: 'width:80px;',     edit: 'select', options: codes.menu_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',      label: '사용여부', cls: 'col-use',  edit: 'select', options: codes.use_yn },
      { key: 'menuRemark', label: '비고',     edit: 'text' },
      { key: 'siteNm',     label: '사이트명', style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    // ===== return (템플릿 노출) ===============================================

    return { menus, uiState, codes, selectNode,
      searchParam,
      cfSiteNm, baseSearchColumns, baseGridColumns,
      gridRows,
      setFocused, onSearch, onReset, onCellChange,
      addRow, deleteRow, cancelRow, cancelChecked, deleteRows, handleSave,
      toggleCheckAll, parentNm,
      menuTreeModal, openParentModal, onParentSelect,
      depthBullet, depthColor, fnStatusClass, fnTypeClass,
      exportExcel,
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">메뉴관리</div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="onSearch" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 경로 트리 ================================================= -->
    <bo-path-tree-card biz-cd="sy_menu" title="메뉴" :show-biz-cd="true"
      :selected="uiState.selectedTreeId" @select="selectNode" />
    <div>
      <!-- ===== ■.■.■. CRUD 그리드 ============================================ -->
      <bo-grid-crud
        :columns="baseGridColumns" :rows="gridRows" row-key="menuId"
        list-title="메뉴목록" :show-export="true" :draggable="false"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="addRow" @save="handleSave"
        @delete-checked="deleteRows" @cancel-checked="cancelChecked"
        @cell-change="onCellChange" @export="exportExcel">
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row" @cancel="cancelRow(idx)" @delete="deleteRow(idx)" />
        </template>
      </bo-grid-crud>
      <menu-tree-modal
        v-if="menuTreeModal && menuTreeModal.show" :exclude-id="menuTreeModal.targetRow && menuTreeModal.targetRow.menuId > 0 ? menuTreeModal.targetRow.menuId : null"
        @select="onParentSelect"
        @close="menuTreeModal.show=false" />
    </div>
  </div>
</div>

    <!-- ===== □.□. 경로 트리 ================================================= -->
  <!-- ===== □. 본문 영역 =================================================== -->`,
};
