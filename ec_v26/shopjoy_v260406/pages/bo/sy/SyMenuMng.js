/* ShopJoy Admin - 메뉴관리 (Tree CRUD 그리드) */
window.SyMenuMng = {
  name: 'SyMenuMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const menus = reactive([]);                    // 메뉴 목록 데이터
    const menuCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)
    const uiState = reactive({                     // UI 상태
      checkAll: false, loading: false, error: null, isPageCodeLoad: false,
      selectedTreeId: null, focusedIdx: null,
    });
    const codes = reactive({ menu_type: [], menu_status: [], use_yn: [], menu_types: ['페이지','폴더','외부링크','구분선'] });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyMenuMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        return handleSearchList();
      // 메뉴 그리드 행 추가
      } else if (cmd === 'menus-add') {
        return addRow();
      // 메뉴 그리드 저장
      } else if (cmd === 'menus-save') {
        return handleSave();
      // 체크된 메뉴 일괄 삭제
      } else if (cmd === 'menus-deleteChecked') {
        return deleteRows();
      // 체크된 메뉴 일괄 취소
      } else if (cmd === 'menus-cancelChecked') {
        return cancelChecked();
      // 메뉴 목록 엑셀 내보내기
      } else if (cmd === 'menus-excel') {
        return exportExcel();
      // 상위메뉴 선택 모달 닫기
      } else if (cmd === 'parentModal-close') {
        parentModal.show = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyMenuMng.js : handleSelectAction -> ', cmd, param);
      // 메뉴 그리드 행 삭제 마킹
      if (cmd === 'menus-rowDelete') {
        return deleteRow(param);
      // 메뉴 그리드 행 변경 취소
      } else if (cmd === 'menus-rowCancel') {
        return cancelRow(param);
      // 좌측 경로 트리 노드 선택 → 우측 그리드 필터링 (선택행 강조 해제 후 재조회)
      } else if (cmd === 'pathTree-select') {
        uiState.selectedTreeId = param;
        uiState.focusedIdx = null;        // 트리(부모) 변경 시 자식 선택행 강조 해제 (재조회로 행 인덱스 무효화 방지)
        uiState.checkAll = false;         // 자식 전체체크 해제 (부모 변경 시 정책)
        return handleSearchList();
      // 상위메뉴 선택 모달 열기 (parentPick 컬럼)
      } else if (cmd === 'parentModal-open') {
        return openParentModal(param);
      // 상위메뉴 모달에서 상위 선택 → 행 parentMenuId 갱신
      } else if (cmd === 'parentModal-select') {
        if (parentModal.targetRow) {
          parentModal.targetRow.parentMenuId = param.menuId;
          parentModal.targetRow._depth = 0;
          onCellChange(parentModal.targetRow);
        }
        parentModal.show = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'menus-cellChange') {
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyMenuMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'parent-menu') {
        if (result == null) {
          parentModal.show = false;
          return;
        }
        if (parentModal.targetRow) {
          parentModal.targetRow.parentMenuId = result.menuId;
          parentModal.targetRow._depth = 0;
          onCellChange(parentModal.targetRow);
        }
        parentModal.show = false;
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== CRUD 그리드 ===== */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const EDIT_FIELDS = ['menuCode', 'menuNm', 'parentMenuId', 'menuUrl', 'menuTypeCd', 'sortOrd', 'useYn', 'menuRemark'];

    /* ===== 깊이 표시 상수 ===== */
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* depthBullet — 깊이 글머리 */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* depthColor — 깊이 색상 */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* ===== 상위메뉴 선택 모달 ===== */
    const parentModal = reactive({ show: false, targetRow: null });

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (검색조건 동기, 백엔드 재귀 CTE) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const params = Object.fromEntries(Object.entries(searchParam)
          .filter(([k, v]) => v !== '' && v !== null && v !== undefined && k !== 'pathId'));
        const res = await boApiSvc.syMenu.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(menuCounts).forEach(k => { delete menuCounts[k]; });

        for (const r of rows) { if (r && r.menuId != null) menuCounts[r.menuId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: 1, pageSize: 10000,
          /* 좌측 트리 선택 노드 — 서버측 자기참조 재귀 CTE(findTreeMenuIds)로 자손 메뉴 포함 필터 */
          ...(uiState.selectedTreeId != null ? { menuId: uiState.selectedTreeId } : {}),
        };
        const res = await boApiSvc.syMenu.getPage(params, '메뉴관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        menus.splice(0, menus.length, ...list);
        gridRows.splice(0);
        buildTreeRows(list).forEach(m => gridRows.push(makeRow(m)));
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

    /* buildTreeRows — 그리드용 트리 행 빌드 (서버에서 필터된 list 받아 평탄화만) */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(m => { map[m.menuId] = { ...m, _children: [] }; });
      const roots = [];
      items.forEach(m => {
        if (m.parentMenuId && map[m.parentMenuId]) { map[m.parentMenuId]._children.push(map[m.menuId]); }
        else { roots.push(map[m.menuId]); }
      });
      const result = [];
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
        await boApiSvc.syMenu.saveList('base', saveRows, '메뉴관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* openParentModal — 상위메뉴 선택 모달 열기 */
    const openParentModal = async (row) => { parentModal.targetRow = row; await handleSearchList('DEFAULT'); parentModal.show = true; };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'menuId'},{label:'메뉴코드',key:'menuCode'},{label:'메뉴명',key:'menuNm'},{label:'상위ID',key:'parentMenuId'},{label:'URL',key:'menuUrl'},{label:'유형',key:'menuTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'menuRemark'}],
      '메뉴목록.csv'
    );

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* parentNm — 상위 메뉴명 */
    const parentNm = (parentId) => {
      if (!parentId) { return ''; }
      const p = menus.find(m => m.menuId === parentId);
      return p ? p.menuNm : `ID:${parentId}`;
    };

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
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

    // 기본 그리드
    columns.baseGrid = [
      { key: 'menuCode',   label: '메뉴코드', style: 'width:110px;',    edit: 'text', mono: true },
      { key: 'menuNm',     label: '메뉴명',   style: 'min-width:180px;', edit: 'text',
        treeDepth: true, treeBullet: depthBullet, treeColor: depthColor },
      { key: 'parentMenuId', label: '상위메뉴', style: 'min-width:140px;',
        parentPick: { label: parentNm, open: (row) => handleSelectAction('parentModal-open', row),
          clear: (row) => { row.parentMenuId = null; row._depth = 0; onCellChange(row); }, title: '상위메뉴 선택' } },
      { key: 'menuUrl',    label: '메뉴URL',  style: 'min-width:160px;', edit: 'text', placeholder: '/path' },
      { key: 'menuTypeCd', label: '유형',     style: 'width:80px;',     edit: 'select', options: () => codes.menu_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',      label: '사용여부', cls: 'col-use',  edit: 'select', options: () => codes.use_yn },
      { key: 'menuRemark', label: '비고',     edit: 'text' },
      { key: 'siteNm',     label: '사이트명', style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      menus, uiState, menuCounts, searchParam, gridRows, parentModal,       // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                               // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<bo-page title="메뉴관리">
  <!-- ===== ■. 검색 영역 =================================================== -->
  <bo-container>
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== ■. 본문 영역 (트리 + 그리드) ================================== -->
  <div class="bo-2col">
    <!-- ===== ■.■. 메뉴 트리 (sy_menu 자기참조) ============================== -->
    <bo-container bare>
      <bo-menu-tree-card title="메뉴" :counts="menuCounts"
        :selected="uiState.selectedTreeId"
        @select="path => handleSelectAction('pathTree-select', path)" />
    </bo-container>
    <!-- ===== ■.■. CRUD 그리드 ============================================== -->
    <bo-container bare>
      <bo-grid-crud
        :columns="columns.baseGrid" :rows="gridRows" row-key="menuId"
        list-title="메뉴목록" :show-export="true" :draggable="false"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="handleBtnAction('menus-add')" @save="handleBtnAction('menus-save')"
        @delete-checked="handleBtnAction('menus-deleteChecked')" @cancel-checked="handleBtnAction('menus-cancelChecked')"
        grid-id="menus-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)"
        @export="handleBtnAction('menus-excel')">
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row"
            @cancel="handleSelectAction('menus-rowCancel', idx)"
            @delete="handleSelectAction('menus-rowDelete', idx)" />
        </template>
      </bo-grid-crud>
      <!-- ===== ■.■.■. 상위메뉴 선택 모달 ========================================= -->
      <menu-tree-modal v-if="parentModal && parentModal.show" :exclude-id="parentModal.targetRow && parentModal.targetRow.menuId > 0 ? parentModal.targetRow.menuId : null" modal-name="parent-menu" :on-callback="fnCallbackModal" />
    </bo-container>
  </div>
</bo-page>
`,
};
