/* ShopJoy - AppHeader */
window.foAppHeader = {
  name: 'FoAppHeader',
  props: ['page', 'theme', 'appSidebarOpen', 'appMobileOpen', 'config', 'navigate',
          'toggleTheme', 'appCartCount', 'appLikeCount', 'appAuth', 'onAppShowLogin', 'onAppLogout',
          'appShowSettings', 'appShowApiLog', 'appApiLogs', 'appApiToast'],
  emits: ['modu-fo-toggle-sidebar', 'modu-fo-toggle-mobile', 'modu-fo-toggle-settings', 'modu-fo-toggle-api-log', 'modu-fo-toggle-api-toast'],
  setup(props, { emit }) {
    // ===== [01] 초기 변수 정의 ====================================================
    const { ref, reactive, computed, watch, onUnmounted, nextTick } = Vue;

    /* ── UI 상태 ── */
    const uiState = reactive({ userMenuOpen: false, profileOpen: false, pwOpen: false, loading: false, error: '', isPageCodeLoad: false });
    const codes = reactive({});
    const userMenuRoot = ref(null);
    const addrSearchModal = reactive({ show: false }); // 주소검색 모달 (카카오 우편번호, 인라인 레이어)

    /* ── Profile 모달 ── */
    const pf = reactive({ memberNm: '', email: '', phone: '', birthdate: '', gender: '',
                          postcode: '', address: '', addressDetail: '' });

    /* ── 비밀번호 변경 모달 ── */
    const pw = reactive({ current: '', next: '', next2: '', err: '', ok: false });

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ foAppHeader.js : handleBtnAction -> ', cmd, param);
      // 모바일 사이드바 토글
      if (cmd === 'sidebar-toggle-mobile') {
        return emit('modu-fo-toggle-mobile');
      // 데스크탑 사이드바 토글
      } else if (cmd === 'sidebar-toggle-desktop') {
        return emit('modu-fo-toggle-sidebar');
      // 설정 드롭다운 토글
      } else if (cmd === 'settings-toggle') {
        return emit('modu-fo-toggle-settings');
      // API 로그 패널 토글
      } else if (cmd === 'settings-toggle-api-log') {
        return emit('modu-fo-toggle-api-log');
      // API 응답 toast 출력 토글
      } else if (cmd === 'settings-toggle-api-toast') {
        return emit('modu-fo-toggle-api-toast');
      // 사용자 메뉴 드롭다운 토글
      } else if (cmd === 'userMenu-toggle') {
        return toggleUserMenu();
      // 사용자 메뉴 닫기
      } else if (cmd === 'userMenu-close') {
        return closeUserMenu();
      // 로그인 모달 열기
      } else if (cmd === 'nav-show-login') {
        return props.onAppShowLogin();
      // 로그아웃
      } else if (cmd === 'userMenu-logout') {
        return doLogout();
      // 홈 이동
      } else if (cmd === 'nav-go-home') {
        return props.navigate('home');
      // 좋아요(위시리스트) 이동
      } else if (cmd === 'nav-go-like') {
        props.navigate('like');
        return closeUserMenu();
      // 장바구니 이동
      } else if (cmd === 'cart-go') {
        props.navigate('cart');
        return closeUserMenu();
      // 테마 토글
      } else if (cmd === 'theme-toggle') {
        return props.toggleTheme();
      // 사이트번호 배지 클릭 → 메뉴 바로가기 모달
      } else if (cmd === 'siteSwitch-open-quick-menu') {
        return window.dispatchEvent(new CustomEvent('open-quick-menu'));
      // 프로필 모달 열기
      } else if (cmd === 'profile-open') {
        return openProfile();
      // 프로필 모달 닫기
      } else if (cmd === 'profile-close') {
        uiState.profileOpen = false;
        return;
      // 프로필 저장
      } else if (cmd === 'profile-save') {
        return saveProfile();
      // 주소 검색 모달 열기 (카카오 우편번호, 인라인 레이어)
      } else if (cmd === 'profile-search-addr') {
        addrSearchModal.show = true;
        return;
      // 비밀번호 변경 모달 열기
      } else if (cmd === 'pw-open') {
        return openPw();
      // 비밀번호 변경 모달 닫기
      } else if (cmd === 'pw-close') {
        uiState.pwOpen = false;
        return;
      // 비밀번호 변경 저장
      } else if (cmd === 'pw-save') {
        return savePw();
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 메뉴/탭 선택 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ foAppHeader.js : handleSelectAction -> ', cmd, param);
      // 상단 네비게이션 메뉴 선택
      if (cmd === 'nav-select-menu') {
        return props.navigate(param);
      // 사용자 드롭다운 항목 선택
      } else if (cmd === 'userMenu-select-item') {
        return param.action && param.action();
      // 성별 라디오 선택
      } else if (cmd === 'profile-select-gender') {
        pf.gender = param;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* toggleUserMenu — 사용자 메뉴 토글 */
    const toggleUserMenu = () => { uiState.userMenuOpen = !uiState.userMenuOpen; };

    /* closeUserMenu — 사용자 메뉴 닫기 */
    const closeUserMenu  = () => { uiState.userMenuOpen = false; };

    /* goMy — 마이페이지 */
    const goMy    = () => { closeUserMenu(); props.navigate('myOrder'); };

    /* doLogout — 로그아웃 */
    const doLogout = () => { closeUserMenu(); props.onAppLogout(); };

    /* openProfile — 프로필 열기 */
    const openProfile = () => {
      closeUserMenu();
      const u = props.appAuth.user || {};
      pf.memberNm = u.memberNm || ''; pf.email = u.email || ''; pf.phone = u.phone || '';
      pf.birthdate = u.birthdate || ''; pf.gender = u.gender || '';
      pf.postcode = u.postcode || ''; pf.address = u.address || '';
      pf.addressDetail = u.addressDetail || '';
      uiState.profileOpen = true;
    };

    /* saveProfile — 저장 */
    const saveProfile = () => {
      if (!pf.memberNm.trim()) { return; }
      const u = props.appAuth.user;
      if (u) {
        Object.assign(u, {
          memberNm: pf.memberNm, phone: pf.phone, birthdate: pf.birthdate, gender: pf.gender,
          postcode: pf.postcode, address: pf.address, addressDetail: pf.addressDetail,
        });
        /* Pinia store 에도 반영 */
        try {
          const store = window.useFoAuthStore(Pinia.getActivePinia());
          store.svAuthUser = { ...u };
          localStorage.setItem('modu-fo-auth-authUser', JSON.stringify(store.svAuthUser));
        } catch (e) {}
      }
      uiState.profileOpen = false;
    };

    /* fnCallbackModal — 모달 콜백 통합 dispatch. cmd=모달명, param=호출 파라미터, result=응답 결과 (null=닫기) */
    const fnCallbackModal = (cmd, param, result) => {
      if (cmd === 'addr-search') {
        addrSearchModal.show = false;
        if (result == null) { return; }
        pf.postcode = result.zonecode;
        pf.address  = result.address;
        return;
      }
    };

    /* genderLabel — gender 라벨 */
    const genderLabel = g => ({ M: '남성', F: '여성', '': '선택안함' }[g] ?? '선택안함');

    /* openPw — 비밀번호 변경 열기 */
    const openPw = () => { closeUserMenu(); pw.current=''; pw.next=''; pw.next2=''; pw.err=''; pw.ok=false; uiState.pwOpen=true; };

    /* savePw — 저장 */
    const savePw = async () => {
      pw.err = ''; pw.ok = false;
      if (!pw.current) { pw.err = '현재 비밀번호를 입력하세요.'; return; }
      if (pw.next.length < 6) { pw.err = '새 비밀번호는 6자 이상이어야 합니다.'; return; }
      if (pw.next !== pw.next2) { pw.err = '새 비밀번호가 일치하지 않습니다.'; return; }
      try {
        await coApiSvc.foAuth.changePassword({
          currentPassword: pw.current,
          newPassword: pw.next,
        }, '비밀번호변경', '변경');
        pw.ok = true;
        setTimeout(() => { uiState.pwOpen = false; }, 1400);
      } catch (e) {
        pw.err = e.response?.data?.message || '비밀번호 변경 실패';
      }
    };

    /* ── 안전한 사용자 정보 접근 ── */
    const cfAuthUser = computed(() => props?.appAuth?.user || { authNm: '', memberNm: '', email: '' });
    const cfUserFirstChar = computed(() => ((cfAuthUser.value?.authNm || cfAuthUser.value?.memberNm || '').charAt(0)) || '?');
    const cfIsLogin = computed(() => !!(props?.appAuth?.user?.authId));

    /* ── 공통 인풋 스타일 ── */
    const IS = 'width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.88rem;outline:none;';

    /* ── 드롭다운 메뉴 항목 (정적 배열 — computed 불필요) ── */
    const cfMenuItems = [
      { icon: '👤', label: '마이페이지',    action: goMy,         color: 'var(--text-primary)' },
      { icon: '✏️', label: '프로필 수정',   action: openProfile,  color: 'var(--text-primary)' },
      { icon: '🔑', label: '비밀번호 변경', action: openPw,       color: 'var(--text-primary)' },
    ];

    /* 레이어 바깥 클릭 시 닫기 (고정 오버레이는 헤더 z-index 안에 묶여 형제 요소·본문보다 아래로 가는 경우가 있음) */
    let removeUserMenuOutside = null;
    function unbindUserMenuOutside() {
      if (removeUserMenuOutside) {
        removeUserMenuOutside();
        removeUserMenuOutside = null;
      }
    }
    function bindUserMenuOutside() {
      unbindUserMenuOutside();

      /* onPointerDown — 이벤트 */
      const onPointerDown = (e) => {
        if (!uiState.userMenuOpen) { return; }
        const root = userMenuRoot.value;
        if (root && !root.contains(e.target)) { closeUserMenu(); }
      };
      document.addEventListener('pointerdown', onPointerDown, true);
      removeUserMenuOutside = () => document.removeEventListener('pointerdown', onPointerDown, true);
    }
    watch(() => uiState.userMenuOpen, (open) => {
      if (open) { nextTick(() => bindUserMenuOutside()); }
      else { unbindUserMenuOutside(); }
    });
    onUnmounted(() => unbindUserMenuOutside());

    const cfTopMenu = computed(() => window.sfGetFoMenuStore?.()?.svTopMenu || []);

    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes, userMenuRoot, addrSearchModal,                        // 상태 / refs
      handleBtnAction, handleSelectAction, fnCallbackModal,                 // dispatch
      pf, pw, IS, cfMenuItems, genderLabel,                                 // 프로필/비번/입력
      cfAuthUser, cfUserFirstChar, cfIsLogin, cfTopMenu,                    // computed - 인증/메뉴
      foSiteNo: window.FO_SITE_NO || '01',
      boSiteNo: '01', /* BO site_no — FO localStorage 접근 금지, 기본값 고정 */
      cfFoActive: computed(() => window.useFoAppStore?.()?.svActive || '-'),
    };
  },

  template: /* html */ `
<header class="glass" style="height:var(--header-h,60px);min-height:60px;flex-shrink:0;display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:50;border-left:none;border-right:none;border-top:none;">

  <!-- ===== ■. Hamburger (mobile) ====================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <button @click="handleBtnAction('sidebar-toggle-mobile')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;"
    class="lg:hidden" aria-label="메뉴">
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:14px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
  </button>

  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. Collapse toggle (desktop) =============================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <button @click="handleBtnAction('sidebar-toggle-desktop')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:none;align-items:center;color:var(--text-secondary);flex-shrink:0;"
    class="hidden-sm" aria-label="사이드바 토글">
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
  </button>

  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. Logo ==================================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <button @click="handleBtnAction('nav-go-home')" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;flex-shrink:0;padding:0;">
    <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- ===== ■.■.■. 모래 ================================================== -->
      <ellipse cx="30" cy="92" rx="22" ry="6" fill="#d4a017"/>
      <ellipse cx="30" cy="92" rx="18" ry="4" fill="#e6b422"/>
      <!-- ===== ■.■.■. 줄기 ================================================== -->
      <path d="M30 90 Q25 60 35 30" stroke="#b8860b" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M30 90 Q25 60 35 30" stroke="#d4a017" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- ===== ■.■.■. 잎 =================================================== -->
      <path d="M35 30 Q55 10 75 18" stroke="#228B22" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q60 15 78 25" stroke="#2d8f2d" stroke-width="2" fill="none"/>
      <path d="M35 30 Q50 5 70 8" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q20 8 5 15" stroke="#228B22" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q15 12 3 22" stroke="#2d8f2d" stroke-width="2" fill="none"/>
      <path d="M35 30 Q25 5 10 5" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q35 8 40 3" stroke="#228B22" stroke-width="2" fill="none"/>
      <!-- ===== ■.■.■. 열매 ================================================== -->
      <circle cx="40" cy="34" r="5" fill="#8B008B"/>
      <circle cx="48" cy="38" r="5" fill="#dc2626"/>
      <circle cx="44" cy="44" r="5" fill="#2563eb"/>
      <circle cx="35" cy="40" r="4.5" fill="#7c3aed"/>
      <circle cx="52" cy="32" r="4" fill="#dc2626"/>
      <circle cx="50" cy="46" r="4" fill="#2563eb"/>
      <!-- ===== ■.■.■. 하이라이트 =============================================== -->
      <circle cx="38" cy="32" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="46" cy="36" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="42" cy="42" r="1.5" fill="rgba(255,255,255,0.4)"/>
    </svg>
    <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
      <!-- ===== ■.■.■. 영역 ================================================== -->
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.3px;">{{ config.name }}</span>
      <span style="font-size:0.6rem;color:var(--text-muted);font-weight:500;letter-spacing:0.08em;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
        {{ config.tagline }}
        <span class="fo-site-badge"
          :title="'FO_SITE_NO=' + (foSiteNo || '-') + ' BO_SITE_NO=' + (boSiteNo || '-') + ' — 클릭: 메뉴 바로가기'"
          :data-tip="'FO_SITE_NO=' + (foSiteNo || '-') + ' BO_SITE_NO=' + (boSiteNo || '-')"
          style="cursor:pointer;"
          @click.stop="handleBtnAction('siteSwitch-open-quick-menu')">
          <span :style="{fontWeight:800,marginLeft:'4px',color: foSiteNo==='03' ? '#7b1fa2' : foSiteNo==='02' ? '#2e7d6b' : foSiteNo==='9999' ? '#888' : '#9f2946'}">{{ foSiteNo || '-' }}</span>
          <span :style="{fontWeight:800,marginLeft:'3px',color: boSiteNo==='03' ? '#7b1fa2' : boSiteNo==='02' ? '#2e7d6b' : boSiteNo==='9999' ? '#888' : '#9f2946'}">{{ boSiteNo || '-' }}</span>
        </span>
        <span
          :title="'active=' + cfFoActive"
          :style="{
            fontFamily:'monospace', fontSize:'9px', fontWeight:700, padding:'0px 5px',
            borderRadius:'3px', border:'1px solid',
            color: cfFoActive==='prod'?'#fff':cfFoActive==='dev'?'#1565c0':cfFoActive==='local'?'#7a5800':'#555',
            background: cfFoActive==='prod'?'#e53935':cfFoActive==='dev'?'#e3f0fb':cfFoActive==='local'?'#fff59d':'#f0f0f0',
            borderColor: cfFoActive==='prod'?'#c62828':cfFoActive==='dev'?'#90caf9':cfFoActive==='local'?'#f9a825':'#ccc',
          }">{{ cfFoActive }}</span>
      </span>
    </div>
  </button>

  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. Top nav ================================================= -->
  <!-- ===== ■. 영역 ====================================================== -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;">
    <template v-for="m in cfTopMenu" :key="m.menuId">
      <!-- ===== ■.■.■. Site 01은 disp UI 샘플 메뉴 숨김 (samples는 01 에서 제외) ======= -->
      <template v-if="foSiteNo==='01' ? ((m.menuId ? ((m.menuId.startsWith('dispUi') || m.menuId==='divider-disp')) : false)) : false"></template>
      <span v-else-if="m.type==='divider'" style="color:var(--border);padding:0 6px;font-size:1rem;user-select:none;">|</span>
      <button v-else @click="handleSelectAction('nav-select-menu', m.menuId)" class="nav-link" :class="{active: page===m.menuId}">
        <span>{{ m.menuNm }}</span>
      </button>
    </template>
  </nav>

  <!-- ===== □. 영역 ====================================================== -->
  <!-- ===== ■. 우측: 로그인/유저 → 테마 순 ======================================= -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">

    <!-- ===== ■.■. 비로그인 ================================================== -->
    <button v-if="!cfIsLogin" @click="handleBtnAction('nav-show-login')"
      style="padding:7px 16px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:700;white-space:nowrap;transition:all 0.2s;"
      @mouseenter="$event.target.style.background='var(--blue)';$event.target.style.color='#fff';"
      @mouseleave="$event.target.style.background='transparent';$event.target.style.color='var(--blue)';">
      로그인
    </button>

    <!-- ===== □.□. 비로그인 ================================================== -->
    <!-- ===== ■.■. 로그인 상태 ================================================ -->
    <div v-else ref="userMenuRoot" style="position:relative;">
      <button type="button" @click="handleBtnAction('userMenu-toggle')"
        style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;color:var(--text-primary);font-weight:600;">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0;">
          {{ cfUserFirstChar }}
        </span>
        <span class="hidden-sm" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cfAuthUser.authNm || cfAuthUser.memberNm }}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
          :style="uiState.userMenuOpen?'transform:rotate(180deg);transition:0.2s;':'transition:0.2s;'"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <!-- ===== ■.■.■. 드롭다운 ================================================ -->
      <div v-if="uiState.userMenuOpen" @click.stop
        style="position:absolute;right:0;top:calc(100% + 8px);width:196px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 28px rgba(0,0,0,0.13);z-index:100;overflow:hidden;">
        <!-- ===== ■.■.■.■. 사용자 정보 ============================================ -->
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--green));color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:800;flex-shrink:0;">
              {{ cfUserFirstChar }}
            </span>
            <div style="min-width:0;">
              <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cfAuthUser.authNm || cfAuthUser.memberNm }}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ cfAuthUser.email }}</div>
            </div>
          </div>
        </div>

        <!-- ===== ■.■.■.■. 메뉴 항목 ============================================= -->
        <!-- ===== ■.■.■.■. 영역 ================================================ -->
        <div style="padding:4px 0;">
          <button v-for="item in cfMenuItems" :key="item.label" @click="handleSelectAction('userMenu-select-item', item)"
            style="width:100%;padding:10px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.86rem;display:flex;align-items:center;gap:9px;transition:background 0.15s;"
            :style="'color:'+item.color"
            @mouseenter="$event.currentTarget.style.background='var(--blue-dim)'"
            @mouseleave="$event.currentTarget.style.background='transparent'">
            <span style="font-size:1rem;width:18px;text-align:center;">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </div>

        <!-- ===== ■.■.■.■. 로그아웃 ============================================== -->
        <div style="border-top:1px solid var(--border);padding:4px 0;">
          <button @click="handleBtnAction('userMenu-logout')"
            style="width:100%;padding:10px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.86rem;color:#ef4444;display:flex;align-items:center;gap:9px;transition:background 0.15s;"
            @mouseenter="$event.currentTarget.style.background='#fef2f2'"
            @mouseleave="$event.currentTarget.style.background='transparent'">
            <span style="font-size:1rem;width:18px;text-align:center;">🚪</span> 로그아웃
          </button>
        </div>
      </div>
    </div>

    <!-- ===== □.□. 로그인 상태 ================================================ -->
    <!-- ===== ■.■. 좋아요(위시리스트) 아이콘 ======================================== -->
    <!-- ===== ■.■. 버튼 영역 ================================================= -->
    <button type="button" @click="handleBtnAction('nav-go-like')"
      style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1.5px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;flex-shrink:0;transition:border-color 0.2s,background 0.2s;"
      title="위시리스트"
      @mouseenter="$event.currentTarget.style.borderColor='var(--blue)';$event.currentTarget.style.background='var(--blue-dim)'"
      @mouseleave="$event.currentTarget.style.borderColor='var(--border)';$event.currentTarget.style.background='var(--bg-card)'">
      <span style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span v-if="appLikeCount > 0" class="header-cart-badge">{{ appLikeCount > 99 ? '99+' : appLikeCount }}</span>
      </span>
    </button>

    <!-- ===== □.□. 버튼 영역 ================================================= -->
    <!-- ===== ■.■. 장바구니: 아이콘 + 뱃지(개수) ==================================== -->
    <button type="button" @click="handleBtnAction('cart-go')"
      class="header-cart-link"
      style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1.5px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;flex-shrink:0;transition:border-color 0.2s,background 0.2s;"
      :aria-label="appCartCount > 0 ? ('장바구니, ' + (appCartCount > 99 ? '99개 이상' : appCartCount + '개') + ' 상품') : '장바구니, 비어 있음'"
      title="장바구니">
      <span class="header-cart-icon-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--blue);">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span v-if="appCartCount > 0" class="header-cart-badge">{{ appCartCount > 99 ? '99+' : appCartCount }}</span>
      </span>
    </button>

    <!-- ===== □.□. 장바구니: 아이콘 + 뱃지(개수) ==================================== -->
    <!-- ===== ■.■. 테마 토글 (장바구니 오른쪽) ====================================== -->
    <!-- ===== ■.■. 버튼 영역 ================================================= -->
    <button class="theme-toggle" @click="handleBtnAction('theme-toggle')" :title="theme==='light'?'다크 모드로 전환':'라이트 모드로 전환'">
      <span v-if="theme==='light'">🌙</span>
      <span v-else>☀️</span>
    </button>

    <!-- ===== □.□. 버튼 영역 ================================================= -->
    <!-- ===== ■.■. 설정 아이콘 ================================================ -->
    <div data-fo-settings style="position:relative;flex-shrink:0;">
      <button @click="handleBtnAction('settings-toggle')"
        style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:1.5px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;font-size:15px;color:var(--text-secondary);transition:all 0.2s;"
        :style="appShowSettings?'border-color:var(--accent,#c9a96e);background:var(--accent-dim,#fdf8f1);color:var(--accent,#c9a96e);':''"
        title="설정">⚙</button>
      <!-- ===== ■.■.■. 설정 드롭다운 ============================================= -->
      <div v-if="appShowSettings"
        style="position:absolute;right:0;top:calc(100% + 8px);width:180px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.13);z-index:200;overflow:hidden;padding:4px 0;">
        <button @click="handleBtnAction('settings-toggle-api-log')"
          style="width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;text-align:left;font-size:13px;display:flex;align-items:center;gap:8px;color:var(--text-primary);transition:background 0.15s;"
          :style="appShowApiLog?'background:var(--accent-dim,#fdf8f1);color:var(--accent,#c9a96e);font-weight:700;':''"
          @mouseenter="$event.currentTarget.style.background='var(--blue-dim,#f0f4ff)'"
          @mouseleave="$event.currentTarget.style.background=appShowApiLog?'var(--accent-dim,#fdf8f1)':'transparent'">
          <span style="font-size:13px;">🌐</span>
          <span>API 로그 보기</span>
          <span v-if="appApiLogs ? (appApiLogs.length) : false" style="margin-left:auto;font-size:10px;background:#e8e8e8;border-radius:8px;padding:1px 5px;color:#666;">{{ appApiLogs.length }}</span>
        </button>
        <button @click="handleBtnAction('settings-toggle-api-toast')"
          style="width:100%;padding:10px 14px;border:none;background:none;cursor:pointer;text-align:left;font-size:13px;display:flex;align-items:center;gap:8px;color:var(--text-primary);transition:background 0.15s;"
          :style="appApiToast?'background:var(--accent-dim,#fdf8f1);color:var(--accent,#c9a96e);font-weight:700;':''"
          @mouseenter="$event.currentTarget.style.background='var(--blue-dim,#f0f4ff)'"
          @mouseleave="$event.currentTarget.style.background=appApiToast?'var(--accent-dim,#fdf8f1)':'transparent'">
          <span style="font-size:13px;">🔔</span>
          <span>API 토스트 출력</span>
          <span style="margin-left:auto;font-size:10px;border-radius:8px;padding:1px 6px;font-weight:700;" :style="appApiToast?'background:var(--accent,#c9a96e);color:#fff;':'background:#e8e8e8;color:#888;'">{{ appApiToast ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
    </div>
  </div>

    <!-- ===== □.□. 설정 아이콘 ================================================ -->
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. ══ Profile 모달 ══ ======================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <Teleport to="body">
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="uiState.profileOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="handleBtnAction('profile-close')">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:440px;max-height:88vh;overflow-y:auto;padding:28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <button @click="handleBtnAction('profile-close')" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

      <div style="margin-bottom:22px;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">✏️ 프로필 수정</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">회원 정보를 수정하세요</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <!-- ===== ■.■.■.■. 이름 ================================================ -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">이름 <span style="color:var(--blue);">*</span></div>
          <input v-model="pf.memberNm" :style="IS" placeholder="이름">
        </div>
        <!-- ===== ■.■.■.■. 이메일 (읽기전용) ======================================== -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">이메일</div>
          <input v-model="pf.email" :style="IS.replace('var(--bg-card)','var(--bg-base)')" readonly style="cursor:default;">
        </div>
        <!-- ===== ■.■.■.■. 휴대폰 =============================================== -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">휴대폰</div>
          <input v-model="pf.phone" :style="IS" placeholder="010-0000-0000">
        </div>
        <!-- ===== ■.■.■.■. 주소 ================================================ -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">주소</div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            <input v-model="pf.postcode" placeholder="우편번호" readonly
              style="width:100px;flex-shrink:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;cursor:default;outline:none;">
            <button @click="handleBtnAction('profile-search-addr')" type="button"
              style="padding:0 14px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">
              📮 주소 검색
            </button>
          </div>
          <input v-model="pf.address" placeholder="도로명 주소" readonly
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;cursor:default;outline:none;margin-bottom:6px;">
          <input v-model="pf.addressDetail" :style="IS" placeholder="상세 주소 (동/호수 등)">
        </div>
        <!-- ===== ■.■.■.■. 생년월일 + 성별 ========================================= -->
        <!-- ===== ■.■.■.■. 영역 ================================================ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">생년월일</div>
            <input v-model="pf.birthdate" type="date"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;outline:none;">
          </div>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">성별</div>
            <div style="display:flex;gap:5px;">
              <button v-for="g in [{v:'M',l:'남'},{v:'F',l:'여'},{v:'',l:'미정'}]" :key="g.v"
                @click="handleSelectAction('profile-select-gender', g.v)" type="button"
                style="flex:1;padding:9px 2px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.15s;"
                :style="pf.gender===g.v?'background:var(--blue);color:#fff;border:1.5px solid var(--blue);':'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
                {{ g.l }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:22px;">
        <button @click="handleBtnAction('profile-close')"
          style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:600;">취소</button>
        <button @click="handleBtnAction('profile-save')" :disabled="!pf.memberNm.trim()"
          style="flex:2;padding:12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.88rem;font-weight:700;"
          :style="!pf.memberNm.trim()?'opacity:0.5;cursor:not-allowed;':''">저장</button>
      </div>
    </div>
  </div>
  </Teleport>
  <!-- ===== ■. 주소 검색 모달 (카카오 우편번호, 인라인 레이어) ============================ -->
  <fo-addr-search-modal v-if="addrSearchModal.show" modal-name="addr-search" :on-callback="fnCallbackModal" />

  <!-- ===== □. 조건부 영역 ================================================== -->
  <!-- ===== ■. ══ 비밀번호 변경 모달 ══ ======================================== -->
  <!-- ===== ■. 영역 ====================================================== -->
  <Teleport to="body">
  <!-- ===== ■. 조건부 영역 ================================================== -->
  <div v-if="uiState.pwOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="handleBtnAction('pw-close')">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:400px;padding:28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <button @click="handleBtnAction('pw-close')" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

      <div style="margin-bottom:22px;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">🔑 비밀번호 변경</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">현재 비밀번호 확인 후 변경할 수 있습니다</div>
      </div>

      <!-- ===== ■.■.■. 성공 상태 =============================================== -->
      <div v-if="pw.ok" style="text-align:center;padding:20px 0;">
        <div style="font-size:2.5rem;margin-bottom:12px;">✅</div>
        <div style="font-size:1rem;font-weight:700;color:#22c55e;">비밀번호가 변경되었습니다!</div>
      </div>

      <div v-else style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">현재 비밀번호</div>
          <input v-model="pw.current" type="password" :style="IS" placeholder="현재 비밀번호 입력">
        </div>
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">새 비밀번호 <span style="font-size:0.72rem;">(6자 이상)</span></div>
          <input v-model="pw.next" type="password" :style="IS" placeholder="새 비밀번호 입력">
        </div>
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">새 비밀번호 확인</div>
          <input v-model="pw.next2" type="password" :style="IS" placeholder="새 비밀번호 재입력" @keyup.enter="handleBtnAction('pw-save')">
        </div>

        <!-- ===== ■.■.■.■. 비번 강도 표시 ========================================== -->
        <!-- ===== ■.■.■.■. 조건부 영역 ============================================ -->
        <div v-if="pw.next" style="display:flex;gap:4px;align-items:center;">
          <div v-for="i in 4" :key="i" style="flex:1;height:3px;border-radius:2px;transition:background 0.2s;"
            :style="i <= (pw.next.length<6?1:pw.next.length<8?2:pw.next.match(/[^a-zA-Z0-9]/)?4:3) ? 'background:var(--blue);' : 'background:var(--border);'"></div>
          <span style="font-size:0.72rem;color:var(--text-muted);margin-left:6px;white-space:nowrap;">
            {{ pw.next.length<6?'약함':pw.next.length<8?'보통':pw.next.match(/[^a-zA-Z0-9]/)?'강함':'양호' }}
          </span>
        </div>

        <div v-if="pw.err" style="color:#ef4444;font-size:0.82rem;padding:8px 12px;background:#fef2f2;border-radius:6px;">{{ pw.err }}</div>

        <div style="display:flex;gap:10px;margin-top:8px;">
          <button @click="handleBtnAction('pw-close')"
            style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:600;">취소</button>
          <button @click="handleBtnAction('pw-save')"
            style="flex:2;padding:12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.88rem;font-weight:700;">변경하기</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>

</header>

  <!-- ===== □. 조건부 영역 ================================================== -->`,
};
