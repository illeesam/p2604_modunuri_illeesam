/* ShopJoy - Products */
window.Products = {
  name: 'Products',
  props: ['navigate', 'config', 'products', 'selectProduct'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">상품 목록</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;"><span class="gradient-text">전체 상품</span> 라인업</h1>
    <p class="section-subtitle">색상·사이즈를 선택해 나만의 스타일을 완성하세요.</p>
  </div>

  <!-- Category Filter -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
    <button v-for="cat in productCats" :key="cat" class="cat-btn"
      :class="{active: activeCat===cat}"
      @click="activeCat=cat">{{ cat }}</button>
  </div>

  <!-- Search -->
  <div style="margin-bottom:24px;">
    <input v-model="searchText" type="text" class="form-input" placeholder="상품명 검색" style="max-width:320px;" />
  </div>

  <!-- Skeleton -->
  <div v-if="!skeletonDone" class="grid-3">
    <div v-for="i in 6" :key="'sk'+i" class="product-card" style="overflow:hidden;">
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

  <!-- Product Grid -->
  <div v-else class="grid-3">
    <div v-for="p in displayedProducts" :key="p.productId" class="product-card" style="cursor:pointer;" @click="selectProduct(p)">
      <!-- Thumbnail -->
      <div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));position:relative;">
        {{ p.emoji }}
        <span v-if="p.badge==='NEW'" class="badge badge-new" style="position:absolute;top:12px;left:12px;">NEW</span>
        <span v-else-if="p.badge==='인기'" class="badge badge-hot" style="position:absolute;top:12px;left:12px;">인기</span>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;flex:1;margin-right:8px;">{{ p.productName }}</span>
          <span class="badge badge-cat" style="flex-shrink:0;">{{ categoryLabel(p) }}</span>
        </div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.desc }}</p>
        <!-- Color swatches -->
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:10px;flex-wrap:wrap;">
          <div v-for="c in p.colors.slice(0,6)" :key="c.name"
            :style="{ width:'18px', height:'18px', borderRadius:'50%', background:c.hex, border:'1.5px solid rgba(0,0,0,0.12)', flexShrink:0, cursor:'default' }"
            :title="c.name"></div>
          <span v-if="p.colors.length>6" style="font-size:0.7rem;color:var(--text-muted);">+{{ p.colors.length-6 }}</span>
        </div>
        <!-- Sizes preview -->
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;">
          <span v-for="s in p.sizes.slice(0,5)" :key="s"
            style="font-size:0.68rem;padding:2px 6px;border-radius:4px;border:1px solid var(--border);color:var(--text-muted);">{{ s }}</span>
          <span v-if="p.sizes.length>5" style="font-size:0.68rem;color:var(--text-muted);">+{{ p.sizes.length-5 }}</span>
        </div>
        <div style="font-size:0.9rem;font-weight:800;color:var(--blue);margin-bottom:10px;">{{ p.price }}</div>
        <button class="btn-blue" style="width:100%;" @click.stop="selectProduct(p)">색상·사이즈 선택</button>
      </div>
    </div>
  </div>

  <div v-if="skeletonDone && filteredProducts.length===0" style="text-align:center;padding:60px 0;color:var(--text-muted);">
    해당 조건의 상품이 없습니다.
  </div>
  <div id="shopjoy-products-sentinel" v-show="hasMore" style="height:1px;"></div>
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
      const used = new Set((props.products || []).map(p => p.categoryId));
      const ordered = cats.filter(c => used.has(c.categoryId)).map(c => c.categoryName);
      return ['전체', ...ordered];
    });

    const filteredProducts = computed(() => {
      const q = String(searchText.value || '').trim().toLowerCase();
      const cats = (props.config && props.config.categorys) || [];
      const byCat = activeCat.value === '전체'
        ? props.products
        : props.products.filter(p => {
            const row = cats.find(c => c.categoryName === activeCat.value);
            return row && p.categoryId === row.categoryId;
          });
      if (!q) return byCat;
      return byCat.filter(p => (p.productName || '').toLowerCase().includes(q));
    });

    const displayedProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredProducts.value.length);

    watch([activeCat, searchText], () => { visibleCount.value = PAGE_SIZE; });

    var observer = null;
    onMounted(function () {
      setTimeout(function () {
        skeletonDone.value = true;
        var el = document.getElementById('shopjoy-products-sentinel');
        if (!el || !('IntersectionObserver' in window)) return;
        observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting && hasMore.value) {
            visibleCount.value = Math.min(filteredProducts.value.length, visibleCount.value + PAGE_SIZE);
          }
        }, { rootMargin: '250px' });
        observer.observe(el);
      }, 400);
    });

    onBeforeUnmount(function () { if (observer) observer.disconnect(); observer = null; });

    return { activeCat, productCats, searchText, filteredProducts, displayedProducts, hasMore, skeletonDone, categoryLabel };
  }
};
