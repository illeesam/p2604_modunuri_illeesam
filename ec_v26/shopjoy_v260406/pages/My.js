/* ShopJoy - My Page */
window.My = {
  name: 'My',
  props: ['navigate', 'config', 'cart', 'cartCount', 'showToast', 'showConfirm', 'removeFromCart', 'updateCartQty'],
  setup(props) {
    const { ref, reactive, computed, onMounted, watch } = Vue;

    /* ── 주문 상태 흐름 ── */
    const ORDER_FLOW = [
      { status: '주문완료',   icon: '📋' },
      { status: '결제완료',   icon: '💳' },
      { status: '배송준비중', icon: '📦' },
      { status: '배송중',     icon: '🚚' },
      { status: '배송완료',   icon: '✅' },
      { status: '완료',       label: '구매확정', icon: '🏁' },
    ];
    const orderStatusLabel = s => (s === '완료' ? '구매확정' : s);
    const flowHelpOpen = ref(false);
    const helpTab = ref('order');
    const CANCELABLE   = ['주문완료', '결제완료'];
    const SHOW_COURIER = ['배송준비중', '배송중', '배송완료', '완료'];

    const tab = ref('orders');

    /* ── 공통 페이지네이션 헬퍼 ── */
    const mkPager = () => reactive({ page: 1, size: 50 });
    const paginate = (list, pager) => {
      const start = (pager.page - 1) * pager.size;
      return list.slice(start, start + pager.size);
    };
    const totalPages = (list, pager) => Math.max(1, Math.ceil(list.length / pager.size));
    const pageRange = (total) => { const r=[]; for(let i=1;i<=total;i++) r.push(i); return r; };

    /* ── 주문 ── */
    const orders = ref([]);
    const orderPager = mkPager();
    const loadOrders = async () => {
      if (orders.value.length) return;
      try { const res = await window.axiosApi.get('my/orders.json'); orders.value = res.data; }
      catch (e) { orders.value = []; }
    };
    const statusColor = s => ({
      '주문완료': '#3b82f6', '결제완료': '#8b5cf6',
      '배송준비중': '#f59e0b', '배송중': '#f97316',
      '배송완료': '#22c55e', '완료': '#6b7280', '교환요청': '#f59e0b', '반품요청': '#f97316', '취소됨': '#9ca3af'
    }[s] || '#9ca3af');

    const flowIndex = s => ORDER_FLOW.findIndex(f => f.status === s);

    const cancelOrder = async orderId => {
      const ok = await props.showConfirm('주문 취소', '이 주문을 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const o = orders.value.find(x => x.orderId === orderId);
      if (o) { o.status = '취소됨'; }
      props.showToast('주문이 취소되었습니다.', 'success');
    };

    const confirmPurchase = async orderId => {
      const ok = await props.showConfirm('구매확정', '구매를 확정하시겠습니까?\n확정 후에는 교환/반품 신청이 어렵습니다.', 'warning');
      if (!ok) return;
      const o = orders.value.find(x => x.orderId === orderId);
      if (o) { o.status = '완료'; }
      props.showToast('구매가 확정되었습니다. 감사합니다! 🎉', 'success');
    };

    /* ── 교환·반품 신청 모달 ── */
    const CLAIM_SHIPPING_FEE = 5000;
    const CLAIM_FREE_REASONS = ['상품불량', '오배송'];
    const claimModal = Vue.reactive({
      show: false, type: '', orderId: '', order: null,
      reason: '', reasonDetail: '', exchangeSize: '', exchangeColor: '',
      selectedCouponId: null, exchangeItemIdx: 0,
    });

    const EXCHANGE_REASONS = ['사이즈 불일치', '색상 변경', '상품불량', '오배송', '단순변심'];
    const RETURN_REASONS  = ['단순변심', '사이즈 불일치', '색상 상이', '상품불량', '오배송'];

    const claimShippingFee = Vue.computed(() =>
      CLAIM_FREE_REASONS.includes(claimModal.reason) ? 0 : CLAIM_SHIPPING_FEE
    );
    const applicableCoupons = Vue.computed(() =>
      coupons.value.filter(c => !c.used && (
        c.discountType === 'shipping' ||
        (c.discountType === 'amount' && c.discountValue >= claimShippingFee.value)
      ))
    );
    const claimSelectedCoupon = Vue.computed(() =>
      coupons.value.find(c => c.couponId === claimModal.selectedCouponId) || null
    );
    const claimFinalFee = Vue.computed(() => {
      const fee = claimShippingFee.value;
      if (!fee || !claimSelectedCoupon.value) return fee;
      const c = claimSelectedCoupon.value;
      if (c.discountType === 'shipping') return 0;
      if (c.discountType === 'amount') return Math.max(0, fee - c.discountValue);
      return fee;
    });
    const claimModalProduct = Vue.computed(() => {
      if (!claimModal.order) return null;
      const name = claimModal.order.items[claimModal.exchangeItemIdx]?.productName;
      return props.config.products.find(p => p.productName === name) || null;
    });

    const openClaimModal = (orderId, type) => {
      claimModal.show = true; claimModal.type = type; claimModal.orderId = orderId;
      claimModal.order = orders.value.find(x => x.orderId === orderId) || null;
      claimModal.reason = ''; claimModal.reasonDetail = '';
      claimModal.exchangeSize = ''; claimModal.exchangeColor = '';
      claimModal.selectedCouponId = null; claimModal.exchangeItemIdx = 0;
      if (!coupons.value.length) loadCoupons();
    };
    const submitClaimModal = () => {
      if (!claimModal.reason) { props.showToast('신청 사유를 선택해주세요.', 'error'); return; }
      if (claimModal.type === 'exchange') {
        if (claimModal.order && claimModal.order.items.length > 1 && claimModal.exchangeItemIdx == null) {
          props.showToast('교환할 상품을 선택해주세요.', 'error'); return;
        }
        if (!claimModal.exchangeSize && !claimModal.exchangeColor) {
          props.showToast('교환할 사이즈 또는 색상을 선택해주세요.', 'error'); return;
        }
      }
      if (claimSelectedCoupon.value) claimSelectedCoupon.value.used = true;
      const o = orders.value.find(x => x.orderId === claimModal.orderId);
      if (o) o.status = claimModal.type === 'exchange' ? '교환요청' : '반품요청';
      const label = claimModal.type === 'exchange' ? '교환' : '반품';
      claimModal.show = false;
      props.showToast(label + ' 신청이 완료되었습니다. 곧 연락드리겠습니다.', 'success');
    };

    const requestExchange = (orderId, type) => openClaimModal(orderId, type);

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

    const showOrderPayBreakdown = o =>
      (o.shippingFee != null && o.shippingFee > 0) ||
      (o.shippingCoupon && Number(o.shippingCoupon.discount) > 0) ||
      Number(o.cashPaid) > 0 ||
      Number(o.transferPaid) > 0;

    /* ── 쿠폰 ── */
    const coupons = ref([]);
    const couponPager = mkPager();
    const couponCode = ref('');
    const loadCoupons = async () => {
      if (coupons.value.length) return;
      try { const res = await window.axiosApi.get('my/coupons.json'); coupons.value = res.data; }
      catch (e) { coupons.value = []; }
    };
    const addCoupon = () => {
      const code = couponCode.value.trim().toUpperCase();
      if (!code) { props.showToast('쿠폰 코드를 입력하세요.', 'error'); return; }
      if (coupons.value.find(c => c.code === code)) { props.showToast('이미 등록된 쿠폰입니다.', 'error'); return; }
      coupons.value.unshift({ couponId: Date.now(), code, name: '추가 쿠폰 (' + code + ')', discountType: 'amount', discountValue: 3000, minOrder: 30000, expiry: '2026-12-31', used: false });
      couponCode.value = ''; couponPager.page = 1;
      props.showToast('쿠폰이 등록되었습니다!', 'success');
    };
    const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '% 할인' : c.discountType === 'shipping' ? '무료배송' : c.discountValue.toLocaleString() + '원 할인';

    /* ── 캐쉬 ── */
    const cashBalance = ref(0);
    const cashHistory = ref([]);
    const cashPager = mkPager();
    const chargeAmount = ref('');
    const loadCash = async () => {
      if (cashHistory.value.length) return;
      try { const res = await window.axiosApi.get('my/cash.json'); cashBalance.value = res.data.balance; cashHistory.value = res.data.history; }
      catch (e) {}
    };
    const addCash = () => {
      const amount = parseInt(String(chargeAmount.value).replace(/,/g, ''), 10);
      if (!amount || amount < 1000) { props.showToast('최소 1,000원 이상 충전 가능합니다.', 'error'); return; }
      cashBalance.value += amount;
      cashHistory.value.unshift({ cashId: Date.now(), date: new Date().toISOString().slice(0, 10), type: '충전', amount, desc: '직접 충전', balance: cashBalance.value });
      chargeAmount.value = ''; cashPager.page = 1;
      props.showToast(amount.toLocaleString() + '원이 충전되었습니다!', 'success');
    };

    /* ── 문의 ── */
    const inquiries = ref([]);
    const inquiryPager = mkPager();
    const expandedInquiry = ref(null);
    const loadInquiries = async () => {
      if (inquiries.value.length) return;
      try { const res = await window.axiosApi.get('my/inquiries.json'); inquiries.value = res.data; }
      catch (e) { inquiries.value = []; }
    };
    const cancelInquiry = async id => {
      const ok = await props.showConfirm('문의 취소', '이 문의를 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const item = inquiries.value.find(x => x.inquiryId === id);
      if (item) { item.status = '취소됨'; }
      props.showToast('문의가 취소되었습니다.', 'success');
    };
    const inquiryStatusColor = s => ({ '요청': '#3b82f6', '처리중': '#f97316', '답변완료': '#22c55e', '취소됨': '#9ca3af' }[s] || '#9ca3af');

    /* ── 취소/반품/교환 (클레임) ── */
    const claims = ref([]);
    const claimPager = mkPager();
    const claimFilter = ref('전체'); // 전체 | 취소 | 반품 | 교환
    const CLAIM_FLOWS = {
      '취소': ['취소요청', '취소처리중', '취소완료'],
      '반품': ['반품요청', '수거예정', '수거완료', '환불처리중', '환불완료'],
      '교환': ['교환요청', '수거예정', '수거완료', '상품준비중', '발송완료', '교환완료'],
    };
    const CLAIM_DONE = ['취소완료', '환불완료', '교환완료'];
    const CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#f97316', '교환': '#3b82f6' };
    const CLAIM_STATUS_COLOR = s => ({
      '취소요청':'#ef4444','취소처리중':'#f97316','취소완료':'#9ca3af',
      '반품요청':'#ef4444','수거예정':'#f59e0b','수거완료':'#8b5cf6','환불처리중':'#f97316','환불완료':'#9ca3af',
      '교환요청':'#3b82f6','상품준비중':'#f59e0b','발송완료':'#22c55e','교환완료':'#9ca3af',
    }[s] || '#9ca3af');
    const loadClaims = async () => {
      if (claims.value.length) return;
      try { const res = await window.axiosApi.get('my/claims.json'); claims.value = res.data; }
      catch (e) { claims.value = []; }
    };
    const filteredClaims = computed(() =>
      claimFilter.value === '전체' ? claims.value : claims.value.filter(c => c.type === claimFilter.value)
    );
    const claimsByOrderId = computed(() => {
      const map = {};
      claims.value.forEach(c => { map[c.orderId] = c; });
      return map;
    });
    const cancelClaim = async claimId => {
      const ok = await props.showConfirm('신청 취소', '이 신청을 취소하시겠습니까?', 'warning');
      if (!ok) return;
      const item = claims.value.find(c => c.claimId === claimId);
      if (item) {
        item.status = item.type === '취소' ? '취소완료'
          : item.type === '반품' ? '반품취소됨'
          : '교환취소됨';
        claims.value = claims.value.filter(c => c.claimId !== claimId);
      }
      props.showToast('신청이 취소되었습니다.', 'info');
    };

    const openTracking2 = (courier, trackingNo) => {
      const URLS = {
        'CJ대한통운': no => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${no}`,
        '롯데택배':   no => `https://www.lotteglogis.com/open/tracking?invno=${no}`,
        '한진택배':   no => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${no}`,
      };
      const fn = URLS[courier];
      if (fn) window.open(fn(trackingNo), '_blank', 'width=960,height=700,scrollbars=yes');
    };

    /* ── 채팅 ── */
    const chats = ref([]);
    const chatPager = mkPager();
    const expandedChat = ref(null);
    const loadChats = async () => {
      if (chats.value.length) return;
      try { const res = await window.axiosApi.get('my/chats.json'); chats.value = res.data; }
      catch (e) { chats.value = []; }
    };
    const openChat = chat => { chat.unread = 0; expandedChat.value = expandedChat.value === chat.chatId ? null : chat.chatId; };

    /* ── 주문 상세 모달 (캐쉬 연동) ── */
    const orderDetailModal = Vue.reactive({ show: false, order: null });
    const openOrderModal = orderId => {
      const o = orders.value.find(x => x.orderId === orderId);
      if (!o) { props.showToast('주문 정보를 찾을 수 없습니다.', 'error'); return; }
      orderDetailModal.order = o;
      orderDetailModal.show = true;
    };
    const extractOrderId = desc => {
      const m = (desc || '').match(/ORD-\d{4}-\d{3,}/);
      return m ? m[0] : null;
    };

    /* ── 상품/주문자/상품 모달 ── */
    const authUser = Vue.computed(() => window.shopjoyAuth.state.user);
    const findProduct = productName => props.config.products.find(p => p.productName === productName) || null;

    const productModal = Vue.reactive({ show: false, product: null });
    const openProductModal = productName => {
      const p = findProduct(productName);
      if (p) { productModal.product = p; productModal.show = true; }
    };

    const customerModal = Vue.reactive({ show: false, user: null, order: null });
    const openCustomerModal = order => {
      customerModal.user = authUser.value;
      customerModal.order = order || null;
      customerModal.show = true;
    };

    /* ── 쿠폰 사용 주문 상품 조회 ── */
    const getCouponUsedOrderItems = c => {
      if (!c.used || !c.usedOrderId) return null;
      const o = orders.value.find(x => x.orderId === c.usedOrderId);
      return o ? o.items : null;
    };

    /* ── 탭 카운트 ── */
    const tabCounts = computed(() => ({
      orders:    orders.value.length,
      claims:    claims.value.filter(c => !CLAIM_DONE.includes(c.status)).length,
      cart:      props.cartCount,
      coupons:   coupons.value.filter(c => !c.used).length,
      cash:      null,
      inquiries: inquiries.value.filter(q => q.status === '요청' || q.status === '처리중').length,
      chats:     chats.value.reduce((s, c) => s + (c.unread || 0), 0),
    }));

    const TABS = [
      { id: 'orders',    label: '주문',           icon: '📦' },
      { id: 'claims',    label: '취소/반품/교환',  icon: '↩️' },
      { id: 'cart',      label: '장바구니',        icon: '🛒' },
      { id: 'coupons',   label: '쿠폰',            icon: '🎟️' },
      { id: 'cash',      label: '캐쉬',            icon: '💰' },
      { id: 'inquiries', label: '문의',            icon: '📩' },
      { id: 'chats',     label: '채팅',            icon: '💬' },
    ];

    /* ── 탭 전환 시 데이터 로드 ── */
    watch(tab, async t => {
      if (t === 'orders')    await loadOrders();
      if (t === 'claims')    await loadClaims();
      if (t === 'coupons')   await loadCoupons();
      if (t === 'cash')      await loadCash();
      if (t === 'inquiries') await loadInquiries();
      if (t === 'chats')     await loadChats();
    });

    onMounted(async () => {
      await loadOrders();
      loadClaims();
      loadCoupons();
      loadCash();
      loadInquiries();
      loadChats();
    });

    /* ── 장바구니 금액 ── */
    const cartTotal = computed(() => props.cart.reduce((s, i) => {
      const p = parseInt(String(i.product.price).replace(/[^0-9]/g, ''), 10);
      return s + p * i.qty;
    }, 0));

    return {
      TABS, tab, tabCounts,
      ORDER_FLOW, orderStatusLabel, flowHelpOpen, helpTab,
      CANCELABLE, SHOW_COURIER, flowIndex, statusColor,
      orders, orderPager, cancelOrder, confirmPurchase, requestExchange, openTracking, showOrderPayBreakdown,
      claimModal, openClaimModal, submitClaimModal,
      EXCHANGE_REASONS, RETURN_REASONS, claimShippingFee, applicableCoupons, claimSelectedCoupon, claimFinalFee, claimModalProduct,
      claims, claimPager, claimFilter, filteredClaims, claimsByOrderId,
      CLAIM_FLOWS, CLAIM_DONE, CLAIM_TYPE_COLOR, CLAIM_STATUS_COLOR, cancelClaim, openTracking2,
      coupons, couponPager, couponCode, addCoupon, discountLabel,
      cashBalance, cashHistory, cashPager, chargeAmount, addCash,
      inquiries, inquiryPager, expandedInquiry, cancelInquiry, inquiryStatusColor,
      chats, chatPager, expandedChat, openChat,
      orderDetailModal, openOrderModal, extractOrderId, getCouponUsedOrderItems,
      authUser, findProduct, productModal, openProductModal, customerModal, openCustomerModal,
      cartTotal,
      paginate, totalPages, pageRange,
    };
  },
  template: /* html */ `
<div style="padding:24px 20px;max-width:960px;margin:0 auto;">

  <!-- 헤더 -->
  <div style="margin-bottom:24px;">
    <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">My Account</div>
    <h1 style="font-size:1.8rem;font-weight:900;color:var(--text-primary);margin-top:4px;">마이페이지</h1>
    <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:4px;">주문, 쿠폰, 캐쉬, 문의를 한곳에서 관리하세요</p>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:4px;margin-bottom:24px;overflow-x:auto;scrollbar-width:none;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:6px;">
    <button v-for="t in TABS" :key="t.id" @click="tab=t.id"
      style="padding:8px 14px;border:none;cursor:pointer;font-size:0.85rem;font-weight:600;white-space:nowrap;border-radius:8px;transition:all 0.2s;display:flex;align-items:center;gap:5px;"
      :style="tab===t.id
        ? 'background:var(--blue);color:#fff;box-shadow:0 2px 8px rgba(59,130,246,0.4);'
        : 'background:transparent;color:var(--text-muted);'">
      <span>{{ t.icon }}</span>
      <span>{{ t.label }}</span>
      <span v-if="tabCounts[t.id] > 0"
        style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;font-size:0.7rem;"
        :style="tab===t.id ? 'background:rgba(255,255,255,0.3);color:#fff;' : 'background:var(--blue);color:#fff;'">
        {{ tabCounts[t.id] }}
      </span>
    </button>
  </div>

  <!-- ── 주문 탭 ── -->
  <div v-if="tab==='orders'">

    <!-- 주문 상태 흐름 차트 -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;overflow-x:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;">주문 처리 흐름</div>
        <button type="button" @click="flowHelpOpen = true" aria-label="주문 처리 흐름 도움말" title="도움말"
          style="flex-shrink:0;width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg-base);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--blue);transition:background 0.15s,border-color 0.15s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;align-items:center;min-width:540px;">
        <template v-for="(step, si) in ORDER_FLOW" :key="step.status">
          <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
            <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:6px;transition:all 0.2s;"
              :style="orders.filter(o=>o.status===step.status).length>0
                ? 'background:var(--blue);box-shadow:0 0 0 3px rgba(59,130,246,0.25);'
                : 'background:var(--bg-base);border:2px solid var(--border);'">
              {{ step.icon }}
            </div>
            <div style="font-size:0.72rem;font-weight:600;text-align:center;white-space:nowrap;"
              :style="orders.filter(o=>o.status===step.status).length>0 ? 'color:var(--blue);' : 'color:var(--text-muted);'">
              {{ step.label || step.status }}
            </div>
            <div v-if="orders.filter(o=>o.status===step.status).length>0"
              style="font-size:0.68rem;font-weight:700;color:var(--blue);margin-top:2px;">
              {{ orders.filter(o=>o.status===step.status).length }}건
            </div>
          </div>
          <div v-if="si < ORDER_FLOW.length-1"
            style="font-size:1rem;color:var(--border);flex-shrink:0;margin:0 2px;padding-bottom:20px;">›</div>
        </template>
      </div>
    </div>

    <PagerHeader :total="orders.length" :pager="orderPager" />
    <div v-if="!orders.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">주문 내역이 없습니다.</div>
    <div v-for="o in paginate(orders, orderPager)" :key="o.orderId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;">

      <!-- 주문 헤더 -->
      <div class="my-order-card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ o.orderId }}</span>
          <span style="margin-left:10px;font-size:0.78rem;color:var(--text-muted);"><span style="font-weight:500;">주문일: </span>{{ o.orderDate }}</span>
          <button v-if="authUser" @click="openCustomerModal(o)"
            style="margin-left:8px;font-size:0.78rem;font-weight:600;color:var(--text-secondary);border:none;background:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px;">
            <span style="font-weight:400;color:var(--text-muted);text-decoration:none;">주문자: </span>{{ authUser.name }}
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
          <!-- 주문취소: 주문완료/결제완료 (클레임 진행중이면 숨김) -->
          <button v-if="CANCELABLE.includes(o.status) && !(claimsByOrderId[o.orderId] && !CLAIM_DONE.includes(claimsByOrderId[o.orderId].status))"
            @click="cancelOrder(o.orderId)"
            style="padding:5px 12px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.78rem;font-weight:600;">
            주문취소
          </button>
          <!-- 교환·반품·구매확정: 배송완료 (클레임 진행중이면 숨김) -->
          <template v-if="o.status==='배송완료' && !(claimsByOrderId[o.orderId] && !CLAIM_DONE.includes(claimsByOrderId[o.orderId].status))">
            <button @click="requestExchange(o.orderId,'exchange')"
              style="padding:5px 12px;border:1.5px solid #f59e0b;border-radius:6px;background:transparent;color:#f59e0b;cursor:pointer;font-size:0.78rem;font-weight:600;white-space:nowrap;">
              교환신청
            </button>
            <button @click="requestExchange(o.orderId,'return')"
              style="padding:5px 12px;border:1.5px solid #f97316;border-radius:6px;background:transparent;color:#f97316;cursor:pointer;font-size:0.78rem;font-weight:600;white-space:nowrap;">
              반품신청
            </button>
            <button @click="confirmPurchase(o.orderId)"
              style="padding:5px 12px;border:1.5px solid #22c55e;border-radius:6px;background:#22c55e;color:#fff;cursor:pointer;font-size:0.78rem;font-weight:700;white-space:nowrap;">
              구매확정
            </button>
          </template>
          <span style="font-size:0.78rem;font-weight:700;padding:5px 12px;border-radius:20px;color:#fff;white-space:nowrap;"
            :style="'background:' + statusColor(o.status)">{{ orderStatusLabel(o.status) }}</span>
        </div>
      </div>

      <!-- 주문 진행 프로세스 -->
      <div v-if="ORDER_FLOW.findIndex(f=>f.status===o.status) >= 0"
        style="background:var(--bg-base);border-radius:8px;padding:10px 14px;margin-bottom:12px;overflow-x:auto;">
        <div style="display:flex;align-items:flex-start;min-width:320px;">
          <template v-for="(step, si) in ORDER_FLOW" :key="step.status">
            <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:48px;">
              <div style="width:10px;height:10px;border-radius:50%;margin-bottom:4px;flex-shrink:0;"
                :style="ORDER_FLOW.findIndex(f=>f.status===o.status) >= si
                  ? 'background:#4ade80;' : 'background:var(--border);'"></div>
              <div style="font-size:0.63rem;text-align:center;line-height:1.3;white-space:nowrap;"
                :style="o.status === step.status
                  ? 'color:#16a34a;font-weight:800;'
                  : ORDER_FLOW.findIndex(f=>f.status===o.status) > si
                    ? 'color:var(--text-secondary);font-weight:600;'
                    : 'color:var(--text-muted);'">
                {{ step.label || step.status }}
              </div>
              <button v-if="o.status===step.status && o.trackingNo && SHOW_COURIER.includes(step.status)"
                @click.stop="openTracking(o.courier, o.trackingNo)" title="배송 조회"
                style="margin-top:3px;padding:1px 6px;border-radius:4px;border:1px solid #86efac;background:#dcfce7;color:#15803d;cursor:pointer;font-size:0.58rem;font-weight:700;white-space:nowrap;display:inline-flex;align-items:center;gap:2px;">
                🚚 배송
              </button>
            </div>
            <div v-if="si < ORDER_FLOW.length-1"
              style="height:2px;flex:1;margin-bottom:16px;flex-shrink:0;min-width:8px;"
              :style="ORDER_FLOW.findIndex(f=>f.status===o.status) > si
                ? 'background:#4ade80;' : 'background:var(--border);'"></div>
          </template>
        </div>
      </div>

      <!-- 클레임 정보 (취소/반품/교환) -->
      <template v-if="claimsByOrderId[o.orderId]">
        <div :style="'border-left:3px solid '+CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]+';background:var(--bg-base);border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;'">
          <!-- 헤더 -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:0.8rem;font-weight:800;" :style="'color:'+CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]">
                ↩ {{ claimsByOrderId[o.orderId].type }} 신청
              </span>
              <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">{{ claimsByOrderId[o.orderId].claimId }}</span>
            </div>
            <span style="font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:12px;color:#fff;"
              :style="'background:'+CLAIM_STATUS_COLOR(claimsByOrderId[o.orderId].status)">
              {{ claimsByOrderId[o.orderId].status }}
            </span>
          </div>
          <!-- 신청일 -->
          <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:8px;">
            신청일: {{ claimsByOrderId[o.orderId].requestDate }}
            <span v-if="claimsByOrderId[o.orderId].completeDate"> &nbsp;·&nbsp; 완료: {{ claimsByOrderId[o.orderId].completeDate }}</span>
          </div>
          <!-- 진행 미니 바 -->
          <div style="overflow-x:auto;margin-bottom:8px;">
            <div style="display:flex;align-items:flex-start;min-width:220px;">
              <template v-for="(step, si) in CLAIM_FLOWS[claimsByOrderId[o.orderId].type]" :key="step">
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:38px;">
                  <div style="width:7px;height:7px;border-radius:50%;margin-bottom:3px;flex-shrink:0;"
                    :style="CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) >= si
                      ? 'background:'+CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]
                      : 'background:var(--border)'"></div>
                  <div style="font-size:0.57rem;text-align:center;line-height:1.2;white-space:nowrap;"
                    :style="claimsByOrderId[o.orderId].status === step
                      ? 'color:'+CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]+';font-weight:800;'
                      : CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) > si
                        ? 'color:var(--text-secondary);'
                        : 'color:var(--text-muted);'">
                    {{ step }}
                  </div>
                  <!-- 수거 아이콘: 반품/교환 모두 수거완료 단계에 고정 -->
                  <button v-if="claimsByOrderId[o.orderId].trackingNo && step==='수거완료' &&
                      CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) >= CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf('수거완료')"
                    @click.stop="openTracking2(claimsByOrderId[o.orderId].courier, claimsByOrderId[o.orderId].trackingNo)" title="수거 조회"
                    style="margin-top:2px;padding:1px 4px;border-radius:3px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;cursor:pointer;font-size:0.52rem;font-weight:700;white-space:nowrap;display:inline-flex;align-items:center;gap:1px;">
                    ↩ 수거
                  </button>
                  <!-- 교환 배송 아이콘: 현재 단계에만 -->
                  <button v-if="claimsByOrderId[o.orderId].status===step && claimsByOrderId[o.orderId].exchangeTrackingNo && ['발송완료','교환완료'].includes(step)"
                    @click.stop="openTracking2(claimsByOrderId[o.orderId].exchangeCourier, claimsByOrderId[o.orderId].exchangeTrackingNo)" title="교환 배송 조회"
                    style="margin-top:2px;padding:1px 4px;border-radius:3px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;cursor:pointer;font-size:0.52rem;font-weight:700;white-space:nowrap;display:inline-flex;align-items:center;gap:1px;">
                    📦 교환
                  </button>
                </div>
                <div v-if="si < CLAIM_FLOWS[claimsByOrderId[o.orderId].type].length-1"
                  style="height:1.5px;flex:1;margin-bottom:13px;flex-shrink:0;min-width:6px;"
                  :style="CLAIM_FLOWS[claimsByOrderId[o.orderId].type].indexOf(claimsByOrderId[o.orderId].status) > si
                    ? 'background:'+CLAIM_TYPE_COLOR[claimsByOrderId[o.orderId].type]
                    : 'background:var(--border)'"></div>
              </template>
            </div>
          </div>
          <!-- 사유 -->
          <div style="font-size:0.73rem;margin-bottom:5px;">
            <span style="color:var(--text-muted);">사유</span>
            <span style="margin-left:5px;font-weight:600;color:var(--text-primary);">{{ claimsByOrderId[o.orderId].reason }}</span>
            <span v-if="claimsByOrderId[o.orderId].reasonDetail" style="margin-left:4px;color:var(--text-muted);">· {{ claimsByOrderId[o.orderId].reasonDetail }}</span>
          </div>
          <!-- 환불 정보 (취소·반품) -->
          <div v-if="claimsByOrderId[o.orderId].refundAmount" style="font-size:0.73rem;color:var(--text-secondary);margin-bottom:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
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
          <!-- 교환 내용 -->
          <div v-if="claimsByOrderId[o.orderId].type==='교환' && (claimsByOrderId[o.orderId].exchangeSize || claimsByOrderId[o.orderId].exchangeColor)"
            style="font-size:0.73rem;color:var(--text-secondary);margin-bottom:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="color:var(--text-muted);">교환</span>
            <span v-if="claimsByOrderId[o.orderId].exchangeSize" style="font-weight:700;color:var(--text-primary);">사이즈 → {{ claimsByOrderId[o.orderId].exchangeSize }}</span>
            <span v-if="claimsByOrderId[o.orderId].exchangeColor" style="font-weight:700;color:var(--text-primary);">색상 → {{ claimsByOrderId[o.orderId].exchangeColor }}</span>
          </div>
          <!-- 수거 택배 -->
          <div v-if="claimsByOrderId[o.orderId].courier" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <span>수거 {{ claimsByOrderId[o.orderId].courier }}</span>
            <button v-if="claimsByOrderId[o.orderId].trackingNo" @click.stop="openTracking2(claimsByOrderId[o.orderId].courier, claimsByOrderId[o.orderId].trackingNo)"
              style="padding:1px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-card);color:var(--blue);cursor:pointer;font-size:0.65rem;font-weight:600;">
              {{ claimsByOrderId[o.orderId].trackingNo }}
            </button>
          </div>
          <!-- 교환 발송 택배 -->
          <div v-if="claimsByOrderId[o.orderId].exchangeCourier" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <span>교환 발송 {{ claimsByOrderId[o.orderId].exchangeCourier }}</span>
            <button v-if="claimsByOrderId[o.orderId].exchangeTrackingNo" @click.stop="openTracking2(claimsByOrderId[o.orderId].exchangeCourier, claimsByOrderId[o.orderId].exchangeTrackingNo)"
              style="padding:1px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-card);color:var(--blue);cursor:pointer;font-size:0.65rem;font-weight:600;">
              {{ claimsByOrderId[o.orderId].exchangeTrackingNo }}
            </button>
          </div>
          <!-- 수거 예정일 -->
          <div v-if="claimsByOrderId[o.orderId].pickupDate" style="font-size:0.7rem;color:var(--text-muted);">
            수거 예정일 {{ claimsByOrderId[o.orderId].pickupDate }}
          </div>
        </div>
      </template>

      <!-- 상품 목록 -->
      <div v-for="(item, iix) in o.items" :key="iix + '-' + item.productName + '-' + (item.color||'')">
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
          <span style="font-size:1.4rem;">{{ item.emoji }}</span>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
              <span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</span>
              <button v-if="findProduct(item.productName)" @click="openProductModal(item.productName)"
                style="font-size:0.65rem;padding:0 5px;border:1px solid var(--border);border-radius:4px;background:var(--bg-base);color:var(--text-muted);cursor:pointer;font-weight:600;line-height:1.7;white-space:nowrap;">
                #{{ findProduct(item.productName).productId }}
              </button>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
          </div>
          <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
        </div>
        <div v-if="item.productCoupon && item.productCoupon.discount" class="my-order-product-coupon"
          style="margin:1px 0 4px 46px;padding:3px 8px;border-radius:5px;font-size:0.68rem;line-height:1.3;background:var(--bg-base);display:inline-flex;align-items:center;gap:4px;">
          <span style="color:var(--text-muted);">🎟</span>
          <span style="color:var(--text-muted);">{{ item.productCoupon.name }}</span>
          <span style="font-weight:700;color:#16a34a;">-{{ Number(item.productCoupon.discount).toLocaleString() }}원</span>
        </div>
      </div>

      <!-- 배송·결제 내역 -->
      <div v-if="showOrderPayBreakdown(o)" style="border-top:1px dashed var(--border);margin-top:10px;padding-top:12px;display:flex;flex-direction:column;gap:6px;">
        <div v-if="o.shippingFee != null && o.shippingFee > 0" style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-secondary);">
          <span>배송비</span>
          <span style="font-weight:600;color:var(--text-primary);">{{ o.shippingFee.toLocaleString() }}원</span>
        </div>
        <div v-if="o.shippingCoupon && Number(o.shippingCoupon.discount) > 0" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;font-size:0.8rem;">
          <span style="color:var(--text-secondary);">🚚 배송비 쿠폰 · <span style="color:var(--text-primary);font-weight:600;">{{ o.shippingCoupon.name }}</span></span>
          <span style="font-weight:800;color:var(--blue);flex-shrink:0;">-{{ Number(o.shippingCoupon.discount).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(o.cashPaid) > 0" style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;">
          <span style="color:var(--text-secondary);">💰 캐쉬 결제</span>
          <span style="font-weight:700;color:var(--text-primary);">{{ Number(o.cashPaid).toLocaleString() }}원</span>
        </div>
        <div v-if="Number(o.transferPaid) > 0" style="display:flex;align-items:center;gap:10px;font-size:0.8rem;flex-wrap:wrap;">
          <span style="color:var(--text-secondary);flex-shrink:0;">🏦 계좌이체</span>
          <span v-if="o.status==='주문완료'" style="font-size:0.76rem;font-weight:700;color:#d97706;letter-spacing:-0.02em;">입금확인중...</span>
          <span style="margin-left:auto;font-weight:700;color:var(--text-primary);flex-shrink:0;">{{ Number(o.transferPaid).toLocaleString() }}원</span>
        </div>
      </div>

      <!-- 입금 내역 -->
      <div v-if="o.paymentDetails && o.paymentDetails.length"
        style="border-top:1px dashed var(--border);margin-top:8px;padding-top:8px;">
        <div style="font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:5px;">💳 입금 내역</div>
        <div v-for="(pd, pdi) in o.paymentDetails" :key="pdi"
          style="display:flex;align-items:center;gap:6px;font-size:0.72rem;padding:3px 0;flex-wrap:wrap;border-bottom:1px dashed var(--border);last:border-0;">
          <span style="color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ pd.datetime }}</span>
          <span style="padding:1px 7px;border-radius:4px;font-weight:700;white-space:nowrap;flex-shrink:0;"
            :style="pd.type==='계좌이체'||pd.type==='계좌환불' ? 'background:#dcfce7;color:#16a34a;'
              : pd.type==='카드결제'||pd.type==='카드취소' ? 'background:#dbeafe;color:#1d4ed8;'
              : pd.type==='캐쉬'||pd.type==='캐쉬환급' ? 'background:#fef3c7;color:#d97706;'
              : 'background:var(--bg-base);color:var(--text-secondary);'">
            {{ pd.type }}
          </span>
          <span style="font-weight:700;color:var(--text-primary);white-space:nowrap;">{{ pd.amount.toLocaleString() }}원</span>
          <span style="color:var(--text-secondary);white-space:nowrap;">{{ pd.name }}</span>
          <span v-if="pd.account" style="color:var(--text-muted);white-space:nowrap;">{{ pd.account }}</span>
        </div>
      </div>

      <!-- 합계 + 택배 정보 -->
      <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div v-if="SHOW_COURIER.includes(o.status) && o.courier" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.8rem;color:var(--text-muted);">🚚 {{ o.courier }}</span>
            <button @click="openTracking(o.courier, o.trackingNo)"
              style="padding:3px 10px;border:1.5px solid var(--blue);border-radius:20px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.78rem;font-weight:700;transition:all 0.15s;"
              onmouseover="this.style.background='var(--blue)';this.style.color='#fff';"
              onmouseout="this.style.background='transparent';this.style.color='var(--blue)';">
              {{ o.trackingNo }}
            </button>
          </div>
          <div v-else style="flex:1;min-width:0;"></div>
          <div style="text-align:right;">
            <div v-if="showOrderPayBreakdown(o)" style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px;">총 결제금액</div>
            <span style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">
              <span style="color:var(--blue);">{{ o.totalPrice.toLocaleString() }}원</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <Pagination :total="orders.length" :pager="orderPager" />
  </div>

  <!-- ── 취소/반품/교환 탭 ── -->
  <div v-else-if="tab==='claims'">

    <!-- 유형 필터 -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button v-for="f in ['전체','취소','반품','교환']" :key="f"
        @click="claimFilter=f;claimPager.page=1"
        style="padding:6px 16px;border-radius:20px;cursor:pointer;font-size:0.82rem;font-weight:700;transition:all 0.15s;"
        :style="claimFilter===f
          ? 'background:var(--blue);color:#fff;border:2px solid var(--blue);'
          : 'background:var(--bg-card);color:var(--text-secondary);border:2px solid var(--border);'">
        {{ f }}
        <span v-if="f!=='전체'" style="margin-left:4px;font-size:0.75rem;opacity:0.8;">
          ({{ claims.filter(c=>c.type===f).length }})
        </span>
        <span v-else style="margin-left:4px;font-size:0.75rem;opacity:0.8;">({{ claims.length }})</span>
      </button>
    </div>

    <PagerHeader :total="filteredClaims.length" :pager="claimPager" />
    <div v-if="!filteredClaims.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">
      해당 내역이 없습니다.
    </div>

    <div v-for="c in paginate(filteredClaims, claimPager)" :key="c.claimId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:14px;">

      <!-- 카드 헤더 -->
      <div class="my-order-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-weight:700;font-size:0.88rem;color:var(--text-primary);">{{ c.claimId }}</span>
          <button @click="openOrderModal(c.orderId)"
            style="margin-left:8px;font-size:0.78rem;color:var(--blue);border:none;background:none;cursor:pointer;padding:0;font-weight:600;text-decoration:underline;text-underline-offset:2px;">
            주문: {{ c.orderId }}
          </button>
          <button v-if="authUser" @click="openCustomerModal(orders.find(o=>o.orderId===c.orderId))"
            style="margin-left:8px;font-size:0.78rem;font-weight:600;color:var(--text-secondary);border:none;background:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px;">
            {{ authUser.name }}
          </button>
          <div style="margin-top:4px;font-size:0.78rem;color:var(--text-muted);">
            신청일: {{ c.requestDate }}
            <span v-if="c.completeDate"> · 완료일: {{ c.completeDate }}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
          <button v-if="c.status === CLAIM_FLOWS[c.type][0]" @click="cancelClaim(c.claimId)"
            style="padding:4px 12px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.76rem;font-weight:700;white-space:nowrap;">
            신청취소
          </button>
          <span style="font-size:0.78rem;font-weight:800;padding:4px 12px;border-radius:20px;color:#fff;"
            :style="'background:' + CLAIM_TYPE_COLOR[c.type]">{{ c.type }}</span>
          <span style="font-size:0.68rem;font-weight:600;padding:2px 8px;border-radius:10px;color:#fff;opacity:0.85;"
            :style="'background:' + CLAIM_STATUS_COLOR(c.status)">{{ c.status }}</span>
        </div>
      </div>

      <!-- 진행 흐름 바 -->
      <div style="background:var(--bg-base);border-radius:8px;padding:12px 14px;margin-bottom:12px;overflow-x:auto;">
        <div style="display:flex;align-items:center;min-width:320px;">
          <template v-for="(step, si) in CLAIM_FLOWS[c.type]" :key="step">
            <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
              <div style="width:10px;height:10px;border-radius:50%;margin-bottom:4px;"
                :style="CLAIM_FLOWS[c.type].indexOf(c.status) >= si
                  ? 'background:var(--blue);'
                  : 'background:var(--border);'"></div>
              <div style="font-size:0.65rem;text-align:center;white-space:nowrap;font-weight:600;"
                :style="c.status === step
                  ? 'color:var(--blue);font-weight:800;'
                  : CLAIM_FLOWS[c.type].indexOf(c.status) > si
                    ? 'color:var(--text-secondary);'
                    : 'color:var(--text-muted);'">
                {{ step }}
              </div>
              <!-- 수거 아이콘: 반품/교환 모두 수거완료 단계에 고정 -->
              <button v-if="c.trackingNo && step==='수거완료' && CLAIM_FLOWS[c.type].indexOf(c.status) >= CLAIM_FLOWS[c.type].indexOf('수거완료')"
                @click.stop="openTracking2(c.courier, c.trackingNo)" title="수거 조회"
                style="margin-top:4px;padding:2px 6px;border-radius:4px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;cursor:pointer;font-size:0.6rem;font-weight:700;white-space:nowrap;display:inline-flex;align-items:center;gap:2px;">
                ↩ 수거
              </button>
              <!-- 교환 배송 아이콘: 발송완료 단계에 고정 (status >= 발송완료) -->
              <button v-if="c.exchangeTrackingNo && step==='발송완료' && CLAIM_FLOWS[c.type].indexOf(c.status) >= CLAIM_FLOWS[c.type].indexOf('발송완료')"
                @click.stop="openTracking2(c.exchangeCourier, c.exchangeTrackingNo)" title="교환 배송 조회"
                style="margin-top:3px;padding:2px 6px;border-radius:4px;border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8;cursor:pointer;font-size:0.6rem;font-weight:700;white-space:nowrap;display:inline-flex;align-items:center;gap:2px;">
                📦 교환
              </button>
            </div>
            <div v-if="si < CLAIM_FLOWS[c.type].length-1"
              style="height:2px;flex:1;margin-bottom:16px;"
              :style="CLAIM_FLOWS[c.type].indexOf(c.status) > si ? 'background:var(--blue);' : 'background:var(--border);'"></div>
          </template>
        </div>
      </div>

      <!-- 상품 목록 -->
      <div v-for="(item, ii) in c.items" :key="ii"
        style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dashed var(--border);">
        <span style="font-size:1.4rem;">{{ item.emoji }}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">{{ item.productName }}</span>
            <button v-if="findProduct(item.productName)" @click="openProductModal(item.productName)"
              style="font-size:0.65rem;padding:0 5px;border:1px solid var(--border);border-radius:4px;background:var(--bg-base);color:var(--text-muted);cursor:pointer;font-weight:600;line-height:1.7;white-space:nowrap;">
              #{{ findProduct(item.productName).productId }}
            </button>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} / {{ item.qty }}개</div>
        </div>
        <div style="font-size:0.88rem;font-weight:700;color:var(--blue);">{{ item.price.toLocaleString() }}원</div>
      </div>

      <!-- 사유 + 교환 정보 -->
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;font-size:0.82rem;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">사유</span>
          <span style="color:var(--text-primary);font-weight:600;">{{ c.reason }}</span>
          <span v-if="c.reasonDetail" style="color:var(--text-secondary);">· {{ c.reasonDetail }}</span>
        </div>
        <!-- 교환 변경 정보 -->
        <div v-if="c.exchangeSize || c.exchangeColor" style="display:flex;gap:8px;">
          <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">교환</span>
          <span style="color:var(--text-primary);">
            <span v-if="c.exchangeSize">사이즈: {{ c.exchangeSize }}</span>
            <span v-if="c.exchangeColor">색상: {{ c.exchangeColor }}</span>
          </span>
        </div>
        <!-- 수거 택배 -->
        <div v-if="c.courier" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">수거</span>
          <span style="color:var(--text-primary);">{{ c.courier }}</span>
          <button v-if="c.trackingNo" @click="openTracking2(c.courier, c.trackingNo)"
            style="padding:2px 8px;border:1.5px solid var(--blue);border-radius:14px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.75rem;font-weight:700;">
            {{ c.trackingNo }}
          </button>
          <span v-if="c.pickupDate" style="color:var(--text-muted);font-size:0.78rem;">수거예정: {{ c.pickupDate }}</span>
        </div>
        <!-- 교환발송 택배 -->
        <div v-if="c.exchangeCourier" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="color:var(--text-muted);flex-shrink:0;min-width:44px;">발송</span>
          <span style="color:var(--text-primary);">{{ c.exchangeCourier }}</span>
          <button v-if="c.exchangeTrackingNo" @click="openTracking2(c.exchangeCourier, c.exchangeTrackingNo)"
            style="padding:2px 8px;border:1.5px solid #22c55e;border-radius:14px;background:transparent;color:#22c55e;cursor:pointer;font-size:0.75rem;font-weight:700;">
            {{ c.exchangeTrackingNo }}
          </button>
        </div>
        <!-- 환불 금액 -->
        <div v-if="c.refundAmount" style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:8px;border-top:1px solid var(--border);">
          <span style="color:var(--text-muted);">{{ c.type === '반품' ? '환불 예정금액' : '취소 환불금액' }}</span>
          <span style="font-size:0.95rem;font-weight:800;color:var(--blue);">{{ c.refundAmount.toLocaleString() }}원</span>
        </div>
        <!-- 환불 내역 -->
        <div v-if="c.refundDetails && c.refundDetails.length"
          style="margin-top:8px;padding:8px 10px;background:var(--bg-base);border-radius:7px;">
          <div style="font-size:0.68rem;font-weight:700;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:5px;">💸 환불 내역</div>
          <div v-for="(rd, rdi) in c.refundDetails" :key="rdi"
            style="display:flex;align-items:center;gap:6px;font-size:0.72rem;padding:2px 0;flex-wrap:wrap;">
            <span style="padding:1px 7px;border-radius:4px;font-weight:700;white-space:nowrap;flex-shrink:0;"
              :style="rd.type==='계좌환불' ? 'background:#dcfce7;color:#16a34a;'
                : rd.type==='카드취소' ? 'background:#dbeafe;color:#1d4ed8;'
                : rd.type==='캐쉬환급' ? 'background:#fef3c7;color:#d97706;'
                : rd.type==='환불처리중' ? 'background:#ffedd5;color:#ea580c;'
                : 'background:#f3f4f6;color:#6b7280;'">
              {{ rd.type }}
            </span>
            <span style="font-weight:700;color:var(--text-primary);white-space:nowrap;">{{ rd.amount.toLocaleString() }}원</span>
            <span v-if="rd.account" style="color:var(--text-secondary);white-space:nowrap;">{{ rd.account }}</span>
            <span v-if="rd.name && rd.type==='계좌환불'" style="color:var(--text-secondary);white-space:nowrap;">· {{ rd.name }}</span>
            <span style="color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ rd.datetime }}</span>
          </div>
        </div>
      </div>
    </div>
    <Pagination :total="filteredClaims.length" :pager="claimPager" />
  </div>

  <!-- ── 장바구니 탭 ── -->
  <div v-else-if="tab==='cart'">
    <div style="margin-bottom:16px;font-size:0.88rem;color:var(--text-secondary);">총 {{ cart.length }}개 상품 ({{ cartTotal.toLocaleString() }}원)</div>
    <div v-if="!cart.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">장바구니가 비어있습니다.</div>
    <div v-for="(item, idx) in cart" :key="idx"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;">
      <span style="font-size:2rem;">{{ item.product.emoji }}</span>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ item.product.productName }}</div>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <span style="background:var(--blue-dim);color:var(--blue);font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;">{{ item.color.name }}</span>
          <span style="background:var(--blue-dim);color:var(--blue);font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;">{{ item.size }}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button @click="updateCartQty(idx,-1)" style="width:28px;height:28px;border:1px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;font-size:0.9rem;color:var(--text-primary);">-</button>
        <span style="min-width:24px;text-align:center;font-weight:600;">{{ item.qty }}</span>
        <button @click="updateCartQty(idx,1)"  style="width:28px;height:28px;border:1px solid var(--border);border-radius:50%;background:var(--bg-card);cursor:pointer;font-size:0.9rem;color:var(--text-primary);">+</button>
      </div>
      <div style="min-width:80px;text-align:right;font-weight:700;color:var(--blue);font-size:0.9rem;">
        {{ (parseInt(item.product.price.replace(/[^0-9]/g,''),10) * item.qty).toLocaleString() }}원
      </div>
      <button @click="removeFromCart(idx)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1rem;padding:4px;">✕</button>
    </div>
    <div v-if="cart.length" style="text-align:right;margin-top:8px;">
      <button @click="navigate('cart')" class="btn-blue" style="padding:12px 28px;">장바구니 페이지로</button>
    </div>
  </div>

  <!-- ── 쿠폰 탭 ── -->
  <div v-else-if="tab==='coupons'">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
      <input v-model="couponCode" type="text" placeholder="쿠폰 코드 입력 (예: SPRING5000)" @keyup.enter="addCoupon"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;text-transform:uppercase;">
      <button @click="addCoupon" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">쿠폰 등록</button>
    </div>
    <PagerHeader :total="coupons.length" :pager="couponPager" />
    <div v-if="!coupons.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">보유 쿠폰이 없습니다.</div>
    <div v-for="c in paginate(coupons, couponPager)" :key="c.couponId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;"
      :style="c.used?'opacity:0.5;':''">
      <div style="font-size:2rem;">🎟️</div>
      <div style="flex:1;">
        <div style="font-weight:700;color:var(--text-primary);">{{ c.name }}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">코드: {{ c.code }} · {{ c.minOrder > 0 ? c.minOrder.toLocaleString()+'원 이상 구매 시' : '최소금액 없음' }} · 만료: {{ c.expiry }}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">
          <span style="font-size:0.72rem;padding:1px 8px;border-radius:10px;font-weight:600;"
            :style="c.discountType==='shipping' ? 'background:#dbeafe;color:#1d4ed8;' : 'background:#dcfce7;color:#15803d;'">
            {{ c.discountType==='shipping' ? '배송비 할인' : '상품 할인' }}
          </span>
          <span v-if="c.applicableTo && c.discountType!=='shipping'"
            style="font-size:0.72rem;padding:1px 8px;border-radius:10px;font-weight:600;background:var(--bg-base);color:var(--text-secondary);border:1px solid var(--border);">
            {{ c.applicableTo }}
          </span>
        </div>
        <template v-if="c.used && c.usedOrderId">
          <div style="font-size:0.73rem;color:var(--text-muted);margin-top:4px;">
            적용 주문: <span style="font-weight:600;color:var(--text-secondary);">{{ c.usedOrderId }}</span>
          </div>
          <div v-if="getCouponUsedOrderItems(c)" style="margin-top:3px;display:flex;flex-wrap:wrap;gap:4px;">
            <span v-for="(item, ii) in getCouponUsedOrderItems(c)" :key="ii"
              style="font-size:0.68rem;padding:1px 6px;border-radius:8px;background:var(--bg-base);color:var(--text-muted);border:1px solid var(--border);">
              {{ item.emoji }} {{ item.productName }}
            </span>
          </div>
        </template>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.1rem;font-weight:800;color:var(--blue);">{{ discountLabel(c) }}</div>
        <div style="font-size:0.78rem;font-weight:600;margin-top:4px;" :style="c.used?'color:#9ca3af;':'color:#22c55e;'">{{ c.used ? '사용됨' : '사용 가능' }}</div>
      </div>
    </div>
    <Pagination :total="coupons.length" :pager="couponPager" />
  </div>

  <!-- ── 캐쉬 탭 ── -->
  <div v-else-if="tab==='cash'">
    <div style="background:linear-gradient(135deg,var(--blue),var(--green));border-radius:var(--radius);padding:24px;margin-bottom:20px;color:#fff;">
      <div style="font-size:0.85rem;font-weight:600;opacity:0.85;">보유 캐쉬</div>
      <div style="font-size:2.2rem;font-weight:900;margin-top:4px;">{{ cashBalance.toLocaleString() }}<span style="font-size:1rem;margin-left:4px;">원</span></div>
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:20px;display:flex;gap:10px;align-items:center;">
      <input v-model="chargeAmount" type="number" placeholder="충전 금액 입력 (최소 1,000원)" @keyup.enter="addCash"
        style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.9rem;outline:none;">
      <button @click="addCash" class="btn-blue" style="padding:10px 20px;white-space:nowrap;">충전하기</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button v-for="amt in [5000,10000,30000,50000]" :key="amt" @click="chargeAmount=amt"
        style="padding:8px 14px;border:1.5px solid var(--border);border-radius:20px;background:var(--bg-card);cursor:pointer;font-size:0.82rem;font-weight:600;color:var(--text-secondary);">
        +{{ amt.toLocaleString() }}원
      </button>
    </div>
    <PagerHeader :total="cashHistory.length" :pager="cashPager" />
    <div v-if="!cashHistory.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">캐쉬 내역이 없습니다.</div>
    <div v-for="h in paginate(cashHistory, cashPager)" :key="h.cashId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;"
        :style="h.type==='충전'?'background:#dcfce7;':'background:#fee2e2;'">
        {{ h.type === '충전' ? '↑' : '↓' }}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.88rem;color:var(--text-primary);">
          <template v-if="extractOrderId(h.desc)">
            <button @click="openOrderModal(extractOrderId(h.desc))"
              style="background:none;border:none;padding:0;cursor:pointer;font-size:0.88rem;font-weight:700;color:var(--blue);text-decoration:underline;text-underline-offset:2px;">
              {{ extractOrderId(h.desc) }}
            </button>
            <span style="font-weight:400;color:var(--text-secondary);"> {{ h.desc.replace(extractOrderId(h.desc), '').trim() }}</span>
          </template>
          <template v-else>{{ h.desc }}</template>
        </div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ h.date }}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:800;font-size:0.95rem;" :style="h.type==='충전'?'color:#22c55e;':'color:#ef4444;'">
          {{ h.type==='충전' ? '+' : '' }}{{ h.amount.toLocaleString() }}원
        </div>
      </div>
    </div>
    <Pagination :total="cashHistory.length" :pager="cashPager" />
  </div>

  <!-- ── 문의 탭 ── -->
  <div v-else-if="tab==='inquiries'">
    <PagerHeader :total="inquiries.length" :pager="inquiryPager" />
    <div v-if="!inquiries.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">문의 내역이 없습니다.</div>
    <div v-for="q in paginate(inquiries, inquiryPager)" :key="q.inquiryId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="flex:1;cursor:pointer;" @click="expandedInquiry = expandedInquiry===q.inquiryId ? null : q.inquiryId">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:0.75rem;font-weight:700;padding:3px 8px;border-radius:20px;color:#fff;"
              :style="'background:'+inquiryStatusColor(q.status)">{{ q.status }}</span>
            <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.category }}</span>
            <span style="font-size:0.78rem;color:var(--text-muted);">{{ q.date }}</span>
          </div>
          <div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">{{ q.title }}</div>
        </div>
        <button v-if="q.status==='요청'" @click="cancelInquiry(q.inquiryId)"
          style="padding:6px 14px;border:1.5px solid #ef4444;border-radius:6px;background:transparent;color:#ef4444;cursor:pointer;font-size:0.8rem;font-weight:600;white-space:nowrap;">취소</button>
      </div>
      <div v-if="expandedInquiry===q.inquiryId" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
        <div style="background:var(--bg-base);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">{{ q.content }}</div>
        <div v-if="q.answer" style="background:var(--blue-dim);border-radius:6px;padding:12px;font-size:0.85rem;color:var(--text-primary);">
          <span style="font-size:0.78rem;font-weight:700;color:var(--blue);display:block;margin-bottom:4px;">📩 답변</span>
          {{ q.answer }}
        </div>
      </div>
    </div>
    <Pagination :total="inquiries.length" :pager="inquiryPager" />
  </div>

  <!-- ── 채팅 탭 ── -->
  <div v-else-if="tab==='chats'">
    <PagerHeader :total="chats.length" :pager="chatPager" />
    <div v-if="!chats.length" style="text-align:center;padding:60px 0;color:var(--text-muted);">채팅 내역이 없습니다.</div>
    <div v-for="c in paginate(chats, chatPager)" :key="c.chatId"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:10px;overflow:hidden;">
      <div style="padding:16px;cursor:pointer;display:flex;align-items:center;gap:12px;" @click="openChat(c)">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--blue-dim);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">💬</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-weight:700;font-size:0.9rem;color:var(--text-primary);">{{ c.subject }}</span>
            <span v-if="c.unread>0" style="background:var(--blue);color:#fff;font-size:0.7rem;padding:1px 7px;border-radius:20px;font-weight:700;">{{ c.unread }}</span>
            <span style="font-size:0.75rem;padding:2px 8px;border-radius:20px;font-weight:600;"
              :style="c.status==='진행중'?'background:#dcfce7;color:#166534;':'background:var(--blue-dim);color:var(--text-muted);'">{{ c.status }}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ c.lastMsg || '새 채팅' }}</div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;flex-shrink:0;">{{ c.date }}</div>
      </div>
      <div v-if="expandedChat===c.chatId" style="padding:0 16px 16px;border-top:1px solid var(--border);">
        <div v-for="(msg, mi) in c.messages" :key="mi"
          style="display:flex;margin-top:10px;"
          :style="msg.from==='user'?'justify-content:flex-end;':''">
          <div style="max-width:75%;padding:10px 14px;border-radius:16px;font-size:0.85rem;line-height:1.5;"
            :style="msg.from==='user'?'background:var(--blue);color:#fff;border-bottom-right-radius:4px;':'background:var(--bg-base);color:var(--text-primary);border-bottom-left-radius:4px;'">
            <div>{{ msg.text }}</div>
            <div style="font-size:0.72rem;margin-top:4px;text-align:right;"
              :style="msg.from==='user'?'color:rgba(255,255,255,0.7);':'color:var(--text-muted);'">{{ msg.time }}</div>
          </div>
        </div>
      </div>
    </div>
    <Pagination :total="chats.length" :pager="chatPager" />
  </div>

  <Teleport to="body">
  <div v-if="flowHelpOpen" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;"
    @click.self="flowHelpOpen=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:1px solid var(--border);overflow:hidden;" @click.stop role="dialog" aria-modal="true">

      <!-- 모달 헤더 -->
      <div style="padding:18px 20px 0;flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.1rem;">📋</span>
            <span style="font-size:1.05rem;font-weight:800;color:var(--text-primary);">주문 · 클레임 도움말</span>
          </div>
          <button type="button" @click="flowHelpOpen=false" aria-label="닫기"
            style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
        </div>
        <!-- 탭 -->
        <div style="display:flex;gap:0;border-bottom:2px solid var(--border);">
          <button v-for="t in [{id:'order',label:'주문',icon:'📦'},{id:'cancel',label:'취소',icon:'🚫'},{id:'return',label:'반품',icon:'↩️'},{id:'exchange',label:'교환',icon:'🔄'}]"
            :key="t.id" type="button"
            @click="helpTab=t.id"
            style="padding:8px 14px;border:none;cursor:pointer;font-size:0.82rem;font-weight:700;background:none;position:relative;transition:color 0.15s;white-space:nowrap;"
            :style="helpTab===t.id ? 'color:var(--blue);' : 'color:var(--text-muted);'">
            {{ t.icon }} {{ t.label }}
            <span v-if="helpTab===t.id" style="position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--blue);border-radius:2px;"></span>
          </button>
        </div>
      </div>

      <!-- 탭 콘텐츠 -->
      <div style="padding:18px 20px 20px;overflow-y:auto;flex:1;">

        <!-- ── 주문 탭 ── -->
        <div v-if="helpTab==='order'">
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0 0 14px;line-height:1.5;">주문 접수부터 구매확정까지 아래 순서로 진행됩니다.</p>
          <div v-for="s in [
            {icon:'📋',status:'주문완료',color:'#3b82f6',desc:'주문이 접수되었습니다. 계좌이체의 경우 입금 확인 후 다음 단계로 넘어갑니다.',tip:'주문완료·결제완료 상태에서만 주문 취소가 가능합니다.'},
            {icon:'💳',status:'결제완료',color:'#8b5cf6',desc:'입금 확인 또는 카드/캐쉬 결제가 완료되어 상품 준비를 시작합니다.',tip:null},
            {icon:'📦',status:'배송준비중',color:'#f59e0b',desc:'주문하신 상품을 포장하고 출고 준비 중입니다. 이 단계부터는 주문 취소가 불가합니다.',tip:'취소가 필요하면 배송완료 후 반품으로 처리해 주세요.'},
            {icon:'🚚',status:'배송중',color:'#f97316',desc:'택배사에 인계되어 배송지로 이동 중입니다. 운송장 번호로 배송 조회가 가능합니다.',tip:null},
            {icon:'✅',status:'배송완료',color:'#22c55e',desc:'상품이 배송지에 도착했습니다. 교환·반품 신청은 수령 후 7일 이내에 해주세요.',tip:'배송완료 상태에서 교환신청·반품신청·구매확정 버튼이 활성화됩니다.'},
            {icon:'🏁',status:'구매확정',color:'#6b7280',desc:'거래가 최종 확정되었습니다. 구매확정 후에는 교환·반품 신청이 불가합니다.',tip:'배송완료 후 미확정 시 14일 후 자동 구매확정 처리됩니다.'}
          ]" :key="s.status" style="display:flex;gap:12px;margin-bottom:14px;">
            <div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;" :style="'background:'+s.color+'22;'">{{ s.icon }}</div>
            <div style="flex:1;">
              <div style="font-size:0.85rem;font-weight:800;margin-bottom:3px;" :style="'color:'+s.color">{{ s.status }}</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;">{{ s.desc }}</div>
              <div v-if="s.tip" style="margin-top:4px;font-size:0.73rem;color:#f59e0b;background:#fef3c7;padding:3px 8px;border-radius:4px;display:inline-block;">💡 {{ s.tip }}</div>
            </div>
          </div>
        </div>

        <!-- ── 취소 탭 ── -->
        <div v-else-if="helpTab==='cancel'">
          <div style="background:#fee2e2;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
            <div style="font-size:0.82rem;font-weight:800;color:#dc2626;margin-bottom:4px;">🚫 취소 신청 안내</div>
            <div style="font-size:0.76rem;color:#7f1d1d;line-height:1.55;">주문완료 또는 결제완료 상태일 때만 취소 신청이 가능합니다.<br>배송준비중 이후에는 반품으로 처리해 주세요.</div>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['취소요청','취소처리중','취소완료']" :key="st" style="display:flex;align-items:center;gap:6px;">
              <span style="padding:4px 10px;border-radius:20px;font-size:0.76rem;font-weight:700;background:#fee2e2;color:#dc2626;">{{ st }}</span>
              <span v-if="i<2" style="color:var(--text-muted);font-size:0.8rem;">→</span>
            </span>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">환불 안내</div>
          <div v-for="r in [
            {method:'카드결제',desc:'결제 취소 처리 후 카드사 정책에 따라 3~5 영업일 내 환불됩니다.'},
            {method:'계좌이체',desc:'취소 확인 후 입금하신 계좌로 1~3 영업일 내 환불됩니다.'},
            {method:'캐쉬',desc:'즉시 캐쉬 잔액으로 환급됩니다.'}
          ]" :key="r.method" style="display:flex;gap:10px;margin-bottom:8px;font-size:0.78rem;">
            <span style="font-weight:700;color:var(--text-primary);min-width:56px;flex-shrink:0;">{{ r.method }}</span>
            <span style="color:var(--text-secondary);line-height:1.5;">{{ r.desc }}</span>
          </div>
          <div style="margin-top:12px;background:#fef3c7;border-radius:8px;padding:10px 14px;">
            <div style="font-size:0.76rem;color:#92400e;line-height:1.6;">
              💡 <strong>취소 불가 경우</strong><br>
              · 배송준비중 이후 단계<br>
              · 이미 클레임(반품·교환)이 진행 중인 경우
            </div>
          </div>
        </div>

        <!-- ── 반품 탭 ── -->
        <div v-else-if="helpTab==='return'">
          <div style="background:#fff7ed;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
            <div style="font-size:0.82rem;font-weight:800;color:#ea580c;margin-bottom:4px;">↩️ 반품 신청 안내</div>
            <div style="font-size:0.76rem;color:#7c2d12;line-height:1.55;">배송완료 후 <strong>7일 이내</strong>에 신청해야 합니다.<br>미착용·미세탁·태그 부착 상태여야 합니다.</div>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['반품요청','수거예정','수거완료','환불처리중','환불완료']" :key="st" style="display:flex;align-items:center;gap:4px;">
              <span style="padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;background:#fff7ed;color:#ea580c;">{{ st }}</span>
              <span v-if="i<4" style="color:var(--text-muted);font-size:0.75rem;">→</span>
            </span>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">배송비 안내</div>
          <div v-for="r in [
            {case:'상품 불량·오배송',fee:'무료 (왕복 배송비 당사 부담)'},
            {case:'단순 변심·사이즈 불일치',fee:'왕복 배송비 고객 부담 (약 5,000~6,000원)'}
          ]" :key="r.case" style="display:flex;gap:10px;margin-bottom:8px;font-size:0.78rem;">
            <span style="font-weight:700;color:var(--text-primary);min-width:80px;flex-shrink:0;line-height:1.5;">{{ r.case }}</span>
            <span style="color:var(--text-secondary);line-height:1.5;">{{ r.fee }}</span>
          </div>
          <div style="margin-top:12px;background:#fee2e2;border-radius:8px;padding:10px 14px;">
            <div style="font-size:0.76rem;color:#7f1d1d;line-height:1.6;">
              ⛔ <strong>반품 불가 경우</strong><br>
              · 수령 후 7일 초과<br>
              · 착용·세탁 또는 태그 제거<br>
              · 고객 과실로 인한 상품 훼손<br>
              · 구매확정 완료 후
            </div>
          </div>
        </div>

        <!-- ── 교환 탭 ── -->
        <div v-else-if="helpTab==='exchange'">
          <div style="background:#eff6ff;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
            <div style="font-size:0.82rem;font-weight:800;color:#1d4ed8;margin-bottom:4px;">🔄 교환 신청 안내</div>
            <div style="font-size:0.76rem;color:#1e3a8a;line-height:1.55;">배송완료 후 <strong>7일 이내</strong>에 신청해야 합니다.<br>동일 상품의 사이즈·색상 교환만 가능합니다.</div>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">진행 흐름</div>
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
            <span v-for="(st,i) in ['교환요청','수거예정','수거완료','상품준비중','발송완료','교환완료']" :key="st" style="display:flex;align-items:center;gap:4px;">
              <span style="padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;background:#eff6ff;color:#1d4ed8;">{{ st }}</span>
              <span v-if="i<5" style="color:var(--text-muted);font-size:0.75rem;">→</span>
            </span>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">배송비 안내</div>
          <div v-for="r in [
            {case:'상품 불량·오배송',fee:'무료 (왕복 배송비 당사 부담)'},
            {case:'단순 변심·사이즈 불일치',fee:'왕복 배송비 고객 부담 (약 5,000~6,000원)'}
          ]" :key="r.case" style="display:flex;gap:10px;margin-bottom:8px;font-size:0.78rem;">
            <span style="font-weight:700;color:var(--text-primary);min-width:80px;flex-shrink:0;line-height:1.5;">{{ r.case }}</span>
            <span style="color:var(--text-secondary);line-height:1.5;">{{ r.fee }}</span>
          </div>
          <div style="margin-top:12px;background:#fef3c7;border-radius:8px;padding:10px 14px;">
            <div style="font-size:0.76rem;color:#92400e;line-height:1.6;">
              💡 <strong>교환 관련 유의사항</strong><br>
              · 재고 부족 시 교환 불가 (환불로 전환)<br>
              · 교환 상품 발송 후 추가 교환 불가<br>
              · 착용·세탁 또는 태그 제거 시 불가<br>
              · 구매확정 완료 후 신청 불가
            </div>
          </div>
        </div>

      </div>

      <!-- 모달 푸터 -->
      <div style="padding:12px 20px;border-top:1px solid var(--border);flex-shrink:0;">
        <button type="button" @click="flowHelpOpen=false" class="btn-blue"
          style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;">확인</button>
      </div>
    </div>
  </div>
  <!-- ── 교환·반품 신청 모달 ── -->
  <div v-if="claimModal.show" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;"
    @click.self="claimModal.show=false">
    <div style="background:var(--bg-card);border-radius:var(--radius);width:100%;max-width:480px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:1px solid var(--border);overflow:hidden;" @click.stop>

      <!-- 헤더 -->
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <span style="font-size:1rem;font-weight:800;color:var(--text-primary);">
            {{ claimModal.type==='exchange' ? '🔄 교환 신청' : '↩️ 반품 신청' }}
          </span>
          <span style="margin-left:8px;font-size:0.75rem;color:var(--text-muted);">{{ claimModal.orderId }}</span>
        </div>
        <button type="button" @click="claimModal.show=false" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);padding:4px;line-height:1;">✕</button>
      </div>

      <!-- 콘텐츠 -->
      <div style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:18px;">

        <!-- 신청 사유 -->
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">신청 사유 <span style="color:#ef4444;">*</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="r in (claimModal.type==='exchange' ? EXCHANGE_REASONS : RETURN_REASONS)" :key="r"
              type="button" @click="claimModal.reason=r; claimModal.selectedCouponId=null"
              style="padding:6px 14px;border-radius:20px;cursor:pointer;font-size:0.78rem;font-weight:600;transition:all 0.15s;"
              :style="claimModal.reason===r
                ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);'
                : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
              {{ r }}
            </button>
          </div>
        </div>

        <!-- 상세 사유 -->
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">상세 내용 <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted);">(선택)</span></div>
          <textarea v-model="claimModal.reasonDetail" rows="2" placeholder="상세 내용을 입력해 주세요."
            style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.8rem;resize:none;box-sizing:border-box;outline:none;"></textarea>
        </div>

        <!-- 교환 상품 선택 (2개 이상인 경우) -->
        <div v-if="claimModal.type==='exchange' && claimModal.order && claimModal.order.items.length > 1">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">교환 상품 선택 <span style="color:#ef4444;">*</span></div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <button v-for="(item, idx) in claimModal.order.items" :key="idx"
              type="button"
              @click="claimModal.exchangeItemIdx=idx; claimModal.exchangeSize=''; claimModal.exchangeColor=''"
              style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;transition:all 0.15s;text-align:left;width:100%;"
              :style="claimModal.exchangeItemIdx===idx
                ? 'background:var(--blue-dim);border:1.5px solid var(--blue);'
                : 'background:var(--bg-base);border:1.5px solid var(--border);'">
              <span style="font-size:1.2rem;flex-shrink:0;">{{ item.emoji }}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                  :style="claimModal.exchangeItemIdx===idx ? 'color:var(--blue);' : 'color:var(--text-primary);'">
                  {{ item.productName }}
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);">{{ item.color }} / {{ item.size }} · {{ item.price.toLocaleString() }}원</div>
              </div>
              <span v-if="claimModal.exchangeItemIdx===idx" style="color:var(--blue);font-size:1rem;flex-shrink:0;">✓</span>
            </button>
          </div>
        </div>

        <!-- 교환 옵션 -->
        <div v-if="claimModal.type==='exchange'" style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">교환 옵션 <span style="color:#ef4444;">*</span>
            <span v-if="claimModal.order && claimModal.order.items.length > 1" style="font-size:0.72rem;font-weight:400;color:var(--text-muted);margin-left:6px;">
              ({{ claimModal.order.items[claimModal.exchangeItemIdx]?.productName }})
            </span>
          </div>
          <!-- 사이즈 -->
          <div v-if="claimModalProduct && claimModalProduct.sizes">
            <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:5px;">사이즈</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              <button v-for="sz in claimModalProduct.sizes" :key="sz" type="button"
                @click="claimModal.exchangeSize = claimModal.exchangeSize===sz ? '' : sz"
                style="padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;transition:all 0.15s;"
                :style="claimModal.exchangeSize===sz
                  ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);'
                  : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
                {{ sz }}
              </button>
            </div>
          </div>
          <!-- 색상 -->
          <div v-if="claimModalProduct && claimModalProduct.colors">
            <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:5px;">색상</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <button v-for="col in claimModalProduct.colors" :key="col.name" type="button"
                @click="claimModal.exchangeColor = claimModal.exchangeColor===col.name ? '' : col.name"
                style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;transition:all 0.15s;"
                :style="claimModal.exchangeColor===col.name
                  ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);'
                  : 'background:var(--bg-base);color:var(--text-secondary);border:1.5px solid var(--border);'">
                <span style="width:10px;height:10px;border-radius:50%;flex-shrink:0;border:1px solid rgba(0,0,0,0.15);" :style="'background:'+col.hex"></span>
                {{ col.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 배송비 안내 -->
        <div>
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">배송비 안내</div>
          <div v-if="!claimModal.reason" style="font-size:0.78rem;color:var(--text-muted);padding:10px;background:var(--bg-base);border-radius:8px;">
            사유를 선택하면 배송비가 안내됩니다.
          </div>
          <template v-else>
            <div v-if="claimShippingFee===0"
              style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#dcfce7;border-radius:8px;margin-bottom:8px;">
              <span style="font-size:1rem;">✅</span>
              <div>
                <div style="font-size:0.82rem;font-weight:800;color:#16a34a;">배송비 무료</div>
                <div style="font-size:0.73rem;color:#15803d;margin-top:1px;">상품 불량·오배송의 경우 왕복 배송비를 당사가 부담합니다.</div>
              </div>
            </div>
            <div v-else style="padding:10px 14px;background:#fff7ed;border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:0.82rem;font-weight:700;color:#ea580c;">왕복 배송비 (고객 부담)</span>
                <span style="font-size:0.9rem;font-weight:800;color:#ea580c;">{{ claimShippingFee.toLocaleString() }}원</span>
              </div>
              <div style="font-size:0.72rem;color:#9a3412;">단순 변심·사이즈 불일치 등은 왕복 배송비가 고객 부담입니다.</div>
            </div>

            <!-- 쿠폰 선택 -->
            <div v-if="claimShippingFee>0">
              <div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);margin-bottom:6px;">🎟 배송비 쿠폰 적용</div>
              <div v-if="!applicableCoupons.length" style="font-size:0.75rem;color:var(--text-muted);padding:8px 12px;background:var(--bg-base);border-radius:6px;">
                사용 가능한 쿠폰이 없습니다.
              </div>
              <div v-else style="display:flex;flex-direction:column;gap:5px;">
                <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);background:var(--bg-base);"
                  :style="claimModal.selectedCouponId===null ? 'border-color:var(--border);' : ''">
                  <input type="radio" :value="null" v-model="claimModal.selectedCouponId" style="accent-color:var(--blue);">
                  <span style="font-size:0.78rem;color:var(--text-secondary);">쿠폰 사용 안함</span>
                </label>
                <label v-for="cp in applicableCoupons" :key="cp.couponId"
                  style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;border:1.5px solid var(--border);"
                  :style="claimModal.selectedCouponId===cp.couponId ? 'border-color:var(--blue);background:var(--blue-dim);' : 'background:var(--bg-base);'">
                  <input type="radio" :value="cp.couponId" v-model="claimModal.selectedCouponId" style="accent-color:var(--blue);">
                  <div style="flex:1;">
                    <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">{{ cp.name }}</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">{{ discountLabel(cp) }} · 만료 {{ cp.expiry }}</div>
                  </div>
                  <span style="font-size:0.78rem;font-weight:800;color:var(--blue);">{{ discountLabel(cp) }}</span>
                </label>
              </div>

              <!-- 최종 배송비 -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:8px 12px;background:var(--bg-base);border-radius:8px;border:1px solid var(--border);">
                <span style="font-size:0.8rem;color:var(--text-secondary);">최종 배송비</span>
                <span style="font-size:0.92rem;font-weight:800;" :style="claimFinalFee===0 ? 'color:#16a34a;' : 'color:#ea580c;'">
                  {{ claimFinalFee===0 ? '무료' : claimFinalFee.toLocaleString()+'원' }}
                </span>
              </div>

              <!-- 입금 계좌 안내 -->
              <div v-if="claimFinalFee>0" style="margin-top:10px;padding:10px 14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
                <div style="font-size:0.76rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;">🏦 배송비 입금 안내</div>
                <div style="font-size:0.8rem;color:#1e40af;font-weight:700;margin-bottom:2px;">{{ config.bank.name }} {{ config.bank.account }}</div>
                <div style="font-size:0.75rem;color:#3730a3;">예금주: {{ config.bank.holder }}</div>
                <div style="margin-top:6px;font-size:0.72rem;color:#1d4ed8;line-height:1.5;">
                  · 신청 후 <strong>3 영업일 이내</strong> 미입금 시 신청이 자동 취소됩니다.<br>
                  · 입금자명은 <strong>주문자 성함</strong>으로 해주세요.
                </div>
              </div>
            </div>
          </template>
        </div>

      </div>

      <!-- 푸터 -->
      <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;">
        <button type="button" @click="claimModal.show=false"
          style="flex:1;padding:10px;border:1.5px solid var(--border);border-radius:8px;background:transparent;color:var(--text-secondary);cursor:pointer;font-size:0.88rem;font-weight:700;">
          취소
        </button>
        <button type="button" @click="submitClaimModal"
          style="flex:2;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:700;color:#fff;"
          :style="claimModal.type==='exchange' ? 'background:#3b82f6;' : 'background:#f97316;'">
          {{ claimModal.type==='exchange' ? '교환 신청하기' : '반품 신청하기' }}
        </button>
      </div>
    </div>
  </div>
  <!-- ── 주문 상세 모달 (캐쉬 클릭 연동) ── -->
  <OrderDetailModal :show="orderDetailModal.show" :order="orderDetailModal.order" @close="orderDetailModal.show=false" />
  <!-- ── 상품 상세 모달 ── -->
  <ProductModal :show="productModal.show" :product="productModal.product" @close="productModal.show=false" />
  <!-- ── 주문자 정보 모달 ── -->
  <CustomerModal :show="customerModal.show" :user="customerModal.user" :order="customerModal.order" @close="customerModal.show=false" />

  </Teleport>

