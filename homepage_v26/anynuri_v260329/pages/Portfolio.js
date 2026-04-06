/* ANYNURI — 작품 목록(테이블) */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PagePortfolio = {
    name: 'PagePortfolio',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-5xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">작품 목록</h1>
    <p class="section-subtitle">전체 포트폴리오 — {{ anynuri.works.length }}개 작품</p>
  </div>
  <div class="card hidden md:block overflow-hidden mb-4">
    <table class="data-table">
      <thead>
        <tr>
          <th>작품</th>
          <th>장르</th>
          <th>연도</th>
          <th>상영 시간</th>
          <th>수상</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in anynuri.works" :key="w.id">
          <td>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                :style="{ background: w.bg }">{{ w.emoji }}</div>
              <div>
                <div class="font-bold text-sm" style="color:var(--text-primary)">{{ w.title }}</div>
                <div class="flex gap-1 mt-0.5">
                  <span v-for="tag in w.tags.slice(0,2)" :key="tag" class="tag-pill" style="font-size:0.65rem">{{ tag }}</span>
                </div>
              </div>
            </div>
          </td>
          <td><span class="tag-pill">{{ w.genre }}</span></td>
          <td style="color:var(--text-secondary)">{{ w.year }}</td>
          <td style="color:var(--text-secondary)">{{ w.duration }}</td>
          <td>
            <span v-if="w.awards.length" class="text-xs font-semibold" style="color:var(--gold)">🏆 {{ w.awards.length }}건</span>
            <span v-else class="text-xs" style="color:var(--text-muted)">—</span>
          </td>
          <td>
            <button type="button" @click="anynuri.selectWork(w)" class="btn-sakura px-3 py-1.5 rounded-lg text-xs">상세보기</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="md:hidden grid gap-4">
    <div v-for="w in anynuri.works" :key="w.id" class="card p-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          :style="{ background: w.bg }">{{ w.emoji }}</div>
        <div class="flex-1 min-w-0">
          <div class="font-black text-sm truncate" style="color:var(--text-primary)">{{ w.title }}</div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="tag-pill" style="font-size:0.65rem">{{ w.genre }}</span>
            <span class="text-xs" style="color:var(--text-muted)">{{ w.year }}</span>
          </div>
        </div>
      </div>
      <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ w.desc }}</p>
      <div class="flex items-center justify-between">
        <span class="text-xs" style="color:var(--text-muted)">⏱ {{ w.duration }}</span>
        <button type="button" @click="anynuri.selectWork(w)" class="btn-sakura px-3 py-1.5 rounded-lg text-xs">상세보기</button>
      </div>
    </div>
  </div>
</div>
    `,
  };
})(window);
