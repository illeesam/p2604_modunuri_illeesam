/* ShopJoy - AppHeader */
window.frontAppHeader = {
  name: 'FrontAppHeader',
  props: ['page', 'theme', 'sidebarOpen', 'mobileOpen', 'config', 'navigate',
          'toggleTheme', 'cartCount', 'likeCount', 'auth', 'onShowLogin', 'onLogout'],
  emits: ['toggle-sidebar', 'toggle-mobile'],
  setup(props) {
    const { ref, reactive, computed, watch, onUnmounted, nextTick } = Vue;

    /* ── 유저 드롭다운 ── */
    const userMenuOpen = ref(false);
    const userMenuRoot = ref(null);
    const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value; };
    const closeUserMenu  = () => { userMenuOpen.value = false; };
    const goMy    = () => { closeUserMenu(); props.navigate('myOrder'); };
    const doLogout = () => { closeUserMenu(); props.onLogout(); };

    /* ── Profile 모달 ── */
    const profileOpen = ref(false);
    const pf = reactive({ memberNm: '', email: '', phone: '', birthdate: '', gender: '',
                          postcode: '', address: '', addressDetail: '' });
    const openProfile = () => {
      closeUserMenu();
      const u = props.auth.user || {};
      pf.memberNm = u.memberNm || ''; pf.email = u.email || ''; pf.phone = u.phone || '';
      pf.birthdate = u.birthdate || ''; pf.gender = u.gender || '';
      pf.postcode = u.postcode || ''; pf.address = u.address || '';
      pf.addressDetail = u.addressDetail || '';
      profileOpen.value = true;
    };
    const saveProfile = () => {
      if (!pf.memberNm.trim()) return;
      const u = props.auth.user;
      if (u) {
        Object.assign(u, {
          memberNm: pf.memberNm, phone: pf.phone, birthdate: pf.birthdate, gender: pf.gender,
          postcode: pf.postcode, address: pf.address, addressDetail: pf.addressDetail,
        });
        /* Pinia store 에도 반영 */
        try {
          const store = window.useFrontAuthStore(Pinia.getActivePinia());
          store.user = { ...u };
          localStorage.setItem('modu-front-user', JSON.stringify(store.user));
        } catch (e) {}
      }
      profileOpen.value = false;
    };
    const openKakaoAddrProfile = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) return;
      new daum.Postcode({ oncomplete(d) {
        pf.postcode = d.zonecode;
        pf.address  = d.roadAddress || d.jibunAddress;
      }}).open();
    };
    const genderLabel = g => ({ M: '남성', F: '여성', '': '선택안함' }[g] ?? '선택안함');

    /* ── 비밀번호 변경 모달 ── */
    const pwOpen = ref(false);
    const pw = reactive({ current: '', next: '', next2: '', err: '', ok: false });
    const openPw = () => { closeUserMenu(); pw.current=''; pw.next=''; pw.next2=''; pw.err=''; pw.ok=false; pwOpen.value=true; };
    const savePw = async () => {
      pw.err = ''; pw.ok = false;
      if (!pw.current) { pw.err = '현재 비밀번호를 입력하세요.'; return; }
      if (pw.next.length < 6) { pw.err = '새 비밀번호는 6자 이상이어야 합니다.'; return; }
      if (pw.next !== pw.next2) { pw.err = '새 비밀번호가 일치하지 않습니다.'; return; }
      /* 데모: users.json에서 현재 비번 확인 */
      try {
        const res = await window.frontApi.get('base/users.json');
        const u = res.data.find(x => x.email === props.auth.user?.email);
        if (u && u.password !== pw.current) { pw.err = '현재 비밀번호가 올바르지 않습니다.'; return; }
      } catch (e) {}
      pw.ok = true;
      setTimeout(() => { pwOpen.value = false; }, 1400);
    };

    /* ── 공통 인풋 스타일 ── */
    const IS = 'width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.88rem;outline:none;';

    /* ── 드롭다운 메뉴 항목 ── */
    const menuItems = computed(() => [
      { icon: '👤', label: '마이페이지',    action: goMy,         color: 'var(--text-primary)' },
      { icon: '✏️', label: '프로필 수정',   action: openProfile,  color: 'var(--text-primary)' },
      { icon: '🔑', label: '비밀번호 변경', action: openPw,       color: 'var(--text-primary)' },
    ]);

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
      const onPointerDown = (e) => {
        if (!userMenuOpen.value) return;
        const root = userMenuRoot.value;
        if (root && !root.contains(e.target)) closeUserMenu();
      };
      document.addEventListener('pointerdown', onPointerDown, true);
      removeUserMenuOutside = () => document.removeEventListener('pointerdown', onPointerDown, true);
    }
    watch(userMenuOpen, (open) => {
      if (open) nextTick(() => bindUserMenuOutside());
      else unbindUserMenuOutside();
    });
    onUnmounted(() => unbindUserMenuOutside());

    return {
      userMenuRoot,
      userMenuOpen, toggleUserMenu, closeUserMenu, goMy, doLogout, menuItems,
      profileOpen, pf, openProfile, saveProfile, openKakaoAddrProfile, genderLabel,
      pwOpen, pw, openPw, savePw, IS,
      frontSiteNo: window.FRONT_SITE_NO || '01',
      adminSiteNo: (typeof localStorage !== 'undefined' && localStorage.getItem('modu-admin-site_no')) || '01',
      openQuickMenu: () => window.dispatchEvent(new CustomEvent('open-quick-menu')),
    };
  },

  template: /* html */ `
<header class="glass" style="height:var(--header-h,60px);min-height:60px;flex-shrink:0;display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:50;border-left:none;border-right:none;border-top:none;">

  <!-- Hamburger (mobile) -->
  <button @click="$emit('toggle-mobile')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;"
    class="lg:hidden" aria-label="메뉴">
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:20px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
    <span style="display:block;width:14px;height:2px;background:var(--text-primary);border-radius:2px;transition:all 0.25s;"></span>
  </button>

  <!-- Collapse toggle (desktop) -->
  <button @click="$emit('toggle-sidebar')"
    style="background:none;border:none;cursor:pointer;padding:6px;display:none;align-items:center;color:var(--text-secondary);flex-shrink:0;"
    class="hidden-sm" aria-label="사이드바 토글">
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
  </button>

  <!-- Logo -->
  <button @click="navigate('home')" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;flex-shrink:0;padding:0;">
    <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 모래 -->
      <ellipse cx="30" cy="92" rx="22" ry="6" fill="#d4a017"/>
      <ellipse cx="30" cy="92" rx="18" ry="4" fill="#e6b422"/>
      <!-- 줄기 -->
      <path d="M30 90 Q25 60 35 30" stroke="#b8860b" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M30 90 Q25 60 35 30" stroke="#d4a017" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- 잎 -->
      <path d="M35 30 Q55 10 75 18" stroke="#228B22" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q60 15 78 25" stroke="#2d8f2d" stroke-width="2" fill="none"/>
      <path d="M35 30 Q50 5 70 8" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q20 8 5 15" stroke="#228B22" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q15 12 3 22" stroke="#2d8f2d" stroke-width="2" fill="none"/>
      <path d="M35 30 Q25 5 10 5" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
      <path d="M35 30 Q35 8 40 3" stroke="#228B22" stroke-width="2" fill="none"/>
      <!-- 열매 -->
      <circle cx="40" cy="34" r="5" fill="#8B008B"/>
      <circle cx="48" cy="38" r="5" fill="#dc2626"/>
      <circle cx="44" cy="44" r="5" fill="#2563eb"/>
      <circle cx="35" cy="40" r="4.5" fill="#7c3aed"/>
      <circle cx="52" cy="32" r="4" fill="#dc2626"/>
      <circle cx="50" cy="46" r="4" fill="#2563eb"/>
      <!-- 하이라이트 -->
      <circle cx="38" cy="32" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="46" cy="36" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="42" cy="42" r="1.5" fill="rgba(255,255,255,0.4)"/>
    </svg>
    <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.3px;">{{ config.name }}</span>
      <span style="font-size:0.6rem;color:var(--text-muted);font-weight:500;letter-spacing:0.08em;">
        {{ config.tagline }}
        <span class="front-site-badge"
          :title="'FRONT_SITE_NO=' + (frontSiteNo || '-') + ' ADMIN_SITE_NO=' + (adminSiteNo || '-') + ' — 클릭: 메뉴 바로가기'"
          :data-tip="'FRONT_SITE_NO=' + (frontSiteNo || '-') + ' ADMIN_SITE_NO=' + (adminSiteNo || '-')"
          style="cursor:pointer;"
          @click.stop="openQuickMenu">
          <span :style="{fontWeight:800,marginLeft:'4px',color: frontSiteNo==='03' ? '#7b1fa2' : frontSiteNo==='02' ? '#2e7d6b' : frontSiteNo==='9999' ? '#888' : '#9f2946'}">{{ frontSiteNo || '-' }}</span>
          <span :style="{fontWeight:800,marginLeft:'3px',color: adminSiteNo==='03' ? '#7b1fa2' : adminSiteNo==='02' ? '#2e7d6b' : adminSiteNo==='9999' ? '#888' : '#9f2946'}">{{ adminSiteNo || '-' }}</span>
        </span>
      </span>
    </div>
  </button>

  <!-- Top nav -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;">
    <template v-for="m in config.topMenu" :key="m.menuId">
      <!-- Site 01은 disp UI 샘플 메뉴 숨김 (samples는 01 에서 제외) -->
      <template v-if="frontSiteNo==='01' && (m.menuId && (m.menuId.startsWith('dispUi') || m.menuId==='divider-disp'))"></template>
      <span v-else-if="m.type==='divider'" style="color:var(--border);padding:0 6px;font-size:1rem;user-select:none;">|</span>
      <button v-else @click="navigate(m.menuId)" class="nav-link" :class="{active: page===m.menuId}">
        <span>{{ m.menuNm }}</span>
      </button>
    </template>
  </nav>

  <!-- 우측: 로그인/유저 → 테마 순 -->
  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">

    <!-- 비로그인 -->
    <button v-if="!auth.user" @click="onShowLogin"
      style="padding:7px 16px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:700;white-space:nowrap;transition:all 0.2s;"
      @mouseenter="$event.target.style.background='var(--blue)';$event.target.style.color='#fff';"
      @mouseleave="$event.target.style.background='transparent';$event.target.style.color='var(--blue)';">
      로그인
    </button>

    <!-- 로그인 상태 -->
    <div v-else ref="userMenuRoot" style="position:relative;">
      <button type="button" @click="toggleUserMenu"
        style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;color:var(--text-primary);font-weight:600;">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0;">
          {{ auth.user.memberNm.charAt(0) }}
        </span>
        <span class="hidden-sm" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.memberNm }}</span>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
          :style="userMenuOpen?'transform:rotate(180deg);transition:0.2s;':'transition:0.2s;'"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <!-- 드롭다운 -->
      <div v-if="userMenuOpen" @click.stop
        style="position:absolute;right:0;top:calc(100% + 8px);width:196px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 28px rgba(0,0,0,0.13);z-index:100;overflow:hidden;">
        <!-- 사용자 정보 -->
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--green));color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:800;flex-shrink:0;">
              {{ auth.user.memberNm.charAt(0) }}
            </span>
            <div style="min-width:0;">
              <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.memberNm }}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.email }}</div>
            </div>
          </div>
        </div>

        <!-- 메뉴 항목 -->
        <div style="padding:4px 0;">
          <button v-for="item in menuItems" :key="item.label" @click="item.action()"
            style="width:100%;padding:10px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.86rem;display:flex;align-items:center;gap:9px;transition:background 0.15s;"
            :style="'color:'+item.color"
            @mouseenter="$event.currentTarget.style.background='var(--blue-dim)'"
            @mouseleave="$event.currentTarget.style.background='transparent'">
            <span style="font-size:1rem;width:18px;text-align:center;">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </div>

        <!-- 로그아웃 -->
        <div style="border-top:1px solid var(--border);padding:4px 0;">
          <button @click="doLogout"
            style="width:100%;padding:10px 16px;border:none;background:none;cursor:pointer;text-align:left;font-size:0.86rem;color:#ef4444;display:flex;align-items:center;gap:9px;transition:background 0.15s;"
            @mouseenter="$event.currentTarget.style.background='#fef2f2'"
            @mouseleave="$event.currentTarget.style.background='transparent'">
            <span style="font-size:1rem;width:18px;text-align:center;">🚪</span> 로그아웃
          </button>
        </div>
      </div>
    </div>

    <!-- 좋아요(위시리스트) 아이콘 -->
    <button type="button" @click="navigate('like'); closeUserMenu()"
      style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1.5px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;flex-shrink:0;transition:border-color 0.2s,background 0.2s;"
      title="위시리스트"
      @mouseenter="$event.currentTarget.style.borderColor='var(--blue)';$event.currentTarget.style.background='var(--blue-dim)'"
      @mouseleave="$event.currentTarget.style.borderColor='var(--border)';$event.currentTarget.style.background='var(--bg-card)'">
      <span style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span v-if="likeCount > 0" class="header-cart-badge">{{ likeCount > 99 ? '99+' : likeCount }}</span>
      </span>
    </button>

    <!-- 장바구니: 아이콘 + 뱃지(개수) -->
    <button type="button" @click="navigate('cart'); closeUserMenu()"
      class="header-cart-link"
      style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1.5px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;flex-shrink:0;transition:border-color 0.2s,background 0.2s;"
      :aria-label="cartCount > 0 ? ('장바구니, ' + (cartCount > 99 ? '99개 이상' : cartCount + '개') + ' 상품') : '장바구니, 비어 있음'"
      title="장바구니">
      <span class="header-cart-icon-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--blue);">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span v-if="cartCount > 0" class="header-cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </span>
    </button>

    <!-- 테마 토글 (장바구니 오른쪽) -->
    <button class="theme-toggle" @click="toggleTheme" :title="theme==='light'?'다크 모드로 전환':'라이트 모드로 전환'">
      <span v-if="theme==='light'">🌙</span>
      <span v-else>☀️</span>
    </button>
  </div>

  <!-- ══ Profile 모달 ══ -->
  <Teleport to="body">
  <div v-if="profileOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="profileOpen=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:440px;max-height:88vh;overflow-y:auto;padding:28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <button @click="profileOpen=false" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

      <div style="margin-bottom:22px;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">✏️ 프로필 수정</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">회원 정보를 수정하세요</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <!-- 이름 -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">이름 <span style="color:var(--blue);">*</span></div>
          <input v-model="pf.memberNm" :style="IS" placeholder="이름">
        </div>
        <!-- 이메일 (읽기전용) -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">이메일</div>
          <input v-model="pf.email" :style="IS.replace('var(--bg-card)','var(--bg-base)')" readonly style="cursor:default;">
        </div>
        <!-- 휴대폰 -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">휴대폰</div>
          <input v-model="pf.phone" :style="IS" placeholder="010-0000-0000">
        </div>
        <!-- 주소 -->
        <div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">주소</div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            <input v-model="pf.postcode" placeholder="우편번호" readonly
              style="width:100px;flex-shrink:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;cursor:default;outline:none;">
            <button @click="openKakaoAddrProfile" type="button"
              style="padding:0 14px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">
              📮 주소 검색
            </button>
          </div>
          <input v-model="pf.address" placeholder="도로명 주소" readonly
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;cursor:default;outline:none;margin-bottom:6px;">
          <input v-model="pf.addressDetail" :style="IS" placeholder="상세 주소 (동/호수 등)">
        </div>
        <!-- 생년월일 + 성별 -->
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
                @click="pf.gender=g.v" type="button"
                style="flex:1;padding:9px 2px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.15s;"
                :style="pf.gender===g.v?'background:var(--blue);color:#fff;border:1.5px solid var(--blue);':'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
                {{ g.l }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:22px;">
        <button @click="profileOpen=false"
          style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:600;">취소</button>
        <button @click="saveProfile" :disabled="!pf.memberNm.trim()"
          style="flex:2;padding:12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.88rem;font-weight:700;"
          :style="!pf.memberNm.trim()?'opacity:0.5;cursor:not-allowed;':''">저장</button>
      </div>
    </div>
  </div>
  </Teleport>

  <!-- ══ 비밀번호 변경 모달 ══ -->
  <Teleport to="body">
  <div v-if="pwOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="pwOpen=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:400px;padding:28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <button @click="pwOpen=false" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

      <div style="margin-bottom:22px;">
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">🔑 비밀번호 변경</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">현재 비밀번호 확인 후 변경할 수 있습니다</div>
      </div>

      <!-- 성공 상태 -->
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
          <input v-model="pw.next2" type="password" :style="IS" placeholder="새 비밀번호 재입력" @keyup.enter="savePw">
        </div>

        <!-- 비번 강도 표시 -->
        <div v-if="pw.next" style="display:flex;gap:4px;align-items:center;">
          <div v-for="i in 4" :key="i" style="flex:1;height:3px;border-radius:2px;transition:background 0.2s;"
            :style="i <= (pw.next.length<6?1:pw.next.length<8?2:pw.next.match(/[^a-zA-Z0-9]/)?4:3) ? 'background:var(--blue);' : 'background:var(--border);'"></div>
          <span style="font-size:0.72rem;color:var(--text-muted);margin-left:6px;white-space:nowrap;">
            {{ pw.next.length<6?'약함':pw.next.length<8?'보통':pw.next.match(/[^a-zA-Z0-9]/)?'강함':'양호' }}
          </span>
        </div>

        <div v-if="pw.err" style="color:#ef4444;font-size:0.82rem;padding:8px 12px;background:#fef2f2;border-radius:6px;">{{ pw.err }}</div>

        <div style="display:flex;gap:10px;margin-top:8px;">
          <button @click="pwOpen=false"
            style="flex:1;padding:12px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:600;">취소</button>
          <button @click="savePw"
            style="flex:2;padding:12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.88rem;font-weight:700;">변경하기</button>
        </div>
      </div>
    </div>
  </div>
  </Teleport>

</header>
  `,
};
