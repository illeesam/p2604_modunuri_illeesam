/* foMfeShell.js — FO(사용자 페이스) 마이크로프론트엔드 데모의 메인프레임.
 *
 * shopjoy_v260406/lib/app/foAppBase.js 를 기반으로 한다 — BO 쪽 mfeShell.js 와 달리
 * "새로 작성"이 아니라 "거의 그대로 재사용 + 페이지 해석 부분만 교체"인 이유: FO는
 * 대메뉴/탭 같은 게 없고 장바구니·좋아요·비교함·토스트·API 로그 패널·테마·모바일
 * 메뉴 같은 진짜 화면 상태(state)가 훨씬 많다. 그 상태 로직 자체는 도메인이 아니라
 * "셸"의 책임이라 원본 그대로 옮기는 게 맞고, 실제로 바뀐 곳은 두 군데뿐이다:
 *
 *   1) 페이지 컴포넌트 해석 — 원본은 index.html이 pages/fo/* 를 전부 <script> 로
 *      미리 불러온 뒤 `window['Home'+N]`/`<cart>`/`<contact>`/... 로 직접 참조했다.
 *      여기서는 window.FO_MFE_REGISTRY.getPage(pageId) 로 "로드된 페이지가 있으면"
 *      가져오는 방식으로 바꿨다 — 도메인 폴더(fo-ap-home/, fo-ec-pd/, fo-ec-od/, fo-ec-my/,
 *      fo-ec-cm/, fo-zd/)가 자기 페이지들을 이 레지스트리에 스스로 register() 한다.
 *   2) navigate() 가 async 로 바뀌었다 — 페이지 전환 시 그 페이지가 아직 로드 전이면
 *      window.FO_MFE_REGISTRY.ensurePageLoaded(pageId) 로 그 폴더 하나만 그때 지연로드한다
 *      (BO의 ensureFolderLoaded와 동일 개념). 로딩 중엔 기존 API 로딩 오버레이
 *      (window._showProgress)를 재사용한다 — 새 UI를 안 만들어도 됐다.
 *
 * 라우팅은 원본과 동일하게 `?page=xxx` 쿼리스트링이다(2026-08-22 해시(#page=)에서
 * 전환된 게 지금 기준 — 이 데모도 그 최신 방식을 그대로 따른다). 에러 페이지(401/404/500)
 * 와 로그인 모달은 지연로드 대상이 아니라 셸 자체가 항상 들고 있다(BO의 boError401 등과
 * 동일한 취급 — 어디서든 즉시 떠야 하는 화면이라 지연로드하면 안 된다).
 *
 * FO 페이지 파일도 BO와 동일하게 `export default`(ES 모듈) 방식이다(2026-08-29 통일 —
 * 처음엔 "FO 도메인들은 서로 이름이 하나도 안 겹쳐서(Home01/Cart/Order/About/...) BO에서
 * ES 모듈 전환의 계기가 됐던 '같은 이름을 여러 폴더가 나눠 쓰다 충돌' 문제가 애초에 없다"고
 * 보고 classic `window.ComponentName` 방식을 유지했었지만, 프로젝트 전체 일관성을 위해
 * BO와 같은 방식으로 다시 통일했다). 각 도메인의 manifest.js 는 `R.loadModule()`로 불러온
 * 모듈 네임스페이스에서 `.default` 를 꺼내 `R.register([{id, comp: m.default}, ...])`
 * 로 넘긴다. */
