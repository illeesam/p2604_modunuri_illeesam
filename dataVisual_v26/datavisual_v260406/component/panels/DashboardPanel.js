/* DataVisual — DashboardPanel (메인 대시보드) */
window.DvPanels = window.DvPanels || {};
window.DvPanels.DashboardPanel = {
  name: 'DashboardPanel',
  props: ['navigate'],
  template: /* html */ `
<div>
  <!-- KPI Row -->
  <div class="grid-4" style="margin-bottom:16px;">
    <kpi-widget title="총 방문자"  value="128,450" trend="+12.4%" dir="up"   icon="👥" color="blue"   />
    <kpi-widget title="전환율"     value="4.8%"    trend="+0.6%"  dir="up"   icon="🎯" color="green"  />
    <kpi-widget title="매출"       value="₩84.2M"  trend="-2.1%"  dir="down" icon="💰" color="orange" />
    <kpi-widget title="활성 사용자" value="3,241"   trend="+8.7%"  dir="up"   icon="🔥" color="purple" />
  </div>
  <!-- Main charts -->
  <div class="grid-2" style="margin-bottom:16px;grid-template-columns:2fr 1fr;">
    <line-chart-widget title="월별 방문자 추이" :height="230" />
    <pie-chart-widget title="트래픽 출처" :donut="true" :height="230" />
  </div>
  <!-- Second row -->
  <div class="grid-2" style="margin-bottom:16px;">
    <bar-chart-widget title="채널별 매출" :height="210" />
    <area-chart-widget title="누적 수익 추이" :height="210" />
  </div>
  <!-- Third row -->
  <div class="grid-2" style="margin-bottom:16px;grid-template-columns:1fr 2fr;">
    <div style="display:flex;flex-direction:column;gap:16px;">
      <gauge-widget title="서버 부하율" label="%" :height="160" />
      <gauge-widget title="목표 달성률" label="%" :height="160" />
    </div>
    <data-table-widget title="상품별 현황" :rows="8" />
  </div>
</div>
  `,
};
