# od.00. 주문·클레임·배송·결제 상태 코드 통합 표

> 이 문서는 주문 도메인 전체 상태 코드를 한 곳에서 조회하고,
> 테이블 간 상관관계를 매트릭스로 정리한 참조용 문서입니다.
> 상세 정책은 각 도메인 정책서(od.01~od.06)를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. `od_order_item.order_item_status_cd` — 주문 품목 상태 (소스 오브 트루스)

> 주문 흐름 전용. 클레임 진행 중에도 이 컬럼은 주문 흐름 상태를 유지.
> `cancel_qty = order_qty` 달성 시에만 CANCELLED 로 전환.

| 주문 | 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 비고 |
|:---:|:---:|:---:|:---:|--------|---------|------|
| O | - | - | - | ORDERED   | 주문완료   | 초기값. 결제 대기 중 |
| O | - | - | - | PAID      | 결제완료   | 결제 승인 완료 |
| O | - | - | - | PREPARING | 배송준비중 | 판매자 출고 준비 시작 |
| O | - | - | O | SHIPPING  | 배송중     | 송장번호 등록 / 교환상품 신규 item도 이 상태 통과 |
| O | - | - | O | DELIVERED | 배송완료   | 택배사 배송완료 스캔 / 교환상품 수령 완료 |
| O | - | - | O | CONFIRMED | 구매확정   | 고객 수동 확정 또는 배송완료 7일 후 자동 확정 |
| - | O | O | - | CANCELLED | 전량취소   | cancel_qty = order_qty 시. 취소·반품 완료 모두 해당 |

---

### 1-B. `od_claim_item.claim_item_status_cd` — 클레임 품목 상태 (order_item과 독립 공존)

> order_item 1건에 부분수량 클레임 가능 (claim_qty ≤ order_qty − cancel_qty).
> claim_item 진행 중에도 order_item.order_item_status_cd 는 유지됨.

| 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 비고 |
|:---:|:---:|:---:|--------|---------|------|
| O | O | O | REQUESTED  | 요청       | 클레임 항목 신청 접수. 초기값 |
| O | O | O | APPROVED   | 승인       | 관리자 승인 |
| - | O | O | IN_PICKUP  | 수거중     | 수거 진행 중 (취소는 물리적 수거 없음) |
| - | O | - | PROCESSING | 검수중     | 반품 입고 후 검수 (반품 전용) |
| - | - | O | IN_TRANSIT | 교환발송중  | 교환상품 배송 중 (교환 전용) |
| O | O | O | COMPLT     | 완료       | 처리 완료. cancel_qty / item_cancel_amt 누적 |
| O | O | O | REJECTED   | 거절       | 해당 항목 클레임 불가 (기한초과·불가상품 등) |
| O | O | O | CANCELLED  | 철회       | 고객이 해당 항목 클레임 취소 |

---

### 1-C. `od_order.order_status_cd` — 주문 집계 상태 (order_item 요약, 빠른 조회용)

> 부분취소·부분반품 진행 중에는 잔여 활성 item의 가장 앞선 상태를 반영.
> 예) 3개 중 1개 반품 중 → SHIPPED (나머지 2개 기준)

| 주문 | 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 비고 |
|:---:|:---:|:---:|:---:|--------|---------|------|
| O | - | - | - | PENDING   | 결제대기   | 주문 생성. 24시간 내 미결제 시 자동 취소 |
| O | - | - | - | PAID      | 결제완료   | 결제 승인 완료 |
| O | - | - | - | PREPARING | 배송준비중 | 1개 이상 item PREPARING 상태 |
| O | - | - | O | SHIPPED   | 배송중     | 1개 이상 item SHIPPING 또는 교환상품 발송 중 |
| O | - | - | O | COMPLT    | 완료       | 전체 item DELIVERED 이상 / 교환 완료 후 최종 상태 |
| - | O | - | - | CANCELLED | 취소완료   | 전체 item 취소 완료 (cancel_qty = order_qty) |
| - | - | O | - | RETURNED  | 반품완료   | 전체 item 반품 완료 |

