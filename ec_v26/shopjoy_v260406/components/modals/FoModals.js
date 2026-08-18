/* ShopJoy – components/modals/FoModals.js
   FO(Front Office, 사용자 페이스) 전용 모달 모음.

   ───────────────────────────────────────────────────────────────────────
   정의된 컴포넌트 (4개) — 태그는 kebab-case (예: <order-detail-modal>)

   [상세 보기 — FO 디자인 토큰 사용 (var(--bg-card), var(--text-primary) 등)]
     OrderDetailModal  — 주문 상세   (MyOrder / MyClaim / MyCache)
     ProductModal      — 상품 상세   (Home01~03 빠른보기 / MyOrder / MyClaim)
     CustomerModal     — 주문자 정보 (MyOrder / MyClaim)

   [기타]
     FoAddrSearchModal — 주소 검색 (Login / Order / foAppHeader). 카카오 우편번호 래퍼.
   ───────────────────────────────────────────────────────────────────────

   ※ 정책 (2026-05-21):
     - FO·BO 모달은 분리. 본 파일은 FO 전용.
     - BO 모달은 components/modals/BoModals.js 에서 관리.
     - 선택(Pick) 팝업은 공통팝업 <fo-cm-popup-modal> 이 표준 — 본 파일에 새로 만들지 않는다.
       "본인 것만" 이 필요한 경우도 cm_popup_item.session_cond_field 로 해결한다
       (2026-07-26 OrderPickModal 249줄 삭제 → myMemberOrder 팝업으로 대체).
     - 본 파일의 모달은 FO CSS 변수(--bg-card / --text-primary / --blue 등)에
       의존하므로 BO 환경(adminGlobalStyle*.css)에서는 디자인 깨짐. BO에서는 호출 금지.

   reloadTrigger props 표준은 BaseModals.js 와 동일 (외부 신호로 재조회 시 ++ 증가).
*/

