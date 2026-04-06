/* MODUNURI - PageSolution */
window.PageSolution = {
  name: 'PageSolution',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:32px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--green-dim);color:var(--green);font-size:0.75rem;font-weight:700;margin-bottom:14px;">솔루션 안내</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:10px;">비즈니스를 위한<br><span class="gradient-text">스마트 솔루션</span></h1>
    <p class="section-subtitle">6가지 핵심 솔루션으로 기업의 모든 디지털 니즈를 충족합니다.</p>
  </div>
  <div class="grid-3">
    <div v-for="s in config.solutions" :key="s.solutionId" class="solution-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
        <span style="font-size:2.4rem;">{{ s.emoji }}</span>
        <span v-if="s.badge==='NEW'" class="badge badge-new">NEW</span>
        <span v-else-if="s.badge==='인기'" class="badge badge-hot">인기</span>
      </div>
      <div style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">{{ s.solutionName }}</div>
      <p style="font-size:0.825rem;color:var(--text-secondary);line-height:1.65;margin-bottom:16px;">{{ s.desc }}</p>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px;">
        <span v-for="t in s.tags" :key="t" class="tag">{{ t }}</span>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('contact')">도입 문의 →</button>
    </div>
  </div>
</div>
  `,
  setup() {
    return {};
  }
};
