/* ArtGallery - PageAbout */
window.PageAbout = {
  name: 'PageAbout',
  props: ['navigate', 'config'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:36px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:14px;border:1px solid rgba(201,160,89,0.3);">작가소개</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;font-family:'Noto Serif KR',serif;">작가 <span class="gradient-text">송진현</span></h1>
    <div class="art-divider"><span class="art-divider-icon">🖌️</span></div>
  </div>

  <div class="grid-2" style="gap:32px;margin-bottom:36px;">
    <div class="card" style="padding:32px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;">
      <div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--burgundy));display:flex;align-items:center;justify-content:center;font-size:3.5rem;box-shadow:0 8px 32px var(--gold-dim);">🎨</div>
      <div>
        <div style="font-size:1.4rem;font-weight:800;color:var(--text-primary);font-family:'Noto Serif KR',serif;">송진현</div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">Song Jin-hyun</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;width:100%;">
        <div class="info-row">
          <div class="info-icon">🖌️</div>
          <div><div class="info-label">전공 재료</div><div class="info-val">아크릴 on 캔버스 (Acrylic on Canvas)</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">📅</div>
          <div><div class="info-label">작품 활동</div><div class="info-val">2024년 ~ 현재</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">🎭</div>
          <div><div class="info-label">작품 스타일</div><div class="info-val">자연, 동물, 풍경, 정물</div></div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div class="card" style="padding:28px;">
        <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🎨 작가 소개</h2>
        <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.9;">
          송진현 작가는 자연의 아름다움과 생명의 역동성을 아크릴 물감으로 캔버스에 담아내는 화가입니다. 꽃의 화사한 색감, 바다의 장엄한 풍경, 동물들의 생동감 있는 표정까지 — 일상 속 아름다움을 예술로 승화시킵니다.
        </p>
      </div>
      <div class="card" style="padding:28px;">
        <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">✨ 작품 철학</h2>
        <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.9;">
          "좋은 그림 한 점은 공간을 바꾸고, 삶을 바꿉니다." 작가는 보는 이의 마음에 평화와 기쁨을 전달하는 것을 작품의 목표로 삼습니다. 특히 색채의 대비와 붓터치의 생동감을 통해 작품에 에너지를 불어넣습니다.
        </p>
      </div>
    </div>
  </div>

  <!-- 핵심 가치 -->
  <div>
    <h2 class="section-title" style="font-size:1.25rem;margin-bottom:20px;">작품 세계</h2>
    <div class="grid-4">
      <div class="value-card">
        <div style="font-size:2.2rem;margin-bottom:12px;">🌸</div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">꽃과 정물</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">화사한 색채로 생명의 아름다움을 표현합니다</p>
      </div>
      <div class="value-card">
        <div style="font-size:2.2rem;margin-bottom:12px;">🌊</div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">풍경과 자연</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">계절의 변화와 자연의 서정을 담아냅니다</p>
      </div>
      <div class="value-card">
        <div style="font-size:2.2rem;margin-bottom:12px;">🦜</div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">동물의 생동감</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">동물들의 표정과 움직임을 생생하게 표현합니다</p>
      </div>
      <div class="value-card">
        <div style="font-size:2.2rem;margin-bottom:12px;">🎭</div>
        <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);margin-bottom:8px;">색채의 하모니</div>
        <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.65;">대담한 색채 대비로 감정을 전달합니다</p>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    return {};
  }
};