/* ── 주문 상세 모달 ──────────────────────────────────
   Props: show (Boolean), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.OrderDetailModal = {
  name: 'OrderDetailModal',
  inheritAttrs: false,
  props: {
    show:          { type: Boolean,   default: false },                   // 모달 표시 여부
    order:         { type: Object,    default: () => ({}) },              // 주문 정보
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { reactive, computed } = Vue;
    const uiState = reactive({ loading: false, error: '' });
    const codes = reactive({});

    const cfSiteNm = computed(() => boUtil.bofGetSiteNm());

    /* fnStatusColor — 상태별 색상 */

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ OrderDetailModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ OrderDetailModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const fnStatusColor = (s) => ({
      '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
      '배송준비중': '#f59e0b', '배송중': '#f97316',
      '배송완료': '#22c55e', '완료': '#6b7280', '취소됨': '#9ca3af',
    })[s] || '#9ca3af';

    /* fnStatusLabel — 상태 라벨 */
    const fnStatusLabel = (s) => s === '완료' ? '구매확정' : s;
    return {
      uiState, codes, cfSiteNm,                // 상태 / computed
      handleBtnAction, handleSelectAction,     // dispatch
      fnStatusColor, fnStatusLabel,            // 헬퍼
    };
  },
  template: /* html */ `
<fo-modal :show="show" max-width="520px" max-height="90vh" box-pad="0" :z-index="400" @close="handleBtnAction('modal-close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;height:100%;"
    role="dialog" aria-modal="true">
    <!-- 헤더 -->
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
          📦 주문 상세
          <span style="font-size:11px;color:#2563eb;font-weight:500;margin-left:8px;">
            {{ cfSiteNm }}
          </span>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
          {{ order && order.orderId }}
        </div>
      </div>
      <button type="button" @click="handleBtnAction('modal-close')" aria-label="닫기"
        style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">
        ✕
      </button>
    </div>
    <!-- 콘텐츠 -->
    <div v-if="order" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px;">
      <!-- 주문일 / 상태 -->
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.82rem;color:var(--text-muted);">
          {{ order.orderDate }}
        </span>
        <span style="font-size:0.78rem;font-weight:700;padding:4px 12px;border-radius:20px;color:#fff;"
          :style="'background:' + fnStatusColor(order.status)">
          {{ fnStatusLabel(order.status) }}
        </span>
      </div>
      <!-- 상품 목록 -->
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">
          주문 상품
        </div>
        <div v-for="(item, i) in order.orderItems" :key="i"
          style="display:flex;align-items:center;gap:10px;padding:8px 0;"
          :style="i < order.orderItems.length-1 ? 'border-bottom:1px dashed var(--border);' : ''">
          <span style="font-size:1.4rem;flex-shrink:0;">
            {{ item.emoji }}
          </span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">
              {{ item.prodNm }}
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);">
              {{ item.color }} / {{ item.size }} / {{ item.qty }}개
            </div>
            <div v-if="item.productCoupon ? (item.productCoupon.discount) : false" style="margin-top:2px;font-size:0.7rem;color:#16a34a;">
            🎟 {{ item.productCoupon.name }} -{{ Number(item.productCoupon.discount).toLocaleString() }}원
          </div>
        </div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--blue);flex-shrink:0;">
          {{ item.price.toLocaleString() }}원
        </div>
      </div>
    </div>
    <!-- 결제 정보 -->
    <div style="background:var(--bg-base);border-radius:8px;padding:12px 14px;font-size:0.82rem;display:flex;flex-direction:column;gap:6px;">
      <div v-if="order.shippingFee > 0" style="display:flex;justify-content:space-between;">
        <span style="color:var(--text-muted);">
          배송비
        </span>
        <span style="font-weight:600;color:var(--text-primary);">
          {{ order.shippingFee.toLocaleString() }}원
        </span>
      </div>
      <div v-if="order.shippingCoupon ? (Number(order.shippingCoupon.discount) > 0) : false" style="display:flex;justify-content:space-between;">
      <span style="color:var(--text-muted);">
        🚚 배송비 쿠폰
      </span>
      <span style="font-weight:700;color:var(--blue);">
        -{{ Number(order.shippingCoupon.discount).toLocaleString() }}원
      </span>
    </div>
    <div v-if="Number(order.cashPaid) > 0" style="display:flex;justify-content:space-between;">
      <span style="color:var(--text-muted);">
        💰 캐쉬 결제
      </span>
      <span style="font-weight:600;color:var(--text-primary);">
        {{ Number(order.cashPaid).toLocaleString() }}원
      </span>
    </div>
    <div v-if="Number(order.transferPaid) > 0" style="display:flex;justify-content:space-between;">
      <span style="color:var(--text-muted);">
        🏦 계좌이체
      </span>
      <span style="font-weight:600;color:var(--text-primary);">
        {{ Number(order.transferPaid).toLocaleString() }}원
      </span>
    </div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
      <span style="font-weight:700;color:var(--text-primary);">
        총 결제금액
      </span>
      <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">
        {{ order.totalPrice.toLocaleString() }}원
      </span>
    </div>
  </div>
  <!-- 택배 정보 -->
  <div v-if="order.courier ? (order.trackingNo) : false" style="display:flex;align-items:center;gap:8px;font-size:0.8rem;padding:10px 14px;background:var(--bg-base);border-radius:8px;">
  <span style="color:var(--text-muted);">
    🚚 {{ order.courier }}
  </span>
  <span style="font-weight:600;color:var(--text-primary);">
    {{ order.trackingNo }}
  </span>
</div>
</div>
<!-- 푸터 -->
<div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
  <button type="button" @click="handleBtnAction('modal-close')" class="btn btn_close"
        style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">
    닫기
  </button>
</div>
</div>
</fo-modal>
`,
};

