/* MODUNURI - PageHome */
window.PageHome = {
  name: 'PageHome',
  props: ['navigate', 'config', 'products', 'selectProduct', 'orderProduct', 'openDemo'],
  emits: [],
  template: /* html */ `
<div>
  <section class="hero-section" style="padding:72px 32px 64px;position:relative;z-index:1;">
    <div style="max-width:700px;margin:0 auto;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:var(--blue-dim);border:1px solid rgba(0,153,204,0.2);font-size:0.75rem;font-weight:600;color:var(--blue);margin-bottom:24px;">
        <span>🚀</span><span>소프트웨어 개발 &amp; 솔루션 전문기업</span>
      </div>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.15;margin-bottom:20px;">
        <span class="gradient-text">디지털 혁신</span>을<br>함께 만들어갑니다
      </h1>
      <p style="font-size:1rem;color:var(--text-secondary);line-height:1.75;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto;">
        AI, ERP, 클라우드, 모바일 앱 개발까지 — 기업의 디지털 전환을 위한 최적의 솔루션을 제공합니다.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('solution')" style="padding:13px 30px;font-size:0.95rem;">솔루션 보기 →</button>
        <button class="btn-outline" @click="navigate('contact')" style="padding:13px 30px;font-size:0.95rem;">무료 상담 신청</button>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <div style="padding:0 32px;margin:-28px auto 0;max-width:900px;position:relative;z-index:2;">
    <div class="grid-4">
      <div class="stat-card fade-up">
        <div class="stat-number gradient-text">20+</div>
        <div class="stat-label">완료 프로젝트</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.1s">
        <div class="stat-number gradient-text">98%</div>
        <div class="stat-label">고객 만족도</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.2s">
        <div class="stat-number gradient-text">30+</div>
        <div class="stat-label">구축사이트</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.3s">
        <div class="stat-number gradient-text">24h</div>
        <div class="stat-label">응답 시간</div>
      </div>
    </div>
  </div>

  <!-- Featured Solutions -->
  <div class="page-wrap" style="margin-top:48px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">주요 제품</h2>
        <p class="section-subtitle">기업 디지털 전환을 위한 핵심 제품</p>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('solution')">전체 보기 →</button>
    </div>
    <div class="grid-2" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));">
      <div v-for="s in config.solutions.slice(0,4)" :key="s.solutionId" class="solution-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <span style="font-size:2rem;">{{ s.emoji }}</span>
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">{{ s.solutionName }}</div>
            <span v-if="s.badge==='NEW'" class="badge badge-new">NEW</span>
            <span v-else-if="s.badge==='인기'" class="badge badge-hot">인기</span>
          </div>
        </div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;margin-bottom:14px;">{{ s.desc }}</p>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          <span v-for="t in s.tags" :key="t" class="tag">{{ t }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Featured Products -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">추천 상품</h2>
        <p class="section-subtitle">바로 도입 가능한 SaaS 솔루션</p>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('products')">전체 상품 →</button>
    </div>
    <div class="grid-3">
      <div v-for="p in featuredProducts" :key="p.productId" class="product-card" style="padding:24px;">
        <div style="font-size:2.4rem;margin-bottom:12px;">{{ p.emoji }}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-weight:700;color:var(--text-primary);">{{ p.productName }}</span>
          <span class="badge badge-cat">{{ categoryLabel(p) }}</span>
        </div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;">{{ p.desc }}</p>
        <div style="font-size:0.85rem;font-weight:700;color:var(--blue);margin-bottom:14px;">{{ p.price }}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;gap:8px;">
            <button class="btn-blue btn-sm" @click="selectProduct(p)">상세보기</button>
            <button class="btn-outline btn-sm" @click="openDemo(p)">데모 보기</button>
          </div>
          <button class="btn-blue btn-sm" style="width:100%;" @click="orderProduct(p)">주문하기</button>
        </div>
      </div>
    </div>
  </div>

  <!-- CTA Banner -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;padding-bottom:60px;">
    <div style="background:linear-gradient(135deg,var(--blue-dim),var(--green-dim));border:1px solid var(--border);border-radius:20px;padding:48px 40px;text-align:center;">
      <h2 style="font-size:1.6rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">지금 바로 시작하세요</h2>
      <p style="color:var(--text-secondary);margin-bottom:28px;font-size:0.9rem;">무료 상담을 통해 최적의 솔루션을 찾아드립니다.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('contact')">무료 상담 신청</button>
        <button class="btn-outline" @click="navigate('products')">상품 목록 보기</button>
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
    const FEATURED_IDS = [17, 14, 15];
    const featuredProducts = computed(() => {
      const prods = props.products || [];
      return FEATURED_IDS.map(id => prods.find(p => p.productId === id)).filter(Boolean);
    });
    return { categoryLabel, featuredProducts };
  }
};
