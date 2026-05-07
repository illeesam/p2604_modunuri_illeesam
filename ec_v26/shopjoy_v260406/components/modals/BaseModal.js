/* ShopJoy – components/modals/BaseModal.js
   여러 팝업 컴포넌트를 한 곳에 모아둡니다.
   My.js 의 components 블록에 등록하여 사용합니다.

   ───────────────────────────────────────────────────────────────────────
   [공통 props: reloadTrigger]
   ───────────────────────────────────────────────────────────────────────
   목적: 모달이 열려있는 상태에서 부모가 외부 변화에 따라
         "지금 다시 조회하라"는 신호를 보내고 싶을 때 사용한다.
         (모달이 keep-alive 되거나, 재마운트 없이 prop만 바뀔 때
          onMounted 가 다시 호출되지 않으므로 별도 트리거가 필요)

   동작: 모달 내부에서 watch(() => props.reloadTrigger, ...) 로 변화를
         감지해 fetch 함수(handleSearchList 등)를 자동 호출한다.

   사용법 (부모):
     const modal = reactive({ show: false, kind: '', reloadTrigger: 0 });
     const openA = () => { modal.kind = 'a'; modal.reloadTrigger++; modal.show = true; };
     const openB = () => { modal.kind = 'b'; modal.reloadTrigger++; modal.show = true; };
     const refresh = () => { modal.reloadTrigger++; };

   템플릿:
     <some-modal v-if="modal.show"
                 :kind="modal.kind"
                 :reload-trigger="modal.reloadTrigger"
                 @select="..." @close="modal.show=false" />

   주의:
     - 0 → 1 같이 값이 바뀌어야 watch 가 발동한다. ++ 사용 권장.
     - 처음 마운트(onMounted)에서도 fetch 가 한 번 실행되므로,
       reloadTrigger 는 부모가 "다시" 조회시키고 싶을 때만 증가시킨다.
   ───────────────────────────────────────────────────────────────────────
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

  /* ESC 키로 최상단 모달 닫기 — overlay 클릭과 동일 효과 */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.click();
  });
})();

/* ── 주문 상세 모달 ──────────────────────────────────
   Props: show (Boolean), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.OrderDetailModal = {
  name: 'OrderDetailModal',
  props: ['show', 'order', 'reloadTrigger'],
  emits: ['close'],
  setup() {
    const { reactive } = Vue;
    const uiState = reactive({ loading: false, error: '', isPageCodeLoad: false });
    const codes = reactive({});
    return { uiState, codes };
  },
  computed: {
    siteNm() { return boUtil.getSiteNm(); },
  },
  methods: {
    fnStatusColor(s) {
      return ({
        '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
        '배송준비중': '#f59e0b', '배송중': '#f97316',
        '배송완료': '#22c55e', '완료': '#6b7280', '취소됨': '#9ca3af',
      })[s] || '#9ca3af';
    },
    fnStatusLabel(s) { return s === '완료' ? '구매확정' : s; },
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
          :style="'background:' + fnStatusColor(order.status)">{{ fnStatusLabel(order.status) }}</span>
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
  props: ['show', 'product', 'navigate', 'toggleLike', 'isLiked', 'addToCart', 'cartMode', 'reloadTrigger'],
  emits: ['close'],
  setup(props) {
    const { ref, watch, computed, reactive } = Vue;
    const uiState = reactive({ loading: false, error: '', isPageCodeLoad: false });
    const codes = reactive({});
    const selColor  = ref(null);
    const selSize   = ref(null);
    const qty       = ref(1);
    const inCart    = ref(false);
    const selThumb  = ref(0);
    const toastMsg  = ref('');
    const toastShow = ref(false);
    let toastTimer  = null;

    /* 내부 토스트 */
    const handleFireToast = (msg) => {
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
    const cfThumbImgs = computed(() => {
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
    const cfRating = computed(() => {
      const scores = [4.8, 4.5, 4.7, 4.2, 4.9, 4.3, 4.6, 4.1, 4.4, 4.8, 4.7, 4.5];
      const counts = [24, 18, 31,  9, 42, 15, 27,  8, 33, 19, 11, 28];
      const idx = ((parseInt(props.product?.productId) || 1) - 1) % 12;
      return { score: scores[idx], count: counts[idx] };
    });

    /* 별점 문자열 */
    const cfStarStr = computed(() => {
      const r = Math.round(cfRating.value.score);
      return '★'.repeat(r) + '☆'.repeat(5 - r);
    });

    /* 좋아요 토글 */
    const handleLike = () => {
      if (!props.product) return;
      const wasLiked = props.isLiked && props.isLiked(props.product.productId);
      props.toggleLike && props.toggleLike(props.product.productId);
      handleFireToast(wasLiked ? '위시리스트에서 제거했습니다.' : '위시리스트에 추가했습니다.');
    };

    /* 옵션 에러 상태 */
    const errColor = ref(false);
    const errSize  = ref(false);

    /* 옵션 필수 검증 */
    const cfNeedsColor = () => props.product?.opt1s?.length > 0;
    const cfNeedsSize  = () => {
      const s = props.product?.opt2s;
      return s && s.length > 0 && !(s.length === 1 && s[0] === 'FREE');
    };
    const handleValidate = () => {
      errColor.value = cfNeedsColor() && !selColor.value;
      errSize.value  = cfNeedsSize()  && !selSize.value;
      if (errColor.value || errSize.value) {
        const missing = [errColor.value && '색상', errSize.value && '사이즈'].filter(Boolean).join(', ');
        handleFireToast(`${missing}을(를) 선택해주세요.`);
        return false;
      }
      return true;
    };

    /* 장바구니 추가 (검증 포함) */
    const handleCart = () => {
      if (!handleValidate()) return false;
      inCart.value = !inCart.value;
      handleFireToast(inCart.value ? '장바구니에 추가했습니다.' : '장바구니에서 제거했습니다.');
      return true;
    };

    /* 바로구매 검증 */
    const handleBuyNow = (navigateFn) => {
      if (!handleValidate()) return false;
      navigateFn && navigateFn('order', { instantOrder: { product: props.product, color: selColor.value, size: selSize.value, qty: qty.value } });
      return true;
    };

    return { uiState, codes, selColor, selSize, qty, inCart, selThumb, cfThumbImgs, cfRating, cfStarStr,
             toastMsg, toastShow, errColor, errSize, handleLike, handleCart, handleBuyNow, handleValidate };
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
        <img v-if="cfThumbImgs[selThumb]" :src="cfThumbImgs[selThumb]" :alt="product.prodNm"
          style="max-width:100%;max-height:300px;object-fit:contain;" />
      </div>
      <!-- 썸네일 목록 -->
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;">
        <div v-for="(img, i) in cfThumbImgs" :key="i" @click="selThumb=i"
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
        <span style="color:#f59e0b;font-size:0.88rem;letter-spacing:1px;">{{ cfStarStr }}</span>
        <span style="font-size:0.78rem;font-weight:600;color:#555;">{{ cfRating.score }}</span>
        <span style="font-size:0.75rem;color:#aaa;">({{ cfRating.count }}개 리뷰)</span>
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
  props: ['show', 'user', 'order', 'reloadTrigger'],
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
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pageSize = 10;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ kw: '' });
    const list = reactive([]);
    const loading = ref(false);
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const res = await boApiSvc.sySite.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, kw: searchParam.kw || undefined }, '사이트관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });
    watch(() => searchParam.kw, () => { pager.pageNo = 1; handleSearchListWrap(); });
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return { cfSiteNm, searchParam, list, loading, pager, onSetPage };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">사이트 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span>
      <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#e5e7eb;color:#555;font-size:11px;text-align:center;line-height:16px;margin-left:8px;cursor:help;font-weight:700;"
        title="사이트번호 : 프로그램 작업코드 (01, 02, 03…)&#10;사이트코드 : 라이선스코드 (ST0001 형식)">?</span>
    </span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="searchParam.kw" placeholder="사이트번호 / 사이트코드 / 사이트명 / 도메인 검색" style="margin-bottom:12px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ pager.pageTotalCount }}건</div>
    <div class="sel-modal-list">
      <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">로딩 중...</div>
      <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="s in list" :key="s.siteId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ s.siteNm }}</div>
        <span class="sel-modal-item-id">{{ s.siteCode }}</span>
        <span style="font-family:monospace;font-size:12px;color:#e8587a;font-weight:700;min-width:26px;text-align:right;">{{ String(s.siteId).padStart(2,'0') }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', s)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 판매업체 선택 모달 ── */
window.VendorSelectModal = {
  name: 'VendorSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ kw: '' });
    const list = reactive([]);
    const loading = ref(false);
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, kw: searchParam.kw || undefined }, '판매자관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });
    watch(() => searchParam.kw, () => { pager.pageNo = 1; handleSearchListWrap(); });
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return { cfSiteNm, searchParam, list, loading, pager, onSetPage };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">판매업체 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="searchParam.kw" placeholder="업체명 / 사업자번호 검색" style="margin-bottom:12px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ pager.pageTotalCount }}건</div>
    <div class="sel-modal-list">
      <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">로딩 중...</div>
      <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="v in list" :key="v.vendorId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ v.vendorNm }}</div>
        <span class="sel-modal-item-id">{{ v.vendorId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', v)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 사용자 선택 모달 (부서트리 + 멀티) ── */
window.BoUserSelectModal = {
  name: 'BoUserSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { computed, reactive, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    const depts = reactive([]);
    const uiState = reactive({ loading: false, deptKw: '', selectedDeptId: null });
    const pager = reactive({ page: 1, size: 20, pageTotalCount: 0, pageTotalPage: 1, pageList: [], pageNums: [], userKw: '' });
    const selectedIds = reactive(new Set());
    const selectedUsers = reactive([]);

    /* ── 부서 트리 (전체 로드) ── */
    const fnBuildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: fnBuildDeptTree(items, d.deptId, depth + 1) }));
    const fnFlattenDept = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlattenDept(n._kids, result); });
      return result;
    };
    const cfFlatDeptTree = computed(() => {
      const kw = uiState.deptKw.trim().toLowerCase();
      const base = kw
        ? depts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(kw))
        : depts;
      return fnFlattenDept(fnBuildDeptTree(base, null, 1));
    });

    /* ── 사용자 페이지 조회 ── */
    const fnBuildPagerNums = () => {
      const c = pager.page, l = pager.pageTotalPage, s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      pager.pageNums = Array.from({ length: e - s + 1 }, (_, i) => s + i);
    };
    const handleSearchUsers = async () => {
      uiState.loading = true;
      pager.pageList = [];
      pager.pageTotalCount = 0;
      pager.pageTotalPage = 1;
      try {
        const params = { pageNo: pager.page, pageSize: pager.size };
        if (pager.userKw.trim()) params.kw = pager.userKw.trim();
        if (uiState.selectedDeptId != null) params.deptId = uiState.selectedDeptId;
        const res = await boApiSvc.syUser.getPage(params, '사용자선택', '목록조회');
        const d = res.data?.data;
        pager.pageList = d?.pageList || d?.list || [];
        pager.pageTotalCount = d?.pageTotalCount || 0;
        pager.pageTotalPage = d?.pageTotalPage || 1;
        fnBuildPagerNums();
      } catch (e) { pager.pageList = []; } finally { uiState.loading = false; }
    };
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const deptRes = await boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회');
        depts.splice(0, depts.length, ...(deptRes.data?.data || []));
      } catch (e) { depts.splice(0); } finally { uiState.loading = false; }
      await handleSearchUsers();
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 선택 ── */
    const fnIsChecked = (u) => selectedIds.has(u.userId || u.boUserId);
    const handleToggleUser = (u) => {
      const id = u.userId || u.boUserId;
      if (selectedIds.has(id)) {
        selectedIds.delete(id);
        const idx = selectedUsers.findIndex(x => (x.userId || x.boUserId) === id);
        if (idx !== -1) selectedUsers.splice(idx, 1);
      } else {
        selectedIds.add(id);
        selectedUsers.push(u);
      }
    };
    const cfAllChecked = computed(() => pager.pageList.length > 0 && pager.pageList.every(u => selectedIds.has(u.userId || u.boUserId)));
    const handleToggleAll = () => {
      if (cfAllChecked.value) {
        pager.pageList.forEach(u => {
          const id = u.userId || u.boUserId;
          selectedIds.delete(id);
          const idx = selectedUsers.findIndex(x => (x.userId || x.boUserId) === id);
          if (idx !== -1) selectedUsers.splice(idx, 1);
        });
      } else {
        pager.pageList.forEach(u => {
          const id = u.userId || u.boUserId;
          if (!selectedIds.has(id)) { selectedIds.add(id); selectedUsers.push(u); }
        });
      }
    };
    const cfSelectedCount = computed(() => selectedIds.size);
    const handleConfirm = () => { emit('select', [...selectedUsers]); };

    const onSearch = () => { pager.page = 1; handleSearchUsers(); };
    const setPage = (n) => { if (n >= 1 && n <= pager.pageTotalPage) { pager.page = n; handleSearchUsers(); } };
    return { cfSiteNm, depts, uiState, pager, selectedIds, cfFlatDeptTree,
      fnIsChecked, handleToggleUser, cfAllChecked, handleToggleAll, cfSelectedCount, handleConfirm,
      onSearch, setPage };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:780px;height:82vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">사용자 선택</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;letter-spacing:.02em;">{{ cfSiteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="cfSelectedCount" style="font-size:12px;color:#e8587a;font-weight:700;background:#fff0f4;padding:3px 10px;border-radius:20px;">{{ cfSelectedCount }}명 선택됨</span>
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
            <input v-model="uiState.deptKw" placeholder="부서 검색"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:5px 8px 5px 24px;font-size:12px;outline:none;box-sizing:border-box;background:#fff;color:#374151;" />
          </div>
        </div>
        <!-- 트리 목록 -->
        <div style="flex:1;overflow-y:auto;padding:6px 6px;">
          <!-- 루트: 전체 (1레벨) -->
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .12s;"
            :style="uiState.selectedDeptId===null?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.25);':'background:transparent;'"
            @click="uiState.selectedDeptId=null; onSearch()">
            <span style="font-size:8px;font-weight:900;flex-shrink:0;line-height:1;"
              :style="{ color: uiState.selectedDeptId===null?'#fff':'#e8587a' }">●</span>
            <span style="font-size:13px;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ color: uiState.selectedDeptId===null?'#fff':'#374151' }">전체</span>
            <span style="font-size:10px;font-weight:600;flex-shrink:0;"
              :style="{ color: uiState.selectedDeptId===null?'rgba(255,255,255,0.75)':'#bbb' }">{{ pager.pageTotalCount }}</span>
          </div>
          <!-- 2레벨~: 실 데이터 -->
          <div v-for="d in cfFlatDeptTree" :key="d.deptId"
            style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;cursor:pointer;margin-bottom:1px;transition:all .12s;"
            :style="uiState.selectedDeptId===d.deptId?'background:#e8587a;box-shadow:0 2px 8px rgba(232,88,122,0.2);':'background:transparent;'"
            @click="uiState.selectedDeptId=d.deptId; onSearch()">
            <span style="flex-shrink:0;font-weight:800;line-height:1;"
              :style="{
                marginLeft: ((d._depth-1)*13)+'px',
                fontSize: d._depth===1?'10px':'8px',
                color: uiState.selectedDeptId===d.deptId?'#fff':['#2563eb','#52c41a','#f59e0b'][Math.min(d._depth-1,2)]
              }">{{ ['●','◦','·'][Math.min(d._depth-1,2)] }}</span>
            <span style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              :style="{ fontWeight: d._depth===1?'600':'400', color: uiState.selectedDeptId===d.deptId?'#fff':'#374151' }">
              {{ d.deptNm }}
            </span>
          </div>
          <div v-if="cfFlatDeptTree.length===0" style="padding:20px 0;text-align:center;font-size:12px;color:#bbb;">없음</div>
        </div>
      </div>

      <!-- 우: 사용자 목록 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;background:#fff;">
        <!-- 검색 -->
        <div style="padding:10px 14px 8px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
          <div style="position:relative;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#bbb;">🔍</span>
            <input v-model="pager.userKw" placeholder="이름 / 로그인ID / 이메일 검색" @keyup.enter="onSearch"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;color:#374151;" />
            <button @click="onSearch" style="margin-top:4px;width:100%;padding:5px 0;border:1px solid #e8587a;border-radius:6px;background:#e8587a;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">조회</button>
          </div>
        </div>
        <!-- 전체선택 바 -->
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="cfAllChecked" @change="handleToggleAll" style="width:14px;height:14px;" />
            전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">
            총 <b style="color:#374151;">{{ pager.pageTotalCount }}</b>명
          </span>
        </div>
        <!-- 카드 목록 -->
        <div style="flex:1;overflow-y:auto;">
          <div v-if="uiState.loading" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">로딩 중...</div>
          <div v-else-if="pager.pageList.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>
            검색 결과가 없습니다.
          </div>
          <div v-for="u in pager.pageList" :key="u.userId || u.boUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsChecked(u)?'background:#fff5f7;':'' "
            @click="handleToggleUser(u)">
            <input type="checkbox" :checked="fnIsChecked(u)" @click.stop="handleToggleUser(u)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#e8587a;cursor:pointer;" />
            <!-- 아바타 -->
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsChecked(u)?'background:#e8587a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ (u.userNm || u.name || '?').charAt(0) }}
            </div>
            <!-- 텍스트 -->
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ u.userNm || u.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ u.loginId }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">{{ u.deptNm || u.dept || '-' }} · {{ u.roleNm || u.role || '' }}</div>
            </div>
            <!-- 상태 뱃지 -->
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="(u.useYn||u.status)==='Y'||(u.status)==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;'">
              {{ u.useYn === 'Y' ? '활성' : u.useYn === 'N' ? '비활성' : (u.status || '') }}
            </span>
          </div>
          <!-- 페이지네이션 -->
          <div v-if="pager.pageTotalPage > 1" style="display:flex;justify-content:center;align-items:center;gap:3px;padding:8px 0;border-top:1px solid #f0f0f0;flex-shrink:0;">
            <button :disabled="pager.page===1" @click="setPage(1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">«</button>
            <button :disabled="pager.page===1" @click="setPage(pager.page-1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">‹</button>
            <button v-for="n in pager.pageNums" :key="n" @click="setPage(n)"
              style="padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;border:1px solid;"
              :style="pager.page===n?'background:#e8587a;color:#fff;border-color:#e8587a;font-weight:700;':'background:#fff;border-color:#e5e7eb;color:#374151;'">{{ n }}</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="setPage(pager.page+1)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">›</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)" style="padding:3px 7px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;background:#fff;cursor:pointer;">»</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 푸터 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <span style="font-size:12px;" :style="cfSelectedCount?'color:#e8587a;font-weight:600;':'color:#bbb;'">
        {{ cfSelectedCount ? cfSelectedCount+'명이 선택되었습니다.' : '목록에서 사용자를 선택하세요.' }}
      </span>
      <div style="display:flex;gap:8px;">
        <button style="padding:8px 22px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;"
          @click="$emit('close')">취소</button>
        <button :disabled="!cfSelectedCount"
          style="padding:8px 22px;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;"
          :style="cfSelectedCount?'background:#e8587a;color:#fff;box-shadow:0 2px 8px rgba(232,88,122,0.35);':'background:#f3f4f6;color:#d1d5db;cursor:not-allowed;'"
          @click="handleConfirm">확인{{ cfSelectedCount?' ('+cfSelectedCount+'명)':'' }}</button>
      </div>
    </div>

  </div>
