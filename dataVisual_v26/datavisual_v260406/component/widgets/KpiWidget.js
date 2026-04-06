/* DataVisual — KpiWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.KpiWidget = {
  name: 'KpiWidget',
  props: {
    title: { default: 'KPI 지표' },
    value: { default: '0' },
    trend: { default: '+0%' },
    dir:   { default: 'up' },   /* 'up' | 'down' */
    icon:  { default: '📊' },
    color: { default: 'blue' }, /* blue | green | orange | purple | teal */
    sub:   { default: '' },
  },
  template: /* html */ `
<div class="kpi-card" :style="'border-top:3px solid var(--'+color+')'">
  <div class="kpi-icon">{{ icon }}</div>
  <div class="kpi-label">{{ title }}</div>
  <div class="kpi-value" :style="'color:var(--'+color+')'">{{ value }}</div>
  <div v-if="sub" style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">{{ sub }}</div>
  <div class="kpi-badge" :class="dir==='up'?'up':'down'">
    <span>{{ dir==='up'?'▲':'▼' }}</span>
    <span>{{ trend }}</span>
  </div>
</div>
  `,
};
