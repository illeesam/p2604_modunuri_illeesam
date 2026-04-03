/* MODUNURI - AppHeader */
window.AppHeader = {
  name: 'AppHeader',
  props: ['page', 'theme', 'sidebarOpen', 'mobileOpen', 'config', 'navigate', 'toggleTheme'],
  emits: ['toggle-sidebar', 'toggle-mobile'],
  template: /* html */ `
<header class="glass" style="height:var(--header-h);display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:50;border-left:none;border-right:none;border-top:none;">
  <!-- Hamburger (mobile) -->
  <button @click="$emit('toggle-mobile')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;"
    class="lg:hidden" aria-label="메뉴">
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:14px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
  </button>
  <!-- Collapse toggle (desktop) -->
  <button @click="$emit('toggle-sidebar')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:none;align-items:center;color:var(--text-secondary);flex-shrink:0;"
    class="hidden-sm" aria-label="사이드바 토글">
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
  </button>
  <!-- Logo -->
  <button @click="navigate('home')" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex-shrink:0;padding:0;">
    <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--green));display:flex;align-items:center;justify-content:center;font-size:1rem;">🌐</div>
    <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">{{ config.name }}</span>
      <span style="font-size:0.65rem;color:var(--text-muted);font-weight:500;letter-spacing:0.08em;">{{ config.nameEn }}</span>
    </div>
  </button>
  <!-- Top nav (desktop) -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;">
    <button v-for="m in config.topMenu" :key="m.menuId" @click="navigate(m.menuId)"
      class="nav-link" :class="{active: page===m.menuId}">{{ m.menuName }}</button>
  </nav>
  <!-- Theme toggle -->
  <button class="theme-toggle" @click="toggleTheme" :title="theme==='light'?'다크 모드로 전환':'라이트 모드로 전환'">
    <span v-if="theme==='light'">🌙</span>
    <span v-else>☀️</span>
  </button>
</header>
  `,
  setup() { return {}; }
};
