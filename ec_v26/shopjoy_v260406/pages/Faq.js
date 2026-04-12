/* ShopJoy - Faq */
window.Faq = {
  name: 'Faq',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <!-- 페이지 타이틀 배너 -->
  <div style="position:relative;overflow:hidden;height:220px;margin:-36px -32px 36px;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="FAQ"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;" />
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.42);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Support</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#fff;letter-spacing:-0.5px;margin-bottom:8px;">FAQ</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(255,255,255,0.65);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span><span style="color:#fff;">FAQ</span>
      </div>
    </div>
  </div>
  <div class="card" style="padding:8px 28px;margin-bottom:24px;">
    <div v-for="(faq, idx) in config.faqs" :key="idx" class="faq-item">
      <button class="faq-question" @click="openFaq=(openFaq===idx?null:idx)">
        <span style="flex:1;">{{ faq.q }}</span>
        <span class="chevron" :class="{open: openFaq===idx}">▼</span>
      </button>
      <div v-show="openFaq===idx" class="faq-answer">{{ faq.a }}</div>
    </div>
  </div>
  <div style="text-align:center;padding:24px 0;">
    <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:16px;">원하시는 답변을 찾지 못하셨나요?</p>
    <button class="btn-blue" @click="navigate('contact')">1:1 문의하기</button>
  </div>
</div>
  `,
  setup() {
    const { ref } = Vue;
    const openFaq = ref(null);
    return { openFaq };
  }
};
