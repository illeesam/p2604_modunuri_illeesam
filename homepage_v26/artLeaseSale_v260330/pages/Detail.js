/* ArtGallery - PageDetail */
window.PageDetail = {
  name: 'PageDetail',
  props: ['navigate', 'config', 'artwork', 'artworks', 'showAlert', 'selectArtwork'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:24px;">
    <button @click="navigate('gallery')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;display:flex;align-items:center;gap:6px;padding:0;margin-bottom:16px;">← 갤러리로 돌아가기</button>
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--gold-dim);color:var(--gold);font-size:0.75rem;font-weight:700;margin-bottom:12px;border:1px solid rgba(201,160,89,0.3);">작품 상세</div>
  </div>

  <!-- Artwork selector -->
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">
    <button v-for="a in artworks" :key="a.artworkId" @click="selectArtwork(a)"
      style="padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap;"
      :style="artwork && artwork.artworkId===a.artworkId ? 'background:var(--gold);color:#fff;border:1.5px solid var(--gold);' : 'background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);'">
      {{ a.emoji }} {{ a.artworkName }}
    </button>
  </div>

  <div class="detail-grid" style="display:grid;grid-template-columns:1fr 1.1fr;gap:32px;" v-if="artwork">
    <!-- Artwork image -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="height:360px;display:flex;align-items:center;justify-content:center;font-size:8rem;background:linear-gradient(135deg,var(--gold-dim),var(--burgundy-dim));position:relative;">
        <img v-if="artwork.image" :src="artwork.image" :alt="artwork.artworkName" loading="lazy"
          @load="$event.target.classList.add('loaded')"
          style="width:100%;height:100%;object-fit:cover;display:block;" />
        <template v-else>{{ artwork.emoji }}</template>
        <span v-if="artwork.badge" style="position:absolute;top:16px;right:16px;" :class="artwork.badge==='신작'?'badge badge-new':'badge badge-hot'">{{ artwork.badge }}</span>
      </div>
      <div style="padding:20px 24px;">
        <div style="font-size:0.75rem;color:var(--text-muted);line-height:1.8;">
          <div>재료 · {{ artwork.material }}</div>
          <div>크기 · {{ artwork.size }}</div>
          <div>연도 · {{ artwork.year }}년</div>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
          <h1 style="font-size:1.7rem;font-weight:800;color:var(--text-primary);font-family:'Noto Serif KR',serif;">{{ artwork.artworkName }}</h1>
          <span class="badge badge-cat">{{ categoryLabel(artwork) }}</span>
        </div>
        <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.8;">{{ artwork.desc }}</p>
      </div>

      <!-- Price info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,var(--bg-card),var(--gold-dim));">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">📋 대여</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--gold);">{{ artwork.leasePrice }}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">월 기준</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;background:linear-gradient(135deg,var(--bg-card),var(--burgundy-dim));">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">🏷️ 구매</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--burgundy);">{{ artwork.salePrice }}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">별도 상담</div>
        </div>
      </div>

      <!-- Info -->
      <div class="card" style="padding:20px;">
        <div class="info-row">
          <div class="info-icon">🖌️</div>
          <div><div class="info-label">재료</div><div class="info-val">{{ artwork.material }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">📐</div>
          <div><div class="info-label">크기</div><div class="info-val">{{ artwork.size }}</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">📅</div>
          <div><div class="info-label">제작 연도</div><div class="info-val">{{ artwork.year }}년</div></div>
        </div>
        <div class="info-row">
          <div class="info-icon">👤</div>
          <div><div class="info-label">작가</div><div class="info-val">송진현</div></div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn-gold" @click="navigate('contact')" style="padding:14px;font-size:0.9rem;">📋 이 작품 대여 문의하기</button>
        <button class="btn-burgundy" @click="navigate('contact')" style="padding:14px;font-size:0.9rem;">🏷️ 구매 상담하기</button>
        <button @click="shareArtwork(artwork)" title="공유하기"
          style="display:flex;align-items:center;justify-content:center;gap:6px;padding:14px;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);transition:all 0.2s;"
          @mouseenter="$event.currentTarget.style.borderColor='var(--gold)'"
          @mouseleave="$event.currentTarget.style.borderColor='var(--border)'">
          📤 공유하기
        </button>
        <div v-if="shareToast" style="font-size:0.8rem;color:var(--teal);font-weight:600;text-align:center;">✅ 링크가 클립보드에 복사되었습니다.</div>
      </div>
    </div>
  </div>

  <!-- Share Modal (bottom sheet) -->
  <div v-if="shareModal" @click.self="shareModal=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center;">
    <div style="background:var(--bg-card);border-radius:20px 20px 0 0;padding:28px 24px 44px;width:100%;max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <span style="font-weight:700;font-size:1rem;color:var(--text-primary);">공유하기</span>
        <button @click="shareModal=false" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);padding:0;line-height:1;">✕</button>
      </div>
      <div style="display:flex;gap:24px;justify-content:center;">
        <button @click="shareViaKakao" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">
          <div style="width:60px;height:60px;border-radius:16px;background:#FEE500;display:flex;align-items:center;justify-content:center;font-size:2rem;">💬</div>
          <span style="font-size:0.78rem;color:var(--text-secondary);font-weight:500;">카카오톡</span>
        </button>
        <button @click="copyLink" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">
          <div style="width:60px;height:60px;border-radius:16px;background:var(--bg-card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem;">🔗</div>
          <span style="font-size:0.78rem;color:var(--text-secondary);font-weight:500;">링크 복사</span>
        </button>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { ref, reactive } = Vue;
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    function categoryLabel(a) {
      if (!a) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === a.categoryId);
      return row ? row.categoryName : a.categoryId;
    }

    function shareArtwork(artwork) {
      const siteName = props.config?.name || '송진현 갤러리';
      shareData.title = `${siteName} - ${artwork.artworkName}`;
      shareData.text = `[${siteName}] ${artwork.artworkName}\n📋 대여: ${artwork.leasePrice}/월\n🏷️ 구매: ${artwork.salePrice}\n${artwork.desc}`;
      shareData.url = window.location.href;

      if (window.isSecureContext && navigator.share) {
        navigator.share({ title: shareData.title, text: shareData.text, url: shareData.url })
          .catch(() => { shareModal.value = true; });
      } else {
        shareModal.value = true;
      }
    }

    function shareViaKakao() {
      const fullText = shareData.text + '\n🔗 ' + shareData.url;
      window.location.href = 'kakaotalk://msg/send?text=' + encodeURIComponent(fullText);
      setTimeout(() => { shareModal.value = false; }, 300);
    }

    function copyLink() {
      const fullText = shareData.text + '\n🔗 ' + shareData.url;
      navigator.clipboard.writeText(fullText).then(() => {
        shareModal.value = false;
        shareToast.value = true;
        setTimeout(() => { shareToast.value = false; }, 3000);
      }).catch(() => {
        prompt('아래 내용을 복사하세요:', fullText);
        shareModal.value = false;
      });
    }

    return { categoryLabel, shareToast, shareModal, shareArtwork, shareViaKakao, copyLink };
  }
};
