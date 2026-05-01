/**
 * BoComp.js — 관리자 공통 UI 컴포넌트
 *
 * PathTree           — bizCd 기반 경로 트리 컨테이너 (API 조회 + 상태 관리 자급자족)
 *                      bizCd별 캐시 관리, 전체펼치기/닫기 슬롯 포함
 *                      emit: select(pathId)
 *                      사용: <path-tree biz-cd="sy_brand" :show-biz-cd="true" @select="fn" />
 *
 * PathTreeNode       — sy_path 트리 재귀 노드 (PathTree 내부 + 직접 사용 가능)
 *                      showBizCd prop으로 #bizCd 표시 제어
 *
 * PathParentSelector — 부모경로 선택 모달용 재귀 노드
 */

/* ── PathTree 컨테이너 ────────────────────────────────────────────────────
 * props:
 *   bizCd      — string  필수. 조회할 업무코드 (예: 'sy_brand')
 *   selected   — pathId  현재 선택값 (v-model 없이 단방향)
 *   showBizCd  — boolean 노드에 #bizCd 표시 (기본 false)
 *   expandDepth — number 초기 펼침 깊이 (기본 2)
 * emits:
 *   select(pathId)  노드 클릭 시 (null = 전체)
 * ──────────────────────────────────────────────────────────────────────── */