/* ── 상품 상세 모달 ──────────────────────────────────
   Props: show (Boolean), product (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.ProductModal = {
  name: 'ProductModal',
  inheritAttrs: false,
  props: {
    show:          { type: Boolean,  default: false },          // 모달 표시 여부
    product:       { type: Object,   default: () => ({}) },     // 상품 정보
    navigate:      { type: Function, default: () => {} },       // 페이지 이동
    toggleLike:    { type: Function, default: () => {} },       // 찜 토글
    isLiked:       { type: Function, default: () => false },    // 찜 여부 확인
    addToCart:     { type: Function, default: null },           // 장바구니 추가 (미전달 시 window.foApp.addToCart 로 폴백)
    cartMode:      { type: [Boolean, String], default: true },   // 카트 영역 표시 (v-if 진위값. Home 은 Boolean, 기본 표시)
    reloadTrigger: { type: Number,   default: 0 },              // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, watch, computed, reactive } = Vue;
    const uiState = reactive({ loading: false, error: '' });
    const codes = reactive({});
    const selColor  = ref(null);
    const selSize   = ref(null);
    const qty       = ref(1);
    const inCart    = ref(false);
    const selThumb  = ref(0);
    const toastMsg  = ref('');
    const toastShow = ref(false);
    const likeShaking = ref(false);
    const cartShaking = ref(false);

    /* fnShake — 좋아요/장바구니 버튼 흔들기 이펙트 (2초) */
    const fnShake = (stateRef) => {
      stateRef.value = false;
      requestAnimationFrame(() => {
        stateRef.value = true;
        setTimeout(() => { stateRef.value = false; }, 2000);
      });
    };

    /* fnAddToCart — props.addToCart 우선, 미전달 시 window.foApp.addToCart 로 폴백 */
    const fnAddToCart = (prod, color, size, q) => {
      const fn = props.addToCart || window.foApp?.addToCart;
      if (fn) fn(prod, color, size, q);
    };

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ ProductModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-like') {
        return handleLike();
      } else if (cmd === 'modal-cart') {
        return handleCart();
      } else if (cmd === 'modal-cart-close') {
        if (handleCart()) emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-buy-now-close') {
        if (handleBuyNow(props.navigate)) emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-go-prod-view') {
        if (props.navigate) props.navigate('prodView');
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'modal-qty-dec') {
        if (qty.value > 1) qty.value--;
        return;
      } else if (cmd === 'modal-qty-inc') {
        qty.value++;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ ProductModal : handleSelectAction -> ', cmd, param);
      if (cmd === 'modal-sel-thumb') {
        selThumb.value = param;
        return;
      } else if (cmd === 'modal-sel-color') {
        selColor.value = param;
        errColor.value = false;
        selThumb.value = 0;
        return;
      } else if (cmd === 'modal-sel-size') {
        selSize.value = param;
        errSize.value = false;
        return;
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

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
      const wasLiked = props.isLiked && props.isLiked(props.product.prodId);
      props.toggleLike && props.toggleLike(props.product.prodId);
      handleFireToast(wasLiked ? '위시리스트에서 제거했습니다.' : '위시리스트에 추가했습니다.');
      fnShake(likeShaking);
    };

    /* 옵션 에러 상태 */
    const errColor = ref(false);
    const errSize  = ref(false);

    /* 옵션 필수 검증 */
    const cfNeedsColor = () => props.product?.opt1s?.length > 0;

    /* cfNeedsSize */
    const cfNeedsSize  = () => {
      const s = props.product?.opt2s;
      return s && s.length > 0 && !(s.length === 1 && s[0] === 'FREE');
    };

    /* handleValidate */
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

    /* 장바구니 추가 (검증 포함) — 실제 window.foApp.addToCart 호출 (이전에는 토스트만 띄우고 실제 담기 누락됨).
       담기 성공 토스트는 addToCart 내부(전역 showToast)가 이미 띄우므로 여기서 중복 토스트하지 않는다. */
    const handleCart = () => {
      if (!handleValidate()) return false;
      fnAddToCart(props.product, selColor.value, selSize.value, qty.value);
      inCart.value = true;
      fnShake(cartShaking);
      return true;
    };

    /* 바로구매 검증 */
    const handleBuyNow = (navigateFn) => {
      if (!handleValidate()) return false;
      navigateFn && navigateFn('order', { instantOrder: { product: props.product, color: selColor.value, size: selSize.value, qty: qty.value } });
      return true;
    };
    return {
      uiState, codes, selColor, selSize, qty, inCart, selThumb,             // 상태
      cfThumbImgs, cfRating, cfStarStr,                                      // computed
      toastMsg, toastShow, errColor, errSize,                                // UI 상태
      likeShaking, cartShaking,                                              // 흔들기 이펙트 상태
      handleBtnAction, handleSelectAction,                                   // dispatch
    };
  },
  template: /* html */ `
<fo-modal :show="show" max-width="840px" max-height="90vh" box-pad="0" :z-index="400" @close="handleBtnAction('modal-close')">
  <!-- 내부 토스트 -->
  <transition name="fade">
    <div v-if="toastShow"
      style="position:fixed;bottom:36px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 28px;border-radius:4px;font-size:0.84rem;z-index:500;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.3);pointer-events:none;">
      {{ toastMsg }}
    </div>
  </transition>
  <div style="background:#fff;border-radius:8px;width:100%;height:100%;overflow:hidden;display:flex;"
    role="dialog" aria-modal="true">
    <!-- 좌: 이미지 + 썸네일 -->
    <div v-if="product" style="flex:0 0 360px;background:#f5f5f5;display:flex;flex-direction:column;padding:28px 24px 20px;">
      <!-- 메인 이미지 -->
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:280px;">
        <img v-if="cfThumbImgs[selThumb]" :src="cfThumbImgs[selThumb]" :alt="product.prodNm"
          style="max-width:100%;max-height:300px;object-fit:contain;" />
      </div>
      <!-- 썸네일 목록 -->
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;">
        <div v-for="(img, i) in cfThumbImgs" :key="i" @click="handleSelectAction('modal-sel-thumb', i)"
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
      <button @click="handleBtnAction('modal-close')"
        style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#bbb;line-height:1;">
        ✕
      </button>
      <!-- 상품명 -->
      <h2 style="font-size:1.15rem;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-right:28px;line-height:1.4;">
        {{ product.prodNm }}
      </h2>
      <!-- 평점 -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:14px;">
        <span style="color:#f59e0b;font-size:0.88rem;letter-spacing:1px;">
          {{ cfStarStr }}
        </span>
        <span style="font-size:0.78rem;font-weight:600;color:#555;">
          {{ cfRating.score }}
        </span>
        <span style="font-size:0.75rem;color:#aaa;">
          ({{ cfRating.count }}개 리뷰)
        </span>
      </div>
      <!-- 가격 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:1.3rem;font-weight:800;color:#1a1a1a;">
          {{ product.price }}
        </span>
        <span v-if="product.originalPrice" style="font-size:0.85rem;color:#bbb;text-decoration:line-through;">
          {{ product.originalPrice.toLocaleString ? product.originalPrice.toLocaleString() + '원' : product.originalPrice }}
        </span>
        <span v-if="product.originalPrice ? (product.priceNum) : false" style="font-size:0.8rem;font-weight:700;color:#ef4444;">
        {{ Math.round((1 - product.priceNum / product.originalPrice) * 100) }}%
      </span>
    </div>
    <!-- 설명 -->
    <p style="font-size:0.84rem;color:#666;line-height:1.75;margin-bottom:16px;">
      {{ product.desc }}
    </p>
    <!-- 색상 -->
    <div v-if="product.opt1s ? (product.opt1s.length) : false" style="margin-bottom:14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:0.75rem;font-weight:600;color:#999;letter-spacing:0.5px;">
        색상
      </span>
      <span v-if="selColor" style="font-size:0.75rem;color:#555;">
        {{ selColor.name }}
      </span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button v-for="c in product.opt1s" :key="c.name" @click="handleSelectAction('modal-sel-color', c)" :style="{ width:'28px', height:'28px', borderRadius:'50%', background:c.hex, cursor:'pointer', border: selColor?.name===c.name ? '3px solid #1a1a1a' : '2px solid rgba(0,0,0,0.12)', outline: selColor?.name===c.name ? '2px solid #fff' : 'none', outlineOffset: '-4px', boxSizing:'border-box', transition:'border .15s', }" :title="c.name">
    </button>
  </div>
  <p v-if="errColor" style="margin:6px 0 0;font-size:0.75rem;color:#ef4444;">
    색상을 선택해주세요.
  </p>
</div>
<!-- 사이즈 -->
<div v-if="product.opt2s ? (product.opt2s.length ? (!(product.opt2s.length===1 ? (product.opt2s[0]==='FREE') : false)) : false) : false" style="margin-bottom:14px;">
<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
  <span :style="{ fontSize:'0.75rem', fontWeight:'600', letterSpacing:'0.5px', color: errSize ? '#ef4444' : '#999' }">
    사이즈
  </span>
  <span v-if="errSize" style="font-size:0.72rem;color:#ef4444;font-weight:500;">
    필수 선택
  </span>
</div>
<div :style="{
          display:'flex', gap:'6px', flexWrap:'wrap', padding:'8px',
          border: errSize ? '1px solid #ef4444' : '1px solid transparent',
          borderRadius:'3px', transition:'border-color .2s',
          }">
  <button v-for="s in product.opt2s" :key="s" @click="handleSelectAction('modal-sel-size', s)"
            :style="{
            padding:'5px 14px', borderRadius:'2px', cursor:'pointer', fontSize:'0.8rem',
            border: selSize===s ? '2px solid #1a1a1a' : '2px solid #ddd',
            background: selSize===s ? '#1a1a1a' : '#fff',
            color: selSize===s ? '#fff' : '#555',
            fontWeight: selSize===s ? '700' : '400', transition:'all .15s',
            }">
    {{ s }}
  </button>
</div>
</div>
<!-- 태그 -->
<div v-if="product.tags ? (product.tags.length) : false" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
<span v-for="t in product.tags" :key="t"
          style="padding:2px 10px;background:#f5f5f5;border-radius:20px;font-size:0.72rem;color:#888;">
  #{{ t }}
</span>
</div>
<!-- 수량 -->
<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding-top:4px;">
  <span style="font-size:0.75rem;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.5px;">
    수량
  </span>
  <div style="display:flex;align-items:center;border:1.5px solid #ddd;border-radius:2px;">
    <button @click="handleBtnAction('modal-qty-dec')"
            style="width:34px;height:34px;border:none;background:transparent;cursor:pointer;font-size:1.1rem;color:#555;line-height:1;">
      −
    </button>
    <span style="min-width:36px;text-align:center;font-size:0.88rem;font-weight:600;color:#1a1a1a;padding:0 4px;">
      {{ qty }}
    </span>
    <button @click="handleBtnAction('modal-qty-inc')"
            style="width:34px;height:34px;border:none;background:transparent;cursor:pointer;font-size:1.1rem;color:#555;line-height:1;">
      +
    </button>
  </div>
</div>
<!-- 하단 버튼 -->
<div style="margin-top:auto;">
  <!-- 장바구니 모드: 장바구니 추가 버튼만 -->
  <template v-if="cartMode">
    <button @click="handleBtnAction('modal-cart-close')" :class="{ 'fo-shake': cartShaking }"
            style="width:100%;padding:13px;font-size:0.9rem;font-weight:700;background:#1a1a1a;color:#fff;border:none;border-radius:2px;cursor:pointer;letter-spacing:0.3px;">
      🛒 장바구니 추가
    </button>
  </template>
  <!-- 일반 모드: 전체 버튼 -->
  <template v-else>
    <div style="display:flex;gap:8px;">
      <button class="btn-blue" @click="handleBtnAction('modal-go-prod-view')"
              style="flex:1;padding:12px;font-size:0.85rem;">
        상세보기
      </button>
      <button class="btn-outline" @click="handleBtnAction('modal-buy-now-close')"
              style="flex:1;padding:12px;font-size:0.85rem;">
        바로구매
      </button>
      <!-- 좋아요 토글 -->
      <button @click="handleBtnAction('modal-like')" :class="{ 'fo-shake': likeShaking }" :style="{ width:'44px', height:'44px', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', border: isLiked?.(product.prodId) ? '1.5px solid #ef4444' : '1.5px solid #ddd', background: isLiked?.(product.prodId) ? '#fff5f5' : '#fff', }">
      <svg width="18" height="18" viewBox="0 0 24 24" :fill="isLiked?.(product.prodId) ? '#ef4444' : 'none'" :stroke="isLiked?.(product.prodId) ? '#ef4444' : '#999'" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
      </path>
    </svg>
  </button>
  <!-- 장바구니 토글 -->
  <button @click="handleBtnAction('modal-cart')" :class="{ 'fo-shake': cartShaking }"
              :style="{
              width:'44px', height:'44px', borderRadius:'4px', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s',
              border: inCart ? '1.5px solid #1a1a1a' : '1.5px solid #ddd',
              background: inCart ? '#1a1a1a' : '#fff',
              }">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="inCart ? '#fff' : '#999'" stroke-width="2">
      <circle cx="9" cy="21" r="1">
      </circle>
      <circle cx="20" cy="21" r="1">
      </circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6">
      </path>
    </svg>
  </button>
</div>
</template>
</div>
</div>
</div>
</fo-modal>
`,
};