</div>`,
};

/* ── 회원 선택 모달 ── */
window.MemberSelectModal = {
  name: 'MemberSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ kw: '' });
    const list = reactive([]);
    const loading = ref(false);
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const res = await boApiSvc.mbMember.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, kw: searchParam.kw || undefined }, '회원관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });
    watch(() => searchParam.kw, () => { pager.pageNo = 1; handleSearchListWrap(); });
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return { cfSiteNm, searchParam, list, loading, pager, onSetPage };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">회원 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="searchParam.kw" placeholder="이름 / 이메일 / ID 검색" style="margin-bottom:12px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ pager.pageTotalCount }}건</div>
    <div class="sel-modal-list">
      <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">로딩 중...</div>
      <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="m in list" :key="m.memberId || m.userId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ m.memberNm }} <span style="font-size:11px;color:#888;">{{ m.memberEmail || m.email }}</span></div>
        <span class="sel-modal-item-id">{{ m.memberId || m.userId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', m)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 주문 선택 모달 ── */
window.OrderSelectModal = {
  name: 'OrderSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pageSize = 8;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ kw: '' });
    const list = reactive([]);
    const loading = ref(false);
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const res = await boApiSvc.odOrder.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, kw: searchParam.kw || undefined }, '주문관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });
    watch(() => searchParam.kw, () => { pager.pageNo = 1; handleSearchListWrap(); });
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    return { cfSiteNm, searchParam, list, loading, pager, onSetPage };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box">
    <div class="modal-header"><span class="modal-title">주문 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="searchParam.kw" placeholder="주문ID / 회원명 / 상품명 검색" style="margin-bottom:12px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ pager.pageTotalCount }}건</div>
    <div class="sel-modal-list">
      <div v-if="loading" style="text-align:center;color:#999;padding:20px;font-size:13px;">로딩 중...</div>
      <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:20px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="o in list" :key="o.orderId" class="sel-modal-item">
        <div class="sel-modal-item-name">{{ o.orderId }} <span style="font-size:11px;color:#888;">{{ o.memberNm || o.userNm }}</span></div>
        <span class="sel-modal-item-id" style="background:#f0fff0;color:#389e0d;">{{ (o.totalAmt || o.totalPrice || 0).toLocaleString() }}원</span>
        <button class="sel-modal-item-btn" @click="$emit('select', o)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 게시판 선택 모달 ── */
window.BbmSelectModal = {
  name: 'BbmSelectModal',
  props: ['dispDataset', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    const pageSize = 6;
    const pager = reactive({ pageNo: 1, pageSize, pageTotalCount: 0, pageTotalPage: 1 });
    const searchParam = reactive({ kw: '' });
    const list = reactive([]);
    const loading = ref(false);
    const handleSearchList = async () => {
      loading.value = true;
      try {
        const res = await boApiSvc.syBbm.getPage({ pageNo: pager.pageNo, pageSize: pager.pageSize, kw: searchParam.kw || undefined }, '게시판모드관리', '목록조회');
        const data = res.data?.data;
        list.splice(0, list.length, ...(data?.pageList || data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || 0;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
      } catch (e) { list.splice(0, list.length); } finally { loading.value = false; }
    };
    const fnBuildPagerNums = () => { const s=Math.max(1,pager.pageNo-2),e=Math.min(pager.pageTotalPage,s+4); pager.pageNums=Array.from({length:e-s+1},(_,i)=>s+i); };
    const handleSearchListWrap = async () => { await handleSearchList(); fnBuildPagerNums(); };
    onMounted(() => { handleSearchListWrap(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchListWrap(); });
    watch(() => searchParam.kw, () => { pager.pageNo = 1; handleSearchListWrap(); });
    const onSetPage = n => { if (n >= 1 && n <= pager.pageTotalPage) { pager.pageNo = n; handleSearchListWrap(); } };
    const fnTypeBadge = t => ({ '일반': 'badge-gray', '공지': 'badge-blue', '갤러리': 'badge-orange', 'FAQ': 'badge-green', 'QnA': 'badge-red' }[t] || 'badge-gray');
    const fnScopeBadge = s => ({ '공개': 'badge-green', '개인': 'badge-orange', '회사': 'badge-blue' }[s] || 'badge-gray');
    return { cfSiteNm, searchParam, list, loading, pager, onSetPage, fnTypeBadge, fnScopeBadge };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:560px;">
    <div class="modal-header"><span class="modal-title">게시판 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></span><span class="modal-close" @click="$emit('close')">✕</span></div>
    <input class="form-control" v-model="searchParam.kw" placeholder="게시판명 / 코드 / 유형 검색" style="margin-bottom:10px;" />
    <div style="font-size:11px;color:#aaa;margin-bottom:8px;">총 {{ pager.pageTotalCount }}건</div>
    <div class="sel-modal-list" style="min-height:200px;">
      <div v-if="loading" style="text-align:center;color:#999;padding:30px;font-size:13px;">로딩 중...</div>
      <div v-else-if="list.length===0" style="text-align:center;color:#999;padding:30px;font-size:13px;">검색 결과가 없습니다.</div>
      <div v-for="b in list" :key="b.bbmId" class="sel-modal-item" style="gap:6px;">
        <div class="sel-modal-item-name" style="flex:1;min-width:0;">
          <span>{{ b.bbmNm }}</span>
          <span class="badge" :class="fnTypeBadge(b.bbmType)" style="margin-left:5px;font-size:10px;">{{ b.bbmType }}</span>
          <span class="badge" :class="fnScopeBadge(b.scopeType)" style="margin-left:3px;font-size:10px;">{{ b.scopeType }}</span>
        </div>
        <code style="font-size:11px;color:#888;background:#f5f5f5;padding:1px 6px;border-radius:3px;flex-shrink:0;">{{ b.bbmCode }}</code>
        <span class="sel-modal-item-id" style="background:#f0f0f0;color:#888;flex-shrink:0;">ID: {{ b.bbmId }}</span>
        <button class="sel-modal-item-btn" @click="$emit('select', b)">선택</button>
      </div>
    </div>
    <!-- 페이징 -->
    <div style="display:flex;justify-content:center;align-items:center;gap:4px;margin-top:12px;padding-top:10px;border-top:1px solid #f0f0f0;">
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(1)">«</button>
      <button class="pager-btn" :disabled="pager.pageNo===1" @click="onSetPage(pager.pageNo-1)">‹</button>
      <button v-for="n in pager.pageNums" :key="n" class="pager-btn" :class="{active:pager.pageNo===n}" @click="onSetPage(n)">{{ n }}</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageNo+1)">›</button>
      <button class="pager-btn" :disabled="pager.pageNo===pager.pageTotalPage" @click="onSetPage(pager.pageTotalPage)">»</button>
    </div>
  </div>
</div>`,
};

