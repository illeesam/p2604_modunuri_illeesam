/* ShopJoy - My 주문 페이지 (#page=myOrder) */
window.MyOrder = {
  name: 'MyOrder',
  props: ['navigate', 'config', 'cart', 'cartCount', 'showToast', 'showConfirm', 'removeFromCart', 'updateCartQty'],
  setup(props) {
    const { ref, reactive, computed, onMounted } = Vue;
    const myStore = window.useFrontMyStore();
    const { orders, claimsByOrderId, coupons } = Pinia.storeToRefs(myStore);

    /* ── 로컬 페이저 ── */
    const orderPager = reactive({ page: 1, size: 50 });
    const paginate = myStore.paginate;

    /* ── 도움말 모달 ── */
    const flowHelpOpen = ref(false);
    const helpTab = ref('order');

    /* ── 배송조회 ── */
    const COURIER_URLS = {
      'CJ대한통운': no => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
      '롯데택배':   no => `https://www.lotteglogis.com/open/tracking?invno=${no}`,
      '한진택배':   no => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
    };
    const openTracking = (courier, trackingNo) => {
      const fn = COURIER_URLS[courier];
      if (!fn) { props.showToast('택배사 정보를 찾을 수 없습니다.', 'error'); return; }
      window.open(fn(trackingNo), '_blank', 'width=960,height=700,scrollbars=yes,resizable=yes');
    };
    const openTracking2 = (courier, trackingNo) => {
      const fn = COURIER_URLS[courier];
      if (fn) window.open(fn(trackingNo), '_blank', 'width=960,height=700,scrollbars=yes');
    };

    const showOrderPayBreakdown = o =>
      (o.shippingFee != null && o.shippingFee > 0) ||
      (o.shippingCoupon && Number(o.shippingCoupon.discount) > 0) ||
      Number(o.cashPaid) > 0 ||
      Number(o.transferPaid) > 0;

    /* ── 주문 액션 ── */
    const cancelOrder = async orderId => {
      const ok = await props.showConfirm('주문 취소', '이 주문을 취소하시겠습니까?', 'warning');
      if (!ok) return;
      myStore.setOrderStatus(orderId, '취소됨');
      props.showToast('주문이 취소되었습니다.', 'success');
    };
    const confirmPurchase = async orderId => {
      const ok = await props.showConfirm('구매확정', '구매를 확정하시겠습니까?\n확정 후에는 교환/반품 신청이 어렵습니다.', 'warning');
      if (!ok) return;
      myStore.setOrderStatus(orderId, '완료');
      props.showToast('구매가 확정되었습니다. 감사합니다! 🎉', 'success');
    };

    /* ── 클레임 신청 모달 ── */
    const CLAIM_SHIPPING_FEE = 5000;
    const CLAIM_FREE_REASONS = ['상품불량', '오배송'];
    const EXCHANGE_REASONS = ['사이즈 불일치', '색상 변경', '상품불량', '오배송', '단순변심'];
    const RETURN_REASONS  = ['단순변심', '사이즈 불일치', '색상 상이', '상품불량', '오배송'];
    const claimModal = reactive({
      show: false, type: '', orderId: '', order: null,
      reason: '', reasonDetail: '', exchangeSize: '', exchangeColor: '',
      selectedCouponId: null, exchangeItemIdx: 0,
    });
    const claimShippingFee = computed(() =>
      CLAIM_FREE_REASONS.includes(claimModal.reason) ? 0 : CLAIM_SHIPPING_FEE
    );
    const applicableCoupons = computed(() =>
      coupons.value.filter(c => !c.used && (
        c.discountType === 'shipping' ||
        (c.discountType === 'amount' && c.discountValue >= claimShippingFee.value)
      ))
    );
    const claimSelectedCoupon = computed(() =>
      coupons.value.find(c => c.couponId === claimModal.selectedCouponId) || null
    );
    const claimFinalFee = computed(() => {
      const fee = claimShippingFee.value;
      if (!fee || !claimSelectedCoupon.value) return fee;
      const c = claimSelectedCoupon.value;
      if (c.discountType === 'shipping') return 0;
      if (c.discountType === 'amount') return Math.max(0, fee - c.discountValue);
      return fee;
    });
    const claimModalProduct = computed(() => {
      if (!claimModal.order) return null;
      const name = claimModal.order.items[claimModal.exchangeItemIdx]?.prodNm;
      return props.config.products.find(p => p.prodNm === name) || null;
    });
    const openClaimModal = (orderId, type) => {
      claimModal.show = true; claimModal.type = type; claimModal.orderId = orderId;
      claimModal.order = orders.value.find(x => x.orderId === orderId) || null;
      claimModal.reason = ''; claimModal.reasonDetail = '';
      claimModal.exchangeSize = ''; claimModal.exchangeColor = '';
      claimModal.selectedCouponId = null; claimModal.exchangeItemIdx = 0;
      if (!coupons.value.length) myStore.loadCoupons();
    };
    const submitClaimModal = () => {
      if (!claimModal.reason) { props.showToast('신청 사유를 선택해주세요.', 'error'); return; }
      if (claimModal.type === 'exchange') {
        if (!claimModal.exchangeSize && !claimModal.exchangeColor) {
          props.showToast('교환할 사이즈 또는 색상을 선택해주세요.', 'error'); return;
        }
      }
      if (claimSelectedCoupon.value) claimSelectedCoupon.value.used = true;
      myStore.setOrderStatus(claimModal.orderId, claimModal.type === 'exchange' ? '교환요청' : '반품요청');
      const label = claimModal.type === 'exchange' ? '교환' : '반품';
      claimModal.show = false;
      props.showToast(label + ' 신청이 완료되었습니다. 곧 연락드리겠습니다.', 'success');
    };

    /* ── 공유 모달 ── */
    const authUser = computed(() => window.frontAuth.state.user);
    const findProduct = name => props.config.products.find(p => p.prodNm === name) || null;
    const openProductModal = name => {
      const p = findProduct(name);
      if (p) { myStore.productModal.product = p; myStore.productModal.show = true; }
    };
    const openCustomerModal = order => {
      myStore.customerModal.user = authUser.value;
      myStore.customerModal.order = order || null;
      myStore.customerModal.show = true;
    };

    /* ── 리뷰 ── */
    const reviews = reactive({});
    const reviewModal = reactive({ show: false, orderId: '', itemIdx: 0, item: null, rating: 5, text: '', isEdit: false, files: [] });
    const onReviewFileChange = (e) => {
      const selected = Array.from(e.target.files || []);
      reviewModal.files = [...reviewModal.files, ...selected].slice(0, 5);
      e.target.value = '';
    };
    const removeReviewFile = (idx) => { reviewModal.files.splice(idx, 1); };
    const openReviewModal = (orderId, itemIdx, item) => {
      const key = `${orderId}_${itemIdx}`;
      const existing = reviews[key];
      reviewModal.show = true; reviewModal.orderId = orderId; reviewModal.itemIdx = itemIdx;
      reviewModal.item = item; reviewModal.rating = existing ? existing.rating : 5;
      reviewModal.text = existing ? existing.text : ''; reviewModal.isEdit = !!existing;
      reviewModal.files = existing ? (existing.files || []) : [];
    };
    const submitReview = () => {
      if (!reviewModal.text.trim()) { props.showToast('리뷰 내용을 입력해주세요.', 'error'); return; }
      const key = `${reviewModal.orderId}_${reviewModal.itemIdx}`;
      reviews[key] = { rating: reviewModal.rating, text: reviewModal.text, date: new Date().toISOString().slice(0, 10), files: reviewModal.files.map(f => f.name) };
      const order = orders.value.find(o => o.orderId === reviewModal.orderId);
      if (order && order.status === '배송완료') {
        const allReviewed = order.items.every((_, idx) => reviews[`${reviewModal.orderId}_${idx}`]);
        if (allReviewed) myStore.setOrderStatus(reviewModal.orderId, '구매확정');
      }
      reviewModal.show = false;
      props.showToast(reviewModal.isEdit ? '리뷰가 수정되었습니다.' : '리뷰가 등록되었습니다! 감사합니다 😊', 'success');
    };
    const getReview = (orderId, itemIdx) => reviews[`${orderId}_${itemIdx}`] || null;

    const { inRange, onDateSearch } = window.myDateFilterHelper();
    const { computed: _c } = Vue;
    const flowStatusFilter = reactive([]);
    const toggleFlowStatus = (status) => {
      const idx = flowStatusFilter.indexOf(status);
      if (idx === -1) flowStatusFilter.push(status);
      else flowStatusFilter.splice(idx, 1);
    };
    const dateFilteredOrders = _c(() => orders.value
      .filter(o => inRange(o.orderDate))
      .filter(o => !flowStatusFilter.length || flowStatusFilter.includes(o.status))
    );

    onMounted(async () => {
      await myStore.loadOrders();
      myStore.loadClaims();
      myStore.loadCoupons();
    });

    return {
      myStore, orders, claimsByOrderId, dateFilteredOrders, onDateSearch,
      orderPager, paginate,
      flowStatusFilter, toggleFlowStatus,
      flowHelpOpen, helpTab,
      openTracking, openTracking2, showOrderPayBreakdown,
      cancelOrder, confirmPurchase,
      EXCHANGE_REASONS, RETURN_REASONS,
      claimModal, claimShippingFee, applicableCoupons, claimSelectedCoupon, claimFinalFee, claimModalProduct,
      openClaimModal, submitClaimModal,
      authUser, findProduct, openProductModal, openCustomerModal,
      reviews, reviewModal, openReviewModal, submitReview, getReview, onReviewFileChange, removeReviewFile,
    };
  },
  template: /* html */ `
<FrontMyLayout :navigate="navigate" :cart-count="cartCount" active-page="myOrder">

  <MyDateFilter @search="onDateSearch" @reset="flowStatusFilter.splice(0)" />

  <!-- 주문 처리 흐름 (토글 필터) -->
  <div style="background:#f4f5f7;border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;flex-wrap:nowrap;">
      <span style="font-size:0.72rem;font-weight:800;padding:3px 10px;border-radius:10px;color:#fff;background:#16a34a;flex-shrink:0;">주문</span>
      <span style="font-size:0.75rem;color:var(--border);flex-shrink:0;">›</span>
      <template v-for="(step, si) in myStore.ORDER_FLOW" :key="step.status">
        <button @click="orders.filter(o=>o.status===step.status).length>0 && (toggleFlowStatus(step.status), orderPager.page=1)"
          style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;border:1.5px solid transparent;white-space:nowrap;flex-shrink:0;transition:all 0.15s;"
          :style="flowStatusFilter.includes(step.status)
            ? 'background:var(--blue);border-color:var(--blue);cursor:pointer;'
            : orders.filter(o=>o.status===step.status).length>0
              ? 'background:var(--bg-card);border-color:var(--border);cursor:pointer;'
              : 'background:transparent;border-color:transparent;opacity:0.35;cursor:default;'">
          <span style="font-size:0.7rem;font-weight:700;"
            :style="flowStatusFilter.includes(step.status) ? 'color:#fff;' : orders.filter(o=>o.status===step.status).length>0 ? 'color:var(--text-primary);' : 'color:var(--text-muted);'">
            {{ step.label || step.status }}
          </span>
          <span v-if="orders.filter(o=>o.status===step.status).length>0"
            style="font-size:0.65rem;font-weight:800;padding:0px 5px;border-radius:8px;"
            :style="flowStatusFilter.includes(step.status) ? 'background:rgba(255,255,255,0.25);color:#fff;' : 'background:var(--blue-dim);color:var(--blue);'">
            {{ orders.filter(o=>o.status===step.status).length }}
          </span>
        </button>
        <span v-if="si < myStore.ORDER_FLOW.length-1" style="font-size:0.75rem;color:var(--border);flex-shrink:0;">›</span>
      </template>
      <button v-if="flowStatusFilter.length" @click="flowStatusFilter.splice(0)"
        style="margin-left:4px;font-size:0.68rem;padding:2px 7px;border-radius:6px;border:1px solid var(--border);background:var(--bg-base);color:var(--text-secondary);cursor:pointer;flex-shrink:0;">✕</button>
      <button type="button" @click="flowHelpOpen=true" aria-label="도움말"
        style="margin-left:auto;flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg-base);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--blue);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </button>
    </div>
  </div>

  <PagerHeader :total="dateFilteredOrders.length" :pager="orderPager" />
  <div v-if="!dateFilteredOrders.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">주문 내역이 없습니다.</div>

  <div v-for="o in paginate(dateFilteredOrders, orderPager)" :key="o.orderId"
    style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;">

    <!-- 주문 헤더 -->
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:-16px -16px 12px;padding:12px 16px;border-bottom:1px solid var(--border);border-radius:var(--radius) var(--radius) 0 0;"
      style="background:linear-gradient(135deg,rgba(34,197,94,0.15) 0%,rgba(255,255,255,0.6) 60%,rgba(255,255,255,0) 100%);">
      <div>
        <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ o.orderId }}</span>
        <span style="margin-left:10px;font-size:0.78rem;color:var(--text-muted);">주문일: {{ o.orderDate }}</span>
        <button v-if="authUser" @click="openCustomerModal(o)"
          style="margin-left:8px;font-size:0.78rem;font-weight:600;color:var(--text-secondary);border:none;background:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px;">
          <span style="font-weight:400;color:var(--text-muted);text-decoration:none;">주문자: </span>{{ authUser.name }}
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        <button v-if="myStore.CANCELABLE.includes(o.status) && !(claimsByOrderId[o.orderId] && !myStore.CLAIM_DONE.includes(claimsByOrderId[o.orderId].status))"
          @click="cancelOrder(o.orderId)"
          style="padding:5px 12px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.78rem;font-weight:600;">
          주문취소
        </button>
        <template v-if="o.status==='배송완료' && !(claimsByOrderId[o.orderId] && !myStore.CLAIM_DONE.includes(claimsByOrderId[o.orderId].status))">
          <button @click="openClaimModal(o.orderId,'exchange')"
            style="padding:5px 12px;border:1.5px solid #f59e0b;border-radius:6px;background:transparent;color:#f59e0b;cursor:pointer;font-size:0.78rem;font-weight:600;white-space:nowrap;">교환신청</button>
          <button @click="openClaimModal(o.orderId,'return')"
            style="padding:5px 12px;border:1.5px solid #f97316;border-radius:6px;background:transparent;color:#f97316;cursor:pointer;font-size:0.78rem;font-weight:600;white-space:nowrap;">반품신청</button>
          <button @click="confirmPurchase(o.orderId)"
            style="padding:5px 12px;border:1.5px solid #22c55e;border-radius:6px;background:#22c55e;color:#fff;cursor:pointer;font-size:0.78rem;font-weight:700;white-space:nowrap;">구매확정</button>
        </template>
        <span style="font-size:0.78rem;font-weight:700;padding:5px 12px;border-radius:20px;color:#fff;white-space:nowrap;"
          :style="'background:' + myStore.statusColor(o.status)">{{ myStore.orderStatusLabel(o.status) }}</span>
      </div>
    </div>

    <!-- 주문 진행 프로세스 (취소됨 포함) -->
    <div v-if="myStore.ORDER_FLOW.findIndex(f=>f.status===o.status) >= 0 || o.status==='취소됨'"
      style="background:#f6f6f6;border-radius:8px;padding:10px 14px;margin-bottom:12px;overflow-x:auto;">
      <div style="display:flex;align-items:flex-start;min-width:320px;">
        <template v-for="(step, si) in myStore.ORDER_FLOW" :key="step.status">
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:48px;">
            <div :style="{
              width: o.status===step.status ? '14px' : '10px',
              height: o.status===step.status ? '14px' : '10px',
              borderRadius:'50%', marginBottom:'4px', flexShrink:0, transition:'all .15s',
              boxShadow: o.status===step.status ? '0 0 0 2px rgba(74,222,128,0.3)' : 'none',
              background: o.status==='취소됨' ? '#bbb' : (myStore.ORDER_FLOW.findIndex(f=>f.status===o.status) >= si ? '#4ade80' : '#bbb'),
            }"></div>
            <div style="font-size:0.63rem;text-align:center;line-height:1.3;white-space:nowrap;"
              :style="o.status===step.status ? 'color:#16a34a;font-weight:800;'
                : myStore.ORDER_FLOW.findIndex(f=>f.status===o.status) > si ? 'color:var(--text-secondary);font-weight:600;'
                : 'color:var(--text-muted);'">{{ step.label || step.status }}</div>
            <button v-if="step.status==='배송완료' && o.trackingNo && myStore.SHOW_COURIER.includes(o.status)"
              @click.stop="openTracking(o.courier, o.trackingNo)"
              style="margin-top:3px;padding:1px 6px;border-radius:4px;border:1px solid #86efac;background:#dcfce7;color:#15803d;cursor:pointer;font-size:0.58rem;font-weight:700;white-space:nowrap;">
              {{ (o.courier||'').replace('대한통운','').replace('택배','').replace('로지스','') }}배송
            </button>
          </div>
          <div v-if="si < myStore.ORDER_FLOW.length-1" style="height:2px;flex:1;margin-bottom:16px;flex-shrink:0;min-width:8px;"
            :style="o.status==='취소됨' ? 'background:#bbb;' : (myStore.ORDER_FLOW.findIndex(f=>f.status===o.status) > si ? 'background:#4ade80;' : 'background:#bbb;')"></div>
        </template>
      </div>
    </div>

    <!-- 클레임 정보 -->
    <template v-if="claimsByOrderId[o.orderId]">
      <div :style="'border-left:3px solid '+myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]+';background:#FAFAFA;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;'">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.8rem;font-weight:800;" :style="'color:'+myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]">
              ↩ {{ claimsByOrderId[o.orderId].type }} 신청
            </span>
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">{{ claimsByOrderId[o.orderId].claimId }}</span>
          </div>
          <span style="font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:12px;color:#fff;"
            :style="'background:'+myStore.CLAIM_STATUS_COLOR(claimsByOrderId[o.orderId].status)">
            {{ claimsByOrderId[o.orderId].status }}
          </span>
        </div>
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:8px;">
          신청일: {{ claimsByOrderId[o.orderId].requestDate }}
          <span v-if="claimsByOrderId[o.orderId].completeDate"> · 완료: {{ claimsByOrderId[o.orderId].completeDate }}</span>
        </div>
        <div style="overflow-x:auto;margin-bottom:8px;">
          <div style="display:flex;align-items:flex-start;min-width:220px;">
            <template v-for="(step, si) in myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type]" :key="step">
              <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:38px;">
                <div :style="{
                  width: claimsByOrderId[o.orderId].status===step ? '14px' : '10px',
                  height: claimsByOrderId[o.orderId].status===step ? '14px' : '10px',
                  borderRadius:'50%', marginBottom:'4px', flexShrink:0, transition:'all .15s',
                  boxShadow: claimsByOrderId[o.orderId].status===step
                    ? '0 0 0 2px '+myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]+'4d' : 'none',
                  background: myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) >= si
                    ? myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type] : '#bbb',
                }"></div>
                <div style="font-size:0.57rem;text-align:center;line-height:1.2;white-space:nowrap;"
                  :style="claimsByOrderId[o.orderId].status===step
                    ? 'color:'+myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]+';font-weight:800;'
                    : myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) > si
                      ? 'color:var(--text-secondary);' : 'color:var(--text-muted);'">{{ step }}</div>
                <button v-if="claimsByOrderId[o.orderId].trackingNo && step==='수거완료' &&
                    myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) >= myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf('수거완료')"
                  @click.stop="openTracking2(claimsByOrderId[o.orderId].courier, claimsByOrderId[o.orderId].trackingNo)"
                  style="margin-top:2px;padding:1px 4px;border-radius:3px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;cursor:pointer;font-size:0.52rem;font-weight:700;white-space:nowrap;">{{ (claimsByOrderId[o.orderId].courier||'').replace('대한통운','').replace('택배','').replace('로지스','') }}수거</button>
                <button v-if="step==='발송완료' && claimsByOrderId[o.orderId].exchangeTrackingNo && ['발송완료','교환완료'].includes(claimsByOrderId[o.orderId].status)"
                  @click.stop="openTracking2(claimsByOrderId[o.orderId].exchangeCourier, claimsByOrderId[o.orderId].exchangeTrackingNo)"
                  style="margin-top:2px;padding:1px 4px;border-radius:3px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;cursor:pointer;font-size:0.52rem;font-weight:700;white-space:nowrap;">{{ (claimsByOrderId[o.orderId].exchangeCourier||'').replace('대한통운','').replace('택배','').replace('로지스','') }}발송</button>
              </div>
              <div v-if="si < myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].length-1"
                style="height:1.5px;flex:1;margin-bottom:13px;flex-shrink:0;min-width:6px;"
                :style="myStore.CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) > si
                  ? 'background:'+myStore.CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type] : 'background:#bbb'"></div>
            </template>
          </div>
        </div>
        <div style="font-size:0.73rem;margin-bottom:5px;">
          <span style="color:var(--text-muted);">사유</span>
          <span style="margin-left:5px;font-weight:600;color:var(--text-primary);">{{ claimsByOrderId[o.orderId].reason }}</span>
          <span v-if="claimsByOrderId[o.orderId].reasonDetail" style="margin-left:4px;color:var(--text-muted);">· {{ claimsByOrderId[o.orderId].reasonDetail }}</span>
        </div>
        <div v-if="claimsByOrderId[o.orderId].refundAmount" style="font-size:0.73rem;margin-bottom:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="color:var(--text-muted);">환불 예정</span>
          <span style="font-weight:700;color:var(--text-primary);">{{ claimsByOrderId[o.orderId].refundAmount.toLocaleString() }}원</span>
          <span v-if="claimsByOrderId[o.orderId].refundMethod" style="color:var(--text-muted);">· {{ claimsByOrderId[o.orderId].refundMethod }}</span>
          <template v-if="claimsByOrderId[o.orderId].refundDetails && claimsByOrderId[o.orderId].refundDetails.length">
            <template v-for="(rd, rdi) in claimsByOrderId[o.orderId].refundDetails" :key="rdi">
              <span v-if="rd.account" style="color:var(--text-secondary);">{{ rd.account }}</span>
              <span v-if="rd.name && rd.type==='계좌환불'" style="color:var(--text-secondary);">· {{ rd.name }}</span>
              <span style="color:var(--text-muted);">{{ rd.datetime }}</span>
            </template>
          </template>
        </div>
        <div v-if="claimsByOrderId[o.orderId].type==='교환' && (claimsByOrderId[o.orderId].exchangeSize || claimsByOrderId[o.orderId].exchangeColor)"
          style="font-size:0.73rem;margin-bottom:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="color:var(--text-muted);">교환</span>
          <span v-if="claimsByOrderId[o.orderId].exchangeSize" style="font-weight:700;color:var(--text-primary);">사이즈 → {{ claimsByOrderId[o.orderId].exchangeSize }}</span>
          <span v-if="claimsByOrderId[o.orderId].exchangeColor" style="font-weight:700;color:var(--text-primary);">색상 → {{ claimsByOrderId[o.orderId].exchangeColor }}</span>
        </div>
        <div v-if="claimsByOrderId[o.orderId].courier" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          <span>수거 {{ claimsByOrderId[o.orderId].courier }}</span>
          <button v-if="claimsByOrderId[o.orderId].trackingNo" @click.stop="openTracking2(claimsByOrderId[o.orderId].courier, claimsByOrderId[o.orderId].trackingNo)"
            style="padding:1px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-card);color:var(--blue);cursor:pointer;font-size:0.65rem;font-weight:600;">
            {{ claimsByOrderId[o.orderId].trackingNo }}
          </button>
        </div>
        <div v-if="claimsByOrderId[o.orderId].exchangeCourier" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          <span>교환 발송 {{ claimsByOrderId[o.orderId].exchangeCourier }}</span>
          <button v-if="claimsByOrderId[o.orderId].exchangeTrackingNo" @click.stop="openTracking2(claimsByOrderId[o.orderId].exchangeCourier, claimsByOrderId[o.orderId].exchangeTrackingNo)"
            style="padding:1px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-card);color:var(--blue);cursor:pointer;font-size:0.65rem;font-weight:600;">
            {{ claimsByOrderId[o.orderId].exchangeTrackingNo }}
          </button>
        </div>
        <div v-if="claimsByOrderId[o.orderId].pickupDate" style="font-size:0.7rem;color:var(--text-muted);">수거 예정일 {{ claimsByOrderId[o.orderId].pickupDate }}</div>
      </div>
    </template>

    <!-- 상품 목록 -->
    <div v-for="(item, iix) in o.items" :key="iix">
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
        <span style="font-size:1.4rem;">{{ item.emoji }}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.prodNm }}</span>
            <button v-if="findProduct(item.prodNm)" @click="openProductModal(item.prodNm)"
              style="font-size:0.65rem;padding:0 5px;border:1px solid var(--border);border-radius:4px;background:var(--bg-base);color:var(--text-muted);cursor:pointer;font-weight:600;line-height:1.7;white-space:nowrap;">
              #{{ findProduct(item.prodNm).productId }}
            </button>
          </div>
            <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
          <div v-if="getReview(o.orderId, iix)" style="margin-top:3px;display:flex;align-items:center;gap:4px;">
            <span style="font-size:0.72rem;color:#f59e0b;">{{ '★'.repeat(getReview(o.orderId,iix).rating) }}{{ '☆'.repeat(5-getReview(o.orderId,iix).rating) }}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">{{ getReview(o.orderId,iix).text.slice(0,20) }}{{ getReview(o.orderId,iix).text.length>20?'…':'' }}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
          <button v-if="o.status==='배송완료' || o.status==='구매확정'"
            @click="openReviewModal(o.orderId, iix, item)"
            style="font-size:0.7rem;padding:3px 9px;border-radius:6px;border:1.5px solid;cursor:pointer;font-weight:700;white-space:nowrap;"
            :style="getReview(o.orderId,iix)
              ? 'border-color:#6366f1;background:#eef2ff;color:#6366f1;'
              : 'border-color:#22c55e;background:#f0fdf4;color:#16a34a;'">
            {{ getReview(o.orderId,iix) ? '리뷰수정' : '리뷰작성' }}
          </button>
        </div>
      </div>
      <div v-if="item.productCoupon && item.productCoupon.discount"
        style="margin:1px 0 4px 46px;padding:3px 8px;border-radius:5px;font-size:0.68rem;background:var(--bg-base);display:inline-flex;align-items:center;gap:4px;">
        <span style="color:var(--text-muted);">🎟</span>
        <span style="color:var(--text-muted);">{{ item.productCoupon.name }}</span>
        <span style="font-weight:700;color:#16a34a;">-{{ Number(item.productCoupon.discount).toLocaleString() }}원</span>
      </div>
    </div>

    <!-- 결제 내역 -->
    <div v-if="showOrderPayBreakdown(o)" style="border-top:1px dashed var(--border);margin-top:10px;padding-top:12px;display:flex;flex-direction:column;gap:6px;">
      <div v-if="o.shippingFee != null && o.shippingFee > 0" style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);">
        <span>배송비</span><span style="font-weight:600;color:var(--text-primary);">{{ o.shippingFee.toLocaleString() }}원</span>
      </div>
      <div v-if="o.shippingCoupon && Number(o.shippingCoupon.discount) > 0" style="display:flex;justify-content:space-between;font-size:0.8rem;">
        <span style="color:var(--text-secondary);">🚚 배송비 쿠폰 · <span style="color:var(--text-primary);font-weight:600;">{{ o.shippingCoupon.name }}</span></span>
        <span style="font-weight:800;color:var(--blue);">-{{ Number(o.shippingCoupon.discount).toLocaleString() }}원</span>
      </div>
      <div v-if="Number(o.cashPaid) > 0" style="display:flex;justify-content:space-between;font-size:0.8rem;">
        <span style="color:var(--text-secondary);">💰 캐쉬 결제</span>
        <span style="font-weight:700;color:var(--text-primary);">{{ Number(o.cashPaid).toLocaleString() }}원</span>
      </div>
      <div v-if="Number(o.transferPaid) > 0" style="display:flex;align-items:center;gap:10px;font-size:0.8rem;flex-wrap:wrap;">
        <span style="color:var(--text-secondary);flex-shrink:0;">🏦 계좌이체</span>
        <span v-if="o.status==='주문완료'" style="font-size:0.76rem;font-weight:700;color:#d97706;">입금확인중...</span>
        <span style="margin-left:auto;font-weight:700;color:var(--text-primary);">{{ Number(o.transferPaid).toLocaleString() }}원</span>
      </div>
    </div>

    <!-- 입금 내역 -->
    <div v-if="o.paymentDetails && o.paymentDetails.length" style="border-top:1px dashed var(--border);margin-top:8px;padding-top:8px;">
      <div style="font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:5px;">💳 입금 내역</div>
      <div v-for="(pd, pdi) in o.paymentDetails" :key="pdi"
        style="display:flex;align-items:center;gap:6px;font-size:0.72rem;padding:3px 0;flex-wrap:wrap;border-bottom:1px dashed var(--border);">
        <span style="color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ pd.datetime }}</span>
        <span style="padding:1px 7px;border-radius:4px;font-weight:700;white-space:nowrap;flex-shrink:0;"
          :style="pd.type==='계좌이체'||pd.type==='계좌환불' ? 'background:#dcfce7;color:#16a34a;'
            : pd.type==='카드결제'||pd.type==='카드취소' ? 'background:#dbeafe;color:#1d4ed8;'
            : pd.type==='캐쉬'||pd.type==='캐쉬환급' ? 'background:#fef3c7;color:#d97706;'
            : 'background:var(--bg-base);color:var(--text-secondary);'">{{ pd.type }}</span>
        <span style="font-weight:700;color:var(--text-primary);white-space:nowrap;">{{ pd.amount.toLocaleString() }}원</span>
        <span style="color:var(--text-secondary);white-space:nowrap;">{{ pd.name }}</span>
        <span v-if="pd.account" style="color:var(--text-muted);white-space:nowrap;">{{ pd.account }}</span>
      </div>
    </div>

    <!-- 합계 + 택배 -->
    <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div v-if="myStore.SHOW_COURIER.includes(o.status) && o.courier" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.8rem;color:var(--text-muted);">🚚 {{ o.courier }}</span>
          <button @click="openTracking(o.courier, o.trackingNo)"
            style="padding:3px 10px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.78rem;font-weight:700;">
            {{ o.trackingNo }}
          </button>
        </div>
        <div v-else style="flex:1;min-width:0;"></div>
        <div style="text-align:right;">
          <div v-if="showOrderPayBreakdown(o)" style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px;">총 결제금액</div>
          <span style="font-size:0.9rem;font-weight:700;color:var(--blue);">{{ o.totalPrice.toLocaleString() }}원</span>
        </div>
      </div>
    </div>
  </div>
  <Pagination :total="orders.length" :pager="orderPager" />

  <!-- ── Teleport 모달들 ── -->
  <Teleport to="body">

  <!-- 리뷰 작성/수정 모달 -->
  <div v-if="reviewModal.show" @click.self="reviewModal.show=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:1px solid var(--border);" @click.stop>
      <!-- 헤더 -->
      <div style="padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">{{ reviewModal.isEdit ? '리뷰 수정' : '리뷰 작성' }}</div>
          <div v-if="reviewModal.item" style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <span>{{ reviewModal.item.emoji }} {{ reviewModal.item.prodNm }}</span>
            <span v-if="findProduct(reviewModal.item.prodNm)"
              style="font-size:0.7rem;padding:0 5px;border:1px solid var(--border);border-radius:4px;background:var(--bg-base);color:var(--text-muted);font-weight:600;line-height:1.7;">
              #{{ findProduct(reviewModal.item.prodNm).productId }}
            </span>
            <span style="color:var(--border);">·</span>
            <span>{{ reviewModal.item.color }} / {{ reviewModal.item.size }}</span>
          </div>
        </div>
        <button @click="reviewModal.show=false" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-muted);">✕</button>
      </div>
      <!-- 별점 -->
      <div style="padding:18px 20px 0;">
        <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">별점</div>
        <div style="display:flex;gap:6px;margin-bottom:16px;">
          <button v-for="s in [1,2,3,4,5]" :key="s" @click="reviewModal.rating=s"
            style="background:none;border:none;cursor:pointer;font-size:1.8rem;padding:0;line-height:1;transition:transform 0.1s;"
            :style="s<=reviewModal.rating ? 'color:#f59e0b;' : 'color:#d1d5db;'">★</button>
          <span style="margin-left:6px;font-size:0.85rem;font-weight:700;color:var(--text-secondary);align-self:center;">
            {{ ['','매우 불만족','불만족','보통','만족','매우 만족'][reviewModal.rating] }}
          </span>
        </div>
        <!-- 리뷰 텍스트 -->
        <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">리뷰 내용</div>
        <textarea v-model="reviewModal.text" placeholder="상품에 대한 솔직한 리뷰를 작성해주세요. (10자 이상)"
          style="width:100%;min-height:110px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.85rem;resize:vertical;outline:none;box-sizing:border-box;font-family:inherit;line-height:1.6;"></textarea>
        <div style="text-align:right;font-size:0.72rem;color:var(--text-muted);margin-top:3px;">{{ reviewModal.text.length }}자</div>
        <!-- 첨부 -->
        <div style="margin-top:14px;">
          <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">
            첨부 파일 <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted);">(이미지 최대 5개)</span>
          </div>
          <label style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border:1.5px dashed var(--border);border-radius:8px;cursor:pointer;font-size:0.8rem;color:var(--text-secondary);background:var(--bg-base);">
            📎 파일 선택
            <input type="file" accept="image/*" multiple @change="onReviewFileChange" style="display:none;" />
          </label>
          <div v-if="reviewModal.files.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
            <div v-for="(f, fi) in reviewModal.files" :key="fi"
              style="display:flex;align-items:center;gap:4px;padding:3px 8px 3px 10px;background:var(--bg-base);border:1px solid var(--border);border-radius:20px;font-size:0.72rem;color:var(--text-secondary);">
              <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ f.name }}</span>
              <button @click="removeReviewFile(fi)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.85rem;padding:0;line-height:1;margin-left:2px;">×</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:14px 20px 18px;display:flex;gap:8px;justify-content:flex-end;">
        <button @click="reviewModal.show=false"
          style="padding:8px 18px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-secondary);cursor:pointer;font-size:0.85rem;font-weight:600;">취소</button>
        <button @click="submitReview"
          style="padding:8px 22px;border:none;border-radius:8px;background:#22c55e;color:#fff;cursor:pointer;font-size:0.85rem;font-weight:700;">
          {{ reviewModal.isEdit ? '수정 완료' : '리뷰 등록' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 도움말 모달 -->
  <div v-if="flowHelpOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="flowHelpOpen=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:1px solid var(--border);overflow:hidden;" @click.stop>
      <div style="padding:18px 20px 0;flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;"><span>📋</span><span style="font-size:1.05rem;font-weight:800;color:var(--text-primary);">주문 · 클레임 도움말</span></div>
          <button @click="flowHelpOpen=false" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>
        </div>
        <div style="display:flex;border-bottom:2px solid var(--border);">
          <button v-for="t in [{id:'order',label:'주문',icon:'📦'},{id:'cancel',label:'취소',icon:'🚫'},{id:'return',label:'반품',icon:'↩️'},{id:'exchange',label:'교환',icon:'🔄'}]"
            :key="t.id" @click="helpTab=t.id"
            style="padding:8px 14px;border:none;cursor:pointer;font-size:0.82rem;font-weight:700;background:none;position:relative;white-space:nowrap;"
            :style="helpTab===t.id ? 'color:var(--blue);' : 'color:var(--text-muted);'">
            {{ t.icon }} {{ t.label }}
            <span v-if="helpTab===t.id" style="position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--blue);border-radius:2px;"></span>
          </button>
        </div>
      </div>
      <div style="padding:18px 20px 20px;overflow-y:auto;flex:1;">
        <div v-if="helpTab==='order'">
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0 0 14px;line-height:1.5;">주문 접수부터 구매확정까지 아래 순서로 진행됩니다.</p>
          <div v-for="s in [{icon:'📋',status:'주문완료',color:'#3b82f6',desc:'주문이 접수되었습니다. 계좌이체의 경우 입금 확인 후 다음 단계로 넘어갑니다.',tip:'주문완료·결제완료 상태에서만 주문 취소가 가능합니다.'},{icon:'💳',status:'결제완료',color:'#8b5cf6',desc:'입금 확인 또는 카드/캐쉬 결제가 완료되어 상품 준비를 시작합니다.',tip:null},{icon:'📦',status:'배송준비중',color:'#f59e0b',desc:'상품을 포장하고 출고 준비 중입니다. 이 단계부터는 주문 취소가 불가합니다.',tip:'취소가 필요하면 배송완료 후 반품으로 처리해 주세요.'},{icon:'🚚',status:'배송중',color:'#f97316',desc:'택배사에 인계되어 배송지로 이동 중입니다.',tip:null},{icon:'✅',status:'배송완료',color:'#22c55e',desc:'상품이 도착했습니다. 교환·반품 신청은 수령 후 7일 이내에 해주세요.',tip:'배송완료 상태에서 교환신청·반품신청·구매확정 버튼이 활성화됩니다.'},{icon:'🏁',status:'구매확정',color:'#6b7280',desc:'거래가 최종 확정되었습니다. 구매확정 후에는 교환·반품 신청이 불가합니다.',tip:'배송완료 후 미확정 시 14일 후 자동 구매확정 처리됩니다.'}]" :key="s.status" style="display:flex;gap:12px;margin-bottom:14px;">
            <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;" :style="'background:'+s.color+'22;'">{{ s.icon }}</div>
            <div><div style="font-size:0.85rem;font-weight:800;margin-bottom:3px;" :style="'color:'+s.color">{{ s.status }}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">{{ s.desc }}</div>
            <div v-if="s.tip" style="margin-top:4px;font-size:0.73rem;color:#f59e0b;background:#fef3c7;padding:3px 8px;border-radius:4px;display:inline-block;">💡 {{ s.tip }}</div></div>
          </div>
        </div>
        <div v-else-if="helpTab==='cancel'">
          <div style="background:#fee2e2;border-radius:8px;padding:10px 14px;margin-bottom:14px;"><div style="font-size:0.82rem;font-weight:800;color:#dc2626;margin-bottom:4px;">🚫 취소 신청 안내</div><div style="font-size:0.76rem;color:#7f1d1d;line-height:1.55;">주문완료 또는 결제완료 상태일 때만 취소 신청이 가능합니다.<br>배송준비중 이후에는 반품으로 처리해 주세요.</div></div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['취소요청','취소처리중','취소완료']" :key="st" style="display:flex;align-items:center;gap:6px;">
              <span style="padding:4px 10px;border-radius:20px;font-size:0.76rem;font-weight:700;background:#fee2e2;color:#dc2626;">{{ st }}</span>
              <span v-if="i<2" style="color:var(--text-muted);">→</span>
            </span>
          </div>
        </div>
        <div v-else-if="helpTab==='return'">
          <div style="background:#fff7ed;border-radius:8px;padding:10px 14px;margin-bottom:14px;"><div style="font-size:0.82rem;font-weight:800;color:#ea580c;margin-bottom:4px;">↩️ 반품 신청 안내</div><div style="font-size:0.76rem;color:#7c2d12;line-height:1.55;">배송완료 후 <strong>7일 이내</strong>에 신청해야 합니다.<br>미착용·미세탁·태그 부착 상태여야 합니다.</div></div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['반품요청','수거예정','수거중','수거완료','환불처리중','환불완료']" :key="st" style="display:flex;align-items:center;gap:4px;">
              <span style="padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;background:#fff7ed;color:#ea580c;">{{ st }}</span>
              <span v-if="i<5" style="color:var(--text-muted);">→</span>
            </span>
          </div>
        </div>
        <div v-else-if="helpTab==='exchange'">
          <div style="background:#eff6ff;border-radius:8px;padding:10px 14px;margin-bottom:14px;"><div style="font-size:0.82rem;font-weight:800;color:#1d4ed8;margin-bottom:4px;">🔄 교환 신청 안내</div><div style="font-size:0.76rem;color:#1e3a8a;line-height:1.55;">배송완료 후 <strong>7일 이내</strong>에 신청해야 합니다.<br>동일 상품의 사이즈·색상 교환만 가능합니다.</div></div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['교환요청','수거예정','수거중','수거완료','상품준비중','발송중','발송완료','교환완료']" :key="st" style="display:flex;align-items:center;gap:4px;">
              <span style="padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;background:#eff6ff;color:#1d4ed8;">{{ st }}</span>
              <span v-if="i<7" style="color:var(--text-muted);">→</span>
            </span>
          </div>
        </div>
      </div>
      <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
        <button @click="flowHelpOpen=false" class="btn-blue" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">확인</button>
      </div>
    </div>
  </div>

  <!-- 교환·반품 신청 모달 -->
  <div v-if="claimModal.show" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;" @click.self="claimModal.show=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:1px solid var(--border);overflow:hidden;" @click.stop>
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">{{ claimModal.type==='exchange' ? '🔄 교환 신청' : '↩️ 반품 신청' }}</span>
          <span style="margin-left:8px;font-size:0.75rem;color:var(--text-muted);">{{ claimModal.orderId }}</span>
        </div>
        <button @click="claimModal.show=false" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>
      </div>
      <div style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:18px;">
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">신청 사유 <span style="color:#ef4444;">*</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="r in (claimModal.type==='exchange' ? EXCHANGE_REASONS : RETURN_REASONS)" :key="r"
              @click="claimModal.reason=r; claimModal.selectedCouponId=null"
              style="padding:6px 14px;border-radius:20px;cursor:pointer;font-size:0.78rem;font-weight:600;"
              :style="claimModal.reason===r ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);' : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
              {{ r }}
            </button>
          </div>
        </div>
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">상세 내용 <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted);">(선택)</span></div>
          <textarea v-model="claimModal.reasonDetail" rows="2" placeholder="상세 내용을 입력해 주세요."
            style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.8rem;resize:none;box-sizing:border-box;outline:none;"></textarea>
        </div>
        <div v-if="claimModal.type==='exchange' && claimModal.order && claimModal.order.items.length > 1">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">교환 상품 선택 <span style="color:#ef4444;">*</span></div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <button v-for="(item, idx) in claimModal.order.items" :key="idx" @click="claimModal.exchangeItemIdx=idx; claimModal.exchangeSize=''; claimModal.exchangeColor=''"
              style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;text-align:left;width:100%;"
              :style="claimModal.exchangeItemIdx===idx ? 'background:var(--blue-dim);border:1.5px solid var(--blue);' : 'background:var(--bg-base);border:1.5px solid var(--border);'">
              <span style="font-size:1.2rem;">{{ item.emoji }}</span>
              <div style="flex:1;"><div style="font-size:0.85rem;font-weight:600;" :style="claimModal.exchangeItemIdx===idx ? 'color:var(--blue);' : 'color:var(--text-primary);'">{{ item.prodNm }}</div><div style="font-size:0.75rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }}</div></div>
              <span v-if="claimModal.exchangeItemIdx===idx" style="color:var(--blue);">✓</span>
            </button>
          </div>
        </div>
        <div v-if="claimModal.type==='exchange'" style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">교환 옵션 <span style="color:#ef4444;">*</span></div>
          <div v-if="claimModalProduct && claimModalProduct.opt2s">
            <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:5px;">사이즈</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              <button v-for="sz in claimModalProduct.opt2s" :key="sz" @click="claimModal.exchangeSize = claimModal.exchangeSize===sz ? '' : sz"
                style="padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;"
                :style="claimModal.exchangeSize===sz ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);' : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">{{ sz }}</button>
            </div>
          </div>
          <div v-if="claimModalProduct && claimModalProduct.opt1s">
            <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:5px;">색상</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button v-for="col in claimModalProduct.opt1s" :key="col.name" @click="claimModal.exchangeColor = claimModal.exchangeColor===col.name ? '' : col.name"
                style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;"
                :style="claimModal.exchangeColor===col.name ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);' : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
                <span style="width:10px;height:10px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);" :style="'background:'+col.hex"></span>{{ col.name }}
              </button>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">배송비 안내</div>
          <div v-if="!claimModal.reason" style="font-size:0.78rem;color:var(--text-muted);padding:10px;background:var(--bg-base);border-radius:8px;">사유를 선택하면 배송비가 안내됩니다.</div>
          <template v-else>
            <div v-if="claimShippingFee===0" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#dcfce7;border-radius:8px;margin-bottom:8px;">
              <span>✅</span><div><div style="font-size:0.82rem;font-weight:800;color:#16a34a;">배송비 무료</div><div style="font-size:0.73rem;color:#15803d;margin-top:1px;">상품 불량·오배송의 경우 왕복 배송비를 당사가 부담합니다.</div></div>
            </div>
            <div v-else style="padding:10px 14px;background:#fff7ed;border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:0.82rem;font-weight:700;color:#ea580c;">왕복 배송비 (고객 부담)</span>
                <span style="font-size:0.9rem;font-weight:800;color:#ea580c;">{{ claimShippingFee.toLocaleString() }}원</span>
              </div>
            </div>
            <div v-if="claimShippingFee>0">
              <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">🎟 배송비 쿠폰 적용</div>
              <div v-if="!applicableCoupons.length" style="font-size:0.75rem;color:var(--text-muted);padding:8px 12px;background:var(--bg-base);border-radius:6px;">사용 가능한 쿠폰이 없습니다.</div>
              <div v-else style="display:flex;flex-direction:column;gap:5px;">
                <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);background:var(--bg-base);">
                  <input type="radio" :value="null" v-model="claimModal.selectedCouponId" style="accent-color:var(--blue);"><span style="font-size:0.78rem;color:var(--text-secondary);">쿠폰 사용 안함</span>
                </label>
                <label v-for="cp in applicableCoupons" :key="cp.couponId"
                  style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);"
                  :style="claimModal.selectedCouponId===cp.couponId ? 'border-color:var(--blue);background:var(--blue-dim);' : 'background:var(--bg-base);'">
                  <input type="radio" :value="cp.couponId" v-model="claimModal.selectedCouponId" style="accent-color:var(--blue);">
                  <div style="flex:1;"><div style="font-size:0.8rem;font-weight:700;">{{ cp.name }}</div><div style="font-size:0.7rem;color:var(--text-muted);">{{ myStore.discountLabel(cp) }} · 만료 {{ cp.expiry }}</div></div>
                  <span style="font-size:0.78rem;font-weight:800;color:var(--blue);">{{ myStore.discountLabel(cp) }}</span>
                </label>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:8px 12px;background:var(--bg-base);border-radius:8px;border:1px solid var(--border);">
                <span style="font-size:0.8rem;color:var(--text-secondary);">최종 배송비</span>
                <span style="font-size:0.92rem;font-weight:800;" :style="claimFinalFee===0 ? 'color:#16a34a;' : 'color:#ea580c;'">{{ claimFinalFee===0 ? '무료' : claimFinalFee.toLocaleString()+'원' }}</span>
              </div>
              <div v-if="claimFinalFee>0" style="margin-top:10px;padding:10px 14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                <div style="font-size:0.76rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;">🏦 배송비 입금 안내</div>
                <div style="font-size:0.8rem;color:#1e40af;font-weight:700;margin-bottom:2px;">{{ config.bank.name }} {{ config.bank.account }}</div>
                <div style="font-size:0.75rem;color:#3730a3;">예금주: {{ config.bank.holder }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;">
        <button @click="claimModal.show=false" style="flex:1;padding:10px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:700;">취소</button>
        <button @click="submitClaimModal" style="flex:2;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;color:#fff;"
          :style="claimModal.type==='exchange' ? 'background:#3b82f6;' : 'background:#f97316;'">
          {{ claimModal.type==='exchange' ? '교환 신청하기' : '반품 신청하기' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 주문 상세 모달 -->
  <OrderDetailModal :show="myStore.orderDetailModal.show" :order="myStore.orderDetailModal.order" @close="myStore.orderDetailModal.show=false" />
  <!-- 상품 모달 -->
  <ProductModal :show="myStore.productModal.show" :product="myStore.productModal.product" @close="myStore.productModal.show=false" />
  <!-- 주문자 모달 -->
  <CustomerModal :show="myStore.customerModal.show" :user="myStore.customerModal.user" :order="myStore.customerModal.order" @close="myStore.customerModal.show=false" />

  </Teleport>
</FrontMyLayout>
  `,
  components: {
    FrontMyLayout:         window.frontMyLayout,
    PagerHeader:      window.PagerHeader,
    Pagination:       window.Pagination,
    OrderDetailModal: window.OrderDetailModal,
    ProductModal:     window.ProductModal,
    CustomerModal:    window.CustomerModal,
  }
};
