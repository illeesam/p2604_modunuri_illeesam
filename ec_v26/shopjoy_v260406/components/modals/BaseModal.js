/* ShopJoy – components/modals/BaseModal.js
   여러 팝업 컴포넌트를 한 곳에 모아둡니다.
   My.js 의 components 블록에 등록하여 사용합니다.
*/

/* ── 공통 모달 디자인 스타일 주입 ────────────────────────────── */
(() => {
  if (document.getElementById('__shopjoy_modal_enh_style__')) return;
  const css = `
    .modal-overlay { background: rgba(18,24,40,0.55) !important; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
    .modal-box { border-radius: 16px !important; box-shadow: 0 24px 60px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.08) !important; border: 1px solid rgba(255,255,255,0.6); overflow: hidden; }
    .modal-header {
      margin: -20px -20px 14px -20px !important; padding: 14px 18px !important;
      background: linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%) !important;
      border-bottom: 1px solid #ffc9d6 !important;
      display:flex !important; align-items:center !important; justify-content:space-between !important;
    }
    .modal-title { font-size: 15px !important; font-weight: 800 !important; color: #9f2946 !important; letter-spacing:-0.2px; }
    .modal-title::before { content:'●'; display:inline-block; color:#e8587a; font-size:9px; margin-right:8px; vertical-align:middle; }
    .modal-close {
      width:28px; height:28px; border-radius:50%; display:inline-flex !important; align-items:center; justify-content:center;
      background:rgba(255,255,255,0.6); color:#9f2946 !important; font-size:13px !important; cursor:pointer; transition:all .15s;
    }
    .modal-close:hover { background:#e8587a !important; color:#fff !important; transform:rotate(90deg); }
    .sel-modal-list { border:1px solid #eef0f3; border-radius:10px; overflow:hidden; background:#fafbfc; }
    .sel-modal-item {
      display:flex; align-items:center; gap:10px; padding:12px 14px !important;
      border-bottom:1px solid #f0f2f5 !important; background:#fff; transition:background .15s;
    }
    .sel-modal-item:last-child { border-bottom:none !important; }
    .sel-modal-item:hover { background:#fff5f8 !important; }
    .sel-modal-item-name { flex:1; font-size:13px; font-weight:600; color:#1a1a2e; }
    .sel-modal-item-id {
      font-size:11px; color:#6b7280; background:#eef2f7; padding:3px 9px; border-radius:12px; font-weight:600; font-family:monospace;
    }
    .sel-modal-item-btn {
      border:none; padding:5px 14px !important; border-radius:8px !important; cursor:pointer; font-size:12px; font-weight:700 !important;
      background: linear-gradient(135deg,#e8587a,#d64669) !important; color:#fff !important;
      box-shadow: 0 2px 6px rgba(232,88,122,0.35); transition:all .15s;
    }
    .sel-modal-item-btn:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(232,88,122,0.5); }
    .tree-modal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 18px !important;
      background: linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);
      border-bottom:1px solid #ffc9d6 !important; flex-shrink:0;
    }
    .tree-modal-header > div > div:first-child,
    .tree-modal-header > div > div:first-child > div:first-child { color:#9f2946 !important; font-weight:800 !important; }
    .tree-modal-header .modal-close { background:rgba(255,255,255,0.6) !important; color:#9f2946 !important; }
    .tree-modal-header .modal-close:hover { background:#e8587a !important; color:#fff !important; }
    .modal-box .form-control { border-radius:10px; border-color:#e5e7eb; transition:all .15s; }
    .modal-box .form-control:focus { border-color:#e8587a !important; box-shadow:0 0 0 3px rgba(232,88,122,0.12) !important; }
    .modal-box .btn-primary { background:linear-gradient(135deg,#e8587a,#d64669) !important; border:none !important; box-shadow:0 2px 6px rgba(232,88,122,0.35) !important; }
    .modal-box .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 10px rgba(232,88,122,0.5) !important; }
    .modal-box .btn-secondary { background:#f3f4f6 !important; color:#4b5563 !important; border:1px solid #e5e7eb !important; }
    .modal-box .btn-secondary:hover { background:#e5e7eb !important; }
  `;
  const style = document.createElement('style');
  style.id = '__shopjoy_modal_enh_style__';
  style.textContent = css;
  document.head.appendChild(style);
})();

