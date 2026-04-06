/* CareMate - PageLocation */
window.PageLocation = {
  name: 'PageLocation',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--teal-dim);color:var(--teal);font-size:0.75rem;font-weight:700;margin-bottom:14px;">오시는 길</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">케어메이트 위치</h1>
    <p class="section-subtitle">{{ config.address }}</p>
  </div>
  <div class="grid-2" style="gap:28px;margin-bottom:28px;">
    <div style="border-radius:16px;overflow:hidden;min-height:300px;">
      <iframe src="https://maps.google.com/maps?q=경기도+성남시+중원구+성남대로+997번길+49-14&output=embed&hl=ko" width="100%" height="300" style="border:0;display:block;" allowfullscreen loading="lazy"></iframe>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-weight:700;font-size:1rem;margin-bottom:16px;color:var(--text-primary);">📍 주소 및 연락처</h3>
        <div class="info-row"><div class="info-icon">🏢</div><div><div class="info-label">주소</div><div class="info-val">{{ config.address }}</div></div></div>
        <div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">전화</div><div class="info-val">{{ config.tel }}</div></div></div>
        <div class="info-row"><div class="info-icon">📧</div><div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div></div>
        <div class="info-row"><div class="info-icon">🕘</div><div><div class="info-label">업무시간</div><div class="info-val">평일 09:00 – 18:00</div></div></div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-weight:700;font-size:1rem;margin-bottom:16px;color:var(--text-primary);">🚇 교통 안내</h3>
        <div class="info-row"><div class="info-icon">🚇</div><div><div class="info-label">지하철</div><div class="info-val">수인분당선 야탑역 4번출구 도보 15분</div></div></div>
        <div class="info-row"><div class="info-icon">🚌</div><div><div class="info-label">버스</div><div class="info-val">성남시청(전면) 정류장 하차 도보 3분</div></div></div>
        <div class="info-row"><div class="info-icon">🅿️</div><div><div class="info-label">주차</div><div class="info-val">건물 내 주차 가능 (2시간 무료) / 공공기관 주차장 이용 가능</div></div></div>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    return {};
  }
};
