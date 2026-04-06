window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Location = {
  name: 'Location',
  props: ['config'],
  data() {
    return { copiedHint: false };
  },
  computed: {
    mapSearchUrl() {
      var q = this.config && this.config.address ? this.config.address : '';
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    },
    mapEmbedUrl() {
      var q = this.config && this.config.address ? this.config.address : '';
      return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
    },
  },
  methods: {
    copyAddress() {
      var a = this.config && this.config.address;
      if (!a) return;
      var done = function () {
        this.copiedHint = true;
        var self = this;
        setTimeout(function () { self.copiedHint = false; }, 2200);
      }.bind(this);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(a).then(done).catch(function () {
          fallbackCopy(a);
          done();
        });
      } else {
        fallbackCopy(a);
        done();
      }
      function fallbackCopy(text) {
        var el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        try {
          document.execCommand('copy');
        } catch (e) {}
        document.body.removeChild(el);
      }
    },
  },
  template: /* html */ `
  <div class="page-wrap">
    <div style="margin-bottom:28px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--green-dim);color:var(--green);font-size:0.75rem;font-weight:700;margin-bottom:14px;">위치 안내</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">오시는 길</h1>
      <p class="section-subtitle">충북 진천, 단고을 농원·픽업 데스크 위치입니다.</p>
    </div>

    <div class="card" style="padding:22px 24px;margin-bottom:24px;border:1px solid rgba(0,153,204,0.25);background:linear-gradient(180deg,var(--blue-dim),var(--bg-card));">
      <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">주소 정보</div>
      <address style="font-style:normal;font-size:1.05rem;font-weight:800;color:var(--text-primary);line-height:1.55;word-break:keep-all;">
        {{ config.address }}
      </address>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center;">
        <button type="button" class="btn-blue btn-sm" @click="copyAddress">주소 복사</button>
        <span v-if="copiedHint" style="font-size:0.8rem;color:var(--green);font-weight:600;">복사되었습니다</span>
        <a :href="mapSearchUrl" target="_blank" rel="noopener noreferrer" class="btn-outline btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;">지도에서 보기 ↗</a>
      </div>
    </div>

    <div class="map-placeholder" style="margin-bottom:28px;">
      <span style="font-size:3rem;">🗺️</span>
      <div style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);">지도 영역</div>
      <iframe
        title="Google Map"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
        style="width:100%;height:220px;border:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.02);"
        :src="mapEmbedUrl"
      ></iframe>
      <div style="font-size:0.85rem;color:var(--text-primary);font-weight:600;margin-top:6px;max-width:420px;line-height:1.45;text-align:center;">{{ config.address }}</div>
      <a :href="mapSearchUrl" target="_blank" rel="noopener noreferrer" style="margin-top:12px;font-size:0.8rem;color:var(--blue);font-weight:600;">위 주소로 지도 열기</a>
    </div>

    <div class="grid-2" style="gap:20px;">
      <div class="card" style="padding:28px;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">📍 주소 및 연락처</h2>
        <div class="info-row"><span class="info-icon">🏢</span><div><div class="info-label">주소</div><div class="info-val" style="line-height:1.55;">{{ config.address }}</div></div></div>
        <div class="info-row"><span class="info-icon">📞</span><div><div class="info-label">대표 전화</div><div class="info-val">{{ config.tel }}</div></div></div>
        <div class="info-row"><span class="info-icon">📧</span><div><div class="info-label">이메일</div><div class="info-val">{{ config.email }}</div></div></div>
        <div class="info-row"><span class="info-icon">🕘</span><div><div class="info-label">업무시간</div><div class="info-val">평일 09:00 – 18:00</div></div></div>
      </div>
      <div class="card" style="padding:28px;">
        <h2 style="font-size:1rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">🚇 교통 안내</h2>
        <div class="info-row"><span class="info-icon">🚇</span><div><div class="info-label">대중교통</div><div class="info-val">청주·진천 시내에서 이월면 방면 시내버스·농어촌버스 이용 후<br>노원리 인근 하차 (노선은 시점에 따라 상이 — 방문 전 문의 권장)</div></div></div>
        <div class="info-row"><span class="info-icon">🚌</span><div><div class="info-label">버스</div><div class="info-val">진천군 이월면 노선 — ‘노원리’·인근 정류장 하차 후 도보·택시 연계</div></div></div>
        <div class="info-row"><span class="info-icon">🅿️</span><div><div class="info-label">주차</div><div class="info-val">농원 방문 시 사전 예약 시 주차 안내<br>(좁은 농로 구간 — 안전 운행 부탁드립니다)</div></div></div>
      </div>
    </div>
  </div>
  `,
};
