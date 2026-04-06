/* DataVisual — RealtimePanel (실시간 전용) */
window.DvPanels = window.DvPanels || {};
window.DvPanels.RealtimePanel = {
  name: 'RealtimePanel',
  template: /* html */ `
<div>
  <!-- Live KPIs auto-refresh every 3s -->
  <div class="grid-4" style="margin-bottom:16px;">
    <kpi-widget :title="'동시 접속자'" :value="String(activeUsers)" trend="+실시간" dir="up" icon="👥" color="blue" />
    <kpi-widget :title="'초당 요청'" :value="rps+'req/s'" trend="실시간" dir="up" icon="⚡" color="green" />
    <kpi-widget :title="'오류율'" :value="errorRate+'%'" :dir="errorRate>2?'down':'up'" :trend="errorRate>2?'주의':'정상'" icon="🔴" color="orange" />
    <kpi-widget :title="'응답시간'" :value="respTime+'ms'" :dir="respTime>500?'down':'up'" trend="실시간" icon="⏱️" color="purple" />
  </div>

  <!-- Main realtime chart -->
  <div style="margin-bottom:16px;">
    <realtime-scatter-widget title="실시간 시계열 산점도 (1초 간격)" :height="280" :max-pts="90" :interval="1000" />
  </div>

  <!-- Secondary realtime charts -->
  <div class="grid-2" style="margin-bottom:16px;">
    <realtime-scatter-widget title="채널 A 신호" :height="200" :max-pts="60" :interval="1000" />
    <realtime-scatter-widget title="채널 B 신호" :height="200" :max-pts="60" :interval="1500" />
  </div>

  <!-- Gauges -->
  <div class="grid-4" style="margin-bottom:16px;">
    <gauge-widget title="CPU 사용률" label="%" :height="180" />
    <gauge-widget title="메모리" label="%" :height="180" />
    <gauge-widget title="디스크 I/O" label="%" :height="180" />
    <gauge-widget title="네트워크" label="Mbps" :height="180" />
  </div>
</div>
  `,
  setup() {
    const { ref, onMounted, onBeforeUnmount } = Vue;
    const activeUsers = ref(0);
    const rps = ref(0);
    const errorRate = ref(0);
    const respTime = ref(0);

    let timer = null;

    function refresh() {
      activeUsers.value = window.DvData.rand(800, 2400);
      rps.value = window.DvData.rand(120, 980);
      errorRate.value = window.DvData.randFloat(0.1, 4.5);
      respTime.value = window.DvData.rand(80, 620);
    }

    refresh();
    onMounted(() => { timer = setInterval(refresh, 3000); });
    onBeforeUnmount(() => { if (timer) clearInterval(timer); });

    return { activeUsers, rps, errorRate, respTime };
  }
};
