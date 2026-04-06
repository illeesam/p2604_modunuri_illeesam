/* MODUNURI - PageDetail */
window.PageDetail = {
  name: 'PageDetail',
  props: ['navigate', 'config', 'product', 'selectProduct', 'orderProduct', 'openDemo'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <button @click="navigate('products')" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:24px;padding:0;transition:color 0.2s;" onmouseover="this.style.color='var(--blue)'" onmouseout="this.style.color='var(--text-muted)'">
    ← 상품 목록으로
  </button>
  <template v-if="product">
    <div style="display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start;" class="detail-grid">
      <!-- Main info -->
      <div>
        <div class="card" style="padding:36px;margin-bottom:20px;">
          <div style="display:flex;align-items:flex-start;gap:20px;margin-bottom:24px;flex-wrap:wrap;">
            <div style="font-size:4rem;line-height:1;">{{ product.emoji }}</div>
            <div style="flex:1;min-width:200px;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                <h1 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">{{ product.productName }}</h1>
                <span class="badge badge-cat">{{ categoryLabel(product) }}</span>
              </div>
              <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;margin-bottom:16px;">{{ product.desc }}</p>
              <div style="font-size:1.2rem;font-weight:800;color:var(--blue);margin-bottom:20px;">{{ product.price }}</div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <button class="btn-blue" @click="openDemo(product)">🚀 30일 무료 데모 시작</button>
                <button class="btn-outline" @click="navigate('contact')">도입 문의</button>
                <button class="btn-outline" @click="orderProduct(product)">주문하기</button>
                <button @click="shareProduct(product)" title="공유하기"
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
        <!-- Specs -->
        <div class="card" style="padding:28px;margin-bottom:20px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">📋 주요 사양</h2>
          <div class="info-row">
            <span class="info-icon">☁️</span>
            <div><div class="info-label">배포 방식</div><div class="info-val">SaaS (클라우드)</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">🔒</span>
            <div><div class="info-label">보안</div><div class="info-val">AES-256 암호화, SOC2 인증</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">🔄</span>
            <div><div class="info-label">업데이트</div><div class="info-val">자동 업데이트 (월 2회 이상)</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">📞</span>
            <div><div class="info-label">지원</div><div class="info-val">이메일 + 채팅 (기본) / 전담 (엔터프라이즈)</div></div>
          </div>
          <div class="info-row">
            <span class="info-icon">🌐</span>
            <div><div class="info-label">SLA</div><div class="info-val">99.9% 가동률 보장</div></div>
          </div>
        </div>
      </div>
      <!-- Sidebar: Related -->
      <div>
        <div style="font-size:0.875rem;font-weight:700;color:var(--text-secondary);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.06em;">관련 상품</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="p in config.products.filter(x=>x.productId!==product.productId).slice(0,4)" :key="p.productId"
            class="card" style="padding:16px;cursor:pointer;" @click="selectRelated(p)">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.5rem;">{{ p.emoji }}</span>
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
  setup(props) {
    const { ref, reactive } = Vue;
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    function categoryLabel(p) {
      if (!p) return '';
      const cats = (props.config && props.config.categorys) || [];
      const row = cats.find(c => c.categoryId === p.categoryId);
      return row ? row.categoryName : p.categoryId;
    }

    function selectRelated(p) {
      props.selectProduct(p);
    }

    function shareProduct(product) {
      const siteName = props.config?.name || '모두누리';
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

    return { selectRelated, categoryLabel, shareToast, shareModal, shareProduct, shareViaKakao, copyLink };
  }
};
