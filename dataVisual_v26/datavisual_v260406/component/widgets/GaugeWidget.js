/* DataVisual — GaugeWidget (반원 도넛) */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.GaugeWidget = {
  name: 'GaugeWidget',
  props: {
    title:  { default: '게이지' },
    label:  { default: '%' },
    height: { default: 180 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">⏱️ {{ title }}</span>
    <button class="widget-btn" @click="randomize">↻</button>
  </div>
  <div class="widget-body" style="align-items:center;justify-content:center;">
    <div style="position:relative;width:100%;" :style="'height:'+height+'px'">
      <canvas ref="canvasRef"></canvas>
      <div style="position:absolute;bottom:18px;left:0;right:0;text-align:center;">
        <div class="gauge-value">{{ displayVal }}{{ label }}</div>
        <div class="gauge-label">{{ statusText }}</div>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, onMounted, onBeforeUnmount } = Vue;
    const canvasRef = ref(null);
    const displayVal = ref(0);
    let chart = null;

    const statusText = ref('');

    function getStatus(v) {
      if (v < 30) return '⚠️ 주의 필요';
      if (v < 60) return '🟡 보통';
      if (v < 85) return '🟢 양호';
      return '🔵 최고';
    }

    function setVal(v) {
      displayVal.value = v;
      statusText.value = getStatus(v);
      if (!chart) return;
      chart.data.datasets[0].data = [v, 100 - v];
      chart.update();
    }

    function randomize() { setVal(window.DvData.rand(10, 98)); }

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }
      const val = window.DvData.rand(30, 95);
      displayVal.value = val;
      statusText.value = getStatus(val);

      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [val, 100 - val],
            backgroundColor: [
              val < 30 ? '#f59e0b' : val < 70 ? '#0099cc' : '#00c97a',
              'rgba(0,0,0,0.06)',
            ],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          animation: { duration: 600 },
        },
      });
    }

    onMounted(() => { setTimeout(createChart, 50); });
    onBeforeUnmount(() => { if (chart) { chart.destroy(); chart = null; } });
    return { canvasRef, displayVal, statusText, randomize };
  }
};
