/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],

  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const uiState = reactive({ isPageCodeLoad: false, selectedBiz: 'sy_brand', selectedPathId: null});
    const codes = reactive({});

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });

    /* ── 검색 상태 ── */
    const searchParam = reactive({ kw: '', useFlt: '', bizFlt: '' });

    /* ── biz_cd 옵션 (공통코드 등록 항목) ── */
    const BIZ_OPTIONS = reactive([]);
    const bizLabel = (cd) => {
      return (BIZ_OPTIONS.find(b => b.codeValue === cd) || {}).codeLabel || cd;
    };

    /* ── 데이터 로드 ── */
    const rows = reactive([]);
    const _rawPaths = reactive([]); // 원본 데이터 (cancelRow/save용)
    let _newId = -1;
    const reload = () => {
      rows.splice(0, rows.length, ..._rawPaths.map(p => ({ ...p, _status: '' })));
    };

    // onMounted에서 API 로드
    const handleFetchData = async () => {
      try {
        const [pathRes, codeRes] = await Promise.all([
          window.boApi.get('/bo/sy/path/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/sy/code/page', { params: { pageNo: 1, pageSize: 10000, codeGrp: 'BIZ_CD' } }),
        ]);
        const pathList = pathRes.data?.data?.list || [];
        const codeList = codeRes.data?.data?.list || [];
        _rawPaths.splice(0, _rawPaths.length, ...pathList);
        BIZ_OPTIONS.splice(0, BIZ_OPTIONS.length, ...codeList);
        reload();
      } catch (err) {
        console.error('[catch-info]', err);
        console.warn('[SyPathMng] data load failed', err);
        if (props.showToast) props.showToast('표시경로 데이터 로드 실패', 'error');
      }
    };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes(); handleFetchData(); });

    /* ── 트리 (선택된 biz_cd로 빌드) ── */
        
    const cfTree = computed(() => {
      const list = rows.filter(r => r._status !== 'D' && r.bizCd === uiState.selectedBiz);
      const byParent = {};
      list.forEach(r => {
        const pk = r.parentPathId == null ? 'null' : r.parentPathId;
        (byParent[pk] = byParent[pk] || []).push(r);
      });
      const build = (parentKey) => (byParent[parentKey] || [])
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ ...r, children: build(r.pathId) }));
      const root = { pathId: null, pathLabel: '전체 ('+ bizLabel(uiState.selectedBiz) +')', children: build('null'), count: list.length };
      return root;
    });

    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPathId = id; };
    const expandAll = () => {
      expanded.clear(); expanded.add(null);
      const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); };
      walk(cfTree.value);
    };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* ── 그리드 (검색 + biz + 트리 선택 적용) ── */
    const cfGridRows = computed(() => {
      let arr = rows.filter(r => r._status !== 'D');
      arr = arr.filter(r => r.bizCd === uiState.selectedBiz);
      const k = searchParam.kw.trim().toLowerCase();
      if (k) arr = arr.filter(r => (r.pathLabel||'').toLowerCase().includes(k) || (r.remark||'').toLowerCase().includes(k));
      if (searchParam.useFlt) arr = arr.filter(r => r.useYn === searchParam.useFlt);
      if (uiState.selectedPathId !== null) {
        /* 선택 노드와 그 하위 모두 */
        const descendants = new Set([uiState.selectedPathId]);
        let added = true;
        while (added) {
          added = false;
          rows.forEach(r => {
            if (descendants.has(r.parentPathId) && !descendants.has(r.pathId)) {
              descendants.add(r.pathId); added = true;
            }
          });
        }
        arr = arr.filter(r => descendants.has(r.pathId));
      }
      return arr;
    });

    /* ── 페이징 ── */
    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
