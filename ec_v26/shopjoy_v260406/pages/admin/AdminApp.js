/* ShopJoy Admin - 메인 앱 (Top + Left Nav + 탭 라우팅 + 로그인) */
(function () {
  const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

  /* ── 메뉴 구조 ── */
  const TOP_MENUS = [
    { id: 'member',    label: '회원관리' },
    { id: 'product',   label: '상품관리' },
    { id: 'order',     label: '주문관리' },
    { id: 'promotion', label: '프로모션' },
    { id: 'display',   label: '전시관리' },
    { id: 'customer',  label: '고객센터' },
    { id: 'system',    label: '시스템' },
  ];

  const LEFT_MENUS = {
    member:    [{ id: 'ecMemberMng',   label: '회원관리' }],
    product:   [{ id: 'ecCategoryMng', label: '카테고리관리' }, { id: 'ecProdMng', label: '상품관리' }],
    order:     [{ id: 'ecOrderMng',    label: '주문관리' }, { id: 'ecClaimMng', label: '클레임관리' }, { id: 'ecDlivMng', label: '배송관리' }],
    promotion: [{ id: 'ecCouponMng',   label: '쿠폰관리' }, { id: 'ecCacheMng', label: '캐쉬관리' }, { id: 'ecEventMng', label: '이벤트관리' }],
    display:   [
      { group: '미리보기' },
      { id: 'ecDispAreaPreview',      label: '전시영역미리보기' },
      { id: 'ecDispWidgetLibPreview', label: '전시위젯Lib미리보기' },
      { group: '전시관리' },
      { id: 'ecDispAreaMng',          label: '전시영역관리' },
      { id: 'ecDispPanelMng',         label: '전시패널관리' },
      { id: 'ecDispWidgetLibMng',     label: '전시위젯Lib' },
    ],
    customer:  [{ id: 'ecCustInfoMng', label: '고객종합정보' }, { id: 'syContactMng',  label: '문의관리' }, { id: 'ecChattMng', label: '채팅관리' }],
    system:    [{ id: 'sySiteMng', label: '사이트관리' }, { id: 'syCodeMng', label: '공통코드관리' }, { id: 'syBrandMng', label: '브랜드관리' },
                { id: 'syAttachMng', label: '첨부관리' }, { id: 'syTemplateMng', label: '템플릿관리' },
                { id: 'syVendorMng', label: '업체정보' }, { id: 'syUserMng', label: '사용자관리' },
                { id: 'syBatchMng', label: '배치스케즐관리' },
                { id: 'syDeptMng', label: '부서관리' },
                { id: 'syMenuMng', label: '메뉴관리' },
                { id: 'syRoleMng', label: '권한관리' },
                { id: 'ecNoticeMng', label: '공지사항관리' }, { id: 'syAlarmMng', label: '알림관리' },
                { id: 'syBbmMng', label: '게시판관리' }, { id: 'syBbsMng', label: '게시글관리' }],
  };

  /* 페이지 → 상위메뉴 매핑 */
  const PAGE_TO_TOP = {};
  const PAGE_LABELS  = {};
  Object.entries(LEFT_MENUS).forEach(([top, items]) => {
    items.filter(item => item.id).forEach(item => {
      PAGE_TO_TOP[item.id] = top;
      PAGE_TO_TOP[item.id.replace('Mng', 'Dtl')] = top;
      PAGE_LABELS[item.id] = item.label;
      PAGE_LABELS[item.id.replace('Mng', 'Dtl')] = item.label + ' 상세';
    });
  });

  /* 대시보드는 별도 페이지 */
  PAGE_LABELS['dashboard'] = '대시보드';

  const ALL_PAGES = [
    'dashboard',
    ...Object.values(LEFT_MENUS).flat().filter(p => p.id).map(p => p.id),
    ...Object.values(LEFT_MENUS).flat().filter(p => p.id).map(p => p.id.replace('Mng', 'Dtl')),
  ];

  /* Mng 페이지의 탭 ID 반환 (Dtl → 부모 Mng) */
  const toTabId = pg => pg.endsWith('Dtl') ? pg.replace('Dtl', 'Mng') : pg;

  /* 인증방식 옵션 */
  const AUTH_METHODS = ['메인', 'SMS', 'OTP', 'Authenticator'];

  createApp({
    setup() {
      /* ── 페이지 & 라우팅 ── */
      const page   = ref('dashboard');
      const editId = ref(null);

      /* ── 탭 관리 ── */
      const openTabs = reactive([{ id: 'dashboard', label: '대시보드' }]);
      const activeTabId = computed(() => toTabId(page.value));
      const refreshKeys = reactive({});  // pageId → 재마운트 카운터

      /* ── 탭 고정 (keep-alive 시뮬레이션) ── */
      const keptTabIds = reactive(new Set());
      const toggleKeep = (tabId) => {
        if (keptTabIds.has(tabId)) keptTabIds.delete(tabId);
        else keptTabIds.add(tabId);
      };
      const PAGE_COMP_MAP = {
        'dashboard':'sy-dashboard-mng', 'ecMemberMng':'ec-member-mng', 'ecMemberDtl':'ec-member-dtl',
        'ecProdMng':'ec-prod-mng', 'ecProdDtl':'ec-prod-dtl',
        'ecOrderMng':'ec-order-mng', 'ecOrderDtl':'ec-order-dtl',
        'ecClaimMng':'ec-claim-mng', 'ecClaimDtl':'ec-claim-dtl',
        'ecDlivMng':'ec-dliv-mng', 'ecDlivDtl':'ec-dliv-dtl',
        'ecCouponMng':'ec-coupon-mng', 'ecCouponDtl':'ec-coupon-dtl',
        'ecCacheMng':'ec-cache-mng', 'ecCacheDtl':'ec-cache-dtl',
        'ecDispPanelMng':'ec-disp-panel-mng', 'ecDispAreaPreview':'ec-disp-area-preview', 'ecDispAreaMng':'ec-disp-area-mng',
        'ecDispPanelDtl':'ec-disp-panel-dtl',
        'ecDispWidgetLibMng':'ec-disp-widget-lib-mng', 'ecDispWidgetLibDtl':'ec-disp-widget-lib-dtl',
        'ecDispWidgetLibPreview':'ec-disp-widget-lib-preview',
        'ecEventMng':'ec-event-mng', 'ecEventDtl':'ec-event-dtl',
        'ecCustInfoMng':'ec-cust-info-mng',
        'syContactMng':'sy-contact-mng', 'syContactDtl':'sy-contact-dtl',
        'ecChattMng':'ec-chatt-mng', 'ecChattDtl':'ec-chatt-dtl',
        'sySiteMng':'sy-site-mng', 'sySiteDtl':'sy-site-dtl',
        'syCodeMng':'sy-code-mng', 'syCodeDtl':'sy-code-dtl',
        'syBrandMng':'sy-brand-mng', 'syAttachMng':'sy-attach-mng',
        'syTemplateMng':'sy-template-mng', 'syTemplateDtl':'sy-template-dtl',
        'syVendorMng':'sy-vendor-mng', 'syVendorDtl':'sy-vendor-dtl',
        'ecCategoryMng':'ec-category-mng', 'ecCategoryDtl':'ec-category-dtl',
        'syUserMng':'sy-user-mng', 'syUserDtl':'sy-user-dtl',
        'syBatchMng':'sy-batch-mng', 'syBatchDtl':'sy-batch-dtl',
        'syDeptMng':'sy-dept-mng', 'syMenuMng':'sy-menu-mng', 'syRoleMng':'sy-role-mng',
        'ecNoticeMng':'ec-notice-mng', 'syAlarmMng':'sy-alarm-mng',
        'syBbmMng':'sy-bbm-mng', 'syBbsMng':'sy-bbs-mng',
      };

      const addTab = (mngId) => {
        if (!openTabs.find(t => t.id === mngId)) {
          openTabs.push({ id: mngId, label: PAGE_LABELS[mngId] || mngId });
        }
      };

      const closeTab = (tabId, evt) => {
        if (evt) evt.stopPropagation();
        const idx = openTabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;
        keptTabIds.delete(tabId);
        openTabs.splice(idx, 1);
        if (activeTabId.value === tabId) {
          const next = openTabs[Math.min(idx, openTabs.length - 1)];
          if (next) navigate(next.id);
          else { page.value = 'dashboard'; editId.value = null; }
        }
      };

      /* ── 탭 컨텍스트 메뉴 ── */
      const ctxMenu = reactive({ show: false, x: 0, y: 0, tabId: null });
      const showCtxMenu = (evt, tabId) => {
        evt.preventDefault();
        ctxMenu.show = true; ctxMenu.x = evt.clientX; ctxMenu.y = evt.clientY; ctxMenu.tabId = tabId;
      };
      const closeCtxMenu = () => { ctxMenu.show = false; };

      const ctxClose = () => { closeTab(ctxMenu.tabId); closeCtxMenu(); };
      const ctxCloseLeft = () => {
        const idx = openTabs.findIndex(t => t.id === ctxMenu.tabId);
        if (idx > 0) {
          openTabs.splice(0, idx);
          if (!openTabs.find(t => t.id === activeTabId.value)) navigate(openTabs[0].id);
        }
        closeCtxMenu();
      };
      const ctxCloseRight = () => {
        const idx = openTabs.findIndex(t => t.id === ctxMenu.tabId);
        if (idx < openTabs.length - 1) {
          openTabs.splice(idx + 1);
          if (!openTabs.find(t => t.id === activeTabId.value)) navigate(openTabs[idx].id);
        }
        closeCtxMenu();
      };
      const ctxCloseAll = () => {
        const tab = openTabs.find(t => t.id === ctxMenu.tabId);
        keptTabIds.clear();
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); navigate(tab.id); }
        closeCtxMenu();
      };
      const ctxCloseOthers = () => {
        const tab = openTabs.find(t => t.id === ctxMenu.tabId);
        openTabs.forEach(t => { if (t.id !== ctxMenu.tabId) keptTabIds.delete(t.id); });
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); navigate(tab.id); }
        closeCtxMenu();
      };
      const ctxNewWindow = () => {
        window.open(`${location.pathname}${location.search}#page=${ctxMenu.tabId}`, '_blank');
        closeCtxMenu();
      };
      const ctxRefresh = () => {
        const id = ctxMenu.tabId;
        closeCtxMenu();
        if (keptTabIds.has(id)) {
          keptTabIds.delete(id);
          Vue.nextTick(() => keptTabIds.add(id));
        } else {
          refreshKeys[id] = (refreshKeys[id] || 0) + 1;
          if (page.value !== id) navigate(id);
        }
      };

      /* ── 새창 열기 ── */
      const openNewWindow = (pgId) => {
        window.open(`${location.pathname}${location.search}#page=${pgId}`, '_blank');
      };

      /* ── 열린 화면 목록 (가나다순) ── */
      const openTabsWithGroup = computed(() =>
        [...openTabs].map(tab => {
          const topId = PAGE_TO_TOP[tab.id];
          const topLabel = TOP_MENUS.find(t => t.id === topId)?.label || (tab.id === 'dashboard' ? '홈' : '');
          return { ...tab, topLabel };
        }).sort((a, b) => a.label.localeCompare(b.label, 'ko'))
      );

      /* ── 메뉴 상태 ── */
      const activeTop    = ref('member');
      const leftMenuOpen = ref(true);

      const setTopMenu = (topId) => {
        activeTop.value = topId;
        leftMenuOpen.value = true;
        const first = LEFT_MENUS[topId]?.find(p => p.id);
        if (first) navigate(first.id);
      };

      /* ── Hash routing ── */
      const readHash = () => {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const p   = new URLSearchParams(raw);
        const pg  = p.get('page');
        if (pg && ALL_PAGES.includes(pg)) {
          page.value = pg;
          if (PAGE_TO_TOP[pg]) activeTop.value = PAGE_TO_TOP[pg];
          addTab(toTabId(pg));
        }
        const id = p.get('id');
        editId.value = id !== null ? (isNaN(id) ? id : Number(id)) : null;
      };
      readHash();

      const navigate = (pg, opts = {}) => {
        page.value      = pg;
        editId.value    = opts.id ?? null;
        if (PAGE_TO_TOP[pg]) activeTop.value = PAGE_TO_TOP[pg];
        addTab(toTabId(pg));
        // 즐겨찾기 keep 설정이 있으면 자동으로 탭 고정
        const tabId = toTabId(pg);
        if (favKeepSet.has(tabId)) keptTabIds.add(tabId);
        const p2 = new URLSearchParams();
        p2.set('page', pg);
        if (opts.id != null) p2.set('id', opts.id);
        window.location.hash = p2.toString();
        window.scrollTo(0, 0);
      };

      window.addEventListener('hashchange', readHash);
      onBeforeUnmount(() => window.removeEventListener('hashchange', readHash));

      /* ── Toast (누적 스택) ── */
      const toasts  = reactive([]);
      let _toastId  = 0;
      const TOAST_DURATION = 3500;
      const showToast = (msg, type = 'success', duration = TOAST_DURATION) => {
        const id = ++_toastId;
        toasts.push({ id, msg, type, persistent: duration === 0 });
        if (duration !== 0) {
          setTimeout(() => {
            const idx = toasts.findIndex(t => t.id === id);
            if (idx !== -1) toasts.splice(idx, 1);
          }, duration);
        }
      };
      const closeToast = (id) => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      };

      /* ── API 응답 패널 ── */
      const apiResPanel = reactive({ show: false, res: null });
      const setApiRes = (res) => { apiResPanel.res = res; apiResPanel.show = true; };
      const closeApiResPanel = () => { apiResPanel.show = false; };

      /* ── Confirm ── */
      const confirmState = reactive({ show: false, title: '', msg: '', details: null, btnOk: '확인', btnCancel: '취소', resolve: null });
      const showConfirm  = (title, msg, opts = {}) =>
        new Promise(r => Object.assign(confirmState, {
          show: true, title, msg,
          details:   opts.details   || null,
          btnOk:     opts.btnOk     || '확인',
          btnCancel: opts.btnCancel || '취소',
          resolve: r,
        }));
      const closeConfirm = v => { confirmState.show = false; confirmState.resolve?.(v); };

      /* ── 참조 모달 ── */
      const refModal = reactive({ show: false, type: '', id: null });
      const showRefModal = (type, id) => { refModal.type = type; refModal.id = id; refModal.show = true; };
      const closeRefModal = () => { refModal.show = false; };

      /* ── 공통 필터 & 선택 모달 ── */
      const rightPanelOpen = ref(true);
      const commonFilter   = window.adminCommonFilter;
      const selectModal    = reactive({ type: '', show: false });
      const openSelectModal  = (type) => { selectModal.type = type; selectModal.show = true; };
      const closeSelectModal = () => { selectModal.show = false; selectModal.type = ''; };
      const onSelectItem  = (type, item) => {
        if      (type === 'site')      commonFilter.siteId   = item?.siteId   ?? null;
        else if (type === 'vendor')    commonFilter.vendorId = item?.vendorId  ?? null;
        else if (type === 'adminUser') commonFilter.userId   = item?.adminUserId ?? null;
        else if (type === 'member')    commonFilter.memberId = item?.memberId  ?? null;
        else if (type === 'order')     commonFilter.orderId  = item?.orderId   ?? null;
        selectModal.show = false;
      };
      const clearFilter   = (type) => {
        if      (type === 'site')      commonFilter.siteId   = null;
        else if (type === 'vendor')    commonFilter.vendorId = null;
        else if (type === 'adminUser') commonFilter.userId   = null;
        else if (type === 'member')    commonFilter.memberId = null;
        else if (type === 'order')     commonFilter.orderId  = null;
      };
      /* 공통 필터 표시용 헬퍼 (adminData에서 조회) */
      const filterSite      = computed(() => adminData.sites?.find(s => s.siteId   === commonFilter.siteId)   || null);
      const filterVendor    = computed(() => adminData.vendors?.find(v => v.vendorId === commonFilter.vendorId) || null);
      const filterAdminUser = computed(() => adminData.adminUsers?.find(u => u.adminUserId === commonFilter.userId) || null);
      const filterMember    = computed(() => adminData.members?.find(m => m.memberId === commonFilter.memberId) || null);
      const filterOrder     = computed(() => adminData.orders?.find(o => o.orderId  === commonFilter.orderId)  || null);

      /* ── 반응형: 화면 크기에 따라 사이드바 자동 열기/닫기 ── */
      const checkWidth = () => { leftMenuOpen.value = window.innerWidth >= 920; };
      onMounted(() => { checkWidth(); window.addEventListener('resize', checkWidth); });
      onBeforeUnmount(() => window.removeEventListener('resize', checkWidth));

      /* ── 탭바 좌우 스크롤 ── */
      const tabBarRef = ref(null);
      const scrollTabs = (dir) => {
        if (tabBarRef.value) tabBarRef.value.scrollBy({ left: dir * 180, behavior: 'smooth' });
      };

      /* ── 로그인 상태 ── */
      const currentUser = ref(null);
      const loginModal  = reactive({ show: false, tab: 'login' });
      const loginForm   = reactive({ email: 'admin1@demo.com', password: 'demo1234', authMethod: '메인' });
      const regForm     = reactive({ name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
      const loginError  = ref('');
      const userMenuShow = ref(false);

      /* 프로필 모달 */
      const profileModal = reactive({ show: false });
      const profileForm  = reactive({ name: '', phone: '', dept: '', email: '' });
      const openProfile  = () => {
        if (!currentUser.value) return;
        Object.assign(profileForm, { name: currentUser.value.name, phone: currentUser.value.phone, dept: currentUser.value.dept, email: currentUser.value.email });
        profileModal.show = true; userMenuShow.value = false;
      };
      const saveProfile  = () => {
        if (!profileForm.name) { showToast('이름을 입력하세요.', 'error'); return; }
        currentUser.value.name  = profileForm.name;
        currentUser.value.phone = profileForm.phone;
        currentUser.value.dept  = profileForm.dept;
        profileModal.show = false;
        showToast('프로필이 저장되었습니다.');
      };

      /* 비밀번호 변경 모달 */
      const pwModal  = reactive({ show: false });
      const pwForm   = reactive({ current: '', next: '', confirm: '' });
      const pwError  = ref('');
      const openPwChange = () => {
        Object.assign(pwForm, { current: '', next: '', confirm: '' });
        pwError.value = ''; pwModal.show = true; userMenuShow.value = false;
      };
      const savePwChange = () => {
        pwError.value = '';
        if (!pwForm.current || !pwForm.next || !pwForm.confirm) { pwError.value = '모든 항목을 입력하세요.'; return; }
        if (currentUser.value.password !== pwForm.current) { pwError.value = '현재 비밀번호가 올바르지 않습니다.'; return; }
        if (pwForm.next.length < 6) { pwError.value = '새 비밀번호는 6자 이상이어야 합니다.'; return; }
        if (pwForm.next !== pwForm.confirm) { pwError.value = '새 비밀번호가 일치하지 않습니다.'; return; }
        currentUser.value.password = pwForm.next;
        pwModal.show = false;
        showToast('비밀번호가 변경되었습니다.');
      };

      const openLogin = (tab = 'login') => {
        loginModal.tab = tab; loginModal.show = true; loginError.value = '';
      };
      const closeLogin = () => { loginModal.show = false; loginError.value = ''; };

      const doLogin = () => {
        loginError.value = '';
        if (!loginForm.email || !loginForm.password) { loginError.value = '이메일과 비밀번호를 입력하세요.'; return; }
        const u = window.adminData.adminUsers.find(x => x.email === loginForm.email && x.password === loginForm.password);
        if (!u) { loginError.value = '이메일 또는 비밀번호가 올바르지 않습니다.'; return; }
        if (u.status === '비활성') { loginError.value = '비활성 계정입니다. 관리자에게 문의하세요.'; return; }
        currentUser.value = u;
        const now = new Date();
        u.lastLogin = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        /* 모든 탭 닫고 대시보드로 */
        openTabs.splice(0);
        loginForm.email = ''; loginForm.password = '';
        closeLogin();
        navigate('dashboard');
        showToast(`${u.name}님 환영합니다.`);
      };

      const doLogout = () => {
        currentUser.value = null; userMenuShow.value = false;
        openTabs.splice(0);
        navigate('dashboard');
        showToast('로그아웃되었습니다.');
      };

      const doRegister = () => {
        loginError.value = '';
        if (!regForm.name || !regForm.email || !regForm.password) { loginError.value = '필수 항목을 입력하세요.'; return; }
        if (regForm.password !== regForm.confirmPw) { loginError.value = '비밀번호가 일치하지 않습니다.'; return; }
        if (window.adminData.adminUsers.find(x => x.email === regForm.email)) { loginError.value = '이미 사용 중인 이메일입니다.'; return; }
        const maxId = Math.max(...window.adminData.adminUsers.map(u => u.adminUserId), 0);
        const now = new Date().toISOString().slice(0, 10);
        window.adminData.adminUsers.push({
          adminUserId: maxId + 1,
          loginId: regForm.email.split('@')[0],
          name: regForm.name, email: regForm.email, password: regForm.password,
          phone: regForm.phone, role: regForm.role, dept: '', status: '활성',
          lastLogin: '-', regDate: now,
        });
        Object.assign(regForm, { name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
        loginModal.tab = 'login';
        loginError.value = '';
        showToast('가입이 완료되었습니다. 로그인해주세요.');
      };

      /* ── 즐겨찾기 ── */
      const favorites = reactive([]);
      const favKeepSet = reactive(new Set()); // 즐겨찾기별 keep 설정
      const sidebarTab = ref('open');
      const isFav = (pgId) => favorites.includes(pgId);
      const toggleFav = (pgId) => {
        const idx = favorites.indexOf(pgId);
        if (idx === -1) favorites.push(pgId);
        else { favorites.splice(idx, 1); favKeepSet.delete(pgId); }
      };
      const toggleFavKeep = (pgId) => {
        if (favKeepSet.has(pgId)) favKeepSet.delete(pgId);
        else favKeepSet.add(pgId);
        // 현재 열려있는 탭이면 keptTabIds에도 즉시 반영
        if (openTabs.find(t => t.id === pgId)) {
          if (favKeepSet.has(pgId)) keptTabIds.add(pgId);
          else keptTabIds.delete(pgId);
        }
      };
      const favList = computed(() =>
        favorites.map(pgId => {
          const topId = PAGE_TO_TOP[pgId];
          const topLabel = TOP_MENUS.find(t => t.id === topId)?.label || '';
          return { id: pgId, label: PAGE_LABELS[pgId] || pgId, topLabel };
        })
      );

      /* 루트 클릭 → 컨텍스트 메뉴·유저메뉴 닫기 */
      const onRootClick = () => { closeCtxMenu(); userMenuShow.value = false; };

      return {
        page, editId, navigate,
        TOP_MENUS, LEFT_MENUS, AUTH_METHODS,
        openTabs, closeTab, activeTabId, refreshKeys, keptTabIds, toggleKeep, PAGE_COMP_MAP,
        ctxMenu, showCtxMenu, closeCtxMenu,
        ctxClose, ctxCloseLeft, ctxCloseRight, ctxCloseOthers, ctxCloseAll, ctxNewWindow, ctxRefresh,
        openNewWindow, openTabsWithGroup,
        activeTop, leftMenuOpen, setTopMenu,
        toasts, showToast, closeToast,
        confirmState, showConfirm, closeConfirm,
        refModal, showRefModal, closeRefModal,
        adminData: window.adminData,
        rightPanelOpen, commonFilter, selectModal, openSelectModal, closeSelectModal, onSelectItem, clearFilter,
        filterSite, filterVendor, filterAdminUser, filterMember, filterOrder,
        tabBarRef, scrollTabs,
        currentUser, loginModal, loginForm, regForm, loginError, userMenuShow,
        openLogin, closeLogin, doLogin, doLogout, doRegister,
        profileModal, profileForm, openProfile, saveProfile,
        pwModal, pwForm, pwError, openPwChange, savePwChange,
        favorites, favKeepSet, sidebarTab, isFav, toggleFav, favList, toggleFavKeep,
        apiResPanel, setApiRes, closeApiResPanel,
        onRootClick,
      };
    },

    template: /* html */`
<div @click="onRootClick">
  <!-- ① TOP NAV -->
  <nav class="admin-top-nav">
    <button class="sidebar-toggle-btn" @click.stop="leftMenuOpen=!leftMenuOpen" title="사이드바">☰</button>
    <span class="brand" @click="navigate('dashboard')">ShopJoy</span>
    <div class="top-nav-menus">
      <span v-for="tm in TOP_MENUS" :key="tm.id"
        class="top-nav-item" :class="{active: activeTop===tm.id}"
        @click="setTopMenu(tm.id)">{{ tm.label }}</span>
    </div>

    <!-- 로그인/유저 영역 -->
    <div class="top-nav-user" @click.stop>
      <template v-if="currentUser">
        <span class="user-name-label">{{ currentUser.name }}</span>
        <button class="user-avatar-btn" @click="userMenuShow=!userMenuShow" :title="currentUser.email">
          {{ currentUser.name[0] }}
        </button>
        <div v-if="userMenuShow" class="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">{{ currentUser.name }}</div>
            <div class="user-dropdown-role">{{ currentUser.role }}</div>
            <div class="user-dropdown-email">{{ currentUser.email }}</div>
          </div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item" @click="openProfile">🙍 프로필</div>
          <div class="user-dropdown-item" @click="openPwChange">🔑 비밀번호 변경</div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item danger" @click="doLogout">↩ 로그아웃</div>
        </div>
      </template>
      <template v-else>
        <button class="login-btn" @click="openLogin('login')">🔐 로그인</button>
      </template>
    </div>
  </nav>

  <!-- ② TAB BAR -->
  <div class="admin-tab-bar-wrap">
    <button class="tab-scroll-btn" @click="scrollTabs(-1)" title="왼쪽">&#8249;</button>
    <div class="admin-tab-bar" ref="tabBarRef">
      <div v-for="tab in openTabs" :key="tab.id"
        class="admin-tab" :class="{active: activeTabId===tab.id}"
        @click="navigate(tab.id)"
        @contextmenu.prevent="showCtxMenu($event, tab.id)">
        <span @click.stop="toggleKeep(tab.id)"
          :title="keptTabIds.has(tab.id) ? '고정 해제' : '고정 (탭 전환 시 상태 유지)'"
          style="font-size:9px;cursor:pointer;margin-right:3px;transition:all .15s;flex-shrink:0;line-height:1;"
          :style="keptTabIds.has(tab.id) ? 'opacity:1;color:#1565c0;' : 'opacity:.2;color:#999;'">📌</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-close-btn" @click.stop="closeTab(tab.id, $event)">✕</span>
      </div>
    </div>
    <button class="tab-scroll-btn" @click="scrollTabs(1)" title="오른쪽">&#8250;</button>
  </div>

  <!-- ③ BODY -->
  <div class="admin-body">

    <!-- Left Sidebar -->
    <nav class="admin-left-nav" :class="{closed: !leftMenuOpen}">
      <div class="left-nav-top">
        <div class="left-nav-group-title">{{ TOP_MENUS.find(t=>t.id===activeTop)?.label }}</div>
        <template v-for="item in LEFT_MENUS[activeTop]" :key="item.group || item.id">
          <div v-if="item.group" class="left-nav-group-header">{{ item.group }}</div>
          <div v-else class="left-nav-item left-nav-sub-item" :class="{active: activeTabId===item.id}"
            @click="$event.ctrlKey ? openNewWindow(item.id) : navigate(item.id)"
            :title="'Ctrl+클릭: 새창'">
            {{ item.label }}
            <span class="left-fav-star" :class="{active: isFav(item.id)}"
              @click.stop="toggleFav(item.id)" :title="isFav(item.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
          </div>
        </template>
      </div>

      <!-- 열린화면 / 즐겨찾기 (하단 고정) -->
      <div class="left-nav-open-section">
        <!-- 목록 (위) -->
        <div class="left-nav-open-list">
          <!-- 즐겨찾기 목록 -->
          <template v-if="sidebarTab==='fav'">
            <div v-if="favList.length===0" class="left-nav-open-empty">즐겨찾기가 없습니다.</div>
            <div v-for="fav in favList" :key="fav.id"
              class="left-nav-open-item" :class="{active: activeTabId===fav.id}"
              @click="navigate(fav.id)">
              <span @click.stop="toggleFavKeep(fav.id)"
                :title="favKeepSet.has(fav.id) ? '고정 해제' : '고정 (열 때 상태 유지)'"
                style="font-size:9px;cursor:pointer;margin-right:4px;flex-shrink:0;transition:all .15s;"
                :style="favKeepSet.has(fav.id) ? 'opacity:1;color:#1565c0;' : 'opacity:.22;color:#999;'">📌</span>
              <span class="left-nav-open-path">
                <span class="left-nav-open-group">{{ fav.topLabel }}</span>
                <span class="left-nav-open-sep"> › </span>
                <span class="left-nav-open-label">{{ fav.label }}</span>
              </span>
              <span class="left-fav-star active" @click.stop="toggleFav(fav.id)" title="즐겨찾기 해제">★</span>
            </div>
          </template>
          <!-- 열린화면 목록 -->
          <template v-if="sidebarTab==='open'">
            <div v-if="openTabsWithGroup.length===0" class="left-nav-open-empty">열린 화면이 없습니다.</div>
            <div v-for="tab in openTabsWithGroup" :key="tab.id"
              class="left-nav-open-item" :class="{active: activeTabId===tab.id}"
              @click="navigate(tab.id)">
              <span class="left-nav-open-path">
                <span class="left-nav-open-group">{{ tab.topLabel }}</span>
                <span class="left-nav-open-sep"> › </span>
                <span class="left-nav-open-label">{{ tab.label }}</span>
              </span>
              <span class="left-fav-star" :class="{active: isFav(tab.id)}"
                @click.stop="toggleFav(tab.id)" :title="isFav(tab.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
              <span class="left-nav-open-close" @click.stop="closeTab(tab.id, $event)">✕</span>
            </div>
          </template>
        </div>
        <!-- 탭 버튼 (최하단 고정) -->
        <div class="left-nav-section-tabs">
          <button class="left-nav-section-tab" :class="{active: sidebarTab==='fav'}"
            @click="sidebarTab='fav'">★ 즐겨찾기</button>
          <button class="left-nav-section-tab" :class="{active: sidebarTab==='open'}"
            @click="sidebarTab='open'">열린화면</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="admin-main">
      <div class="admin-wrap">
        <!-- 고정된 탭: v-show로 항상 마운트 유지, 전환 시 상태 보존 -->
        <component
          v-for="keptId in keptTabIds" :key="'kept_' + keptId"
          :is="PAGE_COMP_MAP[keptId]"
          v-show="page === keptId"
          :navigate="navigate" :admin-data="adminData"
          :show-ref-modal="showRefModal" :show-toast="showToast"
          :show-confirm="showConfirm" :set-api-res="setApiRes"
          :edit-id="editId"
        />
        <!-- 비고정 현재 탭: 전환 시 재마운트 -->
        <div v-if="!keptTabIds.has(page)" :key="page + '_' + (refreshKeys[page] || 0)" style="display:contents;">
        <sy-dashboard-mng v-if="page==='dashboard'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" />
        <ec-member-mng  v-else-if="page==='ecMemberMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-member-dtl  v-else-if="page==='ecMemberDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-prod-mng    v-else-if="page==='ecProdMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-prod-dtl    v-else-if="page==='ecProdDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-order-mng   v-else-if="page==='ecOrderMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-order-dtl   v-else-if="page==='ecOrderDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-claim-mng   v-else-if="page==='ecClaimMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-claim-dtl   v-else-if="page==='ecClaimDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-dliv-mng    v-else-if="page==='ecDlivMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-dliv-dtl    v-else-if="page==='ecDlivDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-coupon-mng  v-else-if="page==='ecCouponMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-coupon-dtl  v-else-if="page==='ecCouponDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-cache-mng   v-else-if="page==='ecCacheMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-cache-dtl   v-else-if="page==='ecCacheDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-disp-panel-mng  v-else-if="page==='ecDispPanelMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-disp-area-preview v-else-if="page==='ecDispAreaPreview'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-disp-area-mng     v-else-if="page==='ecDispAreaMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <ec-disp-panel-dtl      v-else-if="page==='ecDispPanelDtl'"      :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-disp-widget-lib-mng     v-else-if="page==='ecDispWidgetLibMng'"     :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-disp-widget-lib-dtl     v-else-if="page==='ecDispWidgetLibDtl'"     :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-disp-widget-lib-preview v-else-if="page==='ecDispWidgetLibPreview'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-event-mng   v-else-if="page==='ecEventMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-event-dtl   v-else-if="page==='ecEventDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-cust-info-mng v-else-if="page==='ecCustInfoMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-contact-mng v-else-if="page==='syContactMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-contact-dtl v-else-if="page==='syContactDtl'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-chatt-mng   v-else-if="page==='ecChattMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-chatt-dtl   v-else-if="page==='ecChattDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-site-mng    v-else-if="page==='sySiteMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-site-dtl    v-else-if="page==='sySiteDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-code-mng    v-else-if="page==='syCodeMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-code-dtl    v-else-if="page==='syCodeDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-brand-mng   v-else-if="page==='syBrandMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-attach-mng  v-else-if="page==='syAttachMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-template-mng v-else-if="page==='syTemplateMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-template-dtl v-else-if="page==='syTemplateDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-vendor-mng  v-else-if="page==='syVendorMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-vendor-dtl  v-else-if="page==='syVendorDtl'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <ec-category-mng v-else-if="page==='ecCategoryMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-category-dtl v-else-if="page==='ecCategoryDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-user-mng    v-else-if="page==='syUserMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-user-dtl    v-else-if="page==='syUserDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-batch-mng   v-else-if="page==='syBatchMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-batch-dtl   v-else-if="page==='syBatchDtl'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" :edit-id="editId" />
        <sy-dept-mng    v-else-if="page==='syDeptMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-menu-mng    v-else-if="page==='syMenuMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-role-mng    v-else-if="page==='syRoleMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <ec-notice-mng  v-else-if="page==='ecNoticeMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-alarm-mng   v-else-if="page==='syAlarmMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-bbm-mng     v-else-if="page==='syBbmMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        <sy-bbs-mng     v-else-if="page==='syBbsMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :set-api-res="setApiRes" />
        </div><!-- /비고정 탭 래퍼 -->
      </div>
    </div>

    <!-- Right Panel: 공통 필터 -->
    <div class="admin-right-panel" :class="{collapsed: !rightPanelOpen}">
      <div class="right-panel-header" @click="rightPanelOpen=!rightPanelOpen">
        <span class="right-panel-title">공통 필터</span>
        <span style="font-size:11px;color:#bbb;">{{ rightPanelOpen ? '▶' : '◀' }}</span>
      </div>
      <div v-show="rightPanelOpen" class="right-panel-body">
        <div class="popup-sel">
          <div class="popup-sel-label">사이트 <span style="color:#e8587a;font-size:10px;">필수</span></div>
          <div class="popup-sel-row" @click="openSelectModal('site')">
            <span v-if="filterSite" class="popup-sel-name">{{ filterSite.siteNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterSite" class="popup-sel-id">{{ filterSite.siteCode }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매업체
            <span v-if="commonFilter.vendorId" class="popup-sel-clear" @click.stop="clearFilter('vendor')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('vendor')">
            <span v-if="filterVendor" class="popup-sel-name">{{ filterVendor.vendorNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterVendor" class="popup-sel-id">{{ filterVendor.vendorId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매사용자
            <span v-if="commonFilter.userId" class="popup-sel-clear" @click.stop="clearFilter('adminUser')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('adminUser')">
            <span v-if="filterAdminUser" class="popup-sel-name">{{ filterAdminUser.name }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterAdminUser" class="popup-sel-id">{{ filterAdminUser.adminUserId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">회원
            <span v-if="commonFilter.memberId" class="popup-sel-clear" @click.stop="clearFilter('member')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('member')">
            <span v-if="filterMember" class="popup-sel-name">{{ filterMember.memberNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterMember" class="popup-sel-id">{{ filterMember.memberId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">주문
            <span v-if="commonFilter.orderId" class="popup-sel-clear" @click.stop="clearFilter('order')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('order')">
            <span v-if="filterOrder" class="popup-sel-name">{{ filterOrder.orderId }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterOrder" class="popup-sel-id">{{ filterOrder.userNm }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /admin-body -->

  <!-- 선택 모달들 -->
  <site-select-modal v-if="selectModal.show && selectModal.type==='site'" :admin-data="adminData" @select="onSelectItem('site', $event)" @close="closeSelectModal" />
  <vendor-select-modal v-if="selectModal.show && selectModal.type==='vendor'" :admin-data="adminData" @select="onSelectItem('vendor', $event)" @close="closeSelectModal" />
  <admin-user-select-modal v-if="selectModal.show && selectModal.type==='adminUser'" :admin-data="adminData" @select="onSelectItem('adminUser', $event)" @close="closeSelectModal" />
  <member-select-modal v-if="selectModal.show && selectModal.type==='member'" :admin-data="adminData" @select="onSelectItem('member', $event)" @close="closeSelectModal" />
  <order-select-modal v-if="selectModal.show && selectModal.type==='order'" :admin-data="adminData" @select="onSelectItem('order', $event)" @close="closeSelectModal" />

  <!-- 참조 모달 -->
  <admin-ref-modal v-if="refModal.show" :state="refModal" :admin-data="adminData" @close="closeRefModal" />

  <!-- Confirm -->
  <div v-if="confirmState.show" class="modal-overlay" @click.self="closeConfirm(false)">
    <div class="confirm-box">
      <div class="confirm-icon">💾</div>
      <div class="confirm-title">{{ confirmState.title }}</div>
      <div class="confirm-msg">{{ confirmState.msg }}</div>
      <!-- 상세 배지 (details 있을 때만) -->
      <div v-if="confirmState.details && confirmState.details.length" class="confirm-details">
        <span v-for="d in confirmState.details" :key="d.label"
          class="badge confirm-detail-badge" :class="d.cls">{{ d.label }}</span>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" @click="closeConfirm(false)">{{ confirmState.btnCancel }}</button>
        <button class="btn btn-primary" @click="closeConfirm(true)">{{ confirmState.btnOk }}</button>
      </div>
    </div>
  </div>

  <!-- Toast 누적 스택 -->
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id"
      class="toast-item" :class="'toast-'+t.type"
      @click="closeToast(t.id)">
      <span class="toast-icon">{{ t.type==='error' ? '✕' : t.type==='warning' ? '⚠' : t.type==='info' ? 'ℹ' : '✓' }}</span>
      <span class="toast-msg">{{ t.msg }}</span>
      <span class="toast-close-x">✕</span>
      <div v-if="!t.persistent" class="toast-progress"></div>
    </div>
  </div>

  <!-- API 응답 패널 -->
  <div v-if="apiResPanel.show" style="position:fixed;bottom:20px;right:20px;z-index:8900;width:440px;max-height:55vh;background:#1e1e2e;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#2a2a3e;flex-shrink:0;">
      <span style="font-size:12px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;">
        API 응답
        <span v-if="apiResPanel.res" :style="{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'600',background:apiResPanel.res.ok?'#166534':'#7f1d1d',color:apiResPanel.res.ok?'#4ade80':'#f87171'}">
          {{ apiResPanel.res.ok ? '✓ 성공' : '✕ 오류' }}
          <template v-if="apiResPanel.res.status"> · HTTP {{ apiResPanel.res.status }}</template>
        </span>
      </span>
      <button @click="closeApiResPanel" style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px;" title="닫기">✕</button>
    </div>
    <div style="overflow-y:auto;padding:12px 14px;flex:1;">
      <pre style="margin:0;font-size:11px;color:#e2e8f0;white-space:pre-wrap;word-break:break-all;line-height:1.6;">{{ JSON.stringify(apiResPanel.res, null, 2) }}</pre>
    </div>
  </div>

  <!-- 탭 컨텍스트 메뉴 -->
  <div v-if="ctxMenu.show"
    class="tab-ctx-menu"
    :style="{left: ctxMenu.x+'px', top: ctxMenu.y+'px'}"
    @click.stop>
    <div class="tab-ctx-item" @click="ctxClose">현재 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseLeft">왼쪽 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseRight">오른쪽 닫기</div>
    <div class="tab-ctx-item" @click="ctxCloseOthers">기타 닫기</div>
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxCloseAll">전체 닫기</div>
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxNewWindow">↗ 새창</div>
    <div class="tab-ctx-item" @click="ctxRefresh">↺ 새로고침</div>
  </div>

  <!-- 프로필 모달 -->
  <div v-if="profileModal.show" class="modal-overlay" @click.self="profileModal.show=false">
    <div class="modal-box" style="max-width:440px;">
      <div class="modal-header">
        <span class="modal-title">🙍 프로필</span>
        <span class="modal-close" @click="profileModal.show=false">✕</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:#fff5f7;border-radius:10px;">
        <div style="width:54px;height:54px;border-radius:50%;background:#e8587a;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ currentUser?.name[0] }}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">{{ currentUser?.name }}</div>
          <div style="font-size:12px;color:#e8587a;font-weight:600;margin-top:3px;">{{ currentUser?.role }}</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">가입일: {{ currentUser?.regDate }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">이름 <span class="req">*</span></label>
          <input class="form-control" v-model="profileForm.name" placeholder="이름" />
        </div>
        <div class="form-group">
          <label class="form-label">연락처</label>
          <input class="form-control" v-model="profileForm.phone" placeholder="010-0000-0000" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">이메일</label>
        <div class="readonly-field">{{ profileForm.email }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">부서</label>
        <input class="form-control" v-model="profileForm.dept" placeholder="부서명" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="saveProfile">저장</button>
        <button class="btn btn-secondary" @click="profileModal.show=false">취소</button>
      </div>
    </div>
  </div>

  <!-- 비밀번호 변경 모달 -->
  <div v-if="pwModal.show" class="modal-overlay" @click.self="pwModal.show=false">
    <div class="modal-box" style="max-width:380px;">
      <div class="modal-header">
        <span class="modal-title">🔑 비밀번호 변경</span>
        <span class="modal-close" @click="pwModal.show=false">✕</span>
      </div>
      <div class="form-group">
        <label class="form-label">현재 비밀번호 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.current" placeholder="현재 비밀번호" autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label class="form-label">새 비밀번호 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.next" placeholder="새 비밀번호 (6자 이상)" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label class="form-label">새 비밀번호 확인 <span class="req">*</span></label>
        <input class="form-control" type="password" v-model="pwForm.confirm" placeholder="새 비밀번호 재입력" @keyup.enter="savePwChange" autocomplete="new-password" />
      </div>
      <div v-if="pwError" class="login-error">{{ pwError }}</div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="savePwChange">변경</button>
        <button class="btn btn-secondary" @click="pwModal.show=false">취소</button>
      </div>
    </div>
  </div>

  <!-- 로그인 / 회원가입 모달 -->
  <div v-if="loginModal.show" class="modal-overlay" @click.self="closeLogin">
    <div class="login-modal-box">
      <div class="login-modal-header">
        <div class="login-tabs">
          <span :class="{active: loginModal.tab==='login'}"    @click="loginModal.tab='login';    loginError=''">로그인</span>
          <span :class="{active: loginModal.tab==='register'}" @click="loginModal.tab='register'; loginError=''">회원가입</span>
        </div>
        <span class="modal-close" @click="closeLogin">✕</span>
      </div>

      <!-- 로그인 폼 -->
      <div v-if="loginModal.tab==='login'">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input class="form-control" v-model="loginForm.email" placeholder="이메일 입력" @keyup.enter="doLogin" autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input class="form-control" type="password" v-model="loginForm.password" placeholder="비밀번호 입력" @keyup.enter="doLogin" autocomplete="current-password" />
        </div>
        <div class="form-group">
          <label class="form-label">인증방식</label>
          <div class="auth-methods">
            <label v-for="m in AUTH_METHODS" :key="m"
              class="auth-method-item" :class="{active: loginForm.authMethod===m}">
              <input type="radio" :value="m" v-model="loginForm.authMethod" style="display:none" />
              {{ m }}
            </label>
          </div>
        </div>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
        <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="doLogin">로그인</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
          <span>계정이 없으신가요?</span>
          <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="loginModal.tab='register';loginError=''">회원가입</span>
        </div>
        <div style="margin-top:14px;padding:10px 12px;background:#f8f9fa;border-radius:6px;font-size:11px;color:#888;line-height:1.8;">
          <b>테스트 계정</b><br>
          admin1@demo.com / demo1234<br>
          oper1@demo.com / demo1234
        </div>
      </div>

      <!-- 회원가입 폼 -->
      <div v-if="loginModal.tab==='register'">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">이름 <span class="req">*</span></label>
            <input class="form-control" v-model="regForm.name" placeholder="이름" />
          </div>
          <div class="form-group">
            <label class="form-label">연락처</label>
            <input class="form-control" v-model="regForm.phone" placeholder="010-0000-0000" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">이메일 <span class="req">*</span></label>
          <input class="form-control" v-model="regForm.email" placeholder="이메일 입력" autocomplete="email" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">비밀번호 <span class="req">*</span></label>
            <input class="form-control" type="password" v-model="regForm.password" placeholder="비밀번호" />
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호 확인 <span class="req">*</span></label>
            <input class="form-control" type="password" v-model="regForm.confirmPw" placeholder="재입력" @keyup.enter="doRegister" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">권한</label>
          <select class="form-control" v-model="regForm.role">
            <option>슈퍼관리자</option><option>관리자</option><option>운영자</option><option>영업관리자</option><option>일반사용자</option>
          </select>
        </div>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
        <button class="btn btn-primary" style="width:100%;margin-top:4px;" @click="doRegister">가입하기</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#aaa;">
          <span>이미 계정이 있으신가요?</span>
          <span style="color:#e8587a;cursor:pointer;margin-left:6px;font-weight:600;" @click="loginModal.tab='login';loginError=''">로그인</span>
        </div>
      </div>
    </div>
  </div>
</div>
`,
  })
  /* ── components/disp/ (전시 핵심 컴포넌트) ── */
  .component('DispX01Ui',        window.DispX01Ui)
  .component('DispX02Area',      window.DispX02Area)
  .component('DispX03Panel',     window.DispX03Panel        || { template: '<div/>' })
  .component('DispX04Widget',    window.DispX04Widget       || { template: '<div/>' })
  .component('BarcodeWidget',   window.BarcodeWidget   || { template: '<div/>' })
  .component('CountdownWidget', window.CountdownWidget || { template: '<div/>' })
  /* ── components/comp/ (공통 컴포넌트) ── */
  .component('BaseAttachGrp',  window.BaseAttachGrp)
  /* ── pages/admin/ (공통) ── */
  .component('AdminRefModal',  window.AdminRefModal)
  /* ── pages/admin/ec/ — 회원 ── */
  .component('EcMemberMng',    window.EcMemberMng)
  .component('EcMemberDtl',    window.EcMemberDtl)
  .component('EcMemberHist',   window.EcMemberHist)
  /* ── pages/admin/ec/ — 상품 ── */
  .component('EcProdMng',      window.EcProdMng)
  .component('EcProdDtl',      window.EcProdDtl)
  .component('EcProdHist',     window.EcProdHist)
  /* ── pages/admin/ec/ — 주문 ── */
  .component('EcOrderMng',     window.EcOrderMng)
  .component('EcOrderDtl',     window.EcOrderDtl)
  .component('EcOrderHist',    window.EcOrderHist)
  /* ── pages/admin/ec/ — 클레임 ── */
  .component('EcClaimMng',     window.EcClaimMng)
  .component('EcClaimDtl',     window.EcClaimDtl)
  .component('EcClaimHist',    window.EcClaimHist)
  /* ── pages/admin/ec/ — 배송 ── */
  .component('EcDlivMng',      window.EcDlivMng)
  .component('EcDlivDtl',      window.EcDlivDtl)
  .component('EcDlivHist',     window.EcDlivHist)
  /* ── pages/admin/ec/ — 쿠폰/캐쉬 ── */
  .component('EcCouponMng',    window.EcCouponMng)
  .component('EcCouponDtl',    window.EcCouponDtl)
  .component('EcCacheMng',     window.EcCacheMng)
  .component('EcCacheDtl',     window.EcCacheDtl)
  /* ── pages/admin/ec/ — 전시관리 ── */
  .component('EcDispPanelMng',        window.EcDispPanelMng)
  .component('EcDispPanelDtl',        window.EcDispPanelDtl)
  .component('EcDispAreaMng',         window.EcDispAreaMng)
  .component('EcDispAreaPreview',     window.EcDispAreaPreview)
  .component('EcDispWidgetLibMng',    window.EcDispWidgetLibMng)
  .component('EcDispWidgetLibDtl',    window.EcDispWidgetLibDtl)
  .component('EcDispWidgetLibPreview',window.EcDispWidgetLibPreview)
  /* ── pages/admin/ec/ — 카테고리 ── */
  .component('EcCategoryMng',  window.EcCategoryMng)
  .component('EcCategoryDtl',  window.EcCategoryDtl)
  /* ── pages/admin/ec/ — 이벤트/공지 ── */
  .component('EcEventMng',     window.EcEventMng)
  .component('EcEventDtl',     window.EcEventDtl)
  .component('EcNoticeMng',    window.EcNoticeMng)
  .component('EcNoticeDtl',    window.EcNoticeDtl)
  /* ── pages/admin/ec/ — 채팅/고객 ── */
  .component('EcChattMng',     window.EcChattMng)
  .component('EcChattDtl',     window.EcChattDtl)
  .component('EcCustInfoMng',  window.EcCustInfoMng)
  /* ── pages/admin/sy/ — 대시보드 ── */
  .component('SyDashboardMng', window.SyDashboardMng)
  /* ── pages/admin/sy/ — 사용자/권한/조직 ── */
  .component('SyUserMng',      window.SyUserMng)
  .component('SyUserDtl',      window.SyUserDtl)
  .component('SyDeptMng',      window.SyDeptMng)
  .component('SyMenuMng',      window.SyMenuMng)
  .component('SyRoleMng',      window.SyRoleMng)
  /* ── pages/admin/sy/ — 사이트/코드/브랜드 ── */
  .component('SySiteMng',      window.SySiteMng)
  .component('SySiteDtl',      window.SySiteDtl)
  .component('SyCodeMng',      window.SyCodeMng)
  .component('SyCodeDtl',      window.SyCodeDtl)
  .component('SyBrandMng',     window.SyBrandMng)
  /* ── pages/admin/sy/ — 템플릿/업체/첨부 ── */
  .component('SyTemplateMng',  window.SyTemplateMng)
  .component('SyTemplateDtl',  window.SyTemplateDtl)
  .component('SyVendorMng',    window.SyVendorMng)
  .component('SyVendorDtl',    window.SyVendorDtl)
  .component('SyAttachMng',    window.SyAttachMng)
  /* ── pages/admin/sy/ — 배치 ── */
  .component('SyBatchMng',     window.SyBatchMng)
  .component('SyBatchDtl',     window.SyBatchDtl)
  .component('SyBatchHist',    window.SyBatchHist)
  /* ── pages/admin/sy/ — 알림/게시판/문의 ── */
  .component('SyAlarmMng',     window.SyAlarmMng)
  .component('SyAlarmDtl',     window.SyAlarmDtl)
  .component('SyBbmMng',       window.SyBbmMng)
  .component('SyBbmDtl',       window.SyBbmDtl)
  .component('SyBbsMng',       window.SyBbsMng)
  .component('SyBbsDtl',       window.SyBbsDtl)
  .component('SyContactMng',   window.SyContactMng)
  .component('SyContactDtl',   window.SyContactDtl)
  /* ── components/modals/ — 선택 모달 ── */
  .component('AdminUserSelectModal', window.AdminUserSelectModal)
  .component('BbmSelectModal',       window.BbmSelectModal)
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
  .component('DispPreviewModal',     window.DispPreviewModal || { template: '<div/>' })
  .component('DispUiModal',          window.DispUiModal      || { template: '<div/>' })
  .component('TemplatePreviewModal', window.TemplatePreviewModal)
  .component('TemplateSendModal',    window.TemplateSendModal)
  .mount('#app');
})();
