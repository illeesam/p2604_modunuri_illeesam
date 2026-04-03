/* ============================================
   PARTYROOM - PageContact Component
   고객센터 + FAQ
   ============================================ */
window.PageContact = {
  name: 'PageContact',
  props: ['page'],
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">{{ page === 'faq' ? 'FAQ' : '고객센터' }}</h1>
        <p class="section-subtitle">{{ page === 'faq' ? '자주 묻는 질문' : '문의 및 예약 안내' }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: FAQ -->
        <div class="lg:col-span-2">
          <h2 class="font-black text-base mb-5" style="color:var(--text-primary)">자주 묻는 질문</h2>
          <div>
            <div v-for="faq in faqs" :key="faq.q" class="faq-item">
              <button class="faq-question" @click="toggle(faq.q)">
                <span>{{ faq.q }}</span>
                <svg class="w-4 h-4 flex-shrink-0 transition-transform"
                     :class="open===faq.q ? 'rotate-180' : ''"
                     style="color:var(--gold)"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div v-if="open===faq.q" class="faq-answer" style="white-space:pre-line">{{ faq.a }}</div>
            </div>
          </div>
        </div>

        <!-- Right: Contact + Booking Form -->
        <div class="space-y-5">
          <!-- 연락처 -->
          <div class="card p-5">
            <h3 class="font-bold text-sm mb-4" style="color:var(--text-primary)">📞 연락처</h3>
            <div class="space-y-3 text-sm">
              <div>
                <div class="text-xs mb-1" style="color:var(--text-muted)">전화</div>
                <div class="font-bold" style="color:var(--gold)">010-9998-0857</div>
              </div>
              <div>
                <div class="text-xs mb-1" style="color:var(--text-muted)">이메일</div>
                <div style="color:var(--text-secondary)">korea98781@gmail.com</div>
              </div>
              <div>
                <div class="text-xs mb-1" style="color:var(--text-muted)">운영시간</div>
                <div style="color:var(--text-secondary)">평일 09:00 ~ 20:00</div>
                <div style="color:var(--text-secondary)">주말 10:00 ~ 18:00</div>
              </div>
            </div>
          </div>

          <!-- 문의 폼 -->
          <div class="card p-5" style="border-color:rgba(201,168,76,0.2)">
            <h3 class="font-bold text-sm mb-4" style="color:var(--text-primary)">✉️ 문의하기</h3>
            <div class="space-y-3">
              <div>
                <label class="form-label">이름</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="홍길동">
              </div>
              <div>
                <label class="form-label">연락처</label>
                <input v-model="form.tel" type="text" class="form-input" placeholder="010-9998-0857">
              </div>
              <div>
                <label class="form-label">문의 내용</label>
                <textarea v-model="form.message" rows="4" class="form-input resize-none" placeholder="문의 내용을 입력해주세요"></textarea>
              </div>
              <button @click="submit" class="btn-gold w-full py-2.5 rounded-lg text-sm">
                문의 전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref } = Vue;
    const faqs = window.SITE_CONFIG.faqs;
    const open = ref(null);
    const form = ref({ name: '', tel: '', message: '' });
    const toggle = (q) => { open.value = open.value === q ? null : q; };
    const submit = () => {
      if (!form.value.name || !form.value.message) return alert('이름과 문의 내용을 입력해주세요.');
      alert('문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
      form.value = { name: '', tel: '', message: '' };
    };
    return { faqs, open, form, toggle, submit };
  }
};
