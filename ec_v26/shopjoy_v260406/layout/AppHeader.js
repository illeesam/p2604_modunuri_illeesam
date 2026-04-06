/* ShopJoy - AppHeader */
window.AppHeader = {
  name: 'AppHeader',
  props: ['page', 'theme', 'sidebarOpen', 'mobileOpen', 'config', 'navigate', 'toggleTheme', 'cartCount', 'auth', 'onShowLogin', 'onLogout'],
  emits: ['toggle-sidebar', 'toggle-mobile'],
  setup(props) {
    const { ref } = Vue;
    const userMenuOpen = ref(false);
    const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value; };
    const closeUserMenu = () => { userMenuOpen.value = false; };
    const goMy = () => { closeUserMenu(); props.navigate('my'); };
    const doLogout = () => { closeUserMenu(); props.onLogout(); };
    return { userMenuOpen, toggleUserMenu, closeUserMenu, goMy, doLogout };
  },
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
    <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--green));display:flex;align-items:center;justify-content:center;font-size:1rem;">👗</div>
    <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">{{ config.name }}</span>
      <span style="font-size:0.65rem;color:var(--text-muted);font-weight:500;letter-spacing:0.08em;">{{ config.tagline }}</span>
    </div>
  </button>
  <!-- Top nav (desktop) -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;">
    <button v-for="m in config.topMenu" :key="m.menuId" @click="navigate(m.menuId)"
      class="nav-link" :class="{active: page===m.menuId}">
      <span v-if="m.menuId==='cart'" style="position:relative;display:inline-block;">
        {{ m.menuName }}
        <span v-if="cartCount>0" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </span>
      <span v-else>{{ m.menuName }}</span>
    </button>
  </nav>

  <!-- 우측: 테마 + 로그인/유저 -->
  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
    <!-- Theme toggle -->
    <button class="theme-toggle" @click="toggleTheme" :title="theme==='light'?'다크 모드로 전환':'라이트 모드로 전환'">
      <span v-if="theme==='light'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- 비로그인 -->
    <button v-if="!auth.user" @click="onShowLogin"
      style="padding:7px 16px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:700;white-space:nowrap;transition:all 0.2s;"
      @mouseenter="$event.target.style.background='var(--blue)';$event.target.style.color='#fff';"
      @mouseleave="$event.target.style.background='transparent';$event.target.style.color='var(--blue)';">
      로그인
    </button>

    <!-- 로그인 상태 -->
    <div v-else style="position:relative;">
      <button @click="toggleUserMenu"
        style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;color:var(--text-primary);font-weight:600;">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0;">
          {{ auth.user.name.charAt(0) }}
        </span>
        <span class="hidden-sm" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.name }}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
          :style="userMenuOpen?'transform:rotate(180deg);transition:0.2s;':'transition:0.2s;'"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <!-- 드롭다운 -->
      <div v-if="userMenuOpen" @click.stop
        style="position:absolute;right:0;top:calc(100% + 8px);width:180px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:100;overflow:hidden;">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
          <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);">{{ auth.user.name }}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">{{ auth.user.email }}</div>
        </div>
        <button @click="goMy"
          style="width:100%;padding:12px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.88rem;color:var(--text-primary);display:flex;align-items:center;gap:8px;"
          @mouseenter="$event.target.style.background='var(--blue-dim)';"
          @mouseleave="$event.target.style.background='none';">
          👤 마이페이지
        </button>
        <button @click="doLogout"
          style="width:100%;padding:12px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.88rem;color:#ef4444;display:flex;align-items:center;gap:8px;border-top:1px solid var(--border);"
          @mouseenter="$event.target.style.background='#fef2f2';"
          @mouseleave="$event.target.style.background='none';">
          🚪 로그아웃
        </button>
      </div>

      <!-- 드롭다운 외부 클릭 닫기 -->
      <div v-if="userMenuOpen" @click="closeUserMenu"
        style="position:fixed;inset:0;z-index:99;"></div>
    </div>
  </div>
</header>
  `,
};
