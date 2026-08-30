# screenFo-my/ 사용자 페이스 화면 — 마이페이지(MY)

## 화면 목록
- `index.html` — 마이페이지 화면 목록 인덱스
- `my-profile.html` — 내 정보 (회원정보 수정, 비밀번호 변경)
- `my-addr.html` — 배송지관리 (주소록 CRUD, 기본배송지 설정)
- `my-order.html` — 주문내역 (주문목록/상세, 배송조회)
- `my-claim.html` — 클레임내역 (취소/반품/교환 신청 및 이력)
- `my-coupon.html` — 쿠폰함 (보유 쿠폰 목록, 사용 이력)
- `my-cache.html` — 캐쉬내역 (충전금 잔액, 충전/사용 이력)

## 관련 사용자 컴포넌트
- `pages/my/MyOrder.js`, `MyOrderDtl.js`
- `pages/my/MyClaim.js`
- `pages/my/MyCoupon.js`
- `pages/my/MyCache.js`
- `pages/my/MyAddr.js`

## 목업 데이터
- `api/my/orders.json`, `api/my/claims.json`
- `api/my/coupons.json`, `api/my/cash.json`

## 진입점
`index.html` 해시 라우팅: `#page=myOrder`, `#page=myClaim`, `#page=myCoupon`, `#page=myCache`
