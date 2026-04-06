/* DataVisual — LayoutManager Page (WYSIWYG 드래그 배치 매니저) */
window.DvPages = window.DvPages || {};
window.DvPages.LayoutManager = {
  name: 'LayoutManager',
  props: ['navigate'],
  template: /* html */ `
<div class="page-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 class="section-title">🖱️ 레이아웃 편집</h1>
      <p class="section-subtitle">위젯을 드래그하여 재배치하고 크기를 조절하세요</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn-outline btn-sm" @click="resetLayout">↺ 초기화</button>
      <button class="btn-outline btn-sm" @click="showAddModal=true">+ 위젯 추가</button>
      <button class="btn-primary btn-sm" @click="saveLayout">💾 저장</button>
    </div>
  </div>

  <!-- Help bar -->
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding:10px 14px;background:var(--blue-dim);border-radius:var(--radius);font-size:0.75rem;color:var(--blue);">
    <span>🖱️ 헤더 드래그 → 재배치</span>
    <span>↔ 가로/세로 크기 조절 버튼</span>
    <span>✕ 위젯 삭제</span>
    <span>12컬럼 그리드 기반</span>
  </div>

  <!-- Grid -->
  <div class="lm-grid" @dragover.prevent @drop="onDrop($event, null)">
    <div
      v-for="item in items"
      :key="item.id"
      class="lm-item"
      :class="{ dragging: dragId===item.id, 'drag-over': dropTarget===item.id }"
      :style="gridArea(item)"
      draggable="true"
      @dragstart="onDragStart($event, item.id)"
      @dragend="onDragEnd"
      @dragover.prevent.stop="dropTarget=item.id"
      @drop.stop="onDrop($event, item.id)"
    >
      <div class="lm-item-header">
        <span class="lm-drag-handle" title="드래그">⣿</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0 6px;">
          {{ typeIcon(item.typeId) }} {{ item.title }}
        </span>
        <div class="lm-resize-btns">
          <button class="lm-resize-btn" @click.stop="resize(item,'w',-1)" title="가로 축소">W−</button>
          <button class="lm-resize-btn" @click.stop="resize(item,'w',+1)" title="가로 확대">W+</button>
          <button class="lm-resize-btn" @click.stop="resize(item,'h',-1)" title="세로 축소">H−</button>
          <button class="lm-resize-btn" @click.stop="resize(item,'h',+1)" title="세로 확대">H+</button>
          <button class="lm-resize-btn" @click.stop="removeItem(item.id)" title="삭제" style="color:var(--red);">✕</button>
        </div>
      </div>
      <div class="lm-item-body">
        <div style="text-align:center;">
          <div style="font-size:2rem;margin-bottom:4px;">{{ typeIcon(item.typeId) }}</div>
          <div style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);">{{ item.title }}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">{{ item.colSpan }}×{{ item.rowSpan }} 칸</div>
        </div>
      </div>
    </div>

    <!-- Empty drop zone hint -->
    <div v-if="items.length===0" style="grid-column:span 12;display:flex;align-items:center;justify-content:center;min-height:200px;color:var(--text-muted);font-size:0.9rem;">
      위젯을 추가하거나 상단의 "+ 위젯 추가" 버튼을 눌러 시작하세요
    </div>
  </div>

  <!-- Layout JSON preview -->
  <div style="margin-top:20px;">
    <div style="font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">레이아웃 정보 ({{ items.length }}개 위젯)</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
      <div v-for="item in items" :key="'info-'+item.id"
        style="padding:8px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;font-size:0.72rem;">
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:3px;">{{ typeIcon(item.typeId) }} {{ item.title }}</div>
        <div style="color:var(--text-muted);">크기: {{ item.colSpan }}×{{ item.rowSpan }} | 위치: {{ item.col }},{{ item.row }}</div>
      </div>
    </div>
  </div>

  <!-- Saved confirmation -->
  <div v-if="savedMsg" style="position:fixed;bottom:24px;right:24px;padding:10px 18px;background:var(--green);color:#fff;border-radius:8px;font-size:0.85rem;font-weight:700;z-index:9999;">
    ✅ 레이아웃 저장됨
  </div>

  <!-- Add Widget Modal -->
  <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal=false">
    <div class="modal-box" style="max-width:520px;">
      <div class="modal-title">🧩 위젯 추가</div>
      <input v-model="addSearch" type="text" class="form-input" placeholder="위젯 검색…" style="margin-bottom:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:360px;overflow-y:auto;">
        <div v-for="w in filteredAddTypes" :key="w.typeId"
          @click="addWidget(w)"
          class="widget-catalog-item" style="cursor:pointer;">
          <span style="font-size:1.3rem;">{{ w.icon }}</span>
          <div>
            <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">{{ w.name }}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);">{{ w.category }} · {{ w.defaultW }}×{{ w.defaultH }}</div>
          </div>
        </div>
      </div>
      <div class="modal-actions" style="margin-top:16px;">
        <button class="btn-outline" @click="showAddModal=false">닫기</button>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, computed } = Vue;

    /* ── Items state ── */
    const items = ref(
      window.DV_CONFIG.defaultLayout.map((item, i) => ({
        ...item,
        col: ((i * 3) % 12) + 1,
        row: Math.floor(i / 4) + 1,
      }))
    );

    const dragId = ref(null);
    const dropTarget = ref(null);
    const savedMsg = ref(false);
    const showAddModal = ref(false);
    const addSearch = ref('');

    /* ── Type helpers ── */
    const allTypes = window.DV_CONFIG.widgetTypes;

    function typeIcon(typeId) {
      const t = allTypes.find(w => w.typeId === typeId);
      return t ? t.icon : '📊';
    }

    /* ── Grid area CSS ── */
    function gridArea(item) {
      return `grid-column:${item.col}/span ${item.colSpan};grid-row:${item.row}/span ${item.rowSpan};`;
    }

    /* ── Drag ── */
    function onDragStart(e, id) {
      dragId.value = id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
    function onDragEnd() {
      dragId.value = null;
      dropTarget.value = null;
    }
    function onDrop(e, targetId) {
      e.preventDefault();
      dropTarget.value = null;
      const srcId = e.dataTransfer.getData('text/plain') || dragId.value;
      if (!srcId || srcId === targetId || !targetId) return;
      const src = items.value.find(i => i.id === srcId);
      const tgt = items.value.find(i => i.id === targetId);
      if (!src || !tgt) return;
      // Swap col/row positions
      const tmp = { col: src.col, row: src.row };
      src.col = tgt.col; src.row = tgt.row;
      tgt.col = tmp.col; tgt.row = tmp.row;
      dragId.value = null;
    }

    /* ── Resize ── */
    function resize(item, dim, delta) {
      if (dim === 'w') {
        const nw = Math.max(1, Math.min(12, item.colSpan + delta));
        item.colSpan = nw;
      } else {
        item.rowSpan = Math.max(1, Math.min(6, item.rowSpan + delta));
      }
    }

    /* ── Remove ── */
    function removeItem(id) {
      const idx = items.value.findIndex(i => i.id === id);
      if (idx >= 0) items.value.splice(idx, 1);
    }

    /* ── Reset ── */
    function resetLayout() {
      let col = 1, row = 1;
      items.value = window.DV_CONFIG.defaultLayout.map((item, i) => {
        const obj = { ...item, col: ((i * 3) % 12) + 1, row: Math.floor(i / 4) + 1 };
        return obj;
      });
    }

    /* ── Save ── */
    function saveLayout() {
      try { localStorage.setItem('dv_layout', JSON.stringify(items.value)); } catch (e) {}
      savedMsg.value = true;
      setTimeout(() => { savedMsg.value = false; }, 2000);
    }

    /* ── Add Widget ── */
    const filteredAddTypes = computed(() => {
      if (!addSearch.value) return allTypes;
      const q = addSearch.value.toLowerCase();
      return allTypes.filter(w => w.name.toLowerCase().includes(q) || w.category.toLowerCase().includes(q));
    });

    function addWidget(w) {
      const maxRow = items.value.reduce((m, i) => Math.max(m, i.row + i.rowSpan - 1), 0);
      items.value.push({
        id: 'w' + Date.now(),
        typeId: w.typeId,
        title: w.name,
        colSpan: w.defaultW,
        rowSpan: w.defaultH,
        col: 1,
        row: maxRow + 1,
        opts: {},
      });
      showAddModal.value = false;
    }

    /* ── Load saved layout on mount ── */
    try {
      const saved = localStorage.getItem('dv_layout');
      if (saved) items.value = JSON.parse(saved);
    } catch (e) {}

    return {
      items, dragId, dropTarget, savedMsg, showAddModal, addSearch,
      filteredAddTypes, typeIcon, gridArea,
      onDragStart, onDragEnd, onDrop, resize, removeItem, resetLayout, saveLayout, addWidget,
    };
  }
};
