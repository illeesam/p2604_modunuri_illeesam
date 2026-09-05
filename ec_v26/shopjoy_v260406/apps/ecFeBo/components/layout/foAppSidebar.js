/* ShopJoy - AppSidebar */
window.foAppSidebar = {
  name: 'FoAppSidebar',
  props: ['page', 'appSidebarOpen', 'appMobileOpen', 'config', 'navigate', 'appCartCount', 'appAuth', 'isPageLoaded'],
  emits: ['modu-fo-toggle-sidebar', 'modu-fo-close-mobile'],
  setup(props, { emit }) {

    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, computed, watch } = Vue;

    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];

    /* 토글 상태 (기본 모두 접힘) */
    const uiState = reactive({ sample0Open: false, sample1Open: false, sample2Open: false, dispUiOpen: false, devToolsOpen: false, moduleOpen: { cb: true, sg: true }, loading: false, error: '' });
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
    /* MODULE_ITEMS — index.html 라우팅 밖의 독립 FO 모듈(자체 HTML 진입점) 바로가기.
       navTo() 의 SPA pageId 이동이 아니라 href 로 실제 페이지 전체 이동한다. */
    const MODULE_GROUPS = [
      { groupId: 'cb', groupNm: '코바늘 도안', icon: '🧶', items: [
        { menuId: 'cobanul',     menuNm: '코바늘 도안',    href: 'fo-md-cb-cobanul.html' },
        { menuId: 'myCobanul',   menuNm: '내 코바늘 도안', href: 'fo-md-cb-cobanul.html?mine=1' },
      ] },
      { groupId: 'sg', groupNm: '소스젠', icon: '⚙️', items: [
        { menuId: 'sourcegen',   menuNm: '소스젠',    href: 'fo-md-sg-sourcegen.html' },
        { menuId: 'mySourcegen', menuNm: '내 소스젠', href: 'fo-md-sg-sourcegen.html?mine=1' },
      ] },
    ];
    /* MODULE_ITEMS — 평면 목록(현재 page 가 모듈 메뉴인지 판정 등 기존 로직 호환용) */
    const MODULE_ITEMS = MODULE_GROUPS.flatMap(g => g.items);
    const DEV_TOOLS_ITEMS = [
      { menuId: 'xsStore', menuNm: 'Store 정보관리' },
      { menuId: 'xsLocalStorage', menuNm: 'localStorage 정보관리' },
      { siteNo: '01', siteNm: 'FO=01' },
      { siteNo: '02', siteNm: 'FO=02' },
      { siteNo: '03', siteNm: 'FO=03' },
      { siteNo: '9999', siteNm: 'FO=9999' },
    ];

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ foAppSidebar.js : handleBtnAction -> ', cmd, param);
      // 사이드바 펼침/접힘 토글
      if (cmd === 'sidebar-toggle') {
        return emit('modu-fo-toggle-sidebar');
      // 모듈 그룹(코바늘/소스젠) 섹션 토글 — param = groupId
      } else if (cmd === 'nav-toggle-module') {
        uiState.moduleOpen[param] = !uiState.moduleOpen[param];
        return;
      // 개발도구 섹션 토글
      } else if (cmd === 'nav-toggle-devTools') {
        uiState.devToolsOpen = !uiState.devToolsOpen;
        return;
      // 샘플0 섹션 토글
      } else if (cmd === 'nav-toggle-sample0') {
        uiState.sample0Open = !uiState.sample0Open;
        return;
      // 샘플1 섹션 토글
      } else if (cmd === 'nav-toggle-sample1') {
        uiState.sample1Open = !uiState.sample1Open;
        return;
      // 샘플2 섹션 토글
      } else if (cmd === 'nav-toggle-sample2') {
        uiState.sample2Open = !uiState.sample2Open;
        return;
      // 샘플 전시 섹션 토글
      } else if (cmd === 'nav-toggle-dispUi') {
        uiState.dispUiOpen = !uiState.dispUiOpen;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 메뉴 항목 선택 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ foAppSidebar.js : handleSelectAction -> ', cmd, param);
      // 사이드바 메뉴 항목 선택 (menuId로 이동)
      if (cmd === 'nav-select-menu') {
        return navTo(param);
      // 개발도구 항목 선택 (menuId 또는 siteNo 분기)
      } else if (cmd === 'nav-select-devTools') {
        if (param.menuId) { return navTo(param.menuId); }
        if (param.siteNo) { return navToSite(param.siteNo); }
        return;
      // 독립 모듈 바로가기 (href 로 전체 페이지 이동)
      } else if (cmd === 'nav-select-module') {
        location.href = param.href;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* navToSite — 이동 */
    const navToSite = (siteNo) => {
      try { localStorage.setItem('modu-fo-sy-siteNo', siteNo); } catch(_){}
      window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?FO_SITE_NO=' + siteNo;
    };

    /* 현재 페이지가 속한 그룹 자동 펼침 */
    watch(() => props.page, (p) => {
      if (SAMPLE0_ITEMS.some(i => i.menuId === p)) { uiState.sample0Open = true; }
      if (SAMPLE1_ITEMS.some(i => i.menuId === p)) { uiState.sample1Open = true; }
      if (SAMPLE2_ITEMS.some(i => i.menuId === p)) { uiState.sample2Open = true; }
      if (DISP_UI_ITEMS.some(i => i.menuId === p)) { uiState.dispUiOpen  = true; }
      if (DEV_TOOLS_ITEMS.some(i => i.menuId === p)) { uiState.devToolsOpen = true; }
    }, { immediate: true });

    /* navTo — 이동 */
    const navTo = (menuId) => {
      props.navigate(menuId, { replace: true });
      emit('modu-fo-close-mobile');
    };

    // ===== [05] 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ====================

    /* isMenuActive — 여부 확인 */
    const isMenuActive = (page, menuId) => {
      if (menuId === 'myOrder') { return MY_PAGES.includes(page); }
      return page === menuId;
    };

    /* fnIsLoaded — lazy-load(2026-08-30) 전이면 메뉴명을 흐리게 표시(bo.html 좌측메뉴와 동일 취지) */
    const fnIsLoaded = (menuId) => (props.isPageLoaded ? props.isPageLoaded(menuId) : true);

    const foSiteNo = window.FO_SITE_NO || '01';
    const showSamples = foSiteNo !== '01'; // Site 01은 샘플 메뉴 숨김

    const cfSidebarMenu = computed(() => window.sfGetFoMenuStore?.()?.svSidebarMenu || []);

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes,                                                       // 상태
      handleBtnAction, handleSelectAction,                                  // dispatch
      isMenuActive, fnIsLoaded, showSamples, foSiteNo, cfSidebarMenu,       // 헬퍼/computed
      SAMPLE0_ITEMS, SAMPLE1_ITEMS, SAMPLE2_ITEMS, DISP_UI_ITEMS, DEV_TOOLS_ITEMS, MODULE_ITEMS, MODULE_GROUPS,  // 메뉴 정의
    };
  },
  template: /* html */ `
<div id="sidebar" :class="[appSidebarOpen?'':'collapsed', appMobileOpen?'open':'']" @click.stop>
  <!-- ===== ■. 영역 ====================================================== -->
  <div class="sidebar-inner" style="padding:16px 10px;overflow-y:auto;height:100%;display:flex;flex-direction:column;gap:6px;">

    <!-- ===== ■.■. 기존 sidebarMenu 섹션 (샘플 전시 제외) ========================== -->
    <template v-for="section in cfSidebarMenu" :key="section.section">
      <template v-if="section.section !== '샘플 전시'">
        <div v-if="appSidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
          {{ section.section }}
        </div>
        <template v-for="item in section.items" :key="item.menuId">
          <button v-if="!item.authRequired || (appAuth ? (appAuth.user) : false)" type="button"
            @click.stop="handleSelectAction('nav-select-menu', item.menuId)"
            class="sidebar-link" :class="{active: isMenuActive(page, item.menuId), 'sidebar-link-not-loaded': !fnIsLoaded(item.menuId)}"
            :data-tip="item.menuNm" :aria-label="item.menuNm">
            <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ item.icon }}</span>
            <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">
              {{ item.menuNm }}
              <span v-if="item.menuId==='cart' ? (appCartCount>0) : false"
                style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:9px;background:var(--blue);color:#fff;font-size:0.6rem;font-weight:800;padding:0 4px;margin-left:4px;">
                {{ appCartCount > 99 ? '99+' : appCartCount }}
              </span>
            </span>
          </button>
        </template>
      </template>
    </template>

    <!-- ===== □.□. 기존 sidebarMenu 섹션 (샘플 전시 제외) ========================== -->
    <!-- ===== ■.■. 모듈 섹션 (독립 FO 모듈 바로가기) =============================== -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 4px;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
      모듈
    </div>
    <template v-for="grp in MODULE_GROUPS" :key="grp.groupId">
      <!-- 그룹 헤더 (사이드바 접힘 상태에선 아이콘만 나오는 항목들이 곧 그룹 대표라 헤더는 숨긴다) -->
      <button v-if="appSidebarOpen" type="button" @click.stop="handleBtnAction('nav-toggle-module', grp.groupId)"
        style="width:100%;display:flex;align-items:center;gap:8px;padding:6px 10px;background:none;border:none;cursor:pointer;text-align:left;">
        <span style="font-size:0.95rem;flex-shrink:0;">{{ grp.icon }}</span>
        <span style="flex:1;font-size:0.78rem;font-weight:700;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;">{{ grp.groupNm }}</span>
        <span style="font-size:0.6rem;color:var(--text-muted);">{{ uiState.moduleOpen[grp.groupId] ? '▲' : '▼' }}</span>
      </button>
      <template v-if="uiState.moduleOpen[grp.groupId] || !appSidebarOpen">
        <button v-for="item in grp.items" :key="item.menuId" type="button"
          @click.stop="handleSelectAction('nav-select-module', item)"
          class="sidebar-link" :data-tip="item.menuNm" :aria-label="item.menuNm">
          <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">{{ grp.icon }}</span>
          <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;padding-left:12px;">{{ item.menuNm }}</span>
        </button>
      </template>
    </template>

    <!-- ===== □.□. 모듈 섹션 (독립 FO 모듈 바로가기) =============================== -->
    <!-- ===== ■.■. 개발도구 섹션 =============================================== -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="handleBtnAction('nav-toggle-devTools')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>개발도구</span>
        <span style="font-size:0.6rem;">{{ uiState.devToolsOpen ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.devToolsOpen">
      <button v-for="item in DEV_TOOLS_ITEMS" :key="item.menuId || item.siteNo" type="button"
        @click.stop="handleSelectAction('nav-select-devTools', item)"
        class="sidebar-link" :class="{active: item.menuId ? page === item.menuId : false, 'sidebar-link-not-loaded': item.menuId ? !fnIsLoaded(item.menuId) : false}"
        :data-tip="item.menuNm || item.siteNm" :aria-label="item.menuNm || item.siteNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">{{ item.menuId ? '🔧' : '🌐' }}</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm || item.siteNm }}</span>
      </button>
    </template>

    <!-- ===== □.□. 개발도구 섹션 =============================================== -->
    <!-- ===== ■.■. 샘플 섹션 — Site 01은 전체 숨김 ================================ -->
    <!-- ===== ■.■. 조건부 영역 ================================================ -->
    <template v-if="showSamples">
    <!-- ===== ■.■. 샘플0 (01~06) =========================================== -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="handleBtnAction('nav-toggle-sample0')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플0</span>
        <span style="font-size:0.6rem;">{{ uiState.sample0Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.sample0Open">
      <button v-for="item in SAMPLE0_ITEMS" :key="item.menuId" type="button"
        @click.stop="handleSelectAction('nav-select-menu', item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId, 'sidebar-link-not-loaded': !fnIsLoaded(item.menuId)}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- ===== □.□. 샘플0 (01~06) =========================================== -->
    <!-- ===== ■.■. 샘플1 (07~14) =========================================== -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="handleBtnAction('nav-toggle-sample1')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플1</span>
        <span style="font-size:0.6rem;">{{ uiState.sample1Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.sample1Open">
      <button v-for="item in SAMPLE1_ITEMS" :key="item.menuId" type="button"
        @click.stop="handleSelectAction('nav-select-menu', item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId, 'sidebar-link-not-loaded': !fnIsLoaded(item.menuId)}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- ===== □.□. 샘플1 (07~14) =========================================== -->
    <!-- ===== ■.■. 샘플2 (21~23) =========================================== -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="handleBtnAction('nav-toggle-sample2')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플2</span>
        <span style="font-size:0.6rem;">{{ uiState.sample2Open ? '▲' : '▼' }}</span>
      </button>
    </div>
    <!-- ===== □.□. 샘플2 (21~23) =========================================== -->
    <!-- ===== ■.■. 조건부 영역 ================================================ -->
    <template v-if="uiState.sample2Open">
      <button v-for="item in SAMPLE2_ITEMS" :key="item.menuId" type="button"
        @click.stop="handleSelectAction('nav-select-menu', item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId, 'sidebar-link-not-loaded': !fnIsLoaded(item.menuId)}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:0.9rem;flex-shrink:0;">📄</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;font-size:0.85rem;">{{ item.menuNm }}</span>
      </button>
    </template>

    <!-- ===== □.□. 조건부 영역 ================================================ -->
    <!-- ===== ■.■. 샘플 전시 (토글) ============================================ -->
    <div v-if="appSidebarOpen" style="padding:12px 8px 0;">
      <button type="button" @click.stop="handleBtnAction('nav-toggle-dispUi')"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;background:none;border:none;cursor:pointer;font-size:0.65rem;font-weight:700;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">
        <span>샘플 전시</span>
        <span style="font-size:0.6rem;">{{ uiState.dispUiOpen ? '▲' : '▼' }}</span>
      </button>
    </div>
    <template v-if="uiState.dispUiOpen">
      <button v-for="item in DISP_UI_ITEMS" :key="item.menuId" type="button"
        @click.stop="handleSelectAction('nav-select-menu', item.menuId)"
        class="sidebar-link" :class="{active: page === item.menuId, 'sidebar-link-not-loaded': !fnIsLoaded(item.menuId)}"
        :data-tip="item.menuNm" :aria-label="item.menuNm">
        <span class="sidebar-link-icon" style="font-size:1rem;flex-shrink:0;">🖼</span>
        <span v-if="appSidebarOpen" style="flex:1;overflow:hidden;text-overflow:ellipsis;">{{ item.menuNm }}</span>
      </button>
    </template>
    </template>  <!-- /showSamples -->

    <div style="flex:1;"></div>
    <button type="button" @click.stop="handleBtnAction('sidebar-toggle')"
      style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:8px;background:none;border:1px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:0.75rem;transition:all 0.2s;"
      class="hidden-sm sidebar-collapse-toggle"
      :title="!appMobileOpen ? (appSidebarOpen ? '사이드바 접기' : '사이드바 펼치기') : ''"
      :aria-label="appSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'">
      <span>{{ appSidebarOpen ? '◀' : '▶' }}</span>
      <span v-if="appSidebarOpen">접기</span>
    </button>
  </div>
</div>

    <!-- ===== □.□. 샘플 전시 (토글) ============================================ -->
  <!-- ===== □. 영역 ====================================================== -->`,
};
