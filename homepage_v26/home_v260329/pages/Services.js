/* HOME — SERVICES (index.html 본문 분리) */
(function (g) {
  g.HomePages = g.HomePages || {};
  g.HomePages.Services = {
    name: 'Services',
    inject: ['studio'],
    template: `
<div class="p-6 max-w-5xl mx-auto">
<h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">서비스</h1>
          <p class="section-subtitle mb-10">비즈니스 성장을 위한 전문 기술 서비스</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="svc in studio.config.services" :key="svc.serviceId" class="card p-6 rounded-2xl">
              <div class="text-4xl mb-4">{{ svc.emoji }}</div>
              <h3 class="font-bold text-base mb-2" style="color:var(--text-primary)">{{ svc.serviceName }}</h3>
              <p class="text-sm leading-relaxed mb-4" style="color:var(--text-secondary)">{{ svc.desc }}</p>
              <div class="flex flex-wrap gap-1">
                <span v-for="tag in svc.tags" :key="tag"
                      class="px-2 py-1 rounded text-xs font-medium"
                      style="background:var(--emerald-dim);color:var(--emerald)">{{ tag }}</span>
              </div>
              <button @click="studio.navigate('contact')"
                      class="mt-5 w-full py-2 rounded-xl text-xs font-bold"
                      style="background:var(--emerald-dim);color:var(--emerald);border:1px solid rgba(16,185,129,0.2);cursor:pointer">
                문의하기
              </button>
            </div>
          </div>
          <!-- Process -->
          <div class="mt-16">
            <h2 class="text-2xl font-black gradient-text mb-8 text-center">진행 프로세스</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="(step, i) in [{num:'01',label:'상담',icon:'💬',desc:'초기 요구사항 파악 및 방향 설정'},{num:'02',label:'기획',icon:'📋',desc:'상세 기획 및 제안서 작성'},{num:'03',label:'개발',icon:'💻',desc:'설계·디자인·개발 단계별 진행'},{num:'04',label:'납품',icon:'🚀',desc:'테스트 완료 후 최종 납품'}]"
                   :key="i" class="card p-5 text-center">
                <div class="text-2xl mb-2">{{ step.icon }}</div>
                <div class="text-xs font-black mb-1" style="color:var(--emerald)">{{ step.num }}</div>
                <div class="font-bold text-sm mb-1" style="color:var(--text-primary)">{{ step.label }}</div>
                <div class="text-xs" style="color:var(--text-secondary)">{{ step.desc }}</div>
              </div>
            </div>
          </div>
</div>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
