/* ANYNURI — 홈 (index.html 본문 분리) */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageHome = {
    name: 'PageHome',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-5xl mx-auto">
  <section class="card rainbow-border p-10 mb-8 text-center relative overflow-hidden" style="border-radius:24px">
    <div class="absolute inset-0 opacity-5 gradient-bg"></div>
    <div class="relative z-10">
      <div class="flex justify-center gap-8 mb-6">
        <span class="float-1 text-5xl select-none">🌸</span>
        <span class="float-2 text-5xl select-none">⭐</span>
        <span class="float-3 text-5xl select-none">🎬</span>
      </div>
      <h1 class="text-4xl lg:text-5xl font-black mb-3 gradient-text leading-tight">
        {{ anynuri.config.site.name }}
      </h1>
      <p class="text-lg font-semibold mb-2" style="color:var(--text-secondary)">
        {{ anynuri.config.site.tagline }}
      </p>
      <p class="text-sm mb-8" style="color:var(--text-muted)">
        감성과 기술이 만나 탄생하는 특별한 애니메이션의 세계
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <button type="button" @click="anynuri.navigate('works')" class="btn-sakura px-8 py-3 rounded-full">
          🎬 작품보기
        </button>
        <button type="button" @click="anynuri.navigate('contact')" class="btn-outline px-8 py-3 rounded-full">
          ✉️ 의뢰하기
        </button>
      </div>
    </div>
  </section>
  <section class="mb-8">
    <h2 class="text-lg font-black mb-4" style="color:var(--text-primary)">스튜디오 현황</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(s, i) in anynuri.config.stats" :key="i" class="stat-card">
        <div class="stat-value gradient-text">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>
  </section>
  <section class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-black" style="color:var(--text-primary)">주요 작품</h2>
      <button type="button" @click="anynuri.navigate('works')" class="text-sm font-semibold" style="color:var(--sakura)">전체 보기 →</button>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      <div v-for="w in anynuri.works.slice(0,3)" :key="w.id" class="work-card cursor-pointer" @click="anynuri.selectWork(w)">
        <div class="flex items-center justify-center h-36 text-6xl"
          :style="{ background: w.bg }">{{ w.emoji }}</div>
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="tag-pill">{{ w.genre }}</span>
            <span class="text-xs" style="color:var(--text-muted)">{{ w.year }}</span>
          </div>
          <h3 class="font-black text-sm mb-1" style="color:var(--text-primary)">{{ w.title }}</h3>
          <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">{{ w.desc }}</p>
        </div>
      </div>
    </div>
  </section>
  <section class="card p-8 text-center" style="background:linear-gradient(135deg,var(--sakura-dim),var(--sky-dim))">
    <div class="text-3xl mb-3">🎨</div>
    <h2 class="text-xl font-black mb-2" style="color:var(--text-primary)">함께 만들어가는 애니메이션</h2>
    <p class="text-sm mb-5" style="color:var(--text-secondary)">
      당신의 이야기를 아름다운 애니메이션으로 만들어 드립니다.<br>
      지금 바로 의뢰 상담을 시작해보세요.
    </p>
    <div class="flex flex-wrap gap-3 justify-center">
      <button type="button" @click="anynuri.navigate('contact')" class="btn-sakura px-6 py-2.5 rounded-full">상담 신청하기</button>
      <button type="button" @click="anynuri.navigate('faq')" class="btn-outline px-6 py-2.5 rounded-full">자주 묻는 질문</button>
    </div>
  </section>
</div>
    `,
  };
})(window);
