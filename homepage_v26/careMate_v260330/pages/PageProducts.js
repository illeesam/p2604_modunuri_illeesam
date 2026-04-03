/* CareMate - PageProducts */
window.PageProducts = {
  name: 'PageProducts',
  props: ['navigate', 'config', 'products', 'selectProduct'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:12px;">서비스 목록</div>
    <h1 class="section-title" style="margin-bottom:10px;"><span class="gradient-text">케어 서비스</span> 전체 목록</h1>
    <p class="section-subtitle">상황에 맞는 서비스를 선택하세요</p>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
    <button v-for="cat in productCats" :key="cat" class="cat-btn" :class="{active:activeCat===cat}" @click="activeCat=cat">{{ cat }}</button>
  </div>
  <div style="margin-bottom:24px;">
    <input v-model="searchText" type="text" placeholder="서비스명 검색…" class="form-input" style="max-width:300px;">
  </div>
  <div v-if="!skeletonDone" class="grid-3">
    <div v-for="i in 6" :key="'sk'+i" class="product-card" style="overflow:hidden;">
      <div style="padding:24px 24px 0;">
        <div class="skeleton-line" style="width:48px;height:48px;border-radius:10px;margin-bottom:12px;"></div>
        <div class="skeleton-line" style="height:14px;width:65%;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="height:11px;width:90%;margin-bottom:6px;"></div>
        <div class="skeleton-line" style="height:11px;width:75%;margin-bottom:12px;"></div>
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <div class="skeleton-line" style="height:20px;width:50px;border-radius:20px;"></div>
          <div class="skeleton-line" style="height:20px;width:40px;border-radius:20px;"></div>
        </div>
        <div class="skeleton-line" style="height:18px;width:40%;margin-bottom:4px;"></div>
        <div class="skeleton-line" style="height:11px;width:55%;margin-bottom:16px;"></div>
      </div>
      <div style="padding:0 24px 20px;display:flex;gap:8px;">
        <div class="skeleton-line" style="flex:1;height:32px;border-radius:6px;"></div>
        <div class="skeleton-line" style="flex:1;height:32px;border-radius:6px;"></div>
      </div>
    </div>
  </div>
  <div v-else-if="displayedProducts.length" class="grid-3">
    <div v-for="p in displayedProducts" :key="p.productId" class="product-card">
      <div style="padding:24px 24px 0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
          <span style="font-size:2.6rem;">{{ p.emoji }}</span>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span v-if="p.badge" class="badge" :class="p.badge==='추천'?'badge-blue':p.badge==='인기'?'badge-teal':'badge-amber'">{{ p.badge }}</span>
            <span class="badge badge-cat" style="font-size:0.65rem;">{{ p.categoryName }}</span>
          </div>
        </div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">{{ p.productName }}</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.desc }}</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
          <span v-for="t in p.tags" :key="t" class="tag">{{ t }}</span>
        </div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-bottom:4px;">{{ p.price }}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:16px;">{{ p.priceNote }}</div>
      </div>
      <div style="padding:0 24px 20px;display:flex;gap:8px;">
        <button class="btn-blue btn-sm" style="flex:1;" @click="selectProduct(p)">상세보기</button>
        <button class="btn-outline btn-sm" style="flex:1;" @click="p.categoryId==='hospital'?navigate('booking'):navigate('order')">신청하기</button>
      </div>
    </div>
  </div>
  <div v-else style="text-align:center;padding:60px;color:var(--text-muted);"><div style="font-size:2.5rem;margin-bottom:12px;">🔍</div><div>검색 결과가 없습니다</div></div>
  <div id="products-sentinel" style="height:4px;margin-top:16px;"></div>
</div>
`,
  setup(props) {
    const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

    const PAGE_SIZE = 6;
    const activeCat = ref('전체');
    const productCats = computed(() => ['전체', ...window.SITE_CONFIG.categorys.map(c => c.categoryName)]);
    const searchText = ref('');
    const visibleCount = ref(PAGE_SIZE);
    const skeletonDone = ref(false);

    const filteredProducts = computed(() => {
      const q = String(searchText.value || '').trim().toLowerCase();
      const byCat = activeCat.value === '전체' ? props.products : props.products.filter(p => p.categoryName === activeCat.value);
      if (!q) return byCat;
      return byCat.filter(p => p.productName.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    });
    const displayedProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredProducts.value.length);

    watch([activeCat, searchText], () => { visibleCount.value = PAGE_SIZE; });

    let sentinel = null;
    onMounted(() => {
      setTimeout(() => {
        skeletonDone.value = true;
        const el = document.getElementById('products-sentinel');
        if (!el || !('IntersectionObserver' in window)) return;
        sentinel = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting && hasMore.value) visibleCount.value = Math.min(filteredProducts.value.length, visibleCount.value + PAGE_SIZE);
        }, { rootMargin: '250px' });
        sentinel.observe(el);
      }, 400);
    });
    onBeforeUnmount(() => { if (sentinel) sentinel.disconnect(); });

    return {
      activeCat, productCats, searchText,
      filteredProducts, displayedProducts, hasMore,
      skeletonDone,
    };
  }
};
