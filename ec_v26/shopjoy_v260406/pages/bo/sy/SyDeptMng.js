/* ShopJoy Admin - 부서관리 (Tree CRUD 그리드) */
window.SyDeptMng = {
  name: 'SyDeptMng',
  props: {
    navigate:    { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const nextId = window.nextId || { value: (arr, key) => ((arr || []).reduce((mm, x) => Math.max(mm, Number(x?.[key]) || 0), 0) || 0) + 1 };
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const depts = reactive([]);                    // 부서 트리 데이터
    const uiState = reactive({                     // UI 상태
      checkAll: false, loading: false, error: null, isPageCodeLoad: false,
      selectedTreeId: null, focusedIdx: null,
    });
    const codes = reactive({ dept_status: [], use_yn: [], dept_types: ['경영','운영','기술','마케팅','CS','물류','재무','인사','법무','기타'] });

    /* ===== 검색조건 ===== */
    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyDeptMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return handleSearchList('DEFAULT');
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        return handleSearchList();
      // 부서 그리드 행 추가
      } else if (cmd === 'depts-add') {
        return addRow();
      // 부서 그리드 저장
      } else if (cmd === 'depts-save') {
        return handleSave();
      // 체크된 부서 일괄 삭제
      } else if (cmd === 'depts-deleteChecked') {
        return deleteRows();
      // 체크된 부서 일괄 취소
      } else if (cmd === 'depts-cancelChecked') {
        return cancelChecked();
      // 부서 목록 엑셀 내보내기
      } else if (cmd === 'depts-excel') {
        return exportExcel();
      // 부서 트리 전체 펼치기
      } else if (cmd === 'deptTree-expandAll') {
        return expandAll();
      // 부서 트리 전체 접기
      } else if (cmd === 'deptTree-collapseAll') {
        return collapseAll();
      // 부서 트리 노드 펼치기/접기 토글
      } else if (cmd === 'deptTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 상위부서 선택 모달 닫기
      } else if (cmd === 'parentModal-close') {
        parentModal.show = false;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyDeptMng.js : handleSelectAction -> ', cmd, param);
      // 부서 그리드 셀 값 변경 감지
      if (cmd === 'depts-rowCellChange') {
        return onCellChange(param);
      // 부서 그리드 행 삭제 마킹
      } else if (cmd === 'depts-rowDelete') {
        return deleteRow(param);
      // 부서 그리드 행 변경 취소
      } else if (cmd === 'depts-rowCancel') {
        return cancelRow(param);
      // 좌측 트리 노드 선택 → 우측 그리드 필터링
      } else if (cmd === 'deptTree-select') {
        uiState.selectedTreeId = param;
        return handleGridSearch();
      // 상위부서 선택 모달 열기 (parentPick 컬럼)
      } else if (cmd === 'parentModal-open') {
        return openParentModal(param);
      // 상위부서 모달에서 상위 선택 → 행 parentDeptId 갱신
      } else if (cmd === 'parentModal-select') {
        if (parentModal.targetRow) {
          parentModal.targetRow.parentDeptId = param.deptId;
          parentModal.targetRow._depth = 0;
          onCellChange(parentModal.targetRow);
        }
        parentModal.show = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', type: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam());

    /* ===== 좌측 부서 트리 ===== */
    const expanded = reactive(new Set([null]));

    /* ===== CRUD 그리드 ===== */
    const gridRows   = reactive([]);
    let   _tempId    = -1;
    const EDIT_FIELDS = ['deptCode', 'deptNm', 'parentDeptId', 'deptTypeCd', 'sortOrd', 'useYn', 'deptRemark'];

    /* ===== 깊이 표시 상수 ===== */
    const DEPTH_BULLETS = ['●', '◦', '·', '-'];
    const DEPTH_COLORS  = ['#e8587a', '#2563eb', '#52c41a', '#f59e0b', '#8b5cf6'];

    /* depthBullet — 깊이 글머리 */
    const depthBullet = (d) => DEPTH_BULLETS[Math.min(d, 3)];

    /* depthColor — 깊이 색상 */
    const depthColor  = (d) => DEPTH_COLORS[d % 5];

    /* ===== 상위부서 선택 모달 ===== */
    const parentModal = reactive({ show: false, targetRow: null });
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* handleSearchTree — 부서 트리 조회 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syDept.getTree('부서관리', '트리조회');
        const list = res.data?.data || [];
        depts.splice(0, depts.length, ...list);
      } catch (err) {
        console.error('[handleSearchTree]', err);
      }
    };

    /* handleGridSearch — 그리드 목록 조회 (트리 노드 선택 or 검색 조건 기반) */
    const handleGridSearch = async () => {
      uiState.loading = true;
      try {
        const { type, ...restParam } = searchParam;
        const params = {
          pageNo: 1, pageSize: 10000,
          ...Object.fromEntries(Object.entries(restParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
          ...(type ? { typeCd: type } : {}),
          ...(uiState.selectedTreeId != null ? { parentDeptId: uiState.selectedTreeId } : {}),
        };
        const res = await boApiSvc.syDept.getPage(params, '부서관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        gridRows.splice(0);
        buildTreeRows(list).forEach(d => gridRows.push(makeRow(d)));
        uiState.error = null;
      } catch (err) {
        console.error('[handleGridSearch]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    /* handleSearchList — 목록 조회 (트리 + 그리드) */
    const handleSearchList = async () => {
      await handleSearchTree();
      await handleGridSearch();
    };

    /* buildTree — 트리 빌드 */
    const buildTree = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) { map[d.parentDeptId].children.push(map[d.deptId]); }
        else { roots.push(map[d.deptId]); }
      });
      const sort = arr => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      const sortAll = (node) => { sort(node.children); node.children.forEach(sortAll); };
      sort(roots).forEach(sortAll);
      return { deptId: null, deptNm: '전체', children: roots };
    };

    const cfTree = computed(() => buildTree(depts));

    /* cfDeptCounts — 부서별 자손 누적 부서수 (자기 자신 포함) — 프론트 자체 계산
     *   { deptId: 자기포함 자손합계, __total__: 전체 부서수(루트들 자기포함 합계) } */
    const cfDeptCounts = computed(() => {
      const out = {};
      const recur = (node) => {
        let cnt = 1; // 자기 자신
        for (const ch of (node.children || [])) cnt += recur(ch);
        if (node.deptId != null) out[node.deptId] = cnt;
        return cnt;
      };
      cfTree.value.children.forEach(r => recur(r));
      /* __total__ = 전체 부서수 (depts 배열 길이). recur 합계와 동일하지만 명시적으로 depts.length 사용 */
      out.__total__ = depts.length;
      return out;
    });

    /* expandAll — 트리 전체 펼치기 */
    const expandAll = () => {
      const walk = (n) => { expanded.add(n.deptId); n.children.forEach(walk); };
      cfTree.value.children.forEach(walk);
      expanded.add(null);
    };

    /* collapseAll — 트리 전체 접기 */
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.dept_status = codeStore.sgGetGrpCodes('DEPT_STATUS');
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };

    // ★ onMounted — 진입 시 트리 + 그리드 조회
    onMounted(async () => {
      await handleSearchTree();
      expanded.add(null);
      await handleGridSearch();
    });

    /* buildTreeRows — 그리드용 트리 행 빌드 */
    const buildTreeRows = (items) => {
      const map = {};
      items.forEach(d => { map[d.deptId] = { ...d, _children: [] }; });
      const roots = [];
      items.forEach(d => {
        if (d.parentDeptId && map[d.parentDeptId]) { map[d.parentDeptId]._children.push(map[d.deptId]); }
        else { roots.push(map[d.deptId]); }
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
    const makeRow = (d) => ({
      ...d, _depth: d._depth || 0, _row_status: 'N', _row_check: false,
      _row_org: { deptCode: d.deptCode, deptNm: d.deptNm, parentDeptId: d.parentDeptId,
               deptTypeCd: d.deptTypeCd, sortOrd: d.sortOrd, useYn: d.useYn, deptRemark: d.deptRemark },
    });

    /* onCellChange — 셀 변경 감지 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      const ref = uiState.focusedIdx !== null ? gridRows[uiState.focusedIdx] : null;
      const newRow = {
        deptId: _tempId--, deptCode: '', deptNm: '', parentDeptId: ref ? ref.parentDeptId : null,
        deptTypeCd: ref ? ref.deptTypeCd : '운영',
        sortOrd: ref ? (ref.sortOrd || 0) + 1 : 1,
        useYn: 'Y', deptRemark: '',
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
      const checkedIds = new Set(gridRows.filter(r => r._row_check).map(r => r.deptId));
      if (!checkedIds.size) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = gridRows.length - 1; i >= 0; i--) {
        const row = gridRows[i];
        if (!checkedIds.has(row.deptId)) { continue; }
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
        if (!r.deptCode || !r.deptNm) { showToast('부서코드와 부서명은 필수 항목입니다.', 'error'); return; }
      }
      const details = [];
      if (iRows.length) { details.push({ label: `등록 ${iRows.length}건`, cls: 'badge-blue' }); }
      if (uRows.length) { details.push({ label: `수정 ${uRows.length}건`, cls: 'badge-orange' }); }
      if (dRows.length) { details.push({ label: `삭제 ${dRows.length}건`, cls: 'badge-red' }); }
      const ok = await showConfirm('저장 확인', '다음 내용을 저장하시겠습니까?', { details, btnOk: '예', btnCancel: '아니오' });
      if (!ok) { return; }
      const saveRows = [...iRows, ...uRows, ...dRows].map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syDept.saveList('base', saveRows, '부서관리', '저장');
        showToast('저장되었습니다.');
        await handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* openParentModal — 상위부서 선택 모달 열기 */
    const openParentModal = async (row) => { parentModal.targetRow = row; await handleSearchList(); parentModal.show = true; };

    /* exportExcel — 엑셀 내보내기 */
    const exportExcel = () => coUtil.cofExportCsv(
      gridRows.filter(r => r._row_status !== 'D'),
      [{label:'ID',key:'deptId'},{label:'부서코드',key:'deptCode'},{label:'부서명',key:'deptNm'},{label:'상위ID',key:'parentDeptId'},{label:'유형',key:'deptTypeCd'},{label:'순서',key:'sortOrd'},{label:'사용여부',key:'useYn'},{label:'비고',key:'deptRemark'}],
      '부서목록.csv'
    );

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());
    const cfTypeOptions = computed(() => [...new Set(depts.map(d => d.deptTypeCd).filter(v => v != null && v !== ''))].sort());

    /* parentNm — 상위 부서명 */
    const parentNm = (parentDeptId) => {
      if (!parentDeptId) { return ''; }
      const p = depts.find(d => d.deptId === parentDeptId);
      return p ? p.deptNm : `ID:${parentDeptId}`;
    };

    // 기본 검색
    const baseSearchColumns = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'deptCode', label: '부서코드' },
          { value: 'deptNm',   label: '부서명' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력' },
      { key: 'type', type: 'select', label: '유형', options: () => cfTypeOptions.value, nullLabel: '유형 전체' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // 기본 그리드
    const baseGridColumns = [
      { key: 'deptCode',     label: '부서코드', style: 'width:110px;',    edit: 'text', mono: true },
      { key: 'deptNm',       label: '부서명',   style: 'min-width:190px;', edit: 'text',
        treeDepth: true, treeBullet: depthBullet, treeColor: depthColor },
      { key: 'parentDeptId', label: '상위부서', style: 'min-width:150px;',
        parentPick: { label: parentNm, open: (row) => handleSelectAction('parentModal-open', row), title: '상위부서 선택' } },
      { key: 'deptTypeCd',   label: '유형',     style: 'width:90px;',     edit: 'select', options: codes.dept_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',      label: '순서',     cls: 'col-ord',  edit: 'number' },
      { key: 'useYn',        label: '사용여부', cls: 'col-use',  edit: 'select', options: codes.use_yn },
      { key: 'deptRemark',   label: '비고',     edit: 'text' },
      { key: 'siteNm',       label: '사이트명', style: 'width:80px;', align: 'center',
        cellStyle: 'font-size:11px;color:#2563eb;', fmt: () => cfSiteNm.value },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      depts, uiState, codes, searchParam, gridRows, expanded, parentModal,                                   // 상태 / 데이터
      baseSearchColumns, baseGridColumns,                                                                    // 컬럼 정의
      handleBtnAction, handleSelectAction,                                                                   // dispatch (모든 이벤트 / 액션 라우팅)
      cfTree, cfDeptCounts,                                                                                  // computed
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    부서관리
  </div>
  <!-- ===== ■. 카드 영역 =================================================== -->
  <div class="card">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area :loading="uiState.loading" @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:grid;grid-template-columns:minmax(220px,17fr) minmax(0,83fr);gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 부서 트리 ================================================= -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">
          📂 부서
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-expandAll')" style="flex:1;font-size:11px;">
          ▼ 전체펼치기
        </button>
        <button class="btn btn-sm" @click="handleBtnAction('deptTree-collapseAll')" style="flex:1;font-size:11px;">
          ▶ 전체닫기
        </button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <bo-dept-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedTreeId"
          :on-toggle="id => handleBtnAction('deptTree-toggle', id)"
          :on-select="id => handleSelectAction('deptTree-select', id)"
          :depth="0" :counts="cfDeptCounts" />
      </div>
    </div>
    <div>
      <!-- ===== ■.■.■. CRUD 그리드 ============================================ -->
      <bo-grid-crud
        :columns="baseGridColumns" :rows="gridRows" row-key="deptId"
        list-title="부서목록" :show-export="true" :draggable="false"
        v-model:focusedIdx="uiState.focusedIdx"
        v-model:checkAll="uiState.checkAll"
        @add="handleBtnAction('depts-add')" @save="handleBtnAction('depts-save')"
        @delete-checked="handleBtnAction('depts-deleteChecked')" @cancel-checked="handleBtnAction('depts-cancelChecked')"
        @cell-change="row => handleSelectAction('depts-rowCellChange', row)"
        @export="handleBtnAction('depts-excel')">
        <template #row-actions="{ row, idx }">
          <bo-row-cancel-delete :row="row" :allow-delete-null="true"
            @cancel="handleSelectAction('depts-rowCancel', idx)"
            @delete="handleSelectAction('depts-rowDelete', idx)" />
        </template>
      </bo-grid-crud>
      <!-- ===== ■.■.■. 상위부서 선택 모달 ========================================= -->
      <dept-tree-modal v-if="parentModal && parentModal.show" :exclude-id="parentModal.targetRow && parentModal.targetRow.deptId > 0 ? parentModal.targetRow.deptId : null" @select="dept => handleSelectAction('parentModal-select', dept)" @close="handleBtnAction('parentModal-close')" />
    </div>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
</div>
`,
};

/* BoDeptTreeNode (구 DeptTreeNode) 는 components/comp/BoComp.js 로 이동. 태그: <bo-dept-tree-node> */
