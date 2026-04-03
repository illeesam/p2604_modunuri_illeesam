/* ANYNURI - PageHome */
window.PageHome = {
  name: 'PageHome',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <!-- Hero -->
      <div class="text-center py-16 mb-12 relative overflow-hidden rounded-3xl card" style="border-color:rgba(255,107,157,0.2);min-height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="absolute inset-0 opacity-10 gradient-bg rounded-3xl"></div>
        <div class="relative z-10">
          <div class="flex justify-center gap-4 mb-6 text-5xl">
            <span class="float-1">🌸</span>
            <span class="float-2">⭐</span>
            <span class="float-3">🎬</span>
          </div>
          <h1 class="text-5xl font-black mb-4 gradient-text" style="letter-spacing:-0.03em">AnyNuri</h1>
          <p class="text-xl font-light mb-2" style="color:var(--text-secondary)">애니메이션으로 세상을 물들이다</p>
          <p class="text-sm mb-8" style="color:var(--text-muted)">Animation Studio Since 2016</p>
          <div class="flex flex-wrap gap-3 justify-center">
            <button @click="$emit('navigate', 'works')" class="btn-sakura px-8 py-3 rounded-full font-bold text-sm">작품 보기</button>
            <button @click="$emit('navigate', 'contact')" class="btn-outline px-8 py-3 rounded-full font-bold text-sm">의뢰하기</button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div v-for="s in stats" :key="s.label" class="card p-5 text-center rounded-2xl">
          <div class="text-2xl font-black gradient-text mb-1">{{ s.value }}</div>
          <div class="text-xs" style="color:var(--text-muted)">{{ s.label }}</div>
        </div>
      </div>

      <!-- Featured works -->
      <h2 class="text-2xl font-black gradient-text mb-6">최신 작품</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div v-for="work in featured" :key="work.id" class="work-card cursor-pointer" @click="$emit('navigate', 'detail')">
          <div class="flex items-center justify-center text-6xl" :style="'height:160px;background:'+work.bg">{{ work.emoji }}</div>
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ work.title }}</h3>
              <span class="tag-pill">{{ work.genre }}</span>
            </div>
            <p class="text-xs" style="color:var(--text-secondary)">{{ work.desc }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="card p-8 rounded-3xl text-center rainbow-border">
        <div class="text-4xl mb-4">✉️</div>
        <h2 class="text-2xl font-black gradient-text mb-3">당신의 이야기를 애니메이션으로</h2>
        <p class="text-sm mb-6" style="color:var(--text-secondary)">아이디어가 있다면 지금 바로 상담해 드립니다. 초기 상담은 무료입니다.</p>
        <button @click="$emit('navigate', 'contact')" class="btn-sakura px-10 py-3 rounded-full font-bold">무료 상담 신청</button>
      </div>
    </div>
  `,
  setup() {
    const stats = window.SITE_CONFIG.stats;
    const featured = window.SITE_CONFIG.works.slice(0, 3);
    return { stats, featured };
  }
};
