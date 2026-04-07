/* ArtGallery - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['page', 'sidebarOpen', 'mobileOpen', 'config', 'navigate'],
  emits: ['toggle-sidebar', 'close-mobile'],
  template: /* html */ `
<div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" @click.stop>
  <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">
    <template v-for="section in config.sidebarMenu" :key="section.section">
      <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        {{ section.section }}
      </div>
      <button type="button" v-for="item in section.items" :key="item.menuId" @click.stop="navigate(item.menuId, { replace: true });$emit('close-mobile')"
        class="sidebar-link" :class="{active: page===item.menuId}"
        :data-tip="item.menuName"
        :aria-label="item.menuName">
        <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuName }}</span>
      </button>
    </template>
    <div style="flex:1;"></div>
    <!-- 대여 CTA -->
    <div v-if="sidebarOpen" style="margin:8px 0;padding:16px 12px;border-radius:14px;background:linear-gradient(135deg,var(--gold-dim),var(--burgundy-dim));border:1px solid rgba(201,160,89,0.25);">
      <div style="font-size:0.75rem;font-weight:700;color:var(--gold);margin-bottom:4px;">🖼️ 작품 대여</div>
      <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">공간에 예술을 더하세요</div>
      <button type="button" @click.stop="navigate('lease', { replace: true });$emit('close-mobile')" class="btn-gold btn-sm" style="width:100%;padding:7px;">대여 알아보기</button>
    </div>
    <!-- Sidebar collapse toggle (desktop) -->
    <button type="button" @click.stop="$emit('toggle-sidebar')"
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
  setup(props) {
    return {};
  }
};
