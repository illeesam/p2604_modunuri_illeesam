/* ShopJoy - Prod01List (API 로드 + 고급 필터 + PC 페이지네이션 + 모바일 무한스크롤) */
window.Prod02List = {
  name: "Prod02List",
  props: {
    navigate:      { type: Function, required: true },        // 페이지 이동
  },
  setup(props) {

    const { ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;
    const prods             = window.foApp.prods;
    const selectProd        = (p) => window.foApp.selectProd(p);
    const toggleLike           = (id) => window.foApp.toggleLike(id);
    const isLiked              = (id) => window.foApp.isLiked?.(id) ?? false;

    const pager = reactive({ pageNo: 1, pageSize: 12, pageTotalCount: 0, pageTotalPage: 1, pageType: 'INFINITE_SCROLL', pageSizes: [12, 24, 48], pageCond: {} });

    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, searchText: '', priceMin: '', priceMax: '', isMobile: window.innerWidth < 768 });
    const codes = reactive({});

    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = foUtil.useAppCodeReady(uiState, fnLoadCodes);


    /* -- 상품 이미지 자동 할당 -- */
    const IMG_BASE = 'assets/cdn/prod/img/shop/product';
    const assignImage = (p) => {
      /* colors→opt1s, sizes→opt2s 호환 */
      if (p.colors && !p.opt1s) { p.opt1s = p.colors; }
      if (p.sizes  && !p.opt2s) { p.opt2s = p.sizes; }
      /* 이미지 자동 할당 */
      if (!p.image) {
        const id = p.prodId || 1;
        if (id <= 12) {
          p.image  = `${IMG_BASE}/fashion/fashion-${id}.webp`;
          p.images = [p.image, `${IMG_BASE}/fashion/fashion-${((id % 12) + 1)}.webp`];
        } else {
          const n = ((id - 1) % 23) + 1;
          p.image  = `${IMG_BASE}/prod_${n}.png`;
          p.images = [p.image, `${IMG_BASE}/prod_${(n % 23) + 1}.png`];
        }
      }
      return p;
    };

    /* -- 상품 데이터 -- */
    const allProds = reactive([]);

    const fnBuildPagerNums = () => {
      const t = Math.max(1, Math.ceil(allProds.length / pager.pageSize));
      pager.pageTotalPage = t;
      pager.pageTotalCount = allProds.length;
      const c = pager.pageNo;
      pager.pageList = uiState.isMobile
        ? allProds.slice(0, c * pager.pageSize)
        : allProds.slice((c - 1) * pager.pageSize, c * pager.pageSize);
      if (t <= 7) { pager.pageNums = Array.from({ length: t }, (_, i) => i + 1); return; }
      const set = new Set([1, t, c-2, c-1, c, c+1, c+2].filter(n => n >= 1 && n <= t));
      const sorted = [...set].sort((a, b) => a - b);
      const result = [];
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i-1] > 1) result.push('…');
        result.push(sorted[i]);
      }
      pager.pageNums = result;
    };

    const handleLoadProds = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(uiState.searchText   ? { kw: uiState.searchText }                : {}),
          ...(uiState.priceMin     ? { priceMin: uiState.priceMin }            : {}),
          ...(uiState.priceMax     ? { priceMax: uiState.priceMax }            : {}),
          ...(selCats.size   > 0   ? { categoryIds: [...selCats].join(',') }   : {}),
          ...(selColors.size > 0   ? { colors: [...selColors].join(',') }      : {}),
          ...(selSizes.size  > 0   ? { sizes: [...selSizes].join(',') }        : {}),
        };
        const res = await foApiSvc.pdProd.getPage(params, '상품목록', '목록조회');
        pager.pageTotalCount = res.data?.data?.pageTotalCount || 0;
        pager.pageTotalPage = res.data?.data?.pageTotalPage || 1;
        allProds.splice(0, allProds.length, ...(res.data?.data?.pageList || []).map(p => assignImage({
          ...p,
          priceNum: p.price,
          price: p.price.toLocaleString() + '원',
        })));
        /* app.js prods 도 갱신해 Detail/Cart 에서 동일 객체 참조 가능하게 */
        try {
          if (window.SITE_CONFIG && Array.isArray(window.SITE_CONFIG.prods)) {
            window.SITE_CONFIG.prods.splice(0, window.SITE_CONFIG.prods.length, ...allProds);
          }
        } catch (e) {}
        fnBuildPagerNums();
      } catch (e) {
        console.error('[handleSearchList]', e);
        allProds.splice(0, allProds.length);
      } finally {
        uiState.loading = false;
      }
    };

    /* -- 필터 상태 -- */
    const selColors     = reactive(new Set());
    const selSizes      = reactive(new Set());
    const selCats       = reactive(new Set());

    /* -- 필터 옵션 (로드된 상품 기반) -- */
    const cfAllColors = computed(() => {
      const map = new Map();
      allProds.forEach(p => (p.opt1s || []).forEach(c => { if (!map.has(c.name)) map.set(c.name, c); }));
      return [...map.values()];
    });
    const sizeOrder = ['FREE','XS','S','M','L','XL','XXL','XXXL'];
    const cfAllSizes = computed(() => {
      const seen = new Set();
      allProds.forEach(p => (p.opt2s || []).forEach(s => seen.add(s)));
      return [...seen].sort((a, b) => {
        const ai = sizeOrder.indexOf(a); const bi = sizeOrder.indexOf(b);
        if (ai < 0 && bi < 0) return a.localeCompare(b);
        if (ai < 0) return 1; if (bi < 0) return -1;
        return ai - bi;
      });
    });
    const cfAllCats = computed(() => (window.SITE_CONFIG && window.SITE_CONFIG.categorys) || []);

    /* -- 할인율 / 포맷 -- */
    const fnDiscountRate = p => p.originalPrice
      ? Math.round((1 - p.priceNum / p.originalPrice) * 100) : 0;
    const fnFmtPrice = n => n ? n.toLocaleString() + '원' : '';
    const fnCategoryLabel = p => {
      if (!p) return '';
      const row = cfAllCats.value.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryNm : p.categoryId;
    };

    /* -- 토글 함수 -- */
    const toggleColor = name => { if (selColors.has(name)) selColors.delete(name); else selColors.add(name); };
    const toggleSize  = sz   => { if (selSizes.has(sz)) selSizes.delete(sz); else selSizes.add(sz); };
    const toggleCat   = id   => { if (selCats.has(id)) selCats.delete(id); else selCats.add(id); };

    const cfHasFilter = computed(() =>
      uiState.searchText || uiState.priceMin || uiState.priceMax ||
      selColors.size > 0 || selSizes.size > 0 || selCats.size > 0
    );
    const clearFilters = () => {
      uiState.searchText = ''; uiState.priceMin = ''; uiState.priceMax = '';
      selColors.clear(); selSizes.clear(); selCats.clear();
    };
    /* -- 모바일 판별 -- */
    const onResize = () => { uiState.isMobile = window.innerWidth < 768; fnBuildPagerNums(); };
    window.addEventListener('resize', onResize);

    /* -- 필터 변경 시 페이지 리셋 -- */
    watch([
      () => uiState.searchText,
      () => uiState.priceMin,
      () => uiState.priceMax,
      selColors,
      selSizes,
      selCats
    ], () => {
      pager.pageNo = 1;
      handleLoadProds();
    });

    /* -- IntersectionObserver (모바일 무한스크롤) -- */
    let observer = null;
    const setupObserver = () => {
      if (observer) observer.disconnect();
      const el = document.getElementById('sj-sentinel');
      if (!el || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && uiState.isMobile && pager.pageNo < pager.pageTotalPage) {
          pager.pageNo++;
          fnBuildPagerNums();
        }
      }, { rootMargin: '300px' });
      observer.observe(el);
    };

    const onSearch = async () => {
      pager.pageNo = 1;
      await handleLoadProds();
      setupObserver();
    };

    const handleSearchList = async (searchType = 'DEFAULT') => {
      await handleLoadProds();
      setupObserver();
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
    onBeforeUnmount(() => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', onResize);
    });

    onMounted(() => {
      handleSearchList();
    });

    // -- return ---------------------------------------------------------------

    return { pager,
      uiState,
      allProds,
      selColors, selSizes, selCats,
      cfAllColors, cfAllSizes, cfAllCats,
      toggleColor, toggleSize, toggleCat, cfHasFilter, clearFilters,
      fnDiscountRate, fnFmtPrice, fnCategoryLabel,
      fnBuildPagerNums,
      codes, onSearch,
      onResize,
      setupObserver,
      observer,
      isLiked, toggleLike, selectProd,
    };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- -- Site 02 Edition Ribbon ----------------------------------------- -->
  <div style="background:linear-gradient(135deg,#2e7d6b 0%,#4a9b7e 50%,#5b9279 100%);color:#fff;padding:10px 24px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12px;">
    <span style="letter-spacing:2.5px;padding:2px 8px;border:1px solid rgba(255,255,255,0.4);">MINT</span>
    <span>🌿 세이지 그린 큐레이션 — 지속 가능한 소재</span>
    <span style="margin-left:auto;opacity:0.85;">SITE 02</span>
  </div>

  <!-- -- 페이지 타이틀 배너 ----------------------------------------------------- -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="상품목록"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Shopping</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">상품 목록</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">상품목록</span>
      </div>
    </div>
  </div>

  <!-- -- 카테고리 탭 (최상위 독립 배치) -- -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
    <button
      @click="selCats.clear()"
      style="padding:7px 18px;border-radius:24px;cursor:pointer;font-size:0.85rem;font-weight:700;transition:all 0.18s;"
      :style="selCats.size===0
        ? 'background:var(--blue);color:#fff;border:2px solid var(--blue);'
        : 'background:var(--bg-card);color:var(--text-secondary);border:2px solid var(--border);'">
      전체
    </button>
    <button v-for="cat in cfAllCats" :key="cat.categoryId"
      @click="toggleCat(cat.categoryId)"
      style="padding:7px 18px;border-radius:24px;cursor:pointer;font-size:0.85rem;font-weight:700;transition:all 0.18s;"
      :style="selCats.has(cat.categoryId)
        ? 'background:var(--blue);color:#fff;border:2px solid var(--blue);'
        : 'background:var(--bg-card);color:var(--text-secondary);border:2px solid var(--border);'">
      {{ cat.categoryNm }}
      <span v-if="selCats.has(cat.categoryId)"
        style="margin-left:4px;font-size:0.75rem;opacity:0.8;">✓</span>
    </button>
  </div>

  <!-- -- 검색 바 -- -->
  <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">
    <div style="flex:1;position:relative;">
      <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:0.95rem;color:var(--text-muted);">🔍</span>
      <input v-model="uiState.searchText" type="text" placeholder="상품명, 태그 검색..."
        style="width:100%;padding:10px 14px 10px 36px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;box-sizing:border-box;"
        @focus="$event.target.style.borderColor='var(--blue)'"
        @blur="$event.target.style.borderColor='var(--border)'" />
    </div>
    <button @click="uiState.filterOpen=!uiState.filterOpen"
      style="display:flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-card);cursor:pointer;font-size:0.85rem;font-weight:600;white-space:nowrap;transition:all 0.2s;"
      :style="uiState.filterOpen?'border-color:var(--blue);color:var(--blue);':cfHasFilter?'border-color:#f97316;color:#f97316;':'color:var(--text-muted);'">
      <span>⚙️</span>
      <span>{{ uiState.filterOpen ? '필터 닫기' : '필터' }}</span>
      <span v-if="cfHasFilter && !uiState.filterOpen"
        style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;background:#f97316;color:#fff;border-radius:9px;font-size:0.7rem;font-weight:700;">
        {{ (selColors.size+selSizes.size+selCats.size+(uiState.priceMin?1:0)+(uiState.priceMax?1:0)) }}
      </span>
    </button>
    <button @click="onSearch"
      style="padding:10px 18px;border:1.5px solid var(--blue);border-radius:10px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.85rem;font-weight:700;white-space:nowrap;transition:all 0.2s;">
      조회
    </button>
  </div>

  <!-- -- 상세 필터 패널 -- -->
  <div v-show="uiState.filterOpen"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:clamp(12px,2vw,18px);margin-bottom:20px;">

    <!-- -- 가격 구간 -------------------------------------------------------- -->
    <div style="margin-bottom:16px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;letter-spacing:0.05em;">💰 판매가 구간</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <div style="position:relative;">
          <input v-model="uiState.priceMin" type="number" placeholder="최소"
            style="width:110px;padding:7px 28px 7px 10px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;outline:none;"
            @focus="$event.target.style.borderColor='var(--blue)'"
            @blur="$event.target.style.borderColor='var(--border)'" />
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.75rem;color:var(--text-muted);">원</span>
        </div>
        <span style="color:var(--text-muted);font-size:0.9rem;">~</span>
        <div style="position:relative;">
          <input v-model="uiState.priceMax" type="number" placeholder="최대"
            style="width:110px;padding:7px 28px 7px 10px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;outline:none;"
            @focus="$event.target.style.borderColor='var(--blue)'"
            @blur="$event.target.style.borderColor='var(--border)'" />
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.75rem;color:var(--text-muted);">원</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button v-for="r in [{label:'~3만',max:30000},{label:'3~5만',min:30000,max:50000},{label:'5~10만',min:50000,max:100000},{label:'10만~',min:100000}]" :key="r.label"
            @click="uiState.priceMin=r.min||'';uiState.priceMax=r.max||''"
            style="padding:5px 10px;border:1px solid var(--border);border-radius:20px;background:var(--bg-base);cursor:pointer;font-size:0.75rem;font-weight:600;color:var(--text-secondary);transition:all 0.15s;"
            :style="uiState.priceMin==(r.min||'')&&uiState.priceMax==(r.max||'')?'background:var(--blue);color:#fff;border-color:var(--blue);':''">
            {{ r.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- -- 색상 ----------------------------------------------------------- -->
    <div style="margin-bottom:16px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;letter-spacing:0.05em;">🎨 색상 <span style="font-weight:400;font-size:0.72rem;">(복수선택)</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <button v-for="c in cfAllColors" :key="c.name"
          @click="toggleColor(c.name)"
          :title="c.name"
          style="display:flex;align-items:center;gap:5px;padding:4px 10px 4px 6px;border-radius:20px;cursor:pointer;font-size:0.75rem;font-weight:600;transition:all 0.15s;"
          :style="selColors.has(c.name)
            ? 'border:2px solid var(--blue);background:var(--blue-dim);color:var(--blue);'
            : 'border:1.5px solid var(--border);background:var(--bg-base);color:var(--text-secondary);'">
          <span :style="'width:14px;height:14px;border-radius:50%;background:'+c.hex+';border:1px solid rgba(0,0,0,0.15);flex-shrink:0;'"></span>
          <span>{{ c.name }}</span>
        </button>
      </div>
    </div>

    <!-- -- 사이즈 ---------------------------------------------------------- -->
    <div style="margin-bottom:12px;">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;letter-spacing:0.05em;">📏 사이즈 <span style="font-weight:400;font-size:0.72rem;">(복수선택)</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        <button v-for="sz in cfAllSizes" :key="sz"
          @click="toggleSize(sz)"
          style="padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.82rem;font-weight:700;transition:all 0.15s;"
          :style="selSizes.has(sz)
            ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);'
            : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
          {{ sz }}
        </button>
      </div>
    </div>

    <!-- -- 필터 초기화 ------------------------------------------------------- -->
    <div style="display:flex;justify-content:flex-end;">
      <button v-if="cfHasFilter" @click="clearFilters"
        style="padding:6px 16px;border:1.5px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.15s;">
        ✕ 필터 초기화
      </button>
    </div>
  </div>

  <!-- -- 결과 요약 ---------------------------------------------------------- -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
    <div style="font-size:0.85rem;color:var(--text-secondary);">
      총 <strong style="color:var(--text-primary);">{{ allProds.length }}</strong>개 상품
      <span v-if="cfHasFilter" style="color:#f97316;font-size:0.78rem;margin-left:6px;">(필터 적용중)</span>
    </div>
  </div>

  <!-- -- 스켈레톤 -- -->
  <div v-if="uiState.loading" class="grid-3">
    <div v-for="i in 6" :key="'sk'+i" class="prod-card" style="overflow:hidden;">
      <div style="height:160px;" class="skeleton-line"></div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px;">
        <div class="skeleton-line" style="height:14px;width:70%;"></div>
        <div class="skeleton-line" style="height:11px;width:55%;"></div>
        <div style="display:flex;gap:6px;">
          <div v-for="j in 4" :key="j" class="skeleton-line" style="width:16px;height:16px;border-radius:50%;"></div>
        </div>
        <div class="skeleton-line" style="height:18px;width:35%;"></div>
        <div class="skeleton-line" style="height:36px;border-radius:8px;"></div>
      </div>
    </div>
  </div>

  <!-- -- 상품 그리드 -- -->
  <div v-else class="grid-3">
    <div v-for="p in pager.pageList" :key="p.prodId"
      class="prod-card" style="cursor:pointer;" @click="selectProd(p)">

      <!-- -- 썸네일 -------------------------------------------------------- -->
      <div style="height:220px;overflow:hidden;background:#f5f0eb;position:relative;display:flex;align-items:center;justify-content:center;">
        <img v-if="p.image" :src="p.image" :alt="p.prodNm" style="width:100%;height:100%;object-fit:cover;transition:transform .3s;"
          @mouseenter="$event.target.style.transform='scale(1.05)'"
          @mouseleave="$event.target.style.transform=''"
          @error="$event.target.style.display='none'" />
        <span v-if="!p.image" style="font-size:3rem;opacity:0.3;">📷</span>
        <span v-if="p.badge==='NEW'" class="badge badge-new" style="position:absolute;top:12px;left:12px;">NEW</span>
        <span v-else-if="p.badge==='인기'" class="badge badge-hot" style="position:absolute;top:12px;left:12px;">인기</span>
        <span v-if="p.originalPrice"
          style="position:absolute;top:12px;right:12px;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:800;padding:3px 7px;border-radius:10px;">
          {{ Math.round((1-p.priceNum/p.originalPrice)*100) }}%
        </span>
        <!-- -- 좋아요 버튼 --------------------------------------------------- -->
        <button v-if="toggleLike" @click.stop="toggleLike(p.prodId)"
          style="position:absolute;bottom:10px;right:10px;width:32px;height:32px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;"
          title="위시리스트">
          <svg width="16" height="16" viewBox="0 0 24 24"
            :fill="isLiked&&isLiked(p.prodId)?'#ef4444':'none'"
            :stroke="isLiked&&isLiked(p.prodId)?'#ef4444':'#555'"
            stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      <div style="padding:16px;">
        <!-- -- 상품명 + 카테고리 ----------------------------------------------- -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px;">
          <span style="font-weight:700;color:var(--text-primary);font-size:0.92rem;flex:1;line-height:1.4;">{{ p.prodNm }}</span>
          <span class="badge badge-cat" style="flex-shrink:0;margin-top:2px;">{{ fnCategoryLabel(p) }}</span>
        </div>

        <!-- -- 설명 ------------------------------------------------------- -->
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.desc }}</p>

        <!-- -- 색상 스와치 --------------------------------------------------- -->
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:8px;flex-wrap:wrap;">
          <div v-for="c in (p.opt1s||[]).slice(0,6)" :key="c.name"
            :style="{ width:'16px', height:'16px', borderRadius:'50%', background:c.hex, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0 }"
            :title="c.name"></div>
          <span v-if="(p.opt1s||[]).length>6" style="font-size:0.68rem;color:var(--text-muted);">+{{ (p.opt1s||[]).length-6 }}</span>
        </div>

        <!-- -- 사이즈 ------------------------------------------------------ -->
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
          <span v-for="s in (p.opt2s||[]).slice(0,5)" :key="s"
            style="font-size:0.68rem;padding:2px 5px;border-radius:4px;border:1px solid var(--border);color:var(--text-muted);">{{ s }}</span>
          <span v-if="(p.opt2s||[]).length>5" style="font-size:0.68rem;color:var(--text-muted);">+{{ (p.opt2s||[]).length-5 }}</span>
        </div>

        <!-- -- 가격 영역 ---------------------------------------------------- -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">{{ p.price }}</span>
          <template v-if="p.originalPrice">
            <span style="font-size:0.78rem;color:var(--text-muted);text-decoration:line-through;">{{ p.originalPrice.toLocaleString() }}원</span>
          </template>
        </div>

        <button class="btn-outline" style="width:100%;padding:9px;" @click.stop="selectProd(p)">상세보기</button>
      </div>
    </div>
  </div>

  <!-- -- 결과 없음 ---------------------------------------------------------- -->
  <div v-if="!uiState.loading && allProds.length===0"
    style="text-align:center;padding:60px 0;color:var(--text-muted);">
    <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
    <div style="font-size:1rem;font-weight:600;">해당 조건의 상품이 없습니다.</div>
    <button v-if="cfHasFilter" @click="clearFilters"
      style="margin-top:16px;padding:8px 20px;border:1.5px solid var(--blue);border-radius:8px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.85rem;font-weight:600;">
      필터 초기화
    </button>
  </div>

  <!-- -- PC 페이지네이션 -- -->
  <div v-if="!uiState.loading && !uiState.isMobile && pager.pageTotalPage > 1"
    style="display:flex;align-items:center;justify-content:center;gap:4px;margin-top:32px;flex-wrap:wrap;">
    <button @click="pager.pageNo=Math.max(1,pager.pageNo-1);fnBuildPagerNums()" :disabled="pager.pageNo===1"
      style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.85rem;"
      :style="pager.pageNo===1?'opacity:0.4;cursor:not-allowed;':''">‹</button>
    <template v-for="n in pager.pageNums" :key="n">
      <span v-if="n==='…'" style="padding:8px 4px;color:var(--text-muted);font-size:0.85rem;">…</span>
      <button v-else @click="pager.pageNo=n;fnBuildPagerNums();$el.scrollIntoView({behavior:'smooth',block:'start'})"
        style="min-width:38px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;transition:all 0.15s;"
        :style="pager.pageNo===n
          ? 'background:var(--blue);color:#fff;border:1px solid var(--blue);'
          : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border);'">
        {{ n }}
      </button>
    </template>
    <button @click="pager.pageNo=Math.min(pager.pageTotalPage,pager.pageNo+1);fnBuildPagerNums()" :disabled="pager.pageNo===pager.pageTotalPage"
      style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.85rem;"
      :style="pager.pageNo===pager.pageTotalPage?'opacity:0.4;cursor:not-allowed;':''">›</button>
    <span style="font-size:0.78rem;color:var(--text-muted);margin-left:8px;">{{ pager.pageNo }} / {{ pager.pageTotalPage }}</span>
  </div>

  <!-- -- 모바일 무한스크롤 센티넬 -- -->
  <div v-if="!uiState.loading && uiState.isMobile" id="sj-sentinel" style="height:1px;"></div>
  <div v-if="!uiState.loading && uiState.isMobile && pager.pageNo < pager.pageTotalPage"
    style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">
    스크롤하면 더 불러옵니다…
  </div>

</div>
  `,
};
