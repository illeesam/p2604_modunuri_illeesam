/* MODUNURI - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['page', 'sidebarOpen', 'mobileOpen', 'config', 'navigate'],
  emits: ['toggle-sidebar', 'close-mobile'],
  template: /* html */ `
<div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']">
  <div style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">
    <template v-for="section in config.sidebarMenu" :key="section.section">
      <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        {{ section.section }}
      </div>
      <button v-for="item in section.items" :key="item.id" @click="navigate(item.id, { replace: true })"
        class="sidebar-link" :class="{active: page===item.id}">
        <span style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.label }}</span>
      </button>
    </template>
    <div style="flex:1;"></div>
    <!-- Sidebar collapse toggle (desktop) -->
    <button @click="$emit('toggle-sidebar')"
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
