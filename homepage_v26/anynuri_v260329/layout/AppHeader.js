/* ANYNURI — 헤더 (index.html 레이아웃 분리) */
(function (g) {
  g.AnyNuriLayout = g.AnyNuriLayout || {};
  g.AnyNuriLayout.AppHeader = {
    name: 'AppHeader',
    inject: ['anynuri'],
    template: `
<header id="header">
      <button @click="anynuri.toggleMobileMenu"
        class="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-pink-50 dark:hover:bg-white/5 transition-colors"
        style="color:var(--text-secondary)">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!anynuri.mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <button @click="anynuri.sidebarOpen = !anynuri.sidebarOpen"
        class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style="color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            :d="anynuri.sidebarOpen ? 'M11 19l-7-7 7-7' : 'M13 5l7 7-7 7'"/>
        </svg>
      </button>

      <div class="flex items-center gap-2.5 cursor-pointer select-none flex-1" @click="anynuri.navigate('home')">
        <div class="w-9 h-9 rounded-2xl gradient-bg flex items-center justify-center text-lg font-black flex-shrink-0">✨</div>
        <div>
          <div class="text-base font-black gradient-text leading-none">AnyNuri</div>
          <div class="text-xs leading-none" style="color:var(--text-muted)">애니메이션 스튜디오</div>
        </div>
      </div>

      <nav class="hidden xl:flex items-center gap-1 mr-2">
        <button v-for="m in anynuri.config.menus.slice(0,5)" :key="m.menuId"
          @click="anynuri.navigate(m.menuId)"
          class="nav-link px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
          :class="anynuri.page===m.menuId ? 'active' : ''"
          style="color:var(--text-secondary)">
          {{ m.menuName }}
        </button>
      </nav>

      <div class="flex items-center gap-2">
        <button @click="anynuri.navigate('contact')"
          class="hidden md:block btn-sakura px-4 py-2 rounded-full text-sm">
          의뢰하기
        </button>
        <button @click="anynuri.toggleTheme"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors"
          style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary)"
          :title="anynuri.theme==='light' ? '다크 모드' : '라이트 모드'">
          <span v-if="anynuri.theme==='light'">🌙</span>
          <span v-else>☀️</span>
        </button>
      </div>
    </header>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
