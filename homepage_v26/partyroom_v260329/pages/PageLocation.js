/* ============================================
   PARTYROOM - PageLocation Component
   위치 안내
   ============================================ */
window.PageLocation = {
  name: 'PageLocation',
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">위치 안내</h1>
        <p class="section-subtitle">찾아오시는 방법</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Map placeholder -->
        <div class="rounded-2xl overflow-hidden"
             style="background:linear-gradient(135deg,#16182a,#1e1830);border:1px solid var(--border);padding:16px;">
          <div class="text-center" style="margin-bottom:10px;">
            <div class="text-6xl mb-2">🗺️</div>
            <div class="text-sm" style="color:var(--text-secondary);font-weight:700;">
              경기도 성남시 중원구 성남대로 997번길 49-14 201호
            </div>
          </div>
          <iframe
            title="Google Map"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
            style="width:100%;height:240px;border:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.02);"
            src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EC%84%B1%EB%82%A8%EB%8C%80%EB%A1%9C%20997%EB%B2%88%EA%B8%B8%2049-14%20201%ED%98%B8&output=embed"
          ></iframe>
        </div>
        <!-- 안내 -->
        <div class="space-y-4">
          <div class="card p-5">
            <h3 class="font-bold text-sm mb-4" style="color:var(--text-primary)">오시는 방법</h3>
            <div class="space-y-4 text-sm">
              <div class="flex gap-3">
                <span class="text-xl">🚇</span>
                <div>
                  <div class="font-semibold mb-1" style="color:var(--text-primary)">지하철</div>
                  <div style="color:var(--text-secondary)">수인분당선 야탑역(600m) 인근 도보 또는 버스로 이동<br>성남시청(전면) 정류장 하차 도보 5분 (240m)</div>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl">🚌</span>
                <div>
                  <div class="font-semibold mb-1" style="color:var(--text-primary)">버스</div>
                  <div style="color:var(--text-secondary)">성남시청(전면) 정류장 하차 (240m)</div>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl">🚗</span>
                <div>
                  <div class="font-semibold mb-1" style="color:var(--text-primary)">자가용</div>
                  <div style="color:var(--text-secondary)">인근 공영/유료 주차장 이용</div>
                </div>
              </div>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold text-sm mb-3" style="color:var(--text-primary)">운영 시간</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span style="color:var(--text-secondary)">평일</span>
                <span class="font-semibold" style="color:var(--text-primary)">09:00 ~ 22:00</span>
              </div>
              <div class="flex justify-between">
                <span style="color:var(--text-secondary)">주말/공휴일</span>
                <span class="font-semibold" style="color:var(--text-primary)">10:00 ~ 20:00</span>
              </div>
              <div class="flex justify-between">
                <span style="color:var(--text-secondary)">명절</span>
                <span style="color:var(--gold)">별도 공지</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() { return {}; }
};
