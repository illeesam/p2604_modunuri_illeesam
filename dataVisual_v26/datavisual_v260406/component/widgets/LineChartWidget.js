/* DataVisual — LineChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.LineChartWidget = {
  name: 'LineChartWidget',
  props: {
    title:    { default: '라인 차트' },
    labels:   { default: null },
    datasets: { default: null },
    height:   { default: 220 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">📈 {{ title }}</span>
    <div class="widget-actions">
      <button class="widget-btn" @click="refresh" title="새로고침">↻</button>
    </div>
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

    function buildData() {
      const labels = props.labels || window.DvData.months;
      const datasets = props.datasets || [
        { label: '2025', data: window.DvData.randArr(labels.length, 300, 900), borderColor: window.DV_CONFIG.palette[0], backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
        { label: '2026', data: window.DvData.randArr(labels.length, 400, 1000), borderColor: window.DV_CONFIG.palette[1], backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
      ];
      return { labels, datasets };
    }

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'line',
        data: buildData(),
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

    function refresh() { createChart(); }

    onMounted(() => { setTimeout(createChart, 50); });
    onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null; } });

    return { canvasRef, refresh };
  }
};
