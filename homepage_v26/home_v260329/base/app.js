/* HOME - Vue app (page bodies in pages/*.js, inject key: studio) */
(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, computed, reactive, watch, onMounted, onBeforeUnmount, provide } = Vue;

  var P = window.HomePages || {};
  var L = window.HomeLayout || {};

  const heroStats = ref([]);
  try {
    const { data } = await axiosApi.get('base/hero-stats.json');
    heroStats.value = data.items || [];
  } catch (e) {
    heroStats.value = [
      { value: '50+', label: '완료 프로젝트' },
      { value: '98%', label: '고객 만족도' },
      { value: '5년+', label: '업계 경력' },
      { cta: true, emoji: '🚀', label: '지금 시작하기' },
    ];
  }

  createApp({
  components: {
    AppHeader: L.LayoutHeader,
    AppSidebar: L.LayoutSidebar,
    AppFooter: L.LayoutFooter,
    PageHome: P.Home,
    PageAbout: P.About,
    PageServices: P.Services,
    PagePortfolio: P.Portfolio,
    PageBlog: P.Blog,
    PageBlogDetail: P.BlogDetail,
    PageContact: P.Contact,
  },
  setup() {
    /* ── Theme ── */
    const theme = ref(localStorage.getItem('home-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('home-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ── */
    const page = ref('home');
    const validPages = ['home', 'about', 'services', 'portfolio', 'blog', 'blogDetail', 'contact', 'faq', 'order', 'detail', 'location'];
    try {
      const savedPage = sessionStorage.getItem('home_page');
      if (savedPage && validPages.includes(savedPage)) page.value = savedPage;
    } catch (e) {}
    const sidebarOpen = ref(true);
    const mobileOpen = ref(false);
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
      try { sessionStorage.setItem('home_page', id); } catch (e) {}
    };
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) mobileOpen.value = false;
    });

    /* ── Toast ── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => toast.show = false, 3000);
    };

    /* ── Design Alert (replaces browser alert) ── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Design Confirm (replaces browser confirm) ── */
    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Blog Detail Modal ────────────────────────────── */
    const blogModal = reactive({ show: false, post: null });
    const openBlogDetail = post => {
      blogModal.post = post;
      blogModal.show = true;
      try { sessionStorage.setItem('home_blog_post', JSON.stringify(post || null)); } catch (e) {}
      navigate('blogDetail');
    };
    const closeBlogDetail = () => {
      blogModal.show = false;
      blogModal.post = null;
      try { sessionStorage.removeItem('home_blog_post'); } catch (e) {}
      navigate('blog');
    };

    // Restore blog detail content on refresh (same-tab F5).
    try {
      const savedBlog = sessionStorage.getItem('home_blog_post');
      if (savedBlog && page.value === 'blogDetail') blogModal.post = JSON.parse(savedBlog);
    } catch (e) {}

    /* ── Portfolio filter ── */
    const portfolio = window.SITE_CONFIG.portfolio;
    const activeCat = ref('전체');
    const cats = ['전체', ...new Set(portfolio.map(p => p.cat))];
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);

    /* ── Preserve portfolio list state on refresh ── */
    let restoring = true;
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (raw && raw.includes('page=')) {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'services', 'portfolio', 'blog', 'contact', 'faq', 'order', 'detail', 'blogDetail', 'location'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;

        const hCat = params.get('cat');
        if (hCat && cats.includes(hCat)) activeCat.value = hCat;
        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;
        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;
      }
    } catch (e) {}
    restoring = false;
    // Browser back/forward 시 hash가 바뀔 때 URL 동기화 watch가 덮어쓰지 않도록 하는 플래그입니다.
    let syncingFromHash = false;

    // If refresh URL/hash overwrote `page`, prefer the last-viewed page from sessionStorage.
    try {
      const savedPage = sessionStorage.getItem('home_page');
      const savedBlog = sessionStorage.getItem('home_blog_post');
      if (savedPage === 'blogDetail' && savedBlog) page.value = 'blogDetail';

      if (savedBlog && page.value === 'blogDetail') blogModal.post = JSON.parse(savedBlog);
    } catch (e) {}

    const filteredPortfolio = computed(() => {
      var base = activeCat.value === '전체' ? portfolio : portfolio.filter(p => p.cat === activeCat.value);
      var q = String(searchText.value || '').trim().toLowerCase();
      if (!q) return base;
      return base.filter(p => (p.portfolioName || '').toLowerCase().includes(q));
    });

    const displayedPortfolio = computed(() => filteredPortfolio.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredPortfolio.value.length);

    function resetPagination() {
      visibleCount.value = PAGE_SIZE;
    }

    watch([activeCat, searchText], function () {
      if (restoring || syncingFromHash) return;
      resetPagination();
    });

    // When re-entering portfolio page, show the initial list again.
    watch(page, function (id) {
      if (restoring || syncingFromHash) return;
      if (id === 'portfolio') resetPagination();
    });

    watch(
      [page, activeCat, searchText, visibleCount],
      function () {
        if (restoring || syncingFromHash) return;
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'portfolio') {
          params.set('cat', activeCat.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
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

    var portfolioObserver = null;
    onMounted(function () {
      var el = document.getElementById('home-portfolio-sentinel');
      if (!el || !('IntersectionObserver' in window)) return;
      portfolioObserver = new IntersectionObserver(function (entries) {
        if (!entries || !entries.length) return;
        if (entries[0].isIntersecting && hasMore.value) {
          visibleCount.value = Math.min(filteredPortfolio.value.length, visibleCount.value + PAGE_SIZE);
        }
      }, { rootMargin: '250px' });
      portfolioObserver.observe(el);
    });

    onBeforeUnmount(function () {
      if (portfolioObserver) portfolioObserver.disconnect();
      portfolioObserver = null;
    });

    // Browser back/forward 시 hash가 바뀌면 Vue 상태를 동기화합니다.
    const applyHashState = () => {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) return;

      syncingFromHash = true;
      try {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'services', 'portfolio', 'blog', 'blogDetail', 'contact', 'faq', 'order', 'detail', 'location'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;

        const hCat = params.get('cat');
        if (hCat && cats.includes(hCat)) activeCat.value = hCat;

        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;

        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

        if (page.value === 'blogDetail') {
          const savedBlog = sessionStorage.getItem('home_blog_post');
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

    /* ── FAQ accordion ── */
    const openFaq = ref(null);
    const toggleFaq = q => {
      openFaq.value = openFaq.value === q ? null : q;
    };
    const setActiveCat = c => {
      activeCat.value = c;
    };

    /* ── Contact form + Yup (ESM 동적 import) ── */
    const form = reactive({ name: '', email: '', service: '', budget: '', desc: '' });
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
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 주소를 입력해주세요'),
            desc: yup.string().required('프로젝트 내용을 입력해주세요').min(10, '프로젝트 내용은 최소 10자 이상 작성해주세요'),
          });
        });
      }
      return contactSchemaPromise;
    };
    const contactServiceRows = computed(() =>
      window.cmUtil.codesByGroupOrRows(window.SITE_CONFIG || {}, 'home_contact_service', [
        { codeId: 1, codeValue: 'web', codeLabel: '웹 개발' },
        { codeId: 2, codeValue: 'mobile', codeLabel: '모바일 앱' },
        { codeId: 3, codeValue: 'uiux', codeLabel: 'UI/UX 디자인' },
        { codeId: 4, codeValue: 'data', codeLabel: '데이터 분석' },
        { codeId: 5, codeValue: 'cloud', codeLabel: '클라우드' },
        { codeId: 6, codeValue: 'consulting', codeLabel: '컨설팅' },
      ])
    );
    const contactBudgetRows = computed(() =>
      window.cmUtil.codesByGroupOrRows(window.SITE_CONFIG || {}, 'home_contact_budget', [
        { codeId: 1, codeValue: 'lt500', codeLabel: '500만원 미만' },
        { codeId: 2, codeValue: '500_1000', codeLabel: '500~1000만원' },
        { codeId: 3, codeValue: '1000_3000', codeLabel: '1000~3000만원' },
        { codeId: 4, codeValue: 'gt3000', codeLabel: '3000만원 이상' },
      ])
    );

    const submitForm = async () => {
      Object.keys(formErrors).forEach(k => delete formErrors[k]);
      try {
        const schema = await getContactSchema();
        const payload = { name: form.name, email: form.email, desc: form.desc };
        await schema.validate(payload, { abortEarly: false });
        await axiosApi.post('contact-intake.json', payload).catch(function () {});
        showToast('상담 신청하기 준비중입니다', 'success');
        Object.assign(form, { name: '', email: '', service: '', budget: '', desc: '' });
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

    /* ── About page data ── */
    const values = [
      { id: 1, icon: '⚡', title: '신속', desc: '빠른 납기와 효율적인 프로젝트 관리' },
      { id: 2, icon: '💎', title: '품질', desc: '코드 품질과 UX에 대한 높은 기준' },
      { id: 3, icon: '🤝', title: '소통', desc: '투명한 커뮤니케이션과 파트너십' },
      { id: 4, icon: '🌱', title: '성장', desc: '지속적인 학습과 기술 향상' },
    ];
    const team = [
      { id: 1, avatar: '👨‍💻', name: '김개발', role: 'Lead Developer', color: '#10b981' },
      { id: 2, avatar: '👩‍🎨', name: '이디자인', role: 'UI/UX Designer', color: '#f59e0b' },
      { id: 3, avatar: '👨‍📊', name: '박데이터', role: 'Data Engineer', color: '#10b981' },
      { id: 4, avatar: '👩‍💼', name: '최PM', role: 'Project Manager', color: '#f59e0b' },
    ];

    /* ── Blog posts ── */
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'portfolio') {
          params.set('cat', activeCat.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
        }
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + params.toString());
      }
    } catch (e) {}

    const posts = [
      { id: 1, emoji: '🎨', title: '좋은 UI가 비즈니스에 미치는 영향', excerpt: '사용자 경험이 전환율에 미치는 실제 데이터 분석', cat: '디자인', date: '2026.03.20', bg: '#1a2a1a' },
      { id: 2, emoji: '⚡', title: '웹사이트 성능 최적화 완전 가이드', excerpt: 'Core Web Vitals 점수를 95점 이상으로 올리는 방법', cat: '개발', date: '2026.03.15', bg: '#1a1a2a' },
      { id: 3, emoji: '📱', title: '모바일 우선 설계의 중요성', excerpt: '2026년 모바일 사용자 비율과 반응형 디자인 전략', cat: '디자인', date: '2026.03.10', bg: '#2a1a1a' },
      { id: 4, emoji: '📊', title: '데이터 기반 의사결정 도입기', excerpt: 'A/B 테스트로 전환율을 40% 향상시킨 실제 사례', cat: '데이터', date: '2026.03.05', bg: '#1a2a2a' },
      { id: 5, emoji: '🔐', title: '웹 보안의 기초: OWASP Top 10', excerpt: '개발자가 알아야 할 웹 보안 취약점과 대응 방법', cat: '보안', date: '2026.02.28', bg: '#2a2a1a' },
      { id: 6, emoji: '🚀', title: '스타트업을 위한 MVP 개발 전략', excerpt: '예산을 최소화하면서 빠르게 시장을 검증하는 법', cat: '전략', date: '2026.02.20', bg: '#1a2a1a' },
    ];

    /* 자식 페이지 템플릿에서 studio.xxx 로 접근하므로 ref/computed 는 reactive 안에 넣어 자동 unwrap 되게 함 */
    const studio = reactive({
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      activeCat, cats, filteredPortfolio,
      searchText, displayedPortfolio, hasMore, resetPagination, setActiveCat,
      openFaq, toggleFaq,
      form, formErrors, submitForm, clearFormError, contactServiceRows, contactBudgetRows,
      values, team, posts, heroStats, config: window.SITE_CONFIG,
    });
    provide('studio', studio);

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      portfolio, activeCat, cats, filteredPortfolio,
      searchText, displayedPortfolio, hasMore, resetPagination,
      openFaq,
      form, formErrors, submitForm, clearFormError, contactServiceRows, contactBudgetRows,
      values, team, posts,
      heroStats,
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
