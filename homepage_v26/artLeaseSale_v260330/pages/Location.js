/* ArtGallery - PageLocation */
window.PageLocation = {
  name: 'PageLocation',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:14px;border:1px solid rgba(201,160,89,0.3);">오시는 길</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;font-family:'Noto Serif KR',serif;">갤러리 위치</h1>
    <div class="art-divider"><span class="art-divider-icon">📍</span></div>
  </div>

  <div class="grid-2" style="gap:32px;margin-bottom:36px;">
    <!-- Map -->
    <div class="map-placeholder" style="border-radius:16px;overflow:hidden;min-height:320px;padding:0;">
      <iframe
        src="https://maps.google.com/maps?q=경기도+성남시+중원구+성남대로+997번길+49-14&output=embed&hl=ko"
        width="100%" height="320" style="border:0;display:block;" allowfullscreen loading="lazy">
      </iframe>
    </div>

    <!-- Address info -->
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" style="padding:24px;">
        <h3 style="font-weight:700;font-size:1rem;margin-bottom:16px;color:var(--text-primary);">📍 위치 정보</h3>
        <div class="info-row">
          <div class="info-icon">🏢</div>
          <div><div class="info-label">주소</div><div class="info-val">{{ config.address }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">📞</div>
          <div><div class="info-label">전화</div><div class="info-val">{{ config.tel }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">🕐</div>
          <div><div class="info-label">관람 시간</div><div class="info-val">평일 10:00 ~ 18:00<br>방문 전 사전 연락 바랍니다</div></div>
        </div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-weight:700;font-size:1rem;margin-bottom:16px;color:var(--text-primary);">🚇 대중교통</h3>
        <div class="info-row">
          <div class="info-icon">🚇</div>
          <div><div class="info-label">지하철</div><div class="info-val">수인분당선 야탑역 4번 출구 도보 15분 (600m)</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">🚌</div>
          <div><div class="info-label">버스</div><div class="info-val">성남시청(전면) 정류장 하차 후 도보 5분 (240m)</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">🚗</div>
          <div><div class="info-label">주차</div><div class="info-val">건물 내 주차 가능 (2시간 무료) / 공공기관 주차장 이용 가능</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Notice -->
  <div style="padding:20px 24px;border-radius:14px;background:var(--gold-dim);border:1px solid rgba(201,160,89,0.3);">
    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.8;">
      <strong style="color:var(--gold);">📌 방문 전 안내</strong><br>
      작품 실물 관람은 사전 연락 후 방문해 주시기 바랍니다. 카카오톡(@{{ config.kakao }})이나 전화({{ config.tel }})로 방문 예약을 해주시면 보다 친절한 안내를 드릴 수 있습니다.
    </div>
  </div>
</div>
`,
  setup(props) {
    return {};
  }
};
