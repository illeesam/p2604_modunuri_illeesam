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

    // 코드 (필수) - SyCodeMng 표준 구조
    codes: [
      { codeId: 1,  codeGrp: 'ORDER_STATUS', codeLabel: '입금대기',  codeValue: 'PENDING',   sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 2,  codeGrp: 'ORDER_STATUS', codeLabel: '결제완료',  codeValue: 'PAID',      sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 3,  codeGrp: 'ORDER_STATUS', codeLabel: '배송준비',  codeValue: 'PREPARING', sortOrd: 3, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 4,  codeGrp: 'ORDER_STATUS', codeLabel: '배송중',    codeValue: 'SHIPPED',   sortOrd: 4, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 5,  codeGrp: 'ORDER_STATUS', codeLabel: '배송완료',  codeValue: 'COMPLT',    sortOrd: 5, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 6,  codeGrp: 'CLAIM_TYPE',   codeLabel: '취소',      codeValue: 'CANCEL',    sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 7,  codeGrp: 'CLAIM_TYPE',   codeLabel: '반품',      codeValue: 'RETURN',    sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 8,  codeGrp: 'CLAIM_TYPE',   codeLabel: '교환',      codeValue: 'EXCHANGE',  sortOrd: 3, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 9,  codeGrp: 'CLAIM_STATUS', codeLabel: '신청',      codeValue: 'REQUESTED', sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 10, codeGrp: 'CLAIM_STATUS', codeLabel: '처리중',    codeValue: 'PROCESSING',sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 11, codeGrp: 'CLAIM_STATUS', codeLabel: '완료',      codeValue: 'COMPLT',    sortOrd: 3, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 12, codeGrp: 'DLIV_STATUS',  codeLabel: '준비중',    codeValue: 'READY',     sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 13, codeGrp: 'DLIV_STATUS',  codeLabel: '배송중',    codeValue: 'SHIPPING',  sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 14, codeGrp: 'DLIV_STATUS',  codeLabel: '배송완료',  codeValue: 'DELIVERED', sortOrd: 3, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 15, codeGrp: 'DISP_AREA',    codeLabel: '메인',      codeValue: 'MAIN',      sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 16, codeGrp: 'DISP_AREA',    codeLabel: '서브메인',  codeValue: 'SUB_MAIN',  sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 17, codeGrp: 'PAY_METHOD',   codeLabel: '무통장입금',codeValue: 'BANK',      sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 18, codeGrp: 'PAY_METHOD',   codeLabel: '카카오페이',codeValue: 'KAKAO',     sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 19, codeGrp: 'PAY_METHOD',   codeLabel: '네이버페이',codeValue: 'NAVER',     sortOrd: 3, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 20, codeGrp: 'MEMBER_GRADE', codeLabel: '일반',      codeValue: 'NORMAL',    sortOrd: 1, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
      { codeId: 21, codeGrp: 'MEMBER_GRADE', codeLabel: 'VIP',       codeValue: 'VIP',       sortOrd: 2, useYn: 'Y', remark: '', parentCodeValue: null, regDate: '2026-01-01' },
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

    // 표시경로 업무코드 옵션 (bizCdCodes)
    bizCdCodes: [
      { codeValue: 'sy_brand',    codeLabel: '브랜드' },
      { codeValue: 'sy_vendor',   codeLabel: '업체' },
      { codeValue: 'sy_dept',     codeLabel: '부서' },
      { codeValue: 'sy_menu',     codeLabel: '메뉴' },
      { codeValue: 'sy_code_grp', codeLabel: '코드그룹' },
      { codeValue: 'ec_category', codeLabel: '카테고리' },
    ],

    // 표시경로 (sy_path)
    paths: [
      { pathId: 1, bizCd: 'sy_brand',    parentPathId: null, pathLabel: '국내브랜드',    sortOrd: 1, useYn: 'Y', remark: '' },
      { pathId: 2, bizCd: 'sy_brand',    parentPathId: 1,    pathLabel: '패션',          sortOrd: 1, useYn: 'Y', remark: '' },
      { pathId: 3, bizCd: 'sy_brand',    parentPathId: 1,    pathLabel: '뷰티',          sortOrd: 2, useYn: 'Y', remark: '' },
      { pathId: 4, bizCd: 'sy_brand',    parentPathId: null, pathLabel: '해외브랜드',    sortOrd: 2, useYn: 'Y', remark: '' },
      { pathId: 5, bizCd: 'sy_vendor',   parentPathId: null, pathLabel: '의류업체',      sortOrd: 1, useYn: 'Y', remark: '' },
      { pathId: 6, bizCd: 'sy_vendor',   parentPathId: null, pathLabel: '잡화업체',      sortOrd: 2, useYn: 'Y', remark: '' },
      { pathId: 7, bizCd: 'sy_code_grp', parentPathId: null, pathLabel: '주문/결제',     sortOrd: 1, useYn: 'Y', remark: '' },
      { pathId: 8, bizCd: 'sy_code_grp', parentPathId: null, pathLabel: '배송/클레임',   sortOrd: 2, useYn: 'Y', remark: '' },
      { pathId: 9, bizCd: 'sy_code_grp', parentPathId: null, pathLabel: '전시/프로모션', sortOrd: 3, useYn: 'Y', remark: '' },
    ],
  });
})();
