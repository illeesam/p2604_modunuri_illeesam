/* ShopJoy - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['page', 'sidebarOpen', 'mobileOpen', 'config', 'navigate', 'cartCount'],
  emits: ['toggle-sidebar', 'close-mobile'],
  template: /* html */ `
<div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" @click.stop>
  <div style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">
    <template v-for="section in config.sidebarMenu" :key="section.section">
      <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        {{ section.section }}
      </div>
      <button type="button" v-for="item in section.items" :key="item.menuId" @click.stop="navigate(item.menuId, { replace: true })"
        class="sidebar-link" :class="{active: page===item.menuId}">
        <span style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">
          {{ item.menuName }}
          <span v-if="item.menuId==='cart' && cartCount>0"
            style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--blue);color:#fff;font-size:0.6rem;font-weight:800;padding:0 4px;margin-left:4px;">
            {{ cartCount > 99 ? '99+' : cartCount }}
          </span>
        </span>
      </button>
    </template>
    <div style="flex:1;"></div>
    <button type="button" @click.stop="$emit('toggle-sidebar')"
      style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:0.75rem;transition:all 0.2s;"
      class="hidden-sm">
      <span>{{ sidebarOpen ? '◀' : '▶' }}</span>
      <span v-if="sidebarOpen">접기</span>
    </button>
  </div>
</div>
  `,
  setup() { return {}; }
};
