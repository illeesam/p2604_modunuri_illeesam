/* ShopJoy Admin - 공유 목 데이터 스토어 */
(function () {
  const { reactive } = Vue;

  window.adminData = reactive({
    members: [
      { userId: 1, email: 'user1@demo.com', memberNm: '홍길동', phone: '010-1111-1111', grade: 'VIP', status: '활성', joinDate: '2025-11-01', lastLogin: '2026-04-07', orderCount: 25, totalPurchase: 1280000 },
      { userId: 2, email: 'user2@demo.com', memberNm: '이영희', phone: '010-2222-2222', grade: '일반', status: '활성', joinDate: '2026-01-15', lastLogin: '2026-04-05', orderCount: 8, totalPurchase: 340000 },
      { userId: 3, email: 'user3@demo.com', memberNm: '박민준', phone: '010-3333-3333', grade: '우수', status: '활성', joinDate: '2026-02-20', lastLogin: '2026-04-03', orderCount: 14, totalPurchase: 720000 },
      { userId: 4, email: 'user4@demo.com', memberNm: '김수현', phone: '010-4444-4444', grade: '일반', status: '활성', joinDate: '2026-03-01', lastLogin: '2026-04-06', orderCount: 3, totalPurchase: 98000 },
      { userId: 5, email: 'user5@demo.com', memberNm: '최지우', phone: '010-5555-5555', grade: '일반', status: '정지', joinDate: '2025-12-10', lastLogin: '2026-03-20', orderCount: 2, totalPurchase: 45000 },
      { userId: 6, email: 'user6@demo.com', memberNm: '정민호', phone: '010-6666-6666', grade: '우수', status: '활성', joinDate: '2026-01-05', lastLogin: '2026-04-07', orderCount: 11, totalPurchase: 560000 },
      { userId: 7, email: 'user7@demo.com', memberNm: '강예은', phone: '010-7777-7777', grade: '일반', status: '활성', joinDate: '2026-02-14', lastLogin: '2026-04-01', orderCount: 5, totalPurchase: 210000 },
      { userId: 8, email: 'user8@demo.com', memberNm: '윤성준', phone: '010-8888-8888', grade: 'VIP', status: '활성', joinDate: '2025-10-20', lastLogin: '2026-04-07', orderCount: 32, totalPurchase: 2100000 },
    ],

    products: [
      { productId: 1, prodNm: '오버사이즈 코튼 티셔츠', category: '상의', price: 29900, stock: 150, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-10' },
      { productId: 2, prodNm: '슬림핏 데님 진', category: '하의', price: 59900, stock: 80, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-15' },
      { productId: 3, prodNm: '케이블 니트 스웨터', category: '상의', price: 49000, stock: 60, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-20' },
      { productId: 4, prodNm: '플로럴 미디 드레스', category: '원피스', price: 79000, stock: 45, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-01' },
      { productId: 5, prodNm: '카고 와이드 팬츠', category: '하의', price: 55000, stock: 90, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-05' },
      { productId: 6, prodNm: '울 블렌드 롱코트', category: '아우터', price: 119000, stock: 30, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-10' },
      { productId: 7, prodNm: '스트라이프 린넨 셔츠', category: '상의', price: 45000, stock: 70, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-15' },
      { productId: 8, prodNm: '퀼티드 숏 점퍼', category: '아우터', price: 89000, stock: 25, status: '품절', brand: 'ShopJoy', regDate: '2026-02-20' },
      { productId: 9, prodNm: '리넨 오버핏 블레이저', category: '아우터', price: 95000, stock: 40, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-01' },
      { productId: 10, prodNm: '맥시 롱 원피스', category: '원피스', price: 88000, stock: 35, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-05' },
      { productId: 11, prodNm: '조거 스웻 팬츠', category: '하의', price: 38000, stock: 110, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-10' },
      { productId: 12, prodNm: '체크 플란넬 셔츠', category: '상의', price: 52000, stock: 65, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-15' },
      { productId: 13, prodNm: '후드 집업 스웨트셔츠', category: '상의', price: 69000, stock: 55, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-20' },
      { productId: 14, prodNm: '레더룩 라이더 재킷', category: '아우터', price: 139000, stock: 20, status: '판매중', brand: 'ShopJoy', regDate: '2026-03-25' },
      { productId: 15, prodNm: '캔버스 토트백', category: '가방', price: 35000, stock: 100, status: '판매중', brand: 'ShopJoy', regDate: '2026-04-01' },
    ],

    orders: [
      { orderId: 'ORD-2026-025', userId: 1, userNm: '홍길동', orderDate: '2026-04-05 14:32', prodNm: '오버사이즈 코튼 티셔츠', totalPrice: 26900, status: '주문완료', payMethod: '혼합결제' },
      { orderId: 'ORD-2026-024', userId: 1, userNm: '홍길동', orderDate: '2026-04-04 09:18', prodNm: '슬림핏 데님 진 외 1', totalPrice: 238800, status: '결제완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-023', userId: 2, userNm: '이영희', orderDate: '2026-04-02 21:05', prodNm: '케이블 니트 스웨터 외 1', totalPrice: 104000, status: '배송준비중', payMethod: '혼합결제' },
      { orderId: 'ORD-2026-022', userId: 3, userNm: '박민준', orderDate: '2026-03-28 16:44', prodNm: '플로럴 미디 드레스', totalPrice: 79000, status: '배송중', payMethod: '캐쉬' },
      { orderId: 'ORD-2026-021', userId: 1, userNm: '홍길동', orderDate: '2026-03-22 11:27', prodNm: '카고 와이드 팬츠', totalPrice: 55000, status: '배송완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-020', userId: 4, userNm: '김수현', orderDate: '2026-03-18 08:53', prodNm: '스트라이프 린넨 셔츠', totalPrice: 45000, status: '완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-019', userId: 2, userNm: '이영희', orderDate: '2026-03-14 19:01', prodNm: '퀼티드 숏 점퍼', totalPrice: 89000, status: '취소됨', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-018', userId: 1, userNm: '홍길동', orderDate: '2026-03-10 13:22', prodNm: '오버사이즈 코튼 티셔츠 x2', totalPrice: 59800, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-017', userId: 6, userNm: '정민호', orderDate: '2026-03-07 10:48', prodNm: '케이블 니트 스웨터', totalPrice: 49000, status: '배송완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-016', userId: 3, userNm: '박민준', orderDate: '2026-02-27 15:36', prodNm: '슬림핏 데님 진', totalPrice: 59900, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-015', userId: 8, userNm: '윤성준', orderDate: '2026-02-22 22:14', prodNm: '플로럴 미디 드레스 외 1', totalPrice: 108900, status: '완료', payMethod: '카드결제' },
      { orderId: 'ORD-2026-014', userId: 8, userNm: '윤성준', orderDate: '2026-02-18 07:59', prodNm: '카고 와이드 팬츠', totalPrice: 55000, status: '완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-013', userId: 5, userNm: '최지우', orderDate: '2026-02-14 12:33', prodNm: '오버사이즈 코튼 티셔츠', totalPrice: 29900, status: '주문완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-012', userId: 7, userNm: '강예은', orderDate: '2026-02-10 18:07', prodNm: '슬림핏 데님 진 외 1', totalPrice: 94900, status: '결제완료', payMethod: '계좌이체' },
      { orderId: 'ORD-2026-011', userId: 1, userNm: '홍길동', orderDate: '2026-02-05 09:41', prodNm: '울 블렌드 롱코트', totalPrice: 119000, status: '취소됨', payMethod: '계좌이체' },
    ],

    claims: [
      { claimId: 'CLM-2026-013', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-013', type: '취소', status: '취소요청', requestDate: '2026-04-06 11:23', prodNm: '오버사이즈 코튼 티셔츠', reason: '단순변심', refundAmount: 29900 },
      { claimId: 'CLM-2026-012', userId: 7, userNm: '강예은', orderId: 'ORD-2026-012', type: '취소', status: '취소처리중', requestDate: '2026-04-04 09:47', prodNm: '슬림핏 데님 진 외 1', reason: '주문실수', refundAmount: 94900 },
      { claimId: 'CLM-2026-011', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-011', type: '취소', status: '취소완료', requestDate: '2026-04-01 15:08', prodNm: '울 블렌드 롱코트', reason: '배송지연', refundAmount: 119000 },
      { claimId: 'CLM-2026-009', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-009', type: '반품', status: '반품요청', requestDate: '2026-04-05 20:11', prodNm: '퀼티드 숏 점퍼', reason: '상품불량', refundAmount: 89000 },
      { claimId: 'CLM-2026-008', userId: 6, userNm: '정민호', orderId: 'ORD-2026-008', type: '반품', status: '수거예정', requestDate: '2026-04-03 13:52', prodNm: '리넨 오버핏 블레이저', reason: '사이즈 불일치', refundAmount: 95000 },
      { claimId: 'CLM-2026-007', userId: 3, userNm: '박민준', orderId: 'ORD-2026-007', type: '반품', status: '수거완료', requestDate: '2026-03-30 08:29', prodNm: '플로럴 미디 드레스', reason: '색상 상이', refundAmount: 79000 },
      { claimId: 'CLM-2026-006', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-006', type: '반품', status: '환불처리중', requestDate: '2026-03-25 16:44', prodNm: '후드 집업 스웨트셔츠', reason: '상품불량', refundAmount: 69000 },
      { claimId: 'CLM-2026-005', userId: 8, userNm: '윤성준', orderId: 'ORD-2026-005', type: '반품', status: '환불완료', requestDate: '2026-03-18 10:17', prodNm: '맥시 롱 원피스', reason: '단순변심', refundAmount: 88000 },
      { claimId: 'CLM-2026-004', userId: 2, userNm: '이영희', orderId: 'ORD-2026-004', type: '교환', status: '교환요청', requestDate: '2026-04-06 22:05', prodNm: '케이블 니트 스웨터', reason: '사이즈 불일치', refundAmount: 0 },
      { claimId: 'CLM-2026-003', userId: 4, userNm: '김수현', orderId: 'ORD-2026-003', type: '교환', status: '수거예정', requestDate: '2026-04-02 07:38', prodNm: '조거 스웻 팬츠', reason: '색상 변경', refundAmount: 0 },
      { claimId: 'CLM-2026-002', userId: 6, userNm: '정민호', orderId: 'ORD-2026-002', type: '교환', status: '발송완료', requestDate: '2026-03-26 19:51', prodNm: '체크 플란넬 셔츠', reason: '사이즈 불일치', refundAmount: 0 },
      { claimId: 'CLM-2026-001', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-001', type: '교환', status: '교환완료', requestDate: '2026-03-15 12:44', prodNm: '스트라이프 린넨 셔츠', reason: '상품불량', refundAmount: 0 },
    ],

    deliveries: [
      { dlivId: 'DLIV-025', orderId: 'ORD-2026-025', userId: 1, userNm: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '배송예정', trackingNo: '', status: '배송준비', regDate: '2026-04-05' },
      { dlivId: 'DLIV-024', orderId: 'ORD-2026-024', userId: 1, userNm: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '배송예정', trackingNo: '', status: '배송준비', regDate: '2026-04-04' },
      { dlivId: 'DLIV-023', orderId: 'ORD-2026-023', userId: 2, userNm: '이영희', receiver: '이영희', address: '부산 해운대구 센텀로 45', phone: '010-2222-2222', courier: 'CJ대한통운', trackingNo: '123456789012', status: '배송중', regDate: '2026-04-02' },
      { dlivId: 'DLIV-022', orderId: 'ORD-2026-022', userId: 3, userNm: '박민준', receiver: '박민준', address: '대전 유성구 대학로 78', phone: '010-3333-3333', courier: '롯데택배', trackingNo: '987654321098', status: '배송완료', regDate: '2026-03-28' },
      { dlivId: 'DLIV-021', orderId: 'ORD-2026-021', userId: 1, userNm: '홍길동', receiver: '홍길동', address: '서울 강남구 테헤란로 123', phone: '010-1111-1111', courier: '한진택배', trackingNo: '456789012345', status: '배송완료', regDate: '2026-03-22' },
      { dlivId: 'DLIV-020', orderId: 'ORD-2026-020', userId: 4, userNm: '김수현', receiver: '김수현', address: '인천 남동구 논현로 89', phone: '010-4444-4444', courier: 'CJ대한통운', trackingNo: '321098765432', status: '배송완료', regDate: '2026-03-18' },
      { dlivId: 'DLIV-017', orderId: 'ORD-2026-017', userId: 6, userNm: '정민호', receiver: '정민호', address: '서울 마포구 홍대입구로 56', phone: '010-6666-6666', courier: '한진택배', trackingNo: '234567890123', status: '배송완료', regDate: '2026-03-07' },
      { dlivId: 'DLIV-016', orderId: 'ORD-2026-016', userId: 3, userNm: '박민준', receiver: '박민준', address: '대전 유성구 대학로 78', phone: '010-3333-3333', courier: 'CJ대한통운', trackingNo: '789012345678', status: '배송완료', regDate: '2026-02-27' },
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
      { cacheId: 1, userId: 1, userNm: '홍길동', date: '2026-04-05 14:22', type: '충전', amount: 5000, desc: '이벤트 참여 적립', balance: 23500 },
      { cacheId: 2, userId: 1, userNm: '홍길동', date: '2026-03-28 16:50', type: '사용', amount: -3000, desc: 'ORD-2026-023 결제 사용', balance: 18500 },
      { cacheId: 3, userId: 2, userNm: '이영희', date: '2026-03-22 11:05', type: '충전', amount: 10000, desc: '직접 충전', balance: 15000 },
      { cacheId: 4, userId: 1, userNm: '홍길동', date: '2026-03-15 09:33', type: '사용', amount: -5000, desc: 'ORD-2026-022 결제 사용', balance: 11500 },
      { cacheId: 5, userId: 3, userNm: '박민준', date: '2026-03-10 20:14', type: '충전', amount: 3000, desc: '리뷰 작성 적립', balance: 8000 },
      { cacheId: 6, userId: 2, userNm: '이영희', date: '2026-03-05 13:47', type: '사용', amount: -2000, desc: 'ORD-2026-021 결제 사용', balance: 5000 },
      { cacheId: 7, userId: 8, userNm: '윤성준', date: '2026-02-25 17:28', type: '충전', amount: 5000, desc: '친구 초대 적립', balance: 12000 },
      { cacheId: 8, userId: 4, userNm: '김수현', date: '2026-02-18 08:55', type: '충전', amount: 2000, desc: '회원가입 축하 적립', balance: 2000 },
      { cacheId: 9, userId: 1, userNm: '홍길동', date: '2026-02-10 19:02', type: '충전', amount: 10000, desc: '직접 충전', balance: 10000 },
      { cacheId: 10, userId: 6, userNm: '정민호', date: '2026-02-05 11:30', type: '사용', amount: -3000, desc: 'ORD-2026-019 결제 취소 환불', balance: 7000 },
      { cacheId: 11, userId: 3, userNm: '박민준', date: '2026-01-30 10:00', type: '충전', amount: 5000, desc: '이벤트 참여 적립', balance: 5000 },
      { cacheId: 12, userId: 8, userNm: '윤성준', date: '2026-01-25 15:44', type: '충전', amount: 10000, desc: '연말 이벤트 적립', balance: 22000 },
    ],

    widgetLibs: (function(){
      const D = (o) => Object.assign({ clickAction:'none', clickTarget:'', imageUrl:'', altText:'', linkUrl:'', productIds:'', chartTitle:'', chartLabels:'', chartValues:'', textContent:'', bgColor:'#ffffff', textColor:'#222222', infoTitle:'', infoBody:'', popupWidth:600, popupHeight:400, fileUrl:'', fileLabel:'', couponCode:'', couponDesc:'', htmlContent:'', eventId:'', cacheDesc:'', cacheAmount:0, embedCode:'', fileListJson:'[]', condSite:'', condUser:'', condCategory:'', condBrand:'', condSort:'newest', condLimit:8, status:'활성' }, o);
      return [
        /* ── image_banner 1~10 ── */
        D({ libId:  1, widgetType:'image_banner',   name:'봄맞이 세일 메인배너',     desc:'홈 상단 봄 시즌 대표 배너',      tags:'봄,메인,배너',      regDate:'2026-01-05', clickAction:'navigate', clickTarget:'/products', imageUrl:'/img/spring-main.jpg',    altText:'봄맞이 세일',      linkUrl:'/products' }),
        D({ libId:  2, widgetType:'image_banner',   name:'여름 시즌 프리뷰 배너',    desc:'여름 신상 사전공개 배너',        tags:'여름,시즌,배너',     regDate:'2026-01-10', clickAction:'navigate', clickTarget:'/summer',   imageUrl:'/img/summer-preview.jpg', altText:'여름 프리뷰',      linkUrl:'/summer' }),
        D({ libId:  3, widgetType:'image_banner',   name:'가을 컬렉션 배너',         desc:'가을 신상 컬렉션 홍보 배너',     tags:'가을,컬렉션,배너',   regDate:'2026-01-15', clickAction:'navigate', clickTarget:'/collection',imageUrl:'/img/autumn.jpg',         altText:'가을 컬렉션',      linkUrl:'/collection' }),
        D({ libId:  4, widgetType:'image_banner',   name:'겨울 특가 배너',           desc:'겨울 시즌 특가 이미지 배너',     tags:'겨울,특가,배너',     regDate:'2026-01-20', clickAction:'navigate', clickTarget:'/sale',     imageUrl:'/img/winter-sale.jpg',    altText:'겨울 특가',        linkUrl:'/sale' }),
        D({ libId:  5, widgetType:'image_banner',   name:'VIP 전용 이미지 배너',     desc:'VIP 회원 전용 특별 배너',        tags:'VIP,배너,전용',      regDate:'2026-01-25', clickAction:'navigate', clickTarget:'/vip',      imageUrl:'/img/vip-banner.jpg',     altText:'VIP 전용 혜택',    linkUrl:'/vip' }),
        D({ libId:  6, widgetType:'image_banner',   name:'신규회원 환영 배너',        desc:'신규 가입자 대상 환영 배너',     tags:'신규,환영,배너',     regDate:'2026-02-01', clickAction:'navigate', clickTarget:'/join',     imageUrl:'/img/welcome.jpg',        altText:'신규회원 환영',    linkUrl:'/join' }),
        D({ libId:  7, widgetType:'image_banner',   name:'앱 다운로드 유도 배너',     desc:'모바일 앱 설치 유도 배너',       tags:'앱,다운로드,배너',   regDate:'2026-02-05', clickAction:'navigate', clickTarget:'/app',      imageUrl:'/img/app-banner.jpg',     altText:'앱 다운로드',      linkUrl:'/app' }),
        D({ libId:  8, widgetType:'image_banner',   name:'브랜드 위크 배너',          desc:'브랜드 특집 주간 홍보 배너',     tags:'브랜드,위크,배너',   regDate:'2026-02-10', clickAction:'navigate', clickTarget:'/brand',    imageUrl:'/img/brand-week.jpg',     altText:'브랜드 위크',      linkUrl:'/brand' }),
        D({ libId:  9, widgetType:'image_banner',   name:'블랙프라이데이 배너',       desc:'연말 블랙프라이데이 특가 배너',  tags:'블랙프라이데이,배너', regDate:'2026-02-15', clickAction:'navigate', clickTarget:'/bf',       imageUrl:'/img/black-friday.jpg',   altText:'블랙프라이데이',   linkUrl:'/bf' }),
        D({ libId: 10, widgetType:'image_banner',   name:'창립기념 이미지 배너',      desc:'창립 기념일 특별 배너',          tags:'기념,창립,배너',     regDate:'2026-02-20', clickAction:'navigate', clickTarget:'/anniversary',imageUrl:'/img/anniversary.jpg',   altText:'창립 기념',        linkUrl:'/anniversary' }),
        /* ── product_slider 11~20 ── */
        D({ libId: 11, widgetType:'product_slider', name:'신상품 추천 슬라이더',      desc:'최신 입고 상품 슬라이더',        tags:'신상품,슬라이더',    regDate:'2026-01-06', clickAction:'navigate', clickTarget:'/new',      productIds:'1,2,3,4,5' }),
        D({ libId: 12, widgetType:'product_slider', name:'베스트셀러 슬라이더',       desc:'판매량 상위 상품 슬라이더',      tags:'베스트,슬라이더',    regDate:'2026-01-11', clickAction:'navigate', clickTarget:'/best',     productIds:'6,7,8,9,10' }),
        D({ libId: 13, widgetType:'product_slider', name:'할인상품 슬라이더',         desc:'현재 할인 진행 상품 슬라이더',   tags:'할인,슬라이더',      regDate:'2026-01-16', clickAction:'navigate', clickTarget:'/sale',     productIds:'11,12,13,14,15' }),
        D({ libId: 14, widgetType:'product_slider', name:'여성 카테고리 슬라이더',    desc:'여성 카테고리 추천 상품',        tags:'여성,카테고리',      regDate:'2026-01-21', clickAction:'navigate', clickTarget:'/women',    productIds:'1,3,5,7,9' }),
        D({ libId: 15, widgetType:'product_slider', name:'남성 카테고리 슬라이더',    desc:'남성 카테고리 추천 상품',        tags:'남성,카테고리',      regDate:'2026-01-26', clickAction:'navigate', clickTarget:'/men',      productIds:'2,4,6,8,10' }),
        D({ libId: 16, widgetType:'product_slider', name:'VIP 전용 상품 슬라이더',    desc:'VIP 회원 전용 상품 추천',        tags:'VIP,슬라이더',       regDate:'2026-02-02', clickAction:'navigate', clickTarget:'/vip',      productIds:'14,15,16,17,18' }),
        D({ libId: 17, widgetType:'product_slider', name:'한정판 상품 슬라이더',      desc:'한정 수량 상품 슬라이더',        tags:'한정판,슬라이더',    regDate:'2026-02-07', clickAction:'navigate', clickTarget:'/limited',  productIds:'19,20,21,22,23' }),
        D({ libId: 18, widgetType:'product_slider', name:'리뷰우수 상품 슬라이더',    desc:'리뷰 평점 4.5↑ 상품',           tags:'리뷰,슬라이더',      regDate:'2026-02-12', clickAction:'navigate', clickTarget:'/review',   productIds:'5,10,15,20,25' }),
        D({ libId: 19, widgetType:'product_slider', name:'재입고 상품 슬라이더',      desc:'품절 후 재입고 상품',            tags:'재입고,슬라이더',    regDate:'2026-02-17', clickAction:'navigate', clickTarget:'/restock',  productIds:'3,7,12,18,24' }),
        D({ libId: 20, widgetType:'product_slider', name:'기획전 상품 슬라이더',      desc:'특별 기획전 상품 모음',          tags:'기획전,슬라이더',    regDate:'2026-02-22', clickAction:'navigate', clickTarget:'/special',  productIds:'1,6,11,16,21' }),
        /* ── product 21~30 ── */
        D({ libId: 21, widgetType:'product',        name:'시그니처 코트 단품',        desc:'대표 시그니처 코트 단일 노출',   tags:'코트,단품,시그니처', regDate:'2026-01-07', clickAction:'navigate', clickTarget:'/detail/1', productIds:'1' }),
        D({ libId: 22, widgetType:'product',        name:'데님 재킷 단품',            desc:'베스트 데님 재킷 단일 노출',     tags:'데님,재킷,단품',     regDate:'2026-01-12', clickAction:'navigate', clickTarget:'/detail/2', productIds:'2' }),
        D({ libId: 23, widgetType:'product',        name:'린넨 블라우스 단품',        desc:'봄 시즌 린넨 블라우스 노출',     tags:'블라우스,봄,단품',   regDate:'2026-01-17', clickAction:'navigate', clickTarget:'/detail/3', productIds:'3' }),
        D({ libId: 24, widgetType:'product',        name:'울 블렌드 롱코트 단품',     desc:'겨울 대표 롱코트 단일 노출',     tags:'롱코트,울,단품',     regDate:'2026-01-22', clickAction:'navigate', clickTarget:'/detail/4', productIds:'4' }),
        D({ libId: 25, widgetType:'product',        name:'플로럴 원피스 단품',        desc:'여름 시즌 원피스 단일 노출',     tags:'원피스,여름,단품',   regDate:'2026-01-27', clickAction:'navigate', clickTarget:'/detail/5', productIds:'5' }),
        D({ libId: 26, widgetType:'product',        name:'캐시미어 니트 단품',        desc:'겨울 니트 단품 프로모션',        tags:'니트,캐시미어,단품', regDate:'2026-02-03', clickAction:'navigate', clickTarget:'/detail/6', productIds:'6' }),
        D({ libId: 27, widgetType:'product',        name:'스트라이프 셔츠 단품',      desc:'트렌드 스트라이프 셔츠',         tags:'셔츠,스트라이프',    regDate:'2026-02-08', clickAction:'navigate', clickTarget:'/detail/7', productIds:'7' }),
        D({ libId: 28, widgetType:'product',        name:'와이드 팬츠 단품',          desc:'편안한 와이드 팬츠 노출',        tags:'팬츠,와이드,단품',   regDate:'2026-02-13', clickAction:'navigate', clickTarget:'/detail/8', productIds:'8' }),
        D({ libId: 29, widgetType:'product',        name:'레더 재킷 단품',            desc:'시즌리스 레더 재킷',             tags:'레더,재킷,단품',     regDate:'2026-02-18', clickAction:'navigate', clickTarget:'/detail/9', productIds:'9' }),
        D({ libId: 30, widgetType:'product',        name:'미디 스커트 단품',          desc:'봄 시즌 미디 스커트',            tags:'스커트,미디,단품',   regDate:'2026-02-23', clickAction:'navigate', clickTarget:'/detail/10',productIds:'10' }),
        /* ── cond_product 31~40 ── */
        D({ libId: 31, widgetType:'cond_product',   name:'최신 여성복 조건상품',      desc:'여성 카테고리 최신순 자동 노출', tags:'여성,최신,조건',     regDate:'2026-01-08', condCategory:'women',  condSort:'newest',   condLimit:8 }),
        D({ libId: 32, widgetType:'cond_product',   name:'남성 베스트셀러 조건상품',  desc:'남성 카테고리 인기순 자동',      tags:'남성,베스트,조건',   regDate:'2026-01-13', condCategory:'men',    condSort:'popular',  condLimit:8 }),
        D({ libId: 33, widgetType:'cond_product',   name:'가격낮은 아우터 조건상품',  desc:'아우터 카테고리 저가순 자동',    tags:'아우터,가격,조건',   regDate:'2026-01-18', condCategory:'outer',  condSort:'price_asc', condLimit:6 }),
        D({ libId: 34, widgetType:'cond_product',   name:'브랜드A 신상품 조건상품',   desc:'특정 브랜드 최신 상품 자동',     tags:'브랜드A,신상,조건',  regDate:'2026-01-23', condBrand:'brandA',    condSort:'newest',   condLimit:8 }),
        D({ libId: 35, widgetType:'cond_product',   name:'세일 상품 인기순 조건상품', desc:'할인 적용 상품 인기순 자동',     tags:'세일,인기,조건',     regDate:'2026-01-28', condCategory:'sale',   condSort:'popular',  condLimit:10 }),
        D({ libId: 36, widgetType:'cond_product',   name:'악세서리 신상 조건상품',    desc:'악세서리 카테고리 최신 자동',    tags:'악세서리,신상,조건', regDate:'2026-02-04', condCategory:'acc',    condSort:'newest',   condLimit:8 }),
        D({ libId: 37, widgetType:'cond_product',   name:'슈즈 베스트 조건상품',      desc:'슈즈 카테고리 인기순 자동',      tags:'슈즈,베스트,조건',   regDate:'2026-02-09', condCategory:'shoes',  condSort:'popular',  condLimit:8 }),
        D({ libId: 38, widgetType:'cond_product',   name:'고가 상품 조건상품',        desc:'100,000원 이상 상품 인기순',     tags:'고가,조건,VIP',      regDate:'2026-02-14', condCategory:'',       condSort:'price_desc',condLimit:6 }),
        D({ libId: 39, widgetType:'cond_product',   name:'브랜드B 베스트 조건상품',   desc:'브랜드B 인기 상품 자동 노출',    tags:'브랜드B,베스트,조건',regDate:'2026-02-19', condBrand:'brandB',    condSort:'popular',  condLimit:8 }),
        D({ libId: 40, widgetType:'cond_product',   name:'신규입고 전체 조건상품',    desc:'전 카테고리 신규입고 최신순',    tags:'신규,입고,조건',     regDate:'2026-02-24', condCategory:'',       condSort:'newest',   condLimit:12 }),
        /* ── chart_bar 41~50 ── */
        D({ libId: 41, widgetType:'chart_bar',      name:'주간 판매 베스트 차트',     desc:'요일별 판매량 바 차트',          tags:'판매,주간,bar',      regDate:'2026-01-09', chartTitle:'주간 베스트',   chartLabels:'월,화,수,목,금,토,일',    chartValues:'120,145,98,200,175,220,190' }),
        D({ libId: 42, widgetType:'chart_bar',      name:'월간 카테고리 판매 차트',   desc:'카테고리별 월 판매량 비교',      tags:'카테고리,월간,bar',  regDate:'2026-01-14', chartTitle:'카테고리 판매', chartLabels:'아우터,상의,하의,원피스,악세서리',chartValues:'350,480,290,420,180' }),
        D({ libId: 43, widgetType:'chart_bar',      name:'분기별 매출 비교 차트',     desc:'분기별 매출 현황 바 차트',       tags:'분기,매출,bar',      regDate:'2026-01-19', chartTitle:'분기 매출',     chartLabels:'1Q,2Q,3Q,4Q',             chartValues:'1200,1580,1350,1900' }),
        D({ libId: 44, widgetType:'chart_bar',      name:'브랜드별 판매 차트',        desc:'브랜드 판매량 비교 바 차트',     tags:'브랜드,판매,bar',    regDate:'2026-01-24', chartTitle:'브랜드 판매',   chartLabels:'A,B,C,D,E',               chartValues:'320,450,280,390,510' }),
        D({ libId: 45, widgetType:'chart_bar',      name:'연령대별 구매 차트',        desc:'연령대별 구매비중 바 차트',      tags:'연령,구매,bar',      regDate:'2026-01-29', chartTitle:'연령대 구매',   chartLabels:'10대,20대,30대,40대,50대+', chartValues:'80,420,580,310,150' }),
        D({ libId: 46, widgetType:'chart_bar',      name:'시간대별 주문 차트',        desc:'시간대별 주문수 바 차트',        tags:'시간,주문,bar',      regDate:'2026-02-05', chartTitle:'시간대 주문',   chartLabels:'0-6시,6-12시,12-18시,18-24시',chartValues:'45,230,420,310' }),
        D({ libId: 47, widgetType:'chart_bar',      name:'지역별 배송 차트',          desc:'지역별 배송건수 바 차트',        tags:'지역,배송,bar',      regDate:'2026-02-10', chartTitle:'지역 배송',     chartLabels:'서울,경기,부산,대구,기타',  chartValues:'580,420,190,140,270' }),
        D({ libId: 48, widgetType:'chart_bar',      name:'상품 리뷰 평점 차트',       desc:'상품별 평균 평점 바 차트',       tags:'리뷰,평점,bar',      regDate:'2026-02-15', chartTitle:'평균 평점',     chartLabels:'상품A,상품B,상품C,상품D,상품E',chartValues:'48,43,46,39,50' }),
        D({ libId: 49, widgetType:'chart_bar',      name:'결제수단 비교 차트',        desc:'결제수단별 이용 비중 바 차트',   tags:'결제,수단,bar',      regDate:'2026-02-20', chartTitle:'결제 수단',     chartLabels:'신용카드,카카오페이,네이버페이,무통장,포인트',chartValues:'480,320,210,90,60' }),
        D({ libId: 50, widgetType:'chart_bar',      name:'월별 신규회원 차트',        desc:'월별 신규 가입자수 바 차트',     tags:'신규,회원,bar',      regDate:'2026-02-25', chartTitle:'신규 회원',     chartLabels:'1월,2월,3월,4월,5월,6월',  chartValues:'120,95,140,180,160,200' }),
        /* ── chart_line 51~60 ── */
        D({ libId: 51, widgetType:'chart_line',     name:'월별 매출 추이 차트',       desc:'최근 6개월 매출 라인 차트',      tags:'매출,추이,line',     regDate:'2026-01-10', chartTitle:'월별 매출',     chartLabels:'11월,12월,1월,2월,3월,4월',chartValues:'980,1450,1100,1280,1380,1520' }),
        D({ libId: 52, widgetType:'chart_line',     name:'일별 방문자 추이 차트',     desc:'최근 7일 방문자 라인 차트',      tags:'방문자,추이,line',   regDate:'2026-01-15', chartTitle:'일별 방문자',   chartLabels:'월,화,수,목,금,토,일',    chartValues:'1200,1350,980,1480,1600,2100,1850' }),
        D({ libId: 53, widgetType:'chart_line',     name:'주간 전환율 추이 차트',     desc:'구매 전환율 주간 라인 차트',     tags:'전환율,주간,line',   regDate:'2026-01-20', chartTitle:'전환율(%)',     chartLabels:'1주,2주,3주,4주,5주,6주', chartValues:'23,26,24,29,31,28' }),
        D({ libId: 54, widgetType:'chart_line',     name:'재구매율 월별 차트',        desc:'월별 재구매율 라인 차트',        tags:'재구매,월별,line',   regDate:'2026-01-25', chartTitle:'재구매율(%)',   chartLabels:'10월,11월,12월,1월,2월,3월',chartValues:'31,35,42,38,33,37' }),
        D({ libId: 55, widgetType:'chart_line',     name:'평균 주문금액 추이',        desc:'월별 평균 주문금액 라인 차트',   tags:'주문금액,추이,line', regDate:'2026-01-30', chartTitle:'평균 주문금액', chartLabels:'10월,11월,12월,1월,2월,3월',chartValues:'58000,65000,72000,61000,63000,67000' }),
        D({ libId: 56, widgetType:'chart_line',     name:'카트 이탈율 추이 차트',     desc:'장바구니 이탈율 라인 차트',      tags:'카트,이탈,line',     regDate:'2026-02-06', chartTitle:'카트 이탈율',   chartLabels:'1월,2월,3월,4월',         chartValues:'68,64,61,59' }),
        D({ libId: 57, widgetType:'chart_line',     name:'VIP 증가 추이 차트',        desc:'VIP 등급 회원 증가 라인 차트',   tags:'VIP,증가,line',      regDate:'2026-02-11', chartTitle:'VIP 회원 수',   chartLabels:'1월,2월,3월,4월',         chartValues:'320,358,401,445' }),
        D({ libId: 58, widgetType:'chart_line',     name:'클레임 발생 추이 차트',     desc:'월별 클레임 건수 라인 차트',     tags:'클레임,추이,line',   regDate:'2026-02-16', chartTitle:'클레임 건수',   chartLabels:'10월,11월,12월,1월,2월,3월',chartValues:'45,52,38,41,36,33' }),
        D({ libId: 59, widgetType:'chart_line',     name:'쿠폰 사용률 추이 차트',     desc:'월별 쿠폰 사용률 라인 차트',     tags:'쿠폰,사용률,line',   regDate:'2026-02-21', chartTitle:'쿠폰 사용률',   chartLabels:'1월,2월,3월,4월',         chartValues:'38,41,44,47' }),
        D({ libId: 60, widgetType:'chart_line',     name:'적립금 사용 추이 차트',     desc:'월별 포인트 사용액 라인 차트',   tags:'적립금,추이,line',   regDate:'2026-02-26', chartTitle:'적립금 사용',   chartLabels:'1월,2월,3월,4월',         chartValues:'120000,145000,138000,162000' }),
        /* ── chart_pie 61~70 ── */
        D({ libId: 61, widgetType:'chart_pie',      name:'카테고리 매출 비중 차트',   desc:'카테고리별 매출 파이 차트',      tags:'카테고리,비중,pie',  regDate:'2026-01-11', chartTitle:'카테고리 비중', chartLabels:'아우터,상의,하의,원피스,기타',  chartValues:'35,25,20,15,5' }),
        D({ libId: 62, widgetType:'chart_pie',      name:'결제수단 비중 파이 차트',   desc:'결제 방법별 비중 파이 차트',     tags:'결제,비중,pie',      regDate:'2026-01-16', chartTitle:'결제 비중',     chartLabels:'카드,카카오,네이버,무통장,기타',chartValues:'45,25,18,8,4' }),
        D({ libId: 63, widgetType:'chart_pie',      name:'연령대 구매 비중 차트',     desc:'연령대별 구매 비중 파이',        tags:'연령,비중,pie',      regDate:'2026-01-21', chartTitle:'연령 비중',     chartLabels:'10대,20대,30대,40대,50대+', chartValues:'6,30,42,15,7' }),
        D({ libId: 64, widgetType:'chart_pie',      name:'등급별 회원 비중 차트',     desc:'회원 등급 분포 파이 차트',       tags:'등급,비중,pie',      regDate:'2026-01-26', chartTitle:'등급 분포',     chartLabels:'일반,우수,VIP',             chartValues:'65,25,10' }),
        D({ libId: 65, widgetType:'chart_pie',      name:'성별 구매 비중 차트',       desc:'남/여 구매 비중 파이 차트',      tags:'성별,비중,pie',      regDate:'2026-01-31', chartTitle:'성별 비중',     chartLabels:'여성,남성',                 chartValues:'68,32' }),
        D({ libId: 66, widgetType:'chart_pie',      name:'지역별 주문 비중 차트',     desc:'지역별 주문 비중 파이 차트',     tags:'지역,주문,pie',      regDate:'2026-02-07', chartTitle:'지역 비중',     chartLabels:'서울,경기,부산,대구,기타',  chartValues:'38,28,12,9,13' }),
        D({ libId: 67, widgetType:'chart_pie',      name:'브랜드 매출 비중 차트',     desc:'브랜드별 매출 비중 파이',        tags:'브랜드,비중,pie',    regDate:'2026-02-12', chartTitle:'브랜드 비중',   chartLabels:'A,B,C,D,기타',             chartValues:'32,28,18,14,8' }),
        D({ libId: 68, widgetType:'chart_pie',      name:'클레임 유형 비중 차트',     desc:'클레임 유형 분포 파이 차트',     tags:'클레임,유형,pie',    regDate:'2026-02-17', chartTitle:'클레임 유형',   chartLabels:'교환,반품,환불,AS,기타',    chartValues:'35,30,20,10,5' }),
        D({ libId: 69, widgetType:'chart_pie',      name:'배송 방법 비중 차트',       desc:'배송방법 선택 비중 파이',        tags:'배송,방법,pie',      regDate:'2026-02-22', chartTitle:'배송 방법',     chartLabels:'택배,직접수령,당일배송,새벽배송',chartValues:'60,15,15,10' }),
        D({ libId: 70, widgetType:'chart_pie',      name:'리뷰 평점 분포 차트',       desc:'상품 리뷰 평점 분포 파이',       tags:'리뷰,평점,pie',      regDate:'2026-02-27', chartTitle:'평점 분포',     chartLabels:'5점,4점,3점,2점,1점',      chartValues:'45,30,15,6,4' }),
        /* ── text_banner 71~80 ── */
        D({ libId: 71, widgetType:'text_banner',    name:'로그인 유도 텍스트',        desc:'비로그인 회원 로그인 유도',      tags:'로그인,유도,텍스트', regDate:'2026-01-12', clickAction:'navigate', clickTarget:'/login',    textContent:'지금 로그인하고 <b>특별 혜택</b>을 받아보세요!', bgColor:'#fff3e0', textColor:'#e65100' }),
        D({ libId: 72, widgetType:'text_banner',    name:'VIP 혜택 안내 텍스트',      desc:'VIP 전용 혜택 안내 텍스트',     tags:'VIP,혜택,텍스트',    regDate:'2026-01-17', clickAction:'navigate', clickTarget:'/vip',      textContent:'🌟 VIP 회원님께만 드리는 <b>특별 혜택</b>', bgColor:'#1a237e', textColor:'#e8eaf6' }),
        D({ libId: 73, widgetType:'text_banner',    name:'무료배송 안내 텍스트',      desc:'무료배송 조건 안내 텍스트',     tags:'배송,무료,텍스트',   regDate:'2026-01-22', clickAction:'none',      clickTarget:'',          textContent:'🚚 <b>50,000원</b> 이상 구매 시 무료배송!', bgColor:'#e8f5e9', textColor:'#1b5e20' }),
        D({ libId: 74, widgetType:'text_banner',    name:'신규가입 쿠폰 안내',        desc:'신규 가입 혜택 쿠폰 안내 텍스트',tags:'신규,쿠폰,텍스트',   regDate:'2026-01-27', clickAction:'navigate', clickTarget:'/join',     textContent:'✨ 지금 가입하면 <b>10,000원</b> 쿠폰 즉시 지급!', bgColor:'#fce4ec', textColor:'#c62828' }),
        D({ libId: 75, widgetType:'text_banner',    name:'시즌오프 세일 텍스트',      desc:'시즌오프 특가 안내 텍스트',     tags:'세일,시즌오프,텍스트',regDate:'2026-02-01', clickAction:'navigate', clickTarget:'/sale',     textContent:'⚡ 시즌오프 <b>최대 70% 할인</b> 지금 바로!', bgColor:'#212121', textColor:'#ffeb3b' }),
        D({ libId: 76, widgetType:'text_banner',    name:'앱 전용 할인 안내',         desc:'앱 설치 전용 할인 텍스트',      tags:'앱,할인,텍스트',     regDate:'2026-02-06', clickAction:'navigate', clickTarget:'/app',      textContent:'📱 앱 다운로드 후 <b>추가 5% 할인</b> 적용!', bgColor:'#e3f2fd', textColor:'#0d47a1' }),
        D({ libId: 77, widgetType:'text_banner',    name:'이벤트 마감 임박 텍스트',   desc:'이벤트 종료 카운트다운 텍스트', tags:'이벤트,마감,텍스트', regDate:'2026-02-11', clickAction:'navigate', clickTarget:'/event',    textContent:'⏰ 이벤트 마감 <b>D-3</b>! 서두르세요!', bgColor:'#bf360c', textColor:'#ffffff' }),
        D({ libId: 78, widgetType:'text_banner',    name:'포인트 적립 안내 텍스트',   desc:'구매 포인트 적립 안내',         tags:'포인트,적립,텍스트', regDate:'2026-02-16', clickAction:'none',      clickTarget:'',          textContent:'💰 구매금액의 <b>1~5%</b> 포인트로 돌려드려요!', bgColor:'#f3e5f5', textColor:'#4a148c' }),
        D({ libId: 79, widgetType:'text_banner',    name:'당일배송 안내 텍스트',      desc:'당일 배송 조건 안내 텍스트',    tags:'당일,배송,텍스트',   regDate:'2026-02-21', clickAction:'none',      clickTarget:'',          textContent:'⚡ 오후 <b>2시 이전</b> 주문 시 당일 출고!', bgColor:'#e0f7fa', textColor:'#006064' }),
        D({ libId: 80, widgetType:'text_banner',    name:'리뷰 이벤트 안내 텍스트',   desc:'리뷰 작성 보상 이벤트 안내',    tags:'리뷰,이벤트,텍스트', regDate:'2026-02-26', clickAction:'navigate', clickTarget:'/review',   textContent:'📝 리뷰 작성 시 <b>500포인트</b> 즉시 지급!', bgColor:'#fff8e1', textColor:'#f57f17' }),
        /* ── info_card 81~90 ── */
        D({ libId: 81, widgetType:'info_card',      name:'등급별 혜택 안내 카드',     desc:'회원 등급 혜택 상세 정보 카드',  tags:'등급,혜택,카드',     regDate:'2026-01-13', infoTitle:'나의 등급 혜택',      infoBody:'일반: 기본 적립 1%\n우수: 추가 적립 2% + 무료배송\nVIP: 추가 적립 5% + 무료배송 + 전용쿠폰' }),
        D({ libId: 82, widgetType:'info_card',      name:'배송 정책 안내 카드',       desc:'배송비 및 정책 안내 정보 카드',  tags:'배송,정책,카드',     regDate:'2026-01-18', infoTitle:'배송 안내',           infoBody:'기본 배송비: 3,000원\n50,000원 이상 무료배송\n도서산간 지역 추가 배송비 발생' }),
        D({ libId: 83, widgetType:'info_card',      name:'반품/교환 안내 카드',       desc:'반품 및 교환 정책 안내 카드',   tags:'반품,교환,카드',     regDate:'2026-01-23', infoTitle:'반품·교환 안내',      infoBody:'수령 후 7일 이내 반품 가능\n단순 변심 반품비: 3,000원\n불량/오배송: 무료 반품' }),
        D({ libId: 84, widgetType:'info_card',      name:'포인트 적립 안내 카드',     desc:'포인트 적립 방법 안내 카드',    tags:'포인트,적립,카드',   regDate:'2026-01-28', infoTitle:'포인트 적립 안내',    infoBody:'구매 시 1% 기본 적립\n리뷰 작성: 500포인트\n첫 구매: 1,000포인트 보너스' }),
        D({ libId: 85, widgetType:'info_card',      name:'고객센터 안내 카드',        desc:'고객센터 연락처 안내 카드',     tags:'고객센터,연락처,카드',regDate:'2026-02-02', infoTitle:'고객센터',            infoBody:'운영시간: 평일 09:00~18:00\n점심: 12:00~13:00\nTel: 1234-5678' }),
        D({ libId: 86, widgetType:'info_card',      name:'결제 안내 카드',            desc:'결제 수단 및 방법 안내 카드',   tags:'결제,안내,카드',     regDate:'2026-02-07', infoTitle:'결제 안내',           infoBody:'신용/체크카드, 카카오페이, 네이버페이\n무통장 입금 (3일 내 미입금 시 자동취소)\n포인트 결합 결제 가능' }),
        D({ libId: 87, widgetType:'info_card',      name:'쿠폰 사용 안내 카드',       desc:'쿠폰 발급 및 사용 안내 카드',   tags:'쿠폰,사용,카드',     regDate:'2026-02-12', infoTitle:'쿠폰 안내',           infoBody:'마이페이지 > 쿠폰함에서 확인\n주문 결제 페이지에서 적용\n중복 사용 불가, 유효기간 확인 필수' }),
        D({ libId: 88, widgetType:'info_card',      name:'사이즈 가이드 안내 카드',   desc:'상품 사이즈 측정 방법 안내',    tags:'사이즈,가이드,카드', regDate:'2026-02-17', infoTitle:'사이즈 가이드',       infoBody:'가슴둘레, 허리둘레, 엉덩이 둘레 측정\nS/M/L/XL 기준 상이 - 상품 상세 참고\n맞지 않을 경우 7일 이내 교환 가능' }),
        D({ libId: 89, widgetType:'info_card',      name:'세탁 방법 안내 카드',       desc:'소재별 세탁 방법 안내 카드',    tags:'세탁,관리,카드',     regDate:'2026-02-22', infoTitle:'세탁 안내',           infoBody:'울/캐시미어: 드라이클리닝 권장\n면/린넨: 30도 미만 손세탁\n합성섬유: 단독 세탁 권장' }),
        D({ libId: 90, widgetType:'info_card',      name:'공지사항 안내 카드',        desc:'주요 공지사항 표시 카드',       tags:'공지,안내,카드',     regDate:'2026-02-27', infoTitle:'주요 공지',           infoBody:'배송 지연 안내: 3/1~3/5 설 연휴\n시스템 점검: 매주 화요일 새벽 2~4시\n반품 주소 변경 안내 참고' }),
        /* ── popup 91~100 ── */
        D({ libId: 91, widgetType:'popup',          name:'앱 다운로드 팝업',          desc:'앱 설치 유도 팝업',             tags:'앱,팝업,다운로드',   regDate:'2026-01-14', clickAction:'navigate', clickTarget:'/app',       imageUrl:'/img/app-popup.jpg',      altText:'앱 다운로드', linkUrl:'/app',       popupWidth:400, popupHeight:500, status:'비활성' }),
        D({ libId: 92, widgetType:'popup',          name:'신규가입 쿠폰 팝업',        desc:'신규 회원 가입 쿠폰 안내 팝업', tags:'신규,쿠폰,팝업',     regDate:'2026-01-19', clickAction:'navigate', clickTarget:'/join',      imageUrl:'/img/join-coupon.jpg',    altText:'신규 쿠폰',  linkUrl:'/join',      popupWidth:500, popupHeight:400 }),
        D({ libId: 93, widgetType:'popup',          name:'이벤트 당첨 팝업',          desc:'이벤트 당첨 알림 팝업',         tags:'이벤트,당첨,팝업',   regDate:'2026-01-24', clickAction:'navigate', clickTarget:'/event',     imageUrl:'/img/event-win.jpg',      altText:'당첨 안내',  linkUrl:'/event',     popupWidth:480, popupHeight:480 }),
        D({ libId: 94, widgetType:'popup',          name:'VIP 전용 혜택 팝업',        desc:'VIP 회원 대상 전용 혜택 팝업',  tags:'VIP,혜택,팝업',      regDate:'2026-01-29', clickAction:'navigate', clickTarget:'/vip',       imageUrl:'/img/vip-popup.jpg',      altText:'VIP 혜택',   linkUrl:'/vip',       popupWidth:500, popupHeight:500 }),
        D({ libId: 95, widgetType:'popup',          name:'시즌세일 팝업',             desc:'시즌 세일 시작 알림 팝업',      tags:'세일,시즌,팝업',     regDate:'2026-02-03', clickAction:'navigate', clickTarget:'/sale',      imageUrl:'/img/season-sale.jpg',    altText:'시즌 세일',  linkUrl:'/sale',      popupWidth:600, popupHeight:400 }),
        D({ libId: 96, widgetType:'popup',          name:'배송 지연 안내 팝업',       desc:'배송 지연 공지 팝업',           tags:'배송,지연,팝업',     regDate:'2026-02-08', clickAction:'none',      clickTarget:'',           imageUrl:'/img/delay-notice.jpg',   altText:'배송지연',   linkUrl:'',           popupWidth:480, popupHeight:350 }),
        D({ libId: 97, widgetType:'popup',          name:'점검 공지 팝업',            desc:'서비스 점검 안내 팝업',         tags:'점검,공지,팝업',     regDate:'2026-02-13', clickAction:'none',      clickTarget:'',           imageUrl:'/img/maintenance.jpg',    altText:'점검 안내',  linkUrl:'',           popupWidth:480, popupHeight:320, status:'비활성' }),
        D({ libId: 98, widgetType:'popup',          name:'할인 쿠폰 지급 팝업',       desc:'즉시 발급 할인 쿠폰 안내 팝업', tags:'쿠폰,할인,팝업',     regDate:'2026-02-18', clickAction:'event',     clickTarget:'issueCoupon',imageUrl:'/img/coupon-popup.jpg',   altText:'쿠폰 발급',  linkUrl:'',           popupWidth:500, popupHeight:450 }),
        D({ libId: 99, widgetType:'popup',          name:'재입고 알림 팝업',          desc:'품절 상품 재입고 알림 팝업',    tags:'재입고,알림,팝업',   regDate:'2026-02-23', clickAction:'navigate', clickTarget:'/restock',   imageUrl:'/img/restock-popup.jpg',  altText:'재입고 알림',linkUrl:'/restock',   popupWidth:480, popupHeight:400 }),
        D({ libId:100, widgetType:'popup',          name:'앱 푸시 동의 팝업',         desc:'앱 푸시 알림 동의 안내 팝업',   tags:'푸시,동의,팝업',     regDate:'2026-02-28', clickAction:'event',     clickTarget:'pushAgree',  imageUrl:'/img/push-popup.jpg',     altText:'푸시 동의',  linkUrl:'',           popupWidth:460, popupHeight:380 }),
        /* ── file 101~110 ── */
        D({ libId:101, widgetType:'file',           name:'회원 이용약관 PDF',         desc:'서비스 이용약관 PDF 다운로드',  tags:'약관,PDF,파일',      regDate:'2026-01-15', fileUrl:'/docs/terms.pdf',           fileLabel:'이용약관 다운로드' }),
        D({ libId:102, widgetType:'file',           name:'개인정보처리방침 PDF',      desc:'개인정보 처리방침 PDF',         tags:'개인정보,PDF,파일',  regDate:'2026-01-20', fileUrl:'/docs/privacy.pdf',         fileLabel:'개인정보처리방침' }),
        D({ libId:103, widgetType:'file',           name:'시즌 상품 카탈로그',        desc:'2026 S/S 상품 카탈로그 PDF',   tags:'카탈로그,PDF,시즌',  regDate:'2026-01-25', fileUrl:'/docs/catalog-2026ss.pdf',  fileLabel:'카탈로그 다운로드' }),
        D({ libId:104, widgetType:'file',           name:'사이즈 가이드 PDF',         desc:'전 상품 사이즈 가이드 PDF',     tags:'사이즈,가이드,PDF',  regDate:'2026-01-30', fileUrl:'/docs/size-guide.pdf',      fileLabel:'사이즈 가이드' }),
        D({ libId:105, widgetType:'file',           name:'세탁 관리 가이드 PDF',      desc:'소재별 세탁·보관 방법 PDF',     tags:'세탁,관리,PDF',      regDate:'2026-02-04', fileUrl:'/docs/care-guide.pdf',      fileLabel:'세탁 가이드 다운로드' }),
        D({ libId:106, widgetType:'file',           name:'기업 소개 PPT',             desc:'ShopJoy 기업 소개 PPT 자료',    tags:'회사소개,PPT,파일',  regDate:'2026-02-09', fileUrl:'/docs/company-intro.pptx',  fileLabel:'기업 소개서 다운로드' }),
        D({ libId:107, widgetType:'file',           name:'입점 신청서 Excel',         desc:'브랜드 입점 신청 양식 Excel',   tags:'입점,신청,Excel',    regDate:'2026-02-14', fileUrl:'/docs/vendor-apply.xlsx',   fileLabel:'입점 신청서 다운로드' }),
        D({ libId:108, widgetType:'file',           name:'환불 신청 양식',            desc:'환불 신청서 Word 양식',         tags:'환불,신청,Word',     regDate:'2026-02-19', fileUrl:'/docs/refund-form.docx',    fileLabel:'환불 신청서 다운로드' }),
        D({ libId:109, widgetType:'file',           name:'브랜드 로고 패키지',        desc:'ShopJoy 브랜드 로고 ZIP',       tags:'로고,브랜드,ZIP',    regDate:'2026-02-24', fileUrl:'/docs/logo-package.zip',    fileLabel:'로고 패키지 다운로드' }),
        D({ libId:110, widgetType:'file',           name:'VIP 혜택 안내서 PDF',       desc:'VIP 전용 혜택 상세 안내서',     tags:'VIP,혜택,PDF',       regDate:'2026-03-01', fileUrl:'/docs/vip-benefits.pdf',    fileLabel:'VIP 혜택 안내서' }),
        /* ── file_list 111~120 ── */
        D({ libId:111, widgetType:'file_list',      name:'시즌 룩북 파일목록',        desc:'2026 S/S 룩북 전체 목록',       tags:'룩북,시즌,파일목록', regDate:'2026-01-16', fileListJson:'[{"name":"2026 S/S 룩북 Vol.1","url":"/lookbook/ss-vol1.pdf"},{"name":"2026 S/S 룩북 Vol.2","url":"/lookbook/ss-vol2.pdf"},{"name":"2026 S/S 룩북 Vol.3","url":"/lookbook/ss-vol3.pdf"}]' }),
        D({ libId:112, widgetType:'file_list',      name:'사이즈 가이드 파일목록',    desc:'카테고리별 사이즈 가이드 목록',  tags:'사이즈,가이드,목록', regDate:'2026-01-21', fileListJson:'[{"name":"상의 사이즈 가이드","url":"/size/top.pdf"},{"name":"하의 사이즈 가이드","url":"/size/bottom.pdf"},{"name":"아우터 사이즈 가이드","url":"/size/outer.pdf"},{"name":"원피스 사이즈 가이드","url":"/size/dress.pdf"}]' }),
        D({ libId:113, widgetType:'file_list',      name:'약관 문서 파일목록',        desc:'각종 약관 문서 파일 목록',      tags:'약관,문서,목록',     regDate:'2026-01-26', fileListJson:'[{"name":"이용약관","url":"/docs/terms.pdf"},{"name":"개인정보처리방침","url":"/docs/privacy.pdf"},{"name":"전자상거래 이용약관","url":"/docs/ec-terms.pdf"}]' }),
        D({ libId:114, widgetType:'file_list',      name:'신상품 카탈로그 목록',      desc:'시즌별 카탈로그 파일 목록',     tags:'카탈로그,신상,목록', regDate:'2026-01-31', fileListJson:'[{"name":"2026 S/S 카탈로그","url":"/catalog/ss2026.pdf"},{"name":"2025 F/W 카탈로그","url":"/catalog/fw2025.pdf"},{"name":"2025 S/S 카탈로그","url":"/catalog/ss2025.pdf"}]' }),
        D({ libId:115, widgetType:'file_list',      name:'브랜드 소개 자료 목록',     desc:'입점 브랜드 소개 자료 목록',    tags:'브랜드,소개,목록',   regDate:'2026-02-05', fileListJson:'[{"name":"브랜드A 소개서","url":"/brand/a-intro.pdf"},{"name":"브랜드B 소개서","url":"/brand/b-intro.pdf"},{"name":"브랜드C 소개서","url":"/brand/c-intro.pdf"}]' }),
        D({ libId:116, widgetType:'file_list',      name:'관리 가이드 파일목록',      desc:'세탁·보관 관리 가이드 목록',    tags:'관리,가이드,목록',   regDate:'2026-02-10', fileListJson:'[{"name":"울/캐시미어 관리법","url":"/care/wool.pdf"},{"name":"가죽 관리법","url":"/care/leather.pdf"},{"name":"데님 관리법","url":"/care/denim.pdf"}]' }),
        D({ libId:117, widgetType:'file_list',      name:'이벤트 응모 양식 목록',     desc:'이벤트별 응모 양식 파일 목록',  tags:'이벤트,응모,목록',   regDate:'2026-02-15', fileListJson:'[{"name":"봄 이벤트 응모 양식","url":"/event/spring-apply.docx"},{"name":"VIP 이벤트 응모 양식","url":"/event/vip-apply.docx"}]' }),
        D({ libId:118, widgetType:'file_list',      name:'입점 서류 제출 목록',       desc:'브랜드 입점 필요 서류 목록',    tags:'입점,서류,목록',     regDate:'2026-02-20', fileListJson:'[{"name":"입점 신청서","url":"/vendor/apply.xlsx"},{"name":"사업자등록증 양식","url":"/vendor/bizreg.pdf"},{"name":"통신판매업 신고증 양식","url":"/vendor/telecom.pdf"}]' }),
        D({ libId:119, widgetType:'file_list',      name:'프로모션 자료 파일목록',    desc:'프로모션 홍보물 파일 목록',     tags:'프로모션,홍보,목록', regDate:'2026-02-25', fileListJson:'[{"name":"배너 이미지 패키지","url":"/promo/banner-pack.zip"},{"name":"SNS 홍보물 패키지","url":"/promo/sns-pack.zip"},{"name":"인쇄물 양식","url":"/promo/print.zip"}]' }),
        D({ libId:120, widgetType:'file_list',      name:'고객 안내 문서 목록',       desc:'고객 대상 각종 안내 문서 목록', tags:'고객,안내,목록',     regDate:'2026-03-02', fileListJson:'[{"name":"반품 신청서","url":"/docs/refund.docx"},{"name":"교환 신청서","url":"/docs/exchange.docx"},{"name":"AS 신청서","url":"/docs/as.docx"},{"name":"분실신고서","url":"/docs/lost.docx"}]' }),
        /* ── coupon 121~130 ── */
        D({ libId:121, widgetType:'coupon',         name:'신규회원 10% 할인쿠폰',     desc:'신규 가입 첫 구매 10% 쿠폰',    tags:'신규,할인,쿠폰',     regDate:'2026-01-17', couponCode:'NEW10',       couponDesc:'신규 회원 첫 구매 10% 할인 (5만원 이상)' }),
        D({ libId:122, widgetType:'coupon',         name:'VIP 전용 20% 쿠폰',         desc:'VIP 회원 전용 20% 할인 쿠폰',   tags:'VIP,할인,쿠폰',      regDate:'2026-01-22', couponCode:'VIP20',       couponDesc:'VIP 회원 전용 20% 할인 (기간 한정)' }),
        D({ libId:123, widgetType:'coupon',         name:'생일 축하 5,000원 쿠폰',    desc:'생일 달 회원 5,000원 쿠폰',     tags:'생일,할인,쿠폰',     regDate:'2026-01-27', couponCode:'BDAY5000',    couponDesc:'생일 축하! 5,000원 할인 쿠폰 (당월 한정)' }),
        D({ libId:124, widgetType:'coupon',         name:'앱 전용 3,000원 쿠폰',      desc:'앱 설치 회원 전용 쿠폰',        tags:'앱,할인,쿠폰',       regDate:'2026-01-32', couponCode:'APP3000',     couponDesc:'앱 설치 고객 전용 3,000원 할인 쿠폰' }),
        D({ libId:125, widgetType:'coupon',         name:'시즌오프 15% 쿠폰',         desc:'시즌오프 세일 기간 15% 쿠폰',   tags:'시즌오프,할인,쿠폰', regDate:'2026-02-02', couponCode:'OFFSEASON15', couponDesc:'시즌오프 기간 전 상품 15% 할인' }),
        D({ libId:126, widgetType:'coupon',         name:'첫 리뷰 작성 쿠폰',         desc:'첫 리뷰 작성 시 2,000원 쿠폰',  tags:'리뷰,할인,쿠폰',     regDate:'2026-02-07', couponCode:'REVIEW2000',  couponDesc:'첫 리뷰 작성 완료 후 2,000원 할인 쿠폰' }),
        D({ libId:127, widgetType:'coupon',         name:'친구 추천 적립 쿠폰',       desc:'친구 추천 성공 시 1만원 쿠폰',  tags:'추천,친구,쿠폰',     regDate:'2026-02-12', couponCode:'FRIEND10000', couponDesc:'친구 추천 가입 완료 시 10,000원 쿠폰 지급' }),
        D({ libId:128, widgetType:'coupon',         name:'무료배송 쿠폰',             desc:'조건 없는 무료배송 쿠폰',        tags:'무료배송,쿠폰',      regDate:'2026-02-17', couponCode:'FREESHIP',    couponDesc:'단 1건 무료배송 쿠폰 (배송비 무료)' }),
        D({ libId:129, widgetType:'coupon',         name:'아우터 전용 7% 쿠폰',       desc:'아우터 카테고리 전용 할인',      tags:'아우터,할인,쿠폰',   regDate:'2026-02-22', couponCode:'OUTER7',      couponDesc:'아우터 카테고리 한정 7% 할인 쿠폰' }),
        D({ libId:130, widgetType:'coupon',         name:'주말 한정 5% 쿠폰',         desc:'주말 한정 전 상품 5% 쿠폰',     tags:'주말,할인,쿠폰',     regDate:'2026-02-27', couponCode:'WEEKEND5',    couponDesc:'토·일요일 한정 5% 할인 (1인 1회)' }),
        /* ── html_editor 131~140 ── */
        D({ libId:131, widgetType:'html_editor',    name:'봄 이벤트 상세 HTML',       desc:'봄맞이 이벤트 상세 페이지',     tags:'이벤트,HTML,봄',     regDate:'2026-01-18', htmlContent:'<div style="text-align:center;padding:20px;"><h2 style="color:#e8587a;">🌸 봄맞이 세일</h2><p>최대 50% 할인 혜택을 누려보세요!</p><a href="/products" style="background:#e8587a;color:#fff;padding:10px 24px;border-radius:20px;text-decoration:none;">쇼핑 바로가기</a></div>' }),
        D({ libId:132, widgetType:'html_editor',    name:'회사 소개 HTML',            desc:'ShopJoy 브랜드 소개 HTML',      tags:'회사소개,HTML',      regDate:'2026-01-23', htmlContent:'<div style="padding:24px;"><h3>ShopJoy 소개</h3><p>ShopJoy는 2020년 설립된 패션 이커머스 플랫폼입니다.</p><ul><li>국내 200개 브랜드 입점</li><li>연간 거래액 500억 돌파</li><li>고객 만족도 96%</li></ul></div>' }),
        D({ libId:133, widgetType:'html_editor',    name:'배송 안내 상세 HTML',       desc:'배송 정책 상세 안내 HTML',      tags:'배송,안내,HTML',     regDate:'2026-01-28', htmlContent:'<div style="padding:20px;"><h3>배송 안내</h3><table style="width:100%;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th style="padding:8px;border:1px solid #ddd;">구분</th><th style="padding:8px;border:1px solid #ddd;">배송비</th><th style="padding:8px;border:1px solid #ddd;">기간</th></tr><tr><td style="padding:8px;border:1px solid #ddd;">일반</td><td style="padding:8px;border:1px solid #ddd;">3,000원</td><td style="padding:8px;border:1px solid #ddd;">2~3일</td></tr><tr><td style="padding:8px;border:1px solid #ddd;">당일</td><td style="padding:8px;border:1px solid #ddd;">5,000원</td><td style="padding:8px;border:1px solid #ddd;">당일</td></tr></table></div>' }),
        D({ libId:134, widgetType:'html_editor',    name:'VIP 혜택 상세 HTML',        desc:'VIP 등급 혜택 상세 안내 HTML',  tags:'VIP,혜택,HTML',      regDate:'2026-02-02', htmlContent:'<div style="background:linear-gradient(135deg,#1a237e,#283593);color:#fff;padding:24px;border-radius:12px;"><h2>👑 VIP 전용 혜택</h2><ul style="list-style:none;padding:0;"><li>✓ 추가 적립 5%</li><li>✓ 무제한 무료배송</li><li>✓ VIP 전용 쿠폰 매월 지급</li><li>✓ 신상품 24시간 선구매</li></ul></div>' }),
        D({ libId:135, widgetType:'html_editor',    name:'이벤트 종료 HTML',          desc:'이벤트 종료 안내 HTML',         tags:'이벤트,종료,HTML',   regDate:'2026-02-07', htmlContent:'<div style="text-align:center;padding:40px;"><div style="font-size:48px;">🎉</div><h3>이벤트가 종료되었습니다</h3><p style="color:#888;">참여해주셔서 감사합니다.<br>다음 이벤트도 기대해주세요!</p></div>' }),
        D({ libId:136, widgetType:'html_editor',    name:'반품 절차 안내 HTML',       desc:'반품 신청 절차 상세 HTML',      tags:'반품,절차,HTML',     regDate:'2026-02-12', htmlContent:'<div style="padding:20px;"><h3>반품 신청 방법</h3><ol style="line-height:2;"><li>마이페이지 > 주문내역 접속</li><li>해당 주문 선택 후 [반품신청] 클릭</li><li>반품 사유 선택 및 접수</li><li>택배 기사 방문 수거 (영업일 1~2일)</li><li>반품 완료 후 환불 처리 (3~5 영업일)</li></ol></div>' }),
        D({ libId:137, widgetType:'html_editor',    name:'사이즈 가이드 HTML',        desc:'사이즈 측정 방법 상세 HTML',    tags:'사이즈,가이드,HTML', regDate:'2026-02-17', htmlContent:'<div style="padding:20px;"><h3>사이즈 측정 방법</h3><img src="/img/size-guide.png" style="width:100%;max-width:400px;" alt="사이즈 측정"/><p style="font-size:13px;color:#666;margin-top:12px;">※ 브랜드 및 상품에 따라 사이즈가 상이할 수 있습니다.</p></div>' }),
        D({ libId:138, widgetType:'html_editor',    name:'신규 브랜드 소개 HTML',     desc:'신규 입점 브랜드 소개 HTML',    tags:'브랜드,신규,HTML',   regDate:'2026-02-22', htmlContent:'<div style="padding:20px;background:#f8f8f8;border-radius:8px;"><div style="display:flex;align-items:center;gap:16px;"><img src="/img/new-brand.jpg" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" alt="브랜드"/><div><h4 style="margin:0;">NEW BRAND 입점 🎊</h4><p style="margin:4px 0;color:#888;font-size:13px;">지금 바로 만나보세요</p></div></div></div>' }),
        D({ libId:139, widgetType:'html_editor',    name:'공지사항 HTML 템플릿',      desc:'일반 공지사항 HTML 템플릿',     tags:'공지,템플릿,HTML',   regDate:'2026-02-27', htmlContent:'<div style="padding:20px;border-left:4px solid #e8587a;background:#fff8f8;"><p style="margin:0;font-size:14px;font-weight:600;color:#e8587a;">📢 공지사항</p><p style="margin:8px 0 0;font-size:13px;color:#333;">공지 내용을 여기에 입력하세요.</p></div>' }),
        D({ libId:140, widgetType:'html_editor',    name:'개인정보 처리방침 HTML',    desc:'개인정보 처리방침 전문 HTML',   tags:'개인정보,약관,HTML', regDate:'2026-03-03', htmlContent:'<div style="padding:20px;font-size:13px;line-height:1.8;"><h3>개인정보 처리방침</h3><p>ShopJoy(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보를 보호합니다.</p><h4>1. 수집하는 개인정보</h4><p>이름, 이메일, 연락처, 배송주소, 결제정보</p><h4>2. 이용 목적</h4><p>회원관리, 주문처리, 배송, 고객지원</p></div>' }),
        /* ── event_banner 141~150 ── */
        D({ libId:141, widgetType:'event_banner',   name:'봄맞이 이벤트 배너',        desc:'봄 시즌 이벤트 배너',           tags:'봄,이벤트,배너',     regDate:'2026-01-19', eventId:'1' }),
        D({ libId:142, widgetType:'event_banner',   name:'여름 이벤트 배너',          desc:'여름 시즌 이벤트 배너',         tags:'여름,이벤트,배너',   regDate:'2026-01-24', eventId:'2' }),
        D({ libId:143, widgetType:'event_banner',   name:'설날 기획전 배너',          desc:'설날 특별 기획전 이벤트 배너',  tags:'설날,이벤트,배너',   regDate:'2026-01-29', eventId:'3' }),
        D({ libId:144, widgetType:'event_banner',   name:'어버이날 이벤트 배너',      desc:'어버이날 특별 이벤트 배너',     tags:'어버이날,이벤트',    regDate:'2026-02-03', eventId:'4' }),
        D({ libId:145, widgetType:'event_banner',   name:'블랙프라이데이 이벤트',     desc:'블랙프라이데이 특가 이벤트',    tags:'블랙프라이데이,이벤트',regDate:'2026-02-08', eventId:'1' }),
        D({ libId:146, widgetType:'event_banner',   name:'창립기념 이벤트 배너',      desc:'창립기념 특별 이벤트 배너',     tags:'창립,기념,이벤트',   regDate:'2026-02-13', eventId:'2' }),
        D({ libId:147, widgetType:'event_banner',   name:'추석 특집 이벤트 배너',     desc:'추석 특집 이벤트 배너',         tags:'추석,이벤트,배너',   regDate:'2026-02-18', eventId:'3' }),
        D({ libId:148, widgetType:'event_banner',   name:'크리스마스 이벤트 배너',    desc:'크리스마스 특별 이벤트 배너',   tags:'크리스마스,이벤트',  regDate:'2026-02-23', eventId:'4' }),
        D({ libId:149, widgetType:'event_banner',   name:'VIP 초대 이벤트 배너',      desc:'VIP 회원 초대 전용 이벤트',     tags:'VIP,초대,이벤트',    regDate:'2026-02-28', eventId:'1' }),
        D({ libId:150, widgetType:'event_banner',   name:'신상품 론칭 이벤트 배너',   desc:'신상품 출시 기념 이벤트',       tags:'신상품,론칭,이벤트', regDate:'2026-03-04', eventId:'2' }),
        /* ── cache_banner 151~160 ── */
        D({ libId:151, widgetType:'cache_banner',   name:'신규가입 캐시 적립',        desc:'신규 가입 시 2,000 캐시 적립',  tags:'신규,캐시,적립',     regDate:'2026-01-20', cacheDesc:'신규 가입 환영 캐시', cacheAmount:2000 }),
        D({ libId:152, widgetType:'cache_banner',   name:'첫 구매 완료 캐시',         desc:'첫 구매 완료 시 1,000 캐시',    tags:'첫구매,캐시,적립',   regDate:'2026-01-25', cacheDesc:'첫 구매 감사 캐시', cacheAmount:1000 }),
        D({ libId:153, widgetType:'cache_banner',   name:'리뷰 작성 캐시',            desc:'상품 리뷰 작성 시 500 캐시',    tags:'리뷰,캐시,적립',     regDate:'2026-01-30', cacheDesc:'리뷰 작성 보상 캐시', cacheAmount:500 }),
        D({ libId:154, widgetType:'cache_banner',   name:'친구 추천 캐시',            desc:'친구 추천 성공 시 3,000 캐시',  tags:'추천,캐시,적립',     regDate:'2026-02-04', cacheDesc:'친구 추천 성공 캐시', cacheAmount:3000 }),
        D({ libId:155, widgetType:'cache_banner',   name:'생일 축하 캐시',            desc:'생일 달 5,000 캐시 지급',        tags:'생일,캐시,적립',     regDate:'2026-02-09', cacheDesc:'생일 축하 캐시 선물', cacheAmount:5000 }),
        D({ libId:156, widgetType:'cache_banner',   name:'이벤트 참여 캐시',          desc:'이벤트 참여 완료 시 1,000 캐시',tags:'이벤트,캐시,적립',   regDate:'2026-02-14', cacheDesc:'이벤트 참여 보상 캐시', cacheAmount:1000 }),
        D({ libId:157, widgetType:'cache_banner',   name:'앱 설치 캐시',              desc:'앱 최초 설치 시 2,000 캐시',    tags:'앱,캐시,적립',       regDate:'2026-02-19', cacheDesc:'앱 설치 보상 캐시', cacheAmount:2000 }),
        D({ libId:158, widgetType:'cache_banner',   name:'SNS 공유 캐시',             desc:'SNS 공유 시 300 캐시 적립',      tags:'SNS,캐시,적립',      regDate:'2026-02-24', cacheDesc:'SNS 공유 보상 캐시', cacheAmount:300 }),
        D({ libId:159, widgetType:'cache_banner',   name:'연속 방문 캐시',            desc:'7일 연속 방문 시 1,000 캐시',   tags:'방문,캐시,적립',     regDate:'2026-03-01', cacheDesc:'7일 연속 방문 보상', cacheAmount:1000 }),
        D({ libId:160, widgetType:'cache_banner',   name:'VIP 전환 축하 캐시',        desc:'VIP 등급 달성 시 10,000 캐시',  tags:'VIP,캐시,적립',      regDate:'2026-03-06', cacheDesc:'VIP 등급 달성 축하 캐시', cacheAmount:10000 }),
        /* ── widget_embed 161~170 ── */
        D({ libId:161, widgetType:'widget_embed',   name:'유튜브 브랜드 영상',        desc:'유튜브 브랜드 소개 영상 임베드', tags:'유튜브,영상,임베드', regDate:'2026-01-21', embedCode:'<iframe width="100%" height="200" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>' }),
        D({ libId:162, widgetType:'widget_embed',   name:'인스타그램 피드',           desc:'인스타그램 피드 임베드',         tags:'인스타,SNS,임베드',  regDate:'2026-01-26', embedCode:'<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/example/"><a href="https://www.instagram.com/p/example/">인스타그램 게시물</a></blockquote>' }),
        D({ libId:163, widgetType:'widget_embed',   name:'카카오 지도 위젯',          desc:'매장 위치 카카오 지도 임베드',   tags:'지도,카카오,임베드', regDate:'2026-01-31', embedCode:'<div id="map" style="width:100%;height:200px;background:#e8e8e8;display:flex;align-items:center;justify-content:center;color:#888;border-radius:8px;">🗺 카카오 지도 임베드</div>' }),
        D({ libId:164, widgetType:'widget_embed',   name:'챗봇 위젯 임베드',          desc:'고객 상담 챗봇 버튼 임베드',     tags:'챗봇,상담,임베드',   regDate:'2026-02-05', embedCode:'<div style="position:relative;"><button style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#e8587a;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);">💬</button></div>' }),
        D({ libId:165, widgetType:'widget_embed',   name:'트위터 타임라인 위젯',      desc:'트위터 타임라인 임베드',         tags:'트위터,SNS,임베드',  regDate:'2026-02-10', embedCode:'<a class="twitter-timeline" href="https://twitter.com/shopjoy">Tweets by ShopJoy</a><script async src="https://platform.twitter.com/widgets.js"></script>' }),
        D({ libId:166, widgetType:'widget_embed',   name:'네이버 지식인 QnA 위젯',    desc:'네이버 QnA 임베드 위젯',        tags:'네이버,QnA,임베드',  regDate:'2026-02-15', embedCode:'<iframe src="https://kin.naver.com/embed/example" width="100%" height="300" frameborder="0"></iframe>' }),
        D({ libId:167, widgetType:'widget_embed',   name:'날씨 위젯 임베드',          desc:'현재 날씨 정보 위젯 임베드',     tags:'날씨,위젯,임베드',   regDate:'2026-02-20', embedCode:'<div style="background:linear-gradient(135deg,#1565c0,#42a5f5);color:#fff;padding:16px;border-radius:8px;text-align:center;"><div style="font-size:32px;">⛅</div><div style="font-size:18px;font-weight:700;">18°C</div><div style="font-size:12px;opacity:.8;">서울 · 맑음</div></div>' }),
        D({ libId:168, widgetType:'widget_embed',   name:'환율 정보 위젯',            desc:'실시간 환율 정보 위젯 임베드',   tags:'환율,정보,임베드',   regDate:'2026-02-25', embedCode:'<div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:14px;font-size:13px;"><div style="font-weight:700;margin-bottom:8px;">💱 실시간 환율</div><div>USD: 1,340원</div><div>EUR: 1,460원</div><div>JPY: 8.9원</div></div>' }),
        D({ libId:169, widgetType:'widget_embed',   name:'구글 폼 설문 임베드',       desc:'고객 설문 구글 폼 임베드',       tags:'설문,구글폼,임베드', regDate:'2026-03-02', embedCode:'<iframe src="https://docs.google.com/forms/d/e/example/viewform?embedded=true" width="100%" height="400" frameborder="0">로드 중...</iframe>' }),
        D({ libId:170, widgetType:'widget_embed',   name:'카카오채널 상담 위젯',      desc:'카카오 채널 상담 버튼 임베드',   tags:'카카오,상담,임베드', regDate:'2026-03-07', embedCode:'<a href="https://pf.kakao.com/_shopjoy" style="display:inline-flex;align-items:center;gap:8px;background:#fee500;color:#333;padding:10px 20px;border-radius:20px;text-decoration:none;font-weight:700;">💬 카카오채널 상담</a>' }),
      ];
    })(),

    displays: (() => {
      const W = (sortOrder, widgetNm, widgetType, clickAction='none', clickTarget='', status='활성') =>
        ({ sortOrder, widgetNm, widgetType, clickAction, clickTarget, status });
      const P = (dispId, area, name, widgetType, condition, authRequired, sortOrder, status, regDate, rows, extra={}) =>
        ({ dispId, area, name, widgetType, condition, authRequired, sortOrder, status, regDate, rows, ...extra });

      return [
        /* ───────────── HOME_BANNER (홈 메인배너) ───────────── */
        P( 1,'HOME_BANNER','봄 시즌 메인 슬라이드 배너','image_banner','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'봄맞이 세일 메인이미지','image_banner','navigate','/sale'),
          W(2,'봄 시즌 카피 텍스트','text_banner','none',''),
          W(3,'신규가입 5,000원 쿠폰','coupon','event','issueCoupon'),
          W(4,'봄맞이 이벤트 배너','event_banner','navigate','/events/1'),
          W(5,'봄 컬렉션 HTML 안내','html_editor','none',''),
        ],{ dispStartDate:'2026-03-01', dispEndDate:'2026-05-31' }),

        P( 2,'HOME_BANNER','여름 프리뷰 배너 슬라이더','image_banner','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'여름 신상 프리뷰 이미지','image_banner','navigate','/summer'),
          W(2,'신상품 슬라이더 (여름)','product_slider','navigate','/products?season=summer'),
          W(3,'여름 시즌 텍스트','text_banner','none',''),
          W(4,'여름 이벤트 배너','event_banner','navigate','/events/4'),
          W(5,'앱 전용 팝업','popup','navigate','/app-download'),
        ],{ dispStartDate:'2026-05-01', dispEndDate:'2026-07-31' }),

        P( 3,'HOME_BANNER','VIP 전용 특별 혜택 배너','image_banner','로그인+VIP',true,3,'활성','2026-03-10',[
          W(1,'VIP 전용 이미지 배너','image_banner','navigate','/vip'),
          W(2,'VIP 적립금 안내 배너','cache_banner','none',''),
          W(3,'VIP 쿠폰 자동 발급','coupon','event','issueVipCoupon'),
          W(4,'VIP 혜택 정보카드','info_card','none',''),
          W(5,'VIP 전용 단품 상품','product','navigate','/detail/6'),
        ],{ authGrade:'VIP' }),

        P( 4,'HOME_BANNER','블랙프라이데이 특가 배너','image_banner','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'블랙프라이데이 메인 배너','image_banner','navigate','/bf'),
          W(2,'특가 쿠폰 발급','coupon','event','issueBfCoupon'),
          W(3,'특가 상품 슬라이더','product_slider','navigate','/products?tag=bf'),
          W(4,'카운트다운 텍스트','text_banner','none',''),
          W(5,'이벤트 배너','event_banner','navigate','/events/2'),
        ],{ dispStartDate:'2026-11-25', dispEndDate:'2026-11-29' }),

        P( 5,'HOME_BANNER','신규회원 환영 배너','image_banner','비로그인 전용',false,5,'활성','2026-03-20',[
          W(1,'신규회원 환영 이미지','image_banner','navigate','/join'),
          W(2,'가입 혜택 텍스트','text_banner','none',''),
          W(3,'신규가입 쿠폰','coupon','event','issueWelcomeCoupon'),
          W(4,'혜택 HTML 안내','html_editor','none',''),
          W(5,'혜택 정보카드','info_card','none',''),
        ]),

        P( 6,'HOME_BANNER','주말 특가 팝업','popup','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'주말 특가 팝업','popup','navigate','/sale'),
          W(2,'주말 이미지 배너','image_banner','navigate','/sale'),
          W(3,'특가 쿠폰','coupon','event','issueWeekendCoupon'),
          W(4,'특가 텍스트','text_banner','none',''),
          W(5,'주말 이벤트','event_banner','navigate','/events'),
        ],{ dispStartDate:'2026-04-12', dispEndDate:'2026-04-13' }),

        P( 7,'HOME_BANNER','앱 다운로드 유도 배너','image_banner','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'앱 다운로드 이미지','image_banner','navigate','/app'),
          W(2,'앱 소개 텍스트','text_banner','none',''),
          W(3,'앱 HTML 배너','html_editor','none',''),
          W(4,'앱 안내 정보카드','info_card','none',''),
          W(5,'앱 위젯 임베드','widget_embed','none',''),
        ]),

        /* ───────────── HOME_PRODUCT (홈 상품영역) ───────────── */
        P( 8,'HOME_PRODUCT','신상품 추천 섹션','product_slider','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'신상품 슬라이더','product_slider','navigate','/products?isNew=Y'),
          W(2,'최신 여성복 조건상품','cond_product','navigate','/products?cate=women'),
          W(3,'시그니처 코트 단품','product','navigate','/detail/1'),
          W(4,'신상품 텍스트 안내','text_banner','none',''),
          W(5,'신상품 이벤트','event_banner','navigate','/events/1'),
        ]),

        P( 9,'HOME_PRODUCT','베스트셀러 섹션','product_slider','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'베스트셀러 슬라이더','product_slider','navigate','/products?sort=best'),
          W(2,'주간 베스트 차트','chart_bar','none',''),
          W(3,'베스트 단품 상품','product','navigate','/detail/2'),
          W(4,'베스트 조건상품','cond_product','navigate','/products?sort=popular'),
          W(5,'베스트 텍스트','text_banner','none',''),
        ]),

        P(10,'HOME_PRODUCT','오늘의 특가 섹션','cond_product','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'할인상품 조건상품','cond_product','navigate','/products?tag=sale'),
          W(2,'오늘의 쿠폰','coupon','event','issueDailyCoupon'),
          W(3,'할인 슬라이더','product_slider','navigate','/products?tag=sale'),
          W(4,'특가 텍스트 배너','text_banner','none',''),
          W(5,'적립금 캐시 배너','cache_banner','none',''),
        ]),

        P(11,'HOME_PRODUCT','카테고리별 추천 섹션','product_slider','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'여성 카테고리 슬라이더','product_slider','navigate','/products?cate=women'),
          W(2,'남성 카테고리 슬라이더','product_slider','navigate','/products?cate=men'),
          W(3,'아우터 조건상품','cond_product','navigate','/products?cate=outer'),
          W(4,'카테고리 이미지 배너','image_banner','navigate','/products'),
          W(5,'카테고리 HTML 안내','html_editor','none',''),
        ]),

        P(12,'HOME_PRODUCT','VIP 큐레이션 섹션','product_slider','로그인+VIP',true,5,'활성','2026-03-20',[
          W(1,'VIP 전용 슬라이더','product_slider','navigate','/products?grade=vip'),
          W(2,'VIP 조건상품','cond_product','navigate','/products?grade=vip'),
          W(3,'VIP 전용 쿠폰','coupon','event','issueVipCoupon'),
          W(4,'VIP 혜택 정보카드','info_card','none',''),
          W(5,'VIP 적립금 배너','cache_banner','none',''),
        ],{ authGrade:'VIP' }),

        P(13,'HOME_PRODUCT','재입고 알림 섹션','cond_product','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'재입고 조건상품','cond_product','navigate','/products?tag=restock'),
          W(2,'재입고 슬라이더','product_slider','navigate','/products?tag=restock'),
          W(3,'재입고 알림 텍스트','text_banner','none',''),
          W(4,'재입고 정보카드','info_card','none',''),
          W(5,'알림 위젯 임베드','widget_embed','none',''),
        ]),

        P(14,'HOME_PRODUCT','기획전 상품 섹션','event_banner','항상 표시',false,7,'활성','2026-04-05',[
          W(1,'기획전 이벤트 배너','event_banner','navigate','/events/2'),
          W(2,'기획전 상품 슬라이더','product_slider','navigate','/products?tag=special'),
          W(3,'기획전 조건상품','cond_product','navigate','/products?tag=special'),
          W(4,'기획전 쿠폰','coupon','event','issueSpecialCoupon'),
          W(5,'기획전 HTML 안내','html_editor','none',''),
        ]),

        /* ───────────── HOME_CHART (홈 차트) ───────────── */
        P(15,'HOME_CHART','주간 베스트 차트','chart_bar','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'주간 베스트 바차트','chart_bar','none',''),
          W(2,'매출 라인차트','chart_line','none',''),
          W(3,'베스트 정보카드','info_card','none',''),
          W(4,'베스트 단품 상품','product','navigate','/detail/1'),
          W(5,'차트 텍스트 안내','text_banner','none',''),
        ]),

        P(16,'HOME_CHART','월간 매출 트렌드','chart_line','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'월간 매출 라인차트','chart_line','none',''),
          W(2,'카테고리별 바차트','chart_bar','none',''),
          W(3,'매출 파이차트','chart_pie','none',''),
          W(4,'매출 정보카드','info_card','none',''),
          W(5,'트렌드 텍스트','text_banner','none',''),
        ]),

        P(17,'HOME_CHART','카테고리별 판매 분포','chart_pie','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'카테고리 파이차트','chart_pie','none',''),
          W(2,'카테고리 바차트','chart_bar','none',''),
          W(3,'카테고리 정보카드','info_card','none',''),
          W(4,'카테고리 조건상품','cond_product','navigate','/products'),
          W(5,'분석 HTML 안내','html_editor','none',''),
        ]),

        P(18,'HOME_CHART','브랜드 인기 순위','chart_bar','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'브랜드 순위 바차트','chart_bar','none',''),
          W(2,'브랜드 정보카드','info_card','none',''),
          W(3,'브랜드 상품 슬라이더','product_slider','navigate','/products?brand=1'),
          W(4,'브랜드 이미지 배너','image_banner','navigate','/brand'),
          W(5,'브랜드 텍스트','text_banner','none',''),
        ]),

        P(19,'HOME_CHART','연령별 구매 패턴','chart_pie','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'연령별 파이차트','chart_pie','none',''),
          W(2,'구매 패턴 라인차트','chart_line','none',''),
          W(3,'패턴 정보카드','info_card','none',''),
          W(4,'패턴 텍스트','text_banner','none',''),
          W(5,'분석 HTML','html_editor','none',''),
        ]),

        P(20,'HOME_CHART','실시간 방문자 현황','chart_line','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'방문자 라인차트','chart_line','none',''),
          W(2,'방문 정보카드','info_card','none',''),
          W(3,'방문 텍스트 안내','text_banner','none',''),
          W(4,'위젯 임베드','widget_embed','none',''),
          W(5,'분석 HTML','html_editor','none',''),
        ]),

        P(21,'HOME_CHART','상품 리뷰 분석 차트','chart_bar','로그인 필요',true,7,'비활성','2026-04-05',[
          W(1,'리뷰 바차트','chart_bar','none',''),
          W(2,'리뷰 파이차트','chart_pie','none',''),
          W(3,'리뷰 정보카드','info_card','none',''),
          W(4,'리뷰 조건상품','cond_product','navigate','/products?sort=review'),
          W(5,'리뷰 텍스트','text_banner','none',''),
        ]),

        /* ───────────── HOME_EVENT (홈 이벤트) ───────────── */
        P(22,'HOME_EVENT','봄 시즌 이벤트 배너','event_banner','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'봄맞이 이벤트 배너','event_banner','navigate','/events/1'),
          W(2,'봄 이미지 배너','image_banner','navigate','/events/1'),
          W(3,'봄 상품 슬라이더','product_slider','navigate','/products?season=spring'),
          W(4,'봄 쿠폰 발급','coupon','event','issueSpringCoupon'),
          W(5,'봄 이벤트 텍스트','text_banner','none',''),
        ],{ dispStartDate:'2026-03-01', dispEndDate:'2026-05-31' }),

        P(23,'HOME_EVENT','VIP 사은행사 배너','event_banner','로그인+VIP',true,2,'활성','2026-03-05',[
          W(1,'VIP 사은 이벤트 배너','event_banner','navigate','/events/2'),
          W(2,'VIP 사은 쿠폰','coupon','event','issueVipGiftCoupon'),
          W(3,'VIP 적립금 배너','cache_banner','none',''),
          W(4,'VIP 단품 상품','product','navigate','/detail/6'),
          W(5,'VIP 혜택 정보카드','info_card','none',''),
        ],{ authGrade:'VIP' }),

        P(24,'HOME_EVENT','리뷰 작성 이벤트','event_banner','로그인 필요',true,3,'활성','2026-03-10',[
          W(1,'리뷰 이벤트 배너','event_banner','navigate','/events'),
          W(2,'리뷰 참여 HTML','html_editor','none',''),
          W(3,'리뷰 혜택 정보카드','info_card','none',''),
          W(4,'리뷰 텍스트 안내','text_banner','none',''),
          W(5,'리뷰 상품 슬라이더','product_slider','navigate','/products'),
        ]),

        P(25,'HOME_EVENT','럭키드로우 이벤트','event_banner','로그인 필요',true,4,'활성','2026-03-15',[
          W(1,'럭키드로우 배너','event_banner','navigate','/events'),
          W(2,'럭키드로우 이미지','image_banner','navigate','/events'),
          W(3,'이벤트 HTML 안내','html_editor','none',''),
          W(4,'럭키드로우 텍스트','text_banner','none',''),
          W(5,'이벤트 팝업','popup','navigate','/events'),
        ]),

        P(26,'HOME_EVENT','친구추천 이벤트','event_banner','로그인 필요',true,5,'활성','2026-03-20',[
          W(1,'친구추천 이벤트 배너','event_banner','navigate','/events'),
          W(2,'추천 HTML 안내','html_editor','none',''),
          W(3,'추천 쿠폰 발급','coupon','event','issueReferralCoupon'),
          W(4,'추천 혜택 정보카드','info_card','none',''),
          W(5,'추천 텍스트','text_banner','none',''),
        ]),

        P(27,'HOME_EVENT','생일 축하 이벤트','event_banner','로그인 필요',true,6,'활성','2026-04-01',[
          W(1,'생일 이벤트 배너','event_banner','navigate','/events'),
          W(2,'생일 쿠폰','coupon','event','issueBirthCoupon'),
          W(3,'생일 적립금','cache_banner','none',''),
          W(4,'생일 HTML 안내','html_editor','none',''),
          W(5,'생일 정보카드','info_card','none',''),
        ]),

        P(28,'HOME_EVENT','시즌오프 이벤트 배너','event_banner','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'시즌오프 이벤트 배너','event_banner','navigate','/events'),
          W(2,'시즌오프 슬라이더','product_slider','navigate','/products?tag=seasonoff'),
          W(3,'시즌오프 쿠폰','coupon','event','issueSeasonOffCoupon'),
          W(4,'시즌오프 이미지','image_banner','navigate','/sale'),
          W(5,'시즌오프 텍스트','text_banner','none',''),
        ],{ dispStartDate:'2026-01-01', dispEndDate:'2026-02-28' }),

        /* ───────────── SIDEBAR_TOP (사이드바 상단) ───────────── */
        P(29,'SIDEBAR_TOP','VIP 혜택 안내 위젯','info_card','로그인+VIP',true,1,'활성','2026-03-01',[
          W(1,'VIP 혜택 정보카드','info_card','none',''),
          W(2,'VIP 적립금 배너','cache_banner','none',''),
          W(3,'VIP 쿠폰','coupon','event','issueVipCoupon'),
          W(4,'VIP 이미지 배너','image_banner','navigate','/vip'),
          W(5,'VIP 텍스트 안내','text_banner','none',''),
        ],{ authGrade:'VIP' }),

        P(30,'SIDEBAR_TOP','오늘의 추천 상품 위젯','product','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'오늘의 단품 추천','product','navigate','/detail/1'),
          W(2,'추천 조건상품','cond_product','navigate','/products?sort=recommend'),
          W(3,'추천 텍스트','text_banner','none',''),
          W(4,'추천 이미지','image_banner','navigate','/products'),
          W(5,'추천 쿠폰','coupon','event','issueRecommendCoupon'),
        ]),

        P(31,'SIDEBAR_TOP','쿠폰 발급 위젯','coupon','로그인 필요',true,3,'활성','2026-03-10',[
          W(1,'쿠폰 발급 위젯','coupon','event','issueSidebarCoupon'),
          W(2,'쿠폰 텍스트 안내','text_banner','none',''),
          W(3,'쿠폰 HTML','html_editor','none',''),
          W(4,'쿠폰 정보카드','info_card','none',''),
          W(5,'적립금 배너','cache_banner','none',''),
        ]),

        P(32,'SIDEBAR_TOP','이벤트 안내 배너','event_banner','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'사이드바 이벤트 배너','event_banner','navigate','/events'),
          W(2,'이벤트 이미지','image_banner','navigate','/events'),
          W(3,'이벤트 텍스트','text_banner','none',''),
          W(4,'이벤트 쿠폰','coupon','event','issueEventCoupon'),
          W(5,'이벤트 HTML','html_editor','none',''),
        ]),

        P(33,'SIDEBAR_TOP','파일 다운로드 안내','file','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'사이즈가이드 파일','file','navigate','/files/size-guide.pdf'),
          W(2,'파일 목록','file_list','navigate','/files'),
          W(3,'다운로드 정보카드','info_card','none',''),
          W(4,'안내 텍스트','text_banner','none',''),
          W(5,'안내 HTML','html_editor','none',''),
        ]),

        P(34,'SIDEBAR_TOP','실시간 인기 상품 차트','chart_bar','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'인기 바차트','chart_bar','none',''),
          W(2,'인기 조건상품','cond_product','navigate','/products?sort=popular'),
          W(3,'인기 단품','product','navigate','/detail/2'),
          W(4,'인기 텍스트','text_banner','none',''),
          W(5,'인기 정보카드','info_card','none',''),
        ]),

        P(35,'SIDEBAR_TOP','위젯 임베드 섹션','widget_embed','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'외부 위젯 임베드','widget_embed','none',''),
          W(2,'임베드 HTML','html_editor','none',''),
          W(3,'임베드 정보카드','info_card','none',''),
          W(4,'임베드 텍스트','text_banner','none',''),
          W(5,'임베드 이미지','image_banner','none',''),
        ]),

        /* ───────────── PRODUCT_TOP (상품 상단) ───────────── */
        P(36,'PRODUCT_TOP','오늘의 할인 쿠폰 위젯','text_banner','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'오늘의 할인 텍스트','text_banner','none',''),
          W(2,'즉시 할인 쿠폰','coupon','event','issueSaleCoupon'),
          W(3,'할인 조건상품','cond_product','navigate','/products?tag=sale'),
          W(4,'할인 정보카드','info_card','none',''),
          W(5,'적립금 배너','cache_banner','none',''),
        ]),

        P(37,'PRODUCT_TOP','카테고리 추천 배너','image_banner','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'카테고리 이미지 배너','image_banner','navigate','/products'),
          W(2,'카테고리 조건상품','cond_product','navigate','/products'),
          W(3,'카테고리 슬라이더','product_slider','navigate','/products'),
          W(4,'카테고리 텍스트','text_banner','none',''),
          W(5,'카테고리 이벤트','event_banner','navigate','/events'),
        ]),

        P(38,'PRODUCT_TOP','브랜드 스토리 섹션','html_editor','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'브랜드 HTML 스토리','html_editor','none',''),
          W(2,'브랜드 이미지 배너','image_banner','navigate','/brand'),
          W(3,'브랜드 상품 슬라이더','product_slider','navigate','/products?brand=1'),
          W(4,'브랜드 정보카드','info_card','none',''),
          W(5,'브랜드 텍스트','text_banner','none',''),
        ]),

        P(39,'PRODUCT_TOP','리뷰 하이라이트','chart_bar','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'리뷰 바차트','chart_bar','none',''),
          W(2,'리뷰 정보카드','info_card','none',''),
          W(3,'리뷰 텍스트','text_banner','none',''),
          W(4,'리뷰 조건상품','cond_product','navigate','/products?sort=review'),
          W(5,'리뷰 HTML','html_editor','none',''),
        ]),

        P(40,'PRODUCT_TOP','쿠폰·혜택 안내 위젯','coupon','로그인 필요',true,5,'활성','2026-03-20',[
          W(1,'로그인 쿠폰','coupon','event','issueLoginCoupon'),
          W(2,'로그인 적립금','cache_banner','none',''),
          W(3,'혜택 정보카드','info_card','none',''),
          W(4,'혜택 텍스트','text_banner','none',''),
          W(5,'혜택 이벤트 배너','event_banner','navigate','/events'),
        ]),

        P(41,'PRODUCT_TOP','관련 상품 추천 슬라이더','product_slider','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'관련상품 슬라이더','product_slider','navigate','/products'),
          W(2,'함께구매 조건상품','cond_product','navigate','/products'),
          W(3,'추천 단품','product','navigate','/detail/3'),
          W(4,'추천 이미지 배너','image_banner','navigate','/products'),
          W(5,'추천 텍스트','text_banner','none',''),
        ]),

        P(42,'PRODUCT_TOP','프로모션 팝업 위젯','popup','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'프로모션 팝업','popup','navigate','/sale'),
          W(2,'프로모션 쿠폰','coupon','event','issuePromoPopupCoupon'),
          W(3,'프로모션 이미지','image_banner','navigate','/sale'),
          W(4,'프로모션 텍스트','text_banner','none',''),
          W(5,'프로모션 이벤트','event_banner','navigate','/events'),
        ]),

        /* ───────────── MY_PAGE (마이페이지) ───────────── */
        P(43,'MY_PAGE','등급별 혜택 안내 위젯','info_card','로그인 필요',true,1,'활성','2026-03-01',[
          W(1,'등급 혜택 정보카드','info_card','none',''),
          W(2,'적립금 현황 배너','cache_banner','none',''),
          W(3,'등급업 쿠폰','coupon','event','issueGradeCoupon'),
          W(4,'등급 바차트','chart_bar','none',''),
          W(5,'등급 텍스트 안내','text_banner','none',''),
        ]),

        P(44,'MY_PAGE','적립금 현황 위젯','cache_banner','로그인 필요',true,2,'활성','2026-03-05',[
          W(1,'적립금 배너','cache_banner','none',''),
          W(2,'적립금 정보카드','info_card','none',''),
          W(3,'적립금 라인차트','chart_line','none',''),
          W(4,'적립금 사용 텍스트','text_banner','none',''),
          W(5,'적립금 쿠폰','coupon','event','issueCacheRewardCoupon'),
        ]),

        P(45,'MY_PAGE','주문 현황 요약 위젯','info_card','로그인 필요',true,3,'활성','2026-03-10',[
          W(1,'주문 현황 정보카드','info_card','none',''),
          W(2,'주문 바차트','chart_bar','none',''),
          W(3,'주문 텍스트','text_banner','none',''),
          W(4,'재구매 조건상품','cond_product','navigate','/products'),
          W(5,'주문 HTML 안내','html_editor','none',''),
        ]),

        P(46,'MY_PAGE','쿠폰 보관함 위젯','coupon','로그인 필요',true,4,'활성','2026-03-15',[
          W(1,'보유 쿠폰 위젯','coupon','navigate','/my/coupons'),
          W(2,'쿠폰 정보카드','info_card','none',''),
          W(3,'쿠폰 텍스트 안내','text_banner','none',''),
          W(4,'적립금 배너','cache_banner','none',''),
          W(5,'쿠폰 이벤트','event_banner','navigate','/events'),
        ]),

        P(47,'MY_PAGE','VIP 전용 혜택 위젯','info_card','로그인+VIP',true,5,'활성','2026-03-20',[
          W(1,'VIP 혜택 정보카드','info_card','none',''),
          W(2,'VIP 쿠폰 발급','coupon','event','issueMyVipCoupon'),
          W(3,'VIP 적립금 배너','cache_banner','none',''),
          W(4,'VIP 이벤트 배너','event_banner','navigate','/events/2'),
          W(5,'VIP 이미지 배너','image_banner','navigate','/vip'),
        ],{ authGrade:'VIP' }),

        P(48,'MY_PAGE','최근 본 상품 위젯','cond_product','로그인 필요',true,6,'활성','2026-04-01',[
          W(1,'최근 본 조건상품','cond_product','navigate','/products'),
          W(2,'최근 본 슬라이더','product_slider','navigate','/products'),
          W(3,'최근 단품','product','navigate','/detail/1'),
          W(4,'추천 텍스트','text_banner','none',''),
          W(5,'추천 정보카드','info_card','none',''),
        ]),

        P(49,'MY_PAGE','적립금 내역 차트 위젯','chart_line','로그인 필요',true,7,'활성','2026-04-05',[
          W(1,'적립금 라인차트','chart_line','none',''),
          W(2,'적립금 바차트','chart_bar','none',''),
          W(3,'적립금 정보카드','info_card','none',''),
          W(4,'적립금 텍스트','text_banner','none',''),
          W(5,'적립금 현황 배너','cache_banner','none',''),
        ]),

        /* ───────────── SIDEBAR_MID (사이드바 중단) ───────────── */
        P(50,'SIDEBAR_MID','신상품 미니 슬라이더','product_slider','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'신상품 미니 슬라이더','product_slider','navigate','/products?isNew=Y'),
          W(2,'신상품 조건상품','cond_product','navigate','/products?isNew=Y'),
          W(3,'신상품 단품 추천','product','navigate','/detail/4'),
          W(4,'신상품 텍스트','text_banner','none',''),
          W(5,'신상품 이벤트','event_banner','navigate','/events/1'),
        ]),

        P(51,'SIDEBAR_MID','이벤트 퀵 배너','event_banner','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'이벤트 배너','event_banner','navigate','/events'),
          W(2,'이벤트 이미지','image_banner','navigate','/events'),
          W(3,'이벤트 텍스트','text_banner','none',''),
          W(4,'이벤트 쿠폰','coupon','event','issueEventMidCoupon'),
          W(5,'이벤트 정보카드','info_card','none',''),
        ]),

        P(52,'SIDEBAR_MID','적립금 퀵 배너','cache_banner','로그인 필요',true,3,'활성','2026-03-10',[
          W(1,'적립금 잔액 배너','cache_banner','none',''),
          W(2,'적립금 라인차트','chart_line','none',''),
          W(3,'적립금 정보카드','info_card','none',''),
          W(4,'적립금 텍스트','text_banner','none',''),
          W(5,'적립금 쿠폰','coupon','event','issueCacheMidCoupon'),
        ]),

        P(53,'SIDEBAR_MID','브랜드 미니 배너','image_banner','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'브랜드 이미지 배너','image_banner','navigate','/brand'),
          W(2,'브랜드 상품 슬라이더','product_slider','navigate','/products?brand=1'),
          W(3,'브랜드 정보카드','info_card','none',''),
          W(4,'브랜드 텍스트','text_banner','none',''),
          W(5,'브랜드 파이차트','chart_pie','none',''),
        ]),

        P(54,'SIDEBAR_MID','리뷰 요약 위젯','chart_bar','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'리뷰 바차트','chart_bar','none',''),
          W(2,'리뷰 정보카드','info_card','none',''),
          W(3,'리뷰 텍스트','text_banner','none',''),
          W(4,'리뷰 상품 슬라이더','product_slider','navigate','/products?sort=review'),
          W(5,'리뷰 HTML 요약','html_editor','none',''),
        ]),

        P(55,'SIDEBAR_MID','파일·다운로드 위젯','file_list','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'파일 목록','file_list','navigate','/files'),
          W(2,'사이즈가이드 파일','file','navigate','/files/size-guide.pdf'),
          W(3,'파일 정보카드','info_card','none',''),
          W(4,'파일 텍스트','text_banner','none',''),
          W(5,'파일 HTML 안내','html_editor','none',''),
        ]),

        P(56,'SIDEBAR_MID','외부 위젯 임베드 섹션','widget_embed','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'날씨 위젯 임베드','widget_embed','none',''),
          W(2,'환율 위젯 임베드','widget_embed','none',''),
          W(3,'위젯 정보카드','info_card','none',''),
          W(4,'위젯 텍스트','text_banner','none',''),
          W(5,'위젯 HTML','html_editor','none',''),
        ]),

        /* ───────────── SIDEBAR_BOT (사이드바 하단) ───────────── */
        P(57,'SIDEBAR_BOT','SNS 팔로우 위젯','html_editor','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'SNS 링크 HTML','html_editor','none',''),
          W(2,'SNS 이미지 배너','image_banner','navigate','https://instagram.com'),
          W(3,'SNS 텍스트','text_banner','none',''),
          W(4,'SNS 정보카드','info_card','none',''),
          W(5,'SNS 위젯 임베드','widget_embed','none',''),
        ]),

        P(58,'SIDEBAR_BOT','고객센터 안내 위젯','info_card','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'고객센터 정보카드','info_card','none',''),
          W(2,'고객센터 텍스트','text_banner','none',''),
          W(3,'고객센터 HTML','html_editor','none',''),
          W(4,'카카오채널 위젯','widget_embed','none',''),
          W(5,'고객센터 이미지','image_banner','navigate','/contact'),
        ]),

        P(59,'SIDEBAR_BOT','배송정책 안내 위젯','text_banner','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'배송정책 텍스트','text_banner','none',''),
          W(2,'배송정책 HTML','html_editor','none',''),
          W(3,'배송 정보카드','info_card','none',''),
          W(4,'배송 파일 가이드','file','navigate','/files/dliv-guide.pdf'),
          W(5,'반품정책 텍스트','text_banner','none',''),
        ]),

        P(60,'SIDEBAR_BOT','베스트 리뷰 위젯','chart_pie','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'리뷰 파이차트','chart_pie','none',''),
          W(2,'리뷰 정보카드','info_card','none',''),
          W(3,'리뷰 바차트','chart_bar','none',''),
          W(4,'리뷰 텍스트','text_banner','none',''),
          W(5,'리뷰 상품 슬라이더','product_slider','navigate','/products?sort=review'),
        ]),

        P(61,'SIDEBAR_BOT','팝업 광고 위젯','popup','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'사이드바 팝업','popup','navigate','/sale'),
          W(2,'팝업 이미지','image_banner','navigate','/sale'),
          W(3,'팝업 텍스트','text_banner','none',''),
          W(4,'팝업 쿠폰','coupon','event','issueSideBotPopupCoupon'),
          W(5,'팝업 HTML','html_editor','none',''),
        ]),

        P(62,'SIDEBAR_BOT','이달의 특가 상품','cond_product','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'이달의 특가 조건상품','cond_product','navigate','/products?tag=monthly'),
          W(2,'특가 슬라이더','product_slider','navigate','/products?tag=monthly'),
          W(3,'특가 텍스트','text_banner','none',''),
          W(4,'특가 쿠폰','coupon','event','issueMonthlyBotCoupon'),
          W(5,'특가 이미지 배너','image_banner','navigate','/sale'),
        ]),

        P(63,'SIDEBAR_BOT','뉴스레터 구독 위젯','html_editor','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'구독 HTML 폼','html_editor','none',''),
          W(2,'구독 텍스트','text_banner','none',''),
          W(3,'구독 정보카드','info_card','none',''),
          W(4,'구독 이미지','image_banner','none',''),
          W(5,'구독 위젯','widget_embed','none',''),
        ]),

        /* ───────────── PRODUCT_BTM (상품 하단) ───────────── */
        P(64,'PRODUCT_BTM','함께 구매한 상품 섹션','product_slider','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'함께구매 슬라이더','product_slider','navigate','/products'),
          W(2,'함께구매 조건상품','cond_product','navigate','/products'),
          W(3,'함께구매 단품','product','navigate','/detail/5'),
          W(4,'함께구매 텍스트','text_banner','none',''),
          W(5,'함께구매 이미지','image_banner','navigate','/products'),
        ]),

        P(65,'PRODUCT_BTM','최근 본 상품 섹션','cond_product','로그인 필요',true,2,'활성','2026-03-05',[
          W(1,'최근 본 조건상품','cond_product','navigate','/products'),
          W(2,'최근 본 슬라이더','product_slider','navigate','/products'),
          W(3,'최근 본 정보카드','info_card','none',''),
          W(4,'최근 본 텍스트','text_banner','none',''),
          W(5,'최근 본 이벤트','event_banner','navigate','/events'),
        ]),

        P(66,'PRODUCT_BTM','브랜드 추천 상품 섹션','product_slider','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'브랜드 상품 슬라이더','product_slider','navigate','/products?brand=1'),
          W(2,'브랜드 이미지 배너','image_banner','navigate','/brand'),
          W(3,'브랜드 조건상품','cond_product','navigate','/products?brand=1'),
          W(4,'브랜드 정보카드','info_card','none',''),
          W(5,'브랜드 텍스트','text_banner','none',''),
        ]),

        P(67,'PRODUCT_BTM','상품 리뷰 차트 섹션','chart_bar','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'리뷰 바차트','chart_bar','none',''),
          W(2,'리뷰 파이차트','chart_pie','none',''),
          W(3,'리뷰 정보카드','info_card','none',''),
          W(4,'리뷰 텍스트','text_banner','none',''),
          W(5,'리뷰 HTML 요약','html_editor','none',''),
        ]),

        P(68,'PRODUCT_BTM','하단 이벤트 배너 섹션','event_banner','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'하단 이벤트 배너','event_banner','navigate','/events'),
          W(2,'하단 이미지 배너','image_banner','navigate','/events'),
          W(3,'하단 쿠폰 발급','coupon','event','issueBtmEventCoupon'),
          W(4,'하단 텍스트 안내','text_banner','none',''),
          W(5,'하단 HTML 안내','html_editor','none',''),
        ]),

        P(69,'PRODUCT_BTM','Q&A·고객문의 위젯','html_editor','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'Q&A HTML 위젯','html_editor','none',''),
          W(2,'문의 정보카드','info_card','none',''),
          W(3,'문의 텍스트','text_banner','none',''),
          W(4,'카카오채널 위젯','widget_embed','none',''),
          W(5,'문의 이미지 배너','image_banner','navigate','/contact'),
        ]),

        P(70,'PRODUCT_BTM','상품 비교 팝업 위젯','popup','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'비교 팝업','popup','none',''),
          W(2,'비교 조건상품','cond_product','navigate','/products'),
          W(3,'비교 정보카드','info_card','none',''),
          W(4,'비교 텍스트','text_banner','none',''),
          W(5,'비교 HTML','html_editor','none',''),
        ]),

        /* ───────────── FOOTER (푸터) ───────────── */
        P(71,'FOOTER','푸터 회사 소개 위젯','html_editor','항상 표시',false,1,'활성','2026-03-01',[
          W(1,'회사소개 HTML','html_editor','none',''),
          W(2,'회사소개 텍스트','text_banner','none',''),
          W(3,'회사소개 이미지','image_banner','navigate','/about'),
          W(4,'로고 이미지 배너','image_banner','navigate','/'),
          W(5,'대표자 정보카드','info_card','none',''),
        ]),

        P(72,'FOOTER','푸터 SNS 링크 위젯','html_editor','항상 표시',false,2,'활성','2026-03-05',[
          W(1,'SNS 링크 HTML','html_editor','none',''),
          W(2,'인스타그램 위젯','widget_embed','none',''),
          W(3,'유튜브 위젯','widget_embed','none',''),
          W(4,'SNS 이미지 배너','image_banner','none',''),
          W(5,'SNS 텍스트','text_banner','none',''),
        ]),

        P(73,'FOOTER','푸터 고객센터 정보 위젯','info_card','항상 표시',false,3,'활성','2026-03-10',[
          W(1,'고객센터 정보카드','info_card','none',''),
          W(2,'운영시간 텍스트','text_banner','none',''),
          W(3,'고객센터 HTML','html_editor','none',''),
          W(4,'카카오채널 위젯','widget_embed','none',''),
          W(5,'전화 이미지 배너','image_banner','navigate','/contact'),
        ]),

        P(74,'FOOTER','푸터 이용약관 링크 위젯','html_editor','항상 표시',false,4,'활성','2026-03-15',[
          W(1,'약관 링크 HTML','html_editor','none',''),
          W(2,'개인정보처리방침 텍스트','text_banner','none',''),
          W(3,'이용약관 파일','file','navigate','/files/terms.pdf'),
          W(4,'약관 정보카드','info_card','none',''),
          W(5,'파일 목록','file_list','navigate','/files'),
        ]),

        P(75,'FOOTER','푸터 배송·반품 안내 위젯','text_banner','항상 표시',false,5,'활성','2026-03-20',[
          W(1,'배송안내 텍스트','text_banner','none',''),
          W(2,'반품안내 텍스트','text_banner','none',''),
          W(3,'배송안내 HTML','html_editor','none',''),
          W(4,'배송안내 파일','file','navigate','/files/dliv-guide.pdf'),
          W(5,'배송 정보카드','info_card','none',''),
        ]),

        P(76,'FOOTER','푸터 결제수단 안내 위젯','html_editor','항상 표시',false,6,'활성','2026-04-01',[
          W(1,'결제수단 HTML','html_editor','none',''),
          W(2,'결제수단 이미지','image_banner','none',''),
          W(3,'결제 정보카드','info_card','none',''),
          W(4,'결제 텍스트','text_banner','none',''),
          W(5,'결제 위젯 임베드','widget_embed','none',''),
        ]),

        P(77,'FOOTER','푸터 뉴스레터·앱 다운로드 위젯','html_editor','항상 표시',false,7,'비활성','2026-04-05',[
          W(1,'뉴스레터 구독 HTML','html_editor','none',''),
          W(2,'앱 다운로드 이미지','image_banner','navigate','/app'),
          W(3,'앱 텍스트 안내','text_banner','none',''),
          W(4,'앱 정보카드','info_card','none',''),
          W(5,'앱 위젯 임베드','widget_embed','none',''),
        ]),
      ];
    })(),

    events: [
      { eventId: 1, title: '봄맞이 신상품 론칭 이벤트', content1: '<p>봄을 맞아 새로운 컬렉션을 소개합니다!</p>', content2: '<p>특별 할인 혜택을 누려보세요.</p>', content3: '', content4: '', content5: '', targetProducts: [1, 2, 3], authRequired: false, startDate: '2026-03-01', endDate: '2026-05-31', status: '진행중', regDate: '2026-02-25' },
      { eventId: 2, title: 'VIP 회원 전용 특별 혜택', content1: '<p>VIP 고객님께 드리는 특별 혜택!</p>', content2: '<p>추가 할인 쿠폰과 무료 배송을 제공합니다.</p>', content3: '<p>VIP 전용 라운지를 경험해 보세요.</p>', content4: '', content5: '', targetProducts: [6, 9, 14], authRequired: true, startDate: '2026-04-01', endDate: '2026-04-30', status: '진행중', regDate: '2026-03-28' },
      { eventId: 3, title: '설날 특별 기획전', content1: '<p>설날을 맞아 특별 기획전을 진행합니다.</p>', content2: '', content3: '', content4: '', content5: '', targetProducts: [3, 6, 7], authRequired: false, startDate: '2026-01-15', endDate: '2026-02-10', status: '종료', regDate: '2026-01-10' },
      { eventId: 4, title: '여름 시즌 프리뷰 이벤트', content1: '<p>여름 신상품을 미리 만나보세요!</p>', content2: '<p>얼리버드 특별 가격으로 구매하세요.</p>', content3: '', content4: '', content5: '', targetProducts: [4, 5, 11], authRequired: false, startDate: '2026-05-01', endDate: '2026-06-30', status: '예정', regDate: '2026-04-07' },
    ],

    contacts: [
      { inquiryId: 1, userId: 1, userNm: '홍길동', date: '2026-04-06 14:35', category: '배송 문의', title: '주문 후 배송 현황 확인 요청', content: '오늘 주문했는데 언제 발송될까요?', status: '요청', answer: '' },
      { inquiryId: 2, userId: 1, userNm: '홍길동', date: '2026-04-04 11:02', category: '상품 문의', title: '울 블렌드 롱코트 사이즈 문의', content: 'M과 L 중 어떤 사이즈가 맞을지 궁금합니다. 키 168cm 58kg입니다.', status: '처리중', answer: '' },
      { inquiryId: 3, userId: 2, userNm: '이영희', date: '2026-03-30 09:48', category: '교환·반품 문의', title: '색상이 사진과 달라요', content: '받은 상품 색상이 사이트 이미지와 많이 다릅니다. 교환 가능한가요?', status: '답변완료', answer: '안녕하세요. 모니터 설정에 따라 차이가 있을 수 있습니다. 교환 접수 도와드리겠습니다.' },
      { inquiryId: 4, userId: 3, userNm: '박민준', date: '2026-03-28 17:23', category: '주문·결제 문의', title: '주문 취소 요청', content: '실수로 주문했습니다. 취소 가능할까요?', status: '요청', answer: '' },
      { inquiryId: 5, userId: 4, userNm: '김수현', date: '2026-03-25 10:15', category: '배송 문의', title: '배송지 변경 요청', content: '배송 출발 전에 주소 변경이 가능한가요?', status: '답변완료', answer: '배송 출발 전이라면 변경 가능합니다. 빠르게 연락 주세요.' },
      { inquiryId: 6, userId: 6, userNm: '정민호', date: '2026-03-20 16:44', category: '상품 문의', title: '재입고 문의', content: '블랙 XL 사이즈 재입고 예정이 있나요?', status: '처리중', answer: '' },
      { inquiryId: 7, userId: 8, userNm: '윤성준', date: '2026-03-18 08:30', category: '교환·반품 문의', title: '반품 신청', content: '사이즈가 맞지 않아 반품하고 싶습니다.', status: '답변완료', answer: '반품 접수 완료되었습니다. 택배 회수 후 환불 처리됩니다.' },
      { inquiryId: 8, userId: 2, userNm: '이영희', date: '2026-03-15 13:55', category: '기타 문의', title: '쿠폰 사용 방법 문의', content: '쿠폰을 어디서 사용하나요?', status: '답변완료', answer: '주문 결제 페이지에서 쿠폰을 적용하실 수 있습니다.' },
    ],

    chats: [
      { chatId: 1, userId: 1, userNm: '홍길동', date: '2026-04-06 14:32', subject: '배송 관련 문의', lastMsg: '주문하신 상품은 내일 발송 예정입니다.', status: '진행중', unread: 1, messages: [
        { from: 'user', text: '안녕하세요, 주문한 상품 배송이 언제 될까요?', time: '14:25', orderId: 'ORD-2026-025' },
        { from: 'cs', text: '안녕하세요 ShopJoy 고객센터입니다. 확인해보겠습니다.', time: '14:28' },
        { from: 'cs', text: '주문하신 상품은 내일 발송 예정입니다.', time: '14:32' },
      ]},
      { chatId: 2, userId: 1, userNm: '홍길동', date: '2026-04-03 10:15', subject: '반품 신청', lastMsg: '반품 접수가 완료되었습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '사이즈가 맞지 않아 반품하고 싶습니다.', time: '10:10', claimId: 'CLM-2026-008' },
        { from: 'cs', text: '반품 접수 도와드리겠습니다.', time: '10:12' },
        { from: 'cs', text: '반품 접수가 완료되었습니다.', time: '10:15' },
      ]},
      { chatId: 3, userId: 2, userNm: '이영희', date: '2026-03-28 16:45', subject: '상품 재입고 문의', lastMsg: '재입고 시 알림 신청 완료했습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '블랙 XL 재입고 언제 될까요?', time: '16:40', productId: 1 },
        { from: 'cs', text: '재입고 시 알림 신청 완료했습니다.', time: '16:45' },
      ]},
      { chatId: 4, userId: 3, userNm: '박민준', date: '2026-03-20 11:20', subject: '쿠폰 적용 문의', lastMsg: '쿠폰 적용 방법 안내드렸습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '쿠폰을 어떻게 사용하나요?', time: '11:18' },
        { from: 'cs', text: '주문 페이지에서 쿠폰 선택 후 적용하시면 됩니다.', time: '11:20' },
      ]},
      { chatId: 5, userId: 4, userNm: '김수현', date: '2026-04-07 09:00', subject: '신상품 문의', lastMsg: '', status: '진행중', unread: 2, messages: [
        { from: 'user', text: '신상품 입고 일정 알 수 있을까요?', time: '09:00', productId: 2 },
      ]},
      { chatId: 6, userId: 6, userNm: '정민호', date: '2026-02-25 14:00', subject: '결제 오류 문의', lastMsg: '결제 정상 처리 확인되었습니다.', status: '종료', unread: 0, messages: [
        { from: 'user', text: '결제가 두 번 된 것 같아요.', time: '13:55', orderId: 'ORD-2026-017' },
        { from: 'cs', text: '확인 결과 한 번만 결제되었습니다.', time: '14:00' },
      ]},
    ],

    sites: [
      { siteId: 1,  siteCode: 'ST0001', siteType: '이커머스',    siteNm: 'ShopJoy',                    domain: 'shopjoy.com',          logoUrl: '/assets/img/logo.png',             description: 'Vue.js 기반 풀스택 이커머스 플랫폼 (쇼핑몰 데모)',             email: 'help@shopjoy.com',        phone: '02-1234-5678', address: '서울 강남구 테헤란로 123 ShopJoy빌딩',         businessNo: '123-45-67890', ceo: '김대표', status: '운영중', regDate: '2025-01-01' },
      { siteId: 2,  siteCode: 'ST0002', siteType: '숙박공유',    siteNm: '에어비앤비 Korea',            domain: 'airbnb.co.kr',         logoUrl: '/assets/img/airbnb.png',           description: '전 세계 숙소·체험 공유 플랫폼 한국 서비스',                 email: 'support@airbnb.co.kr',    phone: '02-6022-2499', address: '서울 강남구 봉은사로 524 에어비앤비코리아',    businessNo: '211-87-01234', ceo: '황인국', status: '운영중', regDate: '2014-08-01' },
      { siteId: 3,  siteCode: 'ST0003', siteType: '전문가연결',  siteNm: '숨고',                        domain: 'soomgo.com',           logoUrl: '/assets/img/soomgo.png',           description: '전문가와 고객을 연결하는 국내 최대 전문가 매칭 플랫폼',     email: 'hello@soomgo.com',        phone: '02-6951-2345', address: '서울 서초구 강남대로 479 숨고타워',           businessNo: '220-87-12345', ceo: '구본웅', status: '운영중', regDate: '2015-03-01' },
      { siteId: 4,  siteCode: 'ST0004', siteType: 'IT매칭',      siteNm: '위시캣',                      domain: 'wishket.com',          logoUrl: '/assets/img/wishket.png',          description: 'IT 프리랜서·외주개발 프로젝트 매칭 플랫폼',                email: 'contact@wishket.com',     phone: '02-6203-3456', address: '서울 마포구 양화로 160 위시캣빌딩',           businessNo: '110-87-23456', ceo: '박우범', status: '운영중', regDate: '2012-11-01' },
      { siteId: 5,  siteCode: 'ST0005', siteType: '부동산',      siteNm: '아실',                        domain: 'asil.kr',              logoUrl: '/assets/img/asil.png',             description: '아파트 실거래가·분양정보 부동산 정보 플랫폼',              email: 'info@asil.kr',            phone: '02-3456-4567', address: '서울 강남구 역삼동 618 아실빌딩',             businessNo: '220-86-34567', ceo: '이종우', status: '운영중', regDate: '2019-05-01' },
      { siteId: 6,  siteCode: 'ST0006', siteType: '교육',        siteNm: '인프런',                      domain: 'inflearn.com',         logoUrl: '/assets/img/inflearn.png',         description: '국내 최대 IT 온라인 강의 및 개발자 교육 플랫폼',           email: 'cs@inflearn.com',         phone: '02-6714-5678', address: '서울 강남구 테헤란로 311 인프랩빌딩',         businessNo: '215-87-45678', ceo: '이형주', status: '운영중', regDate: '2016-07-01' },
      { siteId: 7,  siteCode: 'ST0007', siteType: '중고거래',    siteNm: '당근마켓',                    domain: 'daangn.com',           logoUrl: '/assets/img/daangn.png',           description: '동네 기반 중고거래·지역 커뮤니티 모바일 플랫폼',           email: 'hello@daangn.com',        phone: '02-1833-6789', address: '서울 강남구 테헤란로 131 당근마켓빌딩',       businessNo: '411-88-56789', ceo: '김용현', status: '운영중', regDate: '2015-07-01' },
      { siteId: 8,  siteCode: 'ST0008', siteType: '영화예매',    siteNm: 'CGV',                         domain: 'cgv.co.kr',            logoUrl: '/assets/img/cgv.png',              description: '국내 최대 멀티플렉스 영화관 체인 및 온라인 예매 플랫폼',   email: 'cscenter@cgv.co.kr',      phone: '1544-1122',    address: '서울 중구 남대문로 84 CJ제일제당센터',        businessNo: '104-81-67890', ceo: '허민회', status: '운영중', regDate: '2000-05-01' },
      { siteId: 9,  siteCode: 'ST0009', siteType: '음식배달',    siteNm: '배달의민족',                  domain: 'baemin.com',           logoUrl: '/assets/img/baemin.png',           description: '국내 1위 음식 배달 O2O 플랫폼',                            email: 'help@woowahan.com',       phone: '02-3036-7890', address: '서울 송파구 위례성대로 2 우아한형제들빌딩',   businessNo: '120-87-78901', ceo: '김범준', status: '운영중', regDate: '2010-06-01' },
      { siteId: 10, siteCode: 'ST0010', siteType: '가격비교',    siteNm: '다나와',                      domain: 'danawa.com',           logoUrl: '/assets/img/danawa.png',           description: '국내 최대 IT·가전 가격비교 쇼핑 정보 플랫폼',             email: 'cs@danawa.com',           phone: '02-1670-8901', address: '서울 강남구 봉은사로 134 다나와빌딩',         businessNo: '120-86-89012', ceo: '박견욱', status: '운영중', regDate: '2000-11-01' },
      { siteId: 11, siteCode: 'ST0011', siteType: '시각화',      siteNm: 'DataVisual 데이터 시각화',    domain: 'datavisual.demo.kr',   logoUrl: '/assets/img/datavisual.png',       description: '대시보드·차트·실시간 패널로 구성된 데이터 시각화 데모',    email: 'info@datavisual.demo.kr', phone: '02-0000-1101', address: '서울 마포구 월드컵북로 396 DataVisual',       businessNo: '111-87-11001', ceo: '데이터장', status: '운영중', regDate: '2026-01-15' },
      { siteId: 12, siteCode: 'ST0012', siteType: '홈페이지',    siteNm: 'AnyNuri 홈페이지',            domain: 'anynuri.demo.kr',      logoUrl: '/assets/img/anynuri.png',          description: '애니메이션 스튜디오 소개형 홈페이지 데모',                 email: 'info@anynuri.demo.kr',    phone: '02-0000-1201', address: '서울 마포구 창전로 36 AnyNuri스튜디오',       businessNo: '111-87-12001', ceo: '누리대표', status: '운영중', regDate: '2026-01-20' },
      { siteId: 13, siteCode: 'ST0013', siteType: '홈페이지',    siteNm: 'Dangoeul 홈페이지',           domain: 'dangoeul.demo.kr',     logoUrl: '/assets/img/dangoeul.png',         description: '지역 농산물 직거래 소개형 홈페이지 데모',                  email: 'info@dangoeul.demo.kr',   phone: '031-000-1301', address: '경기 양평군 양평읍 Dangoeul농장',             businessNo: '111-87-13001', ceo: '단고을', status: '운영중', regDate: '2026-02-01' },
      { siteId: 14, siteCode: 'ST0014', siteType: '홈페이지',    siteNm: 'Home(STUDIO) 홈페이지',       domain: 'homestudio.demo.kr',   logoUrl: '/assets/img/homestudio.png',       description: '크리에이티브 기술 스튜디오 홈페이지 데모',                 email: 'info@homestudio.demo.kr', phone: '02-0000-1401', address: '서울 성동구 왕십리로 83 HomeSTUDIO',          businessNo: '111-87-14001', ceo: '스튜디오장', status: '운영중', regDate: '2026-02-10' },
      { siteId: 15, siteCode: 'ST0015', siteType: '홈페이지',    siteNm: 'Partyroom 홈페이지',          domain: 'partyroom.demo.kr',    logoUrl: '/assets/img/partyroom.png',        description: '파티룸 공간 소개 및 예약형 홈페이지 데모',                 email: 'info@partyroom.demo.kr',  phone: '02-0000-1501', address: '서울 강남구 선릉로 102 Partyroom',            businessNo: '111-87-15001', ceo: '파티장', status: '운영중', regDate: '2026-02-20' },
      { siteId: 16, siteCode: 'ST0016', siteType: '홈페이지',    siteNm: '송진현 갤러리',               domain: 'sjonghyun.demo.kr',    logoUrl: '/assets/img/gallery.png',          description: '그림 대여 및 판매 갤러리 데모 홈페이지',                  email: 'info@sjonghyun.demo.kr',  phone: '02-0000-1601', address: '서울 종로구 인사동길 35 송진현갤러리',        businessNo: '111-87-16001', ceo: '송진현', status: '운영중', regDate: '2026-03-01' },
      { siteId: 17, siteCode: 'ST0017', siteType: '홈페이지',    siteNm: 'CareMate(병원동행)',          domain: 'caremate.demo.kr',     logoUrl: '/assets/img/caremate.png',         description: '병원동행 & 돌봄 서비스 소개형 홈페이지 데모',             email: 'info@caremate.demo.kr',   phone: '02-0000-1701', address: '서울 서초구 서초대로 396 CareMate',           businessNo: '111-87-17001', ceo: '케어대표', status: '운영중', regDate: '2026-03-10' },
    ],

    brands: [
      { brandId:  1, brandCode: 'NIKE',       brandNm: '나이키',     brandEnNm: 'Nike',        logoUrl: '', sortOrd:  1, useYn: 'Y', remark: '글로벌 스포츠 브랜드',  regDate: '2026-01-01' },
      { brandId:  2, brandCode: 'ADIDAS',     brandNm: '아디다스',   brandEnNm: 'Adidas',      logoUrl: '', sortOrd:  2, useYn: 'Y', remark: '독일 스포츠 브랜드',    regDate: '2026-01-01' },
      { brandId:  3, brandCode: 'PUMA',       brandNm: '푸마',       brandEnNm: 'Puma',        logoUrl: '', sortOrd:  3, useYn: 'Y', remark: '독일 스포츠 브랜드',    regDate: '2026-01-01' },
      { brandId:  4, brandCode: 'NB',         brandNm: '뉴발란스',   brandEnNm: 'New Balance', logoUrl: '', sortOrd:  4, useYn: 'Y', remark: '미국 스포츠 브랜드',    regDate: '2026-01-01' },
      { brandId:  5, brandCode: 'UNIQLO',     brandNm: '유니클로',   brandEnNm: 'Uniqlo',      logoUrl: '', sortOrd:  5, useYn: 'Y', remark: '일본 캐주얼 브랜드',    regDate: '2026-01-01' },
      { brandId:  6, brandCode: 'ZARA',       brandNm: '자라',       brandEnNm: 'Zara',        logoUrl: '', sortOrd:  6, useYn: 'Y', remark: '스페인 패스트패션',     regDate: '2026-01-01' },
      { brandId:  7, brandCode: 'HM',         brandNm: 'H&M',        brandEnNm: 'H&M',         logoUrl: '', sortOrd:  7, useYn: 'Y', remark: '스웨덴 패스트패션',     regDate: '2026-01-01' },
      { brandId:  8, brandCode: 'LEVIS',      brandNm: '리바이스',   brandEnNm: "Levi's",      logoUrl: '', sortOrd:  8, useYn: 'Y', remark: '미국 데님 브랜드',      regDate: '2026-01-01' },
      { brandId:  9, brandCode: 'MLB',        brandNm: 'MLB',        brandEnNm: 'MLB',         logoUrl: '', sortOrd:  9, useYn: 'Y', remark: '야구 라이선스 패션',    regDate: '2026-01-01' },
      { brandId: 10, brandCode: 'DESCENTE',   brandNm: '데상트',     brandEnNm: 'Descente',    logoUrl: '', sortOrd: 10, useYn: 'Y', remark: '일본 스포츠 브랜드',    regDate: '2026-01-01' },
      { brandId: 11, brandCode: 'SHOPJOY_OWN',brandNm: 'ShopJoy OB', brandEnNm: 'ShopJoy OB',  logoUrl: '', sortOrd: 11, useYn: 'Y', remark: '자체 브랜드(PB상품)',   regDate: '2026-01-01' },
      { brandId: 12, brandCode: 'LEGACY',     brandNm: '레거시브랜드',brandEnNm: 'Legacy',      logoUrl: '', sortOrd: 12, useYn: 'N', remark: '미사용 처리된 브랜드', regDate: '2026-01-01' },
    ],

    codes: [
      /* ── 회원 등급 ── */
      { codeId:  1, codeGrp: 'MEMBER_GRADE',    codeLabel: 'VIP',       codeValue: 'VIP',            sortOrd: 1, useYn: 'Y', remark: 'VIP 회원 등급', regDate: '2026-01-01' },
      { codeId:  2, codeGrp: 'MEMBER_GRADE',    codeLabel: '우수',       codeValue: 'GOLD',           sortOrd: 2, useYn: 'Y', remark: '우수 회원 등급', regDate: '2026-01-01' },
      { codeId:  3, codeGrp: 'MEMBER_GRADE',    codeLabel: '일반',       codeValue: 'NORMAL',         sortOrd: 3, useYn: 'Y', remark: '일반 회원 등급', regDate: '2026-01-01' },
      /* ── 회원 상태 ── */
      { codeId:  4, codeGrp: 'MEMBER_STATUS',   codeLabel: '활성',       codeValue: 'ACTIVE',         sortOrd: 1, useYn: 'Y', remark: '정상 사용 회원', regDate: '2026-01-01' },
      { codeId:  5, codeGrp: 'MEMBER_STATUS',   codeLabel: '정지',       codeValue: 'BLOCKED',        sortOrd: 2, useYn: 'Y', remark: '이용 정지 회원', regDate: '2026-01-01' },
      { codeId:  6, codeGrp: 'MEMBER_STATUS',   codeLabel: '탈퇴',       codeValue: 'WITHDRAWN',      sortOrd: 3, useYn: 'Y', remark: '탈퇴 처리 회원', regDate: '2026-01-01' },
      /* ── 성별 ── */
      { codeId:  7, codeGrp: 'GENDER',          codeLabel: '남성',       codeValue: 'M',              sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:  8, codeGrp: 'GENDER',          codeLabel: '여성',       codeValue: 'F',              sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:  9, codeGrp: 'GENDER',          codeLabel: '공용',       codeValue: 'U',              sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 주문 상태 ── */
      { codeId: 10, codeGrp: 'ORDER_STATUS',    codeLabel: '주문완료',   codeValue: 'ORDER_COMPLETE', sortOrd: 1, useYn: 'Y', remark: '결제 전 주문 접수', regDate: '2026-01-01' },
      { codeId: 11, codeGrp: 'ORDER_STATUS',    codeLabel: '결제완료',   codeValue: 'PAY_COMPLETE',   sortOrd: 2, useYn: 'Y', remark: '결제 승인 완료', regDate: '2026-01-01' },
      { codeId: 12, codeGrp: 'ORDER_STATUS',    codeLabel: '배송준비중', codeValue: 'DLIV_READY',     sortOrd: 3, useYn: 'Y', remark: '출고 준비 단계', regDate: '2026-01-01' },
      { codeId: 13, codeGrp: 'ORDER_STATUS',    codeLabel: '배송중',     codeValue: 'DLIV_ING',       sortOrd: 4, useYn: 'Y', remark: '택배사 인수 후', regDate: '2026-01-01' },
      { codeId: 14, codeGrp: 'ORDER_STATUS',    codeLabel: '배송완료',   codeValue: 'DLIV_DONE',      sortOrd: 5, useYn: 'Y', remark: '수령 확인 전', regDate: '2026-01-01' },
      { codeId: 15, codeGrp: 'ORDER_STATUS',    codeLabel: '완료',       codeValue: 'COMPLETE',       sortOrd: 6, useYn: 'Y', remark: '구매 확정', regDate: '2026-01-01' },
      { codeId: 16, codeGrp: 'ORDER_STATUS',    codeLabel: '취소됨',     codeValue: 'CANCEL',         sortOrd: 7, useYn: 'Y', remark: '주문 취소 처리', regDate: '2026-01-01' },
      /* ── 결제 수단 ── */
      { codeId: 17, codeGrp: 'PAY_METHOD',      codeLabel: '카드결제',   codeValue: 'CARD',           sortOrd: 1, useYn: 'Y', remark: '신용/체크카드', regDate: '2026-01-01' },
      { codeId: 18, codeGrp: 'PAY_METHOD',      codeLabel: '계좌이체',   codeValue: 'BANK',           sortOrd: 2, useYn: 'Y', remark: '실시간 계좌이체', regDate: '2026-01-01' },
      { codeId: 19, codeGrp: 'PAY_METHOD',      codeLabel: '캐쉬',       codeValue: 'CACHE',          sortOrd: 3, useYn: 'Y', remark: '적립금 사용', regDate: '2026-01-01' },
      { codeId: 20, codeGrp: 'PAY_METHOD',      codeLabel: '혼합결제',   codeValue: 'MIX',            sortOrd: 4, useYn: 'Y', remark: '캐쉬+카드/계좌 병행', regDate: '2026-01-01' },
      { codeId: 21, codeGrp: 'PAY_METHOD',      codeLabel: '무통장입금', codeValue: 'VBANK',          sortOrd: 5, useYn: 'Y', remark: '가상계좌 무통장', regDate: '2026-01-01' },
      /* ── 환불 수단 ── */
      { codeId: 22, codeGrp: 'REFUND_METHOD',   codeLabel: '카드취소',   codeValue: 'CARD_CANCEL',    sortOrd: 1, useYn: 'Y', remark: '카드사 승인 취소', regDate: '2026-01-01' },
      { codeId: 23, codeGrp: 'REFUND_METHOD',   codeLabel: '계좌환불',   codeValue: 'BANK_REFUND',    sortOrd: 2, useYn: 'Y', remark: '고객 계좌로 송금', regDate: '2026-01-01' },
      { codeId: 24, codeGrp: 'REFUND_METHOD',   codeLabel: '캐쉬환불',   codeValue: 'CACHE_REFUND',   sortOrd: 3, useYn: 'Y', remark: '적립금으로 환불', regDate: '2026-01-01' },
      /* ── 배송사 ── */
      { codeId: 25, codeGrp: 'COURIER',         codeLabel: 'CJ대한통운', codeValue: 'CJ',             sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 26, codeGrp: 'COURIER',         codeLabel: '롯데택배',   codeValue: 'LOTTE',          sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 27, codeGrp: 'COURIER',         codeLabel: '한진택배',   codeValue: 'HANJIN',         sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 28, codeGrp: 'COURIER',         codeLabel: '우체국택배', codeValue: 'POST',           sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 29, codeGrp: 'COURIER',         codeLabel: '로젠택배',   codeValue: 'LOGEN',          sortOrd: 5, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 배송 상태 ── */
      { codeId: 30, codeGrp: 'DLIV_STATUS',     codeLabel: '배송준비',   codeValue: 'READY',          sortOrd: 1, useYn: 'Y', remark: '출고 대기 중', regDate: '2026-01-01' },
      { codeId: 31, codeGrp: 'DLIV_STATUS',     codeLabel: '배송중',     codeValue: 'ING',            sortOrd: 2, useYn: 'Y', remark: '택배사 이동 중', regDate: '2026-01-01' },
      { codeId: 32, codeGrp: 'DLIV_STATUS',     codeLabel: '배송완료',   codeValue: 'DONE',           sortOrd: 3, useYn: 'Y', remark: '수령 완료', regDate: '2026-01-01' },
      { codeId: 33, codeGrp: 'DLIV_STATUS',     codeLabel: '반송',       codeValue: 'RETURN',         sortOrd: 4, useYn: 'Y', remark: '반송 처리', regDate: '2026-01-01' },
      /* ── 클레임 유형 ── */
      { codeId: 34, codeGrp: 'CLAIM_TYPE',      codeLabel: '취소',       codeValue: 'CANCEL',         sortOrd: 1, useYn: 'Y', remark: '주문 취소 요청', regDate: '2026-01-01' },
      { codeId: 35, codeGrp: 'CLAIM_TYPE',      codeLabel: '반품',       codeValue: 'RETURN',         sortOrd: 2, useYn: 'Y', remark: '상품 반품 요청', regDate: '2026-01-01' },
      { codeId: 36, codeGrp: 'CLAIM_TYPE',      codeLabel: '교환',       codeValue: 'EXCHANGE',       sortOrd: 3, useYn: 'Y', remark: '상품 교환 요청', regDate: '2026-01-01' },
      /* ── 클레임 상태 ── */
      { codeId: 37, codeGrp: 'CLAIM_STATUS',    codeLabel: '취소요청',   codeValue: 'CANCEL_REQ',     sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 38, codeGrp: 'CLAIM_STATUS',    codeLabel: '취소처리중', codeValue: 'CANCEL_ING',     sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 39, codeGrp: 'CLAIM_STATUS',    codeLabel: '취소완료',   codeValue: 'CANCEL_DONE',    sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 40, codeGrp: 'CLAIM_STATUS',    codeLabel: '반품요청',   codeValue: 'RETURN_REQ',     sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 41, codeGrp: 'CLAIM_STATUS',    codeLabel: '수거예정',   codeValue: 'COLLECT_SCHED',  sortOrd: 5, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 42, codeGrp: 'CLAIM_STATUS',    codeLabel: '수거완료',   codeValue: 'COLLECT_DONE',   sortOrd: 6, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 43, codeGrp: 'CLAIM_STATUS',    codeLabel: '환불처리중', codeValue: 'REFUND_ING',     sortOrd: 7, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 44, codeGrp: 'CLAIM_STATUS',    codeLabel: '환불완료',   codeValue: 'REFUND_DONE',    sortOrd: 8, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 45, codeGrp: 'CLAIM_STATUS',    codeLabel: '교환요청',   codeValue: 'EXCHANGE_REQ',   sortOrd: 9, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 46, codeGrp: 'CLAIM_STATUS',    codeLabel: '발송완료',   codeValue: 'EXCHANGE_SEND',  sortOrd:10, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 47, codeGrp: 'CLAIM_STATUS',    codeLabel: '교환완료',   codeValue: 'EXCHANGE_DONE',  sortOrd:11, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 클레임 사유 ── */
      { codeId: 48, codeGrp: 'CLAIM_REASON',    codeLabel: '단순변심',   codeValue: 'CHANGE_MIND',    sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 49, codeGrp: 'CLAIM_REASON',    codeLabel: '주문실수',   codeValue: 'ORDER_MISTAKE',  sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 50, codeGrp: 'CLAIM_REASON',    codeLabel: '배송지연',   codeValue: 'DLIV_DELAY',     sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 51, codeGrp: 'CLAIM_REASON',    codeLabel: '상품불량',   codeValue: 'DEFECT',         sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 52, codeGrp: 'CLAIM_REASON',    codeLabel: '사이즈 불일치', codeValue: 'SIZE_WRONG',  sortOrd: 5, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 53, codeGrp: 'CLAIM_REASON',    codeLabel: '색상 상이',  codeValue: 'COLOR_DIFF',     sortOrd: 6, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 54, codeGrp: 'CLAIM_REASON',    codeLabel: '색상 변경',  codeValue: 'COLOR_CHANGE',   sortOrd: 7, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 상품 카테고리 ── */
      { codeId: 55, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '상의',       codeValue: 'TOP',            sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 56, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '하의',       codeValue: 'BOTTOM',         sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 57, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '원피스',     codeValue: 'DRESS',          sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 58, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '아우터',     codeValue: 'OUTER',          sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 59, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '가방',       codeValue: 'BAG',            sortOrd: 5, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 60, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '신발',       codeValue: 'SHOES',          sortOrd: 6, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 61, codeGrp: 'PRODUCT_CATEGORY',codeLabel: '액세서리',   codeValue: 'ACC',            sortOrd: 7, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 상품 상태 ── */
      { codeId: 62, codeGrp: 'PRODUCT_STATUS',  codeLabel: '판매중',     codeValue: 'ON_SALE',        sortOrd: 1, useYn: 'Y', remark: '정상 판매 중', regDate: '2026-01-01' },
      { codeId: 63, codeGrp: 'PRODUCT_STATUS',  codeLabel: '준비중',     codeValue: 'PREPARING',      sortOrd: 2, useYn: 'Y', remark: '출시 준비 중', regDate: '2026-01-01' },
      { codeId: 64, codeGrp: 'PRODUCT_STATUS',  codeLabel: '품절',       codeValue: 'SOLD_OUT',       sortOrd: 3, useYn: 'Y', remark: '재고 소진', regDate: '2026-01-01' },
      { codeId: 65, codeGrp: 'PRODUCT_STATUS',  codeLabel: '판매중지',   codeValue: 'SUSPENDED',      sortOrd: 4, useYn: 'Y', remark: '관리자 판매 중지', regDate: '2026-01-01' },
      /* ── 상품 사이즈 ── */
      { codeId: 66, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'FREE',       codeValue: 'FREE',           sortOrd: 1, useYn: 'Y', remark: '프리사이즈', regDate: '2026-01-01' },
      { codeId: 67, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'XS',         codeValue: 'XS',             sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 68, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'S',          codeValue: 'S',              sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 69, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'M',          codeValue: 'M',              sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 70, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'L',          codeValue: 'L',              sortOrd: 5, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 71, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'XL',         codeValue: 'XL',             sortOrd: 6, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 72, codeGrp: 'PRODUCT_SIZE',    codeLabel: 'XXL',        codeValue: 'XXL',            sortOrd: 7, useYn: 'N', remark: '빅사이즈', regDate: '2026-01-01' },
      /* ── 쿠폰 할인 유형 ── */
      { codeId: 73, codeGrp: 'COUPON_TYPE',     codeLabel: '정률 할인',  codeValue: 'RATE',           sortOrd: 1, useYn: 'Y', remark: '% 할인', regDate: '2026-01-01' },
      { codeId: 74, codeGrp: 'COUPON_TYPE',     codeLabel: '정액 할인',  codeValue: 'FIXED',          sortOrd: 2, useYn: 'Y', remark: '금액 할인', regDate: '2026-01-01' },
      /* ── 쿠폰 상태 ── */
      { codeId: 75, codeGrp: 'COUPON_STATUS',   codeLabel: '활성',       codeValue: 'ACTIVE',         sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 76, codeGrp: 'COUPON_STATUS',   codeLabel: '비활성',     codeValue: 'INACTIVE',       sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 77, codeGrp: 'COUPON_STATUS',   codeLabel: '만료',       codeValue: 'EXPIRED',        sortOrd: 3, useYn: 'Y', remark: '기간 만료', regDate: '2026-01-01' },
      /* ── 캐시(적립금) 유형 ── */
      { codeId: 78, codeGrp: 'CACHE_TYPE',      codeLabel: '구매 적립',  codeValue: 'EARN_BUY',       sortOrd: 1, useYn: 'Y', remark: '주문 완료 시 적립', regDate: '2026-01-01' },
      { codeId: 79, codeGrp: 'CACHE_TYPE',      codeLabel: '관리자 지급',codeValue: 'EARN_ADMIN',     sortOrd: 2, useYn: 'Y', remark: '관리자 수동 지급', regDate: '2026-01-01' },
      { codeId: 80, codeGrp: 'CACHE_TYPE',      codeLabel: '이벤트 지급',codeValue: 'EARN_EVENT',     sortOrd: 3, useYn: 'Y', remark: '이벤트 당첨', regDate: '2026-01-01' },
      { codeId: 81, codeGrp: 'CACHE_TYPE',      codeLabel: '주문 사용',  codeValue: 'USE_ORDER',      sortOrd: 4, useYn: 'Y', remark: '주문 결제 시 사용', regDate: '2026-01-01' },
      { codeId: 82, codeGrp: 'CACHE_TYPE',      codeLabel: '환불 복원',  codeValue: 'REFUND',         sortOrd: 5, useYn: 'Y', remark: '취소/반품 후 복원', regDate: '2026-01-01' },
      { codeId: 83, codeGrp: 'CACHE_TYPE',      codeLabel: '소멸',       codeValue: 'EXPIRE',         sortOrd: 6, useYn: 'Y', remark: '유효기간 만료 소멸', regDate: '2026-01-01' },
      /* ── 이벤트 유형 ── */
      { codeId: 84, codeGrp: 'EVENT_TYPE',      codeLabel: '할인 이벤트',codeValue: 'DISCOUNT',       sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 85, codeGrp: 'EVENT_TYPE',      codeLabel: '증정 이벤트',codeValue: 'GIFT',           sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 86, codeGrp: 'EVENT_TYPE',      codeLabel: '적립 이벤트',codeValue: 'CACHE',          sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 87, codeGrp: 'EVENT_TYPE',      codeLabel: '기획전',     codeValue: 'CURATED',        sortOrd: 4, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 이벤트 상태 ── */
      { codeId: 88, codeGrp: 'EVENT_STATUS',    codeLabel: '대기',       codeValue: 'PENDING',        sortOrd: 1, useYn: 'Y', remark: '시작 전', regDate: '2026-01-01' },
      { codeId: 89, codeGrp: 'EVENT_STATUS',    codeLabel: '진행중',     codeValue: 'ACTIVE',         sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 90, codeGrp: 'EVENT_STATUS',    codeLabel: '종료',       codeValue: 'ENDED',          sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 디스플레이 유형 ── */
      { codeId: 91, codeGrp: 'DISP_TYPE',       codeLabel: '메인배너',   codeValue: 'MAIN_BANNER',    sortOrd: 1, useYn: 'Y', remark: '메인 슬라이드 배너', regDate: '2026-01-01' },
      { codeId: 92, codeGrp: 'DISP_TYPE',       codeLabel: '서브배너',   codeValue: 'SUB_BANNER',     sortOrd: 2, useYn: 'Y', remark: '보조 배너', regDate: '2026-01-01' },
      { codeId: 93, codeGrp: 'DISP_TYPE',       codeLabel: '팝업',       codeValue: 'POPUP',          sortOrd: 3, useYn: 'Y', remark: '레이어 팝업', regDate: '2026-01-01' },
      { codeId: 94, codeGrp: 'DISP_TYPE',       codeLabel: '기획전',     codeValue: 'SPECIAL',        sortOrd: 4, useYn: 'Y', remark: '기획전 페이지', regDate: '2026-01-01' },
      /* ── 디스플레이 상태 ── */
      { codeId: 95, codeGrp: 'DISP_STATUS',     codeLabel: '노출',       codeValue: 'SHOW',           sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 96, codeGrp: 'DISP_STATUS',     codeLabel: '숨김',       codeValue: 'HIDE',           sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 공지사항 유형 ── */
      { codeId: 97, codeGrp: 'NOTICE_TYPE',     codeLabel: '일반',       codeValue: 'NORMAL',         sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId: 98, codeGrp: 'NOTICE_TYPE',     codeLabel: '긴급',       codeValue: 'URGENT',         sortOrd: 2, useYn: 'Y', remark: '상단 고정', regDate: '2026-01-01' },
      /* ── 고객문의 상태 ── */
      { codeId: 99, codeGrp: 'CONTACT_STATUS',  codeLabel: '접수',       codeValue: 'RECEIVED',       sortOrd: 1, useYn: 'Y', remark: '문의 접수', regDate: '2026-01-01' },
      { codeId:100, codeGrp: 'CONTACT_STATUS',  codeLabel: '처리중',     codeValue: 'IN_PROGRESS',    sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:101, codeGrp: 'CONTACT_STATUS',  codeLabel: '완료',       codeValue: 'DONE',           sortOrd: 3, useYn: 'Y', remark: '답변 완료', regDate: '2026-01-01' },
      { codeId:102, codeGrp: 'CONTACT_STATUS',  codeLabel: '보류',       codeValue: 'ON_HOLD',        sortOrd: 4, useYn: 'Y', remark: '추가 확인 필요', regDate: '2026-01-01' },
      /* ── 채팅 상태 ── */
      { codeId:103, codeGrp: 'CHATT_STATUS',    codeLabel: '대기',       codeValue: 'WAITING',        sortOrd: 1, useYn: 'Y', remark: '상담사 배정 대기', regDate: '2026-01-01' },
      { codeId:104, codeGrp: 'CHATT_STATUS',    codeLabel: '진행중',     codeValue: 'ACTIVE',         sortOrd: 2, useYn: 'Y', remark: '상담 진행 중', regDate: '2026-01-01' },
      { codeId:105, codeGrp: 'CHATT_STATUS',    codeLabel: '완료',       codeValue: 'DONE',           sortOrd: 3, useYn: 'Y', remark: '상담 종료', regDate: '2026-01-01' },
      /* ── 알림 유형 ── */
      { codeId:106, codeGrp: 'ALARM_TYPE',      codeLabel: '주문',       codeValue: 'ORDER',          sortOrd: 1, useYn: 'Y', remark: '주문 관련 알림', regDate: '2026-01-01' },
      { codeId:107, codeGrp: 'ALARM_TYPE',      codeLabel: '배송',       codeValue: 'DELIVERY',       sortOrd: 2, useYn: 'Y', remark: '배송 관련 알림', regDate: '2026-01-01' },
      { codeId:108, codeGrp: 'ALARM_TYPE',      codeLabel: '클레임',     codeValue: 'CLAIM',          sortOrd: 3, useYn: 'Y', remark: '취소/반품/교환 알림', regDate: '2026-01-01' },
      { codeId:109, codeGrp: 'ALARM_TYPE',      codeLabel: '마케팅',     codeValue: 'MARKETING',      sortOrd: 4, useYn: 'Y', remark: '이벤트/프로모션', regDate: '2026-01-01' },
      { codeId:110, codeGrp: 'ALARM_TYPE',      codeLabel: '시스템',     codeValue: 'SYSTEM',         sortOrd: 5, useYn: 'Y', remark: '시스템 공지', regDate: '2026-01-01' },
      /* ── 알림 발송 채널 ── */
      { codeId:111, codeGrp: 'ALARM_CHANNEL',   codeLabel: '이메일',     codeValue: 'EMAIL',          sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:112, codeGrp: 'ALARM_CHANNEL',   codeLabel: 'SMS',        codeValue: 'SMS',            sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:113, codeGrp: 'ALARM_CHANNEL',   codeLabel: '알림톡',     codeValue: 'KAKAO',          sortOrd: 3, useYn: 'Y', remark: '카카오 알림톡', regDate: '2026-01-01' },
      { codeId:114, codeGrp: 'ALARM_CHANNEL',   codeLabel: '푸시',       codeValue: 'PUSH',           sortOrd: 4, useYn: 'Y', remark: '앱 푸시 알림', regDate: '2026-01-01' },
      /* ── 템플릿 유형 ── */
      { codeId:115, codeGrp: 'TEMPLATE_TYPE',   codeLabel: '이메일',     codeValue: 'EMAIL',          sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:116, codeGrp: 'TEMPLATE_TYPE',   codeLabel: 'SMS',        codeValue: 'SMS',            sortOrd: 2, useYn: 'Y', remark: '문자 메시지', regDate: '2026-01-01' },
      { codeId:117, codeGrp: 'TEMPLATE_TYPE',   codeLabel: '알림톡',     codeValue: 'KAKAO',          sortOrd: 3, useYn: 'Y', remark: '카카오 알림톡', regDate: '2026-01-01' },
      { codeId:118, codeGrp: 'TEMPLATE_TYPE',   codeLabel: '푸시',       codeValue: 'PUSH',           sortOrd: 4, useYn: 'Y', remark: '앱 푸시', regDate: '2026-01-01' },
      /* ── 배치 주기 ── */
      { codeId:119, codeGrp: 'BATCH_CYCLE',     codeLabel: '수동',       codeValue: 'MANUAL',         sortOrd: 1, useYn: 'Y', remark: '수동 실행 전용', regDate: '2026-01-01' },
      { codeId:120, codeGrp: 'BATCH_CYCLE',     codeLabel: '시간별',     codeValue: 'HOURLY',         sortOrd: 2, useYn: 'Y', remark: '매시 정각', regDate: '2026-01-01' },
      { codeId:121, codeGrp: 'BATCH_CYCLE',     codeLabel: '일간',       codeValue: 'DAILY',          sortOrd: 3, useYn: 'Y', remark: '매일 새벽 실행', regDate: '2026-01-01' },
      { codeId:122, codeGrp: 'BATCH_CYCLE',     codeLabel: '주간',       codeValue: 'WEEKLY',         sortOrd: 4, useYn: 'Y', remark: '매주 월요일', regDate: '2026-01-01' },
      { codeId:123, codeGrp: 'BATCH_CYCLE',     codeLabel: '월간',       codeValue: 'MONTHLY',        sortOrd: 5, useYn: 'Y', remark: '매월 1일', regDate: '2026-01-01' },
      /* ── 배치 상태 ── */
      { codeId:124, codeGrp: 'BATCH_STATUS',    codeLabel: '대기',       codeValue: 'PENDING',        sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:125, codeGrp: 'BATCH_STATUS',    codeLabel: '실행중',     codeValue: 'RUNNING',        sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:126, codeGrp: 'BATCH_STATUS',    codeLabel: '완료',       codeValue: 'DONE',           sortOrd: 3, useYn: 'Y', remark: '정상 완료', regDate: '2026-01-01' },
      { codeId:127, codeGrp: 'BATCH_STATUS',    codeLabel: '실패',       codeValue: 'FAILED',         sortOrd: 4, useYn: 'Y', remark: '오류 종료', regDate: '2026-01-01' },
      /* ── 판매업체 상태 ── */
      { codeId:128, codeGrp: 'VENDOR_STATUS',   codeLabel: '활성',       codeValue: 'ACTIVE',         sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:129, codeGrp: 'VENDOR_STATUS',   codeLabel: '심사중',     codeValue: 'REVIEWING',      sortOrd: 2, useYn: 'Y', remark: '입점 심사 중', regDate: '2026-01-01' },
      { codeId:130, codeGrp: 'VENDOR_STATUS',   codeLabel: '정지',       codeValue: 'BLOCKED',        sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 사이트 상태 ── */
      { codeId:131, codeGrp: 'SITE_STATUS',     codeLabel: '활성',       codeValue: 'ACTIVE',         sortOrd: 1, useYn: 'Y', remark: '정상 운영', regDate: '2026-01-01' },
      { codeId:132, codeGrp: 'SITE_STATUS',     codeLabel: '점검중',     codeValue: 'MAINTENANCE',    sortOrd: 2, useYn: 'Y', remark: '시스템 점검', regDate: '2026-01-01' },
      { codeId:133, codeGrp: 'SITE_STATUS',     codeLabel: '비활성',     codeValue: 'INACTIVE',       sortOrd: 3, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 관리자 역할 ── */
      { codeId:134, codeGrp: 'USER_ROLE',       codeLabel: '최고관리자', codeValue: 'SUPER_ADMIN',    sortOrd: 1, useYn: 'Y', remark: '전체 권한', regDate: '2026-01-01' },
      { codeId:135, codeGrp: 'USER_ROLE',       codeLabel: '운영자',     codeValue: 'OPERATOR',       sortOrd: 2, useYn: 'Y', remark: '일반 운영 권한', regDate: '2026-01-01' },
      { codeId:136, codeGrp: 'USER_ROLE',       codeLabel: 'MD',         codeValue: 'MD',             sortOrd: 3, useYn: 'Y', remark: '상품 관리 권한', regDate: '2026-01-01' },
      { codeId:137, codeGrp: 'USER_ROLE',       codeLabel: 'CS',         codeValue: 'CS',             sortOrd: 4, useYn: 'Y', remark: '고객 서비스 권한', regDate: '2026-01-01' },
      { codeId:138, codeGrp: 'USER_ROLE',       codeLabel: '배송관리',   codeValue: 'LOGISTICS',      sortOrd: 5, useYn: 'Y', remark: '배송/물류 권한', regDate: '2026-01-01' },
      /* ── 관리자 상태 ── */
      { codeId:139, codeGrp: 'USER_STATUS',     codeLabel: '활성',       codeValue: 'ACTIVE',         sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:140, codeGrp: 'USER_STATUS',     codeLabel: '비활성',     codeValue: 'INACTIVE',       sortOrd: 2, useYn: 'Y', remark: '접속 불가', regDate: '2026-01-01' },
      /* ── 부서 유형 ── */
      { codeId:141, codeGrp: 'DEPT_TYPE',       codeLabel: '개발',       codeValue: 'DEV',            sortOrd: 1, useYn: 'Y', remark: '개발팀', regDate: '2026-01-01' },
      { codeId:142, codeGrp: 'DEPT_TYPE',       codeLabel: '운영',       codeValue: 'OPS',            sortOrd: 2, useYn: 'Y', remark: '운영팀', regDate: '2026-01-01' },
      { codeId:143, codeGrp: 'DEPT_TYPE',       codeLabel: 'MD',         codeValue: 'MD',             sortOrd: 3, useYn: 'Y', remark: '상품기획팀', regDate: '2026-01-01' },
      { codeId:144, codeGrp: 'DEPT_TYPE',       codeLabel: 'CS',         codeValue: 'CS',             sortOrd: 4, useYn: 'Y', remark: '고객서비스팀', regDate: '2026-01-01' },
      { codeId:145, codeGrp: 'DEPT_TYPE',       codeLabel: '마케팅',     codeValue: 'MKT',            sortOrd: 5, useYn: 'Y', remark: '마케팅팀', regDate: '2026-01-01' },
      { codeId:146, codeGrp: 'DEPT_TYPE',       codeLabel: '물류',       codeValue: 'LOGIS',          sortOrd: 6, useYn: 'Y', remark: '물류/배송팀', regDate: '2026-01-01' },
      /* ── 사용여부 (공용) ── */
      { codeId:147, codeGrp: 'USE_YN',          codeLabel: '사용',       codeValue: 'Y',              sortOrd: 1, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      { codeId:148, codeGrp: 'USE_YN',          codeLabel: '미사용',     codeValue: 'N',              sortOrd: 2, useYn: 'Y', remark: '', regDate: '2026-01-01' },
      /* ── 전시 화면영역 ── */
      { codeId:149, codeGrp: 'DISP_AREA',       codeLabel: '홈 메인배너',   codeValue: 'HOME_BANNER',  sortOrd:  1, useYn: 'Y', remark: '홈 상단 메인 슬라이드 배너 영역', regDate: '2026-01-01' },
      { codeId:150, codeGrp: 'DISP_AREA',       codeLabel: '홈 상품영역',   codeValue: 'HOME_PRODUCT', sortOrd:  2, useYn: 'Y', remark: '홈 추천/신상품 상품 목록 영역', regDate: '2026-01-01' },
      { codeId:151, codeGrp: 'DISP_AREA',       codeLabel: '홈 차트',       codeValue: 'HOME_CHART',   sortOrd:  3, useYn: 'Y', remark: '홈 인기/베스트 차트 영역', regDate: '2026-01-01' },
      { codeId:152, codeGrp: 'DISP_AREA',       codeLabel: '홈 이벤트',     codeValue: 'HOME_EVENT',   sortOrd:  4, useYn: 'Y', remark: '홈 이벤트/기획전 배너 영역', regDate: '2026-01-01' },
      { codeId:153, codeGrp: 'DISP_AREA',       codeLabel: '사이드바 상단', codeValue: 'SIDEBAR_TOP',  sortOrd:  5, useYn: 'Y', remark: '우측 사이드바 최상단 영역', regDate: '2026-01-01' },
      { codeId:154, codeGrp: 'DISP_AREA',       codeLabel: '사이드바 중단', codeValue: 'SIDEBAR_MID',  sortOrd:  6, useYn: 'Y', remark: '우측 사이드바 중간 영역', regDate: '2026-01-01' },
      { codeId:155, codeGrp: 'DISP_AREA',       codeLabel: '사이드바 하단', codeValue: 'SIDEBAR_BOT',  sortOrd:  7, useYn: 'Y', remark: '우측 사이드바 하단 영역', regDate: '2026-01-01' },
      { codeId:156, codeGrp: 'DISP_AREA',       codeLabel: '상품 상단',     codeValue: 'PRODUCT_TOP',  sortOrd:  8, useYn: 'Y', remark: '상품 목록/상세 상단 영역', regDate: '2026-01-01' },
      { codeId:157, codeGrp: 'DISP_AREA',       codeLabel: '상품 하단',     codeValue: 'PRODUCT_BTM',  sortOrd:  9, useYn: 'Y', remark: '상품 목록/상세 하단 영역', regDate: '2026-01-01' },
      { codeId:158, codeGrp: 'DISP_AREA',       codeLabel: '마이페이지',    codeValue: 'MY_PAGE',      sortOrd: 10, useYn: 'Y', remark: '마이페이지 전용 위젯 영역', regDate: '2026-01-01' },
      { codeId:159, codeGrp: 'DISP_AREA',       codeLabel: '푸터',          codeValue: 'FOOTER',       sortOrd: 11, useYn: 'Y', remark: '사이트 하단 푸터 영역', regDate: '2026-01-01' },
    ],

    attachGrps: [
      { attachGrpId: 1, grpNm: '상품 이미지', grpCode: 'PRODUCT_IMG', description: '상품 상세 페이지 이미지', maxCount: 10, maxSizeMb: 5, allowExt: 'jpg,png,gif,webp', status: '활성', regDate: '2026-01-01' },
      { attachGrpId: 2, grpNm: '배너 이미지', grpCode: 'BANNER_IMG', description: '사이트 배너 이미지', maxCount: 5, maxSizeMb: 3, allowExt: 'jpg,png,gif,webp', status: '활성', regDate: '2026-01-01' },
      { attachGrpId: 3, grpNm: '이벤트 이미지', grpCode: 'EVENT_IMG', description: '이벤트 페이지 이미지', maxCount: 20, maxSizeMb: 5, allowExt: 'jpg,png,gif,webp', status: '활성', regDate: '2026-01-15' },
      { attachGrpId: 4, grpNm: '카테고리 아이콘', grpCode: 'CATEGORY_ICON', description: '카테고리 아이콘 이미지', maxCount: 1, maxSizeMb: 1, allowExt: 'jpg,png,svg', status: '활성', regDate: '2026-01-20' },
      { attachGrpId: 5, grpNm: '이메일 첨부', grpCode: 'EMAIL_ATTACH', description: '이메일 발송 첨부파일', maxCount: 3, maxSizeMb: 10, allowExt: 'pdf,xlsx,docx', status: '활성', regDate: '2026-02-01' },
      { attachGrpId: 6, grpNm: '클레임 증빙', grpCode: 'CLAIM_PROOF', description: '클레임 신청 시 증빙 이미지', maxCount: 5, maxSizeMb: 5, allowExt: 'jpg,png,pdf', status: '활성', regDate: '2026-02-10' },
    ],

    attaches: [
      { attachId: 1, attachGrpId: 1, attachGrpNm: '상품 이미지', fileNm: 'product_001_main.jpg', fileSize: 245600, fileExt: 'jpg', url: '/uploads/products/product_001_main.jpg', refId: 'PROD-001', memo: '메인 이미지', regDate: '2026-03-01' },
      { attachId: 2, attachGrpId: 1, attachGrpNm: '상품 이미지', fileNm: 'product_001_sub1.jpg', fileSize: 182300, fileExt: 'jpg', url: '/uploads/products/product_001_sub1.jpg', refId: 'PROD-001', memo: '서브 이미지1', regDate: '2026-03-01' },
      { attachId: 3, attachGrpId: 1, attachGrpNm: '상품 이미지', fileNm: 'product_002_main.jpg', fileSize: 318900, fileExt: 'jpg', url: '/uploads/products/product_002_main.jpg', refId: 'PROD-002', memo: '메인 이미지', regDate: '2026-03-05' },
      { attachId: 4, attachGrpId: 2, attachGrpNm: '배너 이미지', fileNm: 'banner_spring_2026.jpg', fileSize: 428100, fileExt: 'jpg', url: '/uploads/banners/banner_spring_2026.jpg', refId: 'BNRR-001', memo: '봄맞이 메인배너', regDate: '2026-03-01' },
      { attachId: 5, attachGrpId: 2, attachGrpNm: '배너 이미지', fileNm: 'banner_vip_event.png', fileSize: 356200, fileExt: 'png', url: '/uploads/banners/banner_vip_event.png', refId: 'BNRR-002', memo: 'VIP 이벤트 배너', regDate: '2026-04-01' },
      { attachId: 6, attachGrpId: 3, attachGrpNm: '이벤트 이미지', fileNm: 'event_spring_launch.jpg', fileSize: 512400, fileExt: 'jpg', url: '/uploads/events/event_spring_launch.jpg', refId: 'EVT-001', memo: '봄맞이 론칭 이벤트 이미지', regDate: '2026-02-25' },
      { attachId: 7, attachGrpId: 6, attachGrpNm: '클레임 증빙', fileNm: 'claim_proof_001.jpg', fileSize: 195800, fileExt: 'jpg', url: '/uploads/claims/claim_proof_001.jpg', refId: 'CLM-2026-009', memo: '상품 불량 증빙 사진', regDate: '2026-04-05' },
    ],

    templates: [
      { templateId: 1, templateType: '메일템플릿', templateCode: 'ORDER_CONFIRM_MAIL', templateNm: '주문 확인 메일', subject: '[ShopJoy] 주문이 완료되었습니다', content: '<p>안녕하세요 {{username}}님,</p><p>주문번호 {{orderId}} 주문이 완료되었습니다.</p><p>감사합니다.</p>', useYn: 'Y', regDate: '2026-01-10', sampleParams: '{"username":"홍길동","orderId":"ORD-20260410-001","prodNm":"블랙 데님 자켓","trackingNo":"1234567890","totalPrice":"89,000"}' },
      { templateId: 2, templateType: '메일템플릿', templateCode: 'DELIVERY_START_MAIL', templateNm: '배송 시작 알림 메일', subject: '[ShopJoy] 상품이 출발했습니다', content: '<p>안녕하세요 {{username}}님,</p><p>주문하신 {{prodNm}} 상품이 배송 시작되었습니다.</p><p>운송장번호: {{trackingNo}}</p>', useYn: 'Y', regDate: '2026-01-10', sampleParams: '{"username":"김민지","prodNm":"화이트 린넨 셔츠","trackingNo":"9876543210"}' },
      { templateId: 3, templateType: '메일템플릿', templateCode: 'PW_RESET_MAIL', templateNm: '비밀번호 재설정 메일', subject: '[ShopJoy] 비밀번호 재설정 안내', content: '<p>안녕하세요,</p><p>비밀번호 재설정 링크: {{resetLink}}</p><p>링크는 24시간 후 만료됩니다.</p>', useYn: 'Y', regDate: '2026-01-15', sampleParams: '{"resetLink":"https://shopjoy.example.com/reset?token=abc123xyz"}' },
      { templateId: 4, templateType: '문자템플릿', templateCode: 'ORDER_COMPLETE_SMS', templateNm: '주문완료 SMS', subject: '', content: '[ShopJoy] {{username}}님 주문({{orderId}})이 완료되었습니다. 총 {{totalPrice}}원', useYn: 'Y', regDate: '2026-01-10', sampleParams: '{"username":"이영희","orderId":"ORD-20260410-002","totalPrice":"45,000"}' },
      { templateId: 5, templateType: '문자템플릿', templateCode: 'DELIVERY_START_SMS', templateNm: '배송출발 SMS', subject: '', content: '[ShopJoy] 상품이 출발했습니다. 운송장: {{trackingNo}} ({{courier}})', useYn: 'Y', regDate: '2026-01-10', sampleParams: '{"trackingNo":"5555444433","courier":"CJ대한통운"}' },
      { templateId: 6, templateType: 'MMS템플릿', templateCode: 'NEW_PRODUCT_MMS', templateNm: '신상품 출시 MMS', subject: '신상품 출시 안내', content: '안녕하세요 {{username}}님!\n새로운 컬렉션이 출시되었습니다.\n지금 바로 확인해보세요!', useYn: 'Y', regDate: '2026-02-01', sampleParams: '{"username":"박철수"}' },
      { templateId: 7, templateType: 'kakao톡템플릿', templateCode: 'ORDER_COMPLETE_KAKAO', templateNm: '주문완료 카카오톡', subject: '', content: '주문이 완료되었습니다.\n주문번호: {{orderId}}\n상품명: {{prodNm}}\n결제금액: {{totalPrice}}원', useYn: 'Y', regDate: '2026-01-20', sampleParams: '{"orderId":"ORD-20260410-003","prodNm":"레드 플로럴 원피스","totalPrice":"129,000"}' },
      { templateId: 8, templateType: 'kakao알림톡템플릿', templateCode: 'DELIVERY_COMPLETE_ALIMTALK', templateNm: '배송완료 알림톡', subject: '', content: '배송이 완료되었습니다.\n수령 후 문제가 있으시면 고객센터로 연락 주세요.\n☎ 02-1234-5678', useYn: 'Y', regDate: '2026-01-20', sampleParams: '{}' },
      { templateId: 9, templateType: 'kakao알림톡템플릿', templateCode: 'CLAIM_COMPLETE_ALIMTALK', templateNm: '클레임 처리완료 알림톡', subject: '', content: '클레임({{claimId}}) 처리가 완료되었습니다.\n처리결과: {{result}}\n환불금액: {{refundAmount}}원', useYn: 'Y', regDate: '2026-02-10', sampleParams: '{"claimId":"CLM-20260410-001","result":"환불 처리 완료","refundAmount":"89,000"}' },
      { templateId: 10, templateType: '시스템알림', templateCode: 'SYS_BATCH_FAIL_ALERT', templateNm: '배치 실패 시스템알림', subject: '[시스템] 배치 실패 알림', content: '[SYSTEM ALERT]\n배치: {{batchNm}} ({{batchCode}})\n실행일시: {{runTime}}\n오류: {{errorMsg}}\n담당자 확인 바랍니다.', useYn: 'Y', regDate: '2026-03-01', sampleParams: '{"batchNm":"주문 자동 완료 처리","batchCode":"ORDER_AUTO_COMPLETE","runTime":"2026-04-10 02:00:05","errorMsg":"Connection timeout after 30s"}' },
      { templateId: 11, templateType: '시스템알림', templateCode: 'SYS_LOGIN_FAIL_ALERT', templateNm: '로그인 실패 임계치 알림', subject: '[시스템] 로그인 실패 임계치 초과', content: '[SECURITY ALERT]\n계정: {{loginId}}\nIP: {{clientIp}}\n실패횟수: {{failCount}}회\n발생일시: {{occurTime}}\n계정이 잠금 처리되었습니다.', useYn: 'Y', regDate: '2026-03-05', sampleParams: '{"loginId":"user1@test.com","clientIp":"192.168.1.100","failCount":"5","occurTime":"2026-04-10 09:32:15"}' },
      { templateId: 12, templateType: '시스템알림', templateCode: 'SYS_DISK_USAGE_ALERT', templateNm: '디스크 사용량 경고 알림', subject: '[시스템] 디스크 사용량 경고', content: '[INFRA ALERT]\n서버: {{serverName}}\n디스크: {{diskPath}}\n사용률: {{usagePercent}}%\n여유공간: {{freeSpace}}GB\n즉시 조치 바랍니다.', useYn: 'Y', regDate: '2026-03-10', sampleParams: '{"serverName":"prod-web-01","diskPath":"/var/data","usagePercent":"87","freeSpace":"12.3"}' },
      { templateId: 13, templateType: '회원알림', templateCode: 'MEMBER_ORDER_COMPLETE', templateNm: '주문완료 회원알림', subject: '', content: '{{username}}님의 주문이 완료되었습니다.\n주문번호: {{orderId}}\n결제금액: {{totalPrice}}원\n주문일시: {{orderDate}}', useYn: 'Y', regDate: '2026-04-01', sampleParams: '{"username":"홍길동","orderId":"ORD-20260410-001","totalPrice":"89,000","orderDate":"2026-04-10 14:32"}' },
      { templateId: 14, templateType: '회원알림', templateCode: 'MEMBER_PAYMENT_COMPLETE', templateNm: '결제완료 회원알림', subject: '', content: '{{username}}님 결제가 완료되었습니다.\n결제금액: {{payAmount}}원\n결제수단: {{payMethod}}\n주문번호: {{orderId}}', useYn: 'Y', regDate: '2026-04-01', sampleParams: '{"username":"김민지","orderId":"ORD-20260410-002","payAmount":"45,000","payMethod":"신용카드"}' },
      { templateId: 15, templateType: '회원알림', templateCode: 'MEMBER_DELIVERY_STARTED', templateNm: '배송중 회원알림', subject: '', content: '{{username}}님 주문하신 상품이 배송 중입니다.\n상품명: {{prodNm}}\n택배사: {{courier}}\n운송장번호: {{trackingNo}}', useYn: 'Y', regDate: '2026-04-01', sampleParams: '{"username":"이철수","prodNm":"블랙 데님 자켓","courier":"CJ대한통운","trackingNo":"9876543210"}' },
      { templateId: 16, templateType: '회원알림', templateCode: 'MEMBER_COUPON_ISSUED', templateNm: '쿠폰발급 회원알림', subject: '', content: '{{username}}님께 쿠폰이 발급되었습니다.\n쿠폰명: {{couponNm}}\n할인율: {{discountRate}}%\n유효기간: ~{{expireDate}}', useYn: 'Y', regDate: '2026-04-02', sampleParams: '{"username":"박영희","couponNm":"신규가입 축하쿠폰","discountRate":"10","expireDate":"2026-05-10"}' },
      { templateId: 17, templateType: '회원알림', templateCode: 'MEMBER_CACHE_CHARGED', templateNm: '캐쉬충전 회원알림', subject: '', content: '{{username}}님 캐쉬가 충전되었습니다.\n충전금액: {{chargeAmount}}원\n보유캐쉬: {{totalCache}}원\n충전일시: {{chargeDate}}', useYn: 'Y', regDate: '2026-04-02', sampleParams: '{"username":"최동현","chargeAmount":"5,000","totalCache":"23,500","chargeDate":"2026-04-10 09:15"}' },
    ],

    vendors: [
      { vendorId: 1, vendorType: '판매업체', vendorNm: '패션스타일 주식회사', ceo: '이사장', bizNo: '101-81-12345', phone: '02-2345-6789', email: 'fashion@style.co.kr', address: '서울 강남구 삼성동 101', contractDate: '2025-06-01', status: '활성' },
      { vendorId: 2, vendorType: '판매업체', vendorNm: '트렌드웨어 LLC', ceo: '박대표', bizNo: '201-86-23456', phone: '02-3456-7890', email: 'trend@wear.com', address: '서울 마포구 합정동 202', contractDate: '2025-08-15', status: '활성' },
      { vendorId: 3, vendorType: '판매업체', vendorNm: '에코패션 Co.', ceo: '김친환', bizNo: '301-87-34567', phone: '031-456-7890', email: 'eco@fashion.kr', address: '경기 성남시 분당구 303', contractDate: '2026-01-10', status: '활성' },
      { vendorId: 4, vendorType: '판매업체', vendorNm: '럭셔리브랜드 Inc.', ceo: '최럭셔', bizNo: '401-88-45678', phone: '02-5678-9012', email: 'luxury@brand.com', address: '서울 강남구 청담동 404', contractDate: '2025-12-01', status: '활성' },
      { vendorId: 5, vendorType: '배송업체', vendorNm: 'CJ대한통운', ceo: '택배장', bizNo: '501-89-56789', phone: '1588-1255', email: 'cs@cjlogistics.com', address: '서울 중구 남대문로 505', contractDate: '2025-01-01', status: '활성' },
      { vendorId: 6, vendorType: '배송업체', vendorNm: '롯데택배', ceo: '롯데배', bizNo: '601-90-67890', phone: '1588-2121', email: 'cs@lottegls.com', address: '서울 송파구 올림픽로 606', contractDate: '2025-01-01', status: '활성' },
      { vendorId: 7, vendorType: '배송업체', vendorNm: '한진택배', ceo: '한진배', bizNo: '701-91-78901', phone: '1588-0011', email: 'cs@hanjin.com', address: '서울 강서구 공항대로 707', contractDate: '2025-06-01', status: '활성' },
      { vendorId: 8, vendorType: '배송업체', vendorNm: '우체국택배', ceo: '우체국장', bizNo: '801-92-89012', phone: '1588-1300', email: 'cs@epost.go.kr', address: '서울 종로구 우정국로 808', contractDate: '2025-03-01', status: '비활성' },
    ],

    categories: [
      { categoryId: 1, parentId: null, categoryNm: '의류', depth: 1, sortOrd: 1, status: '활성', description: '의류 전체', imgUrl: '' },
      { categoryId: 2, parentId: 1, categoryNm: '상의', depth: 2, sortOrd: 1, status: '활성', description: '티셔츠, 셔츠, 니트 등', imgUrl: '' },
      { categoryId: 3, parentId: 1, categoryNm: '하의', depth: 2, sortOrd: 2, status: '활성', description: '청바지, 바지, 스커트 등', imgUrl: '' },
      { categoryId: 4, parentId: 1, categoryNm: '아우터', depth: 2, sortOrd: 3, status: '활성', description: '코트, 재킷, 점퍼 등', imgUrl: '' },
      { categoryId: 5, parentId: 1, categoryNm: '원피스', depth: 2, sortOrd: 4, status: '활성', description: '미디, 맥시, 미니 원피스', imgUrl: '' },
      { categoryId: 6, parentId: null, categoryNm: '가방', depth: 1, sortOrd: 2, status: '활성', description: '가방 전체', imgUrl: '' },
      { categoryId: 7, parentId: 6, categoryNm: '숄더백', depth: 2, sortOrd: 1, status: '활성', description: '', imgUrl: '' },
      { categoryId: 8, parentId: 6, categoryNm: '토트백', depth: 2, sortOrd: 2, status: '활성', description: '', imgUrl: '' },
      { categoryId: 9, parentId: 6, categoryNm: '백팩', depth: 2, sortOrd: 3, status: '활성', description: '', imgUrl: '' },
      { categoryId: 10, parentId: null, categoryNm: '신발', depth: 1, sortOrd: 3, status: '활성', description: '신발 전체', imgUrl: '' },
      { categoryId: 11, parentId: 10, categoryNm: '스니커즈', depth: 2, sortOrd: 1, status: '활성', description: '', imgUrl: '' },
      { categoryId: 12, parentId: 10, categoryNm: '구두', depth: 2, sortOrd: 2, status: '활성', description: '', imgUrl: '' },
      { categoryId: 13, parentId: null, categoryNm: '액세서리', depth: 1, sortOrd: 4, status: '비활성', description: '악세사리 전체', imgUrl: '' },
    ],

    adminUsers: [
      { adminUserId:  1, loginId: 'admin1',   name: '관리자1', email: 'admin1@demo.com',  password: 'demo1234', phone: '010-1000-0001', role: '슈퍼관리자', dept: 'IT팀',      status: '활성',   lastLogin: '2026-04-10 09:00', regDate: '2025-01-01' },
      { adminUserId:  2, loginId: 'admin2',   name: '관리자2', email: 'admin2@demo.com',  password: 'demo1234', phone: '010-1000-0002', role: '관리자',   dept: 'IT팀',      status: '활성',   lastLogin: '2026-04-10 08:45', regDate: '2025-02-01' },
      { adminUserId:  3, loginId: 'oper1',    name: '운영자1', email: 'oper1@demo.com',   password: 'demo1234', phone: '010-1000-0003', role: '운영자',   dept: '운영팀',    status: '활성',   lastLogin: '2026-04-09 17:30', regDate: '2025-03-01' },
      { adminUserId:  4, loginId: 'oper2',    name: '운영자2', email: 'oper2@demo.com',   password: 'demo1234', phone: '010-1000-0004', role: '운영자',   dept: '운영팀',    status: '활성',   lastLogin: '2026-04-10 09:15', regDate: '2025-03-15' },
      { adminUserId:  5, loginId: 'sales1',   name: '영업1',   email: 'sales1@demo.com',  password: 'demo1234', phone: '010-1000-0005', role: '영업관리자', dept: '영업팀',  status: '활성',   lastLogin: '2026-04-08 18:00', regDate: '2025-04-01' },
      { adminUserId:  6, loginId: 'sales2',   name: '영업2',   email: 'sales2@demo.com',  password: 'demo1234', phone: '010-1000-0006', role: '영업관리자', dept: '영업팀',  status: '활성',   lastLogin: '2026-04-07 14:20', regDate: '2025-04-15' },
      { adminUserId:  7, loginId: 'user1',    name: '사용자1', email: 'user1@demo.com',   password: 'demo1234', phone: '010-1000-0007', role: '일반사용자', dept: '기타',    status: '활성',   lastLogin: '2026-04-06 10:00', regDate: '2025-05-01' },
      { adminUserId:  8, loginId: 'user2',    name: '사용자2', email: 'user2@demo.com',   password: 'demo1234', phone: '010-1000-0008', role: '일반사용자', dept: '기타',    status: '활성',   lastLogin: '2026-04-05 11:30', regDate: '2025-05-15' },
      { adminUserId:  9, loginId: 'mgr1',     name: '매니저1', email: 'mgr1@demo.com',    password: 'demo1234', phone: '010-1000-0009', role: '관리자',   dept: '운영팀',    status: '활성',   lastLogin: '2026-04-04 09:00', regDate: '2025-06-01' },
      { adminUserId: 10, loginId: 'viewer1',  name: '뷰어1',   email: 'viewer1@demo.com', password: 'demo1234', phone: '010-1000-0010', role: '운영자',   dept: '마케팅팀',  status: '비활성', lastLogin: '2026-03-15 11:00', regDate: '2025-07-01' },
    ],

    batches: [
      { batchId: 1, batchNm: '주문 자동 완료 처리', batchCode: 'ORDER_AUTO_COMPLETE', description: '배송완료 후 7일 경과 주문 자동 완료 처리', cron: '0 2 * * *', lastRun: '2026-04-10 02:00:05', nextRun: '2026-04-11 02:00:00', status: '활성', runStatus: '성공', runCount: 215, regDate: '2025-01-01' },
      { batchId: 2, batchNm: '쿠폰 만료 처리', batchCode: 'COUPON_EXPIRE', description: '만료일 경과 쿠폰 상태 자동 변경', cron: '0 1 * * *', lastRun: '2026-04-10 01:00:03', nextRun: '2026-04-11 01:00:00', status: '활성', runStatus: '성공', runCount: 215, regDate: '2025-01-01' },
      { batchId: 3, batchNm: '이벤트 상태 동기화', batchCode: 'EVENT_STATUS_SYNC', description: '이벤트 시작/종료일 기준 상태 자동 동기화', cron: '0 0 * * *', lastRun: '2026-04-10 00:00:08', nextRun: '2026-04-11 00:00:00', status: '활성', runStatus: '성공', runCount: 215, regDate: '2025-01-01' },
      { batchId: 4, batchNm: '정산 리포트 생성', batchCode: 'SETTLEMENT_REPORT', description: '월간 정산 리포트 자동 생성 및 이메일 발송', cron: '0 8 1 * *', lastRun: '2026-04-01 08:00:12', nextRun: '2026-05-01 08:00:00', status: '활성', runStatus: '성공', runCount: 16, regDate: '2025-01-01' },
      { batchId: 5, batchNm: '미사용 첨부파일 정리', batchCode: 'ATTACH_CLEANUP', description: '30일 이상 미참조 임시 첨부파일 삭제', cron: '0 3 * * 0', lastRun: '2026-04-06 03:00:07', nextRun: '2026-04-13 03:00:00', status: '활성', runStatus: '성공', runCount: 65, regDate: '2025-01-15' },
      { batchId: 6, batchNm: '회원 등급 재산정', batchCode: 'MEMBER_GRADE_CALC', description: '월 구매 실적 기준 회원 등급 자동 재산정', cron: '0 4 1 * *', lastRun: '2026-04-01 04:00:15', nextRun: '2026-05-01 04:00:00', status: '활성', runStatus: '성공', runCount: 16, regDate: '2025-02-01' },
      { batchId: 7, batchNm: '캐시 자동 소멸', batchCode: 'CACHE_EXPIRE', description: '1년 이상 미사용 캐시 자동 소멸 처리', cron: '0 5 1 * *', lastRun: '2026-04-01 05:00:04', nextRun: '2026-05-01 05:00:00', status: '활성', runStatus: '성공', runCount: 16, regDate: '2025-01-01' },
      { batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC', description: '택배사 API 연동 배송 상태 자동 업데이트', cron: '0 */2 * * *', lastRun: '2026-04-10 08:00:06', nextRun: '2026-04-10 10:00:00', status: '활성', runStatus: '실행중', runCount: 2587, regDate: '2025-01-01' },
      { batchId: 9, batchNm: '통계 데이터 집계', batchCode: 'STATS_AGGREGATION', description: '일별/주별/월별 통계 데이터 사전 집계', cron: '0 0 * * *', lastRun: '2026-04-10 00:05:22', nextRun: '2026-04-11 00:00:00', status: '비활성', runStatus: '대기', runCount: 178, regDate: '2025-03-01' },
    ],

    batchLogs: [
      { logId:  1, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-10 10:00:06', duration:  4, runStatus: '실행중', message: '실행 중...' },
      { logId:  2, batchId: 3, batchNm: '이벤트 상태 동기화',   batchCode: 'EVENT_STATUS_SYNC',   runAt: '2026-04-10 00:00:08', duration:  8, runStatus: '성공',   message: '이벤트 상태 3건 동기화 완료' },
      { logId:  3, batchId: 9, batchNm: '통계 데이터 집계',     batchCode: 'STATS_AGGREGATION',   runAt: '2026-04-10 00:05:22', duration: 322, runStatus: '성공',  message: '일별 통계 집계 완료 (조회 178건)' },
      { logId:  4, batchId: 1, batchNm: '주문 자동 완료 처리',  batchCode: 'ORDER_AUTO_COMPLETE', runAt: '2026-04-10 02:00:05', duration:  5, runStatus: '성공',   message: '주문 자동완료 처리 12건' },
      { logId:  5, batchId: 2, batchNm: '쿠폰 만료 처리',       batchCode: 'COUPON_EXPIRE',       runAt: '2026-04-10 01:00:03', duration:  3, runStatus: '성공',   message: '만료 쿠폰 처리 7건' },
      { logId:  6, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-10 08:00:06', duration:  6, runStatus: '성공',   message: '배송 상태 업데이트 34건' },
      { logId:  7, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-10 06:00:04', duration:  4, runStatus: '성공',   message: '배송 상태 업데이트 28건' },
      { logId:  8, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-10 04:00:09', duration:  9, runStatus: '실패',   message: '[ERROR] 택배사 API 응답 시간 초과 (timeout: 30s)', detail: 'Error: ConnectTimeoutException - Remote host 210.123.45.6:8443 did not respond within 30000ms\n  at HttpClient.request (dliv-api.js:142)\n  at DlivSyncBatch.run (DlivSyncBatch.java:87)\nCause: 처리 대상 38건 중 0건 완료. 재시도 예약됨.' },
      { logId:  9, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-10 02:00:05', duration:  5, runStatus: '성공',   message: '배송 상태 업데이트 21건' },
      { logId: 10, batchId: 3, batchNm: '이벤트 상태 동기화',   batchCode: 'EVENT_STATUS_SYNC',   runAt: '2026-04-09 00:00:06', duration:  6, runStatus: '성공',   message: '이벤트 상태 2건 동기화 완료' },
      { logId: 11, batchId: 1, batchNm: '주문 자동 완료 처리',  batchCode: 'ORDER_AUTO_COMPLETE', runAt: '2026-04-09 02:00:04', duration:  4, runStatus: '성공',   message: '주문 자동완료 처리 9건' },
      { logId: 12, batchId: 2, batchNm: '쿠폰 만료 처리',       batchCode: 'COUPON_EXPIRE',       runAt: '2026-04-09 01:00:05', duration:  5, runStatus: '성공',   message: '만료 쿠폰 처리 3건' },
      { logId: 13, batchId: 5, batchNm: '미사용 첨부파일 정리', batchCode: 'ATTACH_CLEANUP',      runAt: '2026-04-06 03:00:07', duration: 47, runStatus: '성공',   message: '첨부파일 삭제 128건 (2.3GB 회수)' },
      { logId: 14, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-04-09 22:00:03', duration:  3, runStatus: '성공',   message: '배송 상태 업데이트 19건' },
      { logId: 15, batchId: 4, batchNm: '정산 리포트 생성',     batchCode: 'SETTLEMENT_REPORT',   runAt: '2026-04-01 08:00:12', duration: 72, runStatus: '성공',   message: '3월 정산 리포트 생성 완료 / 이메일 발송 5건' },
      { logId: 16, batchId: 6, batchNm: '회원 등급 재산정',     batchCode: 'MEMBER_GRADE_CALC',   runAt: '2026-04-01 04:00:15', duration: 35, runStatus: '성공',   message: '회원 등급 재산정 완료 (VIP +3, 우수 -2)' },
      { logId: 17, batchId: 7, batchNm: '캐시 자동 소멸',       batchCode: 'CACHE_EXPIRE',        runAt: '2026-04-01 05:00:04', duration:  4, runStatus: '성공',   message: '미사용 캐시 소멸 처리 24건 (₩48,000)' },
      { logId: 18, batchId: 1, batchNm: '주문 자동 완료 처리',  batchCode: 'ORDER_AUTO_COMPLETE', runAt: '2026-04-01 02:00:11', duration: 11, runStatus: '성공',   message: '주문 자동완료 처리 21건' },
      { logId: 19, batchId: 8, batchNm: '배송조회 상태 동기화', batchCode: 'DLIV_STATUS_SYNC',    runAt: '2026-03-31 22:00:08', duration:  8, runStatus: '실패',   message: '[ERROR] 내부 DB 연결 실패 (retry: 3/3)', detail: 'Error: DataSourceException - Unable to acquire JDBC Connection\n  at HikariPool.getConnection (HikariPool.java:213)\n  at DlivSyncBatch.run (DlivSyncBatch.java:54)\nRetry: 3회 시도 후 최종 실패. DBA 확인 필요.\n발생시각: 2026-03-31 22:00:08 / 복구시각: 2026-03-31 22:17:44' },
      { logId: 20, batchId: 9, batchNm: '통계 데이터 집계',     batchCode: 'STATS_AGGREGATION',   runAt: '2026-03-31 00:05:18', duration: 318, runStatus: '성공',  message: '일별 통계 집계 완료 (조회 163건)' },
    ],

    notices: [
      { noticeId: 1, title: '서비스 점검 안내 (4월 15일 새벽 2시~4시)', noticeType: '시스템', isFixed: true,  startDate: '2026-04-14', endDate: '2026-04-15', statusCd: '게시',  contentHtml: '<p>서비스 점검이 예정되어 있습니다.</p>', regDate: '2026-04-10' },
      { noticeId: 2, title: '봄 시즌 기획전 오픈 안내',                 noticeType: '이벤트', isFixed: false, startDate: '2026-04-01', endDate: '2026-05-31', statusCd: '게시',  contentHtml: '<p>봄 기획전이 시작되었습니다.</p>',        regDate: '2026-03-28' },
      { noticeId: 3, title: '개인정보처리방침 개정 안내',               noticeType: '일반',   isFixed: false, startDate: '2026-03-01', endDate: '',           statusCd: '게시',  contentHtml: '<p>개인정보처리방침이 개정되었습니다.</p>',  regDate: '2026-02-25' },
      { noticeId: 4, title: '긴급 보안 업데이트 안내',                  noticeType: '긴급',   isFixed: true,  startDate: '2026-02-10', endDate: '2026-02-15', statusCd: '종료',  contentHtml: '<p>보안 업데이트가 완료되었습니다.</p>',     regDate: '2026-02-10' },
      { noticeId: 5, title: '신규 결제수단 추가 안내',                  noticeType: '일반',   isFixed: false, startDate: '',           endDate: '',           statusCd: '임시',  contentHtml: '',                                          regDate: '2026-04-09' },
    ],

    alarms: [
      { alarmId: 1, title: '주문 배송 출발 알림',      alarmType: '푸시',   targetTypeCd: '전체', targetId: '', message: '고객님의 주문이 배송 출발되었습니다.',       sendDate: '2026-04-10 09:00', statusCd: '발송완료', regDate: '2026-04-10' },
      { alarmId: 2, title: 'VIP 특별 할인 쿠폰 지급', alarmType: '이메일', targetTypeCd: 'VIP',  targetId: '', message: 'VIP 고객님께 특별 할인 쿠폰을 드립니다.',     sendDate: '2026-04-08 10:00', statusCd: '발송완료', regDate: '2026-04-07' },
      { alarmId: 3, title: '봄 신상 입고 알림',        alarmType: '푸시',   targetTypeCd: '전체', targetId: '', message: '봄 시즌 신상품이 입고되었습니다.',             sendDate: '2026-04-15 09:00', statusCd: '예약',     regDate: '2026-04-10' },
      { alarmId: 4, title: '포인트 소멸 예정 안내',    alarmType: 'SMS',    targetTypeCd: '일반', targetId: '', message: '보유하신 포인트가 30일 후 소멸 예정입니다.',  sendDate: '2026-03-31 08:00', statusCd: '발송완료', regDate: '2026-03-30' },
      { alarmId: 5, title: '시스템 점검 알림',         alarmType: '인앱',   targetTypeCd: '전체', targetId: '', message: '4월 15일 새벽 서비스 점검이 예정되어 있습니다.', sendDate: '', statusCd: '임시',     regDate: '2026-04-09' },
    ],

    bbms: [
      { bbmId:  1, bbmCode: 'NOTICE',        bbmNm: '공지사항',       bbmType: '공지',   allowComment: '불가',      allowAttach: '목록', allowLike: 'N', contentType: 'htmleditor', scopeType: '공개', sortOrd:  1, useYn: 'Y', remark: '전체 공지사항',        regDate: '2025-01-01' },
      { bbmId:  2, bbmCode: 'FAQ',           bbmNm: 'FAQ',            bbmType: 'FAQ',    allowComment: '불가',      allowAttach: '불가', allowLike: 'Y', contentType: 'htmleditor', scopeType: '공개', sortOrd:  2, useYn: 'Y', remark: '자주 묻는 질문',       regDate: '2025-01-01' },
      { bbmId:  3, bbmCode: 'QNA',           bbmNm: '1:1 문의',       bbmType: 'QnA',    allowComment: '대댓글허용', allowAttach: '3개',  allowLike: 'N', contentType: 'textarea',   scopeType: '개인', sortOrd:  3, useYn: 'Y', remark: '회원 1:1 문의',        regDate: '2025-01-01' },
      { bbmId:  4, bbmCode: 'GALLERY',       bbmNm: '사진 갤러리',    bbmType: '갤러리', allowComment: '댓글허용',  allowAttach: '목록', allowLike: 'Y', contentType: 'textarea',   scopeType: '공개', sortOrd:  4, useYn: 'Y', remark: '이미지 갤러리',        regDate: '2025-02-01' },
      { bbmId:  5, bbmCode: 'REVIEW',        bbmNm: '상품 리뷰',      bbmType: '일반',   allowComment: '댓글허용',  allowAttach: '1개',  allowLike: 'Y', contentType: 'textarea',   scopeType: '공개', sortOrd:  5, useYn: 'Y', remark: '상품 구매 후기',       regDate: '2025-03-01' },
      { bbmId:  6, bbmCode: 'EVENT_NOTICE',  bbmNm: '이벤트 공지',    bbmType: '공지',   allowComment: '불가',      allowAttach: '목록', allowLike: 'N', contentType: 'htmleditor', scopeType: '공개', sortOrd:  6, useYn: 'Y', remark: '이벤트/프로모션 공지',  regDate: '2025-03-15' },
      { bbmId:  7, bbmCode: 'COMMUNITY',     bbmNm: '커뮤니티',       bbmType: '일반',   allowComment: '대댓글허용', allowAttach: '목록', allowLike: 'Y', contentType: 'htmleditor', scopeType: '공개', sortOrd:  7, useYn: 'Y', remark: '자유 커뮤니티',        regDate: '2025-04-01' },
      { bbmId:  8, bbmCode: 'COORD_SHARE',   bbmNm: '코디 공유',      bbmType: '갤러리', allowComment: '대댓글허용', allowAttach: '목록', allowLike: 'Y', contentType: 'textarea',   scopeType: '공개', sortOrd:  8, useYn: 'Y', remark: '패션 코디 공유 갤러리', regDate: '2025-04-15' },
      { bbmId:  9, bbmCode: 'PRODUCT_QNA',   bbmNm: '상품 문의',      bbmType: 'QnA',    allowComment: '댓글허용',  allowAttach: '2개',  allowLike: 'N', contentType: 'textarea',   scopeType: '공개', sortOrd:  9, useYn: 'Y', remark: '상품 관련 문의',       regDate: '2025-05-01' },
      { bbmId: 10, bbmCode: 'DELIVERY_QNA',  bbmNm: '배송 문의',      bbmType: 'QnA',    allowComment: '댓글허용',  allowAttach: '1개',  allowLike: 'N', contentType: 'textarea',   scopeType: '개인', sortOrd: 10, useYn: 'Y', remark: '배송/반품 문의',       regDate: '2025-05-15' },
      { bbmId: 11, bbmCode: 'PARTNER_NOTICE',bbmNm: '파트너 공지',    bbmType: '공지',   allowComment: '불가',      allowAttach: '목록', allowLike: 'N', contentType: 'htmleditor', scopeType: '회사', sortOrd: 11, useYn: 'Y', remark: '파트너사 전용 공지',   regDate: '2025-06-01' },
      { bbmId: 12, bbmCode: 'INTERNAL_FAQ',  bbmNm: '내부 FAQ',       bbmType: 'FAQ',    allowComment: '불가',      allowAttach: '불가', allowLike: 'N', contentType: 'htmleditor', scopeType: '회사', sortOrd: 12, useYn: 'Y', remark: '내부 업무 FAQ',        regDate: '2025-06-15' },
      { bbmId: 13, bbmCode: 'PRESS',         bbmNm: '보도자료',       bbmType: '일반',   allowComment: '불가',      allowAttach: '목록', allowLike: 'N', contentType: 'htmleditor', scopeType: '공개', sortOrd: 13, useYn: 'Y', remark: '언론 보도자료',        regDate: '2025-07-01' },
      { bbmId: 14, bbmCode: 'VIDEO_GALLERY', bbmNm: '영상 갤러리',    bbmType: '갤러리', allowComment: '댓글허용',  allowAttach: '목록', allowLike: 'Y', contentType: 'htmleditor', scopeType: '공개', sortOrd: 14, useYn: 'Y', remark: '동영상 콘텐츠 갤러리', regDate: '2025-07-15' },
      { bbmId: 15, bbmCode: 'BETA_FEEDBACK', bbmNm: '베타 피드백',    bbmType: 'QnA',    allowComment: '대댓글허용', allowAttach: '3개',  allowLike: 'Y', contentType: 'textarea',   scopeType: '공개', sortOrd: 15, useYn: 'N', remark: '베타 서비스 피드백',   regDate: '2025-08-01' },
    ],

    bbss: [
      /* ── 공지사항 (bbmId:1 / 공지 / htmleditor / 첨부목록) ── */
      { bbsId:  1, bbmId:  1, title: '4월 서비스 점검 안내 (새벽 2시~4시)',      authorNm: '관리자',viewCount: 3420, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>4월 15일 새벽 2~4시 서비스 점검이 예정되어 있습니다. 양해 부탁드립니다.</p>',                                             regDate: '2026-04-10' },
      { bbsId:  2, bbmId:  1, title: '개인정보처리방침 개정 공지',               authorNm: '관리자',viewCount: 1280, commentCount: 0, attachGrpId: 'GRP-0101', statusCd: '게시',  contentHtml: '<p>2026년 3월 1일부로 개인정보처리방침이 개정됩니다. 주요 변경사항을 확인해 주세요.</p>',                                         regDate: '2026-02-25' },
      { bbsId:  3, bbmId:  1, title: '5월 황금연휴 배송 지연 안내',              authorNm: '관리자',viewCount:  560, commentCount: 0, attachGrpId: '',          statusCd: '임시',  contentHtml: '<p>5월 1일~6일 황금연휴 기간 배송이 지연될 수 있습니다.</p>',                                                                      regDate: '2026-04-09' },

      /* ── 이벤트 공지 (bbmId:6 / 공지 / htmleditor / 첨부목록) ── */
      { bbsId:  4, bbmId:  6, title: '봄 맞이 신상품 론칭 이벤트 당첨자 발표',   authorNm: '마케팅팀', viewCount: 4850, commentCount: 0, attachGrpId: 'GRP-0102', statusCd: '게시',  contentHtml: '<p>봄 이벤트에 참여해 주신 고객님께 감사드립니다.</p>',                                                                             regDate: '2026-04-05' },
      { bbsId:  5, bbmId:  6, title: 'VIP 회원 전용 시크릿 세일 안내',           authorNm: '마케팅팀', viewCount: 2310, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>VIP 회원님께만 드리는 특별 할인 혜택입니다.</p>',                                                                                 regDate: '2026-04-01' },
      { bbsId:  6, bbmId:  6, title: '여름 시즌 프리뷰 이벤트 (5월 1일 오픈)',   authorNm: '마케팅팀', viewCount:    0, commentCount: 0, attachGrpId: '',          statusCd: '예약',  contentHtml: '<p>여름 신상품을 미리 만나보세요!</p>',                                                                                                regDate: '2026-04-09' },

      /* ── FAQ (bbmId:2 / FAQ / htmleditor / 첨부불가) ── */
      { bbsId:  7, bbmId:  2, title: '배송은 얼마나 걸리나요?',                  authorNm: '고객지원팀', viewCount: 5200, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>평균 2~3 영업일이 소요됩니다. 도서산간 지역은 추가 1~2일이 소요됩니다.</p>',                                                    regDate: '2025-06-01' },
      { bbsId:  8, bbmId:  2, title: '교환/반품은 어떻게 하나요?',               authorNm: '고객지원팀', viewCount: 4870, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>상품 수령 후 7일 이내 교환/반품 신청이 가능합니다. 단, 사용 흔적이 있는 경우 불가합니다.</p>',                                   regDate: '2025-06-01' },
      { bbsId:  9, bbmId:  2, title: '캐시는 어떻게 사용하나요?',                authorNm: '고객지원팀', viewCount: 2140, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>주문 결제 시 캐시를 현금처럼 사용하실 수 있습니다. 최소 사용금액은 1,000원입니다.</p>',                                           regDate: '2025-07-01' },
      { bbsId: 10, bbmId:  2, title: '회원 등급은 어떻게 올라가나요?',           authorNm: '고객지원팀', viewCount: 1680, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>월 구매 실적 기준으로 자동 산정됩니다. VIP: 50만원 이상, 우수: 20만원 이상, 일반: 그 외</p>',                                    regDate: '2025-08-01' },

      /* ── 내부 FAQ (bbmId:12 / FAQ / htmleditor / 회사공개) ── */
      { bbsId: 11, bbmId: 12, title: '[내부] 주문관리 시스템 사용 매뉴얼',       authorNm: '시스템팀', viewCount:  320, commentCount: 0, attachGrpId: 'GRP-0103', statusCd: '게시',  contentHtml: '<p>관리자용 주문관리 시스템 사용법을 안내합니다.</p>',                                                                                regDate: '2026-01-10' },
      { bbsId: 12, bbmId: 12, title: '[내부] 클레임 처리 표준 절차',             authorNm: '운영팀',   viewCount:  215, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>클레임 접수부터 처리 완료까지의 표준 절차를 안내합니다.</p>',                                                                      regDate: '2026-02-01' },

      /* ── 1:1 문의 (bbmId:3 / QnA / textarea / 개인 / 대댓글) ── */
      { bbsId: 13, bbmId:  3, title: '주문한 상품이 아직 도착하지 않았어요',     authorNm: '홍길동', viewCount:   15, commentCount: 2, attachGrpId: 'GRP-0051', statusCd: '게시',  contentHtml: '주문번호 ORD-2026-025, 주문일로부터 5일이 지났는데 배송이 안 됩니다.',                                                               regDate: '2026-04-08' },
      { bbsId: 14, bbmId:  3, title: '사이즈 교환 요청드립니다',                 authorNm: '이영희', viewCount:    9, commentCount: 1, attachGrpId: '',          statusCd: '게시',  contentHtml: '오버사이즈 코튼 티셔츠 M사이즈 → L사이즈로 교환 요청합니다.',                                                                         regDate: '2026-04-07' },
      { bbsId: 15, bbmId:  3, title: '쿠폰 적용이 안 되는데요',                  authorNm: '박민준', viewCount:    4, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: 'VIP 전용 쿠폰인데 결제창에서 적용이 안 됩니다.',                                                                                      regDate: '2026-04-09' },

      /* ── 상품 문의 (bbmId:9 / QnA / textarea / 공개 / 댓글) ── */
      { bbsId: 16, bbmId:  9, title: '오버사이즈 티셔츠 사이즈 문의',            authorNm: '김수현', viewCount:   88, commentCount: 1, attachGrpId: '',          statusCd: '게시',  contentHtml: '평소 M 사이즈 입는데 오버사이즈면 S로 사도 되나요?',                                                                                 regDate: '2026-04-06' },
      { bbsId: 17, bbmId:  9, title: '울 블렌드 롱코트 소재 문의',               authorNm: '최지우', viewCount:   54, commentCount: 1, attachGrpId: '',          statusCd: '게시',  contentHtml: '울 함량이 몇 %인지 알고 싶습니다. 세탁 방법도 알려주세요.',                                                                           regDate: '2026-04-04' },
      { bbsId: 18, bbmId:  9, title: '데님 진 재입고 예정 문의',                  authorNm: '정민호', viewCount:   32, commentCount: 0, attachGrpId: '',          statusCd: '게시',  contentHtml: '슬림핏 데님 진 30 사이즈 품절인데 재입고 예정 있나요?',                                                                               regDate: '2026-04-03' },

      /* ── 배송 문의 (bbmId:10 / QnA / textarea / 개인 / 댓글) ── */
      { bbsId: 19, bbmId: 10, title: '배송 조회가 안 됩니다',                    authorNm: '강예은', viewCount:    6, commentCount: 1, attachGrpId: 'GRP-0104', statusCd: '게시',  contentHtml: '송장번호로 조회해도 운송장 정보가 없다고 나옵니다.',                                                                                   regDate: '2026-04-07' },
      { bbsId: 20, bbmId: 10, title: '도서산간 지역 배송 가능한가요?',            authorNm: '윤성준', viewCount:   18, commentCount: 1, attachGrpId: '',          statusCd: '게시',  contentHtml: '제주도 거주인데 추가 배송비가 얼마인지 알고 싶습니다.',                                                                               regDate: '2026-04-02' },

      /* ── 사진 갤러리 (bbmId:4 / 갤러리 / textarea / 첨부목록 / 댓글) ── */
      { bbsId: 21, bbmId:  4, title: '봄 코디 공유해요 :) 오버핏 룩',            authorNm: '박민준', viewCount:  845, commentCount: 12, attachGrpId: 'GRP-0052', statusCd: '게시',  contentHtml: '오버사이즈 코튼 티셔츠 + 카고 팬츠 조합입니다!',                                                                                    regDate: '2026-04-05' },
      { bbsId: 22, bbmId:  4, title: '데일리 미니멀 룩 어때요?',                 authorNm: '이영희', viewCount:  620, commentCount:  8, attachGrpId: 'GRP-0053', statusCd: '게시',  contentHtml: '슬림핏 데님에 린넨 셔츠 매치했어요.',                                                                                                 regDate: '2026-04-03' },
      { bbsId: 23, bbmId:  4, title: '아우터 레이어드 코디',                      authorNm: '홍길동', viewCount:  390, commentCount:  5, attachGrpId: 'GRP-0054', statusCd: '게시',  contentHtml: '울 블렌드 롱코트 레이어드 스타일링입니다.',                                                                                            regDate: '2026-03-28' },

      /* ── 코디 공유 (bbmId:8 / 갤러리 / textarea / 첨부목록 / 대댓글) ── */
      { bbsId: 24, bbmId:  8, title: '봄 원피스 + 가방 조합 어때요?',            authorNm: '강예은', viewCount:  510, commentCount: 15, attachGrpId: 'GRP-0055', statusCd: '게시',  contentHtml: '플로럴 미디 드레스에 캔버스 토트백 매치!',                                                                                             regDate: '2026-04-06' },
      { bbsId: 25, bbmId:  8, title: '캐주얼 스트릿 룩',                          authorNm: '최지우', viewCount:  280, commentCount:  7, attachGrpId: 'GRP-0056', statusCd: '게시',  contentHtml: '후드 집업 + 조거 팬츠 편안한 데일리 룩입니다.',                                                                                       regDate: '2026-04-02' },

      /* ── 상품 리뷰 (bbmId:5 / 일반 / textarea / 첨부1개 / 댓글) ── */
      { bbsId: 26, bbmId:  5, title: '오버사이즈 티셔츠 재구매예요!',             authorNm: '정민호', viewCount:  230, commentCount:  3, attachGrpId: 'GRP-0057', statusCd: '게시',  contentHtml: '소재도 좋고 핏도 완벽해요. 세탁 후에도 변형 없이 좋습니다.',                                                                         regDate: '2026-04-04' },
      { bbsId: 27, bbmId:  5, title: '울 블렌드 롱코트 ★★★★★',              authorNm: '김수현', viewCount:  180, commentCount:  2, attachGrpId: '',          statusCd: '게시',  contentHtml: '생각보다 훨씬 고급스럽고 따뜻해요. 강추합니다!',                                                                                      regDate: '2026-03-30' },
      { bbsId: 28, bbmId:  5, title: '데님 진 사이즈 참고하세요',                 authorNm: '윤성준', viewCount:  145, commentCount:  1, attachGrpId: '',          statusCd: '게시',  contentHtml: '허벅지 있는 분은 한 사이즈 업 추천드려요.',                                                                                           regDate: '2026-03-25' },

      /* ── 커뮤니티 (bbmId:7 / 일반 / htmleditor / 첨부목록 / 대댓글) ── */
      { bbsId: 29, bbmId:  7, title: '올봄 트렌드 아이템 뭐 구매하셨나요?',      authorNm: '박민준', viewCount:  760, commentCount: 23, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>저는 린넨 오버핏 블레이저 구매했는데 너무 마음에 들어요!</p>',                                                                   regDate: '2026-04-07' },
      { bbsId: 30, bbmId:  7, title: '쇼핑조이 적립금 어떻게 활용하세요?',       authorNm: '이영희', viewCount:  430, commentCount: 11, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>캐시 소멸 전에 알뜰하게 쓰는 방법 공유해요.</p>',                                                                                 regDate: '2026-04-03' },

      /* ── 영상 갤러리 (bbmId:14 / 갤러리 / htmleditor / 첨부목록 / 댓글) ── */
      { bbsId: 31, bbmId: 14, title: '2026 SS 컬렉션 런웨이 영상',               authorNm: '브랜드팀', viewCount: 1240, commentCount:  8, attachGrpId: 'GRP-0058', statusCd: '게시',  contentHtml: '<p>2026 봄/여름 컬렉션 런웨이 영상을 공개합니다.</p>',                                                                              regDate: '2026-03-20' },
      { bbsId: 32, bbmId: 14, title: '스타일링 TIP 영상 시리즈 #1',              authorNm: '브랜드팀', viewCount:  890, commentCount:  4, attachGrpId: 'GRP-0059', statusCd: '게시',  contentHtml: '<p>오버핏 코디 스타일링 팁을 영상으로 준비했습니다.</p>',                                                                             regDate: '2026-03-15' },

      /* ── 파트너 공지 (bbmId:11 / 공지 / htmleditor / 회사 / 첨부목록) ── */
      { bbsId: 33, bbmId: 11, title: '[파트너] 2분기 입점 수수료 정산 일정',     authorNm: '정산팀', viewCount:  145, commentCount:  0, attachGrpId: 'GRP-0060', statusCd: '게시',  contentHtml: '<p>2026년 2분기 수수료 정산 일정을 공지합니다.</p>',                                                                                 regDate: '2026-04-01' },
      { bbsId: 34, bbmId: 11, title: '[파트너] 배송 정책 변경 안내',              authorNm: '운영팀', viewCount:   98, commentCount:  0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>2026년 5월부로 배송 정책이 변경됩니다.</p>',                                                                                       regDate: '2026-03-28' },

      /* ── 보도자료 (bbmId:13 / 일반 / htmleditor / 공개 / 첨부목록) ── */
      { bbsId: 35, bbmId: 13, title: 'ShopJoy, 2026 상반기 거래액 500억 돌파',   authorNm: '홍보팀', viewCount: 2800, commentCount:  0, attachGrpId: 'GRP-0061', statusCd: '게시',  contentHtml: '<p>ShopJoy가 2026년 상반기 거래액 500억원을 돌파했다고 밝혔습니다.</p>',                                                             regDate: '2026-04-08' },
      { bbsId: 36, bbmId: 13, title: 'ShopJoy, 친환경 패키징 도입 발표',         authorNm: '홍보팀', viewCount: 1650, commentCount:  0, attachGrpId: '',          statusCd: '게시',  contentHtml: '<p>ShopJoy는 2026년 하반기부터 전 상품 친환경 패키징을 도입한다고 발표했습니다.</p>',                                                  regDate: '2026-03-22' },
    ],

    depts: [
      { deptId:  1, deptCode: 'EXEC',      deptNm: '경영진',       parentId: null, deptType: '경영', sortOrd:  1, useYn: 'Y', remark: '대표이사 및 임원', regDate: '2025-01-01' },
      { deptId:  2, deptCode: 'IT',         deptNm: 'IT개발팀',     parentId: null, deptType: '기술', sortOrd:  2, useYn: 'Y', remark: '플랫폼 개발 및 운영', regDate: '2025-01-01' },
      { deptId:  3, deptCode: 'IT_FE',      deptNm: '프론트엔드팀', parentId: 2,    deptType: '기술', sortOrd:  3, useYn: 'Y', remark: 'UI/UX 개발', regDate: '2025-01-01' },
      { deptId:  4, deptCode: 'IT_BE',      deptNm: '백엔드팀',     parentId: 2,    deptType: '기술', sortOrd:  4, useYn: 'Y', remark: 'API 및 서버 개발', regDate: '2025-01-01' },
      { deptId:  5, deptCode: 'IT_INFRA',   deptNm: '인프라팀',     parentId: 2,    deptType: '기술', sortOrd:  5, useYn: 'Y', remark: '클라우드 인프라 관리', regDate: '2025-01-01' },
      { deptId:  6, deptCode: 'MKT',        deptNm: '마케팅팀',     parentId: null, deptType: '마케팅', sortOrd:  6, useYn: 'Y', remark: '브랜드 마케팅', regDate: '2025-01-01' },
      { deptId:  7, deptCode: 'MKT_PERF',   deptNm: '퍼포먼스마케팅', parentId: 6,  deptType: '마케팅', sortOrd:  7, useYn: 'Y', remark: '광고 및 성과분석', regDate: '2025-02-01' },
      { deptId:  8, deptCode: 'OPS',        deptNm: '운영팀',       parentId: null, deptType: '운영', sortOrd:  8, useYn: 'Y', remark: '서비스 운영 전반', regDate: '2025-01-01' },
      { deptId:  9, deptCode: 'OPS_ORDER',  deptNm: '주문운영팀',   parentId: 8,    deptType: '운영', sortOrd:  9, useYn: 'Y', remark: '주문·결제 처리', regDate: '2025-01-01' },
      { deptId: 10, deptCode: 'CS',         deptNm: '고객지원팀',   parentId: null, deptType: 'CS',   sortOrd: 10, useYn: 'Y', remark: '고객 문의 대응', regDate: '2025-01-01' },
      { deptId: 11, deptCode: 'LOGISTICS',  deptNm: '물류팀',       parentId: null, deptType: '물류', sortOrd: 11, useYn: 'Y', remark: '입출고 및 배송 관리', regDate: '2025-01-01' },
      { deptId: 12, deptCode: 'FINANCE',    deptNm: '재무팀',       parentId: null, deptType: '재무', sortOrd: 12, useYn: 'Y', remark: '회계 및 정산 관리', regDate: '2025-01-01' },
      { deptId: 13, deptCode: 'HR',         deptNm: '인사팀',       parentId: null, deptType: '인사', sortOrd: 13, useYn: 'Y', remark: '채용 및 조직관리', regDate: '2025-03-01' },
      { deptId: 14, deptCode: 'LEGAL',      deptNm: '법무팀',       parentId: null, deptType: '법무', sortOrd: 14, useYn: 'N', remark: '법률 검토 및 계약', regDate: '2025-06-01' },
    ],

    roles: [
      { roleId: 1, roleCode: 'SUPER_ADMIN', roleNm: '슈퍼관리자',   parentId: null, roleType: '시스템', sortOrd: 1, useYn: 'Y', restrictPerm: '없음', remark: '전체 권한 보유', regDate: '2025-01-01' },
      { roleId: 2, roleCode: 'SYS_ADMIN',   roleNm: '시스템관리자', parentId: 1,    roleType: '시스템', sortOrd: 2, useYn: 'Y', restrictPerm: '없음', remark: '시스템 메뉴 접근', regDate: '2025-01-01' },
      { roleId: 3, roleCode: 'PRODUCT_MGR', roleNm: '상품관리자',   parentId: null, roleType: '업무',   sortOrd: 3, useYn: 'Y', restrictPerm: '없음', remark: '상품 관리 권한', regDate: '2025-01-01' },
      { roleId: 4, roleCode: 'ORDER_MGR',   roleNm: '주문관리자',   parentId: null, roleType: '업무',   sortOrd: 4, useYn: 'Y', restrictPerm: '없음', remark: '주문/클레임 관리 권한', regDate: '2025-01-01' },
      { roleId: 5, roleCode: 'CS_MGR',      roleNm: '고객지원관리자', parentId: null, roleType: '업무', sortOrd: 5, useYn: 'Y', restrictPerm: '없음', remark: 'CS 관리 권한', regDate: '2025-01-01' },
      { roleId: 6, roleCode: 'MARKETING_MGR', roleNm: '마케팅관리자', parentId: null, roleType: '업무', sortOrd: 6, useYn: 'Y', restrictPerm: '없음', remark: '쿠폰/이벤트 관리', regDate: '2025-02-01' },
      { roleId: 7, roleCode: 'READONLY',    roleNm: '읽기전용',     parentId: null, roleType: '기타',   sortOrd: 7, useYn: 'Y', restrictPerm: '읽기', remark: '조회만 가능', regDate: '2025-03-01' },
      { roleId: 8, roleCode: 'BLOCKED',     roleNm: '차단전용',     parentId: null, roleType: '기타',   sortOrd: 8, useYn: 'Y', restrictPerm: '차단', remark: '모든 접근 차단', regDate: '2025-04-01' },
    ],
    roleMenus: [
      { roleId: 1, menuId: 1, permLevel: '관리' }, { roleId: 1, menuId: 2, permLevel: '관리' }, { roleId: 1, menuId: 3, permLevel: '관리' },
      { roleId: 1, menuId: 4, permLevel: '관리' }, { roleId: 1, menuId: 5, permLevel: '관리' }, { roleId: 1, menuId: 6, permLevel: '관리' },
      { roleId: 1, menuId: 7, permLevel: '관리' }, { roleId: 1, menuId: 8, permLevel: '관리' }, { roleId: 1, menuId: 9, permLevel: '관리' },
      { roleId: 1, menuId: 10, permLevel: '관리' }, { roleId: 1, menuId: 11, permLevel: '관리' }, { roleId: 1, menuId: 12, permLevel: '관리' },
      { roleId: 1, menuId: 13, permLevel: '관리' }, { roleId: 1, menuId: 14, permLevel: '관리' }, { roleId: 1, menuId: 15, permLevel: '관리' },
      { roleId: 1, menuId: 16, permLevel: '관리' }, { roleId: 1, menuId: 17, permLevel: '관리' }, { roleId: 1, menuId: 18, permLevel: '관리' },
      { roleId: 1, menuId: 19, permLevel: '관리' }, { roleId: 1, menuId: 20, permLevel: '관리' },
      { roleId: 2, menuId: 16, permLevel: '쓰기' }, { roleId: 2, menuId: 17, permLevel: '쓰기' }, { roleId: 2, menuId: 18, permLevel: '쓰기' },
      { roleId: 2, menuId: 19, permLevel: '쓰기' }, { roleId: 2, menuId: 20, permLevel: '쓰기' },
      { roleId: 3, menuId: 1, permLevel: '쓰기' }, { roleId: 3, menuId: 2, permLevel: '쓰기' }, { roleId: 3, menuId: 3, permLevel: '쓰기' },
      { roleId: 4, menuId: 4, permLevel: '쓰기' }, { roleId: 4, menuId: 5, permLevel: '쓰기' }, { roleId: 4, menuId: 6, permLevel: '쓰기' },
      { roleId: 5, menuId: 13, permLevel: '읽기' }, { roleId: 5, menuId: 14, permLevel: '읽기' }, { roleId: 5, menuId: 15, permLevel: '읽기' },
      { roleId: 6, menuId: 10, permLevel: '쓰기' }, { roleId: 6, menuId: 11, permLevel: '쓰기' }, { roleId: 6, menuId: 12, permLevel: '쓰기' },
    ],
    roleUsers: [
      { roleId: 1, adminUserId: 1 },
      { roleId: 2, adminUserId: 2 },
      { roleId: 3, adminUserId: 3 },
      { roleId: 4, adminUserId: 4 },
      { roleId: 5, adminUserId: 5 },
    ],

    menus: [
      { menuId:  1, menuCode: 'PRODUCT',      menuNm: '상품관리',     parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  1, useYn: 'Y', remark: '상품 관련 메뉴', regDate: '2025-01-01' },
      { menuId:  2, menuCode: 'PRODUCT_MNG',  menuNm: '상품목록',     parentId: 1,    menuUrl: '/admin/products',   menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  3, menuCode: 'PRODUCT_CAT',  menuNm: '카테고리관리', parentId: 1,    menuUrl: '/admin/categories', menuType: '페이지', sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  4, menuCode: 'ORDER',        menuNm: '주문관리',     parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  5, menuCode: 'ORDER_MNG',    menuNm: '주문목록',     parentId: 4,    menuUrl: '/admin/orders',     menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  6, menuCode: 'CLAIM_MNG',    menuNm: '클레임관리',   parentId: 4,    menuUrl: '/admin/claims',     menuType: '페이지', sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  7, menuCode: 'MEMBER',       menuNm: '회원관리',     parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  3, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  8, menuCode: 'MEMBER_MNG',   menuNm: '회원목록',     parentId: 7,    menuUrl: '/admin/members',    menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId:  9, menuCode: 'DLIV',         menuNm: '배송관리',     parentId: null, menuUrl: '/admin/deliveries', menuType: '페이지', sortOrd:  4, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 10, menuCode: 'MARKETING',    menuNm: '마케팅',       parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  5, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 11, menuCode: 'COUPON_MNG',   menuNm: '쿠폰관리',     parentId: 10,   menuUrl: '/admin/coupons',    menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 12, menuCode: 'EVENT_MNG',    menuNm: '이벤트관리',   parentId: 10,   menuUrl: '/admin/events',     menuType: '페이지', sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 13, menuCode: 'CS',           menuNm: '고객지원',     parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  6, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 14, menuCode: 'CHATT_MNG',    menuNm: '채팅관리',     parentId: 13,   menuUrl: '/admin/chats',      menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 15, menuCode: 'CONTACT_MNG',  menuNm: '문의관리',     parentId: 13,   menuUrl: '/admin/contacts',   menuType: '페이지', sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 16, menuCode: 'SYS',          menuNm: '시스템관리',   parentId: null, menuUrl: '',                  menuType: '폴더',   sortOrd:  7, useYn: 'Y', remark: '시스템 설정 및 관리', regDate: '2025-01-01' },
      { menuId: 17, menuCode: 'SYS_CODE',     menuNm: '공통코드관리', parentId: 16,   menuUrl: '/admin/codes',      menuType: '페이지', sortOrd:  1, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 18, menuCode: 'SYS_USER',     menuNm: '사용자관리',   parentId: 16,   menuUrl: '/admin/users',      menuType: '페이지', sortOrd:  2, useYn: 'Y', remark: '', regDate: '2025-01-01' },
      { menuId: 19, menuCode: 'SYS_MENU',     menuNm: '메뉴관리',     parentId: 16,   menuUrl: '/admin/menus',      menuType: '페이지', sortOrd:  3, useYn: 'Y', remark: '', regDate: '2025-04-10' },
      { menuId: 20, menuCode: 'SYS_DEPT',     menuNm: '부서관리',     parentId: 16,   menuUrl: '/admin/depts',      menuType: '페이지', sortOrd:  4, useYn: 'Y', remark: '', regDate: '2025-04-10' },
    ],

    loginHistory: [
      { loginId: 1,  userId: 1, loginDate: '2026-04-07 09:12', ip: '121.165.30.11',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 2,  userId: 1, loginDate: '2026-04-05 22:44', ip: '121.165.30.11',  device: 'Mobile / Safari', result: '성공' },
      { loginId: 3,  userId: 1, loginDate: '2026-04-03 14:28', ip: '121.165.30.11',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 4,  userId: 1, loginDate: '2026-03-28 08:05', ip: '203.248.12.99',  device: 'PC / Edge',    result: '실패' },
      { loginId: 5,  userId: 1, loginDate: '2026-03-20 17:33', ip: '121.165.30.11',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 6,  userId: 2, loginDate: '2026-04-05 11:30', ip: '59.6.102.45',    device: 'Mobile / Chrome', result: '성공' },
      { loginId: 7,  userId: 2, loginDate: '2026-03-29 19:15', ip: '59.6.102.45',    device: 'Mobile / Chrome', result: '성공' },
      { loginId: 8,  userId: 3, loginDate: '2026-04-03 10:20', ip: '175.209.45.6',   device: 'PC / Chrome',  result: '성공' },
      { loginId: 9,  userId: 3, loginDate: '2026-03-25 16:40', ip: '175.209.45.6',   device: 'PC / Firefox', result: '성공' },
      { loginId: 10, userId: 4, loginDate: '2026-04-06 13:55', ip: '211.36.133.77',  device: 'Mobile / Safari', result: '성공' },
      { loginId: 11, userId: 4, loginDate: '2026-03-18 09:02', ip: '211.36.133.77',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 12, userId: 6, loginDate: '2026-04-07 08:44', ip: '106.101.22.55',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 13, userId: 6, loginDate: '2026-04-01 21:10', ip: '106.101.22.55',  device: 'Mobile / Chrome', result: '성공' },
      { loginId: 14, userId: 8, loginDate: '2026-04-07 07:58', ip: '14.52.88.120',   device: 'PC / Chrome',  result: '성공' },
      { loginId: 15, userId: 8, loginDate: '2026-04-04 23:11', ip: '14.52.88.120',   device: 'Mobile / Safari', result: '성공' },
      { loginId: 16, userId: 1, loginDate: '2025-12-25 10:00', ip: '121.165.30.11',  device: 'PC / Chrome',  result: '성공' },
      { loginId: 17, userId: 1, loginDate: '2025-11-15 09:30', ip: '121.165.30.11',  device: 'PC / Chrome',  result: '성공' },
    ],

    couponUsage: [
      { usageId: 1, userId: 1, couponId: 1, couponCode: 'WELCOME10', couponNm: '신규가입 10% 할인', orderId: 'ORD-2026-018', usedDate: '2026-03-10', discountType: 'rate',   discountValue: 10,   discountAmt: 5980 },
      { usageId: 2, userId: 1, couponId: 2, couponCode: 'SPRING5000', couponNm: '봄맞이 5,000원 할인', orderId: 'ORD-2026-021', usedDate: '2026-03-22', discountType: 'amount', discountValue: 5000, discountAmt: 5000 },
      { usageId: 3, userId: 1, couponId: 5, couponCode: 'FREESHIP',  couponNm: '무료배송 쿠폰',  orderId: 'ORD-2026-024', usedDate: '2026-04-04', discountType: 'shipping', discountValue: 0,    discountAmt: 3000 },
      { usageId: 4, userId: 2, couponId: 1, couponCode: 'WELCOME10', couponNm: '신규가입 10% 할인', orderId: 'ORD-2026-012', usedDate: '2026-02-10', discountType: 'rate',   discountValue: 10,   discountAmt: 9490 },
      { usageId: 5, userId: 3, couponId: 3, couponCode: 'SUMMER15',  couponNm: '여름 시즌 15% 할인', orderId: 'ORD-2026-016', usedDate: '2026-02-27', discountType: 'rate',   discountValue: 15,   discountAmt: 8985 },
      { usageId: 6, userId: 4, couponId: 7, couponCode: 'USED3000',  couponNm: '3,000원 할인',   orderId: 'ORD-2026-020', usedDate: '2026-03-18', discountType: 'amount', discountValue: 3000, discountAmt: 3000 },
      { usageId: 7, userId: 6, couponId: 4, couponCode: 'VIP10000',  couponNm: 'VIP 10,000원 할인', orderId: 'ORD-2026-017', usedDate: '2026-03-07', discountType: 'amount', discountValue: 10000, discountAmt: 10000 },
      { usageId: 8, userId: 8, couponId: 6, couponCode: 'EXTRA20',   couponNm: '추가 20% 할인(특별)', orderId: 'ORD-2026-015', usedDate: '2026-02-22', discountType: 'rate', discountValue: 20,   discountAmt: 21780 },
      { usageId: 9, userId: 1, couponId: 8, couponCode: 'APP2000',   couponNm: '앱 전용 2,000원 할인', orderId: 'ORD-2026-025', usedDate: '2026-04-05', discountType: 'amount', discountValue: 2000, discountAmt: 2000 },
    ],

    sendHistory: [
      { sendId: 1,  userId: 1, sendDate: '2026-04-06 09:00', channelCd: '카카오',  title: '주문 접수 안내',         statusCd: '발송완료' },
      { sendId: 2,  userId: 1, sendDate: '2026-04-05 14:35', channelCd: 'SMS',    title: '주문 결제 확인',          statusCd: '발송완료' },
      { sendId: 3,  userId: 1, sendDate: '2026-04-04 11:00', channelCd: '이메일', title: '클레임 접수 안내',         statusCd: '발송완료' },
      { sendId: 4,  userId: 1, sendDate: '2026-03-23 09:30', channelCd: '카카오', title: '배송 출발 안내',           statusCd: '발송완료' },
      { sendId: 5,  userId: 1, sendDate: '2026-03-15 10:00', channelCd: 'SMS',    title: '이벤트 쿠폰 발급 안내',    statusCd: '발송완료' },
      { sendId: 6,  userId: 1, sendDate: '2026-03-01 09:00', channelCd: '이메일', title: '봄맞이 신상품 론칭 안내',  statusCd: '발송완료' },
      { sendId: 7,  userId: 2, sendDate: '2026-04-03 10:00', channelCd: '카카오', title: '배송 준비중 안내',         statusCd: '발송완료' },
      { sendId: 8,  userId: 2, sendDate: '2026-03-30 09:00', channelCd: 'SMS',    title: '문의 답변 안내',           statusCd: '발송완료' },
      { sendId: 9,  userId: 3, sendDate: '2026-03-29 11:00', channelCd: '카카오', title: '배송 완료 안내',           statusCd: '발송완료' },
      { sendId: 10, userId: 3, sendDate: '2026-03-01 09:00', channelCd: '이메일', title: '봄맞이 신상품 론칭 안내',  statusCd: '실패' },
      { sendId: 11, userId: 4, sendDate: '2026-03-19 09:00', channelCd: '카카오', title: '배송 완료 안내',           statusCd: '발송완료' },
      { sendId: 12, userId: 4, sendDate: '2026-03-25 10:30', channelCd: 'SMS',    title: '문의 답변 안내',           statusCd: '발송완료' },
      { sendId: 13, userId: 6, sendDate: '2026-04-01 09:00', channelCd: '이메일', title: 'VIP 회원 특별 혜택 안내',  statusCd: '발송완료' },
      { sendId: 14, userId: 6, sendDate: '2026-03-08 09:00', channelCd: '카카오', title: '배송 완료 안내',           statusCd: '발송완료' },
      { sendId: 15, userId: 8, sendDate: '2026-04-05 09:00', channelCd: '이메일', title: 'VIP 회원 전용 특별 혜택',  statusCd: '발송완료' },
      { sendId: 16, userId: 8, sendDate: '2026-02-23 11:00', channelCd: '카카오', title: '배송 완료 안내',           statusCd: '발송완료' },
      { sendId: 17, userId: 1, sendDate: '2025-11-10 09:00', channelCd: '이메일', title: '연말 특별 이벤트 안내',    statusCd: '발송완료' },
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
