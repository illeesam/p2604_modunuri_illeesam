/* DataVisual — PieChartWidget (Pie & Donut) */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.PieChartWidget = {
  name: 'PieChartWidget',
  props: {
    title:  { default: '파이 차트' },
    donut:  { default: false },
    height: { default: 220 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">{{ donut?'🍩':'🥧' }} {{ title }}</span>
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
      const labels = ['검색','소셜','직접','이메일','유료','기타'];
      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data: window.DvData.randArr(labels.length, 10, 50), backgroundColor: pal, borderWidth: 2 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: props.donut ? '60%' : 0,
          plugins: { legend: { position: 'right', labels: { color: 'var(--text-secondary)', boxWidth: 10, font: { size: 10 } } } },
        },
      });
    }

    const refresh = createChart;
    onMounted(() => { setTimeout(createChart, 50); });
    onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null; } });
    return { canvasRef, refresh };
  }
};
