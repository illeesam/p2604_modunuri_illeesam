/* ArtGallery - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  props: ['config', 'navigate'],
  emits: [],
  template: /* html */ `
<footer style="margin-top:auto;">
  <div style="max-width:1100px;margin:0 auto;padding:36px 32px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px;margin-bottom:28px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--gold),var(--burgundy));display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🎨</div>
          <span style="font-weight:800;font-size:0.9rem;color:var(--text-primary);">{{ config.name }}</span>
        </div>
        <p style="font-size:0.78rem;color:var(--text-muted);line-height:1.7;">{{ config.tagline }}<br>공간에 예술을 더합니다</p>
        <div style="margin-top:10px;font-size:0.75rem;color:var(--text-muted);">
          <div>📞 {{ config.tel }}</div>
          <div style="margin-top:3px;">📧 {{ config.email }}</div>
        </div>
      </div>
      <div>
        <h4 style="font-weight:700;font-size:0.875rem;margin-bottom:12px;color:var(--text-primary);">갤러리</h4>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;font-size:0.78rem;color:var(--text-muted);">
          <li><a @click="navigate('gallery')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">갤러리 보기</a></li>
          <li><a @click="navigate('detail')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">작품 상세</a></li>
          <li><a @click="navigate('about')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">작가 소개</a></li>
        </ul>
      </div>
      <div>
        <h4 style="font-weight:700;font-size:0.875rem;margin-bottom:12px;color:var(--text-primary);">서비스</h4>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;font-size:0.78rem;color:var(--text-muted);">
          <li><a @click="navigate('lease')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">대여 안내</a></li>
          <li><a @click="navigate('contact')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">구매 상담</a></li>
          <li><a @click="navigate('location')" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">오시는 길</a></li>
        </ul>
      </div>
    </div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin-bottom:20px;"></div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;">
      <p style="font-size:0.75rem;color:var(--text-muted);">© 2025 송진현 아트갤러리. All rights reserved.</p>
      <div style="display:flex;gap:16px;font-size:0.75rem;color:var(--text-muted);">
        <a href="#" style="transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">개인정보처리방침</a>
        <a href="#" style="transition:color 0.2s;" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">이용약관</a>
      </div>
    </div>
  </div>
</footer>
`,
  setup(props) {
    return {};
  }
};
