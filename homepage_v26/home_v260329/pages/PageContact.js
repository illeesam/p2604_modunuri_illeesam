/* HOME - PageContact */
window.PageContact = {
  name: 'PageContact',
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">문의하기</h1>
      <p class="section-subtitle mb-10">프로젝트 문의 및 무료 상담 신청</p>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <!-- FAQ -->
          <h2 class="font-black text-base mb-5" style="color:var(--text-primary)">자주 묻는 질문</h2>
          <div class="mb-8">
            <div v-for="faq in faqs" :key="faq.q" class="faq-item">
              <button class="faq-question" @click="open=open===faq.q?null:faq.q">
                <span>{{ faq.q }}</span>
                <svg class="w-4 h-4 flex-shrink-0 transition-transform" :class="open===faq.q?'rotate-180':''"
                     style="color:var(--emerald)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div v-if="open===faq.q" class="py-3 text-xs leading-relaxed" style="color:var(--text-secondary)">{{ faq.a }}</div>
            </div>
          </div>
          <!-- Form -->
          <div class="card p-6 rounded-2xl" style="border-color:rgba(16,185,129,0.2)">
            <h2 class="font-black text-base mb-5 gradient-text">✉️ 프로젝트 문의</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="form-label">이름</label><input v-model="form.name" type="text" class="form-input" placeholder="홍길동"></div>
              <div><label class="form-label">이메일</label><input v-model="form.email" type="email" class="form-input" placeholder="email@company.com"></div>
              <div><label class="form-label">서비스 종류</label>
                <select v-model="form.service" class="form-input">
                  <option value="">선택하세요</option>
                  <option v-for="c in contactServiceRows" :key="c.code_id + '-' + c.code_value" :value="c.code_value">{{ c.code_label }}</option>
                </select>
              </div>
              <div><label class="form-label">예산 범위</label>
                <select v-model="form.budget" class="form-input">
                  <option value="">선택하세요</option>
                  <option v-for="c in contactBudgetRows" :key="c.code_id + '-' + c.code_value" :value="c.code_value">{{ c.code_label }}</option>
                </select>
              </div>
              <div class="sm:col-span-2"><label class="form-label">프로젝트 내용</label><textarea v-model="form.desc" rows="4" class="form-input resize-none" placeholder="프로젝트 요구사항을 간략히 설명해주세요"></textarea></div>
            </div>
            <button @click="submit" class="btn-emerald mt-4 w-full py-3 rounded-xl font-bold">상담 신청하기</button>
          </div>
        </div>
        <div class="space-y-4">
          <div class="card p-5 rounded-xl">
            <h3 class="font-bold text-sm mb-4 gradient-text">연락처</h3>
            <div class="space-y-3 text-sm">
              <div><div class="text-xs mb-1" style="color:var(--text-muted)">전화</div><div class="font-bold" style="color:var(--emerald)">02-0000-0000</div></div>
              <div><div class="text-xs mb-1" style="color:var(--text-muted)">이메일</div><div style="color:var(--text-secondary)">hello@studio.kr</div></div>
              <div><div class="text-xs mb-1" style="color:var(--text-muted)">운영시간</div><div style="color:var(--text-secondary)">평일 10:00~18:00</div></div>
            </div>
          </div>
          <div class="card p-5 rounded-xl" style="border-color:rgba(16,185,129,0.2)">
            <div class="text-3xl mb-3">🚀</div>
            <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">빠른 시작</h3>
            <p class="text-xs mb-3" style="color:var(--text-secondary)">초기 상담은 무료입니다. 아이디어가 있다면 지금 바로 연락주세요.</p>
            <div class="text-xs" style="color:var(--text-muted)">평균 응답 시간: 24시간 이내</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref, computed } = Vue;
    const faqs = window.SITE_CONFIG.faqs;
    const open = ref(null);
    const form = ref({ name:'', email:'', service:'', budget:'', desc:'' });
    const contactServiceRows = computed(() =>
      window.cmUtil.codesByGroupOrRows(window.SITE_CONFIG || {}, 'home_contact_service', [
        { code_id: 1, code_value: 'web', code_label: '웹 개발' },
        { code_id: 2, code_value: 'mobile', code_label: '모바일 앱' },
        { code_id: 3, code_value: 'uiux', code_label: 'UI/UX 디자인' },
        { code_id: 4, code_value: 'data', code_label: '데이터 분석' },
        { code_id: 5, code_value: 'cloud', code_label: '클라우드' },
        { code_id: 6, code_value: 'consulting', code_label: '컨설팅' },
      ])
    );
    const contactBudgetRows = computed(() =>
      window.cmUtil.codesByGroupOrRows(window.SITE_CONFIG || {}, 'home_contact_budget', [
        { code_id: 1, code_value: 'lt500', code_label: '500만원 미만' },
        { code_id: 2, code_value: '500_1000', code_label: '500~1000만원' },
        { code_id: 3, code_value: '1000_3000', code_label: '1000~3000만원' },
        { code_id: 4, code_value: 'gt3000', code_label: '3000만원 이상' },
      ])
    );
    const submit = () => {
      if (!form.value.name || !form.value.desc) return alert('이름과 프로젝트 내용을 입력해주세요.');
      alert('상담 신청이 완료되었습니다!\n24시간 이내에 연락드리겠습니다.');
      form.value = { name:'', email:'', service:'', budget:'', desc:'' };
    };
    return { faqs, open, form, submit, contactServiceRows, contactBudgetRows };
  }
};
