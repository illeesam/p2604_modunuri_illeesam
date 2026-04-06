/* DataVisual — Realtime Page */
window.DvPages = window.DvPages || {};
window.DvPages.Realtime = {
  name: 'Realtime',
  template: /* html */ `
<div class="page-wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1 class="section-title">⚡ 실시간 패널</h1>
      <p class="section-subtitle">1초 간격 시계열 산점도 및 실시간 지표</p>
    </div>
    <div class="rt-badge" style="font-size:0.82rem;padding:5px 12px;">
      <div class="rt-dot"></div>
      실시간 모니터링 중
    </div>
  </div>
  <realtime-panel />
</div>
  `,
};
