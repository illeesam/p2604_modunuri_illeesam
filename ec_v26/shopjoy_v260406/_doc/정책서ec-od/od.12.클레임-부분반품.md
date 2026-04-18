# od.11. 클레임 - 부분반품 정책

## 목적
하나의 주문에서 일부 상품(order_item) 또는 일부 수량만 반품하는 정책 정의

## 범위
- order_item 단위 부분반품 신청
- 수량(claim_qty) 기반 부분반품
- 배송비 재계산 규칙
- 쿠폰·할인·적립금 안분 처리
- od_order_item 필드 업데이트 규칙

---

## 1. 부분반품 신청 기준

### 1-1. 신청 가능 단위
- **상품 단위**: 주문 내 특정 order_item만 반품 신청 가능
- **수량 단위**: 동일 order_item 내에서 일부 수량만 반품 가능
  - 예: order_qty=3 중 claim_qty=1 또는 2

### 1-2. 신청 가능 수량 계산
```
신청가능_최대수량 = order_qty - cancel_qty - 기존_진행중_claim_qty
```
- `cancel_qty`: 기존에 취소·반품 완료된 누적 수량 (`od_order_item.cancel_qty`)
- 진행중인 다른 클레임 건의 claim_qty 합산도 제외
- 최소 신청수량: 1개

### 1-3. 신청 불가 조건
| 조건 | 사유 |
|------|------|
| order_item_status_cd = CANCEL | 이미 전량 취소됨 |
| claim_item_status_cd = REQUESTED/APPROVED/PROCESSING | 진행중인 클레임 있음 |
| 신청가능_최대수량 ≤ 0 | 남은 수량 없음 |
| 반품기한(배송완료 후 30일) 초과 | 기한 만료 |

---

## 2. 부분반품 처리 프로세스

```
신청 → 승인 → 수거중(IN_PICKUP) → 수거완료 → 입고(검수) → 환불처리 → 완료(COMPLT)
```

### 2-1. 신청 시 생성 데이터
- `od_claim` 1건 생성 (`claim_type_cd = RETURN`)
- `od_claim_item` N건 생성 (반품 신청한 order_item별 1건)
  - `claim_qty`: 반품 신청 수량
  - `item_amt`: `unit_price × claim_qty`

### 2-2. 입고 완료 시 od_order_item 업데이트
```sql
-- 입고 완료 (클레임 COMPLT) 처리 시
UPDATE od_order_item SET
  cancel_qty      = cancel_qty + claim_qty,          -- 반품수량 누적
  item_cancel_amt = item_cancel_amt + 환불확정금액,   -- 환불금액 누적
  item_completed_amt = item_order_amt - item_cancel_amt,
  order_item_status_cd = CASE
    WHEN cancel_qty + claim_qty >= order_qty THEN 'CANCEL'  -- 전량 반품
    ELSE 'PARTIAL_CANCEL'  -- 부분반품 완료
  END
WHERE order_item_id = ?;
```

---

## 3. 배송비 재계산 규칙

### 3-1. 무료배송 → 유료배송 전환
| 조건 | 처리 |
|------|------|
| 원 주문이 조건부 무료배송이었으나 부분반품 후 조건 미충족 | 배송비 발생 → 환불금액에서 차감 |
| 원 주문이 무조건 무료배송 | 변경 없음 |
| 원 주문이 유료배송 | 변경 없음 |

### 3-2. 배송비 재계산 공식
```
잔여주문금액 = Σ(잔여 order_item의 item_order_amt)
배송비_변경액 = 재계산된_배송비 - 원_배송비
(배송비_변경액 > 0이면 환불금액에서 차감)
```

### 3-3. 반품 배송비 부담
- 기준: `od_claim.reason_cd` (반품사유)
- 규칙은 [od.05.클레임반품.md] §3 "반품 배송료 정책" 준용

---

## 4. 쿠폰·할인 안분 처리

### 4-1. 상품쿠폰 (특정 order_item에 적용된 쿠폰)
| 상황 | 처리 |
|------|------|
| 해당 item 전량 반품 | 쿠폰 재발급 (재발급 유효기간 정책 → [od.12] §3 참조) |
| 해당 item 부분수량 반품 | 환불금액에서 쿠폰할인액 비례 차감 (쿠폰 재발급 없음) |
| 쿠폰이 적용되지 않은 item 반품 | 영향 없음 |

