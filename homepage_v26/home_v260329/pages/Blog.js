/* HOME - PageBlog */
window.PageBlog = {
  name: 'PageBlog',
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-8" style="letter-spacing:-0.03em">블로그</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="post in posts" :key="post.id" class="portfolio-card">
          <div class="flex items-center justify-center" :style="'height:140px;font-size:4rem;background:'+post.bg">{{ post.emoji }}</div>
          <div class="p-5">
            <span class="text-xs px-2 py-0.5 rounded mb-2 inline-block" style="background:var(--amber-dim);color:var(--amber)">{{ post.cat }}</span>
            <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">{{ post.title }}</h3>
            <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ post.excerpt }}</p>
            <div class="text-xs" style="color:var(--text-muted)">{{ post.date }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const posts = [
      { id:1, emoji:'🎨', title:'좋은 UI가 비즈니스에 미치는 영향', excerpt:'사용자 경험이 전환율에 미치는 실제 데이터 분석', cat:'디자인', date:'2026.03.20', bg:'#1a2a1a' },
      { id:2, emoji:'⚡', title:'웹사이트 성능 최적화 완전 가이드', excerpt:'Core Web Vitals 점수를 95점 이상으로 올리는 방법', cat:'개발', date:'2026.03.15', bg:'#1a1a2a' },
      { id:3, emoji:'📱', title:'모바일 우선 설계의 중요성', excerpt:'2026년 모바일 사용자 비율과 반응형 디자인 전략', cat:'디자인', date:'2026.03.10', bg:'#2a1a1a' },
      { id:4, emoji:'📊', title:'데이터 기반 의사결정 도입기', excerpt:'A/B 테스트로 전환율을 40% 향상시킨 실제 사례', cat:'데이터', date:'2026.03.05', bg:'#1a2a2a' },
      { id:5, emoji:'🔐', title:'웹 보안의 기초: OWASP Top 10', excerpt:'개발자가 알아야 할 웹 보안 취약점과 대응 방법', cat:'보안', date:'2026.02.28', bg:'#2a2a1a' },
      { id:6, emoji:'🚀', title:'스타트업을 위한 MVP 개발 전략', excerpt:'예산을 최소화하면서 빠르게 시장을 검증하는 법', cat:'전략', date:'2026.02.20', bg:'#1a2a1a' },
    ];
    return { posts };
  }
};
