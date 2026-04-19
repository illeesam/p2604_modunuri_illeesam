/* ShopJoy Admin - 프로퍼티 관리 (좌측 트리 + 우측 CRUD 그리드) */
window.SyPropMng = {
  name: 'SyPropMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],

  setup(props) {
    /* ── 표시경로 선택 모달 (sy_path) ── */
    const pathPickModal = Vue.reactive({ show: false, row: null });
    const openPathPick = (row) => { pathPickModal.row = row; pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; pathPickModal.row = null; };
    const onPathPicked = (pathId) => {
      const row = pathPickModal.row;
      if (row) {
        row.pathId = pathId;
        if (row._row_status === 'N') row._row_status = 'U';
      }
    };
    const pathLabel = (id) => window.adminUtil.getPathLabel(id) || (id == null ? '' : ('#' + id));

    const { ref, reactive, computed, watch } = Vue;
    const ad = props.adminData || window.adminData;

    /* ── 검색 ── */
    const kw       = ref('');
    const useFlt   = ref('');
    const typeFlt  = ref('');
    const TYPES    = ['STRING','NUMBER','BOOLEAN','JSON'];

    /* ── 데이터 (작업 상태 포함) ── */
    const rows = reactive([]);
    const _newId = ref(-1);
    const reload = () => {
      rows.splice(0, rows.length, ...(ad.props || []).map(p => ({ ...p, _status: '' })));
    };
    reload();

    /* ── 사이트 필터 (공통필터 사이트와 동기화) ── */
    const siteId = computed(() => window.adminCommonFilter?.siteId || null);
    const filteredBySite = computed(() => {
      const sid = siteId.value;
      if (!sid) return rows;
      return rows.filter(r => r.siteId == sid || r.siteId == null);
    });

    /* ── 트리 구성 (disp_path 점 분리) ── */
    const tree = computed(() => window.adminUtil.buildPathTree('sy_prop'));

    /* ── 트리 펼침 상태 ── */
    const expanded = reactive(new Set(['']));
    const toggleNode = (path) => {
      if (expanded.has(path)) expanded.delete(path); else expanded.add(path);
    };
    const expandAll = () => {
      const walk = (n) => { expanded.add(n.path); n.children.forEach(walk); };
      walk(tree.value);
    };
    const collapseAll = () => { expanded.clear(); expanded.add(''); };
    /* _expand3: 기본 3레벨 펼침 */
    Vue.onMounted(() => {
      const initSet = window.adminUtil.collectExpandedToDepth(tree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    /* ── 선택 노드 ── */
    const selectedPath = ref('');
    const selectNode = (path) => { selectedPath.value = path; };

    /* ── 그리드에 표시할 행: 선택 노드의 path로 시작하는 모든 항목 ── */
    const gridRows = computed(() => {
      const sp = selectedPath.value;
      let arr = filteredBySite.value;
      if (sp) arr = arr.filter(r => (r.dispPath || '').startsWith(sp));
      const k = kw.value.trim().toLowerCase();
      if (k) arr = arr.filter(r =>
        (r.dispPath||'').toLowerCase().includes(k) ||
        (r.propKey||'').toLowerCase().includes(k) ||
        (r.propLabel||'').toLowerCase().includes(k) ||
        (r.propValue||'').toString().toLowerCase().includes(k)
      );
      if (useFlt.value)  arr = arr.filter(r => r.useYn === useFlt.value);
      if (typeFlt.value) arr = arr.filter(r => r.propType === typeFlt.value);
      return arr.filter(r => r._status !== 'D');
    });

    /* ── 페이징 ── */
    const pager = reactive({ page: 1, size: 20 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
    const totalPages = computed(() => Math.max(1, Math.ceil(gridRows.value.length / pager.size)));
    const pageNums   = computed(() => { const c = pager.page, l = totalPages.value; const s = Math.max(1, c - 2), e = Math.min(l, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); });
    const setPage    = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const pagedRows  = computed(() => { const s = (pager.page - 1) * pager.size; return gridRows.value.slice(s, s + pager.size); });
    watch(() => gridRows.value.length, () => { if (pager.page > totalPages.value) pager.page = Math.max(1, totalPages.value); });

    /* ── 행 변경 추적 ── */
    const onChange = (row, field, val) => {
      row[field] = val;
      if (row._status === '') row._status = 'U';
    };
    const addRow = () => {
      const newRow = reactive({
        propId: _newId.value--,
        siteId: siteId.value || 1,
        dispPath: selectedPath.value || 'new.prop',
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
        const orig = (ad.props || []).find(p => p.propId === row.propId);
        if (orig) Object.assign(row, orig, { _status: '' });
      }
    };
    const dirtyRows = computed(() =>
      rows.filter(r => r._status === 'I' || r._status === 'U' || r._status === 'D')
    );

    const save = async () => {
      if (dirtyRows.value.length === 0) {
        props.showToast('변경된 행이 없습니다.', 'warning');
        return;
      }
      const ok = await props.showConfirm('저장', `${dirtyRows.value.length}건의 변경사항을 저장하시겠습니까?`);
      if (!ok) return;
      // 실제 API 대신 로컬 반영
      const list = ad.props || [];
      dirtyRows.value.forEach(r => {
        if (r._status === 'I') {
          const newId = (list.reduce((m,x) => Math.max(m, x.propId), 0) || 0) + 1;
          const { _status, ...rest } = r;
          list.push({ ...rest, propId: newId });
          r.propId = newId;
        } else if (r._status === 'U') {
          const idx = list.findIndex(x => x.propId === r.propId);
          if (idx >= 0) {
            const { _status, ...rest } = r;
            list[idx] = { ...rest };
          }
        } else if (r._status === 'D') {
          const idx = list.findIndex(x => x.propId === r.propId);
          if (idx >= 0) list.splice(idx, 1);
        }
      });
      props.showToast(`${dirtyRows.value.length}건 저장되었습니다.`, 'success');
      reload();
    };

    const reset = () => {
      kw.value = ''; useFlt.value = ''; typeFlt.value = '';
      selectedPath.value = '';
      reload();
    };

    const exportCsv = () => {
      const header = ['ID','표시경로','키','값','라벨','타입','정렬','사용','비고'];
      const lines = [header.join(',')];
      gridRows.value.forEach(r => {
        lines.push([r.propId, r.dispPath, r.propKey, r.propValue, r.propLabel, r.propType, r.sortOrd, r.useYn, r.remark || '']
          .map(c => '"' + String(c).replace(/"/g,'""') + '"').join(','));
      });
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sy_prop.csv'; a.click();
      URL.revokeObjectURL(url);
    };

    return {
      pathPickModal, openPathPick, closePathPick, onPathPicked, pathLabel,
      kw, useFlt, typeFlt, TYPES, tree, expanded, toggleNode, expandAll, collapseAll,
      selectedPath, selectNode, gridRows, pagedRows, dirtyRows,
      pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange,
      onChange, addRow, delRow, cancelRow, save, reset, exportCsv,
    };
  },

  template: /* html */`
<div class="admin-wrap">
  <div class="page-title">프로퍼티관리</div>

  <!-- 검색 바 -->
  <div class="card" style="padding:12px;margin-bottom:12px;">
    <div class="search-bar">
      <input class="form-control" v-model="kw" placeholder="표시경로 / 키 / 값 / 라벨 검색" style="min-width:280px;flex:1;max-width:420px;">
      <select class="form-control" v-model="typeFlt" style="width:120px;">
        <option value="">전체 타입</option>
        <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
      <select class="form-control" v-model="useFlt" style="width:130px;">
        <option value="">사용여부 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary btn-sm" @click="exportCsv">📥 엑셀</button>
        <button class="btn btn-sm" @click="reset">🔄 초기화</button>
      </div>
    </div>
  </div>

  <!-- 좌 트리 + 우 그리드 -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:flex-start;">

    <!-- 트리 -->
    <div class="card" style="padding:12px;">
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <!-- 그리드 -->
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:10px;">
        <div class="list-title">
          <span v-if="selectedPath" style="color:#e8587a;font-family:monospace;">{{ selectedPath }}</span>
          <span v-else>전체</span>
          <span class="list-count">{{ gridRows.length }}건</span>
        </div>
        <div style="display:flex;gap:4px;">
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
          <tr v-if="pagedRows.length===0">
            <td colspan="10" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td>
          </tr>
          <tr v-for="r in pagedRows" :key="r.propId" class="crud-row" :class="'status-' + (r._status || '')">
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
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </td>
            <td><input class="grid-input grid-num" type="number" :value="r.sortOrd" @input="onChange(r,'sortOrd',Number($event.target.value))"></td>
            <td>
              <select class="grid-select" :value="r.useYn" @change="onChange(r,'useYn',$event.target.value)">
                <option value="Y">사용</option>
                <option value="N">미사용</option>
              </select>
            </td>
            <td><input class="grid-input" :value="r.remark" @input="onChange(r,'remark',$event.target.value)"></td>
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
    <prop-tree-node v-for="ch in node.children" :key="ch.path"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_prop"
    :value="pathPickModal.row ? pathPickModal.row.pathId : null"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
