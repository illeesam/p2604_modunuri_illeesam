/* ShopJoy - Like (좋아요 / 위시리스트) */
window.Like = {
  name: 'Like',
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { reactive, computed, watch, onMounted } = Vue;
    const prods             = window.foApp.prods;  // 상품 목록

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false });
    const codes = reactive({});

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Like.js : handleBtnAction -> ', cmd, param);
      // 홈으로 이동
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 상품목록으로 이동
      } else if (cmd === 'page-goProdList') {
        return props.navigate('prodList');
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Like.js : handleSelectAction -> ', cmd, param);
      // 상품 선택 (param: prod)
      if (cmd === 'likes-rowSelect') {
        return window.foApp.selectProd(param);
      // 좋아요 해제 (param: prodId)
      } else if (cmd === 'likes-rowToggleLike') {
        return window.foApp.toggleLike(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
    const cfLikedProds = computed(() => {
      return (prods || []).filter(p => window.foApp.isLiked(p.prodId));
    });

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      uiState, codes,                                  // 상태
      handleBtnAction, handleSelectAction,             // dispatch
      cfLikedProds,                                    // computed
    };
  },
  template: /* html */ `
<fo-page title="위시리스트" eyebrow="My"
  banner-img="assets/cdn/prod/img/page-title/page-title-2.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'home' }, { label:'위시리스트' }]"
  @nav="() => handleBtnAction('page-goHome')">
  <!-- ===== ■. 상품 목록 =================================================== -->
  <div v-if="cfLikedProds.length" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:20px;">
    <div v-for="p in cfLikedProds" :key="p.prodId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;cursor:pointer;transition:box-shadow .2s;"
      @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
      @mouseleave="$event.currentTarget.style.boxShadow=''">
      <!-- ===== ■.■.■. 이미지 ================================================= -->
      <div style="position:relative;aspect-ratio:1;background:#fff;padding:clamp(8px,2vw,16px);overflow:hidden;" @click="handleSelectAction('likes-rowSelect', p)">
        <img :src="p.image || window.NO_IMAGE" :alt="p.prodNm" style="width:100%;height:100%;object-fit:contain;" />
        <span v-if="p.badge" style="position:absolute;top:10px;left:10px;font-size:0.68rem;font-weight:600;padding:3px 8px;border-radius:2px;color:#fff;"
          :style="{ background: p.badge==='NEW' ? '#1a1a1a' : '#8b7355' }">
          {{ p.badge }}
        </span>
        <!-- ===== ■.■.■.■. 좋아요 해제 ============================================ -->
        <button @click.stop="handleSelectAction('likes-rowToggleLike', p.prodId)"
          style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
            </path>
          </svg>
        </button>
      </div>
      <!-- ===== ■.■.■. 정보 ================================================== -->
      <div style="padding:14px 16px;" @click="handleSelectAction('likes-rowSelect', p)">
        <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">
          {{ p.prodNm }}
        </div>
        <div style="font-size:0.85rem;color:var(--text-muted);">
          {{ p.price }}
        </div>
      </div>
    </div>
  </div>
  <!-- ===== □. 상품 목록 =================================================== -->
  <!-- ===== ■. 빈 상태 ==================================================== -->
  <div v-else style="text-align:center;padding:clamp(40px,8vw,80px) 0;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom:16px;">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
      </path>
    </svg>
    <div style="font-size:0.95rem;color:var(--text-muted);margin-bottom:20px;">
      좋아요한 상품이 없습니다
    </div>
    <button class="btn-outline" @click="handleBtnAction('page-goProdList')" style="padding:10px 24px;">
      상품 둘러보기
    </button>
  </div>
  <!-- ===== □. 빈 상태 ==================================================== -->
</fo-page>
`
};
