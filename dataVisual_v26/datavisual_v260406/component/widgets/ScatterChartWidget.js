/* DataVisual — ScatterChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.ScatterChartWidget = {
  name: 'ScatterChartWidget',
  props: {
    title:  { default: '산점도 차트' },
    height: { default: 220 },
    n:      { default: 50 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">✨ {{ title }}</span>
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

    function genPoints(n) {
      return Array.from({ length: n }, () => ({
        x: window.DvData.randFloat(-10, 10),
        y: window.DvData.randFloat(-10, 10),
      }));
    }

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [
            { label: '그룹 A', data: genPoints(props.n), backgroundColor: pal[0] + 'aa', pointRadius: 5 },
            { label: '그룹 B', data: genPoints(props.n), backgroundColor: pal[2] + 'aa', pointRadius: 5 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'var(--text-secondary)', boxWidth: 12, font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
            y: { ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
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
