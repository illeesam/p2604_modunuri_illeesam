/* PARTYROOM — blog (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Blog = {
    name: 'Blog',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:1000px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">블로그</h1>
          <p class="section-subtitle">공간 활용 노하우와 최신 트렌드를 확인하세요.</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;">
          <div
            v-for="(post, idx) in [
              { emoji:'🎨', cat:'인테리어', title:'공간 인테리어 트렌드 2026', desc:'올해 가장 주목받는 공간 인테리어 트렌드를 분석하고, 파티룸에 적용할 수 있는 아이디어를 소개합니다.', date:'2026-03-15', readTime:'5분' },
              { emoji:'📚', cat:'스터디팁', title:'스터디룸 효율적 사용법', desc:'집중력을 높이는 스터디룸 세팅 방법과 그룹 스터디 운영 팁을 공유합니다.', date:'2026-03-10', readTime:'4분' },
              { emoji:'🎉', cat:'파티기획', title:'완벽한 파티 준비 가이드', desc:'생일파티부터 돌잔치, 소모임까지 — 행사 유형별 완벽한 준비 체크리스트를 제공합니다.', date:'2026-03-05', readTime:'7분' },
              { emoji:'📊', cat:'비즈니스', title:'세미나 기획 노하우', desc:'참석자를 사로잡는 세미나 기획의 핵심 요소와 공간 세팅 가이드를 상세히 알려드립니다.', date:'2026-02-28', readTime:'6분' },
              { emoji:'🎬', cat:'촬영팁', title:'촬영 스튜디오 활용법', desc:'유튜브, 팟캐스트, 온라인 강의 등 목적별 최적의 촬영 환경 구성 방법을 안내합니다.', date:'2026-02-20', readTime:'5분' },
              { emoji:'💡', cat:'예약안내', title:'공간 예약 시 알아야 할 것들', desc:'처음 공간을 예약하는 분들을 위한 절차, 주의사항, 꿀팁을 정리했습니다.', date:'2026-02-15', readTime:'3분' },
            ]"
            :key="idx"
            class="blog-card"
            style="cursor:pointer;"
            @click="partyroom.openBlogDetail(post)"
          >
            <div class="blog-thumb">{{ post.emoji }}</div>
            <div style="padding:1.25rem;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="badge badge-gold">{{ post.cat }}</span>
                <span style="font-size:0.72rem;color:var(--text-muted);">{{ post.readTime }} 읽기</span>
              </div>
              <h3 style="font-weight:800;font-size:0.95rem;color:var(--text-primary);margin-bottom:6px;line-height:1.4;">{{ post.title }}</h3>
              <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">{{ post.desc }}</p>
              <div style="font-size:0.72rem;color:var(--text-muted);">{{ post.date }}</div>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})(window);
