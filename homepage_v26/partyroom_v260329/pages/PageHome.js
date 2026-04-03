/* ============================================
   PARTYROOM - PageHome Component
   홈 / 메인 랜딩 페이지
   ============================================ */
window.PageHome = {
  name: 'PageHome',
  emits: ['navigate'],
  template: /* html */ `
    <div>
      <!-- Hero -->
      <section class="hero-bg relative overflow-hidden" style="min-height:calc(100vh - var(--header-h))">
        <div class="flex items-center justify-center min-h-full py-20 px-6">
          <div class="text-center max-w-3xl fade-up">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                 style="background:var(--gold-dim);border:1px solid rgba(201,168,76,0.3);color:var(--gold)">
              ✨ 프리미엄 공간 대여 서비스
            </div>

            <h1 class="text-4xl md:text-6xl font-black leading-tight mb-6"
                style="letter-spacing:-0.03em">
              <span class="gradient-gold">특별한 순간을</span><br>
              <span style="color:var(--text-primary)">완벽한 공간에서</span>
            </h1>

            <p class="text-base md:text-lg mb-10 leading-relaxed" style="color:var(--text-secondary)">
              파티, 스터디, 회의, 촬영까지<br>
              당신의 목적에 맞는 최적의 공간을 제공합니다
            </p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button @click="$emit('navigate','products')" class="btn-gold px-8 py-3 rounded-lg text-sm">
                🏢 공간 둘러보기
              </button>
              <button @click="$emit('navigate','booking')" class="btn-outline px-8 py-3 rounded-lg text-sm">
                📅 예약하기
              </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-6 mt-16 max-w-sm mx-auto">
              <div class="stat-box">
                <div class="stat-num">6+</div>
                <div class="stat-label">공간 종류</div>
              </div>
              <div class="stat-box">
                <div class="stat-num">500+</div>
                <div class="stat-label">누적 이용</div>
              </div>
              <div class="stat-box">
                <div class="stat-num">30%</div>
                <div class="stat-label">장기 할인</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 공간 미리보기 -->
      <section class="py-16 px-6">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="section-title gradient-gold">공간 안내</h2>
            <p class="section-subtitle">파티룸부터 스터디룸, 회의실까지</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="room in featuredRooms" :key="room.roomId"
                 class="room-card cursor-pointer"
                 @click="$emit('navigate','detail')">
              <div class="room-thumb">{{ room.emoji }}</div>
              <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ room.roomName }}</h3>
                  <span class="badge badge-gold">{{ room.capacity }}</span>
                </div>
                <div class="flex flex-wrap gap-1 mb-3">
                  <span v-for="tag in room.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-xs" style="color:var(--text-muted)">시간당</span>
                    <span class="font-bold ml-1" style="color:var(--gold)">{{ room.hourly.toLocaleString() }}원~</span>
                  </div>
                  <span class="text-xs" style="color:var(--text-muted)">{{ room.area }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="text-center mt-8">
            <button @click="$emit('navigate','products')"
                    class="btn-outline px-6 py-2.5 rounded-lg text-sm">
              전체 공간 보기 →
            </button>
          </div>
        </div>
      </section>

      <!-- 가격 안내 -->
      <section class="py-16 px-6" style="background:rgba(255,255,255,0.02)">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="section-title gradient-gold">장기 할인 혜택</h2>
            <p class="section-subtitle">연속 이용 시 특별 할인이 적용됩니다</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div v-for="d in discounts" :key="d.days"
                 class="card p-6 text-center">
              <div class="badge badge-gold mb-3">{{ d.badge }}</div>
              <div class="text-2xl font-black mb-1" style="color:var(--gold)">{{ d.rate }}</div>
              <div class="text-sm" style="color:var(--text-secondary)">{{ d.days }} 연속 이용</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 결제 안내 -->
      <section class="py-16 px-6">
        <div class="max-w-3xl mx-auto">
          <div class="card p-8" style="border-color:rgba(201,168,76,0.2)">
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="text-5xl">💳</div>
              <div class="flex-1 text-center md:text-left">
                <h3 class="font-black text-xl mb-2" style="color:var(--gold)">계좌이체 결제</h3>
                <p class="text-sm mb-4" style="color:var(--text-secondary)">
                  현재 계좌이체만 가능합니다. 예약 확정 후 24시간 이내 입금해주세요.
                </p>
                <div class="inline-block px-4 py-2 rounded-lg text-sm font-mono font-bold"
                     style="background:var(--gold-dim);color:var(--gold);border:1px solid rgba(201,168,76,0.3)">
                  기업은행 123-456789-01-234
                </div>
              </div>
              <button @click="$emit('navigate','booking')" class="btn-gold px-6 py-3 rounded-lg text-sm flex-shrink-0">
                예약하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  setup() {
    const cfg = window.SITE_CONFIG;
    const featuredRooms = cfg.rooms.slice(0, 3);
    const discounts = cfg.discounts;
    return { featuredRooms, discounts };
  }
};
