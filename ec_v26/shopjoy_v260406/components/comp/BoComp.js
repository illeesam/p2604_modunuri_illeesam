/**
 * BoComp.js — 관리자 공통 UI 컴포넌트
 *
 * ※ BoComp.js 컴포넌트는 모두 'Bo' prefix / 'bo-' 태그를 사용한다.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 정의된 컴포넌트 (8개)
 *
 *   BoPathTree           — bizCd 기반 경로 트리 컨테이너 (API 조회 + 상태 자급자족,
 *                          bizCd별 캐시, 전체펼치기/닫기 슬롯). emit: select(pathId)
 *   BoPathTreeNode       — sy_path 트리 재귀 노드 (BoPathTree 내부 + 직접 사용 가능)
 *   BoCategoryTree       — 카테고리 트리 패널 & 피커 모달 (mode="tree" | "picker")
 *   BoPager              — 관리자 공통 페이지네이션
 *   BoPathParentSelector — 부모경로 선택 모달용 재귀 노드
 *   BoMultiCheckSelect   — 다중 선택 드롭다운 (체크박스 + ',' 구분 String v-model)
 *   BoDateTimePicker     — 일자 + 시분 선택 (date input + time input + 현재 버튼,
 *                          v-model = 'YYYY-MM-DDTHH:mm')
 *   BoPathPickField      — 경로 선택 필드 (path-pick-modal 연동, bizCd 필수)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 주요 사용 예:
 *   <bo-path-tree biz-cd="sy_brand" :show-biz-cd="true" @select="fn" />
 *   <bo-multi-check-select v-model="searchType" :options="opts" placeholder="전체" />
 *   <bo-date-time-picker v-model="form.sendDate" />
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
    counts:      { type: Object,  default: null },  // { pathId: number } — 외부 데이터 카운트
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTree : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-expand-all') {
        return expandAll();
      } else if (cmd === 'tree-collapse-all') {
        return collapseAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTree : handleSelectAction -> ', cmd, param);
      if (cmd === 'tree-node-toggle') {
        return toggleNode(param);
      } else if (cmd === 'tree-node-select') {
        return selectNode(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

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

    /* counts prop 은 백엔드가 이미 자손 누적까지 계산해 전달하는 map 으로 가정.
     *   (예: SySiteMng → GET /bo/sy/site/path-counts — PostgreSQL 재귀 CTE)
     *   따라서 별도의 프론트 집계 없이 그대로 노드에 매핑한다. */

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

    return {
      tree, expanded, loading,                            // 상태
      handleBtnAction, handleSelectAction,                // dispatch
      toggleNode, selectNode,                             // 자식 컴포넌트 콜백
    };
  },
  template: /* html */`
<div>
  <div style="display:flex;gap:4px;margin-bottom:8px;">
    <button class="btn btn-sm" @click="handleBtnAction('tree-expand-all')"  style="flex:1;font-size:11px;">
      ▼ 전체펼치기
    </button>
    <button class="btn btn-sm" @click="handleBtnAction('tree-collapse-all')" style="flex:1;font-size:11px;">
      ▶ 전체닫기
    </button>
  </div>
  <div v-if="loading" style="font-size:11px;color:#aaa;padding:8px;text-align:center;">
    로딩중...
  </div>
  <bo-path-tree-node v-else
    :node="tree" :expanded="expanded" :selected="selected"
    :on-toggle="toggleNode" :on-select="selectNode"
    :depth="0" :show-biz-cd="showBizCd" :counts="counts" />
</div>
`,
};

/* ── BoMenuTree 컨테이너 (sy_menu 자기참조 트리) ───────────────────────────
 * BoPathTree 의 메뉴 버전 — sy_path 대신 sy_menu 의 parent_menu_id 자기참조 트리.
 * SyMenuMng 등 메뉴 관리 화면 좌측 트리 전용.
 *
 * props:
 *   selected    — menuId 현재 선택값
 *   expandDepth — number 초기 펼침 깊이 (기본 2)
 *   counts      — Object { menuId: number } — 외부 카운트
 * emits:
 *   select(menuId) — 노드 클릭 시 (null = 전체)
 *
 * 노드 내부 형식: { pathId, pathLabel, children, count } — BoPathTreeNode 와 호환되도록
 *   menuId → pathId 로 매핑해 재사용. 트리 노드 출력만 동일 컴포넌트로 처리.
 * ──────────────────────────────────────────────────────────────────────── */
