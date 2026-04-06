/* ANYNURI — 작품 상세 */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageDetail = {
    name: 'PageDetail',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-4xl mx-auto">
  <div class="mb-4">
    <button type="button" @click="anynuri.navigate('works')" class="btn-outline px-3 py-1.5 rounded-lg text-xs mb-4">← 목록으로</button>
  </div>
  <div v-if="anynuri.selectedWork" class="grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="detail-hero mb-5" :style="{ background: anynuri.selectedWork.bg }">
        <span>{{ anynuri.selectedWork.emoji }}</span>
      </div>
      <div class="flex flex-wrap items-start gap-2 mb-3">
        <h1 class="text-2xl font-black flex-1" style="color:var(--text-primary)">{{ anynuri.selectedWork.title }}</h1>
        <span v-if="anynuri.selectedWork.awards.length" class="tag-pill" style="background:var(--gold-dim);border-color:rgba(224,144,0,0.3);color:var(--gold)">🏆 수상작</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mb-4">
        <span v-for="tag in anynuri.selectedWork.tags" :key="tag" class="tag-pill">{{ tag }}</span>
      </div>
      <p class="text-sm leading-relaxed mb-5" style="color:var(--text-secondary)">{{ anynuri.selectedWork.desc }}</p>
      <div class="flex flex-wrap gap-3 mb-6">
        <button type="button" @click="anynuri.openDemo(anynuri.selectedWork)" class="btn-sky px-5 py-2.5 rounded-full">
          ▶ 미리보기 / 데모 보기
        </button>
        <button type="button" @click="anynuri.navigate('contact')" class="btn-sakura px-5 py-2.5 rounded-full">
          ✉️ 유사 작품 의뢰하기
        </button>
      </div>
      <div v-if="anynuri.selectedWork.awards.length" class="card p-4">
        <h3 class="font-black text-sm mb-3" style="color:var(--text-primary)">🏆 수상 내역</h3>
        <ul class="space-y-2">
          <li v-for="award in anynuri.selectedWork.awards" :key="award"
            class="flex items-center gap-2 text-sm" style="color:var(--text-secondary)">
            <span style="color:var(--gold)">★</span>{{ award }}
          </li>
        </ul>
      </div>
    </div>
    <div class="space-y-4">
      <div class="card p-4">
        <h3 class="font-black text-sm mb-3" style="color:var(--text-primary)">작품 정보</h3>
        <dl class="space-y-3">
          <div>
            <dt class="form-label">장르</dt>
            <dd class="text-sm font-semibold" style="color:var(--text-primary)">{{ anynuri.selectedWork.genre }}</dd>
          </div>
          <div>
            <dt class="form-label">상영 시간</dt>
            <dd class="text-sm font-semibold" style="color:var(--text-primary)">{{ anynuri.selectedWork.duration }}</dd>
          </div>
          <div>
            <dt class="form-label">제작 연도</dt>
            <dd class="text-sm font-semibold" style="color:var(--text-primary)">{{ anynuri.selectedWork.year }}</dd>
          </div>
        </dl>
      </div>
      <div class="card p-4" style="background:linear-gradient(135deg,var(--sakura-dim),var(--sky-dim))">
        <div class="text-2xl mb-2 text-center">🎨</div>
        <p class="text-xs text-center mb-3" style="color:var(--text-secondary)">이런 작품을 만들고 싶으신가요?</p>
        <button type="button" @click="anynuri.navigate('contact')" class="btn-sakura w-full py-2 rounded-xl text-xs">의뢰 상담 신청</button>
      </div>
    </div>
  </div>
</div>
    `,
  };
})(window);
