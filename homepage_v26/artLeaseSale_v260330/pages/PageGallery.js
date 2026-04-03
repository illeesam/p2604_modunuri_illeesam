/* ArtGallery - PageGallery */
window.PageGallery = {
  name: 'PageGallery',
  props: ['navigate', 'config', 'artworks', 'selectArtwork'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:12px;border:1px solid rgba(201,160,89,0.3);">갤러리</div>
    <h1 class="section-title" style="margin-bottom:8px;">작품 목록</h1>
    <div class="art-divider"><span class="art-divider-icon">🖼️</span></div>
  </div>

  <!-- Search & Filter -->
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;align-items:center;">
    <input v-model="searchText" type="text" placeholder="작품명 검색…" class="form-input" style="max-width:280px;">
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      <button v-for="cat in artCats" :key="cat" @click="activeCat=cat" class="cat-btn" :class="{active:activeCat===cat}">{{ cat }}</button>
    </div>
  </div>

  <!-- Artwork Grid -->
  <div class="grid-3" v-if="displayedArtworks.length">
    <div v-for="a in displayedArtworks" :key="a.artworkId" class="artwork-card" @click="selectArtwork(a)">
      <div class="artwork-thumb" style="height:200px;">
        <img v-if="a.image" :src="$listImg(a.image)" :alt="a.artworkName" loading="lazy"
          @load="$event.target.classList.add('loaded')"
          style="width:100%;height:100%;object-fit:cover;display:block;" />
        <span v-else>{{ a.emoji }}</span>
        <span v-if="a.badge" style="position:absolute;top:12px;right:12px;" :class="a.badge==='신작'?'badge badge-new':'badge badge-hot'">{{ a.badge }}</span>
      </div>
      <div style="padding:20px 18px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
          <span style="font-weight:700;color:var(--text-primary);">{{ a.artworkName }}</span>
          <span class="badge badge-cat">{{ categoryLabel(a) }}</span>
        </div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ a.desc }}</p>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">{{ a.size }} · {{ a.year }}년</div>
        <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:0.7rem;color:var(--text-muted);">대여</div>
            <div style="font-weight:700;color:var(--gold);font-size:0.85rem;">{{ a.leasePrice }}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.7rem;color:var(--text-muted);">구매</div>
            <div style="font-weight:700;color:var(--burgundy);font-size:0.85rem;">{{ a.salePrice }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else style="text-align:center;padding:60px;color:var(--text-muted);">
    <div style="font-size:3rem;margin-bottom:12px;">🔍</div>
    <div>검색 결과가 없습니다</div>
  </div>

  <!-- Infinite scroll sentinel -->
  <div id="gallery-sentinel" style="height:4px;margin-top:16px;"></div>
  <div v-if="hasMore" style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem;">작품 더 불러오는 중…</div>
</div>
`,
  setup(props) {
    const { ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

    const PAGE_SIZE = 6;
    const activeCat = ref('전체');
    const searchText = ref('');
    const visibleCount = ref(PAGE_SIZE);

    function categoryLabel(a) {
      if (!a) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === a.categoryId);
      return row ? row.categoryName : a.categoryId;
    }

    const artCats = computed(() => {
      const cats = (props.config && props.config.categorys) || [];
      return ['전체', ...cats.map(c => c.categoryName)];
    });

    const filteredArtworks = computed(() => {
      const q = String(searchText.value || '').trim().toLowerCase();
      const cats = (props.config && props.config.categorys) || [];
      const byCat = activeCat.value === '전체'
        ? props.artworks
        : props.artworks.filter(a => {
            const row = cats.find(c => c.categoryName === activeCat.value);
            return row && a.categoryId === row.categoryId;
          });
      if (!q) return byCat;
      return byCat.filter(a => (a.artworkName || '').toLowerCase().includes(q) || (a.desc || '').toLowerCase().includes(q));
    });
    const displayedArtworks = computed(() => filteredArtworks.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredArtworks.value.length);

    watch([activeCat, searchText], () => { visibleCount.value = PAGE_SIZE; });

    let galleryObserver = null;
    onMounted(() => {
      const el = document.getElementById('gallery-sentinel');
      if (!el || !('IntersectionObserver' in window)) return;
      galleryObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore.value) {
          visibleCount.value = Math.min(filteredArtworks.value.length, visibleCount.value + PAGE_SIZE);
        }
      }, { rootMargin: '250px' });
      galleryObserver.observe(el);
    });
    onBeforeUnmount(() => {
      if (galleryObserver) galleryObserver.disconnect();
    });

    return { activeCat, artCats, searchText, displayedArtworks, hasMore, categoryLabel };
  }
};
