/* CareMate - PageAbout */
window.PageAbout = {
  name: 'PageAbout',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">서비스 소개</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:12px;"><span class="gradient-text">케어메이트</span>는<br>당신의 든든한 동행입니다</h1>
    <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.8;max-width:620px;">병원 방문이 걱정되는 어르신, 혼자 이동이 어려운 장애인, 일상적인 도움이 필요한 분들을 위해 전문 케어 매니저가 함께합니다.</p>
  </div>
  <div class="grid-2" style="gap:28px;margin-bottom:36px;">
    <div class="card" style="padding:32px;">
      <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">💙 케어메이트 소개</h2>
      <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.9;">케어메이트는 2020년 설립된 전문 케어 서비스 기업입니다. 병원동행, 일상생활지원, 장애인활동지원, 요양보호사 서비스를 통해 수도권 1,200건 이상의 서비스를 제공하며 98%의 이용자 만족도를 기록하고 있습니다.</p>
    </div>
    <div class="card" style="padding:32px;">
      <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">🎯 케어 철학</h2>
      <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.9;">"혼자가 아닌 함께" — 케어는 단순한 서비스가 아닙니다. 케어메이트 매니저는 이용자의 상황을 충분히 이해하고, 안심하고 맡길 수 있는 진심 어린 동행을 제공합니다.</p>
    </div>
  </div>
  <div class="grid-4">
    <div class="value-card"><div style="font-size:2rem;margin-bottom:12px;">🔒</div><div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">신뢰와 안전</div><p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">신원조회 완료 매니저, 배상책임보험 가입</p></div>
    <div class="value-card"><div style="font-size:2rem;margin-bottom:12px;">👩‍⚕️</div><div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">전문 자격</div><p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">요양보호사·사회복지사·간호조무사 자격 보유</p></div>
    <div class="value-card"><div style="font-size:2rem;margin-bottom:12px;">📱</div><div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">실시간 소통</div><p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">서비스 중 실시간 상황 보고, 긴급 대응</p></div>
    <div class="value-card"><div style="font-size:2rem;margin-bottom:12px;">💰</div><div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">합리적 가격</div><p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">바우처·장기요양급여 병행 이용 가능</p></div>
  </div>
</div>
`,
  setup(props) {
    const { } = Vue;
    return {};
  }
};
