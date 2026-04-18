<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# od.01. 주문·클레임·배송·결제 상태 코드 통합 표

주문 도메인 전체 상태 코드를 한 곳에서 조회하고 테이블 간 상관관계를 매트릭스로 정리한 참조용 문서.
상세 정책은 각 도메인 정책서(od.02~od.07)를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. 주문 품목 상태 (소스 오브 트루스) — `od_order_item.order_item_status_cd`
주문 흐름 전용 상태 코드. 클레임 진행 중에도 이 컬럼은 주문 흐름 상태를 유지한다.
`cancel_qty = order_qty` 달성 시에만 CANCELLED로 전환되며, 교환 완료 시 원 item은 변동 없음.

| 항목 | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | O  | O  | O  | -  |
| 취소 | - | - | - | -  | -  | -  | O  |
| 반품 | - | - | - | -  | -  | -  | O  |
| 교환 | - | - | - | O  | O  | O  | -  |
| 비고 | 초기값.<br>결제 대기 중 | 결제 승인 완료 | 판매자 출고<br>준비 시작 | 송장번호 등록.<br>교환상품 신규 item도<br>이 상태 통과 | 택배사 배송완료 스캔.<br>교환상품 수령 완료 | 고객 수동 확정 또는<br>배송완료 7일 후<br>자동 확정 | cancel_qty = order_qty 시.<br>취소·반품 완료<br>모두 해당 |

---

### 1-B. 클레임 품목 상태 — `od_claim_item.claim_item_status_cd`
order_item과 독립적으로 공존. claim_qty ≤ order_qty − cancel_qty 범위에서 부분수량 클레임 가능.
claim_item 진행 중에도 order_item_status_cd는 유지되며, COMPLT 시 cancel_qty · item_cancel_amt가 누적된다.

| 항목 | REQUESTED<br>요청 | APPROVED<br>승인 | IN_PICKUP<br>수거중 | PROCESSING<br>검수중 | IN_TRANSIT<br>교환발송중 | COMPLT<br>완료 | REJECTED<br>거절 | CANCELLED<br>철회 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 취소 | O | O | - | - | - | O | O | O |
| 반품 | O | O | O | O | - | O | O | O |
| 교환 | O | O | O | - | O | O | O | O |
| 비고 | 클레임 항목<br>신청 접수. 초기값 | 관리자 승인 | 수거 진행 중<br>(취소는 물리적<br>수거 없음) | 반품 입고 후 검수<br>(반품 전용) | 교환상품 배송 중<br>(교환 전용) | 처리 완료.<br>cancel_qty · item_cancel_amt<br>누적 | 해당 항목 클레임 불가<br>(기한초과·불가상품 등) | 고객이 해당 항목<br>클레임 취소 |

---

### 1-C. 주문 집계 상태 — `od_order.order_status_cd`
order_item 상태의 집계 요약. 빠른 목록 조회·필터 전용이며 소스 오브 트루스는 아님.
부분취소·부분반품 진행 중에는 잔여 활성 item의 가장 앞선 상태를 반영한다.

| 항목 | PENDING<br>결제대기 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPED<br>배송중 | COMPLT<br>완료 | CANCELLED<br>취소완료 | RETURNED<br>반품완료 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | O  | O  | -  | -  |
| 취소 | - | - | - | -  | -  | O  | -  |
| 반품 | - | - | - | -  | -  | -  | O  |
| 교환 | - | - | - | O  | O  | -  | -  |
| 비고 | 주문 생성.<br>24시간 내 미결제 시<br>자동 취소 | 결제 승인 완료 | 1개 이상 item<br>PREPARING 상태 | 1개 이상 item SHIPPING<br>또는 교환상품 발송 중 | 전체 item DELIVERED 이상.<br>교환 완료 후 최종 상태 | 전체 item 취소 완료<br>(cancel_qty = order_qty) | 전체 item<br>반품 완료 |

---

### 1-D. 결제 상태 — `od_pay.pay_status_cd`
od_order 단위로 생성되는 결제 레코드 상태. 교환 가격차 추가결제는 신규 od_pay 레코드를 생성한다.
부분환불 흐름: COMPLT → PARTIAL_REFUND (부분) → REFUNDED (전액 완료 시).

| 항목 | PENDING<br>결제대기 | COMPLT<br>결제완료 | FAILED<br>결제실패 | CANCELLED<br>결제취소 | PARTIAL_REFUND<br>부분환불 | REFUNDED<br>전액환불 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | -  | -  | -  |
| 취소 | - | - | - | O  | O  | O  |
| 반품 | - | - | - | -  | O  | O  |
| 교환 | - | O | - | -  | O  | -  |
| 비고 | 결제 요청 후<br>PG 승인 대기 | 결제 승인 완료.<br>교환 추가결제 완료 | PG 승인 실패 | 취소에 의한<br>전액 결제 취소 | 부분취소·부분반품·<br>교환 가격차 환불 완료 | 전액 환불 완료<br>(전체 취소·전체 반품) |

---

### 1-E. 배송 상태 — `od_dliv.dliv_status_cd`
출고(OUTBOUND)·반품·교환 수거(INBOUND) 배송 모두 이 코드를 공통으로 사용한다.
`dliv_div_cd`(OUTBOUND/INBOUND)와 `dliv_type_cd`(NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)로 방향·유형을 구분.

