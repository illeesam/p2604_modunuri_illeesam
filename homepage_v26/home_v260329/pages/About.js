/* HOME — ABOUT (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.About = {
    name: 'About',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-5xl mx-auto">
<h1 class="text-4xl font-black gradient-text mb-10" style="letter-spacing:-0.03em">소개</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div class="card p-8 rounded-2xl" style="border-color:rgba(16,185,129,0.2)">
              <div class="text-5xl mb-4">💡</div>
              <h2 class="text-xl font-black mb-4 gradient-text">STUDIO는</h2>
              <p class="text-sm leading-relaxed" style="color:var(--text-secondary)">
                2020년부터 100여 개의 프로젝트를 성공적으로 완수한 크리에이티브 기술 스튜디오입니다.
                웹, 모바일, 데이터 분야에서 고객의 비즈니스 성장을 위한 맞춤형 솔루션을 제공합니다.
              </p>
            </div>
            <div class="space-y-4">
              <div v-for="v in studio.values" :key="v.id" class="card p-4 flex items-start gap-4">
                <div class="text-2xl">{{ v.icon }}</div>
                <div>
                  <div class="font-bold text-sm mb-1" style="color:var(--text-primary)">{{ v.title }}</div>
                  <div class="text-xs" style="color:var(--text-secondary)">{{ v.desc }}</div>
                </div>
              </div>
            </div>
          </div>
          <!-- Team -->
          <h2 class="text-2xl font-black gradient-text mb-6">팀 소개</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="m in studio.team" :key="m.id" class="card p-5 text-center">
              <div class="text-4xl mb-3">{{ m.avatar }}</div>
              <div class="font-bold text-sm" style="color:var(--text-primary)">{{ m.name }}</div>
              <div class="text-xs" :style="'color:'+m.color">{{ m.role }}</div>
            </div>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
