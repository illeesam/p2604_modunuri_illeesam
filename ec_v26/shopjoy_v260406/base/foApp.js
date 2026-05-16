/* ============================================
   ShopJoy - FO Vue 3 SPA (의류 쇼핑몰)
   ============================================ */
(function () {
  const _s = document.createElement('style');
  _s.id = 'fo-app-styles';
  _s.textContent = `
  @keyframes fo-toast-progress {
    from { transform: scaleX(1); transform-origin: left; }
    to   { transform: scaleX(0); transform-origin: left; }
  }
  .fo-dim-enter-active { transition: opacity 0.15s ease; }
  .fo-dim-leave-active { transition: opacity 0.3s ease; }
  .fo-dim-enter-from, .fo-dim-leave-to { opacity: 0; }
  .fo-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--accent, #c9a96e);
    display: inline-block;
    animation: fo-dot-wave 1.0s ease-in-out infinite;
  }
  @keyframes fo-dot-wave {
    0%, 100% { transform: translateY(0) scale(0.7); opacity: 0.2; }
    40%      { transform: translateY(-13px) scale(1.25); opacity: 1; }
    65%      { transform: translateY(-5px) scale(0.95); opacity: 0.55; }
  }
  @keyframes fo-progress-slide {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  `;
  document.head.appendChild(_s);
})();

