/* ShopJoy - AppSidebar */
window.frontAppSidebar = {
  name: 'FrontAppSidebar',
  props: ['page', 'sidebarOpen', 'mobileOpen', 'config', 'navigate', 'cartCount', 'auth'],
  emits: ['toggle-sidebar', 'close-mobile'],
  setup(props, { emit }) {
    const { ref, watch } = Vue;

    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const isMenuActive = (page, menuId) => {
      if (menuId === 'myOrder') return MY_PAGES.includes(page);
      return page === menuId;
    };

    /* 토글 상태 (기본 모두 접힘) */
    const sample0Open = ref(false);
    const sample1Open = ref(false);
    const sample2Open = ref(false);
    const dispUiOpen  = ref(false);

    const SAMPLE0_ITEMS = [
      { menuId: 'sample01', menuNm: '01.gridCrud' },
      { menuId: 'sample02', menuNm: '02.infinity_scroll' },
      { menuId: 'sample03', menuNm: '03.comps' },
      { menuId: 'sample04', menuNm: '04.modals' },
      { menuId: 'sample05', menuNm: '05.store' },
      { menuId: 'sample06', menuNm: '06.login_token' },
      { menuId: 'sample07', menuNm: '07.postman' },
      { menuId: 'sample08', menuNm: '08' },
      { menuId: 'sample09', menuNm: '09' },
    ];
    const SAMPLE1_ITEMS = [
      { menuId: 'sample10', menuNm: '10' },
      { menuId: 'sample11', menuNm: '11.dispArea' },
      { menuId: 'sample12', menuNm: '12.dispArea2' },
      { menuId: 'sample13', menuNm: '13.dispPanel' },
      { menuId: 'sample14', menuNm: '14.dispWidget' },
    ];
    const SAMPLE2_ITEMS = [
      { menuId: 'sample21', menuNm: '21.snsLogin' },
      { menuId: 'sample22', menuNm: '22.payment' },
      { menuId: 'sample23', menuNm: '23.sms_email' },
    ];
    const DISP_UI_ITEMS = [
      { menuId: 'dispUi01', menuNm: '전시ui01' },
      { menuId: 'dispUi02', menuNm: '전시ui02' },
      { menuId: 'dispUi03', menuNm: '전시ui03' },
      { menuId: 'dispUi04', menuNm: '전시ui04' },
      { menuId: 'dispUi05', menuNm: '전시ui05' },
      { menuId: 'dispUi06', menuNm: '전시ui06' },
    ];

    /* 현재 페이지가 속한 그룹 자동 펼침 */
    watch(() => props.page, (p) => {
      if (SAMPLE0_ITEMS.some(i => i.menuId === p)) sample0Open.value = true;
      if (SAMPLE1_ITEMS.some(i => i.menuId === p)) sample1Open.value = true;
      if (SAMPLE2_ITEMS.some(i => i.menuId === p)) sample2Open.value = true;
      if (DISP_UI_ITEMS.some(i => i.menuId === p)) dispUiOpen.value  = true;
    }, { immediate: true });

    const navTo = (menuId) => {
      props.navigate(menuId, { replace: true });
      emit('close-mobile');
    };

    const frontSiteNo = window.FRONT_SITE_NO || '01';
    const showSamples = frontSiteNo !== '01'; // Site 01은 샘플 메뉴 숨김

    return { isMenuActive, sample0Open, sample1Open, sample2Open, dispUiOpen,
             SAMPLE0_ITEMS, SAMPLE1_ITEMS, SAMPLE2_ITEMS, DISP_UI_ITEMS, navTo,
             showSamples };
  },
  template: /* html */ `
<div id="sidebar" :class="[sidebarOpen?'':'collapsed', mobileOpen?'open':'']" @click.stop>
  <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">

    <!-- 기존 sidebarMenu 섹션 (샘플 전시 제외) -->
    <template v-for="section in config.sidebarMenu" :key="section.section">
      <template v-if="section.section !== '샘플 전시'">
        <div v-if="sidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
          {{ section.section }}
        </div>
        <template v-for="item in section.items" :key="item.menuId">
          <button v-if="!item.authRequired || (auth && auth.user)" type="button"
            @click.stop="navTo(item.menuId)"
            class="sidebar-link" :class="{active: isMenuActive(page, item.menuId)}"
            :data-tip="item.menuNm" :aria-label="item.menuNm">
            <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
            <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">
              {{ item.menuNm }}
              <span v-if="item.menuId==='cart' && cartCount>0"
                style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--blue);color:#fff;font-size:0.6rem;font-weight:800;padding:0 4px;margin-left:4px;">
                {{ cartCount > 99 ? '99+' : cartCount }}
              </span>
            </span>
          </button>
        </template>
      </template>
    </template>

    <!-- 샘플 섹션 — Site 01은 전체 숨김 -->
    <template v-if="showSamples">
    <!-- 샘플0 (01~06) -->
    <div v-if="sidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="sample0Open=!sample0Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플0</span>
        <span style="font-size:0.6rem;">{{ sample0Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="sample0Open">
      <button v-for="item in SAMPLE0_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플1 (07~14) -->
    <div v-if="sidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="sample1Open=!sample1Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플1</span>
        <span style="font-size:0.6rem;">{{ sample1Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="sample1Open">
      <button v-for="item in SAMPLE1_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플2 (21~23) -->
    <div v-if="sidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="sample2Open=!sample2Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플2</span>
        <span style="font-size:0.6rem;">{{ sample2Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="sample2Open">
      <button v-for="item in SAMPLE2_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플 전시 (토글) -->
    <div v-if="sidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="dispUiOpen=!dispUiOpen"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플 전시</span>
        <span style="font-size:0.6rem;">{{ dispUiOpen ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="dispUiOpen">
      <button v-for="item in DISP_UI_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">🖼</span>
        <span v-if="sidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuNm }}</span>
      </button>
    </template>
    </template>  <!-- /showSamples -->

    <div style="flex:1;"></div>
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
};
