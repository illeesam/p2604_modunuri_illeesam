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
    display:   [{ id: 'ecDispMng',     label: '전시관리' }],
    customer:  [{ id: 'syContactMng',  label: '문의관리' }, { id: 'ecChattMng', label: '채팅관리' }],
    system:    [{ id: 'sySiteMng', label: '사이트관리' }, { id: 'syCodeMng', label: '공통코드관리' },
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
    items.forEach(item => {
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
    ...Object.values(LEFT_MENUS).flat().map(p => p.id),
    ...Object.values(LEFT_MENUS).flat().map(p => p.id.replace('Mng', 'Dtl')),
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

      const addTab = (mngId) => {
        if (!openTabs.find(t => t.id === mngId)) {
          openTabs.push({ id: mngId, label: PAGE_LABELS[mngId] || mngId });
        }
      };

      const closeTab = (tabId, evt) => {
        if (evt) evt.stopPropagation();
        const idx = openTabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;
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
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); navigate(tab.id); }
        closeCtxMenu();
      };
      const ctxNewWindow = () => {
        window.open(`${location.pathname}${location.search}#page=${ctxMenu.tabId}`, '_blank');
        closeCtxMenu();
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
        const first = LEFT_MENUS[topId]?.[0];
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
      const showToast = (msg, type = 'success') => {
        const id = ++_toastId;
        toasts.push({ id, msg, type });
        setTimeout(() => {
          const idx = toasts.findIndex(t => t.id === id);
          if (idx !== -1) toasts.splice(idx, 1);
        }, TOAST_DURATION);
      };
      const closeToast = (id) => {
        const idx = toasts.findIndex(t => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      };

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
      const onSelectItem  = (type, item) => { commonFilter[type] = item; selectModal.show = false; };
      const clearFilter   = (type) => { commonFilter[type] = null; };

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
      const sidebarTab = ref('open');
      const isFav = (pgId) => favorites.includes(pgId);
      const toggleFav = (pgId) => {
        const idx = favorites.indexOf(pgId);
        if (idx === -1) favorites.push(pgId);
        else favorites.splice(idx, 1);
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
        openTabs, closeTab, activeTabId,
        ctxMenu, showCtxMenu, closeCtxMenu,
        ctxClose, ctxCloseLeft, ctxCloseRight, ctxCloseAll, ctxNewWindow,
        openNewWindow, openTabsWithGroup,
        activeTop, leftMenuOpen, setTopMenu,
        toasts, showToast, closeToast,
        confirmState, showConfirm, closeConfirm,
        refModal, showRefModal, closeRefModal,
        adminData: window.adminData,
        rightPanelOpen, commonFilter, selectModal, openSelectModal, closeSelectModal, onSelectItem, clearFilter,
        tabBarRef, scrollTabs,
        currentUser, loginModal, loginForm, regForm, loginError, userMenuShow,
        openLogin, closeLogin, doLogin, doLogout, doRegister,
        profileModal, profileForm, openProfile, saveProfile,
        pwModal, pwForm, pwError, openPwChange, savePwChange,
        favorites, sidebarTab, isFav, toggleFav, favList,
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
        <span>{{ tab.label }}</span>
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
        <div v-for="item in LEFT_MENUS[activeTop]" :key="item.id"
          class="left-nav-item" :class="{active: activeTabId===item.id}"
          @click="$event.ctrlKey ? openNewWindow(item.id) : navigate(item.id)"
          :title="'Ctrl+클릭: 새창'">
          {{ item.label }}
          <span class="left-fav-star" :class="{active: isFav(item.id)}"
            @click.stop="toggleFav(item.id)" :title="isFav(item.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
        </div>
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
        <dashboard-mng v-if="page==='dashboard'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" />
        <member-mng  v-else-if="page==='ecMemberMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <member-dtl  v-else-if="page==='ecMemberDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <prod-mng    v-else-if="page==='ecProdMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <prod-dtl    v-else-if="page==='ecProdDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <order-mng   v-else-if="page==='ecOrderMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <order-dtl   v-else-if="page==='ecOrderDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <claim-mng   v-else-if="page==='ecClaimMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <claim-dtl   v-else-if="page==='ecClaimDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <dliv-mng    v-else-if="page==='ecDlivMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <dliv-dtl    v-else-if="page==='ecDlivDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <coupon-mng  v-else-if="page==='ecCouponMng'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <coupon-dtl  v-else-if="page==='ecCouponDtl'"  :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <cache-mng   v-else-if="page==='ecCacheMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <cache-dtl   v-else-if="page==='ecCacheDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <disp-mng    v-else-if="page==='ecDispMng'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <disp-dtl    v-else-if="page==='ecDispDtl'"    :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <event-mng   v-else-if="page==='ecEventMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <event-dtl   v-else-if="page==='ecEventDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <contact-mng v-else-if="page==='syContactMng'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <contact-dtl v-else-if="page==='syContactDtl'" :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <chatt-mng   v-else-if="page==='ecChattMng'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :show-confirm="showConfirm" />
        <chatt-dtl   v-else-if="page==='ecChattDtl'"   :navigate="navigate" :admin-data="adminData" :show-ref-modal="showRefModal" :show-toast="showToast" :edit-id="editId" />
        <site-mng    v-else-if="page==='sySiteMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <site-dtl    v-else-if="page==='sySiteDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <code-mng    v-else-if="page==='syCodeMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <code-dtl    v-else-if="page==='syCodeDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <attach-mng  v-else-if="page==='syAttachMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <template-mng v-else-if="page==='syTemplateMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <template-dtl v-else-if="page==='syTemplateDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" :edit-id="editId" />
        <vendor-mng  v-else-if="page==='syVendorMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <vendor-dtl  v-else-if="page==='syVendorDtl'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <category-mng v-else-if="page==='ecCategoryMng'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <category-dtl v-else-if="page==='ecCategoryDtl'" :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <user-mng    v-else-if="page==='syUserMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <user-dtl    v-else-if="page==='syUserDtl'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <batch-mng   v-else-if="page==='syBatchMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <batch-dtl   v-else-if="page==='syBatchDtl'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :edit-id="editId" />
        <dept-mng    v-else-if="page==='syDeptMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <menu-mng    v-else-if="page==='syMenuMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <role-mng    v-else-if="page==='syRoleMng'"    :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <notice-mng  v-else-if="page==='ecNoticeMng'"  :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <alarm-mng   v-else-if="page==='syAlarmMng'"   :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <bbm-mng     v-else-if="page==='syBbmMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
        <bbs-mng     v-else-if="page==='syBbsMng'"     :navigate="navigate" :admin-data="adminData" :show-toast="showToast" :show-confirm="showConfirm" />
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
            <span v-if="commonFilter.site" class="popup-sel-name">{{ commonFilter.site.siteName }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="commonFilter.site" class="popup-sel-id">{{ commonFilter.site.siteCode }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매업체
            <span v-if="commonFilter.vendor" class="popup-sel-clear" @click.stop="clearFilter('vendor')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('vendor')">
            <span v-if="commonFilter.vendor" class="popup-sel-name">{{ commonFilter.vendor.vendorName }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="commonFilter.vendor" class="popup-sel-id">{{ commonFilter.vendor.vendorId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매사용자
            <span v-if="commonFilter.adminUser" class="popup-sel-clear" @click.stop="clearFilter('adminUser')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('adminUser')">
            <span v-if="commonFilter.adminUser" class="popup-sel-name">{{ commonFilter.adminUser.name }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="commonFilter.adminUser" class="popup-sel-id">{{ commonFilter.adminUser.adminUserId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">회원
            <span v-if="commonFilter.member" class="popup-sel-clear" @click.stop="clearFilter('member')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('member')">
            <span v-if="commonFilter.member" class="popup-sel-name">{{ commonFilter.member.name }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="commonFilter.member" class="popup-sel-id">{{ commonFilter.member.userId }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">주문
            <span v-if="commonFilter.order" class="popup-sel-clear" @click.stop="clearFilter('order')">✕</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('order')">
            <span v-if="commonFilter.order" class="popup-sel-name">{{ commonFilter.order.orderId }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="commonFilter.order" class="popup-sel-id">{{ commonFilter.order.userName }}</span>
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
      <div class="toast-progress"></div>
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
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxCloseAll">전체 닫기</div>
    <div class="tab-ctx-sep"></div>
    <div class="tab-ctx-item" @click="ctxNewWindow">↗ 새창</div>
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
  .component('DashboardMng', window.DashboardMng)
  .component('AdminRefModal', window.AdminRefModal)
  .component('MemberMng',  window.MemberMng)
  .component('MemberDtl',  window.MemberDtl)
  .component('MemberHist', window.MemberHist)
  .component('ProdMng',    window.ProdMng)
  .component('ProdDtl',    window.ProdDtl)
  .component('OrderMng',   window.OrderMng)
  .component('OrderDtl',   window.OrderDtl)
  .component('ClaimMng',   window.ClaimMng)
  .component('ClaimDtl',   window.ClaimDtl)
  .component('DlivMng',    window.DlivMng)
  .component('DlivDtl',    window.DlivDtl)
  .component('CouponMng',  window.CouponMng)
  .component('CouponDtl',  window.CouponDtl)
  .component('CacheMng',   window.CacheMng)
  .component('CacheDtl',   window.CacheDtl)
  .component('DispMng',    window.DispMng)
  .component('DispDtl',    window.DispDtl)
  .component('EventMng',   window.EventMng)
  .component('EventDtl',   window.EventDtl)
  .component('ContactMng', window.ContactMng)
  .component('ContactDtl', window.ContactDtl)
  .component('ChattMng',   window.ChattMng)
  .component('ChattDtl',   window.ChattDtl)
  .component('SiteMng',    window.SiteMng)
  .component('SiteDtl',    window.SiteDtl)
  .component('CodeMng',    window.CodeMng)
  .component('CodeDtl',    window.CodeDtl)
  .component('AttachMng',  window.AttachMng)
  .component('TemplateMng',window.TemplateMng)
  .component('TemplateDtl',window.TemplateDtl)
  .component('VendorMng',  window.VendorMng)
  .component('VendorDtl',  window.VendorDtl)
  .component('CategoryMng',window.CategoryMng)
  .component('CategoryDtl',window.CategoryDtl)
  .component('UserMng',    window.UserMng)
  .component('UserDtl',    window.UserDtl)
  .component('BatchMng',   window.BatchMng)
  .component('BatchDtl',   window.BatchDtl)
  .component('DeptMng',    window.DeptMng)
  .component('MenuMng',    window.MenuMng)
  .component('RoleMng',    window.RoleMng)
  .component('ComnAttachGrp', window.ComnAttachGrp)
  .component('NoticeMng',  window.NoticeMng)
  .component('NoticeDtl',  window.NoticeDtl)
  .component('AlarmMng',   window.AlarmMng)
  .component('AlarmDtl',   window.AlarmDtl)
  .component('BbmMng',     window.BbmMng)
  .component('BbmDtl',     window.BbmDtl)
  .component('BbsMng',     window.BbsMng)
  .component('BbsDtl',     window.BbsDtl)
  .component('BbmSelectModal', window.BbmSelectModal)
  .component('DeptTreeModal',  window.DeptTreeModal)
  .component('MenuTreeModal',  window.MenuTreeModal)
  .component('RoleTreeModal',  window.RoleTreeModal)
  .component('TemplatePreviewModal', window.TemplatePreviewModal)
  .component('TemplateSendModal',    window.TemplateSendModal)
  .component('SiteSelectModal',      window.SiteSelectModal)
  .component('VendorSelectModal',    window.VendorSelectModal)
  .component('AdminUserSelectModal', window.AdminUserSelectModal)
  .component('MemberSelectModal',    window.MemberSelectModal)
  .component('OrderSelectModal',     window.OrderSelectModal)
  .component('DispWidget',  window.DispWidget  || { template: '<div/>' })
  .component('DispPanel',   window.DispPanel   || { template: '<div/>' })
  .mount('#app');
})();
