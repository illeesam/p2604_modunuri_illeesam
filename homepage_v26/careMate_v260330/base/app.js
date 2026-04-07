/* ============================================
   케어메이트 CareMate - Vue 3 SPA
   병원동행 & 돌봄 서비스
   ============================================ */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, reactive, watch, onBeforeUnmount } = Vue;

  createApp({
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('caremate-theme') || 'light');
    const applyTheme = t => { theme.value = t; localStorage.setItem('caremate-theme', t); document.documentElement.setAttribute('data-theme', t); };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const sidebarOpen = ref(true);
    const mobileOpen  = ref(false);
    /** 좌측 메뉴 등에서 `replace: true`면 현재 히스토리 항목만 갱신(스택 증가 없음). 전체 히스토리 삭제는 브라우저에서 불가. */
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
      try { sessionStorage.setItem('caremate_page', id); } catch (e) {}
    };
    window.addEventListener('resize', () => { if (window.innerWidth < 1024) mobileOpen.value = false; });

    /* ── Toast ── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3500);
    };

    /* ── Alert Modal ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') => new Promise(r => Object.assign(alertState, { show:true, title, msg, type, resolve:r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Products ── */
    const products = window.SITE_CONFIG.products;
    const selectedProduct = ref(products[0]);
    const selectProduct = p => { selectedProduct.value = p; navigate('detail'); };

    /* ── URL state preserve ── */
    let restoring = true;
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (raw && raw.includes('page=')) {
        const p = new URLSearchParams(raw);
        const validPages = ['home','about','products','detail','booking','order','faq','contact','location'];
        const hp = p.get('page'); if (hp && validPages.includes(hp)) page.value = hp;
        const hpid = p.get('pid'); const pid = hpid!==null&&hpid!==''?Number(hpid):NaN;
        if (!Number.isNaN(pid)) { const f = products.find(x=>Number(x.productId)===pid); if(f) selectedProduct.value=f; }
      } else {
        try {
          const sp = sessionStorage.getItem('caremate_page');
          const validPages = ['home','about','products','detail','booking','order','faq','contact','location'];
          if (sp && validPages.includes(sp)) page.value = sp;
        } catch (e) {}
        const s = Number(sessionStorage.getItem('caremate_pid'));
        if(!Number.isNaN(s)){const f=products.find(x=>Number(x.productId)===s);if(f)selectedProduct.value=f;}
      }
    } catch(e){}
    restoring = false;

    let syncingFromHash = false;
    const onHashChange = () => {
      if (syncingFromHash) return;
      try {
        const raw = String(window.location.hash||'').replace(/^#/,'');
        if (!raw||!raw.includes('page=')) return;
        syncingFromHash = true;
        const p = new URLSearchParams(raw);
        const validPages = ['home','about','products','detail','booking','order','faq','contact','location'];
        const hp = p.get('page'); if(hp&&validPages.includes(hp)) page.value=hp;
        const hpid = p.get('pid'); const pid = hpid!==null&&hpid!==''?Number(hpid):NaN;
        if(!Number.isNaN(pid)){const f=products.find(x=>Number(x.productId)===pid);if(f)selectedProduct.value=f;}
        setTimeout(()=>{syncingFromHash=false;},0);
      } catch(e){syncingFromHash=false;}
    };
    window.addEventListener('hashchange', onHashChange);

    watch(page, id => {
      if(restoring||syncingFromHash) return;
      const p = new URLSearchParams(); p.set('page', page.value);
      if(id==='detail'||id==='booking'||id==='order'){
        p.set('pid',selectedProduct.value?.productId??'');
        if(selectedProduct.value?.productId!=null)sessionStorage.setItem('caremate_pid',String(selectedProduct.value.productId));
      }
      const hash = p.toString();
      const url = window.location.pathname + window.location.search + '#' + hash;
      if (replaceNextHash) {
        replaceNextHash = false;
        try { history.replaceState(null, '', url); } catch (e) { window.location.hash = hash; }
      } else {
        window.location.hash = hash;
      }
    });
    watch(selectedProduct, p=>{if(!syncingFromHash&&p&&p.productId!=null)sessionStorage.setItem('caremate_pid',String(p.productId));});

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const pr = new URLSearchParams();
        pr.set('page', page.value);
        if (page.value === 'detail' || page.value === 'booking' || page.value === 'order') {
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
    if(loadingEl){loadingEl.classList.add('vue-app-loading--done');setTimeout(()=>{loadingEl?.parentNode?.removeChild(loadingEl);},500);}

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, closeAlert, showAlert,
      products, selectedProduct, selectProduct,
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
      <page-home      v-if="page==='home'"     :navigate="navigate" :config="config" :products="products" :select-product="selectProduct" />
      <page-about     v-else-if="page==='about'"    :navigate="navigate" :config="config" />
      <page-products  v-else-if="page==='products'" :navigate="navigate" :config="config" :products="products" :select-product="selectProduct" />
      <page-detail    v-else-if="page==='detail'"   :navigate="navigate" :config="config" :product="selectedProduct" :products="products" />
      <page-booking   v-else-if="page==='booking'"  :navigate="navigate" :config="config" :show-alert="showAlert" />
      <page-order     v-else-if="page==='order'"    :navigate="navigate" :config="config" :show-alert="showAlert" />
      <page-faq       v-else-if="page==='faq'"      :navigate="navigate" :config="config" />
      <page-contact   v-else-if="page==='contact'"  :navigate="navigate" :config="config" :show-toast="showToast" />
      <page-location  v-else-if="page==='location'" :navigate="navigate" :config="config" />

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

</div>
`,
  })
  .component('AppHeader',   /** @type {any} */(window).AppHeader)
  .component('AppSidebar',  /** @type {any} */(window).AppSidebar)
  .component('AppFooter',   /** @type {any} */(window).AppFooter)
  .component('PageHome',    /** @type {any} */(window).PageHome)
  .component('PageAbout',   /** @type {any} */(window).PageAbout)
  .component('PageProducts',/** @type {any} */(window).PageProducts)
  .component('PageDetail',  /** @type {any} */(window).PageDetail)
  .component('PageBooking', /** @type {any} */(window).PageBooking)
  .component('PageOrder',   /** @type {any} */(window).PageOrder)
  .component('PageFaq',     /** @type {any} */(window).PageFaq)
  .component('PageContact', /** @type {any} */(window).PageContact)
  .component('PageLocation',/** @type {any} */(window).PageLocation)
  .mount('#app');
})();
