/* ShopJoy Admin - 프로퍼티 관리 (좌측 트리 + 우측 CRUD 그리드) */
window.SyPropMng = {
  name: 'SyPropMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    /* ##### [01] 초기 변수 정의 #################################################### */
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;   // 토스트 알림
    const showConfirm  = window.boApp.showConfirm; // 확인 모달

    const propCounts = reactive({});                 // 좌 트리 노드별 카운트 (검색조건 동기)

    const uiState = reactive({ isPageCodeLoad: false, _newId: -1, selectedPath: '' }); // UI 상태
    const codes   = reactive({ use_yn: [], prop_types: ['STRING','NUMBER','BOOLEAN','JSON'] }); // 공통코드

    const cfSiteId = computed(() => boCommonFilter?.siteId || null);

    const searchParam = reactive({ searchType: '', searchValue: '', useFlt: '', typeFlt: '' }); // 검색조건

    const propRows  = reactive([]);                // 프로퍼티 그리드 행 (BoGridCrud 규약: _row_status N/I/U/D, _row_check, _row_org)
    const _rawProps = reactive([]);                // 원본 (reload 복원용)
    const EDIT_FIELDS = ['pathId', 'propKey', 'propValue', 'propLabel', 'propTypeCd', 'sortOrd', 'useYn', 'propRemark'];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */
    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ SyPropMng.js : handleBtnAction -> ', cmd, param);
      // 검색조건으로 목록 조회
      if (cmd === 'searchParam-list') {
        return fetchData();
      // 검색조건 초기화 + 트리 선택 해제
      } else if (cmd === 'searchParam-reset') {
        searchParam.searchValue = '';
        searchParam.searchType = '';
        searchParam.useFlt = '';
        searchParam.typeFlt = '';
        uiState.selectedPath = '';
        return reload();
      // 프로퍼티 그리드 행 추가
      } else if (cmd === 'props-add') {
        return addRow();
      // 프로퍼티 그리드 저장
      } else if (cmd === 'props-save') {
        return handleSave();
      // 체크된 행 일괄 삭제 마킹
      } else if (cmd === 'props-deleteChecked') {
        return deleteChecked();
      // 체크된 행 일괄 취소
      } else if (cmd === 'props-cancelChecked') {
        return cancelChecked();
      // CSV 내보내기
      } else if (cmd === 'props-export') {
        return exportCsv();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 그리드 행/노드 선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ SyPropMng.js : handleSelectAction -> ', cmd, param);
      // 좌측 경로 트리 노드 선택 → 그리드 재조회
      if (cmd === 'pathTree-select') {
        uiState.selectedPath = param;
        return fetchData();
      // 그리드 셀 변경 감지
      } else if (cmd === 'props-cellChange') {
        return onCellChange(param);
      // 그리드 행 삭제 마킹
      } else if (cmd === 'props-rowDelete') {
        param._row_status = 'D';
        return;
      // 그리드 행 복원 (D → N/I)
      } else if (cmd === 'props-rowRestore') {
        param._row_status = param._row_org ? 'N' : 'I';
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */
    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* makeRow — 행 생성 */
    const makeRow = (p) => ({
      ...p,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = p[f]; return acc; }, {}),
    });

    /* reload — 원본으로 재로드 */
    const reload = () => {
      propRows.splice(0, propRows.length, ..._rawProps.map(makeRow));
    };

    /* handleLoadPathTreeNodeCounts — 좌 트리 노드별 카운트 (목록과 동일 검색조건 동기) */
    const handleLoadPathTreeNodeCounts = async () => {
      try {
        const { searchType, searchValue, useFlt, typeFlt } = searchParam;
        // ⚠️ 목록(getPage)과 동일한 필터를 적용해야 트리 숫자 ↔ 우측 목록 건수가 일치한다.
        //    pathId 만 제외(트리는 경로별 분해 표시이므로 특정 경로로 고정하지 않음).
        const params = {
          ...(cfSiteId.value ? { siteId: cfSiteId.value }     : {}),
          ...(searchValue    ? { searchValue }                : {}),
          ...(searchType     ? { searchType }                 : {}),
          ...(useFlt         ? { useYn: useFlt }               : {}),
          ...(typeFlt        ? { propTypeCd: typeFlt }         : {}),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathId,propKey,propValue,propLabel';
        }
        const res = await boApiSvc.syProp.getPathTreeNodeCounts(params, '경로별카운트', '조회');
        const rows = res.data?.data || [];

        Object.keys(propCounts).forEach(k => { delete propCounts[k]; });

        for (const r of rows) { if (r && r.pathId != null) propCounts[r.pathId] = r.cnt; }
      } catch (e) { console.error('[handleLoadPathTreeNodeCounts]', e); }
    };

    /* fetchData — 목록 조회 */
    const fetchData = async () => {
      try {
        const { searchType, searchValue, useFlt, typeFlt } = searchParam;
        const params = {
          pageNo: 1, pageSize: 10000,
          ...(cfSiteId.value          ? { siteId: cfSiteId.value }       : {}),
          ...(uiState.selectedPath    ? { pathId: uiState.selectedPath } : {}),
          ...(searchValue ? { searchValue }        : {}),
          ...(searchType ? { searchType }        : {}),
          ...(useFlt  ? { useYn: useFlt }         : {}),
          ...(typeFlt ? { propTypeCd: typeFlt }   : {}),
        };
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathId,propKey,propValue,propLabel';
        }
        const res = await boApiSvc.syProp.getPage(params, '속성관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        _rawProps.splice(0, _rawProps.length, ...list);
        reload();
        /* 좌 트리 카운트 동기 갱신 */
        handleLoadPathTreeNodeCounts();
      } catch (err) {
        console.error('[fetchData]', err);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      fetchData();
    });

    /* onCellChange — 셀 변경 감지 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') { return; }
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      propRows.push({
        propId: uiState._newId--,
        siteId: cfSiteId.value || 1,
        pathId: uiState.selectedPath || 'new.prop',
        propKey: 'new_key',
        propLabel: '신규 프로퍼티',
        propValue: '',
        propTypeCd: 'STRING',
        sortOrd: 99,
        useYn: 'Y',
        propRemark: '',
        _row_status: 'I', _row_check: false, _row_org: null,
      });
    };

    /* deleteChecked — 체크된 행 일괄 삭제 마킹 */
    const deleteChecked = () => {
      for (let i = propRows.length - 1; i >= 0; i--) {
        if (!propRows[i]._row_check) { continue; }
        if (propRows[i]._row_status === 'I') { propRows.splice(i, 1); }
        else { propRows[i]._row_status = 'D'; }
      }
    };

    /* cancelChecked — 체크된 행 일괄 취소 */
    const cancelChecked = () => {
      const checked = propRows.filter(r => r._row_check);
      if (!checked.length) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = propRows.length - 1; i >= 0; i--) {
        const row = propRows[i];
        if (!row._row_check || row._row_status === 'N') { continue; }
        if (row._row_status === 'I') { propRows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* handleSave — 저장 */
    const handleSave = async () => {
      const dirty = propRows.filter(r => ['I', 'U', 'D'].includes(r._row_status));
      if (dirty.length === 0) { showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await showConfirm('저장', `${dirty.length}건의 변경사항을 저장하시겠습니까?`);
      if (!ok) { return; }
      const saveRows = dirty.map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syProp.saveList('base', saveRows, '속성관리', '저장');
        showToast('저장되었습니다.', 'success');
        await fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* exportCsv — CSV 내보내기 */
    const exportCsv = () => {
      const header = ['ID','표시경로','키','값','라벨','타입','정렬','사용','비고'];
      const lines = [header.join(',')];
      propRows.filter(r => r._row_status !== 'D').forEach(r => {
        lines.push([r.propId, r.pathId, r.propKey, r.propValue, r.propLabel, r.propTypeCd, r.sortOrd, r.useYn, r.propRemark || '']
          .map(c => '"' + String(c).replace(/"/g,'""') + '"').join(','));
      });
      const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = coUtil.cofBuildExportFilename('프로퍼티.csv'); a.click();
      URL.revokeObjectURL(url);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */
    // 기본 검색
    const columns = {};
    columns.baseSearch = [
      { key: 'searchType', type: 'multiCheck', label: '검색대상',
        options: [
          { value: 'pathId',    label: '표시경로' },
          { value: 'propKey',   label: '키' },
          { value: 'propValue', label: '값' },
          { value: 'propLabel', label: '라벨' },
        ],
        placeholder: '검색대상 전체', allLabel: '전체 선택', minWidth: '160px' },
      { key: 'searchValue', type: 'text', label: '검색어', placeholder: '검색어 입력', width: '420px' },
      { key: 'typeFlt', type: 'select', label: '타입', options: () => codes.prop_types, nullLabel: '전체 타입' },
      { key: 'useFlt', type: 'select', label: '사용여부', options: () => codes.use_yn, nullLabel: '사용여부 전체' },
    ];

    // 기본 그리드
    columns.baseGrid = [
      { key: 'pathId',     label: '표시경로',  style: 'width:170px;max-width:170px;', pathPick: 'sy_prop' },
      { key: 'propKey',    label: '키',        edit: 'text', mono: true },
      { key: 'propValue',  label: '값',        edit: 'text' },
      { key: 'propLabel',  label: '라벨',      edit: 'text' },
      { key: 'propTypeCd', label: '타입',      cls: 'col-id', edit: 'select', options: () => codes.prop_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '정렬',      cls: 'col-ord', edit: 'number' },
      { key: 'useYn',      label: '사용',      cls: 'col-use', edit: 'select', options: () => codes.use_yn },
      { key: 'propRemark', label: '비고',      edit: 'text' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */
    return {
      columns,
      uiState, propCounts, codes, searchParam, propRows,                        // 상태 / 데이터
      handleBtnAction, handleSelectAction,                          // dispatch (모든 이벤트 / 액션 라우팅)
    };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">
    프로퍼티관리
  </div>
  <!-- ===== ■. 검색 바 ==================================================== -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="handleBtnAction('searchParam-list')" @reset="handleBtnAction('searchParam-reset')" :columns="columns.baseSearch" :param="searchParam" />
  </div>
  <!-- ===== □. 검색 바 ==================================================== -->
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-path-tree-card biz-cd="sy_prop" title="표시경로" :show-biz-cd="false" :counts="propCounts"
      :selected="uiState.selectedPath" @select="path => handleSelectAction('pathTree-select', path)" />
    <!-- ===== ■.■. 그리드 (BoGridCrud) ====================================== -->
    <bo-grid-crud
      :columns="columns.baseGrid" :rows="propRows" row-key="propId"
      list-title="프로퍼티목록" :draggable="false"
      @add="handleBtnAction('props-add')" @save="handleBtnAction('props-save')"
      @delete-checked="handleBtnAction('props-deleteChecked')" @cancel-checked="handleBtnAction('props-cancelChecked')"
      @cell-change="row => handleSelectAction('props-cellChange', row)">
      <template #row-actions="{ row }">
        <button v-if="['N','U'].includes(row._row_status)" class="btn btn-xs btn-danger" @click.stop="handleSelectAction('props-rowDelete', row)">
          삭제
        </button>
        <button v-else-if="row._row_status==='D'" class="btn btn-xs btn-secondary" @click.stop="handleSelectAction('props-rowRestore', row)">
          복원
        </button>
      </template>
    </bo-grid-crud>
  </div>
  <!-- ===== □.□. 그리드 (BoGridCrud) ====================================== -->
  <!-- ===== □. 좌 트리 + 우 그리드 ============================================ -->
</div>
`,
};

/* BoPropTreeNode (구 PropTreeNode) 는 components/comp/BoComp.js 로 이동. 태그: <bo-prop-tree-node> */
