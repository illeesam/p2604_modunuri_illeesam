/* HOME - AppHeader */
window.AppHeader = {
  name: 'AppHeader',
  props: ['activeMenu','mobileOpen','sidebarOpen'],
  emits: ['navigate','toggle-mobile','toggle-sidebar'],
  template: /* html */ `
    <header class="glass sticky top-0 z-50" style="height:var(--header-h);border-bottom:1px solid var(--border)">
      <div class="flex items-center justify-between h-full px-4 lg:px-6">
        <div class="flex items-center gap-3">
          <button @click="$emit('toggle-sidebar')" class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors">
            <svg class="w-4 h-4" style="color:var(--emerald)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <a @click="$emit('navigate','home')" class="flex items-center gap-2 cursor-pointer select-none">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style="background:linear-gradient(135deg,#10b981,#f59e0b);color:#111827">S</div>
            <div class="hidden sm:block">
              <div class="text-sm font-black leading-none gradient-text">STUDIO</div>
              <div class="text-xs leading-none mt-0.5" style="color:var(--text-muted)">Creative Solutions</div>
            </div>
          </a>
        </div>
        <nav class="hidden lg:flex items-center gap-1">
          <a v-for="item in menu" :key="item.menuId" @click="$emit('navigate',item.menuId)"
             class="nav-link" :class="{active:activeMenu===item.menuId}">{{ item.menuName }}</a>
        </nav>
        <div class="flex items-center gap-2">
          <button @click="$emit('navigate','contact')" class="hidden md:flex btn-emerald text-xs px-4 py-2 rounded-lg items-center gap-1">프로젝트 시작하기</button>
          <button @click="$emit('toggle-mobile')" class="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5" style="color:var(--text-secondary)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div v-show="mobileOpen" class="lg:hidden glass border-t" style="border-color:var(--border);position:absolute;left:0;right:0;top:var(--header-h);z-index:50;">
        <div class="px-4 py-3 space-y-1">
          <a v-for="item in menu" :key="item.menuId" @click="$emit('navigate',item.menuId);$emit('toggle-mobile')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer"
             :class="activeMenu===item.menuId ? 'font-semibold' : 'hover:bg-white/5'"
             :style="activeMenu===item.menuId ? 'color:var(--emerald);background:var(--emerald-dim)' : 'color:var(--text-secondary)'">
            <span>{{ item.icon }}</span><span>{{ item.menuName }}</span>
          </a>
        </div>
      </div>
    </header>
  `,
  setup() { return { menu: window.SITE_CONFIG.topMenu }; }
};
