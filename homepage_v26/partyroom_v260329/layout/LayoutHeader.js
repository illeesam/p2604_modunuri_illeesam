/* ============================================
   PARTYROOM - LayoutHeader Component
   ============================================ */
window.LayoutHeader = {
  name: 'LayoutHeader',
  props: ['activeMenu', 'mobileOpen', 'sidebarOpen'],
  emits: ['navigate', 'toggle-mobile', 'toggle-sidebar'],
  template: /* html */ `
    <header class="glass sticky top-0 z-50" style="height:var(--header-h);border-bottom:1px solid var(--border)">
      <div class="flex items-center justify-between h-full px-4 lg:px-6">

        <!-- Logo + Sidebar Toggle (Desktop) -->
        <div class="flex items-center gap-3">
          <button @click="$emit('toggle-sidebar')"
                  class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
                  title="사이드바 토글">
            <svg class="w-4 h-4" style="color:var(--gold)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <a @click="$emit('navigate','home')" class="flex items-center gap-2 cursor-pointer select-none">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                 style="background:linear-gradient(135deg,var(--gold),var(--gold-light));color:#0f1119">P</div>
            <div class="hidden sm:block">
              <div class="text-sm font-black leading-none" style="color:var(--gold)">파티룸 스페이스</div>
              <div class="text-xs leading-none mt-0.5" style="color:var(--text-muted)">PREMIUM SPACE</div>
            </div>
          </a>
        </div>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-1 overflow-x-auto">
          <a v-for="item in menu" :key="item.menuId"
             @click="$emit('navigate', item.menuId)"
             class="nav-link"
             :class="{ active: activeMenu === item.menuId }">
            {{ item.menuName }}
          </a>
        </nav>

        <!-- Right: CTA + Mobile Toggle -->
        <div class="flex items-center gap-2">
          <button @click="$emit('navigate','booking')"
                  class="hidden md:flex btn-gold text-xs px-4 py-2 rounded-lg items-center gap-1">
            <span>📅</span> 예약하기
          </button>
          <!-- Mobile hamburger -->
          <button @click="$emit('toggle-mobile')"
                  class="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 transition-colors"
                  style="color:var(--text-secondary)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown -->
      <div v-show="mobileOpen"
           class="lg:hidden glass border-t"
           style="border-color:var(--border); position:absolute; left:0; right:0; top:var(--header-h); z-index:50;">
        <div class="px-4 py-3 space-y-1">
          <a v-for="item in menu" :key="item.menuId"
             @click="$emit('navigate', item.menuId); $emit('toggle-mobile')"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
             :class="activeMenu===item.menuId
               ? 'font-semibold'
               : 'hover:bg-white/5'"
             :style="activeMenu===item.menuId ? 'color:var(--gold);background:var(--gold-dim)' : 'color:var(--text-secondary)'">
            <span>{{ item.icon }}</span>
            <span>{{ item.menuName }}</span>
          </a>
          <div class="pt-2 pb-1">
            <button @click="$emit('navigate','booking'); $emit('toggle-mobile')"
                    class="btn-gold w-full py-2.5 rounded-lg text-sm">
              📅 예약하기
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  setup(props) {
    const menu = window.SITE_CONFIG.topMenu;
    return { menu };
  }
};
