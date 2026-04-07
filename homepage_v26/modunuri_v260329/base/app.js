/* ============================================
   MODUNURI - Vue 3 SPA (컴포넌트 분리)
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, watch, onBeforeUnmount } = Vue;

  createApp({
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('modunuri-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('modunuri-theme', t);
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
      try { sessionStorage.setItem('modunuri_page', id); } catch (e) {}
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
      if (p && p.productId != null) try { sessionStorage.setItem('modunuri_pid', String(p.productId)); } catch (e) {}
      navigate('detail');
    };
    const orderProduct = p => {
      selectedProduct.value = p;
      if (p && p.productId != null) try { sessionStorage.setItem('modunuri_pid', String(p.productId)); } catch (e) {}
      navigate('order');
    };

    /* ── Demo ── */
    const openDemo = p => {
      if (p && p.demo) {
        window.open(p.demo, '_blank', 'noopener');
        return;
      }
      showAlert(
        '데모 연결',
        (p ? p.productName : '') + ' 30일 무료 체험 페이지로 이동합니다.\n실제 서비스에서 데모 URL로 연결됩니다.',
        'info'
      );
    };

    /* ── URL state preserve ── */
    let restoring = true;
    const validPages = ['home','about','solution','products','detail','blog','blogDetail','location','contact','faq','order'];
    try {
      const rawHash = String(window.location.hash || '').replace(/^#/, '');
      const hasPageParam = rawHash.includes('page=');
      const params = hasPageParam ? new URLSearchParams(rawHash) : null;
      if (hasPageParam) {
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage)) page.value = hPage;
      } else {
        try {
          const sp = sessionStorage.getItem('modunuri_page');
          if (sp && validPages.includes(sp)) page.value = sp;
        } catch (e) {}
      }
      const hpid = hasPageParam ? params.get('pid') : null;
      const pid = hpid !== null && hpid !== '' ? Number(hpid) : NaN;
      if (!Number.isNaN(pid)) {
        const f = products.find(x => Number(x.productId) === pid);
        if (f) selectedProduct.value = f;
      } else {
        const s = Number(sessionStorage.getItem('modunuri_pid'));
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
        const validPages = ['home','about','solution','products','detail','blog','blogDetail','location','contact','faq','order'];
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
      if (id === 'detail' || id === 'order') {
        params.set('pid', selectedProduct.value?.productId ?? '');
        if (selectedProduct.value?.productId != null) sessionStorage.setItem('modunuri_pid', String(selectedProduct.value.productId));
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
    watch(selectedProduct, p => {
      if (!syncingFromHash && p && p.productId != null) sessionStorage.setItem('modunuri_pid', String(p.productId));
    });

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const pr = new URLSearchParams();
        pr.set('page', page.value);
        if (page.value === 'detail' || page.value === 'order') {
          pr.set('pid', String(selectedProduct.value?.productId ?? ''));
        }
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
      products, selectedProduct, selectProduct, orderProduct,
      openDemo,
      config: window.SITE_CONFIG,
    };
  },

  template: /* html */ `
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <app-header
    :page="page" :theme="theme" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
    :config="config" :navigate="navigate" :toggle-theme="toggleTheme"
    @toggle-sidebar="sidebarOpen=!sidebarOpen" @toggle-mobile="toggleMobileMenu"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">
    <app-sidebar
      :page="page" :sidebar-open="sidebarOpen" :mobile-open="mobileOpen"
      :config="config" :navigate="navigate"
      @toggle-sidebar="sidebarOpen=!sidebarOpen" @close-mobile="closeMobileMenu"
    />
    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobileMenu"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">
      <page-home      v-if="page==='home'"         :navigate="navigate" :config="config" :products="products" :select-product="selectProduct" :order-product="orderProduct" :open-demo="openDemo" />
      <page-about     v-else-if="page==='about'"       :navigate="navigate" :config="config" />
      <page-solution  v-else-if="page==='solution'"    :navigate="navigate" :config="config" />
      <page-products  v-else-if="page==='products'"    :navigate="navigate" :config="config" :products="products" :select-product="selectProduct" :order-product="orderProduct" :open-demo="openDemo" />
      <page-detail    v-else-if="page==='detail'"      :navigate="navigate" :config="config" :product="selectedProduct" :order-product="orderProduct" :open-demo="openDemo" />
      <page-order     v-else-if="page==='order'"       :navigate="navigate" :config="config" :product="selectedProduct" :show-toast="showToast" :show-alert="showAlert" />
      <page-blog      v-else-if="page==='blog'||page==='blogDetail'" :navigate="navigate" :config="config" :page="page" />
      <page-faq       v-else-if="page==='faq'"         :navigate="navigate" :config="config" />
      <page-contact   v-else-if="page==='contact'"     :navigate="navigate" :config="config" :show-toast="showToast" :show-alert="showAlert" />
      <page-location  v-else-if="page==='location'"    :navigate="navigate" :config="config" />

      <app-footer :config="config" :navigate="navigate" />
    </main>
  </div>

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
  .component('PageHome',    window.PageHome)
  .component('PageAbout',   window.PageAbout)
  .component('PageSolution',window.PageSolution)
  .component('PageProducts',window.PageProducts)
  .component('PageDetail',  window.PageDetail)
  .component('PageOrder',   window.PageOrder)
  .component('PageBlog',    window.PageBlog)
  .component('PageFaq',     window.PageFaq)
  .component('PageContact', window.PageContact)
  .component('PageLocation',window.PageLocation)
  .mount('#app');
})();
