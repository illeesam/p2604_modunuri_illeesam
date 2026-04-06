/* HOME — HOME (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.Home = {
    name: 'Home',
    inject: ['studio'],
    template: `
<div>
<!-- Hero -->
          <section class="hero-bg relative overflow-hidden" style="min-height:calc(100vh - var(--header-h))">
            <div class="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
              <div class="absolute top-10 right-10 w-72 h-72 rounded-full opacity-10"
                   style="background:radial-gradient(circle,#10b981,transparent)"></div>
              <div class="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-10"
                   style="background:radial-gradient(circle,#f59e0b,transparent)"></div>
            </div>
            <div class="absolute left-0 bottom-0 w-48 h-48 opacity-5"
                 style="clip-path:polygon(0 100%,100% 0,0 0);background:#10b981"></div>
            <div class="flex items-center justify-center min-h-full py-24 px-6">
              <div class="max-w-4xl w-full">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div class="fade-up">
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                         style="background:var(--emerald-dim);border:1px solid rgba(16,185,129,0.3);color:var(--emerald)">
                      ✦ Creative Studio
                    </div>
                    <h1 class="font-black leading-tight mb-6"
                        style="font-size:clamp(2.5rem,6vw,4.5rem);letter-spacing:-0.04em">
                      <span style="color:var(--text-primary)">아이디어를</span><br>
                      <span class="gradient-text">현실로</span><br>
                      <span style="color:var(--text-primary)">만듭니다</span>
                    </h1>
                    <p class="text-base leading-relaxed mb-8" style="color:var(--text-secondary)">
                      웹, 모바일, 데이터까지<br>비즈니스 성장을 위한 기술 솔루션
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3">
                      <button @click="studio.navigate('portfolio')" class="btn-emerald px-8 py-3 rounded-xl text-sm">포트폴리오 보기</button>
                      <button @click="studio.navigate('contact')" class="btn-outline px-8 py-3 rounded-xl text-sm">프로젝트 문의</button>
                    </div>
                  </div>
                  <!-- Stats cards (api/base/hero-stats.json) -->
                  <div class="grid grid-cols-2 gap-4">
                    <template v-for="(st, idx) in studio.heroStats" :key="idx">
                      <div v-if="st.cta" class="card p-5" style="border-color:rgba(16,185,129,0.3)">
                        <div class="text-2xl mb-2">{{ st.emoji }}</div>
                        <div class="text-xs font-bold" style="color:var(--emerald)">{{ st.label }}</div>
                      </div>
                      <div v-else class="card p-5">
                        <div class="text-3xl font-black gradient-text mb-1">{{ st.value }}</div>
                        <div class="text-xs" style="color:var(--text-muted)">{{ st.label }}</div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Services preview -->
          <section class="py-16 px-6" style="background:var(--bg-card)">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-10">
                <h2 class="text-3xl font-black gradient-text mb-2">서비스</h2>
                <p class="section-subtitle">비즈니스 성장을 위한 전문 서비스</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div v-for="svc in studio.config.services" :key="svc.serviceId"
                     class="card p-6 cursor-pointer" @click="studio.navigate('services')">
                  <div class="text-3xl mb-3">{{ svc.emoji }}</div>
                  <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">{{ svc.serviceName }}</h3>
                  <p class="text-xs leading-relaxed mb-3" style="color:var(--text-secondary)">{{ svc.desc }}</p>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="tag in svc.tags" :key="tag"
                          class="px-2 py-0.5 rounded text-xs"
                          style="background:var(--emerald-dim);color:var(--emerald)">{{ tag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Portfolio preview -->
          <section class="py-16 px-6">
            <div class="max-w-6xl mx-auto">
              <div class="flex items-end justify-between mb-10">
                <div>
                  <h2 class="text-3xl font-black gradient-text mb-2">포트폴리오</h2>
                  <p class="section-subtitle">최근 완료된 프로젝트</p>
                </div>
                <button @click="studio.navigate('portfolio')" class="btn-outline px-4 py-2 rounded-lg text-xs">전체 보기 →</button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div v-for="item in studio.config.portfolio.slice(0,3)" :key="item.portfolioId"
                     class="portfolio-card" @click="studio.navigate('portfolio')">
                  <div class="flex items-center justify-center"
                       :style="'height:160px;background:'+item.bg+';font-size:4rem'">{{ item.emoji }}</div>
                  <div class="p-4">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ item.portfolioName }}</h3>
                      <span class="text-xs px-2 py-0.5 rounded"
                            style="background:var(--emerald-dim);color:var(--emerald)">{{ item.cat }}</span>
                    </div>
                    <p class="text-xs" style="color:var(--text-secondary)">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- CTA -->
          <section class="py-16 px-6" style="background:var(--bg-card)">
            <div class="max-w-2xl mx-auto text-center">
              <h2 class="text-3xl font-black gradient-text mb-4">프로젝트를 시작할 준비가 되셨나요?</h2>
              <p class="text-sm mb-8" style="color:var(--text-secondary)">무료 초기 상담부터 시작하세요. 아이디어를 현실로 만들어 드립니다.</p>
              <button @click="studio.navigate('contact')" class="btn-emerald px-10 py-4 rounded-xl text-base font-bold">
                무료 상담 신청하기
              </button>
            </div>
          </section>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
