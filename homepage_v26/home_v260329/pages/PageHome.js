/* HOME - PageHome */
window.PageHome = {
  name: 'PageHome',
  emits: ['navigate'],
  template: /* html */ `
    <div>
      <!-- Hero -->
      <section class="hero-bg relative overflow-hidden" style="min-height:calc(100vh - var(--header-h))">
        <!-- Decorative shapes -->
        <div class="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
          <div class="absolute top-10 right-10 w-72 h-72 rounded-full opacity-10"
               style="background:radial-gradient(circle,#10b981,transparent)"></div>
          <div class="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-8"
               style="background:radial-gradient(circle,#f59e0b,transparent)"></div>
        </div>
        <!-- Geometric accent -->
        <div class="absolute left-0 bottom-0 w-48 h-48 opacity-5" style="clip-path:polygon(0 100%,100% 0,0 0);background:#10b981"></div>

        <div class="flex items-center justify-center min-h-full py-24 px-6">
          <div class="max-w-4xl w-full">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div class="fade-up">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                     style="background:var(--emerald-dim);border:1px solid rgba(16,185,129,0.3);color:var(--emerald)">
                  ✦ Creative Studio
                </div>
                <h1 class="font-black leading-tight mb-6" style="font-size:clamp(2.5rem,6vw,4.5rem);letter-spacing:-0.04em">
                  <span style="color:var(--text-primary)">아이디어를</span><br>
                  <span class="gradient-text">현실로</span><br>
                  <span style="color:var(--text-primary)">만듭니다</span>
                </h1>
                <p class="text-base leading-relaxed mb-8" style="color:var(--text-secondary)">
                  웹, 모바일, 데이터까지<br>비즈니스 성장을 위한 기술 솔루션
                </p>
                <div class="flex flex-col sm:flex-row gap-3">
                  <button @click="$emit('navigate','portfolio')" class="btn-emerald px-8 py-3 rounded-xl text-sm">포트폴리오 보기</button>
                  <button @click="$emit('navigate','contact')" class="btn-outline px-8 py-3 rounded-xl text-sm">프로젝트 문의</button>
                </div>
              </div>
              <!-- Right: Stats cards -->
              <div class="grid grid-cols-2 gap-4">
                <div class="card p-5">
                  <div class="text-3xl font-black gradient-text mb-1">50+</div>
                  <div class="text-xs" style="color:var(--text-muted)">완료 프로젝트</div>
                </div>
                <div class="card p-5">
                  <div class="text-3xl font-black gradient-text mb-1">98%</div>
                  <div class="text-xs" style="color:var(--text-muted)">고객 만족도</div>
                </div>
                <div class="card p-5">
                  <div class="text-3xl font-black gradient-text mb-1">5년+</div>
                  <div class="text-xs" style="color:var(--text-muted)">업계 경력</div>
                </div>
                <div class="card p-5" style="border-color:rgba(16,185,129,0.3)" onclick="">
                  <div class="text-2xl mb-2">🚀</div>
                  <div class="text-xs font-bold" style="color:var(--emerald)">지금 시작하기</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Services -->
      <section class="py-16 px-6" style="background:rgba(255,255,255,0.01)">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-10">
            <h2 class="text-3xl font-black gradient-text mb-2">서비스</h2>
            <p style="color:var(--text-secondary);font-size:0.9rem">비즈니스 성장을 위한 전문 서비스</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="svc in services" :key="svc.id"
                 class="card p-6 cursor-pointer" @click="$emit('navigate','services')">
              <div class="text-3xl mb-3">{{ svc.emoji }}</div>
              <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">{{ svc.title }}</h3>
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

      <!-- Portfolio Preview -->
      <section class="py-16 px-6">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-end justify-between mb-10">
            <div>
              <h2 class="text-3xl font-black gradient-text mb-2">포트폴리오</h2>
              <p style="color:var(--text-secondary);font-size:0.9rem">최근 완료된 프로젝트</p>
            </div>
            <button @click="$emit('navigate','portfolio')" class="btn-outline px-4 py-2 rounded-lg text-xs">전체 보기 →</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="item in portfolio.slice(0,3)" :key="item.id"
                 class="portfolio-card" @click="$emit('navigate','portfolio')">
              <div class="flex items-center justify-center" :style="'height:160px;background:'+item.bg+';font-size:4rem'">
                {{ item.emoji }}
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-bold text-sm" style="color:var(--text-primary)">{{ item.title }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded" style="background:var(--emerald-dim);color:var(--emerald)">{{ item.cat }}</span>
                </div>
                <p class="text-xs" style="color:var(--text-secondary)">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-16 px-6" style="background:rgba(255,255,255,0.02)">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-3xl font-black gradient-text mb-4">프로젝트를 시작할 준비가 되셨나요?</h2>
          <p class="text-sm mb-8" style="color:var(--text-secondary)">무료 초기 상담부터 시작하세요. 아이디어를 현실로 만들어 드립니다.</p>
          <button @click="$emit('navigate','contact')" class="btn-emerald px-10 py-4 rounded-xl text-base font-bold">
            무료 상담 신청하기
          </button>
        </div>
      </section>
    </div>
  `,
  setup() {
    return {
      services: window.SITE_CONFIG.services,
      portfolio: window.SITE_CONFIG.portfolio,
    };
  }
};
