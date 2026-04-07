/* ANYNURI — 모바일 오버레이 + 사이드바 (index.html 레이아웃 분리) */
(function (g) {
  g.AnyNuriLayout = g.AnyNuriLayout || {};
  g.AnyNuriLayout.AppSidebar = {
    name: 'AppSidebar',
    inject: ['anynuri'],
    template: `
<div class="mobile-overlay" :class="{ active: anynuri.mobileOpen }" @click="anynuri.closeMobileMenu"></div>

<aside id="sidebar" class="flex flex-col min-h-0" :class="{ collapsed: !anynuri.sidebarOpen, open: anynuri.mobileOpen }" @click.stop>
        <div style="height:48px;display:flex;align-items:center;padding:0 1rem;border-bottom:1px solid var(--border);flex-shrink:0">
          <span v-if="anynuri.sidebarOpen" class="text-xs font-bold uppercase tracking-widest" style="color:var(--text-muted)">메뉴</span>
          <span v-else class="text-xs" style="color:var(--text-muted)">≡</span>
        </div>

        <nav class="sidebar-inner flex-1 min-h-0 overflow-y-auto" style="padding:0.75rem 0.5rem">
          <button type="button" v-for="m in anynuri.config.menus" :key="m.menuId"
            @click.stop="anynuri.navigate(m.menuId, { replace: true })"
            class="sidebar-link w-full"
            :class="{ active: anynuri.page===m.menuId }"
            :data-tip="m.menuName"
            :aria-label="m.menuName">
            <span class="sidebar-link-icon text-base flex-shrink-0">{{ m.icon }}</span>
            <span v-if="anynuri.sidebarOpen" class="truncate">{{ m.menuName }}</span>
          </button>
        </nav>

        <div v-if="anynuri.sidebarOpen" style="padding:0.75rem;border-top:1px solid var(--border);flex-shrink:0">
          <button type="button" @click.stop="anynuri.navigate('contact', { replace: true })" class="btn-sakura w-full py-2 rounded-xl text-sm">
            ✨ 작품 의뢰하기
          </button>
        </div>
      </aside>
`,
  };
})(typeof window !== 'undefined' ? window : globalThis);
