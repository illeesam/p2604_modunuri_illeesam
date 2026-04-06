/* HOME — 헤더 (index.html 레이아웃 분리) */
(function (g) {
  g.HomeLayout = g.HomeLayout || {};
  g.HomeLayout.LayoutHeader = {
    name: 'LayoutHeader',
    inject: ['studio'],
    template: `
<header id="header" style="height:var(--header-h);position:sticky;top:0;z-index:50;display:flex;align-items:center;padding:0 1rem;gap:0.75rem;background:var(--bg-header);border-bottom:1px solid var(--border);backdrop-filter:blur(16px)">

      <button @click="studio.sidebarOpen = !studio.sidebarOpen"
              class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg"
              style="background:var(--emerald-dim);color:var(--emerald);border:none;cursor:pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <button @click="studio.toggleMobileMenu"
              class="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg"
              style="background:var(--emerald-dim);color:var(--emerald);border:none;cursor:pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                :d="studio.mobileOpen?'M6 18L18 6M6 6l12 12':'M4 6h16M4 12h16M4 18h16'"/>
        </svg>
      </button>

      <div @click="studio.navigate('home')" class="flex items-center gap-2 cursor-pointer select-none">
        <span class="font-black text-lg gradient-text">STUDIO</span>
      </div>

      <div class="flex-1"></div>

      <nav class="hidden lg:flex items-center gap-1 text-xs">
        <button v-for="m in studio.config.topMenu" :key="m.menuId" @click="studio.navigate(m.menuId)"
                class="px-3 py-1.5 rounded-lg transition-colors font-medium"
                :style="studio.page===m.menuId?'color:var(--emerald);background:var(--emerald-dim);border:none;cursor:pointer':'color:var(--text-secondary);border:none;cursor:pointer;background:transparent'">
          {{ m.menuName }}
        </button>
      </nav>

      <button @click="studio.toggleTheme" title="테마 변경"
              class="ml-2 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer">
        <span v-if="studio.theme==='light'">🌙</span>
        <span v-else>☀️</span>
      </button>
    </header>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
