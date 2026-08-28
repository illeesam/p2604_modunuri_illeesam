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
 *   - aa-main/mfe.html: 7개 도메인 전부 → 통합 데모 화면
 *   - aa-main/mfe-{조합}.html: 대메뉴 일부만 골라 조합(예: mfe-sy.html, mfe-sy-pd.html)
 *   - 각 도메인 폴더의 dev.html: 자기 메뉴 1개만 → 그 도메인 단독 실행 화면
 *     (다른 도메인 manifest.js 를 전혀 안 불러오니, 이게 실제로 되면 "이 도메인이
 *     다른 도메인 없이도, 셸의 공용 런타임만으로 독립 실행된다"는 증거가 된다)
 * 호출 시점에는 topMenus 에 나온 도메인들의 manifest.js 가 이미 로드 완료돼
 * window.MFE_REGISTRY 에 해당 화면들이 등록된 상태여야 한다.
 */
(function () {
  const { createApp, reactive, ref, computed, watch, onMounted, onErrorCaptured } = Vue;

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

      /* ══════════════════════════ 대메뉴 / 화면 전환 (MFE_REGISTRY 조회만) ══════════════════════════
         URL(?menu=..&screen=..) 과 동기화한다 — 새로고침해도 같은 화면 유지, 뒤로/앞으로가기
         동작, 링크 복사로 특정 화면 바로 열기가 되도록. pushState 를 쓰므로 브라우저
         뒤로가기(popstate)도 지원한다(2026-08-28). */
      const _defaultMenuKey = () => TOP_MENUS[0]?.key || null;
      const _fromUrl = () => {
        const qs = new URLSearchParams(window.location.search);
        const menuKey = qs.get('menu');
        const screenId = qs.get('screen');
        const menu = TOP_MENUS.find((m) => m.key === menuKey) ? menuKey : _defaultMenuKey();
        const items = window.MFE_REGISTRY.getMenu(menu);
        const screen = items.find((it) => it.id === screenId) ? screenId : (items[0]?.id || null);
        return { menu, screen };
      };
      const _init = _fromUrl();
      const activeMenu = ref(_init.menu);
      const activeScreenId = ref(_init.screen);

      const cfMenuItems = computed(() => window.MFE_REGISTRY.getMenu(activeMenu.value));
      const cfActiveItem = computed(() =>
        cfMenuItems.value.find((it) => it.id === activeScreenId.value) || cfMenuItems.value[0] || null
      );
      /* cfActiveMenuDef — 좌측 메뉴가 "지금 상단에서 고른 대메뉴"만 그리기 위해 필요 */
      const cfActiveMenuDef = computed(() => TOP_MENUS.find((m) => m.key === activeMenu.value) || null);

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

      /* syncUrl — 현재 activeMenu/activeScreenId 를 주소창에 반영(pushState) */
      const syncUrl = () => {
        const qs = new URLSearchParams(window.location.search);
        qs.set('menu', activeMenu.value || '');
        qs.set('screen', activeScreenId.value || '');
        history.pushState({ menu: activeMenu.value, screen: activeScreenId.value }, '',
          window.location.pathname + '?' + qs.toString());
      };
      window.addEventListener('popstate', () => {
        const s = _fromUrl();
        screenError.value = null;
        openTab(s.menu, s.screen, /* pushUrl */ false);
      });

      /* ══════════════════════════ 열린 탭 (boAppBase.js 의 openTabs 와 동일 개념) ══════════════════════════
         메뉴 카탈로그(대메뉴+서브메뉴)와 별개로, "지금 열려있는 화면들"을 탭으로 누적 관리한다.
         서브메뉴 클릭 = 탭 열기(이미 열려있으면 그 탭으로 전환). ✕ 로 개별 탭 닫기. */
      const openTabs = reactive([]);
      const _tabId = (menuKey, screenId) => menuKey + ':' + screenId;

      const openTab = (menuKey, screenId, pushUrl = true) => {
        if (!menuKey || !screenId) return;
        screenError.value = null;
        const id = _tabId(menuKey, screenId);
        if (!openTabs.find((t) => t.id === id)) {
          const item = window.MFE_REGISTRY.getMenu(menuKey).find((it) => it.id === screenId);
          const menuDef = TOP_MENUS.find((m) => m.key === menuKey);
          openTabs.push({ id, menuKey, screenId, label: item?.label || screenId, menuIcon: menuDef?.icon || '' });
        }
        activeMenu.value = menuKey;
        activeScreenId.value = screenId;
        if (pushUrl) syncUrl();
      };
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

      /* 부팅 시 URL(또는 기본값)로 결정된 화면을 첫 탭으로 자동 오픈 */
      if (_init.menu && _init.screen) openTab(_init.menu, _init.screen, false);

      const selectMenu = (key) => {
        openTab(key, window.MFE_REGISTRY.getMenu(key)[0]?.id || null);
      };
      const selectScreen = (id) => { openTab(activeMenu.value, id); };

      /* menuOf — 좌측 메뉴가 대메뉴별로 전부(활성 메뉴 아니어도) 항목을 그려야 해서 노출 */
      const menuOf = (key) => window.MFE_REGISTRY.getMenu(key);
      /* groupedMenuOf — 대메뉴 하나에 여러 마이크로 레포가 소그룹(item.group)으로
         나눠 기여할 수 있어서(예: pd = pd-pd 레포의 "상품" 그룹 + pd-cate 레포의
         "카테고리" 그룹), 좌측 메뉴는 group 기준 2단으로 묶어 그린다. 아무 항목도
         group 을 안 붙였으면(예: home) 그룹 헤더 없이 예전처럼 평평하게 보여준다. */
      const groupedMenuOf = (key) => {
        const items = window.MFE_REGISTRY.getMenu(key);
        if (!items.some((it) => it.group)) return [{ group: null, items }];
        const order = [];
        const map = {};
        items.forEach((it) => {
          const g = it.group || '기타';
          if (!map[g]) { map[g] = []; order.push(g); }
          map[g].push(it);
        });
        return order.map((g) => ({ group: g, items: map[g] }));
      };
      /* fnIsActive — 사이드바 항목/탭이 "지금 보고 있는 화면"인지. 템플릿 :class 안에서
         && 를 직접 쓰면 이 프로젝트에서 Vue 컴파일러가 크래시하므로 함수로 뺀다. */
      const fnIsActive = (menuKey, screenId) => activeMenu.value === menuKey && activeScreenId.value === screenId;

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
      });

      return {
        TOP_MENUS,
        cfIsLoggedIn, currentAuthUser, loginForm, loginError, loginLoading, doLogin, doLogout,
        toasts, closeToast, confirmState, closeConfirm,
        activeMenu, activeScreenId, cfMenuItems, cfActiveItem, cfActiveMenuDef, selectMenu, selectScreen, screenError,
        openTabs, openTab, selectTab, closeTab, menuOf, groupedMenuOf, fnIsActive,
        navigate, showToast, showConfirm, openNewWindow,
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
          <div style="font-weight:700;color:#666;margin-bottom:2px;">테스트 계정 (비밀번호 전부 공통 1111)</div>
          <div><b>admin1</b> / 1111 — 관리자(전체 메뉴)</div>
          <div><b>admin2</b> / 1111 — 관리자(전체 메뉴)</div>
          <div><b>user1</b> / 1111 — 게스트(제한 화면)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════ 로그인 후: 셸 본체 ══════════════════ -->
  <template v-else>
    <div class="mfe-topbar">
      <div class="mfe-brand">🧩 ShopJoy MFE Demo</div>
      <div class="mfe-menus">
        <button v-for="m in TOP_MENUS" :key="m.key" class="mfe-menu-btn" :class="{ active: activeMenu === m.key }"
          @click="selectMenu(m.key)">{{ m.icon }} {{ m.label }}</button>
      </div>
      <div class="mfe-user">
        <span>{{ currentAuthUser.authNm || currentAuthUser.name || currentAuthUser.authId }}님</span>
        <button class="btn btn-secondary btn-sm" @click="doLogout">로그아웃</button>
      </div>
    </div>

    <div class="mfe-body">
      <!-- ══ 좌측 메뉴 — 상단 대메뉴로 고른 것의 하위 메뉴만 보여줌(실제 bo.html 과 동일 패턴:
           상단바=대메뉴 전환, 좌측=선택된 대메뉴의 화면 트리). 다른 대메뉴 항목은 아예 안 그림 ══ -->
      <div class="mfe-sidebar" v-if="cfActiveMenuDef">
        <div class="mfe-sidebar-group">
          <div class="mfe-sidebar-group-title active">{{ cfActiveMenuDef.icon }} {{ cfActiveMenuDef.label }}</div>
          <template v-for="g in groupedMenuOf(activeMenu)" :key="activeMenu + '_' + (g.group || '_flat')">
            <div v-if="g.group" class="mfe-sidebar-subgroup">{{ g.group }}</div>
            <div class="mfe-sidebar-item" v-for="it in g.items" :key="it.id"
              :class="{ active: fnIsActive(activeMenu, it.id), 'mfe-sidebar-item-nested': g.group }"
              @click="openTab(activeMenu, it.id)">{{ it.label }}</div>
          </template>
        </div>
        <div class="mfe-sidebar-hint">각 폴더의 manifest.js 가 스스로 등록한 메뉴입니다</div>
      </div>

      <!-- ══ 우측: 열린 탭 + 본문 ══ -->
      <div class="mfe-main">
        <div class="mfe-tabs">
          <div v-if="!openTabs.length" class="mfe-tabs-empty">왼쪽 메뉴에서 화면을 선택하세요</div>
          <div v-for="t in openTabs" :key="t.id" class="mfe-tab"
            :class="{ active: fnIsActive(t.menuKey, t.screenId) }"
            @click="selectTab(t.id)">
            <span>{{ t.menuIcon }} {{ t.label }}</span>
            <span class="mfe-tab-close" @click="closeTab(t.id, $event)">✕</span>
          </div>
        </div>

        <div class="mfe-content admin-wrap">
          <div v-if="screenError" class="card" style="padding:16px;border:1px solid #f3b6c6;background:#fff5f7;margin-bottom:12px;">
            <div style="font-weight:800;color:#c0392b;margin-bottom:6px;">⚠ 화면 렌더 중 오류가 발생했습니다 ({{ activeMenu }} / {{ activeScreenId }})</div>
            <div style="font-size:13px;color:#333;">{{ screenError.msg }}</div>
            <pre v-if="screenError.stack" style="font-size:11px;color:#999;white-space:pre-wrap;margin-top:8px;max-height:160px;overflow:auto;">{{ screenError.stack }}</pre>
          </div>
          <div v-if="cfActiveItem && !cfActiveItem.comp" class="card" style="padding:24px;text-align:center;color:#c0392b;">
            "{{ cfActiveItem.label }}" 컴포넌트가 window 에 없습니다 — manifest.js 의 스크립트 로드(404 등)를 확인하세요.
          </div>
          <component v-else-if="cfActiveItem" :is="cfActiveItem.comp" :key="activeMenu + '_' + cfActiveItem.id"
            :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" :open-new-window="openNewWindow" />
          <div v-else class="card" style="padding:60px 24px;text-align:center;color:#999;">왼쪽 메뉴에서 화면을 선택하세요.</div>
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

  /* ── 마이크로 도메인이 스스로 등록한 컴포넌트(메뉴 화면 + registerComponents 내부 컴포넌트) 등록 ──
     셸은 "무엇이 등록됐는지" 내용을 몰라도 되고, 레지스트리를 순회만 하면 된다. */
  Object.entries(window.MFE_REGISTRY.getAll()).forEach(([menuKey, items]) => {
    items.forEach((it) => app.component(it.comp?.name || it.id, it.comp));
  });
  window.MFE_REGISTRY.getAllComponents().forEach((it) => app.component(it.tag, it.comp));

  app.mount('#app');
  }; // window.mfeBootShell
})();
