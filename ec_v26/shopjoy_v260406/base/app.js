/* ============================================
   ShopJoy - Vue 3 SPA (의류 쇼핑몰)
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, computed, watch, onBeforeUnmount } = Vue;

  /* ── Pinia 생성 및 Auth 초기화 ── */
  const pinia = Pinia.createPinia();
  window.shopjoyAuth.init(pinia);

  createApp({
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('shopjoy-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('shopjoy-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
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

    const navigate = (id, opts = {}) => {
      if (opts && opts.replace) replaceNextHash = true;
      if (mobileOpen.value) mobileOpen.value = false;
      page.value = id;
      window.scrollTo(0, 0);
      try { sessionStorage.setItem('shopjoy_page', id); } catch (e) {}
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

    /* ── Products ── */
    const products = window.SITE_CONFIG.products;
    const selectedProduct = ref(products[0]);
    const selectProduct = p => {
      selectedProduct.value = p;
      if (p && p.productId != null) try { sessionStorage.setItem('shopjoy_pid', String(p.productId)); } catch (e) {}
      navigate('detail');
    };

    /* ── Cart ── */
    const cart = reactive([]);

    // 로컬스토리지에서 장바구니 복원
    try {
      const saved = localStorage.getItem('shopjoy_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            const p = products.find(x => x.productId === item.productId);
            if (p && item.color && item.size) {
              const color = p.colors.find(c => c.name === item.color.name) || item.color;
              cart.push({ product: p, color, size: item.size, qty: item.qty || 1 });
            }
          });
        }
      }
    } catch (e) {}

    const saveCart = () => {
      try {
        localStorage.setItem('shopjoy_cart', JSON.stringify(
          cart.map(i => ({ productId: i.product.productId, color: i.color, size: i.size, qty: i.qty }))
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
        cart.push({ product, color, size, qty });
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
    const auth = window.shopjoyAuth.state;
    const showLogin = ref(false);
    const onShowLogin = () => { showLogin.value = true; };
    const MY_PAGES = ['myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt'];
    const onLogout = () => {
      window.shopjoyAuth.logout();
      showToast('로그아웃되었습니다.', 'info');
      if (MY_PAGES.includes(page.value)) page.value = 'home';
    };
    /* shopjoy_token 삭제(DevTools 등) 감지 → 자동 로그아웃 처리 */
    watch(() => auth.user, u => {
      if (!u && MY_PAGES.includes(page.value)) page.value = 'home';
    });

    /* ── URL state ── */
    let restoring = true;
    const validPages = ['home', 'products', 'detail', 'cart', 'order', 'contact', 'faq', 'location', 'about',
      'myOrder', 'myClaim', 'myCoupon', 'myCache', 'myContact', 'myChatt',
      'dispUi01', 'dispUi02', 'dispUi03', 'dispUi04', 'dispUi05', 'dispUi06',
      'sample01','sample02','sample03','sample04','sample05','sample06','sample07',
      'sample08','sample09','sample10','sample11','sample12','sample13','sample14',
      'sample21','sample22','sample23'];
    try {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      const hasPageParam = rawHash.includes('page=');
      const params = hasPageParam ? new URLSearchParams(rawHash) : null;
      const isMyPage = p => ['myOrder','myClaim','myCoupon','myCache','myContact','myChatt'].includes(p);
      const isLoggedIn = !!(localStorage.getItem('shopjoy_token'));
      if (hasPageParam) {
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage) && (!isMyPage(hPage) || isLoggedIn)) page.value = hPage;
      } else {
        try {
          const sp = sessionStorage.getItem('shopjoy_page');
          if (sp && validPages.includes(sp) && (!isMyPage(sp) || isLoggedIn)) page.value = sp;
        } catch (e) {}
      }
      const hpid = hasPageParam ? params?.get('pid') : null;
      const pid = hpid !== null && hpid !== '' ? Number(hpid) : NaN;
      if (!Number.isNaN(pid)) {
        const f = products.find(x => Number(x.productId) === pid);
        if (f) selectedProduct.value = f;
      } else {
        const s = Number(sessionStorage.getItem('shopjoy_pid'));
        if (!Number.isNaN(s)) {
          const f = products.find(x => Number(x.productId) === s);
          if (f) selectedProduct.value = f;
        }
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
        const hpid = params.get('pid');
        const pid = hpid !== null && hpid !== '' ? Number(hpid) : NaN;
        if (!Number.isNaN(pid)) {
          const f = products.find(x => Number(x.productId) === pid);
          if (f) selectedProduct.value = f;
        }
      } catch(e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    };
    window.addEventListener('hashchange', onHashChange);

    watch(page, id => {
      if (restoring || syncingFromHash) return;
      const params = new URLSearchParams();
      params.set('page', page.value);
      if (id === 'detail') {
        params.set('pid', selectedProduct.value?.productId ?? '');
        if (selectedProduct.value?.productId != null) sessionStorage.setItem('shopjoy_pid', String(selectedProduct.value.productId));
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
        if (page.value === 'detail') pr.set('pid', String(selectedProduct.value?.productId ?? ''));
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + pr.toString());
      }
    } catch (e) {}

    onBeforeUnmount(() => {
      window.removeEventListener('hashchange', onHashChange);
    });

    /* ── Loading done ── */
    const loadingEl = document.getElementById('vue-app-loading');
    if (loadingEl) {
      loadingEl.classList.add('vue-app-loading--done');
      setTimeout(() => { if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 500);
    }

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      products, selectedProduct, selectProduct,
      cart, cartCount, addToCart, removeFromCart, updateCartQty, clearCart,
      config: window.SITE_CONFIG,
      auth, showLogin, onShowLogin, onLogout,
    };
  },

  template: /* html */ `
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <app-header
    :page="page" :theme="theme" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
    :config="config" :navigate="navigate" :toggle-theme="toggleTheme" :cart-count="cartCount"
    :auth="auth" :on-show-login="onShowLogin" :on-logout="onLogout"
    @toggle-sidebar="sidebarOpen=!sidebarOpen" @toggle-mobile="toggleMobileMenu"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <app-sidebar
      :page="page" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
      :config="config" :navigate="navigate" :cart-count="cartCount" :auth="auth"
      @toggle-sidebar="sidebarOpen=!sidebarOpen" @close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <home
        v-if="page==='home'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
      />
      <products
        v-else-if="page==='products'"
        :navigate="navigate" :config="config" :products="products" :select-product="selectProduct"
      />
      <detail
        v-else-if="page==='detail'"
        :navigate="navigate" :config="config" :product="selectedProduct"
        :add-to-cart="addToCart" :show-toast="showToast" :show-alert="showAlert"
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
      <disp-ui01 v-else-if="page==='dispUi01'" />
      <disp-ui02 v-else-if="page==='dispUi02'" />
      <disp-ui03 v-else-if="page==='dispUi03'" />
      <disp-ui04 v-else-if="page==='dispUi04'" />
      <disp-ui05 v-else-if="page==='dispUi05'" />
      <disp-ui06 v-else-if="page==='dispUi06'" />
      <sample01 v-else-if="page==='sample01'" />
      <sample02 v-else-if="page==='sample02'" />
      <sample03 v-else-if="page==='sample03'" />
      <sample04 v-else-if="page==='sample04'" />
      <sample05 v-else-if="page==='sample05'" />
      <sample06 v-else-if="page==='sample06'" />
      <sample07 v-else-if="page==='sample07'" />
      <sample08 v-else-if="page==='sample08'" />
      <sample09 v-else-if="page==='sample09'" />
      <sample10 v-else-if="page==='sample10'" />
      <sample11 v-else-if="page==='sample11'" />
      <sample12 v-else-if="page==='sample12'" />
      <sample13 v-else-if="page==='sample13'" />
      <sample14 v-else-if="page==='sample14'" />
      <sample21 v-else-if="page==='sample21'" />
      <sample22 v-else-if="page==='sample22'" />
      <sample23 v-else-if="page==='sample23'" />

      <app-footer :config="config" :navigate="navigate" />
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
  .component('AppHeader',   window.AppHeader)
  .component('AppSidebar',  window.AppSidebar)
  .component('AppFooter',   window.AppFooter)
  .component('Home',    window.Home)
  .component('Products',window.Products)
  .component('Detail',  window.Detail)
  .component('Cart',    window.Cart)
  .component('Order',   window.Order)
  .component('Contact', window.Contact)
  .component('Faq',     window.Faq)
  .component('MyOrder',   window.MyOrder)
  .component('MyClaim',   window.MyClaim)
  .component('MyCoupon',  window.MyCoupon)
  .component('MyCache',   window.MyCache)
  .component('MyContact', window.MyContact)
  .component('MyChatt',   window.MyChatt)
  .component('Login',        window.Login)
  .component('LocationPage', window.Location)
  .component('AboutPage',    window.About)
  .component('DispWidget', window.DispWidget)
  .component('DispUi01', window.DispUi01)
  .component('DispUi02', window.DispUi02)
  .component('DispUi03', window.DispUi03)
  .component('DispUi04', window.DispUi04)
  .component('DispUi05', window.DispUi05)
  .component('DispUi06', window.DispUi06)
  .component('Sample01', window.Sample01)
  .component('Sample02', window.Sample02)
  .component('Sample03', window.Sample03)
  .component('Sample04', window.Sample04)
  .component('Sample05', window.Sample05)
  .component('Sample06', window.Sample06)
  .component('Sample07', window.Sample07)
  .component('Sample08', window.Sample08)
  .component('Sample09', window.Sample09)
  .component('Sample10', window.Sample10)
  .component('Sample11', window.Sample11)
  .component('Sample12', window.Sample12)
  .component('Sample13', window.Sample13)
  .component('Sample14', window.Sample14)
  .component('Sample21', window.Sample21)
  .component('Sample22', window.Sample22)
  .component('Sample23', window.Sample23)
  /* BaseModal 공통 컴포넌트 */
  .component('OrderDetailModal',    window.OrderDetailModal)
  .component('ProductModal',        window.ProductModal)
  .component('CustomerModal',       window.CustomerModal)
  .component('SiteSelectModal',     window.SiteSelectModal)
  .component('VendorSelectModal',   window.VendorSelectModal)
  .component('AdminUserSelectModal',window.AdminUserSelectModal)
  .component('MemberSelectModal',   window.MemberSelectModal)
  .component('OrderSelectModal',    window.OrderSelectModal)
  .component('BbmSelectModal',      window.BbmSelectModal)
  .component('TemplatePreviewModal',window.TemplatePreviewModal)
  .component('TemplateSendModal',   window.TemplateSendModal)
  .component('RoleTreeModal',       window.RoleTreeModal)
  .component('MenuTreeModal',       window.MenuTreeModal)
  .component('DeptTreeModal',       window.DeptTreeModal)
  .component('CategoryTreeModal',   window.CategoryTreeModal)
  .component('DispPreviewModal',    window.DispPreviewModal)
  .component('CategorySelectModal', window.CategorySelectModal)
  .use(pinia)
  .mount('#app');
})();
