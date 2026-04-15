/* ShopJoy - AppFooter */
window.frontAppFooter = {
  name: 'FrontAppFooter',
  props: ['config', 'navigate'],
  emits: [],
  setup() {
    const { ref } = Vue;
    const menuOpen = ref(false);
    const toggleMenu = () => { menuOpen.value = !menuOpen.value; };
    const closeMenu  = () => { menuOpen.value = false; };
    /* 외부(헤더 등)에서 팝업 오픈 요청 수신 */
    window.addEventListener('open-quick-menu', () => { menuOpen.value = true; });
    const goItem = (root, target) => {
      if (root === 'frontOffice') {
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + (target ? '#page=' + target : '');
        if (target && typeof window.navigate === 'function') window.navigate(target);
      } else if (root === 'backOffice') {
        window.open((window.pageUrl ? window.pageUrl('admin.html') : 'admin.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'dispFrontUi') {
        window.open((window.pageUrl ? window.pageUrl('disp-front-ui.html') : 'disp-front-ui.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'dispAdminUi') {
        window.open((window.pageUrl ? window.pageUrl('disp-admin-ui.html') : 'disp-admin-ui.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'frontSite') {
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?FRONT_SITE_NO=' + target;
      } else if (root === 'frontOnly') {
        /* target = FRONT 번호만, index.html 이동 */
        try { localStorage.setItem('modu-front-site_no', target); } catch(_){}
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?FRONT_SITE_NO=' + target;
      } else if (root === 'backOnly') {
        /* target = BACK 번호만, admin.html 새창 오픈 */
        try { localStorage.setItem('modu-admin-site_no', target); } catch(_){}
        window.open((window.pageUrl ? window.pageUrl('admin.html') : 'admin.html') + '?ADMIN_SITE_NO=' + target, '_blank');
      }
      menuOpen.value = false;
    };
    const currentSiteNo  = window.FRONT_SITE_NO || '01';
    const currentAdminNo = (typeof localStorage !== 'undefined' && localStorage.getItem('modu-admin-site_no')) || '01';

    const FRONT_MENU = [
      { id:'home',       label:'홈',         icon:'🏠' },
      { id:'prodList', label:'상품목록',    icon:'🛍' },
      { id:'cart',       label:'장바구니',    icon:'🛒' },
      { id:'order',      label:'주문하기',    icon:'📋' },
      { id:'like',       label:'찜 목록',     icon:'💝' },
      { id:'event',      label:'이벤트',      icon:'🎉' },
      { id:'blog',       label:'블로그',      icon:'📝' },
      { id:'faq',        label:'FAQ',        icon:'❓' },
      { id:'contact',    label:'고객센터',    icon:'📞' },
      { id:'location',   label:'위치안내',    icon:'📍' },
      { id:'about',      label:'회사소개',    icon:'ℹ' },
      { id:'myOrder',    label:'마이 - 주문',  icon:'📦' },
      { id:'myCoupon',   label:'마이 - 쿠폰',  icon:'🎟' },
      { id:'myCache',    label:'마이 - 캐시',  icon:'💰' },
      { id:'myContact',  label:'마이 - 문의',  icon:'💬' },
    ];
    const BACK_MENU = [
      { id:'dashboard',           label:'대시보드',         icon:'📊' },
      { id:'ecMemberMng',         label:'회원관리',         icon:'👥' },
      { id:'ecProdMng',           label:'상품관리',         icon:'📦' },
      { id:'ecOrderMng',          label:'주문관리',         icon:'📋' },
      { id:'ecDispUiMng',         label:'전시UI관리',       icon:'🎨' },
      { id:'ecDispAreaMng',       label:'전시영역관리',     icon:'🗂' },
      { id:'ecDispPanelMng',      label:'전시패널관리',     icon:'🪟' },
      { id:'ecDispWidgetMng',     label:'전시위젯관리',     icon:'🧩' },
      { id:'ecDispWidgetLibMng',  label:'전시위젯Lib',      icon:'📚' },
      { id:'ecDispUiSimul',       label:'전시UI시뮬레이션', icon:'🖼' },
    ];
    const DISP_MENU = [
      { id:'dispUiPage', label:'통합 페이지',  icon:'🌐' },
      { id:'dispUi01',   label:'UI 샘플 01',  icon:'1️⃣' },
      { id:'dispUi02',   label:'UI 샘플 02',  icon:'2️⃣' },
      { id:'dispUi03',   label:'UI 샘플 03',  icon:'3️⃣' },
      { id:'dispUi04',   label:'UI 샘플 04',  icon:'4️⃣' },
      { id:'dispUi05',   label:'UI 샘플 05',  icon:'5️⃣' },
      { id:'dispUi06',   label:'UI 샘플 06',  icon:'6️⃣' },
    ];
    const SITE_MENU = [
      { id:'01',   label:'FRONT_SITE_NO=01' },
      { id:'02',   label:'FRONT_SITE_NO=02' },
      { id:'03',   label:'FRONT_SITE_NO=03' },
      { id:'9999', label:'FRONT_SITE_NO=9999' },
    ];
    const SITE_PAIR_MENU = [
      { front:'01',   admin:'01' },
      { front:'02',   admin:'02' },
      { front:'03',   admin:'03' },
      { front:'9999', admin:'9999' },
    ];
    return { menuOpen, toggleMenu, closeMenu, goItem, currentSiteNo, currentAdminNo, FRONT_MENU, BACK_MENU, DISP_MENU, SITE_MENU, SITE_PAIR_MENU };
  },
  template: /* html */ `
<footer style="padding:28px 32px;">
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="92" rx="22" ry="6" fill="#d4a017"/>
        <ellipse cx="30" cy="92" rx="18" ry="4" fill="#e6b422"/>
        <path d="M30 90 Q25 60 35 30" stroke="#b8860b" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M30 90 Q25 60 35 30" stroke="#d4a017" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M35 30 Q55 10 75 18" stroke="#228B22" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q60 15 78 25" stroke="#2d8f2d" stroke-width="2" fill="none"/>
        <path d="M35 30 Q50 5 70 8" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q20 8 5 15" stroke="#228B22" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q15 12 3 22" stroke="#2d8f2d" stroke-width="2" fill="none"/>
        <path d="M35 30 Q25 5 10 5" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q35 8 40 3" stroke="#228B22" stroke-width="2" fill="none"/>
        <circle cx="40" cy="34" r="5" fill="#8B008B"/>
        <circle cx="48" cy="38" r="5" fill="#dc2626"/>
        <circle cx="44" cy="44" r="5" fill="#2563eb"/>
        <circle cx="35" cy="40" r="4.5" fill="#7c3aed"/>
        <circle cx="52" cy="32" r="4" fill="#dc2626"/>
        <circle cx="50" cy="46" r="4" fill="#2563eb"/>
        <circle cx="38" cy="32" r="1.5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="46" cy="36" r="1.5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="42" cy="42" r="1.5" fill="rgba(255,255,255,0.4)"/>
      </svg>
      <span style="font-weight:700;color:var(--text-secondary);font-size:0.85rem;">{{ config.name }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">|</span>
      <span style="color:var(--text-muted);font-size:0.8rem;">{{ config.address }}</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;position:relative;">
      <button type="button" @click="toggleMenu"
        style="font-size:0.75rem;padding:5px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:6px;">
        🌐 메뉴 바로가기
        <span :style="{fontWeight:800,color: currentSiteNo==='03' ? '#7b1fa2' : currentSiteNo==='02' ? '#2e7d6b' : currentSiteNo==='9999' ? '#888' : '#9f2946'}">{{ currentSiteNo || '-' }}</span>
        <span :style="{fontWeight:800,color: currentAdminNo==='03' ? '#7b1fa2' : currentAdminNo==='02' ? '#2e7d6b' : currentAdminNo==='9999' ? '#888' : '#9f2946'}">{{ currentAdminNo || '-' }}</span>
        <span style="font-size:9px;">▾</span>
      </button>

      <!-- 메뉴 레이어 -->
      <div v-if="menuOpen"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9998;backdrop-filter:blur(2px);"
        @click="closeMenu"></div>
      <div v-if="menuOpen"
        style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.28);width:920px;max-width:95vw;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;border:1px solid #ffe4ec;"
        @click.stop>
        <!-- 헤더 -->
        <div style="padding:14px 18px;border-bottom:1px solid #ffc9d6;background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:15px;font-weight:800;color:#9f2946;"><span style="color:#e8587a;font-size:9px;margin-right:8px;">●</span>🌐 메뉴 바로가기</div>
          <button type="button" @click="closeMenu"
            style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.6);border:none;color:#9f2946;font-size:13px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;"
            onmouseover="this.style.background='#e8587a';this.style.color='#fff';this.style.transform='rotate(90deg)';"
            onmouseout="this.style.background='rgba(255,255,255,0.6)';this.style.color='#9f2946';this.style.transform='';">✕</button>
        </div>

        <!-- 3열 본문 -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:18px;overflow:auto;">
          <!-- frontOffice -->
          <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
            <div style="font-size:13px;font-weight:800;color:#1565c0;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e0e8f5;">🛍 frontOffice</div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button v-for="m in FRONT_MENU" :key="m.id" type="button"
                @click="goItem('frontOffice', m.id)"
                style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:transparent;border:none;border-radius:6px;cursor:pointer;font-size:12.5px;color:#333;text-align:left;transition:all .12s;"
                onmouseover="this.style.background='#fff5f8';this.style.color='#e8587a';"
                onmouseout="this.style.background='transparent';this.style.color='#333';">
                <span style="font-size:14px;width:18px;text-align:center;">{{ m.icon }}</span>
                <span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- backOffice -->
          <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
            <div style="font-size:13px;font-weight:800;color:#7b1fa2;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #efe0f5;">🔧 backOffice (admin)</div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button v-for="m in BACK_MENU" :key="m.id" type="button"
                @click="goItem('backOffice', m.id)"
                style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:transparent;border:none;border-radius:6px;cursor:pointer;font-size:12.5px;color:#333;text-align:left;transition:all .12s;"
                onmouseover="this.style.background='#f7f0fa';this.style.color='#7b1fa2';"
                onmouseout="this.style.background='transparent';this.style.color='#333';">
                <span style="font-size:14px;width:18px;text-align:center;">{{ m.icon }}</span>
                <span>{{ m.label }}</span>
              </button>
            </div>
          </div>

          <!-- 나머지: Front 사이트번호 + dispUi -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <!-- _SITE_NO (FRONT / BACK 분리 링크) -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:13px;font-weight:800;color:#2e7d6b;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #def0e8;">🌈 _SITE_NO <span style="font-size:11px;color:#888;font-weight:600;">(FRONT: {{ currentSiteNo }}, ADMIN: {{ currentAdminNo }})</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div v-for="p in SITE_PAIR_MENU" :key="p.front+'_'+p.admin"
                  style="display:flex;gap:6px;align-items:center;">
                  <!-- FRONT 링크 -->
                  <button type="button" @click="goItem('frontOnly', p.front)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentSiteNo===p.front?'#e0f2ec':'transparent',border:'1px solid '+(currentSiteNo===p.front?'#a3d4be':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontFamily:'monospace',color: currentSiteNo===p.front?'#2e7d6b':'#444',fontWeight: currentSiteNo===p.front?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#e0f2ec';this.style.color='#2e7d6b';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentSiteNo===p.front?'1':'0'"
                    title="index.html로 이동 (같은 창)">
                    <span>{{ currentSiteNo===p.front?'●':'○' }}</span>
                    <span>FRONT={{ p.front }}</span>
                  </button>
                  <!-- BACK 링크 (admin.html 새창) -->
                  <button type="button" @click="goItem('backOnly', p.admin)"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentAdminNo===p.admin?'#f3e5f5':'transparent',border:'1px solid '+(currentAdminNo===p.admin?'#ce93d8':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontFamily:'monospace',color: currentAdminNo===p.admin?'#7b1fa2':'#444',fontWeight: currentAdminNo===p.admin?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#f3e5f5';this.style.color='#7b1fa2';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentAdminNo===p.admin?'1':'0'"
                    title="admin.html 새창 오픈">
                    <span>{{ currentAdminNo===p.admin?'●':'○' }}</span>
                    <span>ADMIN={{ p.admin }}</span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">↗</span>
                  </button>
                </div>
              </div>
            </div>
            <!-- dispUi -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:13px;font-weight:800;color:#c2410c;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5e8de;">🖥 dispUi (샘플)</div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <div v-for="m in DISP_MENU" :key="m.id"
                  style="display:flex;align-items:center;gap:6px;padding:4px 6px;">
                  <span style="font-size:14px;width:18px;text-align:center;">{{ m.icon }}</span>
                  <span style="flex:1;font-size:12.5px;color:#333;">{{ m.label }}</span>
                  <button type="button" @click="goItem('dispFrontUi', m.id); closeMenu();"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:5px;cursor:pointer;"
                    title="사용자 미리보기">사용자 ↗</button>
                  <button type="button" @click="goItem('dispAdminUi', m.id); closeMenu();"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#fef3eb;color:#c2410c;border:1px solid #f5e8de;border-radius:5px;cursor:pointer;"
                    title="관리자 미리보기">관리자 ↗</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.tel }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.email }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">© 2026 {{ config.name }}</span>
    </div>
  </div>
</footer>
  `,
};
