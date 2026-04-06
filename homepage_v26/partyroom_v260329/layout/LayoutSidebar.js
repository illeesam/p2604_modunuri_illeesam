/* ============================================
   PARTYROOM - LayoutSidebar Component
   반응형: 모바일에서 오버레이로 슬라이드
   ============================================ */
window.LayoutSidebar = {
  name: 'LayoutSidebar',
  props: ['activeMenu', 'sidebarOpen', 'mobileOpen'],
  emits: ['navigate', 'close'],
  template: /* html */ `
    <!-- Overlay (mobile only) -->
    <div v-if="mobileOpen"
         @click="$emit('close')"
         class="lg:hidden fixed inset-0 z-30"
         style="background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)">
    </div>

    <!-- Sidebar -->
    <aside id="sidebar"
           :class="[sidebarOpen ? '' : 'collapsed', mobileOpen ? 'open' : '']"
           class="glass flex flex-col"
           style="border-right:1px solid var(--border); height:calc(100vh - var(--header-h)); overflow-y:auto; overflow-x:hidden;">

      <!-- Sections -->
      <nav class="flex-1 py-3">
        <template v-for="section in sidebarMenu" :key="section.section">
          <!-- Section label -->
          <div v-if="sidebarOpen || mobileOpen"
               class="px-4 pt-4 pb-1 text-xs font-bold tracking-widest uppercase"
               style="color:var(--text-muted)">
            {{ section.section }}
          </div>
          <div v-else class="gold-divider mx-3 my-2"></div>

          <a v-for="item in section.items" :key="item.menuId"
             @click="$emit('navigate', item.menuId); $emit('close')"
             class="sidebar-link mx-2"
             :class="{ active: activeMenu === item.menuId }">
            <span class="text-base flex-shrink-0">{{ item.icon }}</span>
            <span v-if="sidebarOpen || mobileOpen" class="text-sm truncate">{{ item.menuName }}</span>
          </a>
        </template>
      </nav>

      <!-- Bottom CTA -->
      <div v-if="sidebarOpen || mobileOpen"
           class="p-3 m-2 rounded-xl"
           style="background:var(--gold-dim);border:1px solid rgba(201,168,76,0.2)">
        <div class="text-xs font-bold mb-1" style="color:var(--gold)">📅 예약 안내</div>
        <div class="text-xs mb-2" style="color:var(--text-secondary)">계좌이체 결제<br>예약 후 24시간 이내</div>
        <button @click="$emit('navigate','booking'); $emit('close')"
                class="btn-gold w-full py-1.5 rounded-lg text-xs">
          예약하기
        </button>
      </div>
    </aside>
  `,
  setup() {
    const sidebarMenu = window.SITE_CONFIG.sidebarMenu;
    return { sidebarMenu };
  }
};