---

### 1-D. `od_pay.pay_status_cd` — 결제 상태

| 주문 | 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 비고 |
|:---:|:---:|:---:|:---:|--------|---------|------|
| O | - | - | - | PENDING        | 결제대기  | 결제 요청 후 PG 승인 대기 |
| O | - | - | O | COMPLT         | 결제완료  | 결제 승인 완료 / 교환 추가결제 완료 |
| O | - | - | - | FAILED         | 결제실패  | PG 승인 실패 |
| - | O | - | - | CANCELLED      | 결제취소  | 취소에 의한 전액 결제 취소 |
| - | O | O | O | PARTIAL_REFUND | 부분환불  | 부분취소·부분반품·교환 가격차 환불 완료 |
| - | O | O | - | REFUNDED       | 전액환불  | 전액 환불 완료 (전체 취소·전체 반품) |

> 부분환불 흐름: COMPLT → PARTIAL_REFUND (부분) → REFUNDED (전액 완료 시)

---

### 1-E. `od_dliv.dliv_status_cd` — 배송 상태

> 출고(OUTBOUND)·반품·교환 수거(INBOUND) 배송 모두 이 코드 사용.

| 주문 | 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 비고 |
|:---:|:---:|:---:|:---:|--------|---------|------|
| O | - | - | O | READY      | 출고준비   | 출고 준비 중 / 교환상품 출고 준비 |
| O | - | O | O | PICKED     | 픽업완료   | 택배사 픽업 완료 / 반품·교환 수거 픽업 |
| O | - | O | O | IN_TRANSIT | 배송중     | 택배사 배송 진행 / 반품 수거 이동 / 교환상품 발송 |
| O | - | - | O | DELIVERED  | 배송완료   | 수령자 인수 완료 / 교환상품 수령 완료 |
| - | - | O | O | RETURN_REQ | 반품요청   | 반품·교환 수거 요청 접수 |
| - | - | O | O | RETURNED   | 수거완료   | 반품·교환 상품 입고 완료 |

---

## 2. 상관관계표

> **표 읽는 법**
> - 가로열: `order_item_status_cd`
> - 세로열: `claim_item_status_cd`
> - **O** = 두 상태가 DB에서 동시에 유효하게 존재 가능
> - **-** = 해당 조합 불가 (설계상 발생하지 않음)
> - **O\*** = 부분 클레임 완료 (cancel_qty < order_qty, order_item 상태 유지)
> - **O\*\*** = 전량 클레임 완료 (cancel_qty = order_qty, order_item → CANCELLED)

---

### 2-A. 취소 클레임 (claim_type_cd = CANCEL)

취소 신청 가능 시점: `ORDERED`, `PAID` (PREPARING 이후 불가)

| `claim_item_status_cd` | ORDERED | PAID | PREPARING | SHIPPING | DELIVERED | CONFIRMED | CANCELLED |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED  | O  | O  | -  | -  | -  | -  | -  |
| APPROVED   | O  | O  | -  | -  | -  | -  | -  |
| IN_PICKUP  | -  | -  | -  | -  | -  | -  | -  |
| PROCESSING | -  | -  | -  | -  | -  | -  | -  |
| IN_TRANSIT | -  | -  | -  | -  | -  | -  | -  |
| COMPLT     | O* | O* | -  | -  | -  | -  | O**|
| REJECTED   | O  | O  | -  | -  | -  | -  | -  |
| CANCELLED(철회) | O | O | - | - | - | - | -  |

> `IN_PICKUP` · `PROCESSING` · `IN_TRANSIT` — 취소 클레임에 존재하지 않는 단계.
> `REJECTED` / `CANCELLED(철회)` 후 order_item은 신청 전 상태(ORDERED/PAID)로 복귀.

---

### 2-B. 반품 클레임 (claim_type_cd = RETURN)

반품 신청 가능 시점: `DELIVERED`, `CONFIRMED` (배송완료 후 30일 이내)

