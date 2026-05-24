/* ShopJoy Admin - 프로퍼티 관리 (좌측 트리 + 우측 CRUD 그리드) */
window.SyPropMng = {
  name: 'SyPropMng',
  props: {
    navigate:     { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, watch, onMounted } = Vue;
    const showToast    = window.boApp.showToast;  // 토스트 알림
    const showConfirm  = window.boApp.showConfirm;  // 확인 모달
    const showRefModal = window.boApp.showRefModal;  // 참조 모달
    const setApiRes    = window.boApp.setApiRes;  // API 결과 전달
    const uiState = reactive({ isPageCodeLoad: false, _newId: -1, selectedPath: ''});
    const codes = reactive({ use_yn: [], prop_types: ['STRING','NUMBER','BOOLEAN','JSON'] });

    /* 시스템 속성 fnLoadCodes */
    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================


    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      const codeStore = window.sfGetBoCodeStore();
      codes.use_yn = codeStore.sgGetGrpCodes('USE_YN');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    const cfSiteId = computed(() => boCommonFilter?.siteId || null);

    /* 표시경로 선택 → bo-path-pick-field 컴포넌트 내장 (@change=onCellChange) */

    /* -- 검색 -- */
    const searchParam = reactive({ searchType: '', searchValue: '', useFlt: '', typeFlt: '' });

    /* -- 데이터 (BoGridCrud 규약: _row_status N/I/U/D, _row_check, _row_org) -- */
    const rows = reactive([]);                 // = gridRows
    const _rawProps = reactive([]);            // 원본 (reload 복원용)
    const EDIT_FIELDS = ['pathId', 'propKey', 'propValue', 'propLabel', 'propTypeCd', 'sortOrd', 'useYn', 'propRemark'];

    /* makeRow — 행 생성 */
    const makeRow = (p) => ({
      ...p,
      _row_status: 'N',
      _row_check:  false,
      _row_org: EDIT_FIELDS.reduce((acc, f) => { acc[f] = p[f]; return acc; }, {}),
    });

    /* reload — 재조회 */
    const reload = () => {
      rows.splice(0, rows.length, ..._rawProps.map(makeRow));
    };

    // 검색/조회 함수
    /* fetchData — 조회 */
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
          ...(typeFlt ? { propType: typeFlt }      : {}),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'pathId,propKey,propValue,propLabel';
        }
        const res = await boApiSvc.syProp.getPage(params, '속성관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        _rawProps.splice(0, _rawProps.length, ...list);
        reload();
      } catch (err) {
        console.error('[fetchData]', err);
      }
    };

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      fetchData('DEFAULT');
    });

    /* selectNode — 노드 선택 */
    const selectNode = (path) => { uiState.selectedPath = path; fetchData('DEFAULT'); };

    /* onCellChange — 셀 변경 */
    const onCellChange = (row) => {
      if (row._row_status === 'I' || row._row_status === 'D') return;
      const changed = EDIT_FIELDS.some(f => String(row[f]) !== String(row._row_org[f]));
      row._row_status = changed ? 'U' : 'N';
    };

    /* addRow — 행 추가 */
    const addRow = () => {
      rows.push({
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

    /* deleteChecked — 삭제 */
    const deleteChecked = () => {
      for (let i = rows.length - 1; i >= 0; i--) {
        if (!rows[i]._row_check) continue;
        if (rows[i]._row_status === 'I') rows.splice(i, 1);
        else rows[i]._row_status = 'D';
      }
    };

    /* cancelChecked — 선택 행 취소 */
    const cancelChecked = () => {
      const checked = rows.filter(r => r._row_check);
      if (!checked.length) { showToast('취소할 행을 선택해주세요.', 'info'); return; }
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        if (!row._row_check || row._row_status === 'N') continue;
        if (row._row_status === 'I') { rows.splice(i, 1); }
        else if (row._row_org) { EDIT_FIELDS.forEach(f => { row[f] = row._row_org[f]; }); row._row_status = 'N'; }
      }
    };

    /* 시스템 속성 저장 (BoGridCrud @save) */
    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================


    /* handleSave — 저장 */
    const handleSave = async () => {
      const dirty = rows.filter(r => ['I', 'U', 'D'].includes(r._row_status));
      if (dirty.length === 0) { showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await showConfirm('저장', `${dirty.length}건의 변경사항을 저장하시겠습니까?`);
      if (!ok) return;
      const saveRows = dirty.map(r => ({ ...r, rowStatus: r._row_status }));
      try {
        await boApiSvc.syProp.saveList(saveRows, '속성관리', '저장');
        showToast('저장되었습니다.', 'success');
        await fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* onReset — 초기화 */
    const onReset = () => {
      searchParam.searchValue = ''; searchParam.useFlt = ''; searchParam.typeFlt = '';
      uiState.selectedPath = '';
      reload();
    };

    /* exportCsv — CSV 내보내기 */
    const exportCsv = () => {
      const header = ['ID','표시경로','키','값','라벨','타입','정렬','사용','비고'];
      const lines = [header.join(',')];
      rows.filter(r => r._row_status !== 'D').forEach(r => {
        lines.push([r.propId, r.pathId, r.propKey, r.propValue, r.propLabel, r.propTypeCd, r.sortOrd, r.useYn, r.propRemark || '']
          .map(c => '"' + String(c).replace(/"/g,'""') + '"').join(','));
      });
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sy_prop.csv'; a.click();
      URL.revokeObjectURL(url);
    };

    /* BoGridCrud 컬럼 정의 (헤더는 label/style/cls 로 자동 생성, 특수셀은 #cell-{key} 슬롯 override) */
        // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================


        // --- [컬럼 정의] ---

        const baseSearchColumns = [
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

    const baseGridColumns = [
      { key: 'pathId',     label: '표시경로',  style: 'min-width:160px;', pathPick: 'sy_prop' },
      { key: 'propKey',    label: '키',        edit: 'text', mono: true },
      { key: 'propValue',  label: '값',        edit: 'text' },
      { key: 'propLabel',  label: '라벨',      edit: 'text' },
      { key: 'propTypeCd', label: '타입',      cls: 'col-id', edit: 'select', options: codes.prop_types.map(t => ({ value: t, label: t })) },
      { key: 'sortOrd',    label: '정렬',      cls: 'col-ord', edit: 'number' },
      { key: 'useYn',      label: '사용',      cls: 'col-use', edit: 'select', options: codes.use_yn },
      { key: 'propRemark', label: '비고',      edit: 'text' },
    ];

    // ===== return (템플릿 노출) ===============================================


    return {
      uiState, codes,
      searchParam,
      selectNode, rows, baseSearchColumns, baseGridColumns,
      fetchData,
      onCellChange, addRow, deleteChecked, cancelChecked, handleSave, onReset, exportCsv,
    };
  },

  template: /* html */`
<div>
  <!-- ===== ■. 페이지 타이틀 ================================================= -->
  <div class="page-title">프로퍼티관리</div>
  <!-- ===== ■. 검색 바 ==================================================== -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <bo-search-area @search="fetchData" @reset="onReset" :columns="baseSearchColumns" :param="searchParam" />
  </div>
  <!-- ===== ■. 좌 트리 + 우 그리드 ============================================ -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:flex-start;">
    <!-- ===== ■.■. 트리 ==================================================== -->
    <bo-path-tree-card biz-cd="sy_prop" title="표시경로" :show-biz-cd="true"
      :selected="uiState.selectedPath" @select="selectNode" />
    <!-- ===== ■.■. 그리드 (BoGridCrud) ====================================== -->
    <bo-grid-crud
      :columns="baseGridColumns" :rows="rows" row-key="propId"
      list-title="프로퍼티목록" :draggable="false"
      @add="addRow" @save="handleSave"
      @delete-checked="deleteChecked" @cancel-checked="cancelChecked"
      @cell-change="onCellChange">
      <template #row-actions="{ row }">
        <button v-if="['N','U'].includes(row._row_status)" class="btn btn-xs btn-danger" @click.stop="row._row_status='D'">삭제</button>
        <button v-else-if="row._row_status==='D'" class="btn btn-xs btn-secondary" @click.stop="row._row_status = row._row_org ? 'N' : 'I'">
          복원
        </button>
      </template>
    </bo-grid-crud>
  </div>
</div>
`,
};

/* -- 트리 노드 재귀 컴포넌트 -- */
window.PropTreeNode = {
  name: 'PropTreeNode',
  props: {
    node:     { type: Object, default: () => ({}) }, // 전달값
    expanded: { type: Boolean, default: false }, // 전달값
    selected: { type: Boolean, default: false }, // 전달값
    onToggle: { type: Function, default: () => {} }, // 콜백 함수
    onSelect: { type: Function, default: () => {} }, // 콜백 함수
    depth:    { type: Number, default: 0 }, // 전달값
  },
  template: /* html */`
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div :style="{display:'flex',alignItems:'center',gap:'4px',padding:'5px 6px',cursor:'pointer',borderRadius:'4px',
    paddingLeft: (8 + depth*14) + 'px',
    background: selected===node.path ? '#fff0f4' : 'transparent',
    color:      selected===node.path ? '#e8587a' : '#444',
    fontWeight: selected===node.path ? 700 : 400}"
    @mouseover="$event.currentTarget.style.background = selected===node.path ? '#fff0f4' : '#f8f9fb'"
    @mouseout="$event.currentTarget.style.background = selected===node.path ? '#fff0f4' : 'transparent'">
    <span v-if="node.children && node.children.length>0" style="width:14px;font-size:10px;color:#999;"
      @click.stop="onToggle(node.path)">
      {{ expanded.has(node.path) ? '▼' : '▶' }}
    </span>
    <span v-else style="width:14px;"></span>
    <span style="font-size:13px;flex:1;" @click="onSelect(node.path)">{{ node.name || '전체' }}</span>
    <span v-if="node._badge"
      :style="{fontSize:'9px',padding:'1px 5px',borderRadius:'7px',color:'#fff',fontWeight:700,background:node._badge[1]}">
      {{ node._badge[0] }}
    </span>
    <span style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 6px;border-radius:8px;">{{ node.count }}</span>
  </div>
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="expanded.has(node.path) && node.children.length>0">
    <bo-path-tree-node v-for="ch in node.children" :key="ch.path"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>
`,
};
