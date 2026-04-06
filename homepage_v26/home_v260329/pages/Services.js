/* HOME - PageServices */
window.PageServices = {
  name: 'PageServices',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="text-4xl font-black gradient-text mb-4" style="letter-spacing:-0.03em">서비스</h1>
      <p class="section-subtitle mb-10">비즈니스 성장을 위한 전문 기술 서비스</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="svc in services" :key="svc.serviceId" class="card p-6 rounded-2xl">
          <div class="text-4xl mb-4">{{ svc.emoji }}</div>
          <h3 class="font-bold text-base mb-2" style="color:var(--text-primary)">{{ svc.serviceName }}</h3>
          <p class="text-xs leading-relaxed mb-4" style="color:var(--text-secondary)">{{ svc.desc }}</p>
          <div class="flex flex-wrap gap-1 mb-4">
            <span v-for="tag in svc.tags" :key="tag" class="px-2 py-0.5 rounded text-xs" style="background:var(--emerald-dim);color:var(--emerald)">{{ tag }}</span>
          </div>
          <button @click="$emit('navigate','contact')" class="btn-outline w-full py-2 rounded-lg text-xs">문의하기 →</button>
        </div>
      </div>
    </div>
  `,
  setup() { return { services: window.SITE_CONFIG.services }; }
};
