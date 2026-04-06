/* PARTYROOM — home (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Home = {
    name: 'Home',
    inject: ['partyroom'],
    template: `
<div class="fade-up">
        <!-- Hero -->
        <section class="hero-bg" style="padding:4rem 2rem 3rem;text-align:center;">
          <div style="max-width:640px;margin:0 auto;">
            <div style="font-size:0.8rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:12px;">
              PREMIUM SPACE RENTAL
            </div>
            <h1 style="font-size:2.4rem;font-weight:900;letter-spacing:-0.03em;line-height:1.2;margin-bottom:16px;color:var(--text-primary);">
              특별한 순간을 위한<br>
              <span class="gradient-text">프리미엄 공간</span>
            </h1>
            <p style="font-size:1rem;color:var(--text-secondary);margin-bottom:2rem;line-height:1.7;">
              파티, 스터디, 세미나, 촬영까지 — 목적에 맞는 최적의 공간을 시간 단위부터 장기 대여까지 유연하게 제공합니다.
            </p>

            <!-- Discount badges -->
            <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:2rem;">
              <span
                v-for="d in partyroom.config.discounts"
                :key="d.days"
                class="discount-badge"
              >{{ d.badge }} · {{ d.days }}</span>
            </div>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <button class="btn-gold" style="font-size:0.95rem;padding:12px 32px;" @click="partyroom.navigate('booking')">
                📅 지금 예약하기
              </button>
              <button class="btn-outline" style="font-size:0.95rem;padding:12px 32px;" @click="partyroom.navigate('products')">
                공간 둘러보기
              </button>
            </div>
          </div>
        </section>

        <!-- Stats row -->
        <section style="background:var(--bg-card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);">
          <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);">
            <div class="stat-box" style="border-right:1px solid var(--border);">
              <div class="stat-num">6</div>
              <div class="stat-label">독립 공간</div>
            </div>
            <div class="stat-box" style="border-right:1px solid var(--border);">
              <div class="stat-num">30<span style="font-size:1rem;">명</span></div>
              <div class="stat-label">최대 수용</div>
            </div>
            <div class="stat-box" style="border-right:1px solid var(--border);">
              <div class="stat-num">30<span style="font-size:1rem;">%</span></div>
              <div class="stat-label">최대 장기 할인</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">24<span style="font-size:1rem;">h</span></div>
              <div class="stat-label">문의 응답</div>
            </div>
          </div>
        </section>

        <!-- Popular rooms preview -->
        <section style="padding:2.5rem 1.5rem;max-width:1100px;margin:0 auto;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:8px;">
            <div>
              <h2 class="section-title">인기 공간</h2>
              <p class="section-subtitle">가장 많이 예약되는 공간을 확인해보세요.</p>
            </div>
            <button class="btn-outline" style="font-size:0.8rem;padding:7px 16px;" @click="partyroom.navigate('products')">전체보기 →</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1.25rem;">
            <div
              v-for="room in partyroom.rooms.slice(0,4)"
              :key="room.roomId"
              class="room-card"
              @click="partyroom.selectRoom(room)"
              style="cursor:pointer;"
            >
              <div class="room-thumb">{{ room.emoji }}</div>
              <div style="padding:1rem;">
                <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;color:var(--text-primary);">{{ room.roomName }}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">{{ room.capacity }} · {{ room.area }}</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
                  <span v-for="tag in room.tags" :key="tag" class="tag-pill">{{ tag }}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                  <span class="price-tag" style="font-size:1.15rem;">{{ room.hourly.toLocaleString() }}</span>
                  <span class="price-unit">원/시간</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Discount policy section -->
        <section style="background:var(--bg-card);border-top:1px solid var(--border);padding:2.5rem 1.5rem;">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <h2 class="section-title" style="margin-bottom:8px;">장기 할인 정책</h2>
            <p class="section-subtitle" style="margin-bottom:2rem;">연속 대여 기간이 길수록 더 큰 혜택을 드립니다.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
              <div
                v-for="d in partyroom.config.discounts"
                :key="d.days"
                class="card"
                style="padding:1.5rem;text-align:center;"
              >
                <div class="discount-badge" style="margin-bottom:10px;">{{ d.badge }}</div>
                <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:4px;">{{ d.days }}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);">{{ d.rate }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA bottom -->
        <section style="padding:3rem 1.5rem;text-align:center;background:var(--bg-base);">
          <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">
            지금 바로 <span class="gradient-text">예약</span>하세요
          </h2>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem;font-size:0.9rem;">
            전화 또는 온라인으로 간편하게 예약 가능합니다.
          </p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button class="btn-gold" @click="partyroom.navigate('booking')">📅 온라인 예약</button>
            <a :href="'tel:' + partyroom.config.tel" class="btn-outline">📞 {{ partyroom.config.tel }}</a>
          </div>
        </section>

        <!-- Footer -->
        <footer style="background:var(--bg-card);border-top:1px solid var(--border);padding:1.5rem;text-align:center;font-size:0.78rem;color:var(--text-muted);">
          <div style="margin-bottom:6px;font-weight:700;color:var(--text-secondary);">{{ partyroom.config.name }}</div>
          <div>{{ partyroom.config.address }} | {{ partyroom.config.tel }} | {{ partyroom.config.email }}</div>
          <div style="margin-top:6px;">© 2026 {{ partyroom.config.name }}. All rights reserved.</div>
        </footer>
      </div>
    `,
  };
})(window);
