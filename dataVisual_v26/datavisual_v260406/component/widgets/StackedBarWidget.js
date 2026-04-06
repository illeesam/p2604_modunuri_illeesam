/* DataVisual — StackedBarWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.StackedBarWidget = {
  name: 'StackedBarWidget',
  props: {
    title:  { default: '스택 바 차트' },
    height: { default: 220 },
    horizontal: { default: false },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">📊 {{ title }}</span>
    <button class="widget-btn" @click="refresh">↻</button>
  </div>
  <div class="widget-body">
    <div class="chart-wrap" :style="'height:'+height+'px'">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, onMounted, onBeforeUnmount } = Vue;
    const canvasRef = ref(null);
    let chart = null;
    const pal = window.DV_CONFIG.palette;

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }
      const labels = props.horizontal ? ['제품A','제품B','제품C','제품D','제품E'] : window.DvData.months.slice(0, 7);
      const segments = ['직접','소셜','검색','이메일'];
      const datasets = segments.map((seg, i) => ({
        label: seg,
        data: window.DvData.randArr(labels.length, 50, 300),
        backgroundColor: pal[i] + 'cc',
      }));

      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: props.horizontal ? 'y' : 'x',
          plugins: {
            legend: { labels: { color: 'var(--text-secondary)', boxWidth: 12, font: { size: 11 } } },
          },
          scales: {
            x: { stacked: true, ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
            y: { stacked: true, ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
          },
        },
      });
    }

    const refresh = createChart;
    onMounted(() => { setTimeout(createChart, 50); });
    onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null; } });
    return { canvasRef, refresh };
  }
};
