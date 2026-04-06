/* DataVisual — AreaChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.AreaChartWidget = {
  name: 'AreaChartWidget',
  props: {
    title:  { default: '에어리어 차트' },
    height: { default: 220 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">🌊 {{ title }}</span>
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
      const labels = window.DvData.months;
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: '수익', data: window.DvData.randArr(12, 200, 900),
              borderColor: pal[0], backgroundColor: pal[0] + '33',
              fill: true, tension: 0.4, pointRadius: 3,
            },
            {
              label: '비용', data: window.DvData.randArr(12, 100, 600),
              borderColor: pal[4], backgroundColor: pal[4] + '22',
              fill: true, tension: 0.4, pointRadius: 3,
            },
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
