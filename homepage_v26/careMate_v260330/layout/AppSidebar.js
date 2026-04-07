/* CareMate - AppSidebar */
window.AppSidebar = {
  name: 'AppSidebar',
  props: ['page', 'sidebarOpen', 'mobileOpen', 'config', 'navigate'],
  emits: ['toggle-sidebar', 'close-mobile'],
  template: /* html */ `
  <div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" @click.stop>
    <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">
      <template v-for="section in config.sidebarMenu" :key="section.section">
        <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">{{ section.section }}</div>
        <button type="button" v-for="item in section.items" :key="item.menuId" @click.stop="navigate(item.menuId, { replace: true });$emit('close-mobile')"
          class="sidebar-link" :class="{active:page===item.menuId}"
          :data-tip="item.menuName"
          :aria-label="item.menuName">
          <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
          <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuName }}</span>
        </button>
      </template>
      <div style="flex:1;"></div>
      <div v-if="sidebarOpen" style="margin:8px 0;padding:14px 12px;border-radius:14px;background:linear-gradient(135deg,var(--blue-dim),var(--teal-dim));border:1px solid rgba(26,115,232,0.2);">
        <div style="font-size:0.72rem;font-weight:700;color:var(--blue);margin-bottom:4px;">🏥 병원동행 예약</div>
        <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">전문 매니저가 동행합니다</div>
        <button type="button" @click.stop="navigate('booking', { replace: true });$emit('close-mobile')" class="btn-blue btn-sm" style="width:100%;padding:7px;">지금 예약하기</button>
      </div>
      <button type="button" @click.stop="$emit('toggle-sidebar')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:0.75rem;" class="hidden-sm sidebar-collapse-toggle"
        :title="!mobileOpen ? (sidebarOpen ? '사이드바 접기' : '사이드바 펼치기') : ''"
        :aria-label="sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'">
        <span>{{ sidebarOpen?'◀':'▶' }}</span><span v-if="sidebarOpen">접기</span>
      </button>
    </div>
  </div>
`,
  setup(props) {
    const { } = Vue;
    return {};
  }
};
