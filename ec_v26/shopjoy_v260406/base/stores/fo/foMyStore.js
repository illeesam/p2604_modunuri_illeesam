/* ShopJoy - FO My Page Store (Pinia) */
window.useFoMyStore = Pinia.defineStore('foMy', () => {
  const { ref, reactive, computed } = Vue;

  /* ── 클레임 상수 ── */
  const CLAIM_FLOWS = {
    '취소': ['취소요청', '취소처리중', '취소완료'],
    '반품': ['반품요청', '수거예정', '수거중', '수거완료', '환불처리중', '환불완료'],
    '교환': ['교환요청', '수거예정', '수거중', '수거완료', '상품준비중', '발송중', '발송완료', '교환완료'],
  };
  const CLAIM_DONE = ['취소완료', '환불완료', '교환완료'];
  const CLAIM_TYPE_COLOR = { '취소': '#ef4444', '반품': '#FFBB00', '교환': '#3b82f6' };
  const CLAIM_STATUS_COLOR = s => ({
    '취소요청':'#ef4444','취소처리중':'#f97316','취소완료':'#9ca3af',
    '반품요청':'#ef4444','수거예정':'#f59e0b','수거중':'#fb923c','수거완료':'#8b5cf6','환불처리중':'#f97316','환불완료':'#9ca3af',
    '교환요청':'#3b82f6','상품준비중':'#f59e0b','발송중':'#14b8a6','발송완료':'#22c55e','교환완료':'#9ca3af',
  }[s] || '#9ca3af');

  /* ── 주문 상태 흐름 ── */
  const ORDER_FLOW = [
    { status: '주문완료',   icon: '📋' },
    { status: '결제완료',   icon: '💳' },
    { status: '배송준비중', icon: '📦' },
    { status: '배송중',     icon: '🚚' },
    { status: '배송완료',   icon: '✅' },
    { status: '완료',       label: '구매확정', icon: '🏁' },
  ];
  const CANCELABLE   = ['주문완료', '결제완료'];
  const SHOW_COURIER = ['배송준비중', '배송중', '배송완료', '완료'];
  const orderStatusLabel = s => (s === '완료' ? '구매확정' : s);
  const statusColor = s => ({
    '주문완료':'#3b82f6','결제완료':'#8b5cf6','배송준비중':'#f59e0b','배송중':'#f97316',
    '배송완료':'#22c55e','완료':'#6b7280','교환요청':'#f59e0b','반품요청':'#f97316','취소됨':'#9ca3af',
  }[s] || '#9ca3af');

  /* ── 주문 ── */
  const orders = reactive([]);
  const loadOrders = async () => {
    if (!Array.isArray(orders) || !orders.length) {
      if (!Array.isArray(orders)) Object.assign(orders, []);
      try { const res = await window.foApi.get('/fo/my/order/list'); orders.splice(0, orders.length, ...(res.data?.data || [])); }
      catch (e) { orders.splice(0, orders.length); }
    }
  };
  const setOrderStatus = (orderId, status) => {
    const o = orders.find(x => x.orderId === orderId);
    if (o) o.status = status;
  };

  /* ── 클레임 ── */
  const claims = reactive([]);
  const claimFilter = ref('전체');
  const loadClaims = async () => {
    if (!Array.isArray(claims) || !claims.length) {
      if (!Array.isArray(claims)) Object.assign(claims, []);
      try { const res = await window.foApi.get('/fo/my/claim/list'); claims.splice(0, claims.length, ...(res.data?.data || [])); }
      catch (e) { claims.splice(0, claims.length); }
    }
  };
  const filteredClaims = computed(() =>
    claimFilter.value === '전체' ? claims : claims.filter(c => c.type === claimFilter.value)
  );
  const claimsByOrderId = computed(() => {
    const map = {};
    claims.forEach(c => { map[c.orderId] = c; });
    return map;
  });
  const removeClaim = (claimId) => {
    const idx = claims.findIndex(c => c.claimId === claimId);
    if (idx !== -1) claims.splice(idx, 1);
  };

  /* ── 쿠폰 ── */
  const coupons = reactive([]);
  const couponCode = ref('');
  const loadCoupons = async () => {
    if (!Array.isArray(coupons) || !coupons.length) {
      if (!Array.isArray(coupons)) Object.assign(coupons, []);
      try { const res = await window.foApi.get('/fo/my/coupon/list'); coupons.splice(0, coupons.length, ...(res.data?.data || [])); }
      catch (e) { coupons.splice(0, coupons.length); }
    }
  };
  const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '% 할인'
    : c.discountType === 'shipping' ? '무료배송'
    : c.discountValue.toLocaleString() + '원 할인';

  /* ── 캐쉬 ── */
  const cashBalance = ref(0);
  const cashHistory = reactive([]);
  const chargeAmount = ref('');
  const loadCash = async () => {
    if (!Array.isArray(cashHistory) || !cashHistory.length) {
      if (!Array.isArray(cashHistory)) Object.assign(cashHistory, []);
      try {
        const res = await window.foApi.get('/fo/my/cash/info');
        cashBalance.value = res.data?.data?.balance || 0;
        cashHistory.splice(0, cashHistory.length, ...(res.data?.data?.history || []));
      } catch (e) {}
    }
  };

  /* ── 문의 ── */
  const inquiries = reactive([]);
  const expandedInquiry = ref(null);
  const loadInquiries = async () => {
    if (!Array.isArray(inquiries) || !inquiries.length) {
      if (!Array.isArray(inquiries)) Object.assign(inquiries, []);
      try { const res = await window.foApi.get('/fo/my/inquiry/list'); inquiries.splice(0, inquiries.length, ...(res.data?.data || [])); }
      catch (e) { inquiries.splice(0, inquiries.length); }
    }
  };
  const inquiryStatusColor = s => ({ '요청':'#3b82f6','처리중':'#f97316','답변완료':'#22c55e','취소됨':'#9ca3af' }[s] || '#9ca3af');

  /* ── 채팅 ── */
  const chats = reactive([]);
  const expandedChat = ref(null);
  const loadChats = async () => {
    if (!Array.isArray(chats) || !chats.length) {
      if (!Array.isArray(chats)) Object.assign(chats, []);
      try { const res = await window.foApi.get('/fo/my/chat/list'); chats.splice(0, chats.length, ...(res.data?.data || [])); }
      catch (e) { chats.splice(0, chats.length); }
    }
  };
  const openChat = chat => {
    chat.unread = 0;
    expandedChat.value = expandedChat.value === chat.chatId ? null : chat.chatId;
  };

  /* ── 공유 모달 ── */
  const orderDetailModal = reactive({ show: false, order: null });
  const openOrderModal = (orderId) => {
    const o = orders.value.find(x => x.orderId === orderId);
    if (!o) return false;
    orderDetailModal.order = o;
    orderDetailModal.show = true;
    return true;
  };
  const productModal = reactive({ show: false, product: null });
  const customerModal = reactive({ show: false, user: null, order: null });

  /* ── 공통 유틸 ── */
  const paginate = (list, pager) => {
    const start = (pager.page - 1) * pager.size;
    return list.slice(start, start + pager.size);
  };
  const mkPager = () => reactive({ page: 1, size: 50 });
  const extractOrderId = desc => {
    const m = (desc || '').match(/ORD-\d{4}-\d{3,}/);
    return m ? m[0] : null;
  };
  const getCouponUsedOrderItems = c => {
    if (!c.used || !c.usedOrderId) return null;
    const o = orders.find(x => x.orderId === c.usedOrderId);
    return o ? o.items : null;
  };

  /* ── 탭 카운트 (cartCount는 외부 주입) ── */
  const getTabCounts = (cartCount) => ({
    myOrder:   Array.isArray(orders) ? orders.length : 0,
    myClaim:   Array.isArray(claims) ? claims.filter(c => !CLAIM_DONE.includes(c.status)).length : 0,
    myCart:    cartCount || 0,
    myCoupon:  Array.isArray(coupons) ? coupons.filter(c => !c.used).length : 0,
    myCache:   null,
    myContact: Array.isArray(inquiries) ? inquiries.filter(q => q.status === '요청' || q.status === '처리중').length : 0,
    myChatt:   Array.isArray(chats) ? chats.reduce((s, c) => s + (c.unread || 0), 0) : 0,
  });

  return {
    /* 상수 */
    ORDER_FLOW, CANCELABLE, SHOW_COURIER, orderStatusLabel, statusColor,
    CLAIM_FLOWS, CLAIM_DONE, CLAIM_TYPE_COLOR, CLAIM_STATUS_COLOR,
    /* 주문 */
    orders, loadOrders, setOrderStatus,
    /* 클레임 */
    claims, claimFilter, filteredClaims, claimsByOrderId, loadClaims, removeClaim,
    /* 쿠폰 */
    coupons, couponCode, loadCoupons, discountLabel,
    /* 캐쉬 */
    cashBalance, cashHistory, chargeAmount, loadCash,
    /* 문의 */
    inquiries, expandedInquiry, loadInquiries, inquiryStatusColor,
    /* 채팅 */
    chats, expandedChat, loadChats, openChat,
    /* 공유 모달 */
    orderDetailModal, openOrderModal,
    productModal, customerModal,
    /* 유틸 */
    paginate, mkPager, extractOrderId, getCouponUsedOrderItems, discountLabel,
    getTabCounts,
  };
});