window.BoMenuTree = {
  name: 'BoMenuTree',
  props: {
    selected:    { default: null },
    expandDepth: { type: Number, default: 2 },
    counts:      { type: Object, default: null },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const { ref, reactive, watch, onMounted } = Vue;

    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoMenuTree : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-expand-all')   return expandAll();
      if (cmd === 'tree-collapse-all') return collapseAll();
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoMenuTree : handleSelectAction -> ', cmd, param);
      if (cmd === 'tree-node-toggle') return toggleNode(param);
      if (cmd === 'tree-node-select') return selectNode(param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const _cache = (window._menuTreeCache = window._menuTreeCache || {});
    const tree     = reactive({ pathId: null, pathLabel: '전체', children: [], count: 0 });
    const expanded = reactive(new Set([null]));
    const loading  = ref(false);

    /* sy_menu list → 트리 — BoPathTreeNode 호환 형식 (menuId → pathId, menuNm → pathLabel) */
    const buildTree = (list) => {
      const filtered = list.filter(m => m.useYn !== 'N');
      const byParent = {};
      filtered.forEach(m => {
        const k = m.parentMenuId == null ? '__root__' : m.parentMenuId;
        (byParent[k] = byParent[k] || []).push(m);
      });
      const build = (pk) => (byParent[pk] || [])
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({
          pathId: m.menuId, pathLabel: m.menuNm, bizCd: '',
          children: build(m.menuId), count: 0,
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

    const fnApplyTree = (newTree) => {
      tree.pathId    = newTree.pathId;
      tree.pathLabel = newTree.pathLabel;
      tree.children  = newTree.children;
      tree.count     = newTree.count;
    };

    const load = async () => {
      if (_cache.list) {
        fnApplyTree(buildTree(_cache.list));
        expanded.clear();
        initExpanded(tree, 0, props.expandDepth);
        return;
      }
      loading.value = true;
      try {
        const res = await boApiSvc.syMenu.getList({ pageNo: 1, pageSize: 10000 }, '메뉴트리', '조회');
        const list = res.data?.data || [];
        _cache.list = list;
        fnApplyTree(buildTree(list));
        expanded.clear();
        initExpanded(tree, 0, props.expandDepth);
      } catch (e) {
        console.error('[MenuTree] load error', e);
      } finally {
        loading.value = false;
      }
    };

    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { emit('select', id); };
    const expandAll  = () => { const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(tree); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };

    onMounted(load);

    return {
      tree, expanded, loading,
      handleBtnAction, handleSelectAction,
      toggleNode, selectNode,
    };
  },
  template: /* html */`
<div>
  <div style="display:flex;gap:4px;margin-bottom:8px;">
    <button class="btn btn-sm" @click="handleBtnAction('tree-expand-all')"  style="flex:1;font-size:11px;">
      ▼ 전체펼치기
    </button>
    <button class="btn btn-sm" @click="handleBtnAction('tree-collapse-all')" style="flex:1;font-size:11px;">
      ▶ 전체닫기
    </button>
  </div>
  <div v-if="loading" style="font-size:11px;color:#aaa;padding:8px;text-align:center;">
    로딩중...
  </div>
  <bo-path-tree-node v-else
    :node="tree" :expanded="expanded" :selected="selected"
    :on-toggle="toggleNode" :on-select="selectNode"
    :depth="0" :show-biz-cd="false" :counts="counts" />
</div>
`,
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
    counts:    { type: Object,   default: null },  // { pathId: number } — 외부 데이터 카운트 (예: 사이트 수). null 이면 node.count(=경로 자손수) 표시
  },
  setup(props) {

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTreeNode : handleBtnAction -> ', cmd, param);
      if (cmd === 'node-toggle') {
        return props.onToggle(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathTreeNode : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return props.onSelect(param);
      } else if (cmd === 'node-hover') {
        if (!param || !param.currentTarget) return;
        param.currentTarget.style.background = (props.selected === props.node.pathId) ? '#fff0f4' : '#f8f9fb';
      } else if (cmd === 'node-leave') {
        if (!param || !param.currentTarget) return;
        param.currentTarget.style.background = (props.selected === props.node.pathId) ? '#fff0f4' : 'transparent';
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div>
  <div @click="handleSelectAction('node-select', node.pathId)"
    :style="{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 6px', cursor:'pointer', borderRadius:'4px',
    paddingLeft: (8 + depth*14) + 'px',
    background: selected===node.pathId ? '#fff0f4' : 'transparent',
    color:      selected===node.pathId ? '#e8587a' : '#444',
    fontWeight: selected===node.pathId ? 700 : 400 }"
    @mouseover="handleSelectAction('node-hover', $event)"
    @mouseout="handleSelectAction('node-leave', $event)">
    <span v-if="(node.children||[]).length>0" style="width:14px;font-size:10px;color:#999;flex-shrink:0"
      @click.stop="handleBtnAction('node-toggle', node.pathId)">
      {{ expanded.has(node.pathId) ? '▼' : '▶' }}
    </span>
    <span v-else style="width:14px;flex-shrink:0">
    </span>
    <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
      {{ node.pathLabel || '(이름없음)' }}
    </span>
    <span v-if="showBizCd && node.bizCd" style="font-size:9px;color:#aaa;font-family:monospace;flex-shrink:0;margin-left:2px;">
    #{{ node.bizCd }}
  </span>
  <!-- counts(외부 데이터 수) 가 제공되고 비어있지 않으면 우선 표시 (백엔드가 자손 누적까지 계산해 제공).
       node.pathId === null (루트 "전체") 은 counts['__total__'] 로 매핑.
       counts 가 제공됐지만 해당 키가 없으면 0 으로 표시 (데이터 없음을 명시).
       counts 미제공 또는 아직 로드 전(빈 객체) 이면 node.count(경로 자손수) 폴백 표시. -->
  <span v-if="counts && Object.keys(counts).length > 0"
    style="font-size:10px;color:#1677ff;background:#e6f4ff;padding:1px 6px;border-radius:8px;flex-shrink:0;font-weight:600;">
    {{ counts[node.pathId == null ? '__total__' : node.pathId] != null
       ? counts[node.pathId == null ? '__total__' : node.pathId]
       : 0 }}
  </span>
  <span v-else-if="node.count != null" style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 5px;border-radius:8px;flex-shrink:0;">
    {{ node.count }}
  </span>
</div>
<div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
<bo-path-tree-node v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" :show-biz-cd="showBizCd" :counts="counts" />
</div>
</div>
`,
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
    modalName:  { type: String,   default: '' },        // 모달 식별자
    onCallback: { type: Function, default: null },      // 통합 콜백
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    // siteId별로 캐시 분리 (사이트 전환 시 즉시 정확한 트리 표시)

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoCategoryTree : handleBtnAction -> ', cmd, param);
      if (cmd === 'tree-expand-all') {
        return expandAll();
      } else if (cmd === 'tree-collapse-all') {
        return collapseAll();
      } else if (cmd === 'picker-close') {
        return onClose();
      } else if (cmd === 'picker-confirm') {
        return onPickerConfirm();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoCategoryTree : handleSelectAction -> ', cmd, param);
      if (cmd === 'tree-node-select') {
        return onSelect(param);
      } else if (cmd === 'tree-node-toggle') {
        return toggleNode(param);
      } else if (cmd === 'picker-select') {
        return onPickerSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

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
    const onClose = () => {
      pickerSearch.value = '';
      pickerTempCat.value = null;
      emit('close');
      if (props.onCallback) props.onCallback(props.modalName, null, null);
    };

    /* pickerTempCat — picker 모드에서 [선택] 버튼 클릭 전 임시 보관된 카테고리 */
    const pickerTempCat = ref(null);

    /* onPickerSelect — 행 클릭: 임시 선택만 (즉시 emit 안 함) */
    const onPickerSelect = cat => { pickerTempCat.value = cat; };

    /* onPickerConfirm — [선택] 버튼 클릭: 임시 선택을 부모에 전달 */
    const onPickerConfirm = () => {
      if (!pickerTempCat.value) { return; }
      const cat = pickerTempCat.value;
      pickerSearch.value = '';
      pickerTempCat.value = null;
      emit('select', cat);
      if (props.onCallback) props.onCallback(props.modalName, null, cat);
    };

    // picker: show 될 때마다 검색어/임시선택 초기화
    watch(() => props.show, v => { if (v) { pickerSearch.value = ''; pickerTempCat.value = null; } });

    onMounted(load);

    return {
      loading, categories, cfTreeFlat, cfPickerList, expandedSet, pickerSearch, pickerTempCat,  // 상태 / computed
      handleBtnAction, handleSelectAction,                                       // dispatch
      DEPTH_COLOR, DEPTH_BULLET,                                                 // 헬퍼
    };
  },
  template: /* html */`
<template v-if="mode==='tree'">
  <div v-if="loading" style="font-size:11px;color:#aaa;padding:12px;text-align:center;">
    로딩중...
  </div>
  <template v-else>
    <div style="display:flex;gap:4px;margin-bottom:8px">
      <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="handleBtnAction('tree-expand-all')">
        ▼ 전체
      </button>
      <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="handleBtnAction('tree-collapse-all')">
        ▶ 닫기
      </button>
    </div>
    <!-- 전체 루트 항목 -->
    <div style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px;margin-bottom:2px"
      :style="{ background: selected===null ? '#fce4ec' : 'transparent',
      color:      selected===null ? '#e8587a' : '#555',
      fontWeight: selected===null ? 700 : 500,
      borderLeft: selected===null ? '3px solid #e8587a' : '3px solid transparent' }"
      @click="handleSelectAction('tree-node-select', null)">
      <span style="width:14px;flex-shrink:0">
      </span>
      <span style="font-size:11px;font-weight:700;color:#e8587a;margin-right:4px">
        ★
      </span>
      <span style="font-size:12px">
        전체
      </span>
    </div>
    <div v-for="cat in cfTreeFlat" :key="cat.categoryId"
      style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px"
      :style="{ paddingLeft:(cat._depth*14+6)+'px',
      background: selected===cat.categoryId ? '#fce4ec' : 'transparent',
      color:      selected===cat.categoryId ? '#e8587a' : '#333',
      fontWeight: selected===cat.categoryId ? 600 : 400,
      borderLeft: selected===cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }"
      @click="handleSelectAction('tree-node-select', cat.categoryId)">
      <span v-if="cat._hasChildren"
        style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
        @click.stop="handleSelectAction('tree-node-toggle', cat.categoryId)">
        {{ expandedSet.has(cat.categoryId) ? '▼' : '▶' }}
      </span>
      <span v-else style="width:14px;flex-shrink:0">
      </span>
      <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR(cat._depth), marginRight:'4px' }">
        {{ DEPTH_BULLET(cat._depth) }}
      </span>
      <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        {{ cat.categoryNm }}
      </span>
      <span v-if="showCount && showCount(cat.categoryId) > 0" style="font-size:10px;color:#1677ff;background:#e6f4ff;padding:1px 6px;border-radius:8px;font-weight:600;flex-shrink:0;margin-left:4px;">
      {{ showCount(cat.categoryId) }}
    </span>
    <span v-if="cat.categoryStatusCd==='INACTIVE'" style="font-size:10px;color:#bbb;margin-left:4px">
      (비활성)
    </span>
  </div>
  <div v-if="!cfTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">
    카테고리 없음
  </div>
</template>
</template>
<teleport v-else-if="mode==='picker'" to="body">
  <div v-if="show" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;" @click.self="handleBtnAction('picker-close')">
    <div style="background:#fff;border-radius:12px;width:420px;max-height:520px;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <div style="padding:16px 20px 12px;border-bottom:1px solid #f0f0f0;background:linear-gradient(135deg,#fff0f4,#ffe4ec);border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:700;font-size:15px;">
          카테고리 선택
        </span>
        <button type="button" @click="handleBtnAction('picker-close')" style="border:none;background:none;font-size:18px;cursor:pointer;color:#888;">
          ✕
        </button>
      </div>
      <div style="padding:8px 12px;">
        <input class="form-control" v-model="pickerSearch" placeholder="카테고리 검색..." style="font-size:13px;" />
      </div>
      <div style="overflow-y:auto;flex:1;padding:4px 8px 12px;">
        <!-- 검색어 없음: 트리 뷰 -->
        <template v-if="!pickerSearch.trim()">
          <div v-if="loading" style="text-align:center;color:#aaa;padding:24px;font-size:13px;">
            로딩중...
          </div>
          <template v-else>
            <div style="display:flex;gap:4px;margin:0 4px 6px">
              <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="handleBtnAction('tree-expand-all')">
                ▼ 전체
              </button>
              <button class="btn btn-secondary btn-xs" style="flex:1;font-size:11px" @click="handleBtnAction('tree-collapse-all')">
                ▶ 닫기
              </button>
            </div>
            <div v-for="cat in cfTreeFlat" :key="cat.categoryId" style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:2px;padding:5px 6px;transition:background .1s;" :style="{ paddingLeft:(cat._depth*14+6)+'px', opacity: excludeIds && excludeIds.has(String(cat.categoryId)) ? 0.35 : 1, pointerEvents: excludeIds && excludeIds.has(String(cat.categoryId)) ? 'none' : 'auto', background: pickerTempCat && pickerTempCat.categoryId === cat.categoryId ? '#fff0f4' : '', borderLeft: pickerTempCat && pickerTempCat.categoryId === cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }" @click="handleSelectAction('picker-select', cat)">
            <span v-if="cat._hasChildren"
                style="width:14px;text-align:center;font-size:9px;color:#aaa;flex-shrink:0"
                @click.stop="handleSelectAction('tree-node-toggle', cat.categoryId)">
              {{ expandedSet.has(cat.categoryId) ? '▼' : '▶' }}
            </span>
            <span v-else style="width:14px;flex-shrink:0">
            </span>
            <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR(cat._depth), marginRight:'4px' }">
              {{ DEPTH_BULLET(cat._depth) }}
            </span>
            <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ cat.categoryNm }}
            </span>
            <span v-if="cat.categoryStatusCd==='INACTIVE'" style="font-size:10px;color:#bbb;margin-left:4px">
              (비활성)
            </span>
          </div>
          <div v-if="!cfTreeFlat.length" style="text-align:center;padding:20px;color:#aaa;font-size:12px">
            카테고리 없음
          </div>
        </template>
      </template>
      <!-- 검색어 있음: flat 필터 목록 -->
      <template v-else>
        <div v-if="cfPickerList.length===0" style="text-align:center;color:#aaa;padding:24px;font-size:13px;">
          검색 결과 없음
        </div>
        <div v-for="cat in cfPickerList" :key="cat.categoryId" @click="handleSelectAction('picker-select', cat)" style="border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:6px;padding:6px 10px;transition:background .1s;" :style="{ opacity: excludeIds && excludeIds.has(String(cat.categoryId)) ? 0.35 : 1, pointerEvents: excludeIds && excludeIds.has(String(cat.categoryId)) ? 'none' : 'auto', background: pickerTempCat && pickerTempCat.categoryId === cat.categoryId ? '#fff0f4' : '', borderLeft: pickerTempCat && pickerTempCat.categoryId === cat.categoryId ? '3px solid #e8587a' : '3px solid transparent' }">
        <span :style="{ fontSize:'11px', fontWeight:700, color:DEPTH_COLOR((cat.categoryDepth||1)-1) }">
          {{ DEPTH_BULLET((cat.categoryDepth||1)-1) }}
        </span>
        <span style="font-size:12px">
          {{ cat.categoryNm }}
        </span>
        <span style="font-size:10px;color:#bbb;margin-left:auto">
          {{ ['','대','중','소'][cat.categoryDepth||1]||'' }}
        </span>
      </div>
    </template>
  </div>
  <!-- 푸터: 선택 정보 + [선택]/[취소] 버튼 -->
  <div style="padding:11px 16px;border-top:1px solid #f0f0f0;background:#fafafa;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;border-radius:0 0 12px 12px;">
    <span style="font-size:12px;" :style="pickerTempCat ? 'color:#e8587a;font-weight:600;' : 'color:#bbb;'">
      {{ pickerTempCat ? '선택: ' + pickerTempCat.categoryNm : '카테고리를 클릭하세요.' }}
    </span>
    <div style="display:flex;gap:6px;">
      <button type="button" class="btn btn-secondary btn-sm" @click="handleBtnAction('picker-close')">
        취소
      </button>
      <button type="button" class="btn btn-primary btn-sm" :disabled="!pickerTempCat" @click="handleBtnAction('picker-confirm')">
        선택
      </button>
    </div>
  </div>
