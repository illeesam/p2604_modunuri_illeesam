window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.About = {
  name: 'About',
  props: ['config'],
  template: /* html */ `
  <div class="page-wrap">
    <div style="margin-bottom:36px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">브랜드</div>
      <h1 class="section-title" style="font-size:2rem;margin-bottom:12px;">밭의 온기를<br><span class="gradient-text">단고을</span>에 담아</h1>
      <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.8;max-width:600px;">
        단고을은 충북 진천 모종 육묘 시설과 인근 농가와 함께 수확·출하 일정에 맞춰 물류를 설계합니다. 직거래로 중간 유통을 줄이고, 농가에는 공정한 가격을, 소비자에게는 신선함을 전합니다.
      </p>
    </div>
    <div v-if="config && config.facility && config.facility.gallery && config.facility.gallery.length" class="facility-hero card" style="padding:0;overflow:hidden;margin-bottom:28px;border:none;">
      <div class="facility-hero-grid" style="display:grid;grid-template-columns:1.1fr 1fr;gap:0;align-items:stretch;">
        <div style="min-height:220px;position:relative;">
          <img :src="config.facility.gallery[0].src" :alt="config.facility.gallery[0].caption" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
        </div>
        <div style="padding:24px 28px;display:flex;flex-direction:column;justify-content:center;background:var(--bg-card);">
          <div style="font-size:0.72rem;font-weight:700;color:var(--blue);margin-bottom:8px;">단고을 모종 사업장</div>
          <h2 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;line-height:1.35;">비닐하우스·육묘대에서<br>한 포트씩 키웁니다</h2>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;margin:0;">환기·관수 설비를 갖춘 대규모 육묘 시설에서 상추·깻잎·브라시카류 등 모종을 일괄 관리합니다.</p>
        </div>
      </div>
    </div>
    <div class="card" style="padding:28px;margin-bottom:28px;">
      <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🌱 이야기</h2>
      <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.8;">
        소규모 농가와 함께 ‘작은 밭’ 프로젝트로 시작해, 지금은 정기 구독·기업 납품·농장 픽업까지 이어지는 로컬 푸드 플랫폼으로 성장했습니다. 로고·생산 현장 이미지는 투명한 정보 공개의 일환으로 사용합니다.
      </p>
    </div>
    <div class="grid-4" style="margin-bottom:28px;">
      <div class="stat-card">
        <div class="stat-number" style="color:var(--blue);">8년+</div>
        <div class="stat-label">운영</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--green);">12+</div>
        <div class="stat-label">협력 농가</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--purple);">30+</div>
        <div class="stat-label">제철 품목</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color:var(--blue);">6개</div>
        <div class="stat-label">핵심 서비스</div>
      </div>
    </div>
    <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">핵심 가치</h2>
    <div class="grid-3" style="margin-bottom:28px;">
      <div class="value-card">
        <div style="font-size:2.5rem;margin-bottom:14px;">🥬</div>
        <div style="font-size:1rem;font-weight:700;color:var(--blue);margin-bottom:8px;">신선도</div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">수확·포장·배송 시간을 최소화하며 콜드체인을 유지합니다.</p>
      </div>
      <div class="value-card">
        <div style="font-size:2.5rem;margin-bottom:14px;">🤝</div>
        <div style="font-size:1rem;font-weight:700;color:var(--green);margin-bottom:8px;">신뢰</div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">산지·검사 정보를 공개하고 고객 소통을 소중히 합니다.</p>
      </div>
      <div class="value-card">
        <div style="font-size:2.5rem;margin-bottom:14px;">🌍</div>
        <div style="font-size:1rem;font-weight:700;color:var(--purple);margin-bottom:8px;">지속가능</div>
        <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;">제철 식재료와 친환경 포장으로 낭비를 줄입니다.</p>
      </div>
    </div>
    <template v-if="config && config.facility && config.facility.gallery && config.facility.gallery.length">
    <h2 class="section-title" style="font-size:1.2rem;margin-bottom:18px;">육묘 시설 현장</h2>
    <p class="section-subtitle" style="margin-bottom:20px;">실제 온실·육묘대 모습입니다. 트레이 단위로 품질을 맞춥니다.</p>
    <div class="facility-gallery">
      <figure v-for="(item, idx) in config.facility.gallery" :key="idx" class="facility-gallery__item">
        <div class="facility-gallery__img-wrap">
          <img :src="item.src" :alt="item.caption" loading="lazy" />
        </div>
        <figcaption class="facility-gallery__cap">{{ item.caption }}</figcaption>
      </figure>
    </div>
    </template>
  </div>
  `,
};
