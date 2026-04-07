/* ShopJoy - AppHeader */
window.AppHeader = {
  name: 'AppHeader',
  props: ['page', 'theme', 'sidebarOpen', 'mobileOpen', 'config', 'navigate',
          'toggleTheme', 'cartCount', 'auth', 'onShowLogin', 'onLogout'],
  emits: ['toggle-sidebar', 'toggle-mobile'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    /* ── 유저 드롭다운 ── */
    const userMenuOpen = ref(false);
    const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value; };
    const closeUserMenu  = () => { userMenuOpen.value = false; };
    const goMy    = () => { closeUserMenu(); props.navigate('my'); };
    const doLogout = () => { closeUserMenu(); props.onLogout(); };

    /* ── Profile 모달 ── */
    const profileOpen = ref(false);
    const pf = reactive({ name: '', email: '', phone: '', birthdate: '', gender: '',
                          postcode: '', address: '', addressDetail: '' });
    const openProfile = () => {
      closeUserMenu();
      const u = props.auth.user || {};
      pf.name = u.name || ''; pf.email = u.email || ''; pf.phone = u.phone || '';
      pf.birthdate = u.birthdate || ''; pf.gender = u.gender || '';
      pf.postcode = u.postcode || ''; pf.address = u.address || '';
      pf.addressDetail = u.addressDetail || '';
      profileOpen.value = true;
    };
    const saveProfile = () => {
      if (!pf.name.trim()) return;
      const u = props.auth.user;
      if (u) {
        Object.assign(u, {
          name: pf.name, phone: pf.phone, birthdate: pf.birthdate, gender: pf.gender,
          postcode: pf.postcode, address: pf.address, addressDetail: pf.addressDetail,
        });
        /* Pinia store 에도 반영 */
        try {
          const store = window.useAuthStore(Pinia.getActivePinia());
          store.user = { ...u };
          localStorage.setItem('shopjoy_user', JSON.stringify(store.user));
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
        const res = await window.axiosApi.get('base/users.json');
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

    return {
      userMenuOpen, toggleUserMenu, closeUserMenu, goMy, doLogout, menuItems,
      profileOpen, pf, openProfile, saveProfile, openKakaoAddrProfile, genderLabel,
      pwOpen, pw, openPw, savePw, IS,
    };
  },

  template: /* html */ `
<header class="glass" style="height:var(--header-h);display:flex;align-items:center;padding:0 20px;gap:14px;position:sticky;top:0;z-index:50;border-left:none;border-right:none;border-top:none;">

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
  <button @click="navigate('home')" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex-shrink:0;padding:0;">
    <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--green));display:flex;align-items:center;justify-content:center;font-size:1rem;">👗</div>
    <div style="display:flex;flex-direction:column;line-height:1.1;text-align:left;">
      <span style="font-size:0.95rem;font-weight:800;color:var(--text-primary);">{{ config.name }}</span>
      <span style="font-size:0.65rem;color:var(--text-muted);font-weight:500;letter-spacing:0.08em;">{{ config.tagline }}</span>
    </div>
  </button>

  <!-- Top nav -->
  <nav style="flex:1;display:flex;align-items:center;gap:2px;overflow-x:auto;padding:0 8px;scrollbar-width:none;">
    <button v-for="m in config.topMenu" :key="m.menuId" @click="navigate(m.menuId)"
      class="nav-link" :class="{active: page===m.menuId}">
      <span v-if="m.menuId==='cart'" style="position:relative;display:inline-block;">
        {{ m.menuName }}
        <span v-if="cartCount>0" class="cart-badge">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </span>
      <span v-else>{{ m.menuName }}</span>
    </button>
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
    <div v-else style="position:relative;">
      <button @click="toggleUserMenu"
        style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;color:var(--text-primary);font-weight:600;">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0;">
          {{ auth.user.name.charAt(0) }}
        </span>
        <span class="hidden-sm" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.name }}</span>
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
              {{ auth.user.name.charAt(0) }}
            </span>
            <div style="min-width:0;">
              <div style="font-size:0.88rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ auth.user.name }}</div>
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

      <!-- 드롭다운 오버레이 -->
      <div v-if="userMenuOpen" @click="closeUserMenu" style="position:fixed;inset:0;z-index:99;"></div>
    </div>

    <!-- 테마 토글 (사용자명 오른쪽) -->
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
          <input v-model="pf.name" :style="IS" placeholder="이름">
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
        <button @click="saveProfile" :disabled="!pf.name.trim()"
          style="flex:2;padding:12px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.88rem;font-weight:700;"
          :style="!pf.name.trim()?'opacity:0.5;cursor:not-allowed;':''">저장</button>
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
