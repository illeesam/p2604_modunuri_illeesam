/* ShopJoy - BlogView (블로그 상세) */
window.BlogView = {
  name: 'BlogView',
  props: ['navigate', 'config', 'editId'],
  setup(props) {
    const { ref, computed } = Vue;

    const posts = [
      { id: 1, title: 'Anteposuerit litterarum formas.', category: 'fashion', author: '김민지', date: '2026.04.10', readTime: '5분',
        tags: ['패션', '신상품', '코튼100%'], viewCount: 1240,
        body: `Elga Ksenia shall Tirza use these kitchen utensils designed for <strong>Élinka</strong>, a new design—oriented brand for consumers introduced at the Ambiente show in February 2016. Lightweight anodized aluminum, bright colors, stainless steel and matte plastic shapes.

And round tips on the cutting feature of these products designed for the kitchen. Functional materials are used everyday: chopping boards, utensils and colanders.

<strong>Elga</strong> is a two-color melamine salad bowl where vegetables can be washed, drained and served. The disk at the bottom of the bowl can be turned counterclockwise to drain water when washing vegetables and it can be turned clockwise to lock the drain and hold condiments in the bowl when serving.`,
        comments: [
          { id: 1, author: '이수진', date: '2026.04.11', text: '정말 유용한 정보네요! 다음 시즌 스타일링에 참고하겠습니다.' },
          { id: 2, author: '박지현', date: '2026.04.11', text: '사진도 예쁘고 설명도 자세해서 좋아요.' },
          { id: 3, author: '정다운', date: '2026.04.12', text: '이런 글 더 많이 올려주세요!' },
        ]
      },
      { id: 2, title: '2026 봄 트렌드 컬러 가이드', category: 'trend', author: '이수진', date: '2026.04.08', readTime: '7분',
        tags: ['트렌드', '컬러', '2026SS'], viewCount: 890,
        body: `올 봄 주목해야 할 트렌드 컬러는 <strong>파스텔 라벤더</strong>, <strong>소프트 민트</strong>, <strong>코랄 핑크</strong>입니다.\n\n파스텔 컬러는 부드러운 분위기를 연출하면서도 세련된 느낌을 줍니다. 특히 라벤더 컬러는 올해의 트렌드 컬러로 선정되어 많은 브랜드에서 활용하고 있습니다.\n\n코디 시 파스텔 톤은 화이트나 베이지와 매칭하면 깔끔하고, 블랙이나 네이비와 매칭하면 모던한 느낌을 줄 수 있습니다.`,
        comments: [
          { id: 1, author: '강하늘', date: '2026.04.09', text: '라벤더 컬러 너무 예뻐요!' },
        ]
      },
    ];

    const postId = computed(() => Number(props.editId) || 1);
    const post = computed(() => posts.find(p => p.id === postId.value) || posts[0]);

    const thumbBgs = [
      'linear-gradient(135deg, #f5f0e8 0%, #e8d5b7 100%)',
      'linear-gradient(135deg, #e8edf5 0%, #c7d2e0 100%)',
    ];
    const heroBg = computed(() => thumbBgs[(postId.value - 1) % thumbBgs.length]);

    /* 댓글 입력 */
    const commentText = ref('');
    const localComments = ref([]);
    const allComments = computed(() => [...(post.value.comments || []), ...localComments.value]);
    const addComment = () => {
      const t = commentText.value.trim();
      if (!t) return;
      localComments.value.push({ id: Date.now(), author: '홍길동', date: new Date().toISOString().slice(0,10).replace(/-/g,'.'), text: t });
      commentText.value = '';
    };

    /* 관련 글 */
    const relatedPosts = computed(() => posts.filter(p => p.id !== postId.value).slice(0, 3));

    return { post, heroBg, commentText, allComments, addComment, relatedPosts };
  },
  template: /* html */ `
<div>

  <!-- 히어로 이미지 -->
  <div style="height:360px;overflow:hidden;background:var(--bg-base);">
    <img :src="'assets/cdn/prod/img/blog/blog-big-' + (post.id <= 7 ? post.id : 2) + '.jpg'" :alt="post.title"
      style="width:100%;height:100%;object-fit:cover;"
      @error="$event.target.style.display='none'" />
  </div>

  <!-- 본문 -->
  <div class="page-wrap" style="max-width:760px;">

    <!-- 뒤로 -->
    <button @click="navigate('blog')"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:24px;padding:0;">
      ← 블로그 목록으로
    </button>

    <!-- 메타 -->
    <div style="margin-bottom:8px;font-size:0.78rem;color:var(--text-muted);">
      By <strong style="color:var(--text-secondary);">{{ post.author }}</strong> · {{ post.date }} · {{ post.readTime }} 읽기
    </div>

    <!-- 제목 -->
    <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);line-height:1.35;margin-bottom:24px;">{{ post.title }}</h1>

    <!-- 본문 -->
    <div style="font-size:0.92rem;color:var(--text-secondary);line-height:1.9;margin-bottom:36px;white-space:pre-line;" v-html="post.body"></div>

    <!-- 태그 -->
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--border);">
      <span v-for="tag in post.tags" :key="tag"
        style="padding:4px 14px;background:var(--bg-base);border:1px solid var(--border);border-radius:20px;font-size:0.78rem;color:var(--text-secondary);">#{{ tag }}</span>
    </div>

    <!-- 댓글 -->
    <div style="margin-bottom:36px;">
      <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:18px;">댓글 ({{ allComments.length }})</h3>

      <div v-for="c in allComments" :key="c.id"
        style="padding:16px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:var(--blue);">{{ c.author[0] }}</div>
          <span style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">{{ c.author }}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">{{ c.date }}</span>
        </div>
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;padding-left:36px;">{{ c.text }}</div>
      </div>

      <!-- 댓글 입력 -->
      <div style="display:flex;gap:10px;margin-top:18px;">
        <input v-model="commentText" type="text" placeholder="댓글을 입력하세요..."
          @keyup.enter="addComment"
          style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:0.85rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
        <button class="btn-blue" @click="addComment" style="padding:10px 20px;font-size:0.85rem;white-space:nowrap;">등록</button>
      </div>
    </div>

    <!-- 관련 글 -->
    <div v-if="relatedPosts.length">
      <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">관련 글</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:16px;">
        <div v-for="rp in relatedPosts" :key="rp.id" class="card" style="padding:16px;cursor:pointer;"
          @click="navigate('blogView', { editId: rp.id })">
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;line-height:1.3;">{{ rp.title }}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">{{ rp.date }}</div>
        </div>
      </div>
    </div>

  </div>
</div>
  `
};
