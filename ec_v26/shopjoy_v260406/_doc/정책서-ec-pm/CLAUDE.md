# 정책서ec-pm — 프로모션(PM) 도메인

## 파일 목록

| 파일 | 내용 |
|---|---|
| `pm.01.프로모션상태표.md` | 쿠폰·할인·사은품·상품권·기획전·이벤트 상태 코드 표 (참조 전용) |
| `pm.02.프로포션쿠폰.md` | 쿠폰 발행, 사용, 할인 적용 |
| `pm.03.프로포션캐시.md` | 충전금 충전, 사용, 환불, 유효기간 |
| `pm.04.프로포션적립금.md` | 구매 적립금, 자동 소멸 |
| `pm.05.프로모션할인.md` | 상품 할인 마스터/대상 |
| `pm.06.프로모션사은품.md` | 사은품 지급 조건, 발급 프로세스 |
| `pm.07.프로모션상품권.md` | 상품권 발행, 사용 |
| `pm.08.프로모션기획전.md` | 기획전 구성, 상품 배치 |
| `pm.09.프로모션이벤트.md` | 이벤트 혜택 관리 |

## 관련 테이블 (ec-pm/)
- `pm_coupon`, `pm_coupon_item`, `pm_coupon_issue`, `pm_coupon_usage`
- `pm_cache`, `pm_save`, `pm_save_issue`, `pm_save_usage`
- `pm_discnt`, `pm_discnt_item`, `pm_discnt_usage`
- `pm_gift`, `pm_gift_cond`, `pm_gift_issue`
- `pm_voucher`, `pm_voucher_issue`
- `pm_plan`, `pm_plan_item`
- `pm_event`, `pm_event_item`, `pm_event_benefit`

## 관리자 화면
| pageId | 라벨 |
|---|---|
| `pmCouponMng` | 프로모션 > 쿠폰관리 |
| `pmCacheMng` | 프로모션 > 캐쉬관리 |
| `pmSaveMng` | 프로모션 > 마일리지관리 |
| `pmDiscntMng` | 프로모션 > 할인관리 |
| `pmGiftMng` | 프로모션 > 사은품관리 |
| `pmVoucherMng` | 프로모션 > 상품권관리 |
| `pmEventMng` | 프로모션 > 이벤트관리 |
| `pmPlanMng` | 프로모션 > 기획전관리 |
