/**
 * Ref/Reactive Default Value Helpers
 * Ensures all ref() and reactive() objects/arrays have safe defaults
 */

window.refDefaults = (() => {
  return {
    // ══════════════════════════════════════════════════════════════════
    // 공통 폼 객체 기본값
    // ══════════════════════════════════════════════════════════════════

    // 블로그/공지/채팅 공통
    contentForm: () => ({
      id: null,
      title: '',
      content: '',
      status: '',
      author: '',
      regDate: '',
    }),

    errorObj: () => ({}),
    appliedFilter: () => ({ kw: '', status: '' }),
    pagerState: () => ({ page: 1, size: 10 }),
    modalState: () => ({ show: false, type: '', id: null, data: null }),

    // ══════════════════════════════════════════════════════════════════
    // 도메인별 기본값
    // ══════════════════════════════════════════════════════════════════

    // 회원 (Member)
    memberForm: () => ({
      userId: null,
      email: '',
      memberNm: '',
      phone: '',
      grade: '',
      status: '',
      joinDate: '',
    }),

    // 상품 (Product)
    productForm: () => ({
      productId: null,
      prodNm: '',
      category: '',
      price: 0,
      stock: 0,
      status: '',
      brand: '',
      regDate: '',
    }),

    // 주문 (Order)
    orderForm: () => ({
      orderId: null,
      userId: 0,
      userNm: '',
      orderDate: '',
      prodNm: '',
      totalPrice: 0,
      status: '',
      payMethod: '',
    }),

    // 클레임 (Claim)
    claimForm: () => ({
      claimId: null,
      userId: 0,
      userNm: '',
      orderId: '',
      type: '',
      status: '',
      requestDate: '',
      prodNm: '',
      reason: '',
      refundAmount: 0,
    }),

    // 배송 (Delivery)
    dlivForm: () => ({
      dlivId: null,
      orderId: '',
      status: '',
      carrier: '',
      trackingNo: '',
      estDeliveryDate: '',
    }),

    // 카테고리 (Category)
    categoryForm: () => ({
      categoryId: null,
      categoryNm: '',
      parentId: null,
      level: 0,
      status: '',
    }),

    // 쿠폰 (Coupon)
    couponForm: () => ({
      couponId: null,
      couponNm: '',
      discountType: '',
      discountValue: 0,
      status: '',
      startDate: '',
      endDate: '',
    }),

    // 이벤트 (Event)
    eventForm: () => ({
      eventId: null,
      eventNm: '',
      startDate: '',
      endDate: '',
      status: '',
      type: '',
      content: '',
    }),

    // 블로그 (Blog)
    blogForm: () => ({
      blogId: null,
      siteId: 1,
      blogCateId: null,
      blogTitle: '',
      blogSummary: '',
      blogContent: '',
      blogAuthor: '',
      viewCount: 0,
      useYn: 'Y',
      isNotice: 'N',
      regDate: '',
    }),

    // 공지 (Notice)
    noticeForm: () => ({
      noticeId: null,
      noticeTitle: '',
      noticeType: '',
      noticeContent: '',
      useYn: 'Y',
      regDate: '',
    }),

    // 채팅 (Chat)
    chatForm: () => ({
      chatId: null,
      userId: '',
      userNm: '',
      subject: '',
      status: '진행중',
      message: '',
      regDate: '',
    }),

    // 전시 영역 (Display Area)
    dispAreaForm: () => ({
      areaId: null,
      areaCode: '',
      areaNm: '',
      areaType: '',
      description: '',
      status: '',
      regDate: '',
    }),

    // 전시 패널 (Display Panel)
    dispPanelForm: () => ({
      panelId: null,
      areaId: null,
      panelNm: '',
      layoutType: '',
      status: '',
      sortOrder: 0,
      regDate: '',
    }),

    // ══════════════════════════════════════════════════════════════════
    // 유틸리티 함수
    // ══════════════════════════════════════════════════════════════════

    /**
     * ref 초기화 (배열)
     * @returns {Array} 빈 배열
     */
    emptyArray: () => [],

    /**
     * ref 초기화 (객체)
     * @returns {Object} 빈 객체
     */
    emptyObject: () => ({}),

    /**
     * reactive 초기화 (폼)
     * @param {string} formType - 폼 타입 (memberForm, productForm, 등)
     * @returns {Object} 초기화된 폼 객체
     */
    initForm: (formType) => {
      if (typeof window.refDefaults[formType] === 'function') {
        return window.refDefaults[formType]();
      }
      return window.refDefaults.errorObj();
    },

    /**
     * 안전한 객체 머지 (undefined/null 체크)
     * @param {Object} target - 대상 객체
     * @param {Object} source - 소스 객체
     * @returns {Object} 머지된 객체
     */
    safeAssign: (target, source) => {
      const safe = source || {};
      Object.keys(target).forEach(key => {
        if (key in safe) {
          target[key] = safe[key] ?? target[key];
        }
      });
      return target;
    },

    /**
     * 폼 초기화
     * @param {Object} form - 폼 객체
     * @param {Object} defaults - 기본값 객체
     */
    resetForm: (form, defaults) => {
      Object.keys(form).forEach(key => delete form[key]);
      Object.assign(form, defaults || {});
    },
  };
})();
