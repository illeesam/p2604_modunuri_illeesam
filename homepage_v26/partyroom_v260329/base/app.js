/* ============================================
   PARTYROOM SPACE — Vue App (본문은 pages/*.js)
   ============================================ */

(async function () {
  await window.__SITE_CONFIG_READY__;
  const { createApp, ref, computed, reactive, watch, onMounted, onBeforeUnmount, provide } = Vue;

  var P = window.PartyroomPages || {};

  createApp({
  components: {
    PageHome: P.Home,
    PageAbout: P.About,
    PageProducts: P.Products,
    PageDetail: P.Detail,
    PageSpace: P.Space,
    PageBlog: P.Blog,
    PageBlogDetail: P.BlogDetail,
    PageLocation: P.Location,
    PageContact: P.Contact,
    PageFaq: P.Faq,
    PageBooking: P.Booking,
  },
  setup() {
    /* ── Theme ─────────────────────────────────── */
    const theme = ref(localStorage.getItem('partyroom-theme') || 'light');
    const applyTheme = t => {
      theme.value = t;
      localStorage.setItem('partyroom-theme', t);
      document.documentElement.setAttribute('data-theme', t);
    };
    applyTheme(theme.value);
    const toggleTheme = () => applyTheme(theme.value === 'light' ? 'dark' : 'light');

    /* ── Navigation ────────────────────────────── */
    const page = ref('home');
    const validPages = ['home', 'about', 'products', 'detail', 'booking', 'blog', 'blogDetail', 'space', 'location', 'contact', 'faq', 'order'];
    try {
      const savedPage = sessionStorage.getItem('partyroom_page');
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
      try {
        var mainEl = document.querySelector('main.partyroom-main') || document.querySelector('.partyroom-main');
        if (mainEl) mainEl.scrollTop = 0; else window.scrollTo(0, 0);
      } catch (e) { window.scrollTo(0, 0); }
      try { sessionStorage.setItem('partyroom_page', id); } catch (e) {}
    };
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) mobileOpen.value = false;
    });

    /* ── Toast ─────────────────────────────────── */
    const toast = reactive({ show: false, msg: '', type: 'success' });
    let toastTimer = null;
    const showToast = (msg, type = 'success') => {
      if (toastTimer) clearTimeout(toastTimer);
      Object.assign(toast, { show: true, msg, type });
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    };

    /* ── Alert Modal ───────────────────────────── */
    const alertState = reactive({ show: false, title: '', msg: '', type: 'info', resolve: null });
    const showAlert = (title, msg, type = 'info') =>
      new Promise(r => Object.assign(alertState, { show: true, title, msg, type, resolve: r }));
    const closeAlert = () => { alertState.show = false; alertState.resolve?.(); };

    /* ── Confirm Modal ─────────────────────────── */
    const confirmState = reactive({ show: false, title: '', msg: '', type: 'warning', resolve: null });
    const showConfirm = (title, msg, type = 'warning') =>
      new Promise(r => Object.assign(confirmState, { show: true, title, msg, type, resolve: r }));
    const closeConfirm = r => { confirmState.show = false; confirmState.resolve?.(r); };

    /* ── Blog Detail Modal ───────────────────────────── */
    const blogModal = reactive({ show: false, post: null });
    const openBlogDetail = post => {
      blogModal.post = post;
      blogModal.show = true;
      try { sessionStorage.setItem('partyroom_blog_post', JSON.stringify(post || null)); } catch (e) {}
      navigate('blogDetail');
    };
    const closeBlogDetail = () => {
      blogModal.show = false;
      blogModal.post = null;
      try { sessionStorage.removeItem('partyroom_blog_post'); } catch (e) {}
      navigate('blog');
    };

    // Restore blog detail content on refresh (same-tab F5).
    try {
      const savedBlog = sessionStorage.getItem('partyroom_blog_post');
      if (savedBlog && page.value === 'blogDetail') {
        blogModal.post = JSON.parse(savedBlog);
      }
    } catch (e) {}

    /* ── Rooms ─────────────────────────────────── */
    const rooms = window.SITE_CONFIG.rooms;
    const selectedRoom = ref(rooms[0]);
    const selectRoom = r => {
      selectedRoom.value = r;
      if (r && r.roomId != null) sessionStorage.setItem('partyroom_pid', String(r.roomId));
      navigate('detail');
    };
    const activeTag = ref('전체');
    const allTags = computed(() => ['전체', ...new Set(rooms.flatMap(r => r.tags))]);
    const searchText = ref('');
    const PAGE_SIZE = 6;
    const visibleCount = ref(PAGE_SIZE);

    /* ── Preserve rooms list state on refresh ── */
    let restoring = true;
    let restoringRoomPid = null;
    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (raw && raw.includes('page=')) {
        const params = new URLSearchParams(raw);
        const hPage = params.get('page');
        const validPages = ['home', 'about', 'products', 'detail', 'booking', 'blog', 'blogDetail', 'space', 'location', 'contact', 'faq', 'order'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;

        const tagPool = ['전체', ...new Set(rooms.flatMap(r => r.tags))];
        const hTag = params.get('cat');
        if (hTag && tagPool.includes(hTag)) activeTag.value = hTag;

        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;

        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

        const hPid = params.get('pid') || params.get('roomId');
        if (hPid !== null) restoringRoomPid = hPid;
      }
    } catch (e) {}
    restoring = false;
    // Browser back/forward 시 hash가 바뀔 때 Vue 상태를 동기화할 때
    // watch가 다시 URL을 덮어쓰지 않도록 막는 플래그입니다.
    let syncingFromHash = false;

    // Ensure blogDetail content is restored too.
    try {
      const savedBlog = sessionStorage.getItem('partyroom_blog_post');
      if (savedBlog && page.value === 'blogDetail') blogModal.post = JSON.parse(savedBlog);
    } catch (e) {}

    const filteredRooms = computed(() => {
      var base = activeTag.value === '전체' ? rooms : rooms.filter(r => r.tags.includes(activeTag.value));
      var q = String(searchText.value || '').trim().toLowerCase();
      if (!q) return base;
      return base.filter(r => (r.roomName || '').toLowerCase().includes(q));
    });

    const displayedRooms = computed(() => filteredRooms.value.slice(0, visibleCount.value));
    const hasMore = computed(() => visibleCount.value < filteredRooms.value.length);

    function resetPagination() {
      visibleCount.value = PAGE_SIZE;
    }

    watch([activeTag, searchText], function () {
      if (restoring || syncingFromHash) return;
      resetPagination();
    });

    // When re-entering products page, show the initial list again.
    watch(page, function (id) {
      if (restoring || syncingFromHash) return;
      if (id === 'products') resetPagination();
    });

    const booking = reactive({
      room: '', date: '', startTime: '', hours: 1, days: 1,
      rentalType: 'hourly', name: '', tel: '', email: '', note: ''
    });

    watch(
      [page, activeTag, searchText, visibleCount, selectedRoom, () => booking.room],
      function () {
        if (restoring || syncingFromHash) return;
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'products') {
          params.set('cat', activeTag.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
        }
        if (page.value === 'detail') {
          const pid = selectedRoom.value?.roomId;
          if (pid != null) {
            params.set('pid', String(pid));
            try { sessionStorage.setItem('partyroom_pid', String(pid)); } catch (e) {}
          }
        }
        if (page.value === 'booking') {
          const pid = selectedRoom.value?.roomId;
          if (pid != null) {
            params.set('pid', String(pid));
            if (booking.room != null && booking.room !== '') params.set('room', String(booking.room));
          }
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

    var roomsObserver = null;
    onMounted(function () {
      var el = document.getElementById('partyroom-products-sentinel');
      if (!el || !('IntersectionObserver' in window)) return;
      roomsObserver = new IntersectionObserver(function (entries) {
        if (!entries || !entries.length) return;
        if (entries[0].isIntersecting && hasMore.value) {
          visibleCount.value = Math.min(filteredRooms.value.length, visibleCount.value + PAGE_SIZE);
        }
      }, { rootMargin: '250px' });
      roomsObserver.observe(el);
    });

    onBeforeUnmount(function () {
      if (roomsObserver) roomsObserver.disconnect();
      roomsObserver = null;
    });

    // Restore selected room for detail page refresh.
    try {
      const savedPid = restoringRoomPid ?? sessionStorage.getItem('partyroom_pid');
      const pidNum = savedPid !== null && savedPid !== '' ? Number(savedPid) : NaN;
      if (!Number.isNaN(pidNum)) {
        const found = rooms.find(rm => Number(rm.roomId) === pidNum);
        if (found) selectedRoom.value = found;
      }
    } catch (e) {}

    try {
      const raw = String(window.location.hash || '').replace(/^#/, '');
      if (!raw || !raw.includes('page=')) {
        const params = new URLSearchParams();
        params.set('page', page.value);
        if (page.value === 'products') {
          params.set('cat', activeTag.value);
          params.set('q', searchText.value);
          params.set('v', String(visibleCount.value));
        }
        if (page.value === 'detail') {
          const pid = selectedRoom.value?.roomId;
          if (pid != null) params.set('pid', String(pid));
        }
        if (page.value === 'booking') {
          const pid = selectedRoom.value?.roomId;
          if (pid != null) {
            params.set('pid', String(pid));
            if (booking.room != null && booking.room !== '') params.set('room', String(booking.room));
          }
        }
        const hash = params.toString();
        history.replaceState(null, '', window.location.pathname + window.location.search + '#' + hash);
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
        const validPages = ['home', 'about', 'products', 'detail', 'booking', 'blog', 'blogDetail', 'space', 'location', 'contact', 'faq', 'order'];
        if (hPage && validPages.includes(hPage)) page.value = hPage;

        const hCat = params.get('cat');
        const tagPool = ['전체', ...new Set(rooms.flatMap(r => r.tags))];
        if (hCat && tagPool.includes(hCat)) activeTag.value = hCat;

        const hQ = params.get('q');
        if (hQ !== null) searchText.value = hQ;

        const hV = parseInt(params.get('v') || '', 10);
        if (!Number.isNaN(hV) && hV >= PAGE_SIZE) visibleCount.value = hV;

        const hPid = params.get('pid') || params.get('roomId');
        const pidNum = hPid !== null && hPid !== '' ? Number(hPid) : NaN;
        if (!Number.isNaN(pidNum)) {
          const found = rooms.find(rm => Number(rm.roomId) === pidNum);
          if (found) {
            selectedRoom.value = found;
            if (found?.roomId != null) sessionStorage.setItem('partyroom_pid', String(found.roomId));
          }
        } else if (page.value === 'detail') {
          const saved = sessionStorage.getItem('partyroom_pid');
          const savedNum = saved !== null && saved !== '' ? Number(saved) : NaN;
          if (!Number.isNaN(savedNum)) {
            const found = rooms.find(rm => Number(rm.roomId) === savedNum);
            if (found) selectedRoom.value = found;
          }
        }

        if (page.value === 'blogDetail') {
          const savedBlog = sessionStorage.getItem('partyroom_blog_post');
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

    /* ── Booking Form ──────────────────────────── */
    const BOOKING_STATE_KEY = 'partyroom_booking_state';

    const persistBookingState = () => {
      try {
        sessionStorage.setItem(
          BOOKING_STATE_KEY,
          JSON.stringify({
            room: booking.room,
            date: booking.date,
            startTime: booking.startTime,
            hours: booking.hours,
            days: booking.days,
            rentalType: booking.rentalType,
            name: booking.name,
            tel: booking.tel,
            email: booking.email,
            note: booking.note,
          })
        );
      } catch (e) {}
    };

    const restoreBookingState = () => {
      try {
        const raw = sessionStorage.getItem(BOOKING_STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && typeof saved === 'object') Object.assign(booking, saved);
        }
      } catch (e) {}

      // room이 비어있으면, 선택된 공간으로 자동 채웁니다.
      try {
        if (!booking.room && selectedRoom.value?.roomId != null) booking.room = String(selectedRoom.value.roomId);
      } catch (e) {}
    };

    if (page.value === 'booking') restoreBookingState();

    watch(page, function (id) {
      if (id === 'booking') {
        restoreBookingState();
        persistBookingState();
      }
    });

    // 예약하기 화면에서 입력되는 값이 새로고침에도 유지되도록 저장합니다.
    watch(
      [
        () => booking.room,
        () => booking.date,
        () => booking.startTime,
        () => booking.hours,
        () => booking.days,
        () => booking.rentalType,
        () => booking.name,
        () => booking.tel,
        () => booking.email,
        () => booking.note,
      ],
      function () {
        if (page.value === 'booking') persistBookingState();
      }
    );
    const bookingErrors = reactive({});
    const bookingTotal = computed(() => {
      const r = rooms.find(rm => rm.roomId === Number(booking.room));
      if (!r) return 0;
      if (booking.rentalType === 'hourly') return r.hourly * booking.hours;
      if (booking.rentalType === 'daily') {
        const base = r.daily * booking.days;
        const d = Number(booking.days);
        const disc = d >= 14 ? 0.3 : d >= 7 ? 0.2 : d >= 3 ? 0.1 : 0;
        return Math.round(base * (1 - disc));
      }
      return 0;
    });
    const YUP_ESM = 'https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm';
    let yupImportPromise = null;
    const loadYup = () => (yupImportPromise ||= import(YUP_ESM));

    let bookingSchemaPromise = null;
    const getBookingSchema = () => {
      if (!bookingSchemaPromise) {
        bookingSchemaPromise = loadYup().then(yup =>
          yup.object({
            room: yup.mixed().test('room', '공간을 선택해주세요', v => v !== '' && v != null && Number(v) >= 1),
            name: yup.string().required('예약자명을 입력해주세요').min(2, '예약자명은 최소 2자 이상 입력해주세요'),
            tel: yup.string().required('연락처를 입력해주세요').matches(/^[0-9\-+]{9,}$/, '유효한 연락처를 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            date: yup.string().required('날짜를 선택해주세요'),
          })
        );
      }
      return bookingSchemaPromise;
    };

    const clearBookingError = key => {
      if (bookingErrors[key] !== undefined) delete bookingErrors[key];
    };

    const submitBooking = async () => {
      Object.keys(bookingErrors).forEach(k => delete bookingErrors[k]);
      try {
        const schema = await getBookingSchema();
        await schema.validate(booking, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi
            .post('contact-intake.json', { source: 'partyroom', kind: 'booking', booking: { ...booking } })
            .catch(function () {});
        }
        showToast('예약 신청하기 준비중입니다', 'success');
        Object.assign(booking, { room: '', date: '', startTime: '', hours: 1, days: 1, rentalType: 'hourly', name: '', tel: '', email: '', note: '' });
        try { sessionStorage.removeItem(BOOKING_STATE_KEY); } catch (e) {}
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => {
            if (err.path) bookingErrors[err.path] = err.message;
          });
        } else if (e.path) {
          bookingErrors[e.path] = e.message;
        }
      }
    };

    /* ── Contact Form (Yup ESM) ──────────────────── */
    const contactForm = reactive({ name: '', tel: '', email: '', msg: '' });
    const contactErrors = reactive({});
    let contactSchemaPromise = null;
    const getContactSchema = () => {
      if (!contactSchemaPromise) {
        contactSchemaPromise = loadYup().then(yup =>
          yup.object({
            name: yup.string().required('이름을 입력해주세요').min(2, '이름은 최소 2자 이상 입력해주세요'),
            email: yup.string().required('이메일을 입력해주세요').email('유효한 이메일 형식이 아닙니다'),
            msg: yup.string().required('문의 내용을 입력해주세요').min(10, '문의 내용은 최소 10자 이상 입력해주세요'),
          })
        );
      }
      return contactSchemaPromise;
    };
    const clearContactError = key => {
      if (contactErrors[key] !== undefined) delete contactErrors[key];
    };
    const submitContact = async () => {
      Object.keys(contactErrors).forEach(k => delete contactErrors[k]);
      try {
        const schema = await getContactSchema();
        const payload = { name: contactForm.name, email: contactForm.email, msg: contactForm.msg };
        await schema.validate(payload, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi
            .post('contact-intake.json', {
              source: 'partyroom',
              kind: 'contact',
              name: contactForm.name,
              tel: contactForm.tel,
              email: contactForm.email,
              msg: contactForm.msg,
            })
            .catch(function () {});
        }
        showToast('문의 접수하기 준비중입니다', 'success');
        Object.assign(contactForm, { name: '', tel: '', email: '', msg: '' });
      } catch (e) {
        if (e.inner && e.inner.length) {
          e.inner.forEach(err => {
            if (err.path) contactErrors[err.path] = err.message;
          });
        } else if (e.path) {
          contactErrors[e.path] = e.message;
        }
      }
    };

    /* ── FAQ ───────────────────────────────────── */
    const openFaq = ref(null);

    const setActiveTag = tag => {
      activeTag.value = tag;
    };
    const toggleFaqAt = idx => {
      openFaq.value = openFaq.value === idx ? null : idx;
    };
    const reserveThisRoom = () => {
      if (selectedRoom.value?.roomId != null) booking.room = String(selectedRoom.value.roomId);
      navigate('booking');
    };

    /* inject된 자식에서 partyroom.displayedRooms 등 ref/computed가 템플릿에서
       자동 unwrap 되도록 reactive()로 감쌉니다. (plain 객체 + 중첩 Ref → v-for 빈 화면) */
    const partyroom = reactive({
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      rooms,
      selectedRoom,
      selectRoom,
      activeTag,
      setActiveTag,
      allTags,
      searchText,
      filteredRooms,
      displayedRooms,
      hasMore,
      resetPagination,
      booking, bookingErrors, bookingTotal, submitBooking, clearBookingError,
      contactForm, contactErrors, submitContact, clearContactError,
      openFaq,
      toggleFaqAt,
      reserveThisRoom,
      config: window.SITE_CONFIG,
    });
    provide('partyroom', partyroom);

    return {
      theme, toggleTheme,
      page, sidebarOpen, mobileOpen, navigate, closeMobileMenu, toggleMobileMenu,
      toast, showToast,
      alertState, showAlert, closeAlert,
      confirmState, showConfirm, closeConfirm,
      blogModal, openBlogDetail, closeBlogDetail,
      rooms,
      selectedRoom,
      selectRoom,
      activeTag,
      allTags,
      searchText,
      filteredRooms,
      displayedRooms,
      hasMore,
      resetPagination,
      booking, bookingErrors, bookingTotal, submitBooking, clearBookingError,
      contactForm, contactErrors, submitContact, clearContactError,
      openFaq,
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
