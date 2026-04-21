/* ShopJoy - Blog (블로그 목록) */
window.Blog = {
  name: 'Blog',
  props: ['navigate', 'config'],
  setup(props) {
    const { ref, computed } = Vue;

    const searchText = ref('');
    const selectedCat = ref('all');

    const categories = [
      { id: 'all', name: '전체' },
      { id: 'fashion', name: '패션' },
      { id: 'lifestyle', name: '라이프스타일' },
      { id: 'trend', name: '트렌드' },
      { id: 'howto', name: '스타일링 팁' },
    ];

    const posts = ref([
      { id: 1, title: 'Anteposuerit litterarum formas.', category: 'fashion', author: '김민지', date: '2026.04.10', readTime: '5분',
        excerpt: '고급 코튼 소재로 제작된 프리미엄 티셔츠. 통기성이 우수하고 세탁 후에도 형태가 유지됩니다. 올봄 스타일링의 핵심 아이템을 만나보세요.',
        thumb: 'assets/cdn/prod/img/blog/blog-1.jpg', tags: ['패션', '신상품', '코튼100%'], viewCount: 1240, commentCount: 8 },
      { id: 2, title: '2026 봄 트렌드 컬러 가이드', category: 'trend', author: '이수진', date: '2026.04.08', readTime: '7분',
        excerpt: '올 봄 주목해야 할 트렌드 컬러와 컬러 매칭 방법을 알아봅니다. 파스텔부터 비비드까지 시즌 컬러를 완벽하게 활용하세요.',
        thumb: 'assets/cdn/prod/img/blog/blog-2.jpg', tags: ['트렌드', '컬러', '2026SS'], viewCount: 890, commentCount: 5 },
      { id: 3, title: '미니멀 라이프를 위한 옷장 정리법', category: 'lifestyle', author: '박지현', date: '2026.04.05', readTime: '4분',
        excerpt: '효율적인 옷장 정리 방법과 캡슐 워드로브 구성 팁. 적은 아이템으로 다양한 코디를 완성하는 비결을 공개합니다.',
        thumb: 'assets/cdn/prod/img/blog/blog-3.jpg', tags: ['미니멀', '정리', '캡슐워드로브'], viewCount: 2100, commentCount: 15 },
      { id: 4, title: '데님 스타일링 A to Z', category: 'howto', author: '정다운', date: '2026.04.03', readTime: '6분',
        excerpt: '계절별 데님 스타일링 팁과 데님 케어 방법까지. 기본 아이템 데님을 200% 활용하는 방법을 알려드립니다.',
        thumb: 'assets/cdn/prod/img/blog/blog-4.jpg', tags: ['데님', '스타일링', '가이드'], viewCount: 1560, commentCount: 12 },
      { id: 5, title: '지속 가능한 패션의 시작', category: 'lifestyle', author: '최예린', date: '2026.03.28', readTime: '8분',
        excerpt: '환경을 생각하는 패션 소비, 어디서부터 시작할 수 있을까요? 지속 가능한 소재와 브랜드를 소개합니다.',
        thumb: 'assets/cdn/prod/img/blog/blog-5.jpg', tags: ['지속가능', '친환경', '윤리패션'], viewCount: 780, commentCount: 3 },
      { id: 6, title: '봄 아우터 베스트 5', category: 'fashion', author: '강하늘', date: '2026.03.25', readTime: '5분',
        excerpt: '환절기 필수 아우터 추천! 트렌치코트부터 라이트 재킷까지, 올봄 꼭 갖춰야 할 아우터 5가지를 엄선했습니다.',
        thumb: 'assets/cdn/prod/img/blog/blog-6.jpg', tags: ['아우터', '추천', '봄패션'], viewCount: 1890, commentCount: 9 },
    ]);

    const filteredPosts = computed(() => {
      let list = posts.value;
      if (selectedCat.value !== 'all') list = list.filter(p => p.category === selectedCat.value);
      const q = searchText.value.trim().toLowerCase();
      if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.tags || []).some(t => t.includes(q)));
      return list;
    });

    const thumbBgs = [
      'linear-gradient(135deg, #f5f0e8 0%, #e8d5b7 100%)',
      'linear-gradient(135deg, #e8edf5 0%, #c7d2e0 100%)',
      'linear-gradient(135deg, #f0e8f5 0%, #d5c2e0 100%)',
      'linear-gradient(135deg, #e8f5f0 0%, #b7e0d5 100%)',
      'linear-gradient(135deg, #f5e8ea 0%, #e0c2c7 100%)',
      'linear-gradient(135deg, #f5f2e8 0%, #e0d5b7 100%)',
    ];
    const postBg = (id) => thumbBgs[(id - 1) % thumbBgs.length];

    const latestPosts = computed(() => [...posts.value].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4));

    return { searchText, selectedCat, categories, filteredPosts, latestPosts, postBg };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="블로그"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">ShopJoy</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">News & Blog</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span>
        <span style="color:#333;">Blog</span>
      </div>
    </div>
  </div>

  <!-- 검색 -->
  <div style="display:flex;justify-content:center;margin-bottom:32px;">
    <div style="position:relative;width:100%;max-width:480px;">
      <input v-model="searchText" type="text" placeholder="검색어를 입력하세요..."
        style="width:100%;padding:12px 44px 12px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
      <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:1rem;">🔍</span>
    </div>
  </div>

  <!-- 레이아웃: 사이드바 + 본문 -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(16px,3vw,32px);" class="blog-grid">

    <!-- 사이드바 -->
    <aside>
      <!-- 카테고리 -->
      <div style="margin-bottom:28px;">
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">Product Categories</h3>
        <ul style="list-style:none;padding:0;margin:0;">
          <li v-for="cat in categories" :key="cat.id"
            @click="selectedCat=cat.id"
            :style="{
              padding:'8px 0', cursor:'pointer', fontSize:'0.84rem',
              color: selectedCat===cat.id ? 'var(--blue)' : 'var(--text-secondary)',
              fontWeight: selectedCat===cat.id ? '700' : '400',
              borderLeft: selectedCat===cat.id ? '2px solid var(--blue)' : '2px solid transparent',
              paddingLeft: '12px', transition:'all .15s',
            }">{{ cat.name }}</li>
        </ul>
      </div>

      <!-- 최신 글 -->
      <div>
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">Latest Posts</h3>
        <div v-for="p in latestPosts" :key="p.id" @click="navigate('blogView', { editId: p.id })"
          style="display:flex;gap:10px;margin-bottom:14px;cursor:pointer;padding:6px 0;"
          @mouseenter="$event.currentTarget.style.opacity='0.7'"
          @mouseleave="$event.currentTarget.style.opacity='1'">
          <div style="width:50px;height:50px;border-radius:6px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
            <img v-if="p.thumb" :src="p.thumb" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="min-width:0;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--text-primary);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.title }}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">{{ p.date }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 포스트 목록 -->
    <div>
      <div v-for="post in filteredPosts" :key="post.id"
        class="card" style="display:flex;flex-wrap:wrap;gap:clamp(12px,2vw,24px);padding:0;margin-bottom:clamp(12px,2vw,24px);overflow:hidden;cursor:pointer;transition:box-shadow .2s;"
        @click="navigate('blogView', { editId: post.id })"
        @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
        @mouseleave="$event.currentTarget.style.boxShadow=''">

        <!-- 썸네일 -->
        <div style="width:clamp(200px,30%,280px);min-height:180px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
          <img v-if="post.thumb" :src="post.thumb" :alt="post.title" style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'" @mouseleave="$event.target.style.transform=''" />
        </div>

        <!-- 내용 -->
        <div style="flex:1;min-width:200px;padding:clamp(14px,2vw,24px) clamp(14px,2vw,24px) clamp(14px,2vw,24px) 0;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:0.72rem;color:var(--blue);font-weight:600;">{{ categories.find(c => c.id === post.category)?.name || post.category }}</span>
          </div>
          <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;line-height:1.4;">{{ post.title }}</h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ post.excerpt }}</p>
          <div style="display:flex;align-items:center;gap:12px;font-size:0.75rem;color:var(--text-muted);">
            <span>By {{ post.author }}</span>
            <span>·</span>
            <span>{{ post.date }}</span>
            <span>·</span>
            <span>{{ post.readTime }} 읽기</span>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="filteredPosts.length === 0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:12px;">📝</div>
        <div style="font-size:0.95rem;">검색 결과가 없습니다.</div>
      </div>
    </div>
  </div>

</div>
  `
};
