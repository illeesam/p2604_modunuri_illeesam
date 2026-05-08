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

    const tree     = reactive({ pathId: null, pathLabel: '전체', children: [], count: 0 });
    const expanded = reactive(new Set([null]));
    const loading  = ref(false);

    const buildTree = (list, rootBizCd) => {
      const filtered = list.filter(p => p.useYn !== 'N');
      const byParent = {};
      filtered.forEach(p => {
        const k = p.parentPathId == null ? '__root__' : p.parentPathId;
        (byParent[k] = byParent[k] || []).push(p);
      });
      const build = (pk, inheritBizCd) => (byParent[pk] || [])
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(p => {
          const bizCd = p.bizCd || inheritBizCd || '';
          return { pathId: p.pathId, pathLabel: p.pathLabel, bizCd,
            children: build(p.pathId, bizCd), count: 0 };
        });
      const root = { pathId: null, pathLabel: '전체', children: build('__root__', rootBizCd || ''), count: 0 };
      const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
      recur(root);
      return root;
    };

    const initExpanded = (node, depth, maxDepth) => {
      if (depth > maxDepth) return;
      expanded.add(node.pathId);
      (node.children || []).forEach(ch => initExpanded(ch, depth + 1, maxDepth));
    };

    /* tree(reactive 객체)에 새 트리 통째 적용 — 키 4개를 in-place 갱신 */
    const fnApplyTree = (newTree) => {
      tree.pathId    = newTree.pathId;
      tree.pathLabel = newTree.pathLabel;
      tree.children  = newTree.children;
      tree.count     = newTree.count;
    };

    const load = async () => {
      if (_cache[props.bizCd]) {
        fnApplyTree(buildTree(_cache[props.bizCd], props.bizCd));
        expanded.clear();
        initExpanded(tree, 0, props.expandDepth);
        return;
      }
      loading.value = true;
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000, bizCd: props.bizCd }, '경로트리', '조회');
        const d = res.data?.data || {};
        const list = d.pageList || d.list || [];
        _cache[props.bizCd] = list;
        /* boUtil._boCmPaths 호환 — 기존 코드(pathLabel 등)가 읽을 수 있도록 병합 */
        window._boCmPaths = [...(window._boCmPaths || []).filter(p => p.bizCd !== props.bizCd), ...list];
        fnApplyTree(buildTree(list, props.bizCd));
        expanded.clear();
        initExpanded(tree, 0, props.expandDepth);
      } catch (e) {
        console.error('[PathTree] load error', e);
      } finally {
        loading.value = false;
      }
    };

    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { emit('select', id); };
    const expandAll  = () => { const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(tree); };
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
  methods: {
    onNodeHover(evt) {
      if (!evt || !evt.currentTarget) return;
      const isSel = (this.selected === this.node.pathId);
      evt.currentTarget.style.background = isSel ? '#fff0f4' : '#f8f9fb';
    },
    onNodeLeave(evt) {
      if (!evt || !evt.currentTarget) return;
      const isSel = (this.selected === this.node.pathId);
      evt.currentTarget.style.background = isSel ? '#fff0f4' : 'transparent';
    },
  },
  template: /* html */`
<div>
  <div @click="onSelect(node.pathId)"
    :style="{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 6px', cursor:'pointer', borderRadius:'4px',
              paddingLeft: (8 + depth*14) + 'px',
              background: selected===node.pathId ? '#fff0f4' : 'transparent',
              color:      selected===node.pathId ? '#e8587a' : '#444',
              fontWeight: selected===node.pathId ? 700 : 400 }"
    @mouseover="onNodeHover($event)"
    @mouseout="onNodeLeave($event)">
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

/* ── CategoryTree — 카테고리 트리 패널 & 피커 모달 ──────────────────────────
 * mode="tree"   — 좌측 패널 트리 (PdCategoryMng, PdCategoryProdMng)
 *   props: selected(categoryId), onSelect(id), showCount(fn)
 *   emits: select(categoryId | null)
 *
 * mode="picker" — 카테고리 선택 모달 (PdProdDtl)
 *   props: show(bool), excludeIds(Set<string>)
 *   emits: select(cat), close
 *
 * 공통: API에서 카테고리 목록을 자체 조회 (boApiSvc.pdCategory.getPage)
 *       전체펼치기/닫기, 검색(picker), depth 색상/기호 내장
 * ──────────────────────────────────────────────────────────────────────── */
window.CategoryTree = {
  name: 'CategoryTree',
  props: {
    mode:       { type: String,   default: 'tree' },   // 'tree' | 'picker'
    selected:   { default: null },                      // tree mode: 선택된 categoryId
    showCount:  { type: Function, default: null },      // tree mode: 카운트 표시 fn(categoryId)→number
    show:       { type: Boolean,  default: false },     // picker mode: 모달 표시
    excludeIds: { type: Object,   default: () => new Set() }, // picker mode: 제외할 categoryId Set
    siteId:     { type: String,   default: null },      // 사이트 ID (없으면 boCommonFilter.siteId 사용)
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // siteId별로 캐시 분리 (사이트 전환 시 즉시 정확한 트리 표시)
    const _cacheStore = (window._categoryTreeCache = window._categoryTreeCache || { list: null, bySite: {} });
    const cfSiteId = computed(() => props.siteId || (window.boCommonFilter && window.boCommonFilter.siteId) || null);

    const categories = reactive([]);
    const expandedSet = reactive(new Set());
    const loading = ref(false);
    const pickerSearch = ref('');

    const DEPTH_COLOR  = d => ({0:'#e8587a', 1:'#1677ff', 2:'#3ba87a'}[d] || '#999');
    const DEPTH_BULLET = d => ['●','○','▪'][d] || '·';

    const load = async () => {
      const key = cfSiteId.value || '__all__';
      const cached = _cacheStore.bySite[key];
      if (cached) {
        categories.splice(0, categories.length, ...cached);
        _initExpanded();
        return;
      }
      loading.value = true;
      try {
        const params = { pageNo: 1, pageSize: 10000 };
        if (cfSiteId.value) params.siteId = cfSiteId.value;
        const res = await boApiSvc.pdCategory.getPage(params, '카테고리', '조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        _cacheStore.bySite[key] = list;
        _cacheStore.list = list; // 호환용 (저장 후 부모가 list=null 로 전체 무효화하는 패턴 유지)
        categories.splice(0, categories.length, ...list);
        _initExpanded();
      } catch (e) {
        console.error('[CategoryTree] load error', e);
      } finally {
        loading.value = false;
      }
    };

    // siteId 변경 시 재로드
    watch(cfSiteId, () => { load(); });

    const _initExpanded = () => {
      expandedSet.clear();
      categories.filter(c => c.categoryDepth === 1).forEach(c => expandedSet.add(c.categoryId));
    };

    const cfTreeFlat = computed(() => {
      const _ = expandedSet;
      const map = {};
      categories.forEach(c => { map[c.categoryId] = { ...c, _children: [] }; });
      categories.forEach(c => { if (c.parentCategoryId && map[c.parentCategoryId]) map[c.parentCategoryId]._children.push(map[c.categoryId]); });
      const roots = categories.filter(c => !c.parentCategoryId).map(c => map[c.categoryId]).sort((a, b) => (a.sortOrd||0)-(b.sortOrd||0));
      const result = [];
      const traverse = (node, depth) => {
        result.push({ ...node, _depth: depth, _hasChildren: node._children.length > 0 });
        if (expandedSet.has(node.categoryId))
          [...node._children].sort((a,b)=>(a.sortOrd||0)-(b.sortOrd||0)).forEach(c => traverse(c, depth+1));
      };
      roots.forEach(r => traverse(r, 0));
      return result;
    });

    const cfPickerList = computed(() => {
      const q = pickerSearch.value.trim().toLowerCase();
      return categories.filter(c => {
        if (props.excludeIds?.has(String(c.categoryId))) return false;
        if (!q) return true;
        return (c.categoryNm||'').toLowerCase().includes(q);
      }).sort((a,b) => (a.categoryDepth||1)-(b.categoryDepth||1));
    });

    const toggleNode  = id => { if (expandedSet.has(id)) expandedSet.delete(id); else expandedSet.add(id); };
    const expandAll   = () => { expandedSet.clear(); categories.forEach(c => expandedSet.add(c.categoryId)); };
    const collapseAll = () => { expandedSet.clear(); };
    const onSelect    = id => emit('select', id);
    const onClose     = ()  => { pickerSearch.value = ''; emit('close'); };
    const onPickerSelect = cat => { pickerSearch.value = ''; emit('select', cat); };

    // picker: show 될 때마다 검색어 초기화
    watch(() => props.show, v => { if (v) pickerSearch.value = ''; });

    onMounted(load);

    return { loading, categories, cfTreeFlat, cfPickerList, expandedSet, pickerSearch,
             toggleNode, expandAll, collapseAll, onSelect, onClose, onPickerSelect,
             DEPTH_COLOR, DEPTH_BULLET };
  },
  template: /* html */`
