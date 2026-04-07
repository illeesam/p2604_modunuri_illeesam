/* ============================================
   DANGOEUL - Vue App (레이아웃 + 페이지 컴포넌트)
   ============================================ */
const { createApp, ref, computed, reactive } = Vue;

var P = window.DangoeulPages || {};
var C = window.DangoeulComponents || {};

const dangoeulApp = createApp({
  components: {
    AppHeader: C.LayoutHeader,
    AppSidebar: C.LayoutSidebar,
    AppFooter: C.LayoutFooter,
    PageHome: P.Home,
    PageAbout: P.About,
    PageSolution: P.Solution,
    PageProducts: P.Products,
    PageDetail: P.Detail,
    PageBlog: P.Blog,
    PageLocation: P.Location,
    PageContact: P.Contact,
    PageOrder: P.Order,
    PageFaq: P.Faq,
  },
  setup() {
    const theme = ref(localStorage.getItem('dangoeul-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('dangoeul-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    const page = ref('home');
    const validPages = ['home', 'about', 'solution', 'products', 'detail', 'blog', 'location', 'contact', 'faq', 'order', 'blogDetail'];
    let syncingFromHash = false;
    let initialPidToRestore = null;
    let hashHasPage = false;
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (raw && raw.includes('page=')) {
        hashHasPage = true;
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        if (hPage && validPages.includes(hPage)) page.value = hPage;
        const hPid = params.get('pid') || params.get('productId');
        if (hPid !== null && hPid !== '') initialPidToRestore = Number(hPid);
      }
    } catch (e) {}
    if (!hashHasPage) {
      try {
        const savedPage = sessionStorage.getItem('dangoeul_page');
        if (savedPage && validPages.includes(savedPage)) page.value = savedPage;
      } catch (e) {}
    }
    const sidebarOpen = ref(true);
    const mobileOpen = ref(false);
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
    const buildHashForPage = nextPage => {
      const nextParams = new URLSearchParams();
      nextParams.set('page', nextPage);

      // Products 목록은 기존 hash의 cat/q/v를 유지하면 더 자연스럽게 복원됩니다.
      if (nextPage === 'products') {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const existing = new URLSearchParams(raw || '');
        const hCat = existing.get('cat');
        const hQ = existing.get('q');
        const hV = existing.get('v');
        if (hCat !== null) nextParams.set('cat', hCat);
        if (hQ !== null) nextParams.set('q', hQ);
        if (hV !== null) nextParams.set('v', hV);
      }

      if (nextPage === 'detail' || nextPage === 'order' || nextPage === 'blogDetail') {
        const pid = selectedProduct.value?.productId;
        if (pid != null) nextParams.set('pid', String(pid));
      }

      return nextParams.toString();
    };

    const navigate = (id, opts = {}) => {
      if (mobileOpen.value) mobileOpen.value = false;
      page.value = id;
      window.scrollTo(0, 0);
      try { sessionStorage.setItem('dangoeul_page', id); } catch (e) {}

      // 뒤로가기/앞으로가기 처리 중이면 해시를 다시 쓰지 않습니다.
      if (!syncingFromHash) {
        try {
          const h = buildHashForPage(id);
          const url = window.location.pathname + window.location.search + '#' + h;
          if (opts && opts.replace) {
            history.replaceState(null, '', url);
          } else {
            window.location.hash = h;
          }
        } catch (e) {}
      }
    };

    // Browser back/forward 시 hash(page=...)에 맞춰 화면을 동기화합니다.
    window.addEventListener('hashchange', function () {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) return;
      const params = new URLSearchParams(raw);
      const hPage = params.get('page');
      if (!hPage || !validPages.includes(hPage)) return;

      let hPid = null;
      const rawPid = params.get('pid') || params.get('productId');
      if (rawPid !== null && rawPid !== '') hPid = Number(rawPid);

      syncingFromHash = true;
      try {
        if (page.value !== hPage) navigate(hPage);
        if ((hPage === 'detail' || hPage === 'order') && hPid != null && !Number.isNaN(hPid)) {
          const found = products.find(p => Number(p.productId) === hPid);
          if (found) selectedProduct.value = found;
          try { sessionStorage.setItem('dangoeul_pid', String(hPid)); } catch (e) {}
        }
      } catch (e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) mobileOpen.value = false;
    });
    const toggleMobile = toggleMobileMenu;
    const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
    const closeMobile = closeMobileMenu;

    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    };

    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    const products = window.SITE_CONFIG.products;
    const selectedProduct = ref(products[0]);
    if (initialPidToRestore != null && !Number.isNaN(initialPidToRestore)) {
      const found = products.find(p => Number(p.productId) === initialPidToRestore);
      if (found) selectedProduct.value = found;
    } else {
      const savedPid = sessionStorage.getItem('dangoeul_pid');
      if (savedPid) {
        const pidNum = Number(savedPid);
        if (!Number.isNaN(pidNum)) {
          const found = products.find(p => Number(p.productId) === pidNum);
          if (found) selectedProduct.value = found;
        }
      }
    }

    // 해시에 page=...가 없던 상태에서 새로고침/진입했을 때도 URL에 화면 상태가 보이도록 합니다.
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) window.location.hash = buildHashForPage(page.value);
    } catch (e) {}
    const selectProduct = p => {
      selectedProduct.value = p;
      if (p && p.productId != null) sessionStorage.setItem('dangoeul_pid', String(p.productId));
      navigate('detail');
    };

    const categorys = window.SITE_CONFIG.categorys || [];
    const activeProductCat = ref('전체');
    const productCats = ['전체', ...categorys.map(c => c.categoryName)];
    const filteredProducts = computed(() =>
      activeProductCat.value === '전체'
        ? products
        : products.filter(p => {
            const row = categorys.find(c => c.categoryName === activeProductCat.value);
            return row && p.categoryId === row.categoryId;
          })
    );
    const setProductCat = cat => { activeProductCat.value = cat; };

    const openFaq = ref(null);
    const toggleContactFaq = idx => {
      const key = 'c' + idx;
      openFaq.value = openFaq.value === key ? null : key;
    };
    const toggleMainFaq = idx => {
      openFaq.value = openFaq.value === idx ? null : idx;
    };

    const form = reactive({ name: '', email: '', company: '', tel: '', service: '', desc: '' });
    const formErrors = reactive({});
    const clearFormError = key => {
      if (formErrors[key] !== undefined) delete formErrors[key];
    };
    /** yup@1은 UMD가 없음 → jsDelivr +esm 번들을 동적 import (앱 기동 시 yup 전역 불필요) */
    let contactSchemaPromise = null;
    const getContactSchema = () => {
      if (!contactSchemaPromise) {
        contactSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup => {
          const schema = yup.object({
            name: yup.string().required('담당자명을 입력해주세요').min(2, '담당자명은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            company: yup.string().required('회사명을 입력해주세요'),
            desc: yup.string().required('문의 내용을 입력해주세요').min(10, '문의 내용은 최소 10자 이상 입력해주세요'),
          });
          return schema;
        });
      }
      return contactSchemaPromise;
    };
    const submitForm = async () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      try {
        const contactSchema = await getContactSchema();
        const payload = { name: form.name, email: form.email, company: form.company, desc: form.desc };
        await contactSchema.validate(payload, { abortEarly: false });
        await axiosApi.post('contact-intake.json', payload).catch(function () {});
        showToast('문의 접수하기 준비중입니다', 'success');
        Object.assign(form, { name: '', email: '', company: '', tel: '', service: '', desc: '' });
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => {
            if (err.path) formErrors[err.path] = err.message;
          });
        } else if (e.path) {
          formErrors[e.path] = e.message;
        }
      }
    };

    const openDemo = p => {
      showAlert(
        '주문 안내',
        p.productName + ' 샘플 주문·구성 확인 페이지로 연결됩니다.\n실제 서비스에서는 장바구니·결제로 이어집니다.',
        'info'
      );
    };

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate,
      toggleMobile, toggleSidebar, closeMobile,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      products, selectedProduct, selectProduct,
      activeProductCat, productCats, filteredProducts, setProductCat,
      openFaq, toggleContactFaq, toggleMainFaq,
      form, formErrors, submitForm, clearFormError,
      openDemo,
      config: window.SITE_CONFIG,
    };
  },

  template: /* html */ `
<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--bg-base);">

  <app-header
    :page="page"
    :theme="theme"
    :config="config"
    :navigate="navigate"
    :toggle-theme="toggleTheme"
    :toggle-mobile="toggleMobile"
    :toggle-sidebar="toggleSidebar"
  />

  <div style="flex:1;display:flex;overflow:hidden;position:relative;">

    <app-sidebar
      :config="config"
      :page="page"
      :navigate="navigate"
      :sidebar-open="sidebarOpen"
      :toggle-sidebar="toggleSidebar"
      :mobile-open="mobileOpen"
    />

    <div class="sidebar-overlay" :class="{show: mobileOpen}" @click="closeMobile"></div>

    <main class="layout-main" style="flex:1;overflow-y:auto;min-width:0;">

      <page-home v-show="page==='home'"
        :navigate="navigate"
        :config="config"
        :products="products"
        :select-product="selectProduct"
        :open-demo="openDemo"
      />

      <page-about v-show="page==='about'" :config="config" />

      <page-solution v-show="page==='solution'" :config="config" :navigate="navigate" />

      <page-products v-show="page==='products'"
        :config="config"
        :product-cats="productCats"
        :active-product-cat="activeProductCat"
        :set-product-cat="setProductCat"
        :filtered-products="filteredProducts"
        :select-product="selectProduct"
        :open-demo="openDemo"
      />

      <page-detail v-show="page==='detail'"
        :navigate="navigate"
        :products="products"
        :selected-product="selectedProduct"
        :select-product="selectProduct"
        :open-demo="openDemo"
      />

      <page-blog v-show="page==='blog'" />

      <page-location v-show="page==='location'" :config="config" />

      <page-order v-show="page==='order'" :navigate="navigate" :config="config" />

      <page-contact v-show="page==='contact'"
        :navigate="navigate"
        :config="config"
        :form="form"
        :form-errors="formErrors"
        :submit-form="submitForm"
        :clear-form-error="clearFormError"
        :open-faq="openFaq"
        :toggle-contact-faq="toggleContactFaq"
      />

      <page-faq v-show="page==='faq'"
        :navigate="navigate"
        :config="config"
        :open-faq="openFaq"
        :toggle-main-faq="toggleMainFaq"
      />

    </main>
  </div>

  <app-footer :config="config" />

  <div v-if="toast.show" class="toast-wrap" :class="'toast-'+toast.type">
    <span class="toast-icon">
      <span v-if="toast.type==='success'">✅</span>
      <span v-else-if="toast.type==='error'">❌</span>
      <span v-else-if="toast.type==='warning'">⚠️</span>
      <span v-else>ℹ️</span>
    </span>
    <span class="toast-msg">{{ toast.msg }}</span>
    <button @click="toast.show=false" style="background:none;border:none;cursor:pointer;color:inherit;opacity:0.6;font-size:1rem;padding:0 0 0 8px;flex-shrink:0;">✕</button>
  </div>

  <div v-if="alertState.show" class="modal-overlay" @click.self="closeAlert">
    <div class="modal-box">
      <div class="modal-icon" :class="'icon-'+alertState.type">
        <span v-if="alertState.type==='success'">✅</span>
        <span v-else-if="alertState.type==='error'">❌</span>
        <span v-else-if="alertState.type==='warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="modal-title">{{ alertState.title }}</div>
      <div class="modal-msg">{{ alertState.msg }}</div>
      <div class="modal-actions">
        <button class="btn-blue" @click="closeAlert" style="min-width:90px;">확인</button>
      </div>
    </div>
  </div>

  <div v-if="confirmState.show" class="modal-overlay" @click.self="closeConfirm(false)">
    <div class="modal-box">
      <div class="modal-icon" :class="'icon-'+confirmState.type">
        <span v-if="confirmState.type==='success'">✅</span>
        <span v-else-if="confirmState.type==='error'">❌</span>
        <span v-else-if="confirmState.type==='warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="modal-title">{{ confirmState.title }}</div>
      <div class="modal-msg">{{ confirmState.msg }}</div>
      <div class="modal-actions">
        <button class="btn-outline" @click="closeConfirm(false)" style="min-width:80px;">취소</button>
        <button class="btn-blue" @click="closeConfirm(true)" style="min-width:80px;">확인</button>
      </div>
    </div>
  </div>

</div>
  `,
});
dangoeulApp.config.globalProperties.$listImg = function (src) {
  return window.cmUtil.listImgSrc(src);
};
dangoeulApp.mount('#app');
(function dismissVueLoading() {
  var el = document.getElementById('vue-app-loading');
  if (!el) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.classList.add('vue-app-loading--done');
      el.setAttribute('aria-busy', 'false');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 450);
    });
  });
})();
