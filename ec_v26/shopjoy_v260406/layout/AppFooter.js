/* ShopJoy - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  props: ['config', 'navigate'],
  emits: [],
  setup() {
    const onMenuChange = (e) => {
      const val = e.target.value;
      if (!val) return;
      const [root, target] = val.split('::');
      if (root === 'frontOffice') {
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + (target ? '#page=' + target : '');
        if (target && typeof window.navigate === 'function') window.navigate(target);
      } else if (root === 'backOffice') {
        window.open((window.pageUrl ? window.pageUrl('admin.html') : 'admin.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'dispUi') {
        window.open((window.pageUrl ? window.pageUrl('disp-ui.html') : 'disp-ui.html') + (target ? '#page=' + target : ''), '_blank');
      }
      e.target.value = '';
    };
    return { onMenuChange };
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
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <select @change="onMenuChange"
        style="font-size:0.75rem;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;min-width:440px;max-width:560px;">
        <option value="">🌐 메뉴 바로가기</option>
        <optgroup label="🛍 frontOffice">
          <option value="frontOffice::home">├ 홈</option>
          <option value="frontOffice::prod01list">├ 상품목록</option>
          <option value="frontOffice::cart">├ 장바구니</option>
          <option value="frontOffice::order">├ 주문하기</option>
          <option value="frontOffice::like">├ 찜 목록</option>
          <option value="frontOffice::event">├ 이벤트</option>
          <option value="frontOffice::blog">├ 블로그</option>
          <option value="frontOffice::faq">├ FAQ</option>
          <option value="frontOffice::contact">├ 고객센터</option>
          <option value="frontOffice::location">├ 위치안내</option>
          <option value="frontOffice::about">├ 회사소개</option>
          <option value="frontOffice::myOrder">├ 마이페이지 - 주문</option>
          <option value="frontOffice::myCoupon">├ 마이페이지 - 쿠폰</option>
          <option value="frontOffice::myCache">├ 마이페이지 - 캐시</option>
          <option value="frontOffice::myContact">└ 마이페이지 - 문의</option>
        </optgroup>
        <optgroup label="🔧 backOffice (admin)">
          <option value="backOffice::dashboard">├ 대시보드</option>
          <option value="backOffice::ecMemberMng">├ 회원관리</option>
          <option value="backOffice::ecProdMng">├ 상품관리</option>
          <option value="backOffice::ecOrderMng">├ 주문관리</option>
          <option value="backOffice::ecDispUiMng">├ 전시UI관리</option>
          <option value="backOffice::ecDispAreaMng">├ 전시영역관리</option>
          <option value="backOffice::ecDispPanelMng">├ 전시패널관리</option>
          <option value="backOffice::ecDispWidgetMng">├ 전시위젯관리</option>
          <option value="backOffice::ecDispWidgetLibMng">├ 전시위젯Lib</option>
          <option value="backOffice::ecDispUiSimul">└ 전시UI시뮬레이션</option>
        </optgroup>
        <optgroup label="🖥 dispUi (샘플)">
          <option value="dispUi::dispUiPage">├ 통합 페이지</option>
          <option value="dispUi::dispUi01">├ UI 샘플 01</option>
          <option value="dispUi::dispUi02">├ UI 샘플 02</option>
          <option value="dispUi::dispUi03">├ UI 샘플 03</option>
          <option value="dispUi::dispUi04">├ UI 샘플 04</option>
          <option value="dispUi::dispUi05">├ UI 샘플 05</option>
          <option value="dispUi::dispUi06">└ UI 샘플 06</option>
        </optgroup>
      </select>
      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.tel }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">{{ config.email }}</span>
      <span style="color:var(--text-muted);font-size:0.75rem;">© 2026 {{ config.name }}</span>
    </div>
  </div>
</footer>
  `,
};
