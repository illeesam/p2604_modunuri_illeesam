/* ArtGallery - PageLease */
window.PageLease = {
  name: 'PageLease',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:14px;border:1px solid rgba(201,160,89,0.3);">대여 안내</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;font-family:'Noto Serif KR',serif;">그림 대여 서비스</h1>
    <p class="section-subtitle">공간에 예술을 더하는 가장 쉬운 방법</p>
    <div class="art-divider"><span class="art-divider-icon">📋</span></div>
  </div>

  <!-- 대여 요금제 -->
  <div style="margin-bottom:48px;">
    <h2 style="font-size:1.15rem;font-weight:700;color:var(--text-primary);margin-bottom:20px;">대여 요금 안내</h2>
    <div class="grid-4">
      <div class="plan-card">
        <div style="font-size:1.8rem;margin-bottom:12px;">🖼️</div>
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);margin-bottom:6px;">소형 (10호)</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--gold);margin:12px 0;">5만원<span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/월</span></div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;">53×45.5cm<br>아담한 공간에 적합</p>
      </div>
      <div class="plan-card">
        <div style="font-size:1.8rem;margin-bottom:12px;">🖼️</div>
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);margin-bottom:6px;">중소형 (15호)</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--gold);margin:12px 0;">7만원<span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/월</span></div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;">65×53cm<br>소파 위, 사무실 벽 등</p>
      </div>
      <div class="plan-card featured">
        <div style="font-size:0.7rem;font-weight:700;color:var(--gold);margin-bottom:8px;padding:3px 10px;background:var(--gold-dim);border-radius:10px;display:inline-block;">가장 인기</div>
        <div style="font-size:1.8rem;margin-bottom:8px;">🖼️</div>
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);margin-bottom:6px;">중형 (20호)</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--gold);margin:12px 0;">10만원<span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/월</span></div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;">72.7×60.6cm<br>거실, 회의실 등</p>
      </div>
      <div class="plan-card">
        <div style="font-size:1.8rem;margin-bottom:12px;">🖼️</div>
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);margin-bottom:6px;">대형 (30호)</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--gold);margin:12px 0;">15만원<span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/월</span></div>
        <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.6;">90.9×72.7cm<br>대형 공간, 갤러리 효과</p>
      </div>
    </div>
    <div style="margin-top:16px;padding:14px 18px;border-radius:10px;background:var(--gold-dim);border:1px solid rgba(201,160,89,0.25);font-size:0.82rem;color:var(--text-secondary);">
      💡 3개월 이상 장기 대여 시 <strong style="color:var(--gold);">10% 할인</strong>, 6개월 이상 <strong style="color:var(--gold);">15% 할인</strong>, 1년 이상 <strong style="color:var(--gold);">20% 할인</strong> 적용됩니다.
    </div>
  </div>

  <!-- 대여 프로세스 -->
  <div style="margin-bottom:48px;">
    <h2 style="font-size:1.15rem;font-weight:700;color:var(--text-primary);margin-bottom:20px;">대여 진행 절차</h2>
    <div class="grid-4">
      <div style="text-align:center;padding:24px 16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;margin:0 auto 14px;">1</div>
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;">작품 선택</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">갤러리에서 원하는 작품을 선택하세요</p>
      </div>
      <div style="text-align:center;padding:24px 16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;margin:0 auto 14px;">2</div>
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;">대여 문의</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">전화 또는 문의폼으로 대여 신청</p>
      </div>
      <div style="text-align:center;padding:24px 16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;margin:0 auto 14px;">3</div>
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;">계약 및 결제</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">대여 기간 협의 후 계약 진행</p>
      </div>
      <div style="text-align:center;padding:24px 16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;margin:0 auto 14px;">4</div>
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;">설치 및 감상</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">배송 또는 직접 설치 후 감상</p>
      </div>
    </div>
  </div>

  <!-- FAQ -->
  <div>
    <h2 style="font-size:1.15rem;font-weight:700;color:var(--text-primary);margin-bottom:20px;">자주 묻는 질문</h2>
    <div style="border-top:1px solid var(--border);">
      <div v-for="(faq, i) in config.faqs" :key="i" class="faq-item">
        <button class="faq-question" @click="openFaq = openFaq===i ? null : i">
          <span>{{ faq.q }}</span>
          <span class="chevron" :class="{open: openFaq===i}">▼</span>
        </button>
        <div v-show="openFaq===i" class="faq-answer">{{ faq.a }}</div>
      </div>
    </div>
  </div>

  <!-- CTA -->
  <div style="margin-top:48px;padding:40px;border-radius:20px;background:linear-gradient(135deg,var(--gold-dim),var(--burgundy-dim));border:1.5px solid rgba(201,160,89,0.3);text-align:center;">
    <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">지금 바로 대여 문의하세요</h3>
    <p style="color:var(--text-secondary);margin-bottom:24px;font-size:0.875rem;">원하는 작품이 있으시면 편하게 연락주세요</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-gold" @click="navigate('contact')" style="padding:12px 28px;">문의하기</button>
      <button class="btn-outline" @click="navigate('gallery')" style="padding:12px 28px;">갤러리 보기</button>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { ref } = Vue;
    const openFaq = ref(null);
    return { openFaq };
  }
};
