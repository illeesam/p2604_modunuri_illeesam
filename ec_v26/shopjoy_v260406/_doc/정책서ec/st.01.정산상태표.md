<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# st.01. 정산 상태 코드 표

정산 도메인 전체 상태·분류 코드를 한 곳에서 조회하는 참조 문서.
상세 정책은 st.02~st.05를 참조하세요.

---

## 1. 상태 코드 표

### 1-A. 정산 마감 상태 — `st_settle_close.settle_status_cd`
월별 정산 마감의 진행 단계를 나타내는 상태. DRAFT → CONFIRMED → CLOSED → PAID 순으로 전이.
CONFIRMED 이후에는 수정 불가. PAID 이후 ERP 전표 생성 및 지급 처리가 진행된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| DRAFT     | 작성중   | 집계 작성 중. 수정 가능 |
| CONFIRMED | 확정     | 정산액 확정 완료. 이의신청 대기 |
| CLOSED    | 마감     | 정산 마감 처리 완료. 변경 불가 |
| PAID      | 지급완료 | 업체 계좌 송금 완료 |

---

### 1-B. 정산 지급 상태 — `st_settle_pay.settle_pay_status_cd`
CLOSED 이후 생성되는 지급 처리 건의 상태. FAILED 시 계좌 확인 후 재처리 필요.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PENDING | 지급대기 | 지급 처리 전. CLOSED 이후 생성 |
| COMPLT  | 지급완료 | 업체 계좌 송금 완료 |
| FAILED  | 지급실패 | 계좌 오류 등 지급 실패. 재처리 필요 |

---

### 1-C. 수집원장 유형 — `st_settle_raw.raw_type_cd`
정산 집계의 원천 데이터 유형. 주문·취소·반품·교환·배송비별로 구분하여 수집.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ORDER    | 주문   | 정상 주문 매출 |
| CANCEL   | 취소   | 주문 취소 차감 |
| RETURN   | 반품   | 반품 환불 차감 |
| EXCHANGE | 교환   | 교환 처리 조정 |
| SHIP     | 배송비 | 배송비 수익·차감 |

---

### 1-D. ERP 전표 전송 상태 — `st_erp_voucher.erp_status_cd`
ERP 시스템으로 전표 전송 및 수신 확인 상태. FAILED 시 재전송 처리 필요.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PENDING   | 대기   | 전표 생성, 전송 대기 중 |
| SENT      | 전송됨 | ERP 시스템으로 전송 완료 |
| CONFIRMED | 확인됨 | ERP 측 수신·대사 완료 |
| FAILED    | 실패   | 전송 오류. 재전송 필요 |

---

## 2. 상관관계표

### 2-A. 정산 프로세스 단계별 상태 — 단계(기준) × `settle_status_cd` · `settle_pay_status_cd` · `erp_status_cd`
정산 전체 프로세스에서 각 상태 컬럼의 값 흐름을 단계별로 정리.
CONFIRMED 이후 수정 불가. 지급 실패 시 CLOSED 상태에서 재처리.

| 단계 | `settle_status_cd` | `settle_pay_status_cd` | `erp_status_cd` | 수정 가능 |
|:---|:---:|:---:|:---:|:---:|
| 1. 수집·집계 중  | DRAFT     | -       | -         | ✅ |
| 2. 정산액 확정   | CONFIRMED | -       | -         | ❌ |
| 3. 마감 처리     | CLOSED    | PENDING | -         | ❌ |
| 4. ERP 전표 전송 | CLOSED    | PENDING | SENT      | ❌ |
| 5. 지급 처리     | PAID      | COMPLT  | CONFIRMED | ❌ |
| 지급 실패 시     | CLOSED    | FAILED  | SENT      | ❌ |

---

### 2-B. 정산 원천 도메인 연결 — `raw_type_cd`(기준) × 원천 테이블 · 연결 상태코드
수집원장 각 유형이 참조하는 원천 테이블과 집계 기준 상태를 정리.
모든 집계는 완료(COMPLT/CONFIRMED/DELIVERED) 상태 기준으로 수집.

| `raw_type_cd` | 원천 테이블 | 연결 상태코드 | 비고 |
|:---|:---|:---|:---|
| ORDER<br>주문    | `od_order_item` | `order_item_status_cd` = CONFIRMED | 구매확정 기준 집계 |
| CANCEL<br>취소   | `od_claim_item` | `claim_item_status_cd` = COMPLT, CANCEL  | 취소 완료 |
| RETURN<br>반품   | `od_claim_item` | `claim_item_status_cd` = COMPLT, RETURN  | 반품 완료 |
| EXCHANGE<br>교환 | `od_claim_item` | `claim_item_status_cd` = COMPLT, EXCHANGE | 교환 완료 |
| SHIP<br>배송비   | `od_dliv`       | `dliv_status_cd` = DELIVERED | 배송 완료 |

---

## 변경이력

- 2026-04-18: 초기 작성
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 추가
