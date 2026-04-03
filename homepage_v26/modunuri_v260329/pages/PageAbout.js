/* MODUNURI - PageAbout */
window.PageAbout = {
  name: 'PageAbout',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">회사소개</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:12px;">모두를 위한 기술,<br><span class="gradient-text">모두누리</span></h1>
    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.8;max-width:600px;">
      2015년 설립 이후, 모두누리는 중소기업부터 대기업까지 다양한 규모의 고객사에 맞춤형 소프트웨어 솔루션을 제공해왔습니다. AI, ERP, 클라우드, 모바일 앱 등 폭넓은 기술 스택으로 고객의 디지털 혁신을 이끌어 왔습니다.
    </p>
  </div>

  <!-- Founding story -->
  <div class="card" style="padding:28px;margin-bottom:28px;">
    <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🏗️ 창업 스토리</h2>
    <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.8;">
      모두누리는 "모든 사람이 누릴 수 있는 기술"이라는 비전 아래, 기술 격차 해소와 접근 가능한 디지털 전환을 목표로 설립되었습니다. 초기 5명의 개발팀으로 시작해 현재 50여 명의 전문 인력이 함께하고 있으며, 국내외 100여 개 고객사를 보유한 기술 솔루션 기업으로 성장했습니다.
    </p>
  </div>

  <!-- Team stats -->
  <div class="grid-4" style="margin-bottom:28px;">
    <div class="stat-card">
      <div class="stat-number" style="color:var(--blue);">10+</div>
      <div class="stat-label">설립 연수</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--green);">50+</div>
      <div class="stat-label">전문 인력</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--purple);">100+</div>
      <div class="stat-label">고객사</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" style="color:var(--blue);">6개</div>
      <div class="stat-label">핵심 솔루션</div>
    </div>
  </div>

  <!-- Values -->
  <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">핵심 가치</h2>
  <div class="grid-3" style="margin-bottom:28px;">
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">⚙️</div>
      <div style="font-size:1rem;font-weight:700;color:var(--blue);margin-bottom:8px;">기술력</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">최신 기술 트렌드를 선도하며 견고하고 확장 가능한 시스템을 구축합니다.</p>
    </div>
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">🤝</div>
      <div style="font-size:1rem;font-weight:700;color:var(--green);margin-bottom:8px;">신뢰</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">투명한 커뮤니케이션과 약속 이행으로 장기적 파트너 관계를 구축합니다.</p>
    </div>
    <div class="value-card">
      <div style="font-size:2.5rem;margin-bottom:14px;">💡</div>
      <div style="font-size:1rem;font-weight:700;color:var(--purple);margin-bottom:8px;">혁신</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">고객 문제를 창의적으로 해결하며 끊임없이 더 나은 방식을 찾습니다.</p>
    </div>
  </div>

  <!-- Partners -->
  <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">파트너사</h2>
  <div class="card" style="padding:28px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:16px;">
      <div v-for="n in 6" :key="n"
        style="height:56px;border-radius:10px;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.75rem;font-weight:600;border:1px solid var(--border);">
        파트너 {{ n }}
      </div>
    </div>
  </div>
</div>
  `,
  setup() {
    return {};
  }
};