(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

  /* ── Pinia 생성 및 Auth 초기화 ── */
  const pinia = Pinia.createPinia();
  window.foAuth.init(pinia);

  const app = createApp({
  setup() {
    /* foInitReady: 초기화 완료 전 컴포넌트 API 호출을 막기 위한 플래그 */
    const foInitReady = ref(false);
    window.foInitReady = false;
    (async () => {
      const _foAuthStore = window.useFoAuthStore?.();
      if (_foAuthStore?.svAccessToken) {
        try {
          await window.useFoAppInitStore?.()?.saFetchFoAppInitData?.();
        } catch (e) {
          if (e?.response?.status === 401) {
            console.warn('[foApp] token invalid (401), reset session');
            _foAuthStore.saClearSession?.();
          } else {
            console.warn('[foApp] saFetchFoAppInitData error:', e?.response?.status || e.message);
          }
        }
      } else {
        /* 토큰 없어도 storage 복원은 수행 */
        window.useFoAppInitStore?.()?.saRestoreFromStorage?.();
      }
      foInitReady.value = true;
      window.foInitReady = true;
    })();
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modu-fo-theme') || 'light');

    /* applyTheme */
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('modu-fo-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);

    /* toggleTheme */
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const errorMessage = ref('');

    /* X- 헤더 배열을 압축 포맷으로 변환 */
    const _fmtXHeaders = (headers) => {
      if (!headers || headers.length === 0) return '';
      const map = {};
      headers.forEach(h => {
        const idx = h.indexOf(': ');
        if (idx > -1) map[h.slice(0, idx).toLowerCase()] = h.slice(idx + 2);
      });

      /* truncate */
      const truncate = (v) => v && v.length > 10 ? v.slice(0, 5) + '...' + v.slice(-5) : (v || '');
      const NO_TRUNCATE = ['x-trace-id', 'x-line-no', 'x-site-type', 'x-site-id', 'x-site-no', 'x-func-nm', 'x-file-nm', 'authorization'];

      /* fmtVal */
      const fmtVal = (k, v) => k === 'x-func-nm' ? v + '()' : NO_TRUNCATE.includes(k) ? v : truncate(v);

      /* row */
      const row = (keys) => keys.filter(k => map[k]).map(k => `${k}: ${fmtVal(k, map[k])}`).join(' | ');
      const lines = [
        row(['x-site-type', 'x-ui-nm', 'x-cmd-nm']),
        row(['x-file-nm', 'x-func-nm', 'x-line-no']),
        row(['x-trace-id', 'x-site-id', 'x-buyer-id', 'x-license-code', 'x-user-agent', 'authorization']),
      ].filter(Boolean);
      const known = ['x-site-type','x-ui-nm','x-cmd-nm','x-file-nm','x-func-nm','x-line-no','x-trace-id','x-site-id','x-buyer-id','x-license-code','x-user-agent','authorization'];
      const rest = Object.entries(map).filter(([k]) => !known.includes(k)).map(([k,v]) => `${k}: ${truncate(v)}`).join(' | ');
      if (rest) lines.push(rest);
      return lines.join('\n');
    };

    /* API Validation 에러 → toast 출력 (foAxios 에서 window.dispatchEvent('api-validation-error')) */
    window.addEventListener('api-validation-error', (ev) => {
      const d = ev.detail || {};
      let msg = d.message || '오류가 발생했습니다.';
      if (d.method && d.url && d.status) {
        let title = `${d.method} ${d.url} ${d.status}`;
        if (d.uiLabel) title += ` :: ${d.uiLabel}`;
        msg = `${title}\n${msg}`;
      }
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
    });

    /* API 성공 → toast info 출력 (foAxios 에서 window.dispatchEvent('api-success')) */
    window.addEventListener('api-success', (ev) => {
      const d = ev.detail || {};
      showToast(`${d.method} ${d.url} ${d.status}`, 'info', 3000, d.detail || '');
    });

    /* API 에러 → 오류 페이지 이동 (baseAxios 계열에서 window dispatchEvent 호출) */
    window.addEventListener('api-error', (ev) => {
      const d = ev.detail || {};
      const st = d.status;
      let label = '';
      if (d.method && d.url) {
        label = `${d.method} ${d.url} ${st}`;
        if (d.uiLabel) label += ` :: ${d.uiLabel}`;
      }
      let msg = label ? `${label}\n${d.message || ''}` : (d.message || '');
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
        try { window.history.replaceState(null, '', '#page=error401'); } catch (_) {}
      }
      else if (st >= 500 || st === 0) {
        errorMessage.value = msg;
        page.value = 'error500';
        try { window.history.replaceState(null, '', '#page=error500'); } catch (_) {}
      }
    });
    const sidebarOpen = ref(true);
    const uiState = reactive({ mobileOpen: false, showLogin: false });
    let replaceNextHash = false;

    /* closeMobileMenu */
    const closeMobileMenu = () => {
      uiState.mobileOpen = false;
    };

    /* toggleMobileMenu */
    const toggleMobileMenu = () => {
      if (uiState.mobileOpen) {
        uiState.mobileOpen = false;
      } else {
        if (window.innerWidth < 1024) sidebarOpen.value = true;
        uiState.mobileOpen = true;
      }
    };

    /* ── 바로구매 즉시주문 상태 (장바구니와 독립) ── */
    const instantOrder = ref(null);
    /* ── 장바구니 선택 주문 (cartIds) ── */
    const cartIds = reactive([]);
    /* ── 서브페이지 dtlId (이벤트상세, 블로그상세/수정 등) ── */
    const viewEditId = ref(null);

    /* instantOrder → URL 해시 파라미터 변환 */
    const _instantOrderToParams = (io) => {
      if (!io) return {};
      return {
        prodId: io.prod?.prodId ?? '',
        opt1Nm: io.color?.name        ?? '',   // 색상명 (colorId 없으므로 name 사용)
        opt2Id: io.size               ?? '',
        qty:    io.qty                ?? 1,
      };
    };

    /* URL 해시 파라미터 → instantOrder 재구성 */
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

    /* navigate */
    const navigate = (id, opts = {}) => {
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
      page.value = id;
      window.scrollTo(0, 0);
      try { document.querySelector('.layout-main')?.scrollTo(0, 0); } catch (e) {}
    };
    window.addEventListener('resize', () => { if (window.innerWidth < 1024) uiState.mobileOpen = false; });

    /* ── FO API Log ── */
    const FO_API_LOG_KEY = 'modu-fo-apiLog';
    const MAX_FO_API_LOGS = 15;
    const foApiLogs = reactive(JSON.parse(localStorage.getItem(FO_API_LOG_KEY) || '[]'));
    const showApiLog = ref(false);
    const showSettings = ref(false);
    const apiLogLockedDetail = ref(null);
    const apiLogHoverDetail  = ref(null);
    let _foApiLogSeq = foApiLogs.length ? Math.max(...foApiLogs.map(l => l._seq || 0)) + 1 : 1;

    /* addFoApiLog */
    const addFoApiLog = (detail) => {
      const now = new Date();
      const ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')
        + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
      const entry = { _seq: _foApiLogSeq++, ts, ...detail };
      foApiLogs.unshift(entry);
      if (foApiLogs.length > MAX_FO_API_LOGS) foApiLogs.splice(MAX_FO_API_LOGS);
      try { localStorage.setItem(FO_API_LOG_KEY, JSON.stringify(foApiLogs)); } catch(e) {}
    };

    /* clearFoApiLogs */
    const clearFoApiLogs = () => {
      foApiLogs.splice(0, foApiLogs.length);
      apiLogLockedDetail.value = null;
      try { localStorage.removeItem(FO_API_LOG_KEY); } catch(e) {}
    };

    /* foApiLogStatusClass */
    const foApiLogStatusClass = (status) => {
      if (!status) return 'color:#999;';
      if (status >= 500) return 'color:#e74c3c;font-weight:700;';
      if (status >= 400) return 'color:#e67e22;font-weight:700;';
      return 'color:#27ae60;font-weight:700;';
    };

    /* foApiLogMethodStyle */
    const foApiLogMethodStyle = (method) => {
      const m = (method || '').toUpperCase();
      if (m === 'GET')    return 'background:#e8f5e9;color:#388e3c;';
      if (m === 'POST')   return 'background:#e3f2fd;color:#1565c0;';
      if (m === 'PUT')    return 'background:#fff3e0;color:#e65100;';
      if (m === 'PATCH')  return 'background:#f3e5f5;color:#6a1b9a;';
      if (m === 'DELETE') return 'background:#fce4ec;color:#c62828;';
      return 'background:#f5f5f5;color:#555;';
    };

    window.addEventListener('api-success', (ev) => { addFoApiLog(ev.detail || {}); });
    window.addEventListener('api-validation-error', (ev) => { addFoApiLog({ ...(ev.detail || {}), _isErr: true }); });
    window.addEventListener('api-error', (ev) => { addFoApiLog({ ...(ev.detail || {}), _isErr: true }); });
    /* 설정 드롭다운 바깥 클릭 시 닫기 */
    document.addEventListener('pointerdown', (e) => {
      if (!showSettings.value) return;
      if (!e.target.closest('[data-fo-settings]')) showSettings.value = false;
    }, true);

    /* ── Toast (누적 스택) ── */
    const toasts = reactive([]);
    let _toastSeq = 0;
    const FO_TOAST_DETAIL_KEY = 'modu-fo-toast-isShowDetail';
    const toastShowDetail = ref(localStorage.getItem(FO_TOAST_DETAIL_KEY) !== 'false');

    /* showToast */
    const showToast = (msg, type = 'success', duration = 0, detail = '') => {
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
      const t = { id, msg, msgTitle, msgDetail, type, detail, expanded, persistent: autoDismiss === 0, duration: autoDismiss };
      toasts.push(t);
      if (autoDismiss > 0) setTimeout(() => removeToast(id), autoDismiss);
    };

    /* removeToast */
    const removeToast     = (id) => { const i = toasts.findIndex(t => t.id === id); if (i !== -1) toasts.splice(i, 1); };

    /* removeAllToasts */
    const removeAllToasts = () => { toasts.splice(0, toasts.length); };

    /* toggleAllToastDetail */
    const toggleAllToastDetail = () => {
      toastShowDetail.value = !toastShowDetail.value;
      localStorage.setItem(FO_TOAST_DETAIL_KEY, toastShowDetail.value);
      toasts.forEach(t => { if (t.detail) t.expanded = toastShowDetail.value; });
    };

    /* toggleToastDetail */
    const toggleToastDetail = (t) => { t.expanded = !t.expanded; };
    /* 하위 호환 */
    const toast = { show: false };

    /* ── API Progress Bar ── */
    const isApiLoading = ref(false);
    let _apiLoadingCount = 0;
    let _progressHideTimer = null;
    let _progressShowAt = 0;
    const MIN_SHOW_MS = 300;
    const HIDE_DELAY_MS = 50;
    window._showProgress = (show) => {
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

    /* ── Alert Modal ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });

    /* showAlert */
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));

    /* closeAlert */
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Confirm Modal ── */
    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });

    /* showConfirm */
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));

    /* closeConfirm */
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Prods (이미지 자동 할당) ── */
    const _IMG = 'assets/cdn/prod/img/shop/product';

    /* _assignImg */
    const _assignImg = (p) => {
      /* colors→opt1s, sizes→opt2s 호환 */
      if (p.colors && !p.opt1s) { p.opt1s = p.colors; }
      if (p.sizes  && !p.opt2s) { p.opt2s = p.sizes; }
      /* 이미지 자동 할당 */
      if (!p.image) {
        const id = p.prodId || 1;
        if (id <= 12) {
          p.image = `${_IMG}/fashion/fashion-${id}.webp`;
          p.images = [p.image, `${_IMG}/fashion/fashion-${((id % 12) + 1)}.webp`];
        } else {
          const n = ((id - 1) % 23) + 1;
          p.image = `${_IMG}/prod_${n}.png`;
          p.images = [p.image, `${_IMG}/prod_${(n % 23) + 1}.png`];
        }
      }
      /* priceNum 보정 */
      if (!p.priceNum && p.price) {
        p.priceNum = parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0;
      }
      return p;
    };
    /* SITE_CONFIG로 초기값 동기 세팅 → foApi 로드 성공 시 덮어씀 */
    const _initFallback = window.SITE_CONFIG?.prods || [];
    _initFallback.forEach(_assignImg);
    const prods = reactive([..._initFallback]);
    const selectedProd = ref(_initFallback.length > 0 ? _initFallback[0] : null);

    /* selectProd */
    const selectProd = p => {
      selectedProd.value = p;
      navigate('prodView');
    };

    /* ── Likes (좋아요/위시리스트) ── */
    let likes = reactive(new Set());
    try {
      const savedLikes = localStorage.getItem('shopjoy_likes');
      if (savedLikes) likes = new Set(JSON.parse(savedLikes));
    } catch (e) {}

    /* saveLikes */
    const saveLikes = () => { try { localStorage.setItem('shopjoy_likes', JSON.stringify([...likes])); } catch (e) {} };

    /* toggleLike */
    const toggleLike = (prodId) => {
      const s = new Set(likes);
      if (s.has(prodId)) s.delete(prodId); else s.add(prodId);
      likes = s;
      saveLikes();
    };

    /* isLiked */
    const isLiked = (prodId) => likes.has(prodId);
    const cfLikeCount = computed(() => likes.size);

    /* ── Cart ── */
    const cart = reactive([]);

    /* 임의 ID 생성: yymmddHHMMSS + rand4 */
    const genId = () => {
      const d = new Date();

      /* pad */
      const pad = n => String(n).padStart(2,'0');
      return [d.getFullYear()%100,d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()].map(pad).join('')
        + Math.random().toString(36).slice(2,6).toUpperCase();
    };

    /* prods 로드 후: 장바구니 복원 + URL pid 복원 */
    const _restoreAfterProds = () => {
      try {
        const saved = localStorage.getItem('shopjoy_cart');
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
        const rawHash = String(window.location.hash || '').replace(/^#/, '');
        if (rawHash.includes('page=')) {
          const hpid = new URLSearchParams(rawHash).get('prodid') || '';
          if (hpid) {
            const f = prods.find(x => String(x.prodId) === hpid);
            if (f) selectedProd.value = f;
          }
        }
      } catch (e) {}
      if (!selectedProd.value && prods.length > 0) selectedProd.value = prods[0];
    };

    /* ── 상품 데이터 로드 ── */
    const handleFetchProds = async () => {
      try {
        const res = await foApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 200 }, '상품', '목록조회');
        const list = res.data?.data?.pageList || [];
        list.forEach(_assignImg);
        prods.splice(0, prods.length, ...list);
      } catch (e) {
        /* 초기값이 이미 SITE_CONFIG fallback이므로 API 실패 시 추가 처리 불필요 */
      }
      _restoreAfterProds();
    };
    onMounted(() => { handleFetchProds(); });

    /* saveCart */
    const saveCart = () => {
      try {
        localStorage.setItem('shopjoy_cart', JSON.stringify(
          cart.map(i => ({ cartId: i.cartId, prodId: i.prod.prodId, color: i.color, size: i.size, qty: i.qty }))
        ));
      } catch (e) {}
    };

    const cfCartCount = computed(() => cart.reduce((s, i) => s + i.qty, 0));

    /* addToCart */
    const addToCart = (prod, color, size, qty = 1) => {
      const existing = cart.find(i =>
        i.prod.prodId === prod.prodId &&
        i.color.name === color.name &&
        i.size === size
      );
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ cartId: genId(), prod, color, size, qty });
      }
      saveCart();
      showToast(`장바구니에 담았습니다! (${color.name} / ${size})`, 'success');
    };

    /* removeFromCart */
    const removeFromCart = idx => {
      cart.splice(idx, 1);
      saveCart();
    };

    /* updateCartQty */
    const updateCartQty = (idx, delta) => {
      const item = cart[idx];
      if (!item) return;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        cart.splice(idx, 1);
      } else {
        item.qty = newQty;
      }
      saveCart();
    };

    /* clearCart */
    const clearCart = () => {
      cart.splice(0, cart.length);
      saveCart();
    };

    /* ── Auth ── */
    const auth = window.foAuth.state;

    /* onShowLogin */
    const onShowLogin = () => { uiState.showLogin = true; };
    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];

    /* onLogout */
    const onLogout = () => {
      window.foAuth.logout();
      showToast('로그아웃되었습니다.', 'info');
      if (MY_PAGES.includes(page.value)) page.value = 'home';
    };
    /* modu-fo-accessToken 삭제(DevTools 등) 감지 → 자동 로그아웃 처리 */
    /* auth.user 가 새 객체로 갱신되면 watch 가 매번 fire 되므로 authId 만 비교 (로그인 상태 변화만 트래킹) */
    watch(() => auth.user?.authId || '', authId => {
      if (!authId && MY_PAGES.includes(page.value) && page.value !== 'home') page.value = 'home';
    });

    /* ── URL state ── */
    let restoring = true;
    const validPages = ['home', 'prodList', 'prodView', 'cart', 'order', 'contact', 'faq',
      'event', 'eventView', 'blog', 'blogView', 'blogEdit', 'like',
      'location', 'about',
      'myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt',
      'dispUi01', 'dispUi02', 'dispUi03', 'dispUi04', 'dispUi05', 'dispUi06',
      'sample01','sample02','sample03','sample04','sample05','sample06','sample07',
      'sample08','sample09','sample10','sample11','sample12','sample13','sample14',
      'sample21','sample22','sample23',
      'xsStore', 'xsLocalStorage',
      'error401','error404','error500'];
    try {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      const hasPageParam = rawHash.includes('page=');
      const params = hasPageParam ? new URLSearchParams(rawHash) : null;

      /* isMyPage */
      const isMyPage = p => ['myOrder','myClaim','myCoupon','myCache','myContact','myChatt'].includes(p);
      const isLoggedIn = !!(localStorage.getItem('modu-fo-accessToken'));
      if (hasPageParam) {
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage) && (!isMyPage(hPage) || isLoggedIn)) page.value = hPage;
        else if (hPage && !validPages.includes(hPage)) page.value = 'notFound';
      }
      /* 바로구매 URL 파라미터 복원 */
      if (page.value === 'order' && hasPageParam) {
        instantOrder.value = _instantOrderFromParams(params);
        const cids = params.get('cartIds');
        if (cids) cartIds.splice(0, cartIds.length, ...cids.split(',').filter(Boolean));
      }
      /* 이벤트/블로그 상세 ID 복원 */
      if (hasPageParam) {
        const hEventId = params.get('eventId');
        const hEditId  = params.get('dtlId');
        if (hEventId) viewEditId.value = Number(hEventId) || hEventId;
        else if (hEditId) viewEditId.value = Number(hEditId) || hEditId;
      }
    } catch(e) {}
    restoring = false;

    let syncingFromHash = false;

    /* onHashChange */
    const onHashChange = () => {
      if (syncingFromHash) return;
      syncingFromHash = true;
      try {
        const rawHash = String(window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(rawHash);
        const hPage = params.get('page');
        // 동일 값 set 으로 인한 reactive 무한 갱신 방지
        if (hPage && validPages.includes(hPage) && page.value !== hPage) page.value = hPage;
        else if (hPage && !validPages.includes(hPage) && page.value !== 'notFound') page.value = 'notFound';
        if (hPage === 'order') {
          instantOrder.value = _instantOrderFromParams(params);
          const cids = params.get('cartIds');
          const newCids = cids ? cids.split(',').filter(Boolean) : [];
          // 동일 배열이면 splice 스킵
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
      setTimeout(() => { syncingFromHash = false; }, 0);
    };
    window.addEventListener('hashchange', onHashChange);

    watch(page, id => {
      if (restoring || syncingFromHash) return;
      const params = new URLSearchParams();
      params.set('page', page.value);
      if (id === 'prodView') {
        params.set('prodid', selectedProd.value?.prodId ?? '');
      }
      if (id === 'order' && instantOrder.value) {
        const io = _instantOrderToParams(instantOrder.value);
        Object.entries(io).forEach(([k, v]) => params.set(k, v));
      }
      if (id === 'order' && cartIds.length) {
        params.set('cartIds', cartIds.join(','));
      }
      if (id === 'eventView' && viewEditId.value != null) {
        params.set('eventId', viewEditId.value);
      }
      if ((id === 'blogView' || id === 'blogEdit') && viewEditId.value != null) {
        params.set('dtlId', viewEditId.value);
      }
      const hash = params.toString();
      const url = window.location.pathname + window.location.search + '#' + hash;
      // 동일 hash 재설정 시 hashchange 이벤트 재발화로 인한 무한 마운트 루프 방지
      const curHash = String(window.location.hash || '').replace(/^#/, '');
      if (curHash === hash) return;
      if (replaceNextHash) {
        replaceNextHash = false;
        try { history.replaceState(null, '', url); } catch (e) { window.location.hash = hash; }
      } else {
        window.location.hash = hash;
      }
    });

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const pr = new URLSearchParams();
        pr.set('page', page.value);
        if (page.value === 'prodView') pr.set('prodid', String(selectedProd.value?.prodId ?? ''));
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + pr.toString());
      }
    } catch (e) {}

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', onHashChange);
    });

    /* ── Loading done ── */
    const loadingEl = document.getElementById('_boot_loading') || document.getElementById('vue-app-loading');
    if (loadingEl) {
      loadingEl.classList.add('done');
      loadingEl.classList.add('vue-app-loading--done');
      setTimeout(() => { if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 350);
    }

    /* FO_SITE_NO 기준 동적 컴포넌트 참조 */
    const _N = window.FO_SITE_NO;
    const foHomeComp     = window['Home' + _N];
    const foProdListComp = window['Prod' + _N + 'List'];
    const foProdViewComp = window['Prod' + _N + 'View'];

    const SIDEBAR_HIDDEN_PAGES = new Set([
      'home', 'prodList', 'prodView', 'cart', 'order',
      'myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt',
      'event', 'eventView', 'blog', 'blogView', 'blogEdit',
    ]);
    const cfShowSidebar = computed(() => !SIDEBAR_HIDDEN_PAGES.has(page.value));


    /* ── 전역 노출: 페이지 컴포넌트에서 props 없이 직접 접근 가능 ── */
    window.foApp = {
      get cart()          { return cart; },
      get instantOrder()  { return instantOrder.value; },
      get cartIds()       { return cartIds; },
      get config()        { return window.SITE_CONFIG; },
      get prods()      { return prods; },
      get selectedProd() { return selectedProd.value; },
      get auth()          { return auth; },
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      navigate,
      showToast,
      showAlert,
      showConfirm,
      toggleLike,
      isLiked,
      selectProd,
    };
    return {
      theme, toggleTheme,
      page, sidebarOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toasts, showToast, removeToast, removeAllToasts, toggleToastDetail, toggleAllToastDetail, toastShowDetail, toast,
      isApiLoading,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      prods, selectedProd, selectProd,
      cart, cfCartCount, addToCart, removeFromCart, updateCartQty, clearCart,
      likes, toggleLike, isLiked, cfLikeCount,
      instantOrder, cartIds, viewEditId,
      config: window.SITE_CONFIG,
      auth, uiState, onShowLogin, onLogout,
      foInitReady,
      foHomeComp, foProdListComp, foProdViewComp,
      foApiLogs, showApiLog, showSettings, apiLogLockedDetail, apiLogHoverDetail,
      clearFoApiLogs, foApiLogStatusClass, foApiLogMethodStyle,
      cfShowSidebar,
      onToggleApiLog: () => { showApiLog.value = !showApiLog.value; showSettings.value = false; },
      notFoundPageId: computed(() => {
        try { return new URLSearchParams(String(window.location.hash || '').replace(/^#/, '')).get('page') || ''; } catch(e) { return ''; }
      }),
      errorMessage,
      safe: window.safeUtil,
    };
  },

  template: /* html */ `
<div style="height:100%;min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <!-- API Progress Bar + Dim + Loading Indicator -->
  <transition name="fo-dim">
    <div v-if="isApiLoading" style="position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.18);pointer-events:none;display:flex;align-items:center;justify-content:center;">
      <div style="background:rgba(255,255,255,0.97);border-radius:18px;padding:28px 40px;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:flex;flex-direction:column;align-items:center;gap:18px;min-width:160px;">
        <!-- 흐르는 dot 웨이브 -->
        <div style="display:flex;align-items:center;gap:10px;height:36px;">
          <div class="fo-dot" style="animation-delay:0s;"></div>
          <div class="fo-dot" style="animation-delay:0.2s;"></div>
          <div class="fo-dot" style="animation-delay:0.4s;"></div>
          <div class="fo-dot" style="animation-delay:0.6s;"></div>
        </div>
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary,#666);letter-spacing:0.03em;">조회중입니다...</div>
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
    :app-api-logs="foApiLogs"
    @app-toggle-sidebar="sidebarOpen=!sidebarOpen" @app-toggle-mobile="toggleMobileMenu"
    @app-toggle-settings="showSettings=!showSettings"
    @app-toggle-api-log="onToggleApiLog"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <fo-app-sidebar
      v-show="cfShowSidebar"
      :page="page" :app-sidebar-open="sidebarOpen" :app-mobile-open="uiState.mobileOpen"
      :config="config" :navigate="navigate" :app-cart-count="cfCartCount" :app-auth="auth"
      @app-toggle-sidebar="sidebarOpen=!sidebarOpen" @app-close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: uiState.mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <div v-if="!foInitReady" style="display:flex;align-items:center;justify-content:center;height:200px;color:#aaa;font-size:14px;">초기화 중...</div>
      <template v-else>
        <component :is="foHomeComp"
          v-if="page === 'home'"
          :navigate="navigate"
        />
        <component :is="foProdListComp"
          v-else-if="page === 'prodList'"
          :navigate="navigate"
        />
        <component :is="foProdViewComp"
          v-else-if="page === 'prodView'"
          :navigate="navigate"
        />
        <cart
          v-else-if="page==='cart'"
          :navigate="navigate"
        />
        <order
          v-else-if="page==='order'"
          :navigate="navigate"
        />
        <contact
          v-else-if="page==='contact'"
          :navigate="navigate"
        />
        <faq
          v-else-if="page==='faq'"
          :navigate="navigate"
        />
        <event-page
          v-else-if="page==='event'"
          :navigate="navigate"
        />
        <event-view
          v-else-if="page==='eventView'"
          :navigate="navigate" :dtl-id="viewEditId"
        />
        <blog-page
          v-else-if="page==='blog'"
          :navigate="navigate"
        />
        <blog-view
          v-else-if="page==='blogView'"
          :navigate="navigate" :dtl-id="viewEditId"
        />
        <blog-edit
          v-else-if="page==='blogEdit'"
          :navigate="navigate" :dtl-id="viewEditId"
        />
        <like-page
          v-else-if="page==='like'"
          :navigate="navigate"
        />
        <location-page
          v-else-if="page==='location'"
          :navigate="navigate"
        />
        <about-page
          v-else-if="page==='about'"
          :navigate="navigate"
        />
        <my-order
          v-else-if="page==='myOrder'"
          :navigate="navigate"
        />
        <my-claim
          v-else-if="page==='myClaim'"
          :navigate="navigate"
        />
        <my-coupon
          v-else-if="page==='myCoupon'"
          :navigate="navigate"
        />
        <my-cache
          v-else-if="page==='myCache'"
          :navigate="navigate"
        />
        <my-contact
          v-else-if="page==='myContact'"
          :navigate="navigate"
        />
        <my-chatt
          v-else-if="page==='myChatt'"
          :navigate="navigate"
        />
        <xd-disp-ui01 v-else-if="page==='dispUi01'" />
        <xd-disp-ui02 v-else-if="page==='dispUi02'" />
        <xd-disp-ui03 v-else-if="page==='dispUi03'" />
        <xd-disp-ui04 v-else-if="page==='dispUi04'" />
        <xd-disp-ui05 v-else-if="page==='dispUi05'" />
        <xd-disp-ui06 v-else-if="page==='dispUi06'" />
        <xs-sample01 v-else-if="page==='sample01'" />
        <xs-sample02 v-else-if="page==='sample02'" />
        <xs-sample03 v-else-if="page==='sample03'" />
        <xs-sample04 v-else-if="page==='sample04'" />
        <xs-sample05 v-else-if="page==='sample05'" />
        <xs-sample06 v-else-if="page==='sample06'" />
        <xs-sample07 v-else-if="page==='sample07'" />
        <xs-sample08 v-else-if="page==='sample08'" />
        <xs-sample09 v-else-if="page==='sample09'" />
        <xs-sample10 v-else-if="page==='sample10'" />
        <xs-sample11 v-else-if="page==='sample11'" />
        <xs-sample12 v-else-if="page==='sample12'" />
        <xs-sample13 v-else-if="page==='sample13'" />
        <xs-sample14 v-else-if="page==='sample14'" />
        <xs-sample21 v-else-if="page==='sample21'" />
        <xs-sample22 v-else-if="page==='sample22'" />
        <xs-sample23 v-else-if="page==='sample23'" />
        <xs-store
          v-else-if="page==='xsStore'"
          :navigate="navigate" :show-toast="showToast"
        />
        <xs-local-storage
          v-else-if="page==='xsLocalStorage'"
          :navigate="navigate" :show-toast="showToast"
        />
  
        <!-- Error Pages -->
        <fo-error-401 v-else-if="page==='error401'" :navigate="navigate" />
        <fo-error-500 v-else-if="page==='error500'" :navigate="navigate" :message="errorMessage" />
        <fo-error-404 v-else-if="page==='notFound' || page==='error404'" :navigate="navigate" :page-id="notFoundPageId" />
  
        <fo-app-footer :config="config" :navigate="navigate" />
      </template>
    </main>
  </div>

  <!-- LOGIN MODAL -->
  <login v-if="uiState.showLogin" :show-toast="showToast" @close="uiState.showLogin=false" />

  <!-- TOAST STACK -->
  <div v-if="toasts.length"
    style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:6px;min-width:300px;transition:max-width 0.2s ease;"
    :style="toasts.some(t=>t.expanded)?'max-width:630px;':'max-width:420px;'">
    <!-- 개별 toast 카드 -->
    <div v-for="t in toasts" :key="t.id"
      style="border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.18);overflow:hidden;background:#fff;border-left:4px solid;"
      :style="t.type==='error'?'border-color:#e74c3c;':t.type==='warning'?'border-color:#f39c12;':t.type==='info'?'border-color:#2980b9;':'border-color:#27ae60;'">
      <!-- 헤더 행 -->
      <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;">
        <span style="font-size:16px;flex-shrink:0;margin-top:1px;">{{ t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️' }}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;line-height:1.4;word-break:break-all;"
            :style="t.type==='error'?'color:#c0392b;':t.type==='info'?'color:#1a5276;':'color:#222;'">
            {{ t.msgTitle || t.msg }}
          </div>
          <div v-if="t.msgDetail" style="font-size:11px;color:#666;margin-top:2px;font-family:monospace;">{{ t.msgDetail }}</div>
          <!-- 상세 펼치기 영역 -->
          <div v-if="t.expanded && t.detail"
            style="margin-top:6px;padding:6px 8px;background:#f8f9fa;border-radius:5px;font-size:11px;font-family:monospace;color:#444;white-space:pre-wrap;max-height:200px;overflow-y:auto;word-break:break-all;">{{ t.detail }}</div>
        </div>
        <!-- 상세보기 토글 (detail 있을 때만) -->
        <span v-if="t.detail" @click="toggleToastDetail(t)"
          style="font-size:12px;cursor:pointer;color:#888;flex-shrink:0;padding:2px 4px;border-radius:4px;line-height:1.4;"
          :title="t.expanded?'접기':'상세보기'">{{ t.expanded ? '▲' : '▼' }}</span>
        <!-- 닫기 -->
        <button @click="removeToast(t.id)"
          style="font-size:13px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,.08);cursor:pointer;color:#888;display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0;">✕</button>
      </div>
      <!-- progress bar (auto-dismiss toast) -->
      <div v-if="!t.persistent"
        :style="'height:3px;width:100%;animation:fo-toast-progress '+(t.duration/1000)+'s linear forwards;'+(t.type==='success'?'background:linear-gradient(to right,#27ae60,transparent);':t.type==='info'?'background:linear-gradient(to right,#2980b9,transparent);':t.type==='warning'?'background:linear-gradient(to right,#f39c12,transparent);':'background:linear-gradient(to right,#e74c3c,transparent);')">
      </div>
    </div>
    <!-- 하단 고정 바: 2개 이상일 때 -->
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
    style="position:fixed;top:0;right:0;bottom:0;width:420px;max-width:95vw;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.18);z-index:9990;display:flex;flex-direction:column;border-left:3px solid var(--accent,#c9a96e);">
    <!-- 패널 헤더 -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px 10px;background:linear-gradient(135deg,#fff8f0,#fff3e0);border-bottom:1px solid #eee;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;">🌐</span>
        <span style="font-size:14px;font-weight:700;color:#333;">API 로그 (FO)</span>
        <span style="font-size:11px;background:#f5f5f5;border-radius:10px;padding:1px 7px;color:#888;">{{ foApiLogs.length }}/15</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button @click="clearFoApiLogs" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;color:#999;">지우기</button>
        <button @click="showApiLog=false" style="width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.08);cursor:pointer;color:#666;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
    </div>
    <!-- 선택된 로그 상세 -->
    <div v-if="apiLogLockedDetail" style="padding:10px 12px;background:#fffbf0;border-bottom:2px solid var(--accent,#c9a96e);flex-shrink:0;max-height:260px;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:#888;">상세 보기</span>
        <button @click="apiLogLockedDetail=null" style="font-size:10px;padding:1px 6px;border:1px solid #ddd;border-radius:3px;background:#fff;cursor:pointer;color:#aaa;">닫기</button>
      </div>
      <div style="font-size:11px;color:#555;line-height:1.6;">
        <div style="margin-bottom:4px;">
          <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;margin-right:4px;" :style="foApiLogMethodStyle(apiLogLockedDetail.method)">{{ apiLogLockedDetail.method }}</span>
          <span style="color:#1a5276;word-break:break-all;">{{ apiLogLockedDetail.url }}</span>
          <span style="margin-left:6px;font-weight:700;" :style="foApiLogStatusClass(apiLogLockedDetail.status)">{{ apiLogLockedDetail.status }}</span>
          <span v-if="apiLogLockedDetail.duration" style="margin-left:6px;color:#aaa;font-size:10px;">{{ apiLogLockedDetail.duration }}ms</span>
        </div>
        <div v-if="apiLogLockedDetail.uiLabel" style="color:#7d3c98;margin-bottom:4px;font-size:10px;">{{ apiLogLockedDetail.uiLabel }}</div>
        <div v-if="apiLogLockedDetail.ts" style="color:#aaa;font-size:10px;margin-bottom:4px;">{{ apiLogLockedDetail.ts }}</div>
        <div v-if="apiLogLockedDetail.detail" style="margin-top:4px;">
          <div style="font-size:10px;color:#888;margin-bottom:2px;">응답 데이터</div>
          <pre style="margin:0;padding:6px;background:#f8f9fa;border-radius:4px;font-size:10px;color:#333;white-space:pre-wrap;word-break:break-all;max-height:100px;overflow-y:auto;">{{ apiLogLockedDetail.detail }}</pre>
        </div>
        <div v-if="apiLogLockedDetail.reqHeaders && apiLogLockedDetail.reqHeaders.length" style="margin-top:4px;">
          <div style="font-size:10px;color:#888;margin-bottom:2px;">요청 헤더</div>
          <pre style="margin:0;padding:6px;background:#f0f8ff;border-radius:4px;font-size:10px;color:#1a5276;white-space:pre-wrap;word-break:break-all;max-height:80px;overflow-y:auto;">{{ (apiLogLockedDetail.reqHeaders||[]).join(String.fromCharCode(10)) }}</pre>
        </div>
        <div v-if="apiLogLockedDetail.resHeaders && apiLogLockedDetail.resHeaders.length" style="margin-top:4px;">
          <div style="font-size:10px;color:#888;margin-bottom:2px;">응답 헤더</div>
          <pre style="margin:0;padding:6px;background:#f0fff0;border-radius:4px;font-size:10px;color:#1e8449;white-space:pre-wrap;word-break:break-all;max-height:80px;overflow-y:auto;">{{ (apiLogLockedDetail.resHeaders||[]).join(String.fromCharCode(10)) }}</pre>
        </div>
      </div>
    </div>
    <!-- 로그 목록 -->
    <div style="flex:1;overflow-y:auto;padding:6px 0;">
      <div v-if="!foApiLogs.length" style="padding:24px;text-align:center;color:#ccc;font-size:13px;">API 호출 기록이 없습니다</div>
      <div v-for="log in foApiLogs" :key="log._seq"
        @click="apiLogLockedDetail = apiLogLockedDetail && apiLogLockedDetail._seq===log._seq ? null : log"
        @mouseenter="apiLogHoverDetail=log" @mouseleave="apiLogHoverDetail=null"
        style="padding:7px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .12s;"
        :style="(apiLogLockedDetail && apiLogLockedDetail._seq===log._seq)?'background:#fffbf0;':log._isErr?'background:#fff5f5;':'background:#fff;'">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:700;flex-shrink:0;" :style="foApiLogMethodStyle(log.method)">{{ log.method || '-' }}</span>
          <span style="font-size:11px;color:#1a5276;word-break:break-all;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="log.url">{{ log.url }}</span>
          <span style="font-size:11px;font-weight:700;flex-shrink:0;" :style="foApiLogStatusClass(log.status)">{{ log.status }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span v-if="log.uiLabel" style="font-size:10px;color:#7d3c98;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">{{ log.uiLabel }}</span>
          <span v-else style="flex:1;"></span>
          <span v-if="log.duration" style="font-size:10px;color:#aaa;flex-shrink:0;">{{ log.duration }}ms</span>
          <span style="font-size:10px;color:#ccc;flex-shrink:0;">{{ log.ts ? log.ts.slice(11,19) : '' }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- CONFIRM MODAL -->
  <div v-if="confirmState.show" class="modal-overlay" @click.self="closeConfirm(false)">
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
  })
  /* ── layout/ ── */
  .component('FoAppHeader',   window.foAppHeader)
  .component('FoAppSidebar',  window.foAppSidebar)
  .component('FoAppFooter',   window.foAppFooter)
  /* ── pages/base/ ── */
  .component('FoError404',    window.foError404)
  .component('FoError401',    window.foError401)
  .component('FoError500',    window.foError500)
  /* ── pages/ (사용자 페이스 - FO_SITE_NO 기준 동적) ── */
  .component('Home'+window.FO_SITE_NO,        window['Home'+window.FO_SITE_NO])
  .component('Prod'+window.FO_SITE_NO+'List', window['Prod'+window.FO_SITE_NO+'List'])
  .component('Prod'+window.FO_SITE_NO+'View', window['Prod'+window.FO_SITE_NO+'View'])
  .component('Cart',         window.Cart)
  .component('Order',        window.Order)
  .component('Contact',      window.Contact)
  .component('Faq',          window.Faq)
  .component('Login',        window.Login)
  .component('EventPage',    window.EventPage)
  .component('EventView',    window.EventView)
  .component('BlogPage',     window.Blog)
  .component('BlogView',     window.BlogView)
  .component('BlogEdit',     window.BlogEdit)
  .component('LikePage',     window.Like)
  .component('LocationPage', window.Location)
  .component('AboutPage',    window.About)
  /* ── pages/fo/my/ (마이페이지) ── */
  .component('MyDateFilter', window.MyDateFilter)
  .component('MyOrder',      window.MyOrder)
  .component('MyClaim',      window.MyClaim)
  .component('MyCoupon',     window.MyCoupon)
  .component('MyCache',      window.MyCache)
  .component('MyContact',    window.MyContact)
  .component('MyChatt',      window.MyChatt)
  /* ── components/disp/ (전시 컴포넌트) ── */
  .component('DispX04Widget', window.DispX04Widget)
  /* ── pages/fo/xd/ (전시 UI 데모) — 스크립트 미로드 시 건너뜀 ── */
  /* ── pages/fo/xs/ (샘플) — 스크립트 미로드 시 건너뜀 ── */
  /* ── components/comp/ (공통 컴포넌트) ── */
  .component('CoBarcodeWidget',  window.CoBarcodeWidget  || { template: '<div/>' })
  .component('CoCountdownWidget', window.CoCountdownWidget || { template: '<div/>' })
  .component('BaseAttachGrp', window.BaseAttachGrp)
  /* ── components/modals/ — 상세 모달 ── */
  .component('CustomerModal',        window.CustomerModal)
  .component('OrderDetailModal',     window.OrderDetailModal)
  .component('ProductModal',         window.ProductModal)
  /* ── components/modals/ — 선택 모달 ── */
  .component('BoUserSelectModal', window.BoUserSelectModal)
  .component('BbmSelectModal',       window.BbmSelectModal)
  .component('CategorySelectModal',  window.CategorySelectModal)
  .component('MemberSelectModal',    window.MemberSelectModal)
  .component('OrderSelectModal',     window.OrderSelectModal)
  .component('SiteSelectModal',      window.SiteSelectModal)
  .component('VendorSelectModal',    window.VendorSelectModal)
  /* ── components/modals/ — 트리 모달 ── */
  .component('CategoryTreeModal',    window.CategoryTreeModal)
  .component('DeptTreeModal',        window.DeptTreeModal)
  .component('MenuTreeModal',        window.MenuTreeModal)
  .component('RoleTreeModal',        window.RoleTreeModal)
  /* ── components/modals/ — 미리보기/전송 모달 ── */
  .component('DispPreviewModal',     window.DispPreviewModal)
  .component('TemplatePreviewModal', window.TemplatePreviewModal)
  .component('TemplateSendModal',    window.TemplateSendModal);

  /* ■■■ disp 공통 컴포넌트 등록 ■■■ */
  ['DispX01Ui','DispX02Area','DispX03Panel','DispX04Widget'].forEach(name => {
    if (window[name]) app.component(name, window[name]);
  });
  /* ■■■ xd/DispUi* — 스크립트 태그 주석처리해도 에러 없이 동작 ■■■ */
  ['DispUi01','DispUi02','DispUi03','DispUi04','DispUi05','DispUi06',
  ].forEach(name => { if (window[name]) app.component('Xd'+name, window[name]); });
  /* ■■■ xs/Sample* — 스크립트 태그 주석처리해도 에러 없이 동작 ■■■ */
  ['XsSample01','XsSample02','XsSample03','XsSample04','XsSample05','XsSample06','XsSample07',
   'XsSample08','XsSample09','XsSample10','XsSample11','XsSample12','XsSample13','XsSample14',
   'XsSample21','XsSample22','XsSample23',
  ].forEach(name => { if (window[name]) app.component(name, window[name]); });
  /* ■■■ xs/ 개발도구 ■■■ */
  if (window.XsStore) app.component('XsStore', window.XsStore);
  if (window.XsLocalStorage) app.component('XsLocalStorage', window.XsLocalStorage);

  /* 페이지 ID 헬퍼 — 모든 템플릿에서 'home' 등으로 접근 가능 */
  window.perfUtil?.start('FO 앱 시작');
  const recordVueMountFo = window.perfUtil?.recordVueMount();
  app.use(pinia).mount('#app');

  /* 성능 측정 */
  setTimeout(() => {
    recordVueMountFo?.();
    window.perfUtil?.end('FO 앱 시작');
  }, 100);
})();
