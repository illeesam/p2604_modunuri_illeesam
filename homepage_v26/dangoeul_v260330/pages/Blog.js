window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Blog = {
  name: 'Blog',
  data() {
    return {
      blogModalOpen: false,
      selectedPost: null,
      posts: [
        { emoji: '🍎', cat: '출하', title: '이번 주 사과 수확 일정 안내', date: '2026.03.28', read: '3분', summary: '당도 측정 후 출하되는 프리미엄 라인과 일반 라인의 차이를 설명합니다.' },
        { emoji: '🥗', cat: '레시피', title: '제철 채소로 만드는 샐러드', date: '2026.03.10', read: '5분', summary: '드레싱 없이도 맛있는 배합 비율과 보관 팁을 소개합니다.' },
        { emoji: '🍯', cat: '가공', title: '산지 잼·청 담그기 클래스', date: '2026.02.28', read: '4분', summary: '농장 픽업 일정과 함께 열리는 체험 프로그램을 안내합니다.' },
        { emoji: '🚜', cat: '현장', title: '봄갈이와 모종 심기', date: '2026.02.15', read: '6분', summary: '협력 농가의 봄 준비 현장을 사진으로 전합니다.' },
        { emoji: '📦', cat: '구독', title: '정기 박스 구성 변경 안내', date: '2026.01.30', read: '3분', summary: '3월 박스에 들어가는 품목과 알레르기 옵션을 정리했습니다.' },
        { emoji: '♻️', cat: 'ESG', title: '친환경 포장재 전환 후기', date: '2026.01.10', read: '4분', summary: '얼음팩 재사용·박스 회수 프로세스와 고객 참여 방법을 소개합니다.' },
      ],
    };
  },
  methods: {
    openBlogDetail(post) {
      this.selectedPost = post;
      this.blogModalOpen = true;
    },
    closeBlogDetail() {
      this.blogModalOpen = false;
      this.selectedPost = null;
    },
  },
  template: /* html */ `
  <div class="page-wrap">
    <div v-if="!blogModalOpen">
      <div style="margin-bottom:32px;">
        <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">소식·레시피</div>
        <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">밭의 소식 &amp; <span class="gradient-text">제철 레시피</span></h1>
        <p class="section-subtitle">출하 일정, 요리 팁, 농장 이야기를 한곳에 모았습니다.</p>
      </div>
      <div class="grid-3">
        <div v-for="post in posts" :key="post.title" class="blog-card" style="cursor:pointer;" @click="openBlogDetail(post)">
          <div class="blog-thumb">{{ post.emoji }}</div>
          <div style="padding:20px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span class="badge badge-cat" style="font-size:0.65rem;">{{ post.cat }}</span>
              <span style="font-size:0.72rem;color:var(--text-muted);">{{ post.date }}</span>
              <span style="font-size:0.72rem;color:var(--text-muted);">· {{ post.read }}</span>
            </div>
            <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;line-height:1.4;">{{ post.title }}</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">{{ post.summary }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <button @click="closeBlogDetail"
              style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.95rem;margin-bottom:18px;padding:0;transition:color 0.2s;"
              onmouseover="this.style.color='var(--blue)'"
              onmouseout="this.style.color='var(--text-muted)'">
        ← 블로그로
      </button>
      <div v-if="selectedPost" class="card" style="padding:28px;text-align:left;">
        <div style="font-size:2rem;line-height:1;margin-bottom:10px;">{{ selectedPost.emoji }}</div>
        <div class="section-title" style="font-size:1.8rem;margin-bottom:12px;text-align:left;">{{ selectedPost.title }}</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          <span class="badge badge-cat" style="font-size:0.75rem;">{{ selectedPost.cat }}</span>
          <span style="color:var(--text-muted);font-size:0.85rem;">{{ selectedPost.date }} · {{ selectedPost.read }}</span>
        </div>
        <div style="white-space:pre-line;color:var(--text-secondary);line-height:1.8;">
          {{ selectedPost.summary }}
        </div>
      </div>
    </div>
  </div>
  `,
};