| 항목 | READY<br>출고준비 | PICKED<br>픽업완료 | IN_TRANSIT<br>배송중 | DELIVERED<br>배송완료 | RETURN_REQ<br>반품요청 | RETURNED<br>수거완료 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O  | O  | -  | -  |
| 취소 | - | - | -  | -  | -  | -  |
| 반품 | - | O | O  | -  | O  | O  |
| 교환 | O | O | O  | O  | O  | O  |
| 비고 | 출고 준비 중.<br>교환상품 출고 준비 | 택배사 픽업 완료.<br>반품·교환 수거 픽업 | 택배사 배송 진행.<br>반품 수거 이동.<br>교환상품 발송 | 수령자 인수 완료.<br>교환상품 수령 완료 | 반품·교환<br>수거 요청 접수 | 반품·교환 상품<br>입고 완료 |

---

## 2. 상관관계표

**표 읽는 법**
- **O** = 두 상태가 DB에서 동시에 유효하게 존재 가능 / **-** = 해당 조합 불가
- **O\*** = 부분 클레임 완료 (cancel_qty < order_qty, order_item 상태 유지)
- **O\*\*** = 전량 클레임 완료 (cancel_qty = order_qty, order_item → CANCELLED)

---

### 2-A. 취소 클레임 — `order_item_status_cd`(가로) × `claim_item_status_cd`(세로)
취소 신청 가능 시점: ORDERED, PAID. PREPARING 진입 이후 취소 불가.
`IN_PICKUP` · `PROCESSING` · `IN_TRANSIT`은 취소 클레임에 존재하지 않는 단계.

| `claim_item_status_cd` | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED<br>요청       | O  | O  | -  | -  | -  | -  | -  |
| APPROVED<br>승인        | O  | O  | -  | -  | -  | -  | -  |
| IN_PICKUP<br>수거중     | -  | -  | -  | -  | -  | -  | -  |
| PROCESSING<br>검수중    | -  | -  | -  | -  | -  | -  | -  |
| IN_TRANSIT<br>교환발송중 | -  | -  | -  | -  | -  | -  | -  |
| COMPLT<br>완료          | O* | O* | -  | -  | -  | -  | O**|
| REJECTED<br>거절        | O  | O  | -  | -  | -  | -  | -  |
| CANCELLED<br>철회       | O  | O  | -  | -  | -  | -  | -  |

---

### 2-B. 반품 클레임 — `order_item_status_cd`(가로) × `claim_item_status_cd`(세로)
반품 신청 가능 시점: DELIVERED, CONFIRMED (배송완료 후 30일 이내).
`IN_TRANSIT`은 교환 전용 단계로 반품 클레임에 존재하지 않음.

| `claim_item_status_cd` | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED<br>요청       | -  | -  | -  | -  | O  | O  | -  |
| APPROVED<br>승인        | -  | -  | -  | -  | O  | O  | -  |
| IN_PICKUP<br>수거중     | -  | -  | -  | -  | O  | O  | -  |
| PROCESSING<br>검수중    | -  | -  | -  | -  | O  | O  | -  |
| IN_TRANSIT<br>교환발송중 | -  | -  | -  | -  | -  | -  | -  |
| COMPLT<br>완료          | -  | -  | -  | -  | O* | O* | O**|
| REJECTED<br>거절        | -  | -  | -  | -  | O  | O  | -  |
| CANCELLED<br>철회       | -  | -  | -  | -  | O  | O  | -  |

---

### 2-C. 교환 클레임 — `order_item_status_cd`(가로) × `claim_item_status_cd`(세로)
교환 신청 가능 시점: DELIVERED, CONFIRMED (배송완료 후 30일 이내).
`PROCESSING`은 반품 전용 단계. COMPLT 후 원 order_item 상태 유지, 교환상품은 신규 order_item으로 생성.

| `claim_item_status_cd` | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| REQUESTED<br>요청       | -  | -  | -  | -  | O  | O  | -  |
| APPROVED<br>승인        | -  | -  | -  | -  | O  | O  | -  |
| IN_PICKUP<br>수거중     | -  | -  | -  | -  | O  | O  | -  |
| PROCESSING<br>검수중    | -  | -  | -  | -  | -  | -  | -  |
| IN_TRANSIT<br>교환발송중 | -  | -  | -  | -  | O  | O  | -  |
| COMPLT<br>완료          | -  | -  | -  | -  | O  | O  | -  |
| REJECTED<br>거절        | -  | -  | -  | -  | O  | O  | -  |
| CANCELLED<br>철회       | -  | -  | -  | -  | O  | O  | -  |

---

### 2-D. 종합 매트릭스 — `order_item_status_cd`(가로) × 액션 · `pay_status_cd` · `dliv_status_cd`
order_item 각 상태에서 가능한 액션과 연관 pay/dliv 상태를 한눈에 확인.
PREPARING 이후 취소 불가. DELIVERED 후 7일 경과 시 자동 CONFIRMED (클레임 진행 중이면 보류).

| 항목 | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 취소 신청        | O   | O   | -   | -   | -   | -    | -   |
| 반품 신청        | -   | -   | -   | -   | O   | O†   | -   |
| 교환 신청        | -   | -   | -   | -   | O   | O†   | -   |
| 구매확정         | -   | -   | -   | -   | O   | -    | -   |
| `pay_status_cd`  | PENDING<br>결제대기 | COMPLT<br>결제완료 | COMPLT<br>결제완료 | COMPLT<br>결제완료 | COMPLT<br>결제완료 | COMPLT<br>결제완료 | REFUNDED·CANCELLED<br>전액환불·결제취소 |
| `dliv_status_cd` | -   | -   | READY<br>출고준비 | PICKED·IN_TRANSIT<br>픽업·배송중 | DELIVERED<br>배송완료 | DELIVERED<br>배송완료 | - |

- **O** = 해당 order_item 상태에서 액션 가능
- **O†** = 가능 (배송완료 후 30일 이내)
- **-** = 불가 또는 해당 없음

---

## 변경이력

- 2026-04-18: 초기 작성 — 5개 상태 코드 표 + 4개 상관관계표
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 plain text 전환
