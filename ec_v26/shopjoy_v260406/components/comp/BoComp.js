/**
 * BoComp.js — 관리자 공통 UI 컴포넌트
 *
 * ※ BoComp.js 컴포넌트는 모두 'Bo' prefix / 'bo-' 태그를 사용한다.
 *
 * BoPathTree           — bizCd 기반 경로 트리 컨테이너 (API 조회 + 상태 관리 자급자족)
 *                        bizCd별 캐시 관리, 전체펼치기/닫기 슬롯 포함
 *                        emit: select(pathId)
 *                        사용: <bo-path-tree biz-cd="sy_brand" :show-biz-cd="true" @select="fn" />
 *
 * BoPathTreeNode       — sy_path 트리 재귀 노드 (BoPathTree 내부 + 직접 사용 가능)
 *                        showBizCd prop으로 #bizCd 표시 제어
 *
 * BoPathParentSelector — 부모경로 선택 모달용 재귀 노드
 *
 * BoCategoryTree       — 카테고리 트리 패널 & 피커 모달 (mode="tree" | "picker")
 *
 * BoPager              — 관리자 공통 페이지네이션
 *
 * BoMultiCheckSelect   — 다중 선택 드롭다운 (체크박스 + ',' 구분 String v-model)
 *                        v-model 은 토큰 콤마결합 문자열 (예: "memberId,memberNm")
 *                        options: [{value, label}, ...] 또는 [{codeValue, codeLabel}, ...]
 *                        사용: <bo-multi-check-select v-model="searchType" :options="opts" placeholder="전체" />
 *
 * BoDateTimePicker     — 일자 + 시분 선택 공통 컴포넌트 (date input + time input + 현재 버튼)
 *                        v-model 은 단일 datetime 문자열 'YYYY-MM-DDTHH:mm' (기존 datetime-local 호환)
 *                        사용: <bo-date-time-picker v-model="form.sendDate" />
 *                              <bo-date-time-picker v-model="form.saleStartDate" :readonly="ro" placeholder-date="즉시" />
 */

/* ── BoPathTree 컨테이너 ──────────────────────────────────────────────────
 * props:
 *   bizCd      — string  필수. 조회할 업무코드 (예: 'sy_brand')
 *   selected   — pathId  현재 선택값 (v-model 없이 단방향)
 *   showBizCd  — boolean 노드에 #bizCd 표시 (기본 false)
 *   expandDepth — number 초기 펼침 깊이 (기본 2)
 * emits:
 *   select(pathId)  노드 클릭 시 (null = 전체)
 * ──────────────────────────────────────────────────────────────────────── */
window.BoPathTree = {
  name: 'BoPathTree',
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

    /* buildTree */
    const buildTree = (list, rootBizCd) => {
      const filtered = list.filter(p => p.useYn !== 'N');
      const byParent = {};
      filtered.forEach(p => {
        const k = p.parentPathId == null ? '__root__' : p.parentPathId;
        (byParent[k] = byParent[k] || []).push(p);
      });

      /* build */
      const build = (pk, inheritBizCd) => (byParent[pk] || [])
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(p => {
          const bizCd = p.bizCd || inheritBizCd || '';
          return { pathId: p.pathId, pathLabel: p.pathLabel, bizCd,
            children: build(p.pathId, bizCd), count: 0 };
        });
      const root = { pathId: null, pathLabel: '전체', children: build('__root__', rootBizCd || ''), count: 0 };

      /* recur */
      const recur = (n) => { n.count = (n.children || []).reduce((s, c) => s + recur(c) + 1, 0); return n.count; };
      recur(root);
      return root;
    };

    /* initExpanded */
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

    /* load */
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

    /* toggleNode */
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };

    /* selectNode */
    const selectNode = (id) => { emit('select', id); };

    /* expandAll */
    const expandAll  = () => { const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(tree); };

    /* collapseAll */
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
  <bo-path-tree-node v-else
    :node="tree" :expanded="expanded" :selected="selected"
    :on-toggle="toggleNode" :on-select="selectNode"
    :depth="0" :show-biz-cd="showBizCd" />
</div>`,
};

/* ── BoPathTreeNode 재귀 노드 ──────────────────────────────────────────────
 * BoPathTree 내부용이지만 직접 사용도 가능 (기존 호환 유지)
 * props: node, expanded, selected, onToggle, onSelect, depth, showBizCd
 * ──────────────────────────────────────────────────────────────────────── */
window.BoPathTreeNode = {
  name: 'BoPathTreeNode',
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
    <bo-path-tree-node v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" :show-biz-cd="showBizCd" />
  </div>
</div>`,
};

