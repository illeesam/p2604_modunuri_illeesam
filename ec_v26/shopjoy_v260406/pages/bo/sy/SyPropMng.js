/* ShopJoy Admin - 프로퍼티 관리 (좌측 트리 + 우측 CRUD 그리드) */
window.SyPropMng = {
  name: 'SyPropMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],

  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const uiState = reactive({ isPageCodeLoad: false, _newId: -1, selectedPath: ''});
    const codes = reactive({ use_yn: [], prop_types: ['STRING','NUMBER','BOOLEAN','JSON'] });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.use_yn = codeStore.snGetGrpCodes('USE_YN') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    const cfSiteId = computed(() => boCommonFilter?.siteId || null);

    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    /* ── 검색 ── */
    const searchParam = reactive({ kw: '', useFlt: '', typeFlt: '' });

    /* ── 데이터 (작업 상태 포함) ── */
    const rows = reactive([]);
    const _rawProps = reactive([]); // 원본 데이터 (cancelRow 복원용)
    const reload = () => {
      rows.splice(0, rows.length, ..._rawProps.map(p => ({ ...p, _status: '' })));
    };

    // 검색/조회 함수
    const fetchData = async (searchType = 'DEFAULT') => {
      try {
        const { kw, useFlt, typeFlt } = searchParam;
        const params = {
          pageNo: 1, pageSize: 10000,
          ...(cfSiteId.value          ? { siteId: cfSiteId.value }       : {}),
          ...(uiState.selectedPath    ? { pathId: uiState.selectedPath } : {}),
          ...(kw      ? { kw }                    : {}),
          ...(useFlt  ? { useYn: useFlt }         : {}),
          ...(typeFlt ? { propType: typeFlt }      : {}),
        };
        const res = await boApiSvc.syProp.getPage(params, '속성관리', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        _rawProps.splice(0, _rawProps.length, ...list);
        reload();
      } catch (err) {
        console.error('[fetchData]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      fetchData('DEFAULT');
    });

    /* ── 선택 노드 ── */
    const selectNode = (path) => { uiState.selectedPath = path; fetchData('DEFAULT'); };

    /* ── 그리드에 표시할 행: 삭제 표시 제외 ── */
    const cfGridRows = computed(() => rows.filter(r => r._status !== 'D'));


    /* ── 행 변경 추적 ── */
    const onChange = (row, field, val) => {
      row[field] = val;
      if (row._status === '') row._status = 'U';
    };
    const addRow = () => {
      const newRow = reactive({
        propId: uiState._newId--,
        siteId: cfSiteId.value || 1,
        pathId: uiState.selectedPath || 'new.prop',
        propKey: 'new_key',
        propLabel: '신규 프로퍼티',
        propValue: '',
        propType: 'STRING',
        sortOrd: 99,
        useYn: 'Y',
        remark: '',
        _status: 'I',
      });
      rows.push(newRow);
    };
    const delRow = (row) => {
      if (row._status === 'I') {
        const idx = rows.findIndex(r => r.propId === row.propId); if (idx !== -1) rows.splice(idx, 1);
      } else {
        row._status = row._status === 'D' ? '' : 'D';
      }
    };
    const cancelRow = (row) => {
      if (row._status === 'I') {
        const idx = rows.findIndex(r => r.propId === row.propId); if (idx !== -1) rows.splice(idx, 1);
      } else {
        // 원본으로 복원 (간단 구현: reload 권장)
        const orig = _rawProps.find(p => p.propId === row.propId);
        if (orig) Object.assign(row, orig, { _status: '' });
      }
    };
    const cfDirtyRows = computed(() =>
      rows.filter(r => r._status === 'I' || r._status === 'U' || r._status === 'D')
    );

    const handleSave = async () => {
      if (cfDirtyRows.value.length === 0) {
        props.showToast('변경된 행이 없습니다.', 'warning');
        return;
      }
      const ok = await props.showConfirm('저장', `${cfDirtyRows.value.length}건의 변경사항을 저장하시겠습니까?`);
      if (!ok) return;
      const saveRows = cfDirtyRows.value.map(r => ({ ...r, rowStatus: r._status }));
      try {
        await boApiSvc.syProp.saveList(saveRows, '속성관리', '저장');
        props.showToast('저장되었습니다.', 'success');
        await fetchData();
      } catch (err) {
        props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    const onReset = () => {
      searchParam.kw = ''; searchParam.useFlt = ''; searchParam.typeFlt = '';
      uiState.selectedPath = '';
      reload();
    };

    const exportCsv = () => {
      const header = ['ID','표시경로','키','값','라벨','타입','정렬','사용','비고'];
      const lines = [header.join(',')];
      cfGridRows.value.forEach(r => {
        lines.push([r.propId, r.pathId, r.propKey, r.propValue, r.propLabel, r.propType, r.sortOrd, r.useYn, r.remark || '']
          .map(c => '"' + String(c).replace(/"/g,'""') + '"').join(','));
      });
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sy_prop.csv'; a.click();
      URL.revokeObjectURL(url);
    };

    // ── return ───────────────────────────────────────────────────────────────

    return {
      uiState, codes,
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      searchParam,
      selectNode, cfGridRows, cfDirtyRows,
      fetchData,
      onChange, addRow, delRow, cancelRow, handleSave, onReset, exportCsv,
    };
  },

  template: /* html */`
<div>
  <div class="page-title">프로퍼티관리</div>

  <!-- ── 검색 바 ─────────────────────────────────────────────────────────── -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <div class="search-bar">
      <input class="form-control" v-model="searchParam.kw" placeholder="표시경로 / 키 / 값 / 라벨 검색" style="min-width:280px;flex:1;max-width:420px;" @keyup.enter="fetchData">
      <select class="form-control" v-model="searchParam.typeFlt" style="width:120px;">
        <option value="">전체 타입</option>
        <option v-for="t in codes.prop_types" :key="t" :value="t">{{ t }}</option>
      </select>
      <select class="form-control" v-model="searchParam.useFlt" style="width:130px;">
        <option value="">사용여부 전체</option>
        <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="fetchData">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
        <button class="btn btn-sm" @click="exportCsv">📥 엑셀</button>
      </div>
    </div>
  </div>

  <!-- ── 좌 트리 + 우 그리드 ─────────────────────────────────────────────────── -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:flex-start;">

    <!-- ── 트리 ─────────────────────────────────────────────────────────── -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_prop</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="sy_prop" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>

    <!-- ── 그리드 ────────────────────────────────────────────────────────── -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <div class="list-title">
          <span v-if="uiState.selectedPath" style="color:#e8587a;font-family:monospace;">{{ uiState.selectedPath }}</span>
          <span v-else>전체</span>
          <span class="list-count">{{ cfGridRows.length }}건</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-blue btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-sm" @click="handleSave" :disabled="cfDirtyRows.length===0"
            :style="cfDirtyRows.length>0 ? 'background:#e8587a;color:#fff;' : ''">
            저장 <span v-if="cfDirtyRows.length>0">({{ cfDirtyRows.length }})</span>
          </button>
        </div>
      </div>
      <div style="max-height:480px;overflow-y:auto;">
      <table class="bo-table crud-grid">
        <thead>
          <tr>
            <th style="width:36px;text-align:center;">번호</th>
            <th class="col-status">상태</th>
            <th>표시경로</th>
            <th>키</th>
            <th>값</th>
            <th>라벨</th>
            <th class="col-id">타입</th>
            <th class="col-ord">정렬</th>
            <th class="col-use">사용</th>
            <th>비고</th>
            <th class="col-act-delete">삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cfGridRows.length===0">
            <td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="(r, idx) in cfGridRows" :key="r.propId" class="crud-row" :class="'status-' + (r._status || '')">
            <td style="text-align:center;font-size:11px;color:#999;">{{ idx + 1 }}</td>
            <td class="col-status-val">
              <span v-if="r._status==='I'" class="badge badge-green badge-xs">신규</span>
              <span v-else-if="r._status==='U'" class="badge badge-orange badge-xs">수정</span>
              <span v-else-if="r._status==='D'" class="badge badge-red badge-xs">삭제</span>
              <span v-else class="badge badge-gray badge-xs">{{ r.propId }}</span>
            </td>
            <td>
              <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',background:'#f5f5f7',color: r.pathId != null ? '#374151' : '#9ca3af',fontWeight: r.pathId != null ? 600 : 400,display:'flex',alignItems:'center',gap:'6px'}">
                <span style="flex:1;">{{ pathLabel(r.pathId) || '경로 선택...' }}</span>
                <button type="button" @click="openPathPick(r)" title="표시경로 선택"
                  :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0'}"
                  @mouseover="$event.currentTarget.style.background='#eef2ff'"
                  @mouseout="$event.currentTarget.style.background='#fff'">🔍</button>
              </div>
            </td>
            <td><input class="grid-input grid-mono" :value="r.propKey" @input="onChange(r,'propKey',$event.target.value)"></td>
            <td><input class="grid-input" :value="r.propValue" @input="onChange(r,'propValue',$event.target.value)"></td>
            <td><input class="grid-input" :value="r.propLabel" @input="onChange(r,'propLabel',$event.target.value)"></td>
            <td>
              <select class="grid-select" :value="r.propType" @change="onChange(r,'propType',$event.target.value)">
                <option v-for="t in codes.prop_types" :key="t" :value="t">{{ t }}</option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" :value="r.sortOrd" @input="onChange(r,'sortOrd',Number($event.target.value))"></td>
            <td>
              <select class="grid-select" :value="r.useYn" @change="onChange(r,'useYn',$event.target.value)">
                <option v-for="o in codes.use_yn" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
              </select>
            </td>
            <td><input class="grid-input" :value="r.remark" @input="onChange(r,'remark',$event.target.value)"></td>
            <td class="col-act-delete-val">
              <button class="btn btn-xs btn-danger" @click="delRow(r)">{{ r._status==='D' ? '복원' : '삭제' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</div>
`,
};

/* ── 트리 노드 재귀 컴포넌트 ── */
window.PropTreeNode = {
  name: 'PropTreeNode',
  props: ['node', 'expanded', 'selected', 'onToggle', 'onSelect', 'depth'],
  template: /* html */`
<div>
  <div :style="{display:'flex',alignItems:'center',gap:'4px',padding:'5px 6px',cursor:'pointer',borderRadius:'4px',
             paddingLeft: (8 + depth*14) + 'px',
             background: selected===node.path ? '#fff0f4' : 'transparent',
             color:      selected===node.path ? '#e8587a' : '#444',
             fontWeight: selected===node.path ? 700 : 400}"
    @mouseover="$event.currentTarget.style.background = selected===node.path ? '#fff0f4' : '#f8f9fb'"
    @mouseout="$event.currentTarget.style.background = selected===node.path ? '#fff0f4' : 'transparent'">
    <span v-if="node.children && node.children.length>0" style="width:14px;font-size:10px;color:#999;"
      @click.stop="onToggle(node.path)">{{ expanded.has(node.path) ? '▼' : '▶' }}</span>
    <span v-else style="width:14px;"></span>
    <span style="font-size:13px;flex:1;" @click="onSelect(node.path)">{{ node.name || '전체' }}</span>
    <span v-if="node._badge"
      :style="{fontSize:'9px',padding:'1px 5px',borderRadius:'7px',color:'#fff',fontWeight:700,background:node._badge[1]}">{{ node._badge[0] }}</span>
    <span style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 6px;border-radius:8px;">{{ node.count }}</span>
  </div>
  <div v-if="expanded.has(node.path) && node.children.length>0">
    <path-tree-node v-for="ch in node.children" :key="ch.path"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>
`,
};
