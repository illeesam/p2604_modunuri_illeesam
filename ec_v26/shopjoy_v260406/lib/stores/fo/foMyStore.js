/* ShopJoy - FO My Page Store (Pinia) */
window.useFoMyStore = Pinia.defineStore('foMy', () => {
  const { ref, reactive, computed } = Vue;

  /* ── 클레임 상수 (foConsts/coConsts 참조) ── */
  const CLAIM_FLOWS = foConsts.CLAIM_FLOWS;
  const CLAIM_DONE = foConsts.CLAIM_DONE;
  const CLAIM_TYPE_COLOR = coConsts.CLAIM_TYPE_COLOR;

  /* CLAIM_STATUS_COLOR — 클레임 상태 → hex (foConsts 맵) */
  const CLAIM_STATUS_COLOR = s => (foConsts.CLAIM_STATUS_COLOR_MAP[s] || '#9ca3af');

  /* ── 주문 상태 흐름 (foConsts 참조) ── */
  const ORDER_FLOW = foConsts.ORDER_FLOW;
  const CANCELABLE   = foConsts.CANCELABLE;
  const SHOW_COURIER = foConsts.SHOW_COURIER;

  /* orderStatusLabel */
  const orderStatusLabel = s => (s === '완료' ? '구매확정' : s);

  /* statusColor — 주문 상태 → hex (foConsts 맵) */
  const statusColor = s => (foConsts.ORDER_STATUS_COLOR[s] || '#9ca3af');

  /* ── 주문 ── */
  const orders = reactive([]);

  /* _fmtDate — LocalDateTime/ISO 문자열 → 'YYYY-MM-DD' (coUtil.cofYmd 위임) */
  const _fmtDate = v => coUtil.cofYmd(v);

  /* _orderStatusKor — 백엔드 주문상태(코드/라벨) → 화면 흐름(ORDER_FLOW) 한글 status 로 정규화.
     orderStatusCdNm 이 이미 한글이면 그대로, 코드값이면 맵(foConsts)으로 변환. */
  const _ORDER_STATUS_KOR = foConsts.ORDER_STATUS_KOR;
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

  /* _applyPageMeta — PageResponse 메타(pageTotalCount/pageTotalPage)를 pager 에 반영 */
  const _applyPageMeta = (pager, d) => {
    if (!pager || !d) return;
    pager.pageTotalCount = d.pageTotalCount || 0;
    pager.pageTotalPage  = d.pageTotalPage  || 1;
  };

  /* handleLoadOrdersPage — 서버사이드 페이징 조회. params(검색조건)+pager(pageNo/pageSize) → 현재 페이지만 적재 + pager 메타 갱신 */
  const handleLoadOrdersPage = async (params, pager) => {
    if (!Array.isArray(orders)) Object.assign(orders, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myOrder.getPage(p, '마이주문', '목록조회');
      const d = res.data?.data || {};
      orders.splice(0, orders.length, ...(d.pageList || []).map(_adaptOrder));
      _applyPageMeta(pager, d);
    } catch (e) { orders.splice(0, orders.length); _applyPageMeta(pager, {}); }
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
  const _CLAIM_TYPE_KOR = foConsts.CLAIM_TYPE_KOR;
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

  /* handleLoadClaimsPage — 서버사이드 페이징 조회 (유형/상태/기간 검색 params + pager) */
  const handleLoadClaimsPage = async (params, pager) => {
    if (!Array.isArray(claims)) Object.assign(claims, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myClaim.getPage(p, '마이클레임', '목록조회');
      const d = res.data?.data || {};
      claims.splice(0, claims.length, ...(d.pageList || []).map(_adaptClaim));
      _applyPageMeta(pager, d);
    } catch (e) { claims.splice(0, claims.length); _applyPageMeta(pager, {}); }
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

  /* handleLoadCouponsPage — 서버사이드 페이징 조회 (상태/기간 검색 params + pager) */
  const handleLoadCouponsPage = async (params, pager) => {
    if (!Array.isArray(coupons)) Object.assign(coupons, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myCoupon.getPage(p, '마이쿠폰', '목록조회');
      const d = res.data?.data || {};
      coupons.splice(0, coupons.length, ...(d.pageList || []).map(_adaptCoupon));
      _applyPageMeta(pager, d);
    } catch (e) { coupons.splice(0, coupons.length); _applyPageMeta(pager, {}); }
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

  /* handleLoadCashPage — 서버사이드 페이징 조회. history 가 PageResponse(pageList/pageTotalCount) 로 옴 */
  const handleLoadCashPage = async (params, pager) => {
    if (!Array.isArray(cashHistory)) Object.assign(cashHistory, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myCash.getPage(p, '마이캐시', '조회');
      cashBalance.value = res.data?.data?.balance || 0;
      const d = res.data?.data?.history || {};
      cashHistory.splice(0, cashHistory.length, ...(d.pageList || []).map(_adaptCash));
      _applyPageMeta(pager, d);
    } catch (e) { cashHistory.splice(0, cashHistory.length); _applyPageMeta(pager, {}); }
  };

  /* ── 문의 ── */
  const inquiries = reactive([]);
  const expandedInquiry = ref(null);

  /* _contactStatusKor — 문의상태(코드/라벨) → 화면 한글(요청/처리중/답변완료) */
  const _CONTACT_STATUS_KOR = foConsts.CONTACT_STATUS_KOR;
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

  /* loadInquiriesPage — 서버사이드 페이징 조회 (상태/기간 검색 params + pager) */
  const loadInquiriesPage = async (params, pager) => {
    if (!Array.isArray(inquiries)) Object.assign(inquiries, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myInquiry.getPage(p, '마이문의', '목록조회');
      const d = res.data?.data || {};
      inquiries.splice(0, inquiries.length, ...(d.pageList || []).map(_adaptInquiry));
      _applyPageMeta(pager, d);
    } catch (e) { inquiries.splice(0, inquiries.length); _applyPageMeta(pager, {}); }
  };

  /* inquiryStatusColor */
  const inquiryStatusColor = s => (foConsts.CONTACT_STATUS_COLOR[s] || '#9ca3af');

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

  /* loadChatsPage — 서버사이드 페이징 조회 (기간 검색 params + pager) */
  const loadChatsPage = async (params, pager) => {
    if (!Array.isArray(chats)) Object.assign(chats, []);
    try {
      const p = { ...(params || {}), pageNo: pager.pageNo, pageSize: pager.pageSize };
      const res = await foApiSvc.myChat.getPage(p, '마이채팅', '목록조회');
      const d = res.data?.data || {};
      chats.splice(0, chats.length, ...(d.pageList || []).map(_adaptChat));
      _applyPageMeta(pager, d);
    } catch (e) { chats.splice(0, chats.length); _applyPageMeta(pager, {}); }
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
    orders, handleLoadOrders, handleLoadOrdersPage, setOrderStatus,
    /* 클레임 */
    claims, claimFilter, cfFilteredClaims, cfClaimsByOrderId, handleLoadClaims, handleLoadClaimsPage, removeClaim,
    /* 쿠폰 */
    coupons, couponCode, handleLoadCoupons, handleLoadCouponsPage, discountLabel,
    /* 캐쉬 */
    cashBalance, cashHistory, chargeAmount, handleLoadCash, handleLoadCashPage,
    /* 문의 */
    inquiries, expandedInquiry, loadInquiries, loadInquiriesPage, inquiryStatusColor,
    /* 채팅 */
    chats, expandedChat, loadChats, loadChatsPage, openChat,
    /* 공유 모달 */
    orderDetailModal, openOrderModal,
    productModal, customerModal,
    /* 유틸 */
    paginate, mkPager, extractOrderId, getCouponUsedOrderItems, discountLabel,
    getTabCounts,
  };
});
