/* mfeShell.js — 마이크로프론트엔드 데모의 "메인프레임(shell)" 앱 본체.
 *
 * shopjoy_v260406/lib/app/boAppBase.js(3,289줄, PAGE_COMP_MAP + v-else-if 183분기)를
 * 그대로 재사용하지 않고, 훨씬 작은 버전을 새로 짰다 — 이 데모의 핵심이 "라우팅을
 * 도메인이 스스로 등록(window.MFE_REGISTRY)하고, 셸은 그 등록 결과만 그려준다"는
 * 구조 자체이기 때문이다(라우팅 하드코딩을 그대로 들고 오면 데모 취지와 모순된다).
 *
 * 대신 아래는 원본 boAppBase.js 에서 "메인프레임 공용 자원"에 해당하는 부분만
 * 최대한 같은 패턴으로 재현했다 — 인증(boAuthStore.saLogin), 토스트/컨펌 UI,
 * CSS 클래스(bo-global-style01.css 그대로 재사용)까지 전부 실제 프로젝트 코드다.
 *
 * window.mfeBootShell(topMenus) — 즉시 실행하지 않고 함수로 노출한다. 호출자가
 * 대메뉴 목록을 넘긴다:
 *   - bo-ap-global/mfe.html: 7개 도메인 전부 → 통합 데모 화면
 *   - bo-ap-global/mfe-{조합}.html: 대메뉴 일부만 골라 조합(예: mfe-sy.html, mfe-sy-pd.html)
 *   - 각 도메인 폴더의 dev.html: 자기 메뉴 1개만 → 그 도메인 단독 실행 화면
 *     (다른 도메인 manifest.js 를 전혀 안 불러오니, 이게 실제로 되면 "이 도메인이
 *     다른 도메인 없이도, 셸의 공용 런타임만으로 독립 실행된다"는 증거가 된다)
 * 호출 시점에는 topMenus 에 나온 도메인들의 manifest.js 가 이미 로드 완료돼
 * window.MFE_REGISTRY 에 해당 화면들이 등록된 상태여야 한다.
 */
