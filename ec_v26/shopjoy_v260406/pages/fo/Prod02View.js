/* ShopJoy - Prod01View (상품 상세 리뉴얼) */
window.Prod02View = {
  name: "Prod02View",
  props: ['navigate', 'config', 'product', 'addToCart', 'showToast', 'showAlert', 'toggleLike', 'isLiked'],
  setup(props) {
    const { ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

    /* ── 이미지 갤러리 ── */
    const selectedImg = ref(0);
    const zoomOpen    = ref(false);

    /* ── 구매 옵션 ── */
    const selectedColor = ref(null);
    const selectedSize  = ref(null);
    const qty           = ref(1);
    const colorError    = ref('');
    const sizeError     = ref('');
    const showSizeGuide = ref(false);

    /* ── 탭 ── */
    const TABS = [
      { id: 'detail', label: '상세정보' },
      { id: 'size',   label: '사이즈' },
      { id: 'review', label: '상품평' },
      { id: 'style',  label: '스타일' },
    ];
    const activeTab    = ref('detail');
    const tabBarRef    = ref(null);
    const buyBtnRef    = ref(null);
    const showBottomBar = ref(false);
    const detailSecRef = ref(null);
    const sizeSecRef   = ref(null);
    const reviewSecRef = ref(null);
    const styleSecRef  = ref(null);

    /* ── 상품평 ── */
    const reviewFilter   = ref('최신순');
    const photoPopupOpen = ref(false);
    const selectedReview = ref(null);
    const photoGridPage = ref(1);
    const photoGridPageSize = 12;

    /* ── 사이즈 가이드 ── */
    const sizeGuideRows = [
      ['XS', '36', '82', '60'],
      ['S',  '38', '86', '62'],
      ['M',  '40', '90', '64'],
      ['L',  '42', '96', '66'],
      ['XL', '44', '102','68'],
      ['XXL','46', '108','70'],
    ];

    /* ── 스타일 추천 ── */
    const styleItems = [
      { emoji: '👖', label: '캐주얼 룩',  desc: '데님 팬츠 + 스니커즈' },
      { emoji: '👗', label: '페미닌 룩',  desc: '플로럴 스커트와 매치' },
      { emoji: '🧥', label: '레이어드 룩', desc: '오버핏 자켓과 함께' },
      { emoji: '👟', label: '스포티 룩',  desc: '트랙 팬츠 + 스니커즈' },
    ];

    /* ── 이미지 목록 (선택 색상별 교체) ── */
    const _IMG = 'assets/cdn/prod/img/shop/product';
    const _buildColorImages = (p, colorIdx) => {
      const id = p.productId || 1;
      const base = id <= 12 ? 'fashion' : 'product';
      if (base === 'fashion') {
        /* fashion 이미지 3장씩 순환: colorIdx 기준 오프셋 */
        const startIdx = ((id - 1) * 3 + colorIdx * 3) % 12 + 1;
        return [1,2,3].map(offset => {
          const n = ((startIdx - 1 + offset - 1) % 12) + 1;
          return { src: `${_IMG}/fashion/fashion-${n}.webp`, label: '이미지 ' + offset };
        });
      }
      /* product png: 3장씩 순환 */
      const startIdx = ((id - 1) * 3 + colorIdx * 2) % 23 + 1;
      return [0,1,2].map(offset => {
        const n = ((startIdx - 1 + offset) % 23) + 1;
        return { src: `${_IMG}/product_${n}.png`, label: '이미지 ' + (offset + 1) };
      });
    };

    const mockImages = computed(() => {
      const p = props.product;
      if (!p) return [];
      const opt1s = p.opt1s || [];
      const colorIdx = opt1s.findIndex(c => c.name === selectedColor.value?.name);
      return _buildColorImages(p, Math.max(0, colorIdx));
    });

    /* ── 가상 리뷰 ── */
    const MOCK_NAMES = ['김민지','이수진','박지현','정다운','최예린','강하늘','윤서연','오지은','임채원','한소희'];
    const MOCK_COMMENTS = [
      '생각보다 훨씬 예뻐요! 색감도 사진이랑 같고 소재도 정말 좋아요. 재구매 의사 있어요.',
      '배송도 빠르고 상품 품질이 너무 좋아요. 착용감이 편하고 핏이 예쁘게 나와요.',
      '사진보다 실제로 더 예쁜 것 같아요. 선물용으로 샀는데 상대방도 너무 좋아했어요.',
      '소재가 고급스럽고 마감이 깔끔해요. 세탁 후에도 형태가 잘 유지됩니다.',
      '핏이 너무 이뻐요! 처음엔 사이즈 고민했는데 평소 사이즈 딱 맞게 왔어요.',
      '색이 진짜 예뻐서 매일 입고 싶어요. 여름에 입기 딱 좋은 소재입니다.',
      '가격 대비 퀄리티가 정말 좋아요. 주변에서도 어디서 샀냐고 많이 물어봐요.',
      '다음에도 또 구매할 것 같아요. 배송도 빠르고 포장도 꼼꼼하게 되어 있었어요.',
      '입어보니 핏이 정말 이쁘고 소재도 좋아요. 여러 색상 다 사고 싶네요.',
      '기대보다 훨씬 마음에 들어요. 실제 착용해보니 사진보다 더 예쁜 것 같아요.',
    ];

    const mockReviews = computed(() => {
      const p = props.product;
      if (!p) return [];
      const pid    = p.productId || 1;
      const colors = p.opt1s || [];
      const sizes  = p.opt2s  || ['S', 'M', 'L'];
      return MOCK_NAMES.map((name, i) => {
        const seed  = (pid * 7 + i * 13) % 10;
        const cIdx  = (pid + i) % Math.max(1, colors.length);
        const month = String(Math.min(9, 1 + (i % 4) + (pid % 3))).padStart(2, '0');
        const day   = String(5 + (seed * 3) % 22).padStart(2, '0');
        return {
          id:         i + 1,
          maskedName: name[0] + '*' + (name.length > 2 ? name.slice(-1) : '*'),
          rating:     seed < 6 ? 5 : seed < 9 ? 4 : 3,
          date:       `2026.${month}.${day}`,
          sizeInfo:   sizes[i % sizes.length],
          colorInfo:  colors[cIdx]?.name || '기본',
          text:       MOCK_COMMENTS[i],
          hasPhoto:   i < 5,
          photoImg:   `assets/cdn/prod/img/shop/product/sm/pro-sm-${(i % 10) + 1}.jpg`,
          photoHex:   colors[cIdx]?.hex || '#e8587a',
          helpful:    (pid * 3 + i * 7) % 38,
        };
      });
    });

    const reviewsWithPhoto = computed(() => mockReviews.value.filter(r => r.hasPhoto));

    const filteredReviews = computed(() => {
      const list = [...mockReviews.value];
      if (reviewFilter.value === '별점높은순') return list.sort((a, b) => b.rating - a.rating);
      if (reviewFilter.value === '별점낮은순') return list.sort((a, b) => a.rating - b.rating);
      if (reviewFilter.value === '도움순')     return list.sort((a, b) => b.helpful - a.helpful);
      return list;
    });

    const avgRating = computed(() => {
      const r = mockReviews.value;
      return r.length ? (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1) : '0.0';
    });

    const ratingDist = computed(() =>
      [5, 4, 3, 2, 1].map(star => ({
        star,
        count: mockReviews.value.filter(x => x.rating === star).length,
        pct:   mockReviews.value.length
          ? Math.round(mockReviews.value.filter(x => x.rating === star).length / mockReviews.value.length * 100)
          : 0,
      }))
    );

    /* ── 별점 렌더 ── */
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

    /* ── 탭 고정 + 스크롤 ── */
    let scrollEl = null;
    const getScrollEl = () => scrollEl || (scrollEl = document.querySelector('.layout-main')) || window;

    const tabFixed     = ref(false);
    const tabFixedTop  = ref(0);
    const tabFixedLeft = ref(0);
    const tabFixedW    = ref(0);
    const tabPlaceholderH = ref(0);
    let tabNaturalScrollTop = 0;   // 탭바가 fixed 되기 직전의 scrollTop

    const updateTabFixedPos = () => {
      const main = getScrollEl();
      if (!main.getBoundingClientRect) return;
      const r = main.getBoundingClientRect();
      tabFixedTop.value  = r.top;
      tabFixedLeft.value = r.left;
      tabFixedW.value    = r.width;
    };

    const scrollToTab = (tabId) => {
      const map = { detail: detailSecRef, size: sizeSecRef, review: reviewSecRef, style: styleSecRef };
      const el  = map[tabId]?.value;
      if (!el) return;
      const main = getScrollEl();
      const mainRect = main.getBoundingClientRect ? main.getBoundingClientRect() : { top: 0 };
      const barH = tabBarRef.value?.offsetHeight || 44;
      /* 탭바 fixed 시: mainRect.top + barH 만큼 오프셋 필요 */
      const offset = tabFixed.value ? barH + 8 : barH + 8;
      const elTop = el.getBoundingClientRect().top - mainRect.top;
      const top = main.scrollTop + elTop - offset;
      main.scrollTo({ top, behavior: 'smooth' });
      activeTab.value = tabId;
    };

    const onScroll = () => {
      const main = getScrollEl();
      const bar  = tabBarRef.value;
      if (!bar || !main.getBoundingClientRect) return;

      const mainTop = main.getBoundingClientRect().top;

      /* ── fixed 전환 ── */
      if (!tabFixed.value) {
        if (bar.getBoundingClientRect().top <= mainTop) {
          tabPlaceholderH.value = bar.offsetHeight;
          tabNaturalScrollTop   = main.scrollTop;
          updateTabFixedPos();
          tabFixed.value = true;
        }
      } else {
        if (main.scrollTop < tabNaturalScrollTop) {
          tabFixed.value = false;
        }
      }

      /* ── 하단 바 표시: 구매 버튼이 화면 밖으로 나가면 표시 ── */
      const btn = buyBtnRef.value;
      showBottomBar.value = btn ? btn.getBoundingClientRect().bottom < mainTop : false;

      /* ── 활성 탭 ── */
      const barH = bar.offsetHeight || 44;
      const anchor = tabFixed.value
        ? tabFixedTop.value + barH + 20   /* fixed: 탭바 하단 기준 */
        : bar.getBoundingClientRect().bottom + 10;
      const sections = [
        { id: 'style',  ref: styleSecRef },
        { id: 'review', ref: reviewSecRef },
        { id: 'size',   ref: sizeSecRef },
        { id: 'detail', ref: detailSecRef },
      ];
      for (const s of sections) {
        if (s.ref.value && s.ref.value.getBoundingClientRect().top <= anchor) {
          activeTab.value = s.id;
          break;
        }
      }
    };

    /* ── 드로어 상태 (anyModalOpen 보다 먼저 선언 필요) ── */
    const quickBuyOpen = ref(false);
    const drawerMode   = ref('buy'); // 'buy' | 'cart'

    /* ── 모달 공통 닫기 (ESC / 뒤로가기) ── */
    const anyModalOpen = () =>
      zoomOpen.value || photoPopupOpen.value || !!selectedReview.value ||
      showSizeGuide.value || quickBuyOpen.value;
    const closeAllModals = () => {
      zoomOpen.value = false;
      photoPopupOpen.value = false;
      selectedReview.value = null;
      showSizeGuide.value = false;
      quickBuyOpen.value = false;
    };
    const onKeydown = (e) => {
      if (e.key === 'Escape' && anyModalOpen()) {
        e.preventDefault();
        closeAllModals();
      }
    };
    const onPopState = () => {
      if (anyModalOpen()) closeAllModals();
    };
    watch(anyModalOpen, (open, prev) => {
      if (open && !prev) {
        try { history.pushState({ modal: true }, ''); } catch (_) {}
      }
    });

    onMounted(() => {
      const main = getScrollEl();
      main.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('keydown', onKeydown);
      window.addEventListener('popstate', onPopState);
      /* 품절/중지 아닌 첫 색상 자동 선택 */
      const firstAvail = (props.product?.opt1s || []).find(c => colorStatus(c) === 'ok');
      if (firstAvail) selectedColor.value = firstAvail;
    });
    onBeforeUnmount(() => {
      const main = getScrollEl();
      main.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('popstate', onPopState);
    });

    watch(() => props.product, (p) => {
      selectedColor.value = (p?.opt1s || []).find(c => colorStatus(c) === 'ok') || null;
      selectedSize.value  = null;
      qty.value           = 1;
      selectedImg.value   = 0;
      activeTab.value     = 'detail';
      quickBuyOpen.value  = false;
      tabFixed.value      = false;
      getScrollEl().scrollTo(0, 0);
    });

    /* ── 카테고리 라벨 ── */
    const categoryLabel = p => {
      if (!p) return '';
      return (props.config?.categorys || []).find(c => c.categoryId === p.categoryId)?.categoryNm || p.categoryId || '';
    };

    /* ── 옵션 재고 상태 (목업: 색상 + 사이즈) ── */
    const colorStockMap = computed(() => {
      const p = props.product;
      if (!p) return {};
      const opt1s = p.opt1s || [];
      const pid = p.productId || 1;
      const map = {};
      opt1s.forEach((c, i) => {
        const seed = (pid * 11 + i * 17) % 25;
        if (seed === 0)      map[c.name] = 'stop';
        else if (seed === 1) map[c.name] = 'soldout';
        else                 map[c.name] = 'ok';
      });
      return map;
    });
    const colorStatus = (c) => colorStockMap.value[c?.name] || 'ok';

    const sizeStockMap = computed(() => {
      const p = props.product;
      if (!p) return {};
      const sizes = p.opt2s || [];
      const pid = p.productId || 1;
      const map = {};
      sizes.forEach((s, i) => {
        const seed = (pid * 7 + i * 13) % 20;
        if (seed === 0)      map[s] = 'stop';
        else if (seed === 1) map[s] = 'soldout';
        else                 map[s] = 'ok';
      });
      return map;
    });
    const sizeStatus = (s) => sizeStockMap.value[s] || 'ok';

    /* ── 옵션별 가격 ── */
    const basePrice = computed(() => {
      const numStr = String(props.product?.price || '').replace(/[^0-9]/g, '');
      return Number(numStr) || 0;
    });

    /* opt2Prices에서 사이즈 delta 조회 */
    const getSizeDelta = (sizeName) => (props.product?.opt2Prices || {})[sizeName] || 0;

    /* 선택된 색상+사이즈의 최종 단가 */
    const selectedUnitPrice = computed(() => {
      const colorDelta = selectedColor.value?.priceDelta || 0;
      const sizeDelta  = getSizeDelta(selectedSize.value);
      return basePrice.value + colorDelta + sizeDelta;
    });

    /* 모든 옵션 조합의 최소~최대 가격 범위 */
    const priceRange = computed(() => {
      const p = props.product;
      if (!p || !basePrice.value) return null;
      const colorDeltas = (p.opt1s || []).map(c => c.priceDelta || 0);
      const sizeDeltas  = Object.values(p.opt2Prices || {}).concat([0]);
      const prices = [];
      colorDeltas.forEach(cd => sizeDeltas.forEach(sd => prices.push(basePrice.value + cd + sd)));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? null : { min, max };
    });

    /* 표시 가격:
       - 색상+사이즈 모두 선택 → 정확한 가격
       - 색상만 선택          → 색상가격 (사이즈 delta 존재 시 범위)
       - 미선택               → 전체 범위 또는 기본가 */
    const displayPrice = computed(() => {
      const p = props.product;
      if (!p || !basePrice.value) return p?.price || '';

      const colorDelta = selectedColor.value?.priceDelta || 0;
      const sizeDelta  = getSizeDelta(selectedSize.value);
      const hasSizeDelta = Object.keys(p.opt2Prices || {}).length > 0;

      /* 색상+사이즈 모두 선택 */
      if (selectedColor.value && selectedSize.value) {
        return (basePrice.value + colorDelta + sizeDelta).toLocaleString('ko-KR') + '원';
      }

      /* 색상만 선택 */
      if (selectedColor.value) {
        const colorPrice = basePrice.value + colorDelta;
        if (hasSizeDelta) {
          const maxSD = Math.max(...Object.values(p.opt2Prices));
          return colorPrice.toLocaleString('ko-KR') + '원 ~ ' + (colorPrice + maxSD).toLocaleString('ko-KR') + '원';
        }
        return colorPrice.toLocaleString('ko-KR') + '원';
      }

      /* 미선택: 전체 범위 표시 */
      if (priceRange.value) {
        return priceRange.value.min.toLocaleString('ko-KR') + '원 ~ ' + priceRange.value.max.toLocaleString('ko-KR') + '원';
      }
      return p.price;
    });

    /* 바로구매 총 금액 */
    const quickBuyTotal = computed(() => {
      if (!props.product) return '';
      if (!selectedUnitPrice.value) return props.product.price;
      const total = selectedUnitPrice.value * qty.value;
      return total.toLocaleString('ko-KR') + '원';
    });

    /* ── 구매 로직 ── */
    const selectColor = c => {
      const st = colorStatus(c);
      if (st === 'stop' || st === 'soldout') return;
      selectedColor.value = c; colorError.value = ''; selectedImg.value = 0;
    };
    const selectSize  = s => {
      const st = sizeStatus(s);
      if (st === 'stop' || st === 'soldout') return;
      selectedSize.value = s; sizeError.value = '';
    };

    const validate = () => {
      let ok = true;
      if (!selectedColor.value) { colorError.value = '색상을 선택해주세요.'; ok = false; }
      /* 사이즈 FREE 또는 미설정이면 자동 선택 */
      const sizes = props.product?.opt2s || [];
      if (!selectedSize.value) {
        if (sizes.length === 1 && sizes[0] === 'FREE') { selectedSize.value = 'FREE'; }
        else if (sizes.length === 0) { selectedSize.value = 'FREE'; }
        else { sizeError.value = '사이즈를 선택해주세요.'; ok = false; }
      }
      return ok;
    };

    const handleAddToCart = () => {
      if (!validate()) return;
      props.addToCart(props.product, selectedColor.value, selectedSize.value, qty.value);
      selectedColor.value = props.product?.opt1s?.[0] || null;
      selectedSize.value  = null;
      qty.value = 1;
    };

    /* 바로구매: 현재 상품 정보를 파라메터로 전달 (장바구니 미변경) */
    const execBuyNow = () => {
      if (!validate()) return;
      quickBuyOpen.value = false;
      props.navigate('order', {
        instantOrder: {
          product: props.product,
          color: selectedColor.value,
          size: selectedSize.value,
          qty: qty.value,
        }
      });
    };

    /* 드로어 장바구니 담기 */
    const execCartFromDrawer = () => {
      if (!validate()) return;
      props.addToCart(props.product, selectedColor.value, selectedSize.value, qty.value);
      quickBuyOpen.value = false;
      selectedColor.value = props.product?.opt1s?.[0] || null;
      selectedSize.value  = null;
      qty.value = 1;
    };

    /* 메인 패널 "바로 구매하기" → 바로구매 실행 */
    const handleBuyNow = () => execBuyNow();

    /* 하단 바 "바로구매" → 드로어 열기 */
    const openQuickBuy  = () => { drawerMode.value = 'buy';  quickBuyOpen.value = true; };
    const openCartDrawer = () => { drawerMode.value = 'cart'; quickBuyOpen.value = true; };

    /* ── 포토 리뷰 진입 경로 (grid=모아보기에서, list=리뷰목록에서) ── */
    const photoFromGrid = ref(false);
    const openPhotoFromGrid = (r) => { selectedReview.value = r; photoFromGrid.value = true;  photoPopupOpen.value = false; };
    const openPhotoFromList = (r) => { selectedReview.value = r; photoFromGrid.value = false; };
    const closePhotoDetail  = () => {
      selectedReview.value = null;
      if (photoFromGrid.value) photoPopupOpen.value = true;
      photoFromGrid.value = false;
    };

    /* ── 포토 리뷰 좌/우 이동 ── */
    const photoNavPrev = () => {
      const list = reviewsWithPhoto.value;
      if (!list.length) return;
      const idx = list.findIndex(r => r.id === selectedReview.value?.id);
      selectedReview.value = list[(idx - 1 + list.length) % list.length];
    };
    const photoNavNext = () => {
      const list = reviewsWithPhoto.value;
      if (!list.length) return;
      const idx = list.findIndex(r => r.id === selectedReview.value?.id);
      selectedReview.value = list[(idx + 1) % list.length];
    };
    const photoNavIdx = computed(() => {
      const list = reviewsWithPhoto.value;
      return list.findIndex(r => r.id === selectedReview.value?.id);
    });
    const photoGridPageCount = computed(() =>
      Math.max(1, Math.ceil(reviewsWithPhoto.value.length / photoGridPageSize))
    );
    const photoGridItems = computed(() => {
      const start = (photoGridPage.value - 1) * photoGridPageSize;
      return reviewsWithPhoto.value.slice(start, start + photoGridPageSize);
    });
    const photoGridPrev = () => {
      photoGridPage.value = photoGridPage.value > 1
        ? photoGridPage.value - 1
        : photoGridPageCount.value;
    };
    const photoGridNext = () => {
      photoGridPage.value = photoGridPage.value < photoGridPageCount.value
        ? photoGridPage.value + 1
        : 1;
    };

    return {
      selectedImg, zoomOpen,
      selectedColor, selectedSize, qty, colorError, sizeError, showSizeGuide,
      TABS, activeTab, tabBarRef, detailSecRef, sizeSecRef, reviewSecRef, styleSecRef,
      reviewFilter, photoPopupOpen, selectedReview,
      photoNavPrev, photoNavNext, photoNavIdx,
      photoGridPage, photoGridPageCount, photoGridItems, photoGridPrev, photoGridNext,
      photoFromGrid, openPhotoFromGrid, openPhotoFromList, closePhotoDetail,
      sizeGuideRows, styleItems,
      mockImages, mockReviews, reviewsWithPhoto, filteredReviews, avgRating, ratingDist,
      tabFixed, tabFixedTop, tabFixedLeft, tabFixedW, tabPlaceholderH,
      quickBuyOpen, drawerMode, quickBuyTotal, displayPrice, getSizeDelta,
      scrollToTab, categoryLabel, stars, colorStatus, sizeStatus,
      buyBtnRef, showBottomBar,
      selectColor, selectSize, handleAddToCart, handleBuyNow, openQuickBuy, openCartDrawer, execBuyNow, execCartFromDrawer,
    };
  },

  template: /* html */ `
<div class="page-wrap" style="padding-bottom:72px;">

  <!-- Site 02 Edition Ribbon -->
  <div style="background:linear-gradient(135deg,#2e7d6b 0%,#4a9b7e 50%,#5b9279 100%);color:#fff;padding:10px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px;">
    <span style="letter-spacing:2.5px;padding:2px 8px;border:1px solid rgba(255,255,255,0.4);">MINT</span>
    <span>🌿 자연 소재 · 친환경 패키지</span>
    <span style="margin-left:auto;opacity:0.85;">SITE 02</span>
  </div>

  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="상품상세"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Product</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">상품 상세</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span>
        <span style="cursor:pointer;" @click="navigate('prodList')">상품목록</span>
        <span>/</span>
        <span style="color:#333;">상품 상세</span>
      </div>
    </div>
  </div>


  <template v-if="product">
    <!-- ══ 상단: 갤러리 + 구매 옵션 ══ -->
    <div class="prod-top-wrap" style="max-width:1100px;margin:0 auto;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(16px,3vw,32px);align-items:start;" class="detail-grid">

        <!-- 좌: 이미지 갤러리 -->
        <div style="display:flex;flex-direction:column;gap:10px;">

          <!-- 메인 이미지 -->
          <div style="position:relative;"
            @mouseenter="$event.currentTarget.querySelector('.img-nav').style.opacity='1'"
            @mouseleave="$event.currentTarget.querySelector('.img-nav').style.opacity='0'">
            <div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;position:relative;background:var(--bg-base);cursor:pointer;"
              @click="zoomOpen=true">
              <img v-if="mockImages[selectedImg]?.src" :src="mockImages[selectedImg].src" :alt="product.prodNm"
                style="width:100%;height:100%;object-fit:cover;" />
              <div v-if="product.badge" style="position:absolute;top:14px;left:14px;">
                <span v-if="product.badge==='NEW'"
                  style="background:var(--blue);color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;">NEW</span>
                <span v-else-if="product.badge==='인기'"
                  style="background:#ff6b35;color:#fff;font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:20px;">인기</span>
              </div>
            </div>
            <!-- 확대 아이콘 (우상단) -->
            <button @click="zoomOpen=true"
              style="position:absolute;top:14px;right:14px;width:36px;height:36px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.08);z-index:2;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
                <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
            <!-- 좌/우 화살표 -->
            <div class="img-nav" style="opacity:0;transition:opacity .2s;">
              <button @click="selectedImg=(selectedImg-1+mockImages.length)%mockImages.length"
                style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button @click="selectedImg=(selectedImg+1)%mockImages.length"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          <!-- 썸네일 가로 목록 (하단) -->
          <div style="display:flex;flex-direction:row;gap:8px;overflow-x:auto;scrollbar-width:none;">
            <div v-for="(img,i) in mockImages" :key="i"
              @click="selectedImg=i"
              :style="{
                width:'72px',height:'72px',borderRadius:'8px',overflow:'hidden',
                cursor:'pointer',flexShrink:0,
                border:selectedImg===i?'2px solid var(--blue)':'2px solid var(--border)',
                transition:'border-color .15s',
                background:'var(--bg-base)',
              }">
              <img v-if="img.src" :src="img.src" :alt="img.label" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>

        </div><!-- /gallery -->

        <!-- 우: 구매 옵션 -->
        <div>
          <div class="card" style="padding:clamp(16px,3vw,28px);position:sticky;top:20px;">

            <!-- 상품명 + 카테고리 -->
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <h1 style="font-size:1.25rem;font-weight:800;color:var(--text-primary);flex:1;min-width:0;line-height:1.3;">{{ product.prodNm }}</h1>
              <span style="font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;background:var(--blue-dim);color:var(--blue);flex-shrink:0;white-space:nowrap;">{{ categoryLabel(product) }}</span>
            </div>

            <!-- 별점 미리보기 -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
              <span style="font-size:0.82rem;" v-html="stars(avgRating)"></span>
              <span style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">{{ avgRating }}</span>
              <span style="font-size:0.78rem;color:var(--text-muted);">({{ mockReviews.length }})</span>
            </div>

            <!-- 가격 -->
            <div style="font-size:1.7rem;font-weight:900;color:var(--blue);margin-bottom:24px;">{{ displayPrice }}</div>

            <!-- 색상 선택 -->
            <div style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">색상 선택<span style="color:var(--blue);margin-left:2px;">*</span></label>
                <span v-if="selectedColor" style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">{{ selectedColor.name }}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <div v-for="c in product.opt1s" :key="c.name" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;">
                  <button @click="selectColor(c)"
                    :title="c.name + (colorStatus(c)==='soldout' ? ' (품절)' : colorStatus(c)==='stop' ? ' (판매중지)' : '')"
                    :style="{
                      width:'30px',height:'30px',borderRadius:'50%',
                      cursor: colorStatus(c)==='ok' ? 'pointer' : 'not-allowed',
                      background:c.hex,
                      border:selectedColor&&selectedColor.name===c.name?'3px solid var(--blue)':'2px solid rgba(0,0,0,0.12)',
                      outline:selectedColor&&selectedColor.name===c.name?'2px solid white':'none',
                      outlineOffset:'-4px',boxSizing:'border-box',transition:'border .15s',
                      opacity: colorStatus(c)!=='ok' ? '0.4' : '1',
                    }">
                  </button>
                  <!-- 대각선 취소선 (품절/중지) -->
                  <svg v-if="colorStatus(c)!=='ok'" style="position:absolute;top:0;left:0;width:30px;height:30px;pointer-events:none;" viewBox="0 0 30 30">
                    <line x1="4" y1="4" x2="26" y2="26" stroke="#ef4444" stroke-width="2" />
                  </svg>
                  <span v-if="colorStatus(c)==='soldout'" style="position:absolute;top:-8px;right:-10px;font-size:0.5rem;background:#ef4444;color:#fff;padding:1px 3px;border-radius:3px;font-weight:700;line-height:1.2;">품절</span>
                  <span v-else-if="colorStatus(c)==='stop'" style="position:absolute;top:-8px;right:-10px;font-size:0.5rem;background:#9ca3af;color:#fff;padding:1px 3px;border-radius:3px;font-weight:700;line-height:1.2;">중지</span>
                  <!-- 옵션 가격 delta -->
                  <span v-if="c.priceDelta" style="font-size:0.58rem;font-weight:700;color:var(--blue);white-space:nowrap;line-height:1;">+{{ c.priceDelta.toLocaleString('ko-KR') }}</span>
                </div>
              </div>
              <div v-if="colorError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">{{ colorError }}</div>
            </div>

            <!-- 사이즈 선택 (FREE 또는 미설정이면 숨김) -->
            <div v-if="product.opt2s && product.opt2s.length && !(product.opt2s.length===1 && product.opt2s[0]==='FREE')" style="margin-bottom:20px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">사이즈 선택<span style="color:var(--blue);margin-left:2px;">*</span></label>
                <button @click="showSizeGuide=true"
                  style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:0.75rem;font-weight:600;padding:0;text-decoration:underline;">
                  사이즈 가이드
                </button>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <button v-for="s in product.opt2s" :key="s" @click="selectSize(s)"
                  :style="{
                    padding:'7px 14px',borderRadius:'6px',fontSize:'0.82rem',position:'relative',
                    cursor: sizeStatus(s)==='ok' ? 'pointer' : 'not-allowed',
                    border: selectedSize===s ? '2px solid var(--blue)' : sizeStatus(s)==='ok' ? '2px solid var(--border)' : '2px solid #e0e0e0',
                    background: selectedSize===s ? 'var(--blue-dim)' : sizeStatus(s)==='ok' ? 'var(--bg-card)' : '#f5f5f5',
                    color: selectedSize===s ? 'var(--blue)' : sizeStatus(s)==='ok' ? 'var(--text-secondary)' : '#bbb',
                    fontWeight: selectedSize===s ? '700' : '500',
                    textDecoration: sizeStatus(s)!=='ok' ? 'line-through' : 'none',
                    opacity: sizeStatus(s)!=='ok' ? '0.7' : '1',
                    transition:'all .15s',
                  }">{{ s }}<span v-if="getSizeDelta(s)" style="font-size:0.62rem;font-weight:700;color:var(--blue);margin-left:2px;">(+{{ getSizeDelta(s).toLocaleString('ko-KR') }})</span>
                  <span v-if="sizeStatus(s)==='soldout'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#ef4444;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">품절</span>
                  <span v-else-if="sizeStatus(s)==='stop'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#9ca3af;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">중지</span>
                </button>
              </div>
              <div v-if="sizeError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">{{ sizeError }}</div>
            </div>

            <!-- 수량 -->
            <div style="margin-bottom:20px;">
              <label style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:10px;">수량</label>
              <div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content;">
                <button @click="qty>1&&qty--" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">−</button>
                <span style="min-width:44px;text-align:center;font-size:0.9rem;font-weight:700;color:var(--text-primary);">{{ qty }}</span>
                <button @click="qty++" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">+</button>
              </div>
            </div>

            <!-- 선택 요약 -->
            <div v-if="selectedColor||selectedSize"
              style="background:var(--bg-base);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.82rem;color:var(--text-secondary);line-height:1.9;">
              <div v-if="selectedColor"><span style="font-weight:600;color:var(--text-primary);">색상:</span> {{ selectedColor.name }}</div>
              <div v-if="selectedSize"><span style="font-weight:600;color:var(--text-primary);">사이즈:</span> {{ selectedSize }}</div>
              <div><span style="font-weight:600;color:var(--text-primary);">수량:</span> {{ qty }}개</div>
            </div>

            <!-- 버튼 -->
            <div ref="buyBtnRef" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
              <div style="display:flex;gap:8px;">
                <button class="btn-blue" style="flex:1;padding:13px;font-size:0.95rem;" @click="handleAddToCart">🛒 장바구니 담기</button>
                <button @click="toggleLike && toggleLike(product.productId)"
                  :title="isLiked && isLiked(product.productId) ? '찜 해제' : '찜하기'"
                  :style="{
                    width:'52px',flexShrink:0,border:'1.5px solid var(--border)',borderRadius:'10px',
                    background: isLiked && isLiked(product.productId) ? '#fee2e2' : 'var(--bg-card)',
                    cursor:'pointer',fontSize:'1.3rem',display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'all .15s',
                  }">
                  <span :style="{ color: isLiked && isLiked(product.productId) ? '#ef4444' : '#9ca3af' }">
                    {{ isLiked && isLiked(product.productId) ? '♥' : '♡' }}
                  </span>
                </button>
              </div>
              <button class="btn-outline" style="width:100%;padding:13px;font-size:0.95rem;" @click="execBuyNow">⚡ 바로구매</button>
              <button @click="navigate('contact')"
                style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:4px 0;text-align:center;">
                상품 문의하기
              </button>
            </div>

            <!-- 배송 안내 -->
            <div style="padding-top:14px;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:5px;">
              <div style="display:flex;gap:8px;"><span>🚚</span><span>결제 확인 후 <strong>1~2 영업일</strong> 내 출고</span></div>
              <div style="display:flex;gap:8px;"><span>↩️</span><span>수령 후 <strong>7일 이내</strong> 교환·반품 가능</span></div>
              <div style="display:flex;gap:8px;"><span>💳</span><span>결제: <strong>계좌이체</strong></span></div>
            </div>
          </div>
        </div><!-- /purchase -->
      </div>
    </div><!-- /page-wrap top -->

    <!-- ══ 탭 바 (스크롤 시 헤더 아래 고정) ══ -->
    <div v-if="tabFixed" :style="{ height: tabPlaceholderH + 'px', marginTop:'24px' }"></div>
    <div ref="tabBarRef"
      :style="tabFixed ? {
        position:'fixed', top:tabFixedTop+'px', left:tabFixedLeft+'px', width:tabFixedW+'px',
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
        <button v-for="tab in TABS" :key="tab.id" @click="scrollToTab(tab.id)"
          :style="{
            padding:'13px 22px',background:'none',cursor:'pointer',
            border:'none',
            borderBottom:activeTab===tab.id?'2px solid var(--blue)':'2px solid transparent',
            color:activeTab===tab.id?'var(--blue)':'var(--text-secondary)',
            fontWeight:activeTab===tab.id?'700':'500',
            fontSize:'0.88rem',transition:'all .15s',whiteSpace:'nowrap',
            marginBottom:'-2px',
          }">{{ tab.label }}</button>
      </div>
    </div>

    <!-- ══ 탭 섹션들 ══ -->
    <div style="padding-top:0;">

      <!-- 상세정보 -->
      <div ref="detailSecRef" style="padding-top:32px;">
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">상세정보</div>

        <div class="card" style="padding:clamp(16px,3vw,28px);margin-bottom:14px;">
          <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">📋 상품 설명</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.9;margin-bottom:16px;">{{ product.desc }}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span v-for="t in product.tags" :key="t"
              style="padding:4px 12px;background:var(--bg-base);border:1px solid var(--border);border-radius:20px;font-size:0.78rem;color:var(--text-secondary);"># {{ t }}</span>
          </div>
        </div>

        <div class="card" style="padding:28px;">
          <h2 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🧺 세탁 및 관리</h2>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div v-for="item in [
              {icon:'💧',label:'세탁 방법',val:'찬물 손세탁 또는 세탁기 약세탁 권장'},
              {icon:'🌡️',label:'건조 방법',val:'그늘에서 자연 건조 (드라이기 금지)'},
              {icon:'👕',label:'다림질',val:'낮은 온도로 뒤집어 다림질'},
              {icon:'🚫',label:'주의사항',val:'표백제 사용 금지, 드라이클리닝 권장 안함'},
            ]" :key="item.label" style="display:flex;gap:12px;align-items:flex-start;">
              <span style="font-size:1.05rem;flex-shrink:0;width:26px;text-align:center;">{{ item.icon }}</span>
              <div>
                <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:2px;">{{ item.label }}</div>
                <div style="font-size:0.87rem;color:var(--text-secondary);">{{ item.val }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 사이즈 -->
      <div ref="sizeSecRef" style="padding-top:40px;">
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">사이즈</div>
        <div class="card" style="padding:28px;">
          <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">📏 사이즈 가이드</div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:320px;">
              <thead>
                <tr style="background:var(--blue-dim);">
                  <th style="padding:10px 16px;text-align:center;font-weight:700;color:var(--blue);">사이즈</th>
                  <th style="padding:10px 16px;text-align:center;font-weight:700;color:var(--blue);">어깨 (cm)</th>
                  <th style="padding:10px 16px;text-align:center;font-weight:700;color:var(--blue);">가슴 (cm)</th>
                  <th style="padding:10px 16px;text-align:center;font-weight:700;color:var(--blue);">총장 (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row,i) in sizeGuideRows" :key="i" :style="{background:i%2===0?'transparent':'var(--bg-base)'}">
                  <td style="padding:10px 16px;text-align:center;font-weight:700;color:var(--text-primary);">{{ row[0] }}</td>
                  <td style="padding:10px 16px;text-align:center;color:var(--text-secondary);">{{ row[1] }}</td>
                  <td style="padding:10px 16px;text-align:center;color:var(--text-secondary);">{{ row[2] }}</td>
                  <td style="padding:10px 16px;text-align:center;color:var(--text-secondary);">{{ row[3] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="margin-top:12px;font-size:0.75rem;color:var(--text-muted);">* 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.</p>
        </div>
      </div>

      <!-- 상품평 -->
      <div ref="reviewSecRef" style="padding-top:40px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">
          <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">상품평</span>
          <span style="font-size:0.85rem;color:var(--text-muted);font-weight:400;">{{ mockReviews.length }}</span>
        </div>

        <!-- 평점 요약 -->
        <div class="card" style="padding:24px;margin-bottom:14px;display:flex;gap:32px;align-items:center;flex-wrap:wrap;">
          <div style="text-align:center;flex-shrink:0;min-width:90px;">
            <div style="font-size:3.2rem;font-weight:900;color:var(--text-primary);line-height:1;">{{ avgRating }}</div>
            <div style="font-size:1rem;margin:6px 0;" v-html="stars(avgRating)"></div>
            <div style="font-size:0.76rem;color:var(--text-muted);">{{ mockReviews.length }}개 리뷰</div>
          </div>
          <div style="flex:1;min-width:180px;">
            <div v-for="d in ratingDist" :key="d.star" style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
              <span style="font-size:0.76rem;color:var(--text-muted);width:28px;text-align:right;flex-shrink:0;">{{ d.star }}<span style="color:#f59e0b;">★</span></span>
              <div style="flex:1;height:7px;background:var(--bg-base);border-radius:4px;overflow:hidden;">
                <div :style="{width:d.pct+'%',height:'100%',background:'#f59e0b',borderRadius:'4px'}"></div>
              </div>
              <span style="font-size:0.76rem;color:var(--text-muted);width:36px;flex-shrink:0;">{{ d.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- 포토 리뷰 목록 -->
        <div v-if="reviewsWithPhoto.length" class="card" style="padding:20px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">
              포토&동영상 상품평 <span style="color:var(--blue);">{{ reviewsWithPhoto.length }}</span>
            </span>
            <button @click="photoPopupOpen=true"
              style="background:none;border:1px solid var(--border);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:0.78rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
              모아보기
            </button>
          </div>
          <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
            <div v-for="r in reviewsWithPhoto" :key="r.id"
              @click="openPhotoFromList(r)"
              style="width:80px;height:80px;flex-shrink:0;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);transition:opacity .15s;"
              @mouseenter="$event.currentTarget.style.opacity='.75'"
              @mouseleave="$event.currentTarget.style.opacity='1'">
              <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          </div>
        </div>

        <!-- 정렬 -->
        <div style="display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap;">
          <button v-for="f in ['최신순','별점높은순','별점낮은순','도움순']" :key="f"
            @click="reviewFilter=f"
            :style="{
              padding:'5px 14px',border:reviewFilter===f?'1.5px solid var(--blue)':'1.5px solid var(--border)',
              borderRadius:'20px',cursor:'pointer',fontSize:'0.8rem',
              background:reviewFilter===f?'var(--blue-dim)':'var(--bg-card)',
              color:reviewFilter===f?'var(--blue)':'var(--text-secondary)',
              fontWeight:reviewFilter===f?'700':'400',
            }">{{ f }}</button>
        </div>

        <!-- 리뷰 목록 -->
        <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">
          <div v-for="(r,i) in filteredReviews" :key="r.id"
            :style="{padding:'20px',borderTop:i===0?'none':'1px solid var(--border)',background:'var(--bg-card)'}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
              <span style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">{{ r.maskedName }}</span>
              <span style="font-size:0.82rem;" v-html="stars(r.rating)"></span>
              <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">{{ r.date }}</span>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
              <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">사이즈: {{ r.sizeInfo }}</span>
              <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">색상: {{ r.colorInfo }}</span>
            </div>
            <div v-if="r.hasPhoto" style="margin-bottom:10px;">
              <div @click="openPhotoFromList(r)"
                style="width:72px;height:72px;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);display:inline-block;">
                <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            </div>
            <p style="font-size:0.87rem;color:var(--text-secondary);line-height:1.75;margin-bottom:10px;">{{ r.text }}</p>
            <div style="font-size:0.75rem;color:var(--text-muted);">
              도움이 돼요 <span style="font-weight:700;color:var(--text-secondary);">({{ r.helpful }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 스타일 -->
      <div ref="styleSecRef" style="padding-top:40px;padding-bottom:20px;">
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:20px;padding-bottom:12px;border-bottom:1.5px solid var(--border);">스타일</div>
        <div class="card" style="padding:28px;">
          <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;">🎨 이런 코디 어때요?</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
            <div v-for="s in styleItems" :key="s.label"
              style="background:var(--bg-base);border-radius:10px;padding:18px;text-align:center;">
              <div style="font-size:2rem;margin-bottom:8px;">{{ s.emoji }}</div>
              <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">{{ s.label }}</div>
              <div style="font-size:0.77rem;color:var(--text-muted);">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /page-wrap sections -->
  </template>

  <!-- ══ 이미지 확대 모달 ══ -->
  <teleport to="body">
  <div v-if="zoomOpen && product" @click="zoomOpen=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:1500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
    <!-- 닫기 -->
    <button @click.stop="zoomOpen=false"
      style="position:fixed;top:20px;right:20px;background:rgba(0,0,0,0.6);border:2px solid rgba(255,255,255,0.8);color:#fff;font-size:1.4rem;width:48px;height:48px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1510;">✕</button>
    <!-- 메인 확대 이미지 -->
    <div @click.stop style="position:relative;width:95vw;height:85vh;border-radius:12px;display:flex;align-items:center;justify-content:center;">
      <img v-if="mockImages[selectedImg]?.src" :src="mockImages[selectedImg].src" :alt="product.prodNm"
        style="max-width:95vw;max-height:85vh;object-fit:contain;display:block;" />
      <!-- 좌/우 화살표 -->
      <button @click.stop="selectedImg=(selectedImg-1+mockImages.length)%mockImages.length"
        style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button @click.stop="selectedImg=(selectedImg+1)%mockImages.length"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
    <!-- 하단 썸네일 -->
    <div @click.stop style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2;">
      <div v-for="(img,i) in mockImages" :key="i" @click.stop="selectedImg=i"
        :style="{ width:'56px', height:'56px', borderRadius:'8px', overflow:'hidden', cursor:'pointer',
          border: selectedImg===i ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)' }">
        <img :src="img.src" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    </div>
  </div>

  </teleport>

  <!-- ══ 포토 전체 팝업 ══ -->
  <teleport to="body">
  <div v-if="photoPopupOpen && product" @click.self="photoPopupOpen=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1500;display:flex;align-items:center;justify-content:center;padding:20px;">
    <!-- 좌 화살표 -->
    <button v-if="photoGridPageCount > 1" @click="photoGridPrev"
      style="position:fixed;left:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <div @click.stop style="background:var(--bg-card);border-radius:16px;width:100%;max-width:720px;max-height:85vh;overflow-y:auto;padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">포토&동영상 상품평 {{ reviewsWithPhoto.length }}</span>
        <button @click="photoPopupOpen=false" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
        <div v-for="r in photoGridItems" :key="r.id"
          @click="openPhotoFromGrid(r)"
          style="aspect-ratio:1;border-radius:8px;cursor:pointer;overflow:hidden;border:1px solid var(--border);transition:opacity .15s;"
          @mouseenter="$event.currentTarget.style.opacity='.75'"
          @mouseleave="$event.currentTarget.style.opacity='1'">
          <img :src="r.photoImg" style="width:100%;height:100%;object-fit:cover;" />
        </div>
      </div>
      <!-- 페이지네이션 -->
      <div v-if="photoGridPageCount > 1" style="display:flex;justify-content:center;align-items:center;gap:6px;margin-top:20px;">
        <button v-for="p in photoGridPageCount" :key="p" @click="photoGridPage=p"
          :style="{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid var(--border)', background: photoGridPage===p ? 'var(--text-primary)' : 'var(--bg-card)', color: photoGridPage===p ? '#fff' : 'var(--text-secondary)', cursor:'pointer', fontSize:'0.85rem', fontWeight: photoGridPage===p ? 700 : 400 }">
          {{ p }}
        </button>
      </div>
    </div>
    <!-- 우 화살표 -->
    <button v-if="photoGridPageCount > 1" @click="photoGridNext"
      style="position:fixed;right:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  </div>

  </teleport>

  <!-- ══ 포토 리뷰 개별 팝업 ══ -->
  <teleport to="body">
  <div v-if="selectedReview && product" @click.self="closePhotoDetail"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1501;display:flex;align-items:center;justify-content:center;padding:20px;">

    <!-- 좌 화살표 -->
    <button @click="photoNavPrev"
      style="position:fixed;left:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>

    <!-- 본문 -->
    <div style="background:var(--bg-card);border-radius:16px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;padding:24px;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">
          포토&동영상 상품평
          <span style="font-size:0.75rem;color:var(--text-muted);font-weight:400;margin-left:6px;">
            {{ photoNavIdx + 1 }} / {{ reviewsWithPhoto.length }}
          </span>
        </span>
        <button @click="closePhotoDetail"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <div style="border-radius:12px;overflow:hidden;border:1px solid var(--border);aspect-ratio:1/1;margin-bottom:20px;background:var(--bg-base);">
        <img :src="selectedReview.photoImg" style="width:100%;height:100%;object-fit:contain;" />
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ selectedReview.maskedName }}</span>
        <span style="font-size:0.85rem;" v-html="stars(selectedReview.rating)"></span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-left:auto;">{{ selectedReview.date }}</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:14px;">
        <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">사이즈: {{ selectedReview.sizeInfo }}</span>
        <span style="font-size:0.74rem;color:var(--text-muted);background:var(--bg-base);padding:2px 8px;border-radius:4px;">색상: {{ selectedReview.colorInfo }}</span>
      </div>
      <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">{{ selectedReview.text }}</p>
      <div style="font-size:0.78rem;color:var(--text-muted);">
        도움이 돼요 <span style="font-weight:700;color:var(--text-secondary);">({{ selectedReview.helpful }})</span>
      </div>
    </div>

    <!-- 우 화살표 -->
    <button @click="photoNavNext"
      style="position:fixed;right:clamp(8px,3vw,36px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,0.92);box-shadow:0 2px 10px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1502;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

  </div>

  </teleport>

  <!-- ══ 사이즈 가이드 모달 ══ -->
  <teleport to="body">
  <div v-if="showSizeGuide" class="modal-overlay" style="z-index:1500;" @click.self="showSizeGuide=false">
    <div class="modal-box" style="max-width:480px;text-align:left;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <span style="font-weight:800;font-size:1rem;color:var(--text-primary);">📏 사이즈 가이드</span>
        <button @click="showSizeGuide=false" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <thead>
          <tr style="background:var(--blue-dim);">
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">사이즈</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">어깨</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">가슴</th>
            <th style="padding:8px 12px;text-align:center;font-weight:700;color:var(--blue);">총장</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row,i) in sizeGuideRows" :key="i" :style="{background:i%2===0?'transparent':'var(--bg-base)'}">
            <td style="padding:8px 12px;text-align:center;font-weight:700;color:var(--text-primary);">{{ row[0] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[1] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[2] }}</td>
            <td style="padding:8px 12px;text-align:center;color:var(--text-secondary);">{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:14px;font-size:0.75rem;color:var(--text-muted);">* 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.</p>
      <button class="btn-blue" @click="showSizeGuide=false" style="width:100%;margin-top:16px;padding:10px;">확인</button>
    </div>
  </div>

  </teleport>

  <!-- ══ 고정 하단 바 ══ -->
  <div v-if="product && showBottomBar"
    style="position:fixed;bottom:0;left:0;right:0;z-index:100;padding:10px 24px;display:flex;justify-content:center;align-items:center;background:linear-gradient(to top, var(--bg-card) 0%, rgba(245,248,255,0.98) 100%);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--border);box-shadow:0 -4px 18px rgba(80,100,160,0.08);">
    <div style="display:flex;align-items:center;gap:10px;max-width:760px;width:100%;">
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ product.prodNm }}</div>
        <div style="font-size:1.05rem;font-weight:900;color:var(--blue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ displayPrice }}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button class="btn-outline" style="padding:10px 16px;font-size:0.88rem;white-space:nowrap;" @click="openCartDrawer">담기</button>
        <button class="btn-blue"    style="padding:10px 16px;font-size:0.88rem;white-space:nowrap;" @click="openQuickBuy">구매하기</button>
      </div>
    </div>
  </div>

  <!-- ══ 바로구매 드로어 (우측) ══ -->
  <template v-if="quickBuyOpen && product">
    <!-- 딤 오버레이 -->
    <div @click="quickBuyOpen=false"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:150;transition:opacity .25s;"></div>

    <!-- 드로어 패널 -->
    <div style="position:fixed;top:0;right:0;bottom:0;width:360px;max-width:92vw;z-index:151;background:var(--bg-card);box-shadow:-8px 0 32px rgba(0,0,0,0.14);display:flex;flex-direction:column;overflow:hidden;">

      <!-- 헤더 -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <span style="font-size:0.9rem;font-weight:800;color:var(--text-primary);">{{ drawerMode==='cart' ? '🛒 장바구니 담기' : '⚡ 바로구매' }}</span>
        <button @click="quickBuyOpen=false" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-muted);line-height:1;padding:0;">✕</button>
      </div>

      <!-- 스크롤 영역 -->
      <div style="flex:1;overflow-y:auto;padding:20px;">

        <!-- 색상 -->
        <div style="margin-bottom:20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <span style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);">색상<span style="color:var(--blue);margin-left:2px;">*</span></span>
            <span v-if="selectedColor" style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">{{ selectedColor.name }}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <div v-for="c in product.opt1s" :key="c.name" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;">
              <button @click="selectColor(c)" :title="c.name"
                :style="{
                  width:'30px',height:'30px',borderRadius:'50%',
                  cursor: colorStatus(c)==='ok' ? 'pointer' : 'not-allowed',
                  background:c.hex,
                  border:selectedColor&&selectedColor.name===c.name?'3px solid var(--blue)':'2px solid rgba(0,0,0,0.12)',
                  outline:selectedColor&&selectedColor.name===c.name?'2px solid white':'none',
                  outlineOffset:'-4px',boxSizing:'border-box',
                  opacity: colorStatus(c)!=='ok' ? '0.4' : '1',
                }">
              </button>
              <svg v-if="colorStatus(c)!=='ok'" style="position:absolute;top:0;left:0;width:30px;height:30px;pointer-events:none;" viewBox="0 0 30 30">
                <line x1="4" y1="4" x2="26" y2="26" stroke="#ef4444" stroke-width="2" />
              </svg>
              <!-- 옵션 가격 delta -->
              <span v-if="c.priceDelta" style="font-size:0.58rem;font-weight:700;color:var(--blue);white-space:nowrap;line-height:1;">+{{ c.priceDelta.toLocaleString('ko-KR') }}</span>
            </div>
          </div>
          <div v-if="colorError" style="margin-top:6px;font-size:0.78rem;color:#ef4444;">{{ colorError }}</div>
        </div>

        <!-- 사이즈 (FREE면 숨김) -->
        <div v-if="product.opt2s && product.opt2s.length && !(product.opt2s.length===1 && product.opt2s[0]==='FREE')" style="margin-bottom:20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span :style="{ fontSize:'0.82rem', fontWeight:'600', color: sizeError ? '#ef4444' : 'var(--text-secondary)' }">사이즈<span style="margin-left:2px;">*</span></span>
              <span v-if="sizeError" style="font-size:0.75rem;color:#ef4444;font-weight:500;">필수 선택</span>
            </div>
            <button @click="showSizeGuide=true" style="background:none;border:none;cursor:pointer;color:var(--blue);font-size:0.75rem;font-weight:600;padding:0;text-decoration:underline;">사이즈 안내</button>
          </div>
          <div :style="{
            display:'flex', flexWrap:'wrap', gap:'6px', padding:'8px',
            border: sizeError ? '1px solid #ef4444' : '1px solid transparent',
            borderRadius:'6px', transition:'border-color .2s',
          }">
            <button v-for="s in product.opt2s" :key="s" @click="selectSize(s)"
              :style="{
                padding:'7px 16px',borderRadius:'6px',fontSize:'0.82rem',position:'relative',
                cursor: sizeStatus(s)==='ok' ? 'pointer' : 'not-allowed',
                border: selectedSize===s ? '2px solid var(--blue)' : sizeStatus(s)==='ok' ? '2px solid var(--border)' : '2px solid #e0e0e0',
                background: selectedSize===s ? 'var(--blue-dim)' : sizeStatus(s)==='ok' ? 'var(--bg-base)' : '#f5f5f5',
                color: selectedSize===s ? 'var(--blue)' : sizeStatus(s)==='ok' ? 'var(--text-secondary)' : '#bbb',
                fontWeight: selectedSize===s ? '700' : '500',
                textDecoration: sizeStatus(s)!=='ok' ? 'line-through' : 'none',
                opacity: sizeStatus(s)!=='ok' ? '0.7' : '1',
              }">{{ s }}<span v-if="getSizeDelta(s)" style="font-size:0.62rem;font-weight:700;color:var(--blue);margin-left:2px;">(+{{ getSizeDelta(s).toLocaleString('ko-KR') }})</span>
              <span v-if="sizeStatus(s)==='soldout'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#ef4444;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">품절</span>
              <span v-else-if="sizeStatus(s)==='stop'" style="position:absolute;top:-7px;right:-4px;font-size:0.55rem;background:#9ca3af;color:#fff;padding:1px 4px;border-radius:3px;font-weight:700;line-height:1.2;">중지</span>
            </button>
          </div>
        </div>

        <!-- 수량 -->
        <div style="margin-bottom:24px;">
          <span style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:10px;">수량</span>
          <div style="display:flex;align-items:center;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;width:fit-content;">
            <button @click="qty>1&&qty--" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">−</button>
            <span style="min-width:44px;text-align:center;font-size:0.9rem;font-weight:700;color:var(--text-primary);">{{ qty }}</span>
            <button @click="qty++" style="width:36px;height:36px;border:none;background:var(--bg-base);cursor:pointer;font-size:1.1rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;">+</button>
          </div>
        </div>

        <!-- 선택 요약 -->
        <div v-if="selectedColor||selectedSize"
          style="background:var(--bg-base);border-radius:8px;padding:12px 14px;font-size:0.82rem;color:var(--text-secondary);line-height:1.9;border:1px solid var(--border);">
          <div v-if="selectedColor"><span style="font-weight:600;color:var(--text-primary);">색상:</span> {{ selectedColor.name }}</div>
          <div v-if="selectedSize"><span style="font-weight:600;color:var(--text-primary);">사이즈:</span> {{ selectedSize }}</div>
          <div><span style="font-weight:600;color:var(--text-primary);">수량:</span> {{ qty }}개</div>
        </div>
      </div>

      <!-- 하단: 총액 + 버튼 -->
      <div style="flex-shrink:0;padding:16px 20px;border-top:1px solid var(--border);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:0.85rem;color:var(--text-muted);">총 주문금액</span>
          <span style="font-size:1.2rem;font-weight:900;color:var(--blue);">{{ quickBuyTotal }}</span>
        </div>
        <button v-if="drawerMode==='cart'" class="btn-blue" style="width:100%;padding:14px;font-size:0.95rem;font-weight:700;" @click="execCartFromDrawer">
          🛒 장바구니 담기
        </button>
        <button v-else class="btn-blue" style="width:100%;padding:14px;font-size:0.95rem;font-weight:700;" @click="execBuyNow">
          ⚡ 바로구매
        </button>
      </div>
    </div>
  </template>

</div>
  `,
};
