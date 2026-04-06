/* MODUNURI - PageProducts */
window.PageProducts = {
  name: 'PageProducts',
  props: ['navigate', 'config', 'products', 'selectProduct', 'orderProduct', 'openDemo'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">상품 목록</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;"><span class="gradient-text">SaaS 상품</span> 라인업</h1>
    <p class="section-subtitle">바로 도입 가능한 클라우드 기반 상품들을 만나보세요.</p>
  </div>
  <!-- Category Filter -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">
    <button v-for="cat in productCats" :key="cat.name" class="cat-btn"
      :class="{active: activeCat===cat.name}"
      @click="activeCat=cat.name">
      {{ cat.name }}
      <span v-if="cat.count > 0" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--blue);color:#fff;font-size:0.62rem;font-weight:700;margin-left:5px;vertical-align:middle;">{{ cat.count }}</span>
    </button>
  </div>
  <!-- Search -->
  <div style="margin-bottom:28px;">
    <input
      v-model="searchText"
      type="text"
      class="form-input w-full md:w-72"
      placeholder="상품명 검색"
    />
  </div>
  <!-- Skeleton Cards -->
  <div v-if="!skeletonDone" class="grid-3">
    <div v-for="i in 6" :key="'sk'+i" class="product-card" style="overflow:hidden;">
      <div style="padding:24px 24px 0;">
        <div class="skeleton-line" style="width:52px;height:52px;border-radius:10px;margin-bottom:14px;"></div>
        <div class="skeleton-line" style="height:14px;width:70%;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="height:11px;width:90%;margin-bottom:6px;"></div>
        <div class="skeleton-line" style="height:11px;width:60%;margin-bottom:14px;"></div>
        <div class="skeleton-line" style="height:18px;width:38%;margin-bottom:18px;"></div>
      </div>
      <div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;gap:8px;">
          <div class="skeleton-line" style="flex:1;height:32px;border-radius:6px;"></div>
          <div class="skeleton-line" style="flex:1;height:32px;border-radius:6px;"></div>
        </div>
        <div class="skeleton-line" style="height:32px;border-radius:6px;"></div>
      </div>
    </div>
  </div>
  <!-- Product Grid -->
  <div v-else class="grid-3">
    <div v-for="p in displayedProducts" :key="p.productId" class="product-card"
      :style="p.salesYn !== 'Y' ? 'opacity:0.42;filter:grayscale(30%);' : ''">
      <div style="padding:24px 24px 0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
          <span style="font-size:2.8rem;">{{ p.emoji }}</span>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
            <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
            <span v-if="p.salesYn !== 'Y'" style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;background:rgba(120,120,120,0.12);color:var(--text-muted);font-size:0.68rem;font-weight:700;border:1px solid rgba(120,120,120,0.2);">판매안함</span>
          </div>
        </div>
        <div style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">{{ p.productName }}</div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;">{{ p.desc }}</p>
        <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-bottom:18px;">{{ p.price }}</div>
      </div>
      <div style="padding:0 24px 24px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;gap:8px;">
          <button class="btn-blue btn-sm" style="flex:1;" @click="openDemo(p)">데모 보기</button>
          <button class="btn-outline btn-sm" style="flex:1;" @click="selectProduct(p)">상세보기</button>
        </div>
        <button class="btn-outline btn-sm" style="width:100%;" @click="orderProduct(p)">주문하기</button>
      </div>
    </div>
  </div>
  <div v-if="filteredProducts.length===0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    해당 조건의 상품이 없습니다.
  </div>
  <div id="modunuri-products-sentinel" v-show="hasMore" style="height:1px;"></div>
</div>
  `,
  setup(props) {
    const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

    const PAGE_SIZE = 6;
    const activeCat = ref('전체');
    const searchText = ref('');
    const visibleCount = ref(PAGE_SIZE);
    const skeletonDone = ref(false);

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    const productCats = computed(() => {
      const cats = (props.config && props.config.categorys) || [];
      const prods = props.products || [];
      const used = new Set(prods.map(p => p.categoryId));
      const totalSales = prods.filter(p => p.salesYn === 'Y').length;
      const ordered = cats.filter(c => used.has(c.categoryId)).map(c => {
        const count = prods.filter(p => p.categoryId === c.categoryId && p.salesYn === 'Y').length;
        return { name: c.categoryName, count };
      });
      return [{ name: '전체', count: totalSales }, ...ordered];
    });

    const filteredProducts = computed(() => {
      var q = String(searchText.value || '').trim().toLowerCase();
      const cats = (props.config && props.config.categorys) || [];
      const byCat = activeCat.value === '전체'
        ? props.products
        : props.products.filter(p => {
            const row = cats.find(c => c.categoryName === activeCat.value);
            return row && p.categoryId === row.categoryId;
          });
      const filtered = q ? byCat.filter(p => (p.productName || '').toLowerCase().includes(q)) : byCat;
      return filtered.slice().sort((a, b) => (b.salesYn === 'Y' ? 1 : 0) - (a.salesYn === 'Y' ? 1 : 0));
    });

    const displayedProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredProducts.value.length);

    function resetPagination() {
      visibleCount.value = PAGE_SIZE;
    }

    watch([activeCat, searchText], resetPagination);

    var productsObserver = null;
    onMounted(function () {
      setTimeout(function () {
        skeletonDone.value = true;
        var el = document.getElementById('modunuri-products-sentinel');
        if (!el || !('IntersectionObserver' in window)) return;
        productsObserver = new IntersectionObserver(function (entries) {
          if (!entries || !entries.length) return;
          if (entries[0].isIntersecting && hasMore.value) {
            visibleCount.value = Math.min(filteredProducts.value.length, visibleCount.value + PAGE_SIZE);
          }
        }, { rootMargin: '250px' });
        productsObserver.observe(el);
      }, 400);
    });

    onBeforeUnmount(function () {
      if (productsObserver) productsObserver.disconnect();
      productsObserver = null;
    });

    return {
      activeCat, productCats,
      searchText,
      filteredProducts, displayedProducts, hasMore,
      skeletonDone,
      resetPagination,
      categoryLabel,
    };
  }
};