/* ── BoCategoryTree — 카테고리 트리 패널 & 피커 모달 ────────────────────────
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
window.BoCategoryTree = {
  name: 'BoCategoryTree',
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

    /* DEPTH_COLOR */
    const DEPTH_COLOR  = d => ({0:'#e8587a', 1:'#1677ff', 2:'#3ba87a'}[d] || '#999');

    /* DEPTH_BULLET */
    const DEPTH_BULLET = d => ['●','○','▪'][d] || '·';

    /* load */
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

    /* _initExpanded */
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

      /* traverse */
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

    /* toggleNode */
    const toggleNode  = id => { if (expandedSet.has(id)) expandedSet.delete(id); else expandedSet.add(id); };

    /* expandAll */
    const expandAll   = () => { expandedSet.clear(); categories.forEach(c => expandedSet.add(c.categoryId)); };

    /* collapseAll */
    const collapseAll = () => { expandedSet.clear(); };

    /* onSelect */
    const onSelect    = id => emit('select', id);

    /* onClose */
    const onClose     = ()  => { pickerSearch.value = ''; emit('close'); };

    /* onPickerSelect */
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

/* ── BoPathParentSelector 재귀 노드 ────────────────────────────────────── */
window.BoPathParentSelector = {
  name: 'BoPathParentSelector',
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
    <bo-path-parent-selector v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
  </div>
</div>`,
};

/* ── BoMultiCheckSelect ──────────────────────────────────────────────────
 * 다중 선택 드롭다운 (체크박스). v-model 은 콤마(,) 결합 문자열.
 *
 * props:
 *   modelValue       — string. 콤마 결합값 예: "memberId,memberNm"
 *   options          — array. [{value, label}] 또는 [{codeValue, codeLabel}]
 *   placeholder      — string. 선택값 없을 때 표시 (기본 '전체')
 *   allLabel         — string. '전체' 토글 라벨 (기본 '전체')
 *   showAll          — boolean. '전체' 옵션 노출 (기본 true)
 *   minWidth         — string. 트리거 최소 너비 (기본 '160px')
 *   disabled         — boolean.
 *
 * v-model 동작:
 *   - 모든 옵션 체크 → 빈 문자열 '' (= 전체)  ※ showAll=true 일 때
 *   - 일부 체크 → "value1,value2" 콤마 결합
 *   - 체크 없음 → '' (= 전체)
 *
 * 표시 라벨:
 *   - 빈값 → placeholder
 *   - 1~2개 → "라벨1, 라벨2"
 *   - 3개 이상 → "라벨1 외 N개"
 * ──────────────────────────────────────────────────────────────────────── */
window.BoMultiCheckSelect = {
  name: 'BoMultiCheckSelect',
  props: {
    modelValue:  { type: String,  default: '' },
    options:     { type: Array,   required: true },
    placeholder: { type: String,  default: '전체' },
    allLabel:    { type: String,  default: '전체' },
    showAll:     { type: Boolean, default: true },
    minWidth:    { type: String,  default: '160px' },
    disabled:    { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onBeforeUnmount } = Vue;
    const open = ref(false);
    const rootRef = ref(null);

    const cfNorm = computed(() =>
      (props.options || []).map(o => ({
        value: o.value != null ? o.value : o.codeValue,
        label: o.label != null ? o.label : o.codeLabel,
      })).filter(o => o.value != null)
    );

    const cfSelected = computed(() => {
      const raw = (props.modelValue || '').toString().trim();
      if (!raw) return new Set(cfNorm.value.map(o => o.value));
      return new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
    });

    const cfIsAll = computed(() => {
      const sel = cfSelected.value;
      return cfNorm.value.length > 0 && cfNorm.value.every(o => sel.has(o.value));
    });

    const cfDisplay = computed(() => {
      if (cfIsAll.value) return props.placeholder;
      const sel = cfSelected.value;
      const labels = cfNorm.value.filter(o => sel.has(o.value)).map(o => o.label);
      if (labels.length === 0) return props.placeholder;
      if (labels.length <= 2) return labels.join(', ');
      return labels[0] + ' 외 ' + (labels.length - 1) + '개';
    });

    /* emitFromSet */
    const emitFromSet = (set) => {
      if (cfNorm.value.every(o => set.has(o.value))) emit('update:modelValue', '');
      else emit('update:modelValue', cfNorm.value.filter(o => set.has(o.value)).map(o => o.value).join(','));
    };

    /* onToggle */
    const onToggle = () => { if (!props.disabled) open.value = !open.value; };

    /* onClickOption */
    const onClickOption = (val) => {
      const set = new Set(cfSelected.value);
      if (set.has(val)) set.delete(val); else set.add(val);
      emitFromSet(set);
    };

    /* onClickAll */
    const onClickAll = () => {
      if (cfIsAll.value) emit('update:modelValue', cfNorm.value[0]?.value || '');
      else emit('update:modelValue', '');
    };

    /* onDocClick */
    const onDocClick = (e) => {
      if (!rootRef.value) return;
      if (!rootRef.value.contains(e.target)) open.value = false;
    };
    onMounted(() => document.addEventListener('mousedown', onDocClick));
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));

    return { open, rootRef, cfNorm, cfSelected, cfIsAll, cfDisplay, onToggle, onClickOption, onClickAll };
  },
  template: /* html */`
<div ref="rootRef" class="multi-check-select" :style="'position:relative;display:inline-block;min-width:'+minWidth">
  <div @click="onToggle"
       :style="'border:1px solid #d4d4d8;border-radius:6px;padding:6px 28px 6px 10px;background:'+(disabled?'#f5f5f5':'#fff')+';cursor:'+(disabled?'not-allowed':'pointer')+';font-size:13px;color:#333;position:relative;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'">
    {{ cfDisplay }}
    <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#888;font-size:10px;">▼</span>
  </div>
  <div v-if="open"
       style="position:absolute;top:calc(100% + 4px);left:0;min-width:100%;max-height:280px;overflow-y:auto;background:#fff;border:1px solid #d4d4d8;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.08);z-index:1000;padding:6px 0;">
    <label v-if="showAll" style="display:flex;align-items:center;gap:6px;padding:6px 10px;font-size:13px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-weight:600;">
      <input type="checkbox" :checked="cfIsAll" @change="onClickAll" />
      <span>{{ allLabel }}</span>
    </label>
    <label v-for="o in cfNorm" :key="o.value"
           style="display:flex;align-items:center;gap:6px;padding:6px 10px;font-size:13px;cursor:pointer;"
           @mouseenter="$event.currentTarget.style.background='#f9fafb'"
           @mouseleave="$event.currentTarget.style.background='transparent'">
      <input type="checkbox" :checked="cfSelected.has(o.value)" @change="onClickOption(o.value)" />
      <span>{{ o.label }}</span>
    </label>
  </div>
</div>`,
};

/* ── BoDateTimePicker — 일자 + 시분 선택 공통 컴포넌트 ─────────────────────
 * 일자(type=date) 와 시분(type=time) input 을 한 쌍으로 묶는다.
 * 두 가지 바인딩 모드를 지원한다.
 *
 *  ① 단일 모드 (권장 / 기본) — 외부로 단일 datetime 문자열 노출
 *     <bo-date-time-picker v-model="form.sendDate" />
 *     v-model 값: 'YYYY-MM-DDTHH:mm' (기존 input type="datetime-local" 호환)
 *
 *  ② 분리 모드 — 날짜 필드와 시분 필드가 이미 분리된 기존 화면용
 *     <bo-date-time-picker v-model:date="row.startDate" v-model:time="row.startTime" />
 *     date='YYYY-MM-DD', time='HH:mm' 두 값을 각각 양방향 바인딩
 *     (date / time prop 중 하나라도 바인딩되면 분리 모드로 동작)
 *
 * props:
 *   modelValue  — string. ① 단일 모드 'YYYY-MM-DDTHH:mm' (빈값=미설정)
 *   date        — string. ② 분리 모드 날짜 'YYYY-MM-DD'
 *   time        — string. ② 분리 모드 시분 'HH:mm'
 *   splitMode   — boolean. true 로 분리 모드 강제 (기본: date/time prop 사용 시 자동)
 *   readonly    — boolean. 읽기전용 (input disabled, 현재/지움 버튼 숨김)
 *   showNow     — boolean. '현재' 버튼 노출 (기본 true)
 *   showClear   — boolean. '지움' 버튼 노출 (기본 true)
 *   defaultTime — string.  날짜만 선택했을 때 채울 기본 시각 (기본 '00:00')
 *   placeholderDate — string. 값 없을 때 우측 안내문구 (예: '즉시', '무기한')
 *   dateWidth   — string.  날짜 input 너비 (기본 '150px')
 *   timeWidth   — string.  시분 input 너비 (기본 '110px')
 *   inputClass  — string.  input 에 적용할 클래스 (기본 'form-control')
 *
 * emits:
 *   update:modelValue(str)  ① 'YYYY-MM-DDTHH:mm' (둘 다 비면 '')
 *   update:date(str)        ② 'YYYY-MM-DD' (비면 '')
 *   update:time(str)        ② 'HH:mm' (비면 '')
 * ──────────────────────────────────────────────────────────────────────── */
window.BoDateTimePicker = {
  name: 'BoDateTimePicker',
  props: {
    modelValue:      { type: String,  default: '' },
    date:            { type: String,  default: null },
    time:            { type: String,  default: null },
    splitMode:       { type: Boolean, default: false },
    readonly:        { type: Boolean, default: false },
    showNow:         { type: Boolean, default: true },
    showClear:       { type: Boolean, default: true },
    defaultTime:     { type: String,  default: '00:00' },
    placeholderDate: { type: String,  default: '' },
    dateWidth:       { type: String,  default: '150px' },
    timeWidth:       { type: String,  default: '110px' },
    inputClass:      { type: String,  default: 'form-control' },
  },
  emits: ['update:modelValue', 'update:date', 'update:time'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* 분리 모드 여부 — date/time prop 이 바인딩됐거나 splitMode 강제 시 */
    const cfSplit = computed(() => props.splitMode || props.date != null || props.time != null);

    /* 화면 표시용 날짜/시분 — 모드별 소스 분기 */
    const cfParts = computed(() => {
      if (cfSplit.value) {
        return { date: (props.date || '').trim(), time: (props.time || '').trim().slice(0, 5) };
      }
      const raw = (props.modelValue || '').toString().trim();
      if (!raw) return { date: '', time: '' };
      const sep = raw.includes('T') ? 'T' : ' ';
      const [d = '', t = ''] = raw.split(sep);
      return { date: d.trim(), time: (t || '').trim().slice(0, 5) };
    });

    /* 날짜/시분 확정값 emit — 모드별 분기 */
    const emitParts = (date, time) => {
      if (cfSplit.value) {
        emit('update:date', date || '');
        emit('update:time', time || '');
        return;
      }
      if (!date && !time) { emit('update:modelValue', ''); return; }
      const d = date || new Date().toISOString().slice(0, 10);
      const t = time || props.defaultTime || '00:00';
      emit('update:modelValue', d + 'T' + t);
    };

    /* onDateChange */
    const onDateChange = (e) => emitParts(e.target.value, cfParts.value.time);

    /* onTimeChange */
    const onTimeChange = (e) => emitParts(cfParts.value.date, e.target.value);

    /* onNow — 현재 일시로 채움 */
    const onNow = () => {
      const now = new Date();
      emitParts(now.toISOString().slice(0, 10), now.toTimeString().slice(0, 5));
    };

    /* onClear */
    const onClear = () => emitParts('', '');

    /* inputClass 가 비면 최소 테두리 스타일을 인라인으로 보강 */
    const cfBaseStyle = computed(() =>
      props.inputClass ? '' : 'font-size:11px;padding:3px 7px;border:1px solid #d0d0d0;border-radius:6px;');

    return { cfParts, cfBaseStyle, onDateChange, onTimeChange, onNow, onClear };
  },
  template: /* html */`
<div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
  <input type="date" :class="inputClass" :value="cfParts.date"
         :disabled="readonly" @change="onDateChange"
         :style="cfBaseStyle+'width:'+dateWidth+';margin:0;flex-shrink:0;'" />
  <input type="time" :class="inputClass" :value="cfParts.time"
         :disabled="readonly" @change="onTimeChange"
         :style="cfBaseStyle+'width:'+timeWidth+';margin:0;flex-shrink:0;'" />
  <span v-if="placeholderDate && !cfParts.date && !cfParts.time"
        style="font-size:11px;color:#aaa;white-space:nowrap;">{{ placeholderDate }}</span>
  <button v-if="showNow && !readonly" type="button" @click="onNow"
          style="font-size:11px;padding:4px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;flex-shrink:0;">🕐 현재</button>
  <button v-if="showClear && !readonly && (cfParts.date || cfParts.time)" type="button" @click="onClear"
          style="font-size:11px;padding:4px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#999;white-space:nowrap;flex-shrink:0;">✕ 지움</button>
</div>`,
};
