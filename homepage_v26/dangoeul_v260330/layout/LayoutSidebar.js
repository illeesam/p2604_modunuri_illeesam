/* 단고을 — 좌측 사이드바 */
window.DangoeulComponents = window.DangoeulComponents || {};
window.DangoeulComponents.LayoutSidebar = {
  name: 'LayoutSidebar',
  props: ['config', 'page', 'navigate', 'sidebarOpen', 'toggleSidebar', 'mobileOpen'],
  template: /* html */ `
  <div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" @click.stop>
    <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">
      <template v-for="section in config.sidebarMenu" :key="section.section">
        <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
          {{ section.section }}
        </div>
        <button type="button" v-for="item in section.items" :key="item.menuId" @click.stop="navigate(item.menuId, { replace: true })"
          class="sidebar-link" :class="{active: page===item.menuId}"
          :data-tip="item.menuName"
          :aria-label="item.menuName">
          <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
          <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuName }}</span>
        </button>
      </template>
      <div style="flex:1;"></div>
      <button type="button" @click.stop="toggleSidebar"
        style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:0.75rem;transition:all 0.2s;"
        class="hidden-sm sidebar-collapse-toggle"
        :title="!mobileOpen ? (sidebarOpen ? '사이드바 접기' : '사이드바 펼치기') : ''"
        :aria-label="sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'">
        <span>{{ sidebarOpen ? '◀' : '▶' }}</span>
        <span v-if="sidebarOpen">접기</span>
      </button>
    </div>
  </div>
  `,
};