<template v-if="mode==='tree'">
  <div v-if="loading" style="font-size:11px;color:#aaa;padding:12px;text-align:center;">로딩중...</div>
  <template v-else>
    <div style="display:flex;gap:4px;margin-bottom:8px">
      <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
      <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
    </div>
    <!-- 전체 루트 항목 -->
    <div style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px;margin-bottom:2px"
         :style="{ background: selected===null ? '#fce4ec' : 'transparent',
                   color:      selected===null ? '#e8587a' : '#555',
                   fontWeight: selected===null ? 700 : 500,
                   borderLeft: selected===null ? '3px solid #e8587a' : '3px solid transparent' }"
         @click="onSelect(null)">
      <span style="width:14px;flex-shrink:0"></span>
      <span style="font-size:11px;font-weight:700;color:#e8587a;margin-right:4px">★</span>
      <span style="font-size:12px">전체</span>
    </div>
    <div v-for="cat in cfTreeFlat" :key="cat.categoryId"
         style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px"
         :style="{ paddingLeft:(cat._depth*14+6)+'px',
                   background: selected===cat.categoryId ? '#fce4ec' : 'transparent',
                   color:      selected===cat.categoryId ? '#e8587a' : '#333',
                   fontWeight: selected===cat.categoryId ? 600 : 400,
                   borderLeft: selected===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
         @click="onSelect(cat.categoryId)">
      <span v-if="cat._hasChildren"
            style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
            @click.stop="toggleNode(cat.categoryId)">{{ expandedSet.has(cat.categoryId) ? '▼' : '▶' }}</span>
      <span v-else style="width:14px;flex-shrink:0"></span>
      <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR(cat._depth), marginRight:'4px' }">{{ DEPTH_BULLET(cat._depth) }}</span>
      <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ cat.categoryNm }}</span>
      <span v-if="showCount && showCount(cat.categoryId) > 0"
            style="font-size:10px;background:#1677ff;color:#fff;border-radius:8px;padding:0 5px;flex-shrink:0">
        {{ showCount(cat.categoryId) }}
      </span>
      <span v-if="cat.categoryStatusCd==='INACTIVE'" style="font-size:10px;color:#bbb;margin-left:4px">(비활성)</span>
    </div>
    <div v-if="!cfTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
  </template>
