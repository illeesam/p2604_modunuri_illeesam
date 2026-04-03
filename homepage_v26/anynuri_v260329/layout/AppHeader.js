/* ANYNURI - AppHeader */
window.AppHeader = {
  name: 'AppHeader',
  props: ['activeMenu', 'mobileOpen', 'sidebarOpen'],
  emits: ['navigate', 'toggle-mobile', 'toggle-sidebar'],
  template: /* html */ `
    <header id="header" class="glass">
      <!-- Sidebar toggle (desktop) -->
      <button @click="$emit('toggle-sidebar')" class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0"
              style="background:rgba(255,107,157,0.1);color:var(--sakura)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <!-- Mobile menu toggle -->
      <button @click="$emit('toggle-mobile')" class="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style="background:rgba(255,107,157,0.1);color:var(--sakura)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"/>
        </svg>
      </button>

      <!-- Logo -->
      <div @click="$emit('navigate', 'home')" class="flex items-center gap-2 cursor-pointer select-none" style="flex-shrink:0">
        <span class="text-2xl float-1">🎬</span>
        <span class="font-black text-lg gradient-text tracking-tight">AnyNuri</span>
      </div>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Top nav (desktop) -->
      <nav class="hidden lg:flex items-center gap-1 text-xs">
        <button v-for="m in topMenus" :key="m.id"
                @click="$emit('navigate', m.id)"
                class="nav-link px-3 py-1.5 rounded-lg transition-colors font-medium"
                :style="activeMenu===m.id ? 'color:var(--sakura)' : 'color:var(--text-secondary)'"
                :class="activeMenu===m.id ? 'active' : ''">
          {{ m.label }}
        </button>
      </nav>

      <!-- CTA -->
      <button @click="$emit('navigate', 'contact')" class="hidden lg:block btn-sakura px-4 py-1.5 rounded-full text-xs font-bold ml-3">
        의뢰하기
      </button>
    </header>
  `,
  setup(props) {
    const topMenus = window.SITE_CONFIG.menus.slice(0, 5);
    return { topMenus };
  }
};
