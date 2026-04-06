/* PARTYROOM — space (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Space = {
    name: 'Space',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:1000px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">공간안내</h1>
          <p class="section-subtitle">파티룸 스페이스의 모든 공간을 소개합니다.</p>
        </div>

        <!-- All rooms gallery -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;margin-bottom:2.5rem;">
          <div
            v-for="room in partyroom.rooms"
            :key="room.roomId"
            class="card"
            style="overflow:hidden;cursor:pointer;"
            @click="partyroom.selectRoom(room)"
          >
            <div class="room-thumb" style="height:140px;">{{ room.emoji }}</div>
            <div style="padding:1.25rem;">
              <div style="font-weight:800;color:var(--text-primary);margin-bottom:4px;">{{ room.roomName }}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">{{ room.capacity }} · {{ room.area }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                <span v-for="f in room.features.slice(0,3)" :key="f" style="font-size:0.72rem;color:var(--text-secondary);background:var(--gold-dim);padding:2px 8px;border-radius:4px;">{{ f }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Amenities -->
        <div style="margin-bottom:2rem;">
          <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:1rem;">공용 편의시설</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.75rem;">
            <div v-for="item in [
              { icon:'🚿', name:'샤워실' },
              { icon:'🛗', name:'엘리베이터' },
              { icon:'🅿️', name:'지하주차장' },
              { icon:'☕', name:'공용 휴게공간' },
              { icon:'🔒', name:'개인 물품 보관함' },
              { icon:'♿', name:'장애인 편의시설' },
            ]" :key="item.name" class="card" style="padding:1rem;text-align:center;">
              <div style="font-size:1.5rem;margin-bottom:6px;">{{ item.icon }}</div>
              <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);">{{ item.name }}</div>
            </div>
          </div>
        </div>

        <!-- Building info -->
        <div class="card" style="padding:1.5rem;">
          <h2 style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">건물 안내</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:0.85rem;color:var(--text-secondary);">
            <div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">위치</div>
              <div>{{ partyroom.config.address }}</div>
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">운영 시간</div>
              <div>평일 08:00~22:00<br>주말 09:00~20:00</div>
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">주차</div>
              <div>지하 1~2층 / 2시간 무료</div>
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">보안</div>
              <div>24시간 CCTV 운영</div>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})(window);
