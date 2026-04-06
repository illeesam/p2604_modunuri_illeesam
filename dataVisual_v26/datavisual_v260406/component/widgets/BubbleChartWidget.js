/* DataVisual — BubbleChartWidget */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.BubbleChartWidget = {
  name: 'BubbleChartWidget',
  props: {
    title:  { default: '버블 차트' },
    height: { default: 220 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">🫧 {{ title }}</span>
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

    function genBubbles(n, color) {
      return Array.from({ length: n }, () => ({
        x: window.DvData.randFloat(0, 100),
        y: window.DvData.randFloat(0, 100),
        r: window.DvData.rand(5, 25),
      }));
    }

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'bubble',
        data: {
          datasets: [
            { label: '시장 A', data: genBubbles(12), backgroundColor: pal[0] + '88', borderColor: pal[0] },
            { label: '시장 B', data: genBubbles(10), backgroundColor: pal[2] + '88', borderColor: pal[2] },
            { label: '시장 C', data: genBubbles(8),  backgroundColor: pal[3] + '88', borderColor: pal[3] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'var(--text-secondary)', boxWidth: 12, font: { size: 11 } } } },
          scales: {
            x: { title: { display: true, text: '성장률(%)', color: 'var(--text-muted)' }, ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
            y: { title: { display: true, text: '시장규모',  color: 'var(--text-muted)' }, ticks: { color: 'var(--text-muted)', font: { size: 10 } }, grid: { color: 'var(--border)' } },
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
