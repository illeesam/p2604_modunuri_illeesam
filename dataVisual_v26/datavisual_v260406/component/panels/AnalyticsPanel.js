/* DataVisual — AnalyticsPanel (분석 전용) */
window.DvPanels = window.DvPanels || {};
window.DvPanels.AnalyticsPanel = {
  name: 'AnalyticsPanel',
  template: /* html */ `
<div>
  <div class="grid-4" style="margin-bottom:16px;">
    <kpi-widget title="세션수"   value="42,180" trend="+5.2%"  dir="up"   icon="📱" color="blue"   />
    <kpi-widget title="이탈률"   value="38.4%"  trend="-3.1%"  dir="down" icon="🚪" color="orange" />
    <kpi-widget title="페이지뷰" value="317K"   trend="+18.9%" dir="up"   icon="👁️" color="teal"   />
    <kpi-widget title="체류시간" value="3분42초" trend="+0.5분" dir="up"  icon="⏱️" color="purple" />
  </div>
  <div class="grid-2" style="margin-bottom:16px;">
    <stacked-bar-widget title="채널별 유입 추이 (월)" :height="230" />
    <radar-chart-widget title="지표 종합 비교" :height="230" />
  </div>
  <div class="grid-3" style="margin-bottom:16px;">
    <scatter-chart-widget title="사용자 분포 (산점도)" :height="220" />
    <bubble-chart-widget title="시장 포지셔닝" :height="220" />
    <heatmap-widget title="요일×시간대 히트맵" :rows="7" :cols="12" />
  </div>
  <div style="margin-bottom:16px;">
    <data-table-widget title="세부 지표" :rows="10" />
  </div>
</div>
  `,
};
