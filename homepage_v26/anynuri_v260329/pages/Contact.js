/* ANYNURI — 고객 센터 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageContact = {
    name: 'PageContact',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">고객 센터</h1>
    <p class="section-subtitle">작품 의뢰 및 제작 문의</p>
  </div>
  <div class="grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="card p-6">
        <h2 class="font-black text-sm mb-5" style="color:var(--text-primary)">의뢰 양식</h2>
        <form @submit.prevent="anynuri.submitForm" class="space-y-4">
          <div>
            <label class="form-label">이름<span class="form-required">*</span></label>
            <input v-model="anynuri.form.name" type="text" class="form-input" placeholder="홍길동" @input="anynuri.clearFormError('name')">
            <p v-if="anynuri.formErrors.name" class="form-error">{{ anynuri.formErrors.name }}</p>
          </div>
          <div>
            <label class="form-label">이메일<span class="form-required">*</span></label>
            <input v-model="anynuri.form.email" type="email" class="form-input" placeholder="example@email.com" @input="anynuri.clearFormError('email')">
            <p v-if="anynuri.formErrors.email" class="form-error">{{ anynuri.formErrors.email }}</p>
          </div>
          <div>
            <label class="form-label">의뢰 유형</label>
            <select v-model="anynuri.form.type" class="form-input">
              <option value="">선택해주세요 (선택)</option>
              <option value="2d">2D 셀 애니메이션</option>
              <option value="3d">3D CG 애니메이션</option>
              <option value="25d">2.5D 애니메이션</option>
              <option value="short">단편 애니메이션</option>
              <option value="series">시리즈 / OTT</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label class="form-label">의뢰 내용<span class="form-required">*</span></label>
            <textarea v-model="anynuri.form.desc" class="form-input" rows="5"
              placeholder="작품 기획 내용, 예산, 일정 등을 자유롭게 작성해주세요 (최소 10자)" @input="anynuri.clearFormError('desc')"></textarea>
            <p v-if="anynuri.formErrors.desc" class="form-error">{{ anynuri.formErrors.desc }}</p>
          </div>
          <button type="submit" class="btn-sakura w-full py-3 rounded-xl text-sm">
            ✉️ 의뢰 접수하기
          </button>
        </form>
      </div>
    </div>
    <div class="space-y-4">
      <div class="card p-5">
        <h3 class="font-black text-sm mb-4" style="color:var(--text-primary)">연락처</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-lg">📞</span>
            <div>
              <div class="text-xs" style="color:var(--text-muted)">전화</div>
              <div class="text-sm font-bold" style="color:var(--text-primary)">{{ anynuri.config.site.tel }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-lg">✉️</span>
            <div>
              <div class="text-xs" style="color:var(--text-muted)">이메일</div>
              <div class="text-sm font-bold" style="color:var(--text-primary)">{{ anynuri.config.site.email }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-lg">⏰</span>
            <div>
              <div class="text-xs" style="color:var(--text-muted)">답변 시간</div>
              <div class="text-sm font-bold" style="color:var(--text-primary)">48시간 이내</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card p-5" style="background:var(--sakura-dim);border-color:rgba(255,107,157,0.2)">
        <div class="text-2xl text-center mb-2">💬</div>
        <p class="text-xs text-center leading-relaxed" style="color:var(--text-secondary)">
          초기 상담은 무료입니다.<br>부담 없이 연락주세요!
        </p>
      </div>
      <div class="card p-5">
        <h3 class="font-black text-sm mb-3" style="color:var(--text-primary)">자주 묻는 질문</h3>
        <p class="text-xs mb-3" style="color:var(--text-secondary)">의뢰 전에 FAQ를 먼저 확인해보세요.</p>
        <button type="button" @click="anynuri.navigate('faq')" class="btn-outline w-full py-2 rounded-xl text-xs">FAQ 보기</button>
      </div>
    </div>
  </div>
</div>
    `,
  };
})(window);
