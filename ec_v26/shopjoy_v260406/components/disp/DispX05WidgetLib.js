/* ShopJoy Admin - 위젯라이브러리 경로 트리 컴포넌트 */
window.DispX05WidgetLib = {
  name: 'DispX05WidgetLib',
  props: ['widgetLibs', 'selectedLibId'],
  emits: ['select'],
  setup(props, { emit }) {
    const { computed, ref } = Vue;

    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊', 'chart_line':'📈',
      'chart_pie':'🥧', 'text_banner':'📝', 'info_card':'ℹ️',
      'popup':'💬', 'file':'📎', 'file_list':'📁',
      'coupon':'🎟', 'html_editor':'📄', 'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',
    };

    /* ── 트리 구성 ── */
    /* usedPaths 없는 위젯은 "(미등록)" 그룹으로 */
    const tree = computed(() => {
      const map = {}; // { '홈': { '메인배너': [lib, ...] } }

      const addToPath = (lib, pathStr) => {
        const parts = pathStr.split('>').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0];
        const rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };

      (props.widgetLibs || []).forEach(lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) {
          addToPath(lib, '(미등록) > (미등록)');
        } else {
          lib.usedPaths.forEach(p => addToPath(lib, p));
        }
      });

      /* map → sorted array */
      return Object.keys(map).sort().map(top => ({
        label: top,
        children: Object.keys(map[top]).sort().map(sub => ({
          label: sub,
          libs: map[top][sub],
        })),
      }));
    });

    /* ── 열림/닫힘 ── */
    const openNodes = ref(new Set());
    const toggleNode = (key) => {
      if (openNodes.value.has(key)) openNodes.value.delete(key);
      else openNodes.value.add(key);
    };
    const isOpen = (key) => openNodes.value.has(key);

    /* 최상위 노드의 모든 서브노드 일괄 열기/닫기 */
    const allChildrenOpen = (node) =>
      node.children.every(sub => openNodes.value.has(node.label + '_' + sub.label));
    const toggleAllChildren = (e, node) => {
      e.stopPropagation();
      const open = !allChildrenOpen(node);
      node.children.forEach(sub => {
        const key = node.label + '_' + sub.label;
        if (open) openNodes.value.add(key);
        else openNodes.value.delete(key);
      });
      /* 최상위 노드 자체도 열어줌 */
      if (open) openNodes.value.add(node.label);
    };

    /* 기본으로 첫 번째 노드 열기 */
    Vue.watchEffect(() => {
      if (tree.value.length && openNodes.value.size === 0) {
        openNodes.value.add(tree.value[0].label);
      }
    });

    /* ── 드래그 (단일 위젯) ── */
    const onDragStart = (e, lib) => {
      window._dragWidgetLib  = lib;
      window._dragWidgetLibs = null;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', lib.libId);
    };
    const onDragEnd = () => { window._dragWidgetLib = null; };

    /* ── 드래그 (노드 → 하위 위젯 일괄) ── */
    const dedupeLibs = (arr) => {
      const seen = new Set();
      return arr.filter(lib => { if (seen.has(lib.libId)) return false; seen.add(lib.libId); return true; });
    };
    const onNodeDragStart = (e, allLibs) => {
      const libs = dedupeLibs(allLibs);
      window._dragWidgetLib  = null;
      window._dragWidgetLibs = libs;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', 'node:' + libs.length);
    };
    const onNodeDragEnd = () => { window._dragWidgetLibs = null; };

    return { tree, openNodes, toggleNode, isOpen, WIDGET_ICONS, emit,
             onDragStart, onDragEnd, onNodeDragStart, onNodeDragEnd,
             allChildrenOpen, toggleAllChildren };
  },
  template: /* html */`
<div style="height:100%;overflow-y:auto;padding:4px 0;">
  <div v-for="node in tree" :key="node.label">
    <!-- 최상위 경로 -->
    <div @click="toggleNode(node.label)"
      draggable="true"
      @dragstart="onNodeDragStart($event, node.children.flatMap(c => c.libs))"
      @dragend="onNodeDragEnd"
      style="display:flex;align-items:center;gap:6px;padding:6px 12px;cursor:grab;font-size:12px;font-weight:700;color:#374151;user-select:none;border-radius:4px;margin:1px 4px;"
      :style="isOpen(node.label) ? 'background:#f0f4ff;' : ''">
      <span style="font-size:10px;color:#9ca3af;transition:transform .2s;"
        :style="isOpen(node.label) ? 'transform:rotate(90deg);' : ''">▶</span>
      <span>{{ node.label }}</span>
      <span style="margin-left:auto;font-size:10px;background:#e5e7eb;color:#6b7280;border-radius:8px;padding:0 6px;">
        {{ node.children.reduce((acc,c)=>acc+c.libs.length,0) }}
      </span>
      <span v-if="isOpen(node.label)" @click="toggleAllChildren($event, node)"
        :title="allChildrenOpen(node) ? '하위 모두 닫기' : '하위 모두 열기'"
        style="font-size:10px;color:#9ca3af;padding:1px 4px;border-radius:3px;cursor:pointer;flex-shrink:0;"
        :style="allChildrenOpen(node) ? 'color:#1d4ed8;' : ''"
      >{{ allChildrenOpen(node) ? '⊟' : '⊞' }}</span>
    </div>

    <!-- 서브경로 -->
    <template v-if="isOpen(node.label)">
      <div v-for="sub in node.children" :key="node.label+'_'+sub.label">
        <div @click="toggleNode(node.label+'_'+sub.label)"
          draggable="true"
          @dragstart="onNodeDragStart($event, sub.libs)"
          @dragend="onNodeDragEnd"
          style="display:flex;align-items:center;gap:6px;padding:5px 12px 5px 26px;cursor:grab;font-size:11px;font-weight:600;color:#4b5563;border-radius:4px;margin:1px 4px;"
          :style="isOpen(node.label+'_'+sub.label) ? 'background:#f9fafb;' : ''">
          <span style="font-size:9px;color:#9ca3af;transition:transform .2s;"
            :style="isOpen(node.label+'_'+sub.label) ? 'transform:rotate(90deg);' : ''">▶</span>
          <span>{{ sub.label }}</span>
          <span style="margin-left:auto;font-size:10px;background:#e5e7eb;color:#6b7280;border-radius:8px;padding:0 5px;">{{ sub.libs.length }}</span>
        </div>

        <!-- 위젯 항목 -->
        <template v-if="isOpen(node.label+'_'+sub.label)">
          <div v-for="lib in sub.libs" :key="lib.libId"
            draggable="true"
            @dragstart="onDragStart($event, lib)"
            @dragend="onDragEnd"
            @click="emit('select', lib)"
            style="display:flex;align-items:center;gap:7px;padding:5px 10px 5px 42px;cursor:grab;font-size:11px;border-radius:4px;margin:1px 4px;transition:background .15s;"
            :style="selectedLibId===lib.libId
              ? 'background:#dbeafe;color:#1d4ed8;font-weight:700;'
              : 'color:#374151;'">
            <span style="font-size:9px;color:#c4c4c4;flex-shrink:0;">⠿</span>
            <span style="font-size:13px;flex-shrink:0;">{{ WIDGET_ICONS[lib.widgetType] || '▪' }}</span>
            <span style="font-size:9px;background:#f0f4ff;color:#1d4ed8;border:1px solid #dbeafe;border-radius:3px;padding:0 4px;white-space:nowrap;flex-shrink:0;">{{ lib.widgetType ? lib.widgetType.replace('_',' ') : '-' }}</span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ lib.name }}</span>
            <span style="font-size:9px;color:#9ca3af;flex-shrink:0;">#{{ String(lib.libId).padStart(4,'0') }}</span>
          </div>
        </template>
      </div>
    </template>
  </div>
  <div v-if="!tree.length" style="padding:24px;text-align:center;color:#ccc;font-size:12px;">위젯이 없습니다.</div>
</div>
  `,
};
