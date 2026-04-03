/* MODUNURI - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  props: ['config', 'navigate'],
  emits: [],
  template: /* html */ `
<footer style="padding:28px 32px;">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--blue),var(--green));display:flex;align-items:center;justify-content:center;font-size:0.85rem;">🌐</div>
      <span style="font-weight:700;color:var(--text-secondary);font-size:0.85rem;">{{ config.name }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">|</span>
      <span style="color:var(--text-muted);font-size:0.8rem;">{{ config.address }}</span>
    </div>
    <div style="display:flex;align-items:center;gap:20px;">
      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.tel }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.email }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">© 2026 {{ config.name }}</span>
    </div>
  </div>
</footer>
  `,
  setup() { return {}; }
};
