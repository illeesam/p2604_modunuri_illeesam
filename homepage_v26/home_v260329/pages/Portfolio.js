/* HOME — PORTFOLIO (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.Portfolio = {
    name: 'Portfolio',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-6xl mx-auto">
<h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">포트폴리오</h1>
          <p class="section-subtitle mb-8">지금까지 완료한 프로젝트들을 소개합니다</p>

          <!-- Filter buttons -->
          <div class="flex flex-wrap gap-2 mb-8">
            <button v-for="cat in studio.cats" :key="cat" @click="studio.setActiveCat(cat)"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    :style="studio.activeCat===cat
                      ?'background:var(--emerald);color:#fff;border:1px solid var(--emerald)'
                      :'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border);cursor:pointer'">
              {{ cat }}
            </button>
          </div>

          <!-- Search -->
          <div style="margin-bottom:28px;">
            <input
              v-model="studio.searchText"
              type="text"
              class="form-input w-full md:w-72"
              placeholder="프로젝트명 검색"
              @input="studio.resetPagination"
            />
          </div>

          <!-- Portfolio grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="item in studio.displayedPortfolio" :key="item.portfolioId" class="portfolio-card">
              <div class="flex items-center justify-center"
                   :style="'height:180px;background:'+item.bg+';font-size:4.5rem'">{{ item.emoji }}</div>
              <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ item.portfolioName }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded font-medium"
                        style="background:var(--emerald-dim);color:var(--emerald)">{{ item.cat }}</span>
                </div>
                <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ item.desc }}</p>
                <button @click="studio.navigate('contact')"
                        class="text-xs font-bold"
                        style="color:var(--emerald);background:none;border:none;cursor:pointer">
                  문의하기 →
                </button>
              </div>
            </div>
          </div>

          <div id="home-portfolio-sentinel" v-show="studio.hasMore" style="height:1px;"></div>
          <div v-if="studio.filteredPortfolio.length === 0" class="text-center py-16" style="color:var(--text-muted)">
            <div class="text-4xl mb-3">🔍</div>
            <p class="text-sm">검색 결과가 없습니다.</p>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
