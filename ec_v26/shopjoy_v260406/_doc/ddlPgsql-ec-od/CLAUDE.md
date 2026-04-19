# ec-od/ 주문/결제/배송/클레임 도메인 DDL

## SQL 파일 목록

### 장바구니
- `od_cart.sql` — 장바구니 (PK: cart_id, FK: member_id + prod_opt_sku_id)

### 주문
- `od_order.sql` — 주문 마스터 (PK: order_id)
- `od_order_item.sql` — 주문 상품 (PK: order_item_id) **★ 정산 기본 수집 단위**
- `od_order_item_discnt.sql` — 주문상품 할인 내역 (즉시할인·상품쿠폰, discnt_type_cd: ITEM_DISCNT/ITEM_COUPON)
- `od_order_discnt.sql` — 주문 할인·차감 내역 (주문쿠폰·적립금·캐쉬차감, restore_yn으로 복원 추적)

### 결제
- `od_pay.sql` — 결제 마스터 (PK: pay_id, FK: order_id)
- `od_pay_method.sql` — 마이페이지 등록 결제수단 (FK: member_id, pay_key_no: 게이트웨이 토큰)

### 환불
- `od_refund.sql` — 환불 마스터 (클레임 1건 = 1행, PK: refund_id, refund_type_cd: CANCEL/RETURN/PARTIAL/EXTRA)
- `od_refund_method.sql` — 환불수단 내역 (수단별 환불금액, refund_priority: 1=카드/현금성, 2=캐쉬, 3=적립금)

### 배송
- `od_dliv.sql` — 배송 마스터 (PK: dliv_id, FK: order_id)
- `od_dliv_item.sql` — 배송 상품 (FK: dliv_id + order_item_id)

### 클레임 (취소/반품/교환)
- `od_claim.sql` — 클레임 마스터 (PK: claim_id, FK: order_id)
- `od_claim_item.sql` — 클레임 상품 (PK: claim_item_id) **★ 정산 기본 수집 단위**

### 이력·로그 (odh_*)
- `odh_order_status_hist.sql` — 주문 상태 이력 (order_status_cd_before → order_status_cd)
- `odh_order_item_status_hist.sql` — 주문상품 상태 이력 (order_item_status_cd_before → order_item_status_cd)
- `odh_order_chg_hist.sql` — 주문 변경 이력
- `odh_order_item_chg_hist.sql` — 주문상품 변경 이력
- `odh_pay_status_hist.sql` — 결제 상태 이력 (pay_status_cd_before → pay_status_cd)
- `odh_pay_chg_hist.sql` — 결제 변경 이력
- `odh_dliv_status_hist.sql` — 배송 상태 이력 (dliv_status_cd_before → dliv_status_cd)
- `odh_dliv_chg_hist.sql` — 배송 변경 이력
- `odh_dliv_item_chg_hist.sql` — 배송상품 변경 이력
- `odh_claim_status_hist.sql` — 클레임 상태 이력 (claim_status_cd_before → claim_status_cd)
- `odh_claim_item_status_hist.sql` — 클레임상품 상태 이력 (claim_item_status_cd_before → claim_item_status_cd)
- `odh_claim_chg_hist.sql` — 클레임 변경 이력
- `odh_claim_item_chg_hist.sql` — 클레임상품 변경 이력

## 상태 코드

### od_order.order_status_cd (주문 집계 상태 — order_item 상태의 요약)
`PENDING / PAID / PREPARING / SHIPPED / COMPLT / CANCELLED / RETURNED`

### od_order_item.order_item_status_cd (주문 흐름 전용 — 클레임 상태 포함 안 함)
`ORDERED / PAID / PREPARING / SHIPPING / DELIVERED / CONFIRMED / CANCELLED(전량취소)`

> 클레임 진행 중이어도 order_item 상태는 유지. 전량 취소·반품 완료 시에만 CANCELLED.
> 클레임 상태는 `od_claim_item.claim_item_status_cd` 가 별도 관리.

### od_claim_item.claim_item_status_cd (클레임 흐름 전용)
`REQUESTED / APPROVED / IN_PICKUP(반품·교환) / PROCESSING(반품) / IN_TRANSIT(교환) / COMPLT / REJECTED / CANCELLED`

### od_pay.pay_status_cd
`PENDING / COMPLT / FAILED / CANCELLED / PARTIAL_REFUND / REFUNDED`

### od_dliv.dliv_status_cd
`READY / PICKED / IN_TRANSIT / DELIVERED / RETURN_REQ / RETURNED`

### od_claim.claim_status_cd
`REQUESTED / APPROVED / IN_PICKUP / PROCESSING / COMPLT / REJECTED / CANCELLED`

### od_claim.claim_type_cd
`CANCEL / RETURN / EXCHANGE`

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `odOrderMng` | 주문관리 > 주문관리 | od_order, od_order_item, od_pay, od_order_status_hist |
| `odClaimMng` | 주문관리 > 클레임관리 | od_claim, od_claim_item, od_claim_status_hist |
| `odDlivMng` | 주문관리 > 배송관리 | od_dliv, od_dliv_item, od_dliv_status_hist |

## 정산 연계
- `od_order_item`, `od_claim_item` → `st_settle_raw` 기본 수집 단위
- 타월 환불: claim 확정 시점 월에 CLAIM 타입으로 수집원장 생성

## 관련 정책서
- `_doc/정책서ec/od.01.주문.md`
- `_doc/정책서ec/od.02.결제.md`
- `_doc/정책서ec/od.03.배송.md`
- `_doc/정책서ec/od.04.클레임취소.md`
- `_doc/정책서ec/od.05.클레임반품.md`
- `_doc/정책서ec/od.06.클레임교환.md`
