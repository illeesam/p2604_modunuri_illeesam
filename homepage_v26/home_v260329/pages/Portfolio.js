/* HOME - PagePortfolio */
window.PagePortfolio = {
  name: 'PagePortfolio',
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">포트폴리오</h1>
      <p class="section-subtitle mb-8">완료된 프로젝트 모음</p>
      <div class="flex flex-wrap gap-2 mb-8">
        <button v-for="cat in cats" :key="cat"
                @click="activeCat=cat"
                class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                :style="activeCat===cat ? 'background:var(--emerald);color:#111827' : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border)'">
          {{ cat }}
        </button>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <input
          v-model="searchText"
          type="text"
          class="form-input w-full md:w-72"
          placeholder="프로젝트명 검색"
          @input="resetPagination"
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="item in displayedItems" :key="item.portfolioId" class="portfolio-card">
          <div class="flex items-center justify-center" :style="'height:180px;background:'+item.bg+';font-size:4.5rem'">{{ item.emoji }}</div>
          <div class="p-5">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ item.portfolioName }}</h3>
              <span class="text-xs px-2 py-0.5 rounded" style="background:var(--emerald-dim);color:var(--emerald)">{{ item.cat }}</span>
            </div>
            <p class="text-xs" style="color:var(--text-secondary)">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <div v-if="hasMore" ref="sentinel" class="h-8"></div>
      <div v-else-if="displayedItems.length === 0" class="text-center py-12" style="color:var(--text-muted)">
        검색 결과가 없습니다.
      </div>
    </div>
  `,
  setup() {
    const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
    const portfolio = window.SITE_CONFIG.portfolio;
    const activeCat = ref('전체');
    const cats = ['전체', ...new Set(portfolio.map(p => p.cat))];
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);
    const sentinel = ref(null);
    const observerRef = ref(null);

    const filtered = computed(() =>
      activeCat.value === '전체' ? portfolio : portfolio.filter(p => p.cat === activeCat.value)
    );

    const searchedItems = computed(() => {
      var q = String(searchText.value || '').trim().toLowerCase();
      if (!q) return filtered.value;
      return filtered.value.filter(p => (p.portfolioName || '').toLowerCase().includes(q));
    });

    const displayedItems = computed(() => searchedItems.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < searchedItems.value.length);

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
      visibleCount.value = Math.min(searchedItems.value.length, visibleCount.value + PAGE_SIZE);
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

    watch(activeCat, function () {
      resetPagination();
    });
    watch(searchText, function () {
      resetPagination();
    });

    return { portfolio, activeCat, cats, displayedItems, sentinel, hasMore, resetPagination };
  }
};
