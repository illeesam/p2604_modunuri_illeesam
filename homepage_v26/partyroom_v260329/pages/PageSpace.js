/* ============================================
   PARTYROOM - PageSpace Component
   공간안내
   ============================================ */
window.PageSpace = {
  name: 'PageSpace',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">공간 안내</h1>
        <p class="section-subtitle">다양한 용도에 맞게 설계된 프리미엄 공간</p>
      </div>

      <!-- 공간 특징 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div v-for="feat in features" :key="feat.id" class="card p-5 text-center">
          <div class="text-3xl mb-2">{{ feat.icon }}</div>
          <div class="font-bold text-sm mb-1" style="color:var(--text-primary)">{{ feat.title }}</div>
          <div class="text-xs" style="color:var(--text-secondary)">{{ feat.desc }}</div>
        </div>
      </div>

      <!-- 공간 상세 -->
      <div class="space-y-6">
        <div v-for="room in rooms" :key="room.roomId"
             class="card overflow-hidden"
             style="border-radius:16px">
          <div class="flex flex-col md:flex-row">
            <div class="flex-shrink-0 flex items-center justify-center"
                 style="min-height:160px;min-width:200px;font-size:5rem;background:linear-gradient(135deg,#16182a,#1e1830)">
              {{ room.emoji }}
            </div>
            <div class="p-6 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 class="font-black text-lg" style="color:var(--text-primary)">{{ room.roomName }}</h3>
                  <div class="text-xs mt-1" style="color:var(--text-muted)">{{ room.area }} · 수용 {{ room.capacity }}</div>
                </div>
                <div class="flex gap-1">
                  <span v-for="tag in room.tags" :key="tag" class="tag text-xs">{{ tag }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mb-4">
                <span v-for="f in room.features" :key="f" class="tag">✓ {{ f }}</span>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex gap-4 text-sm">
                  <div>
                    <span style="color:var(--text-muted)">시간당 </span>
                    <span class="font-bold" style="color:var(--gold)">{{ room.hourly.toLocaleString() }}원</span>
                  </div>
                  <div>
                    <span style="color:var(--text-muted)">1일 </span>
                    <span class="font-bold" style="color:var(--gold)">{{ room.daily.toLocaleString() }}원</span>
                  </div>
                </div>
                <button @click="$emit('navigate','booking')"
                        class="btn-gold px-5 py-2 rounded-lg text-xs">
                  예약하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const rooms = window.SITE_CONFIG.rooms;
    const features = [
      { id:1, icon:'🔒', title:'24시간 보안', desc:'안전한 출입 시스템' },
      { id:2, icon:'📡', title:'초고속 WiFi', desc:'기가인터넷 제공' },
      { id:3, icon:'🌡️', title:'냉난방', desc:'개별 온도 조절' },
      { id:4, icon:'🚗', title:'지하 주차', desc:'2시간 무료 주차' },
      { id:5, icon:'☕', title:'카페테리아', desc:'음료 서비스 가능' },
      { id:6, icon:'📋', title:'비품 지원', desc:'화이트보드 등 무료' },
      { id:7, icon:'🎤', title:'음향 장비', desc:'마이크 & 스피커' },
      { id:8, icon:'📸', title:'촬영 조명', desc:'전문 조명 완비' },
    ];
    return { rooms, features };
  }
};
