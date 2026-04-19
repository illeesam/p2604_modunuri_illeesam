# screenFo-od/ 사용자 페이스 화면 — 주문(OD)

## 화면 목록
- `fo-cart.html` — 장바구니 (담기/수량변경/삭제/선택주문)
- `fo-order.html` — 주문서 작성 (배송지/결제수단/쿠폰·캐쉬 적용)
- `fo-order-complete.html` — 주문완료 (주문번호/결제정보 확인)

## 관련 사용자 컴포넌트
- `pages/Cart.js` — 장바구니
- `pages/Order.js` — 주문서
- `pages/OrderComplete.js` — 주문완료

## 주문 흐름
```
상품상세 → 장바구니(fo-cart) → 주문서(fo-order) → 주문완료(fo-order-complete)
                                     └─ 바로구매 시 장바구니 생략 가능
```

## 결제수단
무통장입금 / 가상계좌 / 토스페이 / 카카오페이 / 네이버페이 / 핸드폰결제

## 진입점
`index.html` 해시 라우팅: `#page=cart`, `#page=order`
