/* ArtGallery - PageHome */
window.PageHome = {
  name: 'PageHome',
  props: ['navigate', 'config', 'artworks', 'selectArtwork'],
  emits: [],
  template: /* html */ `
<div>
  <section class="hero-section" style="padding:80px 32px 72px;position:relative;z-index:1;">
    <div style="max-width:680px;margin:0 auto;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:20px;background:var(--gold-dim);border:1px solid rgba(201,160,89,0.3);font-size:0.78rem;font-weight:600;color:var(--gold);margin-bottom:28px;">
        <span>🖌️</span><span>작가 송진현의 아크릴 작품</span>
      </div>
      <h1 style="font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.2;margin-bottom:20px;font-family:'Noto Serif KR',serif;">
        당신의 공간에<br><span class="gradient-text">예술을 더하세요</span>
      </h1>
      <p style="font-size:1rem;color:var(--text-secondary);line-height:1.8;margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto;">
        꽃, 풍경, 동물, 정물 — 송진현 작가의 아크릴 작품을 대여하거나 소장하세요. 공간이 예술로 채워집니다.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-gold" @click="navigate('gallery')" style="padding:13px 32px;font-size:0.95rem;">갤러리 보기 →</button>
        <button class="btn-outline" @click="navigate('lease')" style="padding:13px 32px;font-size:0.95rem;">대여 안내</button>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <div style="padding:0 32px;margin:-28px auto 0;max-width:860px;position:relative;z-index:2;">
    <div class="grid-4">
      <div class="stat-card fade-up">
        <div class="stat-number gradient-text">10+</div>
        <div class="stat-label">전시 작품</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.1s">
        <div class="stat-number gradient-text">4</div>
        <div class="stat-label">작품 카테고리</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.2s">
        <div class="stat-number gradient-text">2024~</div>
        <div class="stat-label">작품 연도</div>
      </div>
      <div class="stat-card fade-up" style="animation-delay:0.3s">
        <div class="stat-number gradient-text">월 5만~</div>
        <div class="stat-label">대여 시작가</div>
      </div>
    </div>
  </div>

  <!-- Featured artworks -->
  <div class="page-wrap" style="margin-top:56px;">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:12px;">
      <div>
        <h2 class="section-title">주요 작품</h2>
        <p class="section-subtitle">송진현 작가의 대표 아크릴 작품</p>
      </div>
      <button class="btn-outline btn-sm" @click="navigate('gallery')">전체 갤러리 →</button>
    </div>
    <div class="art-divider"><span class="art-divider-icon">🎨</span></div>
    <div class="grid-3" style="margin-top:8px;">
      <div v-for="a in artworks.slice(0,6)" :key="a.artworkId" class="artwork-card" @click="selectArtwork(a)">
        <div class="artwork-thumb">
          <img v-if="a.image" :src="$listImg(a.image)" :alt="a.artworkName" loading="lazy"
            @load="$event.target.classList.add('loaded')"
            style="width:100%;height:100%;object-fit:cover;display:block;" />
          <span v-else>{{ a.emoji }}</span>
          <span v-if="a.badge" style="position:absolute;top:12px;right:12px;" :class="a.badge==='신작'?'badge badge-new':'badge badge-hot'">{{ a.badge }}</span>
        </div>
        <div style="padding:18px 16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">{{ a.artworkName }}</span>
            <span class="badge badge-cat">{{ categoryLabel(a) }}</span>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{{ a.desc }}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <div>
              <div style="font-size:0.72rem;color:var(--text-muted);">대여</div>
              <div style="font-size:0.85rem;font-weight:700;color:var(--gold);">{{ a.leasePrice }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.72rem;color:var(--text-muted);">구매</div>
              <div style="font-size:0.85rem;font-weight:700;color:var(--burgundy);">{{ a.salePrice }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Lease CTA -->
  <div class="page-wrap" style="padding-top:0;margin-top:8px;padding-bottom:60px;">
    <div style="background:linear-gradient(135deg,var(--gold-dim),var(--burgundy-dim));border:1.5px solid rgba(201,160,89,0.3);border-radius:24px;padding:52px 40px;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-20px;right:-20px;font-size:8rem;opacity:0.07;">🎨</div>
      <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:16px;border:1px solid rgba(201,160,89,0.3);">그림 대여 서비스</div>
      <h2 style="font-size:1.7rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;font-family:'Noto Serif KR',serif;">공간이 달라집니다</h2>
      <p style="color:var(--text-secondary);margin-bottom:28px;font-size:0.9rem;line-height:1.7;max-width:480px;margin-left:auto;margin-right:auto;">
        월 5만원부터 시작하는 그림 대여 서비스로 사무실, 카페, 주거 공간을 갤러리로 만들어보세요.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-gold" @click="navigate('lease')" style="padding:13px 30px;">대여 안내 보기</button>
        <button class="btn-outline" @click="navigate('contact')" style="padding:13px 30px;">구매 상담하기</button>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    function categoryLabel(a) {
      if (!a) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === a.categoryId);
      return row ? row.categoryName : a.categoryId;
    }
    return { categoryLabel };
  }
};
