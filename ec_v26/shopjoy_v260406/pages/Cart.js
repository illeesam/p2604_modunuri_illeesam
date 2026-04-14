/* ShopJoy - Cart */
window.Cart = {
  name: 'Cart',
  props: ['navigate', 'config', 'cart', 'cartCount', 'removeFromCart', 'updateCartQty', 'showConfirm', 'clearCart'],
  emits: [],
  setup(props) {
    const { computed, ref } = Vue;

    /* ── 체크박스 ── */
    const checkedIdxs = ref(new Set());

    const isChecked = (idx) => checkedIdxs.value.has(idx);

    const toggleCheck = (idx) => {
      const s = new Set(checkedIdxs.value);
      if (s.has(idx)) s.delete(idx);
      else s.add(idx);
      checkedIdxs.value = s;
    };

    const allChecked = computed(() =>
      props.cart.length > 0 && checkedIdxs.value.size === props.cart.length
    );
    const someChecked = computed(() =>
      checkedIdxs.value.size > 0 && checkedIdxs.value.size < props.cart.length
    );

    const toggleAll = () => {
      if (allChecked.value) checkedIdxs.value = new Set();
      else checkedIdxs.value = new Set(props.cart.map((_, i) => i));
    };

    /* 체크 해제된 항목 삭제 시 인덱스 재정렬 */
    const removeItem = (idx) => {
      props.removeFromCart(idx);
      const s = new Set();
      checkedIdxs.value.forEach(i => { if (i < idx) s.add(i); else if (i > idx) s.add(i - 1); });
      checkedIdxs.value = s;
    };

    /* 선택 항목만 주문 (체크 없으면 전체) */
    const goOrder = () => {
      if (checkedIdxs.value.size === 0) {
        props.navigate('order');
      } else {
        const ids = [...checkedIdxs.value].sort().map(i => props.cart[i].cartId);
        props.navigate('order', { cartIds: ids });
      }
    };

    /* ── 금액 계산 ── */
    function parsePrice(priceStr) {
      if (!priceStr) return 0;
      const m = priceStr.replace(/[^0-9]/g, '');
      return m ? parseInt(m, 10) : 0;
    }

    function formatPrice(priceStr, qty) {
      const base = parsePrice(priceStr);
      if (!base) return priceStr;
      return (base * (qty || 1)).toLocaleString('ko-KR') + '원';
    }

    /* 요약 패널: 체크된 항목(없으면 전체) 기준 */
    const summaryItems = computed(() =>
      checkedIdxs.value.size > 0
        ? [...checkedIdxs.value].sort().map(i => props.cart[i])
        : (props.cart || [])
    );

    const totalPrice = computed(() =>
      summaryItems.value.reduce((s, item) => s + parsePrice(item.product.price) * item.qty, 0)
    );

    const totalPriceStr = computed(() =>
      totalPrice.value ? totalPrice.value.toLocaleString('ko-KR') + '원' : '-'
    );

    const orderCount = computed(() =>
      checkedIdxs.value.size > 0 ? checkedIdxs.value.size : props.cart.length
    );

    const handleClearAll = async () => {
      const ok = await props.showConfirm('장바구니 비우기', '장바구니의 모든 상품을 삭제하시겠습니까?', 'warning');
      if (ok) { props.clearCart(); checkedIdxs.value = new Set(); }
    };

    return {
      checkedIdxs, isChecked, toggleCheck, allChecked, someChecked, toggleAll,
      removeItem, goOrder,
      formatPrice, totalPriceStr, summaryItems, orderCount, handleClearAll,
    };
  },

  template: /* html */ `
<div class="page-wrap">
  <!-- 페이지 타이틀 배너 -->
  <div class="page-banner-full" style="position:relative;overflow:hidden;height:220px;margin-bottom:36px;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw;display:flex;align-items:center;justify-content:center;">
    <img src="assets/cdn/prod/img/page-title/page-title-1.jpg" alt="장바구니"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 60%;" />
    <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,0.72) 0%,rgba(240,245,255,0.55) 45%,rgba(220,232,255,0.38) 100%);"></div>
    <div style="position:relative;z-index:1;text-align:center;">
      <div style="font-size:0.75rem;color:rgba(0,0,0,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Shopping</div>
      <h1 style="font-size:2.2rem;font-weight:700;color:#111;letter-spacing:-0.5px;margin-bottom:8px;">Cart</h1>
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:0.8rem;color:rgba(0,0,0,0.55);">
        <span style="cursor:pointer;" @click="navigate('home')">홈</span>
        <span>/</span>
        <span style="color:#333;">장바구니</span>
      </div>
    </div>
  </div>

  <!-- 빈 장바구니 -->
  <div v-if="cart.length===0" style="text-align:center;padding:80px 20px;">
    <div style="font-size:4rem;margin-bottom:20px;">🛒</div>
    <p style="color:var(--text-muted);font-size:1rem;margin-bottom:24px;">장바구니가 비어 있어요</p>
    <button class="btn-blue" @click="navigate('prodList')" style="padding:12px 28px;">쇼핑하러 가기</button>
  </div>

  <!-- 장바구니 목록 -->
  <template v-else>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(12px,2vw,24px);align-items:start;" class="order-grid">
      <!-- 왼쪽: 상품 목록 -->
      <div>
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
          <!-- 전체 선택/삭제 헤더 -->
          <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
              <input type="checkbox" :checked="allChecked" :indeterminate.prop="someChecked"
                @change="toggleAll"
                style="width:17px;height:17px;cursor:pointer;accent-color:var(--blue);" />
              <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">
                전체 선택
                <span v-if="checkedIdxs.size>0" style="font-weight:400;color:var(--blue);font-size:0.82rem;">
                  ({{ checkedIdxs.size }}개 선택됨)
                </span>
                <span v-else style="font-weight:400;color:var(--text-muted);font-size:0.82rem;">
                  (총 {{ cart.length }}개)
                </span>
              </span>
            </label>
            <button @click="handleClearAll"
              style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.8rem;text-decoration:underline;padding:0;">
              전체 삭제
            </button>
          </div>

          <!-- 각 상품 -->
          <div v-for="(item, idx) in cart" :key="idx"
            style="padding:20px;display:flex;gap:12px;align-items:flex-start;"
            :style="{ borderBottom: idx===cart.length-1 ? 'none' : '1px solid var(--border)',
                      background: isChecked(idx) ? 'var(--blue-dim)' : '' }">

            <!-- 체크박스 -->
            <div style="padding-top:4px;flex-shrink:0;">
              <input type="checkbox" :checked="isChecked(idx)" @change="toggleCheck(idx)"
                style="width:17px;height:17px;cursor:pointer;accent-color:var(--blue);" />
            </div>

            <!-- 상품 이미지 -->
            <div style="width:80px;height:80px;border-radius:12px;flex-shrink:0;overflow:hidden;background:var(--bg-base);">
              <img v-if="item.product.image" :src="item.product.image" :alt="item.product.prodNm" style="width:100%;height:100%;object-fit:cover;" />
            </div>

            <!-- 상품 정보 -->
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;margin-bottom:4px;">
                {{ item.product.prodNm }}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
                <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:600;">
                  <span :style="{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background:item.color.hex, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }"></span>
                  {{ item.color.name }}
                </span>
                <span style="padding:2px 10px;border-radius:12px;background:var(--purple-dim);color:var(--purple);font-size:0.75rem;font-weight:600;">{{ item.size }}</span>
              </div>
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
            <button @click="removeItem(idx)"
              style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.2rem;padding:0;flex-shrink:0;transition:color 0.2s;"
              @mouseenter="$event.currentTarget.style.color='#e53e3e'"
              @mouseleave="$event.currentTarget.style.color='var(--text-muted)'"
              title="삭제">✕</button>
          </div>
        </div>

        <button class="btn-outline" @click="navigate('prodList')" style="padding:10px 20px;">← 계속 쇼핑하기</button>
      </div>

      <!-- 오른쪽: 주문 요약 -->
      <div>
        <div class="card" style="padding:clamp(12px,3vw,24px);position:sticky;top:76px;">
          <h2 style="font-size:1rem;font-weight:700;margin-bottom:18px;color:var(--text-primary);">📋 주문 요약</h2>

          <div v-if="checkedIdxs.size>0" style="margin-bottom:8px;padding:6px 10px;border-radius:6px;background:var(--blue-dim);color:var(--blue);font-size:0.78rem;font-weight:600;">
            ✔ 선택 {{ checkedIdxs.size }}개 상품만 주문합니다
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;font-size:0.875rem;">
            <div v-for="(item, idx) in summaryItems" :key="idx"
              style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ item.product.prodNm }} ({{ item.color.name }}/{{ item.size }}) × {{ item.qty }}
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

          <button class="btn-blue" @click="goOrder" style="width:100%;padding:14px;font-size:0.95rem;">
            주문하기 ({{ orderCount }}개)
          </button>
          <p style="text-align:center;font-size:0.75rem;color:var(--text-muted);margin-top:10px;">계좌이체로 안전하게 결제</p>
        </div>
      </div>
    </div>
  </template>
</div>
  `,
};
