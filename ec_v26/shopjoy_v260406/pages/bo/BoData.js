/* ShopJoy Admin - 공유 목 데이터 스토어 */
(function () {
  const { reactive } = Vue;

  window.boData = reactive({
    // 회원 데이터 (최소 샘플)
    members: [
      { userId: 1, email: 'user1@demo.com', memberNm: '홍길동', phone: '010-1111-1111', grade: 'VIP', status: '활성', joinDate: '2025-11-01', lastLogin: '2026-04-07', orderCount: 25, totalPurchase: 1280000 },
      { userId: 2, email: 'user2@demo.com', memberNm: '이영희', phone: '010-2222-2222', grade: '일반', status: '활성', joinDate: '2026-01-15', lastLogin: '2026-04-05', orderCount: 8, totalPurchase: 340000 },
    ],

    // 상품 데이터 (최소 샘플)
    products: [
      { productId: 1, prodNm: '오버사이즈 코튼 티셔츠', category: '상의', price: 29900, stock: 150, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-10' },
      { productId: 2, prodNm: '슬림핏 데님 진', category: '하의', price: 59900, stock: 80, status: '판매중', brand: 'ShopJoy', regDate: '2026-01-15' },
      { productId: 5, prodNm: '카고 와이드 팬츠', category: '하의', price: 55000, listPrice: 55000, salePrice: 55000, stock: 90, status: '판매중', brand: 'ShopJoy', regDate: '2026-02-05',
        optGroups: [
          { _id: 1, grpNm: '색상', typeCd: 'COLOR', inputTypeCd: 'SELECT', level: 1, items: [
            { _id: 101, nm: '블랙', val: 'BLACK', valCodeId: 'BLACK', useYn: 'Y' },
            { _id: 102, nm: '베이지', val: 'BEIGE', valCodeId: 'BEIGE', useYn: 'Y' },
          ]},
          { _id: 2, grpNm: '사이즈', typeCd: 'SIZE', inputTypeCd: 'SELECT', level: 2, items: [
            { _id: 201, nm: 'S',  val: 'S',  valCodeId: 'S',  useYn: 'Y' },
            { _id: 202, nm: 'M',  val: 'M',  valCodeId: 'M',  useYn: 'Y' },
          ]},
        ],
        skus: [
          { _id: 'sku_101_201', _optKey: '101_201', _nm1: '블랙',  _nm2: 'S',  skuCode: 'SKU-CARGO-BLK-S',  addPrice: 0,    stock: 15, useYn: 'Y', statusCd: 'ON_SALE',   saleCnt: 42 },
          { _id: 'sku_101_202', _optKey: '101_202', _nm1: '블랙',  _nm2: 'M',  skuCode: 'SKU-CARGO-BLK-M',  addPrice: 0,    stock: 20, useYn: 'Y', statusCd: 'ON_SALE',   saleCnt: 78 },
        ],
      },
    ],

    // 주문 데이터 (최소 샘플)
    orders: [
      { orderId: 'ORD-2026-025', userId: 1, userNm: '홍길동', orderDate: '2026-04-05 14:32', prodNm: '오버사이즈 코튼 티셔츠', totalPrice: 26900, status: '입금대기', payMethod: '카카오페이', vendorId: 4 },
      { orderId: 'ORD-2026-024', userId: 1, userNm: '홍길동', orderDate: '2026-04-04 09:18', prodNm: '슬림핏 데님 진 외 1', totalPrice: 238800, status: '결제완료', payMethod: '무통장입금', vendorId: 1 },
    ],

    // 클레임 데이터 (최소 샘플)
    claims: [
      { claimId: 'CLM-2026-025', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-025', type: '교환', status: '신청',    requestDate: '2026-04-06 09:10', prodNm: '오버사이즈 코튼 티셔츠', reason: '사이즈 불일치', refundAmount: 0,      courier:'한진택배', trackingNo:'556677889900', exchangeCourier:'CJ대한통운', exchangeTrackingNo:'998811223344' },
      { claimId: 'CLM-2026-024', userId: 1, userNm: '홍길동', orderId: 'ORD-2026-024', type: '취소', status: '신청',    requestDate: '2026-04-05 14:25', prodNm: '슬림핏 데님 진 외 1', reason: '단순변심', refundAmount: 238800 },
    ],

    // 배송 데이터 (최소 샘플)
    deliveries: [
      { dlivId: 'DLV-2026-025', orderId: 'ORD-2026-025', userNm: '홍길동', destZipCode: '06000', destAddr: '서울시 강남구', destAddrDetail: '10층', status: '준비중', courier: '한진택배', trackingNo: '', regDate: '2026-04-05' },
      { dlivId: 'DLV-2026-024', orderId: 'ORD-2026-024', userNm: '홍길동', destZipCode: '06000', destAddr: '서울시 강남구', destAddrDetail: '10층', status: '배송중', courier: 'CJ대한통운', trackingNo: '112233445566', regDate: '2026-04-04' },
    ],

    // 코드 (필수)
    codes: [
      { codeGrp: 'ORDER_STATUS', code: 'PENDING', codeNm: '입금대기' },
      { codeGrp: 'ORDER_STATUS', code: 'PAID', codeNm: '결제완료' },
      { codeGrp: 'CLAIM_TYPE', code: 'CANCEL', codeNm: '취소' },
      { codeGrp: 'CLAIM_TYPE', code: 'RETURN', codeNm: '반품' },
      { codeGrp: 'DISP_AREA', code: 'MAIN', codeNm: 'Main' },
    ],

    // 카테고리 (필수)
    categories: [
      { categoryId: 1, parentId: 0, categoryNm: '상의', level: 1, sortNo: 1 },
      { categoryId: 2, parentId: 0, categoryNm: '하의', level: 1, sortNo: 2 },
      { categoryId: 3, parentId: 0, categoryNm: '아우터', level: 1, sortNo: 3 },
    ],

    // 역할 (필수)
    roles: [
      { roleId: 1, roleNm: '관리자', perms: ['ALL'] },
      { roleId: 2, roleNm: '담당자', perms: ['READ', 'WRITE'] },
    ],

    // 사이트 (필수)
    sites: [
      { siteId: 1, siteNm: 'ShopJoy', siteNo: '01', domain: 'shopjoy.com', status: 'ACTIVE' },
    ],

    // 전시 (필수)
    displays: [
      { displayId: 1, displayNm: 'Main Banner', status: 'ACTIVE', rows: [] },
    ],
  });
})();