/* ── 주문 상세 모달 ──────────────────────────────────
   Props: show (Boolean), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.OrderDetailModal = {
  name: 'OrderDetailModal',
  props: ['show', 'order'],
  emits: ['close'],
  computed: {
    siteNm() { return window.adminUtil.getSiteNm(); },
  },
  methods: {
    statusColor(s) {
      return ({
        '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
        '배송준비중': '#f59e0b', '배송중': '#f97316',
        '배송완료': '#22c55e', '완료': '#6b7280', '취소됨': '#9ca3af',
      })[s] || '#9ca3af';
    },
    statusLabel(s) { return s === '완료' ? '구매확정' : s; },
  },
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    @click.stop role="dialog" aria-modal="true">

    <!-- 헤더 -->
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">📦 주문 상세<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ order && order.orderId }}</div>
      </div>
      <button type="button" @click="$emit('close')" aria-label="닫기"
        style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
    </div>

    <!-- 콘텐츠 -->
    <div v-if="order" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px;">

      <!-- 주문일 / 상태 -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.82rem;color:var(--text-muted);">{{ order.orderDate }}</span>
        <span style="font-size:0.78rem;font-weight:700;padding:4px 12px;border-radius:20px;color:#fff;"
          :style="'background:' + statusColor(order.status)">{{ statusLabel(order.status) }}</span>
      </div>

      <!-- 상품 목록 -->
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">주문 상품</div>
        <div v-for="(item, i) in order.items" :key="i"
          style="display:flex;align-items:center;gap:10px;padding:8px 0;"
          :style="i < order.items.length-1 ? 'border-bottom:1px dashed var(--border);' : ''">
          <span style="font-size:1.4rem;flex-shrink:0;">{{ item.emoji }}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.prodNm }}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
            <div v-if="item.productCoupon && item.productCoupon.discount"
              style="margin-top:2px;font-size:0.7rem;color:#16a34a;">
              🎟 {{ item.productCoupon.name }} -{{ Number(item.productCoupon.discount).toLocaleString() }}원
            </div>
          </div>
          <div style="font-size:0.88rem;font-weight:700;color:var(--blue);flex-shrink:0;">{{ item.price.toLocaleString() }}원</div>
        </div>
      </div>

      <!-- 결제 정보 -->
      <div style="background:var(--bg-base);border-radius:8px;padding:12px 14px;font-size:0.82rem;display:flex;flex-direction:column;gap:6px;">
        <div v-if="order.shippingFee > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">배송비</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ order.shippingFee.toLocaleString() }}원</span>
        </div>
        <div v-if="order.shippingCoupon && Number(order.shippingCoupon.discount) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">🚚 배송비 쿠폰</span>
          <span style="font-weight:700;color:var(--blue);">-{{ Number(order.shippingCoupon.discount).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(order.cashPaid) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">💰 캐쉬 결제</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ Number(order.cashPaid).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(order.transferPaid) > 0" style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">🏦 계좌이체</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ Number(order.transferPaid).toLocaleString() }}원</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
          <span style="font-weight:700;color:var(--text-primary);">총 결제금액</span>
          <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">{{ order.totalPrice.toLocaleString() }}원</span>
        </div>
      </div>

      <!-- 택배 정보 -->
      <div v-if="order.courier && order.trackingNo"
        style="display:flex;align-items:center;gap:8px;font-size:0.8rem;padding:10px 14px;background:var(--bg-base);border-radius:8px;">
        <span style="color:var(--text-muted);">🚚 {{ order.courier }}</span>
        <span style="font-weight:600;color:var(--text-primary);">{{ order.trackingNo }}</span>
      </div>

    </div>

    <!-- 푸터 -->
    <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
      <button type="button" @click="$emit('close')" class="btn-blue"
        style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">닫기</button>
    </div>
  </div>
</div>
`,
};

/* ── 상품 상세 모달 ──────────────────────────────────
   Props: show (Boolean), product (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.ProductModal = {
  name: 'ProductModal',
  props: ['show', 'product', 'navigate', 'toggleLike', 'isLiked', 'addToCart', 'cartMode'],
  emits: ['close'],
  setup(props) {
    const { ref, watch, computed } = Vue;
    const selColor  = ref(null);
    const selSize   = ref(null);
    const qty       = ref(1);
    const inCart    = ref(false);
    const selThumb  = ref(0);
    const toastMsg  = ref('');
    const toastShow = ref(false);
    let toastTimer  = null;

    /* 내부 토스트 */
    const fireToast = (msg) => {
      toastMsg.value  = msg;
      toastShow.value = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastShow.value = false; }, 2400);
    };

    /* 상품 변경 시 초기화 */
    watch(() => props.product, (p) => {
      selColor.value = p?.opt1s?.[0] || null;
      selSize.value  = null;
      qty.value      = 1;
      inCart.value   = false;
      selThumb.value = 0;
    }, { immediate: true });

    /* 썸네일 목록 — 색상 선택 시 해당 색상 인덱스 기준으로 이미지 3장 순환 */
    const thumbImgs = computed(() => {
      const p = props.product;
      if (!p) return [];
      const IMG = 'assets/cdn/prod/img/shop/product';
      const colorIdx = Math.max(0, (p.opt1s || []).findIndex(c => c === selColor.value));
      const pid = parseInt(p.productId) || 1;
      if (pid <= 12) {
        return [0, 1, 2].map(off => {
          const n = ((pid - 1 + colorIdx + off) % 12) + 1;
          return `${IMG}/fashion/fashion-${n}.webp`;
        });
      } else {
        const base = ((pid - 1) % 23) + 1;
        return [0, 1, 2].map(off => {
          const n = ((base - 1 + colorIdx + off) % 23) + 1;
          return `${IMG}/product_${n}.png`;
        });
      }
    });

    /* 평점 — productId 기반 목 데이터 */
    const rating = computed(() => {
      const scores = [4.8, 4.5, 4.7, 4.2, 4.9, 4.3, 4.6, 4.1, 4.4, 4.8, 4.7, 4.5];
      const counts = [24, 18, 31,  9, 42, 15, 27,  8, 33, 19, 11, 28];
      const idx = ((parseInt(props.product?.productId) || 1) - 1) % 12;
      return { score: scores[idx], count: counts[idx] };
    });

    /* 별점 문자열 */
    const starStr = computed(() => {
      const r = Math.round(rating.value.score);
      return '★'.repeat(r) + '☆'.repeat(5 - r);
    });

    /* 좋아요 토글 */
    const handleLike = () => {
      if (!props.product) return;
      const wasLiked = props.isLiked && props.isLiked(props.product.productId);
      props.toggleLike && props.toggleLike(props.product.productId);
      fireToast(wasLiked ? '위시리스트에서 제거했습니다.' : '위시리스트에 추가했습니다.');
    };

    /* 옵션 에러 상태 */
    const errColor = ref(false);
    const errSize  = ref(false);

    /* 옵션 필수 검증 */
    const needsColor = () => props.product?.opt1s?.length > 0;
    const needsSize  = () => {
      const s = props.product?.opt2s;
      return s && s.length > 0 && !(s.length === 1 && s[0] === 'FREE');
    };
    const validate = () => {
      errColor.value = needsColor() && !selColor.value;
      errSize.value  = needsSize()  && !selSize.value;
      if (errColor.value || errSize.value) {
        const missing = [errColor.value && '색상', errSize.value && '사이즈'].filter(Boolean).join(', ');
        fireToast(`${missing}을(를) 선택해주세요.`);
        return false;
      }
      return true;
    };

    /* 장바구니 추가 (검증 포함) */
    const handleCart = () => {
      if (!validate()) return false;
      inCart.value = !inCart.value;
      fireToast(inCart.value ? '장바구니에 추가했습니다.' : '장바구니에서 제거했습니다.');
      return true;
    };

    /* 바로구매 검증 */
    const handleBuyNow = (navigateFn) => {
      if (!validate()) return false;
      navigateFn && navigateFn('order', { instantOrder: { product: props.product, color: selColor.value, size: selSize.value, qty: qty.value } });
      return true;
    };

    return { selColor, selSize, qty, inCart, selThumb, thumbImgs, rating, starStr,
             toastMsg, toastShow, errColor, errSize, handleLike, handleCart, handleBuyNow };
  },
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:400;display:flex;align-items:center;justify-content:center;padding:20px;"
  @click.self="$emit('close')">

  <!-- 내부 토스트 -->
  <transition name="fade">
    <div v-if="toastShow"
      style="position:fixed;bottom:36px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 28px;border-radius:4px;font-size:0.84rem;z-index:500;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.3);pointer-events:none;">
      {{ toastMsg }}
    </div>
  </transition>

  <div style="background:#fff;border-radius:8px;width:100%;max-width:840px;max-height:90vh;overflow:hidden;display:flex;"
    @click.stop role="dialog" aria-modal="true">

    <!-- 좌: 이미지 + 썸네일 -->
    <div v-if="product" style="flex:0 0 360px;background:#f5f5f5;display:flex;flex-direction:column;padding:28px 24px 20px;">
      <!-- 메인 이미지 -->
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:280px;">
        <img v-if="thumbImgs[selThumb]" :src="thumbImgs[selThumb]" :alt="product.prodNm"
          style="max-width:100%;max-height:300px;object-fit:contain;" />
      </div>
      <!-- 썸네일 목록 -->
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;">
        <div v-for="(img, i) in thumbImgs" :key="i" @click="selThumb=i"
          :style="{
            width:'68px', height:'68px', background:'#fff', cursor:'pointer', boxSizing:'border-box',
            border: selThumb===i ? '2px solid #1a1a1a' : '2px solid transparent',
            padding:'4px', borderRadius:'2px', transition:'border-color .15s',
          }">
          <img :src="img" style="width:100%;height:100%;object-fit:contain;" />
        </div>
      </div>
    </div>

    <!-- 우: 정보 -->
    <div v-if="product" style="flex:1;min-width:0;padding:28px 28px 24px;position:relative;display:flex;flex-direction:column;overflow-y:auto;">
      <button @click="$emit('close')"
        style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#bbb;line-height:1;">✕</button>

      <!-- 상품명 -->
      <h2 style="font-size:1.15rem;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-right:28px;line-height:1.4;">{{ product.prodNm }}</h2>

      <!-- 평점 -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
        <span style="color:#f59e0b;font-size:0.88rem;letter-spacing:1px;">{{ starStr }}</span>
        <span style="font-size:0.78rem;font-weight:600;color:#555;">{{ rating.score }}</span>
        <span style="font-size:0.75rem;color:#aaa;">({{ rating.count }}개 리뷰)</span>
      </div>

      <!-- 가격 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:1.3rem;font-weight:800;color:#1a1a1a;">{{ product.price }}</span>
        <span v-if="product.originalPrice" style="font-size:0.85rem;color:#bbb;text-decoration:line-through;">{{ product.originalPrice.toLocaleString ? product.originalPrice.toLocaleString() + '원' : product.originalPrice }}</span>
        <span v-if="product.originalPrice && product.priceNum" style="font-size:0.8rem;font-weight:700;color:#ef4444;">{{ Math.round((1 - product.priceNum / product.originalPrice) * 100) }}%</span>
      </div>

      <!-- 설명 -->
      <p style="font-size:0.84rem;color:#666;line-height:1.75;margin-bottom:16px;">{{ product.desc }}</p>

      <!-- 색상 -->
      <div v-if="product.opt1s && product.opt1s.length" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:0.75rem;font-weight:600;color:#999;letter-spacing:0.5px;">색상</span>
          <span v-if="selColor" style="font-size:0.75rem;color:#555;">{{ selColor.name }}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button v-for="c in product.opt1s" :key="c.name" @click="selColor=c; errColor=false; selThumb=0"
            :style="{
              width:'28px', height:'28px', borderRadius:'50%', background:c.hex, cursor:'pointer',
              border: selColor&&selColor.name===c.name ? '3px solid #1a1a1a' : '2px solid rgba(0,0,0,0.12)',
              outline: selColor&&selColor.name===c.name ? '2px solid #fff' : 'none',
              outlineOffset: '-4px', boxSizing:'border-box', transition:'border .15s',
            }" :title="c.name"></button>
        </div>
        <p v-if="errColor" style="margin:6px 0 0;font-size:0.75rem;color:#ef4444;">색상을 선택해주세요.</p>
      </div>

      <!-- 사이즈 -->
      <div v-if="product.opt2s && product.opt2s.length && !(product.opt2s.length===1 && product.opt2s[0]==='FREE')" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span :style="{ fontSize:'0.75rem', fontWeight:'600', letterSpacing:'0.5px', color: errSize ? '#ef4444' : '#999' }">사이즈</span>
          <span v-if="errSize" style="font-size:0.72rem;color:#ef4444;font-weight:500;">필수 선택</span>
        </div>
        <div :style="{
          display:'flex', gap:'6px', flexWrap:'wrap', padding:'8px',
          border: errSize ? '1px solid #ef4444' : '1px solid transparent',
          borderRadius:'3px', transition:'border-color .2s',
        }">
          <button v-for="s in product.opt2s" :key="s" @click="selSize=s; errSize=false"
            :style="{
              padding:'5px 14px', borderRadius:'2px', cursor:'pointer', fontSize:'0.8rem',
              border: selSize===s ? '2px solid #1a1a1a' : '2px solid #ddd',
              background: selSize===s ? '#1a1a1a' : '#fff',
              color: selSize===s ? '#fff' : '#555',
              fontWeight: selSize===s ? '700' : '400', transition:'all .15s',
            }">{{ s }}</button>
        </div>
      </div>

      <!-- 태그 -->
      <div v-if="product.tags && product.tags.length" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
        <span v-for="t in product.tags" :key="t"
          style="padding:2px 10px;background:#f5f5f5;border-radius:20px;font-size:0.72rem;color:#888;">#{{ t }}</span>
      </div>

      <!-- 수량 -->
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-top:4px;">
        <span style="font-size:0.75rem;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.5px;">수량</span>
        <div style="display:flex;align-items:center;border:1.5px solid #ddd;border-radius:2px;">
          <button @click="qty>1&&qty--"
            style="width:34px;height:34px;border:none;background:transparent;cursor:pointer;font-size:1.1rem;color:#555;line-height:1;">−</button>
          <span style="min-width:36px;text-align:center;font-size:0.88rem;font-weight:600;color:#1a1a1a;padding:0 4px;">{{ qty }}</span>
          <button @click="qty++"
            style="width:34px;height:34px;border:none;background:transparent;cursor:pointer;font-size:1.1rem;color:#555;line-height:1;">+</button>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div style="margin-top:auto;">
        <!-- 장바구니 모드: 장바구니 추가 버튼만 -->
        <template v-if="cartMode">
          <button @click="handleCart() && $emit('close')"
            style="width:100%;padding:13px;font-size:0.9rem;font-weight:700;background:#1a1a1a;color:#fff;border:none;border-radius:2px;cursor:pointer;letter-spacing:0.3px;">
            🛒 장바구니 추가
          </button>
        </template>
        <!-- 일반 모드: 전체 버튼 -->
        <template v-else>
          <div style="display:flex;gap:8px;">
            <button class="btn-blue" @click="navigate && navigate('prodView');$emit('close')"
              style="flex:1;padding:12px;font-size:0.85rem;">상세보기</button>
            <button class="btn-outline" @click="handleBuyNow(navigate) && $emit('close')"
              style="flex:1;padding:12px;font-size:0.85rem;">바로구매</button>
            <!-- 좋아요 토글 -->
            <button @click="handleLike"
              :style="{
                width:'44px', height:'44px', borderRadius:'4px', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s',
                border: isLiked && isLiked(product.productId) ? '1.5px solid #ef4444' : '1.5px solid #ddd',
                background: isLiked && isLiked(product.productId) ? '#fff5f5' : '#fff',
              }">
              <svg width="18" height="18" viewBox="0 0 24 24"
                :fill="isLiked && isLiked(product.productId) ? '#ef4444' : 'none'"
                :stroke="isLiked && isLiked(product.productId) ? '#ef4444' : '#999'" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <!-- 장바구니 토글 -->
            <button @click="handleCart"
              :style="{
                width:'44px', height:'44px', borderRadius:'4px', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s',
                border: inCart ? '1.5px solid #1a1a1a' : '1.5px solid #ddd',
                background: inCart ? '#1a1a1a' : '#fff',
              }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="inCart ? '#fff' : '#999'" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
