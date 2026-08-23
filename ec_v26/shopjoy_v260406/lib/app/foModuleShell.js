/**
 * foModuleShell.js — 독립 FO 모듈(자체 HTML 진입점)용 공용 앱 셸.
 *
 * "FO 업무 성격은 가급적 독립적으로 만든다"는 방침에 따라, index.html 의 라우팅에 얹지 않고
 * 코바늘(mdCbCobanul.html)처럼 자기 HTML 진입점을 갖는 FO 모듈이 늘어날 예정이다. 그런 모듈도
 * ShopJoy 공통 헤더/사이드바/푸터(같은 FoAppHeader/FoAppSidebar/FoAppFooter 컴포넌트)를 그대로
 * 쓰도록, foAppBase.js 가 index.html 안에서 직접 만들던 테마/로그인/장바구니뱃지/사이드바 상태를
 * 이 파일 하나로 뽑아 재사용한다 — 새 모듈은 이 파일 + 자기 콘텐츠 컴포넌트만 있으면 된다.
 *
 * 선행 로드: Vue, Pinia, coUtil.js, foApiAxios.js, foAppConfig.js, Pinia 스토어(foAuthStore 등),
 *            foAppAuth.js(window.foAuth) — index.html 의 B2~B3 스크립트 블록과 동일 순서.
 *
 * 사용법 (모듈의 부트스트랩 스크립트에서):
 *   const pinia = Pinia.createPinia();
 *   window.foAuth.init(pinia);
 *   const app = Vue.createApp({ ... });
 *   app.use(pinia);
 *   const shell = window.foModuleShell.create();
 *   // template 에서 shell.* 를 fo-app-header/fo-app-sidebar/fo-app-footer 에 그대로 물린다.
 */
(function () {
  function create() {
    const { ref, reactive, computed, watch } = Vue;

    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modu-fo-sy-theme') || 'light');
    const applyTheme = (t) => {
      theme.value = t;
      localStorage.setItem('modu-fo-sy-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Sidebar / Mobile menu ── */
    const sidebarOpen = ref(true);
    const uiState = reactive({ mobileOpen: false, showLogin: false });
    const closeMobileMenu = () => { uiState.mobileOpen = false; document.body.style.overflow = ''; };
    const toggleMobileMenu = () => {
      uiState.mobileOpen = !uiState.mobileOpen;
      document.body.style.overflow = uiState.mobileOpen ? 'hidden' : '';
    };
    const cfShowSidebar = computed(() => true); // 모듈은 라우팅이 없어 항상 노출

    /* ── API 로그 / 토스트 설정 패널 (전체 기능 대신 껍데기만 — 헤더 드롭다운이 크래시 없이 뜨는 정도) ── */
    const foApiLogs = reactive([]);
    const showApiLog = ref(false);
    const showSettings = ref(false);
    const apiToastEnabled = ref(false);
    const onToggleApiLog = () => { showApiLog.value = !showApiLog.value; showSettings.value = false; };
    const onToggleApiToast = () => { apiToastEnabled.value = !apiToastEnabled.value; };

    /* ── Toast (간이 버전 — foAppBase.js 의 확장형 스택 대신 단순 코너 알림) ── */
    const toasts = reactive([]);
    let _toastSeq = 1;
    const showToast = (msg, type = 'info', duration = 3500) => {
      const id = _toastSeq++;
      toasts.push({ id, msg, type });
      if (duration > 0) setTimeout(() => { const i = toasts.findIndex((t) => t.id === id); if (i >= 0) toasts.splice(i, 1); }, duration);
    };

    /* ── Auth ── */
    const auth = window.foAuth.state;
    const onShowLogin = () => { uiState.showLogin = true; };
    const onLogout = () => { window.foAuth.logout(); showToast('로그아웃되었습니다.', 'info'); };

    /* ── 장바구니/찜 뱃지 — index.html 이 쓰는 것과 같은 localStorage 키를 읽기만 한다
       (이 모듈이 직접 담거나 찜하지 않으므로 쓰기는 없음. 다른 탭에서 바뀌면 storage 이벤트로 갱신) */
    const cfCartCount = ref(0);
    const cfLikeCount = ref(0);
    const refreshBadgeCounts = () => {
      try { const c = JSON.parse(localStorage.getItem('modu-fo-od-cart') || '[]'); cfCartCount.value = c.reduce((s, i) => s + (i.qty || 0), 0); } catch (e) { cfCartCount.value = 0; }
      try { const l = JSON.parse(localStorage.getItem('modu-fo-pd-like') || '[]'); cfLikeCount.value = l.length; } catch (e) { cfLikeCount.value = 0; }
    };
    refreshBadgeCounts();
    window.addEventListener('storage', refreshBadgeCounts);
    window.addEventListener('focus', refreshBadgeCounts);

    /* ── 헤더가 옵셔널 체이닝으로 참조하는 전역(window.foApp) — 없어도 안전하지만 있으면 공유/PDF 등이 동작 */
    if (!window.foApp) window.foApp = {};
    window.foApp.showToast = showToast;
    if (!window.foApp.compareList) window.foApp.compareList = [];

    /* ── Config / Navigate — 모듈은 자체 라우팅이 없어 다른 메뉴 클릭 시 index.html 로 이동 */
    const config = window.SITE_CONFIG || {};
    const navigate = (pageId) => { location.href = 'index.html#page=' + pageId; };

    return {
      theme, toggleTheme,
      sidebarOpen, uiState, closeMobileMenu, toggleMobileMenu, cfShowSidebar,
      foApiLogs, showApiLog, showSettings, apiToastEnabled, onToggleApiLog, onToggleApiToast,
      toasts, showToast,
      auth, onShowLogin, onLogout,
      cfCartCount, cfLikeCount,
      config, navigate,
    };
  }

  window.foModuleShell = { create };
})();