</template>
<teleport v-else-if="mode==='picker'" to="body">
  <div v-if="show" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;" @click.self="onClose">
    <div style="background:#fff;border-radius:12px;width:420px;max-height:520px;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;background:linear-gradient(135deg,#fff0f4,#ffe4ec);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:700;font-size:15px;">카테고리 선택</span>
        <button type="button" @click="onClose" style="border:none;background:none;font-size:18px;cursor:pointer;color:#888;">✕</button>
      </div>
      <div style="padding:8px 12px;">
        <input class="form-control" v-model="pickerSearch" placeholder="카테고리 검색..." style="font-size:13px;" />
      </div>
      <div style="overflow-y:auto;flex:1;padding:4px 8px 12px;">
        <!-- 검색어 없음: 트리 뷰 -->
        <template v-if="!pickerSearch.trim()">
          <div v-if="loading" style="text-align:center;color:#aaa;padding:24px;font-size:13px;">로딩중...</div>
          <template v-else>
            <div style="display:flex;gap:4px;margin:0 4px 6px">
              <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="expandAll">▼ 전체</button>
              <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="collapseAll">▶ 닫기</button>
            </div>
            <div v-for="cat in cfTreeFlat" :key="cat.categoryId"
                 style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px"
                 :style="{ paddingLeft:(cat._depth*14+6)+'px',
                           opacity: excludeIds && excludeIds.has(String(cat.categoryId)) ? 0.35 : 1,
                           pointerEvents: excludeIds && excludeIds.has(String(cat.categoryId)) ? 'none' : 'auto' }"
                 @mouseover="$event.currentTarget.style.background='#fce4ec'"
                 @mouseout="$event.currentTarget.style.background=''"
                 @click="onPickerSelect(cat)">
              <span v-if="cat._hasChildren"
                    style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
                    @click.stop="toggleNode(cat.categoryId)">{{ expandedSet.has(cat.categoryId) ? '▼' : '▶' }}</span>
              <span v-else style="width:14px;flex-shrink:0"></span>
              <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR(cat._depth), marginRight:'4px' }">{{ DEPTH_BULLET(cat._depth) }}</span>
              <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ cat.categoryNm }}</span>
              <span v-if="cat.categoryStatusCd==='INACTIVE'" style="font-size:10px;color:#bbb;margin-left:4px">(비활성)</span>
            </div>
            <div v-if="!cfTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">카테고리 없음</div>
          </template>
        </template>
        <!-- 검색어 있음: flat 필터 목록 -->
        <template v-else>
          <div v-if="cfPickerList.length===0" style="text-align:center;color:#aaa;padding:24px;font-size:13px;">검색 결과 없음</div>
          <div v-for="cat in cfPickerList" :key="cat.categoryId"
               @click="onPickerSelect(cat)"
               style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px;padding:6px 10px;"
               :style="{ opacity: excludeIds && excludeIds.has(String(cat.categoryId)) ? 0.35 : 1,
                         pointerEvents: excludeIds && excludeIds.has(String(cat.categoryId)) ? 'none' : 'auto' }"
               @mouseover="$event.currentTarget.style.background='#fce4ec'"
               @mouseout="$event.currentTarget.style.background=''">
            <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR((cat.categoryDepth||1)-1) }">{{ DEPTH_BULLET((cat.categoryDepth||1)-1) }}</span>
            <span style="font-size:12px">{{ cat.categoryNm }}</span>
            <span style="font-size:10px;color:#bbb;margin-left:auto">{{ ['','대','중','소'][cat.categoryDepth||1]||'' }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</teleport>`,
};

/* ── BoPager — 관리자 공통 페이지네이션 ────────────────────────────────────
 * props:
 *   pager        — { pageNo, pageTotalPage, pageNums, pageSize, pageSizes } (reactive)
 *   onSetPage    — (n) => void  페이지 이동
 *   onSizeChange — () => void   pageSize 변경
 * 사용:
 *   <bo-pager :pager="pager" :on-set-page="setPage" :on-size-change="onSizeChange" />
 * ──────────────────────────────────────────────────────────────────────── */
window.BoPager = {
  name: 'BoPager',
  props: {
    pager:        { type: Object,   default: () => ({ pageNo: 1, pageTotalPage: 1, pageNums: [1], pageSize: 20, pageSizes: [10, 20, 50, 100] }) },
    onSetPage:    { type: Function, default: () => {} },
    onSizeChange: { type: Function, default: () => {} },
  },
  template: /* html */`
<div v-if="pager" class="pagination">
  <div></div>
  <div class="pager">
    <button :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
    <button :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
    <button v-for="n in (pager.pageNums||[])" :key="n" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
    <button :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
    <button :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
  </div>
  <div class="pager-right">
    <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
      <option v-for="s in (pager.pageSizes||[])" :key="s" :value="s">{{ s }}개</option>
    </select>
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
