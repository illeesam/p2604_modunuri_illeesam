# st.01. 정산 상태 코드 표

> 정산 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
> 상세 정책은 st.02~st.05를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. `st_settle_close.settle_status_cd` — 정산 마감 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT     | 작성중 | 집계 작성 중. 수정 가능 |
| CONFIRMED | 확정   | 정산액 확정 완료. 이의신청 대기 |
| CLOSED    | 마감   | 정산 마감 처리 완료. 변경 불가 |
| PAID      | 지급완료 | 업체 계좌 송금 완료 |

> 상태 전이: DRAFT → CONFIRMED → CLOSED → PAID

---

### 1-B. `st_settle_pay.settle_pay_status_cd` — 정산 지급 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PENDING | 지급대기 | 지급 처리 전. CLOSED 이후 생성 |
| COMPLT  | 지급완료 | 업체 계좌 송금 완료 |
| FAILED  | 지급실패 | 계좌 오류 등 지급 실패. 재처리 필요 |

---

### 1-C. `st_settle_raw.raw_type_cd` — 수집원장 유형

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ORDER   | 주문  | 정상 주문 매출 |
| CANCEL  | 취소  | 주문 취소 차감 |
| RETURN  | 반품  | 반품 환불 차감 |
| EXCHANGE | 교환 | 교환 처리 조정 |
| SHIP    | 배송비 | 배송비 수익·차감 |

---

### 1-D. `st_erp_voucher.erp_status_cd` — ERP 전표 전송 상태

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PENDING  | 대기   | 전표 생성, 전송 대기 중 |
| SENT     | 전송됨 | ERP 시스템으로 전송 완료 |
| CONFIRMED | 확인됨 | ERP 측 수신·대사 완료 |
| FAILED   | 실패   | 전송 오류. 재전송 필요 |

---

## 2. 상관관계표

### 2-A. 정산 프로세스 단계별 상태 매트릭스

| 단계 | `settle_status_cd` | `settle_pay_status_cd` | `erp_status_cd` | 수정 가능 |
|:---|:---:|:---:|:---:|:---:|
| 1. 수집·집계 중      | DRAFT     | -       | -        | ✅ |
| 2. 정산액 확정       | CONFIRMED | -       | -        | ❌ |
| 3. 마감 처리         | CLOSED    | PENDING | -        | ❌ |
| 4. ERP 전표 전송     | CLOSED    | PENDING | SENT     | ❌ |
| 5. 지급 처리         | PAID      | COMPLT  | CONFIRMED | ❌ |
| 지급 실패 시         | CLOSED    | FAILED  | SENT     | ❌ |

---

### 2-B. 정산 관련 원천 도메인 연결

| `raw_type_cd` | 원천 테이블 | 연결 상태코드 | 비고 |
|:---|:---|:---|:---|
| ORDER   | `od_order_item`  | `order_item_status_cd` = CONFIRMED | 구매확정 기준 집계 |
| CANCEL  | `od_claim_item`  | `claim_item_status_cd` = COMPLT, claim_type=CANCEL | 취소 완료 |
| RETURN  | `od_claim_item`  | `claim_item_status_cd` = COMPLT, claim_type=RETURN | 반품 완료 |
| EXCHANGE | `od_claim_item` | `claim_item_status_cd` = COMPLT, claim_type=EXCHANGE | 교환 완료 |
| SHIP    | `od_dliv`        | `dliv_status_cd` = DELIVERED | 배송 완료 |

---

## 변경이력

- 2026-04-18: 초기 작성
