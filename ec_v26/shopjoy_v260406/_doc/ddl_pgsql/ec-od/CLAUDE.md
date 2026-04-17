# ec-od/ 주문/결제/배송/클레임 도메인 DDL

## 테이블 목록

### 장바구니
- `od_cart` — 장바구니 (PK: cart_id, FK: member_id + prod_opt_sku_id)

### 주문
- `od_order` — 주문 마스터 (PK: order_id)
- `od_order_item` — 주문 상품 (PK: order_item_id) **★ 정산 기본 수집 단위**
- `od_order_status_hist` — 주문 상태 이력
- `od_order_chg_hist` — 주문 변경 이력
- `od_order_item_chg_hist` — 주문상품 변경 이력

### 결제
- `od_pay` — 결제 마스터 (PK: pay_id, FK: order_id)
- `od_pay_status_hist` — 결제 상태 이력
- `od_pay_chg_hist` — 결제 변경 이력

### 배송
- `od_dliv` — 배송 마스터 (PK: dliv_id, FK: order_id)
- `od_dliv_item` — 배송 상품 (FK: dliv_id + order_item_id)
- `od_dliv_status_hist` — 배송 상태 이력
- `od_dliv_chg_hist` — 배송 변경 이력
- `od_dliv_item_chg_hist` — 배송상품 변경 이력

### 클레임 (취소/반품/교환)
- `od_claim` — 클레임 마스터 (PK: claim_id, FK: order_id)
- `od_claim_item` — 클레임 상품 (PK: claim_item_id) **★ 정산 기본 수집 단위**
- `od_claim_status_hist` — 클레임 상태 이력
- `od_claim_chg_hist` — 클레임 변경 이력
- `od_claim_item_chg_hist` — 클레임상품 변경 이력

## 상태 코드
- `order_status_cd`: PENDING / PAID / PREPARING / SHIPPED / COMPLT / CANCEL
- `pay_status_cd`: READY / PAID / PARTIAL_REFUND / REFUND / FAIL
- `dliv_status_cd`: READY / SHIPPING / DELIVERED / RETURN_REQ / RETURNED
- `claim_status_cd`: REQUESTED / APPROVED / PROCESSING / COMPLT / REJECTED
- `claim_type_cd`: CANCEL / RETURN / EXCHANGE

## 정산 연계
- `od_order_item`과 `od_claim_item`이 `st_settle_raw`의 기본 수집 단위
- 타월 환불: claim 확정 시점 월에 CLAIM 타입으로 수집원장 생성

## 관련 정책서
- `_doc/정책서ec/od.01.주문.md`
- `_doc/정책서ec/od.02.결제.md`
- `_doc/정책서ec/od.03.배송.md`
- `_doc/정책서ec/od.04.클레임취소.md`
- `_doc/정책서ec/od.05.클레임반품.md`
- `_doc/정책서ec/od.06.클레임교환.md`
