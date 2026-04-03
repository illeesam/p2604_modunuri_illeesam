/* ============================================
   PARTYROOM - PageBlog Component
   블로그
   ============================================ */
window.PageBlog = {
  name: 'PageBlog',
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">블로그</h1>
        <p class="section-subtitle">공간 활용 팁과 이용 후기를 확인하세요</p>
      </div>
      <!-- Featured -->
      <div class="card mb-6 overflow-hidden rounded-2xl cursor-pointer hover:border-yellow-400/30 transition-all" style="border-color:rgba(201,168,76,0.2)">
        <div class="flex flex-col md:flex-row">
          <div class="flex items-center justify-center"
               style="min-height:180px;min-width:260px;font-size:6rem;background:linear-gradient(135deg,#16182a,#1e1830)">
            🎉
          </div>
          <div class="p-6">
            <div class="badge badge-gold mb-3">FEATURED</div>
            <h2 class="font-black text-xl mb-2" style="color:var(--text-primary)">파티룸 스페이스 오픈 1주년 기념 이벤트</h2>
            <p class="text-sm leading-relaxed mb-4" style="color:var(--text-secondary)">
              오픈 1주년을 맞이하여 다양한 감사 이벤트를 진행합니다. 장기 할인율 최대 35%까지 확대, 무료 음료 서비스 등 풍성한 혜택을 만나보세요.
            </p>
            <div class="flex items-center justify-between">
              <span class="text-xs" style="color:var(--text-muted)">2026.03.20 · 공지사항</span>
              <button class="btn-outline px-4 py-1.5 rounded-lg text-xs">자세히 보기</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="post in posts" :key="post.id" class="card cursor-pointer rounded-xl overflow-hidden">
          <div class="flex items-center justify-center"
               style="height:140px;font-size:4rem;background:linear-gradient(135deg,#16182a,#1e1830)">
            {{ post.emoji }}
          </div>
          <div class="p-4">
            <div class="badge badge-purple mb-2">{{ post.cat }}</div>
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
      { id:1, emoji:'📚', title:'스터디룸 200% 활용하는 방법', excerpt:'집중력을 높이는 조명 조절과 시간 관리 팁을 공유합니다', cat:'스터디 팁', date:'2026.03.15' },
      { id:2, emoji:'🎂', title:'생일 파티 공간 준비 체크리스트', excerpt:'완벽한 생일 파티를 위한 사전 준비 사항 총정리', cat:'파티 가이드', date:'2026.03.10' },
      { id:3, emoji:'💼', title:'효율적인 팀 회의를 위한 공간 배치', excerpt:'참석자 수와 목적에 따른 최적 회의실 선택 가이드', cat:'회의 팁', date:'2026.03.05' },
      { id:4, emoji:'📸', title:'파티룸 D에서 진행한 제품 촬영 후기', excerpt:'전문 조명 설비를 활용한 인스타 감성 촬영 성공 스토리', cat:'이용 후기', date:'2026.02.28' },
      { id:5, emoji:'🎓', title:'합격을 부르는 스터디 그룹 운영법', excerpt:'장기 스터디룸 이용자들이 공유하는 성공 비결', cat:'스터디 팁', date:'2026.02.20' },
      { id:6, emoji:'🍾', title:'30인 송년 파티 완벽 후기', excerpt:'파티룸 D에서 진행한 직장 송년 파티의 모든 것', cat:'이용 후기', date:'2026.02.15' },
    ];
    return { posts };
  }
};
