window.DangoeulPages = window.DangoeulPages || {};
window.DangoeulPages.Detail = {
  name: 'Detail',
  props: ['navigate', 'products', 'selectedProduct', 'selectProduct', 'openDemo'],
  template: /* html */ `
  <div class="page-wrap">
    <button @click="navigate('products')" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:24px;padding:0;transition:color 0.2s;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">
      ← 상품 목록으로
    </button>
    <template v-if="selectedProduct">
      <div style="display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start;" class="detail-grid">
        <div>
          <div v-if="selectedProduct.image" class="product-detail-hero">
            <img :src="selectedProduct.image" :alt="selectedProduct.productName" loading="eager"
              @load="$event.target.classList.add('loaded')"
              :style="{ objectPosition: selectedProduct.imagePos || 'center center' }" />
          </div>
          <div class="card" style="padding:28px;margin-bottom:20px;">
            <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
              <span style="font-size:3rem;line-height:1;">{{ selectedProduct.emoji }}</span>
              <div style="flex:1;min-width:200px;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                  <h1 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">{{ selectedProduct.productName }}</h1>
                  <span class="badge badge-cat">{{ categoryLabel(selectedProduct) }}</span>
                  <span v-if="selectedProduct.isSet" class="badge badge-set">구성 세트</span>
                </div>
                <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:16px;">{{ selectedProduct.desc }}</p>
                <div style="font-size:1.2rem;font-weight:800;color:var(--blue);margin-bottom:20px;">{{ selectedProduct.price }}</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                  <button class="btn-blue" @click="openDemo(selectedProduct)">🛒 샘플 주문·구성 보기</button>
                  <button class="btn-outline" @click="navigate('contact')">도매·단체 문의</button>
                  <button @click="shareProduct(selectedProduct)" title="공유하기"
                    style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);transition:all 0.2s;"
                    @mouseenter="$event.currentTarget.style.borderColor='var(--blue)'"
                    @mouseleave="$event.currentTarget.style.borderColor='var(--border)'">
                    📤 공유하기
                  </button>
                </div>
                <div v-if="shareToast" style="margin-top:10px;font-size:0.8rem;color:var(--teal);font-weight:600;">✅ 링크가 클립보드에 복사되었습니다.</div>
              </div>
            </div>
          </div>

          <div v-if="selectedProduct.isSet && selectedProduct.setItems && selectedProduct.setItems.length" class="card" style="padding:28px;margin-bottom:20px;">
            <h2 style="font-size:1rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">📦 세트 구성</h2>
            <ul class="set-items-list">
              <li v-for="(line, i) in selectedProduct.setItems" :key="i">{{ line }}</li>
            </ul>
          </div>

          <div class="card" style="padding:28px;margin-bottom:20px;">
            <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">📋 상품 정보</h2>
            <div class="info-row">
              <span class="info-icon">📍</span>
              <div><div class="info-label">출고지</div><div class="info-val">충북 진천 — 온실·포트 상태 검수 후 발송</div></div>
            </div>
            <div class="info-row">
              <span class="info-icon">🧊</span>
              <div><div class="info-label">보관</div><div class="info-val">받은 직후 통풍·햇빛 양호한 곳에서 이식 권장</div></div>
            </div>
            <div class="info-row">
              <span class="info-icon">🚚</span>
              <div><div class="info-label">배송</div><div class="info-val">새벽·일반 배송 (지역별 상이) · 모종 파손 시 사진 접수</div></div>
            </div>
            <div class="info-row">
              <span class="info-icon">📞</span>
              <div><div class="info-label">문의</div><div class="info-val">평일 09:00–18:00 (품절·대체 품종 안내)</div></div>
            </div>
            <div class="info-row">
              <span class="info-icon">♻️</span>
              <div><div class="info-label">포장</div><div class="info-val">포트 고정·종이 완충재 사용</div></div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:0.875rem;font-weight:700;color:var(--text-secondary);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.06em;">관련 상품</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div v-for="p in products.filter(x=>x.productId!==selectedProduct.productId).slice(0,4)" :key="p.productId"
              class="card" style="padding:14px;cursor:pointer;" @click="selectProduct(p)">
              <div style="display:flex;align-items:center;gap:12px;">
                <img v-if="p.image" class="product-related-thumb" :src="$listImg(p.image)" :alt="p.productName" loading="lazy"
                  :style="{ objectPosition: p.imagePos || 'center center' }" />
                <span v-else style="font-size:1.5rem;">{{ p.emoji }}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ p.productName }}</div>
                  <div style="font-size:0.75rem;color:var(--blue);font-weight:600;">{{ p.price }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

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
  setup() {
    const { ref, reactive } = Vue;
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (window.SITE_CONFIG && window.SITE_CONFIG.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    function shareProduct(product) {
      const siteName = window.SITE_CONFIG?.name || '단고을';
      shareData.title = `${siteName} - ${product.productName}`;
      shareData.text = `[${siteName}] ${product.productName}\n💰 ${product.price}\n${product.desc}`;
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

    return { categoryLabel, shareToast, shareModal, shareProduct, shareViaKakao, copyLink };
  }
};
