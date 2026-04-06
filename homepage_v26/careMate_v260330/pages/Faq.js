/* CareMate - PageFaq */
window.PageFaq = {
  name: 'PageFaq',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">FAQ</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">자주 묻는 <span class="gradient-text">질문</span></h1>
    <p class="section-subtitle">궁금하신 점을 확인해보세요</p>
  </div>
  <div style="border-top:1px solid var(--border);max-width:720px;">
    <div v-for="(faq,i) in config.faqs" :key="i" class="faq-item">
      <button class="faq-question" @click="openFaq=openFaq===i?null:i">
        <span>{{ faq.q }}</span>
        <span class="chevron" :class="{open:openFaq===i}">▼</span>
      </button>
      <div v-show="openFaq===i" class="faq-answer">{{ faq.a }}</div>
    </div>
  </div>
  <div style="margin-top:48px;padding:32px;border-radius:16px;background:linear-gradient(135deg,var(--blue-dim),var(--teal-dim));border:1px solid rgba(26,115,232,0.2);text-align:center;">
    <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">더 궁금한 사항이 있으신가요?</div>
    <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:18px;">고객센터로 문의하시면 빠르게 답변 드립니다.</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-blue" @click="navigate('contact')" style="padding:10px 24px;">문의하기</button>
      <a :href="'tel:'+config.tel" class="btn-outline" style="padding:10px 24px;text-decoration:none;">📞 {{ config.tel }}</a>
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