/* ── 템플릿 미리보기 모달 ── */
window.TemplatePreviewModal = {
  name: 'TemplatePreviewModal',
  props: ['tmpl', 'sampleParams', 'reloadTrigger'],
  emits: ['close'],
  setup(props) {
    const { computed } = Vue;

    const cfParams = computed(() => {
      try { return JSON.parse(props.sampleParams || '{}'); }
      catch { return {}; }
    });

    const cfIsHtml = computed(() =>
      ['메일템플릿', 'MMS템플릿'].includes(props.tmpl?.templateType)
    );

    /* 텍스트에 파라미터 치환 → HTML 반환 (미치환 변수는 빨간색 표시) */
    const handleApplyAndRender = (text) => {
      if (!text) return '';
      let base = text;
      if (!cfIsHtml.value) {
        /* 텍스트 계열: HTML 이스케이프 후 파라미터 치환 */
        base = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return base.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        cfParams.value[k] !== undefined
          ? `<span style="background:#fff3cd;color:#856404;border-radius:3px;padding:0 2px;font-weight:600;">${String(cfParams.value[k])}</span>`
          : `<span style="color:#dc3545;font-weight:600;">{{${k}}}</span>`
      );
    };

    const cfRenderedSubject = computed(() => handleApplyAndRender(props.tmpl?.subject || ''));
    const cfRenderedContent = computed(() => handleApplyAndRender(props.tmpl?.content || ''));

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const cfParamList = computed(() => Object.entries(cfParams.value).map(([k, v]) => ({ k, v })));

    /* setup에서 tmpl을 반환해 템플릿에서 직접 접근 가능하게 */
    const fmtKey = k => '{{' + k + '}}';
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    return { cfSiteNm, tmpl: computed(() => props.tmpl), cfRenderedSubject, cfRenderedContent, cfIsHtml, cfTypeBadge, cfParamList, fmtKey };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:700px;">
    <div class="modal-header">
      <span class="modal-title">📄 템플릿 미리보기<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></span>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- 템플릿 기본정보 -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#f8f9fa;border-radius:8px;">
      <span class="badge" :class="cfTypeBadge">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:14px;color:#1a1a2e;">{{ tmpl?.templateNm }}</span>
    </div>

    <!-- 파라미터 샘플 뱃지 -->
    <div v-if="cfParamList.length" style="margin-bottom:12px;">
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">파라미터 샘플값</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        <span v-for="p in cfParamList" :key="p.k"
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
        v-html="cfRenderedSubject"></div>
    </div>

    <!-- 내용 미리보기 -->
    <div>
      <div style="font-size:11px;color:#888;font-weight:600;margin-bottom:5px;">내용 미리보기</div>
      <!-- HTML 타입 -->
      <div v-if="cfIsHtml"
        style="padding:18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;min-height:120px;max-height:380px;overflow-y:auto;font-size:13px;line-height:1.8;"
        v-html="cfRenderedContent"></div>
      <!-- 텍스트 타입 -->
      <pre v-else
        style="padding:14px 16px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;min-height:80px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;margin:0;color:#333;"
        v-html="cfRenderedContent"></pre>
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
  props: ['tmpl', 'dispDataset', 'showToast', 'showConfirm', 'reloadTrigger'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    const searchParam = reactive({ type: 'member', kw: '' });
    const selected = reactive([]);
    const getId = (item) => item.memberId || item.userId || item.boUserId;

    /* ── API 데이터 ── */
    const allDepts = reactive([]);
    const allMembers = reactive([]);
    const allBoUsers = reactive([]);
    const handleSearchList = async () => {
      try {
        const [deptRes, memberRes, userRes] = await Promise.all([
          boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회'),
          boApiSvc.mbMember.getList({ pageSize: 10000 }, '회원관리', '목록조회'),
          boApiSvc.syUser.getList({ pageSize: 10000 }, '사용자관리', '목록조회'),
        ]);
        allDepts.splice(0, allDepts.length, ...(deptRes.data?.data || []));
        allMembers.splice(0, allMembers.length, ...(memberRes.data?.data || []));
        allBoUsers.splice(0, allBoUsers.length, ...(userRes.data?.data || []));
      } catch (e) {}
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    /* ── 부서 트리 (관리자 탭) ── */
    const uiState = reactive({ selectedDeptId: null, selectedGrade: null, deptKw: '' });
    const selectedDeptId = computed(() => uiState.selectedDeptId);
    const selectedGrade = computed(() => uiState.selectedGrade);
    const fnBuildDeptTree = (items, parentId, depth) =>
      items.filter(d => (d.parentId || null) === (parentId || null) && d.useYn === 'Y')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(d => ({ ...d, _depth: depth, _kids: fnBuildDeptTree(items, d.deptId, depth + 1) }));
    const fnFlattenDept = (nodes, result = []) => { nodes.forEach(n => { result.push(n); fnFlattenDept(n._kids, result); }); return result; };
    const cfFlatDeptTree = computed(() => {
      const k = uiState.deptKw.trim().toLowerCase();
      const base = k ? allDepts.filter(d => d.useYn === 'Y' && d.deptNm.toLowerCase().includes(k)) : allDepts;
      return fnFlattenDept(fnBuildDeptTree(base, null, 1));
    });
    const fnGetDescDeptIds = (deptId) => {
      const ids = new Set();
      const queue = [deptId];
      while (queue.length) {
        const id = queue.shift();
        ids.add(id);
        allDepts.filter(x => x.parentId === id).forEach(c => queue.push(c.deptId));
      }
      return ids;
    };

    /* ── 등급 필터 (회원 탭) ── */
    const MEMBER_GRADES = ['VIP', '우수', '일반'];

    /* ── 목록 ── */
    const cfMemberList = computed(() => {
      const k = searchParam.kw.trim().toLowerCase();
      let list = allMembers;
      if (selectedGrade.value) list = list.filter(m => m.memberGrade === selectedGrade.value || m.grade === selectedGrade.value);
      if (k) list = list.filter(m => (m.memberNm || '').toLowerCase().includes(k) || (m.memberEmail || m.email || '').toLowerCase().includes(k) || String(m.memberId || m.userId || '').includes(k));
      return list;
    });
    const cfUserList = computed(() => {
      const k = searchParam.kw.trim().toLowerCase();
      let list = allBoUsers;
      if (selectedDeptId.value !== null) {
        const ids = fnGetDescDeptIds(selectedDeptId.value);
        list = list.filter(u => ids.has(u.deptId));
      }
      if (k) list = list.filter(u => (u.userNm || u.name || '').toLowerCase().includes(k) || (u.userEmail || u.email || '').toLowerCase().includes(k) || String(u.userId || u.boUserId || '').includes(k));
      return list;
    });
    const cfList = computed(() => searchParam.type === 'member' ? cfMemberList.value : cfUserList.value);

    const fnIsSelected = (item) => selected.includes(getId(item));
    const handleToggleSelect = (item) => {
      const id = getId(item);
      const idx = selected.indexOf(id);
      if (idx === -1) selected.push(id); else selected.splice(idx, 1);
    };
    const cfAllChecked = computed(() => cfList.value.length > 0 && cfList.value.every(x => selected.includes(getId(x))));
    const handleToggleAll = () => {
      if (cfAllChecked.value) { selected.splice(0); }
      else { cfList.value.forEach(x => { const id = getId(x); if (!selected.includes(id)) selected.push(id); }); }
    };

    watch(() => searchParam.type, () => { selected.splice(0); searchParam.kw = ''; uiState.selectedDeptId = null; uiState.selectedGrade = null; });

    const cfTypeBadge = computed(() => ({
      '메일템플릿': 'badge-blue', '문자템플릿': 'badge-green', 'MMS템플릿': 'badge-orange',
      'kakao톡템플릿': 'badge-purple', 'kakao알림톡템플릿': 'badge-purple',
      '시스템알림': 'badge-red', '회원알림': 'badge-teal',
    }[props.tmpl?.templateType] || 'badge-gray'));

    const fnGradeBadgeColor = g => ({ 'VIP': '#f59e0b', '우수': '#2563eb', '일반': '#6b7280' }[g] || '#6b7280');

    const handleSend = async () => {
      if (!selected.length) { props.showToast('발송할 수신자를 선택하세요.', 'info'); return; }
      const typeLabel = searchParam.type === 'member' ? '회원' : '관리자';
      const ok = await props.showConfirm('템플릿 발송',
        `[${props.tmpl?.templateNm}] 템플릿을 선택된 ${typeLabel} ${selected.length}명에게 발송하시겠습니까?`,
        { btnOk: '발송', btnCancel: '취소' });
      if (!ok) return;
      props.showToast(`${typeLabel} ${selected.length}명에게 발송 요청이 완료되었습니다.`);
      emit('close');
    };

    return { cfSiteNm, searchParam, uiState, cfList, selected, fnIsSelected, handleToggleSelect, cfAllChecked, handleToggleAll, cfTypeBadge, fnGradeBadgeColor, handleSend,
             selectedDeptId, selectedGrade, cfFlatDeptTree, MEMBER_GRADES };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div style="background:#fff;border-radius:14px;width:calc(100vw - 40px);max-width:800px;height:84vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden;" @click.stop>

    <!-- ── 헤더 ── -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;color:#1a1a2e;">📨 발송하기</span>
        <span style="font-size:10px;font-weight:600;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:20px;">{{ cfSiteNm }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span v-if="selected.length" style="font-size:12px;color:#52c41a;font-weight:700;background:#f6ffed;padding:3px 10px;border-radius:20px;">{{ selected.length }}명 선택됨</span>
        <span style="cursor:pointer;font-size:20px;color:#d1d5db;line-height:1;" @click="$emit('close')">✕</span>
      </div>
    </div>

    <!-- ── 템플릿 정보 바 ── -->
    <div style="display:flex;align-items:center;gap:8px;padding:9px 20px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <span class="badge" :class="cfTypeBadge" style="flex-shrink:0;">{{ tmpl?.templateType }}</span>
      <span style="font-weight:700;font-size:13px;color:#1a1a2e;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ tmpl?.templateNm }}</span>
      <code v-if="tmpl?.templateCode" style="font-size:11px;color:#888;background:#efefef;padding:1px 8px;border-radius:4px;flex-shrink:0;">{{ tmpl.templateCode }}</code>
    </div>

    <!-- ── 탭 ── -->
    <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;background:#fff;">
      <button @click="searchParam.type='member'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='member'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👥 회원
      </button>
      <button @click="searchParam.type='user'"
        style="padding:9px 24px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .12s;"
        :style="searchParam.type==='user'?'border-bottom:2px solid #e8587a;color:#e8587a;margin-bottom:-2px;':'color:#9ca3af;'">
        👤 관리자
      </button>
    </div>

    <!-- ── 바디: 좌(필터) + 우(목록) ── -->
    <div style="display:flex;flex:1;min-height:0;overflow:hidden;">

      <!-- 좌: 필터 패널 -->
      <div style="width:200px;flex-shrink:0;border-right:1px solid #f0f0f0;display:flex;flex-direction:column;background:#f8f9fb;">

        <!-- 관리자 탭: 부서 트리 -->
        <template v-if="searchParam.type==='user'">
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
            <div v-for="d in cfFlatDeptTree" :key="d.deptId"
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
                :style="{ background: selectedGrade===g?'#fff':fnGradeBadgeColor(g) }"></span>
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
            <input v-model="searchParam.kw" :placeholder="searchParam.type==='member'?'이름 / 이메일 / ID 검색':'이름 / 이메일 / ID 검색'"
              style="width:100%;border:1px solid #e5e7eb;border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;outline:none;box-sizing:border-box;" />
          </div>
        </div>
        <div style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid #f0f0f0;flex-shrink:0;background:#fafafa;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:#374151;user-select:none;">
            <input type="checkbox" :checked="cfAllChecked" @change="handleToggleAll" style="width:14px;height:14px;" /> 전체선택
          </label>
          <span style="margin-left:auto;font-size:12px;color:#9ca3af;">총 <b style="color:#374151;">{{ cfList.length }}</b>명</span>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <div v-if="cfList.length===0" style="text-align:center;color:#bbb;padding:52px 0;font-size:13px;">
            <div style="font-size:32px;margin-bottom:8px;">🔍</div>검색 결과가 없습니다.
          </div>
          <div v-for="item in cfList" :key="item.userId||item.boUserId"
            style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .1s;"
            :style="fnIsSelected(item)?'background:#f0fff4;':''"
            @click="handleToggleSelect(item)">
            <input type="checkbox" :checked="fnIsSelected(item)" @click.stop="handleToggleSelect(item)"
              style="width:15px;height:15px;flex-shrink:0;accent-color:#52c41a;cursor:pointer;" />
            <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;transition:all .1s;"
              :style="fnIsSelected(item)?'background:#52c41a;color:#fff;':'background:#f3f4f6;color:#6b7280;'">
              {{ (searchParam.type==='member' ? item.memberNm : item.name).charAt(0) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a2e;display:flex;align-items:baseline;gap:5px;">
                {{ searchParam.type==='member' ? item.memberNm : item.name }}
                <span style="font-size:11px;color:#9ca3af;font-weight:400;">{{ item.loginId || item.email }}</span>
              </div>
              <div style="font-size:11px;color:#b0b7c3;margin-top:2px;">
                <template v-if="searchParam.type==='user'">{{ item.dept || '-' }} · {{ item.role }}</template>
                <template v-else>{{ item.email }}</template>
              </div>
            </div>
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;flex-shrink:0;"
              :style="searchParam.type==='user'
                ? (item.status==='활성'?'background:#dcfce7;color:#16a34a;':'background:#f3f4f6;color:#9ca3af;')
                : (item.grade==='VIP'?'background:#fef3c7;color:#d97706;':item.grade==='우수'?'background:#dbeafe;color:#1d4ed8;':'background:#f3f4f6;color:#6b7280;')">
              {{ searchParam.type==='user' ? item.status : item.grade }}
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
          @click="handleSend">
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ kw: '', hoverId: null });
    const allRoles = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syRole.getList({ pageSize: 10000 }, '역할관리', '목록조회');
        allRoles.splice(0, allRoles.length, ...(res.data?.data || []));
      } catch (e) { allRoles.splice(0, allRoles.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    const fnBuildTree = (items, parentId, depth) => {
      return items
        .filter(r => (r.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(r => ({ ...r, _depth: depth, _kids: fnBuildTree(items, r.roleId, depth + 1) }));
    };
    const fnFlatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlatten(n._kids, result); });
      return result;
    };
    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); allRoles.filter(r => r.parentId === id).forEach(r => mark(r.roleId)); };
        mark(props.excludeId);
      }
      const base = allRoles.filter(r => !excSet.has(r.roleId) && r.useYn === 'Y');
      const kwVal = uiState.kw.trim().toLowerCase();
      const list  = kwVal ? base.filter(r => r.roleNm.toLowerCase().includes(kwVal) || r.roleCode.toLowerCase().includes(kwVal)) : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });
    const onSelect = (role) => emit('select', { roleId: role.roleId, roleNm: role.roleNm });
    const onSelectNone = () => emit('select', { roleId: null, roleNm: '' });
    const cfSiteNm = computed(() => boUtil.getSiteNm());
    return { cfSiteNm, uiState, cfFlatTree, onSelect, onSelectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위역할 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">역할을 클릭하면 상위역할로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="uiState.kw" placeholder="역할명 또는 역할코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="uiState.hoverId='__none__'" @mouseleave="uiState.hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 권한으로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <div v-for="r in cfFlatTree" :key="r.roleId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===r.roleId ? '#fff5f7' : '' }"
        @mouseenter="uiState.hoverId=r.roleId" @mouseleave="uiState.hoverId=null" @click="onSelect(r)">
        <span :style="{ marginLeft:(r._depth*14)+'px', marginRight:'7px', fontWeight:'700',
                        fontSize: r._depth===0?'7px':'12px', flexShrink:0,
                        color:['#e8587a','#2563eb','#52c41a','#f59e0b'][Math.min(r._depth,3)] }">
          {{ ['●','◦','·','-'][Math.min(r._depth,3)] }}
        </span>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <span style="font-size:13px;font-weight:600;color:#1a1a2e;">{{ r.roleNm }}</span>
          <code style="font-size:10px;color:#aaa;background:#f5f5f5;padding:1px 5px;border-radius:3px;margin-left:6px;letter-spacing:.3px;">{{ r.roleCode }}</code>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .1s;" :style="{ opacity: uiState.hoverId===r.roleId ? 1 : 0 }">›</span>
      </div>
      <div v-if="cfFlatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ uiState.kw ? '검색 결과가 없습니다.' : '선택 가능한 권한이 없습니다.' }}
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ kw: '', hoverId: null });
    const allMenus = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syMenu.getList({ pageSize: 10000 }, '메뉴관리', '목록조회');
        allMenus.splice(0, allMenus.length, ...(res.data?.data || []));
      } catch (e) { allMenus.splice(0, allMenus.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

    const fnBuildTree = (items, parentId, depth) => {
      return items
        .filter(m => (m.parentId || null) === (parentId || null))
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
        .map(m => ({ ...m, _depth: depth, _kids: fnBuildTree(items, m.menuId, depth + 1) }));
    };

    const fnFlatten = (nodes, result = []) => {
      nodes.forEach(n => { result.push(n); fnFlatten(n._kids, result); });
      return result;
    };

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          allMenus.filter(m => m.parentId === id).forEach(m => markExclude(m.menuId));
        };
        markExclude(props.excludeId);
      }
      const base = allMenus.filter(m => !excSet.has(m.menuId) && m.useYn === 'Y');
      const kwVal = uiState.kw.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(m => m.menuNm.toLowerCase().includes(kwVal) || m.menuCode.toLowerCase().includes(kwVal))
        : base;
      return fnFlatten(fnBuildTree(list, null, 0));
    });

    const onSelect = (menu) => emit('select', { menuId: menu.menuId, menuNm: menu.menuNm });
    const onSelectNone = () => emit('select', { menuId: null, menuNm: '' });
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    return { cfSiteNm, uiState, cfFlatTree, onSelect, onSelectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위메뉴 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">메뉴를 클릭하면 상위메뉴로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="uiState.kw"
          placeholder="메뉴명 또는 메뉴코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="uiState.hoverId='__none__'" @mouseleave="uiState.hoverId=null"
        @click="onSelectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;">
          <span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span>
          <span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 메뉴로 등록</span>
        </div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;"
          :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 메뉴 트리 항목들 -->
      <div v-for="m in cfFlatTree" :key="m.menuId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===m.menuId ? '#fff5f7' : '' }"
        @mouseenter="uiState.hoverId=m.menuId" @mouseleave="uiState.hoverId=null"
        @click="onSelect(m)">

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
          :style="{ opacity: uiState.hoverId===m.menuId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="cfFlatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        {{ uiState.kw ? '검색 결과가 없습니다.' : '선택 가능한 메뉴가 없습니다.' }}
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ kw: '', hoverId: null });
    const allDepts = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syDept.getList({ pageSize: 10000 }, '부서관리', '목록조회');
        allDepts.splice(0, allDepts.length, ...(res.data?.data || []));
      } catch (e) { allDepts.splice(0, allDepts.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

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

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const markExclude = (id) => {
          excSet.add(id);
          allDepts.filter(d => d.parentId === id).forEach(d => markExclude(d.deptId));
        };
        markExclude(props.excludeId);
      }
      const base = allDepts.filter(d => !excSet.has(d.deptId) && d.useYn === 'Y');
      const kwVal = uiState.kw.trim().toLowerCase();
      const list  = kwVal
        ? base.filter(d => d.deptNm.toLowerCase().includes(kwVal) || d.deptCode.toLowerCase().includes(kwVal))
        : base;
      return flatten(buildTree(list, null, 0));
    });

    const select = (dept) => emit('select', { deptId: dept.deptId, deptNm: dept.deptNm });
    const selectNone = () => emit('select', { deptId: null, deptNm: '' });
    const cfSiteNm = computed(() => boUtil.getSiteNm());

    return { cfSiteNm, uiState, cfFlatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">

    <!-- ── 헤더 ── -->
    <div class="tree-modal-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;line-height:1;">🌳</span>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위부서 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></div>
          <div style="font-size:11px;color:#aaa;margin-top:1px;">부서를 클릭하면 상위부서로 지정됩니다</div>
        </div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>

    <!-- ── 검색 ── -->
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="uiState.kw"
          placeholder="부서명 또는 부서코드 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>

    <!-- ── 트리 목록 ── -->
    <div style="flex:1;overflow-y:auto;">

      <!-- 최상위 선택 (고정 첫 항목) -->
      <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;
                  border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="uiState.hoverId='__none__'" @mouseleave="uiState.hoverId=null"
        @click="onSelectNone">
        <!-- accent bar -->
        <div style="width:4px;align-self:stretch;border-radius:3px;background:#e8587a;flex-shrink:0;opacity:0.7;"></div>
        <span style="font-size:20px;flex-shrink:0;line-height:1;">🏢</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</div>
          <div style="font-size:11px;color:#aaa;margin-top:2px;">최상위 부서로 등록</div>
        </div>
        <span style="font-size:16px;color:#e8587a;font-weight:700;transition:opacity .12s;"
          :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>

      <!-- 부서 트리 항목들 -->
      <div v-for="d in cfFlatTree" :key="d.deptId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;
               border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===d.deptId ? '#fff5f7' : '' }"
        @mouseenter="uiState.hoverId=d.deptId" @mouseleave="uiState.hoverId=null"
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
          :style="{ opacity: uiState.hoverId===d.deptId ? 1 : 0 }">›</span>
      </div>

      <!-- 빈 상태 -->
      <div v-if="cfFlatTree.length===0"
        style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ uiState.kw ? '검색 결과가 없습니다.' : '선택 가능한 부서가 없습니다.' }}
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
  props: ['dispDataset', 'excludeId', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ kw: '', hoverId: null });
    const allCategories = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.pdCategory.getList({ pageSize: 10000 }, '카테고리관리', '목록조회');
        allCategories.splice(0, allCategories.length, ...(res.data?.data || []));
      } catch (e) { allCategories.splice(0, allCategories.length); }
    };
    onMounted(() => { handleSearchList(); });
    watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });

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

    const cfFlatTree = computed(() => {
      const excSet = new Set();
      if (props.excludeId) {
        const mark = (id) => { excSet.add(id); allCategories.filter(c => c.parentId === id).forEach(c => mark(c.categoryId)); };
        mark(props.excludeId);
      }
      const base   = allCategories.filter(c => !excSet.has(c.categoryId) && (c.useYn === 'Y' || c.status === '활성'));
      const kwVal  = uiState.kw.trim().toLowerCase();
      const list   = kwVal ? base.filter(c => c.categoryNm.toLowerCase().includes(kwVal)) : base;
      return flatten(buildTree(list, null, 0));
    });

    const select     = (cat) => emit('select', { categoryId: cat.categoryId, categoryNm: cat.categoryNm });
    const selectNone = () => emit('select', { categoryId: null, categoryNm: '' });
    const cfSiteNm   = computed(() => boUtil.getSiteNm());
    return { cfSiteNm, uiState, cfFlatTree, select, selectNone };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:440px;max-height:80vh;display:flex;flex-direction:column;padding:0;overflow:hidden;">
    <div class="tree-modal-header">
      <div>
        <div style="font-size:15px;font-weight:700;color:#1a1a2e;">상위카테고리 선택<span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">{{ cfSiteNm }}</span></div>
        <div style="font-size:11px;color:#aaa;margin-top:1px;">카테고리를 클릭하면 상위카테고리로 지정됩니다</div>
      </div>
      <span class="modal-close" @click="$emit('close')">✕</span>
    </div>
    <div style="padding:10px 14px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;flex-shrink:0;">
      <div style="position:relative;">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:#bbb;">🔍</span>
        <input class="form-control" v-model="uiState.kw" placeholder="카테고리명 검색"
          style="padding-left:30px;font-size:13px;border-radius:20px;border-color:#e8e8e8;background:#fff;" />
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <!-- 최상위 선택 -->
      <div style="display:flex;align-items:center;gap:0;padding:11px 16px;cursor:pointer;border-bottom:2px solid #f0f0f0;transition:background .12s;"
        :style="{ background: uiState.hoverId==='__none__' ? '#fff5f7' : '#fafafa' }"
        @mouseenter="uiState.hoverId='__none__'" @mouseleave="uiState.hoverId=null" @click="selectNone">
        <span style="font-size:7px;font-weight:700;color:#e8587a;margin-right:8px;flex-shrink:0;">●</span>
        <div style="flex:1;"><span style="font-size:13px;font-weight:700;color:#1a1a2e;">상위없음</span><span style="font-size:11px;color:#aaa;margin-left:6px;">최상위 카테고리로 등록</span></div>
        <span style="font-size:16px;font-weight:700;flex-shrink:0;color:#aaa;transition:opacity .12s;" :style="{ opacity: uiState.hoverId==='__none__' ? 1 : 0 }">›</span>
      </div>
      <!-- 카테고리 트리 -->
      <div v-for="c in cfFlatTree" :key="c.categoryId"
        style="display:flex;align-items:center;gap:0;padding:9px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background .1s;"
        :style="{ background: uiState.hoverId===c.categoryId ? '#fff5f7' : '' }"
        @mouseenter="uiState.hoverId=c.categoryId" @mouseleave="uiState.hoverId=null" @click="select(c)">
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
      <div v-if="cfFlatTree.length===0" style="text-align:center;color:#bbb;padding:36px 0;font-size:13px;">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        {{ uiState.kw ? '검색 결과가 없습니다.' : '선택 가능한 카테고리가 없습니다.' }}
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
    show:     { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
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
    const cfAreaWidgets = computed(() =>
      props.widgets
        .filter(w => w.area === props.area && w.status === '활성')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );

    /* mode=single: form 스냅샷에 status='활성' 강제 적용하여 렌더 */
    const cfPreviewWidget = computed(() => ({ ...props.widget, status: '활성' }));

    const WIDGET_LABEL = {
      image_banner: '이미지 배너', product_slider: '상품 슬라이더', product: '상품',
      chart_bar: '차트(Bar)', chart_line: '차트(Line)', chart_pie: '차트(Pie)',
      text_banner: '텍스트 배너', info_card: '정보 카드', popup: '팝업',
      file: '파일', coupon: '쿠폰', html_editor: 'HTML 에디터',
      event_banner: '이벤트', cache_banner: '캐쉬', widget_embed: '위젯 임베드',
    };
    const cfWidgetLabel = computed(() => WIDGET_LABEL[props.widget?.widgetType] || props.widget?.widgetType || '');

    return { cfAreaWidgets, cfPreviewWidget, cfWidgetLabel };
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
        <span v-if="mode==='single' && cfWidgetLabel" style="margin-left:6px;font-size:11px;color:#aaa;">({{ cfWidgetLabel }})</span>
        <span v-if="mode==='all' && area" style="margin-left:6px;font-size:11px;color:#aaa;">영역: {{ area }}</span>
      </div>
      <button @click="$emit('close')"
        style="background:none;border:none;cursor:pointer;font-size:18px;color:#aaa;line-height:1;padding:2px 6px;">✕</button>
    </div>

    <!-- 콘텐츠 -->
    <div style="flex:1;overflow-y:auto;padding:20px;">

      <!-- mode=all: 해당 area 전체 위젯 -->
      <template v-if="mode==='all'">
        <div v-if="cfAreaWidgets.length===0"
          style="text-align:center;color:#bbb;padding:40px 0;font-size:13px;">
          <div style="font-size:32px;margin-bottom:8px;">📭</div>
          [{{ area }}] 영역에 활성 위젯이 없습니다.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="w in cfAreaWidgets" :key="w.dispId">
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
        <div v-if="cfPreviewWidget.widgetType"
          style="border:1px dashed #e0e0e0;border-radius:8px;padding:16px;background:#fafbff;">
          <disp-x04-widget
            :params="{ isLoggedIn: false, userGrade: '' }"
            :disp-dataset="{ displays: [], codes: [] }"
            :disp-opt="{ showBadges: true }"
            :widget-item="cfPreviewWidget"
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
    show:      { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
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
    show:        { type: Boolean, default: false, reloadTrigger: { type: Number, default: 0 } },
    selectedIds: { type: Array,   default: () => [] },
  },
  emits: ['close', 'apply'],
  setup(props, { emit }) {
    const { ref, reactive, computed, watch, watchEffect } = Vue;

    const searchParam = reactive({ kw: '' });

    const cfAllCats = computed(() =>
      ((window.dispDataset || {}).categories || [])
        .filter(c => c.status === '활성')
        .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0))
    );

    /* 루트/자식 */
    const cfRoots = computed(() => {
      const kwv = searchParam.kw.trim().toLowerCase();
      let list = cfAllCats.value;
      if (kwv) {
        const matchIds = new Set(list.filter(c => c.categoryNm.toLowerCase().includes(kwv)).map(c => c.categoryId));
        list = list.filter(c => matchIds.has(c.categoryId) || matchIds.has(c.parentId));
      }
      return list.filter(c => !c.parentId);
    });

    const childrenOf = (parentId) => {
      const kwv = searchParam.kw.trim().toLowerCase();
      let list = cfAllCats.value.filter(c => c.parentId === parentId);
      if (kwv) list = list.filter(c => c.categoryNm.toLowerCase().includes(kwv));
      return list;
    };

    /* 펼침 상태 — 루트는 기본 펼침 */
    const expanded = reactive(new Set());
    const toggleExpand = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    watchEffect(() => { cfRoots.value.forEach(r => expanded.add(r.categoryId)); });

    /* 선택 상태 (로컬 복사) */
    const localSel = reactive(new Set());
    watch(() => props.show, (v) => {
      if (v) { localSel.clear(); props.selectedIds.forEach(id => localSel.add(id)); }
    }, { immediate: true });

    /* 전체 선택 */
    const cfAllIds = computed(() => {
      const ids = [];
      cfRoots.value.forEach(r => { ids.push(r.categoryId); childrenOf(r.categoryId).forEach(c => ids.push(c.categoryId)); });
      return ids;
    });
    const isAllOn  = computed(() => cfAllIds.value.length > 0 && cfAllIds.value.every(id => localSel.has(id)));
    const cfIsSomeOn = computed(() => !isAllOn.value && cfAllIds.value.some(id => localSel.has(id)));
    const toggleAll = () => { if (isAllOn.value) cfAllIds.value.forEach(id => localSel.delete(id)); else cfAllIds.value.forEach(id => localSel.add(id)); };

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

    const onReset = () => localSel.clear();
    const apply = () => { emit('apply', [...localSel]); emit('close'); };

    return { searchParam, cfRoots, childrenOf, expanded, toggleExpand, localSel, toggleChild, toggleRoot, toggleAll, isRootFull, isRootPart, isAllOn, cfIsSomeOn, onReset, apply };
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
      <input v-model="searchParam.kw" type="text" placeholder="카테고리명 검색" style="width:100%;box-sizing:border-box;font-size:12px;padding:4px 9px;border:1px solid #ddd;border-radius:5px;outline:none;" />
    </div>

    <!-- 트리 목록 -->
    <div style="flex:1;overflow-y:auto;padding:4px 0;">
      <div v-if="cfRoots.length===0" style="text-align:center;padding:30px;font-size:12px;color:#bbb;">검색 결과 없음</div>

      <!-- ① 전체 노드 -->
      <div @click="handleToggleAll"
        style="display:flex;align-items:center;gap:6px;padding:6px 12px;cursor:pointer;user-select:none;"
        :style="isAllOn?'background:#fff4f6;':''">
        <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
          :style="isAllOn?'border-color:#e8587a;background:#e8587a;':cfIsSomeOn?'border-color:#e8587a;background:#fce4ec;':'border-color:#aaa;background:#fff;'">
          <span v-if="isAllOn"  style="color:#fff;font-size:9px;line-height:1;">✓</span>
          <span v-else-if="cfIsSomeOn" style="color:#e8587a;font-size:11px;font-weight:900;line-height:1;margin-top:-1px;">−</span>
        </div>
        <span style="font-size:12px;font-weight:700;color:#333;">전체</span>
      </div>

      <!-- ② 루트 + 자식 트리 -->
      <div style="position:relative;padding-left:12px;">
        <!-- 레벨1 세로선 (전체 → 루트들) -->
        <div style="position:absolute;left:19px;top:0;bottom:14px;width:1px;background:#d0d0d0;"></div>

        <div v-for="root in cfRoots" :key="root.categoryId">
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
      <button @click="onReset" style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#666;cursor:pointer;">초기화</button>
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
    title: { type: String, default: '전시항목 복사', reloadTrigger: { type: Number, default: 0 } },
    displays: { type: Array, default: () => [] },   /* 전체 패널(dispDataset.displays) */
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludePanelId: { type: Number, default: null },/* 현재 패널 제외 */
  },
  emits: ['close', 'pick-multi'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchKw = ref('');
    const searchStatus = ref('');
    const activeStatuses = reactive([]);
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = k => treeOpen.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    /* 모든 위젯을 flatten (panel 정보 포함) */
    const cfAllRows = computed(() => {
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

    const cfFiltered = computed(() => cfAllRows.value.filter(o => {
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
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });
    const cfTree = computed(() => {
      const g = {};
      cfAllRows.value.forEach(o => {
        const top = (o.__area || '(미등록)').split('_')[0];
        g[top] = (g[top] || 0) + 1;
      });
      return Object.keys(g).sort().map(top => ({ label: top, count: g[top] }));
    });

    const checked = reactive(new Set());
    const isChecked = (id) => checked.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(o => checked.has(o.__rowId)));
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(o => s.delete(o.__rowId));
      else (pager.pageList||[]).forEach(o => s.add(o.__rowId));
      checked = s;
    };
    const pickMulti = () => {
      const picks = cfAllRows.value.filter(o => checked.has(o.__rowId));
      if (!picks.length) return;
      emit('pick-multi', picks.map(o => ({ ...o.row })));
      checked = new Set();
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

    Vue.onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    return {
      searchKw, searchStatus, activeStatuses, pager, PAGE_SIZES,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, cfTree,
      statusCls, areaNm, wLabel,
      checked, isChecked, toggleCheck, cfAllChecked, toggleCheckAll, pickMulti, pickOne,
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
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ pager.pageTotalCount }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label"
            @click="selectTree(node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>▸ {{ node.label }}</span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>총 <b>{{ pager.pageTotalCount }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 복사</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;"><input type="checkbox" :checked="cfAllChecked" @change="toggleCheckAll" /></th>
                <th style="width:110px;">위젯 유형</th>
                <th>전시항목 정보</th>
                <th style="width:160px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 전시항목이 없습니다.</td></tr>
              <tr v-for="o in pager.pageList" :key="o.__rowId"
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
            <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page++">›</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page=pager.pageTotalPage">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1;fnBuildPagerNums()">
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
    title: { type: String, default: '전시영역 추가', reloadTrigger: { type: Number, default: 0 } },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeUi: { type: String, default: '' },        /* 제외할 UI 코드 (이미 포함된 영역 제외) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted } = Vue;
    const searchParam = reactive({ kw: '', useYn: '' });
    const pager = reactive({ page: 1, size: 5 });
    const useYnOpts = reactive([]);
    onMounted(() => {
      try {
        const s = window.sfGetBoCodeStore?.();
        if (s?.sgGetGrpCodes) useYnOpts.splice(0, useYnOpts.length, ...(s.sgGetGrpCodes('USE_YN') || []));
      } catch(e) {}
    });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = k => treeOpen.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const cfFiltered = computed(() => (props.areas || []).filter(a => {
      if (props.excludeUi && a.uiCode === props.excludeUi) return false;
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !(a.codeValue||'').toLowerCase().includes(kw) && !(a.codeLabel||'').toLowerCase().includes(kw)) return false;
      if (searchParam.useYn && a.useYn !== searchParam.useYn) return false;
      if (selectedTreeKey.value) {
        const top = (a.codeValue || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.codeLabel||'').localeCompare(b.codeLabel||'')));
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });
    const cfTree = computed(() => {
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
    const checked = reactive(new Set());
    const isChecked = (id) => checked.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(a => checked.has(a.codeId)));
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(a => s.delete(a.codeId));
      else (pager.pageList||[]).forEach(a => s.add(a.codeId));
      checked = s;
    };
    const pickMulti = () => {
      const ids = Array.from(checked);
      if (!ids.length) return;
      ids.forEach(id => {
        const a = (props.areas || []).find(x => x.codeId === id);
        if (a) emit('pick', a);
      });
      checked = new Set();
    };

    return {
      searchParam, pager, PAGE_SIZES,
      useYnOpts,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, cfTree,
      statusCls, onPick,
      checked, isChecked, toggleCheck, cfAllChecked, toggleCheckAll, pickMulti, fnBuildPagerNums,
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
      <input v-model="searchParam.kw" placeholder="영역코드·영역명 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.useYn" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">사용 전체</option>
        <template v-if="useYnOpts.length">
          <option v-for="o in useYnOpts" :key="o.codeValue" :value="o.codeValue">{{ o.codeLabel }}</option>
        </template>
        <template v-else>
          <option value="Y">사용</option>
          <option value="N">미사용</option>
        </template>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ pager.pageTotalCount }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label"
            @click="selectTree(node.label)"
            :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'2px',background: selectedTreeKey===node.label ? '#e3f2fd' : 'transparent',color: selectedTreeKey===node.label ? '#1565c0' : '#333',fontWeight: selectedTreeKey===node.label ? 700 : 500 }">
            <span>▸ {{ node.label }}</span>
            <span style="font-size:10px;background:#f0f2f5;color:#666;border-radius:10px;padding:1px 7px;">{{ node.count }}</span>
          </div>
        </div>
      </div>
      <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;display:flex;justify-content:space-between;align-items:center;">
          <span>총 <b>{{ pager.pageTotalCount }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 추가</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;"><input type="checkbox" :checked="cfAllChecked" @change="toggleCheckAll" /></th>
                <th style="width:56px;">ID</th>
                <th>영역 정보</th>
                <th style="width:140px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 영역이 없습니다.</td></tr>
              <tr v-for="a in pager.pageList" :key="a.codeId"
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
            <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page++">›</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page=pager.pageTotalPage">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1;fnBuildPagerNums()">
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
    title: { type: String, default: '전시패널 추가', reloadTrigger: { type: Number, default: 0 } },
    displays: { type: Array, default: () => [] },
    areas:    { type: Array, default: () => [] },   /* DISP_AREA codes */
    excludeArea: { type: String, default: '' },     /* 제외할 영역코드 (이미 포함) */
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ kw: '', status: '' });
    const activeStatuses = reactive([]);
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = k => treeOpen.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };

    const areaNm = (code) => {
      const a = props.areas.find(x => x.codeValue === code);
      return a ? a.codeLabel : code;
    };

    const cfFiltered = computed(() => (props.displays || []).filter(p => {
      if (props.excludeArea && p.area === props.excludeArea) return false;
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !(p.name||'').toLowerCase().includes(kw) && !(p.area||'').toLowerCase().includes(kw)) return false;
      if (searchParam.status && p.status !== searchParam.status) return false;
      if (selectedTreeKey.value) {
        const top = (p.area || '').split('_')[0];
        if (top !== selectedTreeKey.value) return false;
      }
      return true;
    }).sort((a,b) => (a.name||'').localeCompare(b.name||'')));
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });
    const cfTree = computed(() => {
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
    const checked = reactive(new Set());
    const isChecked = (id) => checked.has(id);
    const toggleCheck = (id) => {
      const s = new Set(checked);
      if (s.has(id)) s.delete(id); else s.add(id);
      checked = s;
    };
    const cfAllChecked = computed(() => (pager.pageList||[]).length > 0 && (pager.pageList||[]).every(p => checked.has(p.dispId)));
    const toggleCheckAll = () => {
      const s = new Set(checked);
      if (cfAllChecked.value) (pager.pageList||[]).forEach(p => s.delete(p.dispId));
      else (pager.pageList||[]).forEach(p => s.add(p.dispId));
      checked = s;
    };
    const pickMulti = () => {
      const ids = Array.from(checked);
      if (!ids.length) return;
      ids.forEach(id => {
        const p = (props.displays || []).find(x => x.dispId === id);
        if (p) emit('pick', p);
      });
      checked = new Set();
    };

    Vue.onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    return {
      searchParam, activeStatuses, pager, PAGE_SIZES,
      selectedTreeKey, toggleTree, isTreeOpen, selectTree, cfTree,
      statusCls, onPick, areaNm,
      checked, isChecked, toggleCheck, cfAllChecked, toggleCheckAll, pickMulti, fnBuildPagerNums,
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
      <input v-model="searchParam.kw" placeholder="패널명·영역코드 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.status" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">상태 전체</option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
    </div>
    <div style="flex:1;overflow:hidden;display:flex;gap:12px;padding:12px;background:#f4f5f8;">
      <!-- 트리 -->
      <div style="width:220px;flex-shrink:0;background:#fff;border-radius:8px;padding:12px;overflow-y:auto;">
        <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">사용위치 트리</div>
        <div @click="toggleTree('__root__'); selectTree('')"
          :style="{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',marginBottom:'4px',background: selectedTreeKey==='' ? '#e3f2fd' : '#f8f9fb',color: selectedTreeKey==='' ? '#1565c0' : '#222',fontWeight:700,border:'1px solid '+(selectedTreeKey==='' ? '#90caf9' : '#e4e7ec') }">
          <span>{{ isTreeOpen('__root__') ? '▼' : '▶' }} 📂 전체</span>
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ pager.pageTotalCount }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label"
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
          <span>총 <b>{{ pager.pageTotalCount }}</b>건 <span v-if="checked.size" style="color:#1565c0;margin-left:8px;">선택 {{ checked.size }}개</span></span>
          <button v-if="checked.size" @click="pickMulti" class="btn btn-primary btn-sm" style="font-size:11px;">선택한 {{ checked.size }}개 일괄 추가</button>
        </div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" :checked="cfAllChecked" @change="toggleCheckAll" />
                </th>
                <th style="width:56px;">ID</th>
                <th>패널 정보</th>
                <th style="width:140px;text-align:left;">사용위치경로</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length"><td colspan="5" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 패널이 없습니다.</td></tr>
              <tr v-for="p in pager.pageList" :key="p.dispId"
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
            <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page++">›</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page=pager.pageTotalPage">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1;fnBuildPagerNums()">
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
    mode: { type: String, default: 'copy', reloadTrigger: { type: Number, default: 0 } },     /* 'copy' | 'ref' */
    widgetLibs: { type: Array, default: () => [] },
  },
  emits: ['close', 'pick'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ kw: '', type: '', status: '' });
    const pager = reactive({ page: 1, size: 5 });
    const PAGE_SIZES = [2, 3, 4, 5, 10, 20, 50, 100];

    const cfFiltered = computed(() => (props.widgetLibs || []).filter(d => {
      const kw = searchParam.kw.trim().toLowerCase();
      if (kw && !(d.name||'').toLowerCase().includes(kw) && !(d.desc||'').toLowerCase().includes(kw) && !(d.tags||'').toLowerCase().includes(kw)) return false;
      if (searchParam.type && d.widgetType !== searchParam.type) return false;
      if (searchParam.status && d.status !== searchParam.status) return false;
      return true;
    }).sort((a,b) => b.libId - a.libId));
    const fnBuildPagerNums = () => {
      const total = cfFiltered.value.length;
      pager.pageTotalCount = total;
      pager.pageTotalPage = Math.max(1, Math.ceil(total / pager.size));
      pager.pageList = cfFiltered.value.slice((pager.page-1)*pager.size, pager.page*pager.size);
      const cur=pager.page, last=pager.pageTotalPage, s=Math.max(1,cur-2), e=Math.min(last,s+4);
      pager.pageNums = Array.from({length:e-s+1},(_,i)=>s+i);
    };
    Vue.watch(cfFiltered, () => { pager.page = 1; fnBuildPagerNums(); }, { immediate: true });

    /* 사용위치 트리 */
    const selectedTreeKey = ref('');
    const treeOpen = reactive(new Set(['__root__']));
    const toggleTree = k => { if (treeOpen.has(k)) treeOpen.delete(k); else treeOpen.add(k); };
    const isTreeOpen = k => treeOpen.has(k);
    const selectTree = k => { selectedTreeKey.value = selectedTreeKey.value === k ? '' : k; pager.page = 1; };
    const cfTree = computed(() => {
      const map = {};
      const add = (lib, p) => {
        const parts = p.split('>').map(x => x.trim()).filter(Boolean);
        if (!parts.length) return;
        const top = parts[0], rest = parts.slice(1).join(' > ') || '(루트)';
        if (!map[top]) map[top] = {};
        if (!map[top][rest]) map[top][rest] = [];
        map[top][rest].push(lib);
      };
      cfFiltered.value.forEach(lib => {
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
    const activeStatuses = reactive([]);
    Vue.onMounted(() => {
      const codeStore = window.sfGetBoCodeStore?.();
      if (codeStore?.sgGetGrpCodes) activeStatuses.splice(0, activeStatuses.length, ...(codeStore.sgGetGrpCodes('ACTIVE_STATUS') || []));
    });

    return {
      searchParam, WIDGET_TYPES, activeStatuses,
      pager, PAGE_SIZES, fnBuildPagerNums,
      cfTree, selectedTreeKey, toggleTree, isTreeOpen, selectTree,
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
      <input v-model="searchParam.kw" placeholder="이름·설명·태그 검색" style="flex:1;min-width:200px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;" />
      <select v-model="searchParam.type" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option v-for="t in WIDGET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select v-model="searchParam.status" style="padding:6px 10px;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;">
        <option value="">상태 전체</option>
        <option v-for="c in activeStatuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
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
          <span style="font-size:10px;background:#fff;color:#555;border:1px solid #ddd;border-radius:10px;padding:1px 7px;">{{ pager.pageTotalCount }}</span>
        </div>
        <div v-if="isTreeOpen('__root__')" style="padding-left:12px;">
          <div v-for="node in cfTree" :key="node.label">
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
        <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555;">총 <b>{{ pager.pageTotalCount }}</b>건</div>
        <div style="flex:1;overflow-y:auto;">
          <table class="bo-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:56px;">ID</th>
                <th>위젯 정보</th>
                <th style="width:90px;text-align:right;">선택</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!(pager.pageList||[]).length"><td colspan="3" style="text-align:center;padding:30px;color:#bbb;font-size:12px;">표시할 데이터가 없습니다.</td></tr>
              <tr v-for="d in pager.pageList" :key="d.libId">
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
            <button v-for="n in pager.pageNums" :key="n" :class="{active:pager.page===n}" @click="pager.page=n">{{ n }}</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page++">›</button>
            <button :disabled="pager.page===pager.pageTotalPage" @click="pager.page=pager.pageTotalPage">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.size" @change="pager.page=1;fnBuildPagerNums()">
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

/* ─────────────────────────────────────────────────────────────
   PathPickModal — sy_path 표시경로 선택 (트리 + 추가)
   props: bizCd (필수), value (현재 path_id), title
   emits: select(pathId), close
───────────────────────────────────────────────────────────── */
window.PathPickModal = {
  name: 'PathPickModal',
  props: ['bizCd', 'value', 'title', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const cfTree = computed(() => boUtil.buildPathTree(props.bizCd));
    const expanded = reactive(new Set([null]));
    const toggle = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const expandAll = () => { expanded.clear(); expanded.add(null); const walk = (n) => { expanded.add(n.pathId); (n.children||[]).forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    /* 3레벨 자동 펼침 (모달 오픈 시) */
    const expandLevels = (maxDepth) => {
      expanded.clear(); expanded.add(null);
      const walk = (n, d) => {
        if (d >= maxDepth) return;
        (n.children || []).forEach(ch => { expanded.add(ch.pathId); walk(ch, d + 1); });
      };
      walk(cfTree.value, 0);
    };
    /* 모달 마운트 시 최신 경로 목록 API 재조회 → window._boCmPaths 갱신 */
    Vue.onMounted(async () => {
      try {
        const res = await boApiSvc.syPath.getPage({ pageNo: 1, pageSize: 10000 }, '표시경로', '목록조회');
        const list = res.data?.data?.pageList || res.data?.data?.list || [];
        if (list.length > 0) window._boCmPaths = list;
      } catch (e) {
        console.error('[PathPickModal] 경로 조회 실패', e);
      }
      expandLevels(2);
    });

    const selectedId = ref(props.value || null);
    const select = (id) => { selectedId.value = id; };
    const confirm = () => { emit('select', selectedId.value); emit('close'); };
    const addParent = ref(null);
    const addLabel = ref('');
    const setAddParent = (id) => { addParent.value = id; };
    const doAdd = () => {
      const txt = addLabel.value.trim();
      if (!txt) {
        if (window.boToast) window.boToast('새 경로명을 입력해주세요.', 'warning');
        else alert('새 경로명을 입력해주세요.');
        return;
      }
      window._boCmPaths = window._boCmPaths || [];
      const list = window._boCmPaths;
      /* 동일 부모 + 동일 라벨 중복 체크 */
      const dup = list.find(p => p.bizCd === props.bizCd && p.parentPathId === addParent.value && p.pathLabel === txt);
      if (dup) {
        if (window.boToast) window.boToast(`'${txt}' 경로가 이미 존재합니다.`, 'error');
        else alert('이미 존재하는 경로입니다: ' + txt);
        return;
      }
      const newId = (list.reduce((m,x) => Math.max(m, x.pathId), 0) || 0) + 1;
      list.push({ pathId: newId, bizCd: props.bizCd, parentPathId: addParent.value,
        pathLabel: txt, sortOrd: 99, useYn: 'Y', remark: '', _userAdded: true });
      addLabel.value = '';
      expanded.add(addParent.value);
      selectedId.value = newId;
      if (window.boToast) window.boToast(`'${txt}' 경로가 추가되었습니다.`, 'success');
    };

    /* 인라인 수정 */
    const editingId = ref(null);
    const editLabel = ref('');
    const startEdit = (node) => { editingId.value = node.pathId; editLabel.value = node.pathLabel; };
    const saveEdit = () => {
      const id = editingId.value;
      if (id != null && editLabel.value.trim()) {
        const item = (window._boCmPaths || []).find(p => p.pathId === id);
        if (item) item.pathLabel = editLabel.value.trim();
      }
      editingId.value = null;
    };
    const cancelEdit = () => { editingId.value = null; };

    /* 삭제 (자식 없는 경우만) — boConfirm 디자인 다이얼로그 사용 */
    const deleteNode = async (node) => {
      if ((node.children || []).length > 0) {
        if (window.boConfirm) await window.boConfirm('삭제 불가', '하위 경로가 있어 삭제할 수 없습니다.', { btnCancel: '' });
        else alert('하위 경로가 있어 삭제할 수 없습니다.');
        return;
      }
      const ok = window.boConfirm
        ? await window.boConfirm('표시경로 삭제', '이 경로를 삭제하시겠습니까?', { details: node.pathLabel })
        : window.confirm('이 경로를 삭제하시겠습니까?\n\n' + node.pathLabel);
      if (!ok) return;
      const idx = (window._boCmPaths || []).findIndex(p => p.pathId === node.pathId);
      if (idx >= 0) window._boCmPaths.splice(idx, 1);
      if (selectedId.value === node.pathId) selectedId.value = null;
      if (addParent.value === node.pathId) addParent.value = null;
    };

    const labelOf = (id) => boUtil.getPathLabel(id);

    /* hover 효과 헬퍼 — 인라인 표현식 SyntaxError 회피 */
    const onRootHover = (evt) => {
      if (selectedId.value !== null && addParent.value !== null && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#f9fafb';
      }
    };
    const onRootLeave = (evt) => {
      if (selectedId.value !== null && addParent.value !== null && evt && evt.currentTarget) {
        evt.currentTarget.style.background = 'transparent';
      }
    };
    const onCloseHover = (evt) => {
      if (!evt || !evt.currentTarget) return;
      evt.currentTarget.style.background = '#f3f4f6';
      evt.currentTarget.style.color = '#374151';
    };
    const onCloseLeave = (evt) => {
      if (!evt || !evt.currentTarget) return;
      evt.currentTarget.style.background = 'transparent';
      evt.currentTarget.style.color = '#9ca3af';
    };
    const onAddHover = (evt) => { if (evt && evt.currentTarget) evt.currentTarget.style.background = '#059669'; };
    const onAddLeave = (evt) => { if (evt && evt.currentTarget) evt.currentTarget.style.background = '#10b981'; };

    return { cfTree, expanded, toggle, expandAll, collapseAll, selectedId, select, confirm,
             addParent, addLabel, setAddParent, doAdd, labelOf,
             editingId, editLabel, startEdit, saveEdit, cancelEdit, deleteNode,
             onRootHover, onRootLeave, onCloseHover, onCloseLeave, onAddHover, onAddLeave };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:640px;padding:0;overflow:hidden;border-radius:14px;">

    <!-- 헤더 -->
    <div style="background:#ffffff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#eef2ff;color:#6366f1;font-size:16px;">📂</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;letter-spacing:-0.2px;">{{ title || '표시경로 선택' }}</div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">biz_cd · {{ bizCd }}</div>
        </div>
        <span class="modal-close" style="color:#9ca3af;cursor:pointer;font-size:20px;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .15s;"
          @click="$emit('close')"
          @mouseover="onCloseHover($event)"
          @mouseout="onCloseLeave($event)">✕</span>
      </div>
      <!-- 선택 경로 미리보기 -->
      <div style="margin-top:12px;padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:10.5px;color:#6b7280;font-weight:600;">현재 선택</span>
        <span style="flex:1;font-size:13px;font-weight:600;color:selectedId==null?'#9ca3af':'#1f2937';">
          <span v-if="selectedId == null" style="color:#9ca3af;font-weight:400;">— 선택된 경로가 없습니다 —</span>
          <span v-else style="color:#e8587a;">{{ labelOf(selectedId) || ('#'+selectedId) }}</span>
        </span>
      </div>
    </div>

    <!-- 본문 -->
    <div style="padding:14px 22px 18px;background:#fafbfc;">

      <!-- 트리 도구 -->
      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
        <span style="font-size:11.5px;font-weight:700;color:#374151;">경로 트리</span>
        <span style="font-size:10px;color:#9ca3af;background:#fff;border:1px solid #e5e7eb;padding:2px 8px;border-radius:10px;">클릭: 선택 · 더블클릭: 즉시 적용</span>
        <span style="flex:1;"></span>
        <button @click="expandAll" style="font-size:10.5px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:5px;cursor:pointer;color:#6b7280;">▼ 펼치기</button>
        <button @click="collapseAll" style="font-size:10.5px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:5px;cursor:pointer;color:#6b7280;">▶ 접기</button>
      </div>

      <div style="height:340px;overflow:auto;border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:8px;margin-bottom:14px;">
        <div @click="select(null); setAddParent(null);"
          @dblclick="select(null); confirm();"
          :style="{padding:'8px 12px',cursor:'pointer',borderRadius:'8px',transition:'all .12s',marginBottom:'2px',
                   background: selectedId===null ? '#fef2f4' : (addParent===null ? '#ecfdf5' : 'transparent'),
                   color:      selectedId===null ? '#e8587a' : '#374151',
                   fontWeight: selectedId===null ? 700 : 500, fontSize:'13px',
                   border:     selectedId===null ? '1px solid #fecdd3' : (addParent===null ? '1px solid #a7f3d0' : '1px solid transparent')}"
          @mouseover="onRootHover($event)"
          @mouseout="onRootLeave($event)">
          <span style="margin-right:8px;">📁</span>(루트)
          <span style="font-size:10px;color:#6b7280;background:#fff;padding:1px 8px;border-radius:10px;border:1px solid #e5e7eb;margin-left:8px;font-weight:500;">{{ cfTree.count }}</span>
        </div>
        <path-pick-tree-node :node="cfTree" :expanded="expanded" :selected="selectedId" :add-parent="addParent"
          :editing-id="editingId" :edit-label="editLabel"
          :on-toggle="toggle" :on-select="select" :on-set-parent="setAddParent" :on-confirm="confirm"
          :on-start-edit="startEdit" :on-save-edit="saveEdit" :on-cancel-edit="cancelEdit"
          :on-update-label="(v) => editLabel = v" :on-delete="deleteNode" :depth="0" />
      </div>

      <!-- 추가 입력 -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:#6b7280;margin-bottom:8px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#10b981;color:#fff;font-size:11px;font-weight:700;">+</span>
          <span style="font-weight:600;">하위 추가 위치:</span>
          <span style="background:#ecfdf5;color:#059669;padding:2px 10px;border-radius:6px;font-weight:700;font-size:11px;">
            {{ addParent == null ? '(루트)' : (labelOf(addParent) || ('#'+addParent)) }}
          </span>
        </div>
        <div style="display:flex;gap:6px;">
          <input class="form-control" v-model="addLabel" placeholder="새 경로명 입력 후 Enter" style="flex:1;height:34px;font-size:12.5px;" @keyup.enter="doAdd" />
          <button @click="doAdd"
            style="padding:0 16px;font-size:12px;font-weight:700;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;"
            @mouseover="onAddHover($event)"
            @mouseout="onAddLeave($event)">+ 추가</button>
        </div>
      </div>

      <!-- 액션 -->
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button @click="$emit('close')"
          style="padding:9px 20px;font-size:12.5px;font-weight:600;background:#fff;color:#6b7280;border:1px solid #d1d5db;border-radius:7px;cursor:pointer;">취소</button>
        <button @click="confirm"
          style="padding:9px 22px;font-size:12.5px;font-weight:700;background:linear-gradient(135deg,#e8587a,#d14165);color:#fff;border:none;border-radius:7px;cursor:pointer;box-shadow:0 2px 6px rgba(232,88,122,.25);">✓ 선택</button>
      </div>
    </div>
  </div>
</div>`,
};

window.PathPickTreeNode = {
  name: 'PathPickTreeNode',
  props: ['node', 'expanded', 'selected', 'addParent', 'editingId', 'editLabel',
          'onToggle', 'onSelect', 'onSetParent', 'onConfirm',
          'onStartEdit', 'onSaveEdit', 'onCancelEdit', 'onUpdateLabel', 'onDelete', 'depth', 'reloadTrigger'],
  methods: {
    onPathNodeClick(ch) {
      if (this.editingId === ch.pathId) return;
      this.onSelect && this.onSelect(ch.pathId);
      this.onSetParent && this.onSetParent(ch.pathId);
    },
    onPathNodeDblClick(ch) {
      if (this.editingId === ch.pathId) return;
      this.onSelect && this.onSelect(ch.pathId);
      if (this.onConfirm) this.onConfirm();
    },
    onPathNodeHover(ch, evt) {
      if (this.selected !== ch.pathId && evt && evt.currentTarget) {
        evt.currentTarget.style.background = '#f3f4f6';
      }
    },
    onPathNodeLeave(ch, evt) {
      if (this.selected !== ch.pathId && evt && evt.currentTarget) {
        evt.currentTarget.style.background = (this.addParent === ch.pathId ? '#ecfdf5' : 'transparent');
      }
    },
  },
  template: /* html */`
<div v-if="(node.children||[]).length > 0" style="position:relative;">
  <div v-for="(ch, ci) in node.children" :key="ch.pathId" style="position:relative;">
    <!-- 노드 행 -->
    <div @click="onPathNodeClick(ch)" @dblclick="onPathNodeDblClick(ch)"
      :style="{position:'relative',display:'flex',alignItems:'center',padding:'4px 8px 4px 0',cursor: editingId===ch.pathId ? 'default' : 'pointer',transition:'background .12s',
               paddingLeft: (depth*20 + 8) + 'px',
               background: selected===ch.pathId ? '#fef2f4' : (addParent===ch.pathId ? '#ecfdf5' : 'transparent'),
               color:      selected===ch.pathId ? '#e8587a' : '#374151',
               fontWeight: selected===ch.pathId ? 700 : 500, fontSize:'13px',
               borderLeft: selected===ch.pathId ? '3px solid #e8587a' : '3px solid transparent'}"
      @mouseover="onPathNodeHover(ch, $event)"
      @mouseout="onPathNodeLeave(ch, $event)">

      <span :style="{position:'absolute',left:(depth*20 + 11)+'px',top:'50%',width:'10px',height:'1px',borderTop:'1px dotted #cbd5e1',pointerEvents:'none'}"></span>

      <span v-if="(ch.children||[]).length>0" @click.stop="onToggle(ch.pathId)"
        style="position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:1px solid #94a3b8;background:#fff;font-size:10px;line-height:1;color:#475569;cursor:pointer;user-select:none;flex-shrink:0;font-family:monospace;font-weight:700;border-radius:2px;">{{ expanded.has(ch.pathId) ? '−' : '+' }}</span>
      <span v-else style="display:inline-block;width:16px;height:16px;flex-shrink:0;"></span>

      <span style="margin:0 6px 0 4px;font-size:13px;flex-shrink:0;">{{ (ch.children||[]).length>0 ? (expanded.has(ch.pathId) ? '📂' : '📁') : '📄' }}</span>

      <!-- 인라인 수정 모드 -->
      <template v-if="editingId === ch.pathId">
        <input type="text" :value="editLabel" @input="onUpdateLabel($event.target.value)"
          @keyup.enter="onSaveEdit" @keyup.esc="onCancelEdit" @click.stop
          style="flex:1;padding:3px 8px;font-size:12px;border:1px solid #6366f1;border-radius:4px;outline:none;" />
        <button @click.stop="onSaveEdit" title="저장"
          style="margin-left:4px;width:22px;height:22px;border:none;background:#10b981;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;">✓</button>
        <button @click.stop="onCancelEdit" title="취소"
          style="margin-left:2px;width:22px;height:22px;border:none;background:#9ca3af;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;">✕</button>
      </template>
      <template v-else>
        <span style="flex:1;">{{ ch.pathLabel }}</span>
        <span v-if="ch.count>0" style="font-size:10px;color:#6b7280;background:#fff;padding:1px 7px;border-radius:10px;border:1px solid #e5e7eb;font-weight:500;margin-right:4px;">{{ ch.count }}</span>
        <!-- 사용자 추가 항목만 수정/삭제 노출 -->
        <template v-if="ch.userAdded">
          <button @click.stop="onStartEdit(ch)" title="수정"
            style="width:22px;height:22px;border:1px solid #c7d2fe;background:#eef2ff;color:#4f46e5;border-radius:4px;cursor:pointer;font-size:10px;margin-right:2px;">✏</button>
          <button @click.stop="onDelete(ch)" title="삭제"
            :disabled="(ch.children||[]).length>0"
            :style="{width:'22px',height:'22px',border:'1px solid '+((ch.children||[]).length>0?'#e5e7eb':'#fecaca'),background:(ch.children||[]).length>0?'#f3f4f6':'#fee2e2',color:(ch.children||[]).length>0?'#9ca3af':'#dc2626',borderRadius:'4px',cursor:(ch.children||[]).length>0?'not-allowed':'pointer',fontSize:'10px',marginRight:'4px'}">🗑</button>
        </template>
      </template>
    </div>

    <div v-if="expanded.has(ch.pathId) && (ch.children||[]).length>0"
      :style="{position:'relative'}">
      <span :style="{position:'absolute',left:(depth*20 + 16)+'px',top:'0',bottom: (ci===node.children.length-1) ? '50%' : '0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}"></span>
      <path-pick-tree-node :node="ch" :expanded="expanded" :selected="selected" :add-parent="addParent"
        :editing-id="editingId" :edit-label="editLabel"
        :on-toggle="onToggle" :on-select="onSelect" :on-set-parent="onSetParent" :on-confirm="onConfirm"
        :on-start-edit="onStartEdit" :on-save-edit="onSaveEdit" :on-cancel-edit="onCancelEdit"
        :on-update-label="onUpdateLabel" :on-delete="onDelete" :depth="depth+1" />
    </div>

    <span v-if="depth > 0 && ci < node.children.length - 1"
      :style="{position:'absolute',left:(depth*20 + 16 - 20)+'px',top:'0',bottom:'0',width:'1px',borderLeft:'1px dotted #cbd5e1',pointerEvents:'none'}"></span>
  </div>
</div>`,
};

/* ─────────────────────────────────────────────────────────────
   BizPickModal — 사업자 선택 (sy_biz)
───────────────────────────────────────────────────────────── */
window.BizPickModal = {
  name: 'BizPickModal',
  props: ['value', 'title', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ kw: '', type: '' });
    const searchParamOrg = reactive({ kw: '', type: '' });
    const bizs = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syVendor.getPage({ pageNo: 1, pageSize: 10000 }, '판매자관리', '목록조회');
        bizs.splice(0, bizs.length, ...(res.data?.data?.list || []));
      } catch (_) {}
    };
    const onSearch = () => { handleSearchList(); };
    const onReset = () => { Object.assign(searchParam, searchParamOrg); handleSearchList(); };
    Vue.onMounted(() => { handleSearchList(); });
    Vue.watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];
    const vtLabel = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd) || [,cd])[1];
    const vtBadge = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');

    /* 좌측 표시경로 트리 (sy_biz) */
    const selectedPathId = ref(null);
    const expanded = reactive(new Set([null]));
    const cfTree = computed(() => boUtil.buildPathTree('sy_biz'));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedPathId.value = id; };
    Vue.onMounted(() => {
      const initSet = coUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });
    const cfAllowedPathIds = computed(() => selectedPathId.value == null ? null : boUtil.getPathDescendants('sy_biz', selectedPathId.value));

    const cfFiltered = computed(() => bizs.filter(b => {
      const k = searchParam.kw.trim().toLowerCase();
      if (k && !(b.bizNo||'').includes(k) && !(b.bizNm||'').toLowerCase().includes(k) && !(b.ceoNm||'').toLowerCase().includes(k)) return false;
      if (searchParam.type && b.vendorTypeCd !== searchParam.type) return false;
      if (cfAllowedPathIds.value && !cfAllowedPathIds.value.has(b.pathId)) return false;
      return true;
    }));
    const pickAndClose = (b) => { emit('select', b); emit('close'); };
    return { searchParam, searchParamOrg, VENDOR_TYPES, vtLabel, vtBadge, cfFiltered, pickAndClose,
             selectedPathId, expanded, cfTree, toggleNode, selectNode, onSearch, onReset };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:820px;padding:0;overflow:hidden;border-radius:14px;">
    <div style="background:#fff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#fff0f4;color:#e8587a;font-size:16px;">🏢</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;">{{ title || '사업자 선택' }}</div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">sy_biz</div>
        </div>
        <span style="color:#9ca3af;cursor:pointer;font-size:20px;" @click="$emit('close')">✕</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;">
        <input class="form-control" v-model="searchParam.kw" placeholder="사업자번호 / 상호 / 대표자 검색" style="flex:1;height:32px;font-size:12px;" @keyup.enter="onSearch" />
        <select class="form-control" v-model="searchParam.type" style="width:140px;height:32px;font-size:12px;">
          <option value="">업체유형 전체</option>
          <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <div style="background:#fafbfc;display:grid;grid-template-columns:200px 1fr;max-height:50vh;">
      <!-- 좌측 표시경로 트리 -->
      <div style="border-right:1px solid #eef0f3;background:#fff;overflow:auto;padding:8px;">
        <div style="font-size:11px;font-weight:700;color:#666;margin-bottom:6px;padding:0 4px;">📂 표시경로</div>
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="selectedPathId"
          :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
      <!-- 우측 사업자 목록 -->
      <div style="overflow:auto;">
        <table class="bo-table" style="background:#fff;">
          <thead><tr>
            <th>업체유형</th><th>사업자번호</th><th>상호</th><th>대표자</th><th></th>
          </tr></thead>
          <tbody>
            <tr v-if="cfFiltered.length===0"><td colspan="5" style="text-align:center;color:#999;padding:30px;">검색 결과가 없습니다.</td></tr>
            <tr v-for="b in cfFiltered" :key="b.bizId" @dblclick="pickAndClose(b)" style="cursor:pointer;">
              <td><span class="badge" :class="vtBadge(b.vendorTypeCd)" style="font-size:10px;">{{ vtLabel(b.vendorTypeCd) }}</span></td>
              <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;">{{ b.bizNo }}</code></td>
              <td style="font-weight:600;">{{ b.bizNm }}</td>
              <td>{{ b.ceoNm }}</td>
              <td style="text-align:right;"><button class="btn btn-primary btn-xs" @click="pickAndClose(b)">선택</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};

/* ─────────────────────────────────────────────────────────────
   SimpleUserPickModal — 단일 사용자 선택 (sy_user / boUsers)
───────────────────────────────────────────────────────────── */
window.SimpleUserPickModal = {
  name: 'SimpleUserPickModal',
  props: ['title', 'excludeIds', 'reloadTrigger'],
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, reactive, computed } = Vue;
    const searchParam = reactive({ kw: '' });
    const boUsers = reactive([]);
    const handleSearchList = async () => {
      try {
        const res = await boApiSvc.syUser.getPage({ pageNo: 1, pageSize: 1000 }, '사용자관리', '목록조회');
        boUsers.splice(0, boUsers.length, ...(res.data?.data?.list || []));
      } catch (_) {}
    };
    const onSearch = () => { handleSearchList(); };
    const onReset = () => { searchParam.kw = ''; handleSearchList(); };
    Vue.onMounted(() => { handleSearchList(); });
    Vue.watch(() => props.reloadTrigger, () => { if (props.reloadTrigger) handleSearchList(); });
    const cfExcl = computed(() => new Set(props.excludeIds || []));
    const cfFiltered = computed(() => boUsers.filter(u => {
      if (cfExcl.value.has(u.boUserId)) return false;
      const k = searchParam.kw.trim().toLowerCase();
      if (k && !(u.name||'').toLowerCase().includes(k) && !(u.loginId||'').toLowerCase().includes(k) && !(u.email||'').toLowerCase().includes(k)) return false;
      return true;
    }));
    const pick = (u) => { emit('select', u); emit('close'); };
    return { searchParam, cfFiltered, pick, onSearch, onReset };
  },
  template: /* html */`
<div class="modal-overlay" @click.self="$emit('close')">
  <div class="modal-box" style="max-width:600px;padding:0;overflow:hidden;border-radius:14px;">
    <div style="background:#fff;border-bottom:1px solid #eef0f3;padding:18px 22px 14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#eef2ff;color:#6366f1;font-size:16px;">👤</span>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#1f2937;">{{ title || '사용자 선택' }}</div>
          <div style="font-size:10.5px;color:#9ca3af;font-family:monospace;margin-top:1px;">sy_user</div>
        </div>
        <span style="color:#9ca3af;cursor:pointer;font-size:20px;" @click="$emit('close')">✕</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;">
        <input class="form-control" v-model="searchParam.kw" placeholder="이름 / 로그인ID / 이메일 검색" style="flex:1;height:32px;font-size:12px;" @keyup.enter="onSearch" />
        <button class="btn btn-primary btn-sm" @click="onSearch">조회</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
    <div style="background:#fafbfc;max-height:50vh;overflow:auto;">
      <table class="bo-table" style="background:#fff;">
        <thead><tr><th>이름</th><th>로그인ID</th><th>이메일</th><th>부서</th><th></th></tr></thead>
        <tbody>
          <tr v-if="cfFiltered.length===0"><td colspan="5" style="text-align:center;color:#999;padding:30px;">결과가 없습니다.</td></tr>
          <tr v-for="u in cfFiltered" :key="u.boUserId" @dblclick="pick(u)" style="cursor:pointer;">
            <td style="font-weight:600;">{{ u.name }}</td>
            <td><code style="font-size:11px;color:#2563eb;">{{ u.loginId }}</code></td>
            <td style="font-size:11.5px;color:#0369a1;">{{ u.email }}</td>
            <td style="font-size:11.5px;color:#666;">{{ u.dept }}</td>
            <td style="text-align:right;"><button class="btn btn-primary btn-xs" @click="pick(u)">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="padding:14px 22px;display:flex;justify-content:flex-end;background:#fff;border-top:1px solid #eef0f3;">
      <button class="btn btn-secondary" @click="$emit('close')">취소</button>
    </div>
  </div>
</div>`,
};