| `claim_item_status_cd` | ORDERED | PAID | PREPARING | SHIPPING | DELIVERED | CONFIRMED | CANCELLED |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED  | -  | -  | -  | -  | O  | O  | -  |
| APPROVED   | -  | -  | -  | -  | O  | O  | -  |
| IN_PICKUP  | -  | -  | -  | -  | O  | O  | -  |
| PROCESSING | -  | -  | -  | -  | O  | O  | -  |
| IN_TRANSIT | -  | -  | -  | -  | -  | -  | -  |
| COMPLT     | -  | -  | -  | -  | O* | O* | O**|
| REJECTED   | -  | -  | -  | -  | O  | O  | -  |
| CANCELLED(철회) | - | - | - | - | O  | O  | -  |

> `IN_TRANSIT` — 교환 전용 단계. 반품 클레임에 존재하지 않음.
> `COMPLT` 후 order_item: 부분반품(O*) → 상태 유지 / 전량반품(O**) → CANCELLED.

---

### 2-C. 교환 클레임 (claim_type_cd = EXCHANGE)

교환 신청 가능 시점: `DELIVERED`, `CONFIRMED` (배송완료 후 30일 이내)

| `claim_item_status_cd` | ORDERED | PAID | PREPARING | SHIPPING | DELIVERED | CONFIRMED | CANCELLED |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED  | -  | -  | -  | -  | O  | O  | -  |
| APPROVED   | -  | -  | -  | -  | O  | O  | -  |
| IN_PICKUP  | -  | -  | -  | -  | O  | O  | -  |
| PROCESSING | -  | -  | -  | -  | -  | -  | -  |
| IN_TRANSIT | -  | -  | -  | -  | O  | O  | -  |
| COMPLT     | -  | -  | -  | -  | O  | O  | -  |
| REJECTED   | -  | -  | -  | -  | O  | O  | -  |
| CANCELLED(철회) | - | - | - | - | O  | O  | -  |

> `PROCESSING` — 반품 전용 단계. 교환 클레임에 존재하지 않음.
> `COMPLT` 후 원 order_item 상태 유지 (DELIVERED/CONFIRMED). 교환상품은 신규 order_item(SHIPPING→DELIVERED)으로 생성.

---

### 2-D. order_item_status_cd 기준 — 액션·연관 상태 종합 매트릭스

> order_item 각 상태에서 가능한 액션과 연관된 pay/dliv 상태를 한눈에 확인.

| `order_item_status_cd` | 취소 신청 | 반품 신청 | 교환 신청 | 구매확정 | `pay_status_cd` | `dliv_status_cd` |
|:---|:---:|:---:|:---:|:---:|:---|:---|
| ORDERED   | ✅ | ❌ | ❌ | ❌ | PENDING | -                   |
| PAID      | ✅ | ❌ | ❌ | ❌ | COMPLT  | -                   |
| PREPARING | ❌ | ❌ | ❌ | ❌ | COMPLT  | READY               |
| SHIPPING  | ❌ | ❌ | ❌ | ❌ | COMPLT  | PICKED / IN_TRANSIT |
| DELIVERED | ❌ | ✅ | ✅ | ✅ | COMPLT  | DELIVERED           |
| CONFIRMED | ❌ | ✅†| ✅†| -  | COMPLT  | DELIVERED           |
| CANCELLED | ❌ | ❌ | ❌ | ❌ | REFUNDED / CANCELLED / PARTIAL_REFUND | - |

> † 30일 이내 신청 가능.
> `PREPARING` 이후 취소 불가 → 고객센터 문의 또는 배송 후 반품으로 처리.
> 자동 구매확정: DELIVERED 후 7일 경과 시 자동 CONFIRMED. 클레임 진행 중이면 보류.
> pay_status_cd는 od_order 단위. 부분 클레임 시 PARTIAL_REFUND 병행 가능.

---

## 변경이력

- 2026-04-18: 초기 작성 — 5개 상태 코드 표 + 4개 상관관계표
