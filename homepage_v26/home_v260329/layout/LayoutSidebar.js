/* HOME — 모바일 오버레이 + 사이드바 (index.html 레이아웃 분리) */
(function (g) {
  g.HomeLayout = g.HomeLayout || {};
  g.HomeLayout.LayoutSidebar = {
    name: 'LayoutSidebar',
    inject: ['studio'],
    template: `
<div v-if="studio.mobileOpen" @click="studio.closeMobileMenu"
     class="lg:hidden fixed inset-0 z-30"
     style="background:rgba(0,0,0,0.5)"></div>

<aside id="sidebar" :class="[studio.sidebarOpen?'':'collapsed', studio.mobileOpen?'open':'']" class="flex flex-col py-4">
  <nav class="flex-1 overflow-y-auto px-2 space-y-4">
    <div v-for="sec in studio.config.sidebarMenu" :key="sec.section">
      <div v-if="studio.sidebarOpen" class="text-xs font-bold px-3 mb-1" style="color:var(--text-muted)">{{ sec.section }}</div>
      <button v-for="m in sec.items" :key="m.menuId" @click="studio.navigate(m.menuId, { replace: true })"
              class="sidebar-link" :class="studio.page===m.menuId?'active':''">
        <span class="text-base flex-shrink-0">{{ m.icon }}</span>
        <span class="text-xs font-medium" v-show="studio.sidebarOpen">{{ m.menuName }}</span>
      </button>
    </div>
  </nav>
</aside>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
