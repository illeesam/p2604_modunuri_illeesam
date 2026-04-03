/* MODUNURI - PageFaq */
window.PageFaq = {
  name: 'PageFaq',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:32px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:700;margin-bottom:14px;">FAQ</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">자주 묻는 <span class="gradient-text">질문</span></h1>
    <p class="section-subtitle">모두누리 서비스에 대해 자주 문의하시는 내용을 정리했습니다.</p>
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
