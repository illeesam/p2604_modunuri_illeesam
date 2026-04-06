/* DataVisual — RealtimeScatterWidget (1초 간격 시계열 산점도) */
window.DvWidgets = window.DvWidgets || {};
window.DvWidgets.RealtimeScatterWidget = {
  name: 'RealtimeScatterWidget',
  props: {
    title:    { default: '실시간 시계열 산점도' },
    maxPts:   { default: 60 },
    interval: { default: 1000 },
    height:   { default: 240 },
  },
  template: /* html */ `
<div class="widget-card" style="height:100%;">
  <div class="widget-header">
    <span class="widget-title">⚡ {{ title }}</span>
    <div class="widget-actions" style="gap:8px;">
      <div class="rt-badge"><div class="rt-dot"></div>LIVE</div>
      <span style="font-size:0.7rem;color:var(--text-muted);">{{ ptCount }}pts</span>
      <button class="widget-btn" @click="togglePause">{{ paused?'▶':'⏸' }}</button>
      <button class="widget-btn" @click="clearData">✕</button>
    </div>
  </div>
  <div class="widget-body">
    <div class="chart-wrap" :style="'height:'+height+'px'">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div style="margin-top:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
      <div style="text-align:center;padding:6px;background:var(--blue-dim);border-radius:7px;">
        <div style="font-size:0.65rem;color:var(--text-muted);">현재값</div>
        <div style="font-size:0.9rem;font-weight:800;color:var(--blue);">{{ lastVal.toFixed(1) }}</div>
      </div>
      <div style="text-align:center;padding:6px;background:var(--green-dim);border-radius:7px;">
        <div style="font-size:0.65rem;color:var(--text-muted);">최대</div>
        <div style="font-size:0.9rem;font-weight:800;color:var(--green);">{{ maxVal.toFixed(1) }}</div>
      </div>
      <div style="text-align:center;padding:6px;background:var(--purple-dim);border-radius:7px;">
        <div style="font-size:0.65rem;color:var(--text-muted);">평균</div>
        <div style="font-size:0.9rem;font-weight:800;color:var(--purple);">{{ avgVal.toFixed(1) }}</div>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { ref, computed, onMounted, onBeforeUnmount } = Vue;
    const canvasRef = ref(null);
    const paused = ref(false);
    const ptCount = ref(0);
    const lastVal = ref(0);
    const maxVal = ref(0);
    const avgVal = ref(0);
    let chart = null;
    let timer = null;
    let t = 0;
    let allVals = [];

    /* simulate multi-signal with noise */
    function nextPoint() {
      const base = 50 + 30 * Math.sin(t * 0.15) + 10 * Math.cos(t * 0.4);
      return { x: Date.now(), y: parseFloat((base + (Math.random() - 0.5) * 14).toFixed(2)) };
    }
    function nextPoint2() {
      const base = 30 + 20 * Math.cos(t * 0.1) + 8 * Math.sin(t * 0.5);
      return { x: Date.now(), y: parseFloat((base + (Math.random() - 0.5) * 10).toFixed(2)) };
    }

    function tick() {
      if (!chart || paused.value) return;
      t++;
      const p1 = nextPoint();
      const p2 = nextPoint2();

      [chart.data.datasets[0].data, chart.data.datasets[1].data].forEach((arr, si) => {
        arr.push(si === 0 ? p1 : p2);
        if (arr.length > props.maxPts) arr.shift();
      });

      allVals.push(p1.y);
      if (allVals.length > 200) allVals.shift();
      lastVal.value = p1.y;
      maxVal.value = parseFloat(Math.max(...chart.data.datasets[0].data.map(d => d.y)).toFixed(1));
      avgVal.value = parseFloat((allVals.reduce((s, v) => s + v, 0) / allVals.length).toFixed(1));
      ptCount.value = chart.data.datasets[0].data.length;

      chart.update('none');
    }

    function clearData() {
      if (!chart) return;
      chart.data.datasets.forEach(ds => { ds.data = []; });
      allVals = [];
      ptCount.value = 0;
      chart.update('none');
    }

    function togglePause() { paused.value = !paused.value; }

    function createChart() {
      if (!canvasRef.value || !window.Chart) return;
      if (chart) { chart.destroy(); chart = null; }

      chart = new Chart(canvasRef.value.getContext('2d'), {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: '신호 A',
              data: [],
              backgroundColor: window.DV_CONFIG.palette[0] + 'aa',
              borderColor:     window.DV_CONFIG.palette[0],
              pointRadius: 3,
              showLine: true,
              tension: 0.3,
              borderWidth: 1.5,
            },
            {
              label: '신호 B',
              data: [],
              backgroundColor: window.DV_CONFIG.palette[2] + 'aa',
              borderColor:     window.DV_CONFIG.palette[2],
              pointRadius: 3,
              showLine: true,
              tension: 0.3,
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { labels: { color: 'var(--text-secondary)', boxWidth: 12, font: { size: 11 } } },
          },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'second', displayFormats: { second: 'HH:mm:ss' } },
              ticks: { color: 'var(--text-muted)', font: { size: 9 }, maxRotation: 0, maxTicksLimit: 6 },
              grid: { color: 'var(--border)' },
            },
            y: {
              min: 0, max: 120,
              ticks: { color: 'var(--text-muted)', font: { size: 10 } },
              grid: { color: 'var(--border)' },
            },
          },
        },
      });

      timer = setInterval(tick, props.interval);
    }

    onMounted(() => { setTimeout(createChart, 100); });
    onBeforeUnmount(() => {
      if (timer) { clearInterval(timer); timer = null; }
      if (chart) { chart.destroy(); chart = null; }
    });

    return { canvasRef, paused, ptCount, lastVal, maxVal, avgVal, togglePause, clearData };
  }
};
