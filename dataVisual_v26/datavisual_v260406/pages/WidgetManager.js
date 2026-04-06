/* DataVisual — WidgetManager Page */
window.DvPages = window.DvPages || {};
window.DvPages.WidgetManager = {
  name: 'WidgetManager',
  props: ['navigate'],
  template: /* html */ `
<div class="page-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 class="section-title">🧩 위젯 관리</h1>
      <p class="section-subtitle">대시보드에 표시할 위젯을 추가·제거·설정합니다</p>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-primary btn-sm" @click="addAll">모두 활성화</button>
      <button class="btn-outline btn-sm" @click="removeAll">모두 비활성화</button>
      <button class="btn-outline btn-sm" @click="navigate('layout')">🖱️ 레이아웃 편집</button>
    </div>
  </div>

  <!-- Search & Filter -->
  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
    <input v-model="search" type="text" class="form-input" placeholder="위젯명 검색…" style="max-width:240px;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button v-for="cat in cats" :key="cat" @click="activeCat=cat"
        class="btn-outline btn-sm" :style="activeCat===cat?'background:var(--blue);color:#fff;border-color:var(--blue);':''">
        {{ cat }}
      </button>
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid-4" style="margin-bottom:20px;">
    <div class="kpi-card" style="border-top:3px solid var(--blue);">
      <div class="kpi-label">전체 위젯</div>
      <div class="kpi-value" style="color:var(--blue);font-size:1.6rem;">{{ allTypes.length }}</div>
    </div>
    <div class="kpi-card" style="border-top:3px solid var(--green);">
      <div class="kpi-label">활성 위젯</div>
      <div class="kpi-value" style="color:var(--green);font-size:1.6rem;">{{ activeWidgets.length }}</div>
    </div>
    <div class="kpi-card" style="border-top:3px solid var(--orange);">
      <div class="kpi-label">비활성</div>
      <div class="kpi-value" style="color:var(--orange);font-size:1.6rem;">{{ allTypes.length - activeWidgets.length }}</div>
    </div>
    <div class="kpi-card" style="border-top:3px solid var(--purple);">
      <div class="kpi-label">카테고리</div>
      <div class="kpi-value" style="color:var(--purple);font-size:1.6rem;">{{ cats.length - 1 }}</div>
    </div>
  </div>

  <!-- Widget catalog -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:24px;">
    <div v-for="w in filteredTypes" :key="w.typeId"
      class="widget-catalog-item"
      :style="isActive(w.typeId)?'border-color:var(--blue);background:var(--blue-dim);':''">
      <div class="widget-catalog-icon">{{ w.icon }}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:2px;">{{ w.name }}</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="badge badge-blue" style="font-size:0.62rem;">{{ w.category }}</span>
          <span style="font-size:0.68rem;color:var(--text-muted);">기본 {{ w.defaultW }}×{{ w.defaultH }}</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        <button v-if="!isActive(w.typeId)" @click="activate(w)" class="btn-primary btn-sm">추가</button>
        <button v-else @click="deactivate(w.typeId)" class="btn-danger btn-sm">제거</button>
        <button @click="openConfig(w)" class="btn-outline btn-sm">⚙️</button>
      </div>
    </div>
  </div>

  <!-- Active widgets list -->
  <div v-if="activeWidgets.length" style="margin-bottom:24px;">
    <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px;">활성화된 위젯 ({{ activeWidgets.length }}개)</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div v-for="w in activeWidgets" :key="w.id"
        style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);">
        <span style="font-size:1.2rem;">{{ typeOf(w.typeId).icon }}</span>
        <div style="flex:1;">
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">{{ w.title || typeOf(w.typeId).name }}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">{{ typeOf(w.typeId).category }} · {{ w.colSpan }}×{{ w.rowSpan }}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="badge badge-green" style="font-size:0.62rem;">활성</span>
          <button @click="openConfig(typeOf(w.typeId))" class="btn-outline btn-sm">⚙️</button>
          <button @click="deactivate(w.typeId)" class="btn-danger btn-sm">✕</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Config Modal -->
  <div v-if="configWidget" class="modal-overlay" @click.self="configWidget=null">
    <div class="modal-box" style="max-width:400px;">
      <div style="font-size:1.2rem;margin-bottom:4px;">{{ configWidget.icon }} {{ configWidget.name }}</div>
      <div class="modal-title">위젯 설정</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        <div>
          <label class="form-label">위젯 제목</label>
          <input v-model="cfgTitle" class="form-input" :placeholder="configWidget.name">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label class="form-label">가로 크기 (1–12)</label>
            <input v-model.number="cfgW" type="number" min="1" max="12" class="form-input">
          </div>
          <div>
            <label class="form-label">세로 크기 (1–6)</label>
            <input v-model.number="cfgH" type="number" min="1" max="6" class="form-input">
          </div>
        </div>
        <div>
          <label class="form-label">카테고리</label>
          <div style="padding:8px 12px;background:var(--blue-dim);border-radius:7px;font-size:0.82rem;color:var(--blue);font-weight:600;">
            {{ configWidget.category }}
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-outline" @click="configWidget=null">취소</button>
        <button class="btn-primary" @click="saveConfig">저장</button>
      </div>
    </div>
  </div>
</div>
  `,
  setup() {
    const { ref, computed } = Vue;
    const search = ref('');
    const activeCat = ref('전체');
    const configWidget = ref(null);
    const cfgTitle = ref('');
    const cfgW = ref(4);
    const cfgH = ref(2);

    const allTypes = window.DV_CONFIG.widgetTypes;
    const cats = ['전체', ...new Set(allTypes.map(w => w.category))];

    /* Active widgets - start with defaults */
    const activeWidgets = ref(window.DV_CONFIG.defaultLayout.map(item => ({ ...item })));

    const filteredTypes = computed(() => {
      let list = allTypes;
      if (activeCat.value !== '전체') list = list.filter(w => w.category === activeCat.value);
      if (search.value) {
        const q = search.value.toLowerCase();
        list = list.filter(w => w.name.toLowerCase().includes(q));
      }
      return list;
    });

    function isActive(typeId) {
      return activeWidgets.value.some(w => w.typeId === typeId);
    }

    function activate(w) {
      if (isActive(w.typeId)) return;
      activeWidgets.value.push({
        id: 'w' + Date.now(),
        typeId: w.typeId,
        title: w.name,
        colSpan: w.defaultW,
        rowSpan: w.defaultH,
        opts: {},
      });
    }

    function deactivate(typeId) {
      const idx = activeWidgets.value.findIndex(w => w.typeId === typeId);
      if (idx >= 0) activeWidgets.value.splice(idx, 1);
    }

    function addAll() {
      allTypes.forEach(w => activate(w));
    }

    function removeAll() {
      activeWidgets.value = [];
    }

    function typeOf(typeId) {
      return allTypes.find(w => w.typeId === typeId) || { icon: '📊', name: typeId, category: '-' };
    }

    function openConfig(w) {
      configWidget.value = w;
      const existing = activeWidgets.value.find(aw => aw.typeId === w.typeId);
      cfgTitle.value = existing?.title || w.name;
      cfgW.value = existing?.colSpan || w.defaultW;
      cfgH.value = existing?.rowSpan || w.defaultH;
    }

    function saveConfig() {
      const existing = activeWidgets.value.find(w => w.typeId === configWidget.value.typeId);
      if (existing) {
        existing.title = cfgTitle.value || configWidget.value.name;
        existing.colSpan = cfgW.value;
        existing.rowSpan = cfgH.value;
      } else {
        activate(configWidget.value);
        const just = activeWidgets.value[activeWidgets.value.length - 1];
        just.title = cfgTitle.value;
        just.colSpan = cfgW.value;
        just.rowSpan = cfgH.value;
      }
      configWidget.value = null;
    }

    return {
      search, activeCat, cats, allTypes, filteredTypes,
      activeWidgets, isActive, activate, deactivate, addAll, removeAll, typeOf,
      configWidget, cfgTitle, cfgW, cfgH, openConfig, saveConfig,
    };
  }
};
