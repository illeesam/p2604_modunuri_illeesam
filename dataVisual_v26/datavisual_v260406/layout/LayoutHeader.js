/* DataVisual — LayoutHeader */
window.DvLayout = window.DvLayout || {};
window.DvLayout.LayoutHeader = {
  name: 'LayoutHeader',
  props: ['page', 'theme', 'sidebarOpen', 'mobileOpen', 'navigate', 'toggleTheme', 'toggleSidebar', 'toggleMobile'],
  template: /* html */ `
<header style="height:var(--header-h);display:flex;align-items:center;padding:0 16px;gap:12px;position:sticky;top:0;z-index:50;background:var(--bg-header);border-bottom:1px solid var(--border);backdrop-filter:blur(12px);">
  <!-- Sidebar toggle (desktop) -->
  <button @click="toggleSidebar" class="hidden-sm theme-toggle" title="사이드바 토글" style="flex-shrink:0;">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
  </button>
  <!-- Mobile menu -->
  <button @click="toggleMobile" class="lg:hidden theme-toggle" style="flex-shrink:0;">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path v-if="!mobileOpen" d="M3 6h18M3 12h18M3 18h18"/>
      <path v-else d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>

  <!-- Logo -->
  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;cursor:pointer;" @click="navigate('dashboard')">
    <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--blue),var(--purple));display:flex;align-items:center;justify-content:center;font-size:0.9rem;">📊</div>
    <div>
      <div style="font-size:0.9rem;font-weight:900;color:var(--text-primary);line-height:1.1;">DataVisual</div>
      <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:0.08em;">DASHBOARD</div>
    </div>
  </div>

  <!-- Top nav -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;" class="hidden-sm">
    <button v-for="m in config.topMenu" :key="m.menuId" @click="navigate(m.menuId)"
      class="nav-link" :class="{active: page===m.menuId}">{{ m.menuName }}</button>
  </nav>
  <div style="flex:1;" class="lg:hidden"></div>

  <!-- Theme -->
  <button @click="toggleTheme" class="theme-toggle" :title="theme==='light'?'다크':'라이트'">
    <span v-if="theme==='light'">🌙</span>
    <span v-else>☀️</span>
  </button>
</header>
  `,
  setup() {
    return { config: window.DV_CONFIG };
  }
};
