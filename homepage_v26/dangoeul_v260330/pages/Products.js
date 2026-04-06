window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Products = {
  name: 'Products',
  props: ['productCats', 'activeProductCat', 'setProductCat', 'filteredProducts', 'selectProduct', 'openDemo', 'config'],
  template: /* html */ `
  <div>
    <div v-if="config && config.facility && config.facility.productsBanner" class="products-facility-banner">
      <img :src="config.facility.productsBanner" alt="단고을 모종 육묘 시설" loading="lazy"
        @load="$event.target.classList.add('loaded')" />
      <div class="products-facility-banner__overlay">
        <span class="products-facility-banner__badge">현장</span>
        <p class="products-facility-banner__text">충북 진천 육묘 하우스에서 검수·출고되는 모종입니다.</p>
      </div>
    </div>
    <div class="page-wrap">
    <div style="margin-bottom:28px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">모종·세트</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;"><span class="gradient-text">모종</span> 상품 목록</h1>
      <p class="section-subtitle">채소 모종 단품과 샐러드·텃밭·김장용 세트를 골라보세요.</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">
      <button v-for="cat in productCats" :key="cat" class="cat-btn"
        :class="{active: activeProductCat===cat}"
        @click="setProductCat(cat)">{{ cat }}</button>
    </div>

    <!-- Search -->
    <div class="mb-8">
      <input
        v-model="searchText"
        type="text"
        class="form-input w-full md:w-72"
        placeholder="상품명 검색"
        @input="resetPagination"
      />
    </div>

    <div class="grid-3">
      <div v-for="p in displayedProducts" :key="p.productId" class="product-card">
        <div v-if="p.image" class="product-card-cover">
          <img :src="$listImg(p.image)" :alt="p.productName" loading="lazy"
            @load="$event.target.classList.add('loaded')"
            :style="{ objectPosition: p.imagePos || 'center center' }" />
        </div>
        <div v-else class="product-card-body" style="padding-top:22px;">
          <span style="font-size:2.5rem;">{{ p.emoji }}</span>
        </div>
        <div class="product-card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
            <span v-if="!p.image" style="font-size:1.5rem;line-height:1;">{{ p.emoji }}</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-left:auto;">
              <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
              <span v-if="p.isSet" class="badge badge-set">구성 세트</span>
            </div>
          </div>
          <div style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">{{ p.productName }}</div>
          <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;">{{ p.desc }}</p>
          <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-bottom:8px;">{{ p.price }}</div>
        </div>
        <div class="product-card-actions">
          <button class="btn-blue btn-sm" style="flex:1;" @click="openDemo(p)">구성 보기</button>
          <button class="btn-outline btn-sm" style="flex:1;" @click="selectProduct(p)">상세보기</button>
        </div>
      </div>
    </div>
    <div v-if="searchedProducts.length===0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
      검색 결과가 없습니다.
    </div>

    <div v-if="hasMore" ref="sentinel" class="h-8"></div>
    </div>
  </div>
  `,

  setup(props) {
    const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);
    const sentinel = ref(null);
    const observerRef = ref(null);

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    /* ── Preserve products list state on refresh ── */
    let restoring = true;
    let syncingFromHash = false;
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (raw && raw.includes('page=')) {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        // Dangoeul: products page key is "products"
        if (hPage === 'products') {
          const hCat = params.get('cat');
          if (hCat && props.productCats && props.productCats.includes(hCat)) {
            props.setProductCat(hCat);
          }
          const hQ = params.get('q');
          if (hQ !== null) searchText.value = hQ;
          const hV = parseInt(params.get('v') || '', 10);
          if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;
        }
      }
    } catch (e) {}
    restoring = false;

    const applyHashState = () => {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) return;

      if (syncingFromHash) return;
      syncingFromHash = true;
      try {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        if (hPage === 'products') {
          const hCat = params.get('cat');
          if (hCat && props.productCats && props.productCats.includes(hCat)) props.setProductCat(hCat);

          const hQ = params.get('q');
          if (hQ !== null) searchText.value = hQ;

          const hV = parseInt(params.get('v') || '', 10);
          if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

          // Sentinel 관찰 상태를 최신 DOM에 맞춥니다.
          nextTick(function () {
            if (!sentinel.value || !observerRef.value) return;
            observerRef.value.disconnect();
            observerRef.value.observe(sentinel.value);
          });
        }
      } catch (e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    };

    const searchedProducts = computed(() => {
      var q = String(searchText.value || '').trim().toLowerCase();
      var base = props.filteredProducts || [];
      if (!q) return base;
      return base.filter(p => (p.productName || '').toLowerCase().includes(q));
    });

    const displayedProducts = computed(() => searchedProducts.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < searchedProducts.value.length);

    function resetPagination() {
      visibleCount.value = PAGE_SIZE;
      if (observerRef.value) observerRef.value.disconnect();
      nextTick(function () {
        if (!sentinel.value || !observerRef.value) return;
        observerRef.value.observe(sentinel.value);
      });
    }

    function loadMore() {
      if (!hasMore.value) return;
      visibleCount.value = Math.min(searchedProducts.value.length, visibleCount.value + PAGE_SIZE);
    }

    onMounted(function () {
      if (!sentinel.value) return;
      observerRef.value = new IntersectionObserver(function (entries) {
        if (!entries || !entries.length) return;
        if (entries[0].isIntersecting) loadMore();
      }, { rootMargin: '250px' });
      observerRef.value.observe(sentinel.value);
    });

    onBeforeUnmount(function () {
      if (observerRef.value) observerRef.value.disconnect();
    });

    watch(
      function () {
        return props.activeProductCat;
      },
      function () {
        if (restoring || syncingFromHash) return;
        resetPagination();
      }
    );
    watch(searchText, function () {
      if (restoring || syncingFromHash) return;
      resetPagination();
    });

    watch([() => props.activeProductCat, searchText, visibleCount], function () {
      if (restoring || syncingFromHash) return;
      const params = new URLSearchParams();
      params.set('page', 'products');
      params.set('cat', props.activeProductCat);
      params.set('q', searchText.value);
      params.set('v', String(visibleCount.value));
      window.location.hash = params.toString();
    });

    const onHashChange = () => {
      if (syncingFromHash) return;
      applyHashState();
    };
    window.addEventListener('hashchange', onHashChange);
    onBeforeUnmount(function () {
      window.removeEventListener('hashchange', onHashChange);
    });

    return {
      searchText,
      displayedProducts,
      searchedProducts,
      sentinel,
      hasMore,
      resetPagination,
      categoryLabel,
    };
  },
};
