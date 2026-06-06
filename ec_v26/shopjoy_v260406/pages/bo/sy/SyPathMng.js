/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달
    const setApiRes    = window.boApp.setApiRes;   // API 결과 전달

    const codes        = reactive({ use_yn: [] });        // 공통코드
    const uiStateCode  = reactive({ isPageCodeLoad: false }); // 코드 로드 플래그

    /* _initSearchParam — 초기화 */

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyPathMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        pager.pageNo = 1;
        return handleGridSearch();
      // 검색조건 초기화 + 재조회
      } else if (cmd === 'searchParam-reset') {
        Object.assign(searchParam, _initSearchParam());
        uiState.selectedPathId = null;
        pager.pageNo = 1;
        return handleGridSearch();
      // 경로 그리드 행 추가
      } else if (cmd === 'paths-add') {
        return addRow();
      // 경로 그리드 저장
      } else if (cmd === 'paths-save') {
        return handleSave();
      // 좌측 트리 전체 펼치기
      } else if (cmd === 'pathTree-expandAll') {
        expanded.clear(); expanded.add(null);
        /* walk — 모든 노드 펼치기 */
        const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); };
        cfTree.value.children.forEach(walk);
        return;
      // 좌측 트리 전체 접기
      } else if (cmd === 'pathTree-collapseAll') {
        expanded.clear();
        expanded.add(null);
        return;
      // 좌측 트리 노드 펼침/접힘 토글
      } else if (cmd === 'pathTree-toggle') {
        if (expanded.has(param)) { expanded.delete(param); } else { expanded.add(param); }
        return;
      // 부모경로 모달 닫기
      } else if (cmd === 'parentModal-close') {
        return closeParentModal();
      // 부모경로 모달 노드 펼침/접힘 토글
      } else if (cmd === 'parentModal-toggle') {
        if (parentModal.expanded.has(param)) { parentModal.expanded.delete(param); } else { parentModal.expanded.add(param); }
        return;
      // 페이지 번호 클릭
      } else if (cmd === 'paths-pager-setPage') {
        if (param >= 1 && param <= pager.pageTotalPage) { pager.pageNo = param; handleGridSearch(); }
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드/모달 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyPathMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 트리 노드 선택 → 그리드 필터링
      if (cmd === 'pathTree-select') {
        uiState.selectedPathId = (uiState.selectedPathId === param) ? null : param;
        pager.pageNo = 1;
        return handleGridSearch();
      } else if (cmd === 'paths-rowCancel') {
        return cancelRow(param);
      // 그리드 행 삭제 (서버 호출)
      } else if (cmd === 'paths-rowDelete') {
        return deleteRow(param);
      // 페이지 크기 변경
      } else if (cmd === 'paths-pager-sizeChange') {
        pager.pageNo = 1;
        return handleGridSearch();
      // 부모경로 모달에서 노드 선택 → 행 parentPathId 갱신
      } else if (cmd === 'parentModal-select') {
        return selectParent(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* handleGridCellAction — 그리드 셀 변경/클릭 라우터. colKey 기준 분기 (CRUD 셀 변경 / 셀 내 버튼 btn_*) */
    const handleGridCellAction = (cmd, colKey, row, e = {}) => {
      if (cmd === 'paths-cellChange') {
        // 부모경로 셀: 🔍 돋보기 → 모달 열기 / ✕ → 비우기
        if (colKey === 'btn_parent_open')  { return openParentModal(row); }
        if (colKey === 'btn_parent_clear') { return clearParent(row); }
        // 그 외 = edit 셀 값 변경 감지
        return onCellChange(row);
      } else {
        console.warn('[handleGridCellAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ SyPathMng : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'parent-path') {
        if (result == null) {
            return closeParentModal();
        }
        return selectParent(result);
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };
    const _initSearchParam = () => {
      return { searchType: '', searchValue: '', bizCd: '', useYn: 'Y' };
    };
    const searchParam = reactive(_initSearchParam()); // 검색조건

    const allPaths  = reactive([]);                   // 트리용 전체 경로 (path_id + parent_path_id)
    const expanded  = reactive(new Set([null]));      // 트리 펼친 노드 Set
    const uiState   = reactive({ selectedPathId: null }); // UI 상태

    const gridRows  = reactive([]);                   // 그리드 행
    const pager     = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    let _newId      = -1;                             // 신규 행 임시 ID

    /* -- 부모경로 선택 모달 -- */
    const parentModal = reactive({ show: false, targetRow: null, expanded: new Set([null]) }); // 부모경로 선택 모달 상태

    const cfTree = computed(() => {
      const map = {};
      allPaths.forEach(r => { map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.parentPathId != null && map[r.parentPathId]) { map[r.parentPathId].children.push(map[r.pathId]); }
        else { roots.push(map[r.pathId]); }
      });
      /* sort — 정렬 */
      const sort = (arr) => arr.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0));
      /* sortDeep — 깊이별 정렬 */
      const sortDeep = (nodes) => { sort(nodes).forEach(n => sortDeep(n.children)); return nodes; };
      sortDeep(roots);
      return { pathId: null, pathLabel: '전체', children: roots, count: allPaths.length };
    });

    const cfParentTree = computed(() => {
      const exclude = parentModal.targetRow?.pathId;
      const map = {};
      allPaths.forEach(r => { if (r.pathId !== exclude) map[r.pathId] = { ...r, children: [] }; });
      const roots = [];
      allPaths.forEach(r => {
        if (r.pathId === exclude) { return; }
        if (r.parentPathId != null && map[r.parentPathId]) { map[r.parentPathId].children.push(map[r.pathId]); }
        else { roots.push(map[r.pathId]); }
      });
      return { pathId: null, pathLabel: '전체', children: roots.sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)) };
    });

    const cfDirtyRows = computed(() => gridRows.filter(r => r._status === 'N' || r._status === 'U' || r._status === 'D'));
    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ############################ */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
        uiStateCode.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };


    /* handleSearchTree — 트리 조회 */
    const handleSearchTree = async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '경로관리', '트리조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        allPaths.splice(0, allPaths.length, ...list);
        expanded.clear(); expanded.add(null);
        allPaths.filter(r => r.parentPathId == null).forEach(r => expanded.add(r.pathId));
      } catch (e) { console.error('[handleSearchTree]', e); }
    };

    /* handleGridSearch — 그리드 조회 */
    const handleGridSearch = async () => {
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...searchParam };
        if (uiState.selectedPathId != null) { params.parentPathId = uiState.selectedPathId; }
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathLabel,pathRemark';
        }
        const res = await boApiSvc.syPath.getPage(params, '경로관리', '목록조회');
        const data = res.data?.data || {};
        const list = data.pageList || data.list || [];
        gridRows.splice(0, gridRows.length, ...list.map(r => ({ ...r, _status: null, _row_org: { ...r } })));
        pager.pageTotalCount = data.pageTotalCount ?? data.totalCount ?? list.length;
        pager.pageTotalPage  = data.pageTotalPage  ?? Math.max(1, Math.ceil(pager.pageTotalCount / pager.pageSize));
        coUtil.cofBuildPagerNums(pager);
      } catch (e) { console.error('[handleGridSearch]', e); }
    };

    onMounted(async () => {
      fnLoadCodes();
      await handleSearchTree();
      await handleGridSearch();
    });

    /* onCellChange — 셀 변경 감지 */
    const onCellChange = (row) => {
      if (!row._status) { row._status = 'U'; }
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      gridRows.unshift({
        pathId: _newId--,
        bizCd: searchParam.bizCd || '',
        parentPathId: uiState.selectedPathId,
        pathLabel: '',
        sortOrd: 0,
        useYn: 'Y',
        pathRemark: '',
        _status: 'N',
        _row_org: null,
      });
    };

    /* cancelRow — 행 취소 (신규=행 제거 / 수정·삭제=원본 복원)
     *   서버 호출 없음. 저장 전 로컬 되돌리기. */
    const cancelRow = (row) => {
      if (row._status === 'N') {
        const idx = gridRows.findIndex(r => r.pathId === row.pathId);
        if (idx !== -1) { gridRows.splice(idx, 1); }
      } else if (row._row_org) {
        Object.assign(row, row._row_org, { _status: null });
      } else {
        row._status = null;
      }
    };

    /* deleteRow — 행 삭제 마킹 (_status='D'). 신규행은 즉시 제거.
     *   실제 DB 삭제는 [저장] 클릭 시 saveList 에 'D' 로 전송되어 처리됨. */
    const deleteRow = (row) => {
      if (row._status === 'N') { cancelRow(row); return; }
      row._status = 'D';
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const changed = cfDirtyRows.value;
      if (!changed.length) { showToast?.('변경된 내용이 없습니다.', 'info'); return; }
      // 삭제(D) 행은 라벨 검증 제외, 신규(N)/수정(U) 행만 필수값 확인
      for (const row of changed) {
        if (row._status !== 'D' && !row.pathLabel) { showToast?.('경로 라벨은 필수입니다.', 'error'); return; }
      }
      const cntDel = changed.filter(r => r._status === 'D').length;
      const cntUpd = changed.length - cntDel;
      const msg = cntDel
        ? `변경 ${cntUpd}건, 삭제 ${cntDel}건을 저장하시겠습니까?`
        : `${changed.length}건을 저장하시겠습니까?`;
      const ok = await showConfirm?.('저장', msg);
      if (!ok) { return; }
      // rowStatus 매핑: N→I(insert) / U→U(update) / D→D(delete)
      const _RS = { N: 'I', U: 'U', D: 'D' };
      const saveRows = changed.map(r => ({ ...r, rowStatus: _RS[r._status] || r._row_status || r._status }));
      try {
        await boApiSvc.syPath.saveList('base', saveRows, '경로관리', '저장');
        showToast?.('저장되었습니다.', 'success');
        await handleSearchTree();
        await handleGridSearch();
      } catch (err) {
        showToast?.(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* openParentModal — 부모경로 모달 열기 */
    const openParentModal = async (row) => {
      parentModal.targetRow = row;
      parentModal.expanded.clear();
      parentModal.expanded.add(null);
      await handleSearchTree();
      allPaths.filter(r => r.parentPathId == null && r.pathId !== row.pathId).forEach(r => parentModal.expanded.add(r.pathId));
      parentModal.show = true;
    };

    /* closeParentModal — 부모경로 모달 닫기 */
    const closeParentModal = () => { parentModal.show = false; parentModal.targetRow = null; };

    /* selectParent — 부모경로 선택 */
    const selectParent = (pathId) => {
      if (parentModal.targetRow) {
        parentModal.targetRow.parentPathId = pathId;
        onCellChange(parentModal.targetRow);
      }
      closeParentModal();
    };

    /* clearParent — 부모경로 비우기 (루트로) */
    const clearParent = (row) => {
      row.parentPathId = null;
      onCellChange(row);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    /* getParentLabel — 부모경로 라벨 조회 */
    const getParentLabel = (pathId) => {
      if (pathId == null) { return '(루트)'; }
      return allPaths.find(r => r.pathId === pathId)?.pathLabel || String(pathId);
    };

    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'bizCd', type: 'text', label: '업무코드', placeholder: 'biz_cd 검색', width: '180px' },
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'pathLabel',  label: '라벨' },
          { value: 'pathRemark', label: '비고' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '320px' },
      { key: 'useYn', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'rowStatus',    label: '상태',     style: 'width:60px;text-align:center;', align: 'center',
        badge: (row) => 'badge-xs ' + (row._status === 'N' ? 'badge-green' : row._status === 'U' ? 'badge-orange' : row._status === 'D' ? 'badge-red' : 'badge-gray'),
        fmt: (v, row) => row._status || 'N' },
      { key: 'pathId',       label: 'ID',       style: 'width:60px;text-align:center;', align: 'center',
        cellStyle: 'font-size:11px;color:#999;',
        fmt: (v, row) => row.pathId > 0 ? row.pathId : 'NEW' },
      { key: 'bizCd',        label: '업무코드', style: 'width:120px;', edit: 'text', placeholder: 'biz_cd' },
      { key: 'parentPathId', label: '부모경로', style: 'width:180px;', noEllipsis: true },
      { key: 'pathLabel',    label: '경로 라벨', edit: 'text', placeholder: '경로 라벨' },
      { key: 'sortOrd',      label: '정렬',     style: 'width:60px;text-align:center;', edit: 'number', align: 'center' },
      { key: 'useYn',        label: '사용',     style: 'width:70px;text-align:center;',
        edit: 'select', options: () => codes.use_yn },
      { key: 'pathRemark',   label: '비고',     style: 'width:160px;', edit: 'text', placeholder: '비고' },
    ];

    /* fnRowClass — 행 클래스 (crud-row 베이스 + 행상태 색상)
     *   CSS 규칙은 `.crud-row.status-{I|U|D}` 두 클래스 동시 매칭 필요.
     *   _status: 'N'(신규)→status-I(녹색), 'U'(수정)→status-U(노랑), 'D'(삭제)→status-D(빨강) */
    const _STATUS_CLS = { N: 'status-I', U: 'status-U', D: 'status-D' };
    const fnRowClass = (r) => 'crud-row ' + (_STATUS_CLS[r._status] || '');

    /* fnShowCancel/fnShowDelete — 관리열 [취소]/[삭제] 표시조건 (BoRowCancelDelete 표준 동일)
     *   _status: null(저장됨) / 'N'(신규) / 'U'(수정) / 'D'(삭제마킹)
     *   취소: 'N'·'U'·'D' (변경된 모든 상태에서 되돌리기)  ← U(수정) 행도 취소 노출
     *   삭제: null(저장됨)·'U'(수정) (정상/수정 행만 삭제 마킹. 신규·이미삭제 행은 미노출) */
    const fnShowCancel = (r) => ['N', 'U', 'D'].includes(r._status);
    const fnShowDelete = (r) => r._status == null || r._status === 'U';

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, searchParam, codes, expanded, gridRows, pager, parentModal,         // 상태 / 데이터
      handleBtnAction, handleSelectAction, handleGridCellAction, fnCallbackModal,                                         // dispatch (모든 이벤트 / 액션 라우팅)
      cfTree, cfParentTree, cfDirtyRows,                                           // computed
      fnRowClass, getParentLabel, fnShowCancel, fnShowDelete,                      // 헬퍼
    };
  },
  template: /* html */`
<bo-page title="표시경로">
  <!-- ===== ■. 검색 ====================================================== -->
  <bo-container>
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </bo-container>
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div class="bo-2col">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-container bare>
      <bo-local-tree-card title="경로 트리" biz-cd="sy_path" :sticky="true"
        :node="cfTree" :expanded="expanded" :selected="uiState.selectedPathId"
        :on-toggle="id => handleBtnAction('pathTree-toggle', id)"
        @select="id => handleSelectAction('pathTree-select', id)" @expand-all="handleBtnAction('pathTree-expandAll')" @collapse-all="handleBtnAction('pathTree-collapseAll')" />
    </bo-container>
    <!-- ===== □.□. 트리 ==================================================== -->
    <!-- ===== ■.■. 그리드 =================================================== -->
    <bo-container title="경로 목록" :count-text="pager.pageTotalCount + '건'">
      <template #toolbar-actions>
        <button class="btn btn-green btn-sm" @click="handleBtnAction('paths-add')">
          + 행추가
        </button>
        <button class="btn btn-primary btn-sm" @click="handleBtnAction('paths-save')">
          저장
        </button>
      </template>
      <bo-grid bare
        :columns="columns.baseGrid" :rows="gridRows" row-key="pathId"
        :row-class="fnRowClass" :row-actions="true"
        grid-id="paths-cellChange" @cell-change="e => handleGridCellAction(e.cmd, e.colKey, e.row, e)">
        <!-- ===== ■.■.■. 부모경로 셀: 값 박스 + 🔍 돋보기(모달 열기) + x(비우기) ============
             BoPathPickField 와 동일한 룩앤필 (값 박스 + 돋보기 버튼 + 우측 x). 모달은 부모트리(cfParentTree) 전용 -->
        <template #cell-parentPathId="{ row }">
          <td style="width:180px;">
            <div style="display:flex;align-items:center;gap:4px;padding:0 4px 0 7px;border:1px solid #e5e7eb;border-radius:5px;background:#f5f5f7;min-height:24px;">
              <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;"
                :style="{ color: row.parentPathId != null ? '#374151' : '#9ca3af', fontWeight: row.parentPathId != null ? 600 : 400 }"
                :title="getParentLabel(row.parentPathId)">
                {{ getParentLabel(row.parentPathId) }}
              </span>
              <span v-if="row.parentPathId != null" title="부모경로 비우기"
                style="cursor:pointer;color:#9ca3af;font-size:9px;flex-shrink:0;line-height:1;padding:0;margin-right:-1px;align-self:flex-end;margin-bottom:2px;"
                @click.stop="handleGridCellAction('paths-cellChange', 'btn_parent_clear', row)">
                ✕
              </span>
              <button type="button" title="부모경로 선택"
                style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#fff;border:1px solid #d1d5db;border-radius:4px;font-size:11px;color:#2563eb;flex-shrink:0;padding:0;"
                @click.stop="handleGridCellAction('paths-cellChange', 'btn_parent_open', row)">
                🔍
              </button>
            </div>
          </td>
        </template>
        <template #head-actions>
          관리
        </template>
        <!-- ===== ■.■.■. 관리: 행상태별 [취소]/[삭제] (취소=왼쪽, 삭제=오른쪽) ============
             N(신규): [취소](행제거) / D(삭제마킹): [취소](복원)+[삭제] / 그외: [삭제](D마킹). 실제 반영은 상단 [저장] -->
        <template #row-actions="{ row }">
          <div style="display:inline-flex;gap:4px;flex-wrap:nowrap;">
            <button v-if="fnShowCancel(row)" class="btn btn-secondary btn-xs" @click.stop="handleSelectAction('paths-rowCancel', row)">
              취소
            </button>
            <button v-if="fnShowDelete(row)" class="btn btn-danger btn-xs" @click.stop="handleSelectAction('paths-rowDelete', row)">
              삭제
            </button>
          </div>
        </template>
      </bo-grid>
      <bo-pager :pager="pager" :on-set-page="n => handleBtnAction('paths-pager-setPage', n)" :on-size-change="() => handleSelectAction('paths-pager-sizeChange')" />
    </bo-container>
    <!-- ===== □.□. 그리드 =================================================== -->
  </div>
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
  <!-- ===== ■. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->
  <bo-tree-selector-modal :show="parentModal.show" title="부모경로 선택"
    :node="cfParentTree" :expanded="parentModal.expanded"
    :on-toggle="id => handleBtnAction('parentModal-toggle', id)"
    root-label="(루트 — 상위없음)"
    @select="id => handleSelectAction('parentModal-select', id)"
    @close="handleBtnAction('parentModal-close')" />
  <!-- ===== □. 부모경로 선택 모달 (BoTreeSelectorModal) ======================== -->
</bo-page>
`,
};
