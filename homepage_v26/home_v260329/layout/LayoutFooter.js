/* HOME — 푸터 (index.html 레이아웃 분리) */
(function (g) {
  g.HomeLayout = g.HomeLayout || {};
  g.HomeLayout.LayoutFooter = {
    name: 'LayoutFooter',
    inject: ['studio'],
    template: `
<footer style="background:var(--bg-header);border-top:1px solid var(--border);padding:1.25rem 1.5rem">
  <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <span class="font-black text-sm gradient-text">STUDIO</span>
      <span class="text-xs" style="color:var(--text-muted)">© 2026 All rights reserved.</span>
    </div>
    <nav class="flex gap-4">
      <button v-for="m in studio.config.topMenu" :key="m.menuId" @click="studio.navigate(m.menuId)"
              class="text-xs transition-colors"
              :style="studio.page===m.menuId?'color:var(--emerald);background:none;border:none;cursor:pointer;font-weight:600':'color:var(--text-muted);background:none;border:none;cursor:pointer'">
        {{ m.menuName }}
      </button>
    </nav>
  </div>
</footer>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
