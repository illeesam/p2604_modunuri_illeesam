/* PARTYROOM — location (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Location = {
    name: 'Location',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:900px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">위치안내</h1>
          <p class="section-subtitle">경기 성남 중심부에 위치해 접근이 편리합니다.</p>
        </div>

        <!-- Map placeholder -->
        <div class="map-placeholder" style="margin-bottom:2rem;">
          <div style="font-size:3rem;">🗺️</div>
          <div style="font-weight:700;font-size:1rem;color:var(--text-secondary);">지도 영역</div>
          <iframe
            title="Google Map"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
            style="width:100%;height:210px;border:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.02);"
            src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EC%84%B1%EB%82%A8%EB%8C%80%EB%A1%9C%20997%EB%B2%88%EA%B8%B8%2049-14%20201%ED%98%B8&output=embed"
          ></iframe>
          <div style="margin-top:8px;font-weight:700;color:var(--text-primary);">경기도 성남시 중원구 성남대로 997번길 49-14 201호</div>
        </div>

        <!-- Info cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;">
          <div class="card" style="padding:1.5rem;">
            <div style="font-size:1.5rem;margin-bottom:8px;">🚇</div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">지하철</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              수인분당선 야탑역(600m)<br>도보 또는 버스로 이동<br>성남시청(전면) 정류장 하차 도보 5분 (240m)
            </div>
          </div>
          <div class="card" style="padding:1.5rem;">
            <div style="font-size:1.5rem;margin-bottom:8px;">🚌</div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">버스</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              성남시청(전면) 정류장 하차<br>(240m)
            </div>
          </div>
          <div class="card" style="padding:1.5rem;">
            <div style="font-size:1.5rem;margin-bottom:8px;">🅿️</div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">주차</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              인근 공영/유료 주차장 이용
            </div>
          </div>
          <div class="card" style="padding:1.5rem;">
            <div style="font-size:1.5rem;margin-bottom:8px;">🏢</div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">주소</div>
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.7;">
              {{ partyroom.config.address }}<br>
              <a :href="'tel:' + partyroom.config.tel" style="color:var(--gold);">{{ partyroom.config.tel }}</a>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})(window);
