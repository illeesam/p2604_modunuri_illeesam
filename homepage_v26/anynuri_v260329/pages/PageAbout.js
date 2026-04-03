/* ANYNURI - PageAbout */
window.PageAbout = {
  name: 'PageAbout',
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">회사소개</h1>
      <p class="section-subtitle mb-10">애니메이션으로 세상을 물들이는 크리에이티브 스튜디오</p>

      <!-- About card -->
      <div class="card p-8 rounded-2xl mb-6" style="border-color:rgba(255,107,157,0.2)">
        <div class="text-5xl mb-4">🎬</div>
        <h2 class="text-xl font-black mb-3 gradient-text">AnyNuri는</h2>
        <p class="text-sm leading-relaxed mb-4" style="color:var(--text-secondary)">
          2016년 설립된 AnyNuri는 감동적인 이야기와 아름다운 비주얼로 관객의 마음을 사로잡는
          애니메이션 전문 스튜디오입니다. 국내외 15편 이상의 작품을 제작하였으며,
          다양한 국제 애니메이션 페스티벌에서 수상한 실력을 보유하고 있습니다.
        </p>
        <p class="text-sm leading-relaxed" style="color:var(--text-secondary)">
          2D 셀 애니메이션부터 2.5D, 풀 3D CG까지 다양한 스타일의 제작이 가능하며,
          기업 광고 애니메이션, IP 개발, OTT 시리즈까지 폭넓은 영역에서 활동하고 있습니다.
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="s in stats" :key="s.label" class="card p-4 text-center rounded-2xl">
          <div class="text-2xl font-black gradient-text mb-1">{{ s.value }}</div>
          <div class="text-xs" style="color:var(--text-muted)">{{ s.label }}</div>
        </div>
      </div>

      <!-- Values -->
      <h2 class="text-xl font-black gradient-text mb-5">핵심 가치</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="card p-6 rounded-2xl text-center" style="border-color:rgba(255,107,157,0.2)">
          <div class="text-3xl mb-3">🌸</div>
          <h3 class="font-bold mb-2 text-sm" style="color:var(--text-primary)">감성</h3>
          <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">관객의 감정을 움직이는 진심 어린 스토리텔링</p>
        </div>
        <div class="card p-6 rounded-2xl text-center" style="border-color:rgba(77,150,255,0.2)">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-bold mb-2 text-sm" style="color:var(--text-primary)">혁신</h3>
          <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">새로운 기법과 기술로 경계를 넓히는 창의성</p>
        </div>
        <div class="card p-6 rounded-2xl text-center" style="border-color:rgba(107,203,119,0.2)">
          <div class="text-3xl mb-3">🤝</div>
          <h3 class="font-bold mb-2 text-sm" style="color:var(--text-primary)">협력</h3>
          <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">클라이언트와 함께 만들어가는 진정한 파트너십</p>
        </div>
      </div>

      <!-- Team -->
      <h2 class="text-xl font-black gradient-text mb-5">팀 소개</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="m in team" :key="m.name" class="card p-4 rounded-2xl text-center">
          <div class="text-4xl mb-2">{{ m.emoji }}</div>
          <div class="font-bold text-sm mb-1" style="color:var(--text-primary)">{{ m.name }}</div>
          <div class="text-xs" style="color:var(--sakura)">{{ m.role }}</div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const stats = window.SITE_CONFIG.stats;
    const team = [
      { emoji: '👑', name: '김아영', role: '대표 / 감독' },
      { emoji: '🎨', name: '박지훈', role: '아트 디렉터' },
      { emoji: '✍️', name: '이서연', role: '시나리오 작가' },
      { emoji: '🎵', name: '최민준', role: '음악 감독' },
    ];
    return { stats, team };
  }
};