/* ── 주문자 정보 모달 ─────────────────────────────────
   Props: show (Boolean), user (Object | null), order (Object | null)
   Emits: close
   ─────────────────────────────────────────────────── */
window.CustomerModal = {
  name: 'CustomerModal',
  inheritAttrs: false,
  props: {
    show:          { type: Boolean,   default: false },                   // 모달 표시 여부
    user:          { type: Object,    default: () => ({}) },              // 사용자 정보
    order:         { type: Object,    default: () => ({}) },              // 주문 정보
    reloadTrigger: { type: Number,    default: 0 },                       // 재조회 트리거,
    modalName:  { type: String,   default: '' },                       // 모달 식별자
    onCallback: { type: Function, default: null },                     // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CustomerModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ CustomerModal : handleSelectAction -> ', cmd, param);
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    return { handleBtnAction, handleSelectAction };
  },
  template: /* html */ `
<fo-modal :show="show" max-width="380px" max-height="90vh" box-pad="0" :z-index="400" @close="handleBtnAction('modal-close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;height:100%;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);border:1px solid var(--border);overflow:hidden;"
    role="dialog" aria-modal="true">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
          👤
        </div>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
            주문자 정보
          </div>
          <div v-if="order" style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
            {{ order.orderId }}
          </div>
        </div>
      </div>
      <button type="button" @click="handleBtnAction('modal-close')" aria-label="닫기" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">
        ✕
      </button>
    </div>
    <div v-if="user" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;">
      <div style="background:var(--bg-base);border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">
            이름
          </span>
          <span style="font-weight:700;color:var(--text-primary);font-size:0.88rem;">
            {{ user.name }}
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">
            연락처
          </span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.88rem;">
            {{ user.phone || '-' }}
          </span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:52px;color:var(--text-muted);font-size:0.78rem;font-weight:600;">
            이메일
          </span>
          <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">
            {{ user.email || '-' }}
          </span>
        </div>
      </div>
      <div v-if="order ? (order.paymentDetails ? (order.paymentDetails.length) : false) : false" style="background:var(--bg-base);border-radius:8px;padding:14px 16px;">
      <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:8px;">
        입금 정보
      </div>
      <div v-for="(pd, i) in order.paymentDetails" :key="i"
          style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"
          :style="i>0?'border-top:1px dashed var(--border);padding-top:6px;margin-top:3px;':''">
        <span style="padding:1px 7px;border-radius:4px;font-size:0.72rem;font-weight:700;"
            :style="pd.type==='계좌이체'||pd.type==='계좌환불'?'background:#dcfce7;color:#16a34a;':pd.type==='캐쉬'?'background:#fef3c7;color:#d97706;':'background:#dbeafe;color:#1d4ed8;'">
          {{ pd.type }}
        </span>
        <span style="font-weight:600;color:var(--text-primary);font-size:0.85rem;">
          {{ pd.amount.toLocaleString() }}원
        </span>
        <span v-if="pd.account" style="color:var(--text-muted);font-size:0.78rem;">
          {{ pd.account }}
        </span>
      </div>
    </div>
  </div>
  <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
    <button type="button" @click="handleBtnAction('modal-close')" class="btn btn_close" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">
      닫기
    </button>
  </div>
</div>
</fo-modal>
`,
};

