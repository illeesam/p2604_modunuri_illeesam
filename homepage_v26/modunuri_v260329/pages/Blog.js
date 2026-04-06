/* MODUNURI - PageBlog */
window.PageBlog = {
  name: 'PageBlog',
  props: ['navigate', 'config', 'page'],
  emits: [],
  template: /* html */ `
<div>
  <!-- ════ PAGE: BLOG ════ -->
  <div v-if="page==='blog'" class="page-wrap">
    <div style="margin-bottom:32px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">블로그</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">기술 인사이트 &amp; <span class="gradient-text">최신 트렌드</span></h1>
      <p class="section-subtitle">소프트웨어 개발, 클라우드, AI에 대한 전문 지식을 나눕니다.</p>
    </div>
    <div class="grid-3">
      <div v-for="post in blogPosts" :key="post.title" class="blog-card" style="cursor:pointer;" @click="openBlogDetail(post)">
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

  <!-- ════ PAGE: BLOG DETAIL ════ -->
  <div v-else-if="page==='blogDetail'" class="page-wrap">
    <div style="margin-bottom:28px;">
      <button @click="closeBlogDetail"
        style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.95rem;margin-bottom:18px;padding:0;"
        onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">
        ← 블로그로
      </button>
      <div v-if="blogModal.post">
        <div style="font-size:2rem;line-height:1;margin-bottom:10px;">{{ blogModal.post.emoji }}</div>
        <div class="section-title" style="font-size:2rem;margin-bottom:10px;text-align:left;">
          {{ blogModal.post.title }}
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          <span class="badge badge-cat" style="font-size:0.75rem;">{{ blogModal.post.cat }}</span>
          <span style="color:var(--text-muted);font-size:0.8rem;">{{ blogModal.post.date }} · {{ blogModal.post.read }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="padding:28px;white-space:pre-line;text-align:left;">
      {{ blogModal.post ? blogModal.post.summary : '선택된 글이 없습니다.' }}
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { reactive } = Vue;

    const blogPosts = [
      {emoji:'🤖', cat:'AI', title:'AI가 바꾸는 소프트웨어 개발', date:'2026.03.10', read:'5분', summary:'생성형 AI가 코드 작성, 테스트, 배포 자동화를 어떻게 혁신하고 있는지 살펴봅니다.'},
      {emoji:'☁️', cat:'클라우드', title:'클라우드 마이그레이션 성공 사례', date:'2026.02.28', read:'7분', summary:'온프레미스에서 클라우드로 이전한 중소기업의 실제 ROI 분석과 교훈을 공유합니다.'},
      {emoji:'🔐', cat:'보안', title:'보안 취약점과 대응 방법', date:'2026.02.15', read:'6분', summary:'최근 증가하는 기업 보안 위협과 효과적인 방어 전략을 구체적으로 안내합니다.'},
      {emoji:'🚀', cat:'스타트업', title:'스타트업 MVP 개발 전략', date:'2026.01.30', read:'4분', summary:'빠른 시장 검증을 위한 MVP 설계 원칙과 모두누리의 실전 개발 프레임워크를 소개합니다.'},
      {emoji:'📊', cat:'데이터', title:'데이터 기반 의사결정', date:'2026.01.20', read:'5분', summary:'비즈니스 인텔리전스 도구를 활용해 데이터를 실질적인 의사결정 자원으로 전환하는 방법.'},
      {emoji:'💻', cat:'개발트렌드', title:'노코드 시대의 개발자', date:'2026.01.10', read:'4분', summary:'노코드/로우코드 플랫폼 확산 속에서 소프트웨어 개발자의 역할이 어떻게 진화하는지 분석합니다.'},
    ];

    const blogModal = reactive({ show: false, post: null });

    const openBlogDetail = post => {
      blogModal.post = post;
      blogModal.show = true;
      props.navigate('blogDetail');
    };

    const closeBlogDetail = () => {
      blogModal.show = false;
      blogModal.post = null;
      props.navigate('blog');
    };

    return { blogPosts, blogModal, openBlogDetail, closeBlogDetail };
  }
};