(function () {
  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

  const pinia = Pinia.createPinia();
  window.foAuth.init(pinia);

  const app = createApp({
  setup() {
    /* foInitReady: 초기화 완료 전 컴포넌트 API 호출을 막기 위한 플래그.
       원본과 다른 점: 이제 "인증 상태 복원"뿐 아니라 "URL이 가리키는 초기 페이지의
       코드가 로드 완료"까지 기다린 뒤에 true 가 된다. 실제 async 작업(_bootInit)은
       `page`(URL state 섹션에서 선언·확정됨)보다 뒤에서 시작한다 — 여기서 바로
       시작하면 `page.value` 를 읽는 시점에 `page` const 가 아직 초기화 전이라
       ReferenceError(TDZ)가 난다(2026-08-29 발견 — 콘솔에 "Cannot access 'page'
       before initialization"로 재현됐던 버그, 원인: 이 IIFE 안의 await 가 전부
       동기적으로 즉시 완료되는 경로(토큰 없음)에서는 `await` 표현식 자체를 평가하는
       시점에 인자(`page.value`)가 먼저 계산되는데, 그게 `const page = ref(...)`
       선언보다 코드상 앞이라 아직 실행 전이었다). */
    const foInitReady = ref(false);
    window.foInitReady = false;

    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modu-fo-sy-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('modu-fo-sy-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const errorMessage = ref('');

    /* FO_PAGE_LABELS — 브라우저 탭 타이틀에 쓸 페이지별 한글 라벨(신규, 2026-08-29).
       원본 foAppBase.js는 상품상세/이벤트상세 등 "opt-in"한 화면만 foUtil.fofSetPageMeta()
       로 자기 타이틀(상품명 등)을 설정하고, 나머지 화면은 전부 사이트 공통 타이틀로
       남겨뒀다. 이 데모는 "모든 화면에서 지금 보고 있는 화면이 타이틀에 보이면 좋겠다"는
       요청에 맞춰 그 나머지 화면들도 전부 커버하는 기본 라벨을 추가했다 — BO 쪽
       mfeShell.js가 `{tab.label} - ShopJoy BO`를 쓰는 것과 같은 형식(`{label} - ShopJoy`)
       이다. 상품상세/이벤트상세처럼 이미 자체적으로 더 구체적인 타이틀(상품명 등)을
       설정하는 화면은 그 화면이 마운트된 뒤 자기 값으로 다시 덮어써서 최종적으로는
       원본과 동일하게 동작한다 — 이 라벨은 그 전까지(또는 그런 로직이 없는 화면 전체에)
       쓰이는 기본값이다. */
    const FO_PAGE_LABELS = {
      home: '홈', prodList: '상품목록', prodView: '상품상세',
      cart: '장바구니', order: '주문/결제',
      myOrder: '주문내역', myClaim: '취소/반품/교환', myCoupon: '쿠폰함',
      myCache: '적립금/예치금', myContact: '1:1문의', myChatt: '채팅상담',
      about: '회사소개', contact: '문의하기', faq: '자주묻는질문',
      blog: '블로그', blogView: '블로그 상세', blogEdit: '블로그 작성',
      event: '이벤트', eventView: '이벤트 상세',
      like: '찜한상품', location: '매장위치',
      dispUi01: '전시UI 샘플1', dispUi02: '전시UI 샘플2', dispUi03: '전시UI 샘플3',
      dispUi04: '전시UI 샘플4', dispUi05: '전시UI 샘플5', dispUi06: '전시UI 샘플6',
      sample01: '샘플01', sample02: '샘플02', sample03: '샘플03', sample04: '샘플04',
      sample05: '샘플05', sample06: '샘플06', sample07: '샘플07',
      sample11: '샘플11', sample12: '샘플12', sample13: '샘플13', sample14: '샘플14',
      sample21: '샘플21', sample22: '샘플22', sample23: '샘플23',
      xsStore: '스토어 개발도구', xsLocalStorage: '로컬스토리지 개발도구',
      error401: '인증 오류', error404: '페이지 없음', error500: '서버 오류',
      notFound: '페이지 없음',
    };
    watch(page, (id) => {
      foUtil.fofResetPageMeta();
      document.title = (FO_PAGE_LABELS[id] || 'ShopJoy') + ' - ShopJoy';
    }, { immediate: true });

    const _fmtXHeaders = window.foAppFunc.fmtXHeaders;

    window.addEventListener('api-response-success', (ev) => {
      if (!apiToastEnabled.value) { return; }
      const d = ev.detail || {};
      showToast(`${d.method} ${d.url} ${d.status}`, 'info', 10000, d.detail || '');
    });

    window.addEventListener('api-response-error', (ev) => {
      const d = ev.detail || {};
      const st = d.status;
      let label = '';
      if (d.method && d.url) {
        label = `${d.method} ${d.url} ${st}`;
        if (d.uiLabel) label += ` :: ${d.uiLabel}`;
      }
      let msg = label ? `${label}\n${d.message || ''}` : (d.message || '');
      if (st === 0 || st >= 400) {
        try { window.foNotiStore?.fnAddError?.(d); } catch (_) {}
      }
      if (st !== 401 && !(st >= 500 || st === 0)) {
        let details = d.errorDetails || '';
        const reqFmt = _fmtXHeaders(d.reqHeaders);
        const resFmt = _fmtXHeaders(d.resHeaders);
        if (reqFmt || resFmt) {
          let headerInfo = '';
          const _nd = new Date(); const _nts = _nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0')+' '+String(_nd.getHours()).padStart(2,'0')+':'+String(_nd.getMinutes()).padStart(2,'0')+':'+String(_nd.getSeconds()).padStart(2,'0');
          if (reqFmt) headerInfo += '━━ 요청 헤더 ━━  ' + _nts + '\n' + reqFmt;
          if (resFmt) headerInfo += (headerInfo ? '\n\n' : '') + '━━ 응답 헤더 ━━\n' + resFmt;
          details = details ? headerInfo + '\n\n' + details : headerInfo;
        }
        showToast(msg, 'error', 0, details);
        return;
      }
      if (st === 401) {
        errorMessage.value = msg;
        page.value = 'error401';
        try { window.history.replaceState(null, '', window.location.pathname + '?page=error401'); } catch (_) {}
      }
      else if (st >= 500 || st === 0) {
        errorMessage.value = msg;
        page.value = 'error500';
        try { window.history.replaceState(null, '', window.location.pathname + '?page=error500'); } catch (_) {}
      }
    });
    const sidebarOpen = ref(true);
    const uiState = reactive({ mobileOpen: false, showLogin: false });
    let replaceNextHash = false;

    const closeMobileMenu = () => { uiState.mobileOpen = false; };
    const toggleMobileMenu = () => {
      if (uiState.mobileOpen) { closeMobileMenu(); return; }
      uiState.mobileOpen = true;
    };

    /* ── 바로구매(order) 파라미터 ── */
    const instantOrder = ref(null);
    const cartIds = reactive([]);
    const viewEditId = ref(null);
    const _instantOrderToParams = (io) => {
      const p = { prodId: io.prod?.prodId, qty: io.qty };
      if (io.color?.name) p.opt1Nm = io.color.name;
      if (io.size) p.opt2Id = io.size;
      return p;
    };
    const _instantOrderFromParams = (params) => {
      const prodId = params.get('prodId') || '';
      if (!prodId || !Array.isArray(prods)) return null;
      const prod = prods.find(p => String(p.prodId) === prodId);
      if (!prod) return null;
      const opt1Nm = params.get('opt1Nm') || '';
      const color  = Array.isArray(prod.opt1s) ? prod.opt1s.find(c => c.name === opt1Nm) || null : null;
      const size   = params.get('opt2Id') || null;
      const qty    = Math.max(1, Number(params.get('qty')) || 1);
      return { prod, color, size, qty };
    };

    /* ── _activatePage — 페이지 지연로드 + 전환 (신규, foMfeShell 전용) ──
       그 페이지 코드가 이미 로드돼 있으면 즉시 page.value 만 바꾸고, 아직이면
       window._showProgress(기존 API 로딩 오버레이 재사용)로 로딩 표시하며 그 폴더
       하나만 불러온 뒤 전환한다. */
    const _activatePage = async (id) => {
      if (!window.FO_MFE_REGISTRY.getPage(id)) {
        window._showProgress?.(true, '페이지를 불러오는 중...');
        try {
          await window.FO_MFE_REGISTRY.ensurePageLoaded(id);
        } catch (e) {
          window._showProgress?.(false);
          showToast('페이지를 불러오지 못했습니다: ' + (e?.message || e), 'error', 0);
          return false;
        }
        window._showProgress?.(false);
      }
      page.value = id;
      return true;
    };

    /* navigate — async 로 전환(원본은 동기). await 하지 않고 호출해도(대부분의 템플릿
       @click="navigate(...)" 이 그렇다) 무해하다 — fire-and-forget. */
    const navigate = async (id, opts = {}) => {
      if (opts && opts.replace) replaceNextHash = true;
      if (opts && opts.instantOrder !== undefined) instantOrder.value = opts.instantOrder;
      else if (id !== 'order') instantOrder.value = null;
      if (opts && opts.cartIds !== undefined) {
        cartIds.splice(0, cartIds.length, ...(Array.isArray(opts.cartIds) ? opts.cartIds : []));
      } else if (id !== 'order') {
        cartIds.splice(0, cartIds.length);
      }
      if (opts && opts.dtlId !== undefined) viewEditId.value = opts.dtlId;
      else if (opts && opts.eventId !== undefined) viewEditId.value = opts.eventId;
      else viewEditId.value = null;
      if (uiState.mobileOpen) uiState.mobileOpen = false;
      if (!fnCanEnterPage(id)) { return; }   // 마이페이지는 로그인 필요
      const ok = await _activatePage(id);
      if (!ok) return;
      window.scrollTo(0, 0);
      try { document.querySelector('.layout-main')?.scrollTo(0, 0); } catch (e) {}
    };
    window.addEventListener('resize', () => { if (window.innerWidth < 1024) uiState.mobileOpen = false; });

    /* ── FO API Log ── */
    const MAX_FO_API_LOGS = 15;
    const foApiLogs = reactive(JSON.parse(localStorage.getItem('modu-fo-sy-apiLog') || '[]'));
    const showApiLog = ref(localStorage.getItem('modu-fo-sy-apiLogOpen') === 'true');
    watch(showApiLog, (v) => { try { localStorage.setItem('modu-fo-sy-apiLogOpen', v ? 'true' : 'false'); } catch (e) {} });
    const apiToastEnabled = ref(localStorage.getItem('modu-fo-sy-apiToastOpen') === 'true');
    watch(apiToastEnabled, (v) => { try { localStorage.setItem('modu-fo-sy-apiToastOpen', v ? 'true' : 'false'); } catch (e) {} });
    const showSettings = ref(false);
    const apiLogHoverDetail  = ref(null);
    const apiLogDock = ref(localStorage.getItem('modu-fo-sy-apiLogDock') === 'true');
    watch(apiLogDock, (v) => { try { localStorage.setItem('modu-fo-sy-apiLogDock', v ? 'true' : 'false'); } catch (e) {} });
    let _foApiLogSeq = foApiLogs.length ? Math.max(...foApiLogs.map(l => l._seq || 0)) + 1 : 1;

    const addFoApiLog = (detail) => {
      const now = new Date();
      const ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')
        + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
      const entry = { _seq: _foApiLogSeq++, ts, ...detail };
      foApiLogs.unshift(entry);
      if (foApiLogs.length > MAX_FO_API_LOGS) foApiLogs.splice(MAX_FO_API_LOGS);
      try {
        const slim = foApiLogs.map(({ data, reqData, ...rest }) => rest);
        localStorage.setItem('modu-fo-sy-apiLog', JSON.stringify(slim));
      } catch (e) {}
    };
    const clearFoApiLogs = () => {
      foApiLogs.splice(0, foApiLogs.length);
      apiLogHoverDetail.value = null;
      try { localStorage.removeItem('modu-fo-sy-apiLog'); } catch(e) {}
    };
    const foApiLogStatusClass = window.foAppFunc.logStatusClass;
    const fnFoApiLogRecent    = window.foAppFunc.logIsRecent;
    const fnFmtSec            = window.foAppFunc.fmtSec;
    const foApiLogMethodStyle = window.foAppFunc.logMethodStyle;

    let _foApiLogCloseTimer = null;
    const onFoApiLogEnter = (log) => {
      if (_foApiLogCloseTimer) { clearTimeout(_foApiLogCloseTimer); _foApiLogCloseTimer = null; }
      apiLogHoverDetail.value = log;
    };
    const onFoApiLogLeave = () => {
      if (_foApiLogCloseTimer) { clearTimeout(_foApiLogCloseTimer); }
      _foApiLogCloseTimer = setTimeout(() => { apiLogHoverDetail.value = null; _foApiLogCloseTimer = null; }, 200);
    };
    const onFoApiLogDetailEnter = () => {
      if (_foApiLogCloseTimer) { clearTimeout(_foApiLogCloseTimer); _foApiLogCloseTimer = null; }
    };
    const onFoApiLogToggleDock = () => { apiLogDock.value = !apiLogDock.value; };
    const cfApiLogDockPad = computed(() => (showApiLog.value && apiLogDock.value) ? '280px' : '0px');
    const formatJsonData = window.foAppFunc.fmtJson;
    const fnFoApiLogIndex = (log) => {
      const i = foApiLogs.findIndex(l => l === log);
      return i >= 0 ? (foApiLogs.length - i) : '-';
    };
    const fnFoApiLogBadgeStyle = window.foAppFunc.logBadgeStyle;

    window.addEventListener('api-response-success', (ev) => { addFoApiLog(ev.detail || {}); });
    window.addEventListener('api-response-error', (ev) => { addFoApiLog({ ...(ev.detail || {}), _isErr: true }); });
    document.addEventListener('pointerdown', (e) => {
      if (!showSettings.value) return;
      if (!e.target.closest('[data-fo-settings]')) showSettings.value = false;
    }, true);

    /* ── Toast ── */
    const toasts = reactive([]);
    let _toastSeq = 0;
    const toastShowDetail = ref(localStorage.getItem('modu-fo-sy-toast-isShowDetail') !== 'false');
    const showToast = (msg, type = 'success', duration = 0, detail = '', action = null) => {
      let msgTitle = msg;
      let msgDetail = '';
      if (msg && msg.includes('\n')) {
        const parts = msg.split('\n');
        msgDetail = parts[0];
        msgTitle  = parts.slice(1).join('\n');
      }
      const id = ++_toastSeq;
      const autoDismiss = duration === 0
        ? (type === 'error' ? 0 : type === 'info' ? 3000 : 4000)
        : duration;
      const expanded = !!(detail) && toastShowDetail.value;
      const t = { id, msg, msgTitle, msgDetail, type, detail, action, expanded, persistent: autoDismiss === 0, duration: autoDismiss };
      toasts.push(t);
      if (autoDismiss > 0) setTimeout(() => removeToast(id), autoDismiss);
    };
    const onToastAction = (t) => { if (t.action && typeof t.action.onClick === 'function') t.action.onClick(); };
    const removeToast     = (id) => { const i = toasts.findIndex(t => t.id === id); if (i !== -1) toasts.splice(i, 1); };
    const removeAllToasts = () => { toasts.splice(0, toasts.length); };
    const toggleAllToastDetail = () => {
      toastShowDetail.value = !toastShowDetail.value;
      localStorage.setItem('modu-fo-sy-toast-isShowDetail', toastShowDetail.value);
      toasts.forEach(t => { if (t.detail) t.expanded = toastShowDetail.value; });
    };
    const toggleToastDetail = (t) => { t.expanded = !t.expanded; };
    const toast = { show: false };

    /* ── API Progress Bar ── */
    const isApiLoading = ref(false);
    const apiProgressLabel = ref('조회중입니다...');
    let _apiLoadingCount = 0;
    let _progressHideTimer = null;
    let _progressShowAt = 0;
    const MIN_SHOW_MS = 300;
    const HIDE_DELAY_MS = 50;
    window._showProgress = (show, label) => {
      if (show && label) { apiProgressLabel.value = label; }
      _apiLoadingCount = Math.max(0, _apiLoadingCount + (show ? 1 : -1));
      if (_apiLoadingCount > 0) {
        if (_progressHideTimer) { clearTimeout(_progressHideTimer); _progressHideTimer = null; }
        if (!isApiLoading.value) _progressShowAt = Date.now();
        isApiLoading.value = true;
      } else {
        const elapsed = Date.now() - _progressShowAt;
        const remain = Math.max(0, MIN_SHOW_MS - elapsed) + HIDE_DELAY_MS;
        if (_progressHideTimer) clearTimeout(_progressHideTimer);
        _progressHideTimer = setTimeout(() => { isApiLoading.value = false; _progressHideTimer = null; }, remain);
      }
    };

    /* ── Alert / Confirm ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Prods ── */
    const _assignImg = (p) => coUtil.cofAssignProdImage(p);
    const _initFallback = window.SITE_CONFIG?.prods || [];
    _initFallback.forEach(_assignImg);
    const prods = reactive([..._initFallback]);
    const selectedProd = ref(_initFallback.length > 0 ? _initFallback[0] : null);
    const selectProd = p => { selectedProd.value = p; navigate('prodView'); };

    const openNewWindow = (pageId, id) => {
      const params = new URLSearchParams();
      params.set('page', pageId);
      if (id != null) {
        if (pageId === 'prodView') params.set('prodid', id);
        else if (pageId === 'eventView') params.set('eventId', id);
        else if (pageId === 'blogView' || pageId === 'blogEdit') params.set('dtlId', id);
      }
      window.open(window.location.pathname + '?' + params.toString(), '_blank');
    };

    /* ── Likes ── */
    const likes = reactive(new Set());
    try {
      const savedLikes = localStorage.getItem('modu-fo-pd-like');
      const arr = savedLikes ? JSON.parse(savedLikes) : null;
      if (Array.isArray(arr)) arr.forEach(v => likes.add(v));
    } catch (e) {}
    const saveLikes = () => { try { localStorage.setItem('modu-fo-pd-like', JSON.stringify([...likes])); } catch (e) {} };
    const toggleLike = (prodId) => { if (likes.has(prodId)) likes.delete(prodId); else likes.add(prodId); saveLikes(); };
    const isLiked = (prodId) => likes.has(prodId);
    const cfLikeCount = computed(() => likes.size);

    /* ── Compare ── */
    const compareList = reactive([]);
    const MAX_COMPARE = 4;
    try {
      const savedCompare = localStorage.getItem('modu-fo-pd-compare');
      const cArr = savedCompare ? JSON.parse(savedCompare) : null;
      if (Array.isArray(cArr)) cArr.forEach(v => compareList.push(v));
    } catch (e) {}
    const saveCompare = () => { try { localStorage.setItem('modu-fo-pd-compare', JSON.stringify(compareList)); } catch (e) {} };
    const isCompared = (prodId) => compareList.some(p => p.prodId === prodId);
    const toggleCompare = (prod) => {
      if (!prod || !prod.prodId) return false;
      const idx = compareList.findIndex(p => p.prodId === prod.prodId);
      if (idx >= 0) { compareList.splice(idx, 1); saveCompare(); return true; }
      if (compareList.length >= MAX_COMPARE) {
        showToast(`상품 비교는 최대 ${MAX_COMPARE}개까지 가능합니다.`, 'error');
        return false;
      }
      compareList.push(prod);
      saveCompare();
      return true;
    };
    const clearCompare = () => { compareList.splice(0, compareList.length); saveCompare(); };
    const cfCompareCount = computed(() => compareList.length);

    /* ── Cart ── */
    const cart = reactive([]);
    const genId = () => coUtil.cofGenId();
    const _restoreAfterProds = () => {
      try {
        const saved = localStorage.getItem('modu-fo-od-cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const p = prods.find(x => x.prodId === item.prodId);
              if (p && item.color && item.size && Array.isArray(p.opt1s)) {
                const color = p.opt1s.find(c => c.name === item.color.name) || item.color;
                cart.push({ cartId: item.cartId || genId(), prod: p, color, size: item.size, qty: item.qty || 1 });
              }
            });
          }
        }
      } catch (e) {}
      try {
        const rawQuery = String(window.location.search || '').replace(/^\?/, '');
        if (rawQuery.includes('page=')) {
          const hpid = new URLSearchParams(rawQuery).get('prodid') || '';
          if (hpid) {
            const f = prods.find(x => String(x.prodId) === hpid);
            if (f) selectedProd.value = f;
          }
        }
      } catch (e) {}
      if (!selectedProd.value && prods.length > 0) selectedProd.value = prods[0];
    };
    const handleFetchProds = async () => {
      try {
        const res = await foApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 200 }, '상품', '목록조회');
        const list = res.data?.data?.pageList || [];
        list.forEach(_assignImg);
        prods.splice(0, prods.length, ...list);
      } catch (e) {}
      _restoreAfterProds();
    };
    onMounted(() => { handleFetchProds(); });

    const saveCart = () => {
      try {
        localStorage.setItem('modu-fo-od-cart', JSON.stringify(
          cart.map(i => ({ cartId: i.cartId, prodId: i.prod.prodId, color: i.color, size: i.size, qty: i.qty }))
        ));
      } catch (e) {}
    };
    const cfCartCount = computed(() => cart.reduce((s, i) => s + i.qty, 0));
    const addToCart = (prod, color, size, qty = 1) => {
      const c = color || { name: '기본' };
      const s = size || 'FREE';
      const existing = cart.find(i => i.prod.prodId === prod.prodId && i.color.name === c.name && i.size === s);
      if (existing) { existing.qty += qty; } else { cart.push({ cartId: genId(), prod, color: c, size: s, qty }); }
      saveCart();
      showToast(`장바구니에 담았습니다! (${c.name} / ${s})`, 'success');
    };
    const removeFromCart = idx => { cart.splice(idx, 1); saveCart(); };
    const updateCartQty = (idx, delta) => {
      const item = cart[idx];
      if (!item) return;
      const newQty = item.qty + delta;
      if (newQty <= 0) { cart.splice(idx, 1); } else { item.qty = newQty; }
      saveCart();
    };
    const clearCart = () => { cart.splice(0, cart.length); saveCart(); };

    /* ── Auth ── */
    const auth = window.foAuth.state;
    const onShowLogin = () => { uiState.showLogin = true; };
    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const fnCanEnterPage = (p) => {
      if (!MY_PAGES.includes(p)) { return true; }
      if (window.foAuth?.isLoggedIn ? window.foAuth.isLoggedIn()
                                    : !!localStorage.getItem('modu-fo-auth-accessToken')) { return true; }
      showToast('로그인이 필요합니다.', 'error');
      uiState.showLogin = true;
      return false;
    };
    const onLogout = () => {
      window.foAuth.logout();
      showToast('로그아웃되었습니다.', 'info');
      if (MY_PAGES.includes(page.value)) navigate('home');
    };
    watch(() => auth.user?.authId || '', authId => {
      if (!authId && MY_PAGES.includes(page.value) && page.value !== 'home') navigate('home');
    });

    /* ── URL state ── */
    let restoring = true;
    const validPages = ['home', 'prodList', 'prodView', 'cart', 'order', 'contact', 'faq',
      'event', 'eventView', 'blog', 'blogView', 'blogEdit', 'like',
      'location', 'about',
      'myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt',
      'dispUi01', 'dispUi02', 'dispUi03', 'dispUi04', 'dispUi05', 'dispUi06',
      'sample01','sample02','sample03','sample04','sample05','sample06','sample07',
      'sample11','sample12','sample13','sample14',
      'sample21','sample22','sample23',
      'xsStore', 'xsLocalStorage',
      'error401','error404','error500'];
    try {
      const rawQuery = String(window.location.search || '').replace(/^\?/, '');
      const hasPageParam = rawQuery.includes('page=');
      const params = hasPageParam ? new URLSearchParams(rawQuery) : null;

      if (hasPageParam) {
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage) && fnCanEnterPage(hPage)) page.value = hPage;
        else if (hPage && !validPages.includes(hPage)) page.value = 'notFound';
      }
      if (page.value === 'order' && hasPageParam) {
        instantOrder.value = _instantOrderFromParams(params);
        const cids = params.get('cartIds');
        if (cids) cartIds.splice(0, cartIds.length, ...cids.split(',').filter(Boolean));
      }
      if (hasPageParam) {
        const hEventId = params.get('eventId');
        const hEditId  = params.get('dtlId');
        if (hEventId) viewEditId.value = Number(hEventId) || hEventId;
        else if (hEditId) viewEditId.value = Number(hEditId) || hEditId;
      }
    } catch(e) {}
    restoring = false;

    let syncingFromUrl = false;
    const onAppPopState = () => {
      if (syncingFromUrl) return;
      syncingFromUrl = true;
      try {
        const rawQuery = String(window.location.search || '').replace(/^\?/, '');
        const params = new URLSearchParams(rawQuery);
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage) && page.value !== hPage && fnCanEnterPage(hPage)) {
          _activatePage(hPage); // 지연로드 필요할 수 있음 — fire-and-forget
        }
        else if (hPage && !validPages.includes(hPage) && page.value !== 'notFound') page.value = 'notFound';
        if (hPage === 'order') {
          instantOrder.value = _instantOrderFromParams(params);
          const cids = params.get('cartIds');
          const newCids = cids ? cids.split(',').filter(Boolean) : [];
          const same = newCids.length === cartIds.length && newCids.every((v, i) => v === cartIds[i]);
          if (!same) cartIds.splice(0, cartIds.length, ...newCids);
        } else if (hPage && hPage !== 'order') {
          if (instantOrder.value !== null) instantOrder.value = null;
          if (cartIds.length) cartIds.splice(0, cartIds.length);
        }
        const hpid = params.get('prodid') || '';
        if (hpid) {
          const f = prods.find(x => String(x.prodId) === hpid);
          if (f && selectedProd.value !== f) selectedProd.value = f;
        }
        const hEventId = params.get('eventId');
        const hEditId  = params.get('dtlId');
        const newViewId = hEventId ? (Number(hEventId) || hEventId)
                        : hEditId  ? (Number(hEditId)  || hEditId)
                        : viewEditId.value;
        if (newViewId !== viewEditId.value) viewEditId.value = newViewId;
      } catch(e) {}
      setTimeout(() => { syncingFromUrl = false; }, 0);
    };
    window.addEventListener('popstate', onAppPopState);

    watch(page, id => {
      if (restoring || syncingFromUrl) return;
      const params = new URLSearchParams();
      params.set('page', page.value);
      if (id === 'prodView') { params.set('prodid', selectedProd.value?.prodId ?? ''); }
      if (id === 'order' && instantOrder.value) {
        const io = _instantOrderToParams(instantOrder.value);
        Object.entries(io).forEach(([k, v]) => params.set(k, v));
      }
      if (id === 'order' && cartIds.length) { params.set('cartIds', cartIds.join(',')); }
      if (id === 'eventView' && viewEditId.value != null) { params.set('eventId', viewEditId.value); }
      if ((id === 'blogView' || id === 'blogEdit') && viewEditId.value != null) { params.set('dtlId', viewEditId.value); }
      const query = params.toString();
      const url = window.location.pathname + '?' + query;
      const curQuery = String(window.location.search || '').replace(/^\?/, '');
      if (curQuery === query) return;
      if (replaceNextHash) {
        replaceNextHash = false;
        try { history.replaceState(null, '', url); } catch (e) {}
      } else {
        try { history.pushState(null, '', url); } catch (e) {}
      }
    });

    try {
      const raw = String(window.location.search || '').replace(/^\?/, '');
      if (!raw || !raw.includes('page=')) {
        const pr = new URLSearchParams();
        pr.set('page', page.value);
        if (page.value === 'prodView') pr.set('prodid', String(selectedProd.value?.prodId ?? ''));
        history.replaceState(null, '', window.location.pathname + '?' + pr.toString());
      }
    } catch (e) {}

    onBeforeUnmount(() => { window.removeEventListener('popstate', onAppPopState); });

    /* ── 부트 초기화(인증 상태 복원 + 초기 페이지 지연로드) ──
       `page`(바로 위 "URL state" 섹션에서 최종 확정됨)를 안전하게 참조할 수 있는
       지점부터 시작한다 — foInitReady 선언부 주석 참고. */
    (async () => {
      const _foAuthStore = window.useFoAuthStore?.();
      if (_foAuthStore?.svAccessToken) {
        try {
          await window.useFoAppInitStore?.()?.saFetchFoAppInitData?.();
        } catch (e) {
          if (e?.response?.status === 401) {
            console.warn('[foMfeShell] token invalid (401), reset session');
            _foAuthStore.saClearSession?.();
          } else {
            console.warn('[foMfeShell] saFetchFoAppInitData error:', e?.response?.status || e.message);
          }
        }
      } else {
        window.useFoAppInitStore?.()?.saRestoreFromStorage?.();
      }
      try {
        await window.FO_MFE_REGISTRY.ensurePageLoaded(page.value);
      } catch (e) {
        console.error('[foMfeShell] 초기 페이지 로드 실패:', page.value, e);
      }
      foInitReady.value = true;
      window.foInitReady = true;
    })();

    /* ── Loading done (부트 스피너 제거는 foInitReady 로 넘어간 뒤 — 아래 template 참고.
       여기서는 즉시 지워도 무방 — "초기화 중..." 안내가 그 자리를 대신한다) ── */
    const loadingEl = document.getElementById('_boot_loading') || document.getElementById('vue-app-loading');
    if (loadingEl) {
      loadingEl.classList.add('done');
      loadingEl.classList.add('vue-app-loading--done');
      setTimeout(() => { if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 350);
    }

    const SIDEBAR_HIDDEN_PAGES = new Set([
      'home', 'prodList', 'prodView', 'cart', 'order',
      'myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt',
      'event', 'eventView', 'blog', 'blogView', 'blogEdit',
    ]);
    const cfShowSidebar = computed(() => !SIDEBAR_HIDDEN_PAGES.has(page.value));

    /* ── 활성 페이지 컴포넌트 해석(신규) — 레지스트리에서 가져온다. 에러 페이지/알림/
       모달류는 셸이 직접 들고 있어 여기 대상이 아니다(아래 template 의 별도 분기). */
    const NO_PROP_PAGES = new Set([
      'dispUi01','dispUi02','dispUi03','dispUi04','dispUi05','dispUi06',
      'sample01','sample02','sample03','sample04','sample05','sample06','sample07',
      'sample11','sample12','sample13','sample14','sample21','sample22','sample23',
    ]);
    const fnActivePageComp = () => window.FO_MFE_REGISTRY.getPage(page.value);
    const fnActivePageProps = () => {
      const id = page.value;
      if (NO_PROP_PAGES.has(id)) return {};
      if (id === 'eventView' || id === 'blogView' || id === 'blogEdit') return { navigate, dtlId: viewEditId.value };
      if (id === 'xsStore' || id === 'xsLocalStorage') return { navigate, showToast };
      return { navigate };
    };

    window.foApp = {
      get cart()          { return cart; },
      get instantOrder()  { return instantOrder.value; },
      get cartIds()       { return cartIds; },
      get config()        { return window.SITE_CONFIG; },
      get prods()      { return prods; },
      get selectedProd() { return selectedProd.value; },
      get auth()          { return auth; },
      addToCart, removeFromCart, updateCartQty, clearCart,
      navigate, showToast, showAlert, showConfirm,
      toggleLike, isLiked, selectProd, openNewWindow,
      get compareList()   { return compareList; },
      toggleCompare, isCompared, clearCompare,
    };
    return {
      theme, toggleTheme,
      page, sidebarOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toasts, showToast, removeToast, removeAllToasts, toggleToastDetail, toggleAllToastDetail, toastShowDetail, toast, onToastAction,
      isApiLoading, apiProgressLabel,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      prods, selectedProd, selectProd, openNewWindow,
      cart, cfCartCount, addToCart, removeFromCart, updateCartQty, clearCart,
      likes, toggleLike, isLiked, cfLikeCount,
      compareList, toggleCompare, isCompared, clearCompare, cfCompareCount,
      instantOrder, cartIds, viewEditId,
      config: window.SITE_CONFIG,
      auth, uiState, onShowLogin, onLogout,
      foInitReady,
      fnActivePageComp, fnActivePageProps,
      foApiLogs, showApiLog, showSettings, apiLogHoverDetail,
      clearFoApiLogs, foApiLogStatusClass, foApiLogMethodStyle,
      onFoApiLogEnter, onFoApiLogLeave, onFoApiLogDetailEnter, formatJsonData, fnFoApiLogIndex, fnFoApiLogBadgeStyle, fnFoApiLogRecent, fnFmtSec,
      apiLogDock, onFoApiLogToggleDock, cfApiLogDockPad,
      apiToastEnabled,
      onToggleApiToast: () => { apiToastEnabled.value = !apiToastEnabled.value; },
      cfShowSidebar,
      onToggleApiLog: () => { showApiLog.value = !showApiLog.value; showSettings.value = false; },
      notFoundPageId: computed(() => {
        try { return new URLSearchParams(String(window.location.search || '').replace(/^\?/, '')).get('page') || ''; } catch(e) { return ''; }
      }),
      errorMessage,
      safe: window.safeUtil,
    };
  },

  template: /* html */ `
<div style="height:100%;min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);transition:padding-right .15s;" :style="{ paddingRight: cfApiLogDockPad }">

  <transition name="fo-dim">
    <div v-if="isApiLoading" style="position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.18);pointer-events:none;display:flex;align-items:center;justify-content:center;">
      <div style="background:rgba(255,255,255,0.97);border-radius:18px;padding:28px 40px;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;gap:18px;min-width:160px;">
        <div style="display:flex;align-items:center;gap:10px;height:36px;">
          <div class="fo-dot" style="animation-delay:0s;"></div>
          <div class="fo-dot" style="animation-delay:0.2s;"></div>
          <div class="fo-dot" style="animation-delay:0.4s;"></div>
          <div class="fo-dot" style="animation-delay:0.6s;"></div>
        </div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary,#666);letter-spacing:0.03em;">{{ apiProgressLabel }}</div>
      </div>
    </div>
  </transition>
  <div v-show="isApiLoading" style="position:fixed;top:0;left:0;right:0;height:3px;z-index:99999;overflow:hidden;">
    <div style="height:100%;background:linear-gradient(90deg,var(--accent,#c9a96e),#e74c3c,var(--accent,#c9a96e));background-size:200% 100%;animation:fo-progress-slide 1.2s linear infinite;"></div>
  </div>

  <fo-app-header
    :page="page" :theme="theme" :app-sidebar-open="sidebarOpen" :app-mobile-open="uiState.mobileOpen"
    :config="config" :navigate="navigate" :toggle-theme="toggleTheme" :app-cart-count="cfCartCount" :app-like-count="cfLikeCount"
    :app-auth="auth" :on-app-show-login="onShowLogin" :on-app-logout="onLogout"
    :app-show-settings="showSettings" :app-show-api-log="showApiLog"
    :app-api-logs="foApiLogs" :app-api-toast="apiToastEnabled"
    @modu-fo-toggle-sidebar="sidebarOpen=!sidebarOpen" @modu-fo-toggle-mobile="toggleMobileMenu"
    @modu-fo-toggle-settings="showSettings=!showSettings"
    @modu-fo-toggle-api-log="onToggleApiLog"
    @modu-fo-toggle-api-toast="onToggleApiToast"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <fo-app-sidebar
      v-show="cfShowSidebar || uiState.mobileOpen"
      :page="page" :app-sidebar-open="sidebarOpen" :app-mobile-open="uiState.mobileOpen"
      :config="config" :navigate="navigate" :app-cart-count="cfCartCount" :app-auth="auth"
      @modu-fo-toggle-sidebar="sidebarOpen=!sidebarOpen" @modu-fo-close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: uiState.mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <div v-if="!foInitReady" style="display:flex;align-items:center;justify-content:center;height:200px;color:#aaa;font-size:14px;">초기화 중...</div>
      <template v-else>
        <!-- 에러 페이지 — 셸이 항상 들고 있음(지연로드 대상 아님) -->
        <fo-error-401 v-if="page==='error401'" :navigate="navigate" />
        <fo-error-500 v-else-if="page==='error500'" :navigate="navigate" :message="errorMessage" />
        <fo-error-404 v-else-if="page==='notFound' || page==='error404'" :navigate="navigate" :page-id="notFoundPageId" />
        <!-- 그 외 전부 — 레지스트리에서 로드된 컴포넌트를 그대로 그린다(2026-08-29 신규,
             원본의 35개 v-else-if 태그 분기를 대체) -->
        <component v-else :is="fnActivePageComp()" v-bind="fnActivePageProps()" />

        <fo-app-footer :config="config" :navigate="navigate" />
      </template>
    </main>
  </div>

  <!-- LOGIN MODAL -->
  <login v-if="uiState.showLogin" :show-toast="showToast" @close="uiState.showLogin=false" />

  <!-- 외부 연동 설정 도움말 -->
  <co-ext-help-modal />

  <!-- TOAST STACK -->
  <div v-if="toasts.length"
    style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:6px;min-width:300px;transition:max-width 0.2s ease;"
    :style="toasts.some(t=>t.expanded)?'max-width:630px;':'max-width:420px;'">
    <div v-for="t in toasts" :key="t.id"
      style="border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.18);overflow:hidden;background:#fff;border-left:4px solid;"
      :style="t.type==='error'?'border-color:#e74c3c;':t.type==='warning'?'border-color:#f39c12;':t.type==='info'?'border-color:#2980b9;':'border-color:#27ae60;'">
      <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;">
        <span style="font-size:16px;flex-shrink:0;margin-top:1px;">{{ t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️' }}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;line-height:1.4;word-break:break-all;"
            :style="t.type==='error'?'color:#c0392b;':t.type==='info'?'color:#1a5276;':'color:#222;'">
            <span style="color:#aaa;font-weight:700;margin-right:4px;">#{{ t.id }}</span>{{ t.msgTitle || t.msg }}
          </div>
          <div v-if="t.msgDetail" style="font-size:11px;color:#666;margin-top:2px;font-family:monospace;">{{ t.msgDetail }}</div>
          <button v-if="t.action" @click="onToastAction(t)"
            style="margin-top:7px;padding:5px 12px;font-size:12px;font-weight:700;border:1px solid #1d4ed8;border-radius:6px;background:#eef4ff;color:#1d4ed8;cursor:pointer;">
            {{ t.action.label }}
          </button>
          <div v-if="t.expanded ? (t.detail) : false"
            style="margin-top:6px;padding:6px 8px;background:#f8f9fa;border-radius:5px;font-size:11px;font-family:monospace;color:#444;white-space:pre-wrap;max-height:200px;overflow-y:auto;word-break:break-all;">{{ t.detail }}</div>
        </div>
        <span v-if="t.detail" @click="toggleToastDetail(t)"
          style="font-size:12px;cursor:pointer;color:#888;flex-shrink:0;padding:2px 4px;border-radius:4px;line-height:1.4;"
          :title="t.expanded?'접기':'상세보기'">{{ t.expanded ? '▲' : '▼' }}</span>
        <button @click="removeToast(t.id)"
          style="font-size:13px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,.08);cursor:pointer;color:#888;display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <div v-if="!t.persistent"
        :style="'height:3px;width:100%;animation:fo-toast-progress '+(t.duration/1000)+'s linear forwards;'+(t.type==='success'?'background:linear-gradient(to right,#27ae60,transparent);':t.type==='info'?'background:linear-gradient(to right,#2980b9,transparent);':t.type==='warning'?'background:linear-gradient(to right,#f39c12,transparent);':'background:linear-gradient(to right,#e74c3c,transparent);')">
      </div>
    </div>
    <div v-if="toasts.length >= 2"
      style="display:flex;align-items:center;justify-content:center;gap:0;background:rgba(40,40,60,.85);border-radius:10px;backdrop-filter:blur(4px);overflow:hidden;">
      <button @click="removeAllToasts"
        style="flex:1;padding:7px 10px;font-size:12px;border:none;background:transparent;cursor:pointer;color:#fff;font-weight:600;">
        ✕ 전체닫기 ({{ toasts.length }})
      </button>
      <span style="width:1px;height:16px;background:rgba(255,255,255,.25);flex-shrink:0;"></span>
      <button @click="toggleAllToastDetail"
        style="flex:1;padding:7px 10px;font-size:12px;border:none;background:transparent;cursor:pointer;color:#ddd;">
        {{ toastShowDetail ? '▲ 전체접기' : '▼ 전체펼치기' }}
      </button>
    </div>
  </div>

  <!-- ALERT MODAL -->
  <div v-if="alertState.show" class="modal-overlay" @click.self="closeAlert">
    <div class="modal-box">
      <div class="modal-icon" :class="'icon-'+alertState.type">
        {{ alertState.type==='success'?'✅':alertState.type==='error'?'❌':'ℹ️' }}
      </div>
      <div class="modal-title">{{ alertState.title }}</div>
      <div class="modal-msg">{{ alertState.msg }}</div>
      <div class="modal-actions">
        <button class="btn-blue" @click="closeAlert" style="padding:10px 28px;">확인</button>
      </div>
    </div>
  </div>

  <!-- FO API LOG PANEL -->
  <div v-if="showApiLog"
    style="position:fixed;top:0;right:0;bottom:0;width:280px;max-width:95vw;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.18);z-index:9990;display:flex;flex-direction:column;border-left:3px solid var(--accent,#c9a96e);">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px 10px;background:linear-gradient(135deg,#fff8f0,#fff3e0);border-bottom:1px solid #eee;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;">🌐</span>
        <span style="font-size:14px;font-weight:700;color:#333;">API 로그 (FO)</span>
        <span style="font-size:11px;background:#f5f5f5;border-radius:10px;padding:1px 7px;color:#888;">{{ foApiLogs.length }}/15</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button @click="clearFoApiLogs" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;color:#999;">지우기</button>
        <button @click="onFoApiLogToggleDock" :title="apiLogDock ? '영역차지 해제(레이어로)' : '영역차지(본문 밀기)'"
          :style="'width:24px;height:24px;border-radius:50%;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;' + (apiLogDock ? 'background:var(--accent,#c9a96e);color:#fff;' : 'background:rgba(0,0,0,.08);color:#666;')">📌</button>
        <button @click="showApiLog=false" style="width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.08);cursor:pointer;color:#666;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:0;">
      <div v-if="!foApiLogs.length" style="padding:24px;text-align:center;color:#ccc;font-size:13px;">API 호출 기록이 없습니다</div>
      <div v-for="log in foApiLogs" :key="log._seq"
        @mouseenter="onFoApiLogEnter(log)" @mouseleave="onFoApiLogLeave()"
        style="padding:3px 10px;border-bottom:1px solid #e5e7eb;cursor:pointer;transition:background .12s;"
        :style="(log._isErr ? 'background:#fff5f5;' : 'background:#fff;') + (fnFoApiLogRecent(log.ts) ? 'font-weight:700;' : 'font-weight:400;')">
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="display:inline-block;padding:0 2px;border-radius:3px;font-size:10px;font-weight:700;flex-shrink:0;" :style="foApiLogMethodStyle(log.method)" :title="log.method">{{ (log.method || '-').charAt(0) }}</span>
          <span style="font-size:11px;color:#1a5276;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="log.url">{{ log.url }}</span>
          <span v-if="log.status ? (Number(log.status) !== 200) : false" style="font-size:11px;font-weight:700;flex-shrink:0;" :style="foApiLogStatusClass(log.status)">{{ log.status }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span v-if="log.uiLabel" style="font-size:10px;color:#7d3c98;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">{{ log.uiLabel }}</span>
          <span v-else style="flex:1;"></span>
          <span v-if="log.duration" style="font-size:10px;color:#aaa;flex-shrink:0;" :title="log.duration + 'ms'">{{ fnFmtSec(log.duration) }}</span>
          <span style="font-size:10px;color:#ccc;flex-shrink:0;" :title="log.ts ? log.ts.slice(11,19) : ''">{{ log.ts ? log.ts.slice(14,19) : '' }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showApiLog ? (apiLogHoverDetail) : false" @mouseenter="onFoApiLogDetailEnter" @mouseleave="onFoApiLogLeave()"
    style="position:fixed;top:80px;right:290px;width:600px;max-height:80vh;background:#fff;border:2px solid #8b5cf6;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9991;font-size:11px;font-family:monospace;overflow:hidden;display:flex;flex-direction:column;">
    <div style="padding:12px;background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-bottom:1px solid #d1d5db;flex-shrink:0;">
      <div style="font-weight:700;color:#374151;font-size:12px;margin-bottom:6px;">📡 API 요청/응답 상세 <span style="color:#ef4444;margin-left:4px;">#{{ fnFoApiLogIndex(apiLogHoverDetail) }}</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="flex:1;overflow:hidden;">
          <div style="color:#374151;font-size:11px;word-break:break-all;line-height:1.5;">
            <span style="color:#6b7280;font-weight:600;">{{ apiLogHoverDetail.method }}</span>
            <span style="color:#6b7280;margin:0 4px;">:</span>
            <span style="color:#374151;">{{ apiLogHoverDetail.url }}</span>
          </div>
        </div>
        <span style="color:#6b7280;font-size:10px;white-space:nowrap;flex-shrink:0;">{{ apiLogHoverDetail.ts ? apiLogHoverDetail.ts.slice(11,19) : '' }}</span>
      </div>
    </div>
    <div style="padding:8px 12px;background:#fafbfc;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:16px;flex-shrink:0;">
      <div>
        <span style="color:#6b7280;font-size:10px;font-weight:600;">상태:</span>
        <span :style="fnFoApiLogBadgeStyle(apiLogHoverDetail.status)">{{ apiLogHoverDetail.status }}</span>
      </div>
      <div v-if="apiLogHoverDetail.duration != null">
        <span style="color:#6b7280;font-size:10px;font-weight:600;">소요시간:</span>
        <span style="color:#374151;font-size:10px;margin-left:4px;">{{ apiLogHoverDetail.duration }}ms</span>
      </div>
    </div>
    <div style="flex:1;overflow:hidden;display:grid;grid-template-rows:130px 1fr 2fr;gap:8px;padding:8px;background:#fff;">
      <div style="display:flex;flex-direction:column;overflow:hidden;border:1px solid #8b5cf6;border-radius:2px;">
        <div style="padding:4px 6px;background:#ede9fe;border-bottom:1px solid #8b5cf6;font-weight:600;color:#5b21b6;font-size:10px;display:flex;align-items:center;justify-content:space-between;">
          <span>📋 Headers</span>
          <span v-if="apiLogHoverDetail.uiLabel" style="color:#7c3aed;font-size:11px;font-weight:700;">{{ apiLogHoverDetail.uiLabel }}</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding:6px 8px;background:#fafbfc;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.8;font-size:10px;font-family:'Courier New',monospace;">{{ [].concat(apiLogHoverDetail.reqHeaders||[], apiLogHoverDetail.resHeaders||[]).join(String.fromCharCode(10)) || '-' }}</div>
      </div>
      <div style="display:flex;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;border-radius:2px;">
        <div style="padding:4px 6px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#6b7280;font-size:10px;">📤 Request</div>
        <div style="flex:1;overflow-y:auto;padding:6px;background:#fafbfc;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.4;font-size:10px;">{{ formatJsonData(apiLogHoverDetail.reqData) }}</div>
      </div>
      <div style="display:flex;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;border-radius:2px;">
        <div style="padding:4px 6px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:600;color:#6b7280;font-size:10px;">📥 Response</div>
        <div style="flex:1;overflow-y:auto;padding:6px;background:#fafbfc;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.4;font-size:10px;">{{ formatJsonData(apiLogHoverDetail.data) }}</div>
      </div>
    </div>
  </div>

  <!-- CONFIRM MODAL -->
  <div v-if="confirmState.show" class="modal-overlay" style="z-index:10000;" @click.self="closeConfirm(false)">
    <div class="modal-box">
      <div class="modal-icon icon-warning">⚠️</div>
      <div class="modal-title">{{ confirmState.title }}</div>
      <div class="modal-msg">{{ confirmState.msg }}</div>
      <div class="modal-actions" style="gap:10px;">
        <button class="btn-outline" @click="closeConfirm(false)" style="padding:10px 20px;">취소</button>
        <button class="btn-blue" @click="closeConfirm(true)" style="padding:10px 20px;">확인</button>
      </div>
    </div>
  </div>

</div>
`,
  });

  /* ── 컴포넌트 등록 — 셸이 항상 들고 있는 것만(shopjoy_v260406/lib/app/foAppComp.js
     참고). 페이지 자체(Home/Cart/Order/About/.../DispUi01~06/Sample01~23 등)는
     이제 <component :is="fnActivePageComp()"> 로 동적 바인딩되므로 태그 등록이
     필요 없다 — 여기 등록 대상은 "페이지 템플릿 내부에서 태그로 참조하는 공용
     부품"과 "셸 템플릿에 직접 박힌 정적 태그"(FoAppHeader 등, Login, 에러 페이지)뿐. */
  app
    .component('FoAppHeader',   window.foAppHeader)
    .component('FoAppSidebar',  window.foAppSidebar)
    .component('FoAppFooter',   window.foAppFooter)
    .component('FoError404',    window.foError404)
    .component('FoError401',    window.foError401)
    .component('FoError500',    window.foError500)
    .component('Login',         window.Login)
    .component('MyDateFilter',  window.MyDateFilter)
    .component('DispX04Widget', window.DispX04Widget)
    .component('CoBarcodeWidget',  window.CoBarcodeWidget  || { template: '<div/>' })
    .component('CoCountdownWidget', window.CoCountdownWidget || { template: '<div/>' })
    .component('BaseAttachGrp', window.BaseAttachGrp)
    .component('BaseHtmlEditor', window.BaseHtmlEditor)
    .component('BaseTossPayWidget', window.BaseTossPayWidget)
    .component('FoPage',       window.FoPage)
    .component('FoContainer',  window.FoContainer)
    .component('FoSearchArea', window.FoSearchArea)
    .component('FoFormArea',   window.FoFormArea)
    .component('FoGrid',       window.FoGrid)
    .component('FoGridCrud',   window.FoGridCrud)
    .component('FoModal',      window.FoModal)
    .component('CoNotiBell',   window.CoNotiBell)
    .component('FoCmPopupModal', window.FoCmPopupModal)
    .component('FoRowCancelDelete', window.FoRowCancelDelete)
    .component('FoPager',      window.FoPager)
    .component('FoTabBar',     window.FoTabBar)
    .component('CustomerModal',        window.CustomerModal)
    .component('OrderDetailModal',     window.OrderDetailModal)
    .component('ProductModal',         window.ProductModal)
    .component('CompareModal',         window.CompareModal)
    .component('FoAddrSearchModal',    window.FoAddrSearchModal)
    .component('CoExtHelpModal',       window.CoExtHelpModal || { template: '<div/>' });
  ['DispX01Ui','DispX02Area','DispX03Panel'].forEach(name => {
    if (window[name]) app.component(name, window[name]);
  });

  window.perfUtil?.start('FO 앱 시작');
  const recordVueMountFo = window.perfUtil?.recordVueMount();
  app.use(pinia).mount('#app');
  setTimeout(() => {
    recordVueMountFo?.();
    window.perfUtil?.end('FO 앱 시작');
  }, 100);
})();