/* ── 상품 비교 모달 ─────────────────────────────────────
   Props: show (Boolean), items (Array<상품>), navigate (Function),
          removeItem (Function: prodId=>void), clearAll (Function)
   Emits: close
   상품 목록/홈 카드의 "비교" 아이콘으로 담은 상품(최대 4개, window.foApp.compareList)을
   나란히 놓고 이미지/가격/카테고리/색상/사이즈/설명을 비교하는 표.
   ─────────────────────────────────────────────────── */
window.CompareModal = {
  name: 'CompareModal',
  inheritAttrs: false,
  props: {
    show:          { type: Boolean,  default: false },          // 모달 표시 여부
    items:         { type: Array,    default: () => ([]) },     // 비교 상품 목록
    selectProd:    { type: Function, default: () => {} },       // 상품 선택 → 상세 이동
    removeItem:    { type: Function, default: () => {} },       // 비교함에서 제거
    clearAll:      { type: Function, default: () => {} },       // 비교함 비우기
    modalName:  { type: String,   default: '' },                // 모달 식별자
    onCallback: { type: Function, default: null },               // 통합 콜백
  },
  emits: ['close'],
  setup(props, { emit }) {

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ CompareModal : handleBtnAction -> ', cmd, param);
      if (cmd === 'modal-close') {
        emit('close');
        if (props.onCallback) props.onCallback(props.modalName, null, null);
        return;
      } else if (cmd === 'compare-clear') {
        props.clearAll();
        emit('close');
        return;
      } else if (cmd === 'compare-view') {
        if (props.selectProd) props.selectProd(param);
        emit('close');
        return;
      } else if (cmd === 'compare-remove') {
        return props.removeItem(param);
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* fnColorNames — opt1s(색상) 이름 나열 */
    const fnColorNames = (p) => (p.opt1s || []).map(c => c.name).join(', ') || '-';
    /* fnSizeNames — opt2s(사이즈) 나열 */
    const fnSizeNames = (p) => (p.opt2s || []).join(', ') || '-';

    return { handleBtnAction, fnColorNames, fnSizeNames };
  },
  template: /* html */ `
<fo-modal :show="show" max-width="920px" max-height="88vh" box-pad="0" :z-index="400" @close="handleBtnAction('modal-close')">
  <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;"
    role="dialog" aria-modal="true">
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.1rem;">
          ⚖️
        </span>
        <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">
          상품 비교함
        </span>
        <span style="font-size:0.78rem;color:var(--text-muted);">
          ({{ items.length }}/4)
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button v-if="items.length" type="button" @click="handleBtnAction('compare-clear')"
            style="background:none;border:none;cursor:pointer;font-size:0.8rem;color:#ef4444;font-weight:600;">
          전체 비우기
        </button>
        <button type="button" @click="handleBtnAction('modal-close')" aria-label="닫기" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">
          ✕
        </button>
      </div>
    </div>
    <!-- 비어있음 -->
    <div v-if="!items.length" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-muted);padding:40px;">
      <span style="font-size:2.4rem;">
        ⚖️
      </span>
      <span style="font-size:0.9rem;">
        비교함이 비어 있습니다.
      </span>
      <span style="font-size:0.78rem;">
        상품 카드의 ⚖️ 아이콘으로 최대 4개까지 담을 수 있어요.
      </span>
    </div>
    <!-- 비교 표 -->
    <div v-else style="flex:1;overflow:auto;padding:16px 20px;">
      <div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
        <div v-for="p in items" :key="p.prodId"
            style="border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;">
          <button type="button" @click="handleBtnAction('compare-remove', p.prodId)"
              title="비교함에서 제거"
              style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,0.06);cursor:pointer;font-size:0.78rem;color:#666;line-height:1;">
            ✕
          </button>
          <div style="height:130px;background:var(--bg-base);border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <img :src="p.image || window.NO_IMAGE" :alt="p.prodNm" style="width:100%;height:100%;object-fit:contain;" />
          </div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);line-height:1.35;min-height:2.6em;">
            {{ p.prodNm }}
          </div>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span style="font-size:0.92rem;font-weight:800;color:var(--blue);">
              {{ p.price }}
            </span>
            <span v-if="p.originalPrice" style="font-size:0.72rem;color:var(--text-muted);text-decoration:line-through;">
              {{ p.originalPrice.toLocaleString ? p.originalPrice.toLocaleString() + '원' : p.originalPrice }}
            </span>
          </div>
          <div style="font-size:0.76rem;color:var(--text-secondary);display:flex;flex-direction:column;gap:4px;border-top:1px dashed var(--border);padding-top:8px;">
            <div>
              <span style="color:var(--text-muted);">
                색상
              </span>
              : {{ fnColorNames(p) }}
            </div>
            <div>
              <span style="color:var(--text-muted);">
                사이즈
              </span>
              : {{ fnSizeNames(p) }}
            </div>
          </div>
          <p style="font-size:0.75rem;color:var(--text-secondary);line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1;">
            {{ p.desc }}
          </p>
          <button class="btn-outline" style="width:100%;padding:7px;font-size:0.78rem;" @click="handleBtnAction('compare-view', p)">
            상세보기
          </button>
        </div>
      </div>
    </div>
  </div>
</fo-modal>
`,
};

/* ── FoAddrSearchModal — 카카오 우편번호 검색 (인라인 레이어) ───────────────
   목적: daum.Postcode({...}).open() 이 뜨는 별도 브라우저 팝업창을 화면 내
         모달로 대체 — 팝업 위치가 화면 밖/엉뚱한 곳에 뜨는 문제 해결.
         daum.Postcode 는 .open() 대신 .embed(엘리먼트) 사용 시 그 엘리먼트
         안에 검색 UI(iframe)를 레이어로 그려준다 — 별도 창이 뜨지 않음.

   props:
     modalName  {String}   - 콜백 식별자 (기본: 'addr-search')
     onCallback {Function} - 콜백(modalName, null, {zonecode,address}|null)

   사용 (호출부):
     const addrSearchModal = reactive({ show: false });
     const openAddrSearch  = () => { addrSearchModal.show = true; };
     const onAddrPicked = (data) => {
       addrSearchModal.show = false;
       if (!data) return;
       sf.postcode = data.zonecode; sf.address = data.address;
     };
     <fo-addr-search-modal v-if="addrSearchModal.show" @select="onAddrPicked" @close="addrSearchModal.show=false" />
   ─────────────────────────────────────────────────────────────────────── */
window.FoAddrSearchModal = {
  name: 'FoAddrSearchModal',
  inheritAttrs: false,
  props: {
    modalName:  { type: String,   default: 'addr-search' },
    onCallback: { type: Function, default: null },
  },
  emits: ['select', 'close'],
  setup(props, { emit }) {
    const { ref, onMounted } = Vue;
    const layerRef = ref(null);

    const onPicked = (data) => {
      if (props.onCallback) props.onCallback(props.modalName, null, { zonecode: data.zonecode, address: data.roadAddress || data.jibunAddress });
      else emit('select', { zonecode: data.zonecode, address: data.roadAddress || data.jibunAddress });
    };
    const onClose = () => {
      if (props.onCallback) props.onCallback(props.modalName, null, null);
      else emit('close');
    };

    /* fnEmbed — 레이어 엘리먼트에 카카오 검색 UI 임베드 (팝업 대체) */
    const fnEmbed = () => {
      if (!layerRef.value) return;
      new window.daum.Postcode({ oncomplete: onPicked }).embed(layerRef.value);
    };
    onMounted(() => {
      if (window.daum && window.daum.Postcode) { fnEmbed(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = fnEmbed;
      document.head.appendChild(s);
    });

    return { layerRef, onClose };
  },
  template: `
<fo-modal :show="true" title="주소 검색" width="520px" height="540px" body-pad="0" @close="onClose">
  <template #header-extra>
    <span style="font-size:11px;color:#bbb;">https://postcode.map.kakao.com/search</span>
  </template>
  <div ref="layerRef" style="width:100%;height:100%;overflow:hidden;"></div>
</fo-modal>
`,
};