(function () {
  const { createApp, reactive, ref, computed, watch, onMounted, onBeforeUnmount, onErrorCaptured } = Vue;

  window.mfeBootShell = function (topMenus) {
  const TOP_MENUS = topMenus;

  const App = {
    name: 'MfeShellApp',
    setup() {
      /* ══════════════════════════ 인증 (실제 boAuthStore 재사용) ══════════════════════════ */
      const _boAuthStore = window.useBoAuthStore?.();
      const currentAuthUser = reactive({ authId: '', authNm: '', name: '' });
      const _syncCurrentAuthUser = () => {
        const u = _boAuthStore?.svAuthUser;
        const target = u && u.authId ? u : { authId: '', authNm: '', name: '' };
        for (const k of ['authId', 'authNm', 'name']) currentAuthUser[k] = target[k] || '';
      };
      /* saFetchBoAppInitData — sy_role/sy_menu/sy_site 등 "로그인 후 한 번에 받는" 초기데이터를
         채운다. PdTagMng/CmNoticeMng/SyBrandMng/SyCodeMng 처럼 boUtil.bofGetSiteNm()·역할기반
         노출 등을 쓰는 화면은 이게 비어 있으면 정상 동작하지 않는다(이전에 "데모니까 생략해도
         되겠지"하고 뺐던 부분 — 2026-08-28 원복). boAppBase.js 와 동일하게 401 이면 세션 리셋. */
      const _fetchInitData = async () => {
        if (!_boAuthStore?.svAccessToken) return;
        try {
          await window.useBoAppInitStore?.()?.saFetchBoAppInitData?.();
          _syncCurrentAuthUser();
        } catch (e) {
          if (e?.response?.status === 401) { _boAuthStore.saReset(); _syncCurrentAuthUser(); }
          else showToast('초기 데이터 로드 실패: ' + (e?.response?.data?.message || e?.message || e), 'error', 0);
        }
      };
      try {
        const token = localStorage.getItem('modu-bo-auth-accessToken');
        if (!token) _boAuthStore?.saReset?.();
        else _boAuthStore?.saSyncFromStorage?.();
      } catch (e) {}
      _syncCurrentAuthUser();
      _fetchInitData(); // F5 새로고침 등으로 이미 로그인된 상태로 부팅될 때
      watch(() => _boAuthStore?.svAccessToken, _syncCurrentAuthUser); // 401 등으로 토큰 소실 시 자동 재동기화

      const cfIsLoggedIn = computed(() => !!currentAuthUser.authId);

      const loginForm = reactive({ loginId: '', loginPwd: '' });
      const loginError = ref('');
      const loginLoading = ref(false);
      const doLogin = async () => {
        loginError.value = '';
        if (!loginForm.loginId || !loginForm.loginPwd) {
          loginError.value = '아이디와 비밀번호를 입력하세요.';
          return;
        }
        loginLoading.value = true;
        try {
          await _boAuthStore.saLogin(loginForm.loginId, loginForm.loginPwd);
          _syncCurrentAuthUser();
          await _fetchInitData();
          loginForm.loginPwd = '';
          showToast(`${currentAuthUser.authNm || currentAuthUser.name || '사용자'}님 환영합니다.`);
        } catch (err) {
          loginError.value = err?.response?.data?.message || err?.message || '로그인 실패';
        } finally {
          loginLoading.value = false;
        }
      };
      /* quickLogin — 로그인 화면의 테스트 계정 목록을 클릭하면 그 계정으로 바로
         로그인한다(2026-08-28). 아이디/비밀번호를 채워넣고 doLogin() 을 그대로
         재사용 — 별도 API 경로를 새로 만들지 않는다. */
      const quickLogin = (loginId) => {
        loginForm.loginId = loginId;
        loginForm.loginPwd = '1111';
        doLogin();
      };
      const doLogout = () => {
        _boAuthStore?.saReset?.();
        _syncCurrentAuthUser();
        showToast('로그아웃되었습니다.', 'info');
      };

      /* ══════════════════════════ 토스트 / 컨펌 (boAppBase.js 와 동일 패턴, 단순화) ══════════════════════════ */
      const toasts = reactive([]);
      let _toastId = 0;
      const showToast = (msg, type = 'success', duration = 3500) => {
        if (type === 'error') duration = 0;
        const id = ++_toastId;
        let msgTitle = msg, msgDetail = '';
        if (type === 'error' && msg.includes('\n')) {
          const parts = msg.split('\n');
          msgDetail = parts[0];
          msgTitle = parts.slice(1).join('\n');
        }
        toasts.push({ id, msgTitle, msgDetail, type });
        if (duration !== 0) setTimeout(() => {
          const idx = toasts.findIndex((t) => t.id === id);
          if (idx !== -1) toasts.splice(idx, 1);
        }, duration);
      };
      const closeToast = (id) => {
        const idx = toasts.findIndex((t) => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      };
      window.boToast = showToast; // BaseModal 등 props 없이 직접 호출하는 내부 컴포넌트 대응

      const confirmState = reactive({ show: false, title: '', msg: '', resolve: null });
      const showConfirm = (title, msg) => new Promise((resolve) => {
        Object.assign(confirmState, { show: true, title, msg, resolve });
      });
      const closeConfirm = (v) => {
        confirmState.show = false;
        confirmState.resolve?.(v);
      };
      window.boConfirm = showConfirm;

      /* window.boApp — 원본 boAppBase.js 가 전역으로 노출하던 객체. Dashboard 류는
         `window.boApp?.showToast` 처럼 옵셔널 체이닝으로 방어하지만, PdTagMng/
         CmNoticeMng/SyBrandMng 등 다수 Mng 화면은 setup() 맨 위에서
         `const { showToast, showConfirm } = window.boApp;` 처럼 **가드 없이** 바로
         구조분해한다 — window.boApp 이 없으면 그 줄에서 즉시 throw 되어 setup() 이
         return 문까지 못 가고, 그 결과 템플릿의 모든 바인딩이 비어(undefined) 있는
         상태로 렌더를 시도하다 "Cannot read properties of undefined (reading 'xxx')"
         라는 다른 위치의 에러로 보이는 것 — 실제 원인은 이 한 줄 누락이었다(2026-08-28). */
      window.boApp = { showToast, showConfirm };

      /* ══════════════════════════ 대메뉴 / 화면 전환 (지연로드 지원, 2026-08-28) ══════════════════════════
         URL(?menu=..&screen=..) 과 동기화한다 — 새로고침해도 같은 화면 유지, 뒤로/앞으로가기
         동작, 링크 복사로 특정 화면 바로 열기가 되도록. pushState 를 쓰므로 브라우저
         뒤로가기(popstate)도 지원한다.
         지연로드 전환 전에는 부팅 시점에 이미 모든 도메인이 로드돼 있다고 가정하고
         window.MFE_REGISTRY.getMenu() 를 그 자리에서 바로 읽었는데, 이제는 부팅
         시점엔 카탈로그(가벼운 목차)만 있고 실제 화면은 아직 없다 — 그래서 URL에서는
         "어느 대메뉴로 시작할지"만 읽고, 실제 화면 id 확정은 그 대메뉴가 로드된 뒤
         openTab() 안에서 한다. */
      const _defaultMenuKey = () => TOP_MENUS[0]?.key || null;
      const _urlParams = () => {
        const qs = new URLSearchParams(window.location.search);
        const menuKey = qs.get('menu');
        const screenId = qs.get('screen');
        const menu = TOP_MENUS.find((m) => m.key === menuKey) ? menuKey : _defaultMenuKey();
        return { menu, screen: screenId };
      };
      const _init = _urlParams();
      const activeMenu = ref(_init.menu);
      const activeScreenId = ref(null); // openTab()/openGroup() 이 로드 완료 후 채운다
      /* loadingFolders — 지금 로딩 중인 "폴더"(절대경로) 집합. 대메뉴 단위가 아니라
         소그룹(=폴더) 단위로 내렸다(2026-08-28) — "상품관리" 대메뉴를 눌러도 아무 것도
         안 불러오고, 그 안의 "상품"/"카테고리" 소그룹을 각각 클릭해야 그 폴더 하나만
         로드된다(같은 대메뉴의 다른 소그룹은 안 건드리면 영영 안 불려도 된다). */
      const loadingFolders = reactive(new Set());

      /* fnMenuItems/fnActiveItem — computed() 가 아니라 일반 함수다(2026-08-28 버그 수정).
         이유: window.MFE_REGISTRY.getMenu() 가 읽는 데이터는 Vue 반응형이 아닌 순수
         JS 객체라서, computed 로 만들면 activeMenu/activeScreenId 값이 "이전과 같으면"
         (예: 로딩 중에 한 번 찍히고, 로드 완료 후 같은 화면을 다시 클릭) Vue 가 재계산을
         안 하고 로딩 전의 빈 결과를 영원히 캐시해버린다 — 사이드바(그룹/화면 목록은
         이미 일반 함수라 매번 새로 계산돼서 정상으로 보이는데, 본문만 빈 채로 "왼쪽
         메뉴에서 화면을 선택하세요" 가 뜨는 증상의 원인이 이거였다. groupedMenuOf 와
         똑같이 일반 함수로 둬야 매 렌더마다 레지스트리 최신 상태를 반영한다. */
      const fnMenuItems = () => window.MFE_REGISTRY.getMenu(activeMenu.value);
      const fnActiveItem = () => fnMenuItems().find((it) => it.id === activeScreenId.value) || null;
      /* fnActiveItemMissingComp — fnActiveItem() 은 있는데 comp 가 없는(로드 실패 등) 경우.
         템플릿 v-if 안에서 && 를 직접 쓰면 이 프로젝트에서 Vue 컴파일러가 크래시하므로
         여기서 미리 계산한다. */
      const fnActiveItemMissingComp = () => { const it = fnActiveItem(); return !!it && !it.comp; };
      /* cfActiveMenuDef — 좌측 메뉴가 "지금 상단에서 고른 대메뉴"만 그리기 위해 필요 */
      const cfActiveMenuDef = computed(() => TOP_MENUS.find((m) => m.key === activeMenu.value) || null);
      /* fnShowSidebar — v-if 안에서 && 를 직접 쓰면 이 프로젝트에서 Vue 컴파일러가
         크래시하므로(속성값 안 리터럴 &/&& 금지, CLAUDE.md 참고) 여기서 미리 계산한다. */
      const fnShowSidebar = () => !!cfActiveMenuDef.value && sidebarOpen.value;

      /* ══════════════════════════ 상단 대메뉴 바 — 넘치면 개행 대신 "···" 로 접기
         (2026-08-29) ══════════════════════════
         전에는 .mfe-menus 가 flex-wrap:wrap 이라 창 폭이 좁아지면 대메뉴가 2줄로
         개행됐다. 실제 화면 폭에 맞춰 들어가는 만큼만 보여주고, 못 들어간 나머지는
         맨 끝 "···" 버튼을 눌러야 보이는 드롭다운으로 옮긴다. 폭 계산은 각 버튼의
         실측 offsetWidth 를 재는 방식이라(css로만은 "몇 개가 들어가는지" 알 수 없다),
         버튼 DOM ref 배열을 직접 관리한다. */
      const menusBarRef = ref(null);
      const menuBtnEls = [];
      const setMenuBtnRef = (el, idx) => { if (el) menuBtnEls[idx] = el; };
      const overflowStartIndex = ref(TOP_MENUS.length); // 처음엔 전부 보이는 상태로 시작해 실폭을 잴 수 있게 함
      const moreMenuOpen = ref(false);
      const cfOverflowMenus = computed(() => TOP_MENUS.slice(overflowStartIndex.value));
      const MORE_BTN_RESERVE = 46; // '···' 버튼 폭 + gap 예상치

      const fnMeasureMenuOverflow = () => {
        const bar = menusBarRef.value;
        if (!bar || !TOP_MENUS.length) return;
        const barWidth = bar.clientWidth;
        const widths = TOP_MENUS.map((_, i) => (menuBtnEls[i] ? menuBtnEls[i].offsetWidth + 4 : 0));
        const total = widths.reduce((a, b) => a + b, 0);
        if (total <= barWidth) { overflowStartIndex.value = TOP_MENUS.length; return; }
        const limit = barWidth - MORE_BTN_RESERVE;
        let used = 0;
        let cutoff = 0;
        for (let i = 0; i < widths.length; i++) {
          if (used + widths[i] > limit) break;
          used += widths[i];
          cutoff = i + 1;
        }
        overflowStartIndex.value = Math.max(cutoff, 1); // 최소 1개는 항상 보이게
      };
      const fnRecalcMenuOverflow = () => {
        // 폭이 넓어졌을 수도 있으니 일단 전부 다시 보이는 상태로 되돌려 실측 가능하게 한 뒤 잰다
        overflowStartIndex.value = TOP_MENUS.length;
        Vue.nextTick(fnMeasureMenuOverflow);
      };
      let menuResizeTimer = null;
      const onWindowResizeForMenu = () => {
        clearTimeout(menuResizeTimer);
        menuResizeTimer = setTimeout(fnRecalcMenuOverflow, 150);
      };
      const toggleMoreMenu = () => { moreMenuOpen.value = !moreMenuOpen.value; };
      const closeMoreMenu = () => { moreMenuOpen.value = false; };
      const selectMenuFromMore = (key) => { selectMenu(key); closeMoreMenu(); };

      /* ══════════════════════════ 화면 렌더 에러 캡처 ══════════════════════════
         도메인 화면(<component :is="cfActiveItem.comp">) 안에서 setup()/render 중
         에러가 나면 기본은 콘솔에만 찍히고 화면은 조용히 비거나 깨져 보인다 —
         "어느 메뉴는 잘 뜨는데 어느 메뉴는 안 뜬다" 를 콘솔 없이도 바로 알 수 있게
         화면에 그대로 노출한다(2026-08-28). openTab() 등 아래에서 바로 참조하므로
         반드시 그보다 먼저 선언한다(2026-08-28 — 순서 뒤바뀌어 "Cannot access
         'screenError' before initialization" 로 셸 자체가 안 뜨던 버그 수정). */
      const screenError = ref(null);
      onErrorCaptured((err, instance, info) => {
        screenError.value = { msg: err?.message || String(err), info, stack: err?.stack || '' };
        console.error('[mfeShell] 화면 렌더 오류:', activeMenu.value, activeScreenId.value, err);
        return false; // 상위(셸 자체)로는 전파하지 않음 — 셸은 계속 정상 동작
      });
      /* onErrorCaptured 는 setup()/render 중 "동기적으로 던져진" 에러만 잡는다 —
         onMounted 안의 API 호출(handleSearchList 등)처럼 await 이후에 실패하는
         비동기 에러나, Promise 를 안 잡고 그냥 던지는 경우는 못 잡고 콘솔에만
         "Uncaught (in promise)" 로 조용히 찍힌다. 그래서 그런 경우도 화면에
         보이도록 전역 핸들러를 추가로 둔다(2026-08-28) — 화면이 하얗게 비는데
         빨간 에러 카드도 안 뜨는 증상의 원인이 대부분 이쪽이었다. */
      window.addEventListener('error', (ev) => {
        screenError.value = { msg: ev.message || String(ev.error), info: 'window.onerror', stack: ev.error?.stack || '' };
        console.error('[mfeShell] 전역 오류:', ev.error || ev.message);
      });
      window.addEventListener('unhandledrejection', (ev) => {
        const reason = ev.reason;
        screenError.value = { msg: reason?.message || String(reason), info: 'unhandledrejection', stack: reason?.stack || '' };
        console.error('[mfeShell] 처리 안 된 Promise 거부:', reason);
      });

      /* syncUrl — 현재 activeMenu/activeScreenId 를 주소창에 반영(pushState) */
      const syncUrl = () => {
        const qs = new URLSearchParams(window.location.search);
        qs.set('menu', activeMenu.value || '');
        qs.set('screen', activeScreenId.value || '');
        history.pushState({ menu: activeMenu.value, screen: activeScreenId.value }, '',
          window.location.pathname + '?' + qs.toString());
      };
      window.addEventListener('popstate', () => {
        const s = _urlParams();
        openTab(s.menu, s.screen, /* pushUrl */ false); // async, 결과 기다리지 않고 흘려보냄(fire-and-forget)
      });

      /* ══════════════════════════ 지연로드 컴포넌트 등록 ══════════════════════════
         원래는 부팅 시 한 번(app.mount 직후) window.MFE_REGISTRY.getAll() 을 순회해
         app.component() 등록을 끝냈는데, 이제 부팅 시점엔 아직 아무 도메인도 로드
         안 됐을 수 있다 — 그래서 도메인 하나가 새로 로드될 때마다(ensureMenuLoaded 뒤)
         이 함수를 다시 불러 "아직 등록 안 한 것만" 추가로 등록한다. 화면 컴포넌트
         자체는 <component :is="cfActiveItem.comp"> 로 객체를 직접 바인딩하니 전역
         등록이 필요 없지만, CmNoticeDtl/SyUserDtl 처럼 <cm-notice-dtl> 태그로 쓰이는
         내부 컴포넌트는 Vue 가 문자열 태그를 전역 등록 목록에서 찾으므로 반드시
         app.component() 가 필요하다.

         _registeredComps — 이름은 같은데 실제 객체(comp)가 다른 경우를 잡아내기 위한
         name→comp 맵(2026-08-28). 원본 프로젝트 컨벤션(모든 컴포넌트는 window.컴포넌트명
         하나로 export)을 이 데모에서 그대로 지키다 보니, 서로 다른(=별도 git 레포가 될)
         도메인 폴더가 우연히(또는 이번처럼 의도적으로) 같은 컴포넌트명을 쓰면 나중에
         로드된 쪽이 **아무 에러 없이 조용히 무시**되던 게 원래 동작이었다 — 화면은 멀쩡히
         뜨니 원인을 알아채기 어렵다. 지금은 "이미 등록된 이름인데 이번 것과 다른 객체"를
         감지하면 console.warn 으로 그 자리에서 알린다. 근본 규칙은 여전히 "window 전역
         컴포넌트명은 도메인 폴더를 넘어 항상 유일해야 한다"이고, 이건 그 규칙을 어겼을 때
         조용히 넘어가지 않도록 하는 안전장치일 뿐이다 — 새 도메인 추가 체크리스트
         (mfeCatalog.js 참고)에도 이 규칙이 명시돼 있다. */
      const _registeredCompNames = new Set();
      const _registeredComps = {};
      const _registerOne = (name, comp) => {
        if (_registeredCompNames.has(name)) {
          if (_registeredComps[name] !== comp) {
            console.warn(
              '[mfeShell] 컴포넌트명 충돌: window 전역 "' + name + '" 이 서로 다른 도메인 폴더에서 ' +
              '중복 선언된 것으로 보입니다 — 나중에 로드된 쪽은 무시되고 먼저 등록된 것만 ' +
              '<컴포넌트명> 태그로 쓰입니다. 도메인 간 컴포넌트명을 유일하게 바꾸세요.',
              { name, kept: _registeredComps[name], ignored: comp },
            );
          }
          return;
        }
        app.component(name, comp);
        _registeredCompNames.add(name);
        _registeredComps[name] = comp;
      };
      const _registerLoadedComponents = () => {
        Object.values(window.MFE_REGISTRY.getAll()).forEach((items) => {
          items.forEach((it) => {
            if (!it.comp) return;
            _registerOne(it.comp.name || it.id, it.comp);
          });
        });
        window.MFE_REGISTRY.getAllComponents().forEach((it) => {
          _registerOne(it.tag, it.comp);
        });
      };

      /* ══════════════════════════ 열린 탭 (boAppBase.js 의 openTabs 와 동일 개념) ══════════════════════════
         메뉴 카탈로그(대메뉴+서브메뉴)와 별개로, "지금 열려있는 화면들"을 탭으로 누적 관리한다.
         서브메뉴 클릭 = 탭 열기(이미 열려있으면 그 탭으로 전환). ✕ 로 개별 탭 닫기. */
      const openTabs = reactive([]);
      const _tabId = (menuKey, screenId) => menuKey + ':' + screenId;
      const _pushTab = (menuKey, screenId) => {
        const id = _tabId(menuKey, screenId);
        if (openTabs.find((t) => t.id === id)) return;
        const item = window.MFE_REGISTRY.getMenu(menuKey).find((it) => it.id === screenId);
        const menuDef = TOP_MENUS.find((m) => m.key === menuKey);
        openTabs.push({ id, menuKey, screenId, label: item?.label || screenId, menuIcon: menuDef?.icon || '' });
      };

      /* openTab — 대메뉴/화면을 연다. 정상 경로(소그룹을 이미 openGroup() 으로 로드해둔
         뒤 그 안의 화면을 클릭)라면 items 에 바로 있어서 로딩 없이 즉시 연다. 그 화면이
         아직 없으면(URL 딥링크로 바로 들어왔거나 뒤로가기 등) 카탈로그에서 그 화면이
         정확히 어느 폴더에 있는지 찾아 **그 폴더 하나만** 로드한다(2026-08-28 —
         처음엔 안전하게 대메뉴 전체를 로드했는데, 카탈로그가 이미 screens 목록을
         알고 있으니 그럴 필요가 없었다). 카탈로그에도 없는 화면이거나(screenId 를
         안 줬을 때 등) 카탈로그 자체가 없으면(dev.html) 대메뉴 전체 로드로 안전하게
         폴백한다. */
      const openTab = async (menuKey, screenId, pushUrl = true) => {
        if (!menuKey) return;
        screenError.value = null;
        activeMenu.value = menuKey;
        let items = window.MFE_REGISTRY.getMenu(menuKey);
        let found = screenId ? items.find((it) => it.id === screenId) : items[0];
        if (!found) {
          try {
            const owner = screenId
              ? window.MFE_REGISTRY.getCatalog(menuKey).find((c) => (c.screens || []).some((s) => s.id === screenId))
              : null;
            if (owner) await window.MFE_REGISTRY.ensureFolderLoaded(owner.folder);
            else await window.MFE_REGISTRY.ensureMenuLoaded(menuKey); // 폴백 — 대메뉴 전체
            _registerLoadedComponents();
          } catch (e) {
            showToast('메뉴를 불러오지 못했습니다: ' + (e?.message || e), 'error', 0);
            return;
          }
          items = window.MFE_REGISTRY.getMenu(menuKey);
          found = screenId ? items.find((it) => it.id === screenId) : items[0];
        }
        if (!found) return; // 그래도 없음 — 등록된 화면 자체가 없는 대메뉴
        activeScreenId.value = found.id;
        _pushTab(menuKey, found.id);
        if (pushUrl) syncUrl();
      };
      /* openGroup — 소그룹(중메뉴) 하나를 연다. 그 소그룹이 아직 지연로드 전이면
         ensureFolderLoaded() 로 그 폴더 "하나만" 불러온다(같은 대메뉴의 다른 소그룹은
         안 건드림) — 로딩 중엔 loadingFolders 에 그 폴더가 들어가 사이드바에
         스피너가 뜬다. 로드가 끝나면 wantScreenId 로 지정한 화면(사용자가 카탈로그
         자리표시 항목 중 하나를 콕 집어 눌렀을 때)을 열거나, 없으면 그 소그룹의
         첫 화면을 자동으로 연다. */
      const openGroup = async (menuKey, folder, group, wantScreenId) => {
        screenError.value = null;
        if (folder && !window.MFE_REGISTRY.isFolderLoaded(folder)) {
          // 이미 다른 클릭이 같은 폴더를 로딩 중이면(더블클릭 등) ensureFolderLoaded 가
          // 같은 Promise 를 재사용해 중복 네트워크 요청은 막아주지만, 실패 시 토스트는
          // 각 호출이 따로 catch 해서 중복으로 뜬다 — 그래서 "이 호출이 로딩을 시작한
          // 첫 호출인지"만 기억해뒀다가 실패 토스트는 그 첫 호출만 띄운다(2026-08-28).
          const isFirstCaller = !loadingFolders.has(folder);
          loadingFolders.add(folder);
          try {
            await window.MFE_REGISTRY.ensureFolderLoaded(folder);
            _registerLoadedComponents();
          } catch (e) {
            if (isFirstCaller) showToast('그룹을 불러오지 못했습니다: ' + (e?.message || e), 'error', 0);
            loadingFolders.delete(folder);
            return;
          }
          loadingFolders.delete(folder);
        }
        const groupItems = window.MFE_REGISTRY.getMenu(menuKey).filter((it) => (it.group || null) === (group || null));
        const target = (wantScreenId && groupItems.find((it) => it.id === wantScreenId)) || groupItems[0];
        if (target) openTab(menuKey, target.id);
      };
      /* fnClickItem — 사이드바 화면 항목 클릭 라우터. 카탈로그 자리표시(아직 로드
         전이라 label 만 있고 comp 없음)면 그 그룹을 로드하면서 이 화면을 콕 집어
         열도록 openGroup 에 넘기고, 이미 로드된 실item 이면 곧장 openTab. */
      const fnClickItem = (menuKey, g, it) => {
        if (it._placeholder) openGroup(menuKey, g.folder, g.group, it.id);
        else openTab(menuKey, it.id);
      };
      /* selectTab — 이미 열려있는 탭 클릭. 그 탭이 존재한다는 건 이미 로드가 끝났다는
         뜻이라 기다릴 필요 없이 동기로 바로 전환한다. */
      const selectTab = (id) => {
        const t = openTabs.find((x) => x.id === id);
        if (!t) return;
        screenError.value = null;
        activeMenu.value = t.menuKey;
        activeScreenId.value = t.screenId;
        syncUrl();
      };
      const closeTab = (id, evt) => {
        evt?.stopPropagation();
        const idx = openTabs.findIndex((t) => t.id === id);
        if (idx === -1) return;
        const wasActive = _tabId(activeMenu.value, activeScreenId.value) === id;
        openTabs.splice(idx, 1);
        if (!wasActive) return;
        const next = openTabs[Math.min(idx, openTabs.length - 1)];
        if (next) { activeMenu.value = next.menuKey; activeScreenId.value = next.screenId; }
        else { activeScreenId.value = null; }
        syncUrl();
      };

      /* ── 열린 탭 바 좌우 스크롤 화살표(2026-08-29 신규) — .mfe-tabs 를 nowrap+
         overflow-x:auto 로 바꾼 뒤(개행 대신 한 줄 유지) 스크롤바만으로는 옆에 더
         있는지 알아보기 어렵다는 피드백 → 넘칠 때만 좌우 화살표 버튼을 보여주고,
         누르면 일정 폭만큼 부드럽게 스크롤한다. */
      const tabsBarRef = ref(null);
      const tabsOverflow = ref(false);
      const fnUpdateTabsOverflow = () => {
        const el = tabsBarRef.value;
        tabsOverflow.value = !!el && el.scrollWidth > el.clientWidth + 1;
      };
      const fnScrollTabs = (dir) => {
        const el = tabsBarRef.value;
        if (el) el.scrollBy({ left: dir * 180, behavior: 'smooth' });
      };
      let tabsResizeTimer = null;
      const onWindowResizeForTabs = () => {
        clearTimeout(tabsResizeTimer);
        tabsResizeTimer = setTimeout(fnUpdateTabsOverflow, 150);
      };
      /* 탭 열림/닫힘마다 넘치는지 다시 잰다. openTabs 는 reactive 배열이라 길이만
         watch 해도 충분(라벨 길이 변화 등은 없음). */
      watch(() => openTabs.length, () => { Vue.nextTick(fnUpdateTabsOverflow); });

      /* ── 열린 탭 유지(📌 Keep, 2026-08-29 신규) — production(boAppBase.js)의
         keptTabIds/toggleKeep과 같은 개념이지만, 이 데모의 렌더 구조에 맞게 구현이
         다르다. production은 v-for + v-show로 켜진 탭 컴포넌트를 전부 동시에 마운트해
         두고 숨기기만 하는데, 이 데모는 <component :is> 하나에 :key만 바꿔가며 매번
         완전히 새로 마운트한다(그래서 지금까지는 탭을 벗어나면 화면 내부 상태 — 스크롤
         위치·입력 중이던 검색어 등 — 가 사라졌다). Vue 내장 <KeepAlive> 로 감싸고
         :include 에 "지금 pin 된 탭들의 컴포넌트 name" 배열을 넘기면, 그 이름과 일치하는
         컴포넌트가 다시 렌더될 때 새로 마운트하지 않고 캐시된 인스턴스를 그대로
         재사용한다 — v-for/v-show 없이도 같은 효과를 낸다. */
      const keptTabIds = reactive(new Set());
      const toggleKeep = (tabId) => { if (keptTabIds.has(tabId)) keptTabIds.delete(tabId); else keptTabIds.add(tabId); };
      const cfKeptNames = computed(() => {
        const names = [];
        keptTabIds.forEach((tabId) => {
          const t = openTabs.find((x) => x.id === tabId);
          if (!t) return;
          const item = window.MFE_REGISTRY.getMenu(t.menuKey).find((it) => it.id === t.screenId);
          if (item?.comp?.name) names.push(item.comp.name);
        });
        return names;
      });

      /* ── 즐겨찾기(2026-08-29 신규, 같은 날 좌측 메뉴 트리에서도 추가 가능하도록 확장) —
         열린 탭에서도, 아직 열지 않은 좌측 메뉴 트리 항목에서도 ★ 로 추가/해제할 수
         있다. toggleFav 의 두 번째 인자(labelOverride)가 있으면(메뉴 트리 클릭) 그
         라벨을 쓰고, 없으면(열린 탭/열린화면 목록 클릭) 이미 열려있는 탭에서 라벨을
         가져온다. */
      const favorites = reactive(JSON.parse(localStorage.getItem('modu-bo-sy-favorites') || '[]'));
      watch(favorites, (v) => { try { localStorage.setItem('modu-bo-sy-favorites', JSON.stringify(v)); } catch (e) {} }, { deep: true });
      const isFav = (tabId) => favorites.some((f) => f.id === tabId);
      const toggleFav = (tabId, labelOverride) => {
        const idx = favorites.findIndex((f) => f.id === tabId);
        if (idx !== -1) { favorites.splice(idx, 1); return; }
        const sepIdx = tabId.indexOf(':');
        if (sepIdx === -1) return;
        const menuKey = tabId.slice(0, sepIdx);
        const screenId = tabId.slice(sepIdx + 1);
        const t = openTabs.find((x) => x.id === tabId);
        const label = labelOverride || t?.label;
        if (!label) return;
        const topLabel = TOP_MENUS.find((m) => m.key === menuKey)?.label || '';
        favorites.push({ id: tabId, menuKey, screenId, label, topLabel });
      };
      const cfFavList = computed(() => favorites.map((f) => ({ id: f.id, label: f.label, topLabel: f.topLabel })));
      /* cfOpenTabsWithGroup — 좌측 하단 "열린화면" 목록용. 대메뉴 라벨(topLabel)을 붙여서
         "주문관리 › 주문항목관리" 처럼 어느 대메뉴 소속인지 한눈에 보이게 한다. */
      const cfOpenTabsWithGroup = computed(() => openTabs.map((t) => ({
        ...t, topLabel: TOP_MENUS.find((m) => m.key === t.menuKey)?.label || '',
      })));
      const sidebarTab = ref('open'); // 'fav' | 'open'
      /* openTabId — 즐겨찾기/열린화면 목록 항목(결합된 tabId, "menuKey:screenId" 형식)
         클릭 시 그 화면을 연다.
         2026-08-29 버그수정: "열린화면" 목록 항목은 정의상 이미 openTabs 에 들어있는
         탭인데, 이걸 매번 openTab()(비동기 지연로드 경로 — 카탈로그 재조회 후 폴더
         로드 시도까지 포함)으로 열면, 등록된 메뉴 조회 타이밍에 따라 아무 반응이
         없어 보이는 경우가 있었다("클릭해도 화면이 안 바뀐다"). 이미 열려있는
         탭이면 상단 탭바 클릭과 똑같이 selectTab()(동기, 100% 검증된 경로)으로
         전환하고, 아직 안 열린 탭(예: 닫은 뒤에도 남아있는 즐겨찾기)일 때만
         openTab() 의 지연로드 경로를 탄다. */
      const openTabId = (tabId) => {
        if (openTabs.find((t) => t.id === tabId)) { selectTab(tabId); return; }
        const idx = tabId.indexOf(':');
        if (idx === -1) return;
        openTab(tabId.slice(0, idx), tabId.slice(idx + 1));
      };

      /* ── 탭 우클릭 컨텍스트 메뉴(2026-08-29 신규) — production(boAppBase.js)의
         ctxMenu/showCtxMenu/ctxClose* 를 그대로 이식했다. */
      const ctxMenu = reactive({ show: false, x: 0, y: 0, tabId: null });
      const showCtxMenu = (evt, tabId) => {
        evt.preventDefault();
        ctxMenu.show = true;
        ctxMenu.x = evt.clientX;
        ctxMenu.y = evt.clientY;
        ctxMenu.tabId = tabId;
      };
      const closeCtxMenu = () => { ctxMenu.show = false; };
      const ctxClose = () => { closeTab(ctxMenu.tabId); closeCtxMenu(); };
      const ctxCloseLeft = () => {
        const idx = openTabs.findIndex((t) => t.id === ctxMenu.tabId);
        if (idx > 0) {
          openTabs.splice(0, idx);
          if (!openTabs.find((t) => fnIsActive(t.menuKey, t.screenId)) && openTabs.length > 0) openTabId(openTabs[0].id);
        }
        closeCtxMenu();
      };
      const ctxCloseRight = () => {
        const idx = openTabs.findIndex((t) => t.id === ctxMenu.tabId);
        if (idx !== -1 && idx < openTabs.length - 1) {
          openTabs.splice(idx + 1);
          if (!openTabs.find((t) => fnIsActive(t.menuKey, t.screenId))) openTabId(openTabs[idx].id);
        }
        closeCtxMenu();
      };
      const ctxCloseOthers = () => {
        const tab = openTabs.find((t) => t.id === ctxMenu.tabId);
        openTabs.forEach((t) => { if (t.id !== ctxMenu.tabId) keptTabIds.delete(t.id); });
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); openTabId(tab.id); }
        closeCtxMenu();
      };
      const ctxCloseAll = () => {
        const tab = openTabs.find((t) => t.id === ctxMenu.tabId);
        keptTabIds.clear();
        openTabs.splice(0);
        if (tab) { openTabs.push(tab); openTabId(tab.id); }
        closeCtxMenu();
      };
      /* ctxNewWindow — 이 탭을 새 브라우저 창/탭으로 그대로 재현(같은 ?menu=&screen= 을
         쓰는 새 창). production은 embed 모드(상단 nav 없이 화면만)까지 지원하는데, 이
         데모의 셸은 embed 모드 자체가 없어(화면 하나만 단독 렌더하는 별도 진입점이
         없음) 그냥 이 셸을 통째로 새 창에 다시 띄운다 — 화면은 같지만 셸 UI(메뉴바 등)
         까지 같이 뜨는 점만 production과 다르다. */
      const ctxNewWindow = () => {
        const tabId = ctxMenu.tabId;
        closeCtxMenu();
        const idx = tabId.indexOf(':');
        if (idx === -1) return;
        const qs = new URLSearchParams();
        qs.set('menu', tabId.slice(0, idx));
        qs.set('screen', tabId.slice(idx + 1));
        window.open(window.location.pathname + '?' + qs.toString(), '_blank');
      };
      /* ctxRefresh — 그 탭을 강제로 다시 마운트한다. :key 에 섞어 넣는 refreshKeys
         카운터를 올리고, KeepAlive 로 고정(📌)돼 있으면 캐시에서 잠깐 뺐다가
         nextTick 에 다시 넣어 캐시된 인스턴스를 버리게 한다(production과 동일 방식). */
      const refreshKeys = reactive({});
      const ctxRefresh = () => {
        const tabId = ctxMenu.tabId;
        closeCtxMenu();
        refreshKeys[tabId] = (refreshKeys[tabId] || 0) + 1;
        if (keptTabIds.has(tabId)) {
          keptTabIds.delete(tabId);
          Vue.nextTick(() => keptTabIds.add(tabId));
        }
      };

      /* ── 레이아웃 접기/펼치기(좌측 사이드바/우측 패널, 2026-08-29 신규) —
         production(boAppBase.js)의 leftMenuOpen/rightPanelOpen과 같은 개념. production은
         백엔드 user-pref API(/api/bo/sy/user-pref)로 로그인 계정마다 서버에 저장하는데,
         이 데모는 그 API 왕복 없이 localStorage로 단순화했다. 열린탭바 숨기기는 처음에
         같이 넣었다가(production엔 tabBarOpen으로 있음) 사용자 피드백으로 이 데모에서는
         뺐다 — 탭 자체가 항상 화면 전환의 기본 통로라 숨기는 옵션이 오히려 혼란을 준다는
         판단(2026-08-29). */
      const sidebarOpen = ref(localStorage.getItem('modu-bo-sy-sidebarOpen') !== 'false');
      watch(sidebarOpen, (v) => { try { localStorage.setItem('modu-bo-sy-sidebarOpen', v); } catch (e) {} });
      const rightPanelOpen = ref(localStorage.getItem('modu-bo-sy-rightPanelOpen') !== 'false');
      watch(rightPanelOpen, (v) => { try { localStorage.setItem('modu-bo-sy-rightPanelOpen', v); } catch (e) {} });

      /* ── API 로그(BO, 2026-08-29 신규) — FO 쪽 foMfeShell.js와 동일한 이벤트 기반
         방식으로 이식했다. boApiAxios.js(원본 그대로, 무수정)가 이미 쏘는
         api-response-success/api-response-error 커스텀 이벤트만 듣는다 — production의
         boAppBase.js는 axios 인터셉터를 별도로 하나 더 붙여서 duration(소요시간)까지
         재는데, boApiAxios.js 자체 이벤트 payload엔 duration이 없어서(foApiAxios.js와
         다른 점 — FO 쪽엔 있음) 그 필드만 이 데모에선 비어 있다. */
      const MAX_BO_API_LOGS = 15;
      const boApiLogs = reactive(JSON.parse(localStorage.getItem('modu-bo-sy-apiLog') || '[]'));
      let _boApiLogSeq = boApiLogs.length ? Math.max(...boApiLogs.map((l) => l._seq || 0)) + 1 : 1;
      const apiLogHoverDetail = ref(null);
      const addBoApiLog = (detail) => {
        const now = new Date();
        const ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
          + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        const entry = { _seq: _boApiLogSeq++, ts, ...detail };
        boApiLogs.unshift(entry);
        if (boApiLogs.length > MAX_BO_API_LOGS) boApiLogs.splice(MAX_BO_API_LOGS);
        try { localStorage.setItem('modu-bo-sy-apiLog', JSON.stringify(boApiLogs.slice(0, MAX_BO_API_LOGS))); } catch (e) {}
      };
      const clearApiLogs = () => {
        boApiLogs.splice(0, boApiLogs.length);
        apiLogHoverDetail.value = null;
        try { localStorage.removeItem('modu-bo-sy-apiLog'); } catch (e) {}
      };
      window.addEventListener('api-response-success', (ev) => { addBoApiLog(ev.detail || {}); });
      window.addEventListener('api-response-error', (ev) => { addBoApiLog({ ...(ev.detail || {}), hasError: true }); });
      const onApiLogEnter = (log) => { apiLogHoverDetail.value = log; };
      const onApiLogLeave = () => { apiLogHoverDetail.value = null; };

      /* 활성 탭 라벨을 브라우저 탭 타이틀에 반영 — 여러 BO 창을 동시에 열어도 브라우저
         탭 목록에서 화면을 구분할 수 있게 한다(shopjoy_v260406/lib/app/boAppBase.js
         와 동일 패턴, 2026-08-29 이 데모에 이식). */
      watch(
        () => _tabId(activeMenu.value, activeScreenId.value),
        () => {
          const tab = openTabs.find((t) => t.id === _tabId(activeMenu.value, activeScreenId.value));
          document.title = tab ? tab.label + ' - ShopJoy BO' : 'ShopJoy BO';
        },
        { immediate: true }
      );

      /* 부팅 시 첫 화면 결정 — URL에 특정 화면이 지정돼 있으면(새로고침·딥링크) 안전하게
         그 대메뉴의 카탈로그 전체를 로드해서 찾고(openTab 의 안전장치), 없으면 그
         대메뉴의 "첫 번째 소그룹 하나만" 로드한다(openGroup) — 나머지 소그룹은 그대로
         지연 상태로 남는다. 둘 다 async, 결과를 기다리지 않고 흘려보낸다(setup() 자체는
         동기로 끝나야 하므로). */
      if (_init.screen) {
        openTab(_init.menu, _init.screen, false);
      } else {
        const firstEntry = window.MFE_REGISTRY.getCatalog(_init.menu)[0];
        if (firstEntry) openGroup(_init.menu, firstEntry.folder, firstEntry.group);
        else openTab(_init.menu, null, false); // 카탈로그 없음(dev.html) — 기존 방식대로
      }

      /* selectMenu — 상단 대메뉴 클릭. 그 대메뉴에서 지금 보고 있던 화면이 이미 있으면
         (예: 다른 메뉴 갔다가 다시 돌아온 경우, 탭이 그 화면을 기억하고 있음) 그대로
         두고, 처음 들어가는 대메뉴면 좌측 메뉴의 "첫 번째 화면"을 자동으로 연다
         (2026-08-28) — boot 시 첫 대메뉴에 적용하던 것과 동일한 로직(openGroup 의
         첫 카탈로그 엔트리)을 재사용. 로드가 필요하면(소그룹이 아직 지연로드 전)
         openGroup 이 그 폴더 하나만 불러온다 — 대메뉴 클릭 한 번이 대메뉴 전체를
         로드하는 건 아니다, 딱 첫 소그룹만. */
      const selectMenu = (key) => {
        screenError.value = null;
        activeMenu.value = key;
        if (fnActiveItem()) return; // 이 대메뉴에 이미 열려있는 화면이 있으면 유지
        const firstEntry = window.MFE_REGISTRY.getCatalog(key)[0];
        if (firstEntry) openGroup(key, firstEntry.folder, firstEntry.group);
        else openTab(key, null, true); // 카탈로그 없음(dev.html) — 이미 로드된 첫 화면
      };
      const selectScreen = (id) => { openTab(activeMenu.value, id); };

      /* menuOf — 좌측 메뉴가 대메뉴별로 전부(활성 메뉴 아니어도) 항목을 그려야 해서 노출 */
      const menuOf = (key) => window.MFE_REGISTRY.getMenu(key);
      /* groupedMenuOf — 대메뉴 하나에 여러 마이크로 레포가 소그룹(=카탈로그 폴더 하나)
         으로 나눠 기여한다(예: pd = bo-ec-pd-pd 의 "상품" + bo-ec-pd-cate 의 "카테고리"). 카탈로그가
         있으면(mfe.html 류) 그 소그룹들을 로드 여부와 무관하게 전부 보여준다 — 아직 안
         불린 소그룹은 카탈로그에 미리 선언된 화면 이름(placeholder, comp 없음)을 그대로
         보여주다가, 로드가 끝나면 실제 항목(comp 채워짐)으로 자연스럽게 바뀐다(2026-08-28
         — 로드 전에도 화면 이름이 안 보이던 걸 개선). 카탈로그가 없으면(dev.html) 이미
         register() 된 것만 group 기준으로 묶어 예전처럼 평평하게 보여준다. */
      const groupedMenuOf = (key) => {
        const catalogEntries = window.MFE_REGISTRY.getCatalog(key);
        const loadedItems = window.MFE_REGISTRY.getMenu(key);
        if (catalogEntries.length) {
          return catalogEntries.map((c) => {
            const loaded = window.MFE_REGISTRY.isFolderLoaded(c.folder);
            const loading = loadingFolders.has(c.folder);
            const realItems = loadedItems.filter((it) => (it.group || null) === c.group);
            const placeholderItems = (c.screens || []).map((s) => (
              // _showSpinner — 이 자리표시 항목 옆에 로딩 스피너를 보일지. 템플릿에서
              // _placeholder && loading 처럼 && 를 직접 쓰면 이 프로젝트에서 Vue
              // 컴파일러가 크래시하므로 여기서 미리 계산해 불(boolean) 하나로 넘긴다.
              { id: s.id, label: s.label, group: c.group, comp: null, _placeholder: true, _showSpinner: loading }
            ));
            return {
              group: c.group,
              folder: c.folder,
              loaded,
              loading,
              // flatUnloaded — 소그룹 라벨이 없는(group:null) 폴더가 아직 안 불렸을 때만 true.
              // 템플릿 v-if 안에 && 를 직접 쓰면 이 프로젝트에서 Vue 컴파일러가 크래시하므로
              // 여기서 미리 계산해 불(boolean) 하나로 넘긴다.
              flatUnloaded: !c.group && !loaded,
              items: loaded ? realItems : placeholderItems,
            };
          });
        }
        if (!loadedItems.length) return [];
        if (!loadedItems.some((it) => it.group)) {
          return [{ group: null, folder: null, loaded: true, loading: false, flatUnloaded: false, items: loadedItems }];
        }
        const order = [];
        const map = {};
        loadedItems.forEach((it) => {
          const g = it.group || '기타';
          if (!map[g]) { map[g] = []; order.push(g); }
          map[g].push(it);
        });
        return order.map((g) => ({ group: g, folder: null, loaded: true, loading: false, flatUnloaded: false, items: map[g] }));
      };
      /* fnIsActive — 사이드바 항목/탭이 "지금 보고 있는 화면"인지. 템플릿 :class 안에서
         && 를 직접 쓰면 이 프로젝트에서 Vue 컴파일러가 크래시하므로 함수로 뺀다. */
      const fnIsActive = (menuKey, screenId) => activeMenu.value === menuKey && activeScreenId.value === screenId;
      /* fnClickGroup — 소그룹 헤더 클릭. 이미 로드된 그룹을 눌러도 무해하게 무시한다
         (openGroup 자체도 방어하지만, 여기서도 한 번 더 걸러 불필요한 호출을 줄인다).
         같은 이유로 v-if/v-else-if/@click 등 템플릿 속성값 안에서는 && 를 직접 안 쓴다. */
      const fnClickGroup = (menuKey, g) => { if (!g.loaded) openGroup(menuKey, g.folder, g.group); };

      /* 화면 컴포넌트가 요구하는 최소 공통 props — 이 데모 화면들은 목록형(Mng)이라
         navigate/openNewWindow 는 실질적으로 거의 호출되지 않지만, 방어적으로 스텁을 둔다. */
      const navigate = (pageId) => {
        console.info('[mfeShell] navigate(' + pageId + ') — 이 샘플은 목록 화면만 지원합니다.');
      };
      const openNewWindow = () => {
        showToast('이 샘플에서는 새창 열기를 지원하지 않습니다.', 'info');
      };

      onMounted(() => {
        // 도메인이 등록한 내부 컴포넌트(Dtl 등)를 이 시점에 app.component 로 일괄 등록
        // — 이미 boAppBase 패턴대로 createApp() 직후 처리하므로 여기서는 확인 로그만.
        console.info('[mfeShell] 등록된 마이크로 도메인 메뉴:', window.MFE_REGISTRY.getAll());
        Vue.nextTick(fnMeasureMenuOverflow);
        window.addEventListener('resize', onWindowResizeForMenu);
        Vue.nextTick(fnUpdateTabsOverflow);
        window.addEventListener('resize', onWindowResizeForTabs);
      });
      onBeforeUnmount(() => {
        window.removeEventListener('resize', onWindowResizeForMenu);
        window.removeEventListener('resize', onWindowResizeForTabs);
      });

      return {
        TOP_MENUS,
        cfIsLoggedIn, currentAuthUser, loginForm, loginError, loginLoading, doLogin, doLogout, quickLogin,
        toasts, closeToast, confirmState, closeConfirm,
        activeMenu, activeScreenId, fnMenuItems, fnActiveItem, fnActiveItemMissingComp, cfActiveMenuDef, fnShowSidebar, selectMenu, selectScreen, screenError,
        menusBarRef, setMenuBtnRef, overflowStartIndex, cfOverflowMenus, moreMenuOpen, toggleMoreMenu, closeMoreMenu, selectMenuFromMore,
        tabsBarRef, tabsOverflow, fnScrollTabs,
        openTabs, openTab, openGroup, selectTab, closeTab, menuOf, groupedMenuOf, fnIsActive, fnClickGroup, fnClickItem,
        navigate, showToast, showConfirm, openNewWindow,
        keptTabIds, toggleKeep, cfKeptNames,
        favorites, isFav, toggleFav, cfFavList, cfOpenTabsWithGroup, sidebarTab, openTabId,
        sidebarOpen, rightPanelOpen,
        boApiLogs, apiLogHoverDetail, clearApiLogs, onApiLogEnter, onApiLogLeave,
        ctxMenu, showCtxMenu, closeCtxMenu, ctxClose, ctxCloseLeft, ctxCloseRight, ctxCloseOthers, ctxCloseAll, ctxNewWindow, ctxRefresh, refreshKeys,
      };
    },
    template: /* html */`
<div>
  <!-- ══════════════════ 미로그인: 로그인 화면만 ══════════════════ -->
  <div v-if="!cfIsLoggedIn" style="display:flex;align-items:center;justify-content:center;height:100vh;">
    <div class="card" style="width:360px;padding:28px;">
      <div class="page-title" style="text-align:center;margin-bottom:18px;">🧩 MFE 데모 로그인</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <input v-model="loginForm.loginId" class="form-control" placeholder="아이디" @keyup.enter="doLogin" />
        <input v-model="loginForm.loginPwd" type="password" class="form-control" placeholder="비밀번호" @keyup.enter="doLogin" />
        <div v-if="loginError" style="color:#e74c3c;font-size:12.5px;">{{ loginError }}</div>
        <button class="btn btn-primary" style="width:100%;" :disabled="loginLoading" @click="doLogin">
          {{ loginLoading ? '로그인 중…' : '로그인' }}
        </button>
        <div style="font-size:11.5px;color:#999;text-align:center;margin-top:4px;">
          shopjoy_v260406 과 같은 백엔드(:3000) · 같은 계정을 씁니다
        </div>
        <div style="font-size:11.5px;color:#888;text-align:center;margin-top:10px;padding-top:10px;border-top:1px dashed #e5e7eb;line-height:1.7;">
          <div style="font-weight:700;color:#666;margin-bottom:2px;">테스트 계정 (클릭 시 자동 로그인 · 비밀번호 전부 공통 1111)</div>
          <div class="mfe-quick-login" @click="quickLogin('admin1')"><b>admin1</b> / 1111 — 관리자(전체 메뉴)</div>
          <div class="mfe-quick-login" @click="quickLogin('admin2')"><b>admin2</b> / 1111 — 관리자(전체 메뉴)</div>
          <div class="mfe-quick-login" @click="quickLogin('user1')"><b>user1</b> / 1111 — 게스트(제한 화면)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════ 로그인 후: 셸 본체 ══════════════════ -->
  <template v-else>
    <div class="mfe-topbar">
      <button class="mfe-collapse-btn" @click="sidebarOpen=!sidebarOpen" :title="sidebarOpen ? '좌측 숨기기' : '좌측 펼치기'">☰</button>
      <div class="mfe-brand">🧩 ShopJoy MFE Demo</div>
      <div class="mfe-menus" ref="menusBarRef">
        <button v-for="(m, idx) in TOP_MENUS" :key="m.key" :ref="(el) => setMenuBtnRef(el, idx)"
          class="mfe-menu-btn" :class="{ active: activeMenu === m.key, 'mfe-menu-btn-hidden': idx >= overflowStartIndex }"
          @click="selectMenu(m.key)">{{ m.icon }} {{ m.label }}</button>
        <div class="mfe-menu-more-wrap" v-if="overflowStartIndex < TOP_MENUS.length">
          <button class="mfe-menu-btn mfe-menu-more-btn" @click="toggleMoreMenu">···</button>
          <div v-if="moreMenuOpen" style="position:fixed;inset:0;z-index:998;" @click="closeMoreMenu"></div>
          <div v-if="moreMenuOpen" class="mfe-menu-more-dropdown" @click.stop>
            <div v-for="m in cfOverflowMenus" :key="m.key" class="mfe-menu-more-item" :class="{ active: activeMenu === m.key }"
              @click="selectMenuFromMore(m.key)">{{ m.icon }} {{ m.label }}</div>
          </div>
        </div>
      </div>
      <button class="mfe-collapse-btn" @click="rightPanelOpen=!rightPanelOpen" :title="rightPanelOpen ? '우측 숨기기' : '우측 펼치기'">📡</button>
      <div class="mfe-user">
        <span>{{ currentAuthUser.authNm || currentAuthUser.name || currentAuthUser.authId }}님</span>
        <button class="btn btn-secondary btn-sm" @click="doLogout">로그아웃</button>
      </div>
    </div>

    <div class="mfe-body">
      <!-- ══ 좌측 메뉴 — 상단 대메뉴로 고른 것의 하위 메뉴만 보여줌(실제 bo.html 과 동일 패턴:
           상단바=대메뉴 전환, 좌측=선택된 대메뉴의 화면 트리). 다른 대메뉴 항목은 아예 안 그림.
           2026-08-29: sidebarOpen 토글 + 하단 즐겨찾기/열린화면 위젯 추가(production
           boAppBase.js의 left-nav-open-section과 같은 개념) ══ -->
      <div class="mfe-sidebar" v-if="fnShowSidebar()" style="display:flex;flex-direction:column;padding:0;">
        <div class="mfe-sidebar-group" style="flex:1;overflow-y:auto;padding:12px 0;">
          <div class="mfe-sidebar-group-title active">{{ cfActiveMenuDef.icon }} {{ cfActiveMenuDef.label }}</div>
          <template v-for="g in groupedMenuOf(activeMenu)" :key="activeMenu + '_' + (g.group || '_flat')">
            <!-- 소그룹 헤더 — 이름은 카탈로그로 항상 미리 보이고, 로드 전이면 클릭해서
                 그 폴더 하나만 불러온다(중메뉴 단위 지연로드). 아래 화면 이름도 카탈로그
                 자리표시로 미리 다 보이므로, 헤더 자체는 "그 그룹 첫 화면 바로가기" 용도다. -->
            <div v-if="g.group" class="mfe-sidebar-subgroup" :class="{ 'mfe-sidebar-subgroup-clickable': !g.loaded }"
              @click="fnClickGroup(activeMenu, g)">
              {{ g.group }}
              <span v-if="g.loading">⏳</span>
            </div>
            <div v-if="g.flatUnloaded" class="mfe-sidebar-loading" @click="openGroup(activeMenu, g.folder, g.group)">
              {{ g.loading ? '⏳ 불러오는 중...' : '클릭하여 불러오기' }}
            </div>
            <!-- 화면 항목 — 카탈로그 자리표시(_placeholder, 아직 comp 없음)도 이름은 그대로
                 보여준다. 클릭하면 그 화면이 속한 폴더 하나만 로드된 뒤 바로 이 화면이 열린다. -->
            <div class="mfe-sidebar-item" v-for="it in g.items" :key="it.id"
              :class="{ active: fnIsActive(activeMenu, it.id), 'mfe-sidebar-item-nested': g.group, 'mfe-sidebar-item-placeholder': it._placeholder }"
              @click="fnClickItem(activeMenu, g, it)">
              <span class="mfe-sidebar-item-label">{{ it.label }}<span v-if="it._showSpinner">⏳</span></span>
              <span class="mfe-fav-star" :class="{ active: isFav(activeMenu + ':' + it.id) }"
                @click.stop="toggleFav(activeMenu + ':' + it.id, it.label)"
                :title="isFav(activeMenu + ':' + it.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'">★</span>
            </div>
          </template>
        </div>
        <!-- 즐겨찾기 / 열린화면 (하단 고정, 2026-08-29 신규) -->
        <div class="mfe-sidebar-bottom">
          <div class="mfe-sidebar-bottom-list">
            <template v-if="sidebarTab==='fav'">
              <div v-if="!cfFavList.length" class="mfe-sidebar-bottom-empty">즐겨찾기가 없습니다.<br>열린 탭의 ★ 를 클릭해 추가하세요.</div>
              <div v-for="fav in cfFavList" :key="fav.id" class="mfe-sidebar-bottom-item"
                :class="{ active: (activeMenu + ':' + activeScreenId) === fav.id }"
                @click="openTabId(fav.id)">
                <span class="mfe-sidebar-bottom-path">
                  <span class="mfe-sidebar-bottom-group">{{ fav.topLabel }}</span>
                  <span class="mfe-sidebar-bottom-sep"> › </span>
                  <span>{{ fav.label }}</span>
                </span>
                <span class="mfe-fav-star active" @click.stop="toggleFav(fav.id)" title="즐겨찾기 해제">★</span>
              </div>
            </template>
            <template v-if="sidebarTab==='open'">
              <div v-if="!cfOpenTabsWithGroup.length" class="mfe-sidebar-bottom-empty">열린 화면이 없습니다.</div>
              <div v-for="t in cfOpenTabsWithGroup" :key="t.id" class="mfe-sidebar-bottom-item"
                :class="{ active: fnIsActive(t.menuKey, t.screenId) }"
                @click="openTabId(t.id)">
                <span class="mfe-sidebar-bottom-path">
                  <span class="mfe-sidebar-bottom-group">{{ t.topLabel }}</span>
                  <span class="mfe-sidebar-bottom-sep"> › </span>
                  <span>{{ t.label }}</span>
                </span>
                <span class="mfe-fav-star" :class="{ active: isFav(t.id) }"
                  @click.stop="toggleFav(t.id)" :title="isFav(t.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'">★</span>
                <span class="mfe-sidebar-bottom-close" @click.stop="closeTab(t.id, $event)">✕</span>
              </div>
            </template>
          </div>
          <div class="mfe-sidebar-bottom-tabs">
            <button class="mfe-sidebar-bottom-tab" :class="{ active: sidebarTab==='fav' }" @click="sidebarTab='fav'">★ 즐겨찾기</button>
            <button class="mfe-sidebar-bottom-tab" :class="{ active: sidebarTab==='open' }" @click="sidebarTab='open'">열린화면</button>
          </div>
        </div>
      </div>

      <!-- ══ 가운데: 열린 탭 + 본문 ══ -->
      <div class="mfe-main">
        <div class="mfe-tabs-wrap">
          <button v-if="tabsOverflow" class="mfe-tabs-arrow mfe-tabs-arrow-left" @click="fnScrollTabs(-1)" title="왼쪽으로 스크롤">‹</button>
          <div class="mfe-tabs" ref="tabsBarRef" :class="{ 'has-arrows': tabsOverflow }">
            <div v-if="!openTabs.length" class="mfe-tabs-empty">왼쪽 메뉴에서 화면을 선택하세요</div>
            <div v-for="t in openTabs" :key="t.id" class="mfe-tab"
              :class="{ active: fnIsActive(t.menuKey, t.screenId) }"
              @click="selectTab(t.id)" @contextmenu.prevent="showCtxMenu($event, t.id)">
              <span class="mfe-tab-pin" :class="{ active: keptTabIds.has(t.id) }" @click.stop="toggleKeep(t.id)"
                :title="keptTabIds.has(t.id) ? '고정 해제' : '고정 (탭 전환 시 화면 상태 유지)'">📌</span>
              <span>{{ t.menuIcon }} {{ t.label }}</span>
              <span class="mfe-tab-fav" :class="{ active: isFav(t.id) }" @click.stop="toggleFav(t.id)"
                :title="isFav(t.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'">★</span>
              <span class="mfe-tab-close" @click.stop="closeTab(t.id, $event)">✕</span>
            </div>
          </div>
          <button v-if="tabsOverflow" class="mfe-tabs-arrow mfe-tabs-arrow-right" @click="fnScrollTabs(1)" title="오른쪽으로 스크롤">›</button>
        </div>

        <div class="mfe-content admin-wrap">
          <div v-if="screenError" class="card" style="padding:16px;border:1px solid #f3b6c6;background:#fff5f7;margin-bottom:12px;">
            <div style="font-weight:800;color:#c0392b;margin-bottom:6px;">⚠ 화면 렌더 중 오류가 발생했습니다 ({{ activeMenu }} / {{ activeScreenId }})</div>
            <div style="font-size:13px;color:#333;">{{ screenError.msg }}</div>
            <pre v-if="screenError.stack" style="font-size:11px;color:#999;white-space:pre-wrap;margin-top:8px;max-height:160px;overflow:auto;">{{ screenError.stack }}</pre>
          </div>
          <div v-else-if="fnActiveItemMissingComp()" class="card" style="padding:24px;text-align:center;color:#c0392b;">
            "{{ fnActiveItem().label }}" 컴포넌트가 window 에 없습니다 — manifest.js 의 스크립트 로드(404 등)를 확인하세요.
          </div>
          <!-- KeepAlive(2026-08-29 신규) — 📌 로 고정한 탭만 :include 로 지정해, 탭을
               벗어났다 돌아와도 컴포넌트를 새로 마운트하지 않고 이전 상태(스크롤 위치·
               입력 중이던 값 등)를 그대로 유지한다. :key 에 refreshKeys 카운터를 섞어
               "새로고침" 컨텍스트 메뉴가 강제로 새 인스턴스를 만들 수 있게 한다. -->
          <KeepAlive :include="cfKeptNames" v-else-if="fnActiveItem()">
            <component :is="fnActiveItem().comp"
              :key="activeMenu + '_' + fnActiveItem().id + '_' + (refreshKeys[activeMenu + ':' + fnActiveItem().id] || 0)"
              :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" :open-new-window="openNewWindow" />
          </KeepAlive>
          <div v-else class="card" style="padding:60px 24px;text-align:center;color:#999;">왼쪽 메뉴에서 화면을 선택하세요.</div>
        </div>
      </div>

      <!-- ══ 우측: API 로그 패널 (2026-08-29 신규, foMfeShell.js와 동일 이벤트 기반) ══ -->
      <div class="mfe-right-panel" v-if="rightPanelOpen">
        <div class="mfe-right-panel-hd">
          <span>📡 API 로그 (BO)</span>
          <button class="btn btn-secondary btn-xs" @click="clearApiLogs">Clear</button>
        </div>
        <div class="mfe-right-panel-body">
          <div v-if="!boApiLogs.length" class="mfe-api-log-empty">API 호출 기록이 없습니다</div>
          <div v-for="log in boApiLogs" :key="log._seq" class="mfe-api-log-item" :class="{ err: log.hasError }"
            @mouseenter="onApiLogEnter(log)" @mouseleave="onApiLogLeave()">
            <div class="mfe-api-log-row">
              <span class="mfe-api-log-method">{{ (log.method || '-').charAt(0) }}</span>
              <span class="mfe-api-log-url" :title="log.url">{{ log.url }}</span>
              <span v-if="log.status ? (Number(log.status) !== 200) : false" class="mfe-api-log-status">{{ log.status }}</span>
            </div>
            <div v-if="log.uiLabel" class="mfe-api-log-label">{{ log.uiLabel }}</div>
            <div class="mfe-api-log-ts">{{ log.ts ? log.ts.slice(11,19) : '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- ══════════════════ 컨펌 모달 ══════════════════ -->
  <div v-if="confirmState.show" class="modal-overlay" style="z-index:10000;" @click.self="closeConfirm(false)">
    <div class="modal-box" style="max-width:380px;">
      <div class="confirm-title">{{ confirmState.title }}</div>
      <div class="confirm-msg">{{ confirmState.msg }}</div>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="closeConfirm(false)">취소</button>
        <button class="btn btn-primary" @click="closeConfirm(true)">확인</button>
      </div>
    </div>
  </div>

  <!-- ══════════════════ 탭 우클릭 컨텍스트 메뉴(2026-08-29 신규) ══════════════════ -->
  <div v-if="ctxMenu.show" style="position:fixed;inset:0;z-index:9999;" @click="closeCtxMenu" @contextmenu.prevent="closeCtxMenu"></div>
  <div v-if="ctxMenu.show" class="tab-ctx-menu" :style="{ left: ctxMenu.x+'px', top: ctxMenu.y+'px' }" @click.stop>
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

  <!-- ══════════════════ 토스트 ══════════════════ -->
  <div class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast-item" :class="'toast-' + t.type">
      <div class="toast-header-row">
        <div class="toast-msg-title">{{ t.msgTitle }}</div>
        <span class="toast-close-x" @click.stop="closeToast(t.id)">✕</span>
      </div>
      <div v-if="t.msgDetail" class="toast-msg-detail">{{ t.msgDetail }}</div>
    </div>
  </div>
</div>
`,
  };

  const app = createApp(App);
  app.use(Pinia.createPinia());

  /* ── 공용(셸) 컴포넌트 등록 — shopjoy_v260406/lib/app/boAppComp.js 의 해당 부분과 동일 매핑 ── */
  app
    .component('BoError404', window.boError404)
    .component('BoError401', window.boError401)
    .component('BoError500', window.boError500)
    .component('CoEchartComp', window.CoEchartComp)
    .component('CoEchart', window.CoEchartComp)
    .component('CoNotiBell', window.CoNotiBell)
    .component('BaseAttachGrp', window.BaseAttachGrp)
    .component('BaseAttachOne', window.BaseAttachOne)
    .component('BaseHtmlEditor', window.BaseHtmlEditor)
    .component('BaseTossPayWidget', window.BaseTossPayWidget)
    .component('BoRefModal', window.BoRefModal)
    .component('BoExcelUploadModal', window.BoExcelUploadModal)
    .component('BoPager', window.BoPager)
    .component('BoTabBar', window.BoTabBar)
    .component('BoPathTree', window.BoPathTree)
    .component('BoPathPickField', window.BoPathPickField)
    .component('BoPathTreeNode', window.BoPathTreeNode)
    .component('BoCategoryTree', window.BoCategoryTree)
    .component('BoMultiCheckSelect', window.BoMultiCheckSelect)
    .component('BoComboMatrixSelect', window.BoComboMatrixSelect)
    .component('BoDateTimePicker', window.BoDateTimePicker)
    .component('BoPage', window.BoPage)
    .component('BoContainer', window.BoContainer)
    .component('BoSearchArea', window.BoSearchArea)
    .component('BoFormArea', window.BoFormArea)
    .component('BoFormActions', window.BoFormActions)
    .component('BoGrid', window.BoGrid)
    .component('BoMatrix', window.BoMatrix)
    .component('BoGridCrud', window.BoGridCrud)
    .component('BoGroupTable', window.BoGroupTable)
    .component('BoStatRow', window.BoStatRow)
    .component('BoPathTreeCard', window.BoPathTreeCard)
    .component('BoMenuTree', window.BoMenuTree)
    .component('BoMenuTreeCard', window.BoMenuTreeCard)
    .component('BoLocalTreeCard', window.BoLocalTreeCard)
    .component('BoModal', window.BoModal)
    .component('BoExcelDownModal', window.BoExcelDownModal)
    .component('BoCmPopupModal', window.BoCmPopupModal)
    .component('BoAddrSearchModal', window.BoAddrSearchModal)
    .component('BoCronModal', window.BoCronModal)
    .component('BoTreeSelectorModal', window.BoTreeSelectorModal)
    .component('BoRowCancelDelete', window.BoRowCancelDelete)
    .component('BoRoleSelectModal', window.BoRoleSelectModal)
    .component('BoPathParentSelector', window.BoPathParentSelector)
    .component('BoPropTreeNode', window.BoPropTreeNode)
    .component('BoDeptTreeNode', window.BoDeptTreeNode)
    .component('AuthLoginModal', window.AuthLoginModal)
    .component('CoExtHelpModal', window.CoExtHelpModal || { template: '<div/>' })
    .component('AuthPwChangeModal', window.AuthPwChangeModal)
    .component('AuthUserPickModal', window.AuthUserPickModal)
    .component('AuthProfileModal', window.AuthProfileModal)
    .component('HelpBoModal', window.HelpBoModal)
    .component('DispPreviewModal', window.DispPreviewModal || { template: '<div/>' })
    .component('RowPickModal', window.RowPickModal || { template: '<div/>' })
    .component('TemplatePreviewModal', window.TemplatePreviewModal)
    .component('TemplateSendModal', window.TemplateSendModal)
    .component('PdReviewStatusModal', window.PdReviewStatusModal);

  /* 마이크로 도메인이 스스로 등록한 컴포넌트(메뉴 화면 + registerComponents 내부 컴포넌트)는
     여기서 한 번에 등록하지 않는다 — 지연로드라 부팅 시점엔 아직 아무 도메인도 안 불려 있을
     수 있다. 대신 setup() 안의 _registerLoadedComponents() 가 각 도메인이 실제로 로드될
     때마다(openTab 안에서) 그때그때 새로 등록한다(2026-08-28). */

  app.mount('#app');
  }; // window.mfeBootShell
})();
