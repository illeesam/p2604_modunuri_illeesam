/* ShopJoy - PageHome */
window.PageHome = {
  name: 'PageHome',
  props: ['navigate', 'config', 'products', 'selectProduct'],
  emits: [],
  template: /* html */ `
<div>
  <!-- Hero -->
  <section class="hero-section" style="padding:72px 32px 64px;position:relative;z-index:1;">
    <div style="max-width:700px;margin:0 auto;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:var(--blue-dim);border:1px solid rgba(232,88,122,0.2);font-size:0.75rem;font-weight:600;color:var(--blue);margin-bottom:24px;">
        <span>✨</span><span>2026 S/S 신상품 입고 완료</span>
      </div>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.15;margin-bottom:20px;">
        나만의 스타일을<br><span class="gradient-text">ShopJoy</span>에서 완성하세요
      </h1>
      <p style="font-size:1rem;color:var(--text-secondary);line-height:1.75;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto;">
        트렌디한 의류를 합리적인 가격으로. 색상과 사이즈를 직접 선택해 나만의 스타일을 만들어보세요.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('products')" style="padding:13px 30px;font-size:0.95rem;">쇼핑 시작하기 →</button>
        <button class="btn-outline" @click="navigate('contact')" style="padding:13px 30px;font-size:0.95rem;">문의하기</button>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <div style="padding:0 32px;margin:-28px auto 0;max-width:900px;position:relative;z-index:2;">
    <div class="grid-4">
      <div class="stat-card fade-up">
        <div class="stat-number gradient-text">3,000+</div>
        <div class="stat-label">누적 판매</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.1s">
        <div class="stat-number gradient-text">98%</div>
        <div class="stat-label">고객 만족도</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.2s">
        <div class="stat-number gradient-text">8+</div>
        <div class="stat-label">카테고리</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.3s">
        <div class="stat-number gradient-text">1~2일</div>
        <div class="stat-label">빠른 배송</div>
      </div>
    </div>
  </div>

  <!-- Category Quick Menu -->
  <div class="page-wrap" style="margin-top:48px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">카테고리</h2>
        <p class="section-subtitle">원하는 스타일을 빠르게 찾아보세요</p>
      </div>
    </div>
    <div class="grid-4" style="gap:12px;">
      <button v-for="cat in config.categorys" :key="cat.categoryId"
        @click="navigate('products')"
        style="background:var(--bg-card);border:1.5px solid var(--border);border-radius:14px;padding:20px 12px;cursor:pointer;transition:all 0.2s;text-align:center;"
        @mouseenter="$event.currentTarget.style.borderColor='var(--blue)';$event.currentTarget.style.transform='translateY(-2px)'"
        @mouseleave="$event.currentTarget.style.borderColor='var(--border)';$event.currentTarget.style.transform='translateY(0)'">
        <div style="font-size:1.8rem;margin-bottom:8px;">{{ catEmoji(cat.categoryId) }}</div>
        <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary);">{{ cat.categoryName }}</div>
      </button>
    </div>
  </div>

  <!-- New Arrivals -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">신상품</h2>
        <p class="section-subtitle">최신 입고된 트렌디한 아이템</p>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('products')">전체 상품 →</button>
    </div>
    <div class="grid-3">
      <div v-for="p in newProducts" :key="p.productId" class="product-card" style="cursor:pointer;" @click="selectProduct(p)">
        <!-- 상품 이미지 영역 -->
        <div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));position:relative;">
          {{ p.emoji }}
          <span v-if="p.badge==='NEW'" class="badge badge-new" style="position:absolute;top:12px;left:12px;">NEW</span>
          <span v-else-if="p.badge==='인기'" class="badge badge-hot" style="position:absolute;top:12px;left:12px;">인기</span>
        </div>
        <div style="padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">{{ p.productName }}</span>
            <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
          </div>
          <!-- Color swatches -->
          <div style="display:flex;gap:5px;margin-bottom:10px;">
            <div v-for="c in p.colors.slice(0,5)" :key="c.name"
              :style="{ width:'16px', height:'16px', borderRadius:'50%', background:c.hex, border:'1.5px solid rgba(0,0,0,0.1)', flexShrink:0 }"
              :title="c.name"></div>
            <span v-if="p.colors.length>5" style="font-size:0.7rem;color:var(--text-muted);line-height:16px;">+{{ p.colors.length-5 }}</span>
          </div>
          <div style="font-size:0.9rem;font-weight:800;color:var(--blue);">{{ p.price }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Best Sellers -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">베스트셀러</h2>
        <p class="section-subtitle">많은 분들이 사랑하는 인기 아이템</p>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('products')">더 보기 →</button>
    </div>
    <div class="grid-3">
      <div v-for="p in bestProducts" :key="p.productId" class="product-card" style="cursor:pointer;" @click="selectProduct(p)">
        <div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:5rem;background:linear-gradient(135deg,var(--green-dim),var(--purple-dim));position:relative;">
          {{ p.emoji }}
          <span v-if="p.badge==='인기'" class="badge badge-hot" style="position:absolute;top:12px;left:12px;">인기</span>
        </div>
        <div style="padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">{{ p.productName }}</span>
            <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
          </div>
          <div style="display:flex;gap:5px;margin-bottom:10px;">
            <div v-for="c in p.colors.slice(0,5)" :key="c.name"
              :style="{ width:'16px', height:'16px', borderRadius:'50%', background:c.hex, border:'1.5px solid rgba(0,0,0,0.1)', flexShrink:0 }"
              :title="c.name"></div>
          </div>
          <div style="font-size:0.9rem;font-weight:800;color:var(--blue);">{{ p.price }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Banner -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;padding-bottom:60px;">
    <div style="background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));border:1px solid var(--border);border-radius:20px;padding:48px 40px;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:16px;">🛍️</div>
      <h2 style="font-size:1.6rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">지금 바로 쇼핑을 시작하세요</h2>
      <p style="color:var(--text-secondary);margin-bottom:28px;font-size:0.9rem;">원하는 색상과 사이즈를 선택하고, 나만의 스타일을 완성해보세요.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('products')">상품 보러가기</button>
        <button class="btn-outline" @click="navigate('faq')">구매 가이드</button>
      </div>
    </div>
  </div>
</div>
  `,
  setup(props) {
    const { computed } = Vue;

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    function catEmoji(id) {
      const map = { tops: '👕', bottoms: '👖', outer: '🧥', dress: '👗', acc: '💍' };
      return map[id] || '🏷️';
    }

    const newProducts = computed(() =>
      (props.products || []).filter(p => p.badge === 'NEW').slice(0, 3)
    );

    const bestProducts = computed(() =>
      (props.products || []).filter(p => p.badge === '인기').slice(0, 3)
    );

    return { categoryLabel, catEmoji, newProducts, bestProducts };
  }
};
