/* ShopJoy - BlogView (블로그 상세) */
window.BlogView = {
  name: 'BlogView',
  props: ['navigate', 'config', 'editId'],
  setup(props) {
    const { ref, computed } = Vue;

    const posts = [
      { id: 1, title: 'Anteposuerit litterarum formas.', category: 'Fashion', author: '김민지', date: '2026.04.10', readTime: '5분',
        tags: ['패션', '신상품', '코튼100%'], viewCount: 1240,
        img: 'assets/cdn/prod/img/blog/blog-big.jpg',
        imgSm: 'assets/cdn/prod/img/blog/blog-sm-1.jpg',
        imgMid: 'assets/cdn/prod/img/blog/blog-big-2.jpg',
        body: `Elga Ksenia shall Tirza use these kitchen utensils designed for <strong>Élinka</strong>, a new design—oriented brand for consumers introduced at the Ambiente show in February 2016. Lightweight anodized aluminum, bright colors, stainless steel and matte plastic shapes.\n\nAnd round tips on the cutting feature of these products designed for the kitchen. Functional materials are used everyday: chopping boards, utensils and colanders.\n\n<strong>Elga</strong> is a two-color melamine salad bowl where vegetables can be washed, drained and served. The disk at the bottom of the bowl can be turned counterclockwise to drain water when washing vegetables and it can be turned clockwise to lock the drain and hold condiments in the bowl when serving.`,
        comments: [
          { id: 1, author: '이수진', date: '2026.04.11', text: '정말 유용한 정보네요! 다음 시즌 스타일링에 참고하겠습니다.' },
          { id: 2, author: '박지현', date: '2026.04.11', text: '사진도 예쁘고 설명도 자세해서 좋아요.' },
          { id: 3, author: '정다운', date: '2026.04.12', text: '이런 글 더 많이 올려주세요!' },
        ]
      },
      { id: 2, title: '2026 봄 트렌드 컬러 가이드', category: 'Trend', author: '이수진', date: '2026.04.08', readTime: '7분',
        tags: ['트렌드', '컬러', '2026SS'], viewCount: 890,
        img: 'assets/cdn/prod/img/blog/blog-big-3.jpg',
        imgSm: 'assets/cdn/prod/img/blog/blog-sm-2.jpg',
        imgMid: 'assets/cdn/prod/img/blog/blog-big-4.jpg',
        body: `올 봄 주목해야 할 트렌드 컬러는 <strong>파스텔 라벤더</strong>, <strong>소프트 민트</strong>, <strong>코랄 핑크</strong>입니다.\n\n파스텔 컬러는 부드러운 분위기를 연출하면서도 세련된 느낌을 줍니다. 특히 라벤더 컬러는 올해의 트렌드 컬러로 선정되어 많은 브랜드에서 활용하고 있습니다.\n\n코디 시 파스텔 톤은 화이트나 베이지와 매칭하면 깔끔하고, 블랙이나 네이비와 매칭하면 모던한 느낌을 줄 수 있합니다.`,
        comments: [
          { id: 1, author: '강하늘', date: '2026.04.09', text: '라벤더 컬러 너무 예뻐요!' },
        ]
      },
      { id: 3, title: '미니멀 옷장 정리법', category: 'Lifestyle', author: '박지현', date: '2026.04.05', readTime: '4분',
        tags: ['라이프스타일', '정리', '미니멀'], viewCount: 650,
        img: 'assets/cdn/prod/img/blog/blog-big-5.jpg',
        imgSm: 'assets/cdn/prod/img/blog/blog-sm-3.jpg',
        imgMid: 'assets/cdn/prod/img/blog/blog-big-6.jpg',
        body: `효율적인 옷장 정리를 위한 <strong>캡슐 워드로브</strong> 구성 팁을 소개합니다.\n\n우선, 자신의 스타일에 맞는 기본 컬러 팔레트를 정합니다. 뉴트럴 톤(화이트, 베이지, 그레이, 블랙)을 기반으로 하나의 포인트 컬러를 추가합니다.\n\n계절이 바뀔 때마다 입지 않는 옷을 정리하고, 새로운 아이템은 필요성을 충분히 고민한 후 구매하는 것이 중요합니다.`,
        comments: []
      },
    ];

    const postId = computed(() => Number(props.editId) || 1);
    const post   = computed(() => posts.find(p => p.id === postId.value) || posts[0]);

    /* 본문 단락 분리 */
    const bodyParagraphs = computed(() => (post.value.body || '').split('\n\n').filter(Boolean));

    /* 댓글 */
    const commentText   = ref('');
    const localComments = reactive([]);
    const allComments   = computed(() => [...(post.value.comments || []), ...localComments]);
    const addComment    = () => {
      const t = commentText.value.trim();
      if (!t) return;
      localComments.push({ id: Date.now(), author: '홍길동', date: new Date().toISOString().slice(0,10).replace(/-/g,'.'), text: t });
      commentText.value = '';
    };

    /* 사이드바 */
    const searchText  = ref('');
    const latestPosts = computed(() => posts.filter(p => p.id !== postId.value).slice(0, 3));
    const categories  = [
      { name: 'Fashion', count: 12 },
      { name: 'Trend',   count: 8 },
      { name: 'Lifestyle', count: 5 },
      { name: 'Style Guide', count: 9 },
    ];
    const archives = ['2026년 4월 (3)', '2026년 3월 (5)', '2026년 2월 (4)', '2026년 1월 (6)'];
    const recentComments = computed(() =>
      posts.flatMap(p => (p.comments || []).map(c => ({ ...c, postTitle: p.title, postId: p.id }))).slice(0, 3)
    );

    /* 관련 글 */
    const relatedPosts = computed(() => posts.filter(p => p.id !== postId.value).slice(0, 3));

    return { post, bodyParagraphs, commentText, allComments, addComment,
             searchText, latestPosts, categories, archives, recentComments, relatedPosts };
  },
  template: /* html */ `
<div class="page-wrap" style="max-width:1100px;">

  <!-- ══ 2컬럼 레이아웃 ══ -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(20px,4vw,48px);align-items:start;">

    <!-- ── 좌: 본문 영역 ── -->
    <div>
      <!-- 뒤로 -->
      <button @click="navigate('blog')"
        style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;margin-bottom:20px;padding:0;">
        ← 블로그 목록으로
      </button>

      <!-- 카테고리 + 메타 -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:0.75rem;">
        <span style="background:var(--blue);color:#fff;padding:2px 10px;border-radius:2px;font-weight:600;">{{ post.category }}</span>
        <span style="color:var(--text-muted);">By <strong style="color:var(--text-secondary);">{{ post.author }}</strong></span>
        <span style="color:var(--text-muted);">·</span>
        <span style="color:var(--text-muted);">{{ post.date }}</span>
        <span style="color:var(--text-muted);">·</span>
        <span style="color:var(--text-muted);">{{ post.readTime }} 읽기</span>
      </div>

      <!-- 제목 -->
      <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);line-height:1.35;margin-bottom:24px;">{{ post.title }}</h1>

      <!-- 히어로 이미지 -->
      <div style="width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:4px;margin-bottom:28px;background:var(--bg-base);">
        <img :src="post.img" :alt="post.title" style="width:100%;height:100%;object-fit:cover;"
          @error="$event.target.style.display='none'" />
      </div>

      <!-- 본문 첫 단락 -->
      <div v-if="bodyParagraphs[0]"
        style="font-size:0.92rem;color:var(--text-secondary);line-height:1.95;margin-bottom:24px;"
        v-html="bodyParagraphs[0]"></div>

      <!-- 중간 이미지 -->
      <div style="width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:4px;margin-bottom:24px;background:var(--bg-base);">
        <img :src="post.imgMid" :alt="post.title" style="width:100%;height:100%;object-fit:cover;"
          @error="$event.target.style.display='none'" />
      </div>

      <!-- 나머지 본문 단락 -->
      <div v-for="(para, i) in bodyParagraphs.slice(1)" :key="i"
        style="font-size:0.92rem;color:var(--text-secondary);line-height:1.95;margin-bottom:20px;"
        v-html="para"></div>

      <!-- 태그 + 공유 -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:20px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:36px;">
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <span style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-right:4px;">Tags:</span>
          <span v-for="tag in post.tags" :key="tag"
            style="padding:3px 12px;background:var(--bg-base);border:1px solid var(--border);border-radius:2px;font-size:0.75rem;color:var(--text-secondary);cursor:pointer;">#{{ tag }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.78rem;font-weight:600;color:var(--text-muted);">Share:</span>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#1877f2;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#1da1f2;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
          </a>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#e60023;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
          </a>
        </div>
      </div>

      <!-- 댓글 -->
      <div style="margin-bottom:40px;">
        <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid var(--blue);">
          댓글 <span style="color:var(--blue);">({{ allComments.length }})</span>
        </h3>

        <div v-for="c in allComments" :key="c.id" style="padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:0.82rem;font-weight:700;color:var(--blue);flex-shrink:0;">{{ c.author[0] }}</div>
            <div>
              <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">{{ c.author }}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">{{ c.date }}</div>
            </div>
          </div>
          <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;padding-left:46px;">{{ c.text }}</div>
        </div>

        <!-- 댓글 입력 -->
        <div style="margin-top:24px;">
          <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;">댓글 남기기</h4>
          <div style="display:flex;gap:10px;">
            <input v-model="commentText" type="text" placeholder="댓글을 입력하세요..."
              @keyup.enter="addComment"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:4px;font-size:0.85rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
            <button class="btn-blue" @click="addComment" style="padding:11px 20px;font-size:0.85rem;white-space:nowrap;border-radius:4px;">등록</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 우: 사이드바 ── -->
    <div style="position:sticky;top:80px;display:flex;flex-direction:column;gap:clamp(16px,2.5vw,32px);">

      <!-- 검색 -->
      <div>
        <div style="position:relative;">
          <input v-model="searchText" type="text" placeholder="Search..."
            style="width:100%;padding:10px 42px 10px 14px;border:1.5px solid var(--border);border-radius:4px;font-size:0.85rem;outline:none;background:var(--bg-card);color:var(--text-primary);box-sizing:border-box;" />
          <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);">🔍</span>
        </div>
      </div>

      <!-- Product Categories -->
      <div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">Product Categories</h4>
        <div style="display:flex;flex-direction:column;gap:0;">
          <div v-for="cat in categories" :key="cat.name"
            style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;"
            @mouseenter="$event.currentTarget.style.color='var(--blue)'"
            @mouseleave="$event.currentTarget.style.color=''">
            <span style="font-size:0.85rem;color:var(--text-secondary);transition:color .15s;">{{ cat.name }}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">({{ cat.count }})</span>
          </div>
        </div>
      </div>

      <!-- Latest Posts -->
      <div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">Latest Posts</h4>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div v-for="lp in latestPosts" :key="lp.id"
            style="display:flex;gap:12px;cursor:pointer;"
            @click="navigate('blogView', { editId: lp.id })">
            <div style="width:64px;height:64px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--bg-base);">
              <img :src="lp.imgSm" :alt="lp.title" style="width:100%;height:100%;object-fit:cover;"
                @error="$event.target.style.display='none'" />
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ lp.title }}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">{{ lp.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Comments -->
      <div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">Recent Comments</h4>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="c in recentComments" :key="c.id" style="display:flex;gap:10px;align-items:flex-start;">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--blue);flex-shrink:0;">{{ c.author[0] }}</div>
            <div>
              <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">{{ c.text.slice(0,40) }}{{ c.text.length>40?'…':'' }}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">{{ c.author }} · {{ c.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Archives -->
      <div>
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">Archives</h4>
        <div style="display:flex;flex-direction:column;gap:0;">
          <div v-for="a in archives" :key="a"
            style="padding:8px 0;border-bottom:1px solid var(--border);font-size:0.84rem;color:var(--text-secondary);cursor:pointer;transition:color .15s;"
            @mouseenter="$event.target.style.color='var(--blue)'"
            @mouseleave="$event.target.style.color='var(--text-secondary)'">{{ a }}</div>
        </div>
      </div>

    </div>
  </div>

  <!-- ══ 하단: You Might Also Like ══ -->
  <div v-if="relatedPosts.length" style="margin-top:64px;padding-top:40px;border-top:1px solid var(--border);">
    <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:28px;text-align:center;">You Might Also Like</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:clamp(14px,2vw,28px);">
      <div v-for="rp in relatedPosts" :key="rp.id"
        style="cursor:pointer;transition:transform .25s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-4px)'"
        @mouseleave="$event.currentTarget.style.transform=''"
        @click="navigate('blogView', { editId: rp.id })">
        <div style="aspect-ratio:4/3;overflow:hidden;border-radius:4px;margin-bottom:14px;background:var(--bg-base);">
          <img :src="rp.img" :alt="rp.title"
            style="width:100%;height:100%;object-fit:cover;transition:transform .35s;"
            @mouseenter="$event.target.style.transform='scale(1.04)'"
            @mouseleave="$event.target.style.transform=''"
            @error="$event.target.style.display='none'" />
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">{{ rp.date }}</div>
        <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);line-height:1.4;margin-bottom:6px;">{{ rp.title }}</h3>
        <div style="font-size:0.78rem;color:var(--text-muted);">By {{ rp.author }}</div>
      </div>
    </div>
  </div>

</div>
  `
};