`,
};

/* ── 주문자 정보 모달 ─────────────────────────────────
   Props: show (Boolean), user (Object | null), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.CustomerModal = {
  name: 'CustomerModal',
  props: ['show', 'user', 'order'],
  emits: ['close'],
  template: /* html */ `
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:380px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    @click.stop role="dialog" aria-modal="true">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">주문자 정보</div>
          <div v-if="order" style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">{{ order.orderId }}</div>
        </div>
      </div>
      <button type="button" @click="$emit('close')" aria-label="닫기" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
    </div>
    <div v-if="user" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;">
      <div style="background:var(--bg-base);border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">이름</span>
          <span style="font-weight:700;color:var(--text-primary);font-size:0.88rem;">{{ user.name }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">연락처</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.88rem;">{{ user.phone || '-' }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">이메일</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">{{ user.email || '-' }}</span>
        </div>
      </div>
      <div v-if="order && order.paymentDetails && order.paymentDetails.length"
        style="background:var(--bg-base);border-radius:8px;padding:14px 16px;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:8px;">입금 정보</div>
        <div v-for="(pd, i) in order.paymentDetails" :key="i"
          style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"
          :style="i>0?'border-top:1px dashed var(--border);padding-top:6px;margin-top:3px;':''">
          <span style="padding:1px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;"
            :style="pd.type==='계좌이체'||pd.type==='계좌환불'?'background:#dcfce7;color:#16a34a;':pd.type==='캐쉬'?'background:#fef3c7;color:#d97706;':'background:#dbeafe;color:#1d4ed8;'">
            {{ pd.type }}</span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">{{ pd.amount.toLocaleString() }}원</span>
          <span v-if="pd.account" style="color:var(--text-muted);font-size:0.78rem;">{{ pd.account }}</span>
        </div>
      </div>
    </div>
    <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
      <button type="button" @click="$emit('close')" class="btn-blue" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">닫기</button>
    </div>
  </div>
</div>
`,
};

/* ══════════════════════════════════════════════════════
   어드민 공통필터 팝업 선택 모달 (5종)
   Props: dispDataset  Emits: select(item), close
   ══════════════════════════════════════════════════════ */

/* ── 사이트 선택 모달 ── */
window.SiteSelectModal = {
  name: 'SiteSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.dispDataset.sites.filter(s => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return s.siteNm.toLowerCase().includes(k) || s.siteCode.toLowerCase().includes(k) || s.domain.toLowerCase().includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">사이트 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="사이트코드 / 사이트명 / 도메인 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="s in filtered" :key="s.siteId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ s.siteNm }}</div>
        <span class="sel-modal-item-id">{{ s.siteCode }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', s)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 판매업체 선택 모달 ── */
window.VendorSelectModal = {
  name: 'VendorSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.dispDataset.vendors.filter(v => {
      if (v.vendorType !== '판매업체') return false;
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return v.vendorNm.toLowerCase().includes(k) || v.bizNo.includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">판매업체 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="업체명 / 사업자번호 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="v in filtered" :key="v.vendorId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ v.vendorNm }}</div>
        <span class="sel-modal-item-id">{{ v.vendorId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', v)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 사용자 선택 모달 (부서트리 + 멀티) ── */
window.AdminUserSelectModal = {
  name: 'AdminUserSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed, reactive } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    /* ── 부서 트리 (depth 1부터 시작, root는 별도 렌더) ── */
    const selectedDeptId = ref(null);
    const deptKw = ref('');
    const buildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildDeptTree(items, d.deptId, depth + 1) }));
    const flattenDept = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flattenDept(n._kids, result); });
      return result;
    };
    const flatDeptTree = computed(() => {
      const kw = deptKw.value.trim().toLowerCase();
      const list = kw
        ? props.dispDataset.depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(kw))
        : props.dispDataset.depts;
      return flattenDept(buildDeptTree(list, null, 1)); /* depth 1부터 = 2레벨 */
    });

    const getDescDeptNames = (deptId) => {
      const names = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        const d = props.dispDataset.depts.find(x => x.deptId === id);
        if (d) { names.add(d.deptNm); props.dispDataset.depts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId)); }
      }
      return names;
    };

    /* ── 사용자 ── */
    const userKw = ref('');
    const selectedIds = reactive(new Set());
    const totalUsers = computed(() => props.dispDataset.adminUsers.length);

    const filtered = computed(() => {
      const k = userKw.value.trim().toLowerCase();
      let list = props.dispDataset.adminUsers;
      if (selectedDeptId.value !== null) {
        const names = getDescDeptNames(selectedDeptId.value);
        list = list.filter(u => names.has(u.dept));
      }
      if (k) list = list.filter(u =>
        u.name.toLowerCase().includes(k) || u.loginId.toLowerCase().includes(k) || (u.email || '').toLowerCase().includes(k)
      );
      return list;
    });

    const isChecked = (u) => selectedIds.has(u.adminUserId);
    const toggleUser = (u) => {
      if (selectedIds.has(u.adminUserId)) selectedIds.delete(u.adminUserId);
      else selectedIds.add(u.adminUserId);
    };
    const allChecked = computed(() => filtered.value.length > 0 && filtered.value.every(u => selectedIds.has(u.adminUserId)));
    const toggleAll = () => {
      if (allChecked.value) filtered.value.forEach(u => selectedIds.delete(u.adminUserId));
      else filtered.value.forEach(u => selectedIds.add(u.adminUserId));
    };
    const selectedCount = computed(() => selectedIds.size);
    const confirm = () => {
      const selected = props.dispDataset.adminUsers.filter(u => selectedIds.has(u.adminUserId));
      emit('select', selected);
    };

    return { siteNm, selectedDeptId, deptKw, flatDeptTree, userKw, filtered, totalUsers, isChecked, toggleUser, allChecked, toggleAll, selectedCount, confirm };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:780px;height:82vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">사용자 선택</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;letter-spacing:.02em;">{{ siteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selectedCount" style="font-size:12px;color:#e8587a;font-weight:700;background:#fff0f4;padding:3px 10px;border-radius:20px;">{{ selectedCount }}명 선택됨</span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="$emit('close')">✕</span>
      </div>
    </div>

    <!-- ── 바디 ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">

      <!-- 좌: 부서 트리 -->
      <div style="width:216px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">
        <!-- 부서 검색 -->
        <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
          <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">조직 / 부서</div>
          <div style="position:relative;">
            <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">🔍</span>
            <input v-model="deptKw" placeholder="부서 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
          </div>
        </div>
        <!-- 트리 목록 -->
        <div style="flex:1;overflow-y:auto;padding:6px 6px;">
          <!-- 루트: 전체 (1레벨) -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
            :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':'background:transparent;'"
            @click="selectedDeptId=null">
            <span style="font-size:8px;font-weight:900;flex-shrink:0;line-height:1;"
              :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">●</span>
            <span style="font-size:13px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ color: selectedDeptId===null?'#fff':'#374151' }">전체</span>
            <span style="font-size:10px;font-weight:600;flex-shrink:0;"
              :style="{ color: selectedDeptId===null?'rgba(255,255,255,0.75)':'#bbb' }">{{ totalUsers }}</span>
          </div>
          <!-- 2레벨~: 실 데이터 -->
          <div v-for="d in flatDeptTree" :key="d.deptId"
            style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
            :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.2);':'background:transparent;'"
            @click="selectedDeptId=d.deptId">
            <span style="flex-shrink:0;font-weight:800;line-height:1;"
              :style="{
                marginLeft: ((d._depth-1)*13)+'px',
                fontSize: d._depth===1?'10px':'8px',
                color: selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)]
              }">{{ ['●','◦','·'][Math.min(d._depth-1,2)] }}</span>
            <span style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ fontWeight: d._depth===1?'600':'400', color: selectedDeptId===d.deptId?'#fff':'#374151' }">
              {{ d.deptNm }}
            </span>
          </div>
          <div v-if="flatDeptTree.length===0" style="padding:20px 0;text-align:center;font-size:12px;color:#bbb;">없음</div>
        </div>
      </div>

      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <!-- 검색 -->
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">🔍</span>
            <input v-model="userKw" placeholder="이름 / 로그인ID / 이메일 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;color:#374151;" />
          </div>
        </div>
        <!-- 전체선택 바 -->
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="allChecked" @change="toggleAll" style="width:14px;height:14px;" />
            전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            총 <b style="color:#374151;">{{ filtered.length }}</b>명
          </span>
        </div>
        <!-- 카드 목록 -->
        <div style="flex:1;overflow-y:auto;">
          <div v-if="filtered.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>
            검색 결과가 없습니다.
          </div>
          <div v-for="u in filtered" :key="u.adminUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="isChecked(u)?'background:#fff5f7;':'' "
            @click="toggleUser(u)">
            <input type="checkbox" :checked="isChecked(u)" @click.stop="toggleUser(u)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#e8587a;cursor:pointer;" />
            <!-- 아바타 -->
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="isChecked(u)?'background:#e8587a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ u.name.charAt(0) }}
            </div>
            <!-- 텍스트 -->
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ u.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ u.loginId }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">{{ u.dept || '-' }} · {{ u.role }}</div>
            </div>
            <!-- 상태 뱃지 -->
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="u.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;'">
              {{ u.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="selectedCount?'color:#e8587a;font-weight:600;':'color:#bbb;'">
        {{ selectedCount ? selectedCount+'명이 선택되었습니다.' : '목록에서 사용자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="$emit('close')">취소</button>
        <button :disabled="!selectedCount"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selectedCount?'background:#e8587a;color:#fff;box-shadow:0 2px 8px rgba(232,88,122,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="confirm">확인{{ selectedCount?' ('+selectedCount+'명)':'' }}</button>
      </div>
    </div>

  </div>
</div>`,
};

/* ── 회원 선택 모달 ── */
window.MemberSelectModal = {
  name: 'MemberSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.dispDataset.members.filter(m => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return m.memberNm.toLowerCase().includes(k) || m.email.toLowerCase().includes(k) || String(m.userId).includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">회원 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="이름 / 이메일 / ID 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="m in filtered" :key="m.userId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ m.memberNm }} <span style="font-size:11px;color:#888;">{{ m.email }}</span></div>
        <span class="sel-modal-item-id">{{ m.userId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', m)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 주문 선택 모달 ── */
window.OrderSelectModal = {
  name: 'OrderSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const kw = ref('');
    const filtered = computed(() => props.dispDataset.orders.filter(o => {
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return o.orderId.toLowerCase().includes(k) || o.userNm.toLowerCase().includes(k) || o.prodNm.toLowerCase().includes(k);
    }));
    return { siteNm, kw, filtered };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">주문 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="주문ID / 회원명 / 상품명 검색" style="margin-bottom:12px;" />
    <div class="sel-modal-list">
      <div v-if="filtered.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="o in filtered" :key="o.orderId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ o.orderId }} <span style="font-size:11px;color:#888;">{{ o.userNm }}</span></div>
        <span class="sel-modal-item-id" style="background:#f0fff0;color:#389e0d;">{{ o.totalPrice.toLocaleString() }}원</span>
        <button class="sel-modal-item-btn" @click="$emit('select', o)">선택</button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 게시판 선택 모달 ── */
window.BbmSelectModal = {
  name: 'BbmSelectModal',
  props: ['dispDataset'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, computed, watch } = Vue;
    const kw       = ref('');
    const page     = ref(1);
    const pageSize = 6;

    const filtered = computed(() => props.dispDataset.bbms.filter(b => {
      if (b.useYn === 'N') return false;
      if (!kw.value) return true;
      const k = kw.value.toLowerCase();
      return b.bbmNm.toLowerCase().includes(k) || b.bbmCode.toLowerCase().includes(k) || b.bbmType.toLowerCase().includes(k);
    }));

    /* 검색어 변경 시 첫 페이지로 */
    watch(kw, () => { page.value = 1; });

    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
    const pageList   = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize));
    const pageNums   = computed(() => {
      const s = Math.max(1, page.value - 2), e = Math.min(totalPages.value, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const setPage = n => { if (n >= 1 && n <= totalPages.value) page.value = n; };

    const siteNm = computed(() => window.adminUtil.getSiteNm());
    const typeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const scopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');

    return { siteNm, kw, page, total, totalPages, pageList, pageNums, setPage, typeBadge, scopeBadge };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:560px;">
    <div class="modal-header"><span class="modal-title">게시판 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="kw" placeholder="게시판명 / 코드 / 유형 검색" style="margin-bottom:10px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ total }}건</div>
    <div class="sel-modal-list" style="min-height:200px;">
      <div v-if="pageList.length===0" style="text-align:center;color:#999;padding:30px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="b in pageList" :key="b.bbmId" class="sel-modal-item" style="gap:6px;">
        <div class="sel-modal-item-name" style="flex:1;min-width:0;">
          <span>{{ b.bbmNm }}</span>
          <span class="badge" :class="typeBadge(b.bbmType)" style="margin-left:5px;font-size:10px;">{{ b.bbmType }}</span>
          <span class="badge" :class="scopeBadge(b.scopeType)" style="margin-left:3px;font-size:10px;">{{ b.scopeType }}</span>
        </div>
        <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:3px;flex-shrink:0;">{{ b.bbmCode }}</code>
        <span class="sel-modal-item-id" style="background:#f0f0f0;color:#888;flex-shrink:0;">ID: {{ b.bbmId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', b)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="page===1" @click="setPage(1)">«</button>
      <button class="pager-btn" :disabled="page===1" @click="setPage(page-1)">‹</button>
      <button v-for="n in pageNums" :key="n" class="pager-btn" :class="{active:page===n}" @click="setPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="page===totalPages" @click="setPage(page+1)">›</button>
      <button class="pager-btn" :disabled="page===totalPages" @click="setPage(totalPages)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 템플릿 미리보기 모달 ── */
window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  props: ['tmpl', 'sampleParams'],
  emits: ['close'],
  setup(props) {
    const { computed } = Vue;

    const params = computed(() => {
      try { return JSON.parse(props.sampleParams || '{}'); }
      catch { return {}; }
    });

    const isHtml = computed(() =>
      ['메일템플릿', 'MMS템플릿'].includes(props.tmpl?.templateType)
    );

    /* 텍스트에 파라미터 치환 → HTML 반환 (미치환 변수는 빨간색 표시) */
    const applyAndRender = (text) => {
      if (!text) return '';
      let base = text;
      if (!isHtml.value) {
        /* 텍스트 계열: HTML 이스케이프 후 파라미터 치환 */
        base = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return base.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        params.value[k] !== undefined
          ? `<span style="background:#fff3cd;color:#856404;border-radius:3px;padding:0 2px;font-weight:600;">${String(params.value[k])}</span>`
          : `<span style="color:#dc3545;font-weight:600;">{{${k}}}</span>`
      );
    };

    const renderedSubject = computed(() => applyAndRender(props.tmpl?.subject || ''));
    const renderedContent = computed(() => applyAndRender(props.tmpl?.content || ''));

    const typeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const paramList = computed(() => Object.entries(params.value).map(([k, v]) => ({ k, v })));

    /* setup에서 tmpl을 반환해 템플릿에서 직접 접근 가능하게 */
    const fmtKey = k => '{{' + k + '}}';
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, tmpl: computed(() => props.tmpl), renderedSubject, renderedContent, isHtml, typeBadge, paramList, fmtKey };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:700px;">
    <div class="modal-header">
      <span class="modal-title">📄 템플릿 미리보기<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></span>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- 템플릿 기본정보 -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#f8f9fa;border-radius:8px;">
      <span class="badge" :class="typeBadge">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:14px;color:#1a1a2e;">{{ tmpl?.templateNm }}</span>
    </div>

    <!-- 파라미터 샘플 뱃지 -->
    <div v-if="paramList.length" style="margin-bottom:12px;">
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">파라미터 샘플값</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        <span v-for="p in paramList" :key="p.k"
          style="display:inline-flex;align-items:center;gap:3px;font-size:11px;background:#f0f4ff;border:1px solid #d0d9ff;border-radius:4px;padding:2px 8px;color:#2563eb;">
          <b>{{ fmtKey(p.k) }}</b>
          <span style="color:#aaa;margin:0 2px;">=</span>
          <span style="color:#856404;background:#fff3cd;border-radius:2px;padding:0 3px;">{{ p.v }}</span>
        </span>
      </div>
    </div>
    <div v-else style="margin-bottom:12px;font-size:12px;color:#aaa;">파라미터 샘플값 없음</div>

    <!-- 제목 -->
    <div v-if="tmpl?.subject" style="margin-bottom:12px;">
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:4px;">제목 (Subject)</div>
      <div style="padding:9px 13px;background:#fff;border:1px solid #e8e8e8;border-radius:7px;font-size:13px;color:#333;"
        v-html="renderedSubject"></div>
    </div>

    <!-- 내용 미리보기 -->
    <div>
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">내용 미리보기</div>
      <!-- HTML 타입 -->
      <div v-if="isHtml"
        style="padding:18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-height:120px;max-height:380px;overflow-y:auto;font-size:13px;line-height:1.8;"
        v-html="renderedContent"></div>
      <!-- 텍스트 타입 -->
      <pre v-else
        style="padding:14px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;min-height:80px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;"
        v-html="renderedContent"></pre>
    </div>

    <div style="margin-top:18px;display:flex;justify-content:flex-end;">
      <button class="btn btn-secondary" @click="$emit('close')">닫기</button>
    </div>
  </div>
</div>`,
};

/* ── 템플릿 발송하기 모달 ── */
window.TemplateSendModal = {
  name: 'TemplateSendModal',
  props: ['tmpl', 'dispDataset', 'showToast', 'showConfirm'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const targetType = ref('member');
    const kw = ref('');
    const selected = reactive([]);
    const getId = (item) => targetType.value === 'member' ? item.userId : item.adminUserId;

    /* ── 부서 트리 (관리자 탭) ── */
    const selectedDeptId = ref(null);
    const deptKw = ref('');
    const buildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildDeptTree(items, d.deptId, depth + 1) }));
    const flattenDept = (nodes, result = []) => { nodes.forEach(n => { result.push(n); flattenDept(n._kids, result); }); return result; };
    const flatDeptTree = computed(() => {
      const k = deptKw.value.trim().toLowerCase();
      const list = k ? props.dispDataset.depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(k)) : props.dispDataset.depts;
      return flattenDept(buildDeptTree(list, null, 1));
    });
    const getDescDeptNames = (deptId) => {
      const names = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        const d = props.dispDataset.depts.find(x => x.deptId === id);
        if (d) { names.add(d.deptNm); props.dispDataset.depts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId)); }
      }
      return names;
    };

    /* ── 등급 필터 (회원 탭) ── */
    const selectedGrade = ref(null);
    const MEMBER_GRADES = ['VIP', '우수', '일반'];

    /* ── 목록 ── */
    const memberList = computed(() => {
      const k = kw.value.trim().toLowerCase();
      let list = props.dispDataset.members || [];
      if (selectedGrade.value) list = list.filter(m => m.grade === selectedGrade.value);
      if (k) list = list.filter(m => m.memberNm?.toLowerCase().includes(k) || m.email?.toLowerCase().includes(k) || String(m.userId).includes(k));
      return list;
    });
    const userList = computed(() => {
      const k = kw.value.trim().toLowerCase();
      let list = props.dispDataset.adminUsers || [];
      if (selectedDeptId.value !== null) {
        const names = getDescDeptNames(selectedDeptId.value);
        list = list.filter(u => names.has(u.dept));
      }
      if (k) list = list.filter(u => u.name?.toLowerCase().includes(k) || u.email?.toLowerCase().includes(k) || String(u.adminUserId).includes(k));
      return list;
    });
    const list = computed(() => targetType.value === 'member' ? memberList.value : userList.value);

    const isSelected = (item) => selected.includes(getId(item));
    const toggleSelect = (item) => {
      const id = getId(item);
      const idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
    };
    const allChecked = computed(() => list.value.length > 0 && list.value.every(x => selected.includes(getId(x))));
    const toggleAll = () => {
      if (allChecked.value) { selected.splice(0); }
      else { list.value.forEach(x => { const id = getId(x); if (!selected.includes(id)) selected.push(id); }); }
    };

    watch(targetType, () => { selected.splice(0); kw.value = ''; selectedDeptId.value = null; selectedGrade.value = null; });

    const typeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const gradeBadgeColor = g => ({ 'VIP': '#f59e0b', '우수': '#2563eb', '일반': '#6b7280' }[g] || '#6b7280');

    const doSend = async () => {
      if (!selected.length) { props.showToast('발송할 수신자를 선택하세요.', 'info'); return; }
      const typeLabel = targetType.value === 'member' ? '회원' : '관리자';
      const ok = await props.showConfirm('템플릿 발송',
        `[${props.tmpl?.templateNm}] 템플릿을 선택된 ${typeLabel} ${selected.length}명에게 발송하시겠습니까?`,
        { btnOk: '발송', btnCancel: '취소' });
      if (!ok) return;
      props.showToast(`${typeLabel} ${selected.length}명에게 발송 요청이 완료되었습니다.`);
      emit('close');
    };

    return { siteNm, targetType, kw, list, selected, isSelected, toggleSelect, allChecked, toggleAll, typeBadge, gradeBadgeColor, doSend,
             selectedDeptId, deptKw, flatDeptTree, selectedGrade, MEMBER_GRADES };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:800px;height:84vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">📨 발송하기</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;">{{ siteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selected.length" style="font-size:12px;color:#52c41a;font-weight:700;background:#f6ffed;padding:3px 10px;border-radius:20px;">{{ selected.length }}명 선택됨</span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="$emit('close')">✕</span>
      </div>
    </div>

    <!-- ── 템플릿 정보 바 ── -->
    <div style="display:flex;align-items:center;gap:8px;padding:9px 20px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <span class="badge" :class="typeBadge" style="flex-shrink:0;">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:13px;color:#1a1a2e;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ tmpl?.templateNm }}</span>
      <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">{{ tmpl.templateCode }}</code>
    </div>

    <!-- ── 탭 ── -->
    <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <button @click="targetType='member'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="targetType==='member'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👥 회원
      </button>
      <button @click="targetType='user'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="targetType==='user'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👤 관리자
      </button>
    </div>

    <!-- ── 바디: 좌(필터) + 우(목록) ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">

      <!-- 좌: 필터 패널 -->
      <div style="width:200px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">

        <!-- 관리자 탭: 부서 트리 -->
        <template v-if="targetType==='user'">
          <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
            <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;">조직 / 부서</div>
            <div style="position:relative;">
              <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:11px;color:#bbb;">🔍</span>
              <input v-model="deptKw" placeholder="부서 검색"
                style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;" />
            </div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:6px 6px;">
            <!-- 전체 루트 -->
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="selectedDeptId=null">
              <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedDeptId===null?'#fff':'#e8587a' }">●</span>
              <span style="font-size:13px;font-weight:700;flex:1;" :style="{ color: selectedDeptId===null?'#fff':'#374151' }">전체</span>
            </div>
            <!-- 부서 트리 -->
            <div v-for="d in flatDeptTree" :key="d.deptId"
              style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="selectedDeptId=d.deptId">
              <span style="flex-shrink:0;font-weight:800;"
                :style="{ marginLeft:((d._depth-1)*13)+'px', fontSize:d._depth===1?'10px':'8px',
                          color:selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)] }">
                {{ ['●','◦','·'][Math.min(d._depth-1,2)] }}
              </span>
              <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                :style="{ fontWeight:d._depth===1?'600':'400', color:selectedDeptId===d.deptId?'#fff':'#374151' }">
                {{ d.deptNm }}
              </span>
            </div>
          </div>
        </template>

        <!-- 회원 탭: 등급 필터 -->
        <template v-else>
          <div style="padding:10px 10px 8px;border-bottom:1px solid #ebebeb;">
            <div style="font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase;">회원 등급</div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:6px 6px;">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
              :style="selectedGrade===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':''"
              @click="selectedGrade=null">
              <span style="font-size:8px;font-weight:900;flex-shrink:0;" :style="{ color: selectedGrade===null?'#fff':'#e8587a' }">●</span>
              <span style="font-size:13px;font-weight:700;" :style="{ color: selectedGrade===null?'#fff':'#374151' }">전체</span>
            </div>
            <div v-for="g in MEMBER_GRADES" :key="g"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
              :style="selectedGrade===g?'background:#e8587a;box-shadow:0 2px 6px rgba(232,88,122,0.2);':''"
              @click="selectedGrade=g">
              <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;"
                :style="{ background: selectedGrade===g?'#fff':gradeBadgeColor(g) }"></span>
              <span style="font-size:13px;font-weight:600;" :style="{ color: selectedGrade===g?'#fff':'#374151' }">{{ g }}</span>
            </div>
          </div>
        </template>

      </div>

      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">🔍</span>
            <input v-model="kw" :placeholder="targetType==='member'?'이름 / 이메일 / ID 검색':'이름 / 이메일 / ID 검색'"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="allChecked" @change="toggleAll" style="width:14px;height:14px;" /> 전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">총 <b style="color:#374151;">{{ list.length }}</b>명</span>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <div v-if="list.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>검색 결과가 없습니다.
          </div>
          <div v-for="item in list" :key="item.userId||item.adminUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="isSelected(item)?'background:#f0fff4;':''"
            @click="toggleSelect(item)">
            <input type="checkbox" :checked="isSelected(item)" @click.stop="toggleSelect(item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="isSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ (targetType==='member' ? item.memberNm : item.name).charAt(0) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ targetType==='member' ? item.memberNm : item.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ item.loginId || item.email }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                <template v-if="targetType==='user'">{{ item.dept || '-' }} · {{ item.role }}</template>
                <template v-else>{{ item.email }}</template>
              </div>
            </div>
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="targetType==='user'
                ? (item.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;')
                : (item.grade==='VIP'?'background:#fef3c7;color:#d97706;':item.grade==='우수'?'background:#dbeafe;color:#1d4ed8;':'background:#f3f4f6;color:#6b7280;')">
              {{ targetType==='user' ? item.status : item.grade }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="selected.length?'color:#52c41a;font-weight:600;':'color:#bbb;'">
        {{ selected.length ? selected.length+'명이 선택되었습니다.' : '목록에서 수신자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="$emit('close')">취소</button>
        <button :disabled="!selected.length"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="selected.length?'background:#52c41a;color:#fff;box-shadow:0 2px 8px rgba(82,196,26,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="doSend">
          📨 발송{{ selected.length?' ('+selected.length+'명)':'' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
};

/* ── 부서 트리 선택 모달 ──────────────────────────────────
   Props: dispDataset, excludeId (선택 불가 부서 ID, 보통 자기 자신)
   Emits: select({ deptId, deptNm }), close
   ─────────────────────────────────────────────────── */
/* ── 메뉴 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ menuId, menuNm }), close
   ─────────────────────────────────────────────────── */
/* ── 권한 트리 선택 모달 ──────────────────────────────
   Props: dispDataset, excludeId
   Emits: select({ roleId, roleNm }), close
   ─────────────────────────────────────────────────── */
window.RoleTreeModal = {
  name: 'RoleTreeModal',
  props: ['dispDataset', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(r => (r.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, _depth: depth, _kids: buildTree(items, r.roleId, depth + 1) }));
    };
    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };
    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); props.dispDataset.roles.filter(r => r.parentId === id).forEach(r => mark(r.roleId)); };
        mark(props.excludeId);
      }
      const base = props.dispDataset.roles.filter(r => !excSet.has(r.roleId) && r.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal ? base.filter(r => r.roleNm.toLowerCase().includes(kwVal) || r.roleCode.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });
    const select = (role) => emit('select', { roleId: role.roleId, roleNm: role.roleNm });
    const selectNone = () => emit('select', { roleId: null, roleNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());
    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위권한 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">권한을 클릭하면 상위권한으로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw" placeholder="권한명 또는 권한코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 권한으로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <div v-for="r in flatTree" :key="r.roleId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===r.roleId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=r.roleId" @mouseleave="hoverId=null" @click="select(r)">
        <span :style="{ marginLeft:(r._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: r._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(r._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(r._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ r.roleNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ r.roleCode }}</code>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: hoverId===r.roleId ? 1 : 0 }">›</span>
      </div>
      <div v-if="flatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 권한이 없습니다.' }}
      </div>
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

window.MenuTreeModal = {
  name: 'MenuTreeModal',
  props: ['dispDataset', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: buildTree(items, m.menuId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          props.dispDataset.menus.filter(m => m.parentId === id).forEach(m => markExclude(m.menuId));
        };
        markExclude(props.excludeId);
      }
      const base = props.dispDataset.menus.filter(m => !excSet.has(m.menuId) && m.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(m => m.menuNm.toLowerCase().includes(kwVal) || m.menuCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    const select = (menu) => emit('select', { menuId: menu.menuId, menuNm: menu.menuNm });
    const selectNone = () => emit('select', { menuId: null, menuNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위메뉴 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">메뉴를 클릭하면 상위메뉴로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw"
          placeholder="메뉴명 또는 메뉴코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null"
        @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;">
          <span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 메뉴로 등록</span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;"
          :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 메뉴 트리 항목들 -->
      <div v-for="m in flatTree" :key="m.menuId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===m.menuId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=m.menuId" @mouseleave="hoverId=null"
        @click="select(m)">

        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(m._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: m._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(m._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(m._depth,3)] }}
        </span>

        <!-- 메뉴명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ m.menuNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ m.menuCode }}</code>
        </div>

        <!-- hover 화살표 -->
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: hoverId===m.menuId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="flatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 메뉴가 없습니다.' }}
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

window.DeptTreeModal = {
  name: 'DeptTreeModal',
  props: ['dispDataset', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    /* ── 트리 구성 ── */
    const buildTree = (items, parentId, depth) => {
      return items
        .filter(d => (d.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: buildTree(items, d.deptId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      /* excludeId 및 그 자손 전체를 제외 (circular 방지) */
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          props.dispDataset.depts.filter(d => d.parentId === id).forEach(d => markExclude(d.deptId));
        };
        markExclude(props.excludeId);
      }
      const base = props.dispDataset.depts.filter(d => !excSet.has(d.deptId) && d.useYn === 'Y');
      const kwVal = kw.value.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(d => d.deptNm.toLowerCase().includes(kwVal) || d.deptCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    const select = (dept) => emit('select', { deptId: dept.deptId, deptNm: dept.deptNm });
    const selectNone = () => emit('select', { deptId: null, deptNm: '' });
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;line-height:1;">🌳</span>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위부서 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
          <div style="font-size:11px;color:#aaa;margin-top:1px;">부서를 클릭하면 상위부서로 지정됩니다</div>
        </div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw"
          placeholder="부서명 또는 부서코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 (고정 첫 항목) -->
      <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null"
        @click="selectNone">
        <!-- accent bar -->
        <div style="width:4px;align-self:stretch;border-radius:3px;background:#e8587a;flex-shrink:0;opacity:0.7;"></div>
        <span style="font-size:20px;flex-shrink:0;line-height:1;">🏢</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">최상위 부서로 등록</div>
        </div>
        <span style="font-size:16px;color:#e8587a;font-weight:700;transition:opacity .12s;"
          :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 부서 트리 항목들 -->
      <div v-for="d in flatTree" :key="d.deptId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===d.deptId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=d.deptId" @mouseleave="hoverId=null"
        @click="select(d)">

        <!-- 블릿 들여쓰기 -->
        <span :style="{ marginLeft:(d._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: d._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(d._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(d._depth,3)] }}
        </span>

        <!-- 부서명 + 코드 -->
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ d.deptNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ d.deptCode }}</code>
        </div>

        <!-- hover 화살표 -->
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;"
          :style="{ opacity: hoverId===d.deptId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="flatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 부서가 없습니다.' }}
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

/* ─────────────────────────────────────────────
   CategoryTreeModal  상위카테고리 선택 팝업
───────────────────────────────────────────── */
window.CategoryTreeModal = {
  name: 'CategoryTreeModal',
  props: ['dispDataset', 'excludeId'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    const kw = ref('');
    const hoverId = ref(null);

    const buildTree = (items, parentId, depth) => {
      return items
        .filter(c => (c.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(c => ({ ...c, _depth: depth, _kids: buildTree(items, c.categoryId, depth + 1) }));
    };

    const flatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); flatten(n._kids, result); });
      return result;
    };

    const flatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); props.dispDataset.categories.filter(c => c.parentId === id).forEach(c => mark(c.categoryId)); };
        mark(props.excludeId);
      }
      const base   = props.dispDataset.categories.filter(c => !excSet.has(c.categoryId) && c.status === '활성');
      const kwVal  = kw.value.trim().toLowerCase();
      const list   = kwVal ? base.filter(c => c.categoryNm.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });

    const select     = (cat) => emit('select', { categoryId: cat.categoryId, categoryNm: cat.categoryNm });
    const selectNone = () => emit('select', { categoryId: null, categoryNm: '' });
    const siteNm   = computed(() => window.adminUtil.getSiteNm());
    return { siteNm, kw, hoverId, flatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위카테고리 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ siteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">카테고리를 클릭하면 상위카테고리로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="kw" placeholder="카테고리명 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="hoverId='__none__'" @mouseleave="hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 카테고리로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <!-- 카테고리 트리 -->
      <div v-for="c in flatTree" :key="c.categoryId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: hoverId===c.categoryId ? '#fff5f7' : '' }"
        @mouseenter="hoverId=c.categoryId" @mouseleave="hoverId=null" @click="select(c)">
        <span :style="{ marginLeft:(c._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: c._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(c._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(c._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ c.categoryNm }}</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">{{ c.depth }}단계</span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: hoverId===c.categoryId ? 1 : 0 }">›</span>
      </div>
      <div v-if="flatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ kw ? '검색 결과가 없습니다.' : '선택 가능한 카테고리가 없습니다.' }}
      </div>
    </div>
    <div style="padding:11px 16px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

/* ── 위젯미리보기 모달 ─────────────────────────────────
   Props:
     show       Boolean   표시 여부
     mode       String    'all' | 'single'
                          all    → area 전체 위젯 (DispPanel)
                          single → 현재 form 단일 위젯 (DispWidget)
     tabLabel   String    탭 이름 (모달 제목용)
     area       String    mode=all 시 사용할 영역코드
     widgets    Array     mode=all 시 dispDataset.displays 배열
     widget     Object    mode=single 시 미리볼 위젯 데이터 (form 스냅샷)
   Emits: close
   ─────────────────────────────────────────────────────────── */
window.DispPreviewModal = {
  name: 'DispPreviewModal',
  props: {
    show:     { type: Boolean, default: false },
    mode:     { type: String,  default: 'single' },   /* 'all' | 'single' */
    tabLabel: { type: String,  default: '위젯미리보기' },
    area:     { type: String,  default: '' },
    widgets:  { type: Array,   default: () => [] },
    widget:   { type: Object,  default: () => ({}) },
  },
  emits: ['close'],
  setup(props) {
    const { computed } = Vue;

    /* mode=all: 해당 area의 활성 위젯 목록 */
    const areaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* mode=single: form 스냅샷에 status='활성' 강제 적용하여 렌더 */
    const previewWidget = computed(() => ({ ...props.widget, status: '활성' }));

    const WIDGET_LABEL = {
      image_banner: '이미지 배너', product_slider: '상품 슬라이더', product: '상품',
      chart_bar: '차트(Bar)', chart_line: '차트(Line)', chart_pie: '차트(Pie)',
      text_banner: '텍스트 배너', info_card: '정보 카드', popup: '팝업',
      file: '파일', coupon: '쿠폰', html_editor: 'HTML 에디터',
      event_banner: '이벤트', cache_banner: '캐쉬', widget_embed: '위젯 임베드',
    };
    const widgetLabel = computed(() => WIDGET_LABEL[props.widget?.widgetType] || props.widget?.widgetType || '');

    return { areaWidgets, previewWidget, widgetLabel };
  },
  template: /* html */`
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;"
  @click.self="$emit('close')">
  <div style="background:#fff;border-radius:12px;width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);overflow:hidden;"
    @click.stop>

    <!-- 헤더 -->
    <div style="padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fafafa;">
      <div>
        <span style="font-size:14px;font-weight:700;color:#333;">👁 위젯미리보기</span>
        <span style="margin-left:8px;font-size:12px;color:#e8587a;font-weight:600;">{{ tabLabel }}</span>
        <span v-if="mode==='single' && widgetLabel" style="margin-left:6px;font-size:11px;color:#aaa;">({{ widgetLabel }})</span>
        <span v-if="mode==='all' && area" style="margin-left:6px;font-size:11px;color:#aaa;">영역: {{ area }}</span>
      </div>
      <button @click="$emit('close')"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#aaa;line-height:1;padding:2px 6px;">✕</button>
    </div>

    <!-- 콘텐츠 -->
    <div style="flex:1;overflow-y:auto;padding:20px;">

      <!-- mode=all: 해당 area 전체 위젯 -->
      <template v-if="mode==='all'">
        <div v-if="areaWidgets.length===0"
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">📭</div>
          [{{ area }}] 영역에 활성 위젯이 없습니다.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="w in areaWidgets" :key="w.dispId">
            <div style="font-size:10px;color:#bbb;margin-bottom:4px;font-family:monospace;">
              #{{ w.dispId }} {{ w.name }} · 순서{{ w.sortOrder }}
            </div>
            <disp-x04-widget
              :params="{ isLoggedIn: false, userGrade: '' }"
              :disp-dataset="{ displays: [], codes: [] }"
              :disp-opt="{ showBadges: true }"
              :widget-item="w"
            />
          </div>
        </div>
      </template>

      <!-- mode=single: 현재 form 단일 위젯 -->
      <template v-else>
        <div style="font-size:10px;color:#bbb;margin-bottom:8px;font-family:monospace;">
          현재 입력값 기준 실시간 위젯미리보기
        </div>
        <!-- widgetType 없으면 DispWidget 렌더 금지 (widgetType.startsWith 오류 방지) -->
        <div v-if="previewWidget.widgetType"
          style="border:1px dashed #e0e0e0;border-radius:8px;padding:16px;background:#fafbff;">
          <disp-x04-widget
            :params="{ isLoggedIn: false, userGrade: '' }"
            :disp-dataset="{ displays: [], codes: [] }"
            :disp-opt="{ showBadges: true }"
            :widget-item="previewWidget"
          />
        </div>
        <div v-else
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          <div style="font-size:28px;margin-bottom:8px;">🎨</div>
          행(1~5행)에서 위젯 유형을 선택하면<br>위젯미리보기가 표시됩니다.
        </div>
      </template>

    </div>

    <!-- 푸터 -->
    <div style="padding:10px 18px;border-top:1px solid #f0f0f0;text-align:right;flex-shrink:0;background:#fafafa;">
      <button class="btn btn-secondary" @click="$emit('close')">닫기</button>
    </div>
  </div>
</div>`,
};

/* ── 전시 DispUi 모달 ──────────────────────────────────────────
   Props:
     show      (Boolean)  — 표시 여부
     params    (Object)   — { areas[], date, time, status, condition,
                              authRequired, authGrade, siteId, memberId, viewOpts }
     dispDataset (Object)   — dispDataset 객체
     title     (String)   — 모달 헤더 제목
   Emits: close, open-popup
   ── DispUiPage.js와 동일한 DispX01Ui를 모달 안에서 렌더링
      파라미터 요약 바는 DispX01Ui 내부에서 viewOpts 있을 때 표시 ── */
window.DispUiModal = {
  name: 'DispUiModal',
  props: {
    show:      { type: Boolean, default: false },
    params:    { type: Object,  default: () => ({
      areas: [], date: '', time: '', status: '', condition: '',
      authRequired: '', authGrade: '', siteId: '', memberId: '', viewOpts: '',
    }) },
    dispDataset: { type: Object,  default: () => window.dispDataset || { displays: [], codes: [] } },
    title:     { type: String,  default: 'DispUi미리보기' },
  },
  emits: ['close', 'open-popup'],
  components: { DispX01Ui: window.DispX01Ui },
  setup() {
    const innerKey = Vue.ref(0);
    return { innerKey };
  },
  template: /* html */`
<div v-if="show"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;overflow-y:auto;"
  @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:1200px;max-width:96vw;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.4);display:flex;flex-direction:column;"
    @click.stop>

    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#6a1b9a,#4a148c);color:#fff;padding:14px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:2;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:15px;font-weight:700;">🖥 {{ title }}</span>
        <span style="font-size:11px;opacity:.6;">파라미터 기준 렌더링</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button @click="innerKey++"
          style="font-size:11px;padding:4px 12px;border-radius:7px;border:1px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-weight:600;">
          🔄 재조회
        </button>
        <button @click="$emit('close')"
          style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;opacity:.8;line-height:1;padding:0;">×</button>
      </div>
    </div>

    <!-- 본문: DispX01Ui (파라미터 요약 바는 viewOpts 있을 때 내부 표시) -->
    <disp-x01-ui :key="innerKey" :params="params" :disp-dataset="dispDataset" />

    <!-- 푸터 -->
    <div style="padding:10px 20px;background:#f8f8f8;border-top:1px solid #f0f0f0;border-radius:0 0 14px 14px;display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:0;z-index:1;">
      <button @click="$emit('open-popup')"
        style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #a5d6a7;background:#e8f5e9;color:#2e7d32;cursor:pointer;font-weight:600;">
        🔗 팝업으로 열기
      </button>
      <button class="btn btn-secondary btn-sm" @click="$emit('close')">닫기</button>
    </div>

  </div>
</div>`,
};

/* ── 카테고리 멀티선택 모달 (사용자 페이스 Sample용) ────────────
   Props: show (Boolean), selectedIds (Array of categoryId)
   Emits: close, apply (Array of categoryId)
   window.dispDataset.categories 직접 참조 (props 없음)
   트리 구조: 전체(root) > 루트노드(체크+[+/-]) > 자식노드(체크)
   ─────────────────────────────────────────────────────────── */
window.CategorySelectModal = {
  name: 'CategorySelectModal',
  props: {
    show:        { type: Boolean, default: false },
    selectedIds: { type: Array,   default: () => [] },
  },
  emits: ['close', 'apply'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, watchEffect } = Vue;

    const kw = ref('');

    const allCats = computed(() =>
      ((window.dispDataset || {}).categories || [])
        .filter(c => c.status === '활성')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    /* 루트/자식 */
    const roots = computed(() => {
      const kwv = kw.value.trim().toLowerCase();
      let list = allCats.value;
      if (kwv) {
        const matchIds = new Set(list.filter(c => c.categoryNm.toLowerCase().includes(kwv)).map(c => c.categoryId));
        list = list.filter(c => matchIds.has(c.categoryId) || matchIds.has(c.parentId));
      }
      return list.filter(c => !c.parentId);
    });

    const childrenOf = (parentId) => {
      const kwv = kw.value.trim().toLowerCase();
      let list = allCats.value.filter(c => c.parentId === parentId);
      if (kwv) list = list.filter(c => c.categoryNm.toLowerCase().includes(kwv));
      return list;
    };

    /* 펼침 상태 — 루트는 기본 펼침 */
    const expanded = reactive(new Set());
    const toggleExpand = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    watchEffect(() => { roots.value.forEach(r => expanded.add(r.categoryId)); });

    /* 선택 상태 (로컬 복사) */
    const localSel = reactive(new Set());
    watch(() => props.show, (v) => {
      if (v) { localSel.clear(); props.selectedIds.forEach(id => localSel.add(id)); }
    }, { immediate: true });

    /* 전체 선택 */
    const allIds = computed(() => {
      const ids = [];
      roots.value.forEach(r => { ids.push(r.categoryId); childrenOf(r.categoryId).forEach(c => ids.push(c.categoryId)); });
      return ids;
    });
    const isAllOn  = computed(() => allIds.value.length > 0 && allIds.value.every(id => localSel.has(id)));
    const isSomeOn = computed(() => !isAllOn.value && allIds.value.some(id => localSel.has(id)));
    const toggleAll = () => { if (isAllOn.value) allIds.value.forEach(id => localSel.delete(id)); else allIds.value.forEach(id => localSel.add(id)); };

    /* 루트 선택 (자식 포함) */
    const toggleRoot = (root) => {
      const ch = childrenOf(root.categoryId);
      const allOn = localSel.has(root.categoryId) && ch.every(c => localSel.has(c.categoryId));
      if (allOn) { localSel.delete(root.categoryId); ch.forEach(c => localSel.delete(c.categoryId)); }
      else       { localSel.add(root.categoryId);    ch.forEach(c => localSel.add(c.categoryId)); }
    };
    const isRootFull = (root) => localSel.has(root.categoryId) && childrenOf(root.categoryId).every(c => localSel.has(c.categoryId));
    const isRootPart = (root) => !isRootFull(root) && (localSel.has(root.categoryId) || childrenOf(root.categoryId).some(c => localSel.has(c.categoryId)));

    /* 자식 선택 */
    const toggleChild = (id) => { if (localSel.has(id)) localSel.delete(id); else localSel.add(id); };

    const reset = () => localSel.clear();
    const apply = () => { emit('apply', [...localSel]); emit('close'); };

    return { kw, roots, childrenOf, expanded, toggleExpand, localSel, toggleChild, toggleRoot, toggleAll, isRootFull, isRootPart, isAllOn, isSomeOn, reset, apply };
  },
  template: /* html */`
<div v-if="show" style="position:fixed;inset:0;background:rgba(0,0,0,0.42);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:10px;width:340px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.22);" @click.stop>

    <!-- 헤더 -->
    <div style="padding:11px 16px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <span style="font-size:13px;font-weight:700;color:#222;">📂 카테고리 선택</span>
      <button @click="$emit('close')" style="background:none;border:none;cursor:pointer;font-size:15px;color:#aaa;padding:2px 5px;line-height:1;">✕</button>
    </div>

    <!-- 검색 -->
    <div style="padding:7px 12px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <input v-model="kw" type="text" placeholder="카테고리명 검색" style="width:100%;box-sizing:border-box;font-size:12px;padding:4px 9px;border:1px solid #ddd;border-radius:5px;outline:none;" />
    </div>

    <!-- 트리 목록 -->
    <div style="flex:1;overflow-y:auto;padding:4px 0;">
      <div v-if="roots.length===0" style="text-align:center;padding:30px;font-size:12px;color:#bbb;">검색 결과 없음</div>

      <!-- ① 전체 노드 -->
      <div @click="toggleAll"
        style="display:flex;align-items:center;gap:6px;padding:6px 12px;cursor:pointer;user-select:none;"
        :style="isAllOn?'background:#fff4f6;':''">
        <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
          :style="isAllOn?'border-color:#e8587a;background:#e8587a;':isSomeOn?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
          <span v-if="isAllOn"  style="color:#fff;font-size:9px;line-height:1;">✓</span>
          <span v-else-if="isSomeOn" style="color:#e8587a;font-size:11px;font-weight:900;line-height:1;margin-top:-1px;">−</span>
        </div>
        <span style="font-size:12px;font-weight:700;color:#333;">전체</span>
      </div>

      <!-- ② 루트 + 자식 트리 -->
      <div style="position:relative;padding-left:12px;">
        <!-- 레벨1 세로선 (전체 → 루트들) -->
        <div style="position:absolute;left:19px;top:0;bottom:14px;width:1px;background:#d0d0d0;"></div>

        <div v-for="root in roots" :key="root.categoryId">
          <!-- 루트 행 -->
          <div style="display:flex;align-items:center;gap:4px;padding:5px 8px;cursor:pointer;user-select:none;"
            :style="isRootFull(root)?'background:#fff4f6;':isRootPart(root)?'background:#fffbf4;':''">
            <!-- 수평 연결선 -->
            <div style="width:12px;height:1px;background:#d0d0d0;flex-shrink:0;"></div>
            <!-- [+]/[-] 펼침 버튼 -->
            <span @click.stop="toggleExpand(root.categoryId)"
              style="width:13px;height:13px;border:1px solid #bbb;border-radius:2px;background:#f5f5f5;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#666;cursor:pointer;flex-shrink:0;line-height:1;">
              {{ expanded.has(root.categoryId) ? '−' : '+' }}
            </span>
            <!-- 체크박스 -->
            <div @click.stop="toggleRoot(root)"
              style="width:13px;height:13px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="isRootFull(root)?'border-color:#e8587a;background:#e8587a;':isRootPart(root)?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
              <span v-if="isRootFull(root)" style="color:#fff;font-size:8px;line-height:1;">✓</span>
              <span v-else-if="isRootPart(root)" style="color:#e8587a;font-size:10px;font-weight:900;line-height:1;margin-top:-1px;">−</span>
            </div>
            <!-- 라벨 -->
            <span @click.stop="toggleRoot(root)" style="font-size:12px;font-weight:700;color:#222;flex:1;">{{ root.categoryNm }}</span>
          </div>

          <!-- 자식 행들 -->
          <template v-if="expanded.has(root.categoryId)">
            <div style="position:relative;padding-left:26px;">
              <!-- 레벨2 세로선 (루트 → 자식들) -->
              <div style="position:absolute;left:33px;top:0;bottom:14px;width:1px;background:#d0d0d0;"></div>

              <div v-for="child in childrenOf(root.categoryId)" :key="child.categoryId"
                @click="toggleChild(child.categoryId)"
                style="display:flex;align-items:center;gap:4px;padding:4px 8px;cursor:pointer;user-select:none;"
                :style="localSel.has(child.categoryId)?'background:#fff4f6;':''">
                <!-- 수평 연결선 -->
                <div style="width:12px;height:1px;background:#d0d0d0;flex-shrink:0;"></div>
                <!-- 리프 공간 (expand 버튼 자리) -->
                <span style="width:13px;flex-shrink:0;"></span>
                <!-- 체크박스 -->
                <div style="width:13px;height:13px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                  :style="localSel.has(child.categoryId)?'border-color:#e8587a;background:#e8587a;':'border-color:#aaa;background:#fff;'">
                  <span v-if="localSel.has(child.categoryId)" style="color:#fff;font-size:8px;line-height:1;">✓</span>
                </div>
                <!-- 라벨 -->
                <span style="font-size:12px;color:#333;flex:1;">{{ child.categoryNm }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div style="padding:9px 12px;border-top:1px solid #e0e0e0;display:flex;align-items:center;gap:8px;flex-shrink:0;">
      <span style="font-size:11px;color:#aaa;flex:1;">{{ localSel.size }}개 선택</span>
      <button @click="reset" style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#666;cursor:pointer;">초기화</button>
      <button @click="apply" style="font-size:12px;padding:4px 16px;border:none;border-radius:6px;background:#e8587a;color:#fff;font-weight:700;cursor:pointer;">적용</button>
    </div>
  </div>
</div>
  `,
};

/* ═══════════════════════════════════════════════════════════════════
 * RowPickModal — 전시항목(위젯 행) 선택 팝업 (패널에 전시항목 복사)
 * ═══════════════════════════════════════════════════════════════════ */
window.RowPickModal = {
  name: 'RowPickModal',
  props: {
    title: { type: String, default: '전시항목 복사' },
    displays: { type: Array, default: () => [] },   /* 전체 패널(dispDataset.displays) */
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludePanelId: { type: Number, default: null },/* 현재 패널 제외 */
  },
  emits: ['close', 'pick-multi'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = k => treeOpen.value.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    /* 모든 위젯을 flatten (panel 정보 포함) */
    const allRows = computed(() => {
      const out = [];
      (props.displays || []).forEach(p => {
        if (props.excludePanelId && p.dispId === props.excludePanelId) return;
        (p.rows || []).forEach((r, i) => {
          out.push({
            __rowId: p.dispId + '_' + i,
            __panelId: p.dispId,
            __panelName: p.name,
            __area: p.area,
            __status: p.status,
            row: r,
            sortIdx: i,
          });
        });
      });
      return out;
    });

    const filtered = computed(() => allRows.value.filter(o => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !(o.row.widgetNm||'').toLowerCase().includes(kw)
           && !(o.__panelName||'').toLowerCase().includes(kw)
           && !(o.row.widgetType||'').toLowerCase().includes(kw)) return false;
      if (searchStatus.value && o.__status !== searchStatus.value) return false;
      if (selectedTreeKey.value) {
        const top = (o.__area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const s = Math.max(1, cur-2), e = Math.min(last, s+4);
      return Array.from({ length: e-s+1 }, (_, i) => s+i);
    });
    const tree = computed(() => {
      const g = {};
      allRows.value.forEach(o => {
        const top = (o.__area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    const checked = ref(new Set());
    const isChecked = (id) => checked.value.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked.value = s;
    };
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(o => checked.value.has(o.__rowId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(o => s.delete(o.__rowId));
      else pageList.value.forEach(o => s.add(o.__rowId));
      checked.value = s;
    };
    const pickMulti = () => {
      const picks = allRows.value.filter(o => checked.value.has(o.__rowId));
      if (!picks.length) return;
      emit('pick-multi', picks.map(o => ({ ...o.row })));
      checked.value = new Set();
    };
    const pickOne = (o) => emit('pick-multi', [{ ...o.row }]);
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';

    const WIDGET_LABEL = {
      image_banner:'이미지배너', product_slider:'상품슬라이더', product:'상품',
      chart_bar:'차트', chart_line:'차트', chart_pie:'차트', text_banner:'텍스트',
      info_card:'정보카드', popup:'팝업', file:'파일', coupon:'쿠폰',
      html_editor:'HTML', event_banner:'이벤트', cache_banner:'캐쉬', widget_embed:'위젯',
    };
    const wLabel = (t) => WIDGET_LABEL[t] || t || '-';

    return {
      searchKw, searchStatus, pager, PAGE_SIZES,
      total, totalPages, pageList, pageNums,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, tree,
      statusCls, areaNm, wLabel,
      checked, isChecked, toggleCheck, allChecked, toggleCheckAll, pickMulti, pickOne,
    };
  },
  template: /* html */`
<div @click.self="$emit('close')"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="background:#fafafa;border-radius:14px;width:1100px;max-width:98vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">🔗 {{ title }}</span>
      <button @click="$emit('close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">×</button>
    </div>
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="위젯명·패널명·유형 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchStatus" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">패널상태 전체</option>
        <option value="활성">활성</option>
        <option value="비활성">비활성</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in tree" :key="node.label"
            @click="selectTree(node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>▸ {{ node.label }}</span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>총 <b>{{ total }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 복사</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="admin-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;"><input type="checkbox" :checked="allChecked" @change="toggleCheckAll" /></th>
                <th style="width:110px;">위젯 유형</th>
                <th>전시항목 정보</th>
                <th style="width:160px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageList.length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 전시항목이 없습니다.</td></tr>
              <tr v-for="o in pageList" :key="o.__rowId"
                :style="isChecked(o.__rowId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(o.__rowId)" @change="toggleCheck(o.__rowId)" />
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ wLabel(o.row.widgetType) }}</span>
                </td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <span style="font-size:14px;font-weight:700;color:#222;">{{ o.row.widgetNm || ('위젯 '+(o.sortIdx+1)) }}</span>
                    <span class="badge" :class="statusCls(o.__status)" style="font-size:11px;margin-left:8px;">{{ o.__status }}</span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span><b style="color:#888;">소속 패널:</b> {{ o.__panelName }} (#{{ o.__panelId }})</span>
                    <span v-if="o.row.clickAction && o.row.clickAction !== 'none'" style="margin-left:10px;"><b style="color:#888;">클릭:</b> {{ o.row.clickAction }}</span>
                  </div>
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                    {{ (o.__area||'').split('_')[0] || '-' }} &gt; {{ areaNm(o.__area) }}
                  </span>
                </td>
                <td style="vertical-align:top;padding-top:10px;text-align:right;">
                  <button @click="pickOne(o)" class="btn btn-primary btn-sm" style="font-size:11px;">복사</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
          <div></div>
          <div class="pager">
            <button :disabled="pager.page===1" @click="pager.page=1">«</button>
            <button :disabled="pager.page===1" @click="pager.page--">‹</button>
            <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===totalPages" @click="pager.page++">›</button>
            <button :disabled="pager.page===totalPages" @click="pager.page=totalPages">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1">
              <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
};

/* ═══════════════════════════════════════════════════════════════════
 * AreaPickModal — 전시영역 선택 팝업 (UI에 영역 추가)
 * ═══════════════════════════════════════════════════════════════════ */
window.AreaPickModal = {
  name: 'AreaPickModal',
  props: {
    title: { type: String, default: '전시영역 추가' },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeUi: { type: String, default: '' },        /* 제외할 UI 코드 (이미 포함된 영역 제외) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchUseYn = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = k => treeOpen.value.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const filtered = computed(() => (props.areas || []).filter(a => {
      if (props.excludeUi && a.uiCode === props.excludeUi) return false;
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !(a.codeValue||'').toLowerCase().includes(kw) && !(a.codeLabel||'').toLowerCase().includes(kw)) return false;
      if (searchUseYn.value && a.useYn !== searchUseYn.value) return false;
      if (selectedTreeKey.value) {
        const top = (a.codeValue || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.codeLabel||'').localeCompare(b.codeLabel||'')));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const s = Math.max(1, cur-2), e = Math.min(last, s+4);
      return Array.from({ length: e-s+1 }, (_, i) => s+i);
    });
    const tree = computed(() => {
      const g = {};
      (props.areas || []).forEach(a => {
        if (props.excludeUi && a.uiCode === props.excludeUi) return;
        const top = (a.codeValue || '(기타)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });
    const statusCls = (y) => y === 'Y' ? 'badge-green' : 'badge-gray';
    const onPick = (a) => emit('pick', a);

    /* 멀티선택 */
    const checked = ref(new Set());
    const isChecked = (id) => checked.value.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked.value = s;
    };
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(a => checked.value.has(a.codeId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(a => s.delete(a.codeId));
      else pageList.value.forEach(a => s.add(a.codeId));
      checked.value = s;
    };
    const pickMulti = () => {
      const ids = Array.from(checked.value);
      if (!ids.length) return;
      ids.forEach(id => {
        const a = (props.areas || []).find(x => x.codeId === id);
        if (a) emit('pick', a);
      });
      checked.value = new Set();
    };

    return {
      searchKw, searchUseYn, pager, PAGE_SIZES,
      total, totalPages, pageList, pageNums,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, tree,
      statusCls, onPick,
      checked, isChecked, toggleCheck, allChecked, toggleCheckAll, pickMulti,
    };
  },
  template: /* html */`
<div @click.self="$emit('close')"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="background:#fafafa;border-radius:14px;width:1100px;max-width:98vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">🔗 {{ title }}</span>
      <button @click="$emit('close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">×</button>
    </div>
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="영역코드·영역명 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchUseYn" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">사용 전체</option>
        <option value="Y">사용</option>
        <option value="N">미사용</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in tree" :key="node.label"
            @click="selectTree(node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>▸ {{ node.label }}</span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>총 <b>{{ total }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 추가</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="admin-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;"><input type="checkbox" :checked="allChecked" @change="toggleCheckAll" /></th>
                <th style="width:56px;">ID</th>
                <th>영역 정보</th>
                <th style="width:140px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageList.length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 영역이 없습니다.</td></tr>
              <tr v-for="a in pageList" :key="a.codeId"
                :style="isChecked(a.codeId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(a.codeId)" @change="toggleCheck(a.codeId)" />
                </td>
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">{{ a.codeId }}</td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <code style="background:#f0f2f5;color:#555;padding:1px 6px;border-radius:3px;font-size:10px;">{{ a.codeValue }}</code>
                    <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">{{ a.codeLabel }}</span>
                    <span class="badge" :class="statusCls(a.useYn)" style="font-size:11px;margin-left:8px;">{{ a.useYn==='Y'?'사용':'미사용' }}</span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span><b style="color:#888;">유형:</b> {{ a.areaType || '-' }}</span>
                    <span style="margin-left:10px;"><b style="color:#888;">표시:</b> {{ a.layoutType==='dashboard' ? '🧩 대시보드' : '🔲 그리드 '+(a.gridCols||1)+'열' }}</span>
                    <span v-if="a.uiCode" style="margin-left:10px;"><b style="color:#888;">현재UI:</b> {{ a.uiCode }}</span>
                  </div>
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                    {{ (a.codeValue||'').split('_')[0] || '-' }} &gt; {{ a.codeLabel }}
                  </span>
                </td>
                <td style="vertical-align:top;padding-top:10px;text-align:right;">
                  <button @click="onPick(a)" class="btn btn-primary btn-sm" style="font-size:11px;">선택</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
          <div></div>
          <div class="pager">
            <button :disabled="pager.page===1" @click="pager.page=1">«</button>
            <button :disabled="pager.page===1" @click="pager.page--">‹</button>
            <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===totalPages" @click="pager.page++">›</button>
            <button :disabled="pager.page===totalPages" @click="pager.page=totalPages">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1">
              <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
};

/* ═══════════════════════════════════════════════════════════════════
 * PanelPickModal — 전시패널 선택 팝업 (영역에 패널 추가)
 * ═══════════════════════════════════════════════════════════════════ */
window.PanelPickModal = {
  name: 'PanelPickModal',
  props: {
    title: { type: String, default: '전시패널 추가' },
    displays: { type: Array, default: () => [] },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeArea: { type: String, default: '' },     /* 제외할 영역코드 (이미 포함) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = k => treeOpen.value.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    const filtered = computed(() => (props.displays || []).filter(p => {
      if (props.excludeArea && p.area === props.excludeArea) return false;
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !(p.name||'').toLowerCase().includes(kw) && !(p.area||'').toLowerCase().includes(kw)) return false;
      if (searchStatus.value && p.status !== searchStatus.value) return false;
      if (selectedTreeKey.value) {
        const top = (p.area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.name||'').localeCompare(b.name||'')));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const s = Math.max(1, cur-2), e = Math.min(last, s+4);
      return Array.from({ length: e-s+1 }, (_, i) => s+i);
    });
    const tree = computed(() => {
      const g = {};
      (props.displays || []).forEach(p => {
        if (props.excludeArea && p.area === props.excludeArea) return;
        const top = (p.area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';
    const onPick = (p) => emit('pick', p);

    /* 멀티선택 */
    const checked = ref(new Set());
    const isChecked = (id) => checked.value.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked.value);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked.value = s;
    };
    const allChecked = computed(() => pageList.value.length > 0 && pageList.value.every(p => checked.value.has(p.dispId)));
    const toggleCheckAll = () => {
      const s = new Set(checked.value);
      if (allChecked.value) pageList.value.forEach(p => s.delete(p.dispId));
      else pageList.value.forEach(p => s.add(p.dispId));
      checked.value = s;
    };
    const pickMulti = () => {
      const ids = Array.from(checked.value);
      if (!ids.length) return;
      ids.forEach(id => {
        const p = (props.displays || []).find(x => x.dispId === id);
        if (p) emit('pick', p);
      });
      checked.value = new Set();
    };

    return {
      searchKw, searchStatus, pager, PAGE_SIZES,
      total, totalPages, pageList, pageNums,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, tree,
      statusCls, onPick, areaNm,
      checked, isChecked, toggleCheck, allChecked, toggleCheckAll, pickMulti,
    };
  },
  template: /* html */`
<div @click.self="$emit('close')"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="background:#fafafa;border-radius:14px;width:1100px;max-width:98vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">🔗 {{ title }}</span>
      <button @click="$emit('close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">×</button>
    </div>
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="패널명·영역코드 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchStatus" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">상태 전체</option>
        <option value="활성">활성</option>
        <option value="비활성">비활성</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <!-- 트리 -->
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in tree" :key="node.label"
            @click="selectTree(node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>▸ {{ node.label }}</span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
        </div>
      </div>
      <!-- 목록 -->
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>총 <b>{{ total }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 추가</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="admin-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="allChecked" @change="toggleCheckAll" />
                </th>
                <th style="width:56px;">ID</th>
                <th>패널 정보</th>
                <th style="width:140px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageList.length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 패널이 없습니다.</td></tr>
              <tr v-for="p in pageList" :key="p.dispId"
                :style="isChecked(p.dispId)?'background:#eef6fd;':''">
                <td style="text-align:center;vertical-align:top;padding-top:14px;">
                  <input type="checkbox" :checked="isChecked(p.dispId)" @change="toggleCheck(p.dispId)" />
                </td>
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">#{{ p.dispId }}</td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <code style="background:#f0f2f5;color:#555;padding:1px 6px;border-radius:3px;font-size:10px;">{{ p.area || '(미등록)' }}</code>
                    <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">{{ p.name }}</span>
                    <span class="badge" :class="statusCls(p.status)" style="font-size:11px;margin-left:8px;">{{ p.status }}</span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span><b style="color:#888;">영역명:</b> {{ areaNm(p.area) }}</span>
                    <span style="margin-left:10px;"><b style="color:#888;">위젯:</b> {{ (p.rows||[]).length }}개</span>
                  </div>
                </td>
                <td style="vertical-align:top;padding-top:12px;">
                  <span style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;font-size:11px;">
                    {{ (p.area||'').split('_')[0] || '-' }} &gt; {{ areaNm(p.area) }}
                  </span>
                </td>
                <td style="vertical-align:top;padding-top:10px;text-align:right;">
                  <button @click="onPick(p)" class="btn btn-primary btn-sm" style="font-size:11px;">선택</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
          <div></div>
          <div class="pager">
            <button :disabled="pager.page===1" @click="pager.page=1">«</button>
            <button :disabled="pager.page===1" @click="pager.page--">‹</button>
            <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===totalPages" @click="pager.page++">›</button>
            <button :disabled="pager.page===totalPages" @click="pager.page=totalPages">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1">
              <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
};

/* ═══════════════════════════════════════════════════════════════════
 * WidgetLibPickModal — 전시위젯Lib 선택 팝업 (내용복사 / 참조)
 * ═══════════════════════════════════════════════════════════════════ */
window.WidgetLibPickModal = {
  name: 'WidgetLibPickModal',
  props: {
    mode: { type: String, default: 'copy' },     /* 'copy' | 'ref' */
    widgetLibs: { type: Array, default: () => [] },
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchType = ref('');
    const searchStatus = ref('');
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];

    const filtered = computed(() => (props.widgetLibs || []).filter(d => {
      const kw = searchKw.value.trim().toLowerCase();
      if (kw && !(d.name||'').toLowerCase().includes(kw) && !(d.desc||'').toLowerCase().includes(kw) && !(d.tags||'').toLowerCase().includes(kw)) return false;
      if (searchType.value && d.widgetType !== searchType.value) return false;
      if (searchStatus.value && d.status !== searchStatus.value) return false;
      return true;
    }).sort((a,b) => b.libId - a.libId));
    const total = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList = computed(() =>
      filtered.value.slice((pager.page-1) * pager.size, pager.page * pager.size)
    );
    const pageNums = computed(() => {
      const cur = pager.page, last = totalPages.value;
      const s = Math.max(1, cur-2), e = Math.min(last, s+4);
      return Array.from({ length: e-s+1 }, (_, i) => s+i);
    });

    /* 사용위치 트리 */
    const selectedTreeKey = ref('');
    const treeOpen = ref(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.value.has(k)) treeOpen.value.delete(k); else treeOpen.value.add(k); };
    const isTreeOpen = k => treeOpen.value.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const tree = computed(() => {
      const map = {};
      const add = (lib, p) => {
        const parts = p.split('>').map(x => x.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0], rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      filtered.value.forEach(lib => {
        if (!lib.usedPaths || !lib.usedPaths.length) add(lib, '(미등록) > (미등록)');
        else lib.usedPaths.forEach(p => add(lib, p));
      });
      return Object.keys(map).sort().map(top => ({
        label: top,
        count: Object.values(map[top]).reduce((a,b) => a+b.length, 0),
        children: Object.keys(map[top]).sort().map(sub => ({ label: sub, count: map[top][sub].length })),
      }));
    });

    const WIDGET_TYPES = [
      { value:'', label:'전체 유형' },
      { value:'image_banner', label:'이미지 배너' }, { value:'product_slider', label:'상품 슬라이더' },
      { value:'product', label:'상품' }, { value:'text_banner', label:'텍스트 배너' },
      { value:'info_card', label:'정보카드' }, { value:'popup', label:'팝업' },
      { value:'file', label:'파일' }, { value:'coupon', label:'쿠폰' },
      { value:'html_editor', label:'HTML 에디터' }, { value:'widget_embed', label:'위젯' },
    ];
    const statusCls = (s) => s === '활성' ? 'badge-green' : 'badge-gray';
    const onPick = (lib) => emit('pick', lib);

    return {
      searchKw, searchType, searchStatus, WIDGET_TYPES,
      pager, PAGE_SIZES, total, totalPages, pageList, pageNums,
      tree, selectedTreeKey, toggleTree, isTreeOpen, selectTree,
      statusCls, onPick,
    };
  },
  template: /* html */`
<div @click.self="$emit('close')"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="background:#fafafa;border-radius:14px;width:1100px;max-width:98vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.3);">
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;font-weight:700;">
        {{ mode==='copy' ? '📋 전시위젯Lib 내용복사' : '🔗 전시위젯Lib 참조' }}
      </span>
      <button @click="$emit('close')" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0;opacity:.85;">×</button>
    </div>

    <!-- 검색 -->
    <div style="padding:12px 16px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <input v-model="searchKw" placeholder="이름·설명·태그 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchType" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select v-model="searchStatus" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">상태 전체</option>
        <option value="활성">활성</option>
        <option value="비활성">비활성</option>
      </select>
    </div>

    <!-- 본문: 좌측 트리 + 우측 목록 -->
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <!-- 트리 -->
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ total }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in tree" :key="node.label">
            <div @click="toggleTree(node.label); selectTree(node.label)"
              :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
              <span>{{ isTreeOpen(node.label) ? '▼' : '▶' }} {{ node.label }}</span>
              <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 목록 -->
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">총 <b>{{ total }}</b>건</div>
        <div style="flex:1;overflow-y:auto;">
          <table class="admin-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:56px;">ID</th>
                <th>위젯 정보</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageList.length"><td colspan="3" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 데이터가 없습니다.</td></tr>
              <tr v-for="d in pageList" :key="d.libId">
                <td style="color:#aaa;font-size:12px;vertical-align:top;padding-top:12px;">#{{ String(d.libId).padStart(4,'0') }}</td>
                <td style="padding:10px 12px;">
                  <div style="margin-bottom:4px;">
                    <span style="background:#f5f5f5;border:1px solid #e8e8e8;border-radius:6px;padding:1px 7px;font-size:11px;color:#555;">{{ d.widgetType }}</span>
                    <span style="font-size:14px;font-weight:700;color:#222;margin-left:8px;">{{ d.name }}</span>
                    <span class="badge" :class="statusCls(d.status)" style="font-size:11px;margin-left:8px;">{{ d.status }}</span>
                  </div>
                  <div style="font-size:11px;color:#555;line-height:1.5;">
                    <span v-if="d.usedPaths && d.usedPaths.length">
                      <b style="color:#888;">사용위치:</b>
                      <span v-for="(p,pi) in d.usedPaths" :key="pi"
                        style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;padding:1px 7px;margin-left:3px;">{{ p }}</span>
                    </span>
                    <span v-if="d.tags" style="margin-left:8px;"><b style="color:#888;">태그:</b> {{ d.tags }}</span>
                  </div>
                </td>
                <td style="vertical-align:top;padding-top:10px;text-align:right;">
                  <button @click="onPick(d)" class="btn btn-primary btn-sm" style="font-size:11px;">
                    {{ mode==='copy' ? '복사' : '참조' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 페이저 -->
        <div class="pagination" style="padding:10px 16px;border-top:1px solid #f0f0f0;margin-top:0;">
          <div></div>
          <div class="pager">
            <button :disabled="pager.page===1" @click="pager.page=1">«</button>
            <button :disabled="pager.page===1" @click="pager.page--">‹</button>
            <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===totalPages" @click="pager.page++">›</button>
            <button :disabled="pager.page===totalPages" @click="pager.page=totalPages">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1">
              <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
};
