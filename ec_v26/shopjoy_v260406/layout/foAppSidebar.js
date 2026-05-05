/* ShopJoy - AppSidebar */
window.foAppSidebar = {
  name: 'FoAppSidebar',
  props: ['page', 'appSidebarOpen', 'appMobileOpen', 'config', 'navigate', 'appCartCount', 'appAuth'],
  emits: ['app-toggle-sidebar', 'app-close-mobile'],
  setup(props, { emit }) {
    const { ref, reactive, watch } = Vue;

    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const isMenuActive = (page, menuId) => {
      if (menuId === 'myOrder') return MY_PAGES.includes(page);
      return page === menuId;
    };

    /* 토글 상태 (기본 모두 접힘) */
    const uiState = reactive({ sample0Open: false, sample1Open: false, sample2Open: false, dispUiOpen: false, devToolsOpen: false, loading: false, error: '', isPageCodeLoad: false });
    const codes = reactive({});

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
    const DEV_TOOLS_ITEMS = [
      { menuId: 'xsStore', menuNm: 'Store 정보관리' },
      { menuId: 'xsLocalStorage', menuNm: 'localStorage 정보관리' },
      { siteNo: '01', siteNm: 'FO=01' },
      { siteNo: '02', siteNm: 'FO=02' },
      { siteNo: '03', siteNm: 'FO=03' },
      { siteNo: '9999', siteNm: 'FO=9999' },
    ];

    const navToSite = (siteNo) => {
      try { localStorage.setItem('modu-fo-siteNo', siteNo); } catch(_){}
      window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?FO_SITE_NO=' + siteNo;
    };

    /* 현재 페이지가 속한 그룹 자동 펼침 */
    watch(() => props.page, (p) => {
      if (SAMPLE0_ITEMS.some(i => i.menuId === p)) uiState.sample0Open = true;
      if (SAMPLE1_ITEMS.some(i => i.menuId === p)) uiState.sample1Open = true;
      if (SAMPLE2_ITEMS.some(i => i.menuId === p)) uiState.sample2Open = true;
      if (DISP_UI_ITEMS.some(i => i.menuId === p)) uiState.dispUiOpen  = true;
      if (DEV_TOOLS_ITEMS.some(i => i.menuId === p)) uiState.devToolsOpen = true;
    }, { immediate: true });

    const navTo = (menuId) => {
      props.navigate(menuId, { replace: true });
      emit('app-close-mobile');
    };

    const foSiteNo = window.FO_SITE_NO || '01';
    const showSamples = foSiteNo !== '01'; // Site 01은 샘플 메뉴 숨김

    return { isMenuActive, uiState, codes,
             SAMPLE0_ITEMS, SAMPLE1_ITEMS, SAMPLE2_ITEMS, DISP_UI_ITEMS, DEV_TOOLS_ITEMS, navTo, navToSite,
             showSamples, foSiteNo };
  },
  template: /* html */ `
<div id="sidebar" :class="[appSidebarOpen?'':'collapsed', appMobileOpen?'open':'']" @click.stop>
  <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">

    <!-- 기존 sidebarMenu 섹션 (샘플 전시 제외) -->
    <template v-for="section in config.sidebarMenu" :key="section.section">
      <template v-if="section.section !== '샘플 전시'">
        <div v-if="appSidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
          {{ section.section }}
        </div>
        <template v-for="item in section.items" :key="item.menuId">
          <button v-if="!item.authRequired || (appAuth && appAuth.user)" type="button"
            @click.stop="navTo(item.menuId)"
            class="sidebar-link" :class="{active: isMenuActive(page, item.menuId)}"
            :data-tip="item.menuNm" :aria-label="item.menuNm">
            <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
            <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">
              {{ item.menuNm }}
              <span v-if="item.menuId==='cart' && appCartCount>0"
                style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--blue);color:#fff;font-size:0.6rem;font-weight:800;padding:0 4px;margin-left:4px;">
                {{ appCartCount > 99 ? '99+' : appCartCount }}
              </span>
            </span>
          </button>
        </template>
      </template>
    </template>

    <!-- 개발도구 섹션 -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="uiState.devToolsOpen=!uiState.devToolsOpen"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>개발도구</span>
        <span style="font-size:0.6rem;">{{ uiState.devToolsOpen ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.devToolsOpen">
      <button v-for="item in DEV_TOOLS_ITEMS" :key="item.menuId || item.siteNo" type="button"
        @click.stop="item.menuId ? navTo(item.menuId) : navToSite(item.siteNo)"
        class="sidebar-link" :class="{active: item.menuId && page === item.menuId}"
        :data-tip="item.menuNm || item.siteNm" :aria-label="item.menuNm || item.siteNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">{{ item.menuId ? '🔧' : '🌐' }}</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm || item.siteNm }}</span>
      </button>
    </template>

    <!-- 샘플 섹션 — Site 01은 전체 숨김 -->
    <template v-if="showSamples">
    <!-- 샘플0 (01~06) -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="uiState.sample0Open=!uiState.sample0Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플0</span>
        <span style="font-size:0.6rem;">{{ uiState.sample0Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.sample0Open">
      <button v-for="item in SAMPLE0_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플1 (07~14) -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="uiState.sample1Open=!uiState.sample1Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플1</span>
        <span style="font-size:0.6rem;">{{ uiState.sample1Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.sample1Open">
      <button v-for="item in SAMPLE1_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플2 (21~23) -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="uiState.sample2Open=!uiState.sample2Open"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플2</span>
        <span style="font-size:0.6rem;">{{ uiState.sample2Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.sample2Open">
      <button v-for="item in SAMPLE2_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- 샘플 전시 (토글) -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="uiState.dispUiOpen=!uiState.dispUiOpen"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플 전시</span>
        <span style="font-size:0.6rem;">{{ uiState.dispUiOpen ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.dispUiOpen">
      <button v-for="item in DISP_UI_ITEMS" :key="item.menuId" type="button"
        @click.stop="navTo(item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">🖼</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuNm }}</span>
      </button>
    </template>
    </template>  <!-- /showSamples -->

    <div style="flex:1;"></div>
    <button type="button" @click.stop="$emit('app-toggle-sidebar')"
      style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:0.75rem;transition:all 0.2s;"
      class="hidden-sm sidebar-collapse-toggle"
      :title="!appMobileOpen ? (appSidebarOpen ? '사이드바 접기' : '사이드바 펼치기') : ''"
      :aria-label="appSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'">
      <span>{{ appSidebarOpen ? '◀' : '▶' }}</span>
      <span v-if="appSidebarOpen">접기</span>
    </button>
  </div>
</div>
  `,
};