const cfTotalPages = computed(() => Math.max(1, Math.ceil(cfGridRows.value.length / pager.pageSize)));
    const cfPageNums = computed(() => { const c = pager.pageNo, l = pager.pageTotalPage; const s = Math.max(1, c-2), e = Math.min(l, s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage = n => { if (n>=1 && n<=pager.pageTotalPage) pager.pageNo = n; };
    const onSizeChange = () => { pager.pageNo = 1; };
    const cfPagedRows = computed(() => { const s = (pager.pageNo-1)*pager.pageSize; return cfGridRows.value.slice(s, s+pager.pageSize); });
    watch(() => cfGridRows.value.length, () => { if (pager.pageNo > pager.pageTotalPage) pager.pageNo = Math.max(1, pager.pageTotalPage); });
    watch(() => uiState.selectedBiz, () => { uiState.selectedPathId = null; pager.pageNo = 1; });
    watch(() => uiState.selectedPathId, () => { pager.pageNo = 1; });

    /* ── CRUD ── */
    const onChange = (row, field, val) => {
      row[field] = val;
      if (row._status === '') row._status = 'U';
    };
    const addRow = () => {
      rows.push(reactive({
        pathId: _newId--,
        bizCd: uiState.selectedBiz,
        parentPathId: uiState.selectedPathId,
        pathLabel: '신규경로',
        sortOrd: 99,
        useYn: 'Y',
        remark: '',
        _status: 'I',
      }));
    };
    const delRow = (row) => {
      if (row._status === 'I') {
        const idx = rows.findIndex(r => r.pathId === row.pathId); if (idx !== -1) rows.splice(idx, 1);
      } else {
        row._status = row._status === 'D' ? '' : 'D';
      }
    };
    const cancelRow = (row) => {
      if (row._status === 'I') { const idx = rows.findIndex(r => r.pathId === row.pathId); if (idx !== -1) rows.splice(idx, 1); return; }
      const orig = _rawPaths.find(p => p.pathId === row.pathId);
      if (orig) Object.assign(row, orig, { _status: '' });
    };
    const cfDirtyRows = computed(() => rows.filter(r => r._status));
    const handleSave = async () => {
      if (!cfDirtyRows.value.length) { props.showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await props.showConfirm('저장', `${cfDirtyRows.value.length}건 저장하시겠습니까?`);
      if (!ok) return;
      const list = _rawPaths;
      cfDirtyRows.value.forEach(r => {
        if (r._status === 'I') {
          const newId = (list.reduce((m,x)=>Math.max(m,x.pathId), 0) || 0) + 1;
          const { _status, ...rest } = r;
          list.push({ ...rest, pathId: newId });
          r.pathId = newId;
        } else if (r._status === 'U') {
          const idx = list.findIndex(x => x.pathId === r.pathId);
          if (idx >= 0) { const { _status, ...rest } = r; list[idx] = rest; }
        } else if (r._status === 'D') {
          const idx = list.findIndex(x => x.pathId === r.pathId);
          if (idx >= 0) list.splice(idx, 1);
        }
      });
      props.showToast(`${cfDirtyRows.value.length}건 저장되었습니다.`, 'success');
      reload();
    };
    const onReset = () => {
      searchParam.kw = ''; searchParam.useFlt = ''; uiState.selectedPathId = null;
      reload();
    };

    /* 부모 경로 선택 옵션 (같은 biz_cd, 자기 자신 제외) */
    const parentOptions = (row) => rows
      .filter(r => r._status !== 'D' && r.bizCd === row.bizCd && r.pathId !== row.pathId)
      .map(r => ({ value: r.pathId, label: r.pathLabel }));

    /* 부모경로 선택 모달 */
    const parentModalState = reactive({ show: false, targetRow: null, bizCd: '', expanded: new Set([null]) });
    const openParentModal = (row) => {
      parentModalState.targetRow = row;
      parentModalState.bizCd = row.bizCd;

      /* 3레벨까지 자동 펼치기 — reactive Set은 교체 대신 clear/add로 갱신 */
      const biz = row.bizCd;
      const exclude = row.pathId;
      const list = rows.filter(r => r._status !== 'D' && r.bizCd === biz && r.pathId !== exclude);
      parentModalState.expanded.clear();
      parentModalState.expanded.add(null);

      const getDepth = (pathId, depth = 0) => {
        if (depth <= 2) {
          parentModalState.expanded.add(pathId);
          list.filter(r => r.parentPathId === pathId).forEach(r => getDepth(r.pathId, depth + 1));
        }
      };
      list.filter(r => r.parentPathId == null).forEach(r => getDepth(r.pathId, 1));

      parentModalState.show = true;
    };
    const closeParentModal = () => { parentModalState.show = false; parentModalState.targetRow = null; };
    const selectParent = (pathId) => {
      if (parentModalState.targetRow) {
        onChange(parentModalState.targetRow, 'parentPathId', pathId);
      }
      closeParentModal();
    };
    const cfParentTree = computed(() => {
      const biz = parentModalState.bizCd;
      const exclude = parentModalState.targetRow?.pathId;
      const list = rows.filter(r => r._status !== 'D' && r.bizCd === biz && r.pathId !== exclude);
      const byParent = {};
      list.forEach(r => {
        const pk = r.parentPathId == null ? 'null' : r.parentPathId;
        (byParent[pk] = byParent[pk] || []).push(r);
      });
      const build = (parentKey) => (byParent[parentKey] || [])
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ ...r, children: build(r.pathId) }));
      const root = { pathId: null, pathLabel: '전체 ('+ bizLabel(biz) +')', children: build('null') };
      return root;
    });
    const toggleParentNode = (id) => {
      if (parentModalState.expanded.has(id)) parentModalState.expanded.delete(id);
      else parentModalState.expanded.add(id);
    };
    const getParentLabel = (pathId) => {
      if (pathId == null) return '(루트)';
      const r = rows.find(x => x.pathId === pathId);
      return r ? r.pathLabel : '';
    };

    return {
      uiState, codes,
      searchParam, BIZ_OPTIONS, bizLabel,
      cfTree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      cfGridRows, cfPagedRows, cfDirtyRows,
      pager, pager.pageSizes, cfTotalPages, cfPageNums, setPage, onSizeChange,
      onChange, addRow, delRow, cancelRow, handleSave, onReset, parentOptions,
      parentModalState, openParentModal, closeParentModal, selectParent, cfParentTree, toggleParentNode, getParentLabel,
    };
  },

  template: /* html */`
<div class="bo-wrap">
  <div class="page-title">표시경로</div>

  <!-- 검색 -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <div class="search-bar">
      <span class="search-label">업무코드 (biz_cd)</span>
      <select class="form-control" v-model="uiState.selectedBiz" style="width:200px;">
        <option v-for="b in BIZ_OPTIONS" :key="b.codeValue" :value="b.codeValue">{{ b.codeLabel }} ({{ b.codeValue }})</option>
      </select>
      <input class="form-control" v-model="searchParam.kw" placeholder="라벨 / 비고 검색" style="min-width:200px;flex:1;max-width:320px;" />
      <select class="form-control" v-model="searchParam.useFlt" style="width:130px;">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="fetchData">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">

    <!-- 트리 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">📂 {{ bizLabel(uiState.selectedBiz) }} 경로 트리</span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPathId"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <!-- CRUD 그리드 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          경로 목록
          <span class="list-count">{{ cfGridRows.length }}건</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-sm" @click="handleSave" :disabled="cfDirtyRows.length===0"
            :style="cfDirtyRows.length>0 ? 'background:#e8587a;color:#fff;' : ''">
            저장 <span v-if="cfDirtyRows.length>0">({{ cfDirtyRows.length }})</span>
          </button>
        </div>
      </div>
      <table class="bo-table crud-grid">
        <thead>
          <tr>
            <th class="col-status">상태</th>
            <th class="col-id">ID</th>
            <th>업무코드</th>
            <th>부모경로</th>
            <th>경로 라벨</th>
            <th class="col-ord">정렬</th>
            <th class="col-use">사용</th>
            <th>비고</th>
            <th class="col-act-delete">삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cfPagedRows.length===0">
            <td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="r in cfPagedRows" :key="r.pathId" class="crud-row" :class="'status-' + (r._status || '')">
            <td class="col-status-val">
              <span v-if="r._status==='I'" class="badge badge-green badge-xs">신규</span>
              <span v-else-if="r._status==='U'" class="badge badge-orange badge-xs">수정</span>
              <span v-else-if="r._status==='D'" class="badge badge-red badge-xs">삭제</span>
              <span v-else class="badge badge-gray badge-xs">N</span>
            </td>
            <td class="col-id-val">{{ r.pathId > 0 ? r.pathId : 'NEW' }}</td>
            <td>
              <select class="grid-select grid-mono" :value="r.bizCd" @change="onChange(r,'bizCd',$event.target.value)">
                <option v-for="b in BIZ_OPTIONS" :key="b.codeValue" :value="b.codeValue">{{ b.codeValue }}</option>
              </select>
            </td>
            <td>
              <button class="btn btn-sm" @click="openParentModal(r)"
                style="font-size:11px;background:#e3f2fd;border:1px solid #90caf9;color:#1565c0;">
                {{ getParentLabel(r.parentPathId) }} ▼
              </button>
            </td>
            <td><input class="grid-input" :value="r.pathLabel" @input="onChange(r,'pathLabel',$event.target.value)" /></td>
            <td><input class="grid-input grid-num" type="number" :value="r.sortOrd" @input="onChange(r,'sortOrd',Number($event.target.value))" /></td>
            <td>
              <select class="grid-select" :value="r.useYn" @change="onChange(r,'useYn',$event.target.value)">
                <option value="Y">사용</option>
                <option value="N">미사용</option>
              </select>
            </td>
            <td><input class="grid-input" :value="r.remark" @input="onChange(r,'remark',$event.target.value)" /></td>
            <td class="col-act-delete-val">
              <button class="btn btn-xs btn-danger" @click="delRow(r)">{{ r._status==='D' ? '복원' : '삭제' }}</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <div></div>
        <div class="pager">
          <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
          <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
          <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
          <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(pager.pageNo+1)">›</button>
          <button :disabled="pager.pageNo===cfTotalPages" @click="setPage(cfTotalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
            <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- 부모경로 선택 모달 -->
  <div v-if="parentModalState.show" class="modal-overlay" @click.self="closeParentModal">
    <div class="modal-box" style="max-width:400px;">
      <div class="modal-header">
        <span class="modal-title">부모경로 선택 ({{ bizLabel(parentModalState.bizCd) }})</span>
        <span class="modal-close" @click="closeParentModal">×</span>
      </div>
      <div style="padding:12px;max-height:60vh;overflow-y:auto;">
        <div style="margin-bottom:8px;">
          <button class="btn btn-sm" @click="(() => {
            const biz = parentModalState.bizCd;
            const exclude = parentModalState.targetRow?.pathId;
            const list = rows.filter(r => r._status !== 'D' && r.bizCd === biz && r.pathId !== exclude);
            parentModalState.expanded.clear();
            parentModalState.expanded.add(null);
            list.forEach(r => parentModalState.expanded.add(r.pathId));
          })()"
            style="margin-right:4px;font-size:11px;">▼ 전체펼치기</button>
          <button class="btn btn-sm" @click="parentModalState.expanded.clear(); parentModalState.expanded.add(null);"
            style="font-size:11px;">▶ 전체닫기</button>
        </div>
        <path-parent-selector :node="cfParentTree" :expanded="parentModalState.expanded" :on-toggle="toggleParentNode" :on-select="selectParent" :depth="0" />
      </div>
    </div>
  </div>
</div>
`,
};

