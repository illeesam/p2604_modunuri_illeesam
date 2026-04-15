/* ShopJoy - My Page Store (Pinia) */
window.useFrontMyStore = Pinia.defineStore('frontMy', () => {
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
  const orders = ref([]);
  const loadOrders = async () => {
    if (orders.value.length) return;
    try { const res = await window.frontApi.get('my/orders.json'); orders.value = res.data; }
    catch (e) { orders.value = []; }
  };
  const setOrderStatus = (orderId, status) => {
    const o = orders.value.find(x => x.orderId === orderId);
    if (o) o.status = status;
  };

  /* ── 클레임 ── */
  const claims = ref([]);
  const claimFilter = ref('전체');
  const loadClaims = async () => {
    if (claims.value.length) return;
    try { const res = await window.frontApi.get('my/claims.json'); claims.value = res.data; }
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
  const removeClaim = (claimId) => {
    claims.value = claims.value.filter(c => c.claimId !== claimId);
  };

  /* ── 쿠폰 ── */
  const coupons = ref([]);
  const couponCode = ref('');
  const loadCoupons = async () => {
    if (coupons.value.length) return;
    try { const res = await window.frontApi.get('my/coupons.json'); coupons.value = res.data; }
    catch (e) { coupons.value = []; }
  };
  const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '% 할인'
    : c.discountType === 'shipping' ? '무료배송'
    : c.discountValue.toLocaleString() + '원 할인';

  /* ── 캐쉬 ── */
  const cashBalance = ref(0);
  const cashHistory = ref([]);
  const chargeAmount = ref('');
  const loadCash = async () => {
    if (cashHistory.value.length) return;
    try {
      const res = await window.frontApi.get('my/cash.json');
      cashBalance.value = res.data.balance;
      cashHistory.value = res.data.history;
    } catch (e) {}
  };

  /* ── 문의 ── */
  const inquiries = ref([]);
  const expandedInquiry = ref(null);
  const loadInquiries = async () => {
    if (inquiries.value.length) return;
    try { const res = await window.frontApi.get('my/inquiries.json'); inquiries.value = res.data; }
    catch (e) { inquiries.value = []; }
  };
  const inquiryStatusColor = s => ({ '요청':'#3b82f6','처리중':'#f97316','답변완료':'#22c55e','취소됨':'#9ca3af' }[s] || '#9ca3af');

  /* ── 채팅 ── */
  const chats = ref([]);
  const expandedChat = ref(null);
  const loadChats = async () => {
    if (chats.value.length) return;
    try { const res = await window.frontApi.get('my/chats.json'); chats.value = res.data; }
    catch (e) { chats.value = []; }
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
    const o = orders.value.find(x => x.orderId === c.usedOrderId);
    return o ? o.items : null;
  };

  /* ── 탭 카운트 (cartCount는 외부 주입) ── */
  const getTabCounts = (cartCount) => ({
    myOrder:   orders.value.length,
    myClaim:   claims.value.filter(c => !CLAIM_DONE.includes(c.status)).length,
    myCart:    cartCount || 0,
    myCoupon:  coupons.value.filter(c => !c.used).length,
    myCache:   null,
    myContact: inquiries.value.filter(q => q.status === '요청' || q.status === '처리중').length,
    myChatt:   chats.value.reduce((s, c) => s + (c.unread || 0), 0),
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
