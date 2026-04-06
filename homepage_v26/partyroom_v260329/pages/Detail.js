/* PARTYROOM — detail (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Detail = {
    name: 'Detail',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:860px;margin:0 auto;">
        <div v-if="partyroom.selectedRoom">
          <!-- Back -->
          <button
            class="btn-outline"
            style="font-size:0.78rem;padding:6px 14px;margin-bottom:1.5rem;"
            @click="partyroom.navigate('products')"
          >← 목록으로</button>

          <!-- Header -->
          <div class="card" style="padding:2rem;text-align:center;margin-bottom:1.5rem;">
            <div style="font-size:5rem;margin-bottom:12px;">{{ partyroom.selectedRoom.emoji }}</div>
            <h1 style="font-size:1.75rem;font-weight:900;color:var(--text-primary);margin-bottom:8px;">{{ partyroom.selectedRoom.roomName }}</h1>
            <div style="display:flex;justify-content:center;gap:16px;color:var(--text-muted);font-size:0.85rem;margin-bottom:16px;">
              <span>👥 {{ partyroom.selectedRoom.capacity }}</span>
              <span>📐 {{ partyroom.selectedRoom.area }}</span>
            </div>
            <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:6px;">
              <span v-for="tag in partyroom.selectedRoom.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>
          </div>

          <!-- Features & Pricing columns -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.5rem;" class="detail-grid">
            <!-- Features -->
            <div class="card" style="padding:1.5rem;">
              <h3 style="font-weight:800;color:var(--text-primary);margin-bottom:12px;">제공 시설</h3>
              <ul style="list-style:none;">
                <li
                  v-for="f in partyroom.selectedRoom.features"
                  :key="f"
                  style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.875rem;color:var(--text-secondary);"
                >
                  <span style="color:var(--gold);">✓</span> {{ f }}
                </li>
              </ul>
            </div>

            <!-- Pricing -->
            <div class="card" style="padding:1.5rem;">
              <h3 style="font-weight:800;color:var(--text-primary);margin-bottom:12px;">요금 안내</h3>
              <table class="price-table" style="border-radius:8px;overflow:hidden;">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>요금</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>시간 대여</td>
                    <td><strong style="color:var(--gold);">{{ partyroom.selectedRoom.hourly.toLocaleString() }}원</strong> / 시간</td>
                  </tr>
                  <tr>
                    <td>일 대여</td>
                    <td><strong style="color:var(--gold);">{{ partyroom.selectedRoom.daily.toLocaleString() }}원</strong> / 일</td>
                  </tr>
                  <tr>
                    <td>3~6일</td>
                    <td><span class="discount-badge">10% 할인</span></td>
                  </tr>
                  <tr>
                    <td>7~13일</td>
                    <td><span class="discount-badge">20% 할인</span></td>
                  </tr>
                  <tr>
                    <td>14일+</td>
                    <td><span class="discount-badge">30% 할인</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;padding:1.5rem 0;">
            <button
              class="btn-gold"
              style="font-size:1rem;padding:14px 48px;"
              @click="partyroom.reserveThisRoom"
            >📅 이 공간 예약하기</button>
          </div>
        </div>
        <div v-else style="text-align:center;padding:4rem;color:var(--text-muted);">
          공간을 선택해주세요.
          <button class="btn-outline" style="margin-top:12px;" @click="partyroom.navigate('products')">공간 목록으로</button>
        </div>
      </div>

      <!-- Detail responsive style -->
      <style>
        @media (max-width: 640px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      </style>
    `,
  };
})(window);
