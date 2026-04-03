/* CareMate - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  props: ['config', 'navigate'],
  emits: [],
  template: /* html */ `
  <footer style="margin-top:auto;">
    <div style="max-width:1100px;margin:0 auto;padding:32px 32px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:24px;margin-bottom:24px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--blue),var(--teal));display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🏥</div>
            <span style="font-weight:800;font-size:0.9rem;color:var(--text-primary);">{{ config.name }}</span>
          </div>
          <p style="font-size:0.75rem;color:var(--text-muted);line-height:1.7;">{{ config.tagline }}<br>믿을 수 있는 동행 파트너</p>
          <div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted);">
            <div>📞 {{ config.tel }}</div><div style="margin-top:2px;">📧 {{ config.email }}</div>
          </div>
        </div>
        <div>
          <h4 style="font-weight:700;font-size:0.85rem;margin-bottom:10px;color:var(--text-primary);">서비스</h4>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;font-size:0.75rem;color:var(--text-muted);">
            <li><a @click="navigate('booking')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">병원동행 예약</a></li>
            <li><a @click="navigate('order')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">서비스 신청</a></li>
            <li><a @click="navigate('products')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">서비스 목록</a></li>
          </ul>
        </div>
        <div>
          <h4 style="font-weight:700;font-size:0.85rem;margin-bottom:10px;color:var(--text-primary);">안내</h4>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:6px;font-size:0.75rem;color:var(--text-muted);">
            <li><a @click="navigate('about')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">서비스 소개</a></li>
            <li><a @click="navigate('faq')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">FAQ</a></li>
            <li><a @click="navigate('location')" style="cursor:pointer;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">오시는 길</a></li>
          </ul>
        </div>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,var(--blue),transparent);margin-bottom:16px;"></div>
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;">
        <p style="font-size:0.72rem;color:var(--text-muted);">© 2025 케어메이트. All rights reserved.</p>
        <div style="display:flex;gap:14px;font-size:0.72rem;color:var(--text-muted);">
          <a href="#" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">개인정보처리방침</a>
          <a href="#" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">이용약관</a>
        </div>
      </div>
    </div>
  </footer>
`,
  setup(props) {
    const { } = Vue;
    return {};
  }
};