### 4-2. 주문쿠폰 (주문 전체 금액에서 차감된 쿠폰)
```
주문쿠폰_안분액 = 주문쿠폰_총할인액 × (반품item_금액합 / 전체주문_상품금액합)
```
- 안분액은 환불금액에서 차감
- **주문쿠폰 자체는 재발급하지 않음** (잔여 주문이 유효하므로)
- 단, 해당 주문의 모든 item이 반품·취소 완료되면 쿠폰 재발급

### 4-3. 상품 즉시할인 (pm_discount)
```
할인_안분액 = 상품할인액 × (claim_qty / order_qty)
```
- 환불금액에서 차감 (이미 할인된 unit_price 기준이면 별도 계산 불필요)

---

## 5. 적립금(포인트) 안분 처리

### 5-1. 구매 시 사용한 적립금
```
사용적립금_복원액 = 주문시_사용적립금 × (반품item_금액합 / 전체주문_상품금액합)
```
- `pm_save_usage` 레코드 취소 처리 (CANCEL)
- `pm_save` 원장에 CANCEL 타입으로 복원 기록

### 5-2. 복원 적립금 유효기간
- 원 사용 시점 기준 잔여 유효기간 그대로 유지
- 단, 복원 시점에서 잔여일이 **7일 미만**인 경우 → 복원일로부터 30일 연장
- 이미 소멸 처리된 적립금 → 관리자 재량으로 30일 유효한 새 적립금 생성

### 5-3. 구매 완료 후 지급 예정 적립금
- 반품 완료 시: `pm_save_issue.save_issue_status_cd = CANCELLED`
- 비율 적립금 지급 취소
  - 전량 반품: 전체 적립 예정 금액 취소
  - 부분 반품: 해당 item의 적립 예정 금액만 취소

---

## 6. 환불금액 계산

```
부분반품_환불금액
  = Σ(claim_item.unit_price × claim_item.claim_qty)      -- 반품상품금액
  - 주문쿠폰_안분액                                       -- 주문쿠폰 비례 차감
  - 상품쿠폰_할인_안분액                                  -- 상품쿠폰 비례 차감
  - 즉시할인_안분액                                       -- 즉시할인 비례 차감
  - 배송비_변경액                                         -- 배송비 재계산 차액 (발생 시)
  - 반품배송비_고객부담분                                 -- 반품사유별 부담
  - 상품손상_감액                                         -- 검수 결과 (있는 경우)
  + 사용적립금_복원액                                     -- 환불 대신 적립금 복원 처리
```

> 사용적립금은 현금으로 환불하지 않고 적립금 형태로 복원 (pm_save에 기록)

**환불금액 저장 위치**:
- `od_claim.refund_amt`: 클레임 전체 환불금액 합계
- `od_claim_item.refund_amt`: item별 환불금액

---

## 7. 상태 코드

### od_order_item.order_item_status_cd (반품 관련)
| 상태 | 코드 | 설명 |
|------|------|------|
| 반품요청 | RETURN_REQ | 반품 신청 접수 |
| 반품중 | RETURNING | 수거·검수 진행 중 |
| 반품완료 | RETURNED | 전량 반품 처리 완료 |

> **부분반품**: item_status = RETURNING/RETURNED + `cancel_qty` 로 수량 추적.
> 잔여 활성수량이 남아 있으면 잔여분의 현재 상태(DELIVERED 등)를 유지하는 방식이 아닌,
> item_status는 클레임 진행 상태를 우선 반영하고, 클레임 완료 후 잔여수량이 있으면
> 이전 정상 상태(DELIVERED/CONFIRMED)로 복귀.

---

## 8. 제약사항
- 진행중인 클레임이 있는 item은 추가 클레임 불가 (claim_item_status_cd = REQUESTED/APPROVED/PROCESSING)
- order_item당 클레임 1회 원칙 (교환 완료 후 반품은 예외 허용)
- claim_qty는 신청가능_최대수량 초과 불가
- 위생상품(속옷, 식품 개봉 등) 반품 불가 상품 사전 검증 필요

## 관련 테이블
- `od_claim` — 반품 클레임 마스터
- `od_claim_item` — 반품 항목 (claim_qty)
- `od_order_item` — cancel_qty, item_cancel_amt 업데이트 대상
- `pm_coupon_usage` — 쿠폰 사용 취소
- `pm_save_usage` — 적립금 사용 취소
- `pm_save_issue` — 적립 예정 취소

## 관련 정책서
- [od.05.클레임반품.md] — 반품 기본 정책 (사유, 배송료 부담)
- [od.12.클레임-부분환불.md] — 환불 수단 우선순위
- [od.14.클레임-추가결제.md] — 배송비 추가결제 프로세스

## 변경이력
- 2026-04-18: 초기 작성
