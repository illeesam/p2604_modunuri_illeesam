/* HOME — CONTACT (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.Contact = {
    name: 'Contact',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-5xl mx-auto">
<h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">문의하기</h1>
          <p class="section-subtitle mb-10">프로젝트 문의 및 무료 상담 신청</p>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
              <!-- FAQ -->
              <h2 class="font-black text-base mb-5" style="color:var(--text-primary)">자주 묻는 질문</h2>
              <div class="mb-8">
                <div v-for="faq in studio.config.faqs" :key="faq.q" class="faq-item">
                  <button class="faq-question" @click="studio.toggleFaq(faq.q)">
                    <span>{{ faq.q }}</span>
                    <svg class="w-4 h-4 flex-shrink-0 transition-transform"
                         :class="studio.openFaq===faq.q?'rotate-180':''"
                         style="color:var(--emerald)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <div v-if="studio.openFaq===faq.q" class="py-3 text-xs leading-relaxed" style="color:var(--text-secondary)">
                    {{ faq.a }}
                  </div>
                </div>
              </div>

              <!-- Contact Form -->
              <div class="card p-6 rounded-2xl" style="border-color:rgba(16,185,129,0.2)">
                <h2 class="font-black text-base mb-5 gradient-text">✉️ 프로젝트 문의</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Name -->
                  <div>
                    <label class="form-label">이름<span class="form-required">*</span></label>
                    <input v-model="studio.form.name" type="text" class="form-input" placeholder="홍길동" @input="studio.clearFormError('name')">
                    <p v-if="studio.formErrors.name" class="field-error">{{ studio.formErrors.name }}</p>
                  </div>
                  <!-- Email -->
                  <div>
                    <label class="form-label">이메일<span class="form-required">*</span></label>
                    <input v-model="studio.form.email" type="email" class="form-input" placeholder="email@company.com" @input="studio.clearFormError('email')">
                    <p v-if="studio.formErrors.email" class="field-error">{{ studio.formErrors.email }}</p>
                  </div>
                  <!-- Service -->
                  <div>
                    <label class="form-label">서비스 종류</label>
                    <select v-model="studio.form.service" class="form-input">
                      <option value="">선택하세요</option>
                      <option v-for="c in studio.contactServiceRows" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                    </select>
                  </div>
                  <!-- Budget -->
                  <div>
                    <label class="form-label">예산 범위</label>
                    <select v-model="studio.form.budget" class="form-input">
                      <option value="">선택하세요</option>
                      <option v-for="c in studio.contactBudgetRows" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
                    </select>
                  </div>
                  <!-- Description -->
                  <div class="sm:col-span-2">
                    <label class="form-label">프로젝트 내용<span class="form-required">*</span></label>
                    <textarea v-model="studio.form.desc" rows="4" class="form-input resize-none"
                              placeholder="프로젝트 요구사항을 간략히 설명해주세요" @input="studio.clearFormError('desc')"></textarea>
                    <p v-if="studio.formErrors.desc" class="field-error">{{ studio.formErrors.desc }}</p>
                  </div>
                </div>
                <button @click="studio.submitForm" class="btn-emerald mt-4 w-full py-3 rounded-xl font-bold">
                  상담 신청하기
                </button>
              </div>
            </div>

            <!-- Contact Info sidebar -->
            <div class="space-y-4">
              <div class="card p-5 rounded-xl">
                <h3 class="font-bold text-sm mb-4 gradient-text">연락처</h3>
                <div class="space-y-3 text-sm">
                  <div>
                    <div class="text-xs mb-1" style="color:var(--text-muted)">전화</div>
                    <div class="font-bold" style="color:var(--emerald)">02-0000-0000</div>
                  </div>
                  <div>
                    <div class="text-xs mb-1" style="color:var(--text-muted)">이메일</div>
                    <div style="color:var(--text-secondary)">hello@studio.kr</div>
                  </div>
                  <div>
                    <div class="text-xs mb-1" style="color:var(--text-muted)">운영시간</div>
                    <div style="color:var(--text-secondary)">평일 10:00~18:00</div>
                  </div>
                </div>
              </div>
              <div class="card p-5 rounded-xl" style="border-color:rgba(16,185,129,0.2)">
                <h3 class="font-bold text-sm mb-4 gradient-text">오시는 길</h3>
                <iframe
                  title="Google Map"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  allowfullscreen
                  style="width:100%;height:210px;border:0;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.02);"
                  src="https://www.google.com/maps?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EC%84%B1%EB%82%A8%EB%8C%80%EB%A1%9C%20997%EB%B2%88%EA%B8%B8%2049-14%20201%ED%98%B8&output=embed"
                ></iframe>
                <div class="text-xs mt-3" style="color:var(--text-secondary);line-height:1.7;">
                  경기도 성남시 중원구 성남대로 997번길 49-14 201호
                </div>
              </div>
              <div class="card p-5 rounded-xl" style="border-color:rgba(16,185,129,0.2)">
                <div class="text-3xl mb-3">🚀</div>
                <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">빠른 시작</h3>
                <p class="text-xs mb-3" style="color:var(--text-secondary)">
                  초기 상담은 무료입니다. 아이디어가 있다면 지금 바로 연락주세요.
                </p>
                <div class="text-xs" style="color:var(--text-muted)">평균 응답 시간: 24시간 이내</div>
              </div>
              <div class="card p-5 rounded-xl">
                <h3 class="font-bold text-sm mb-3 gradient-text">소셜 미디어</h3>
                <div class="flex gap-3">
                  <a href="#" class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                     style="background:var(--emerald-dim);color:var(--emerald)">in</a>
                  <a href="#" class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                     style="background:var(--emerald-dim);color:var(--emerald)">gh</a>
                  <a href="#" class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors"
                     style="background:var(--amber-dim);color:var(--amber)">ig</a>
                </div>
              </div>
            </div>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