window.PathTree = {
  name: 'PathTree',
  props: {
    bizCd:       { type: String,  required: true },
    selected:    { default: null },
    showBizCd:   { type: Boolean, default: false },
    expandDepth: { type: Number,  default: 2 },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const _cache = (window._pathTreeCache = window._pathTreeCache || {});

    const tree     = ref({ pathId: null, pathLabel: '전체', children: [], count: 0 });
    const expanded = reactive(new Set([null]));
    const loading  = ref(false);

    const buildTree = (list) => {
      const filtered = list.filter(p => p.useYn !== 'N');
      const byParent = {};
      filtered.forEach(p => {
        const k = p.parentPathId == null ? '__root__' : p.parentPathId;
        (byParent[k] = byParent[k] || []).push(p);
      });
      const build = (pk) => (byParent[pk] || [])
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(p => ({
          pathId: p.pathId, pathLabel: p.pathLabel, bizCd: p.bizCd || '',
          children: build(p.pathId), count: 0,
        }));
      const root = { pathId: null, pathLabel: '전체', children: build('__root__'), count: 0 };
      const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
      recur(root);
      return root;
    };

    const initExpanded = (node, depth, maxDepth) => {
      if (depth > maxDepth) return;
      expanded.add(node.pathId);
      (node.children || []).forEach(ch => initExpanded(ch, depth + 1, maxDepth));
    };

    const load = async () => {
      if (_cache[props.bizCd]) {
        tree.value = buildTree(_cache[props.bizCd]);
        expanded.clear();
        initExpanded(tree.value, 0, props.expandDepth);
        return;
      }
      loading.value = true;
      try {
        const res = await boApi.get('/bo/sy/path/page', {
          params: { pageNo: 1, pageSize: 10000, bizCd: props.bizCd },
          ...coUtil.apiHdr('경로트리', '조회'),
        });
        const d = res.data?.data || {};
        const list = d.pageList || d.list || [];
        _cache[props.bizCd] = list;
        /* boUtil._boCmPaths 호환 — 기존 코드(pathLabel 등)가 읽을 수 있도록 병합 */
        window._boCmPaths = [...(window._boCmPaths || []).filter(p => p.bizCd !== props.bizCd), ...list];
        tree.value = buildTree(list);
        expanded.clear();
        initExpanded(tree.value, 0, props.expandDepth);
      } catch (e) {
        console.error('[PathTree] load error', e);
      } finally {
        loading.value = false;
      }
    };

    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { emit('select', id); };
    const expandAll  = () => { const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(tree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    watch(() => props.bizCd, () => { delete _cache[props.bizCd]; load(); });
    onMounted(load);

    return { tree, expanded, loading, toggleNode, selectNode, expandAll, collapseAll };
  },
  template: /* html */`
<div>
  <div style="display:flex;gap:4px;margin-bottom:8px;">
    <button class="btn btn-sm" @click="expandAll"  style="flex:1;font-size:11px;">▼ 전체펼치기</button>
    <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
  </div>
  <div v-if="loading" style="font-size:11px;color:#aaa;padding:8px;text-align:center;">로딩중...</div>
  <path-tree-node v-else
    :node="tree" :expanded="expanded" :selected="selected"
    :on-toggle="toggleNode" :on-select="selectNode"
    :depth="0" :show-biz-cd="showBizCd" />
</div>`,
};

/* ── PathTreeNode 재귀 노드 ────────────────────────────────────────────────
 * PathTree 내부용이지만 직접 사용도 가능 (기존 호환 유지)
 * props: node, expanded, selected, onToggle, onSelect, depth, showBizCd
 * ──────────────────────────────────────────────────────────────────────── */
window.PathTreeNode = {
  name: 'PathTreeNode',
  props: {
    node:      { type: Object,   required: true },
    expanded:  { type: Object,   required: true },
    selected:  { default: null },
    onToggle:  { type: Function, required: true },
    onSelect:  { type: Function, required: true },
    depth:     { type: Number,   default: 0 },
    showBizCd: { type: Boolean,  default: false },
  },
  template: /* html */`
<div>
  <div @click="onSelect(node.pathId)"
    :style="{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 6px', cursor:'pointer', borderRadius:'4px',
              paddingLeft: (8 + depth*14) + 'px',
              background: selected===node.pathId ? '#fff0f4' : 'transparent',
              color:      selected===node.pathId ? '#e8587a' : '#444',
              fontWeight: selected===node.pathId ? 700 : 400 }"
    @mouseover="$event.currentTarget.style.background = selected===node.pathId ? '#fff0f4' : '#f8f9fb'"
    @mouseout="$event.currentTarget.style.background = selected===node.pathId ? '#fff0f4' : 'transparent'">
    <span v-if="(node.children||[]).length>0" style="width:14px;font-size:10px;color:#999;flex-shrink:0"
          @click.stop="onToggle(node.pathId)">{{ expanded.has(node.pathId) ? '▼' : '▶' }}</span>
    <span v-else style="width:14px;flex-shrink:0"></span>
    <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ node.pathLabel || '(이름없음)' }}</span>
    <span v-if="showBizCd && node.bizCd" style="font-size:9px;color:#aaa;font-family:monospace;flex-shrink:0;margin-left:2px;">#{{ node.bizCd }}</span>
    <span v-if="node.count != null" style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 5px;border-radius:8px;flex-shrink:0;">{{ node.count }}</span>
  </div>
  <div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
    <path-tree-node v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" :show-biz-cd="showBizCd" />
  </div>
</div>`,
};

/* ── PathParentSelector 재귀 노드 ──────────────────────────────────────── */
window.PathParentSelector = {
  name: 'PathParentSelector',
  props: ['node', 'expanded', 'onToggle', 'onSelect', 'depth'],
  template: /* html */`
<div>
  <div @click="onSelect(node.pathId)"
    :style="{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 8px', cursor:'pointer', borderRadius:'4px',
              paddingLeft: (12 + depth*14) + 'px' }"
    @mouseover="$event.currentTarget.style.background='#f0f2f5'"
    @mouseout="$event.currentTarget.style.background='transparent'">
    <span v-if="(node.children||[]).length>0" style="width:16px;font-size:11px;color:#666;font-weight:700"
          @click.stop="onToggle(node.pathId)">{{ expanded.has(node.pathId) ? '▼' : '▶' }}</span>
    <span v-else style="width:16px"></span>
    <span style="flex:1;font-size:13px;">{{ node.pathLabel || '(이름없음)' }}</span>
  </div>
  <div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
    <path-parent-selector v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>`,
};