</div>
</div>
</teleport>
`,
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
    pager:        { type: Object,   default: () => ({ pageNo: 1, pageTotalPage: 1, pageNums: [1], pageSize: 20, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500] }) },
    onSetPage:    { type: Function, default: () => {} },
    onSizeChange: { type: Function, default: () => {} },
  },
  template: /* html */`
<div v-if="pager" class="pagination">
  <div>
  </div>
  <div class="pager">
    <button :disabled="pager.pageNo===1" @click="onSetPage(1)">
      «
    </button>
    <button :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">
      ‹
    </button>
    <button v-for="n in (pager.pageNums||[])" :key="n" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">
      {{ n }}
    </button>
    <button :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">
      ›
    </button>
    <button :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">
      »
    </button>
  </div>
  <div class="pager-right">
    <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
      <option v-for="s in (pager.pageSizes||[])" :key="s" :value="s">
        {{ s }}개
      </option>
    </select>
  </div>
</div>
`,
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
      @click.stop="onToggle(node.pathId)">
      {{ expanded.has(node.pathId) ? '▼' : '▶' }}
    </span>
    <span v-else style="width:16px">
    </span>
    <span style="flex:1;font-size:13px;">
      {{ node.pathLabel || '(이름없음)' }}
    </span>
  </div>
  <div v-if="expanded.has(node.pathId) && (node.children||[]).length>0">
  <bo-path-parent-selector v-for="ch in node.children" :key="ch.pathId"
      :node="ch" :expanded="expanded" :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
</div>
</div>
`,
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
    const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;
    const open = ref(false);
    const rootRef = ref(null);

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoMultiCheckSelect : handleBtnAction -> ', cmd, param);
      if (cmd === 'select-toggle') {
        return onToggle();
      } else if (cmd === 'select-click-all') {
        return onClickAll();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoMultiCheckSelect : handleSelectAction -> ', cmd, param);
      if (cmd === 'select-click-option') {
        return onClickOption(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* noneMode: 사용자가 '전체 선택'을 해제해 명시적으로 전부 비운 상태.
       (modelValue 빈값('')은 호출부에서 '전체'로 해석되므로, 빈값만으로는
        '아무것도 선택 안 함'을 표현할 수 없다 → 체크 표시 보정용 내부 상태) */
    const noneMode = ref(false);

    const cfNorm = computed(() =>
      (props.options || []).map(o => ({
        value: o.value != null ? o.value : o.codeValue,
        label: o.label != null ? o.label : o.codeLabel,
      })).filter(o => o.value != null)
    );

    /* 외부에서 실제 값(콤마문자열)이 들어오면 noneMode 자동 해제 */
    watch(() => props.modelValue, (v) => { if ((v || '').toString().trim()) noneMode.value = false; });

    const cfSelected = computed(() => {
      if (noneMode.value) return new Set();
      const raw = (props.modelValue || '').toString().trim();
      if (!raw) return new Set(cfNorm.value.map(o => o.value));
      return new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
    });

    const cfIsAll = computed(() => {
      const sel = cfSelected.value;
      return cfNorm.value.length > 0 && cfNorm.value.every(o => sel.has(o.value));
    });

    const cfDisplay = computed(() => {
      if (noneMode.value) return '선택 안 함';
      if (cfIsAll.value) return props.placeholder;
      const sel = cfSelected.value;
      const labels = cfNorm.value.filter(o => sel.has(o.value)).map(o => o.label);
      if (labels.length === 0) return props.placeholder;
      if (labels.length <= 2) return labels.join(', ');
      // 3개 이상: 앞 2개 라벨 + (전체개수)...
      return labels.slice(0, 2).join(', ') + ' (' + labels.length + ')...';
    });

    /* emitFromSet
       - 전부 선택 → '' (전체)  ※ noneMode 해제
       - 전부 해제 → noneMode (선택 안 함). emit 값은 '' 이지만 표시상 빈 체크 유지
       - 일부 선택 → 콤마문자열 */
    const emitFromSet = (set) => {
      if (set.size === 0) {
        noneMode.value = true;            // 전부 해제 = 선택 안 함 (전체로 되돌아가지 않음)
        emit('update:modelValue', '');
      } else if (cfNorm.value.every(o => set.has(o.value))) {
        noneMode.value = false;           // 전부 선택 = 전체
        emit('update:modelValue', '');
      } else {
        noneMode.value = false;
        emit('update:modelValue', cfNorm.value.filter(o => set.has(o.value)).map(o => o.value).join(','));
      }
    };

    /* onToggle */
    const onToggle = () => { if (!props.disabled) open.value = !open.value; };

    /* onClickOption — 옵션 클릭 시 토글
       단, '전체'(빈값) 또는 '선택 안 함'(noneMode) 상태에서 개별 항목을 처음 클릭하면
       "전체에서 빼기"가 아니라 "그 항목 하나만 선택"으로 새로 시작한다. */
    const onClickOption = (val) => {
      const wasAllOrNone = noneMode.value || cfIsAll.value;
      noneMode.value = false;
      let set;
      if (wasAllOrNone) {
        set = new Set([val]);              // 빈 상태에서 이 항목 하나만 선택
      } else {
        set = new Set(cfSelected.value);
        if (set.has(val)) set.delete(val); else set.add(val);
      }
      emitFromSet(set);
    };

    /* onClickAll — 전체이면 모두 해제(noneMode), 아니면 전체 선택 */
    const onClickAll = () => {
      if (cfIsAll.value) noneMode.value = true;   // 모두 해제 (체크 전부 꺼짐)
      else noneMode.value = false;                 // 전체 선택
      emit('update:modelValue', '');               // 외부 계약은 항상 빈값(=전체 검색)
    };

    /* onDocClick */
    const onDocClick = (e) => {
      if (!rootRef.value) return;
      if (!rootRef.value.contains(e.target)) open.value = false;
    };
    onMounted(() => document.addEventListener('mousedown', onDocClick));
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));

    return {
      open, rootRef, noneMode, cfNorm, cfSelected, cfIsAll, cfDisplay,  // 상태 / computed
      handleBtnAction, handleSelectAction,                              // dispatch
    };
  },
  template: /* html */`
<div ref="rootRef" class="multi-check-select" :style="'position:relative;display:inline-block;min-width:'+minWidth">
  <div @click="handleBtnAction('select-toggle')"
    :style="'border:1px solid #d4d4d8;border-radius:6px;padding:6px 28px 6px 10px;background:'+(disabled?'#f5f5f5':'#fff')+';cursor:'+(disabled?'not-allowed':'pointer')+';font-size:13px;color:'+(noneMode?'#aaa':'#333')+';position:relative;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'">
    {{ cfDisplay }}
    <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#888;font-size:10px;">
      ▼
    </span>
  </div>
  <div v-if="open"
    style="position:absolute;top:calc(100% + 4px);left:0;min-width:100%;width:max-content;max-width:280px;max-height:280px;overflow-y:auto;background:#fff;border:1px solid #d4d4d8;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.08);z-index:1000;padding:4px 0;">
    <label v-if="showAll" style="display:flex;align-items:center;gap:7px;padding:5px 12px;font-size:13px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-weight:600;white-space:nowrap;">
      <input type="checkbox" :checked="cfIsAll" @change="handleBtnAction('select-click-all')" style="flex:0 0 auto;width:14px;min-width:14px;height:14px;margin:0;" />
      <span style="white-space:nowrap;">
        {{ allLabel }}
      </span>
    </label>
    <label v-for="o in cfNorm" :key="o.value"
      style="display:flex;align-items:center;gap:7px;padding:5px 12px;font-size:13px;cursor:pointer;white-space:nowrap;"
      @mouseenter="$event.currentTarget.style.background='#f9fafb'"
      @mouseleave="$event.currentTarget.style.background='transparent'">
      <input type="checkbox" :checked="cfSelected.has(o.value)" @change="handleSelectAction('select-click-option', o.value)" style="flex:0 0 auto;width:14px;min-width:14px;height:14px;margin:0;" />
      <span style="white-space:nowrap;">
        {{ o.label }}
      </span>
    </label>
  </div>
</div>
`,
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

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoDateTimePicker : handleBtnAction -> ', cmd, param);
      if (cmd === 'picker-now') {
        return onNow();
      } else if (cmd === 'picker-clear') {
        return onClear();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoDateTimePicker : handleSelectAction -> ', cmd, param);
      if (cmd === 'picker-date-change') {
        return onDateChange(param);
      } else if (cmd === 'picker-time-change') {
        return onTimeChange(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

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

    return {
      cfParts, cfBaseStyle,                  // computed
      handleBtnAction, handleSelectAction,   // dispatch
    };
  },
  template: /* html */`
<div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;">
  <input type="date" :class="inputClass" :value="cfParts.date"
    :disabled="readonly" @change="handleSelectAction('picker-date-change', $event)"
    :style="cfBaseStyle+'width:'+dateWidth+';margin:0;flex-shrink:0;'" />
  <input type="time" :class="inputClass" :value="cfParts.time"
    :disabled="readonly" @change="handleSelectAction('picker-time-change', $event)"
    :style="cfBaseStyle+'width:'+timeWidth+';margin:0;flex-shrink:0;'" />
  <span v-if="placeholderDate && !cfParts.date && !cfParts.time" style="font-size:11px;color:#aaa;white-space:nowrap;">
  {{ placeholderDate }}
</span>
<button v-if="showNow && !readonly" type="button" @click="handleBtnAction('picker-now')" style="font-size:11px;padding:4px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;flex-shrink:0;">
🕐 현재
</button>
<button v-if="showClear && !readonly && (cfParts.date || cfParts.time)" type="button" @click="handleBtnAction('picker-clear')" style="font-size:11px;padding:4px 9px;border:1px solid #d0d0d0;border-radius:8px;background:#fff;cursor:pointer;color:#999;white-space:nowrap;flex-shrink:0;">
✕ 지움
</button>
</div>
`,
};

/* ── BoPathPickField — 표시경로(sy_path) 선택 필드 (PathPickModal 내장) ───────
 * sy 화면 그리드 셀에 반복되던 "경로라벨 + 🔍선택버튼 + hover + PathPickModal"
 * 보일러플레이트를 1줄로 대체. bizCd 만 바꾸면 화면별 다른 트리가 자동 동작
 * (PathPickModal 이 boUtil.bofBuildPathTree(bizCd) 로 트리를 자급자족 구성).
 *
 * 화면에서 제거 가능해지는 보일러플레이트:
 *   pathPickModal reactive / openPathPick / closePathPick / onPathPicked / pathLabel
 *
 * props:
 *   bizCd       — string 필수. 경로 트리 업무코드 (sy_code_grp / sy_brand / sy_bbm …)
 *   row         — object 필수. pathId 를 보유한 행객체 (직접 in-place 갱신)
 *   pathField   — string. row 의 경로 ID 필드명 (기본 'pathId')
 *   disabled    — boolean. 선택 버튼 비활성 (기본 false. row._row_status==='D' 등)
 *   modalTitle  — string. 모달 제목 (기본 '표시경로 선택')
 *   placeholder — string. 미선택 시 표시 (기본 '경로 선택...')
 *   bare        — boolean. true 면 <td> 래퍼 없이 내부 div 만 (기본 false → <td> 포함)
 * emit:
 *   change(pathId)  — 선택 완료 (row 는 이미 갱신됨. 부모 추적 훅용)
 * ──────────────────────────────────────────────────────────────────────── */
window.BoPathPickField = {
  name: 'BoPathPickField',
  /* path-pick-modal 은 boApp.js 가 전역 등록 → 로컬 components 불필요
   * (BoComp.js 가 BaseModals.js 보다 먼저 로드되므로 직접 참조 금지) */
  props: {
    bizCd:       { type: String,  required: true },
    row:         { type: Object,  required: true },
    pathField:   { type: String,  default: 'pathId' },
    disabled:    { type: Boolean, default: false },
    modalTitle:  { type: String,  default: '표시경로 선택' },
    placeholder: { type: String,  default: '경로 선택...' },
    bare:        { type: Boolean, default: false },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const show = Vue.ref(false);
    const cfLabel = Vue.computed(() => {
      const id = props.row ? props.row[props.pathField] : null;
      return (window.boUtil && window.boUtil.bofGetPathLabel(id)) || '';
    });
    const cfHasVal = Vue.computed(() =>
      props.row != null && props.row[props.pathField] != null);
    const onOpen  = () => { if (!props.disabled) show.value = true; };
    const onClose = () => { show.value = false; };
    const onPicked = (pathId) => {
      if (props.row) props.row[props.pathField] = pathId;
      show.value = false;
      emit('change', pathId);
    };

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathPickField : handleBtnAction -> ', cmd, param);
      if (cmd === 'pathPick-open') {
        return onOpen();
      } else if (cmd === 'pathPick-close') {
        return onClose();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoPathPickField : handleSelectAction -> ', cmd, param);
      if (cmd === 'pathPick-picked') {
        return onPicked(param);
      } else if (cmd === 'pathPick-hover') {
        if (props.disabled || !param || !param.currentTarget) return;
        param.currentTarget.style.background = '#eef2ff';
      } else if (cmd === 'pathPick-leave') {
        if (param && param.currentTarget) param.currentTarget.style.background = '#fff';
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return {
      show, cfLabel, cfHasVal,                // 상태 / computed
      handleBtnAction, handleSelectAction,    // dispatch
    };
  },
  template: /* html */`
<component :is="bare ? 'div' : 'td'">
  <div :style="{padding:'5px 6px 5px 10px',border:'1px solid #e5e7eb',borderRadius:'5px',fontSize:'12px',minHeight:'26px',
    background:'#f5f5f7',
    color: cfHasVal ? '#374151' : '#9ca3af',
    fontWeight: cfHasVal ? 600 : 400,
    display:'flex',alignItems:'center',gap:'6px'}">
    <span style="flex:1;">
      {{ cfLabel || placeholder }}
    </span>
    <button type="button" :disabled="disabled"
      @click.stop="handleBtnAction('pathPick-open')" @dblclick.stop="handleBtnAction('pathPick-open')"
      :title="modalTitle"
      :style="{cursor: disabled ? 'not-allowed' : 'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'11px',color:'#6b7280',flexShrink:0,padding:'0',opacity: disabled ? 0.4 : 1}"
      @mouseover="handleSelectAction('pathPick-hover', $event)" @mouseout="handleSelectAction('pathPick-leave', $event)">
      🔍
    </button>
  </div>
  <path-pick-modal v-if="show" :biz-cd="bizCd"
    :value="row ? row[pathField] : null"
    :title="modalTitle"
    @select="handleSelectAction('pathPick-picked', $event)" @close="handleBtnAction('pathPick-close')" />
</component>
`,
};

/* -- BoPropTreeNode — 속성관리(SyPropMng) 트리 노드 재귀 컴포넌트 -- */
window.BoPropTreeNode = {
  name: 'BoPropTreeNode',
  props: {
    node:     { type: Object, default: () => ({}) }, // 전달값
    expanded: { type: Boolean, default: false }, // 전달값
    selected: { type: Boolean, default: false }, // 전달값
    onToggle: { type: Function, default: () => {} }, // 콜백 함수
    onSelect: { type: Function, default: () => {} }, // 콜백 함수
    depth:    { type: Number, default: 0 }, // 전달값
  },
  components: { 'bo-prop-tree-node': null },
  created() { this.$options.components['bo-prop-tree-node'] = window.BoPropTreeNode; },
  setup(props) {

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoPropTreeNode : handleBtnAction -> ', cmd, param);
      if (cmd === 'node-toggle') {
        return props.onToggle(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoPropTreeNode : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return props.onSelect(param);
      } else if (cmd === 'node-hover') {
        if (!param || !param.currentTarget) return;
        param.currentTarget.style.background = (props.selected === props.node.path) ? '#fff0f4' : '#f8f9fb';
      } else if (cmd === 'node-leave') {
        if (!param || !param.currentTarget) return;
        param.currentTarget.style.background = (props.selected === props.node.path) ? '#fff0f4' : 'transparent';
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { handleBtnAction, handleSelectAction };
  },
  template: /* html */`
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div :style="{display:'flex',alignItems:'center',gap:'4px',padding:'5px 6px',cursor:'pointer',borderRadius:'4px',
    paddingLeft: (8 + depth*14) + 'px',
    background: selected===node.path ? '#fff0f4' : 'transparent',
    color:      selected===node.path ? '#e8587a' : '#444',
    fontWeight: selected===node.path ? 700 : 400}"
    @mouseover="handleSelectAction('node-hover', $event)"
    @mouseout="handleSelectAction('node-leave', $event)">
    <span v-if="node.children && node.children.length>0" style="width:14px;font-size:10px;color:#999;" @click.stop="handleBtnAction('node-toggle', node.path)">
    {{ expanded.has(node.path) ? '▼' : '▶' }}
  </span>
  <span v-else style="width:14px;">
  </span>
  <span style="font-size:13px;flex:1;" @click="handleSelectAction('node-select', node.path)">
    {{ node.name || '전체' }}
  </span>
  <span v-if="node._badge"
      :style="{fontSize:'9px',padding:'1px 5px',borderRadius:'7px',color:'#fff',fontWeight:700,background:node._badge[1]}">
    {{ node._badge[0] }}
  </span>
  <span style="font-size:10px;color:#999;background:#f5f5f5;padding:1px 6px;border-radius:8px;">
    {{ node.count }}
  </span>
</div>
<!-- ===== □. 영역 ====================================================== -->
<!-- ===== ■. 조건부 영역 ================================================== -->
<div v-if="expanded.has(node.path) && node.children.length>0">
<bo-prop-tree-node v-for="ch in node.children" :key="ch.path"
      :node="ch" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth+1" />
</div>
</div>
<!-- ===== □. 조건부 영역 ================================================== -->
`,
};

/* -- BoDeptTreeNode — 부서관리(SyDeptMng) 트리 노드 재귀 컴포넌트 -- */
window.BoDeptTreeNode = {
  name: 'BoDeptTreeNode',
  props: {
    node:     { type: Object, default: () => ({}) }, // 전달값
    expanded: { type: Boolean, default: false }, // 전달값
    selected: { type: Boolean, default: false }, // 전달값
    onToggle: { type: Function, default: () => {} }, // 콜백 함수
    onSelect: { type: Function, default: () => {} }, // 콜백 함수
    depth:    { type: Number, default: 0 }, // 전달값
    counts:   { type: Object, default: null }, // { deptId: cnt } — 노드 우측 카운트 뱃지 (백엔드에서 자손 누적 계산)
  },
  components: { 'bo-dept-tree-node': null },
  created() { this.$options.components['bo-dept-tree-node'] = window.BoDeptTreeNode; },
  setup(props) {

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BoDeptTreeNode : handleBtnAction -> ', cmd, param);
      if (cmd === 'node-toggle') {
        return props.onToggle(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BoDeptTreeNode : handleSelectAction -> ', cmd, param);
      if (cmd === 'node-select') {
        return props.onSelect(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    return { handleBtnAction, handleSelectAction };
  },
  template: `
<div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div :style="{ paddingLeft: (depth * 14) + 'px', display:'flex', alignItems:'center',
    cursor:'pointer', padding:'4px 6px 4px ' + (depth*14+6) + 'px',
    borderRadius:'4px', background: selected === node.deptId ? '#ffeef2' : 'transparent',
    fontWeight: selected === node.deptId ? '600' : 'normal',
    color: selected === node.deptId ? '#e8587a' : '#333' }"
    @click.stop="handleSelectAction('node-select', node.deptId)">
    <span v-if="node.children && node.children.length" @click.stop="handleBtnAction('node-toggle', node.deptId)" style="margin-right:4px;font-size:10px;width:14px;text-align:center;flex-shrink:0;">
    {{ expanded.has(node.deptId) ? '▼' : '▶' }}
  </span>
  <span v-else style="margin-right:4px;width:14px;flex-shrink:0;">
  </span>
  <span style="font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
    {{ node.deptNm }}
  </span>
  <!-- counts(외부 데이터 수) 가 제공되고 비어있지 않으면 우선 표시 (백엔드에서 자손 누적 계산).
       node.deptId === null (루트 "전체") 은 counts['__total__'] 매핑 -->
  <span v-if="counts && Object.keys(counts).length > 0"
    style="font-size:10px;color:#1677ff;background:#e6f4ff;padding:1px 6px;border-radius:8px;flex-shrink:0;font-weight:600;margin-left:4px;">
    {{ counts[node.deptId == null ? '__total__' : node.deptId] != null
       ? counts[node.deptId == null ? '__total__' : node.deptId]
       : 0 }}
  </span>
</div>
<!-- ===== □. 영역 ====================================================== -->
<!-- ===== ■. 조건부 영역 ================================================== -->
<template v-if="node.children && node.children.length && expanded.has(node.deptId)">
<bo-dept-tree-node v-for="child in node.children" :key="child.deptId"
      :node="child" :expanded="expanded" :selected="selected"
      :on-toggle="onToggle" :on-select="onSelect" :depth="depth + 1" :counts="counts" />
</template>
</div>
<!-- ===== □. 조건부 영역 ================================================== -->
`
};

/* ── BoTabBar ────────────────────────────────────────────────────────────
 * Dtl 화면 공통 탭바 + 뷰모드(📑/1▭/2▭/3▭/4▭) 아이콘 그룹.
 *
 * Props:
 *   tabs      (Array<{id, label, icon?, count?}>)  탭 정의 (필수)
 *   tab       (String)   현재 선택된 탭 id
 *   tabMode   (String)   'tab' | '1col' | '2col' | '3col' | '4col' (기본 'tab')
 *   showModes (Boolean)  뷰모드 아이콘 그룹 노출 여부 (기본 true)
 *
 * Emits:
 *   tab-select(id)       탭 클릭
 *   mode-select(mode)    뷰모드 클릭
 *
 * 사용:
 *   <bo-tab-bar :tabs="cfTabs" :tab="tab" :tab-mode="tabMode2"
 *     @tab-select="id => handleBtnAction('tab-select', id)"
 *     @mode-select="m => handleBtnAction('tab-mode', m)" />
 * ───────────────────────────────────────────────────────────────────────── */
window.BoTabBar = {
  name: 'BoTabBar',
  props: {
    tabs:        { type: Array,   default: () => [] },
    tab:         { type: String,  default: '' },
    tabMode:     { type: String,  default: 'tab' },
    showModes:   { type: Boolean, default: true },
    maxCols:     { type: Number,  default: 4 },          // 뷰모드 최대 열 수 (4 또는 5)
    orientation: { type: String,  default: 'horizontal' }, // 'horizontal' (default) | 'vertical'
  },
  emits: ['tab-select', 'mode-select'],
  setup(props, { emit }) {
    const VIEW_MODES_4 = [
      { id: 'tab',  label: '탭',  icon: '📑' },
      { id: '1col', label: '1열', icon: '1▭' },
      { id: '2col', label: '2열', icon: '2▭' },
      { id: '3col', label: '3열', icon: '3▭' },
      { id: '4col', label: '4열', icon: '4▭' },
    ];
    const VIEW_MODES_5 = [
      ...VIEW_MODES_4,
      { id: '5col', label: '5열', icon: '5▭' },
    ];
    const VIEW_MODES = Vue.computed(() => props.maxCols === 5 ? VIEW_MODES_5 : VIEW_MODES_4);
    const onTab  = (id) => { if (props.tabMode === 'tab') emit('tab-select', id); };
    const onMode = (id) => emit('mode-select', id);
    const isTabMode = () => props.tabMode === 'tab';
    return { VIEW_MODES, onTab, onMode, isTabMode };
  },
  template: /* html */`
<div :style="orientation==='vertical'
  ? 'display:flex;gap:8px;margin-bottom:14px;align-items:flex-start;flex-direction:column;width:max-content;'
  : 'display:flex;gap:8px;margin-bottom:14px;align-items:stretch;'">
  <div :style="orientation==='vertical'
    ? 'display:flex;flex-direction:column;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);min-width:160px;'
    : 'flex:1;display:flex;gap:4px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);'">
    <template v-for="t in tabs" :key="t?.id">
      <button v-if="t.visible===undefined || t.visible" @click="onTab(t.id)" :disabled="!isTabMode()"
        :style="{
          flex: orientation==='vertical' ? 'none' : 1,
          width: orientation==='vertical' ? '100%' : 'auto',
          padding:'11px 12px', border:'none', cursor: isTabMode() ? 'pointer' : 'default',
          fontSize:'12.5px', borderRadius:'9px', transition:'all .18s',
          display:'inline-flex', alignItems:'center',
          justifyContent: orientation==='vertical' ? 'flex-start' : 'center',
          gap:'6px',
          opacity: isTabMode() ? 1 : 0.55,
          fontWeight: tab===t.id ? 800 : 600,
          background: (isTabMode() && tab===t.id) ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
          color:      (isTabMode() && tab===t.id) ? '#e8587a' : '#666',
          boxShadow:  (isTabMode() && tab===t.id) ? '0 2px 8px rgba(232,88,122,0.18)' : 'none',
          borderBottom: (isTabMode() && tab===t.id) ? '2px solid #e8587a' : '2px solid transparent'
        }">
        <span v-if="t.icon" style="font-size:14px;">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined" :style="{
          fontSize:'10.5px', fontWeight:800, padding:'1px 7px', borderRadius:'10px',
          background: (isTabMode() && tab===t.id) ? '#e8587a' : '#e5e7eb',
          color:      (isTabMode() && tab===t.id) ? '#fff' : '#666',
          minWidth:'18px', textAlign:'center', marginLeft:'auto'
        }">{{ t.count }}</span>
      </button>
    </template>
  </div>
  <div v-if="showModes" style="display:flex;gap:3px;background:#fff;padding:5px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
    <button v-for="v in VIEW_MODES" :key="v?.id" @click="onMode(v.id)" :title="v.label+'로 보기'"
      :style="{
        padding:'8px 12px', border:'none', cursor:'pointer', fontSize:'13px', borderRadius:'8px',
        fontWeight:  tabMode===v.id ? 800 : 600,
        background:  tabMode===v.id ? 'linear-gradient(135deg,#fff0f4,#ffe4ec)' : 'transparent',
        color:       tabMode===v.id ? '#e8587a' : '#888',
        boxShadow:   tabMode===v.id ? '0 2px 6px rgba(232,88,122,0.18)' : 'none'
      }">
      <span style="font-size:15px;">{{ v.icon }}</span>
    </button>
  </div>
</div>
`,
};
