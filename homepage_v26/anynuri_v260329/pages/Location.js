/* ANYNURI — 위치 안내 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageLocation = {
    name: 'PageLocation',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">위치 안내</h1>
    <p class="section-subtitle">AnyNuri 스튜디오 오시는 길</p>
  </div>
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="map-placeholder mb-4">
        <span style="font-size:3rem">📍</span>
        <span class="font-bold" style="color:var(--text-secondary)">지도 영역</span>
        <iframe
          title="Google Map"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
          style="width:100%;height:210px;border:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.02);"
          src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EC%84%B1%EB%82%A8%EB%8C%80%EB%A1%9C%20997%EB%B2%88%EA%B8%B8%2049-14%20201%ED%98%B8&output=embed"
        ></iframe>
        <span class="text-xs" style="color:var(--text-muted);text-align:center;">경기도 성남시 중원구 성남대로 997번길 49-14<br>201호</span>
      </div>
      <div class="card p-5">
        <h3 class="font-black text-sm mb-4" style="color:var(--text-primary)">교통 안내</h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-lg flex-shrink-0">🚇</span>
            <div>
              <div class="text-sm font-bold mb-0.5" style="color:var(--text-primary)">지하철</div>
              <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
                수인분당선 야탑역 4번 출구 (600m) 인근에서 도보 또는 버스로 이동<br>
                성남시청(전면) 정류장 하차 도보 5분 (240m)
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lg flex-shrink-0">🚌</span>
            <div>
              <div class="text-sm font-bold mb-0.5" style="color:var(--text-primary)">버스</div>
              <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
                성남시청(전면) 정류장 하차 (240m)
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-lg flex-shrink-0">🚗</span>
            <div>
              <div class="text-sm font-bold mb-0.5" style="color:var(--text-primary)">자가용</div>
              <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
                인근 공영/유료 주차장 이용<br>
                내비: "성남대로 997번길 49-14" 검색
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y-4">
      <div class="card p-5">
        <h3 class="font-black text-sm mb-4" style="color:var(--text-primary)">스튜디오 정보</h3>
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="form-label">주소</dt>
            <dd style="color:var(--text-primary);font-weight:600">경기도 성남시 중원구 성남대로 997번길 49-14<br>201호</dd>
          </div>
          <div>
            <dt class="form-label">전화</dt>
            <dd style="color:var(--text-primary);font-weight:600">{{ anynuri.config.site.tel }}</dd>
          </div>
          <div>
            <dt class="form-label">이메일</dt>
            <dd style="color:var(--text-primary);font-weight:600">{{ anynuri.config.site.email }}</dd>
          </div>
        </dl>
      </div>
      <div class="card p-5">
        <h3 class="font-black text-sm mb-4" style="color:var(--text-primary)">운영 시간</h3>
        <dl class="space-y-2 text-xs">
          <div class="flex justify-between">
            <dt style="color:var(--text-muted)">월 – 금</dt>
            <dd class="font-semibold" style="color:var(--text-primary)">09:00 – 18:00</dd>
          </div>
          <div class="flex justify-between">
            <dt style="color:var(--text-muted)">토요일</dt>
            <dd class="font-semibold" style="color:var(--text-primary)">10:00 – 15:00</dd>
          </div>
          <div class="flex justify-between">
            <dt style="color:var(--text-muted)">일 / 공휴일</dt>
            <dd class="font-semibold" style="color: #ef4444">휴무</dd>
          </div>
          <div class="pt-2 border-t" style="border-color:var(--border)">
            <p style="color:var(--text-muted)">
              ※ 방문 상담은 사전 예약 후 가능합니다.
            </p>
          </div>
        </dl>
      </div>
    </div>
  </div>
</div>
    `,
  };
})(window);
