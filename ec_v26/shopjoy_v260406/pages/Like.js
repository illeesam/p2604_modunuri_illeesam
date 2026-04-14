/* ShopJoy - Like (좋아요 / 위시리스트) */
window.Like = {
  name: 'Like',
  props: ['navigate', 'config', 'products', 'likes', 'toggleLike', 'selectProduct'],
  setup(props) {
    const { computed } = Vue;

    const likedProducts = computed(() => {
      const likeSet = props.likes || new Set();
      return (props.products || []).filter(p => likeSet.has(p.productId));
    });

    return { likedProducts };
  },
  template: /* html */ `
<div class="page-wrap">

  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-2.jpg" alt="위시리스트"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">My</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">위시리스트</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#333;">위시리스트</span>
      </div>
    </div>
  </div>

  <!-- 상품 목록 -->
  <div v-if="likedProducts.length" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:20px;">
    <div v-for="p in likedProducts" :key="p.productId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;overflow:hidden;cursor:pointer;transition:box-shadow .2s;"
      @mouseenter="$event.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
      @mouseleave="$event.currentTarget.style.boxShadow=''">

      <!-- 이미지 -->
      <div style="position:relative;aspect-ratio:1;background:#fff;padding:clamp(8px,2vw,16px);overflow:hidden;" @click="selectProduct(p)">
        <img v-if="p.image" :src="p.image" :alt="p.prodNm" style="width:100%;height:100%;object-fit:contain;" />
        <span v-if="p.badge" style="position:absolute;top:10px;left:10px;font-size:0.68rem;font-weight:600;padding:3px 8px;border-radius:2px;color:#fff;"
          :style="{ background: p.badge==='NEW' ? '#1a1a1a' : '#8b7355' }">{{ p.badge }}</span>
        <!-- 좋아요 해제 -->
        <button @click.stop="toggleLike(p.productId)"
          style="position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      <!-- 정보 -->
      <div style="padding:14px 16px;" @click="selectProduct(p)">
        <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">{{ p.prodNm }}</div>
        <div style="font-size:0.85rem;color:var(--text-muted);">{{ p.price }}</div>
      </div>
    </div>
  </div>

  <!-- 빈 상태 -->
  <div v-else style="text-align:center;padding:clamp(40px,8vw,80px) 0;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom:16px;">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
    <div style="font-size:0.95rem;color:var(--text-muted);margin-bottom:20px;">좋아요한 상품이 없습니다</div>
    <button class="btn-outline" @click="navigate('prodList')" style="padding:10px 24px;">상품 둘러보기</button>
  </div>

</div>
  `
};
