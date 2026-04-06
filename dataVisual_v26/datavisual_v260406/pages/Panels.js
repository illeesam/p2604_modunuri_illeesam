/* DataVisual — Panels Page */
window.DvPages = window.DvPages || {};
window.DvPages.Panels = {
  name: 'Panels',
  props: ['navigate'],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:20px;">
    <h1 class="section-title">🔲 패널 보기</h1>
    <p class="section-subtitle">다양한 레이아웃으로 위젯을 배치한 패널</p>
  </div>

  <div class="tab-bar">
    <button v-for="t in tabs" :key="t.id" class="tab-btn" :class="{active:activeTab===t.id}" @click="activeTab=t.id">
      {{ t.label }}
    </button>
  </div>

  <div v-if="activeTab==='dashboard'"> <dashboard-panel :navigate="navigate" /> </div>
  <div v-if="activeTab==='analytics'"> <analytics-panel /> </div>
  <div v-if="activeTab==='grid'">      <grid-panel /> </div>
  <div v-if="activeTab==='realtime'">  <realtime-panel /> </div>
</div>
  `,
  setup() {
    const { ref } = Vue;
    const tabs = [
      { id: 'dashboard', label: '📊 대시보드 패널' },
      { id: 'analytics', label: '🔍 분석 패널' },
      { id: 'grid',      label: '🔲 그리드 패널' },
      { id: 'realtime',  label: '⚡ 실시간 패널' },
    ];
    const activeTab = ref('dashboard');
    return { tabs, activeTab };
  }
};
