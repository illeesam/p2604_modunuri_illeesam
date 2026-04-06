/* ANYNURI — 푸터 (index.html 레이아웃 분리) */
(function (g) {
  g.AnyNuriLayout = g.AnyNuriLayout || {};
  g.AnyNuriLayout.AppFooter = {
    name: 'AppFooter',
    inject: ['anynuri'],
    template: `
<footer style="background:var(--bg-header);border-top:1px solid var(--border);padding:1.5rem 2rem">
      <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-xl gradient-bg flex items-center justify-center text-sm font-black">✨</div>
          <span class="font-black gradient-text text-sm">AnyNuri</span>
          <span class="text-xs" style="color:var(--text-muted)">— 애니메이션으로 세상을 물들이다</span>
        </div>
        <div class="flex items-center gap-4 text-xs" style="color:var(--text-muted)">
          <span>{{ anynuri.config.site.email }}</span>
          <span>{{ anynuri.config.site.tel }}</span>
          <span>© 2026 AnyNuri. All rights reserved.</span>
        </div>
      </div>
    </footer>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
