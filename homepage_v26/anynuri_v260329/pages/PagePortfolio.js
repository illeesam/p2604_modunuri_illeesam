/* ANYNURI - PagePortfolio (작품목록) */
window.PagePortfolio = {
  name: 'PagePortfolio',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">작품목록</h1>
      <p class="section-subtitle mb-8">전체 {{ works.length }}편의 작품</p>

      <!-- Table view for larger screens, cards for mobile -->
      <div class="hidden md:block card rounded-2xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr style="background:rgba(255,107,157,0.06);border-bottom:1px solid var(--border)">
              <th class="text-left p-4 text-xs font-bold" style="color:var(--text-muted)">작품</th>
              <th class="text-left p-4 text-xs font-bold" style="color:var(--text-muted)">장르</th>
              <th class="text-left p-4 text-xs font-bold" style="color:var(--text-muted)">분량</th>
              <th class="text-left p-4 text-xs font-bold" style="color:var(--text-muted)">연도</th>
              <th class="text-left p-4 text-xs font-bold" style="color:var(--text-muted)">수상</th>
              <th class="p-4"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="work in works" :key="work.id"
                class="border-t transition-colors cursor-pointer"
                style="border-color:var(--border)"
                @mouseenter="hoverId=work.id" @mouseleave="hoverId=null"
                :style="hoverId===work.id ? 'background:rgba(255,107,157,0.05)' : ''">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ work.emoji }}</span>
                  <div>
                    <div class="font-bold text-xs" style="color:var(--text-primary)">{{ work.title }}</div>
                    <div class="text-xs mt-0.5" style="color:var(--text-muted)">{{ work.desc.slice(0,30) }}...</div>
                  </div>
                </div>
              </td>
              <td class="p-4"><span class="tag-pill">{{ work.genre }}</span></td>
              <td class="p-4 text-xs" style="color:var(--text-secondary)">{{ work.duration }}</td>
              <td class="p-4 text-xs" style="color:var(--text-secondary)">{{ work.year }}</td>
              <td class="p-4 text-xs" style="color:var(--gold)">{{ work.awards.length ? '🏆' : '' }}</td>
              <td class="p-4">
                <button @click="$emit('navigate', 'detail')" class="btn-sakura px-3 py-1 rounded-full text-xs font-bold">
                  상세보기
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden space-y-3">
        <div v-for="work in works" :key="work.id" class="card p-4 rounded-2xl cursor-pointer" @click="$emit('navigate', 'detail')">
          <div class="flex items-start gap-3">
            <span class="text-3xl">{{ work.emoji }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-sm" style="color:var(--text-primary)">{{ work.title }}</span>
                <span class="tag-pill">{{ work.genre }}</span>
              </div>
              <div class="text-xs" style="color:var(--text-muted)">{{ work.year }} · {{ work.duration }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref } = Vue;
    const works = window.SITE_CONFIG.works;
    const hoverId = ref(null);
    return { works, hoverId };
  }
};
