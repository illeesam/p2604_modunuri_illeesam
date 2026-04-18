# ec-pm/ 프로모션 도메인 DDL

## SQL 파일 목록

### 쿠폰
- `pm_coupon.sql` — 쿠폰 마스터 (PK: coupon_id)
- `pm_coupon_item.sql` — 쿠폰 적용 대상 (PRODUCT/CATEGORY/VENDOR/BRAND, 없으면 전체)
- `pm_coupon_issue.sql` — 쿠폰 발급 (PK: coupon_issue_id, FK: coupon_id + member_id)
- `pm_coupon_usage.sql` — 쿠폰 사용 이력 (order_id + order_item_id + prod_id)

### 캐시/적립금
- `pm_cache.sql` — 캐시(충전금) 원장 (건별 입출 기록)
- `pm_save.sql` — 적립금 통합 원장 (EARN/USE/EXPIRE/CANCEL/ADMIN)
- `pm_save_issue.sql` — 적립금 지급 이력 (ORDER/EVENT/REVIEW/REFERRAL/ADMIN, PENDING→CONFIRMED)
- `pm_save_usage.sql` — 적립금 사용 이력 (order_id + order_item_id + prod_id)

### 할인
- `pm_discnt.sql` — 할인 마스터 (PK: discnt_id)
- `pm_discnt_item.sql` — 할인 대상 (PRODUCT/CATEGORY/MEMBER_GRADE)
- `pm_discnt_usage.sql` — 할인 적용 이력 (order_id + order_item_id + prod_id)

### 사은품
- `pm_gift.sql` — 사은품 마스터 (PK: gift_id)
- `pm_gift_cond.sql` — 사은품 조건 (구매금액/수량 기준)
- `pm_gift_issue.sql` — 사은품 지급 (FK: gift_id + order_id)

### 상품권
- `pm_voucher.sql` — 상품권 마스터 (PK: voucher_id)
- `pm_voucher_issue.sql` — 상품권 발행 (고유 코드 포함)

### 기획전/이벤트
- `pm_plan.sql` — 기획전 마스터 (PK: plan_id)
- `pm_plan_item.sql` — 기획전 상품 (FK: plan_id + prod_id, sort_no)
- `pm_event.sql` — 이벤트 마스터 (PK: event_id)
- `pm_event_item.sql` — 이벤트 적용 대상 (PRODUCT/CATEGORY/VENDOR/BRAND, sort_no 순서)
- `pm_event_benefit.sql` — 이벤트 혜택 (FK: event_id)

## 상태 코드
- `coupon_status_cd`: ACTIVE / USED / EXPIRED / CANCELED
- `cache_type_cd`: CHARGE / USE / REFUND / EXPIRE / ADJ
- `save_type_cd`: EARN / USE / EXPIRE / ADJ
- `save_issue_status_cd`: PENDING / CONFIRMED / EXPIRED / CANCELED
- `discnt_status_cd`: ACTIVE / INACTIVE / EXPIRED

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `pmCouponMng` | 프로모션 > 쿠폰관리 | pm_coupon, pm_coupon_item, pm_coupon_issue, pm_coupon_usage |
| `pmCacheMng` | 프로모션 > 캐쉬관리 | pm_cache |
| `pmSaveMng` | 프로모션 > 마일리지관리 | pm_save, pm_save_issue, pm_save_usage |
| `pmDiscntMng` | 프로모션 > 할인관리 | pm_discnt, pm_discnt_item, pm_discnt_usage |
| `pmGiftMng` | 프로모션 > 사은품관리 | pm_gift, pm_gift_cond, pm_gift_issue |
| `pmVoucherMng` | 프로모션 > 상품권관리 | pm_voucher, pm_voucher_issue |
| `pmEventMng` | 프로모션 > 이벤트관리 | pm_event, pm_event_item, pm_event_benefit |
| `pmPlanMng` | 프로모션 > 기획전관리 | pm_plan, pm_plan_item |

## 관련 정책서
- `_doc/정책서ec/pm.01.프로포션쿠폰.md`
- `_doc/정책서ec/pm.02.프로포션캐시.md`
- `_doc/정책서ec/pm.03.프로포션적립금.md`
- `_doc/정책서ec/pm.04.프로모션할인.md`
- `_doc/정책서ec/pm.05.프로모션사은품.md`
- `_doc/정책서ec/pm.06.프로모션상품권.md`
- `_doc/정책서ec/pm.07.프로모션기획전.md`
- `_doc/정책서ec/pm.08.프로모션이벤트.md`
