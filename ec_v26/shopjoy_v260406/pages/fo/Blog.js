/* ShopJoy - Blog (블로그 목록) */
window.Blog = {
  name: 'Blog',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});


    const searchParam = reactive({ searchValue: '', cat: 'all' });
    const searchParamOrg = reactive({ searchValue: '', cat: 'all' });

    const categories = foConsts.BLOG_CATEGORIES;

    const posts = reactive([]);

    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageType: 'PAGE', pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Blog.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 카테고리 선택 (param: 카테고리 ID)
      } else if (cmd === 'category-select') {
        searchParam.cat = param;
        return onSearch();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Blog.js : handleSelectAction -> ', cmd, param);
      // 블로그 포스트 클릭 (param: postId)
      if (cmd === 'blogs-rowView') {
        return props.navigate('blogView', { dtlId: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };




    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */



    /* _blogThumb — 첨부 목록(files[])에서 대표 썸네일 1장 추출 (cm_blog_file: thumbUrl/imgUrl).
     *   서버 경로 '/cdn/...' → 'assets/cdn/...' 는 coUtil.cofImgSrc 로 보정. */
    const _blogThumb = (b) => {
      const f = Array.isArray(b.files) && b.files.length ? b.files[0] : null;
      const raw = (f && (f.thumbUrl || f.imgUrl)) || b.thumbUrl || b.imgUrl || '';
      return raw ? coUtil.cofImgSrc(raw) : '';
    };

    /* _adaptBlog — CmBlogDto.Item → 화면 카드 기대 형태 (이벤트 어댑터와 동일 취지) */
    const _adaptBlog = (b) => ({
      id:       b.blogId,
      title:    b.blogTitle || '',
      excerpt:  b.blogSummary || coUtil.cofStripHtml(b.blogContent, 120),
      author:   b.blogAuthor || '',
      date:     coUtil.cofYmd(b.regDate),
      category: b.blogCateId || '',
      thumb:    _blogThumb(b),
      readTime: coUtil.cofReadTime(b.blogContent),
      viewCount: b.viewCount || 0,
    });

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      try {
        const params = { ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v)), pageNo: pager.pageNo, pageSize: pager.pageSize };
        const res = await foApiSvc.cmBltn.getPage(params, '블로그', '목록조회');
        const d = res.data?.data || {};
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
        posts.splice(0, posts.length, ...(d.pageList || []).map(_adaptBlog));
        coUtil.cofBuildPagerNums(pager);
      } catch (e) {
        console.error('[handleSearchList]', e);
        posts.splice(0, posts.length);
      }
    };

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    /* onSearch — 조회 */
    const onSearch = async () => { Object.assign(pager.pageCond, searchParam); await handleSearchList('DEFAULT'); };

    /* onReset — 초기화 */
    const onReset = () => {
      Object.assign(searchParam, searchParamOrg);
      onSearch();
    };





    const cfLatestPosts = computed(() => [...posts].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 4));

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchList();
    });

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) #################### */

    /* FoSearchArea :columns 자동 렌더 정의 — 단일 검색어 입력 */
    // --- [컬럼 정의] ---
    const columns = {};
    columns.baseSearch = [
      { key: 'searchValue', type: 'text', label: '검색', placeholder: '검색어를 입력하세요...' },
    ];

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      handleBtnAction, handleSelectAction, // dispatch
      searchParam, // 검색
      categories, posts, // 데이터
      cfLatestPosts, // computed
      onSearch, onReset,        // 헬퍼/이벤트
    };
  },
  template: /* html */ `
<fo-page title="News &amp; Blog" eyebrow="ShopJoy"
  banner-img="assets/cdn/prod/img/page-title/page-title-2.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'Blog' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 검색 ====================================================== -->
  <div style="display:flex;justify-content:center;margin-bottom:32px;">
    <!-- ===== ■.■. 검색 영역 ================================================= -->
    <fo-search-area bar-style="max-width:640px;width:100%;justify-content:center;"
      :columns="columns.baseSearch" :param="searchParam"
      @search="onSearch" @reset="onReset" />
  </div>
  <!-- ===== □.□. 검색 영역 ================================================= -->
  <!-- ===== □. 검색 ====================================================== -->
  <!-- ===== ■. 레이아웃: 사이드바 + 본문 ========================================= -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(16px,3vw,32px);" class="blog-grid">
    <!-- ===== ■.■. 사이드바 ================================================== -->
    <aside>
      <!-- ===== ■.■.■. 카테고리 ================================================ -->
      <div style="margin-bottom:28px;">
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">
          Prod Categories
        </h3>
        <ul style="list-style:none;padding:0;margin:0;">
          <li v-for="cat in categories" :key="cat.codeValue"
            @click="handleBtnAction('category-select', cat.codeValue)"
            :style="{
            padding:'8px 0', cursor:'pointer', fontSize:'0.84rem',
            color: searchParam.cat===cat.codeValue ? 'var(--blue)' : 'var(--text-secondary)',
            fontWeight: searchParam.cat===cat.codeValue ? '700' : '400',
            borderLeft: searchParam.cat===cat.codeValue ? '2px solid var(--blue)' : '2px solid transparent',
            paddingLeft: '12px', transition:'all .15s',
            }">
            {{ cat.codeLabel }}
          </li>
        </ul>
      </div>
      <!-- ===== ■.■.■. 최신 글 ================================================ -->
      <div>
        <h3 style="font-size:0.88rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:1.5px solid var(--border);">
          Latest Posts
        </h3>
        <div v-for="p in cfLatestPosts" :key="p.id" @click="handleSelectAction('blogs-rowView', p.id)"
          style="display:flex;gap:10px;margin-bottom:14px;cursor:pointer;padding:6px 0;"
          @mouseenter="$event.currentTarget.style.opacity='0.7'"
          @mouseleave="$event.currentTarget.style.opacity='1'">
          <div style="width:50px;height:50px;border-radius:6px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
            <img v-if="p.thumb" :src="p.thumb" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="min-width:0;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--text-primary);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              {{ p.title }}
            </div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">
              {{ p.date }}
            </div>
          </div>
        </div>
      </div>
    </aside>
    <!-- ===== □.□. 사이드바 ================================================== -->
    <!-- ===== ■.■. 포스트 목록 ================================================ -->
    <div>
      <div v-for="post in posts" :key="post.id"
        class="card" style="display:flex;flex-wrap:wrap;gap:clamp(12px,2vw,24px);padding:0;margin-bottom:clamp(12px,2vw,24px);overflow:hidden;cursor:pointer;transition:box-shadow .2s;"
        @click="handleSelectAction('blogs-rowView', post.id)"
        @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
        @mouseleave="$event.currentTarget.style.boxShadow=''">
        <!-- ===== ■.■.■.■. 썸네일 =============================================== -->
        <div style="width:clamp(200px,30%,280px);min-height:180px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
          <img v-if="post.thumb" :src="post.thumb" :alt="post.title" style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
            @mouseenter="$event.target.style.transform='scale(1.05)'" @mouseleave="$event.target.style.transform=''" />
        </div>
        <!-- ===== ■.■.■.■. 내용 ================================================ -->
        <div style="flex:1;min-width:200px;padding:clamp(14px,2vw,24px) clamp(14px,2vw,24px) clamp(14px,2vw,24px) 0;display:flex;flex-direction:column;justify-content:center;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:0.72rem;color:var(--blue);font-weight:600;">
              {{ categories.find(c => c.codeValue === post.category)?.codeLabel || post.category }}
            </span>
          </div>
          <h2 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;line-height:1.4;">
            {{ post.title }}
          </h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            {{ post.excerpt }}
          </p>
          <div style="display:flex;align-items:center;gap:12px;font-size:0.75rem;color:var(--text-muted);">
            <span>
              By {{ post.author }}
            </span>
            <span>
              ·
            </span>
            <span>
              {{ post.date }}
            </span>
            <span>
              ·
            </span>
            <span>
              {{ post.readTime }} 읽기
            </span>
          </div>
        </div>
      </div>
      <!-- ===== ■.■.■. 빈 상태 ================================================ -->
      <div v-if="posts.length === 0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:12px;">
          📝
        </div>
        <div style="font-size:0.95rem;">
          검색 결과가 없습니다.
        </div>
      </div>
    </div>
  </div>
</fo-page>
<!-- ===== □.□. 포스트 목록 ================================================ -->
<!-- ===== □. 레이아웃: 사이드바 + 본문 ========================================= -->
`
};
