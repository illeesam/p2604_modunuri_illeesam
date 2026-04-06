/* ANYNURI — 블로그 목록 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageBlog = {
    name: 'PageBlog',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-5xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">블로그</h1>
    <p class="section-subtitle">애니메이션 업계 인사이트 & 스튜디오 소식</p>
  </div>
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'🎨', tag:'스토리텔링', date:'2026.03.10', title:'애니메이션 스토리텔링의 힘', content:'왜 좋은 이야기가 애니메이션의 성패를 결정하는가. 감정이입과 서사 구조의 중요성.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#1a0020,#2a1040)">🎨</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill">스토리텔링</span>
          <span class="text-xs" style="color:var(--text-muted)">2026.03.10</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">애니메이션 스토리텔링의 힘</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          왜 좋은 이야기가 애니메이션의 성패를 결정하는가. 감정이입과 서사 구조의 중요성.
        </p>
      </div>
    </div>
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'⚡', tag:'제작기술', date:'2026.02.25', title:'2D vs 3D 어떤 걸 선택할까', content:'프로젝트 성격에 따른 2D·3D 선택 기준과 비용·기간 비교 완전 가이드.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#001a20,#002a30)">⚡</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill" style="background:var(--sky-dim);border-color:rgba(77,150,255,0.3);color:var(--sky)">제작기술</span>
          <span class="text-xs" style="color:var(--text-muted)">2026.02.25</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">2D vs 3D 어떤 걸 선택할까</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          프로젝트 성격에 따른 2D·3D 선택 기준과 비용·기간 비교 완전 가이드.
        </p>
      </div>
    </div>
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'📱', tag:'트렌드', date:'2026.02.10', title:'OTT 시대의 애니메이션 전략', content:'넷플릭스·디즈니+ 등 글로벌 OTT 플랫폼이 바꾸는 애니메이션 산업의 지형.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#1a1000,#2a2000)">📱</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill" style="background:var(--gold-dim);border-color:rgba(224,144,0,0.3);color:var(--gold)">트렌드</span>
          <span class="text-xs" style="color:var(--text-muted)">2026.02.10</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">OTT 시대의 애니메이션 전략</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          넷플릭스·디즈니+ 등 글로벌 OTT 플랫폼이 바꾸는 애니메이션 산업의 지형.
        </p>
      </div>
    </div>
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'📊', tag:'캐릭터디자인', date:'2026.01.28', title:'캐릭터 디자인 프로세스 공개', content:'AnyNuri 아트팀이 실제로 사용하는 캐릭터 디자인 워크플로우를 상세히 공개합니다.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#0a1a00,#1a2a00)">📊</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill" style="background:var(--mint-dim);border-color:rgba(40,167,69,0.3);color:var(--mint)">캐릭터디자인</span>
          <span class="text-xs" style="color:var(--text-muted)">2026.01.28</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">캐릭터 디자인 프로세스 공개</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          AnyNuri 아트팀이 실제로 사용하는 캐릭터 디자인 워크플로우를 상세히 공개합니다.
        </p>
      </div>
    </div>
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'🔐', tag:'저작권', date:'2026.01.15', title:'IP 개발과 저작권 관리', content:'애니메이션 IP의 가치를 극대화하는 전략과 저작권 보호의 실전 노하우.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#1a0a00,#2a1500)">🔐</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill">저작권</span>
          <span class="text-xs" style="color:var(--text-muted)">2026.01.15</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">IP 개발과 저작권 관리</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          애니메이션 IP의 가치를 극대화하는 전략과 저작권 보호의 실전 노하우.
        </p>
      </div>
    </div>
    <div class="blog-card"
      @click="anynuri.openBlogDetail({ emoji:'🚀', tag:'제작기', date:'2025.12.20', title:'단편 애니메이션 제작기', content: '(마녀의 제과점) 제작 뒷이야기. 기획부터 완성까지 6개월간의 기록.' })">
      <div class="flex items-center justify-center h-36 text-5xl"
        style="background:linear-gradient(135deg,#001a1a,#002a2a)">🚀</div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag-pill" style="background:var(--sky-dim);border-color:rgba(77,150,255,0.3);color:var(--sky)">제작기</span>
          <span class="text-xs" style="color:var(--text-muted)">2025.12.20</span>
        </div>
        <h3 class="font-black text-sm mb-1.5" style="color:var(--text-primary)">단편 애니메이션 제작기</h3>
        <p class="text-xs leading-relaxed" style="color:var(--text-secondary)">
          '마녀의 제과점' 제작 뒷이야기. 기획부터 완성까지 6개월간의 기록.
        </p>
      </div>
    </div>
  </div>
</div>
    `,
  };
})(window);
