/* ANYNURI — 작품 소개(그리드) */
(function (g) {
  g.AnyNuriPages = g.AnyNuriPages || {};
  g.AnyNuriPages.PageWorks = {
    name: 'PageWorks',
    inject: ['anynuri'],
    template: `
<div class="p-6 lg:p-8 max-w-5xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-black gradient-text mb-1">작품 소개</h1>
    <p class="section-subtitle">AnyNuri의 대표 애니메이션 작품들</p>
  </div>
  <div class="flex flex-wrap gap-2 mb-6">
    <button type="button" v-for="c in anynuri.categoryList" :key="c.categoryId"
      @click="anynuri.setActiveCat(c.categoryId)"
      class="filter-btn"
      :class="{ active: anynuri.activeCat === c.categoryId }">
      {{ c.categoryName }}
    </button>
  </div>
  <div style="margin-bottom:28px;">
    <input
      v-model="anynuri.searchText"
      type="text"
      class="form-input w-full md:w-72"
      placeholder="작품명 검색"
      @input="anynuri.resetPagination"
    />
  </div>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <div v-for="w in anynuri.displayedWorks" :key="w.id" class="work-card cursor-pointer" @click="anynuri.selectWork(w)">
      <div class="flex items-center justify-center h-44 text-6xl relative"
        :style="{ background: w.bg }">
        <span>{{ w.emoji }}</span>
        <div class="absolute top-3 right-3">
          <span class="tag-pill" style="background:rgba(0,0,0,0.4);border-color:rgba(255,255,255,0.2);color:#fff">
            {{ w.genre }}
          </span>
        </div>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-black text-sm" style="color:var(--text-primary)">{{ w.title }}</h3>
          <span class="text-xs" style="color:var(--text-muted)">{{ w.year }}</span>
        </div>
        <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ w.desc }}</p>
        <div class="flex flex-wrap gap-1 mb-2">
          <span v-for="tag in w.tags" :key="tag" class="tag-pill text-xs">{{ tag }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs" style="color:var(--text-muted)">⏱ {{ w.duration }}</span>
          <span v-if="w.awards.length" class="text-xs" style="color:var(--gold)">🏆 수상작</span>
        </div>
      </div>
    </div>
  </div>
  <div id="anynuri-works-sentinel" v-show="anynuri.hasMore" style="height:1px;"></div>
  <div v-if="anynuri.filteredWorks.length === 0" class="text-center py-16" style="color:var(--text-muted)">
    <div class="text-4xl mb-3">🔍</div>
    <p class="text-sm">해당 조건의 작품이 없습니다.</p>
  </div>
</div>
    `,
  };
})(window);
