/* ShopJoy BO - 메인 앱 (Top + Left Nav + 탭 라우팅 + 로그인) */
(function () {
  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;

  /* ── 메뉴 구조 데이터 (→ lib/app/boMenuData.js) ── */
  const {
    TOP_MENUS, HOME_FALLBACK_DASH, LEFT_MENUS, LEFT_MENUS_TAIL, LEFT_MENUS_ALL,
    PAGE_TO_TOP, PAGE_LABELS, ALL_PAGES, MULTI_TAB_PAGES,
    toTabId, toPageFromTabId, toIdFromTabId, AUTH_METHODS,
  } = window.boMenuData;

  const app = createApp({
    setup() {
      /* ── App Init Data Store 초기화 ── */

      /* ── 페이지 & 라우팅 ── */
      const page = ref('dashboard');
      const cfDashboardComp = 'DashboardBoEc' + (window.BO_SITE_NO || '01');
      const errorMessage = ref('');
      /* X- 헤더 배열을 압축 포맷으로 변환
  x-ui-nm: 사이트관리 | x-cmd-nm: 목록조회 | x-trace-id: 20260501_063729_0223
  x-site-type: BO | x-site-id: SITE_BO_01
  x-file-nm: SySiteMng.js | x-func-nm: onSearch | x-line-no: 42
  x-buyer-id: BUYER_001 | x-license-code: eyJz~ (64자 초과 시 앞 64자 + ~) */
      /* X-헤더 배열을 압축 포맷으로 변환 (→ lib/app/boAppFunc.js) */
      const _fmtXHeaders = window.boAppFunc.fmtXHeaders;

      /* API 성공 → 설정에서 API toast 출력 ON 일 때만 info toast (기본 미출력) */
      window.addEventListener('api-response-success', (ev) => {
        if (!apiToastEnabled.value) { return; }
        const d = ev.detail || {};
        showToast(`${d.method} ${d.url} ${d.status}`, 'info', 10000);
      });

      /* API 에러 (boAxios 의 window.dispatchEvent('api-response-error')) — status 로 분기:
         · 401 → error401 페이지 전환 / 500·네트워크 → error500 페이지 전환
         · 그 외 4xx(검증 등) → toast 출력 (화면 유지) */
      window.addEventListener('api-response-error', (ev) => {
        const d = ev.detail || {};
        const st = d.status;
        let label = '';
        if (d.method && (d.fullUrl || d.url)) {
          label = `${d.method} ${d.fullUrl || d.url} ${st}`;
          if (d.uiLabel) label += `  [${d.uiLabel}]`;
        }
        let msg = label ? `${label}\n${d.message || ''}` : d.message || '';
        // 비 401/500 에러는 toast로 X- 헤더 정보 표시 (화면 유지)
        if (st !== 401 && !(st >= 500 || st === 0)) {
          let details = d.errorDetails || '';
          const reqFmt = _fmtXHeaders(d.reqHeaders);
          const resFmt = _fmtXHeaders(d.resHeaders);
          if (reqFmt || resFmt) {
            let headerInfo = '';
            const _nd = new Date();
            const _nts =
              _nd.getFullYear() +
              '-' +
              String(_nd.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(_nd.getDate()).padStart(2, '0') +
              ' ' +
              String(_nd.getHours()).padStart(2, '0') +
              ':' +
              String(_nd.getMinutes()).padStart(2, '0') +
              ':' +
              String(_nd.getSeconds()).padStart(2, '0');
            if (reqFmt) headerInfo += '━━ 요청 헤더 ━━  ' + _nts + '\n' + reqFmt;
            if (resFmt) headerInfo += (headerInfo ? '\n\n' : '') + '━━ 응답 헤더 ━━\n' + resFmt;
            details = details ? headerInfo + '\n\n' + details : headerInfo;
          }
          showToast(msg, 'error', 0, details);
          return;
        }
        if (st === 401) {
          /* 세션 만료 → error401 페이지로 튕기지 않고, 현재 작업 화면 위에 로그인 모달(재인증) 표시.
           * 컨텍스트 유지하며 재로그인 (최초 미인증 진입은 page 모드, 세션만료 재인증은 modal 모드) */
          try { window.useBoAuthStore?.()?.saReset?.(); } catch (_) {}
          _syncCurrentAuthUser?.();
          if (!loginModal.show) {
            showToast('세션이 만료되었습니다. 다시 로그인해 주세요.', 'error');
            openLogin('login', 'modal');
          }
        } else if (st >= 500 || st === 0) {
          errorMessage.value = msg;
          page.value = 'error500';
          try {
            window.history.replaceState(null, '', '#page=error500');
          } catch (_) {}
        }
      });
      const dtlId = ref(null);
      const kanbanClaimId = ref(null); // odOrderKanban 전용 claimId (URL 파라미터로 F5 복원)
      const initSearchValue = ref(null); // ZdSimul BO상세 클릭 시 Mng 자동 조회용

      /* ── 탭 관리 ── */
      const openTabs = reactive([{ id: 'dashboard', label: 'EC대시보드' }]);
      const cfActiveTabId = computed(() => toTabId(page.value, dtlId.value));
      const refreshKeys = reactive({}); // pageId → 재마운트 카운터

      /* ── 탭 고정 (keep-alive 시뮬레이션) ── */
      const keptTabIds = reactive(new Set());

      /* toggleKeep */
      const toggleKeep = (tabId) => {
        if (keptTabIds.has(tabId)) keptTabIds.delete(tabId);
        else keptTabIds.add(tabId);
      };
      /* ── 페이지-컴포넌트 매핑 (→ lib/app/boAppCompPage.js) ── */
      const PAGE_COMP_MAP = window.BO_APP_COMP_PAGE;

      /* addTab */
      const addTab = (tabId, labelOverride) => {
        if (!openTabs.find((t) => t.id === tabId)) {
          const pg = toPageFromTabId(tabId);
          const subId = toIdFromTabId(tabId);
          const baseLabel = PAGE_LABELS[pg] || pg;
          /* labelOverride — 대상마다 이름이 다른 화면(대시보드 뷰어 등)은 호출부가 이름을 준다.
             안 주면 기존대로 "화면명 · ID뒤4자리". */
          const label = labelOverride || (subId ? baseLabel + ' · ' + String(subId).slice(-4) : baseLabel);
          openTabs.push({ id: tabId, label });
        }
      };

      /* closeTab */
      const closeTab = (tabId, evt) => {
        if (evt) evt.stopPropagation();
        const idx = openTabs.findIndex((t) => t.id === tabId);
        if (idx === -1) return;
        keptTabIds.delete(tabId);
        openTabs.splice(idx, 1);
        if (cfActiveTabId.value === tabId) {
          const next = openTabs[Math.min(idx, openTabs.length - 1)];
          if (next) {
            const nextPg = toPageFromTabId(next.id);
            const nextId = toIdFromTabId(next.id);
            navigate(nextPg, nextId ? { id: nextId } : {});
          } else {
            page.value = 'dashboard';
            dtlId.value = null;
          }
        }
      };

      /* ── 탭 컨텍스트 메뉴 ── */
      const ctxMenu = reactive({ show: false, x: 0, y: 0, tabId: null });

      /* showCtxMenu */
      const showCtxMenu = (evt, tabId) => {
        evt.preventDefault();
        ctxMenu.show = true;
        ctxMenu.x = evt.clientX;
        ctxMenu.y = evt.clientY;
        ctxMenu.tabId = tabId;
      };

      /* closeCtxMenu */
      const closeCtxMenu = () => {
        ctxMenu.show = false;
      };

      /* ctxClose */
      const ctxClose = () => {
        closeTab(ctxMenu.tabId);
        closeCtxMenu();
      };

      /* ctxCloseLeft */
      const ctxCloseLeft = () => {
        const idx = openTabs.findIndex((t) => t.id === ctxMenu.tabId);
        if (idx > 0) {
          openTabs.splice(0, idx);
          if (!openTabs.find((t) => t.id === cfActiveTabId.value) && openTabs.length > 0) navigate(openTabs[0]?.id);
        }
        closeCtxMenu();
      };

      /* ctxCloseRight */
      const ctxCloseRight = () => {
        const idx = openTabs.findIndex((t) => t.id === ctxMenu.tabId);
        if (idx < openTabs.length - 1) {
          openTabs.splice(idx + 1);
          if (!openTabs.find((t) => t.id === cfActiveTabId.value)) navigate(openTabs[idx].id);
        }
        closeCtxMenu();
      };

      /* ctxCloseAll */
      const ctxCloseAll = () => {
        const tab = openTabs.find((t) => t.id === ctxMenu.tabId);
        keptTabIds.clear();
        openTabs.splice(0);
        if (tab) {
          openTabs.push(tab);
          navigate(tab.id);
        }
        closeCtxMenu();
      };

      /* ctxCloseOthers */
      const ctxCloseOthers = () => {
        const tab = openTabs.find((t) => t.id === ctxMenu.tabId);
        openTabs.forEach((t) => {
          if (t.id !== ctxMenu.tabId) keptTabIds.delete(t.id);
        });
        openTabs.splice(0);
        if (tab) {
          openTabs.push(tab);
          navigate(tab.id);
        }
        closeCtxMenu();
      };

      /* ctxNewWindow — 새 창은 임베드 모드(상단 nav/탭바/사이드바 없이 화면만) */
      const ctxNewWindow = () => {
        window.open(`${location.pathname}${location.search}#page=${ctxMenu.tabId}&embed=1`, '_blank');
        closeCtxMenu();
      };

      /* ctxRefresh */
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

      /* ── 새창 열기 — 임베드 모드(상단 nav/탭바/사이드바 없이 화면만) ── */
      const openNewWindow = (pgId) => {
        window.open(`${location.pathname}${location.search}#page=${pgId}&embed=1`, '_blank');
      };

      /* ── 열린 화면 목록 (가나다순) ── */
      const cfOpenTabsWithGroup = computed(() =>
        [...openTabs]
          .map((tab) => {
            const pg = toPageFromTabId(tab.id);
            const topId = PAGE_TO_TOP[pg];
            const topLabel = TOP_MENUS.find((t) => t.id === topId)?.label || (tab.id === 'dashboard' ? '홈' : '');
            return { ...tab, topLabel };
          })
          .sort((a, b) => a.label.localeCompare(b.label, 'ko')),
      );

      /* ── 메뉴 상태 (localStorage 영속화) ── */
      const activeTop = ref('home');
      const _lmSaved = localStorage.getItem('modu-bo-left-menu-open');
      const leftMenuOpen = ref(_lmSaved !== null ? _lmSaved === 'true' : true);
      watch(leftMenuOpen, (v) => localStorage.setItem('modu-bo-left-menu-open', String(v)));
      const _tbSaved = localStorage.getItem('modu-bo-tab-bar-open');
      const tabBarOpen = ref(_tbSaved !== null ? _tbSaved === 'true' : true);
      watch(tabBarOpen, (v) => localStorage.setItem('modu-bo-tab-bar-open', String(v)));

      /* ── 대메뉴 hover 드롭다운 ── */
      const hoveredTop = ref(null);
      let _hoverTimer = null;
      const fnMegaMenuSections = (topId) => {
        const items = LEFT_MENUS[topId] || [];
        const sections = [];
        let cur = null;
        for (const item of items) {
          if (item.group) { cur = { group: item.group, items: [] }; sections.push(cur); }
          else if (cur) { cur.items.push(item); }
          else { cur = { group: null, items: [item] }; sections.push(cur); }
        }
        return sections;
      };
      const onTopMenuEnter = (id) => {
        clearTimeout(_hoverTimer);
        if (LEFT_MENUS[id] && LEFT_MENUS[id].length) hoveredTop.value = id;
        else hoveredTop.value = null;
      };
      const onTopMenuLeave = () => {
        _hoverTimer = setTimeout(() => { hoveredTop.value = null; }, 180);
      };
      const onDropdownEnter = () => { clearTimeout(_hoverTimer); };

      /* ── Embed 모드 (URL에 embed=1 이면 상단 nav, 탭바, 좌측 사이드바 숨김) ── */
      const embed = ref(false);
      const cfEmbed = computed(() => embed.value);

      /* setTopMenu */
      const setTopMenu = (topId) => {
        activeTop.value = topId;
        hoveredTop.value = null;
        clearTimeout(_hoverTimer);
        // 홈: 좌측 메뉴 없이 대시보드로 바로 이동
        if (topId === 'home') { navigate('dashboard'); return; }
        const first = LEFT_MENUS_ALL[topId]?.find((p) => p.id);
        if (first) navigate(first.id);
      };

      /* ── Hash routing ── */
      const readHash = (showNotification = false) => {
        const raw = String(window.location.hash || '').replace(/^#/, '');
        const p = new URLSearchParams(raw);
        // embed 모드 플래그 동기화 (값이 '1' 또는 'true' 일 때만 활성)
        const embedVal = p.get('embed');
        const newEmbed = embedVal === '1' || embedVal === 'true';
        if (embed.value !== newEmbed) embed.value = newEmbed;
        const pg = p.get('page');
        // orderId: Kanban 전용 파라미터. 없으면 id 폴백 (레거시 URL 호환)
        const rawOrderId = p.get('orderId') || p.get('id');
        const id = rawOrderId;
        const newDtlId = id !== null ? (isNaN(id) ? id : Number(id)) : null;
        const newClaimId = p.get('claimId') || null;
        if (pg && ALL_PAGES.includes(pg)) {
          const isLoggedIn = !!localStorage.getItem('modu-bo-auth-accessToken');
          if (!isLoggedIn && pg !== 'dashboard') {
            if (showNotification) showToast('로그인이 필요합니다.', 'error');
            if (page.value !== 'dashboard') page.value = 'dashboard';
            return;
          }
          // 동일 값 set 으로 인한 reactive 무한 갱신 방지
          if (page.value !== pg) page.value = pg;
          const newTop = PAGE_TO_TOP[pg];
          if (newTop && activeTop.value !== newTop) activeTop.value = newTop;
          addTab(toTabId(pg, newDtlId));
        }
        if (dtlId.value !== newDtlId) dtlId.value = newDtlId;
        if (kanbanClaimId.value !== newClaimId) kanbanClaimId.value = newClaimId;
        // ZdSimul BO상세에서 넘어온 searchValue — 최초 1회만 소비 후 URL에서 제거
        const sv = p.get('searchValue');
        if (sv) {
          initSearchValue.value = sv;
          // URL hash에서 searchValue 파라미터 제거 (재로드/히스토리 오염 방지)
          p.delete('searchValue');
          const cleaned = p.toString();
          const current = String(window.location.hash || '').replace(/^#/, '');
          if (current !== cleaned) {
            history.replaceState(null, '', '#' + cleaned);
          }
        }
      };
      readHash(false);

      /* navigate — pg에 '__' 포함 시 탭 ID로 간주하여 page/id 자동 분해 */
      const navigate = (pg, opts = {}) => {
        // 탭 ID(odOrderKanban__ORD...) 를 직접 넘긴 경우 분해
        const subId = toIdFromTabId(pg);
        if (subId) {
          opts = Object.assign({}, opts, { id: subId });
          pg = toPageFromTabId(pg);
        }
        const isLoggedIn = !!localStorage.getItem('modu-bo-auth-accessToken');
        if (!isLoggedIn && pg !== 'dashboard') {
          showToast('로그인이 필요합니다.', 'error');
          return;
        }
        page.value = pg;
        // Kanban: orderId/claimId 파라미터 지원 (opts.orderId 우선, 없으면 opts.id 폴백)
        const resolvedOrderId = opts.orderId ?? opts.id ?? null;
        dtlId.value = resolvedOrderId;
        kanbanClaimId.value = opts.claimId ?? null;
        if (PAGE_TO_TOP[pg]) activeTop.value = PAGE_TO_TOP[pg];
        const tabId = toTabId(pg, resolvedOrderId);
        addTab(tabId, opts.tabLabel);
        // 즐겨찾기 keep 설정이 있으면 자동으로 탭 고정
        if (favKeepSet.has(tabId)) keptTabIds.add(tabId);
        const p2 = new URLSearchParams();
        p2.set('page', pg);
        if (opts.orderId != null) {
          p2.set('orderId', opts.orderId);                       // Kanban: orderId 키로 기록
        } else if (opts.id != null) {
          p2.set('id', opts.id);                                 // 일반 Dtl: id 키 유지
        }
        if (opts.claimId != null) p2.set('claimId', opts.claimId); // Kanban: claimId 추가
        if (embed.value) p2.set('embed', '1');
        // 동일 hash 재설정 시 hashchange 이벤트 재발화로 인한 무한 마운트 루프 방지
        const newHash = p2.toString();
        const curHash = String(window.location.hash || '').replace(/^#/, '');
        if (curHash !== newHash) {
          window.location.hash = newHash;
        }
        window.scrollTo(0, 0);
        /* 이미 활성인 화면을 좌측메뉴에서 다시 클릭하면 cfActiveTabId 가 안 바뀌어
           watch 가 안 돈다. 그 경우에도 탭이 보이도록 여기서 한 번 더 호출. */
        Vue.nextTick(scrollActiveTabIntoView);
      };

      /* readHashWithNotification */
      const readHashWithNotification = () => readHash(true);
      window.addEventListener('hashchange', readHashWithNotification);
      onBeforeUnmount(() => window.removeEventListener('hashchange', readHashWithNotification));

      /* ── Toast (누적 스택) ── */
      const toasts = reactive([]);
      /* ── 설정(우측 상단 ⚙) ── */
      const boSettingShow = Vue.ref(false);   // 설정 드롭다운 표시
      // modu-bo-sy-apiToastOpen: API 응답 toast 출력 ON/OFF (F5 후 유지)
      const apiToastEnabled = Vue.ref(localStorage.getItem('modu-bo-sy-apiToastOpen') === 'true');   // 기본 OFF(미저장 시)
      Vue.watch(apiToastEnabled, (v) => { try { localStorage.setItem('modu-bo-sy-apiToastOpen', v ? 'true' : 'false'); } catch (e) {} });
      const onToggleApiToast = () => { apiToastEnabled.value = !apiToastEnabled.value; };
      const onToggleBoSetting = () => { boSettingShow.value = !boSettingShow.value; };
      /* ── API Progress Overlay ──
         apiProgressLabel: 호출 성격에 맞는 문구. 조회(GET)는 '조회중입니다...',
         저장·삭제 등 변경은 '처리중입니다...'. axios 래퍼가 _showProgress 2번째 인자로 준다. */
      const isApiLoading = Vue.ref(false);
      const apiProgressLabel = Vue.ref('처리중입니다...');
      let _apiLoadingCount = 0;
      let _hideTimer = null;
      let _progressShowAt = 0;
      const MIN_SHOW_MS = 300;
      const HIDE_DELAY_MS = 50;
      window._showProgress = (on, label) => {
        if (on && label) { apiProgressLabel.value = label; }
        _apiLoadingCount = Math.max(0, _apiLoadingCount + (on ? 1 : -1));
        if (_apiLoadingCount > 0) {
          if (_hideTimer) {
            clearTimeout(_hideTimer);
            _hideTimer = null;
          }
          if (!isApiLoading.value) _progressShowAt = Date.now();
          isApiLoading.value = true;
        } else {
          const elapsed = Date.now() - _progressShowAt;
          const remain = Math.max(0, MIN_SHOW_MS - elapsed) + HIDE_DELAY_MS;
          if (_hideTimer) clearTimeout(_hideTimer);
          _hideTimer = setTimeout(() => {
            if (_apiLoadingCount === 0) isApiLoading.value = false;
            _hideTimer = null;
          }, remain);
        }
      };

      let _toastId = 0;
      const TOAST_DURATION = 3500;
      const STATUS_HINT = {
        400: '잘못된 요청 — 파라미터를 확인하세요.',
        401: '인증 만료 — 다시 로그인하세요.',
        403: '접근 거부 — 권한이 없거나 라이선스가 유효하지 않습니다.',
        404: '리소스를 찾을 수 없습니다.',
        405: '허용되지 않는 HTTP 메서드입니다.',
        409: '데이터 충돌 — 이미 존재하는 항목입니다.',
        422: '입력값 검증 실패 — 필드를 확인하세요.',
        429: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
        500: '서버 내부 오류 — 관리자에게 문의하세요.',
        502: '게이트웨이 오류 — 서버가 응답하지 않습니다.',
        503: '서비스 일시 중단 — 잠시 후 다시 시도하세요.',
      };

      /* showToast(msg, type, duration, errorDetails, action?)
       * action: { label, onClick } — 토스트 안에 표시되는 액션 버튼 (예: 설정 도움말 열기). 선택. */
      const showToast = (msg, type = 'success', duration = TOAST_DURATION, errorDetails = '', action = null) => {
        if (type === 'error') duration = 0;
        const id = ++_toastId;
        let msgTitle = msg;
        let msgDetail = '';
        let statusHint = '';

        // 에러 메시지에서 METHOD URL STATUS를 분리
        if (type === 'error' && msg.includes('\n')) {
          const parts = msg.split('\n');
          msgDetail = parts[0]; // METHOD URL STATUS
          msgTitle = parts.slice(1).join('\n'); // 나머지 메시지
          const stMatch = msgDetail.match(/\b([45]\d{2})\b/);
          if (stMatch) statusHint = STATUS_HINT[parseInt(stMatch[1])] || 'HTTP ' + stMatch[1] + ' 오류';
        }

        toasts.push({
          id,
          msgTitle,
          msgDetail,
          statusHint,
          msg,
          type,
          action,
          persistent: duration === 0,
          errorDetails,
          expanded: type === 'error' && toastShowDetail.value,
        });
        if (duration !== 0) {
          setTimeout(() => {
            const idx = toasts.findIndex((t) => t.id === id);
            if (idx !== -1) toasts.splice(idx, 1);
          }, duration);
        }
      };

      /* onToastAction — 토스트 액션 버튼 클릭 (도움말 모달 오픈 등) */
      const onToastAction = (t) => { if (t.action && typeof t.action.onClick === 'function') t.action.onClick(); };
      /* 전역 노출 (BaseModal 등에서 props 없이 호출) */
      window.boToast = showToast;

      /* closeToast */
      const closeToast = (id) => {
        const idx = toasts.findIndex((t) => t.id === id);
        if (idx !== -1) toasts.splice(idx, 1);
      };

      /* closeAllToasts */
      const closeAllToasts = () => {
        toasts.splice(0, toasts.length);
      };
      const toastShowDetail = ref(localStorage.getItem('modu-bo-sy-toast-isShowDetail') !== 'false');

      /* toggleToastDetail */
      const toggleToastDetail = () => {
        toastShowDetail.value = !toastShowDetail.value;
        localStorage.setItem('modu-bo-sy-toast-isShowDetail', toastShowDetail.value);
        toasts.forEach((t) => {
          t.expanded = toastShowDetail.value;
        });
      };

      /* ── API 응답 패널 ── */
      const apiResPanel = reactive({ show: false, res: null });

      /* setApiRes */
      const setApiRes = (res) => {
        apiResPanel.res = res; /* apiResPanel.show = true; */
      };

      /* API 응답 → 응답 패널 자동 반영 (화면에서 setApiRes 직접 호출 불필요).
         boApiAxios 인터셉터가 쏘는 api-response-success / api-response-error 를 받아 setApiRes 호출. */
      window.addEventListener('api-response-success', (ev) => {
        const d = ev.detail || {};
        setApiRes({ ok: true, status: d.status, data: d.data, url: d.url, method: d.method });
      });
      window.addEventListener('api-response-error', (ev) => {
        const d = ev.detail || {};
        setApiRes({ ok: false, status: d.status, message: d.message, data: d.data, url: d.url, method: d.method });
      });

      /* closeApiResPanel */
      const closeApiResPanel = () => {
        apiResPanel.show = false;
      };

      /* ── Confirm ── */
      const confirmState = reactive({
        show: false,
        title: '',
        msg: '',
        details: null,
        btnOk: '확인',
        btnCancel: '취소',
        resolve: null,
      });

      /* showConfirm */
      const showConfirm = (title, msg, opts = {}) =>
        new Promise((r) =>
          Object.assign(confirmState, {
            show: true,
            title,
            msg,
            details: opts.details || null,
            btnOk: opts.btnOk || '확인',
            btnCancel: opts.btnCancel || '취소',
            resolve: r,
          }),
        );
      /* 전역 노출 (BaseModal 등에서 props 없이 호출 가능) */
      window.boConfirm = showConfirm;

      /* closeConfirm */
      const closeConfirm = (v) => {
        confirmState.show = false;
        confirmState.resolve?.(v);
      };

      /* ── 참조 모달 ── */
      const refModal = reactive({ show: false, type: '', id: null });

      /* showRefModal */
      const showRefModal = (type, id) => {
        refModal.type = type;
        refModal.id = id;
        refModal.show = true;
      };

      /* closeRefModal */
      const closeRefModal = () => {
        refModal.show = false;
      };

      /* ── 전역 노출: 페이지 컴포넌트에서 props 없이 직접 접근 가능 ── */
      window.boApp = {
        navigate,
        showToast,
        showConfirm,
        showRefModal,
        setApiRes,
      };

      /* ── 도움말 모달 ── */
      const helpModal = reactive({ show: false, topic: '' });

      /* showHelp */
      const showHelp = (topic = '') => {
        helpModal.topic = topic;
        helpModal.show = true;
      };
      /* 전역 노출 — 어느 컴포넌트에서든 window.showBoHelp('prodOpt') 호출 가능 */
      window.showBoHelp = showHelp;

      /* ── 공통 필터 & 선택 모달 ── */
      const _rpSaved = localStorage.getItem('modu-bo-right-panel-open');
      const rightPanelOpen = ref(_rpSaved !== null ? _rpSaved === 'true' : true);
      watch(rightPanelOpen, (v) => localStorage.setItem('modu-bo-right-panel-open', String(v)));
      const commonFilter = boCommonFilter;

      /* 사이트 필터 default 적용: store(svBoSiteId)가 있으면 그 값을 commonFilter.siteId 기본으로 세팅 */
      if (!commonFilter.siteId) {
        const _appStore = window.sfGetBoAppStore?.();
        commonFilter.siteId = _appStore?.svBoSiteId || '2604010000000001';
      }

      const selectModal = reactive({ type: '', show: false });

      /* openSelectModal */
      const openSelectModal = (type) => {
        selectModal.type = type;
        selectModal.show = true;
      };

      /* closeSelectModal */
      const closeSelectModal = () => {
        selectModal.show = false;
        selectModal.type = '';
      };

      /* onSelectItem */
      const onSelectItem = (type, item) => {
        if (type === 'site') {
          commonFilter.siteId = item?.siteId ?? null;
          /* boAppStore 의 svBoSiteId / svBoSiteNm 동기화 */
          const _appStore = window.useBoAppStore?.();
          if (_appStore && item) {
            _appStore.saSetBoSiteId?.(item.siteId);
            _appStore.saSetBoSiteNm?.(item.siteNm);
          }
        } else if (type === 'vendor') commonFilter.vendorId = item?.vendorId ?? null;
        else if (type === 'dlivVendor') commonFilter.dlivVendorId = item?.vendorId ?? null;
        else if (type === 'boUser') commonFilter.userId = item?.boUserId ?? null;
        else if (type === 'member') commonFilter.memberId = item?.memberId ?? null;
        else if (type === 'order') commonFilter.orderId = item?.orderId ?? null;
        selectModal.show = false;
      };

      /* clearFilter */
      const clearFilter = (type) => {
        if (type === 'site') commonFilter.siteId = null; /* 사이트는 필수이지만 사용자가 직접 비우는 경우에만 */
        else if (type === 'vendor') commonFilter.vendorId = null;
        else if (type === 'dlivVendor') commonFilter.dlivVendorId = null;
        else if (type === 'boUser') commonFilter.userId = null;
        else if (type === 'member') commonFilter.memberId = null;
        else if (type === 'order') commonFilter.orderId = null;
      };

      /* 공통 필터 표시용 — _boCmSites 에서 siteId 매칭. 매칭 실패 시 boAppStore 의 svBoSiteId/svBoSiteNm fallback */
      const filterSite = computed(() => {
        if (!commonFilter.siteId) return null;
        const sites = window._boCmSites || [];
        const found = sites.find((s) => s.siteId === commonFilter.siteId);
        if (found) return found;
        /* sites 가 아직 로드되지 않은 경우, store 값으로 임시 표시 */
        const _appStore = window.sfGetBoAppStore?.();
        if (_appStore && commonFilter.siteId === _appStore.svBoSiteId) {
          return { siteId: _appStore.svBoSiteId, siteNm: _appStore.svBoSiteNm, siteCode: '' };
        }
        return { siteId: commonFilter.siteId, siteNm: '', siteCode: '' };
      });
      const filterVendor = null,
        cfFilterDlivVendor = null;
      const cfFilterBoUser = null,
        filterMember = null,
        filterOrder = null;

      /* ── API 로그 (최대 10건, localStorage 저장) ── */
      const apiLogs = reactive([]);
      const apiLogHoverDetail = ref(null);
      const apiLogLockedDetail = ref(null);
      const maxApiLogs = 15;

      /* _loadApiLogsFromStorage */
      const _loadApiLogsFromStorage = () => {
        try {
          const stored = localStorage.getItem('modu-bo-sy-apiLog');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              apiLogs.push(...parsed);
            }
          }
        } catch (_) {}
      };

      /* _saveApiLogsToStorage */
      const _saveApiLogsToStorage = () => {
        try {
          localStorage.setItem('modu-bo-sy-apiLog', JSON.stringify(apiLogs.slice(0, 10)));
        } catch (_) {}
      };

      /* addBoApiLog */
      const addBoApiLog = (
        method,
        url,
        status,
        duration,
        hasError = false,
        reqData = null,
        resData = null,
        reqHeaders = null,
      ) => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const time = `${hh}:${mm}:${ss}s`;
        let reqStr = '',
          resStr = '',
          headerStr = '',
          uiLabel = '';
        try {
          if (reqData) reqStr = JSON.stringify(typeof reqData === 'string' ? JSON.parse(reqData) : reqData, null, 2);
          if (resData) resStr = JSON.stringify(typeof resData === 'string' ? JSON.parse(resData) : resData, null, 2);
          if (reqHeaders) {
            /* dec */
            const dec = (v) => {
              try {
                return v ? decodeURIComponent(v) : '';
              } catch (_) {
                return v || '';
              }
            };

            /* get */
            const get = (h, k) => h[k] || h[k.toLowerCase()] || '';
            const decUiNm = dec(get(reqHeaders, 'X-UI-Nm'));
            const decCmdNm = dec(get(reqHeaders, 'X-Cmd-Nm'));
            if (decUiNm || decCmdNm) uiLabel = decCmdNm ? decUiNm + ' > ' + decCmdNm : decUiNm;

            /* trunc */
            const trunc = (v, n = 60) => (v && v.length > n ? v.slice(0, 8) + '...' + v.slice(-6) : v || '');

            /* row */
            const row = (...keys) =>
              keys
                .map((k) => {
                  const v = dec(get(reqHeaders, k));
                  return v ? k.toLowerCase() + ': ' + v : '';
                })
                .filter(Boolean)
                .join(' | ');
            const lines = [
              row('x-site-type', 'X-UI-Nm', 'X-Cmd-Nm'),
              row('X-File-Nm', 'X-Func-Nm', 'X-Line-No'),
              [
                dec(get(reqHeaders, 'X-Trace-Id')) ? 'x-trace-id: ' + dec(get(reqHeaders, 'X-Trace-Id')) : '',
                dec(get(reqHeaders, 'X-Site-Id')) ? 'x-site-id: ' + dec(get(reqHeaders, 'X-Site-Id')) : '',
                dec(get(reqHeaders, 'X-Buyer-Id')) ? 'x-buyer-id: ' + dec(get(reqHeaders, 'X-Buyer-Id')) : '',
                dec(get(reqHeaders, 'X-License-Code'))
                  ? 'x-license-code: ' + trunc(dec(get(reqHeaders, 'X-License-Code')), 16)
                  : '',
                dec(get(reqHeaders, 'X-User-Agent'))
                  ? 'x-user-agent: ' + trunc(dec(get(reqHeaders, 'X-User-Agent')), 18)
                  : '',
                get(reqHeaders, 'Authorization') ? 'authorization: ' + trunc(get(reqHeaders, 'Authorization'), 20) : '',
              ]
                .filter(Boolean)
                .join(' | '),
            ].filter(Boolean);
            headerStr = lines.join('\n');
          }
        } catch (_) {
          reqStr = String(reqData || '');
          resStr = String(resData || '');
        }
        apiLogs.unshift({
          method,
          url,
          status,
          duration,
          time,
          hasError,
          uiLabel,
          reqData: reqStr,
          resData: resStr,
          headers: headerStr,
        });
        if (apiLogs.length > maxApiLogs) apiLogs.pop();
        _saveApiLogsToStorage();
      };

      /* clearApiLogs */
      const clearApiLogs = () => {
        apiLogs.length = 0;
        try {
          localStorage.removeItem('modu-bo-sy-apiLog');
        } catch (_) {}
        showToast('API 로그가 초기화되었습니다.', 'success');
      };

      /* toggleApiLogLock */
      const toggleApiLogLock = (log) => {
        if (apiLogLockedDetail.value === log) {
          apiLogLockedDetail.value = null;
        } else {
          apiLogLockedDetail.value = log;
        }
      };

      /* onApiLogEnter — 행 hover 진입. 닫기 예약 취소 후 해당 로그 표시 */
      let _apiLogCloseTimer = null;
      const onApiLogEnter = (log) => {
        if (_apiLogCloseTimer) { clearTimeout(_apiLogCloseTimer); _apiLogCloseTimer = null; }
        apiLogHoverDetail.value = log;
      };

      /* onApiLogLeave — 행/상세창 hover 이탈. 즉시 닫지 않고 지연 → 행↔상세창 사이 빈 공간 통과 허용 */
      const onApiLogLeave = (log) => {
        if (_apiLogCloseTimer) { clearTimeout(_apiLogCloseTimer); }
        _apiLogCloseTimer = setTimeout(() => {
          if (apiLogLockedDetail.value !== apiLogHoverDetail.value) apiLogHoverDetail.value = null;
          _apiLogCloseTimer = null;
        }, 200);
      };

      /* onApiLogDetailEnter — 상세창 hover 진입. 닫기 예약 취소(창 위에서는 유지) */
      const onApiLogDetailEnter = () => {
        if (_apiLogCloseTimer) { clearTimeout(_apiLogCloseTimer); _apiLogCloseTimer = null; }
      };

      /* onApiLogDetailLeave — 상세창 hover 이탈 → 지연 닫기 */
      const onApiLogDetailLeave = () => {
        onApiLogLeave(apiLogHoverDetail.value);
      };

      /* formatJsonData, isWithin60Seconds, fnFmtSec, fnShortUrl,
         fnHmsToMs, getRelativeTime, getApiStatusColor (→ lib/app/boAppFunc.js) */
      const formatJsonData     = window.boAppFunc.fmtJson;
      const isWithin60Seconds  = window.boAppFunc.isWithin60Seconds;
      const fnFmtSec           = window.boAppFunc.fmtSec;
      const fnShortUrl         = window.boAppFunc.shortUrl;
      const fnHmsToMs          = window.boAppFunc.hmsToMs;
      const getRelativeTime    = window.boAppFunc.relativeTime;
      const getApiStatusColor  = window.boAppFunc.apiStatusColor;

      /* boApi 인터셉터로 로그 수집 */

      /* ── 반응형: 좁은 화면에서만 사이드바 강제 닫힘 (넓은 화면은 localStorage 값 유지) ── */
      const checkWidth = () => {
        if (window.innerWidth < 920) leftMenuOpen.value = false;
      };
      onBeforeUnmount(() => window.removeEventListener('resize', checkWidth));

      /* ── 탭바 좌우 스크롤 ── */
      const tabBarRef = ref(null);

      /* scrollTabs */
      const scrollTabs = (dir) => {
        if (tabBarRef.value) tabBarRef.value.scrollBy({ left: dir * 180, behavior: 'smooth' });
      };

      /* scrollActiveTabIntoView — 활성 탭이 탭바 밖으로 밀려 있으면 보이는 위치까지 스크롤.
         탭이 꽉 차면 좌측메뉴로 이동하거나 새 화면을 열어도 활성 탭이 화면 밖에 있어
         "지금 어느 화면인지" 가 안 보이던 문제를 막는다.
         offsetLeft 대신 getBoundingClientRect 차이를 쓰는 이유:
         .bo-tab-bar 에 position 이 없으면 offsetParent 가 상위로 올라가 계산이 어긋난다. */
      const scrollActiveTabIntoView = () => {
        const wrap = tabBarRef.value;
        if (!wrap) { return; }
        const el = Array.from(wrap.children)
          .find((c) => c.dataset && c.dataset.tabId === cfActiveTabId.value);
        if (!el) { return; }
        const PAD = 12;                                   // 좌우 여백 (스크롤 버튼에 가려지지 않게)
        const wr = wrap.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        if (er.left < wr.left + PAD) {
          wrap.scrollBy({ left: er.left - wr.left - PAD, behavior: 'smooth' });
        } else if (er.right > wr.right - PAD) {
          wrap.scrollBy({ left: er.right - wr.right + PAD, behavior: 'smooth' });
        }
      };

      /* 활성 탭이 바뀌거나(화면 이동) 탭 개수가 바뀌면(열기/닫기) 위치 재확인.
         DOM 반영 후여야 하므로 nextTick 을 거친다. */
      watch(
        () => [cfActiveTabId.value, openTabs.length],
        () => Vue.nextTick(scrollActiveTabIntoView)
      );

      /* ── 로그인 상태 (localStorage 영속화) ── */
      /* _restoreBoUser */
      const _restoreBoUser = () => {
        try {
          const tok = localStorage.getItem('modu-bo-auth-accessToken');
          if (!tok) return { userId: '', name: '', email: '', role: '', phone: '', dept: '' };
          const authUser = JSON.parse(localStorage.getItem('modu-bo-auth-authUser') || 'null');
          return authUser || { userId: '', name: '', email: '', role: '', phone: '', dept: '' };
        } catch (_) {
          return { userId: '', name: '', email: '', role: '', phone: '', dept: '' };
        }
      };

      /* ── FO의 foAuth.state 패턴과 동일: Vue.reactive state + _sync() ── */
      const _defaultBoAuthUser = () => ({
        authId: '',
        authNm: '',
        userId: '',
        name: '',
        email: '',
        role: '',
        phone: '',
        dept: '',
        AppTypeCd: '',
        roleId: '',
        siteId: '',
        profileAttachId: null,
      });
      const currentAuthUser = reactive(_defaultBoAuthUser());
      // store 인스턴스를 setup() 안에서 한 번만 가져와서 고정 — Pinia 컨텍스트 보장
      const _boAuthStore = window.useBoAuthStore?.();

      /* _syncCurrentAuthUser */
      const _syncCurrentAuthUser = () => {
        try {
          const u = _boAuthStore?.svAuthUser;
          const target = u && u.authId ? u : _defaultBoAuthUser();
          // 동일 값 set 으로 인한 reactive 무한 갱신 방지 — 변경된 키만 set
          for (const k in target) {
            if (currentAuthUser[k] !== target[k]) currentAuthUser[k] = target[k];
          }
        } catch (e) {}
      };

      // 초기 복원 — 토큰 없으면 reset, 있으면 syncFromStorage (FO foAuth.init() 동일 패턴)
      try {
        const _initToken = localStorage.getItem('modu-bo-auth-accessToken');
        if (!_initToken) _boAuthStore?.saReset?.();
        else _boAuthStore?.saSyncFromStorage?.();
      } catch (_) {}
      _syncCurrentAuthUser();

      // F5 새로고침 시 토큰 유효성 검증 (FO: foAuth.init() 내 fetchFoAppInitData())
      // boInitReady: 초기화 완료 전 컴포넌트 API 호출을 막기 위한 플래그
      const boInitReady = ref(false);
      window.boInitReady = false;
      (async () => {
        const store = _boAuthStore;
        if (store?.svAccessToken) {
          try {
            await window.useBoAppInitStore?.()?.saFetchBoAppInitData?.();
            _syncCurrentAuthUser();
          } catch (e) {
            if (e?.response?.status === 401) {
              console.warn('[boApp] token invalid (401), reset session');
              store.saReset();
              _syncCurrentAuthUser();
            } else {
              console.warn('[boApp] fetchBoAppInitData error:', e?.response?.status || e.message);
            }
          }
        }
        boInitReady.value = true;
        window.boInitReady = true;
      })();
      const activeRoleId = ref(null);
      const cfIsLoggedIn = computed(() => !!currentAuthUser?.authId);
      const currentAuthUserRoles = reactive([]);
      // getInitData 응답에 이미 사용자 역할 + 시스템 역할이 모두 들어있으므로
      // 별도 API 호출 없이 store 데이터에서 사용자 역할만 매핑한다.
      //   - 사용자 역할 ID 목록   : boAuthStore.svTempAuthInfo['authUser-roles']  (← syAuth.tempAuthInfo)
      //   - 시스템 전체 역할 정보 : boRoleStore.svRoles                          (← syRoles)
      const _rolesEqual = (a, b) => {
        if (!a || !b || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i]?.roleId !== b[i]?.roleId) return false;
        return true;
      };

      /* updateCurrentUserRoles */
      const updateCurrentUserRoles = () => {
        try {
          if (!currentAuthUser?.authId) {
            if (currentAuthUserRoles.length) currentAuthUserRoles.splice(0, currentAuthUserRoles.length);
            return;
          }
          const allRoles = window.sfGetBoRoleStore?.()?.svRoles || [];
          const tempAuthInfo = window.useBoAuthStore?.()?.svTempAuthInfo || {};
          const userRoleEntries = tempAuthInfo['authUser-roles'] || [];
          const roleMap = Object.fromEntries(allRoles.map((r) => [r?.roleId, r]));
          const result = userRoleEntries.map((ur) => roleMap[ur?.roleId]).filter(Boolean);
          // 결과가 동일하면 splice 스킵 — reactive 무한 갱신 방지
          if (!_rolesEqual(currentAuthUserRoles, result)) {
            currentAuthUserRoles.splice(0, currentAuthUserRoles.length, ...result);
          }
        } catch (e) {
          console.error('currentAuthUserRoles error:', e);
          if (currentAuthUserRoles.length) currentAuthUserRoles.splice(0, currentAuthUserRoles.length);
        }
      };
      updateCurrentUserRoles();
      // currentAuthUser 객체 deep watch 시 매번 fire → authId 변화에만 반응 (로그인 상태 변화 트래킹)
      watch(() => currentAuthUser?.authId || '', updateCurrentUserRoles);
      // getInitData 비동기 완료 시점에도 재계산 — store 데이터 도착 후 역할 매핑
      watch(boInitReady, (v) => {
        if (v) updateCurrentUserRoles();
      });

      /* rolePath */
      const rolePath = (r, uid) => {
        try {
          if (!r) return '';
          const roles = window.sfGetBoRoleStore?.()?.svRoles || [];
          const m = Object.fromEntries((roles || []).map((x) => [x?.roleId, x]));
          const seg = [];
          let cur = r;
          let root = r;
          while (cur) {
            seg.unshift(cur?.roleNm || '');
            root = cur;
            cur = cur?.parentRoleId && m[cur.parentRoleId] ? m[cur.parentRoleId] : null;
          }
          return seg.join(' > ');
        } catch (e) {
          console.error('rolePath error:', e);
          return '';
        }
      };

      /* onRoleChange */
      const onRoleChange = () => {
        location.reload();
      };

      /* rolesOfUser */
      const rolesOfUser = (uid) => {
        try {
          const roles = window.sfGetBoRoleStore?.()?.svRoles || [];
          const m = Object.fromEntries((roles || []).map((r) => [r?.roleId, r]));
          const userRoles = (currentAuthUserRoles || []).filter((ur) => ur?.userId === uid || !uid);
          const result = (userRoles || []).map((ur) => m[ur?.roleId]).filter(Boolean);
          return result || [];
        } catch (e) {
          console.error('rolesOfUser error:', e);
          return [];
        }
      };

      onMounted(() => {
        /* 최초 진입(F5 포함) 시에도 활성 탭이 보이게. watch 는 setup 이후 등록되므로
           초기 렌더에는 안 걸린다. */
        Vue.nextTick(scrollActiveTabIntoView);
        setTimeout(() => {
          window.useBoAppInitStore?.()?.saRestoreFromStorage?.();
        }, 0);
        /* 이미 로그인된 상태(F5 등)에서도 사용자 대시보드 좌측메뉴 로드 */
        setTimeout(() => { fnLoadSysDashMenus(); fnLoadUserDashMenus(); }, 300);
        _loadApiLogsFromStorage();
        setTimeout(() => {
          if (typeof boApi !== 'undefined' && boApi.raw) {
            const inst = boApi.raw;
            const startTime = {};
            const reqData = {};
            const reqHeaders = {};
            inst.interceptors.request.use((cfg) => {
              const key = cfg.url + cfg.method;
              startTime[key] = Date.now();
              reqData[key] = cfg.data || cfg.params || null;
              reqHeaders[key] = cfg.headers || {};
              return cfg;
            });
            inst.interceptors.response.use(
              (res) => {
                const key = res.config.url + res.config.method;
                const duration = Date.now() - (startTime[key] || 0);
                addBoApiLog(
                  res.config.method.toUpperCase(),
                  res.config.url,
                  res.status,
                  duration,
                  false,
                  reqData[key],
                  res.data,
                  reqHeaders[key],
                );
                delete startTime[key];
                delete reqData[key];
                delete reqHeaders[key];
                return res;
              },
              (err) => {
                const cfg = err.config || {};
                const key = cfg.url + cfg.method;
                const duration = Date.now() - (startTime[key] || 0);
                addBoApiLog(
                  cfg.method.toUpperCase(),
                  cfg.url,
                  err.response?.status || 0,
                  duration,
                  true,
                  reqData[key],
                  err.response?.data,
                  reqHeaders[key],
                );
                delete startTime[key];
                delete reqData[key];
                delete reqHeaders[key];
                return Promise.reject(err);
              },
            );
          }
        }, 100);
        checkWidth();
        window.addEventListener('resize', checkWidth);
        const codeStore = window.sfGetBoCodeStore?.();
        if (codeStore?.sgGetGrpCodes) {
          const roles = codeStore.sgGetGrpCodes('USER_ROLE') || [];
          userRoles.splice(0, userRoles.length, ...roles);
        }
        /* 최초 진입 시 미인증이면 전용 화면(page 모드) 으로 로그인 표시 — 뒤에 데이터 안 비침.
         * (세션 만료 후 재인증은 modal 모드로 별도 호출) */
        setTimeout(() => {
          const isLoggedIn = !!localStorage.getItem('modu-bo-auth-accessToken');
          if (!isLoggedIn) openLogin('login', 'page');
        }, 50);
      });
      // currentAuthUser 객체 deep watch 시 매번 fire → userId 변화에만 반응
      watch(
        () => currentAuthUser?.userId || '',
        (uid) => {
          try {
            if (uid) {
              const roles = currentAuthUserRoles || [];
              if (!roles.find((r) => r?.roleId === activeRoleId.value)) {
                const newRoleId = roles && roles.length ? roles[0]?.roleId : null;
                if (activeRoleId.value !== newRoleId) activeRoleId.value = newRoleId;
              }
            } else {
              if (activeRoleId.value !== null) activeRoleId.value = null;
            }
          } catch (e) {
            console.error('watch currentAuthUser error:', e);
            if (activeRoleId.value !== null) activeRoleId.value = null;
          }
        },
        { immediate: true },
      );
      const loginModal = reactive({ show: false, tab: 'login', mode: 'modal' }); // mode: 'modal'(세션만료 재인증) | 'page'(최초 미인증 전용화면)
      const loginForm = reactive({ loginId: '', loginPwd: '', authMethod: '메인' });
      const QUICK_USERS = [
        {
          loginId: 'super_admin',
          loginPwd: 'demo1234',
          label: '슈퍼관리자',
          userNm: '슈퍼관리자',
          role: 'SUPER',
          icon: '👑',
        },
        { loginId: 'admin1', loginPwd: 'demo1234', label: '운영관리자', userNm: '관리자1', role: 'ADMIN', icon: '🛡' },
        { loginId: 'admin2', loginPwd: 'demo1234', label: '일반관리자', userNm: '관리자2', role: 'ADMIN', icon: '👤' },
        { loginId: 'operator1', loginPwd: 'demo1234', label: '운영자', userNm: '운영자1', role: 'OPR', icon: '⚙️' },
        { loginId: 'cs_agent1', loginPwd: 'demo1234', label: 'CS상담원', userNm: 'CS상담원1', role: 'CS', icon: '🎧' },
        {
          loginId: 'vendor1',
          loginPwd: 'demo1234',
          label: '판매업체',
          userNm: '판매업체1',
          role: 'VENDOR',
          icon: '🏪',
        },
      ];

      /* quickLogin */
      const quickLogin = (u) => {
        loginForm.loginId = u.loginId;
        loginForm.loginPwd = u.loginPwd;
        doLogin();
      };
      /* 사용자 선택 모달 */
      const PAGE_SIZE = 20;
      const userPickModal = reactive({
        show: false,
        searchValue: '',
        pageNo: 1,
        loading: false,
        rows: [],
        total: 0,
        totalPage: 1,
        isApiMode: false,
      });

      /* _loadUserPickPage */
      const _loadUserPickPage = async () => {
        userPickModal.loading = true;
        try {
          const params = { pageNo: userPickModal.pageNo, pageSize: PAGE_SIZE };
          if (userPickModal.searchValue) params.searchValue = userPickModal.searchValue; // 빈 문자열 미전송 → 전체 조회
          const res = await window.coApiSvc.syUser.getPage(params, '사용자선택', '목록조회');
          const d = res.data?.data;
          userPickModal.rows = d?.pageList || d?.list || [];
          userPickModal.total = d?.pageTotalCount ?? d?.total ?? 0;
          userPickModal.totalPage =
            d?.pageTotalPage ?? d?.totalPage ?? Math.max(1, Math.ceil(userPickModal.total / PAGE_SIZE));
        } catch (e) {
          console.warn('[userPickModal] load error:', e);
          userPickModal.rows = [];
          userPickModal.total = 0;
          userPickModal.totalPage = 1;
        } finally {
          userPickModal.loading = false;
        }
      };
      /* 로컬(QUICK_USERS) 페이징 — 로그인 전 fallback */
      const cfLocalFiltered = Vue.computed(() => {
        const searchVal = (userPickModal.searchValue || '').toLowerCase();
        return searchVal
          ? QUICK_USERS.filter(
              (u) =>
                u.label.toLowerCase().includes(searchVal) ||
                u.loginId.toLowerCase().includes(searchVal) ||
                (u.userNm || '').toLowerCase().includes(searchVal),
            )
          : QUICK_USERS;
      });
      const cfLocalPage = Vue.computed(() => {
        const start = (userPickModal.pageNo - 1) * PAGE_SIZE;
        return cfLocalFiltered.value.slice(start, start + PAGE_SIZE);
      });
      const cfLocalTotalPage = Vue.computed(() => Math.max(1, Math.ceil(cfLocalFiltered.value.length / PAGE_SIZE)));
      const cfPickRows = Vue.computed(() => (userPickModal.isApiMode ? userPickModal.rows : cfLocalPage.value));
      const cfPickTotal = Vue.computed(() =>
        userPickModal.isApiMode ? userPickModal.total : cfLocalFiltered.value.length,
      );
      const cfPickTotalPage = Vue.computed(() =>
        userPickModal.isApiMode ? userPickModal.totalPage : cfLocalTotalPage.value,
      );

      /* openUserPick */
      const openUserPick = () => {
        userPickModal.searchValue = '';
        userPickModal.pageNo = 1;
        userPickModal.isApiMode = true; // 항상 API 모드 (로그인 전/후 무관)
        userPickModal.show = true;
        _loadUserPickPage();
      };

      /* onUserPickSearch */
      const onUserPickSearch = () => {
        userPickModal.pageNo = 1;
        _loadUserPickPage();
      };

      /* onUserPickPage */
      const onUserPickPage = (p) => {
        userPickModal.pageNo = p;
        _loadUserPickPage();
      };

      /* onUserPick */
      const onUserPick = (u) => {
        userPickModal.show = false;
        loginForm.loginId = u.loginId || u.userId || '';
        loginForm.loginPwd = '1111'; // 마스터 패스워드 — 서버에서 SHA256("1111") 무조건 통과
        doLogin();
      };
      const regForm = reactive({ name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
      const userRoles = reactive([]);
      const loginError = ref('');
      const uiState = reactive({
        userMenuShow: false,
        profileModalShow: false,
        pwModalShow: false,
        relatedSiteOpen: false,
        sitemapShow: false,
        favPanelShow: false,
      });

      /* 프로필 모달 */
      const profileForm = reactive({ name: '', phone: '', dept: '', email: '', profileAttachId: null });
      const profileImg = reactive({ attachId: null, cdnImgUrl: '' }); // 표시용 이미지 상태
      const profileImgUploading = ref(false);

      /* _loadProfileImg */
      const _loadProfileImg = async (grpId) => {
        if (!grpId) {
          profileImg.attachId = null;
          profileImg.cdnImgUrl = '';
          return;
        }
        try {
          const res = await window.coApiSvc.cmAttach.getFiles(grpId);
          const f = (res.data?.data || [])[0];
          profileImg.attachId = f?.attachId || null;
          profileImg.cdnImgUrl = f?.cdnImgUrl || '';
        } catch (e) {
          profileImg.attachId = null;
          profileImg.cdnImgUrl = '';
        }
      };

      /* openProfile */
      const openProfile = () => {
        if (!currentAuthUser || !currentAuthUser.userId) return;
        Object.assign(profileForm, {
          name: currentAuthUser.name || '',
          phone: currentAuthUser.phone || '',
          dept: currentAuthUser.dept || '',
          email: currentAuthUser.email || '',
          profileAttachId: currentAuthUser.profileAttachId || null,
        });
        _loadProfileImg(profileForm.profileAttachId);
        uiState.profileModalShow = true;
        uiState.userMenuShow = false;
      };

      /* saveProfile */
      const saveProfile = () => {
        if (!profileForm.name) {
          showToast('이름을 입력하세요.', 'error');
          return;
        }
        if (!currentAuthUser) Object.assign(currentAuthUser, _defaultBoAuthUser());
        currentAuthUser.name = profileForm.name || '';
        currentAuthUser.phone = profileForm.phone || '';
        currentAuthUser.dept = profileForm.dept || '';
        currentAuthUser.profileAttachId = profileForm.profileAttachId || null;
        uiState.profileModalShow = false;
        showToast('프로필이 저장되었습니다.');
      };

      /* onProfileImgChange */
      const onProfileImgChange = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        profileImgUploading.value = true;
        try {
          if (profileImg.attachId) {
            await window.coApiSvc.cmAttach.deleteFile(profileImg.attachId);
            profileImg.attachId = null;
            profileImg.cdnImgUrl = '';
          }
          const fd = new FormData();
          fd.append('files', f);
          fd.append('businessCode', 'USER_PROFILE');
          fd.append('grpNm', '사용자 프로필');
          if (profileForm.profileAttachId) fd.append('attachGrpId', profileForm.profileAttachId);
          const res = await window.boApi.post('co/cm/upload/multi', fd, window.coUtil.cofApiHdr('프로필', '사진변경'));
          const d = res.data?.data;
          const uploaded = (d?.files || [])[0];
          if (uploaded) {
            profileImg.attachId = uploaded.attachId;
            profileImg.cdnImgUrl = uploaded.cdnImgUrl || '';
          }
          if (!profileForm.profileAttachId && d?.attachGrpId) profileForm.profileAttachId = d.attachGrpId;
          showToast('사진이 변경되었습니다.', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || '업로드 중 오류가 발생했습니다.', 'error');
        } finally {
          profileImgUploading.value = false;
        }
      };

      /* onProfileImgRemove */
      const onProfileImgRemove = async () => {
        if (!profileImg.attachId) {
          profileForm.profileAttachId = null;
          profileImg.cdnImgUrl = '';
          return;
        }
        try {
          await window.coApiSvc.cmAttach.deleteFile(profileImg.attachId);
          profileImg.attachId = null;
          profileImg.cdnImgUrl = '';
          profileForm.profileAttachId = null;
          showToast('사진이 삭제되었습니다.', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || '삭제 오류', 'error', 0);
        }
      };

      /* 비밀번호 변경 모달 */
      const pwForm = reactive({ current: '', next: '', confirm: '' });
      const pwError = ref('');

      /* openPwChange */
      const openPwChange = () => {
        Object.assign(pwForm, { current: '', next: '', confirm: '' });
        pwError.value = '';
        uiState.pwModalShow = true;
        uiState.userMenuShow = false;
      };

      /* savePwChange */
      const savePwChange = async () => {
        pwError.value = '';
        if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
          pwError.value = '모든 항목을 입력하세요.';
          return;
        }
        if (pwForm.next.length < 6) {
          pwError.value = '새 비밀번호는 6자 이상이어야 합니다.';
          return;
        }
        if (pwForm.next !== pwForm.confirm) {
          pwError.value = '새 비밀번호가 일치하지 않습니다.';
          return;
        }
        try {
          const currentPwdHash = await coUtil.cofSha256(pwForm.current);
          const newPwdHash = await coUtil.cofSha256(pwForm.next);
          await coApiSvc.boAuth.changePassword(
            { currentPassword: currentPwdHash, newPassword: newPwdHash },
            '비밀번호변경',
            '변경',
          );
          uiState.pwModalShow = false;
          showToast('비밀번호가 변경되었습니다.');
        } catch (e) {
          pwError.value = e.response?.data?.message || '비밀번호 변경 실패';
        }
      };

      /* openLogin */
      const openLogin = (tab = 'login', mode = 'modal') => {
        loginModal.tab = tab;
        loginModal.mode = mode;
        loginModal.show = true;
        loginError.value = '';
      };

      /* onLogoClick — 로고(ShopJoy) 클릭. 로그인 상태면 대시보드, 비로그인이면 전용 로그인 화면(page) */
      const onLogoClick = () => {
        if (cfIsLoggedIn.value) navigate('dashboard');
        else openLogin('login', 'page');
      };

      /* closeLogin */
      const closeLogin = () => {
        loginModal.show = false;
        loginModal.mode = 'modal'; // page 모드 해제 — 안 풀면 cfIsPage 가 true 라 :show 가 항상 표시되어 안 닫힘
        loginError.value = '';
      };

      /* doLogin */
      const doLogin = async () => {
        loginError.value = '';
        if (!loginForm.loginId || !loginForm.loginPwd) {
          loginError.value = '아이디와 비밀번호를 입력하세요.';
          return;
        }
        try {
          if (!_boAuthStore) {
            loginError.value = '스토어 초기화 실패';
            return;
          }

          await _boAuthStore.saLogin(loginForm.loginId, loginForm.loginPwd, loginForm.authMethod);
          _syncCurrentAuthUser();

          openTabs.splice(0);
          loginForm.loginId = '';
          loginForm.loginPwd = '';
          closeLogin();
          navigate('dashboard');
          fnLoadSysDashMenus();  /* 대시보드 좌측메뉴 로드 (공용) */
          fnLoadUserDashMenus(); /* 사용자 대시보드 좌측메뉴 로드 */
          showToast(`${currentAuthUser?.authNm || currentAuthUser?.name || '사용자'}님 환영합니다.`);
        } catch (err) {
          console.error('[catch-info]', err);
          loginError.value = err?.response?.data?.message || err?.message || '로그인 실패';
        }
      };

      /* doSocial — 소셜 로그인 (co 통합: coAuth.socialLogin('bo', provider)).
       * 개발용 onDebug 로 SDK 창 URL·파라미터를 toast 표시. 프로토타입: 데모 세션. */
      const doSocial = async (provider) => {
        loginError.value = '';
        try {
          if (!window.coAuth) {
            loginError.value = 'coAuth 모듈이 로드되지 않았습니다.';
            return;
          }
          const res = await window.coAuth.socialLogin('bo', provider, {
            onDebug: (label, info) => showToast('[개발] ' + label + '\n' + window.coExtSdk._fmtParams(info), 'info', 0),
          });
          if (!res?.ok) {
            loginError.value = res?.msg || (provider + ' 로그인 실패');
            showToast(loginError.value, 'error', 0);
            return;
          }
          _syncCurrentAuthUser();
          openTabs.splice(0);
          closeLogin();
          navigate('dashboard');
          showToast(`${currentAuthUser?.authNm || currentAuthUser?.name || '사용자'}님 환영합니다.`);
        } catch (err) {
          console.error('[doSocial]', err);
          loginError.value = err?.message || (provider + ' 로그인 실패');
          /* 실패 토스트에 [설정 방법 보기] 버튼 부착 (사용자 취소면 action=null → 일반 토스트) */
          const action = window.coExtHelp && window.coExtHelp.toastAction({ kind: 'social', provider, error: err });
          showToast(loginError.value, 'error', 0, '', action);
        }
      };

      /* doExpireToken — [개발용] accessToken 강제 만료 → 401 → refreshToken 으로 자동 재갱신 테스트.
       * refreshToken 은 그대로 두고 accessToken 만 손상시켜, 다음 보호 API 호출 시
       * boApiAxios 인터셉터가 401 → token-refresh → 원요청 재시도 흐름을 타게 한다.
       * 손상 후 곧바로 보호 API(member/page)를 호출해 즉시 갱신을 트리거(우측 API 로그에서 확인). */
      const doExpireToken = async () => {
        uiState.userMenuShow = false;
        try {
          const cur = localStorage.getItem('modu-bo-auth-accessToken') || '';
          if (!cur) { showToast('accessToken 이 없습니다. (로그인 후 시도)', 'error'); return; }
          /* 서버가 거부하도록 토큰을 손상 (서명 깨짐 → 401). refreshToken 은 보존 */
          const broken = cur + '__EXPIRED__';
          localStorage.setItem('modu-bo-auth-accessToken', broken);
          const authStore = window.useBoAuthStore?.();
          if (authStore) authStore.svAccessToken = broken;
          showToast('🔄 accessToken 을 강제 만료했습니다. 다음 API에서 자동 재갱신을 시도합니다.', 'info');
          /* 즉시 보호 API 호출 → 401 → refresh → 재시도 (성공 시 새 토큰으로 교체됨) */
          try {
            await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 1 }, '토큰테스트', '강제만료');
            /* 인터셉터가 localStorage 의 accessToken 을 새 값으로 교체함 → store 도 동기화 */
            const newTok = localStorage.getItem('modu-bo-auth-accessToken') || '';
            if (authStore && newTok && newTok !== broken) authStore.svAccessToken = newTok;
            showToast('✅ 토큰 자동 재갱신 성공 (refresh 흐름 정상). 화면 유지됨.', 'success');
          } catch (apiErr) {
            showToast('⚠️ 재갱신 실패 — refreshToken 만료/재사용 등으로 재인증 필요할 수 있습니다.', 'error', 0);
          }
        } catch (e) {
          console.error('[doExpireToken] error:', e);
          showToast('토큰 강제 만료 처리 중 오류: ' + (e?.message || ''), 'error', 0);
        }
      };

      /* doLogout */
      const doLogout = async () => {
        try {
          const authStore = window.useBoAuthStore?.();
          if (authStore) {
            await authStore.saLogout();
          }
          /* boConfigStore 는 사이트 식별정보(svSiteNo/svSiteId)만 갖는다.
             사이트는 브라우저 단위 설정이라 로그아웃으로 지우지 않는다. */

          uiState.userMenuShow = false;
          openTabs.splice(0);
          _syncCurrentAuthUser();
          page.value = 'dashboard';                  // 루트로 이동 (본문은 cfIsLoggedIn=false 라 미렌더)
          openLogin('login', 'page');                // 전용 로그인 화면 표시
          showToast('로그아웃되었습니다.');
        } catch (e) {
          console.error('doLogout error:', e);
          uiState.userMenuShow = false;
        }
      };
      /* 다른 탭 로그인/로그아웃/계정변경 동기화.
       * 사용자(authId)가 바뀌면(다른 계정 로그인 또는 로그아웃) 이 탭의 메모리에 이전 사용자
       * 데이터가 남아있으므로 reload 하여 새 사용자 기준으로 완전히 다시 로드한다. */
      window.addEventListener('storage', (e) => {
        if (e.key === 'modu-bo-auth-accessToken' || e.key === 'modu-bo-auth-authUser') {
          const prevAuthId = currentAuthUser?.authId || '';
          _boAuthStore?.saSyncFromStorage?.();
          _syncCurrentAuthUser();
          const nextAuthId = currentAuthUser?.authId || '';
          /* 사용자가 실제로 바뀐 경우에만 reload (같은 사용자 토큰 갱신 등은 동기화로 충분) */
          if (prevAuthId !== nextAuthId) {
            /* BO 는 dashboard 외 전 페이지가 인증 필수 → 로그아웃/계정변경 시 dashboard 로 해시 변경 후 reload.
             * (이전 사용자의 작업 페이지에 남지 않도록 — FO 의 home 전환과 동일 취지) */
            const curPage = (new URLSearchParams((location.hash || '').replace(/^#/, ''))).get('page') || '';
            if (curPage && curPage !== 'dashboard') {
              location.hash = '#page=dashboard';
            }
            location.reload();
          }
        }
      });
      /* 같은 탭 DevTools 변경 감지 — FO의 syncFromStorage + _sync() 패턴 동일 적용 (가드: 중복 setInterval 방지).
       * (사용자 변경 시 reload 는 storage 이벤트 핸들러에서만 처리 — 같은 탭의 로그인/로그아웃은
       *  doLogin/doLogout 정상 흐름으로 처리되므로 여기서는 동기화만 한다.) */
      if (!window._boAuthSyncTimer) {
        window._boAuthSyncTimer = setInterval(() => {
          _boAuthStore?.saSyncFromStorage?.();
          _syncCurrentAuthUser();
        }, 3000);
      }

      /* doRegister */
      const doRegister = async () => {
        loginError.value = '';
        if (!regForm.name || !regForm.email || !regForm.password) {
          loginError.value = '필수 항목을 입력하세요.';
          return;
        }
        if (regForm.password !== regForm.confirmPw) {
          loginError.value = '비밀번호가 일치하지 않습니다.';
          return;
        }
        try {
          await boApiSvc.syUser.create(
            {
              name: regForm.name,
              email: regForm.email,
              password: regForm.password,
              phone: regForm.phone,
              role: regForm.role,
            },
            '사용자등록',
            '저장',
          );
          Object.assign(regForm, { name: '', email: '', password: '', confirmPw: '', phone: '', role: '운영자' });
          loginModal.tab = 'login';
          loginError.value = '';
          showToast('가입이 완료되었습니다. 로그인해주세요.');
        } catch (err) {
          console.error('[catch-info]', err);
          loginError.value = err.response?.data?.message || err.message || '가입 실패';
        }
      };

      /* ── 연관사이트 레이어 ── */
      const toggleRelatedSite = () => {
        uiState.relatedSiteOpen = !uiState.relatedSiteOpen;
      };

      /* openRelatedLink */
      const openRelatedLink = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        uiState.relatedSiteOpen = false;
      };

      /* goFoSite */
      const goFoSite = (no) => {
        try {
          localStorage.setItem('modu-fo-sy-siteNo', no);
        } catch (_) {}
        window.open('index.html?SITE_NO=' + no, '_blank');
        uiState.relatedSiteOpen = false;
      };

      /* goBoSite */
      const goBoSite = (no) => {
        try {
          localStorage.setItem('modu-bo-sy-siteNo', no);
        } catch (_) {}
        window.open('bo.html?SITE_NO=' + no, '_blank');
        uiState.relatedSiteOpen = false;
      };
      const currentFoSiteNo = (typeof localStorage !== 'undefined' && localStorage.getItem('modu-fo-sy-siteNo')) || '01';
      const currentBoSiteNo = window.BO_SITE_NO || '01';
      const _boAppStore = window.useBoAppStore?.();
      const cfBoActive = computed(() => _boAppStore?.svActive || '-');
      const SITE_PAIR_MENU = [
        { fo: '01', bo: '01' },
        { fo: '02', bo: '02' },
        { fo: '03', bo: '03' },
        { fo: '9999', bo: '9999' },
      ];
      const DISP_LINKS = [
        { label: '통합 페이지', hash: '#page=dispUiPage', icon: '🌐' },
        { label: 'UI 샘플 01', hash: '#page=dispUi01', icon: '1️⃣' },
        { label: 'UI 샘플 02', hash: '#page=dispUi02', icon: '2️⃣' },
        { label: 'UI 샘플 03', hash: '#page=dispUi03', icon: '3️⃣' },
        { label: 'UI 샘플 04', hash: '#page=dispUi04', icon: '4️⃣' },
        { label: 'UI 샘플 05', hash: '#page=dispUi05', icon: '5️⃣' },
        { label: 'UI 샘플 06', hash: '#page=dispUi06', icon: '6️⃣' },
      ];

      /* ── 즐겨찾기 ── */
      const favorites = reactive([]);
      const favKeepSet = reactive(new Set()); // 즐겨찾기별 keep 설정
      const sidebarTab = ref('open');

      /* isFav */
      const isFav = (pgId) => favorites.includes(pgId);

      /* toggleFav */
      const toggleFav = (pgId) => {
        const idx = favorites.indexOf(pgId);
        if (idx === -1) favorites.push(pgId);
        else {
          favorites.splice(idx, 1);
          favKeepSet.delete(pgId);
        }
      };

      /* toggleFavKeep */
      const toggleFavKeep = (pgId) => {
        if (favKeepSet.has(pgId)) favKeepSet.delete(pgId);
        else favKeepSet.add(pgId);
        // 현재 열려있는 탭이면 keptTabIds에도 즉시 반영
        if (openTabs.find((t) => t.id === pgId)) {
          if (favKeepSet.has(pgId)) keptTabIds.add(pgId);
          else keptTabIds.delete(pgId);
        }
      };
      const cfFavList = computed(() =>
        favorites.map((pgId) => {
          const topId = PAGE_TO_TOP[pgId];
          const topLabel = TOP_MENUS.find((t) => t.id === topId)?.label || '';
          return { id: pgId, label: PAGE_LABELS[pgId] || pgId, topLabel };
        }),
      );

      /* ── 사용자 대시보드 메뉴 (동적) ──────────────────────────────
       * 내가 만든 대시보드 + 나에게 공유된 대시보드를 좌측메뉴 '사용자 대시보드' 그룹 아래에 표시.
       * 클릭 시 cmDashboardMyMng 로 이동하면서 dtlId 에 대시보드ID 전달. */
      /* ── 좌측 '대시보드' 그룹 (공용) ─────────────────────────
         cm_dashboard_menu(SYS) 트리를 그대로 그린다. 트리가 비어 있으면(=한 번도 설정 안 함)
         HOME_FALLBACK_DASH 로 폴백해 기존과 똑같이 보인다.
         ITEM 노드는 uiComponent 로 열 페이지를 정한다 — 전용 화면이 있으면 그리로,
         없으면 대시보드 뷰어(cmDashboardMyMng)로 캔버스를 그린다. */
      const sysDashMenus = reactive([]);  /* [{ pageId?, dashboardId?, label, folder?, depth }] */
      const fnSysDashPageId = (uiComponent) => {
        if (uiComponent === 'DashboardBoAppMonitor') return 'appMonitorDashboard';
        /* EC대시보드는 사이트별 변형(Ec01/02/03) 이 pageId 하나로 묶여 있다 */
        if (uiComponent === 'DashboardBoEc' + (window.BO_SITE_NO || '01')) return 'dashboard';
        return null;
      };
      const fnLoadSysDashMenus = async () => {
        try {
          if (!localStorage.getItem('modu-bo-auth-accessToken')) return;
          const siteId = window.boCommonFilter?.siteId || '';
          const [dres, tres] = await Promise.all([
            boApiSvc.cmDashboard.getList(
              { siteId, scope: 'accessible' }, '대시보드메뉴', '메뉴조회'),
            boApiSvc.cmDashboard.getMenuTree(
              { siteId, scope: 'SYS' }, '대시보드메뉴', '메뉴트리조회'),
          ]);
          const dashMap = {};
          (dres.data?.data || [])
            /* 공용 = 개인화가 아닌 것. CmDashboardMng.fnIsMyDash 과 같은 판정 */
            .filter((d) => !d.ownerUserId && (d.uiCompNm || '').indexOf('MY:') !== 0)
            .forEach((d) => { dashMap[d.dashboardId] = d; });
          const nodes = tres.data?.data || [];
          if (!nodes.length) { sysDashMenus.splice(0, sysDashMenus.length); return; }
          const byParent = {};
          nodes.forEach((x) => { const p = x.parentNodeId || ''; (byParent[p] = byParent[p] || []).push(x); });
          const flat = [];
          const walk = (pid, depth) => (byParent[pid] || []).forEach((x) => {
            if (x.nodeTypeCd === 'FOLDER') {
              flat.push({ key: 'F:' + x.menuNodeId, label: x.nodeNm || '폴더', folder: true, depth });
            } else {
              const d = dashMap[x.dashboardId];
              if (d) flat.push({ key: x.menuNodeId, label: d.dashboardNm, depth,
                                 pageId: fnSysDashPageId(d.uiCompNm), dashboardId: d.dashboardId });
            }
            walk(x.menuNodeId, depth + 1);
          });
          walk('', 0);
          sysDashMenus.splice(0, sysDashMenus.length, ...flat);
        } catch (e) {
          console.warn('[대시보드 메뉴 조회 오류]', e);
        }
      };
      window.addEventListener('sys-dashboard-changed', fnLoadSysDashMenus);

      const userDashMenus = reactive([]); /* [{ dashboardId, dashboardNm, mine }] */
      const fnLoadUserDashMenus = async () => {
        try {
          if (!localStorage.getItem('modu-bo-auth-accessToken')) return;
          const siteId = window.boCommonFilter?.siteId || '';
          const res = await boApiSvc.cmDashboard.getList(
            { siteId, scope: 'accessible' }, '사용자대시보드', '메뉴조회');
          const authStore = window.sfGetBoAuthStore ? window.sfGetBoAuthStore() : null;
          const myId = authStore?.svAuthUser?.authId || '';
          const list = (res.data?.data || [])
            .filter((d) => d.ownerUserId)                  /* 개인 대시보드만 */
            .map((d) => ({ dashboardId: d.dashboardId, dashboardNm: d.dashboardNm,
                           sortOrd: d.sortOrd == null ? 9999 : d.sortOrd,
                           mine: d.ownerUserId === myId }));
          /* 내 것 먼저 → 정렬설정 순서 → 이름 */
          list.sort((a, b) => (b.mine - a.mine) || (a.sortOrd - b.sortOrd)
            || a.dashboardNm.localeCompare(b.dashboardNm, 'ko'));
          /* 부모 바로 아래에 자식이 오도록 평면화 + depth 부여 (정렬설정의 트리를 그대로 반영) */
          const ids = new Set(list.map((d) => d.dashboardId));
          const flat = [];
          list.forEach((d) => {
            if (d.parentId && ids.has(d.parentId)) return;   /* 자식은 부모 뒤에서 붙인다 */
            flat.push(Object.assign({ depth: 0 }, d));
            list.filter((c) => c.parentId === d.dashboardId)
              .forEach((c) => flat.push(Object.assign({ depth: 1 }, c)));
          });
          list.splice(0, list.length, ...flat);
          /* 저장된 좌측메뉴 트리가 있으면 그 구성을 따른다. 없으면 위 평면 목록으로 폴백 */
          try {
            const tres = await boApiSvc.cmDashboard.getMenuTree({ siteId }, '사용자대시보드', '메뉴트리조회');
            const nodes = tres.data?.data || [];
            if (nodes.length) {
              const dashMap = {};
              list.forEach((d) => { dashMap[d.dashboardId] = d; });
              const byParent = {};
              nodes.forEach((x) => { const p = x.parentNodeId || ''; (byParent[p] = byParent[p] || []).push(x); });
              const flat = [];
              const walk = (pid, depth) => (byParent[pid] || []).forEach((x) => {
                if (x.nodeTypeCd === 'FOLDER') {
                  flat.push({ dashboardId: 'F:' + x.menuNodeId, dashboardNm: x.nodeNm || '폴더',
                              folder: true, depth, mine: true });
                } else {
                  const d = dashMap[x.dashboardId];
                  if (d) flat.push(Object.assign({}, d, { depth }));
                }
                walk(x.menuNodeId, depth + 1);
              });
              walk('', 0);
              userDashMenus.splice(0, userDashMenus.length, ...flat);
              return;
            }
          } catch (e) { console.warn('[메뉴트리 조회 오류]', e); }
          userDashMenus.splice(0, userDashMenus.length, ...list);
        } catch (e) {
          console.warn('[사용자 대시보드 메뉴 조회 오류]', e);
        }
      };
      /* 개인화 화면에서 대시보드 추가/삭제/이름변경 시 메뉴 갱신 신호 */
      window.addEventListener('user-dashboard-changed', fnLoadUserDashMenus);

      /* 루트 클릭 → 컨텍스트 메뉴·유저메뉴 닫기 */
      const onRootClick = () => {
        closeCtxMenu();
        uiState.userMenuShow = false;
        boSettingShow.value = false;
        hoveredTop.value = null;
        uiState.sitemapShow = false;
        uiState.favPanelShow = false;
      };

      return {
        isApiLoading,
        apiProgressLabel,
        page,
        dtlId,
        initSearchValue,
        navigate,
        errorMessage,
        cfDashboardComp,
        TOP_MENUS,
        LEFT_MENUS,
        LEFT_MENUS_TAIL,
        sysDashMenus, HOME_FALLBACK_DASH, fnLoadSysDashMenus,
        userDashMenus,
        AUTH_METHODS,
        openTabs,
        closeTab,
        cfActiveTabId,
        toPageFromTabId,
        refreshKeys,
        keptTabIds,
        toggleKeep,
        PAGE_COMP_MAP,
        ctxMenu,
        showCtxMenu,
        closeCtxMenu,
        ctxClose,
        ctxCloseLeft,
        ctxCloseRight,
        ctxCloseOthers,
        ctxCloseAll,
        ctxNewWindow,
        ctxRefresh,
        openNewWindow,
        cfOpenTabsWithGroup,
        activeTop,
        leftMenuOpen,
        tabBarOpen,
        cfEmbed,
        setTopMenu,
        hoveredTop,
        onTopMenuEnter,
        onTopMenuLeave,
        onDropdownEnter,
        toasts,
        showToast,
        onToastAction,
        closeToast,
        closeAllToasts,
        toastShowDetail,
        toggleToastDetail,
        confirmState,
        showConfirm,
        closeConfirm,
        refModal,
        showRefModal,
        closeRefModal,
        helpModal,
        showHelp,
        rightPanelOpen,
        commonFilter,
        selectModal,
        openSelectModal,
        closeSelectModal,
        onSelectItem,
        clearFilter,
        filterSite,
        filterVendor,
        cfFilterDlivVendor,
        cfFilterBoUser,
        filterMember,
        filterOrder,
        apiLogs,
        apiLogHoverDetail,
        apiLogLockedDetail,
        clearApiLogs,
        toggleApiLogLock,
        onApiLogEnter,
        onApiLogLeave,
        onApiLogDetailEnter,
        onApiLogDetailLeave,
        getApiStatusColor,
        formatJsonData,
        isWithin60Seconds,
        getRelativeTime,
        fnFmtSec,
        fnHmsToMs,
        fnShortUrl,
        tabBarRef,
        scrollTabs,
        boInitReady,
        cfIsLoggedIn,
        currentAuthUser,
        currentAuthUserRoles,
        activeRoleId,
        rolePath,
        onRoleChange,
        rolesOfUser,
        loginModal,
        loginForm,
        regForm,
        loginError,
        uiState,
        userRoles,
        openLogin,
        onLogoClick,
        closeLogin,
        doLogin,
        doSocial,
        doLogout,
        doExpireToken,
        doRegister,
        QUICK_USERS,
        quickLogin,
        userPickModal,
        openUserPick,
        onUserPick,
        cfPickRows,
        cfPickTotal,
        cfPickTotalPage,
        onUserPickSearch,
        onUserPickPage,
        profileForm,
        profileImg,
        profileImgUploading,
        openProfile,
        saveProfile,
        onProfileImgChange,
        onProfileImgRemove,
        pwForm,
        pwError,
        openPwChange,
        savePwChange,
        favorites,
        favKeepSet,
        sidebarTab,
        isFav,
        toggleFav,
        cfFavList,
        toggleFavKeep,
        apiResPanel,
        setApiRes,
        closeApiResPanel,
        boSettingShow, apiToastEnabled, onToggleApiToast, onToggleBoSetting,
        onRootClick,
        toggleRelatedSite,
        openRelatedLink,
        goFoSite,
        goBoSite,
        currentFoSiteNo,
        currentBoSiteNo,
        cfBoActive,
        SITE_PAIR_MENU,
        DISP_LINKS,
        safe: window.safeUtil,
      };
    },

    template: /* html */ `
<div @click="onRootClick">
  <!-- ① TOP NAV -->
  <nav class="bo-top-nav" v-if="!cfEmbed">
    <button class="sidebar-toggle-btn" @click.stop="leftMenuOpen=!leftMenuOpen" :title="leftMenuOpen ? '사이드바 접기' : '사이드바 펼치기'">{{ leftMenuOpen ? '‹' : '›' }}</button>
    <button class="sidebar-toggle-btn tab-bar-toggle-btn" @click.stop="tabBarOpen=!tabBarOpen" :title="tabBarOpen ? '탭바 접기' : '탭바 펼치기'">{{ tabBarOpen ? '▲' : '▼' }}</button>
    <span class="brand" @click="onLogoClick" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
      ShopJoy
      <span class="fo-site-badge"
        :title="'FO_SITE_NO=' + (currentFoSiteNo || '-') + ' BO_SITE_NO=' + (currentBoSiteNo || '-') + ' — 클릭: 연관사이트'"
        :data-tip="'FO_SITE_NO=' + (currentFoSiteNo || '-') + ' BO_SITE_NO=' + (currentBoSiteNo || '-')"
        style="display:inline-flex;gap:4px;font-family:monospace;font-size:11px;cursor:pointer;"
        @click.stop="toggleRelatedSite">
        <span :style="{fontWeight:800,color: currentFoSiteNo==='03'?'#7b1fa2':currentFoSiteNo==='02'?'#2e7d6b':currentFoSiteNo==='9999'?'#bbb':'#ff8aa5'}">{{ currentFoSiteNo || '-' }}</span>
        <span :style="{fontWeight:800,color: currentBoSiteNo==='03'?'#7b1fa2':currentBoSiteNo==='02'?'#2e7d6b':currentBoSiteNo==='9999'?'#bbb':'#ff8aa5'}">{{ currentBoSiteNo || '-' }}</span>
      </span>
      <span
        :title="'active=' + cfBoActive"
        :style="{
        fontFamily:'monospace', fontSize:'10px', fontWeight:700, padding:'1px 6px',
        borderRadius:'4px', border:'1px solid',
        color: cfBoActive==='prod'?'#fff':cfBoActive==='dev'?'#1565c0':cfBoActive==='local'?'#7a5800':'#555',
        background: cfBoActive==='prod'?'#e53935':cfBoActive==='dev'?'#e3f0fb':cfBoActive==='local'?'#fff59d':'#f0f0f0',
        borderColor: cfBoActive==='prod'?'#c62828':cfBoActive==='dev'?'#90caf9':cfBoActive==='local'?'#f9a825':'#ccc',
        }">{{ cfBoActive }}</span>
    </span>
    <div class="top-nav-menus"
      @mouseleave="onTopMenuLeave">
      <span v-for="tm in TOP_MENUS" :key="tm.id"
        class="top-nav-item" :class="{active: activeTop===tm.id}"
        @click="setTopMenu(tm.id)"
        @mouseenter="onTopMenuEnter(tm.id)">{{ tm.label }}</span>
    </div>

    <!-- 설정(개발) 드롭다운 -->
    <div style="position:relative;flex-shrink:0;" @click.stop>
      <button @click="onToggleBoSetting" title="설정"
        style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:14px;transition:all .15s;"
        :style="boSettingShow ? 'background:rgba(232,88,122,0.18);border:1px solid rgba(232,88,122,0.45);color:#e8587a;' : 'background:rgba(232,88,122,0.08);border:1px solid rgba(232,88,122,0.25);color:#e8587a;'">⚙</button>
      <div v-if="boSettingShow"
        style="position:absolute;right:0;top:calc(100% + 8px);width:190px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.14);z-index:9000;overflow:hidden;padding:4px 0;">
        <button @click="onToggleApiToast"
          style="width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;text-align:left;font-size:13px;display:flex;align-items:center;gap:8px;color:#374151;transition:background .15s;"
          :style="apiToastEnabled ? 'background:rgba(232,88,122,0.08);color:#e8587a;font-weight:700;' : ''"
          @mouseenter="$event.currentTarget.style.background='#f5f5f5'"
          @mouseleave="$event.currentTarget.style.background=apiToastEnabled?'rgba(232,88,122,0.08)':'transparent'">
          <span style="font-size:13px;">🔔</span>
          <span>API 토스트 출력</span>
          <span style="margin-left:auto;font-size:10px;border-radius:8px;padding:1px 6px;font-weight:700;" :style="apiToastEnabled?'background:#e8587a;color:#fff;':'background:#e8e8e8;color:#888;'">{{ apiToastEnabled ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
    </div>

    <!-- 사이트맵 버튼 -->
    <button @click.stop="uiState.sitemapShow=!uiState.sitemapShow; uiState.favPanelShow=false; hoveredTop=null"
      title="사이트맵" class="nav-tool-btn" :class="{active: uiState.sitemapShow}">
      🗺 사이트맵
    </button>

    <!-- 즐겨찾기 버튼 -->
    <button @click.stop="uiState.favPanelShow=!uiState.favPanelShow; uiState.sitemapShow=false; hoveredTop=null"
      title="즐겨찾기" class="nav-tool-btn" :class="{active: uiState.favPanelShow}" style="position:relative;">
      ★
      <span v-if="cfFavList.length" class="nav-fav-count">{{ cfFavList.length }}</span>
    </button>

    <!-- 도움말 버튼 -->
    <button @click.stop="showHelp()"
      title="도움말"
      style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;font-size:11px;font-weight:600;color:#e8587a;background:rgba(232,88,122,0.08);border:1px solid rgba(232,88,122,0.25);border-radius:6px;cursor:pointer;transition:all .15s;flex-shrink:0;"
      @mouseenter="$event.target.style.background='rgba(232,88,122,0.18)'"
      @mouseleave="$event.target.style.background='rgba(232,88,122,0.08)'">
      <span style="font-size:13px;">❓</span> 도움말
    </button>

    <!-- 로그인/유저 영역 -->
    <div class="top-nav-user" @click.stop>
      <template v-if="cfIsLoggedIn">
        <select v-if="currentAuthUserRoles.length > 1" class="user-role-select" v-model="activeRoleId" @change="onRoleChange"
          :title="'역할 ' + currentAuthUserRoles.length + '개 보유'"
          style="margin-right:4px;padding:3px 6px;font-size:11px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;max-width:480px;min-width:320px;">
          <option v-for="r in currentAuthUserRoles" :key="r.roleId" :value="r.roleId">{{ rolePath(r) }}</option>
        </select>
        <span v-if="currentAuthUserRoles.length >= 2"
          :title="'역할 ' + currentAuthUserRoles.length + '개 보유'"
          style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-right:8px;font-size:10px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff6b9d,#c44569);border-radius:9px;">{{ currentAuthUserRoles.length }}</span>
        <span v-else-if="currentAuthUserRoles.length === 1" class="user-role-label"
          style="margin-right:8px;font-size:11px;color:#cdb4ff;font-weight:500;">{{ rolePath(currentAuthUserRoles[0]) }}</span>
        <span class="user-name-label">{{ currentAuthUser?.authNm || currentAuthUser?.name || '' }}</span>
        <button class="user-avatar-btn" @click="uiState.userMenuShow=!uiState.userMenuShow" :title="currentAuthUser?.email || ''">
          {{ ((currentAuthUser?.authNm || currentAuthUser?.name || '').charAt(0)) || '?' }}
        </button>
        <div v-if="uiState.userMenuShow" class="user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">{{ currentAuthUser?.authNm || currentAuthUser?.name || '' }}</div>
            <div class="user-dropdown-role">{{ currentAuthUser?.role || '' }}</div>
            <div class="user-dropdown-email">{{ currentAuthUser?.email || '' }}</div>
          </div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item" @click="openProfile">🙍 프로필</div>
          <div class="user-dropdown-item" @click="openPwChange">🔑 비밀번호 변경</div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item danger" @click="doLogout">↩ 로그아웃</div>
          <div class="user-dropdown-sep"></div>
          <div class="user-dropdown-item" @click="doExpireToken" title="accessToken을 강제 만료시켜 refresh 자동 재갱신 흐름을 테스트합니다 (개발용)">🔄 토큰 강제만료 (refresh 테스트)</div>
        </div>
      </template>
      <template v-else>
        <button class="login-btn" @click="openLogin('login')">🔐 로그인</button>
      </template>
    </div>
    <!-- 공통필터 토글 — nav 최우측 끝, 패딩 없이 밀착 -->
    <button class="right-panel-nav-btn" @click="rightPanelOpen=!rightPanelOpen"
      :title="rightPanelOpen ? '공통필터 접기' : '공통필터 펼치기'">
      {{ rightPanelOpen ? '›' : '‹' }}
    </button>
  </nav>

  <!-- 대메뉴 hover 드롭다운 (전체 사이트맵) -->
  <div v-if="!cfEmbed && hoveredTop"
    class="top-nav-mega-dd"
    @mouseenter="onDropdownEnter"
    @mouseleave="onTopMenuLeave"
    @click.stop>
    <div v-for="tm in TOP_MENUS.filter(t => t.id !== 'home')" :key="tm.id"
      class="mega-dd-col" :class="{highlighted: hoveredTop===tm.id}">
      <div class="mega-dd-top-lbl" @click="setTopMenu(tm.id)">{{ tm.label }}</div>
      <template v-for="item in (LEFT_MENUS[tm.id] || [])" :key="item.group || item.id">
        <div v-if="item.group" class="mega-dd-group">{{ item.group }}</div>
        <div v-else class="mega-dd-item"
          @click="navigate(item.id); hoveredTop=null">{{ item.label }}</div>
      </template>
    </div>
  </div>

  <!-- 사이트맵 패널 -->
  <div v-if="!cfEmbed && uiState.sitemapShow" class="nav-sitemap-panel" @click.stop>
    <div class="nav-panel-hd">
      <span class="nav-panel-hd-title">🗺 사이트맵</span>
      <button class="nav-panel-close" @click="uiState.sitemapShow=false">✕</button>
    </div>
    <div class="sitemap-body">
      <div v-for="tm in TOP_MENUS.filter(t => t.id !== 'home')" :key="tm.id" class="sitemap-col">
        <div class="sitemap-top-lbl" @click="setTopMenu(tm.id); uiState.sitemapShow=false">{{ tm.label }}</div>
        <template v-for="item in (LEFT_MENUS[tm.id] || [])" :key="item.group || item.id">
          <div v-if="item.group" class="sitemap-grp">{{ item.group }}</div>
          <div v-else class="sitemap-lnk" @click="navigate(item.id); uiState.sitemapShow=false">{{ item.label }}</div>
        </template>
      </div>
    </div>
  </div>

  <!-- 즐겨찾기 패널 -->
  <div v-if="!cfEmbed && uiState.favPanelShow" class="nav-fav-panel" @click.stop>
    <div class="nav-panel-hd">
      <span class="nav-panel-hd-title">★ 즐겨찾기 <span v-if="cfFavList.length" style="font-size:11px;font-weight:400;opacity:.7;">({{ cfFavList.length }})</span></span>
      <button class="nav-panel-close" @click="uiState.favPanelShow=false">✕</button>
    </div>
    <div class="nav-fav-body">
      <div v-if="cfFavList.length===0" class="nav-fav-empty">즐겨찾기가 없습니다.<br>좌측 메뉴의 ★ 를 클릭해 추가하세요.</div>
      <div v-for="fav in cfFavList" :key="fav.id" class="nav-fav-item"
        @click="navigate(fav.id); uiState.favPanelShow=false">
        <span class="nav-fav-top">{{ fav.topLabel }}</span>
        <span class="nav-fav-sep">›</span>
        <span class="nav-fav-lbl">{{ fav.label }}</span>
        <button class="nav-fav-del" @click.stop="toggleFav(fav.id)" title="삭제">✕</button>
      </div>
    </div>
  </div>

  <!-- ③ BODY -->
  <div class="bo-body" :style="cfEmbed ? 'min-height:100vh;' : ''">

    <!-- Left Sidebar -->
    <nav class="bo-left-nav" v-if="!cfEmbed" :class="{closed: !leftMenuOpen}">
      <div class="left-nav-top">
        <div class="left-nav-group-title">{{ TOP_MENUS.find(t=>t.id===activeTop)?.label }}</div>
        <template v-for="item in (LEFT_MENUS[activeTop] || [])" :key="item?.group || item?.id">
          <div v-if="item.group" class="left-nav-group-header">{{ item.group }}</div>
          <div v-else class="left-nav-item left-nav-sub-item" :class="{active: cfActiveTabId===item.id}"
            @click="$event.ctrlKey ? openNewWindow(item.id) : navigate(item.id)"
            :title="'Ctrl+클릭: 새창'">
            {{ item.label }}
            <span class="left-fav-star" :class="{active: isFav(item.id)}"
              @click.stop="toggleFav(item.id)" :title="isFav(item.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
          </div>
        </template>
        <!-- ── 대시보드 좌측메뉴 (전부 동적) ────────────────────────────
             대시보드      : SYS 트리(없으면 HOME_FALLBACK_DASH)
             사용자 대시보드 : USER 트리(없으면 볼 수 있는 개인 대시보드 전체) -->
        <template v-if="activeTop==='home'">
          <div class="left-nav-group-header">대시보드</div>
          <!-- SYS 트리 미설정 → 기존 하드코딩 항목 그대로 -->
          <template v-if="!sysDashMenus.length">
            <div v-for="item in HOME_FALLBACK_DASH" :key="item.id"
              class="left-nav-item left-nav-sub-item" :class="{active: cfActiveTabId===item.id}"
              @click="$event.ctrlKey ? openNewWindow(item.id) : navigate(item.id)"
              :title="'Ctrl+클릭: 새창'">
              {{ item.label }}
              <span class="left-fav-star" :class="{active: isFav(item.id)}"
                @click.stop="toggleFav(item.id)" :title="isFav(item.id)?'즐겨찾기 해제':'즐겨찾기 추가'">★</span>
            </div>
          </template>
          <template v-for="d in sysDashMenus" :key="d.key">
            <!-- 폴더 노드: 이동 대상이 아니라 묶음 라벨 -->
            <div v-if="d.folder" class="left-nav-item left-nav-sub-item"
              :style="{ paddingLeft: (24 + (d.depth || 0) * 14) + 'px', cursor: 'default', opacity: 0.75 }">
              <span style="margin-right:4px;">📁</span>{{ d.label }}
            </div>
            <!-- 전용 화면이 있으면 그 페이지로, 없으면 대시보드 뷰어로 -->
            <div v-else class="left-nav-item left-nav-sub-item"
              :class="{active: d.pageId ? cfActiveTabId===d.pageId : cfActiveTabId===('cmDashboardMyMng__'+d.dashboardId)}"
              :style="{ paddingLeft: (24 + (d.depth || 0) * 14) + 'px' }"
              @click="d.pageId ? navigate(d.pageId) : navigate('cmDashboardMyMng', { id: d.dashboardId, tabLabel: d.label })"
              title="공용 대시보드">
              <span style="margin-right:4px;">📊</span>{{ d.label }}
            </div>
          </template>
          <div class="left-nav-group-header">사용자 대시보드</div>
          <template v-for="d in userDashMenus" :key="d.dashboardId">
            <!-- 폴더 노드: 이동 대상이 아니라 묶음 라벨 -->
            <div v-if="d.folder" class="left-nav-item left-nav-sub-item"
              :style="{ paddingLeft: (24 + (d.depth || 0) * 14) + 'px', cursor: 'default', opacity: 0.75 }">
              <span style="margin-right:4px;">📁</span>{{ d.dashboardNm }}
            </div>
            <div v-else class="left-nav-item left-nav-sub-item"
              :style="{ paddingLeft: (24 + (d.depth || 0) * 14) + 'px' }"
              @click="navigate('cmDashboardMyMng', { id: d.dashboardId, tabLabel: d.dashboardNm })"
              :title="d.mine ? '내 대시보드' : '공유받은 대시보드'">
              <span style="margin-right:4px;">{{ d.mine ? '👤' : '🔗' }}</span>{{ d.dashboardNm }}
            </div>
          </template>
        </template>
        <!-- 동적 대시보드 아래에 붙는 메뉴 (대시보드 관리 그룹) -->
        <template v-for="item in (LEFT_MENUS_TAIL[activeTop] || [])" :key="item?.group || item?.id">
          <div v-if="item.group" class="left-nav-group-header">{{ item.group }}</div>
          <div v-else class="left-nav-item left-nav-sub-item" :class="{active: cfActiveTabId===item.id}"
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
            <div v-if="cfFavList.length===0" class="left-nav-open-empty">즐겨찾기가 없습니다.</div>
            <div v-for="fav in cfFavList" :key="fav.id"
              class="left-nav-open-item" :class="{active: cfActiveTabId===fav.id}"
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
            <div v-if="cfOpenTabsWithGroup.length===0" class="left-nav-open-empty">열린 화면이 없습니다.</div>
            <div v-for="tab in cfOpenTabsWithGroup" :key="tab.id"
              class="left-nav-open-item" :class="{active: cfActiveTabId===tab.id}"
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
        <!-- 연관사이트 (별도 행) -->
        <div style="padding:6px 10px;border-top:1px solid #eef0f3;background:#fafbfc;">
          <button @click.stop="toggleRelatedSite"
            style="width:100%;display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fff;border:1px solid #eee;border-radius:6px;cursor:pointer;font-size:12px;color:#555;"
            title="연관사이트 열기">
            <span>🔗 연관사이트</span>
            <span style="margin-left:auto;display:inline-flex;gap:5px;font-family:monospace;">
              <span :style="{fontWeight:800,color: currentFoSiteNo==='03'?'#7b1fa2':currentFoSiteNo==='02'?'#2e7d6b':currentFoSiteNo==='9999'?'#888':'#9f2946'}">{{ currentFoSiteNo || '-' }}</span>
              <span :style="{fontWeight:800,color: currentBoSiteNo==='03'?'#7b1fa2':currentBoSiteNo==='02'?'#2e7d6b':currentBoSiteNo==='9999'?'#888':'#9f2946'}">{{ currentBoSiteNo || '-' }}</span>
            </span>
            <span style="font-size:9px;color:#bbb;">▾</span>
          </button>
        </div>

        <!-- 연관사이트 팝업 레이어 -->
        <div v-if="uiState.relatedSiteOpen"
          @click="uiState.relatedSiteOpen=false"
          style="position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.25);"></div>
        <div v-if="uiState.relatedSiteOpen"
          @click.stop
          style="position:fixed;left:12px;bottom:56px;z-index:9999;width:360px;max-height:75vh;overflow:auto;background:#fff;border:1px solid #ffc9d6;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.3);">
          <div style="padding:12px 14px;border-bottom:1px solid #ffc9d6;background:linear-gradient(135deg,#fff0f4,#ffe4ec);display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:800;font-size:13px;color:#9f2946;"><span style="color:#e8587a;font-size:9px;margin-right:6px;">●</span>🔗 연관사이트</span>
            <button @click="uiState.relatedSiteOpen=false" style="background:none;border:none;font-size:13px;color:#9f2946;cursor:pointer;padding:2px 6px;border-radius:4px;">✕</button>
          </div>
          <div style="padding:12px;">
            <!-- _SITE_NO (FO / BO 분리 링크) -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;margin-bottom:12px;">
              <div style="font-size:12px;font-weight:800;color:#2e7d6b;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #def0e8;">🌈 _SITE_NO <span style="font-size:10.5px;color:#888;font-weight:600;">(FO: {{ currentFoSiteNo || '-' }}, BO: {{ currentBoSiteNo || '-' }})</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div v-for="p in SITE_PAIR_MENU" :key="p.fo+'_'+p.bo"
                  style="display:flex;gap:6px;align-items:center;">
                  <button type="button" @click="goFoSite(p.fo)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentFoSiteNo===p.fo?'#e0f2ec':'transparent',border:'1px solid '+(currentFoSiteNo===p.fo?'#a3d4be':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'11.5px',fontFamily:'monospace',color: currentFoSiteNo===p.fo?'#2e7d6b':'#444',fontWeight: currentFoSiteNo===p.fo?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#e0f2ec';this.style.color='#2e7d6b';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentFoSiteNo===p.fo?'1':'0'"
                    title="index.html 새창 오픈">
                    <span>{{ currentFoSiteNo===p.fo?'●':'○' }}</span>
                    <span>FO={{ p.fo }}</span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">↗</span>
                  </button>
                  <button type="button" @click="goBoSite(p.bo)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentBoSiteNo===p.bo?'#f3e5f5':'transparent',border:'1px solid '+(currentBoSiteNo===p.bo?'#ce93d8':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'11.5px',fontFamily:'monospace',color: currentBoSiteNo===p.bo?'#7b1fa2':'#444',fontWeight: currentBoSiteNo===p.bo?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#f3e5f5';this.style.color='#7b1fa2';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentBoSiteNo===p.bo?'1':'0'"
                    title="bo.html 새창 오픈">
                    <span>{{ currentBoSiteNo===p.bo?'●':'○' }}</span>
                    <span>BO={{ p.bo }}</span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">↗</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- dispUi -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:12px;font-weight:800;color:#c2410c;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5e8de;">🖥 dispUi (샘플)</div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <div v-for="it in DISP_LINKS" :key="it.hash"
                  style="display:flex;align-items:center;gap:6px;padding:4px 6px;">
                  <span style="width:18px;text-align:center;font-size:12.5px;">{{ it.icon }}</span>
                  <span style="flex:1;font-size:12.5px;color:#333;">{{ it.label }}</span>
                  <button @click="openRelatedLink('fo-disp-ui-pop.html' + it.hash)"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:5px;cursor:pointer;"
                    title="사용자 미리보기">사용자 ↗</button>
                  <button @click="openRelatedLink('bo-disp-ui-pop.html' + it.hash)"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#fef3eb;color:#c2410c;border:1px solid #f5e8de;border-radius:5px;cursor:pointer;"
                    title="관리자 미리보기">관리자 ↗</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="bo-main">
      <!-- ② TAB BAR -->
      <div class="bo-tab-bar-wrap" v-if="!cfEmbed && tabBarOpen">
        <button class="tab-scroll-btn" @click="scrollTabs(-1)" title="왼쪽">&#8249;</button>
        <div class="bo-tab-bar" ref="tabBarRef">
          <div v-for="tab in openTabs" :key="tab.id" :data-tab-id="tab.id"
            class="bo-tab" :class="{active: cfActiveTabId===tab.id}"
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
      <div class="bo-wrap">
        <!-- 초기화 중 로딩 표시 -->
        <div v-if="!boInitReady" style="display:flex;align-items:center;justify-content:center;height:200px;color:#aaa;font-size:14px;">
          <span>초기화 중...</span>
        </div>
        <!-- 비로그인 시 본문(데이터) 미렌더 — 전용 로그인 화면(page 모드)이 자동 표시됨 -->
        <div v-else-if="!cfIsLoggedIn" style="display:flex;align-items:center;justify-content:center;height:60vh;color:#bbb;font-size:14px;">
          <span>로그인이 필요합니다.</span>
        </div>
        <template v-else>
          <!-- 고정된 탭: v-show로 항상 마운트 유지, 전환 시 상태 보존 -->
          <component
            v-for="keptId in keptTabIds" :key="'kept_' + keptId"
            :is="PAGE_COMP_MAP[toPageFromTabId(keptId)]"
            v-show="cfActiveTabId === keptId"
            :navigate="navigate"
            :dtl-id="dtlId"
            />
          <!-- 비고정 현재 탭: 전환 시 재마운트 -->
          <div v-if="!keptTabIds.has(cfActiveTabId)" :key="cfActiveTabId + '_' + (refreshKeys[cfActiveTabId] || 0)" style="display:contents;">
            <component v-if="page==='dashboard'" :is="cfDashboardComp" :navigate="navigate" />
            <dashboard-bo-app-monitor v-else-if="page==='appMonitorDashboard'" :navigate="navigate" :show-toast="showToast" />
            <mb-member-mng  v-else-if="page==='mbMemberMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <mb-member-dtl  v-else-if="page==='mbMemberDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <pd-prod-mng  v-else-if="page==='pdProdMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <pd-prod-dtl  v-else-if="page==='pdProdDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <od-order-kanban v-else-if="page==='odOrderKanban'" :key="'kanban_' + dtlId" :order-id="dtlId" :claim-id="kanbanClaimId" mode="bo" :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <od-order-mng  v-else-if="page==='odOrderMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <od-order-dtl  v-else-if="page==='odOrderDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <od-claim-mng  v-else-if="page==='odClaimMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <od-claim-dtl  v-else-if="page==='odClaimDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <od-dliv-mng  v-else-if="page==='odDlivMng'"  :navigate="navigate" />
            <od-dliv-dtl  v-else-if="page==='odDlivDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <od-cart-mng  v-else-if="page==='odCartMng'"  :navigate="navigate" />
            <pm-coupon-mng  v-else-if="page==='pmCouponMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <pm-coupon-dtl  v-else-if="page==='pmCouponDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <pm-cache-mng  v-else-if="page==='pmCacheMng'"  :navigate="navigate" />
            <pm-discnt-mng v-else-if="page==='pmDiscntMng'" :navigate="navigate" />
            <pm-save-mng  v-else-if="page==='pmSaveMng'"  :navigate="navigate" />
            <pm-gift-mng  v-else-if="page==='pmGiftMng'"  :navigate="navigate" />
            <pm-voucher-mng v-else-if="page==='pmVoucherMng'" :navigate="navigate" />
            <pm-voucher-dtl  v-else-if="page==='pmVoucherDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <pm-cache-dtl  v-else-if="page==='pmCacheDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-panel-mng  v-else-if="page==='dpDispPanelMng'"  :navigate="navigate" />
            <dp-disp-area-preview  v-else-if="page==='dpDispAreaPreview'"  :navigate="navigate" />
            <dp-disp-ui-preview  v-else-if="page==='dpDispUiPreview'"  :navigate="navigate" />
            <dp-disp-panel-preview v-else-if="page==='dpDispPanelPreview'" :navigate="navigate" />
            <dp-disp-widget-preview v-else-if="page==='dpDispWidgetPreview'" :navigate="navigate" />
            <dp-disp-area-mng  v-else-if="page==='dpDispAreaMng'"  :navigate="navigate" />
            <dp-disp-area-dtl  v-else-if="page==='dpDispAreaDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-ui-mng  v-else-if="page==='dpDispUiMng'"  :navigate="navigate" />
            <dp-disp-ui-dtl  v-else-if="page==='dpDispUiDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-widget-mng  v-else-if="page==='dpDispWidgetMng'"  :navigate="navigate" />
            <dp-disp-widget-dtl  v-else-if="page==='dpDispWidgetDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-panel-dtl  v-else-if="page==='dpDispPanelDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-widget-lib-mng  v-else-if="page==='dpDispWidgetLibMng'"  :navigate="navigate" />
            <dp-disp-widget-lib-dtl  v-else-if="page==='dpDispWidgetLibDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <dp-disp-widget-lib-preview v-else-if="page==='dpDispWidgetLibPreview'" :navigate="navigate" />
            <pm-event-mng  v-else-if="page==='pmEventMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <pm-event-dtl  v-else-if="page==='pmEventDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <pm-plan-mng  v-else-if="page==='pmPlanMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <pm-plan-dtl  v-else-if="page==='pmPlanDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <mb-cust-info-mng v-else-if="page==='mbCustInfoMng'" :navigate="navigate" />
            <sy-contact-mng v-else-if="page==='syContactMng'" :navigate="navigate" />
            <sy-contact-dtl v-else-if="page==='syContactDtl'" :navigate="navigate" :dtl-id="dtlId" />
            <cm-chatt-mng     v-else-if="page==='cmChattMng'"     :navigate="navigate" />
            <cm-chatt-dtl     v-else-if="page==='cmChattDtl'"     :navigate="navigate" :dtl-id="dtlId" />
            <cm-chatt-kanban  v-else-if="page==='cmChattKanban'"  :navigate="navigate" />
            <sy-site-mng  v-else-if="page==='sySiteMng'"  :navigate="navigate" />
            <sy-site-dtl  v-else-if="page==='sySiteDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <sy-code-mng  v-else-if="page==='syCodeMng'"  :navigate="navigate" />
            <sy-code-dtl  v-else-if="page==='syCodeDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <sy-brand-mng  v-else-if="page==='syBrandMng'"  :navigate="navigate" />
            <sy-attach-mng  v-else-if="page==='syAttachMng'"  :navigate="navigate" />
            <sy-template-mng v-else-if="page==='syTemplateMng'" :navigate="navigate" />
            <sy-template-dtl v-else-if="page==='syTemplateDtl'" :navigate="navigate" :dtl-id="dtlId" />
            <sy-vendor-mng  v-else-if="page==='syVendorMng'"  :navigate="navigate" />
            <sy-vendor-user-mng v-else-if="page==='syVendorUserMng'" :navigate="navigate" />
            <sy-vendor-info-mng v-else-if="page==='syVendorInfoMng'" :navigate="navigate" />
            <sy-vendor-dtl  v-else-if="page==='syVendorDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <pd-category-mng v-else-if="page==='pdCategoryMng'" :navigate="navigate" />
            <pd-category-dtl v-else-if="page==='pdCategoryDtl'" :navigate="navigate" :dtl-id="dtlId" />
            <pd-category-prod-mng v-else-if="page==='pdCategoryProdMng'" :navigate="navigate" />
            <pd-opt-code-mng-page v-else-if="page==='pdOptCodeMng'" :navigate="navigate" />
            <sy-user-mng  v-else-if="page==='syUserMng'"  :navigate="navigate" />
            <sy-user-dtl  v-else-if="page==='syUserDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <sy-batch-mng  v-else-if="page==='syBatchMng'"  :navigate="navigate" />
            <sy-batch-dtl  v-else-if="page==='syBatchDtl'"  :navigate="navigate" :dtl-id="dtlId" />
            <sy-dept-mng  v-else-if="page==='syDeptMng'"  :navigate="navigate" />
            <sy-menu-mng  v-else-if="page==='syMenuMng'"  :navigate="navigate" />
            <sy-role-mng  v-else-if="page==='syRoleMng'"  :navigate="navigate" />
            <cm-notice-mng  v-else-if="page==='cmNoticeMng'"  :navigate="navigate" />
            <cm-faq-mng  v-else-if="page==='cmFaqMng'"  :navigate="navigate" />
            <cm-blog-mng  v-else-if="page==='cmBlogMng'"  :navigate="navigate" />
            <cm-dashboard-mng  v-else-if="page==='cmDashboardMng'"  :navigate="navigate" />
            <cm-dashboard-item-mng  v-else-if="page==='cmDashboardItemMng'"  :navigate="navigate" />
            <cm-dashboard-layout-mng  v-else-if="page==='cmDashboardLayoutMng'"  :navigate="navigate" :dtl-id="dtlId" />
            <cm-dashboard-my-mng  v-else-if="page==='cmDashboardMyMng'"  :navigate="navigate" :dtl-id="dtlId" />
            <cm-dashboard-menu-mng  v-else-if="page==='cmDashboardMenuMng'"  :navigate="navigate" />
            <cm-dashboard-sys-menu-mng v-else-if="page==='cmDashboardSysMenuMng'" :navigate="navigate" />
            <cm-popup-mng  v-else-if="page==='cmPopupMng'"  :navigate="navigate" />
            <cm-popup-item-mng  v-else-if="page==='cmPopupItemMng'"  :navigate="navigate" :dtl-id="dtlId" />
            <sy-alarm-mng  v-else-if="page==='syAlarmMng'"  :navigate="navigate" />
            <sy-prop-mng  v-else-if="page==='syPropMng'"  :navigate="navigate" />
            <sy-path-mng  v-else-if="page==='syPathMng'"  :navigate="navigate" />
            <sy-bbm-mng  v-else-if="page==='syBbmMng'"  :navigate="navigate" />
            <sy-bbs-mng  v-else-if="page==='syBbsMng'"  :navigate="navigate" />
            <sy-i18n-mng  v-else-if="page==='syI18nMng'"  :navigate="navigate" />
            <!-- ── 회원 추가 ── -->
            <mb-mem-grade-mng  v-else-if="page==='mbMemGradeMng'"  :navigate="navigate" />
            <mb-mem-group-mng  v-else-if="page==='mbMemGroupMng'"  :navigate="navigate" />
            <!-- ── 상품 추가 ── -->
            <pd-dliv-tmplt-mng  v-else-if="page==='pdDlivTmpltMng'"  :navigate="navigate" />
            <pd-single-prod-mng  v-else-if="page==='pdSingleProdMng'"  :navigate="navigate" />
            <pd-option-prod-mng  v-else-if="page==='pdOptionProdMng'"  :navigate="navigate" />
            <pd-group-prod-mng  v-else-if="page==='pdGroupProdMng'"  :navigate="navigate" />
            <pd-set-prod-mng  v-else-if="page==='pdSetProdMng'"  :navigate="navigate" />
            <pd-gift-prod-mng  v-else-if="page==='pdGiftProdMng'"  :navigate="navigate" />
            <pd-review-mng  v-else-if="page==='pdReviewMng'"  :navigate="navigate" />
            <pd-qna-mng  v-else-if="page==='pdQnaMng'"  :navigate="navigate" />
            <pd-restock-noti-mng v-else-if="page==='pdRestockNotiMng'" :navigate="navigate" />
            <pd-tag-mng  v-else-if="page==='pdTagMng'"  :navigate="navigate" />
            <!-- ── 정산 ── -->
            <st-config-mng  v-else-if="page==='stConfigMng'"  :navigate="navigate" />
            <st-raw-mng  v-else-if="page==='stRawMng'"  :navigate="navigate" />
            <st-settle-adj-mng  v-else-if="page==='stSettleAdjMng'"  :navigate="navigate" />
            <st-settle-etc-adj-mng v-else-if="page==='stSettleEtcAdjMng'" :navigate="navigate" />
            <st-settle-close-mng v-else-if="page==='stSettleCloseMng'"  :navigate="navigate" :init-search-value="initSearchValue" />
            <st-settle-pay-mng  v-else-if="page==='stSettlePayMng'"  :navigate="navigate" />
            <st-status-mng  v-else-if="page==='stStatusMng'"  :navigate="navigate" />
            <st-recon-order-mng  v-else-if="page==='stReconOrderMng'"  :navigate="navigate" />
            <st-recon-pay-mng  v-else-if="page==='stReconPayMng'"  :navigate="navigate" />
            <st-recon-claim-mng  v-else-if="page==='stReconClaimMng'"  :navigate="navigate" />
            <st-recon-vendor-mng v-else-if="page==='stReconVendorMng'"  :navigate="navigate" />
            <st-erp-gen-mng  v-else-if="page==='stErpGenMng'"  :navigate="navigate" />
            <st-erp-view-mng  v-else-if="page==='stErpViewMng'"  :navigate="navigate" />
            <st-erp-recon-mng  v-else-if="page==='stErpReconMng'"  :navigate="navigate" />
            <sy-member-login-hist v-else-if="page==='syMemberLoginHist'" :navigate="navigate" />
            <sy-user-login-hist  v-else-if="page==='syUserLoginHist'"  :navigate="navigate" />
            <sy-api-log-mng      v-else-if="page==='syApiLogMng'"      :navigate="navigate" />
            <sy-send-msg-log-mng v-else-if="page==='sySendMsgLog'"     :navigate="navigate" />
            <sy-postman  v-else-if="page==='syPostman'"  :navigate="navigate" />
            <zd-inf-dashboard v-else-if="page==='zdInfDashboard'" :navigate="navigate" :show-toast="showToast" />
            <zd-store  v-else-if="page==='zdStore'"  :navigate="navigate" />
            <zd-local-storage  v-else-if="page==='zdLocalStorage'"  :navigate="navigate" />
            <zd-test-sns-login-kakao  v-else-if="page==='zdTestSnsLoginKakao'"  :navigate="navigate" :show-toast="showToast" />
            <zd-test-sns-login-google v-else-if="page==='zdTestSnsLoginGoogle'" :navigate="navigate" :show-toast="showToast" />
            <zd-test-pay-toss-widget  v-else-if="page==='zdTestPayTossWidget'"  :navigate="navigate" :show-toast="showToast" />
            <zd-test-pay-toss-brandpay v-else-if="page==='zdTestPayTossBrandpay'" :navigate="navigate" :show-toast="showToast" />
            <zd-test-pay-kakaopay     v-else-if="page==='zdTestPayKakaopay'"    :navigate="navigate" :show-toast="showToast" />
            <zd-test-pay-naverpay     v-else-if="page==='zdTestPayNaverpay'"    :navigate="navigate" :show-toast="showToast" />
            <zd-test-map-kakao        v-else-if="page==='zdTestMapKakao'"       :navigate="navigate" :show-toast="showToast" />
            <zd-test-map-naver        v-else-if="page==='zdTestMapNaver'"       :navigate="navigate" :show-toast="showToast" />
            <zd-test-map-google       v-else-if="page==='zdTestMapGoogle'"      :navigate="navigate" :show-toast="showToast" />
            <zd-test-mail-smtp        v-else-if="page==='zdTestMailSmtp'"       :navigate="navigate" :show-toast="showToast" />
            <zd-test-sms              v-else-if="page==='zdTestSms'"            :navigate="navigate" :show-toast="showToast" />
            <zd-test-push-alim-fcm          v-else-if="page==='zdTestPushAlimFcm'"          :navigate="navigate" :show-toast="showToast" />
            <zd-test-push-alim-apns         v-else-if="page==='zdTestPushAlimApns'"         :navigate="navigate" :show-toast="showToast" />
            <zd-test-sns-login-naver        v-else-if="page==='zdTestSnsLoginNaver'"        :navigate="navigate" :show-toast="showToast" />
            <zd-test-ai-chatbot             v-else-if="page==='zdTestAiChatbot'"            :navigate="navigate" :show-toast="showToast" />
            <zd-test-chatting-kakao-channel v-else-if="page==='zdTestChattingKakaoChannel'" :navigate="navigate" :show-toast="showToast" />
            <zd-test-share-kakao            v-else-if="page==='zdTestShareKakao'"            :navigate="navigate" :show-toast="showToast" />
            <zd-test-chatting-web-socket    v-else-if="page==='zdTestChattingWebSocket'"    :navigate="navigate" :show-toast="showToast" />
            <zd-test-app-msg-send-receiv    v-else-if="page==='zdTestAppMsgSendReceiv'"    :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-member-mng  v-else-if="page==='zdSimulMemberMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-coupon-mng  v-else-if="page==='zdSimulCouponMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-discnt-mng  v-else-if="page==='zdSimulDiscntMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-save-mng    v-else-if="page==='zdSimulSaveMng'"    :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-plan-mng    v-else-if="page==='zdSimulPlanMng'"    :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-event-mng   v-else-if="page==='zdSimulEventMng'"   :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-prod-mng    v-else-if="page==='zdSimulProdMng'"    :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-order-mng   v-else-if="page==='zdSimulOrderMng'"   :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-claim-mng   v-else-if="page==='zdSimulClaimMng'"   :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-kanban-mng  v-else-if="page==='zdSimulKanbanMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-settle-mng  v-else-if="page==='zdSimulSettleMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-user-mng    v-else-if="page==='zdSimulUserMng'"    :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-vendor-mng  v-else-if="page==='zdSimulVendorMng'"  :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-voucher-mng v-else-if="page==='zdSimulVoucherMng'" :navigate="navigate" :show-toast="showToast" :show-confirm="showConfirm" />
            <zd-simul-log-mng     v-else-if="page==='zdSimulLogMng'"     :navigate="navigate" :show-toast="showToast" />
            <bo-error-401 v-else-if="page==='error401'" :navigate="navigate" />
            <bo-error-500 v-else-if="page==='error500'" :navigate="navigate" :message="errorMessage" />
            <bo-error-404 v-else :navigate="navigate" :page-id="page" />
          </div><!-- /비고정 탭 래퍼 -->
        </template>
      </div>
    </div>

    <!-- Right Panel: 공통 필터 -->
    <div class="bo-right-panel" :class="{collapsed: !rightPanelOpen}">
      <div v-show="rightPanelOpen" class="right-panel-body">
        <div class="right-panel-title">공통 필터</div>
        <div class="popup-sel">
          <div class="popup-sel-label">사이트 <span style="color:#e8587a;font-size:10px;">필수</span>
            <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#e5e7eb;color:#555;font-size:10px;text-align:center;line-height:14px;margin-left:4px;cursor:help;font-weight:700;"
              :title="['사이트번호 : 프로그램 작업코드 (01, 02, 03…)','사이트코드 : 라이선스코드 (ST0001 형식)'].join(String.fromCharCode(10))">?</span>
          </div>
          <div class="popup-sel-row" @click="openSelectModal('site')">
            <span v-if="filterSite" style="font-family:monospace;font-size:11px;color:#e8587a;font-weight:700;margin-right:6px;">{{ filterSite.siteNo || String(filterSite.siteId).slice(-2) }}</span>
            <span v-if="filterSite" class="popup-sel-name">{{ filterSite.siteNm || '-' }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterSite" class="popup-sel-id">{{ filterSite.siteCode || '' }}</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매업체</div>
          <div class="popup-sel-row" @click="openSelectModal('vendor')">
            <span v-if="filterVendor" class="popup-sel-name">{{ filterVendor.vendorNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterVendor" class="popup-sel-id">{{ filterVendor.vendorId }}</span>
            <span v-if="commonFilter.vendorId" class="popup-sel-clear" @click.stop="clearFilter('vendor')" title="선택 해제">✕</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">판매사용자</div>
          <div class="popup-sel-row" @click="openSelectModal('boUser')">
            <span v-if="cfFilterBoUser" class="popup-sel-name">{{ cfFilterBoUser.name }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="cfFilterBoUser" class="popup-sel-id">{{ cfFilterBoUser.boUserId }}</span>
            <span v-if="commonFilter.userId" class="popup-sel-clear" @click.stop="clearFilter('boUser')" title="선택 해제">✕</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">배송업체</div>
          <div class="popup-sel-row" @click="openSelectModal('dlivVendor')">
            <span v-if="cfFilterDlivVendor" class="popup-sel-name">{{ cfFilterDlivVendor.vendorNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="cfFilterDlivVendor" class="popup-sel-id">{{ cfFilterDlivVendor.vendorId }}</span>
            <span v-if="commonFilter.dlivVendorId" class="popup-sel-clear" @click.stop="clearFilter('dlivVendor')" title="선택 해제">✕</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">회원</div>
          <div class="popup-sel-row" @click="openSelectModal('member')">
            <span v-if="filterMember" class="popup-sel-name">{{ filterMember.memberNm }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterMember" class="popup-sel-id">{{ filterMember.memberId }}</span>
            <span v-if="commonFilter.memberId" class="popup-sel-clear" @click.stop="clearFilter('member')" title="선택 해제">✕</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>
        <div class="popup-sel">
          <div class="popup-sel-label">주문</div>
          <div class="popup-sel-row" @click="openSelectModal('order')">
            <span v-if="filterOrder" class="popup-sel-name">{{ filterOrder.orderId }}</span>
            <span v-else class="popup-sel-placeholder">선택하세요</span>
            <span v-if="filterOrder" class="popup-sel-id">{{ filterOrder.userNm }}</span>
            <span v-if="commonFilter.orderId" class="popup-sel-clear" @click.stop="clearFilter('order')" title="선택 해제">✕</span>
            <span class="popup-sel-btn">🔍</span>
          </div>
        </div>

        <!-- API 로그 섹션 -->
        <div style="padding: 12px 0; border-top: 1px solid #e5e7eb; margin-top: 12px;">
          <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span>📡 API 로그 (BO)</span>
            <button v-if="apiLogs.length" @click="clearApiLogs" style="font-size: 10px; padding: 2px 6px; background: #ef4444; color: white; border: none; border-radius: 2px; cursor: pointer; font-weight: 600;">Clear</button>
          </div>
          <div v-if="apiLogs.length === 0" style="font-size: 11px; color: #9ca3af; padding: 8px; text-align: center;">로그 없음</div>
          <div v-else style="max-height: 525px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 3px; background: white;">
            <div v-for="(log, idx) in apiLogs" :key="idx"
              @mouseenter="onApiLogEnter(log)"
              @mouseleave="onApiLogLeave(log)"
              style="padding: 3px 0; border-bottom: 1px solid #d1d5db; font-size: 10px; font-family: monospace; cursor: pointer; position: relative;"
              :style="{ background: (apiLogHoverDetail === log || apiLogLockedDetail === log) ? '#f9fafb' : 'white' }">
              <!-- 1줄: 메서드(첫글자) + URL(/api.. 축약) + status(200 숨김) — FO 동일 형태, 좌우 공백 활용 -->
              <div style="display:flex;align-items:center;gap:4px;">
                <span :style="{ color: log.method === 'GET' ? '#3b82f6' : log.method === 'POST' ? '#8b5cf6' : '#f59e0b', fontWeight:'700' }" style="flex-shrink:0;" :title="log.method">{{ (log.method || '-').charAt(0) }}</span>
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :style="{ color: log.hasError ? '#ef4444' : '#1a5276' }" :title="log.url">{{ fnShortUrl(log.url) }}</span>
                <span v-if="log.status ? (Number(log.status) !== 200) : false" :style="{ color: getApiStatusColor(log.status), fontWeight:'700' }" style="flex-shrink:0;" :title="log.status">{{ log.status }}</span>
              </div>
              <!-- 2줄: uiLabel + duration(초) + 시각(분:초) -->
              <div style="display:flex;align-items:center;gap:6px;margin-top:1px;">
                <span v-if="log.uiLabel" :style="{ fontWeight: isWithin60Seconds(log.time) ? '700' : '400' }" style="font-size:9px;color:#7c3aed;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.2px;">{{ log.uiLabel }}</span>
                <span v-else style="flex:1;"></span>
                <span v-if="log.duration" style="font-size:9px;color:#aaa;flex-shrink:0;" :title="log.duration + 'ms'">{{ fnFmtSec(log.duration) }}</span>
                <span style="font-size:9px;color:#ccc;flex-shrink:0;" :title="log.time">{{ fnHmsToMs(log.time) }}</span>
              </div>
              <!-- 응답 데이터 미리보기(▶)는 목록에서 숨김 — 전체 req/res 는 hover 상세 레이어에서 확인 -->
            </div>
          </div>
        </div>

        <!-- API 로그 호버 상세 레이어 -->
        <div v-if="apiLogHoverDetail || apiLogLockedDetail" @mouseenter="onApiLogDetailEnter" @mouseleave="onApiLogDetailLeave" style="position: fixed; top: 200px; right: 220px; width: 650px; max-height: 858px; background: white; border: 2px solid #8b5cf6; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1001; font-size: 11px; font-family: monospace; overflow: hidden; display: flex; flex-direction: column;">
          <!-- 헤더 -->
          <div style="padding: 12px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-bottom: 1px solid #d1d5db; flex-shrink: 0;">
            <div style="font-weight: 700; color: #374151; font-size: 12px; margin-bottom: 6px;">📡 API 요청/응답 상세 <span style="color: #ef4444; margin-left: 4px;">#{{ apiLogs.findIndex(l => l === (apiLogLockedDetail || apiLogHoverDetail)) >= 0 ? apiLogs.length - apiLogs.findIndex(l => l === (apiLogLockedDetail || apiLogHoverDetail)) : '-' }}</span></div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="flex: 1; overflow: hidden;">
                <div style="color: #374151; font-size: 11px; word-break: break-all; line-height: 1.5;">
                  <span style="color: #6b7280; font-weight: 600;">{{ (apiLogLockedDetail || apiLogHoverDetail).method }}</span>
                  <span style="color: #6b7280; margin: 0 4px;">:</span>
                  <span style="color: #374151;">{{ (apiLogLockedDetail || apiLogHoverDetail).url }}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                <span style="color: #6b7280; font-size: 10px; white-space: nowrap;">{{ (apiLogLockedDetail || apiLogHoverDetail).time }}</span>
                <button v-if="apiLogLockedDetail" @click="toggleApiLogLock(apiLogLockedDetail)" style="background: none; border: none; cursor: pointer; font-size: 14px; color: #6b7280; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">✕</button>
              </div>
            </div>
          </div>

          <!-- 상태 정보 -->
          <div style="padding: 8px 12px; background: #fafbfc; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 16px; flex-shrink: 0;">
            <div>
              <span style="color: #6b7280; font-size: 10px; font-weight: 600;">상태:</span>
              <div :style="{ display: 'inline-block', background: ((apiLogLockedDetail || apiLogHoverDetail).status >= 200 ? (apiLogLockedDetail || apiLogHoverDetail).status < 300 : false) ? '#ecfdf5' : '#fef2f2', color: ((apiLogLockedDetail || apiLogHoverDetail).status >= 200 ? (apiLogLockedDetail || apiLogHoverDetail).status < 300 : false) ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '2px', fontWeight: '700', border: '1px solid ' + (((apiLogLockedDetail || apiLogHoverDetail).status >= 200 ? (apiLogLockedDetail || apiLogHoverDetail).status < 300 : false) ? '#10b981' : '#ef4444'), fontSize: '11px', marginLeft: '4px' }">{{ (apiLogLockedDetail || apiLogHoverDetail).status }}</div>
            </div>
            <div>
              <span style="color: #6b7280; font-size: 10px; font-weight: 600;">소요시간:</span>
              <span style="color: #374151; font-size: 10px; margin-left: 4px;">{{ (apiLogLockedDetail || apiLogHoverDetail).duration }}ms</span>
            </div>
          </div>

          <!-- 요청/응답 데이터 -->
          <div style="flex: 1; overflow: hidden; display: grid; grid-template-rows: 130px 1fr 2fr; gap: 8px; padding: 8px; background: white;">
            <!-- Headers -->
            <div style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid #8b5cf6; border-radius: 2px;">
              <div style="padding: 4px 6px; background: #ede9fe; border-bottom: 1px solid #8b5cf6; font-weight: 600; color: #5b21b6; font-size: 10px; display: flex; align-items: center; justify-content: space-between;">
                <span>📋 Headers</span>
                <span v-if="(apiLogLockedDetail || apiLogHoverDetail).uiLabel" style="color: #7c3aed; font-size: 11px; font-weight: 700;">{{ (apiLogLockedDetail || apiLogHoverDetail).uiLabel }}</span>
              </div>
              <div style="flex: 1; overflow-y: auto; padding: 6px 8px; background: #fafbfc; color: #374151; white-space: pre-wrap; word-break: break-word; line-height: 1.8; font-size: 10px; font-family: 'Courier New', monospace;">{{ (apiLogLockedDetail || apiLogHoverDetail).headers || '-' }}</div>
            </div>

            <!-- Request -->
            <div style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 2px;">
              <div style="padding: 4px 6px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 10px;">📤 Request</div>
              <div style="flex: 1; overflow-y: auto; padding: 6px; background: #fafbfc; color: #374151; white-space: pre-wrap; word-break: break-word; line-height: 1.4; font-size: 10px;">{{ formatJsonData((apiLogLockedDetail || apiLogHoverDetail).reqData) }}</div>
            </div>

            <!-- Response -->
            <div style="display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 2px;">
              <div style="padding: 4px 6px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 10px;">📥 Response</div>
              <div style="flex: 1; overflow-y: auto; padding: 6px; background: #fafbfc; color: #374151; white-space: pre-wrap; word-break: break-word; line-height: 1.4; font-size: 10px;">{{ formatJsonData((apiLogLockedDetail || apiLogHoverDetail).resData) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /bo-body -->

  <!-- 선택 모달들 -->
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='site') : false" popup-cmd="cmPopup-site-select" popup-code="site" @select="onSelectItem('site', $event)" @close="closeSelectModal" />
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='vendor') : false" popup-cmd="cmPopup-vendor-select" popup-code="vendor" @select="onSelectItem('vendor', $event)" @close="closeSelectModal" />
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='dlivVendor') : false" popup-cmd="cmPopup-dliv-vendor-select" popup-code="vendor" @select="onSelectItem('dlivVendor', $event)" @close="closeSelectModal" />
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='boUser') : false" popup-cmd="cmPopup-bo-user-select" popup-code="userByDept" result-type="array" @select="onSelectItem('boUser', $event)" @close="closeSelectModal" />
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='member') : false" popup-cmd="cmPopup-member-select" popup-code="member" @select="onSelectItem('member', $event)" @close="closeSelectModal" />
  <bo-cm-popup-modal v-if="selectModal.show ? (selectModal.type==='order') : false" popup-cmd="cmPopup-order-select" popup-code="order" @select="onSelectItem('order', $event)" @close="closeSelectModal" />

  <!-- 참조 모달 -->
  <bo-ref-modal v-if="refModal ? (refModal.show) : false" :state="refModal" modal-name="bo-ref"  @close="closeRefModal" />

  <!-- 도움말 모달 -->
  <help-bo-modal v-if="helpModal.show" :show="helpModal.show" :topic="helpModal.topic" modal-name="help-bo" @close="helpModal.show=false" />

  <!-- Confirm — BoModal(z-index 9000) 위에 항상 노출되도록 z-index 10000 -->
  <div v-if="confirmState ? (confirmState.show) : false" class="modal-overlay" style="z-index:10000;" @click.self="closeConfirm(false)">
    <div class="confirm-box">
      <div class="confirm-icon">💾</div>
      <div class="confirm-title">{{ confirmState.title }}</div>
      <div class="confirm-msg">{{ confirmState.msg }}</div>
      <!-- 상세 배지 (details 있을 때만) -->
      <div v-if="confirmState.details ? (confirmState.details.length) : false" class="confirm-details">
        <span v-for="d in confirmState.details" :key="d.label"
          class="badge confirm-detail-badge" :class="d.cls">{{ d.label }}</span>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" @click="closeConfirm(false)">{{ confirmState.btnCancel }}</button>
        <button class="btn btn-primary" @click="closeConfirm(true)">{{ confirmState.btnOk }}</button>
      </div>
    </div>
  </div>

  <!-- API Progress Overlay -->
  <div v-if="isApiLoading" class="api-progress-overlay">
    <div class="api-progress-card">
      <div class="api-progress-dots">
        <div class="bo-dot"></div>
        <div class="bo-dot"></div>
        <div class="bo-dot"></div>
        <div class="bo-dot"></div>
      </div>
      <div class="api-progress-label">{{ apiProgressLabel }}</div>
    </div>
  </div>

  <!-- Toast 누적 스택 -->
  <div class="toast-container">
    <div v-if="toasts.length > 1" class="toast-close-all">
      <span class="toast-close-all-btn" @click="closeAllToasts">✕ 전체닫기 ({{ toasts.length }})</span>
      <span class="toast-close-all-sep">|</span>
      <span class="toast-close-all-btn" @click="toggleToastDetail">{{ toastShowDetail ? '▲ 전체접기' : '▼ 전체펼치기' }}</span>
    </div>
    <div v-for="t in toasts" :key="t.id"
      class="toast-item" :class="['toast-'+t.type, { 'toast-expanded': t.expanded }]">
      <!-- 헤더 행: 제목 + ▼/▲ + ✕ -->
      <div class="toast-header-row">
        <div class="toast-msg-title"><span style="color:#aaa;font-weight:700;margin-right:4px;">#{{ t.id }}</span>{{ (t.msgTitle || t.msg).split(String.fromCharCode(10))[0] }}</div>
        <span v-if="t.type === 'error'" class="toast-expand-icon"
          @click.stop="t.expanded = !t.expanded" :title="t.expanded ? '접기' : '더보기'">{{ t.expanded ? '▲' : '▼' }}</span>
        <span class="toast-close-x" @click.stop="closeToast(t.id)">✕</span>
      </div>
      <!-- 서브 정보: URL/status 줄 -->
      <div v-if="t.msgDetail" class="toast-msg-detail">{{ t.msgDetail }}</div>
      <!-- 상태코드 한글 안내 -->
      <div v-if="t.statusHint" class="toast-status-hint">💡 {{ t.statusHint }}</div>
      <!-- 액션 버튼 (예: 설정 도움말 열기) -->
      <button v-if="t.action" @click.stop="onToastAction(t)"
        style="margin-top:7px;padding:5px 12px;font-size:12px;font-weight:700;border:1px solid #1d4ed8;border-radius:6px;background:#eef4ff;color:#1d4ed8;cursor:pointer;">
        {{ t.action.label }}
      </button>
      <!-- 펼쳐진 상세 내용 -->
      <div v-if="t.expanded" class="toast-error-details">
        <pre class="toast-error-content">{{ t.errorDetails || (t.msgTitle || t.msg) }}</pre>
      </div>
      <div v-if="!t.persistent" class="toast-progress"></div>
    </div>
  </div>

  <!-- API 응답 패널 -->
  <div v-if="apiResPanel ? (apiResPanel.show) : false" style="position:fixed;bottom:20px;right:20px;z-index:8900;width:440px;max-height:55vh;background:#1e1e2e;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;">
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
  <div v-if="ctxMenu ? (ctxMenu.show) : false"
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

  <!-- 프로필 모달 (BoModals.js: AuthProfileModal) -->
  <auth-profile-modal
    modal-name="auth-profile"
    :show="uiState.profileModalShow"
    :form="profileForm"
    :img="profileImg"
    :uploading="profileImgUploading"
    :auth-user="currentAuthUser"
    @save="saveProfile"
    @img-change="onProfileImgChange"
    @img-remove="onProfileImgRemove"
    @close="uiState.profileModalShow=false" />

  <!-- 사용자 선택 모달 (BoModals.js: AuthUserPickModal) -->
  <auth-user-pick-modal
    modal-name="auth-user-pick"
    :modal="userPickModal"
    :rows="cfPickRows"
    :total="cfPickTotal"
    :total-page="cfPickTotalPage"
    :login-id="loginForm.loginId"
    @search="onUserPickSearch"
    @go-page="onUserPickPage"
    @pick="onUserPick"
    @close="userPickModal.show=false" />

  <!-- 비밀번호 변경 모달 (BoModals.js: AuthPwChangeModal) -->
  <auth-pw-change-modal
    modal-name="auth-pw-change"
    :show="uiState.pwModalShow"
    :form="pwForm"
    :error="pwError"
    @save="savePwChange"
    @close="uiState.pwModalShow=false" />

  <!-- 로그인 / 회원가입 모달 (BoModals.js: AuthLoginModal) -->
  <auth-login-modal
    modal-name="auth-login"
    :modal="loginModal"
    :mode="loginModal.mode"
    :login-form="loginForm"
    :reg-form="regForm"
    :error="loginError"
    :auth-methods="AUTH_METHODS"
    :user-roles="userRoles"
    @do-login="doLogin"
    @do-register="doRegister"
    @do-social="doSocial"
    @open-user-pick="openUserPick"
    @clear-error="loginError=''"
    @close="closeLogin" />

  <!-- 외부 연동 설정 도움말 (SNS 로그인/토스 결제 실패 시 자동 오픈 — window.coExtHelp) -->
  <co-ext-help-modal />
</div>
`,
  });
  window.boRegisterComponents(app)
    .use(Pinia.createPinia())
    .mount('#app');

  /* 성능 측정 */
  window.perfUtil?.start('BO 앱 시작');
  const recordVueMount = window.perfUtil?.recordVueMount();
  setTimeout(() => {
    recordVueMount?.();
    window.perfUtil?.end('BO 앱 시작');
  }, 100);

  const loadingEl = document.getElementById('_boot_loading');
  if (loadingEl) {
    loadingEl.classList.add('done');
    setTimeout(() => {
      if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
    }, 350);
  }
})();
