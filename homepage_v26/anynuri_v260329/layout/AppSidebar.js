/* ANYNURI - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['activeMenu', 'sidebarOpen', 'mobileOpen'],
  emits: ['navigate', 'close'],
  template: /* html */ `
    <!-- Mobile overlay -->
    <div v-if="mobileOpen" @click="$emit('close')"
         class="lg:hidden fixed inset-0 z-30" style="background:rgba(0,0,0,0.6)"></div>

    <!-- Sidebar -->
    <aside id="sidebar" :class="[sidebarOpen ? '' : 'collapsed', mobileOpen ? 'open' : '']"
           class="glass flex flex-col" style="min-height:0">
      <!-- Menu list -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-0.5 mt-2">
        <button v-for="m in menus" :key="m.menuId"
                @click="$emit('navigate', m.menuId); $emit('close')"
                class="sidebar-link w-full"
                :class="activeMenu === m.menuId ? 'active' : ''">
          <span class="text-base flex-shrink-0">{{ m.icon }}</span>
          <span class="text-xs font-medium transition-opacity" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'">{{ m.menuName }}</span>
        </button>
      </nav>

      <!-- Footer area -->
      <div class="p-3 border-t" style="border-color:var(--border)" v-show="sidebarOpen">
        <div class="text-center">
          <div class="text-xs mb-2" style="color:var(--text-muted)">애니메이션 의뢰</div>
          <button @click="$emit('navigate', 'contact'); $emit('close')" class="btn-sakura w-full py-2 rounded-xl text-xs font-bold">
            지금 의뢰하기
          </button>
        </div>
      </div>
    </aside>
  `,
  setup() {
    const menus = window.SITE_CONFIG.menus;
    return { menus };
  }
};
