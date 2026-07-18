/* ShopJoy - Prod03View (상품 상세 - Luxe Edition) */
window.Prod03View = {
  name: 'Prod03View',
  props: {
    navigate:   { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onBeforeUnmount, watch } = Vue;
    const prod              = window.foApp.selectedProd;  // 선택된 상품
    const addToCart            = window.foApp.addToCart;  // 장바구니 추가

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ Prod03View.js : handleBtnAction -> ', cmd, param);
      // 페이지 이동: 홈
      if (cmd === 'page-goHome') {
        return props.navigate('home');
      // 페이지 이동: 상품목록
      } else if (cmd === 'page-goProdList') {
        return props.navigate('prodList');
      // 페이지 이동: 문의
      } else if (cmd === 'page-goContact') {
        return props.navigate('contact');
      // 장바구니 담기
      } else if (cmd === 'cart-add') {
        return handleAddToCart();
      // 바로구매
      } else if (cmd === 'order-buyNow') {
        return execBuyNow();
      // 드로어에서 장바구니 담기
      } else if (cmd === 'cart-addFromDrawer') {
        return execCartFromDrawer();
      // 드로어 열기: 바로구매 모드
      } else if (cmd === 'quickBuy-openBuy') {
        return openQuickBuy();
      // 드로어 열기: 장바구니 모드
      } else if (cmd === 'quickBuy-openCart') {
        return openCartDrawer();
      // 드로어 닫기
      } else if (cmd === 'quickBuy-close') {
        uiState.quickBuyOpen = false;
        return;
      // 찜 토글
      } else if (cmd === 'prod-toggleLike') {
        return toggleLike(param);
      // 수량 +
      } else if (cmd === 'qty-inc') {
        uiState.qty++;
        return;
      // 수량 -
      } else if (cmd === 'qty-dec') {
        if (uiState.qty > 1) uiState.qty--;
        return;
      // 사이즈 가이드 모달 열기
      } else if (cmd === 'sizeGuideModal-open') {
        uiState.showSizeGuide = true;
        return;
      // 사이즈 가이드 모달 닫기 → 모달 응답은 fnCallbackModal 로 위임
      } else if (cmd === 'sizeGuideModal-close') {
        return fnCallbackModal('size-guide', {}, null);
      // 줌 모달 열기
      } else if (cmd === 'zoomModal-open') {
        uiState.zoomOpen = true;
        return;
      // 줌 모달 닫기
      } else if (cmd === 'zoomModal-close') {
        uiState.zoomOpen = false;
        return;
      // 갤러리: 이전 이미지
      } else if (cmd === 'gallery-prev') {
        uiState.selectedImg = (uiState.selectedImg - 1 + cfMockImages.value.length) % cfMockImages.value.length;
        return;
      // 갤러리: 다음 이미지
      } else if (cmd === 'gallery-next') {
        uiState.selectedImg = (uiState.selectedImg + 1) % cfMockImages.value.length;
        return;
      // 포토 팝업 열기
      } else if (cmd === 'photoModal-open') {
        uiState.photoPopupOpen = true;
        return;
      // 포토 팝업 닫기
      } else if (cmd === 'photoModal-close') {
        uiState.photoPopupOpen = false;
        return;
      // 포토 그리드 페이지: 이전
      } else if (cmd === 'photoGrid-prev') {
        return photoGridPrev();
      // 포토 그리드 페이지: 다음
      } else if (cmd === 'photoGrid-next') {
        return photoGridNext();
      // 포토 상세 닫기
      } else if (cmd === 'photoDetail-close') {
        return closePhotoDetail();
      // 포토 상세: 이전 리뷰
      } else if (cmd === 'photoDetail-prev') {
        return photoNavPrev();
      // 포토 상세: 다음 리뷰
      } else if (cmd === 'photoDetail-next') {
        return photoNavNext();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ Prod03View.js : handleSelectAction -> ', cmd, param);
      // 색상(옵션1) 선택
      if (cmd === 'options-colorSelect') {
        return selectColor(param);
      // 사이즈(옵션2) 선택
      } else if (cmd === 'options-sizeSelect') {
        return selectSize(param);
      // 탭 선택
      } else if (cmd === 'tab-go') {
        return scrollToTab(param);
      // 이미지 썸네일 선택
      } else if (cmd === 'gallery-rowSelect') {
        uiState.selectedImg = param;
        return;
      // 리뷰 정렬 필터 선택
      } else if (cmd === 'reviews-filterSelect') {
        uiState.reviewFilter = param;
        return;
      // 포토 그리드 페이지 번호 선택
      } else if (cmd === 'photoGrid-rowGo') {
        uiState.photoGridPage = param;
        return;
      // 포토 리뷰 선택 (그리드 → 디테일)
      } else if (cmd === 'reviews-photoGridRowSelect') {
        return openPhotoFromGrid(param);
      // 포토 리뷰 선택 (목록 → 디테일)
      } else if (cmd === 'reviews-photoListRowSelect') {
        return openPhotoFromList(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };


    /* fnCallbackModal — 모든 모달 통합 dispatch. cmd=모달명, param=호출 시 파라미터, result=응답 결과 */
    const fnCallbackModal = (cmd, param, result) => {
      console.log(' ■■ Prod03View : fnCallbackModal -> ', cmd, param, result);
      if (cmd === 'size-guide') {
        if (result == null) {
            uiState.showSizeGuide = false;
            return;
        }
        return;
      } else {
        console.warn('[fnCallbackModal] unknown cmd:', cmd);
      }
    };

    /* ##### [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) #################### */

    /* toggleLike — 토글 */
    const toggleLike           = (id) => window.foApp.toggleLike(id);

    /* isLiked — 여부 확인 */
    const isLiked              = (id) => window.foApp.isLiked?.(id) ?? false;

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedImg: 0, selectedColor: null, selectedSize: null, qty: 1, colorError: '', sizeError: '', activeTab: 'detail', reviewFilter: '최신순', selectedReview: null, photoGridPage: 1, tabFixed: false, tabFixedTop: 0, tabFixedLeft: 0, tabFixedW: 0, tabPlaceholderH: 0, drawerMode: 'buy', photoFromGrid: false, showSizeGuide: false, photoPopupOpen: false, zoomOpen: false, showBottomBar: false, quickBuyOpen: false, prodApiLoaded: false });
    const codes = reactive({});
    const svProduct = reactive({});

    /* fnApplySvProduct — 유틸 */
    const fnApplySvProduct = (newProd) => {
      Object.keys(svProduct).forEach(k => delete svProduct[k]);
      if (newProd) { Object.assign(svProduct, newProd); }
    };

    /* fnMergeProdOpts — coUtil.cofMergeProdOpts 위임 (opts/skus/images → opt1s/opt2s/opt2sAll/opt2Prices) */
    const fnMergeProdOpts = (prod, optsObj, skusList, imgList) => coUtil.cofMergeProdOpts(prod, optsObj, skusList, imgList);
    if (prod) { fnApplySvProduct(prod); }
    /* Tier 2/3 lazy 데이터 — 배열/객체는 reactive (정책: base.데이터흐름-상태관리.md §2-1) */
    const svContents      = reactive([]);
    const svRels          = reactive([]);
    const svReviews       = reactive([]);
    const svReviewSummary = reactive({});
    const svReviewImages  = reactive([]);
    const svQnas           = reactive([]);
    const svPromotions   = reactive({});

    /* fnGetProdIdFromHash — coUtil.cofProdIdFromHash 위임 (#...&prodid= 추출) */
    const fnGetProdIdFromHash = () => coUtil.cofProdIdFromHash();

    /* fnPickData — 유틸 */
    const fnPickData = (res) => res?.data?.data ?? res?.data ?? null;

    /* fnPickList — 유틸 */
    const fnPickList = (res) => {
      const d = fnPickData(res);
      if (Array.isArray(d)) { return d; }
      return d?.pageList || d?.list || [];
    };

    /* handleSearchList — 목록 조회 */
    const handleSearchList = async (searchType = 'DEFAULT') => {
      const prodId = fnGetProdIdFromHash() || svProduct.prodId;
      if (!prodId) { return; }
      /* Tier 1: 첫 화면 통합 */
      try {
        const res = await foApiSvc.pdProd.getById(prodId, '상품상세', '상세조회');
        const data = fnPickData(res) || {};
        const prod = data.prod || data;
        if (prod && prod.prodId) {
          const merged = fnMergeProdOpts(prod, { groups: data.prodOptTypes || [], items: data.prodOpts || [] }, data.prodSkus || [], data.prodImgs || []);
          fnApplySvProduct(merged);
        }
        uiState.prodApiLoaded = true;
      } catch (e) { console.error('[handleSearchList:getById]', e); uiState.prodApiLoaded = true; }

      /* Tier 2: lazy 호출 — 병렬 처리 */
      const tier2 = await Promise.allSettled([
        foApiSvc.pdProd.getContents(prodId, '상품상세', '상세설명조회'),
        foApiSvc.pdProd.getRels(prodId, '상품상세', '연관상품조회'),
        foApiSvc.pdProd.getReviews(prodId, { pageNo: 1, pageSize: 20 }, '상품상세', '리뷰조회'),
        foApiSvc.pdProd.getReviewImages(prodId, '상품상세', '리뷰이미지조회'),
        foApiSvc.pdProd.getQna(prodId, { pageNo: 1, pageSize: 20 }, '상품상세', 'Q&A조회'),
      ]);
      if (tier2[0].status === 'fulfilled') { svContents.splice(0, svContents.length, ...fnPickList(tier2[0].value)); }
      if (tier2[1].status === 'fulfilled') { svRels.splice(0, svRels.length, ...fnPickList(tier2[1].value)); }
      if (tier2[2].status === 'fulfilled') {
        const rd = fnPickData(tier2[2].value) || {};
        const rows = rd.reviewPage?.pageList || [];
        svReviews.splice(0, svReviews.length, ...rows);
        Object.keys(svReviewSummary).forEach(k => delete svReviewSummary[k]);
        Object.assign(svReviewSummary, rd.summary || {});
        const imgs = rd.attachImages || [];
        svReviewImages.splice(0, svReviewImages.length, ...imgs);
      }
      if (tier2[3].status === 'fulfilled') {
        const imgs = fnPickList(tier2[3].value);
        svReviewImages.splice(0, svReviewImages.length, ...imgs);
      }
      if (tier2[4].status === 'fulfilled') {
        const qd = fnPickData(tier2[4].value) || {};
        svQnas.splice(0, svQnas.length, ...(qd.qnaPage?.pageList || qd.pageList || (Array.isArray(qd) ? qd : [])));
      }

      /* Tier 3: 사용자별 프로모션 */
      try {
        const res = await foApiSvc.pdProd.getPromotions(prodId, '상품상세', '프로모션조회');
        Object.keys(svPromotions).forEach(k => delete svPromotions[k]);
        Object.assign(svPromotions, fnPickData(res) || {});
      } catch (e) { console.error('[handleSearchList:getPromotions]', e); }
    };

    const isAppReady = coUtil.cofUseAppCodeReady(uiState, () => { uiState.isPageCodeLoad = true; });

    /* -- 탭 -- */
    const TABS = [
      { id: 'detail', label: '상세정보' },
      { id: 'size',   label: '사이즈' },
      { id: 'review', label: '상품평' },
      { id: 'qna',    label: 'Q&A' },
      { id: 'style',  label: '스타일' },
    ];

    /* -- DOM Refs (ref만 유지) -- */
    const tabBarRef    = ref(null);
    const buyBtnRef    = ref(null);
    const detailSecRef = ref(null);
    const sizeSecRef   = ref(null);
    const reviewSecRef = ref(null);
    const qnaSecRef    = ref(null);
    const styleSecRef  = ref(null);

    /* -- 상수 -- */
    const photoGridPageSize = 12;

    /* -- 사이즈 가이드 -- */
    const sizeGuideRows = [
      ['XS', '36', '82', '60'],
      ['S',  '38', '86', '62'],
      ['M',  '40', '90', '64'],
      ['L',  '42', '96', '66'],
      ['XL', '44', '102','68'],
      ['XXL','46', '108','70'],
    ];

    /* ##### [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ############################### */

    /* fo-grid 컬럼 — sizeGuideRows 는 위치배열 → fmt 로 인덱스 접근 */
    const columns = {};
    columns.sizeGuideGrid = [
      { key: 's0', label: '사이즈',  align: 'center', fmt: (v, r) => r[0] },
      { key: 's1', label: '어깨 (cm)', align: 'center', fmt: (v, r) => r[1] },
      { key: 's2', label: '가슴 (cm)', align: 'center', fmt: (v, r) => r[2] },
      { key: 's3', label: '총장 (cm)', align: 'center', fmt: (v, r) => r[3] },
    ];
    /* 모달용 — 컴팩트 헤더(단위 생략) */
    const sizeGuideColsShort = [
      { key: 's0', label: '사이즈', align: 'center', fmt: (v, r) => r[0] },
      { key: 's1', label: '어깨',   align: 'center', fmt: (v, r) => r[1] },
      { key: 's2', label: '가슴',   align: 'center', fmt: (v, r) => r[2] },
      { key: 's3', label: '총장',   align: 'center', fmt: (v, r) => r[3] },
    ];

    /* -- 스타일 추천 -- */
    const styleItems = [
      { emoji: '👖', label: '캐주얼 룩',  desc: '데님 팬츠 + 스니커즈' },
      { emoji: '👗', label: '페미닌 룩',  desc: '플로럴 스커트와 매치' },
      { emoji: '🧥', label: '레이어드 룩', desc: '오버핏 자켓과 함께' },
      { emoji: '👟', label: '스포티 룩',  desc: '트랙 팬츠 + 스니커즈' },
    ];

    /* -- 이미지 목록 (선택 색상별 교체) -- */
    const _IMG = 'assets/cdn/prod/img/shop/product';

    /* _buildColorImages — 빌드 */
    const _buildColorImages = (p, colorIdx) => {
      const id = p.prodId || 1;
      const base = id <= 12 ? 'fashion' : 'prod';
      if (base === 'fashion') {
        /* fashion 이미지 3장씩 순환: colorIdx 기준 오프셋 */
        const startIdx = ((id - 1) * 3 + colorIdx * 3) % 12 + 1;
        return [1,2,3].map(offset => {
          const n = ((startIdx - 1 + offset - 1) % 12) + 1;

          return { src: `${_IMG}/fashion/fashion-${n}.webp`, label: '이미지 ' + offset };
        });
      }
      /* prod png: 3장씩 순환 */
      const startIdx = ((id - 1) * 3 + colorIdx * 2) % 23 + 1;
      return [0,1,2].map(offset => {
        const n = ((startIdx - 1 + offset) % 23) + 1;

        return { src: `${_IMG}/prod_${n}.png`, label: '이미지 ' + (offset + 1) };
      });
    };

    const cfMockImages = computed(() => {
      const p = svProduct;
      if (!p) { return []; }
      const real = Array.isArray(p.images) ? p.images : [];
      if (real.length) {
        const sel = uiState.selectedColor || null;
        const colorKeys = new Set();
        if (sel) {
          if (sel.optId) { colorKeys.add(String(sel.optId)); }
          if (sel.val) { colorKeys.add(String(sel.val)); }
          if (sel.name) { colorKeys.add(String(sel.name)); }
        }
        const opt1ById = new Map();
        (p.opt1s || []).forEach(c => {
          if (c.optId) { opt1ById.set(String(c.optId), c); }
          if (c.val) { opt1ById.set(String(c.val), c); }
          if (c.name) { opt1ById.set(String(c.name), c); }
        });
        const opt2ById = new Map();
        (p.opt2sAll || []).forEach(c => {
          if (c.optId) { opt2ById.set(String(c.optId), c); }
          if (c.val) { opt2ById.set(String(c.val), c); }
          if (c.name) { opt2ById.set(String(c.name), c); }
        });
        // 색상 무관 공통 이미지(prodOptId1 빈값)는 어떤 색상이든 항상 표시.
        // 선택 색상 전용 이미지가 있을 때만 다른 색상 전용을 제외한다.
        const isCommon = (im) => !im.prodOptId1 || String(im.prodOptId1).trim() === '';
        const matchesColor = (im) => colorKeys.has(String(im.prodOptId1));
        const filtered = colorKeys.size
          ? (real.some(matchesColor)
              ? real.filter(im => isCommon(im) || matchesColor(im))
              : real)
          : real;
        const list = filtered.slice().sort((a,b) =>
          ((b.isThumb === 'Y') - (a.isThumb === 'Y')) || ((a.sortOrd||0) - (b.sortOrd||0))
        );
        return list.map((im, i) => {
          const c1 = im.prodOptId1 != null ? opt1ById.get(String(im.prodOptId1)) : null;
          const c2 = im.prodOptId2 != null ? opt2ById.get(String(im.prodOptId2)) : null;
          const parts = [];
          if (c1) { parts.push((p.opt1Nm || '색상') + ': ' + c1.name); }
          if (c2) { parts.push((p.opt2Nm || '사이즈') + ': ' + c2.name); }
          if (im.isThumb === 'Y') { parts.push('★ 대표'); }
          return {
            src:    coUtil.cofImgSrc(im.cdnImgUrl || im.cdnThumbUrl || im.previewUrl || ''),
            label:  '이미지 ' + (i + 1),
            optTip: parts.join(' / '),
            isMain: im.isThumb === 'Y',
          };
        }).filter(it => it.src);
      }
      if (!uiState.prodApiLoaded) { return []; }
      const opt1s = p.opt1s || [];
      const colorIdx = opt1s.findIndex(c => c.name === uiState.selectedColor?.name);
      return _buildColorImages(p, Math.max(0, colorIdx));
    });

    /* fnNormalizeReview — 유틸 */
    const fnNormalizeReview = (r) => {
      const rating = Number(r.rating) || 0;
      const dt = r.reviewDate || r.regDate || '';
      const dateStr = dt ? String(dt).slice(0, 10).replace(/-/g, '.') : '';
      const mid = r.memberId || '';
      const masked = mid.length >= 3
        ? mid[0] + '*'.repeat(mid.length - 2) + mid.slice(-1)
        : mid.length === 2 ? mid[0] + '*' : mid || '***';
      const imgs = svReviewImages.filter(img => img.reviewId === r.reviewId);
      return {
        id:         r.reviewId,
        maskedName: masked,
        rating,
        date:       dateStr,
        sizeInfo:   r.prodOptNm2 || r.sizeInfo || '',
        colorInfo:  r.prodOptNm1 || r.colorInfo || '',
        text:       r.reviewContent || r.reviewTitle || '',
        hasPhoto:   imgs.length > 0,
        photoImg:   coUtil.cofImgSrc(imgs[0]?.thumbUrl || imgs[0]?.cdnImgUrl || ''),
        helpful:    Number(r.helpfulCnt) || 0,
      };
    };

    const cfMockReviews = computed(() => svReviews.map(fnNormalizeReview));

    const cfReviewsWithPhoto = computed(() => cfMockReviews.value.filter(r => r.hasPhoto));

    const cfFilteredReviews = computed(() => {
      const list = [...cfMockReviews.value];
      if (uiState.reviewFilter === '별점높은순') { return list.sort((a, b) => b.rating - a.rating); }
      if (uiState.reviewFilter === '별점낮은순') { return list.sort((a, b) => a.rating - b.rating); }
      if (uiState.reviewFilter === '도움순') { return list.sort((a, b) => b.helpful - a.helpful); }
      return list;
    });

    const cfAvgRating = computed(() => {
      const avg = Number(svReviewSummary.avgRating || svReviewSummary.avg_rating);
      if (avg) { return avg.toFixed(1); }
      const r = cfMockReviews.value;
      return r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : '0.0';
    });

    const cfRatingDist = computed(() =>
      [5, 4, 3, 2, 1].map(star => ({
        star,
        count: Number(svReviewSummary['rate' + star]) || cfMockReviews.value.filter(x => x.rating === star).length,
        pct: (() => {
          const total = Number(svReviewSummary.total) || cfMockReviews.value.length;
          const cnt   = Number(svReviewSummary['rate' + star]) || cfMockReviews.value.filter(x => x.rating === star).length;
          return total ? Math.round(cnt / total * 100) : 0;
        })(),
      }))
    );

    /* stars — 별점 */
    const stars = n => {
      const v = Math.max(0, Math.min(5, Number(n) || 0));
      const full = Math.floor(v);
      const frac = v - full;
      const half = frac >= 0.25 && frac < 0.75 ? 1 : 0;
      const fullCount = frac >= 0.75 ? full + 1 : full;
      const emptyCount = 5 - fullCount - half;
      const FULL = '<span style="color:#f59e0b;">★</span>';
      const EMPTY = '<span style="color:#e5e7eb;">★</span>';
      const HALF = '<span style="position:relative;display:inline-block;color:#e5e7eb;">★<span style="position:absolute;left:0;top:0;width:50%;overflow:hidden;color:#f59e0b;">★</span></span>';
      return FULL.repeat(fullCount) + (half ? HALF : '') + EMPTY.repeat(emptyCount);
    };

    /* -- 탭 고정 + 스크롤 -- */
    let scrollEl = null;

    /* getScrollEl — 조회 */
    const getScrollEl = () => scrollEl || (scrollEl = document.querySelector('.layout-main')) || window;

    let tabNaturalScrollTop = 0;

    /* updateTabFixedPos — 갱신 */
    const updateTabFixedPos = () => {
      const main = getScrollEl();
      if (!main.getBoundingClientRect) { return; }
      const r = main.getBoundingClientRect();
      uiState.tabFixedTop  = r.top;
      uiState.tabFixedLeft = r.left;
      uiState.tabFixedW    = r.width;
    };

    /* scrollToTab — 스크롤 → 탭 */
    const scrollToTab = (tabId) => {
      const map = { detail: detailSecRef, size: sizeSecRef, review: reviewSecRef, qna: qnaSecRef, style: styleSecRef };
      const el  = map[tabId]?.value;
      if (!el) { return; }
      const main = getScrollEl();
      const mainRect = main.getBoundingClientRect ? main.getBoundingClientRect() : { top: 0 };
      const barH = tabBarRef.value?.offsetHeight || 44;
      /* 탭바 fixed 시: mainRect.top + barH 만큼 오프셋 필요 */
      const offset = uiState.tabFixed ? barH + 8 : barH + 8;
      const elTop = el.getBoundingClientRect().top - mainRect.top;
      const top = main.scrollTop + elTop - offset;
      main.scrollTo({ top, behavior: 'smooth' });
      uiState.activeTab = tabId;
    };

    /* onScroll — 이벤트 */
    const onScroll = () => {
      const main = getScrollEl();
      const bar  = tabBarRef.value;
      if (!bar || !main.getBoundingClientRect) { return; }

      const mainTop = main.getBoundingClientRect().top;

      /* -- fixed 전환 -- */
      if (!uiState.tabFixed) {
        if (bar.getBoundingClientRect().top <= mainTop) {
          uiState.tabPlaceholderH = bar.offsetHeight;
          tabNaturalScrollTop   = main.scrollTop;
          updateTabFixedPos();
          uiState.tabFixed = true;
        }
      } else {
        if (main.scrollTop < tabNaturalScrollTop) {
          uiState.tabFixed = false;
        }
      }

      /* -- 하단 바 표시: 구매 버튼이 화면 밖으로 나가면 표시 -- */
      const btn = buyBtnRef.value;
      uiState.showBottomBar = btn ? btn.getBoundingClientRect().bottom < mainTop : false;

      /* -- 활성 탭 -- */
      const barH = bar.offsetHeight || 44;
      const anchor = uiState.tabFixed
        ? uiState.tabFixedTop + barH + 20   /* fixed: 탭바 하단 기준 */
        : bar.getBoundingClientRect().bottom + 10;
      const sections = [
        { id: 'style',  ref: styleSecRef },
        { id: 'qna',    ref: qnaSecRef },
        { id: 'review', ref: reviewSecRef },
        { id: 'size',   ref: sizeSecRef },
        { id: 'detail', ref: detailSecRef },
      ];
      for (const s of sections) {
        if (s.ref.value && s.ref.value.getBoundingClientRect().top <= anchor) {
          uiState.activeTab = s.id;
          break;
        }
      }
    };

    /* -- 드로어 상태는 uiState.drawerMode 사용 ('buy' | 'cart') -- */

    /* anyModalOpen — 아무 모달 열기 */
    const anyModalOpen = () =>
      uiState.zoomOpen || uiState.photoPopupOpen || !!uiState.selectedReview ||
      uiState.showSizeGuide || uiState.quickBuyOpen;

    /* closeAllModals — 닫기 */
    const closeAllModals = () => {
      uiState.zoomOpen = false;
      uiState.photoPopupOpen = false;
      uiState.selectedReview = null;
      uiState.showSizeGuide = false;
      uiState.quickBuyOpen = false;
    };

    /* onKeydown — 이벤트 */
    const onKeydown = (e) => {
      if (e.key === 'Escape' && anyModalOpen()) {
        e.preventDefault();
        closeAllModals();
      }
    };

    /* onPopState — 이벤트 */
    const onPopState = () => {
      if (anyModalOpen()) { closeAllModals(); }
    };

    watch(anyModalOpen, (open, prev) => {
      if (open && !prev) {
        try { history.pushState({ modal: true }, ''); } catch (_) {}
      }
    });

    // ★ onMounted
    onMounted(() => {
      if (isAppReady.value) { uiState.isPageCodeLoad = true; }
      const main = getScrollEl();
      main.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKeydown);
      window.addEventListener('popstate', onPopState);
      /* 품절/중지 아닌 첫 색상 자동 선택 */
      const firstAvail = (svProduct.opt1s || []).find(c => colorStatus(c) === 'ok');
      if (firstAvail) { uiState.selectedColor = firstAvail; }
      handleSearchList();
    });
    onBeforeUnmount(() => {
      const main = getScrollEl();
      main.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('popstate', onPopState);
    });

    watch(() => prod, (p) => {
      fnApplySvProduct(p);
      uiState.selectedColor = (p?.opt1s || []).find(c => colorStatus(c) === 'ok') || null;
      uiState.selectedSize  = null;
      uiState.qty           = 1;
      uiState.selectedImg   = 0;
      uiState.activeTab     = 'detail';
      uiState.quickBuyOpen  = false;
      uiState.tabFixed      = false;
      getScrollEl().scrollTo(0, 0);
    });

    /* fnCategoryLabel — 유틸 */
    const fnCategoryLabel = p => {
      if (!p) { return ''; }
      return (window.SITE_CONFIG?.categorys || []).find(c => c.categoryId === p.categoryId)?.categoryNm || p.categoryId || '';
    };

    /* -- 옵션 재고 상태 (목업: 색상 + 사이즈) -- */
    const cfColorStockMap = computed(() => {
      const p = svProduct;
      if (!p) { return {}; }
      const opt1s = p.opt1s || [];
      const pid = p.prodId || 1;
      const map = {};
      opt1s.forEach((c, i) => {
        const seed = (pid * 11 + i * 17) % 25;
        if (seed === 0) { map[c.name] = 'stop'; }
        else if (seed === 1) { map[c.name] = 'soldout'; }
        else { map[c.name] = 'ok'; }
      });
      return map;
    });

    /* colorStatus — 색상 상태 */
    const colorStatus = (c) => cfColorStockMap.value[c?.name] || 'ok';

    const cfSizeStockMap = computed(() => {
      const p = svProduct;
      if (!p) { return {}; }
      const sizes = p.opt2s || [];
      const pid = p.prodId || 1;
      const map = {};
      sizes.forEach((s, i) => {
        const seed = (pid * 7 + i * 13) % 20;
        if (seed === 0) { map[s] = 'stop'; }
        else if (seed === 1) { map[s] = 'soldout'; }
        else { map[s] = 'ok'; }
      });
      return map;
    });

    /* sizeStatus — 크기 상태 */
    const sizeStatus = (s) => cfSizeStockMap.value[s] || 'ok';

    /* -- 옵션별 가격 -- */
    const cfBasePrice = computed(() => {
      const numStr = String(svProduct.price || '').replace(/[^0-9]/g, '');
      return Number(numStr) || 0;
    });

    /* getSizeDelta — 조회 */
    const getSizeDelta = (sizeName) => (svProduct.opt2Prices || {})[sizeName] || 0;

    /* 선택된 색상+사이즈의 최종 단가 */
    const cfSelectedUnitPrice = computed(() => {
      const colorDelta = uiState.selectedColor?.priceDelta || 0;
      const sizeDelta  = getSizeDelta(uiState.selectedSize);
      return cfBasePrice.value + colorDelta + sizeDelta;
    });

    /* 모든 옵션 조합의 최소~최대 가격 범위 */
    const cfPriceRange = computed(() => {
      const p = svProduct;
      if (!p || !cfBasePrice.value) { return null; }
      const colorDeltas = (p.opt1s || []).map(c => c.priceDelta || 0);
      const sizeDeltas  = Object.values(p.opt2Prices || {}).concat([0]);
      const prices = [];
      colorDeltas.forEach(cd => sizeDeltas.forEach(sd => prices.push(cfBasePrice.value + cd + sd)));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? null : { min, max };
    });

    /* 표시 가격:
       - 색상+사이즈 모두 선택 → 정확한 가격
       - 색상만 선택          → 색상가격 (사이즈 delta 존재 시 범위)
       - 미선택               → 전체 범위 또는 기본가 */
    const cfDisplayPrice = computed(() => {
      const p = svProduct;
      if (!p || !cfBasePrice.value) { return p?.price || ''; }

      const colorDelta = uiState.selectedColor?.priceDelta || 0;
      const sizeDelta  = getSizeDelta(uiState.selectedSize);
      const hasSizeDelta = Object.keys(p.opt2Prices || {}).length > 0;

      /* 색상+사이즈 모두 선택 */
      if (uiState.selectedColor && uiState.selectedSize) {
        return (cfBasePrice.value + colorDelta + sizeDelta).toLocaleString('ko-KR') + '원';
      }

      /* 색상만 선택 */
      if (uiState.selectedColor) {
        const colorPrice = cfBasePrice.value + colorDelta;
        if (hasSizeDelta) {
          const maxSD = Math.max(...Object.values(p.opt2Prices));
          return colorPrice.toLocaleString('ko-KR') + '원 ~ ' + (colorPrice + maxSD).toLocaleString('ko-KR') + '원';
        }
        return colorPrice.toLocaleString('ko-KR') + '원';
      }

      /* 미선택: 전체 범위 표시 */
      if (cfPriceRange.value) {
        return cfPriceRange.value.min.toLocaleString('ko-KR') + '원 ~ ' + cfPriceRange.value.max.toLocaleString('ko-KR') + '원';
      }
      return p.price;
    });

    /* 바로구매 총 금액 */
    const cfQuickBuyTotal = computed(() => {
      if (!svProduct.prodId) { return ''; }
      if (!cfSelectedUnitPrice.value) { return svProduct.price; }
      const total = cfSelectedUnitPrice.value * uiState.qty;
      return total.toLocaleString('ko-KR') + '원';
    });

    /* selectColor — 선택 */
    const selectColor = c => {
      const st = colorStatus(c);
      if (st === 'stop' || st === 'soldout') { return; }
      uiState.selectedColor = c; uiState.colorError = ''; uiState.selectedImg = 0;
    };

    /* selectSize — 선택 */
    const selectSize  = s => {
      const st = sizeStatus(s);
      if (st === 'stop' || st === 'soldout') { return; }
      uiState.selectedSize = s; uiState.sizeError = '';
    };

    /* validate — 검증 */
    const validate = () => {
      let ok = true;
      if (!uiState.selectedColor) { uiState.colorError = '색상을 선택해주세요.'; ok = false; }
      /* 사이즈 FREE 또는 미설정이면 자동 선택 */
      const sizes = svProduct.opt2s || [];
      if (!uiState.selectedSize) {
        if (sizes.length === 1 && sizes[0] === 'FREE') { uiState.selectedSize = 'FREE'; }
        else if (sizes.length === 0) { uiState.selectedSize = 'FREE'; }
        else { uiState.sizeError = '사이즈를 선택해주세요.'; ok = false; }
      }
      return ok;
    };

    /* handleAddToCart — 처리 */
    const handleAddToCart = () => {
      if (!validate()) { return; }
      addToCart(svProduct, uiState.selectedColor, uiState.selectedSize, uiState.qty);
      uiState.selectedColor = svProduct.opt1s?.[0] || null;
      uiState.selectedSize  = null;
      uiState.qty = 1;
    };

    /* execBuyNow — 실행 구매 즉시 */
    const execBuyNow = () => {
      if (!validate()) { return; }
      uiState.quickBuyOpen = false;
      props.navigate('order', {
        instantOrder: {
          prod: svProduct,
          color: uiState.selectedColor,
          size: uiState.selectedSize,
          qty: uiState.qty,
        }
      });
    };

    /* execCartFromDrawer — 실행 장바구니 에서 서랍 */
    const execCartFromDrawer = () => {
      if (!validate()) { return; }
      addToCart(svProduct, uiState.selectedColor, uiState.selectedSize, uiState.qty);
      uiState.quickBuyOpen = false;
      uiState.selectedColor = svProduct.opt1s?.[0] || null;
      uiState.selectedSize  = null;
      uiState.qty = 1;
    };

    /* openQuickBuy — 열기 */
    const openQuickBuy  = () => { uiState.drawerMode = 'buy';  uiState.quickBuyOpen = true; };

    /* openCartDrawer — 열기 */
    const openCartDrawer = () => { uiState.drawerMode = 'cart'; uiState.quickBuyOpen = true; };

    /* openPhotoFromGrid — 열기 */
    const openPhotoFromGrid = (r) => { uiState.selectedReview = r; uiState.photoFromGrid = true;  uiState.photoPopupOpen = false; };

    /* openPhotoFromList — 열기 */
    const openPhotoFromList = (r) => { uiState.selectedReview = r; uiState.photoFromGrid = false; };

    /* closePhotoDetail — 닫기 */
    const closePhotoDetail  = () => {
      uiState.selectedReview = null;
      if (uiState.photoFromGrid) { uiState.photoPopupOpen = true; }
      uiState.photoFromGrid = false;
    };

    /* photoNavPrev — photo 네비 이전 */
    const photoNavPrev = () => {
      const list = cfReviewsWithPhoto.value;
      if (!list.length) { return; }
      const idx = list.findIndex(r => r.id === uiState.selectedReview?.id);
      uiState.selectedReview = list[(idx - 1 + list.length) % list.length];
    };

    /* photoNavNext — photo 네비 다음 */
    const photoNavNext = () => {
      const list = cfReviewsWithPhoto.value;
      if (!list.length) { return; }
      const idx = list.findIndex(r => r.id === uiState.selectedReview?.id);
      uiState.selectedReview = list[(idx + 1) % list.length];
    };
    const cfPhotoNavIdx = computed(() => {
      const list = cfReviewsWithPhoto.value;
      return list.findIndex(r => r.id === uiState.selectedReview?.id);
    });
    const cfPhotoGridPageCount = computed(() =>
      Math.max(1, Math.ceil(cfReviewsWithPhoto.value.length / photoGridPageSize))
    );
    const cfPhotoGridItems = computed(() => {
      const start = (uiState.photoGridPage - 1) * photoGridPageSize;
      return cfReviewsWithPhoto.value.slice(start, start + photoGridPageSize);
    });

    /* photoGridPrev — photo 그리드 이전 */
    const photoGridPrev = () => {
      uiState.photoGridPage = uiState.photoGridPage > 1
        ? uiState.photoGridPage - 1
        : cfPhotoGridPageCount.value;
    };

    /* photoGridNext — photo 그리드 다음 */
    const photoGridNext = () => {
      uiState.photoGridPage = uiState.photoGridPage < cfPhotoGridPageCount.value
        ? uiState.photoGridPage + 1
        : 1;
    };

    /* ##### [06] return (템플릿 노출) ############################################## */

    return {
      columns,
      uiState, codes, prod: svProduct,                                                                          // 상태 / 데이터
      svContents, svRels, svReviews, svReviewSummary, svReviewImages, svQnas, svPromotions,                      // 데이터 (lazy)
      handleBtnAction, handleSelectAction, fnCallbackModal,                                                                      // dispatch
      cfMockImages, cfMockReviews, cfReviewsWithPhoto, cfFilteredReviews, cfAvgRating, cfRatingDist,            // computed - 리뷰/갤러리
      cfQuickBuyTotal, cfDisplayPrice, cfPhotoNavIdx, cfPhotoGridPageCount, cfPhotoGridItems,                   // computed - 가격/포토
      sizeGuideRows, sizeGuideColsShort, styleItems, TABS,                                // 데이터 (정적)
      tabBarRef, detailSecRef, sizeSecRef, reviewSecRef, qnaSecRef, styleSecRef, buyBtnRef,                       // ref
      getSizeDelta, fnCategoryLabel, stars, colorStatus, sizeStatus, isLiked, toggleLike,                       // 헬퍼
    };
  },

  template: /* html */ `
<fo-page title="상품 상세" eyebrow="Prod"
  banner-img="assets/cdn/prod/img/page-title/page-title-2.jpg"
  banner-align="center 40%"
  :crumbs="[{ label:'홈', page:'goHome' }, { label:'상품목록', page:'goProdList' }, { label:'상품 상세' }]"
  @nav="p => handleBtnAction('page-' + p)">
  <!-- ===== ■. Site 03 Edition Ribbon ================================== -->
  <div style="background:linear-gradient(135deg,#4a148c 0%,#7b1fa2 50%,#9c27b0 100%);color:#fff;padding:10px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px;box-shadow:0 2px 8px rgba(80,30,130,0.15);">
    <span style="letter-spacing:2.5px;padding:2px 8px;border:1px solid rgba(255,255,255,0.5);">
      👑 LUXE
    </span>
    <span>
      ✨ 한정판 · 시그니처 상품
    </span>
    <span style="margin-left:auto;opacity:0.9;">
      SITE 03
    </span>
  </div>
  <!-- ===== □. Site 03 Edition Ribbon ================================== -->
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <template v-if="prod">
    <!-- ===== ■.■. ══ 상단: 갤러리 + 구매 옵션 ══ ================================= -->
    <div class="prod-top-wrap" style="max-width:1100px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(16px,3vw,32px);align-items:start;" class="detail-grid">
        <!-- ===== ■.■.■.■. 좌: 이미지 갤러리 ======================================== -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          <!-- ===== ■.■.■.■.■. 메인 이미지 ========================================== -->
          <div style="position:relative;"
            @mouseenter="$event.currentTarget.querySelector('.img-nav').style.opacity='1'"
            @mouseleave="$event.currentTarget.querySelector('.img-nav').style.opacity='0'">
            <div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;position:relative;background:var(--bg-base);cursor:pointer;"
              @click="handleBtnAction('zoomModal-open')">
              <img v-if="cfMockImages[uiState.selectedImg]?.src" :src="cfMockImages[uiState.selectedImg].src" :alt="prod.prodNm"
                style="width:100%;height:100%;object-fit:cover;" />
              <div v-if="prod.badge" style="position:absolute;top:14px;left:14px;">
                <span v-if="prod.badge==='NEW'"
                  style="background:var(--blue);color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;">
                  NEW
                </span>
                <span v-else-if="prod.badge==='인기'"
                  style="background:#ff6b35;color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;">
                  인기
                </span>
              </div>
            </div>
            <!-- ===== ■.■.■.■.■.■. 확대 아이콘 (우상단) ================================== -->
            <button @click="handleBtnAction('zoomModal-open')"
              style="position:absolute;top:14px;right:14px;width:36px;height:36px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.08);z-index:2;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
                <polyline points="15 3 21 3 21 9">
                </polyline>
                <polyline points="9 21 3 21 3 15">
                </polyline>
                <line x1="21" y1="3" x2="14" y2="10">
                </line>
                <line x1="3" y1="21" x2="10" y2="14">
                </line>
              </svg>
            </button>
            <!-- ===== ■.■.■.■.■.■. 좌/우 화살표 ======================================= -->
            <div class="img-nav" style="opacity:0;transition:opacity .2s;">
              <button @click="handleBtnAction('gallery-prev')"
                style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
                  <polyline points="15 18 9 12 15 6">
                  </polyline>
                </svg>
              </button>
              <button @click="handleBtnAction('gallery-next')"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6">
                  </polyline>
                </svg>
              </button>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 썸네일 가로 목록 (하단) ================================== -->
          <div style="display:flex;flex-direction:row;gap:8px;overflow-x:auto;scrollbar-width:none;">
            <div v-for="(img,i) in cfMockImages" :key="i"
              @click="handleSelectAction('gallery-rowSelect', i)"
              :style="{
              width:'72px',height:'72px',borderRadius:'8px',overflow:'hidden',
              cursor:'pointer',flexShrink:0,
              border:uiState.selectedImg===i?'2px solid var(--blue)':'2px solid var(--border)',
              transition:'border-color .15s',
              background:'var(--bg-base)',
              }">
              <img v-if="img.src" :src="img.src" :alt="img.label" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>
        </div>
        <!-- ===== /gallery =================================================== -->
        <!-- ===== ■.■.■.■. 우: 구매 옵션 ========================================== -->
        <div>
          <fo-container card-style="padding:clamp(16px,3vw,28px);position:sticky;top:20px;">
            <!-- ===== ■.■.■.■.■.■. 상품명 + 카테고리 ==================================== -->
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <h1 style="font-size:1.25rem;font-weight:800;color:var(--text-primary);flex:1;min-width:0;line-height:1.3;">
                {{ prod.prodNm }}
              </h1>
              <span style="font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;background:var(--blue-dim);color:var(--blue);flex-shrink:0;white-space:nowrap;">
                {{ fnCategoryLabel(prod) }}
              </span>
            </div>
            <!-- ===== ■.■.■.■.■.■. 별점 미리보기 ======================================= -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
              <span style="font-size:0.82rem;" v-html="stars(cfAvgRating)">
              </span>
              <span style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">
                {{ cfAvgRating }}
              </span>
              <span style="font-size:0.78rem;color:var(--text-muted);">
                ({{ svReviewSummary.total || cfMockReviews.length }})
              </span>
            </div>
            <!-- ===== ■.■.■.■.■.■. 가격 ============================================ -->
            <div style="font-size:1.7rem;font-weight:900;color:var(--blue);margin-bottom:24px;">
              {{ cfDisplayPrice }}
            </div>
            <!-- ===== ■.■.■.■.■.■. 색상 선택 ========================================= -->
            <div style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
                  {{ prod.opt1Nm || '색상' }} 선택
                  <span style="color:var(--blue);margin-left:2px;">
                    *
                  </span>
                </label>
                <span v-if="uiState.selectedColor" style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">
                  {{ uiState.selectedColor.name }}
                </span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <div v-for="c in prod.opt1s" :key="c.name"
                  style="position:relative;display:flex;flex-direction:column;align-items:center;">
                  <button @click="handleSelectAction('options-colorSelect', c)" :title="c.name + (colorStatus(c)==='soldout' ? ' (품절)' : colorStatus(c)==='stop' ? ' (판매중지)' : '')" :style="{ width:'34px',height:'34px',borderRadius:'50%',position:'relative', cursor: colorStatus(c)==='ok' ? 'pointer' : 'not-allowed', background:c.hex || '#e5e7eb', border: uiState.selectedColor?.name===c.name ? '3px solid #fff' : '1px solid rgba(0,0,0,0.18)', boxShadow: uiState.selectedColor?.name===c.name ? '0 0 0 2px var(--blue), 0 2px 8px rgba(22,119,255,0.35)' : '0 1px 2px rgba(0,0,0,0.08)', boxSizing:'border-box',transition:'all .15s', opacity: colorStatus(c)!=='ok' ? '0.4' : '1', }">
                  <svg v-if="uiState.selectedColor?.name===c.name" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="(c.hex ? /^#(f|e|d)/i.test(c.hex) : false) ? '#222' : '#fff'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
                  <polyline points="20 6 9 17 4 12">
                  </polyline>
                </svg>
              </button>
              <span v-if="uiState.selectedColor?.name===c.name" style="font-size:0.62rem;font-weight:700;color:var(--blue);line-height:1;white-space:nowrap;">
              {{ c.name }}
            </span>
            <!-- ===== ■.■.■.■.■.■.■.■.■. 대각선 취소선 (품절/중지) ========================= -->
            <svg v-if="colorStatus(c)!=='ok'" style="position:absolute;top:0;left:0;width:30px;height:30px;pointer-events:none;" viewBox="0 0 30 30">
              <line x1="4" y1="4" x2="26" y2="26" stroke="#ef4444" stroke-width="2" />
            </svg>
            <span v-if="colorStatus(c)==='soldout'" style="position:absolute;top:-8px;right:-10px;font-size:0.5rem;background:#ef4444;color:#fff;padding:1px 3px;border-radius:3px;font-weight:700;line-height:1.2;">
              품절
            </span>
            <span v-else-if="colorStatus(c)==='stop'" style="position:absolute;top:-8px;right:-10px;font-size:0.5rem;background:#9ca3af;color:#fff;padding:1px 3px;border-radius:3px;font-weight:700;line-height:1.2;">
              중지
            </span>
            <!-- ===== ■.■.■.■.■.■.■.■.■. 옵션 가격 delta ============================= -->
            <span v-if="c.priceDelta" style="font-size:0.58rem;font-weight:700;color:var(--blue);white-space:nowrap;line-height:1;">
              +{{ c.priceDelta.toLocaleString('ko-KR') }}
            </span>
          </div>
        </div>
        <div v-if="uiState.colorError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">
          {{ uiState.colorError }}
        </div>
      </div>
      <!-- ===== ■.■.■.■.■.■. 사이즈 선택 (FREE 또는 미설정이면 숨김) ===================== -->
      <div v-if="prod.opt2s?.length ? !(prod.opt2s.length===1 ? prod.opt2s[0]==='FREE' : false) : false" style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
          {{ prod.opt2Nm || '사이즈' }} 선택
          <span style="color:var(--blue);margin-left:2px;">
            *
          </span>
        </label>
        <button @click="handleBtnAction('sizeGuideModal-open')"
                  style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:0.75rem;font-weight:600;padding:0;text-decoration:underline;">
          사이즈 가이드
        </button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <button v-for="s in prod.opt2s" :key="s" @click="handleSelectAction('options-sizeSelect', s)"
                  :style="{
                  padding:'7px 14px',borderRadius:'6px',fontSize:'0.82rem',position:'relative',
                  cursor: sizeStatus(s)==='ok' ? 'pointer' : 'not-allowed',
                  border: uiState.selectedSize===s ? '2px solid var(--blue)' : sizeStatus(s)==='ok' ? '2px solid var(--border)' : '2px solid #e0e0e0',
                  background: uiState.selectedSize===s ? 'var(--blue-dim)' : sizeStatus(s)==='ok' ? 'var(--bg-card)' : '#f5f5f5',
                  color: uiState.selectedSize===s ? 'var(--blue)' : sizeStatus(s)==='ok' ? 'var(--text-secondary)' : '#bbb',
                  fontWeight: uiState.selectedSize===s ? '700' : '500',
                  textDecoration: sizeStatus(s)!=='ok' ? 'line-through' : 'none',
                  opacity: sizeStatus(s)!=='ok' ? '0.7' : '1',
                  transition:'all .15s',
                  }">
          {{ s }}
          <span v-if="getSizeDelta(s)" style="font-size:0.62rem;font-weight:700;color:var(--blue);margin-left:2px;">
            (+{{ getSizeDelta(s).toLocaleString('ko-KR') }})
          </span>
          <span v-if="sizeStatus(s)==='soldout'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#ef4444;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">
            품절
          </span>
          <span v-else-if="sizeStatus(s)==='stop'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#9ca3af;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">
            중지
          </span>
        </button>
      </div>
      <div v-if="uiState.sizeError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">
        {{ uiState.sizeError }}
      </div>
    </div>
    <!-- ===== ■.■.■.■.■.■. 수량 ============================================ -->
    <div style="margin-bottom:20px;">
      <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:10px;">
        수량
      </label>
      <div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content;">
        <button @click="handleBtnAction('qty-dec')" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">
          −
        </button>
        <span style="min-width:44px;text-align:center;font-size:0.9rem;font-weight:700;color:var(--text-primary);">
          {{ uiState.qty }}
        </span>
        <button @click="handleBtnAction('qty-inc')" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">
          +
        </button>
      </div>
    </div>
    <!-- ===== ■.■.■.■.■.■. 선택 요약 ========================================= -->
    <div v-if="uiState.selectedColor||uiState.selectedSize"
              style="background:var(--bg-base);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.82rem;color:var(--text-secondary);line-height:1.9;">
      <div v-if="uiState.selectedColor">
        <span style="font-weight:600;color:var(--text-primary);">
          색상:
        </span>
        {{ uiState.selectedColor.name }}
      </div>
      <div v-if="uiState.selectedSize">
        <span style="font-weight:600;color:var(--text-primary);">
          사이즈:
        </span>
        {{ uiState.selectedSize }}
      </div>
      <div>
        <span style="font-weight:600;color:var(--text-primary);">
          수량:
        </span>
        {{ uiState.qty }}개
      </div>
    </div>
    <!-- ===== ■.■.■.■.■.■. 버튼 ============================================ -->
    <div ref="buyBtnRef" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
      <div style="display:flex;gap:8px;">
        <button class="btn btn_cart" style="flex:1;padding:13px;font-size:0.95rem;" @click="handleBtnAction('cart-add')">
          🛒 장바구니 담기
        </button>
        <button @click="handleBtnAction('prod-toggleLike', prod.prodId)" :title="isLiked?.(prod.prodId) ? '찜 해제' : '찜하기'" :style="{ width:'52px',flexShrink:0,border:'1.5px solid var(--border)',borderRadius:'10px', background: isLiked?.(prod.prodId) ? '#fee2e2' : 'var(--bg-card)', cursor:'pointer',fontSize:'1.3rem',display:'flex',alignItems:'center',justifyContent:'center', transition:'all .15s', }">
        <span :style="{ color: isLiked?.(prod.prodId) ? '#ef4444' : '#9ca3af' }">
        {{ isLiked?.(prod.prodId) ? '♥' : '♡' }}
      </span>
    </button>
  </div>
  <button class="btn btn_buy" style="width:100%;padding:13px;font-size:0.95rem;" @click="handleBtnAction('order-buyNow')">
    ⚡ 바로구매
  </button>
  <button @click="handleBtnAction('page-goContact')"
                style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:4px 0;text-align:center;">
    상품 문의하기
  </button>
</div>
<!-- ===== ■.■.■.■.■.■. 배송 안내 ========================================= -->
<div style="padding-top:14px;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:5px;">
  <div style="display:flex;gap:8px;">
    <span>
      🚚
    </span>
    <span>
      결제 확인 후
      <strong>
        1~2 영업일
      </strong>
      내 출고
    </span>
  </div>
  <div style="display:flex;gap:8px;">
    <span>
      ↩️
    </span>
    <span>
      수령 후
      <strong>
        7일 이내
      </strong>
      교환·반품 가능
    </span>
  </div>
  <div style="display:flex;gap:8px;">
    <span>
      💳
    </span>
    <span>
      결제:
      <strong>
        계좌이체
      </strong>
    </span>
  </div>
</div>
</fo-container>
</div>
<!-- ===== /purchase ================================================== -->
</div>
</div>
<!-- ===== /page-wrap top ============================================= -->
<!-- ===== □.□. ══ 상단: 갤러리 + 구매 옵션 ══ ================================= -->
<!-- ===== ■.■. ══ 탭 바 (스크롤 시 헤더 아래 고정) ══ ============================ -->
<div v-if="uiState.tabFixed" :style="{ height: uiState.tabPlaceholderH + 'px', marginTop:'24px' }">
</div>
<div ref="tabBarRef"
      :style="uiState.tabFixed ? {
      position:'fixed', top:uiState.tabFixedTop+'px', left:uiState.tabFixedLeft+'px', width:uiState.tabFixedW+'px',
      zIndex:55,
      background:'linear-gradient(to bottom, rgba(245,248,253,0.98) 0%, var(--bg-card) 100%)',
      backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)',
      borderBottom:'1px solid var(--border)',
      boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
      } : {
      position:'relative',
      zIndex:50,
      background:'linear-gradient(to bottom, rgba(245,248,253,0.98) 0%, var(--bg-card) 100%)',
      borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)',
      marginTop:'24px',
      }">
  <div class="page-wrap" style="padding-top:0;padding-bottom:0;display:flex;justify-content:center;">
    <button v-for="tab in TABS" :key="tab.id" @click="handleSelectAction('tab-go', tab.id)"
          :style="{
          padding:'13px 22px',background:'none',cursor:'pointer',
          border:'none',
          borderBottom:uiState.activeTab===tab.id?'2px solid var(--blue)':'2px solid transparent',
          color:uiState.activeTab===tab.id?'var(--blue)':'var(--text-secondary)',
          fontWeight:uiState.activeTab===tab.id?'700':'500',
          fontSize:'0.88rem',transition:'all .15s',whiteSpace:'nowrap',
          marginBottom:'-2px',
          }">
      {{ tab.label }}
      <!-- ===== ■.■.■.■.■. 조건부 영역 ========================================== -->
      <span v-if="tab.id==='review' ? (svReviewSummary.total || cfMockReviews.length) : false" :style="{ display:'inline-flex',alignItems:'center',justifyContent:'center', minWidth:'18px',height:'18px',borderRadius:'9px', background:uiState.activeTab==='review'?'var(--blue)':'var(--text-muted)', color:'#fff',fontSize:'0.68rem',fontWeight:'700', marginLeft:'4px',padding:'0 4px',verticalAlign:'middle', }">
      {{ svReviewSummary.total || cfMockReviews.length }}
    </span>
    <span v-if="tab.id==='qna' ? svQnas.length : false" :style="{ display:'inline-flex',alignItems:'center',justifyContent:'center', minWidth:'18px',height:'18px',borderRadius:'9px', background:uiState.activeTab==='qna'?'var(--blue)':'var(--text-muted)', color:'#fff',fontSize:'0.68rem',fontWeight:'700', marginLeft:'4px',padding:'0 4px',verticalAlign:'middle', }">
    {{ svQnas.length }}
  </span>
</button>
</div>
</div>
<!-- ===== □.□. ══ 탭 바 (스크롤 시 헤더 아래 고정) ══ ============================ -->
<!-- ===== ■.■. ══ 탭 섹션들 ══ =========================================== -->
<div style="padding-top:0;">
  <!-- ===== ■.■.■. 상세정보 ================================================ -->
  <div ref="detailSecRef" style="padding-top:32px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
      상세정보
    </div>
    <fo-container card-style="padding:clamp(16px,3vw,28px);margin-bottom:14px;">
      <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">
        📋 상품 설명
      </h2>
      <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.9;margin-bottom:16px;">
        {{ prod.desc }}
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <span v-for="t in prod.tags" :key="t"
              style="padding:4px 12px;background:var(--bg-base);border:1px solid var(--border);border-radius:20px;font-size:0.78rem;color:var(--text-secondary);">
          # {{ t }}
        </span>
      </div>
    </fo-container>
    <!-- ===== ■.■.■.■. BO 등록 상품설명 블록 ===================================== -->
    <fo-container v-if="svContents.length" card-style="padding:clamp(16px,3vw,28px);margin-bottom:14px;">
      <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">
        📝 상세 설명
      </h2>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div v-for="(blk, bi) in svContents" :key="blk?.prodContentId || bi">
          <div v-if="(blk.contentTypeCd||'').toUpperCase()==='HTML'"
                style="font-size:0.9rem;line-height:1.8;color:var(--text-primary);"
                v-html="blk.contentHtml">
          </div>
          <img v-else-if="['IMAGE','FILE'].includes((blk.contentTypeCd||'').toUpperCase())"
                :src="blk.contentHtml" alt="상품설명 이미지"
                style="max-width:100%;height:auto;border-radius:8px;display:block;" />
          <div v-else-if="(blk.contentTypeCd||'').toUpperCase()==='URL'">
            <img v-if="/\.(jpe?g|png|gif|webp|svg)$/i.test(blk.contentHtml||'')"
                  :src="blk.contentHtml" alt="상품설명 이미지"
                  style="max-width:100%;height:auto;border-radius:8px;display:block;" />
            <a v-else :href="blk.contentHtml" target="_blank"
                  style="color:var(--blue);text-decoration:underline;">
              {{ blk.contentHtml }}
            </a>
          </div>
          <div v-else style="font-size:0.9rem;line-height:1.8;color:var(--text-primary);" v-html="blk.contentHtml">
          </div>
        </div>
      </div>
    </fo-container>
    <fo-container card-style="padding:28px;">
      <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">
        🧺 세탁 및 관리
      </h2>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div v-for="item in [
              {icon:'💧',label:'세탁 방법',val:'찬물 손세탁 또는 세탁기 약세탁 권장'},
              {icon:'🌡️',label:'건조 방법',val:'그늘에서 자연 건조 (드라이기 금지)'},
              {icon:'👕',label:'다림질',val:'낮은 온도로 뒤집어 다림질'},
              {icon:'🚫',label:'주의사항',val:'표백제 사용 금지, 드라이클리닝 권장 안함'},
              ]" :key="item.label" style="display:flex;gap:12px;align-items:flex-start;">
          <span style="font-size:1.05rem;flex-shrink:0;width:26px;text-align:center;">
            {{ item.icon }}
          </span>
          <div>
            <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:2px;">
              {{ item.label }}
            </div>
            <div style="font-size:0.87rem;color:var(--text-secondary);">
              {{ item.val }}
            </div>
          </div>
        </div>
      </div>
    </fo-container>
  </div>
  <!-- ===== ■.■.■. 사이즈 ================================================= -->
  <div ref="sizeSecRef" style="padding-top:40px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
      사이즈
    </div>
    <fo-container card-style="padding:28px;">
      <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">
        📏 사이즈 가이드
      </div>
      <!-- ===== ■.■.■.■.■. 목록 영역 =========================================== -->
      <fo-grid bare :columns="columns.sizeGuideGrid" :rows="sizeGuideRows"
            :show-row-no="false" min-width="320px" />
      <p style="margin-top:12px;font-size:0.75rem;color:var(--text-muted);">
        * 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.
      </p>
    </fo-container>
  </div>
  <!-- ===== ■.■.■. 상품평 ================================================= -->
  <div ref="reviewSecRef" style="padding-top:40px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
      <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">
        상품평
      </span>
      <span style="font-size:0.85rem;color:var(--text-muted);font-weight:400;">
        {{ svReviewSummary.total || cfMockReviews.length }}
      </span>
    </div>
    <!-- ===== ■.■.■.■. 평점 요약 ============================================= -->
    <fo-container card-style="padding:24px;margin-bottom:14px;display:flex;gap:32px;align-items:center;flex-wrap:wrap;">
      <div style="text-align:center;flex-shrink:0;min-width:90px;">
        <div style="font-size:3.2rem;font-weight:900;color:var(--text-primary);line-height:1;">
          {{ cfAvgRating }}
        </div>
        <div style="font-size:1rem;margin:6px 0;" v-html="stars(cfAvgRating)">
        </div>
        <div style="font-size:0.76rem;color:var(--text-muted);">
          {{ svReviewSummary.total || cfMockReviews.length }}개 리뷰
        </div>
      </div>
      <div style="flex:1;min-width:180px;">
        <div v-for="d in cfRatingDist" :key="d.star" style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
          <span style="font-size:0.76rem;color:var(--text-muted);width:28px;text-align:right;flex-shrink:0;">
            {{ d.star }}
            <span style="color:#f59e0b;">
              ★
            </span>
          </span>
          <div style="flex:1;height:7px;background:var(--bg-base);border-radius:4px;overflow:hidden;">
            <div :style="{width:d.pct+'%',height:'100%',background:'#f59e0b',borderRadius:'4px'}">
            </div>
          </div>
          <span style="font-size:0.76rem;color:var(--text-muted);width:36px;flex-shrink:0;">
            {{ d.pct }}%
          </span>
        </div>
      </div>
    </fo-container>
    <!-- ===== ■.■.■.■. 포토 리뷰 목록 ========================================== -->
    <fo-container v-if="cfReviewsWithPhoto.length" card-style="padding:20px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">
          포토&동영상 상품평
          <span style="color:var(--blue);">
            {{ cfReviewsWithPhoto.length }}
          </span>
        </span>
        <button @click="handleBtnAction('photoModal-open')"
              style="background:none;border:1px solid var(--border);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:0.78rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
          모아보기
        </button>
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
        <div v-for="r in cfReviewsWithPhoto" :key="r.id"
              @click="handleSelectAction('reviews-photoListRowSelect', r)"
              style="width:80px;height:80px;flex-shrink:0;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);transition:opacity .15s;"
              @mouseenter="$event.currentTarget.style.opacity='.75'"
              @mouseleave="$event.currentTarget.style.opacity='1'">
          <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      </div>
    </fo-container>
    <!-- ===== ■.■.■.■. 정렬 ================================================ -->
    <div style="display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap;">
      <button v-for="f in ['최신순','별점높은순','별점낮은순','도움순']" :key="f"
            @click="handleSelectAction('reviews-filterSelect', f)"
            :style="{
            padding:'5px 14px',border:uiState.reviewFilter===f?'1.5px solid var(--blue)':'1.5px solid var(--border)',
            borderRadius:'20px',cursor:'pointer',fontSize:'0.8rem',
            background:uiState.reviewFilter===f?'var(--blue-dim)':'var(--bg-card)',
            color:uiState.reviewFilter===f?'var(--blue)':'var(--text-secondary)',
            fontWeight:uiState.reviewFilter===f?'700':'400',
            }">
        {{ f }}
      </button>
    </div>
    <!-- ===== ■.■.■.■. 리뷰 목록 ============================================= -->
    <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      <div v-for="(r,i) in cfFilteredReviews" :key="r.id"
            :style="{padding:'20px',borderTop:i===0?'none':'1px solid var(--border)',background:'var(--bg-card)'}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
          <span style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">
            {{ r.maskedName }}
          </span>
          <span style="font-size:0.82rem;" v-html="stars(r.rating)">
          </span>
          <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">
            {{ r.date }}
          </span>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
          <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">
            사이즈: {{ r.sizeInfo }}
          </span>
          <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">
            색상: {{ r.colorInfo }}
          </span>
        </div>
        <div v-if="r.hasPhoto" style="margin-bottom:10px;">
          <div @click="handleSelectAction('reviews-photoListRowSelect', r)"
                style="width:72px;height:72px;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);display:inline-block;">
            <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
          </div>
        </div>
        <p style="font-size:0.87rem;color:var(--text-secondary);line-height:1.75;margin-bottom:10px;">
          {{ r.text }}
        </p>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          도움이 돼요
          <span style="font-weight:700;color:var(--text-secondary);">
            ({{ r.helpful }})
          </span>
        </div>
      </div>
    </div>
  </div>
  <!-- ===== ■.■.■. Q&A ================================================= -->
  <div ref="qnaSecRef" style="padding-top:40px;padding-bottom:20px;">
    <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
      Q&A
      <span style="font-size:0.85rem;font-weight:400;color:var(--text-muted);margin-left:8px;">
        ({{ svQnas.length }})
      </span>
    </div>
    <fo-container v-if="!svQnas.length" card-style="padding:40px;text-align:center;color:var(--text-muted);">
      등록된 Q&A가 없습니다.
    </fo-container>
    <div v-else style="display:flex;flex-direction:column;gap:12px;">
      <fo-container v-for="q in svQnas" :key="q.qnaId"
            card-style="padding:20px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="min-width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#fff;flex-shrink:0;">
            Q
          </div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">
                {{ q.memberId ? q.memberId[0]+'**' : '비회원' }}
              </span>
              <span style="font-size:0.76rem;color:var(--text-muted);">
                {{ String(q.regDate||'').slice(0,10).replace(/-/g,'.') }}
              </span>
            </div>
            <div style="font-size:0.88rem;color:var(--text-primary);line-height:1.6;white-space:pre-wrap;">
              {{ q.qnaTitle || q.qnaContent }}
            </div>
            <div v-if="q.answYn === 'Y' ? q.answContent : false" style="margin-top:12px;padding:12px;background:var(--bg-base);border-radius:8px;display:flex;gap:10px;">
            <div style="min-width:28px;height:28px;border-radius:50%;background:var(--text-muted);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0;">
              A
            </div>
            <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">
              {{ q.answContent }}
            </div>
          </div>
          <div v-else style="margin-top:8px;">
            <span style="font-size:0.76rem;color:var(--text-muted);background:var(--bg-base);padding:3px 8px;border-radius:4px;">
              답변 대기중
            </span>
          </div>
        </div>
      </fo-container>
    </div>
  </div>
</div>
<!-- ===== ■.■.■. 스타일 ================================================= -->
<div ref="styleSecRef" style="padding-top:40px;padding-bottom:20px;">
  <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
    스타일
  </div>
  <fo-container card-style="padding:28px;">
    <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">
      🎨 이런 코디 어때요?
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
      <div v-for="s in styleItems" :key="s.label"
              style="background:var(--bg-base);border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:2rem;margin-bottom:8px;">
          {{ s.emoji }}
        </div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">
          {{ s.label }}
        </div>
        <div style="font-size:0.77rem;color:var(--text-muted);">
          {{ s.desc }}
        </div>
      </div>
    </div>
  </fo-container>
</div>
</div>
<!-- ===== /page-wrap sections ======================================== -->
</template>
<!-- ===== □.□. ══ 탭 섹션들 ══ =========================================== -->
<!-- ===== □. 조건부 영역 ================================================== -->
<!-- ===== ■. ══ 이미지 확대 모달 ══ ========================================= -->
<teleport to="body">
  <div v-if="uiState.zoomOpen ? prod : false" @click="handleBtnAction('zoomModal-close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:1500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
  <!-- ===== ■.■.■. 닫기 ================================================== -->
  <button @click.stop="handleBtnAction('zoomModal-close')"
        style="position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.6);border:2px solid rgba(255,255,255,0.8);color:#fff;font-size:1.4rem;width:48px;height:48px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1510;">
    ✕
  </button>
  <!-- ===== ■.■.■. 메인 확대 이미지 =========================================== -->
  <div @click.stop style="position:relative;width:95vw;height:85vh;border-radius:12px;display:flex;align-items:center;justify-content:center;">
    <img v-if="cfMockImages[uiState.selectedImg]?.src" :src="cfMockImages[uiState.selectedImg].src" :alt="prod.prodNm"
          style="max-width:95vw;max-height:85vh;object-fit:contain;display:block;" />
    <!-- ===== ■.■.■.■. 좌/우 화살표 =========================================== -->
    <button @click.stop="handleBtnAction('gallery-prev')"
          style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6">
        </polyline>
      </svg>
    </button>
    <button @click.stop="handleBtnAction('gallery-next')"
          style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6">
        </polyline>
      </svg>
    </button>
  </div>
  <!-- ===== ■.■.■. 하단 썸네일 ============================================== -->
  <div @click.stop style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2;">
    <div v-for="(img,i) in cfMockImages" :key="i" @click.stop="handleSelectAction('gallery-rowSelect', i)"
          :style="{ width:'56px', height:'56px', borderRadius:'8px', overflow:'hidden', cursor:'pointer',
          border: uiState.selectedImg===i ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)' }">
      <img :src="img.src" style="width:100%;height:100%;object-fit:cover;" />
    </div>
  </div>
</div>
</teleport>
<!-- ===== □. ══ 이미지 확대 모달 ══ ========================================= -->
<!-- ===== ■. ══ 포토 전체 팝업 ══ ========================================== -->
<teleport to="body">
  <div v-if="uiState.photoPopupOpen ? prod : false" @click.self="handleBtnAction('photoModal-close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1500;display:flex;align-items:center;justify-content:center;padding:20px;">
  <!-- ===== ■.■.■. 좌 화살표 =============================================== -->
  <button v-if="cfPhotoGridPageCount > 1" @click="handleBtnAction('photoGrid-prev')"
        style="position:fixed;left:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
      <polyline points="15 18 9 12 15 6">
      </polyline>
    </svg>
  </button>
  <div @click.stop style="background:var(--bg-card);border-radius:16px;width:100%;max-width:720px;max-height:85vh;overflow-y:auto;padding:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">
        포토&동영상 상품평 {{ cfReviewsWithPhoto.length }}
      </span>
      <button @click="handleBtnAction('photoModal-close')" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">
        ✕
      </button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
      <div v-for="r in cfPhotoGridItems" :key="r.id"
            @click="handleSelectAction('reviews-photoGridRowSelect', r)"
            style="aspect-ratio:1;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);transition:opacity .15s;"
            @mouseenter="$event.currentTarget.style.opacity='.75'"
            @mouseleave="$event.currentTarget.style.opacity='1'">
        <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>
    <!-- ===== ■.■.■.■. 페이지네이션 ============================================ -->
    <div v-if="cfPhotoGridPageCount > 1" style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:20px;">
      <button v-for="p in cfPhotoGridPageCount" :key="p" @click="handleSelectAction('photoGrid-rowGo', p)"
            :style="{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid var(--border)', background: uiState.photoGridPage===p ? 'var(--text-primary)' : 'var(--bg-card)', color: uiState.photoGridPage===p ? '#fff' : 'var(--text-secondary)', cursor:'pointer', fontSize:'0.85rem', fontWeight: uiState.photoGridPage===p ? 700 : 400 }">
        {{ p }}
      </button>
    </div>
  </div>
  <!-- ===== ■.■.■. 우 화살표 =============================================== -->
  <button v-if="cfPhotoGridPageCount > 1" @click="handleBtnAction('photoGrid-next')"
        style="position:fixed;right:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
      <polyline points="9 18 15 12 9 6">
      </polyline>
    </svg>
  </button>
</div>
</teleport>
<!-- ===== □. ══ 포토 전체 팝업 ══ ========================================== -->
<!-- ===== ■. ══ 포토 리뷰 개별 팝업 ══ ======================================= -->
<teleport to="body">
  <div v-if="uiState.selectedReview ? prod : false" @click.self="handleBtnAction('photoDetail-close')" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1501;display:flex;align-items:center;justify-content:center;padding:20px;">
  <!-- ===== ■.■.■. 좌 화살표 =============================================== -->
  <button @click="handleBtnAction('photoDetail-prev')"
        style="position:fixed;left:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
      <polyline points="15 18 9 12 15 6">
      </polyline>
    </svg>
  </button>
  <!-- ===== ■.■.■. 본문 ================================================== -->
  <div style="background:var(--bg-card);border-radius:16px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;padding:24px;position:relative;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">
        포토&동영상 상품평
        <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400;margin-left:6px;">
          {{ cfPhotoNavIdx + 1 }} / {{ cfReviewsWithPhoto.length }}
        </span>
      </span>
      <button @click="handleBtnAction('photoDetail-close')"
            style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">
        ✕
      </button>
    </div>
    <div style="border-radius:12px;overflow:hidden;border:1px solid var(--border);aspect-ratio:1/1;margin-bottom:20px;background:var(--bg-base);">
      <img :src="uiState.selectedReview.photoImg" style="width:100%;height:100%;object-fit:contain;" />
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">
        {{ uiState.selectedReview.maskedName }}
      </span>
      <span style="font-size:0.85rem;" v-html="stars(uiState.selectedReview.rating)">
      </span>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">
        {{ uiState.selectedReview.date }}
      </span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">
        사이즈: {{ uiState.selectedReview.sizeInfo }}
      </span>
      <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">
        색상: {{ uiState.selectedReview.colorInfo }}
      </span>
    </div>
    <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">
      {{ uiState.selectedReview.text }}
    </p>
    <div style="font-size:0.78rem;color:var(--text-muted);">
      도움이 돼요
      <span style="font-weight:700;color:var(--text-secondary);">
        ({{ uiState.selectedReview.helpful }})
      </span>
    </div>
  </div>
  <!-- ===== ■.■.■. 우 화살표 =============================================== -->
  <button @click="handleBtnAction('photoDetail-next')"
        style="position:fixed;right:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
      <polyline points="9 18 15 12 9 6">
      </polyline>
    </svg>
  </button>
</div>
</teleport>
<!-- ===== □. ══ 포토 리뷰 개별 팝업 ══ ======================================= -->
<!-- ===== ■. ══ 사이즈 가이드 모달 ══ ======================================== -->
<fo-modal :show="uiState.showSizeGuide" title="📏 사이즈 가이드" width="480px" modal-name="size-guide" :on-callback="fnCallbackModal">
  <!-- ===== ■.■. 목록 영역 ================================================= -->
  <fo-grid bare :columns="sizeGuideColsShort" :rows="sizeGuideRows" :show-row-no="false" />
  <p style="margin-top:14px;font-size:0.75rem;color:var(--text-muted);">
    * 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.
  </p>
  <button class="btn btn_confirm" @click="handleBtnAction('sizeGuideModal-close')" style="width:100%;margin-top:16px;padding:10px;">
    확인
  </button>
</fo-modal>
<!-- ===== □.□. 목록 영역 ================================================= -->
<!-- ===== □. ══ 사이즈 가이드 모달 ══ ======================================== -->
<!-- ===== ■. ══ 고정 하단 바 ══ =========================================== -->
<div v-if="prod ? uiState.showBottomBar : false" style="position:fixed;bottom:0;left:0;right:0;z-index:100;padding:10px 24px;display:flex;justify-content:center;align-items:center;background:linear-gradient(to top, var(--bg-card) 0%, rgba(245,248,255,0.98) 100%);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--border);box-shadow:0 -4px 18px rgba(80,100,160,0.08);">
<div style="display:flex;align-items:center;gap:10px;max-width:760px;width:100%;">
  <div style="flex:1;min-width:0;overflow:hidden;">
    <div style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
      {{ prod.prodNm }}
    </div>
    <div style="font-size:1.05rem;font-weight:900;color:var(--blue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
      {{ cfDisplayPrice }}
    </div>
  </div>
  <div style="display:flex;gap:4px;flex-shrink:0;">
    <button class="btn btn_cart" style="padding:10px 16px;font-size:0.88rem;white-space:nowrap;" @click="handleBtnAction('quickBuy-openCart')">
      담기
    </button>
    <button class="btn btn_buy"    style="padding:10px 16px;font-size:0.88rem;white-space:nowrap;" @click="handleBtnAction('quickBuy-openBuy')">
      구매하기
    </button>
  </div>
</div>
</div>
<!-- ===== □. ══ 고정 하단 바 ══ =========================================== -->
<!-- ===== ■. ══ 바로구매 드로어 (우측) ══ ===================================== -->
<template v-if="uiState.quickBuyOpen ? prod : false">
<!-- ===== ■.■. 딤 오버레이 ================================================ -->
<div @click="handleBtnAction('quickBuy-close')"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:150;transition:opacity .25s;">
</div>
<!-- ===== ■.■. 드로어 패널 ================================================ -->
<div style="position:fixed;top:0;right:0;bottom:0;width:360px;max-width:92vw;z-index:151;background:var(--bg-card);box-shadow:-8px 0 32px rgba(0,0,0,0.14);display:flex;flex-direction:column;overflow:hidden;">
  <!-- ===== ■.■.■. 헤더 ================================================== -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border);flex-shrink:0;">
    <span style="font-size:0.9rem;font-weight:800;color:var(--text-primary);">
      {{ uiState.drawerMode==='cart' ? '🛒 장바구니 담기' : '⚡ 바로구매' }}
    </span>
    <button @click="handleBtnAction('quickBuy-close')" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-muted);line-height:1;padding:0;">
      ✕
    </button>
  </div>
  <!-- ===== ■.■.■. 스크롤 영역 ============================================== -->
  <div style="flex:1;overflow-y:auto;padding:20px;">
    <!-- ===== ■.■.■.■. 색상 ================================================ -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
          {{ prod.opt1Nm || '색상' }}
          <span style="color:var(--blue);margin-left:2px;">
            *
          </span>
        </span>
        <span v-if="uiState.selectedColor" style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">
          {{ uiState.selectedColor.name }}
        </span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        <div v-for="c in prod.opt1s" :key="c.name"
              style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <button @click="handleSelectAction('options-colorSelect', c)" :title="c.name" :style="{ width:'34px',height:'34px',borderRadius:'50%',position:'relative', cursor: colorStatus(c)==='ok' ? 'pointer' : 'not-allowed', background:c.hex || '#e5e7eb', border: uiState.selectedColor?.name===c.name ? '3px solid #fff' : '1px solid rgba(0,0,0,0.18)', boxShadow: uiState.selectedColor?.name===c.name ? '0 0 0 2px var(--blue), 0 2px 8px rgba(22,119,255,0.35)' : '0 1px 2px rgba(0,0,0,0.08)', boxSizing:'border-box',transition:'all .15s', opacity: colorStatus(c)!=='ok' ? '0.4' : '1', }">
          <svg v-if="uiState.selectedColor?.name===c.name" width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="(c.hex ? /^#(f|e|d)/i.test(c.hex) : false) ? '#222' : '#fff'" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;">
          <polyline points="20 6 9 17 4 12">
          </polyline>
        </svg>
      </button>
      <svg v-if="colorStatus(c)!=='ok'" style="position:absolute;top:4px;left:4px;width:34px;height:34px;pointer-events:none;" viewBox="0 0 34 34">
        <line x1="5" y1="5" x2="29" y2="29" stroke="#ef4444" stroke-width="2" />
      </svg>
      <!-- ===== ■.■.■.■.■.■.■. 옵션 가격 delta ================================= -->
      <span v-if="c.priceDelta" style="font-size:0.58rem;font-weight:700;color:var(--blue);white-space:nowrap;line-height:1;">
        +{{ c.priceDelta.toLocaleString('ko-KR') }}
      </span>
    </div>
  </div>
  <div v-if="uiState.colorError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">
    {{ uiState.colorError }}
  </div>
</div>
<!-- ===== ■.■.■.■. 사이즈 (FREE면 숨김) ==================================== -->
<div v-if="prod.opt2s?.length ? !(prod.opt2s.length===1 ? prod.opt2s[0]==='FREE' : false) : false" style="margin-bottom:20px;">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
  <div style="display:flex;align-items:center;gap:6px;">
    <span :style="{ fontSize:'0.82rem', fontWeight:'600', color: uiState.sizeError ? '#ef4444' : 'var(--text-secondary)' }">
      {{ prod.opt2Nm || '사이즈' }}
      <span style="margin-left:2px;">
        *
      </span>
    </span>
    <span v-if="uiState.sizeError" style="font-size:0.75rem;color:#ef4444;font-weight:500;">
      필수 선택
    </span>
  </div>
  <button @click="handleBtnAction('sizeGuideModal-open')" style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:0.75rem;font-weight:600;padding:0;text-decoration:underline;">
    사이즈 안내
  </button>
</div>
<div :style="{
            display:'flex', flexWrap:'wrap', gap:'6px', padding:'8px',
            border: uiState.sizeError ? '1px solid #ef4444' : '1px solid transparent',
            borderRadius:'6px', transition:'border-color .2s',
            }">
  <button v-for="s in prod.opt2s" :key="s" @click="handleSelectAction('options-sizeSelect', s)"
              :style="{
              padding:'7px 16px',borderRadius:'6px',fontSize:'0.82rem',position:'relative',
              cursor: sizeStatus(s)==='ok' ? 'pointer' : 'not-allowed',
              border: uiState.selectedSize===s ? '2px solid var(--blue)' : sizeStatus(s)==='ok' ? '2px solid var(--border)' : '2px solid #e0e0e0',
              background: uiState.selectedSize===s ? 'var(--blue-dim)' : sizeStatus(s)==='ok' ? 'var(--bg-base)' : '#f5f5f5',
              color: uiState.selectedSize===s ? 'var(--blue)' : sizeStatus(s)==='ok' ? 'var(--text-secondary)' : '#bbb',
              fontWeight: uiState.selectedSize===s ? '700' : '500',
              textDecoration: sizeStatus(s)!=='ok' ? 'line-through' : 'none',
              opacity: sizeStatus(s)!=='ok' ? '0.7' : '1',
              }">
    {{ s }}
    <span v-if="getSizeDelta(s)" style="font-size:0.62rem;font-weight:700;color:var(--blue);margin-left:2px;">
      (+{{ getSizeDelta(s).toLocaleString('ko-KR') }})
    </span>
    <span v-if="sizeStatus(s)==='soldout'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#ef4444;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">
      품절
    </span>
    <span v-else-if="sizeStatus(s)==='stop'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#9ca3af;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">
      중지
    </span>
  </button>
</div>
</div>
<!-- ===== ■.■.■.■. 수량 ================================================ -->
<div style="margin-bottom:24px;">
  <span style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:10px;">
    수량
  </span>
  <div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content;">
    <button @click="handleBtnAction('qty-dec')" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">
      −
    </button>
    <span style="min-width:44px;text-align:center;font-size:0.9rem;font-weight:700;color:var(--text-primary);">
      {{ uiState.qty }}
    </span>
    <button @click="handleBtnAction('qty-inc')" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">
      +
    </button>
  </div>
</div>
<!-- ===== ■.■.■.■. 선택 요약 ============================================= -->
<div v-if="uiState.selectedColor||uiState.selectedSize"
          style="background:var(--bg-base);border-radius:8px;padding:12px 14px;font-size:0.82rem;color:var(--text-secondary);line-height:1.9;border:1px solid var(--border);">
  <div v-if="uiState.selectedColor">
    <span style="font-weight:600;color:var(--text-primary);">
      색상:
    </span>
    {{ uiState.selectedColor.name }}
  </div>
  <div v-if="uiState.selectedSize">
    <span style="font-weight:600;color:var(--text-primary);">
      사이즈:
    </span>
    {{ uiState.selectedSize }}
  </div>
  <div>
    <span style="font-weight:600;color:var(--text-primary);">
      수량:
    </span>
    {{ uiState.qty }}개
  </div>
</div>
</div>
<!-- ===== ■.■.■. 하단: 총액 + 버튼 ========================================= -->
<div style="flex-shrink:0;padding:16px 20px;border-top:1px solid var(--border);">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <span style="font-size:0.85rem;color:var(--text-muted);">
      총 주문금액
    </span>
    <span style="font-size:1.2rem;font-weight:900;color:var(--blue);">
      {{ cfQuickBuyTotal }}
    </span>
  </div>
  <button v-if="uiState.drawerMode==='cart'" class="btn btn_cart" style="width:100%;padding:14px;font-size:0.95rem;font-weight:700;" @click="handleBtnAction('cart-addFromDrawer')">
    🛒 장바구니 담기
  </button>
  <button v-else class="btn btn_buy" style="width:100%;padding:14px;font-size:0.95rem;font-weight:700;" @click="handleBtnAction('order-buyNow')">
    ⚡ 바로구매
  </button>
</div>
</div>
</template>
</fo-page>
<!-- ===== □.□. 드로어 패널 ================================================ -->
<!-- ===== □. ══ 바로구매 드로어 (우측) ══ ===================================== -->
`,
};
