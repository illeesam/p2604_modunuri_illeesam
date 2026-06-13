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

  /* CLAIM_STATUS_COLOR */
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

  /* orderStatusLabel */
  const orderStatusLabel = s => (s === '완료' ? '구매확정' : s);

  /* statusColor */
  const statusColor = s => ({
    '주문완료':'#3b82f6','결제완료':'#8b5cf6','배송준비중':'#f59e0b','배송중':'#f97316',
    '배송완료':'#22c55e','완료':'#6b7280','교환요청':'#f59e0b','반품요청':'#f97316','취소됨':'#9ca3af',
  }[s] || '#9ca3af');

  /* ── 주문 ── */
  const orders = reactive([]);

  /* _fmtDate — LocalDateTime/ISO 문자열 → 'YYYY-MM-DD' (값 없으면 빈 문자열) */
  const _fmtDate = v => (v ? String(v).slice(0, 10) : '');

  /* _orderStatusKor — 백엔드 주문상태(코드/라벨) → 화면 흐름(ORDER_FLOW) 한글 status 로 정규화.
     orderStatusCdNm 이 이미 한글이면 그대로, 코드값이면 맵으로 변환. */
  const _ORDER_STATUS_KOR = {
    ORDER: '주문완료', PAID: '결제완료', PREPARING: '배송준비중', SHIPPING: '배송중',
    SHIPPED: '배송완료', DELIVERED: '배송완료', COMPLT: '완료', COMPLETED: '완료',
    DONE: '완료', CANCEL: '취소됨', CANCELED: '취소됨', CANCELLED: '취소됨',
    EXCHANGE: '교환요청', RETURN: '반품요청',
  };
  const _orderStatusKor = (o) => {
    const nm = o.orderStatusCdNm;
    if (nm && /[가-힣]/.test(nm)) return nm;          // 한글 라벨이면 그대로
    return _ORDER_STATUS_KOR[o.orderStatusCd] || nm || o.orderStatusCd || '';
  };

  /* _adaptOrder — 백엔드 OdOrderDto.Item → 화면(MyOrder 템플릿) 기대 형태로 변환 */
  const _adaptOrder = (o) => {
    const dliv = Array.isArray(o.orderDlivs) && o.orderDlivs.length ? o.orderDlivs[0] : null;
    const items = Array.isArray(o.orderItems) ? o.orderItems.map(it => ({
      prodNm: it.prodNm,
      color:  it.optItemNm1 || '',
      size:   it.optItemNm2 || '',
      qty:    it.orderQty != null ? it.orderQty : 0,
      price:  it.unitPrice != null ? it.unitPrice : 0,
      emoji:  '📦',
      productCoupon: null,
    })) : [];
    const pays = Array.isArray(o.orderPays) ? o.orderPays.map(p => ({
      type:     p.payMethodCdNm || p.payMethodCd || '결제',
      amount:   p.payAmt != null ? p.payAmt : 0,
      datetime: _fmtDate(p.payDate),
      name:     p.memberNm || '',
      account:  p.vbankAccountNo || '',
    })) : [];
    return {
      orderId:    o.orderId,
      orderDate:  _fmtDate(o.orderDate),
      status:     _orderStatusKor(o),
      totalPrice: o.payAmt != null ? o.payAmt : (o.totalAmt != null ? o.totalAmt : 0),
      shippingFee: o.shippingFee != null ? o.shippingFee : 0,
      cashPaid:    o.saveUseAmt != null ? o.saveUseAmt : 0,
      transferPaid: 0,
      shippingCoupon: null,
      courier:    dliv ? (dliv.outboundCourierCdNm || dliv.outboundCourierCd || '') : '',
      trackingNo: dliv ? (dliv.outboundTrackingNo || '') : '',
      orderItems: items,
      paymentDetails: pays,
    };
  };

  /* handleLoadOrders
     - params: 서버 검색 조건(dateStart/dateEnd/dateType/orderStatusCd 등). 전달 시 항상 재조회.
     - 무인자 호출은 기존 동작(미로드 시 1회 조회) 유지하여 호환.
     - 백엔드 Item 을 _adaptOrder 로 화면 기대 형태로 변환해 적재. */
  const handleLoadOrders = async (params) => {
    if (!Array.isArray(orders)) Object.assign(orders, []);
    if (params || !orders.length) {
      try {
        const res = await foApiSvc.myOrder.getList(params || {}, '마이주문', '목록조회');
        const list = res.data?.data || [];
        orders.splice(0, orders.length, ...list.map(_adaptOrder));
      } catch (e) { orders.splice(0, orders.length); }
    }
  };

  /* setOrderStatus */
  const setOrderStatus = (orderId, status) => {
    const o = orders.find(x => x.orderId === orderId);
    if (o) o.status = status;
  };

  /* ── 클레임 ── */
  const claims = reactive([]);
  const claimFilter = ref('전체');

  /* _claimTypeKor — 클레임 유형(코드/라벨) → '취소'|'반품'|'교환' 정규화 (CLAIM_FLOWS 키와 일치) */
  const _CLAIM_TYPE_KOR = { CANCEL: '취소', RETURN: '반품', EXCHANGE: '교환' };
  const _claimTypeKor = (c) => {
    const nm = c.claimTypeCdNm;
    if (nm && /[가-힣]/.test(nm)) {
      if (nm.includes('취소')) return '취소';
      if (nm.includes('반품')) return '반품';
      if (nm.includes('교환')) return '교환';
      return nm;
    }
    return _CLAIM_TYPE_KOR[c.claimTypeCd] || nm || c.claimTypeCd || '';
  };

  /* _adaptClaim — 백엔드 OdClaimDto.Item → 화면(클레임 정보) 기대 형태로 변환 */
  const _adaptClaim = (c) => ({
    claimId:      c.claimId,
    orderId:      c.orderId,
    type:         _claimTypeKor(c),
    status:       (c.claimStatusCdNm && /[가-힣]/.test(c.claimStatusCdNm)) ? c.claimStatusCdNm : (c.claimStatusCd || ''),
    requestDate:  _fmtDate(c.requestDate),
    completeDate: _fmtDate(c.procDate),
    reason:       c.reasonCd || '',
    reasonDetail: c.reasonDetail || '',
    refundAmount: c.refundAmt != null ? c.refundAmt : 0,
    refundMethod: c.refundMethodCdNm || c.refundMethodCd || '',
    refundDetails: [],
    courier:      c.returnCourierCdNm || c.returnCourierCd || '',
    trackingNo:   c.returnTrackingNo || '',
    exchangeCourier:    c.exchangeCourierCdNm || c.exchangeCourierCd || '',
    exchangeTrackingNo: c.exchangeTrackingNo || '',
    exchangeSize:  '',
    exchangeColor: '',
    pickupDate:    _fmtDate(c.collectSchdDate),
    couponId:      null,
    used:          false,
    items:         Array.isArray(c.claimItems) ? c.claimItems : [],
  });

  /* handleLoadClaims — params 전달 시 항상 재조회(서버 기간검색), 무인자는 기존 캐시 동작 */
  const handleLoadClaims = async (params) => {
    if (!Array.isArray(claims)) Object.assign(claims, []);
    if (params || !claims.length) {
      try {
        const res = await foApiSvc.myClaim.getList(params || {}, '마이클레임', '목록조회');
        const list = res.data?.data || [];
        claims.splice(0, claims.length, ...list.map(_adaptClaim));
      } catch (e) { claims.splice(0, claims.length); }
    }
  };
  const cfFilteredClaims = computed(() => {
    if (!Array.isArray(claims)) return [];
    return claimFilter.value === '전체' ? claims : claims.filter(c => c.type === claimFilter.value);
  });
  const cfClaimsByOrderId = computed(() => {
    const map = {};
    if (Array.isArray(claims)) claims.forEach(c => { map[c.orderId] = c; });
    return map;
  });

  /* removeClaim */
  const removeClaim = (claimId) => {
    const idx = claims.findIndex(c => c.claimId === claimId);
    if (idx !== -1) claims.splice(idx, 1);
  };

  /* ── 쿠폰 ── */
  const coupons = reactive([]);
  const couponCode = ref('');

  /* _couponDiscountType — 백엔드 couponTypeCd → 화면 'rate'|'amount'|'shipping'.
     코드값이 모호하면 discountRate/discountAmt 존재로 추론. */
  const _couponDiscountType = (c) => {
    const cd = String(c.couponTypeCd || '').toUpperCase();
    const nm = c.couponTypeCdNm || '';
    if (cd.includes('SHIP') || nm.includes('배송')) return 'shipping';
    if (cd.includes('RATE') || cd.includes('PCT') || nm.includes('율') || nm.includes('%')) return 'rate';
    if (cd.includes('AMT') || cd.includes('AMOUNT') || nm.includes('금액') || nm.includes('원')) return 'amount';
    // fallback: 할인율이 있으면 rate, 아니면 amount
    if (c.discountRate != null && Number(c.discountRate) > 0) return 'rate';
    return 'amount';
  };

  /* _adaptCoupon — 백엔드 PmCouponDto.Item → 화면(쿠폰) 기대 형태로 변환.
     ⚠️ 회원 사용여부(used)는 백엔드 쿠폰 마스터에 없어 couponStatusCd 로 근사한다. */
  const _adaptCoupon = (c) => {
    const dtype = _couponDiscountType(c);
    const dval  = dtype === 'rate'
      ? (c.discountRate != null ? Number(c.discountRate) : 0)
      : (c.discountAmt  != null ? c.discountAmt : 0);
    const status = String(c.couponStatusCd || '').toUpperCase();
    const used = status.includes('USED') || status.includes('USE_DONE') || c.couponStatusCdNm === '사용완료';
    return {
      couponId:     c.couponId,
      name:         c.couponNm || '',
      code:         c.couponCd || '',
      discountType: dtype,
      discountValue: dval,
      minOrder:     c.minOrderAmt != null ? c.minOrderAmt : 0,
      expiry:       _fmtDate(c.validTo),
      regDate:      _fmtDate(c.regDate),
      regMethod:    '',
      regSource:    '',
      applicableTo: c.targetTypeCdNm || '',
      used,
      usedOrderId:      null,
      usedOrderItemId:  null,
      usedProductId:    null,
      usedClaimId:      null,
    };
  };

  /* handleLoadCoupons — params 전달 시 항상 재조회(서버 기간검색), 무인자는 기존 캐시 동작 */
  const handleLoadCoupons = async (params) => {
    if (!Array.isArray(coupons)) Object.assign(coupons, []);
    if (params || !coupons.length) {
      try {
        const res = await foApiSvc.myCoupon.getList(params || {}, '마이쿠폰', '목록조회');
        const list = res.data?.data || [];
        coupons.splice(0, coupons.length, ...list.map(_adaptCoupon));
      } catch (e) { coupons.splice(0, coupons.length); }
    }
  };

  /* discountLabel */
  const discountLabel = c => c.discountType === 'rate' ? c.discountValue + '% 할인'
    : c.discountType === 'shipping' ? '무료배송'
    : c.discountValue.toLocaleString() + '원 할인';

  /* ── 캐쉬 ── */
  const cashBalance = ref(0);
  const cashHistory = reactive([]);
  const chargeAmount = ref('');

  /* _adaptCash — 백엔드 PmCacheDto.Item → 화면(캐쉬 내역) 기대 형태로 변환.
     이미 화면 필드명(amount/balance 등)으로 온 경우(목업/가공응답)는 그대로 통과. */
  const _adaptCash = (h) => {
    if (h == null) return h;
    if (h.amount != null || h.cashId != null) return h;   // 이미 화면 형태면 그대로
    return {
      cashId:  h.cacheId,
      type:    (h.cacheTypeCdNm && /[가-힣]/.test(h.cacheTypeCdNm)) ? h.cacheTypeCdNm : (h.cacheTypeCd || ''),
      amount:  h.cacheAmt != null ? h.cacheAmt : 0,
      balance: h.balanceAmt != null ? h.balanceAmt : 0,
      date:    _fmtDate(h.cacheDate),
      desc:    h.cacheDesc || '',
      payMethod: '', bankInfo: '', cardInfo: '', approvalNo: '',
      refundBank: '', refundHolder: '', refundFee: 0, refundNet: 0,
    };
  };

  /* handleLoadCash — params 전달 시 항상 재조회(서버 기간검색), 무인자는 기존 캐시 동작 */
  const handleLoadCash = async (params) => {
    if (!Array.isArray(cashHistory)) Object.assign(cashHistory, []);
    if (params || !cashHistory.length) {
      try {
        const res = await foApiSvc.myCash.getInfo(params || {}, '마이캐시', '조회');
        cashBalance.value = res.data?.data?.balance || 0;
        const hist = res.data?.data?.history || [];
        cashHistory.splice(0, cashHistory.length, ...hist.map(_adaptCash));
      } catch (e) {}
    }
  };

  /* ── 문의 ── */
  const inquiries = reactive([]);
  const expandedInquiry = ref(null);

  /* _contactStatusKor — 문의상태(코드/라벨) → 화면 한글(요청/처리중/답변완료) */
  const _CONTACT_STATUS_KOR = { REQUEST: '요청', REQ: '요청', PROC: '처리중', PROCESSING: '처리중', DONE: '답변완료', ANSWERED: '답변완료', COMPLETE: '답변완료', CANCEL: '취소됨' };
  const _contactStatusKor = (q) => {
    const nm = q.contactStatusCdNm;
    if (nm && /[가-힣]/.test(nm)) return nm;
    return _CONTACT_STATUS_KOR[String(q.contactStatusCd || '').toUpperCase()] || nm || q.contactStatusCd || '';
  };

  /* _adaptInquiry — 백엔드 SyContactDto.Item → 화면(문의) 기대 형태로 변환 */
  const _adaptInquiry = (q) => ({
    inquiryId:          q.contactId,
    category:           q.categoryCd || '',
    title:              q.contactTitle || '',
    content:            q.contactContent || '',
    contentAttachGrpId: q.contentAttachGrpId || null,
    status:             _contactStatusKor(q),
    date:               _fmtDate(q.contactDate),
    answer:             q.contactAnswer || '',
    answerAttachGrpId:  q.answerAttachGrpId || null,
  });

  /* loadInquiries — params 전달 시 항상 재조회(서버 기간검색), 무인자는 기존 캐시 동작 */
  const loadInquiries = async (params) => {
    if (!Array.isArray(inquiries)) Object.assign(inquiries, []);
    if (params || !inquiries.length) {
      try {
        const res = await foApiSvc.myInquiry.getList(params || {}, '마이문의', '목록조회');
        const list = res.data?.data || [];
        inquiries.splice(0, inquiries.length, ...list.map(_adaptInquiry));
      } catch (e) { inquiries.splice(0, inquiries.length); }
    }
  };

  /* inquiryStatusColor */
  const inquiryStatusColor = s => ({ '요청':'#3b82f6','처리중':'#f97316','답변완료':'#22c55e','취소됨':'#9ca3af' }[s] || '#9ca3af');

  /* ── 채팅 ── */
  const chats = reactive([]);
  const expandedChat = ref(null);

  /* _adaptChat — 백엔드 CmChattRoomDto.Item → 화면(채팅) 기대 형태로 변환.
     ⚠️ lastMsg/messages 는 채팅방 목록 응답에 없어 빈값(상세 진입 시 별도 로드 대상). */
  const _adaptChat = (c) => ({
    chatId:   c.chattRoomId,
    subject:  c.subject || '',
    status:   (c.chattStatusCdNm && /[가-힣]/.test(c.chattStatusCdNm)) ? c.chattStatusCdNm : (c.chattStatusCd || ''),
    unread:   c.memberUnreadCnt != null ? c.memberUnreadCnt : 0,
    date:     _fmtDate(c.lastMsgDate),
    lastMsg:  '',
    messages: [],
  });

  /* loadChats — params 전달 시 항상 재조회(서버 기간검색), 무인자는 기존 캐시 동작 */
  const loadChats = async (params) => {
    if (!Array.isArray(chats)) Object.assign(chats, []);
    if (params || !chats.length) {
      try {
        const res = await foApiSvc.myChat.getList(params || {}, '마이채팅', '목록조회');
        const list = res.data?.data || [];
        chats.splice(0, chats.length, ...list.map(_adaptChat));
      } catch (e) { chats.splice(0, chats.length); }
    }
  };

  /* openChat */
  const openChat = chat => {
    chat.unread = 0;
    expandedChat.value = expandedChat.value === chat.chatId ? null : chat.chatId;
  };

  /* ── 공유 모달 ── */
  const orderDetailModal = reactive({ show: false, order: null });

  /* openOrderModal */
  const openOrderModal = (orderId) => {
    if (!Array.isArray(orders)) return false;
    const o = orders.find(x => x.orderId === orderId);
    if (!o) return false;
    orderDetailModal.order = o;
    orderDetailModal.show = true;
    return true;
  };
  const productModal = reactive({ show: false, product: null });
  const customerModal = reactive({ show: false, user: null, order: null });

  /* ── 공통 유틸 ── */
  const paginate = (list, pager) => {
    if (!Array.isArray(list)) return [];
    // pager 필드 표준화(pageNo/pageSize) 우선, 구 필드(page/size) fallback 호환
    const pageNo   = pager.pageNo   ?? pager.page  ?? 1;
    const pageSize = pager.pageSize ?? pager.size  ?? list.length;
    const start = (pageNo - 1) * pageSize;
    return list.slice(start, start + pageSize);
  };

  /* mkPager */
  const mkPager = () => reactive({ page: 1, size: 50 });

  /* extractOrderId */
  const extractOrderId = desc => {
    const m = (desc || '').match(/ORD-\d{4}-\d{3,}/);
    return m ? m[0] : null;
  };

  /* getCouponUsedOrderItems */
  const getCouponUsedOrderItems = c => {
    if (!c.used || !c.usedOrderId) return null;
    const o = orders.find(x => x.orderId === c.usedOrderId);
    return o ? o.orderItems : null;
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
    orders, handleLoadOrders, setOrderStatus,
    /* 클레임 */
    claims, claimFilter, cfFilteredClaims, cfClaimsByOrderId, handleLoadClaims, removeClaim,
    /* 쿠폰 */
    coupons, couponCode, handleLoadCoupons, discountLabel,
    /* 캐쉬 */
    cashBalance, cashHistory, chargeAmount, handleLoadCash,
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
