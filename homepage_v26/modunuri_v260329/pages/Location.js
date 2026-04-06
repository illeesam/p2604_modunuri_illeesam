/* MODUNURI - PageLocation */
window.PageLocation = {
  name: 'PageLocation',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">오시는 길</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;line-height:1.2;"><span class="gradient-text">모두누리</span> 위치</h1>
    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.65;max-width:640px;">{{ config.address }}</p>
  </div>

  <div class="location-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,380px);gap:28px;align-items:start;">
    <!-- Map -->
    <div class="card" style="padding:0;overflow:hidden;position:relative;">
      <a :href="mapOpenUrl"
        target="_blank"
        rel="noopener noreferrer"
        style="position:absolute;top:14px;left:14px;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:var(--bg-card);color:var(--blue);font-size:0.8rem;font-weight:700;text-decoration:none;border:1px solid var(--border);box-shadow:var(--shadow);"
      >지도에서 열기</a>
      <iframe
        title="Google Map"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
        style="display:block;width:100%;height:min(420px,55vw);min-height:260px;border:0;"
        :src="mapEmbedUrl"
      ></iframe>
    </div>

    <!-- Info cards -->
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div class="card" style="padding:26px 24px;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:4px;color:var(--text-primary);display:flex;align-items:center;gap:10px;">
          <span class="info-icon" style="margin-top:0;">📍</span> 주소 및 연락처
        </h2>
        <div style="margin-top:8px;">
          <div class="info-row">
            <span class="info-icon">🏢</span>
            <div>
              <div class="info-label">주소</div>
              <div class="info-val" style="line-height:1.55;">{{ config.address }}</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">📞</span>
            <div>
              <div class="info-label">전화</div>
              <div class="info-val"><a :href="'tel:' + telDigits" style="color:var(--blue);text-decoration:none;">{{ config.tel }}</a></div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">✉️</span>
            <div>
              <div class="info-label">이메일</div>
              <div class="info-val"><a :href="'mailto:' + config.email" style="color:var(--blue);text-decoration:none;">{{ config.email }}</a></div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🕐</span>
            <div>
              <div class="info-label">업무시간</div>
              <div class="info-val">평일 <span style="color:var(--blue);font-weight:600;font-variant-numeric:tabular-nums;">09:00 – 18:00</span></div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">주말·공휴일 휴무</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="padding:26px 24px;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:4px;color:var(--text-primary);display:flex;align-items:center;gap:10px;">
          <span class="info-icon" style="margin-top:0;">🚌</span> 교통 안내
        </h2>
        <div style="margin-top:8px;">
          <div class="info-row">
            <span class="info-icon">🚇</span>
            <div>
              <div class="info-label">지하철</div>
              <div class="info-val" style="line-height:1.55;">수인·분당선 야탑역 인근(약 600m) · 성남시청(전면) 정류장 하차 도보 5분 (240m)</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🚌</span>
            <div>
              <div class="info-label">버스</div>
              <div class="info-val">성남시청(전면) 정류장 하차(약 240m)</div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🅿️</span>
            <div>
              <div class="info-label">주차</div>
              <div class="info-val">인근 공영·유료 주차장 이용</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { computed } = Vue;
    const addr = () => (props.config && props.config.address) || '';

    const mapEmbedUrl = computed(() => {
      const q = encodeURIComponent(addr());
      return 'https://www.google.com/maps?q=' + q + '&output=embed';
    });
    const mapOpenUrl = computed(() => {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr());
    });
    const telDigits = computed(() => {
      const t = (props.config && props.config.tel) || '';
      return String(t).replace(/[^\d+]/g, '') || t;
    });

    return { mapEmbedUrl, mapOpenUrl, telDigits };
  }
};
