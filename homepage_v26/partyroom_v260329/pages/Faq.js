/* PARTYROOM — faq (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Faq = {
    name: 'Faq',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:760px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">자주 묻는 질문</h1>
          <p class="section-subtitle">예약부터 이용까지 궁금한 점을 모았습니다.</p>
        </div>

        <div class="card" style="padding:0.5rem 1.5rem;">
          <div
            v-for="(faq, idx) in partyroom.config.faqs"
            :key="idx"
            class="faq-item"
          >
            <button
              class="faq-question"
              @click="partyroom.toggleFaqAt(idx)"
            >
              <span>Q. {{ faq.q }}</span>
              <span style="font-size:0.85rem;color:var(--text-muted);flex-shrink:0;transition:transform 0.2s;" :style="{ transform: partyroom.openFaq === idx ? 'rotate(180deg)' : 'rotate(0)' }">▼</span>
            </button>
            <div class="faq-answer" v-show="partyroom.openFaq === idx">
              {{ faq.a }}
            </div>
          </div>
        </div>

        <div style="text-align:center;margin-top:2rem;padding:1.5rem;background:var(--gold-dim);border-radius:12px;border:1px solid rgba(201,168,76,0.25);">
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px;">더 궁금하신 점이 있으신가요?</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">고객센터로 문의해 주시면 성심껏 답변드리겠습니다.</div>
          <button class="btn-gold" @click="partyroom.navigate('contact')">문의하기</button>
        </div>
      </div>
    `,
  };
})(window);
