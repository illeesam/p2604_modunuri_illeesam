/* DataVisual — BarChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.BarChartWidget = {
  name: 'BarChartWidget',
  props: {
    title:  { default: '바 차트' },
    labels: { default: null },
    height: { default: 220 },
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
      const labels = props.labels || ['채널 A','채널 B','채널 C','채널 D','채널 E','채널 F'];
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: '이번달', data: window.DvData.randArr(labels.length, 100, 800), backgroundColor: pal.map(c => c + 'bb') },
            { label: '저번달', data: window.DvData.randArr(labels.length, 80, 700),  backgroundColor: pal.map(c => c + '44') },
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
