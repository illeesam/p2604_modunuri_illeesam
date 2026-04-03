/* ANYNURI - PageWorks (작품소개) */
window.PageWorks = {
  name: 'PageWorks',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">작품소개</h1>
      <p class="section-subtitle mb-8">AnyNuri가 만든 감동적인 애니메이션 작품들</p>

      <!-- Genre filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button v-for="c in categoryList" :key="c.categoryId"
                @click="activeCat = c.categoryId"
                class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                :style="activeCat === c.categoryId
                  ? 'background:var(--sakura);color:#fff'
                  : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border)'">
          {{ c.categoryName }}
        </button>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <input
          v-model="searchText"
          type="text"
          class="form-input w-full md:w-72"
          placeholder="작품명 검색"
          @input="resetPagination"
        />
      </div>

      <!-- Skeleton Cards -->
      <div v-if="!skeletonDone" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="i in 6" :key="'sk'+i" class="work-card" style="overflow:hidden;">
          <div class="skeleton-line" style="height:200px;border-radius:0;margin:0;"></div>
          <div class="p-5">
            <div class="skeleton-line" style="height:13px;width:65%;margin-bottom:10px;"></div>
            <div class="skeleton-line" style="height:11px;width:90%;margin-bottom:6px;"></div>
            <div class="skeleton-line" style="height:11px;width:70%;margin-bottom:12px;"></div>
            <div class="skeleton-line" style="height:11px;width:40%;"></div>
          </div>
        </div>
      </div>

      <!-- Works grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="work in displayedWorks" :key="work.id"
             class="work-card cursor-pointer"
             @click="$emit('navigate', 'detail')">
          <div class="flex items-center justify-center text-6xl relative"
               :style="'height:200px;background:'+work.bg">
            {{ work.emoji }}
            <div class="absolute top-3 right-3">
              <span class="tag-pill">{{ work.genre }}</span>
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ work.title }}</h3>
              <span class="text-xs flex-shrink-0" style="color:var(--text-muted)">{{ work.year }}</span>
            </div>
            <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ work.desc }}</p>
            <div class="flex flex-wrap gap-1 mb-3">
              <span v-for="t in work.tags" :key="t" class="tag-pill">{{ t }}</span>
            </div>
            <div class="text-xs" style="color:var(--text-muted)">{{ work.duration }}</div>
            <div v-if="work.awards.length" class="mt-2 text-xs" style="color:var(--gold)">
              🏆 {{ work.awards[0] }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" ref="sentinel" class="h-8"></div>
      <div v-else-if="displayedWorks.length === 0" class="text-center py-12" style="color:var(--text-muted)">
        검색 결과가 없습니다.
      </div>
    </div>
  `,
  setup() {
    const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
    const works = window.SITE_CONFIG.works;
    const categoryList = window.SITE_CONFIG.categorys || [];
    const activeCat = ref('all');
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);
    const sentinel = ref(null);
    const observerRef = ref(null);
    const skeletonDone = ref(false);

    const filtered = computed(() => {
      const entry = categoryList.find(c => c.categoryId === activeCat.value);
      const label = entry ? entry.categoryName : '';
      if (activeCat.value === 'all' || label === '전체') return works;
      return works.filter(w => w.genre === label || w.tags.includes(label));
    });

    const searchedWorks = computed(() => {
      var q = String(searchText.value || '').trim().toLowerCase();
      if (!q) return filtered.value;
      return filtered.value.filter(w => (w.title || '').toLowerCase().includes(q));
    });

    const displayedWorks = computed(() => searchedWorks.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < searchedWorks.value.length);

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
      visibleCount.value = Math.min(searchedWorks.value.length, visibleCount.value + PAGE_SIZE);
    }

    onMounted(function () {
      setTimeout(function () {
        skeletonDone.value = true;
        nextTick(function () {
          if (!sentinel.value) return;
          observerRef.value = new IntersectionObserver(function (entries) {
            if (!entries || !entries.length) return;
            if (entries[0].isIntersecting) loadMore();
          }, { rootMargin: '250px' });
          observerRef.value.observe(sentinel.value);
        });
      }, 400);
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

    return {
      categoryList,
      activeCat,
      searchText,
      displayedWorks,
      sentinel,
      hasMore,
      resetPagination,
      skeletonDone,
    };
  }
};
