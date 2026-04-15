/* ============================================
   ShopJoy - Vue 3 SPA (의류 쇼핑몰)
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, computed, watch, onBeforeUnmount } = Vue;

  /* ── Pinia 생성 및 Auth 초기화 ── */
  const pinia = Pinia.createPinia();
  window.frontAuth.init(pinia);

  const app = createApp({
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modu-front-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('modu-front-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const errorMessage = ref('');
    /* API 에러 → 오류 페이지 이동 (baseAxios 계열에서 window dispatchEvent 호출) */
    window.addEventListener('api-error', (ev) => {
      const d = ev.detail || {};
      const st = d.status;
      if (st === 401) { errorMessage.value = d.message || ''; page.value = 'error401'; }
      else if (st >= 500 || st === 0) { errorMessage.value = d.message || ''; page.value = 'error500'; }
    });
    const sidebarOpen = ref(true);
    const mobileOpen  = ref(false);
    let replaceNextHash = false;

    const closeMobileMenu = () => {
      mobileOpen.value = false;
    };
    const toggleMobileMenu = () => {
      if (mobileOpen.value) {
        mobileOpen.value = false;
      } else {
        if (window.innerWidth < 1024) sidebarOpen.value = true;
        mobileOpen.value = true;
      }
    };

    /* ── 바로구매 즉시주문 상태 (장바구니와 독립) ── */
    const instantOrder = ref(null);
    /* ── 장바구니 선택 주문 (cartIds) ── */
    const cartIds = ref(null);
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
      if (!prodId) return null;
      const product = products.find(p => Number(p.productId) === prodId);
      if (!product) return null;
      const opt1Nm = params.get('opt1Nm') || '';
      const color  = product.opt1s?.find(c => c.name === opt1Nm) || null;
      const size   = params.get('opt2Id') || null;
      const qty    = Math.max(1, Number(params.get('qty')) || 1);
      return { product, color, size, qty };
    };

    const navigate = (id, opts = {}) => {
      if (opts && opts.replace) replaceNextHash = true;
      if (opts && opts.instantOrder !== undefined) instantOrder.value = opts.instantOrder;
      else if (id !== 'order') instantOrder.value = null;
      if (opts && opts.cartIds !== undefined) cartIds.value = opts.cartIds;
      else if (id !== 'order') cartIds.value = null;
      if (opts && opts.editId !== undefined) viewEditId.value = opts.editId;
      else if (opts && opts.eventId !== undefined) viewEditId.value = opts.eventId;
      else viewEditId.value = null;
      if (mobileOpen.value) mobileOpen.value = false;
      page.value = id;
      window.scrollTo(0, 0);
      try { document.querySelector('.layout-main')?.scrollTo(0, 0); } catch (e) {}
    };
    window.addEventListener('resize', () => { if (window.innerWidth < 1024) mobileOpen.value = false; });

    /* ── Toast ── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    };

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
    const products = window.SITE_CONFIG.products;
    products.forEach(_assignImg);
    const selectedProduct = ref(products[0]);
    const selectProduct = p => {
      selectedProduct.value = p;
      navigate('prodView');
    };

    /* ── Likes (좋아요/위시리스트) ── */
    const likes = ref(new Set());
    try {
      const savedLikes = localStorage.getItem('shopjoy_likes');
      if (savedLikes) likes.value = new Set(JSON.parse(savedLikes));
    } catch (e) {}
    const saveLikes = () => { try { localStorage.setItem('shopjoy_likes', JSON.stringify([...likes.value])); } catch (e) {} };
    const toggleLike = (productId) => {
      const s = new Set(likes.value);
      if (s.has(productId)) s.delete(productId); else s.add(productId);
      likes.value = s;
      saveLikes();
    };
    const isLiked = (productId) => likes.value.has(productId);
    const likeCount = computed(() => likes.value.size);

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
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            const p = products.find(x => x.productId === item.productId);
            if (p && item.color && item.size) {
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

    const cartCount = computed(() => cart.reduce((s, i) => s + i.qty, 0));

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
    const auth = window.frontAuth.state;
    const showLogin = ref(false);
    const onShowLogin = () => { showLogin.value = true; };
    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const onLogout = () => {
      window.frontAuth.logout();
      showToast('로그아웃되었습니다.', 'info');
      if (MY_PAGES.includes(page.value)) page.value = 'home';
    };
    /* modu-front-token 삭제(DevTools 등) 감지 → 자동 로그아웃 처리 */
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
      'error401','error404','error500'];
    try {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      const hasPageParam = rawHash.includes('page=');
      const params = hasPageParam ? new URLSearchParams(rawHash) : null;
      const isMyPage = p => ['myOrder','myClaim','myCoupon','myCache','myContact','myChatt'].includes(p);
      const isLoggedIn = !!(localStorage.getItem('modu-front-token'));
      if (hasPageParam) {
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage) && (!isMyPage(hPage) || isLoggedIn)) page.value = hPage;
        else if (hPage && !validPages.includes(hPage)) page.value = 'notFound';
      }
      /* 바로구매 URL 파라미터 복원 */
      if (page.value === 'order' && hasPageParam) {
        instantOrder.value = _instantOrderFromParams(params);
        const cids = params.get('cartIds');
        if (cids) cartIds.value = cids.split(',').filter(Boolean);
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
      if (!Number.isNaN(pid)) {
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
          cartIds.value = cids ? cids.split(',').filter(Boolean) : null;
        } else if (hPage && hPage !== 'order') {
          instantOrder.value = null;
          cartIds.value = null;
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
      if (id === 'order' && cartIds.value?.length) {
        params.set('cartIds', cartIds.value.join(','));
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

    /* FRONT_SITE_NO 기준 동적 컴포넌트 참조 */
    const _N = window.FRONT_SITE_NO;
    const frontHomeComp     = window['Home' + _N];
    const frontProdListComp = window['Prod' + _N + 'List'];
    const frontProdViewComp = window['Prod' + _N + 'View'];

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      products, selectedProduct, selectProduct,
      cart, cartCount, addToCart, removeFromCart, updateCartQty, clearCart,
      likes, toggleLike, isLiked, likeCount,
      instantOrder, cartIds, viewEditId,
      config: window.SITE_CONFIG,
      auth, showLogin, onShowLogin, onLogout,
      frontHomeComp, frontProdListComp, frontProdViewComp,
      notFoundPageId: computed(() => {
        try { return new URLSearchParams(String(window.location.hash || '').replace(/^#/, '')).get('page') || ''; } catch(e) { return ''; }
      }),
      errorMessage,
    };
  },

  template: /* html */ `
<div style="height:100%;min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <front-app-header
    :page="page" :theme="theme" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
    :config="config" :navigate="navigate" :toggle-theme="toggleTheme" :cart-count="cartCount" :like-count="likeCount"
    :auth="auth" :on-show-login="onShowLogin" :on-logout="onLogout"
    @toggle-sidebar="sidebarOpen=!sidebarOpen" @toggle-mobile="toggleMobileMenu"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <front-app-sidebar
      :page="page" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
      :config="config" :navigate="navigate" :cart-count="cartCount" :auth="auth"
      @toggle-sidebar="sidebarOpen=!sidebarOpen" @close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <component :is="frontHomeComp"
        v-if="page === 'home'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <component :is="frontProdListComp"
        v-else-if="page === 'prodList'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <component :is="frontProdViewComp"
        v-else-if="page === 'prodView'"
        :navigate="navigate" :config="config" :product="selectedProduct"
        :add-to-cart="addToCart" :show-toast="showToast" :show-alert="showAlert"
        :toggle-like="toggleLike" :is-liked="isLiked"
      />
      <cart
        v-else-if="page==='cart'"
        :navigate="navigate" :config="config" :cart="cart" :cart-count="cartCount"
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
        :cart="cart" :cart-count="cartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
        :remove-from-cart="removeFromCart" :update-cart-qty="updateCartQty"
      />
      <my-claim
        v-else-if="page==='myClaim'"
        :navigate="navigate" :config="config" :cart-count="cartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
      />
      <my-coupon
        v-else-if="page==='myCoupon'"
        :navigate="navigate" :cart-count="cartCount" :show-toast="showToast"
      />
      <my-cache
        v-else-if="page==='myCache'"
        :navigate="navigate" :cart-count="cartCount" :show-toast="showToast"
      />
      <my-contact
        v-else-if="page==='myContact'"
        :navigate="navigate" :cart-count="cartCount"
        :show-toast="showToast" :show-confirm="showConfirm"
      />
      <my-chatt
        v-else-if="page==='myChatt'"
        :navigate="navigate" :cart-count="cartCount"
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

      <!-- Error Pages -->
      <front-error-401 v-else-if="page==='error401'" :navigate="navigate" />
      <front-error-500 v-else-if="page==='error500'" :navigate="navigate" :message="errorMessage" />
      <front-error-404 v-else-if="page==='notFound' || page==='error404'" :navigate="navigate" :page-id="notFoundPageId" />

      <front-app-footer :config="config" :navigate="navigate" />
    </main>
  </div>

  <!-- LOGIN MODAL -->
  <login v-if="showLogin" :show-toast="showToast" @close="showLogin=false" />

  <!-- TOAST -->
  <div v-if="toast.show" class="toast-wrap" :class="'toast-'+toast.type">
    <span class="toast-icon">{{ toast.type==='success'?'✅':toast.type==='error'?'❌':toast.type==='warning'?'⚠️':'ℹ️' }}</span>
    <span class="toast-msg">{{ toast.msg }}</span>
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
  .component('FrontAppHeader',   window.frontAppHeader)
  .component('FrontAppSidebar',  window.frontAppSidebar)
  .component('FrontAppFooter',   window.frontAppFooter)
  /* ── pages/base/ ── */
  .component('FrontError404',    window.frontError404)
  .component('FrontError401',    window.frontError401)
  .component('FrontError500',    window.frontError500)
  /* ── pages/ (사용자 페이스 - FRONT_SITE_NO 기준 동적) ── */
  .component('Home'+window.FRONT_SITE_NO,        window['Home'+window.FRONT_SITE_NO])
  .component('Prod'+window.FRONT_SITE_NO+'List', window['Prod'+window.FRONT_SITE_NO+'List'])
  .component('Prod'+window.FRONT_SITE_NO+'View', window['Prod'+window.FRONT_SITE_NO+'View'])
  .component('Cart',         window.Cart)
  .component('Order',        window.Order)
  .component('Contact',      window.Contact)
  .component('Faq',          window.Faq)
  .component('Login',        window.Login)
  .component('EventPage',    window.Event)
  .component('EventView',    window.EventView)
  .component('BlogPage',     window.Blog)
  .component('BlogView',     window.BlogView)
  .component('BlogEdit',     window.BlogEdit)
  .component('LikePage',     window.Like)
  .component('LocationPage', window.Location)
  .component('AboutPage',    window.About)
  /* ── pages/my/ (마이페이지) ── */
  .component('MyDateFilter', window.MyDateFilter)
  .component('MyOrder',      window.MyOrder)
  .component('MyClaim',      window.MyClaim)
  .component('MyCoupon',     window.MyCoupon)
  .component('MyCache',      window.MyCache)
  .component('MyContact',    window.MyContact)
  .component('MyChatt',      window.MyChatt)
  /* ── components/disp/ (전시 컴포넌트) ── */
  .component('DispX04Widget', window.DispX04Widget)
  /* ── pages/xd/ (전시 UI 데모) — 스크립트 미로드 시 건너뜀 ── */
  /* ── pages/xs/ (샘플) — 스크립트 미로드 시 건너뜀 ── */
  /* ── components/comp/ (공통 컴포넌트) ── */
  .component('BaseAttachGrp', window.BaseAttachGrp)
  /* ── components/modals/ — 상세 모달 ── */
  .component('CustomerModal',        window.CustomerModal)
  .component('OrderDetailModal',     window.OrderDetailModal)
  .component('ProductModal',         window.ProductModal)
  /* ── components/modals/ — 선택 모달 ── */
  .component('AdminUserSelectModal', window.AdminUserSelectModal)
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

  /* 페이지 ID 헬퍼 — 모든 템플릿에서 'home' 등으로 접근 가능 */
  app.use(pinia).mount('#app');
})();
