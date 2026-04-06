/* DataVisual — RadarChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.RadarChartWidget = {
  name: 'RadarChartWidget',
  props: {
    title:  { default: '레이더 차트' },
    height: { default: 220 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">🕸️ {{ title }}</span>
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
      const labels = ['속도','정확도','안정성','확장성','보안','UX'];
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'radar',
        data: {
          labels,
          datasets: [
            { label: '제품 A', data: window.DvData.randArr(6, 50, 100), borderColor: pal[0], backgroundColor: pal[0] + '33', pointBackgroundColor: pal[0] },
            { label: '제품 B', data: window.DvData.randArr(6, 40, 95),  borderColor: pal[1], backgroundColor: pal[1] + '33', pointBackgroundColor: pal[1] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'var(--text-secondary)', boxWidth: 12, font: { size: 11 } } } },
          scales: {
            r: {
              ticks: { color: 'var(--text-muted)', font: { size: 9 }, backdropColor: 'transparent' },
              grid: { color: 'var(--border)' },
              pointLabels: { color: 'var(--text-secondary)', font: { size: 11 } },
              angleLines: { color: 'var(--border)' },
            },
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
