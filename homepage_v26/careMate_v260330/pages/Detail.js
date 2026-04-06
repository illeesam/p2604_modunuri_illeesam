/* CareMate - PageDetail */
window.PageDetail = {
  name: 'PageDetail',
  props: ['navigate', 'config', 'product', 'products'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <button @click="navigate('products')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;display:flex;align-items:center;gap:6px;padding:0;margin-bottom:20px;">← 서비스 목록으로</button>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
    <button v-for="p in products" :key="p.productId" @click="selectedProduct=p"
      style="padding:5px 12px;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap;"
      :style="selectedProduct&&selectedProduct.productId===p.productId?'background:var(--blue);color:#fff;border:1.5px solid var(--blue);':'background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);'">
      {{ p.emoji }} {{ p.productName }}
    </button>
  </div>
  <div class="detail-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:28px;" v-if="selectedProduct">
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div class="card" style="padding:32px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
          <span style="font-size:3rem;">{{ selectedProduct.emoji }}</span>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">{{ selectedProduct.categoryName }}</div>
            <h1 style="font-size:1.5rem;font-weight:800;color:var(--text-primary);">{{ selectedProduct.productName }}</h1>
            <span v-if="selectedProduct.badge" class="badge" :class="selectedProduct.badge==='추천'?'badge-blue':selectedProduct.badge==='인기'?'badge-teal':'badge-amber'" style="margin-top:6px;">{{ selectedProduct.badge }}</span>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.8;margin-bottom:20px;">{{ selectedProduct.desc }}</p>
        <div style="font-size:1.3rem;font-weight:800;color:var(--blue);margin-bottom:4px;">{{ selectedProduct.price }}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:20px;">{{ selectedProduct.priceNote }}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="btn-blue" @click="selectedProduct.categoryId==='hospital'?navigate('booking'):navigate('order')">📋 신청하기</button>
          <button class="btn-outline" @click="navigate('contact')">상담 문의</button>
          <button @click="shareProduct(selectedProduct)" title="공유하기"
            style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);transition:all 0.2s;"
            @mouseenter="$event.currentTarget.style.borderColor='var(--blue)'"
            @mouseleave="$event.currentTarget.style.borderColor='var(--border)'">
            📤 공유하기
          </button>
        </div>
        <div v-if="shareToast" style="margin-top:10px;font-size:0.8rem;color:var(--teal);font-weight:600;">✅ 링크가 클립보드에 복사되었습니다.</div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">✅ 포함 서비스</h3>
        <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px;">
          <li v-for="f in selectedProduct.features" :key="f" style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary);">
            <span style="color:var(--teal);font-size:1rem;">✓</span> {{ f }}
          </li>
        </ul>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" style="padding:24px;" v-if="selectedProduct.categoryId==='hospital'">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">🏥 병원동행 포함 여부</h3>
        <div class="info-row"><div class="info-icon">🚗</div><div><div class="info-label">차량 지원</div><div class="info-val" :style="selectedProduct.includes.vehicle?'color:var(--teal);font-weight:600':'color:var(--text-muted)'">{{ selectedProduct.includes.vehicle ? '✅ 포함 (리프트 차량)' : '미포함 (별도 추가 가능)' }}</div></div></div>
        <div class="info-row"><div class="info-icon">🧑‍⚕️</div><div><div class="info-label">매니저 역할</div><div class="info-val" :style="selectedProduct.includes.manager?'color:var(--teal);font-weight:600':'color:var(--text-muted)'">{{ selectedProduct.includes.manager ? '✅ 포함 (의사소통·처방전 수령)' : '미포함' }}</div></div></div>
        <div class="info-row"><div class="info-icon">🦽</div><div><div class="info-label">휠체어 이동 보조</div><div class="info-val" :style="selectedProduct.includes.wheelchair?'color:var(--teal);font-weight:600':'color:var(--text-muted)'">{{ selectedProduct.includes.wheelchair ? '✅ 포함' : '미포함' }}</div></div></div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">📌 이용 안내</h3>
        <div class="info-row"><div class="info-icon">📅</div><div><div class="info-label">예약</div><div class="info-val">최소 24시간 전 예약 권장</div></div></div>
        <div class="info-row"><div class="info-icon">💳</div><div><div class="info-label">결제</div><div class="info-val">계좌이체 (확정 후 선불)</div></div></div>
        <div class="info-row"><div class="info-icon">🔄</div><div><div class="info-label">취소</div><div class="info-val">24시간 전 무료 취소</div></div></div>
        <div class="info-row"><div class="info-icon">📞</div><div><div class="info-label">문의</div><div class="info-val">{{ config.tel }}</div></div></div>
      </div>
      <div class="card" style="padding:24px;">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);">다른 서비스</h3>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div v-for="p in products.filter(x=>x.productId!==selectedProduct.productId&&x.categoryId===selectedProduct.categoryId).slice(0,3)" :key="p.productId"
            class="card" style="padding:12px;cursor:pointer;margin-bottom:0;" @click="selectedProduct=p">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.4rem;">{{ p.emoji }}</span>
              <div><div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">{{ p.productName }}</div><div style="font-size:0.75rem;color:var(--blue);">{{ p.price }}</div></div>
            </div>
          </div>
        </div>
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
    const { ref, watch, reactive } = Vue;
    const selectedProduct = ref(props.product);
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    watch(() => props.product, p => { if (p) selectedProduct.value = p; });

    function shareProduct(product) {
      const siteName = props.config?.name || '케어메이트';
      shareData.title = `${siteName} - ${product.productName}`;
      shareData.text = `[${siteName}] ${product.productName}\n💰 ${product.price}${product.priceNote ? '\n' + product.priceNote : ''}\n${product.desc}`;
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

    return { selectedProduct, shareToast, shareModal, shareProduct, shareViaKakao, copyLink };
  }
};
