/* ANYNURI - Vue App (페이지: pages/*.js, 레이아웃: layout/*.js, inject: anynuri) */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, computed, reactive, watch, onMounted, onBeforeUnmount, provide } = Vue;

  var P = window.AnyNuriPages || {};
  var L = window.AnyNuriLayout || {};

  createApp({
  components: {
    AppHeader: L.AppHeader,
    AppSidebar: L.AppSidebar,
    AppFooter: L.AppFooter,
    PageHome: P.PageHome,
    PageAbout: P.PageAbout,
    PageWorks: P.PageWorks,
    PagePortfolio: P.PagePortfolio,
    PageDetail: P.PageDetail,
    PageBlog: P.PageBlog,
    PageBlogDetail: P.PageBlogDetail,
    PageLocation: P.PageLocation,
    PageContact: P.PageContact,
    PageFaq: P.PageFaq,
  },
  setup() {
    /* ── Theme ──────────────────────────────────────────── */
    const theme = ref(localStorage.getItem('anynuri-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('anynuri-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ─────────────────────────────────────── */
    const page = ref('home');
    const validPages = ['home', 'about', 'works', 'portfolio', 'detail', 'blog', 'blogDetail', 'location', 'contact', 'faq', 'order'];
    try {
      const savedPage = sessionStorage.getItem('anynuri_page');
      if (savedPage && validPages.includes(savedPage)) page.value = savedPage;
    } catch (e) {}
    const sidebarOpen = ref(true);
    const mobileOpen = ref(false);
    /** 좌측 메뉴 이동 시 URL 히스토리 스택 대신 replace */
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
      try { sessionStorage.setItem('anynuri_page', id); } catch (e) {}
    };
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) mobileOpen.value = false;
    });

    /* ── Toast ──────────────────────────────────────────── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    };

    /* ── Design Alert ───────────────────────────────────── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Design Confirm ─────────────────────────────────── */
    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Blog Detail (상세페이지) ───────────────────── */
    const blogModal = reactive({ show: false, post: null });
    const openBlogDetail = post => {
      blogModal.post = post;
      blogModal.show = true;
      try { sessionStorage.setItem('anynuri_blog_post', JSON.stringify(post || null)); } catch (e) {}
      navigate('blogDetail');
    };
    const closeBlogDetail = () => {
      blogModal.show = false;
      blogModal.post = null;
      try { sessionStorage.removeItem('anynuri_blog_post'); } catch (e) {}
      navigate('blog');
    };

    // Restore blog detail content on refresh (same-tab F5).
    try {
      const savedBlog = sessionStorage.getItem('anynuri_blog_post');
      if (savedBlog && page.value === 'blogDetail') {
        blogModal.post = JSON.parse(savedBlog);
      }
    } catch (e) {}

    /* ── Works / Filter ─────────────────────────────────── */
    const works = window.SITE_CONFIG.works;
    const categoryList = window.SITE_CONFIG.categorys || [];
    const activeCat = ref('all');
    function normalizeWorksCatParam(hCat) {
      if (hCat == null || hCat === '') return null;
      if (categoryList.some(c => c.categoryId === hCat)) return hCat;
      const byName = categoryList.find(c => c.categoryName === hCat);
      return byName ? byName.categoryId : null;
    }
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);

    /* ── Preserve works list state on refresh ── */
    let restoring = true;
    let restoringWorkPid = null;
    const validPagesWorks = ['home', 'about', 'works', 'portfolio', 'detail', 'blog', 'blogDetail', 'location', 'contact', 'faq', 'order'];
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      const hasPageParam = raw && raw.includes('page=');
      if (hasPageParam) {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        if (hPage && validPagesWorks.includes(hPage)) page.value = hPage;

        const hCat = params.get('cat');
        const resolvedCat = normalizeWorksCatParam(hCat);
        if (resolvedCat) activeCat.value = resolvedCat;

        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;

        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

        const hPid = params.get('pid') || params.get('workId');
        if (hPid !== null) restoringWorkPid = hPid;
      } else {
        try {
          const sp = sessionStorage.getItem('anynuri_page');
          if (sp && validPagesWorks.includes(sp)) page.value = sp;
        } catch (e) {}
      }
    } catch (e) {}
    restoring = false;
    // Browser back/forward로 hash가 바뀔 때 URL 상태를 Vue 상태로 동기화할 때
    // watch가 다시 hash를 덮어쓰지 않도록 플래그를 둡니다.
    let syncingFromHash = false;

    try {
      const savedBlog = sessionStorage.getItem('anynuri_blog_post');
      if (savedBlog && page.value === 'blogDetail') blogModal.post = JSON.parse(savedBlog);
    } catch (e) {}

    const filteredWorks = computed(() => {
      const catEntry = categoryList.find(c => c.categoryId === activeCat.value);
      const label = catEntry ? catEntry.categoryName : '';
      var base = activeCat.value === 'all' || label === '전체'
        ? works
        : works.filter(w => w.genre === label || w.tags.includes(label));

      var q = String(searchText.value || '').trim().toLowerCase();
      if (!q) return base;
      return base.filter(w => (w.title || '').toLowerCase().includes(q));
    });

    const displayedWorks = computed(() => filteredWorks.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredWorks.value.length);

    const selectedWork = ref(works[0]);
    const selectWork = w => {
      selectedWork.value = w;
      if (w && w.id != null) sessionStorage.setItem('anynuri_pid', String(w.id));
      navigate('detail');
    };

    try {
      const savedPid = restoringWorkPid ?? sessionStorage.getItem('anynuri_pid');
      const pidNum = savedPid !== null && savedPid !== '' ? Number(savedPid) : NaN;
      if (!Number.isNaN(pidNum)) {
        const found = works.find(w => Number(w.id) === pidNum);
        if (found) selectedWork.value = found;
      }
    } catch (e) {}

    function resetPagination() {
      visibleCount.value = PAGE_SIZE;
    }
    const setActiveCat = id => {
      activeCat.value = id;
    };

    watch([activeCat, searchText], function () {
      if (restoring || syncingFromHash) return;
      resetPagination();
    });

    // When re-entering works page, show the initial list again.
    watch(page, function (id) {
      if (restoring || syncingFromHash) return;
      if (id === 'works') resetPagination();
    });

    watch(
      [page, activeCat, searchText, visibleCount, selectedWork],
      function () {
        if (restoring || syncingFromHash) return;
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'works') {
          params.set('cat', activeCat.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
        }
        if ((page.value === 'detail' || page.value === 'order') && selectedWork.value?.id != null) {
          params.set('pid', String(selectedWork.value.id));
          try { sessionStorage.setItem('anynuri_pid', String(selectedWork.value.id)); } catch (e) {}
        }
        const hash = params.toString();
        const url = window.location.pathname + window.location.search + '#' + hash;
        if (replaceNextHash) {
          replaceNextHash = false;
          try { history.replaceState(null, '', url); } catch (e) { window.location.hash = hash; }
        } else {
          window.location.hash = hash;
        }
      },
      { flush: 'post' }
    );

    var worksObserver = null;
    onMounted(function () {
      var el = document.getElementById('anynuri-works-sentinel');
      if (!el || !('IntersectionObserver' in window)) return;
      worksObserver = new IntersectionObserver(function (entries) {
        if (!entries || !entries.length) return;
        if (entries[0].isIntersecting && hasMore.value) {
          visibleCount.value = Math.min(filteredWorks.value.length, visibleCount.value + PAGE_SIZE);
        }
      }, { rootMargin: '250px' });
      worksObserver.observe(el);
    });

    onBeforeUnmount(function () {
      if (worksObserver) worksObserver.disconnect();
      worksObserver = null;
    });

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'works') {
          params.set('cat', activeCat.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
        }
        if ((page.value === 'detail' || page.value === 'order') && selectedWork.value?.id != null) {
          params.set('pid', String(selectedWork.value.id));
        }
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + params.toString());
      }
    } catch (e) {}

    // Browser back/forward 시 hash가 바뀌면 Vue 상태를 다시 맞춥니다.
    const applyHashState = () => {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) return;

      syncingFromHash = true;
      try {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'works', 'portfolio', 'detail', 'blog', 'blogDetail', 'location', 'contact', 'faq', 'order'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;

        const hCat = params.get('cat');
        const resolvedCat = normalizeWorksCatParam(hCat);
        if (resolvedCat) activeCat.value = resolvedCat;

        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;

        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

        // detail(상세)에서 선택된 작품 복원
        const hPid = params.get('pid') || params.get('workId');
        const pidNum = hPid !== null && hPid !== '' ? Number(hPid) : NaN;
        if (!Number.isNaN(pidNum)) {
          const found = works.find(w => Number(w.id) === pidNum);
          if (found) {
            selectedWork.value = found;
            if (found?.id != null) sessionStorage.setItem('anynuri_pid', String(found.id));
          }
        } else if (page.value === 'detail') {
          // 해시 pid가 없을 때는 세션에서 복원
          const saved = sessionStorage.getItem('anynuri_pid');
          const savedNum = saved !== null && saved !== '' ? Number(saved) : NaN;
          if (!Number.isNaN(savedNum)) {
            const found = works.find(w => Number(w.id) === savedNum);
            if (found) selectedWork.value = found;
          }
        }

        // blogDetail 본문 복원
        if (page.value === 'blogDetail') {
          const savedBlog = sessionStorage.getItem('anynuri_blog_post');
          if (savedBlog) blogModal.post = JSON.parse(savedBlog);
        } else {
          blogModal.post = null;
        }
      } catch (e) {}
      setTimeout(() => { syncingFromHash = false; }, 0);
    };

    const onHashChange = () => {
      if (syncingFromHash) return;
      applyHashState();
    };
    window.addEventListener('hashchange', onHashChange);
    onBeforeUnmount(function () {
      window.removeEventListener('hashchange', onHashChange);
    });

    /* ── FAQ ────────────────────────────────────────────── */
    const openFaq = ref(null);
    const toggleFaq = idx => { openFaq.value = openFaq.value === idx ? null : idx; };

    /* ── Contact Form + Yup (ESM 동적 import) ───────────── */
    const form = reactive({ name: '', email: '', type: '', desc: '' });
    const formErrors = reactive({});
    const clearFormError = key => {
      if (formErrors[key] !== undefined) delete formErrors[key];
    };
    let contactSchemaPromise = null;
    const getContactSchema = () => {
      if (!contactSchemaPromise) {
        contactSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup => {
          return yup.object({
            name: yup.string().required('이름을 입력해주세요').min(2, '이름은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            desc: yup.string().required('의뢰 내용을 입력해주세요').min(10, '의뢰 내용은 최소 10자 이상 작성해주세요'),
          });
        });
      }
      return contactSchemaPromise;
    };
    const submitForm = async () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      try {
        const schema = await getContactSchema();
        const payload = { name: form.name, email: form.email, desc: form.desc };
        await schema.validate(payload, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi
            .post('contact-intake.json', Object.assign({ source: 'anynuri', type: form.type }, payload))
            .catch(function () {});
        }
        showToast('의뢰 접수하기 준비중입니다', 'success');
        Object.assign(form, { name: '', email: '', type: '', desc: '' });
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

    /* ── Demo Link ──────────────────────────────────────── */
    const openDemo = w => {
      showAlert(
        '데모 연결',
        w.title + ' 미리보기 페이지로 이동합니다.\n(실제 서비스에서 해당 URL로 연결됩니다)',
        'info'
      );
    };

    /* 레이아웃·페이지에서 anynuri.xxx 로 접근하므로 ref/computed 는 reactive 로 감싸 unwrap */
    const anynuri = reactive({
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      works, activeCat, categoryList, filteredWorks, selectedWork, selectWork,
      searchText, displayedWorks, hasMore, resetPagination, setActiveCat,
      openFaq, toggleFaq,
      form, formErrors, submitForm, clearFormError,
      openDemo,
      config: window.SITE_CONFIG,
    });
    provide('anynuri', anynuri);

    /* ── Return (루트 셸 템플릿용) ─────────────────────── */
    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      works, activeCat, categoryList, filteredWorks, selectedWork, selectWork,
      searchText, displayedWorks, hasMore, resetPagination,
      openFaq, toggleFaq,
      form, formErrors, submitForm, clearFormError,
      openDemo,
      config: window.SITE_CONFIG,
    };
  }
}).mount('#app');
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
})();
