/* DataVisual — HeatmapWidget (CSS/SVG 기반) */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.HeatmapWidget = {
  name: 'HeatmapWidget',
  props: {
    title:  { default: '히트맵' },
    rows:   { default: 7 },
    cols:   { default: 24 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">🔥 {{ title }}</span>
    <div class="widget-actions">
      <button class="widget-btn" @click="generate">↻</button>
    </div>
  </div>
  <div class="widget-body">
    <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:6px;display:flex;justify-content:space-between;">
      <span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
    </div>
    <div class="heatmap-grid" :style="'grid-template-columns:repeat('+cols+',1fr);'">
      <div
        v-for="(cell,i) in cells" :key="i"
        class="heatmap-cell"
        :style="'background:'+cellColor(cell.v)+';padding-bottom:'+Math.floor(100/rows)+'%;'"
        :title="rowLabels[cell.r]+' '+cell.h+'시 : '+cell.v"
      ></div>
    </div>
    <div style="margin-top:8px;display:flex;align-items:center;gap:6px;justify-content:flex-end;">
      <span style="font-size:0.65rem;color:var(--text-muted);">낮음</span>
      <div style="display:flex;gap:2px;">
        <div v-for="s in 8" :key="s" style="width:12px;height:8px;border-radius:2px;" :style="'background:'+scaleColor(s/8)"></div>
      </div>
      <span style="font-size:0.65rem;color:var(--text-muted);">높음</span>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, onMounted } = Vue;
    const cells = ref([]);
    const rowLabels = ['월','화','수','목','금','토','일'];

    function generate() {
      const arr = [];
      for (let r = 0; r < props.rows; r++) {
        for (let h = 0; h < props.cols; h++) {
          // Higher probability during daytime hours
          const peak = (h >= 9 && h <= 18) ? 1.8 : 0.6;
          arr.push({ r, h, v: Math.floor(Math.random() * 100 * peak) });
        }
      }
      cells.value = arr;
    }

    function cellColor(v) {
      if (v < 10) return 'rgba(0,153,204,0.05)';
      const t = Math.min(v / 100, 1);
      if (t < 0.25) return `rgba(0,153,204,${0.2 + t * 0.8})`;
      if (t < 0.5)  return `rgba(0,201,122,${0.3 + t})`;
      if (t < 0.75) return `rgba(245,158,11,${0.4 + t * 0.6})`;
      return `rgba(239,68,68,${0.5 + t * 0.5})`;
    }

    function scaleColor(t) {
      if (t < 0.25) return `rgba(0,153,204,${0.2 + t * 0.8})`;
      if (t < 0.5)  return `rgba(0,201,122,${0.3 + t})`;
      if (t < 0.75) return `rgba(245,158,11,${0.4 + t * 0.6})`;
      return `rgba(239,68,68,${0.5 + t * 0.5})`;
    }

    onMounted(generate);
    return { cells, rowLabels, generate, cellColor, scaleColor };
  }
};