/* ── 경로 트리 노드 (재귀) ── */
window.PathTreeNode = {
  name: 'PathTreeNode',
  props: ['node', 'expanded', 'selected', 'onToggle', 'onSelect', 'depth'],
  template: /* html */`
<div>
  <div @click="onSelect(node.pathId); onToggle(node.pathId)"
    :style="{display:'flex',alignItems:'center',gap:'4px',padding:'5px 6px',cursor:'pointer',borderRadius:'4px',
             paddingLeft: (8 + depth*14) + 'px',
             background: selected===node.pathId ? '#fff0f4' : 'transparent',
             color:      selected===node.pathId ? '#e8587a' : '#444',
             fontWeight: selected===node.pathId ? 700 : 400}"
    @mouseover="$event.currentTarget.style.background = selected===node.pathId ? '#fff0f4' : '#f8f9fb'"
    @mouseout="$event.currentTarget.style.background = selected===node.pathId ? '#fff0f4' : 'transparent'">
    <span v-if="(node.children||[]).length>0" style="width:14px;font-size:10px;color:#999;">{{ expanded.has(node.pathId) ? '▼' : '▶' }}</span>
    <span v-else style="width:14px;"></span>
    <span style="font-size:13px;flex:1;">{{ node.pathLabel || '(이름없음)' }}</span>
    <span v-if="node.count != null" style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 6px;border-radius:8px;">{{ node.count }}</span>
  </div>
  <div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
    <path-tree-node v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>
`,
};

/* ── 부모경로 선택 노드 (재귀) ── */
window.PathParentSelector = {
  name: 'PathParentSelector',
  props: ['node', 'expanded', 'onToggle', 'onSelect', 'depth'],
  template: /* html */`
<div>
  <div @click="onSelect(node.pathId)"
    :style="{display:'flex',alignItems:'center',gap:'4px',padding:'6px 8px',cursor:'pointer',borderRadius:'4px',
             paddingLeft: (6 + depth*14) + 'px',
             background: 'transparent',
             color: '#444',
             fontWeight: 400}"
    @mouseover="$event.currentTarget.style.background = '#f0f2f5'"
    @mouseout="$event.currentTarget.style.background = 'transparent'">
    <span v-if="(node.children||[]).length>0" @click.stop="onToggle(node.pathId)"
      style="width:16px;font-size:11px;color:#666;cursor:pointer;font-weight:700;">
      {{ expanded.has(node.pathId) ? '▼' : '▶' }}
    </span>
    <span v-else style="width:16px;"></span>
    <span style="flex:1;">{{ node.pathLabel || '(이름없음)' }}</span>
  </div>
  <div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
    <path-parent-selector v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>
`,
};
