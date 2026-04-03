/* ============================================
   PARTYROOM - PageProducts Component
   상품목록 / 가격표
   ============================================ */
window.PageProducts = {
  name: 'PageProducts',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">상품 목록</h1>
        <p class="section-subtitle">용도별 최적 공간을 선택하세요</p>
      </div>

      <!-- Filter -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button v-for="cat in categories" :key="cat.id"
                @click="activecat = cat.id"
                class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                :style="activecat===cat.id
                  ? 'background:var(--gold);color:#0f1119'
                  : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border)'">
          {{ cat.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="mb-8">
        <input
          v-model="searchText"
          type="text"
          class="form-input w-full md:w-72"
          placeholder="공간명 검색"
          @input="resetPagination"
        />
      </div>

      <!-- Skeleton Cards -->
      <div v-if="!skeletonDone" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div v-for="i in 6" :key="'sk'+i" class="room-card" style="overflow:hidden;">
          <div class="room-thumb skeleton-line" style="font-size:0;"></div>
          <div class="p-5">
            <div class="skeleton-line" style="height:14px;width:60%;margin-bottom:8px;"></div>
            <div class="skeleton-line" style="height:11px;width:40%;margin-bottom:12px;"></div>
            <div style="display:flex;gap:6px;margin-bottom:16px;">
              <div class="skeleton-line" style="height:20px;width:60px;border-radius:20px;"></div>
              <div class="skeleton-line" style="height:20px;width:50px;border-radius:20px;"></div>
            </div>
            <div class="skeleton-line" style="height:52px;border-radius:8px;margin-bottom:12px;"></div>
            <div class="skeleton-line" style="height:36px;border-radius:8px;"></div>
          </div>
        </div>
      </div>

      <!-- Room Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div v-for="room in displayedRooms" :key="room.id"
             class="room-card cursor-pointer"
             @click="$emit('navigate','detail')">
          <div class="room-thumb">{{ room.emoji }}</div>
          <div class="p-5">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-bold" style="color:var(--text-primary)">{{ room.name }}</h3>
              <span class="badge badge-gold">{{ room.area }}</span>
            </div>
            <div class="text-xs mb-3" style="color:var(--text-secondary)">수용 인원: {{ room.capacity }}</div>

            <!-- 편의시설 -->
            <div class="flex flex-wrap gap-1 mb-4">
              <span v-for="f in room.features" :key="f" class="tag text-xs">{{ f }}</span>
            </div>

            <!-- 가격표 -->
            <div class="rounded-lg overflow-hidden" style="border:1px solid var(--border)">
              <div class="grid grid-cols-3 text-center text-xs">
                <div class="py-2 px-1" style="background:rgba(255,255,255,0.03);border-right:1px solid var(--border)">
                  <div style="color:var(--text-muted)">시간당</div>
                  <div class="font-bold mt-0.5" style="color:var(--gold)">{{ room.hourly.toLocaleString() }}</div>
                </div>
                <div class="py-2 px-1" style="background:rgba(255,255,255,0.03);border-right:1px solid var(--border)">
                  <div style="color:var(--text-muted)">1일</div>
                  <div class="font-bold mt-0.5" style="color:var(--gold)">{{ room.daily.toLocaleString() }}</div>
                </div>
                <div class="py-2 px-1" style="background:rgba(255,255,255,0.03)">
                  <div style="color:var(--text-muted)">3일~</div>
                  <div class="font-bold mt-0.5" style="color:var(--purple)">{{ room.multiday.price.toLocaleString() }}</div>
                </div>
              </div>
            </div>

            <button @click.stop="$emit('navigate','booking')"
                    class="btn-gold w-full mt-4 py-2 rounded-lg text-xs">
              예약하기
            </button>
          </div>
        </div>
      </div>

      <div v-if="hasMore" ref="sentinel" class="h-8"></div>
      <div v-else-if="displayedRooms.length === 0" class="text-center py-12" style="color:var(--text-muted)">
        검색 결과가 없습니다.
      </div>

      <!-- 장기 할인표 -->
      <div class="card p-6" style="border-color:rgba(201,168,76,0.15)">
        <h2 class="font-black text-lg mb-4 gradient-gold">장기 이용 할인</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="d in discounts" :key="d.days"
               class="flex items-center justify-between p-4 rounded-xl"
               style="background:var(--gold-dim);border:1px solid rgba(201,168,76,0.2)">
            <div>
              <div class="text-xs" style="color:var(--text-muted)">연속 이용</div>
              <div class="font-bold text-sm" style="color:var(--text-primary)">{{ d.days }}</div>
            </div>
            <div class="badge badge-gold text-base">{{ d.rate }}</div>
          </div>
        </div>
        <p class="text-xs mt-4" style="color:var(--text-muted)">
          * 장기 할인은 예약 시 자동 적용됩니다. 최대 할인율 30%
        </p>
      </div>
    </div>
  `,
  setup() {
    const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;
    const rooms = window.SITE_CONFIG.rooms;
    const discounts = window.SITE_CONFIG.discounts;
    const activecat = ref('all');
    const categories = [
      { id: 'all',    label: '전체' },
      { id: '파티',   label: '파티/이벤트' },
      { id: '회의',   label: '회의/미팅' },
      { id: '스터디', label: '스터디' },
      { id: '촬영',   label: '촬영' },
    ];
    const PAGE_SIZE = 6;
    const searchText = ref('');
    const visibleCount = ref(PAGE_SIZE);
    const sentinel = ref(null);
    const observerRef = ref(null);
    const skeletonDone = ref(false);

    const filteredRooms = computed(() => {
      var q = String(searchText.value || '').trim().toLowerCase();
      if (activecat.value === 'all') return rooms;
      var base = rooms.filter(r => r.tags.some(t => t.includes(activecat.value)));
      if (!q) return base;
      return base.filter(r => (r.name || '').toLowerCase().includes(q));
    });

    const displayedRooms = computed(() => filteredRooms.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredRooms.value.length);

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
      visibleCount.value = Math.min(filteredRooms.value.length, visibleCount.value + PAGE_SIZE);
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

    watch(activecat, function () {
      resetPagination();
    });
    watch(searchText, function () {
      resetPagination();
    });

    return {
      rooms,
      discounts,
      activecat,
      categories,
      filteredRooms,
      displayedRooms,
      sentinel,
      hasMore,
      resetPagination,
      skeletonDone,
    };
  }
};
