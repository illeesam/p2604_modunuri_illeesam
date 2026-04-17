# ec-pm/ 프로모션 도메인 DDL

## 테이블 목록

### 쿠폰
- `pm_coupon` — 쿠폰 마스터 (PK: coupon_id)
- `pm_coupon_item` — 쿠폰 적용 대상 (PRODUCT/CATEGORY/VENDOR/BRAND, 없으면 전체)
- `pm_coupon_issue` — 쿠폰 발급 (PK: coupon_issue_id, FK: coupon_id + member_id)
- `pm_coupon_usage` — 쿠폰 사용 (FK: coupon_issue_id + order_id)

### 캐시/적립금
- `pm_cache` — 캐시(충전금) 원장 (PK: cache_id, FK: member_id, 건별 입출 기록)
- `pm_save` — 적립금 원장 (PK: save_id, 모든 적립/사용/소멸 통합 원장)
- `pm_save_issue` — 적립금 지급 이력 (ORDER/EVENT/REVIEW/REFERRAL/ADMIN, PENDING→CONFIRMED)
- `pm_save_usage` — 적립금 사용 이력 (order_id + order_item_id + prod_id)

### 할인
- `pm_discnt` — 할인 마스터 (PK: discnt_id)
- `pm_discnt_item` — 할인 대상 (PRODUCT/CATEGORY/MEMBER_GRADE)
- `pm_discnt_usage` — 할인 적용 이력 (order_id + order_item_id + prod_id)

### 사은품
- `pm_gift` — 사은품 마스터 (PK: gift_id)
- `pm_gift_cond` — 사은품 조건 (구매금액/수량 기준)
- `pm_gift_issue` — 사은품 지급 (FK: gift_id + order_id)

### 상품권
- `pm_voucher` — 상품권 마스터 (PK: voucher_id)
- `pm_voucher_issue` — 상품권 발행 (PK: voucher_issue_id, 고유 코드 포함)

### 기획전/이벤트
- `pm_plan` — 기획전 마스터 (PK: plan_id)
- `pm_plan_item` — 기획전 상품 (FK: plan_id + prod_id, sort_no)
- `pm_event` — 이벤트 마스터 (PK: event_id)
- `pm_event_item` — 이벤트 적용 대상 (PRODUCT/CATEGORY/VENDOR/BRAND, sort_no 순서)
- `pm_event_benefit` — 이벤트 혜택 (FK: event_id)

## 상태 코드
- `coupon_status_cd`: ACTIVE / USED / EXPIRED / CANCELED
- `cache_type_cd`: CHARGE / USE / REFUND / EXPIRE / ADJ
- `save_type_cd`: EARN / USE / EXPIRE / ADJ
- `discnt_status_cd`: ACTIVE / INACTIVE / EXPIRED

## 관련 정책서
- `_doc/정책서ec/pm.01.프로포션쿠폰.md`
- `_doc/정책서ec/pm.02.프로포션캐시.md`
- `_doc/정책서ec/pm.03.프로포션적립금.md`
- `_doc/정책서ec/pm.04.프로모션할인.md`
- `_doc/정책서ec/pm.05.프로모션사은품.md`
- `_doc/정책서ec/pm.06.프로모션상품권.md`
- `_doc/정책서ec/pm.07.프로모션기획전.md`
- `_doc/정책서ec/pm.08.프로모션이벤트.md`
