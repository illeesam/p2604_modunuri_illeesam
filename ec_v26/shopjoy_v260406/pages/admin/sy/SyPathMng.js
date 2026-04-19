/* ShopJoy Admin - 표시경로 관리 (sy_path) */
window.SyPathMng = {
  name: 'SyPathMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],

  setup(props) {
    const { ref, reactive, computed } = Vue;
    const ad = props.adminData || window.adminData;

    /* ── 검색 상태 ── */
    const kw       = ref('');
    const useFlt   = ref('');
    const bizFlt   = ref('');

    /* ── biz_cd 옵션 (공통코드 등록 항목) ── */
    const BIZ_OPTIONS = computed(() => ad.bizCdCodes || []);
    const bizLabel = (cd) => (BIZ_OPTIONS.value.find(b => b.codeValue === cd) || {}).codeLabel || cd;

    /* ── 데이터 로드 ── */
    const rows = reactive([]);
    let _newId = -1;
    const reload = () => {
      rows.splice(0, rows.length, ...(ad.paths || []).map(p => ({ ...p, _status: '' })));
    };
    reload();

    /* ── 트리 (선택된 biz_cd로 빌드) ── */
    const selectedBiz = ref('sy_brand');
    const selectedPathId = ref(null);

    const tree = computed(() => {
      const list = rows.filter(r => r._status !== 'D' && r.bizCd === selectedBiz.value);
      const byParent = {};
      list.forEach(r => {
        const pk = r.parentPathId == null ? 'null' : r.parentPathId;
        (byParent[pk] = byParent[pk] || []).push(r);
      });
      const build = (parentKey) => (byParent[parentKey] || [])
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ ...r, children: build(r.pathId) }));
      const root = { pathId: null, pathLabel: '전체 ('+ bizLabel(selectedBiz.value) +')', children: build('null'), count: list.length };
      return root;
    });

    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedPathId.value = id; };
    const expandAll = () => {
      expanded.clear(); expanded.add(null);
      const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); };
      walk(tree.value);
    };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    /* ── 그리드 (검색 + biz + 트리 선택 적용) ── */
    const gridRows = computed(() => {
      let arr = rows.filter(r => r._status !== 'D');
      arr = arr.filter(r => r.bizCd === selectedBiz.value);
      const k = kw.value.trim().toLowerCase();
      if (k) arr = arr.filter(r => (r.pathLabel||'').toLowerCase().includes(k) || (r.remark||'').toLowerCase().includes(k));
      if (useFlt.value) arr = arr.filter(r => r.useYn === useFlt.value);
      if (selectedPathId.value !== null) {
        /* 선택 노드와 그 하위 모두 */
        const descendants = new Set([selectedPathId.value]);
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
    const pager = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.value.length / pager.size)));
    const pageNums = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c-2), e = Math.min(l, s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage = n => { if (n>=1 && n<=totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const pagedRows = computed(() => { const s = (pager.page-1)*pager.size; return gridRows.value.slice(s, s+pager.size); });
    Vue.watch(() => gridRows.value.length, () => { if (pager.page > totalPages.value) pager.page = Math.max(1, totalPages.value); });
    Vue.watch(selectedBiz, () => { selectedPathId.value = null; pager.page = 1; });
    Vue.watch(selectedPathId, () => { pager.page = 1; });

    /* ── CRUD ── */
    const onChange = (row, field, val) => {
      row[field] = val;
      if (row._status === '') row._status = 'U';
    };
    const addRow = () => {
      rows.push(reactive({
        pathId: _newId--,
        bizCd: selectedBiz.value,
        parentPathId: selectedPathId.value,
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
      const orig = (ad.paths || []).find(p => p.pathId === row.pathId);
      if (orig) Object.assign(row, orig, { _status: '' });
    };
    const dirtyRows = computed(() => rows.filter(r => r._status));
    const save = async () => {
      if (!dirtyRows.value.length) { props.showToast('변경된 행이 없습니다.', 'warning'); return; }
      const ok = await props.showConfirm('저장', `${dirtyRows.value.length}건 저장하시겠습니까?`);
      if (!ok) return;
      const list = ad.paths || (ad.paths = []);
      dirtyRows.value.forEach(r => {
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
      props.showToast(`${dirtyRows.value.length}건 저장되었습니다.`, 'success');
      reload();
    };
    const reset = () => {
      kw.value = ''; useFlt.value = ''; selectedPathId.value = null;
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

      /* 3레벨까지 자동 펼치기 */
      const biz = row.bizCd;
      const exclude = row.pathId;
      const list = rows.filter(r => r._status !== 'D' && r.bizCd === biz && r.pathId !== exclude);
      const expanded = new Set([null]);

      /* 깊이 계산 및 3레벨까지 펼치기 */
      const getDepth = (pathId, depth = 0) => {
        if (depth <= 2) {
          expanded.add(pathId);
          list.filter(r => r.parentPathId === pathId).forEach(r => getDepth(r.pathId, depth + 1));
        }
      };
      list.filter(r => r.parentPathId == null).forEach(r => getDepth(r.pathId, 1));

      parentModalState.expanded = expanded;
      parentModalState.show = true;
    };
    const closeParentModal = () => { parentModalState.show = false; parentModalState.targetRow = null; };
    const selectParent = (pathId) => {
      if (parentModalState.targetRow) {
        onChange(parentModalState.targetRow, 'parentPathId', pathId);
      }
      closeParentModal();
    };
    const parentTree = computed(() => {
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
      kw, useFlt, bizFlt, BIZ_OPTIONS, bizLabel,
      selectedBiz, selectedPathId, tree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      gridRows, pagedRows, dirtyRows,
      pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange,
      onChange, addRow, delRow, cancelRow, save, reset, parentOptions,
      parentModalState, openParentModal, closeParentModal, selectParent, parentTree, toggleParentNode, getParentLabel,
    };
  },

  template: /* html */`
<div class="admin-wrap">
  <div class="page-title">표시경로</div>

  <!-- 검색 -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <div class="search-bar">
      <span class="search-label">업무코드 (biz_cd)</span>
      <select class="form-control" v-model="selectedBiz" style="width:200px;">
        <option v-for="b in BIZ_OPTIONS" :key="b.codeValue" :value="b.codeValue">{{ b.codeLabel }} ({{ b.codeValue }})</option>
      </select>
      <input class="form-control" v-model="kw" placeholder="라벨 / 비고 검색" style="min-width:200px;flex:1;max-width:320px;" />
      <select class="form-control" v-model="useFlt" style="width:130px;">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="reset">🔄 초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">

    <!-- 트리 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;">
        <span class="list-title" style="font-size:13px;">📂 {{ bizLabel(selectedBiz) }} 경로 트리</span>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree-node :node="tree" :expanded="expanded" :selected="selectedPathId"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <!-- CRUD 그리드 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <span class="list-title">
          <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
          경로 목록
          <span class="list-count">{{ gridRows.length }}건</span>
        </span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-blue btn-sm" @click="addRow">+ 행추가</button>
          <button class="btn btn-sm" @click="save" :disabled="dirtyRows.length===0"
            :style="dirtyRows.length>0 ? 'background:#e8587a;color:#fff;' : ''">
            저장 <span v-if="dirtyRows.length>0">({{ dirtyRows.length }})</span>
          </button>
        </div>
      </div>
      <table class="admin-table crud-grid">
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
          <tr v-if="pagedRows.length===0">
            <td colspan="9" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="r in pagedRows" :key="r.pathId" class="crud-row" :class="'status-' + (r._status || '')">
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
          <button :disabled="pager.page===1" @click="setPage(1)">«</button>
          <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
          <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
          <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
          <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
        </div>
        <div class="pager-right">
          <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
            <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
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
        <path-parent-selector :node="parentTree" :expanded="parentModalState.expanded" :on-toggle="toggleParentNode" :on-select="selectParent" :depth="0" />
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
