/* ShopJoy Admin - 공유 목 데이터 스토어 */
(function () {
  const { reactive } = Vue;

  window.adminData = reactive({
    members: [
      { userId: 1, email: 'user1@demo.com', name: '홍길동', phone: '010-1111-1111', grade: 'VIP', status: '활성', joinDate: '2025-11-01', lastLogin: '2026-04-07', orderCount: 25, totalPurchase: 1280000 },
      { userId: 2, email: 'user2@demo.com', name: '이영희', phone: '010-2222-2222', grade: '일반', status: '활성', joinDate: '2026-01-15', lastLogin: '2026-04-05', orderCount: 8, totalPurchase: 340000 },
      { userId: 3, email: 'user3@demo.com', name: '박민준', phone: '010-3333-3333', grade: '우수', status: '활성', joinDate: '2026-02-20', lastLogin: '2026-04-03', orderCount: 14, totalPurchase: 720000 },
      { userId: 4, email: 'user4@demo.com', name: '김수현', phone: '010-4444-4444', grade: '일반', status: '활성', joinDate: '2026-03-01', lastLogin: '2026-04-06', orderCount: 3, totalPurchase: 98000 },
      { userId: 5, email: 'user5@demo.com', name: '최지우', phone: '010-5555-5555', grade: '일반', status: '정지', joinDate: '2025-12-10', lastLogin: '2026-03-20', orderCount: 2, totalPurchase: 45000 },
      { userId: 6, email: 'user6@demo.com', name: '정민호', phone: '010-6666-6666', grade: '우수', status: '활성', joinDate: '2026-01-05', lastLogin: '2026-04-07', orderCount: 11, totalPurchase: 560000 },
      { userId: 7, email: 'user7@demo.com', name: '강예은', phone: '010-7777-7777', grade: '일반', status: '활성', joinDate: '2026-02-14', lastLogin: '2026-04-01', orderCount: 5, totalPurchase: 210000 },
      { userId: 8, email: 'user8@demo.com', name: '윤성준', phone: '010-8888-8888', grade: 'VIP', status: '활성', joinDate: '2025-10-20', lastLogin: '2026-04-07', orderCount: 32, totalPurchase: 2100000 },
    ],

    products: [
      { productId: 1, productName: '오버사이즈 코튼 티셔츠', category: '상의', price: 29900, stock: 150, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-10' },
      { productId: 2, productName: '슬림핏 데님 진', category: '하의', price: 59900, stock: 80, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-15' },
      { productId: 3, productName: '케이블 니트 스웨터', category: '상의', price: 49000, stock: 60, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-20' },
      { productId: 4, productName: '플로럴 미디 드레스', category: '원피스', price: 79000, stock: 45, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-01' },
      { productId: 5, productName: '카고 와이드 팬츠', category: '하의', price: 55000, stock: 90, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-05' },
      { productId: 6, productName: '울 블렌드 롱코트', category: '아우터', price: 119000, stock: 30, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-10' },
      { productId: 7, productName: '스트라이프 린넨 셔츠', category: '상의', price: 45000, stock: 70, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-15' },
      { productId: 8, productName: '퀼티드 숏 점퍼', category: '아우터', price: 89000, stock: 25, status: '품절', brand: 'ShopJoy', regDate: '2026-02-20' },
      { productId: 9, productName: '리넨 오버핏 블레이저', category: '아우터', price: 95000, stock: 40, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-01' },
      { productId: 10, productName: '맥시 롱 원피스', category: '원피스', price: 88000, stock: 35, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-05' },
      { productId: 11, productName: '조거 스웻 팬츠', category: '하의', price: 38000, stock: 110, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-10' },
      { productId: 12, productName: '체크 플란넬 셔츠', category: '상의', price: 52000, stock: 65, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-15' },
      { productId: 13, productName: '후드 집업 스웨트셔츠', category: '상의', price: 69000, stock: 55, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-20' },
      { productId: 14, productName: '레더룩 라이더 재킷', category: '아우터', price: 139000, stock: 20, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-25' },
      { productId: 15, productName: '캔버스 토트백', category: '가방', price: 35000, stock: 100, status: '판매중', brand: 'ShopJoy', regDate: '2026-04-01' },
    ],

    orders: [
      { orderId: 'ORD-2026-025', userId: 1, userName: '홍길동', orderDate: '2026-04-05 14:32', productName: '오버사이즈 코튼 티셔츠', totalPrice: 26900, status: '주문완료', payMethod: '혼합결제' },
      { orderId: 'ORD-2026-024', userId: 1, userName: '홍길동', orderDate: '2026-04-04 09:18', productName: '슬림핏 데님 진 외 1', totalPrice: 238800, status: '결제완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-023', userId: 2, userName: '이영희', orderDate: '2026-04-02 21:05', productName: '케이블 니트 스웨터 외 1', totalPrice: 104000, status: '배송준비중', payMethod: '혼합결제' },
      { orderId: 'ORD-2026-022', userId: 3, userName: '박민준', orderDate: '2026-03-28 16:44', productName: '플로럴 미디 드레스', totalPrice: 79000, status: '배송중', payMethod: '캐쉬' },
      { orderId: 'ORD-2026-021', userId: 1, userName: '홍길동', orderDate: '2026-03-22 11:27', productName: '카고 와이드 팬츠', totalPrice: 55000, status: '배송완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-020', userId: 4, userName: '김수현', orderDate: '2026-03-18 08:53', productName: '스트라이프 린넨 셔츠', totalPrice: 45000, status: '완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-019', userId: 2, userName: '이영희', orderDate: '2026-03-14 19:01', productName: '퀼티드 숏 점퍼', totalPrice: 89000, status: '취소됨', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-018', userId: 1, userName: '홍길동', orderDate: '2026-03-10 13:22', productName: '오버사이즈 코튼 티셔츠 x2', totalPrice: 59800, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-017', userId: 6, userName: '정민호', orderDate: '2026-03-07 10:48', productName: '케이블 니트 스웨터', totalPrice: 49000, status: '배송완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-016', userId: 3, userName: '박민준', orderDate: '2026-02-27 15:36', productName: '슬림핏 데님 진', totalPrice: 59900, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-015', userId: 8, userName: '윤성준', orderDate: '2026-02-22 22:14', productName: '플로럴 미디 드레스 외 1', totalPrice: 108900, status: '완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-014', userId: 8, userName: '윤성준', orderDate: '2026-02-18 07:59', productName: '카고 와이드 팬츠', totalPrice: 55000, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-013', userId: 5, userName: '최지우', orderDate: '2026-02-14 12:33', productName: '오버사이즈 코튼 티셔츠', totalPrice: 29900, status: '주문완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-012', userId: 7, userName: '강예은', orderDate: '2026-02-10 18:07', productName: '슬림핏 데님 진 외 1', totalPrice: 94900, status: '결제완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-011', userId: 1, userName: '홍길동', orderDate: '2026-02-05 09:41', productName: '울 블렌드 롱코트', totalPrice: 119000, status: '취소됨', payMethod: '계좌이체' },
    ],

    claims: [
      { claimId: 'CLM-2026-013', userId: 1, userName: '홍길동', orderId: 'ORD-2026-013', type: '취소', status: '취소요청', requestDate: '2026-04-06 11:23', productName: '오버사이즈 코튼 티셔츠', reason: '단순변심', refundAmount: 29900 },
      { claimId: 'CLM-2026-012', userId: 7, userName: '강예은', orderId: 'ORD-2026-012', type: '취소', status: '취소처리중', requestDate: '2026-04-04 09:47', productName: '슬림핏 데님 진 외 1', reason: '주문실수', refundAmount: 94900 },
      { claimId: 'CLM-2026-011', userId: 1, userName: '홍길동', orderId: 'ORD-2026-011', type: '취소', status: '취소완료', requestDate: '2026-04-01 15:08', productName: '울 블렌드 롱코트', reason: '배송지연', refundAmount: 119000 },
      { claimId: 'CLM-2026-009', userId: 1, userName: '홍길동', orderId: 'ORD-2026-009', type: '반품', status: '반품요청', requestDate: '2026-04-05 20:11', productName: '퀼티드 숏 점퍼', reason: '상품불량', refundAmount: 89000 },
      { claimId: 'CLM-2026-008', userId: 6, userName: '정민호', orderId: 'ORD-2026-008', type: '반품', status: '수거예정', requestDate: '2026-04-03 13:52', productName: '리넨 오버핏 블레이저', reason: '사이즈 불일치', refundAmount: 95000 },
      { claimId: 'CLM-2026-007', userId: 3, userName: '박민준', orderId: 'ORD-2026-007', type: '반품', status: '수거완료', requestDate: '2026-03-30 08:29', productName: '플로럴 미디 드레스', reason: '색상 상이', refundAmount: 79000 },
      { claimId: 'CLM-2026-006', userId: 1, userName: '홍길동', orderId: 'ORD-2026-006', type: '반품', status: '환불처리중', requestDate: '2026-03-25 16:44', productName: '후드 집업 스웨트셔츠', reason: '상품불량', refundAmount: 69000 },
      { claimId: 'CLM-2026-005', userId: 8, userName: '윤성준', orderId: 'ORD-2026-005', type: '반품', status: '환불완료', requestDate: '2026-03-18 10:17', productName: '맥시 롱 원피스', reason: '단순변심', refundAmount: 88000 },
      { claimId: 'CLM-2026-004', userId: 2, userName: '이영희', orderId: 'ORD-2026-004', type: '교환', status: '교환요청', requestDate: '2026-04-06 22:05', productName: '케이블 니트 스웨터', reason: '사이즈 불일치', refundAmount: 0 },
      { claimId: 'CLM-2026-003', userId: 4, userName: '김수현', orderId: 'ORD-2026-003', type: '교환', status: '수거예정', requestDate: '2026-04-02 07:38', productName: '조거 스웻 팬츠', reason: '색상 변경', refundAmount: 0 },
      { claimId: 'CLM-2026-002', userId: 6, userName: '정민호', orderId: 'ORD-2026-002', type: '교환', status: '발송완료', requestDate: '2026-03-26 19:51', productName: '체크 플란넬 셔츠', reason: '사이즈 불일치', refundAmount: 0 },
      { claimId: 'CLM-2026-001', userId: 1, userName: '홍길동', orderId: 'ORD-2026-001', type: '교환', status: '교환완료', requestDate: '2026-03-15 12:44', productName: '스트라이프 린넨 셔츠', reason: '상품불량', refundAmount: 0 },
    ],

    deliveries: [
      { dlivId: 'DLIV-025', orderId: 'ORD-2026-025', userId: 1, userName: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '배송예정', trackingNo: '', status: '배송준비', regDate: '2026-04-05' },
      { dlivId: 'DLIV-024', orderId: 'ORD-2026-024', userId: 1, userName: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '배송예정', trackingNo: '', status: '배송준비', regDate: '2026-04-04' },
      { dlivId: 'DLIV-023', orderId: 'ORD-2026-023', userId: 2, userName: '이영희', receiver: '이영희', address: '부산 해운대구 센텀로 45', phone: '010-2222-2222', courier: 'CJ대한통운', trackingNo: '123456789012', status: '배송중', regDate: '2026-04-02' },
      { dlivId: 'DLIV-022', orderId: 'ORD-2026-022', userId: 3, userName: '박민준', receiver: '박민준', address: '대전 유성구 대학로 78', phone: '010-3333-3333', courier: '롯데택배', trackingNo: '987654321098', status: '배송완료', regDate: '2026-03-28' },
      { dlivId: 'DLIV-021', orderId: 'ORD-2026-021', userId: 1, userName: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '한진택배', trackingNo: '456789012345', status: '배송완료', regDate: '2026-03-22' },
      { dlivId: 'DLIV-020', orderId: 'ORD-2026-020', userId: 4, userName: '김수현', receiver: '김수현', address: '인천 남동구 논현로 89', phone: '010-4444-4444', courier: 'CJ대한통운', trackingNo: '321098765432', status: '배송완료', regDate: '2026-03-18' },
      { dlivId: 'DLIV-017', orderId: 'ORD-2026-017', userId: 6, userName: '정민호', receiver: '정민호', address: '서울 마포구 홍대입구로 56', phone: '010-6666-6666', courier: '한진택배', trackingNo: '234567890123', status: '배송완료', regDate: '2026-03-07' },
      { dlivId: 'DLIV-016', orderId: 'ORD-2026-016', userId: 3, userName: '박민준', receiver: '박민준', address: '대전 유성구 대학로 78', phone: '010-3333-3333', courier: 'CJ대한통운', trackingNo: '789012345678', status: '배송완료', regDate: '2026-02-27' },
    ],

    coupons: [
      { couponId: 1, code: 'WELCOME10', name: '신규가입 10% 할인', discountType: 'rate', discountValue: 10, minOrder: 30000, expiry: '2026-12-31', issueTo: '전체', issueCount: 500, useCount: 45, status: '활성' },
      { couponId: 2, code: 'SPRING5000', name: '봄맞이 5,000원 할인', discountType: 'amount', discountValue: 5000, minOrder: 50000, expiry: '2026-06-30', issueTo: '전체', issueCount: 300, useCount: 120, status: '활성' },
      { couponId: 3, code: 'SUMMER15', name: '여름 시즌 15% 할인', discountType: 'rate', discountValue: 15, minOrder: 70000, expiry: '2026-08-31', issueTo: '의류', issueCount: 200, useCount: 30, status: '활성' },
      { couponId: 4, code: 'VIP10000', name: 'VIP 10,000원 할인', discountType: 'amount', discountValue: 10000, minOrder: 100000, expiry: '2026-12-31', issueTo: 'VIP 회원', issueCount: 50, useCount: 12, status: '활성' },
      { couponId: 5, code: 'FREESHIP', name: '무료배송 쿠폰', discountType: 'shipping', discountValue: 0, minOrder: 0, expiry: '2026-09-30', issueTo: '전체', issueCount: 1000, useCount: 230, status: '활성' },
      { couponId: 6, code: 'EXTRA20', name: '추가 20% 할인 (특별)', discountType: 'rate', discountValue: 20, minOrder: 80000, expiry: '2026-05-31', issueTo: '우수 회원', issueCount: 100, useCount: 8, status: '활성' },
      { couponId: 7, code: 'USED3000', name: '3,000원 할인', discountType: 'amount', discountValue: 3000, minOrder: 20000, expiry: '2026-03-31', issueTo: '전체', issueCount: 400, useCount: 390, status: '만료' },
      { couponId: 8, code: 'APP2000', name: '앱 전용 2,000원 할인', discountType: 'amount', discountValue: 2000, minOrder: 15000, expiry: '2026-07-31', issueTo: '전체', issueCount: 600, useCount: 55, status: '활성' },
    ],

    cacheList: [
      { cacheId: 1, userId: 1, userName: '홍길동', date: '2026-04-05 14:22', type: '충전', amount: 5000, desc: '이벤트 참여 적립', balance: 23500 },
      { cacheId: 2, userId: 1, userName: '홍길동', date: '2026-03-28 16:50', type: '사용', amount: -3000, desc: 'ORD-2026-023 결제 사용', balance: 18500 },
      { cacheId: 3, userId: 2, userName: '이영희', date: '2026-03-22 11:05', type: '충전', amount: 10000, desc: '직접 충전', balance: 15000 },
      { cacheId: 4, userId: 1, userName: '홍길동', date: '2026-03-15 09:33', type: '사용', amount: -5000, desc: 'ORD-2026-022 결제 사용', balance: 11500 },
      { cacheId: 5, userId: 3, userName: '박민준', date: '2026-03-10 20:14', type: '충전', amount: 3000, desc: '리뷰 작성 적립', balance: 8000 },
      { cacheId: 6, userId: 2, userName: '이영희', date: '2026-03-05 13:47', type: '사용', amount: -2000, desc: 'ORD-2026-021 결제 사용', balance: 5000 },
      { cacheId: 7, userId: 8, userName: '윤성준', date: '2026-02-25 17:28', type: '충전', amount: 5000, desc: '친구 초대 적립', balance: 12000 },
      { cacheId: 8, userId: 4, userName: '김수현', date: '2026-02-18 08:55', type: '충전', amount: 2000, desc: '회원가입 축하 적립', balance: 2000 },
      { cacheId: 9, userId: 1, userName: '홍길동', date: '2026-02-10 19:02', type: '충전', amount: 10000, desc: '직접 충전', balance: 10000 },
      { cacheId: 10, userId: 6, userName: '정민호', date: '2026-02-05 11:30', type: '사용', amount: -3000, desc: 'ORD-2026-019 결제 취소 환불', balance: 7000 },
      { cacheId: 11, userId: 3, userName: '박민준', date: '2026-01-30 10:00', type: '충전', amount: 5000, desc: '이벤트 참여 적립', balance: 5000 },
      { cacheId: 12, userId: 8, userName: '윤성준', date: '2026-01-25 15:44', type: '충전', amount: 10000, desc: '연말 이벤트 적립', balance: 22000 },
    ],

    displays: [
      { dispId: 1, area: 'HOME_BANNER', name: '메인 배너 - 봄맞이 세일', widgetType: 'image_banner', dispType: '이미지', clickAction: 'navigate', clickTarget: '/products', condition: '항상 표시', authRequired: false, sortOrder: 1, status: '활성', regDate: '2026-03-01' },
      { dispId: 2, area: 'HOME_PRODUCT', name: '신상품 추천 슬라이더', widgetType: 'product_slider', dispType: '상품목록', clickAction: 'navigate', clickTarget: '/detail', condition: '항상 표시', authRequired: false, sortOrder: 2, status: '활성', regDate: '2026-03-05' },
      { dispId: 3, area: 'HOME_CHART', name: '주간 베스트 차트', widgetType: 'chart_bar', dispType: '차트', clickAction: 'none', clickTarget: '', condition: '항상 표시', authRequired: false, sortOrder: 3, status: '활성', regDate: '2026-03-10' },
      { dispId: 4, area: 'SIDEBAR_TOP', name: 'VIP 전용 배너', widgetType: 'image_banner', dispType: '이미지', clickAction: 'navigate', clickTarget: '/events', condition: '로그인+VIP', authRequired: true, authGrade: 'VIP', sortOrder: 1, status: '활성', regDate: '2026-03-15' },
      { dispId: 5, area: 'PRODUCT_TOP', name: '오늘의 할인 위젯', widgetType: 'text_banner', dispType: '텍스트', clickAction: 'event', clickTarget: 'showCoupon', condition: '로그인 필요', authRequired: true, sortOrder: 1, status: '활성', regDate: '2026-03-20' },
      { dispId: 6, area: 'MY_PAGE', name: '등급별 혜택 안내', widgetType: 'info_card', dispType: '정보카드', clickAction: 'none', clickTarget: '', condition: '로그인 필요', authRequired: true, sortOrder: 1, status: '활성', regDate: '2026-04-01' },
      { dispId: 7, area: 'HOME_BANNER', name: '앱 전용 팝업', widgetType: 'popup', dispType: '팝업', clickAction: 'navigate', clickTarget: '/app-download', condition: '비로그인', authRequired: false, sortOrder: 4, status: '비활성', regDate: '2026-04-05' },
    ],

    events: [
      { eventId: 1, title: '봄맞이 신상품 론칭 이벤트', content1: '<p>봄을 맞아 새로운 컬렉션을 소개합니다!</p>', content2: '<p>특별 할인 혜택을 누려보세요.</p>', content3: '', content4: '', content5: '', targetProducts: [1, 2, 3], authRequired: false, startDate: '2026-03-01', endDate: '2026-05-31', status: '진행중', regDate: '2026-02-25' },
      { eventId: 2, title: 'VIP 회원 전용 특별 혜택', content1: '<p>VIP 고객님께 드리는 특별 혜택!</p>', content2: '<p>추가 할인 쿠폰과 무료 배송을 제공합니다.</p>', content3: '<p>VIP 전용 라운지를 경험해 보세요.</p>', content4: '', content5: '', targetProducts: [6, 9, 14], authRequired: true, startDate: '2026-04-01', endDate: '2026-04-30', status: '진행중', regDate: '2026-03-28' },
      { eventId: 3, title: '설날 특별 기획전', content1: '<p>설날을 맞아 특별 기획전을 진행합니다.</p>', content2: '', content3: '', content4: '', content5: '', targetProducts: [3, 6, 7], authRequired: false, startDate: '2026-01-15', endDate: '2026-02-10', status: '종료', regDate: '2026-01-10' },
      { eventId: 4, title: '여름 시즌 프리뷰 이벤트', content1: '<p>여름 신상품을 미리 만나보세요!</p>', content2: '<p>얼리버드 특별 가격으로 구매하세요.</p>', content3: '', content4: '', content5: '', targetProducts: [4, 5, 11], authRequired: false, startDate: '2026-05-01', endDate: '2026-06-30', status: '예정', regDate: '2026-04-07' },
    ],

    contacts: [
      { inquiryId: 1, userId: 1, userName: '홍길동', date: '2026-04-06 14:35', category: '배송 문의', title: '주문 후 배송 현황 확인 요청', content: '오늘 주문했는데 언제 발송될까요?', status: '요청', answer: '' },
      { inquiryId: 2, userId: 1, userName: '홍길동', date: '2026-04-04 11:02', category: '상품 문의', title: '울 블렌드 롱코트 사이즈 문의', content: 'M과 L 중 어떤 사이즈가 맞을지 궁금합니다. 키 168cm 58kg입니다.', status: '처리중', answer: '' },
      { inquiryId: 3, userId: 2, userName: '이영희', date: '2026-03-30 09:48', category: '교환·반품 문의', title: '색상이 사진과 달라요', content: '받은 상품 색상이 사이트 이미지와 많이 다릅니다. 교환 가능한가요?', status: '답변완료', answer: '안녕하세요. 모니터 설정에 따라 차이가 있을 수 있습니다. 교환 접수 도와드리겠습니다.' },
      { inquiryId: 4, userId: 3, userName: '박민준', date: '2026-03-28 17:23', category: '주문·결제 문의', title: '주문 취소 요청', content: '실수로 주문했습니다. 취소 가능할까요?', status: '요청', answer: '' },
      { inquiryId: 5, userId: 4, userName: '김수현', date: '2026-03-25 10:15', category: '배송 문의', title: '배송지 변경 요청', content: '배송 출발 전에 주소 변경이 가능한가요?', status: '답변완료', answer: '배송 출발 전이라면 변경 가능합니다. 빠르게 연락 주세요.' },
      { inquiryId: 6, userId: 6, userName: '정민호', date: '2026-03-20 16:44', category: '상품 문의', title: '재입고 문의', content: '블랙 XL 사이즈 재입고 예정이 있나요?', status: '처리중', answer: '' },
      { inquiryId: 7, userId: 8, userName: '윤성준', date: '2026-03-18 08:30', category: '교환·반품 문의', title: '반품 신청', content: '사이즈가 맞지 않아 반품하고 싶습니다.', status: '답변완료', answer: '반품 접수 완료되었습니다. 택배 회수 후 환불 처리됩니다.' },
      { inquiryId: 8, userId: 2, userName: '이영희', date: '2026-03-15 13:55', category: '기타 문의', title: '쿠폰 사용 방법 문의', content: '쿠폰을 어디서 사용하나요?', status: '답변완료', answer: '주문 결제 페이지에서 쿠폰을 적용하실 수 있습니다.' },
    ],

    chats: [
      { chatId: 1, userId: 1, userName: '홍길동', date: '2026-04-06 14:32', subject: '배송 관련 문의', lastMsg: '주문하신 상품은 내일 발송 예정입니다.', status: '진행중', unread: 1, messages: [
        { from: 'user', text: '안녕하세요, 주문한 상품 배송이 언제 될까요?', time: '14:25', orderId: 'ORD-2026-025' },
        { from: 'cs', text: '안녕하세요 ShopJoy 고객센터입니다. 확인해보겠습니다.', time: '14:28' },
        { from: 'cs', text: '주문하신 상품은 내일 발송 예정입니다.', time: '14:32' },
      ]},
      { chatId: 2, userId: 1, userName: '홍길동', date: '2026-04-03 10:15', subject: '반품 신청', lastMsg: '반품 접수가 완료되었습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '사이즈가 맞지 않아 반품하고 싶습니다.', time: '10:10', claimId: 'CLM-2026-008' },
        { from: 'cs', text: '반품 접수 도와드리겠습니다.', time: '10:12' },
        { from: 'cs', text: '반품 접수가 완료되었습니다.', time: '10:15' },
      ]},
      { chatId: 3, userId: 2, userName: '이영희', date: '2026-03-28 16:45', subject: '상품 재입고 문의', lastMsg: '재입고 시 알림 신청 완료했습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '블랙 XL 재입고 언제 될까요?', time: '16:40', productId: 1 },
        { from: 'cs', text: '재입고 시 알림 신청 완료했습니다.', time: '16:45' },
      ]},
      { chatId: 4, userId: 3, userName: '박민준', date: '2026-03-20 11:20', subject: '쿠폰 적용 문의', lastMsg: '쿠폰 적용 방법 안내드렸습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '쿠폰을 어떻게 사용하나요?', time: '11:18' },
        { from: 'cs', text: '주문 페이지에서 쿠폰 선택 후 적용하시면 됩니다.', time: '11:20' },
      ]},
      { chatId: 5, userId: 4, userName: '김수현', date: '2026-04-07 09:00', subject: '신상품 문의', lastMsg: '', status: '진행중', unread: 2, messages: [
        { from: 'user', text: '신상품 입고 일정 알 수 있을까요?', time: '09:00', productId: 2 },
      ]},
      { chatId: 6, userId: 6, userName: '정민호', date: '2026-02-25 14:00', subject: '결제 오류 문의', lastMsg: '결제 정상 처리 확인되었습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '결제가 두 번 된 것 같아요.', time: '13:55', orderId: 'ORD-2026-017' },
        { from: 'cs', text: '확인 결과 한 번만 결제되었습니다.', time: '14:00' },
      ]},
    ],

    /* ── 유틸 ── */
    getMember(userId) { return this.members.find(m => m.userId === userId) || null; },
    getProduct(productId) { return this.products.find(p => p.productId === productId) || null; },
    getOrder(orderId) { return this.orders.find(o => o.orderId === orderId) || null; },
    getClaim(claimId) { return this.claims.find(c => c.claimId === claimId) || null; },
    getCoupon(couponId) { return this.coupons.find(c => c.couponId === couponId) || null; },

    nextId(list, field) {
      return list.length ? Math.max(...list.map(i => i[field] || 0)) + 1 : 1;
    },
  });
})();
