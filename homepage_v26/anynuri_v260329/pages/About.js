/* ANYNURI — 회사 소개 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageAbout = {
    name: 'PageAbout',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">회사 소개</h1>
    <p class="section-subtitle">AnyNuri Animation Studio</p>
  </div>
  <div class="card p-6 mb-6">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-xl">✨</div>
      <div>
        <h2 class="font-black" style="color:var(--text-primary)">AnyNuri</h2>
        <p class="text-xs" style="color:var(--text-muted)">2016년 설립 · 서울 마포구</p>
      </div>
    </div>
    <p class="text-sm leading-relaxed mb-4" style="color:var(--text-secondary)">
      AnyNuri는 2016년에 설립된 독립 애니메이션 스튜디오입니다. "세상 모든 누리를 애니메이션으로"라는 비전 아래
      감성적인 2D 애니메이션부터 스펙터클한 3D CG 작품까지 다양한 장르와 스타일을 아우릅니다.
      국내외 15개 이상의 작품을 제작하였으며, 12회의 국내외 수상 경력을 보유하고 있습니다.
    </p>
    <p class="text-sm leading-relaxed" style="color:var(--text-secondary)">
      일본·미국·유럽 배급사와의 파트너십을 통해 5개국에 작품을 배급하고 있으며,
      OTT 플랫폼 오리지널 콘텐츠 제작에도 적극 참여하고 있습니다.
    </p>
  </div>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div v-for="(s, i) in anynuri.config.stats" :key="i" class="stat-card">
      <div class="stat-value gradient-text">{{ s.value }}</div>
      <div class="stat-label">{{ s.label }}</div>
    </div>
  </div>
  <h2 class="text-lg font-black mb-4" style="color:var(--text-primary)">핵심 가치</h2>
  <div class="grid md:grid-cols-3 gap-4 mb-8">
    <div class="card p-5 text-center">
      <div class="text-3xl mb-3">🌸</div>
      <h3 class="font-black mb-2" style="color:var(--sakura)">감성</h3>
      <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
        보는 이의 마음을 움직이는 진심 어린 스토리텔링과 섬세한 감정 표현
      </p>
    </div>
    <div class="card p-5 text-center">
      <div class="text-3xl mb-3">⚡</div>
      <h3 class="font-black mb-2" style="color:var(--sky)">혁신</h3>
      <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
        최신 기술과 창의적 발상으로 애니메이션의 경계를 끊임없이 확장
      </p>
    </div>
    <div class="card p-5 text-center">
      <div class="text-3xl mb-3">🤝</div>
      <h3 class="font-black mb-2" style="color:var(--mint)">협력</h3>
      <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
        클라이언트와의 긴밀한 소통으로 비전을 현실로 만드는 파트너십
      </p>
    </div>
  </div>
  <h2 class="text-lg font-black mb-4" style="color:var(--text-primary)">팀 소개</h2>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="team-card">
      <div class="team-avatar">👩‍🎨</div>
      <div class="font-black text-sm mb-0.5" style="color:var(--text-primary)">김아영</div>
      <div class="text-xs" style="color:var(--sakura)">대표감독</div>
      <p class="text-xs mt-2 leading-relaxed" style="color:var(--text-muted)">10년 경력 애니메이션 감독</p>
    </div>
    <div class="team-card">
      <div class="team-avatar">🎨</div>
      <div class="font-black text-sm mb-0.5" style="color:var(--text-primary)">박지훈</div>
      <div class="text-xs" style="color:var(--sky)">아트디렉터</div>
      <p class="text-xs mt-2 leading-relaxed" style="color:var(--text-muted)">독창적 세계관 구축 전문</p>
    </div>
    <div class="team-card">
      <div class="team-avatar">✍️</div>
      <div class="font-black text-sm mb-0.5" style="color:var(--text-primary)">이서연</div>
      <div class="text-xs" style="color:var(--mint)">시나리오작가</div>
      <p class="text-xs mt-2 leading-relaxed" style="color:var(--text-muted)">다수의 수상작 집필 경력</p>
    </div>
    <div class="team-card">
      <div class="team-avatar">🎵</div>
      <div class="font-black text-sm mb-0.5" style="color:var(--text-primary)">최민준</div>
      <div class="text-xs" style="color:var(--gold)">음악감독</div>
      <p class="text-xs mt-2 leading-relaxed" style="color:var(--text-muted)">감성 사운드트랙 제작 전문</p>
    </div>
  </div>
</div>
    `,
  };
})(window);
