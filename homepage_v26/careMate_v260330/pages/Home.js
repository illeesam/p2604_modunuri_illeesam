/* CareMate - PageHome */
window.PageHome = {
  name: 'PageHome',
  props: ['navigate', 'config', 'products', 'selectProduct'],
  emits: [],
  template: /* html */ `
<div>
  <section class="hero-section" style="padding:80px 32px 72px;position:relative;z-index:1;">
    <div style="max-width:680px;margin:0 auto;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:20px;background:var(--blue-dim);border:1px solid rgba(26,115,232,0.25);font-size:0.78rem;font-weight:600;color:var(--blue);margin-bottom:28px;">
        <span>💙</span><span>믿을 수 있는 병원동행 & 돌봄 서비스</span>
      </div>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.2;margin-bottom:20px;">
        혼자가 아닌<br><span class="gradient-text">함께하는 케어</span>
      </h1>
      <p style="font-size:1rem;color:var(--text-secondary);line-height:1.8;margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto;">
        병원동행부터 일상생활지원, 장애인활동지원, 요양보호사까지 — 전문 케어 매니저가 안심하고 함께합니다.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('booking')" style="padding:13px 32px;font-size:0.95rem;">🏥 병원동행 예약하기</button>
        <button class="btn-outline" @click="navigate('products')" style="padding:13px 32px;font-size:0.95rem;">서비스 보기</button>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <div style="padding:0 32px;margin:-28px auto 0;max-width:900px;position:relative;z-index:2;">
    <div class="grid-4">
      <div class="stat-card fade-up"><div class="stat-number gradient-text">1,200+</div><div class="stat-label">누적 서비스 건수</div></div>
      <div class="stat-card fade-up" style="animation-delay:.1s"><div class="stat-number gradient-text">98%</div><div class="stat-label">이용자 만족도</div></div>
      <div class="stat-card fade-up" style="animation-delay:.2s"><div class="stat-number gradient-text">24h</div><div class="stat-label">긴급 연락 대응</div></div>
      <div class="stat-card fade-up" style="animation-delay:.3s"><div class="stat-number gradient-text">전문</div><div class="stat-label">자격 보유 매니저</div></div>
    </div>
  </div>

  <!-- 4대 서비스 -->
  <div class="page-wrap" style="margin-top:56px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h2 class="section-title">4대 케어 서비스</h2>
      <p class="section-subtitle">상황에 맞는 맞춤 케어 서비스를 선택하세요</p>
    </div>
    <div class="grid-4">
      <div v-for="cat in config.categorys" :key="cat.categoryId"
        class="service-card" @click="navigate('products')"
        style="padding:28px 20px;text-align:center;">
        <div style="font-size:2.6rem;margin-bottom:14px;">{{ cat.icon }}</div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">{{ cat.categoryName }}</div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;">{{ cat.desc }}</p>
      </div>
    </div>
  </div>

  <!-- 병원동행 예약 CTA -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;">
    <div style="background:linear-gradient(135deg,var(--blue-dim),var(--teal-dim));border:1.5px solid rgba(26,115,232,0.25);border-radius:24px;padding:52px 40px;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-10px;right:20px;font-size:7rem;opacity:0.06;">🏥</div>
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:16px;">빠른 예약</div>
      <h2 style="font-size:1.7rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">병원 방문이 걱정되신가요?</h2>
      <p style="color:var(--text-secondary);margin-bottom:28px;font-size:0.9rem;line-height:1.7;max-width:480px;margin-left:auto;margin-right:auto;">
        접수·대기·이동·귀가까지 전문 케어 매니저가 함께합니다. 지금 바로 예약하세요.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-blue" @click="navigate('booking')" style="padding:13px 30px;">병원동행 예약하기 →</button>
        <button class="btn-outline" @click="navigate('contact')" style="padding:13px 30px;">전화 상담</button>
      </div>
    </div>
  </div>

  <!-- 추천 상품 -->
  <div class="page-wrap" style="padding-top:0;margin-top:16px;padding-bottom:60px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div><h2 class="section-title">추천 서비스</h2><p class="section-subtitle">가장 많이 이용하는 서비스</p></div>
      <button class="btn-outline btn-sm" @click="navigate('products')">전체 보기 →</button>
    </div>
    <div class="grid-3">
      <div v-for="p in products.filter(x=>x.badge==='추천'||x.badge==='인기')" :key="p.productId" class="product-card">
        <div style="padding:24px 24px 0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
            <span style="font-size:2.5rem;">{{ p.emoji }}</span>
            <span class="badge" :class="'badge-'+(p.badge==='추천'?'blue':'amber')">{{ p.badge }}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;">{{ p.categoryName }}</div>
          <div style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">{{ p.productName }}</div>
          <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ p.desc }}</p>
          <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-bottom:16px;">{{ p.price }}</div>
        </div>
        <div style="padding:0 24px 20px;display:flex;gap:8px;">
          <button class="btn-blue btn-sm" style="flex:1;" @click="selectProduct(p)">자세히 보기</button>
          <button class="btn-outline btn-sm" style="flex:1;" @click="p.categoryId==='hospital'?navigate('booking'):navigate('order')">신청하기</button>
        </div>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { } = Vue;
    return {};
  }
};
