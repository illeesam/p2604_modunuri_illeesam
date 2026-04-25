/* ============================================
   ShopJoy - FO Vue 3 SPA (의류 쇼핑몰)
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

  /* ── Pinia 생성 및 Auth 초기화 ── */
  const pinia = Pinia.createPinia();
  window.foAuth.init(pinia);

  const app = createApp({
  setup() {
    /* ── Init Data Store 초기화 (Pinia 초기화 후) ── */
    onMounted(() => {
      setTimeout(() => {
        // fetchFoAppInitData는 foAuth.js init()에서 토큰 유무에 따라 호출
        window.useFoAppInitStore?.()?.sfRestoreFromStorage?.();
      }, 0);
    });
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modu-fo-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('modu-fo-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const errorMessage = ref('');
    /* API Validation 에러 → toast 출력 (foAxios 에서 window.dispatchEvent('api-validation-error')) */
    window.addEventListener('api-validation-error', (ev) => {
      const d = ev.detail || {};
      let msg = d.message || '오류가 발생했습니다.';
      if (d.method && d.url && d.status) {
        msg = `${d.method} ${d.url} ${d.status}\n${msg}`;
      }
      showToast(msg, 'error', 0, d.errorDetails || '');
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
      if (st === 401) { errorMessage.value = d.message || ''; page.value = 'error401'; }
      else if (st >= 500 || st === 0) { errorMessage.value = d.message || ''; page.value = 'error500'; }
    });
    const sidebarOpen = ref(true);
    const uiState = reactive({ mobileOpen: false, showLogin: false });
    let replaceNextHash = false;

    const closeMobileMenu = () => {
      uiState.mobileOpen = false;
    };
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
    /* ── 서브페이지 editId (이벤트상세, 블로그상세/수정 등) ── */
    const viewEditId = ref(null);

    /* instantOrder → URL 해시 파라미터 변환 */
    const _instantOrderToParams = (io) => {
      if (!io) return {};
      return {
        prodId: io.product?.productId ?? '',
        opt1Nm: io.color?.name        ?? '',   // 색상명 (colorId 없으므로 name 사용)
        opt2Id: io.size               ?? '',
        qty:    io.qty                ?? 1,
      };
    };

    /* URL 해시 파라미터 → instantOrder 재구성 */
    const _instantOrderFromParams = (params) => {
      const prodId = Number(params.get('prodId'));
      if (!prodId || !Array.isArray(products)) return null;
      const product = products.find(p => Number(p.productId) === prodId);
      if (!product) return null;
      const opt1Nm = params.get('opt1Nm') || '';
      const color  = Array.isArray(product.opt1s) ? product.opt1s.find(c => c.name === opt1Nm) || null : null;
      const size   = params.get('opt2Id') || null;
      const qty    = Math.max(1, Number(params.get('qty')) || 1);
      return { product, color, size, qty };
    };

    const navigate = (id, opts = {}) => {
      if (opts && opts.replace) replaceNextHash = true;
      if (opts && opts.instantOrder !== undefined) instantOrder.value = opts.instantOrder;
      else if (id !== 'order') instantOrder.value = null;
      if (opts && opts.cartIds !== undefined) {
        cartIds.splice(0, cartIds.length, ...(Array.isArray(opts.cartIds) ? opts.cartIds : []));
      } else if (id !== 'order') {
        cartIds.splice(0, cartIds.length);
      }
      if (opts && opts.editId !== undefined) viewEditId.value = opts.editId;
      else if (opts && opts.eventId !== undefined) viewEditId.value = opts.eventId;
      else viewEditId.value = null;
      if (uiState.mobileOpen) uiState.mobileOpen = false;
      page.value = id;
      window.scrollTo(0, 0);
      try { document.querySelector('.layout-main')?.scrollTo(0, 0); } catch (e) {}
    };
    window.addEventListener('resize', () => { if (window.innerWidth < 1024) uiState.mobileOpen = false; });

    /* ── Toast (누적 스택) ── */
    const toasts = reactive([]);
    let _toastSeq = 0;
    const FO_TOAST_DETAIL_KEY = 'modu-fo-toast-isShowDetail';
    const toastShowDetail = ref(localStorage.getItem(FO_TOAST_DETAIL_KEY) !== 'false');
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
      const t = { id, msg, msgTitle, msgDetail, type, detail, expanded, persistent: autoDismiss === 0 };
      toasts.push(t);
      if (autoDismiss > 0) setTimeout(() => removeToast(id), autoDismiss);
    };
    const removeToast     = (id) => { const i = toasts.findIndex(t => t.id === id); if (i !== -1) toasts.splice(i, 1); };
    const removeAllToasts = () => { toasts.splice(0, toasts.length); };
    const toggleAllToastDetail = () => {
      toastShowDetail.value = !toastShowDetail.value;
      localStorage.setItem(FO_TOAST_DETAIL_KEY, toastShowDetail.value);
      toasts.forEach(t => { if (t.detail) t.expanded = toastShowDetail.value; });
    };
    const toggleToastDetail = (t) => { t.expanded = !t.expanded; };
    /* 하위 호환 */
    const toast = { show: false };

    /* ── Alert Modal ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Confirm Modal ── */
    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Products (이미지 자동 할당) ── */
    const _IMG = 'assets/cdn/prod/img/shop/product';
    const _assignImg = (p) => {
      /* colors→opt1s, sizes→opt2s 호환 */
      if (p.colors && !p.opt1s) { p.opt1s = p.colors; }
      if (p.sizes  && !p.opt2s) { p.opt2s = p.sizes; }
      /* 이미지 자동 할당 */
      if (!p.image) {
        const id = p.productId || 1;
        if (id <= 12) {
          p.image = `${_IMG}/fashion/fashion-${id}.webp`;
          p.images = [p.image, `${_IMG}/fashion/fashion-${((id % 12) + 1)}.webp`];
        } else {
          const n = ((id - 1) % 23) + 1;
          p.image = `${_IMG}/product_${n}.png`;
          p.images = [p.image, `${_IMG}/product_${(n % 23) + 1}.png`];
        }
      }
      /* priceNum 보정 */
      if (!p.priceNum && p.price) {
        p.priceNum = parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0;
      }
      return p;
    };
    const products = window.SITE_CONFIG?.products || [];
    if (Array.isArray(products)) products.forEach(_assignImg);
    const selectedProduct = ref(Array.isArray(products) && products.length > 0 ? products[0] : null);
    const selectProduct = p => {
      selectedProduct.value = p;
      navigate('prodView');
    };

    /* ── Likes (좋아요/위시리스트) ── */
    let likes = reactive(new Set());
    try {
      const savedLikes = localStorage.getItem('shopjoy_likes');
      if (savedLikes) likes = new Set(JSON.parse(savedLikes));
    } catch (e) {}
    const saveLikes = () => { try { localStorage.setItem('shopjoy_likes', JSON.stringify([...likes])); } catch (e) {} };
    const toggleLike = (productId) => {
      const s = new Set(likes);
      if (s.has(productId)) s.delete(productId); else s.add(productId);
      likes = s;
      saveLikes();
    };
    const isLiked = (productId) => likes.has(productId);
    const cfLikeCount = computed(() => likes.size);

    /* ── Cart ── */
    const cart = reactive([]);

    /* 임의 ID 생성: yymmddHHMMSS + rand4 */
    const genId = () => {
      const d = new Date();
      const pad = n => String(n).padStart(2,'0');
      return [d.getFullYear()%100,d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()].map(pad).join('')
        + Math.random().toString(36).slice(2,6).toUpperCase();
    };

    // 로컬스토리지에서 장바구니 복원
    try {
      const saved = localStorage.getItem('shopjoy_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && Array.isArray(products)) {
          parsed.forEach(item => {
            const p = products.find(x => x.productId === item.productId);
            if (p && item.color && item.size && Array.isArray(p.opt1s)) {
              const color = p.opt1s.find(c => c.name === item.color.name) || item.color;
              cart.push({ cartId: item.cartId || genId(), product: p, color, size: item.size, qty: item.qty || 1 });
            }
          });
        }
      }
    } catch (e) {}

    const saveCart = () => {
      try {
        localStorage.setItem('shopjoy_cart', JSON.stringify(
          cart.map(i => ({ cartId: i.cartId, productId: i.product.productId, color: i.color, size: i.size, qty: i.qty }))
        ));
      } catch (e) {}
    };

    const cfCartCount = computed(() => cart.reduce((s, i) => s + i.qty, 0));

    const addToCart = (product, color, size, qty = 1) => {
      const existing = cart.find(i =>
        i.product.productId === product.productId &&
        i.color.name === color.name &&
        i.size === size
      );
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ cartId: genId(), product, color, size, qty });
      }
      saveCart();
      showToast(`장바구니에 담았습니다! (${color.name} / ${size})`, 'success');
    };

    const removeFromCart = idx => {
      cart.splice(idx, 1);
      saveCart();
    };

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

    const clearCart = () => {
      cart.splice(0, cart.length);
      saveCart();
    };

    /* ── Auth ── */
    const auth = window.foAuth.state;
    const onShowLogin = () => { uiState.showLogin = true; };
    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const onLogout = () => {
      window.foAuth.logout();
      showToast('로그아웃되었습니다.', 'info');
      if (MY_PAGES.includes(page.value)) page.value = 'home';
    };
    /* modu-fo-accessToken 삭제(DevTools 등) 감지 → 자동 로그아웃 처리 */
    watch(() => auth.user, u => {
      if (!u && MY_PAGES.includes(page.value)) page.value = 'home';
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
        const hEditId  = params.get('editId');
        if (hEventId) viewEditId.value = Number(hEventId) || hEventId;
        else if (hEditId) viewEditId.value = Number(hEditId) || hEditId;
      }
      const hpid = hasPageParam ? params?.get('pid') : null;
      const pid = hpid !== null && hpid !== '' ? Number(hpid) : NaN;
      if (!Number.isNaN(pid) && Array.isArray(products)) {
        const f = products.find(x => Number(x.productId) === pid);
        if (f) selectedProduct.value = f;
      }
    } catch(e) {}
    restoring = false;

    let syncingFromHash = false;
    const onHashChange = () => {
      if (syncingFromHash) return;
      syncingFromHash = true;
      try {
        const rawHash = String(window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(rawHash);
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage)) page.value = hPage;
        else if (hPage && !validPages.includes(hPage)) page.value = 'notFound';
        if (hPage === 'order') {
          instantOrder.value = _instantOrderFromParams(params);
          const cids = params.get('cartIds');
          cartIds.splice(0, cartIds.length, ...(cids ? cids.split(',').filter(Boolean) : []));
        } else if (hPage && hPage !== 'order') {
          instantOrder.value = null;
          cartIds.splice(0, cartIds.length);
        }
        const hpid = params.get('pid');
        const pid = hpid !== null && hpid !== '' ? Number(hpid) : NaN;
        if (!Number.isNaN(pid)) {
          const f = products.find(x => Number(x.productId) === pid);
          if (f) selectedProduct.value = f;
        }
        const hEventId = params.get('eventId');
        const hEditId  = params.get('editId');
        if (hEventId) viewEditId.value = Number(hEventId) || hEventId;
        else if (hEditId) viewEditId.value = Number(hEditId) || hEditId;
      } catch(e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    };
    window.addEventListener('hashchange', onHashChange);

    watch(page, id => {
      if (restoring || syncingFromHash) return;
      const params = new URLSearchParams();
      params.set('page', page.value);
      if (id === 'prodView') {
        params.set('pid', selectedProduct.value?.productId ?? '');
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
        params.set('editId', viewEditId.value);
      }
      const hash = params.toString();
      const url = window.location.pathname + window.location.search + '#' + hash;
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
        if (page.value === 'prodView') pr.set('pid', String(selectedProduct.value?.productId ?? ''));
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

    return {
      theme, toggleTheme,
      page, sidebarOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toasts, showToast, removeToast, removeAllToasts, toggleToastDetail, toggleAllToastDetail, toastShowDetail, toast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      products, selectedProduct, selectProduct,
      cart, cfCartCount, addToCart, removeFromCart, updateCartQty, clearCart,
      likes, toggleLike, isLiked, cfLikeCount,
      instantOrder, cartIds, viewEditId,
      config: window.SITE_CONFIG,
      auth, uiState, onShowLogin, onLogout,
      foHomeComp, foProdListComp, foProdViewComp,
      notFoundPageId: computed(() => {
        try { return new URLSearchParams(String(window.location.hash || '').replace(/^#/, '')).get('page') || ''; } catch(e) { return ''; }
      }),
      errorMessage,
      safe: window.safeUtil,
    };
  },

  template: /* html */ `
<div style="height:100%;min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <fo-app-header
    :page="page" :theme="theme" :sidebar-open="sidebarOpen" :mobile-open="uiState.mobileOpen"
    :config="config" :navigate="navigate" :toggle-theme="toggleTheme" :cart-count="cfCartCount" :like-count="cfLikeCount"
    :auth="auth" :on-show-login="onShowLogin" :on-logout="onLogout"
    @toggle-sidebar="sidebarOpen=!sidebarOpen" @toggle-mobile="toggleMobileMenu"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <fo-app-sidebar
      :page="page" :sidebar-open="sidebarOpen" :mobile-open="uiState.mobileOpen"
      :config="config" :navigate="navigate" :cart-count="cfCartCount" :auth="auth"
      @toggle-sidebar="sidebarOpen=!sidebarOpen" @close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: uiState.mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <component :is="foHomeComp"
        v-if="page === 'home'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <component :is="foProdListComp"
        v-else-if="page === 'prodList'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <component :is="foProdViewComp"
        v-else-if="page === 'prodView'"
        :navigate="navigate" :config="config" :product="selectedProduct"
        :add-to-cart="addToCart" :show-toast="showToast" :show-alert="showAlert"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <cart
        v-else-if="page==='cart'"
        :navigate="navigate" :config="config" :cart="cart" :cart-count="cfCartCount"
        :remove-from-cart="removeFromCart" :update-cart-qty="updateCartQty"
        :show-confirm="showConfirm" :clear-cart="clearCart"
      />
      <order
        v-else-if="page==='order'"
        :navigate="navigate" :config="config" :cart="cart"
        :instant-order="instantOrder" :cart-ids="cartIds"
        :show-toast="showToast" :show-alert="showAlert" :clear-cart="clearCart"
      />
      <contact
        v-else-if="page==='contact'"
        :navigate="navigate" :config="config" :show-toast="showToast" :show-alert="showAlert"
      />
      <faq
        v-else-if="page==='faq'"
        :navigate="navigate" :config="config"
      />
      <event-page
        v-else-if="page==='event'"
        :navigate="navigate" :config="config"
      />
      <event-view
        v-else-if="page==='eventView'"
        :navigate="navigate" :config="config" :edit-id="viewEditId"
      />
      <blog-page
        v-else-if="page==='blog'"
        :navigate="navigate" :config="config"
      />
      <blog-view
        v-else-if="page==='blogView'"
        :navigate="navigate" :config="config" :edit-id="viewEditId"
      />
      <blog-edit
        v-else-if="page==='blogEdit'"
        :navigate="navigate" :config="config" :edit-id="viewEditId" :show-toast="showToast"
      />
      <like-page
        v-else-if="page==='like'"
        :navigate="navigate" :config="config" :products="products"
        :likes="likes" :toggle-like="toggleLike" :select-product="selectProduct"
      />
      <location-page
        v-else-if="page==='location'"
        :navigate="navigate" :config="config"
      />
      <about-page
        v-else-if="page==='about'"
        :navigate="navigate" :config="config"
      />
      <my-order
        v-else-if="page==='myOrder'"
        :navigate="navigate" :config="config"
        :cart="cart" :cart-count="cfCartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
        :remove-from-cart="removeFromCart" :update-cart-qty="updateCartQty"
      />
      <my-claim
        v-else-if="page==='myClaim'"
        :navigate="navigate" :config="config" :cart-count="cfCartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
      />
      <my-coupon
        v-else-if="page==='myCoupon'"
        :navigate="navigate" :cart-count="cfCartCount" :show-toast="showToast"
      />
      <my-cache
        v-else-if="page==='myCache'"
        :navigate="navigate" :cart-count="cfCartCount" :show-toast="showToast"
      />
      <my-contact
        v-else-if="page==='myContact'"
        :navigate="navigate" :cart-count="cfCartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
      />
      <my-chatt
        v-else-if="page==='myChatt'"
        :navigate="navigate" :cart-count="cfCartCount"
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
    </main>
  </div>

  <!-- LOGIN MODAL -->
  <login v-if="uiState.showLogin" :show-toast="showToast" @close="uiState.showLogin=false" />

  <!-- TOAST STACK -->
  <div v-if="toasts.length" style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:6px;max-width:420px;min-width:300px;">
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
        style="height:3px;width:100%;background:linear-gradient(to right,#e74c3c,transparent);animation:fo-toast-progress linear forwards;"
        :style="t.type==='success'?'background:linear-gradient(to right,#27ae60,transparent);':t.type==='info'?'background:linear-gradient(to right,#2980b9,transparent);':t.type==='warning'?'background:linear-gradient(to right,#f39c12,transparent);':'background:linear-gradient(to right,#e74c3c,transparent);'">
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
  <style>
  @keyframes fo-toast-progress {
    from { transform: scaleX(1); transform-origin: left; }
    to   { transform: scaleX(0); transform-origin: left; }
  }
  </style>

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
