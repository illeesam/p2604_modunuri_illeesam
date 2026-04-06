window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Home = {
  name: 'Home',
  props: ['navigate', 'config', 'products', 'selectProduct', 'openDemo'],
  data() {
    return { statItems: [] };
  },
  async mounted() {
    try {
      var r = await axiosApi.get('base/home-stats.json');
      this.statItems = (r.data && r.data.items) || [];
    } catch (e) {
      this.statItems = [
        { value: '12+', label: '협력 농가' },
        { value: '4.9', label: '평균 별점' },
        { value: '연 3만+', label: '배송 박스' },
        { value: '새벽', label: '당일·익일 도착' },
      ];
    }
  },
  methods: {
    productsByIds(ids) {
      if (!ids || !this.products || !this.products.length) return [];
      return ids.map(id => this.products.find(p => p.productId === id)).filter(Boolean);
    },
    categoryLabel(p) {
      if (!p) return '';
      const cats = (this.config && this.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    },
  },
  template: /* html */ `
  <div>
    <section class="hero-section hero-section--seedling hero-section--facility home-hero--compact" style="position:relative;z-index:1;">
      <div class="hero-seedling-bg" aria-hidden="true"></div>
      <div class="home-hero-inner">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;background:var(--blue-dim);border:1px solid rgba(0,153,204,0.2);font-size:0.72rem;font-weight:600;color:var(--blue);margin-bottom:16px;">
          <span>🌱</span><span>지역 농산물 직거래 · 새벽 배송</span>
        </div>
        <h1 style="font-size:clamp(1.65rem,4.2vw,2.65rem);font-weight:900;line-height:1.12;margin-bottom:14px;">
          밭에서 식탁까지,<br><span class="gradient-text">신선한 단고을</span>
        </h1>
        <p style="font-size:0.94rem;color:var(--text-secondary);line-height:1.65;margin-bottom:22px;max-width:520px;margin-left:auto;margin-right:auto;">
          진천 모종 육묘 하우스에서 키운 채소 모종을 산지에서 바로 — 정기 박스·픽업·레시피까지 한곳에서 만나보세요.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn-blue" @click="navigate('solution')" style="padding:11px 22px;font-size:0.9rem;">직거래 안내 →</button>
          <button class="btn-outline" @click="navigate('contact')" style="padding:11px 22px;font-size:0.9rem;">문의·주문</button>
        </div>
      </div>
    </section>
    <div class="home-stat-row">
      <div class="grid-4">
        <div
          v-for="(st, idx) in statItems"
          :key="idx"
          class="stat-card stat-card--compact fade-up"
          :style="idx ? 'animation-delay:' + (idx * 0.1) + 's' : ''"
        >
          <div class="stat-number gradient-text">{{ st.value }}</div>
          <div class="stat-label">{{ st.label }}</div>
        </div>
      </div>
    </div>
    <div class="page-wrap home-solution-compact" style="margin-top:28px;">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 class="section-title">직거래 서비스</h2>
          <p class="section-subtitle">산지에서 식탁까지 이어지는 단고을의 약속</p>
        </div>
        <button class="btn-outline btn-sm" @click="navigate('solution')">전체 보기 →</button>
      </div>
      <div class="grid-2" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));">
        <div v-for="s in config.solutions.slice(0,4)" :key="s.solutionId" class="solution-card solution-card--compact">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:1.65rem;">{{ s.emoji }}</span>
            <div>
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ s.solutionName }}</div>
              <span v-if="s.badge==='NEW'" class="badge badge-new">NEW</span>
              <span v-else-if="s.badge==='인기'" class="badge badge-hot">인기</span>
            </div>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;margin-bottom:10px;">{{ s.desc }}</p>
          <div style="display:flex;flex-wrap:wrap;gap:5px;">
            <span v-for="t in s.tags" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>
    <div
      v-for="sec in (config.homeSections || [])"
      :key="sec.homeSectionId"
      class="page-wrap home-product-section"
      style="padding-top:0;margin-top:6px;"
    >
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 class="section-title">{{ sec.homeSectionName }}</h2>
          <p class="section-subtitle">{{ sec.subtitle }}</p>
        </div>
        <button class="btn-outline btn-sm" @click="navigate('products')">전체 상품 →</button>
      </div>
      <div v-if="sec.homeSectionId === 'best'" class="home-best-grid">
        <div v-for="p in productsByIds(sec.productIds).slice(0,1)" :key="sec.homeSectionId + '-' + p.productId" class="product-card home-best-feature">
          <div v-if="p.image" class="product-card-cover home-best-feature-cover">
            <img :src="p.image" :alt="p.productName" loading="lazy" @load="$event.target.classList.add('loaded')" :style="{ objectPosition: p.imagePos || 'center center' }" />
          </div>
          <div v-else class="product-card-body" style="padding-top:22px;">
            <span style="font-size:2.5rem;">{{ p.emoji }}</span>
          </div>
          <div class="product-card-body">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
              <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">{{ p.productName }}</span>
              <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
              <span v-if="p.isSet" class="badge badge-set">세트</span>
            </div>
            <p class="home-best-desc">{{ p.desc }}</p>
            <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-bottom:12px;">{{ p.price }}</div>
          </div>
          <div class="product-card-actions">
            <button class="btn-blue btn-sm" @click="selectProduct(p)">상세보기</button>
            <button class="btn-outline btn-sm" @click="openDemo(p)">구성 보기</button>
          </div>
        </div>
        <div class="home-best-stack">
          <div v-for="p in productsByIds(sec.productIds).slice(1)" :key="sec.homeSectionId + '-' + p.productId" class="product-card home-best-side">
            <div v-if="p.image" class="product-card-cover home-best-side-cover">
              <img :src="$listImg(p.image)" :alt="p.productName" loading="lazy" @load="$event.target.classList.add('loaded')" :style="{ objectPosition: p.imagePos || 'center center' }" />
            </div>
            <div v-else class="product-card-body" style="padding-top:16px;">
              <span style="font-size:2rem;">{{ p.emoji }}</span>
            </div>
            <div class="product-card-body home-best-side-body">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                <span style="font-weight:700;color:var(--text-primary);font-size:0.85rem;line-height:1.35;">{{ p.productName }}</span>
                <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
                <span v-if="p.isSet" class="badge badge-set">세트</span>
              </div>
              <p class="home-best-desc home-best-desc--compact">{{ p.desc }}</p>
              <div style="font-size:0.82rem;font-weight:700;color:var(--blue);margin-bottom:10px;">{{ p.price }}</div>
            </div>
            <div class="product-card-actions home-best-side-actions">
              <button class="btn-blue btn-sm" @click="selectProduct(p)">상세보기</button>
              <button class="btn-outline btn-sm" @click="openDemo(p)">구성 보기</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="grid-3">
        <div v-for="p in productsByIds(sec.productIds)" :key="sec.homeSectionId + '-' + p.productId" class="product-card">
          <div v-if="p.image" class="product-card-cover" style="height:128px;">
            <img :src="$listImg(p.image)" :alt="p.productName" loading="lazy" @load="$event.target.classList.add('loaded')" :style="{ objectPosition: p.imagePos || 'center center' }" />
          </div>
          <div v-else class="product-card-body" style="padding-top:22px;">
            <span style="font-size:2.5rem;">{{ p.emoji }}</span>
          </div>
          <div class="product-card-body">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
              <span style="font-weight:700;color:var(--text-primary);font-size:0.92rem;">{{ p.productName }}</span>
              <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
              <span v-if="p.isSet" class="badge badge-set">세트</span>
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;margin-bottom:12px;">{{ p.desc }}</p>
            <div style="font-size:0.85rem;font-weight:700;color:var(--blue);margin-bottom:12px;">{{ p.price }}</div>
          </div>
          <div class="product-card-actions">
            <button class="btn-blue btn-sm" @click="selectProduct(p)">상세보기</button>
            <button class="btn-outline btn-sm" @click="openDemo(p)">구성 보기</button>
          </div>
        </div>
      </div>
    </div>
    <div class="page-wrap" style="padding-top:0;margin-top:8px;padding-bottom:60px;">
      <div style="background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));border:1px solid var(--border);border-radius:20px;padding:40px 32px;text-align:center;">
        <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">첫 박스, 지금 신청하세요</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;font-size:0.9rem;">배송 구역·알레르기 등은 문의 시 함께 안내해 드립니다.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn-blue" @click="navigate('contact')">문의·주문</button>
          <button class="btn-outline" @click="navigate('products')">제철 상품 보기</button>
        </div>
      </div>
    </div>
  </div>
  `,
};
