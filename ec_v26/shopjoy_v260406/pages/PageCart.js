/* ShopJoy - PageCart */
window.PageCart = {
  name: 'PageCart',
  props: ['navigate', 'config', 'cart', 'cartCount', 'removeFromCart', 'updateCartQty', 'showConfirm', 'clearCart'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:14px;">장바구니</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:6px;">내 <span class="gradient-text">장바구니</span></h1>
    <p class="section-subtitle">총 {{ cartCount }}개 상품이 담겨 있습니다.</p>
  </div>

  <!-- 빈 장바구니 -->
  <div v-if="cart.length===0" style="text-align:center;padding:80px 20px;">
    <div style="font-size:4rem;margin-bottom:20px;">🛒</div>
    <p style="color:var(--text-muted);font-size:1rem;margin-bottom:24px;">장바구니가 비어 있어요</p>
    <button class="btn-blue" @click="navigate('products')" style="padding:12px 28px;">쇼핑하러 가기</button>
  </div>

  <!-- 장바구니 목록 -->
  <template v-else>
    <div style="display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start;" class="order-grid">
      <!-- 왼쪽: 상품 목록 -->
      <div>
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
          <!-- 전체 선택/삭제 헤더 -->
          <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
            <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">상품 목록 ({{ cart.length }})</span>
            <button @click="handleClearAll"
              style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:0;">
              전체 삭제
            </button>
          </div>

          <!-- 각 상품 -->
          <div v-for="(item, idx) in cart" :key="idx"
            style="padding:20px;border-bottom:1px solid var(--border);"
            :style="{ borderBottom: idx===cart.length-1 ? 'none' : '1px solid var(--border)' }">
            <div style="display:flex;gap:16px;align-items:flex-start;">
              <!-- 상품 이미지 -->
              <div :style="{
                width:'80px', height:'80px', borderRadius:'12px', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'2.8rem',
                background: 'linear-gradient(135deg,' + item.color.hex + '33,' + item.color.hex + '11)'
              }">
                {{ item.product.emoji }}
              </div>
              <!-- 상품 정보 -->
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;margin-bottom:4px;">
                  {{ item.product.productName }}
                </div>
                <!-- 옵션 태그 -->
                <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
                  <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:600;">
                    <span :style="{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background:item.color.hex, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }"></span>
                    {{ item.color.name }}
                  </span>
                  <span style="padding:2px 10px;border-radius:12px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:600;">{{ item.size }}</span>
                </div>
                <!-- 수량 + 가격 -->
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button class="qty-btn" @click="updateCartQty(idx,-1)">−</button>
                    <span class="qty-val">{{ item.qty }}</span>
                    <button class="qty-btn" @click="updateCartQty(idx,1)">+</button>
                  </div>
                  <div style="font-size:0.95rem;font-weight:800;color:var(--blue);">
                    {{ formatPrice(item.product.price, item.qty) }}
                  </div>
                </div>
              </div>
              <!-- 삭제 버튼 -->
              <button @click="removeFromCart(idx)"
                style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.2rem;padding:0;flex-shrink:0;transition:color 0.2s;"
                @mouseenter="$event.currentTarget.style.color='#e53e3e'"
                @mouseleave="$event.currentTarget.style.color='var(--text-muted)'"
                title="삭제">✕</button>
            </div>
          </div>
        </div>

        <button class="btn-outline" @click="navigate('products')" style="padding:10px 20px;">← 계속 쇼핑하기</button>
      </div>

      <!-- 오른쪽: 주문 요약 -->
      <div>
        <div class="card" style="padding:24px;position:sticky;top:76px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">📋 주문 요약</h2>

          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;font-size:0.875rem;">
            <div v-for="(item, idx) in cart" :key="idx"
              style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ item.product.productName }} ({{ item.color.name }}/{{ item.size }}) × {{ item.qty }}
              </span>
              <span style="font-weight:600;flex-shrink:0;color:var(--text-primary);">{{ formatPrice(item.product.price, item.qty) }}</span>
            </div>
          </div>

          <div style="border-top:1px solid var(--border);padding-top:14px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.875rem;">
              <span style="color:var(--text-secondary);">상품금액</span>
              <span style="font-weight:600;">{{ totalPriceStr }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.875rem;">
              <span style="color:var(--text-secondary);">배송비</span>
              <span style="color:var(--blue);font-weight:600;">무료</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-top:10px;">
              <span>총 결제금액</span>
              <span style="color:var(--blue);">{{ totalPriceStr }}</span>
            </div>
          </div>

          <button class="btn-blue" @click="navigate('order')" style="width:100%;padding:14px;font-size:0.95rem;">
            주문하기 ({{ cartCount }}개)
          </button>
          <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:10px;">계좌이체로 안전하게 결제</p>
        </div>
      </div>
    </div>
  </template>
</div>
  `,
  setup(props) {
    const { computed } = Vue;

    function parsePrice(priceStr) {
      if (!priceStr) return 0;
      const m = priceStr.replace(/[^0-9]/g, '');
      return m ? parseInt(m, 10) : 0;
    }

    function formatPrice(priceStr, qty) {
      const base = parsePrice(priceStr);
      if (!base) return priceStr;
      const total = base * (qty || 1);
      return total.toLocaleString('ko-KR') + '원';
    }

    const totalPrice = computed(() =>
      (props.cart || []).reduce((sum, item) => sum + parsePrice(item.product.price) * item.qty, 0)
    );

    const totalPriceStr = computed(() =>
      totalPrice.value ? totalPrice.value.toLocaleString('ko-KR') + '원' : '-'
    );

    const handleClearAll = async () => {
      const ok = await props.showConfirm('장바구니 비우기', '장바구니의 모든 상품을 삭제하시겠습니까?', 'warning');
      if (ok) props.clearCart();
    };

    return { formatPrice, totalPriceStr, handleClearAll };
  }
};
