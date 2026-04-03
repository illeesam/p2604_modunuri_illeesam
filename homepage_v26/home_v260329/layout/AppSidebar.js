/* HOME - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['activeMenu','sidebarOpen','mobileOpen'],
  emits: ['navigate','close'],
  template: /* html */ `
    <div v-if="mobileOpen" @click="$emit('close')" class="lg:hidden fixed inset-0 z-30" style="background:rgba(0,0,0,0.5)"></div>
    <aside id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" class="glass flex flex-col"
           style="border-right:1px solid var(--border);height:calc(100vh - var(--header-h));overflow-y:auto;overflow-x:hidden;">
      <nav class="flex-1 py-3">
        <template v-for="sec in sidebarMenu" :key="sec.section">
          <div v-if="sidebarOpen||mobileOpen" class="px-4 pt-4 pb-1 text-xs font-bold tracking-widest uppercase" style="color:var(--text-muted)">{{ sec.section }}</div>
          <div v-else class="mx-3 my-2" style="height:1px;background:rgba(16,185,129,0.1)"></div>
          <a v-for="item in sec.items" :key="item.menuId" @click="$emit('navigate',item.menuId);$emit('close')"
             class="sidebar-link mx-2" :class="{active:activeMenu===item.menuId}">
            <span class="text-base flex-shrink-0">{{ item.icon }}</span>
            <span v-if="sidebarOpen||mobileOpen" class="text-sm truncate">{{ item.menuName }}</span>
          </a>
        </template>
      </nav>
      <div v-if="sidebarOpen||mobileOpen" class="p-3 m-2 rounded-xl" style="background:var(--emerald-dim);border:1px solid rgba(16,185,129,0.2)">
        <div class="text-xs font-bold mb-1" style="color:var(--emerald)">🚀 프로젝트 시작</div>
        <div class="text-xs mb-2" style="color:var(--text-secondary)">무료 초기 상담</div>
        <button @click="$emit('navigate','contact');$emit('close')" class="btn-emerald w-full py-1.5 rounded-lg text-xs">문의하기</button>
      </div>
    </aside>
  `,
  setup() { return { sidebarMenu: window.SITE_CONFIG.sidebarMenu }; }
};
