/* DataVisual — GridPanel (선택 가능한 위젯 그리드) */
window.DvPanels = window.DvPanels || {};
window.DvPanels.GridPanel = {
  name: 'GridPanel',
  template: /* html */ `
<div>
  <!-- 선택 컨트롤 -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;padding:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);">
    <span style="font-size:0.78rem;font-weight:700;color:var(--text-secondary);align-self:center;">레이아웃 선택:</span>
    <button v-for="opt in layoutOpts" :key="opt.id" @click="currentLayout=opt.id"
      class="btn-outline btn-sm" :class="currentLayout===opt.id?'btn-primary':''">
      {{ opt.label }}
    </button>
  </div>

  <!-- 2컬럼 -->
  <div v-if="currentLayout==='2col'" class="grid-2" style="margin-bottom:16px;">
    <line-chart-widget title="방문자 추이" :height="220" />
    <bar-chart-widget  title="채널별 매출" :height="220" />
    <area-chart-widget title="누적 수익"   :height="220" />
    <radar-chart-widget title="성과 비교"  :height="220" />
  </div>

  <!-- 3컬럼 -->
  <div v-if="currentLayout==='3col'" class="grid-3" style="margin-bottom:16px;">
    <line-chart-widget    title="라인" :height="200" />
    <bar-chart-widget     title="바"   :height="200" />
    <pie-chart-widget     title="파이" :height="200" />
    <area-chart-widget    title="에어리어" :height="200" />
    <radar-chart-widget   title="레이더"  :height="200" />
    <scatter-chart-widget title="산점도"  :height="200" />
  </div>

  <!-- 4컬럼 Mixed -->
  <div v-if="currentLayout==='mixed'" style="margin-bottom:16px;">
    <div class="grid-4" style="margin-bottom:16px;">
      <kpi-widget title="방문자" value="128K" trend="+12%" dir="up" icon="👥" color="blue" />
      <kpi-widget title="전환율" value="4.8%" trend="+0.6%" dir="up" icon="🎯" color="green" />
      <kpi-widget title="매출"   value="₩84M" trend="-2%" dir="down" icon="💰" color="orange" />
      <kpi-widget title="신규"   value="3,241" trend="+8%" dir="up" icon="🔥" color="purple" />
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px;">
      <line-chart-widget title="메인 지표" :height="230" />
      <div style="display:flex;flex-direction:column;gap:12px;">
        <gauge-widget title="부하율" label="%" :height="140" />
        <pie-chart-widget title="분포" :donut="true" :height="140" />
      </div>
    </div>
    <div class="grid-3">
      <stacked-bar-widget title="스택 바" :height="200" />
      <bubble-chart-widget title="버블" :height="200" />
      <heatmap-widget title="히트맵" :rows="7" :cols="12" />
    </div>
  </div>

  <!-- 풀스크린 단일 -->
  <div v-if="currentLayout==='single'" style="margin-bottom:16px;">
    <realtime-scatter-widget title="실시간 시계열 (풀)" :height="420" :max-pts="120" />
  </div>
</div>
  `,
  setup() {
    const { ref } = Vue;
    const currentLayout = ref('mixed');
    const layoutOpts = [
      { id: '2col',   label: '2컬럼' },
      { id: '3col',   label: '3컬럼' },
      { id: 'mixed',  label: '혼합' },
      { id: 'single', label: '실시간 단일' },
    ];
    return { currentLayout, layoutOpts };
  }
};
