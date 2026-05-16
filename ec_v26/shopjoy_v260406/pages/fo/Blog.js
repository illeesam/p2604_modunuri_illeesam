/* ShopJoy - Blog (블로그 목록) */
window.Blog = {
  name: 'Blog',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    const searchParam = reactive({ searchValue: '', cat: 'all' });
    const searchParamOrg = reactive({ searchValue: '', cat: 'all' });

    const categories = [
      { id: 'all', name: '전체' },
      { id: 'fashion', name: '패션' },
      { id: 'lifestyle', name: '라이프스타일' },
      { id: 'trend', name: '트렌드' },
      { id: 'howto', name: '스타일링 팁' },
    ];

    const posts = reactive([]);

    
    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageType: 'PAGE', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* fnBuildPagerNums */
    const fnBuildPagerNums = () => { const c=pager.pageNo,l=pager.pageTotalPage,s=Math.max(1,c-2),e=Math.min(l,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };

    /* setPage */
    const setPage = n => { if (n>=1 && n<=pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };

    /* onSizeChange */
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    /* 목록조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = { ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)), pageNo: pager.pageNo, pageSize: pager.pageSize };
        const res = await foApiSvc.cmBltn.getPage(params, '블로그', '목록조회');
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || 1;
        posts.splice(0, posts.length, ...(res.data?.data?.pageList || []));
        fnBuildPagerNums();
      } catch (e) {
        console.error('[handleSearchList]', e);
        posts.splice(0, posts.length);
      }
    };

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.useAppCodeReady(uiState, fnLoadCodes);


    /* 목록조회 */
    const onSearch = async () => { await Object.assign(pager.pageCond, searchParam); handleSearchList('DEFAULT'); };

    /* onReset */
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };


    const thumbBgs = [
      'linear-gradient(135deg, #f5f0e8 0%, #e8d5b7 100%)',
      'linear-gradient(135deg, #e8edf5 0%, #c7d2e0 100%)',
      'linear-gradient(135deg, #f0e8f5 0%, #d5c2e0 100%)',
      'linear-gradient(135deg, #e8f5f0 0%, #b7e0d5 100%)',
      'linear-gradient(135deg, #f5e8ea 0%, #e0c2c7 100%)',
      'linear-gradient(135deg, #f5f2e8 0%, #e0d5b7 100%)',
    ];

    /* postBg */
    const postBg = (id) => thumbBgs[(id - 1) % thumbBgs.length];

    const cfLatestPosts = computed(() => [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4));

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList();
    });

    // -- return ---------------------------------------------------------------

    return { pager, setPage, onSizeChange, searchParam, categories, posts, cfLatestPosts, postBg, onSearch, onReset, uiState, codes };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- -- 페이지 타이틀 배너 ----------------------------------------------------- -->
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

  <!-- -- 검색 ------------------------------------------------------------- -->
  <div style="display:flex;justify-content:center;margin-bottom:32px;gap:8px;">
    <div style="position:relative;width:100%;max-width:480px;">
      <input v-model="searchParam.searchValue" type="text" placeholder="검색어를 입력하세요..."
        style="width:100%;padding:12px 44px 12px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:0.88rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
      <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:1rem;">🔍</span>
    </div>
    <button @click="onSearch"
      style="padding:12px 24px;background:var(--blue);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.88rem;white-space:nowrap;">
      검색
    </button>
    <button @click="onReset"
      style="padding:12px 24px;background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-weight:600;font-size:0.88rem;white-space:nowrap;">
      초기화
    </button>
  </div>

  <!-- -- 레이아웃: 사이드바 + 본문 ------------------------------------------------ -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(16px,3vw,32px);" class="blog-grid">

    <!-- -- 사이드바 --------------------------------------------------------- -->
    <aside>
      <!-- -- 카테고리 ------------------------------------------------------- -->
      <div style="margin-bottom:28px;">
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">Prod Categories</h3>
        <ul style="list-style:none;padding:0;margin:0;">
          <li v-for="cat in categories" :key="cat.id"
            @click="searchParam.cat=cat.id;onSearch()"
            :style="{
              padding:'8px 0', cursor:'pointer', fontSize:'0.84rem',
              color: searchParam.cat===cat.id ? 'var(--blue)' : 'var(--text-secondary)',
              fontWeight: searchParam.cat===cat.id ? '700' : '400',
              borderLeft: searchParam.cat===cat.id ? '2px solid var(--blue)' : '2px solid transparent',
              paddingLeft: '12px', transition:'all .15s',
            }">{{ cat.name }}</li>
        </ul>
      </div>

      <!-- -- 최신 글 ------------------------------------------------------- -->
      <div>
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">Latest Posts</h3>
        <div v-for="p in cfLatestPosts" :key="p.id" @click="navigate('blogView', { dtlId: p.id })"
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

    <!-- -- 포스트 목록 ------------------------------------------------------- -->
    <div>
      <div v-for="post in posts" :key="post.id"
        class="card" style="display:flex;flex-wrap:wrap;gap:clamp(12px,2vw,24px);padding:0;margin-bottom:clamp(12px,2vw,24px);overflow:hidden;cursor:pointer;transition:box-shadow .2s;"
        @click="navigate('blogView', { dtlId: post.id })"
        @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
        @mouseleave="$event.currentTarget.style.boxShadow=''">

        <!-- -- 썸네일 ------------------------------------------------------ -->
        <div style="width:clamp(200px,30%,280px);min-height:180px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
          <img v-if="post.thumb" :src="post.thumb" :alt="post.title" style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'" @mouseleave="$event.target.style.transform=''" />
        </div>

        <!-- -- 내용 ------------------------------------------------------- -->
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

      <!-- -- 빈 상태 ------------------------------------------------------- -->
      <div v-if="posts.length === 0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:12px;">📝</div>
        <div style="font-size:0.95rem;">검색 결과가 없습니다.</div>
      </div>
    </div>
  </div>

</div>
  `
};
