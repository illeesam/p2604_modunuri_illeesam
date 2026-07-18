/* ShopJoy - BlogView (블로그 상세) */
window.BlogView = {
  name: 'BlogView',
  props: {
    navigate: { type: Function, required: true },        // 페이지 이동
    dtlId:    { type: String,   default: null },          // 대상 ID
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, watch } = Vue;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });

    const posts = reactive([]);                   // 현재 상세글(1건)
    const categories = reactive([]);              // 우측 카테고리 (실 cm_blog_cate + count)
    const latestPosts = reactive([]);             // 우측 최신 글 (현재글 제외)
    const relatedPosts = reactive([]);            // 하단 관련 글 (같은 카테고리)
    /* 카테고리 인라인 펼침: 클릭한 카테고리의 글 목록을 사이드바에서 펼쳐 표시 */
    const catExpand = reactive({ openId: null, loading: false, posts: [] });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ BlogView.js : handleBtnAction -> ', cmd, param);
      // 블로그 목록으로 이동
      if (cmd === 'page-goBlogList') {
        return props.navigate('blog');
      // 카테고리 클릭 → 인라인 펼침(토글). 해당 카테고리 글 목록 API 조회
      } else if (cmd === 'category-select') {
        return toggleCatExpand(param);
      // 펼친 카테고리 전체보기 → 목록 화면으로 (dtlId 채널로 blogCateId 전달)
      } else if (cmd === 'category-viewAll') {
        return props.navigate('blog', { dtlId: param || '' });
      // 댓글 등록
      } else if (cmd === 'comments-add') {
        return handleAddComment();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ BlogView.js : handleSelectAction -> ', cmd, param);
      // 최신글/관련글 클릭 (param: postId)
      if (cmd === 'blogs-rowView') {
        return props.navigate('blogView', { dtlId: param });
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* _adaptCard — CmBlogDto.Item → 사이드/관련 카드 형태 (썸네일/날짜 정규화) */
    const _adaptCard = (b) => {
      const f = Array.isArray(b.files) && b.files.length ? b.files[0] : null;
      const thumb = (f && (f.thumbUrl || f.imgUrl)) || '';
      return {
        id:     b.blogId,
        title:  b.blogTitle || '',
        author: b.blogAuthor || '',
        date:   (b.regDate || '').toString().slice(0, 10).replace(/-/g, '.'),
        imgSm:  thumb ? coUtil.cofImgSrc(thumb) : '',
        img:    thumb ? coUtil.cofImgSrc(thumb) : '',
      };
    };

    /* handleSearchData — 상세 조회 + (이어서) 관련글 로드 */
    const handleSearchData = async () => {
      try {
        const res = await foApiSvc.cmBltn.getById(props.dtlId, '블로그상세', '상세조회');
        const raw = res.data?.data || null;
        posts.splice(0, posts.length, ...(raw ? [raw] : []));
        if (raw) { loadRelated(raw.blogCateId); }   // 상세의 카테고리로 관련글 로드
      } catch (e) {
        console.error('[handleSearchData]', e);
        posts.splice(0, posts.length);
      }
    };

    /* loadCategories — 우측 카테고리 (실 cm_blog_cate + count) */
    const loadCategories = async () => {
      try {
        const res = await foApiSvc.cmBltn.getCate({}, '블로그상세', '카테고리조회');
        categories.splice(0, categories.length, ...(res.data?.data || []));
      } catch (e) { console.error('[loadCategories]', e); }
    };

    /* loadLatest — 우측 최신 글 5건(현재글 제외 후 4건) */
    const loadLatest = async () => {
      try {
        const res = await foApiSvc.cmBltn.getPage({ pageNo: 1, pageSize: 5 }, '블로그상세', '최신글조회');
        const list = (res.data?.data?.pageList || []).map(_adaptCard).filter(c => c.id !== props.dtlId).slice(0, 4);
        latestPosts.splice(0, latestPosts.length, ...list);
      } catch (e) { console.error('[loadLatest]', e); }
    };

    /* loadRelated — 같은 카테고리 관련 글 (현재글 제외 후 3건) */
    const loadRelated = async (blogCateId) => {
      try {
        const params = { pageNo: 1, pageSize: 6 };
        if (blogCateId) { params.blogCateId = blogCateId; }
        const res = await foApiSvc.cmBltn.getPage(params, '블로그상세', '관련글조회');
        const list = (res.data?.data?.pageList || []).map(_adaptCard).filter(c => c.id !== props.dtlId).slice(0, 3);
        relatedPosts.splice(0, relatedPosts.length, ...list);
      } catch (e) { console.error('[loadRelated]', e); }
    };

    /* toggleCatExpand — 카테고리 클릭 시 인라인 펼침 토글 + 해당 카테고리 글 목록 API 조회 */
    const toggleCatExpand = async (blogCateId) => {
      // 같은 카테고리 다시 클릭 → 접기
      if (catExpand.openId === blogCateId) {
        catExpand.openId = null;
        catExpand.posts.splice(0, catExpand.posts.length);
        return;
      }
      catExpand.openId = blogCateId;
      catExpand.loading = true;
      catExpand.posts.splice(0, catExpand.posts.length);
      try {
        const res = await foApiSvc.cmBltn.getPage(
          { pageNo: 1, pageSize: 10, blogCateId }, '블로그상세', '카테고리글조회');
        const list = (res.data?.data?.pageList || []).map(_adaptCard);
        catExpand.posts.splice(0, catExpand.posts.length, ...list);
      } catch (e) {
        console.error('[toggleCatExpand]', e);
      } finally {
        catExpand.loading = false;
      }
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, () => { uiState.isPageCodeLoad = true; });

    /* 백엔드 CmBlogDto.Item → 화면 표준 형태로 정규화 (replies/tags/files 연관정보 포함) */
    const cfPost   = computed(() => {
      const raw = posts.length > 0 ? posts[0] : null;
      if (!raw) { return { id: '', title: '', category: '', author: '', date: '', readTime: '', tags: [], files: [], viewCount: 0, img: '', imgMid: '', body: '', comments: [] }; }
      const files = raw.files || [];
      return {
        id:        raw.blogId,
        title:     raw.blogTitle || '',
        category:  raw.blogCateId || '',
        author:    raw.blogAuthor || '',
        date:      (raw.regDate || '').toString().slice(0, 10).replace(/-/g, '.'),
        readTime:  '',
        viewCount: raw.viewCount || 0,
        body:      String(raw.blogContent || raw.blogSummary || '').replace(/(src|href)=(['"])\/cdn\//g, '$1=$2assets/cdn/'),
        img:       files[0]?.imgUrl ? coUtil.cofImgSrc(files[0].imgUrl) : '',
        imgMid:    files[1]?.imgUrl ? coUtil.cofImgSrc(files[1].imgUrl) : '',
        files:     files,
        tags:      (raw.tags || []).map(t => t.tagNm).filter(Boolean),
        comments:  (raw.replies || []).map(r => ({
                     id:     r.commentId,
                     author: r.writerNm || r.writerId || '익명',
                     date:   (r.regDate || '').toString().slice(0, 10).replace(/-/g, '.'),
                     text:   r.blogCommentContent || '',
                   })),
      };
    });

    /* 본문 단락 분리 */
    const cfBodyParagraphs = computed(() => (cfPost.value.body || '').split('\n\n').filter(Boolean));

    /* 댓글 */
    const commentText   = ref('');
    const localComments = reactive([]);
    const cfAllComments   = computed(() => [...(cfPost.value.comments || []), ...localComments]);

    /* addComment — 추가 */
    const handleAddComment = () => {
      const t = commentText.value.trim();
      if (!t) { return; }
      localComments.push({ id: Date.now(), author: '홍길동', date: new Date().toISOString().slice(0,10).replace(/-/g,'.'), text: t });
      commentText.value = '';
    };

    /* 사이드바 검색 입력 */
    const searchParam = reactive({ searchValue: ''});

    /* 우측 Recent Comments — 현재 글 댓글 최근 3건 (cfPost.comments 기준) */
    const cfRecentComments = computed(() => (cfPost.value.comments || []).slice(-3).reverse());

    // ★ onMounted — 상세 + 카테고리 + 최신글 병렬 로드 (관련글은 상세 후 카테고리로 로드)
    onMounted(() => {
      if (isAppReady.value) { uiState.isPageCodeLoad = true; }
      handleSearchData();
      loadCategories();
      loadLatest();
    });

    /* dtlId 변경(다른 글 클릭) 시 재로드 — :dtl-id 로 재마운트 안 되는 경우 대비 */
    watch(() => props.dtlId, () => {
      handleSearchData();
      loadLatest();
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      handleBtnAction, handleSelectAction, // dispatch
      cfPost, cfBodyParagraphs, cfAllComments, // computed - 본문
      latestPosts, relatedPosts, cfRecentComments, // 사이드/관련 (실데이터)
      catExpand,              // 카테고리 인라인 펼침 상태
      commentText,            // 댓글
      searchParam, categories,                   // 검색/카테고리(실데이터)
    };
  },
  template: /* html */ `
<fo-page>
  <!-- ===== ■. ══ 2컬럼 레이아웃 ══ ========================================== -->
  <div style="display:grid;grid-template-columns:minmax(0,7fr) minmax(0,3fr);gap:clamp(20px,4vw,48px);align-items:start;" class="blog-view-grid">
    <!-- ===== ■.■. 좌: 본문 영역 ============================================== -->
    <div>
      <!-- ===== ■.■.■. 뒤로 ================================================== -->
      <button @click="handleBtnAction('page-goBlogList')"
        style="display:flex;align-items:center;gap:4px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;margin-bottom:20px;padding:0;">
        ← 블로그 목록으로
      </button>
      <!-- ===== ■.■.■. 카테고리 + 메타 =========================================== -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:0.75rem;">
        <span style="background:var(--blue);color:#fff;padding:2px 10px;border-radius:2px;font-weight:600;">
          {{ cfPost.category }}
        </span>
        <span style="color:var(--text-muted);">
          By
          <strong style="color:var(--text-secondary);">
            {{ cfPost.author }}
          </strong>
        </span>
        <span style="color:var(--text-muted);">
          ·
        </span>
        <span style="color:var(--text-muted);">
          {{ cfPost.date }}
        </span>
        <span style="color:var(--text-muted);">
          ·
        </span>
        <span style="color:var(--text-muted);">
          {{ cfPost.readTime }} 읽기
        </span>
      </div>
      <!-- ===== ■.■.■. 제목 ================================================== -->
      <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);line-height:1.35;margin-bottom:24px;">
        {{ cfPost.title }}
      </h1>
      <!-- ===== ■.■.■. 히어로 이미지 ============================================= -->
      <div v-if="cfPost.img" style="width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:4px;margin-bottom:28px;background:var(--bg-base);">
        <img :src="cfPost.img" :alt="cfPost.title" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <!-- ===== ■.■.■. 본문 첫 단락 ============================================= -->
      <div v-if="cfBodyParagraphs[0]"
        style="font-size:0.92rem;color:var(--text-secondary);line-height:1.95;margin-bottom:24px;"
        v-html="cfBodyParagraphs[0]">
      </div>
      <!-- ===== ■.■.■. 중간 이미지 ============================================== -->
      <div v-if="cfPost.imgMid" style="width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:4px;margin-bottom:24px;background:var(--bg-base);">
        <img :src="cfPost.imgMid" :alt="cfPost.title" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <!-- ===== ■.■.■. 나머지 본문 단락 =========================================== -->
      <div v-for="(para, i) in cfBodyParagraphs.slice(1)" :key="i"
        style="font-size:0.92rem;color:var(--text-secondary);line-height:1.95;margin-bottom:20px;"
        v-html="para">
      </div>
      <!-- ===== ■.■.■. 태그 + 공유 ============================================= -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:20px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:36px;">
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <span style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-right:4px;">
            Tags:
          </span>
          <span v-for="tag in cfPost.tags" :key="tag"
            style="padding:3px 12px;background:var(--bg-base);border:1px solid var(--border);border-radius:2px;font-size:0.75rem;color:var(--text-secondary);cursor:pointer;">
            #{{ tag }}
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.78rem;font-weight:600;color:var(--text-muted);">
            Share:
          </span>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#1877f2;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z">
              </path>
            </svg>
          </a>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#1da1f2;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z">
              </path>
            </svg>
          </a>
          <a href="#" style="width:30px;height:30px;border-radius:50%;background:#e60023;display:flex;align-items:center;justify-content:center;text-decoration:none;"
            @click.prevent>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </a>
        </div>
      </div>
      <!-- ===== ■.■.■. 첨부 파일 =============================================== -->
      <div v-if="cfPost.files?.length" style="margin-bottom:36px;">
      <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;">
        첨부 ({{ cfPost.files.length }})
      </h3>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        <a v-for="f in cfPost.files" :key="f.blogImgId" :href="f.imgUrl" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);border-radius:4px;font-size:0.8rem;color:var(--text-secondary);text-decoration:none;background:var(--bg-card);">
          <span>
            📎
          </span>
          <span>
            {{ f.imgAltText || f.imgUrl }}
          </span>
        </a>
      </div>
    </div>
    <!-- ===== ■.■.■. 댓글 ================================================== -->
    <div style="margin-bottom:40px;">
      <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid var(--blue);">
        댓글
        <span style="color:var(--blue);">
          ({{ cfAllComments.length }})
        </span>
      </h3>
      <div v-for="c in cfAllComments" :key="c.id" style="padding:16px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:0.82rem;font-weight:700;color:var(--blue);flex-shrink:0;">
            {{ c.author[0] }}
          </div>
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">
              {{ c.author }}
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);">
              {{ c.date }}
            </div>
          </div>
        </div>
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;padding-left:46px;">
          {{ c.text }}
        </div>
      </div>
      <!-- ===== ■.■.■.■. 댓글 입력 ============================================= -->
      <div style="margin-top:24px;">
        <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;">
          댓글 남기기
        </h4>
        <div style="display:flex;gap:10px;">
          <input v-model="commentText" type="text" placeholder="댓글을 입력하세요..."
              @keyup.enter="handleBtnAction('comments-add')"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:4px;font-size:0.85rem;outline:none;background:var(--bg-card);color:var(--text-primary);" />
          <button class="btn-blue" @click="handleBtnAction('comments-add')" style="padding:11px 20px;font-size:0.85rem;white-space:nowrap;border-radius:4px;">
            등록
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □.□. 좌: 본문 영역 ============================================== -->
  <!-- ===== ■.■. 우: 사이드바 =============================================== -->
  <div style="position:sticky;top:80px;display:flex;flex-direction:column;gap:clamp(16px,2.5vw,32px);">
    <!-- ===== ■.■.■. 검색 (Enter → 목록 화면으로 이동) ============================ -->
    <div>
      <div style="position:relative;">
        <input v-model="searchParam.searchValue" type="text" placeholder="블로그 검색..."
            @keyup.enter="handleBtnAction('page-goBlogList')"
            style="width:100%;padding:10px 42px 10px 14px;border:1.5px solid var(--border);border-radius:4px;font-size:0.85rem;outline:none;background:var(--bg-card);color:var(--text-primary);box-sizing:border-box;" />
        <span @click="handleBtnAction('page-goBlogList')"
            style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);cursor:pointer;">
          🔍
        </span>
      </div>
    </div>
    <!-- ===== ■.■.■. 카테고리 (실 cm_blog_cate + count, 클릭 → 목록 필터) ============ -->
    <div>
      <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">
        카테고리
      </h4>
      <div style="display:flex;flex-direction:column;gap:0;">
        <template v-for="cat in categories" :key="cat.blogCateId">
          <!-- 카테고리 행 (클릭 → 펼침 토글) -->
          <div @click="handleBtnAction('category-select', cat.blogCateId)"
              :style="{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', color: catExpand.openId===cat.blogCateId ? 'var(--blue)' : '' }"
              @mouseenter="$event.currentTarget.style.color='var(--blue)'"
              @mouseleave="$event.currentTarget.style.color = (catExpand.openId===cat.blogCateId ? 'var(--blue)' : '')">
            <span style="font-size:0.85rem;display:inline-flex;align-items:center;gap:6px;">
              <span style="font-size:0.7rem;transition:transform .15s;" :style="{ transform: catExpand.openId===cat.blogCateId ? 'rotate(90deg)' : 'rotate(0)' }">▶</span>
              {{ cat.blogCateNm }}
            </span>
            <span style="font-size:0.75rem;color:var(--text-muted);">
              ({{ cat.blogCnt || 0 }})
            </span>
          </div>
          <!-- 펼침 패널: 해당 카테고리 글 목록 (API 조회 결과) -->
          <div v-if="catExpand.openId===cat.blogCateId"
              style="padding:6px 0 10px 16px;border-bottom:1px solid var(--border);background:var(--bg-base);">
            <div v-if="catExpand.loading" style="font-size:0.78rem;color:var(--text-muted);padding:6px 0;">
              불러오는 중…
            </div>
            <template v-else>
              <div v-for="cp in catExpand.posts" :key="cp.id"
                  @click.stop="handleSelectAction('blogs-rowView', cp.id)"
                  style="display:flex;gap:8px;align-items:center;padding:6px 0;cursor:pointer;"
                  @mouseenter="$event.currentTarget.style.opacity='0.7'"
                  @mouseleave="$event.currentTarget.style.opacity='1'">
                <div style="width:34px;height:34px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--bg-card);">
                  <img v-if="cp.imgSm" :src="cp.imgSm" :alt="cp.title" style="width:100%;height:100%;object-fit:cover;" />
                </div>
                <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                  {{ cp.title }}
                </div>
              </div>
              <div v-if="catExpand.posts.length===0" style="font-size:0.78rem;color:var(--text-muted);padding:6px 0;">
                글이 없습니다.
              </div>
              <div v-if="catExpand.posts.length>0" @click.stop="handleBtnAction('category-viewAll', cat.blogCateId)"
                  style="font-size:0.75rem;color:var(--blue);cursor:pointer;padding:8px 0 2px;font-weight:600;">
                전체보기 →
              </div>
            </template>
          </div>
        </template>
        <div v-if="categories.length === 0" style="font-size:0.82rem;color:var(--text-muted);padding:9px 0;">
          카테고리가 없습니다.
        </div>
      </div>
    </div>
    <!-- ===== ■.■.■. Latest Posts ======================================== -->
    <div>
      <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">
        Latest Posts
      </h4>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div v-for="lp in latestPosts" :key="lp.id"
            style="display:flex;gap:12px;cursor:pointer;"
            @click="handleSelectAction('blogs-rowView', lp.id)">
          <div style="width:64px;height:64px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--bg-base);">
            <img v-if="lp.imgSm" :src="lp.imgSm" :alt="lp.title" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              {{ lp.title }}
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);">
              {{ lp.date }}
            </div>
          </div>
        </div>
        <div v-if="latestPosts.length === 0" style="font-size:0.82rem;color:var(--text-muted);">
          최신 글이 없습니다.
        </div>
      </div>
    </div>
    <!-- ===== ■.■.■. Recent Comments ===================================== -->
    <div>
      <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid var(--blue);">
        Recent Comments
      </h4>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div v-for="c in cfRecentComments" :key="c.id" style="display:flex;gap:10px;align-items:flex-start;">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--blue);flex-shrink:0;">
            {{ c.author[0] }}
          </div>
          <div>
            <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">
              {{ c.text.slice(0,40) }}{{ c.text.length>40?'…':'' }}
            </div>
            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">
              {{ c.author }} · {{ c.date }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- ===== □.□. 우: 사이드바 =============================================== -->
<!-- ===== □. ══ 2컬럼 레이아웃 ══ ========================================== -->
<!-- ===== ■. ══ 하단: You Might Also Like ══ =========================== -->
<div v-if="relatedPosts.length" style="margin-top:64px;padding-top:40px;border-top:1px solid var(--border);">
  <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:28px;text-align:center;">
    You Might Also Like
  </h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:clamp(14px,2vw,28px);">
    <div v-for="rp in relatedPosts" :key="rp.id"
        style="cursor:pointer;transition:transform .25s;"
        @mouseenter="$event.currentTarget.style.transform='translateY(-4px)'"
        @mouseleave="$event.currentTarget.style.transform=''"
        @click="handleSelectAction('blogs-rowView', rp.id)">
      <div style="aspect-ratio:4/3;overflow:hidden;border-radius:4px;margin-bottom:14px;background:var(--bg-base);">
        <img v-if="rp.img" :src="rp.img" :alt="rp.title"
            style="width:100%;height:100%;object-fit:cover;transition:transform .35s;"
            @mouseenter="$event.target.style.transform='scale(1.04)'"
            @mouseleave="$event.target.style.transform=''" />
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">
        {{ rp.date }}
      </div>
      <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);line-height:1.4;margin-bottom:6px;">
        {{ rp.title }}
      </h3>
      <div style="font-size:0.78rem;color:var(--text-muted);">
        By {{ rp.author }}
      </div>
    </div>
  </div>
</div>
</fo-page>
<!-- ===== □. ══ 하단: You Might Also Like ══ =========================== -->
`
};
