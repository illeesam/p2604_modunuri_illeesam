/* ANYNURI — FAQ */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageFaq = {
    name: 'PageFaq',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-2xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">자주 묻는 질문</h1>
    <p class="section-subtitle">FAQ — 의뢰 전 꼭 확인해보세요</p>
  </div>
  <div class="card p-2">
    <div v-for="(faq, idx) in anynuri.config.faqs" :key="idx" class="faq-item">
      <button type="button" class="faq-question" @click="anynuri.toggleFaq(idx)">
        <span class="flex items-center gap-2">
          <span style="color:var(--sakura)">Q</span>
          {{ faq.q }}
        </span>
        <span class="flex-shrink-0 transition-transform duration-200"
          :style="{ transform: anynuri.openFaq===idx ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }">
          ▾
        </span>
      </button>
      <div v-show="anynuri.openFaq === idx"
        class="pb-4 text-xs leading-relaxed"
        style="color:var(--text-secondary);padding-left:1.5rem">
        <span style="color:var(--sky);font-weight:700;margin-right:0.5rem">A</span>{{ faq.a }}
      </div>
    </div>
  </div>
  <div class="card p-6 mt-6 text-center" style="background:linear-gradient(135deg,var(--sakura-dim),var(--sky-dim))">
    <div class="text-2xl mb-2">🙋</div>
    <h3 class="font-black text-sm mb-2" style="color:var(--text-primary)">원하는 답변을 찾지 못하셨나요?</h3>
    <p class="text-xs mb-4" style="color:var(--text-secondary)">직접 문의해 주시면 48시간 이내에 답변 드립니다.</p>
    <button type="button" @click="anynuri.navigate('contact')" class="btn-sakura px-6 py-2.5 rounded-full text-sm">문의하기</button>
  </div>
</div>
    `,
  };
})(window);