</div>
  `,
  components: {
    PagerHeader: {
      props: ['total', 'pager'],
      template: `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
  <div style="font-size:0.85rem;color:var(--text-secondary);">총 <strong style="color:var(--text-primary);">{{ total }}</strong>건</div>
  <select v-model="pager.size" @change="pager.page=1"
    style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);font-size:0.82rem;cursor:pointer;">
    <option :value="5">5개씩</option>
    <option :value="10">10개씩</option>
    <option :value="20">20개씩</option>
    <option :value="30">30개씩</option>
    <option :value="50">50개씩</option>
    <option :value="100">100개씩</option>
  </select>
</div>`
    },
    Pagination: {
      props: ['total', 'pager'],
      setup(props) {
        const pages = Vue.computed(() => {
          const t = Math.max(1, Math.ceil(props.total / props.pager.size));
          return Array.from({ length: t }, (_, i) => i + 1);
        });
        return { pages };
      },
      template: `
<div v-if="pages.length>1" style="display:flex;gap:6px;justify-content:center;margin-top:20px;flex-wrap:wrap;">
  <button @click="pager.page=Math.max(1,pager.page-1)" :disabled="pager.page===1"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===1?'opacity:0.4;cursor:not-allowed;':''">‹</button>
  <button v-for="p in pages" :key="p" @click="pager.page=p"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:0.82rem;min-width:36px;"
    :style="pager.page===p?'background:var(--blue);color:#fff;border-color:var(--blue);font-weight:700;':'background:var(--bg-card);color:var(--text-secondary);'">{{ p }}</button>
  <button @click="pager.page=Math.min(pages.length,pager.page+1)" :disabled="pager.page===pages.length"
    style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);cursor:pointer;color:var(--text-secondary);font-size:0.82rem;"
    :style="pager.page===pages.length?'opacity:0.4;cursor:not-allowed;':''">›</button>
</div>`
    },
    OrderDetailModal: window.OrderDetailModal,
    ProductModal:     window.ProductModal,
    CustomerModal:    window.CustomerModal,
  }
};
