<style>
table { width: 100%; border-collapse: collapse; }
th, td { word-break: keep-all; overflow-wrap: break-word; white-space: normal; vertical-align: top; }
</style>

# od.01. 주문·클레임·배송·결제 상태 코드 통합 표

주문 도메인 전체 상태 코드를 한 곳에서 조회하고 테이블 간 상관관계를 매트릭스로 정리한 참조용 문서.
상세 정책은 각 도메인 정책서(od.02~od.07)를 참조하세요.

---

## 1. 상태 코드 표

#### 주문 — `od_order` · `od_order_item`

### 1-A. 주문 집계 상태 — `od_order.order_status_cd`
order_item 상태의 집계 요약. 빠른 목록 조회·필터 전용이며 소스 오브 트루스는 아님.
부분취소·부분반품 진행 중에는 잔여 활성 item의 가장 앞선 상태를 반영한다.

| 항목 | PENDING<br>결제대기 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPED<br>배송중 | COMPLT<br>완료 | CANCELLED<br>취소완료 | RETURNED<br>반품완료 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | O  | O  | -  | -  |
| 취소 | - | - | - | -  | -  | O  | -  |
| 반품 | - | - | - | -  | -  | -  | O  |
| 교환 | - | - | - | O  | O  | -  | -  |
| 비고 | 주문 생성.<br>24시간 내 미결제 시<br>자동 취소 | 결제 승인 완료 | 1개 이상 item<br>PREPARING 상태 | 1개 이상 item SHIPPING<br>또는 교환상품 발송 중 | 전체 item DELIVERED 이상.<br>교환 완료 후 최종 상태 | 전체 item 취소 완료<br>(cancel_qty = order_qty) | 전체 item<br>반품 완료 |

**주요 컬럼**
- `order_id` — 주문ID (YYMMDDhhmmss+rand4)
- `member_id` / `member_nm` — 회원ID · 주문자명
- `order_date` — 주문일시
- `total_amt` — 상품합계금액
- `discount_amt` / `coupon_discount_amt` / `cache_use_amt` — 할인·쿠폰할인·적립금 사용금액
- `pay_amt` — 실결제금액 (total_amt − 할인 합계)
- `pay_method_cd` / `pay_date` — 결제수단·결제일시 (od_pay 상세는 별도 레코드)
- `order_status_cd` / `order_status_cd_before` — 현재·변경 전 주문 집계 상태 (소스 오브 트루스 아님 — 목록 조회 전용)
- `recv_nm` / `recv_phone` / `recv_zip` / `recv_addr` / `recv_memo` — 수령자 배송지 정보
- `coupon_id` — 사용쿠폰ID
- `outbound_shipping_fee` — 출고배송료
- `dliv_courier_cd` / `dliv_tracking_no` / `dliv_status_cd` / `dliv_ship_date` — 최근 출고 택배사·송장·배송상태·출고일시 (부분배송 시 최신 기준)
- `appr_status_cd` / `appr_amt` / `appr_target_cd` / `appr_req_user_id` / `appr_aprv_user_id` — 결재처리·추가결재요청 관련 (관리자 일괄작업)

**COMPLT** 진입 조건: 모든 활성 item(cancel_qty < order_qty인 item 내 잔여 수량)이 CONFIRMED 이상인 경우. cancel_qty = order_qty가 된 item(취소·반품 완료)은 활성 집계에서 제외된다.
- 예) item①(2개 중 1개 취소·1개 CONFIRMED) + item②(CONFIRMED) + item③(전량 취소) → **COMPLT** (활성 item인 ①잔여·②가 모두 CONFIRMED)
- 예) item 전체 CONFIRMED, 일부 반품 완료(cancel_qty = order_qty) + 나머지 CONFIRMED → **COMPLT**

**CANCELLED** 진입 조건: 주문 내 모든 item의 cancel_qty = order_qty이며, 전량이 취소 클레임 경로로만 처리된 경우.
- 예) 전체 item 결제 전(ORDERED·PAID) 취소, 또는 PREPARING 진입 전 전량 취소
- 예) item①(전량 취소) + item②(전량 취소) → **CANCELLED**

**RETURNED** 진입 조건: 주문 내 모든 활성 item이 반품 클레임 COMPLT를 통해 cancel_qty = order_qty로 전환된 경우.
- 예) 전체 item 배송 후 반품 완료 → **RETURNED**
- 예) item①(미배송 취소) + item②(배송 후 반품 완료) → **RETURNED** (반품 종결 우선)

---

### 1-B. 주문 품목 상태 (소스 오브 트루스) — `od_order_item.order_item_status_cd`
주문 흐름 전용 상태 코드. 클레임 진행 중에도 이 컬럼은 주문 흐름 상태를 유지한다.
`cancel_qty = order_qty` 달성 시에만 CANCELLED로 전환되며, 교환 완료 시 원 item은 변동 없음.

| 항목 | ORDERED<br>주문완료 | PAID<br>결제완료 | PREPARING<br>배송준비중 | SHIPPING<br>배송중 | DELIVERED<br>배송완료 | CONFIRMED<br>구매확정 | CANCELLED<br>전량취소 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | O  | O  | O  | -  |
| 취소 | - | - | - | -  | -  | -  | O  |
| 반품 | - | - | - | -  | -  | -  | O  |
| 교환 | - | - | - | O  | O  | O  | -  |
| 비고 | 초기값.<br>결제 대기 중 | 결제 승인 완료 | 판매자 출고<br>준비 시작 | 송장번호 등록.<br>교환상품 신규 item도<br>이 상태 통과 | 택배사 배송완료 스캔.<br>교환상품 수령 완료 | 고객 수동 확정 또는<br>배송완료 7일 후<br>자동 확정 | cancel_qty = order_qty 시.<br>취소·반품 완료<br>모두 해당 |

**주요 컬럼**
- `order_item_id` — 주문상품ID (YYMMDDhhmmss+rand4)
- `order_id` — 주문ID (od_order 참조)
- `prod_id` / `sku_id` — 상품ID · SKU ID (무옵션 시 NULL)
- `opt_id_1` / `opt_id_2` — 옵션1·옵션2 값ID (pd_prod_opt_item 참조)
- `unit_price` — 판매가 단가 (옵션 추가금액 포함)
- `order_qty` — 주문수량
- `item_order_amt` — 주문금액 (unit_price × order_qty)
- `cancel_qty` — 취소수량 (클레임 COMPLT 시 누적. cancel_qty = order_qty이면 CANCELLED 전환)
- `item_cancel_amt` — 취소금액 (클레임으로 인한 누적 취소액)
- `complet_qty` / `item_completed_amt` — 판매완료수량 · 완료금액 (item_order_amt − item_cancel_amt)
- `order_item_status_cd` / `order_item_status_cd_before` — 현재·변경 전 품목 주문상태
- `outbound_shipping_fee` — 해당 항목의 배송료 (부분배송 시 항목별 배분)
- `dliv_courier_cd` / `dliv_tracking_no` / `dliv_ship_date` — 택배사·송장번호·출고일시 (부분배송 시 항목별 기록)

**참고: 반품·교환 진행 중 order_item 상태 코드 (claim_item 병행 관리)**
order_item_status_cd는 주문 흐름 전용이며, 반품·교환 진행 중에도 해당 상태를 유지한다.
반품·교환의 상세 진행 상태는 `od_claim_item.claim_item_status_cd`에서 독립 관리된다.
아래는 claim_item 흐름에서 사용하는 반품·교환 관련 상태 코드 참조.

| 코드값 | 코드라벨 | 사용 흐름 | 비고 |
|--------|---------|----------|------|
| RETURN_REQ | 반품요청 | 반품 클레임 | od_claim_item REQUESTED 단계 (반품 신청 접수) |
| RETURNING | 반품중 | 반품 클레임 | od_claim_item IN_PICKUP·PROCESSING 단계 (수거 및 검수 진행 중) |
| RETURNED | 반품완료 | 반품 클레임 | od_claim_item COMPLT 단계 (환불 확정, cancel_qty 누적) |
| EXCHANGE_COMPLT | 교환완료 | 교환 클레임 | od_claim_item COMPLT 단계 (교환상품 수령 완료, 전량 교환) |
| PARTIAL_EXCHANGE_COMPLT | 부분교환완료 | 교환 클레임 | od_claim_item COMPLT 단계 (일부 수량 교환 완료, 잔여 수량 활성) |

> 위 코드들은 `od_claim_item.claim_item_status_cd` 및 관련 집계 용도로 사용되며, `od_order_item.order_item_status_cd`에는 직접 기록되지 않는다.
> order_item의 CANCELLED 전환은 cancel_qty = order_qty 달성 시에만 발생한다.

---

**CONFIRMED 진입 경우의 수 (클레임 부분처리 포함)**
- **전량 정상 확정**: 취소·반품 없이 전체 수량 DELIVERED 후 수동 확정 또는 7일 자동 확정
- **부분 취소 후 잔여 확정**: cancel_qty > 0 & cancel_qty < order_qty 상태에서 잔여 수량 CONFIRMED (cancel_qty·item_cancel_amt 누적 유지)
- **부분 반품 후 잔여 확정**: 일부 수량 반품 COMPLT(cancel_qty 누적) 후 잔여 수량 CONFIRMED
- **교환 완료 후 원 item 유지**: 교환 클레임 COMPLT 시 원 order_item_status_cd는 CONFIRMED 그대로 유지. 교환 상품은 신규 order_item으로 생성
- **자동 확정 보류**: DELIVERED 후 7일 경과해도 claim_item 진행 중이면 자동 CONFIRMED 보류 → 클레임 종결(COMPLT·REJECTED·CANCELLED) 후 잔여 7일 재산정

---

#### 클레임 — `od_claim` · `od_claim_item`

### 1-C. 클레임 집계 상태 — `od_claim.claim_status_cd`
od_claim 헤더 레코드의 전체 진행 상태. 소스 오브 트루스는 `od_claim_item.claim_item_status_cd`이며,
클레임 전체가 완료·거절·철회될 때 이 컬럼이 갱신된다. IN_TRANSIT은 item 단위 교환 발송 상태이므로 클레임 집계에는 존재하지 않음.

| 항목 | REQUESTED<br>요청 | APPROVED<br>승인 | IN_PICKUP<br>수거중 | PROCESSING<br>검수중 | COMPLT<br>완료 | REJECTED<br>거절 | CANCELLED<br>철회 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 취소 | O | O | -  | -  | O | O | O |
| 반품 | O | O | O  | O  | O | O | O |
| 교환 | O | O | O  | -  | O | O | O |
| 비고 | 클레임 접수.<br>초기값 | 관리자 승인 | 수거 진행 중<br>(반품·교환) | 반품 입고 후<br>검수 (반품 전용) | 모든 claim_item<br>처리 완료 | 클레임 거절 | 고객 클레임<br>전체 철회 |

**주요 컬럼**
- `claim_id` — 클레임ID (YYMMDDhhmmss+rand4)
- `order_id` — 주문ID (od_order 참조)
- `member_id` / `member_nm` — 회원ID · 회원명
- `claim_type_cd` — 클레임유형 (CANCEL·RETURN·EXCHANGE)
- `claim_status_cd` / `claim_status_cd_before` — 현재·변경 전 클레임 집계 상태
- `reason_cd` / `reason_detail` — 사유코드 · 사유 상세
- `refund_method_cd` / `refund_amt` — 환불수단 · 환불금액 (COMPLT 시 확정)
- `request_date` / `proc_date` / `proc_user_id` — 요청일시 · 처리일시 · 처리자
- `return_shipping_fee` / `return_courier_cd` / `return_tracking_no` / `return_status_cd` — 수거배송료·택배사·송장·수거상태 (반품·교환)
- `inbound_shipping_fee` / `inbound_courier_cd` / `inbound_tracking_no` / `inbound_dliv_id` — 반입배송료·택배사·송장·배송ID (반품)
- `exchange_shipping_fee` / `exchange_courier_cd` / `exchange_tracking_no` / `outbound_dliv_id` — 교환상품 발송배송료·택배사·송장·배송ID (교환)
- `total_shipping_fee` / `shipping_fee_paid_yn` — 총 배송료 · 정산 완료 여부
- `appr_status_cd` / `appr_amt` / `appr_target_cd` / `appr_req_user_id` / `appr_aprv_user_id` — 결재처리·추가결재요청 관련

---

### 1-D. 클레임 품목 상태 (소스 오브 트루스) — `od_claim_item.claim_item_status_cd`
order_item과 독립적으로 공존. claim_qty ≤ order_qty − cancel_qty 범위에서 부분수량 클레임 가능.
claim_item 진행 중에도 order_item_status_cd는 유지되며, COMPLT 시 cancel_qty · item_cancel_amt가 누적된다.

| 항목 | REQUESTED<br>요청 | APPROVED<br>승인 | IN_PICKUP<br>수거중 | PROCESSING<br>검수중 | IN_TRANSIT<br>교환발송중 | COMPLT<br>완료 | REJECTED<br>거절 | CANCELLED<br>철회 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 취소 | O | O | - | - | - | O | O | O |
| 반품 | O | O | O | O | - | O | O | O |
| 교환 | O | O | O | - | O | O | O | O |
| 비고 | 클레임 항목<br>신청 접수. 초기값 | 관리자 승인 | 수거 진행 중<br>(취소는 물리적<br>수거 없음) | 반품 입고 후 검수<br>(반품 전용) | 교환상품 배송 중<br>(교환 전용) | 처리 완료.<br>cancel_qty · item_cancel_amt<br>누적 | 해당 항목 클레임 불가<br>(기한초과·불가상품 등) | 고객이 해당 항목<br>클레임 취소 |

**주요 컬럼**
- `claim_item_id` — 클레임항목ID (YYMMDDhhmmss+rand4)
- `claim_id` — 클레임ID (od_claim 참조)
- `order_item_id` — 원 주문상품ID (od_order_item 참조)
- `prod_nm` / `prod_option` — 상품명·옵션 (주문시점 스냅샷 — 상품 변경과 무관하게 원 주문 기준 보존)
- `unit_price` — 판매가 단가
- `claim_qty` — 클레임 수량 (≤ order_qty − cancel_qty 범위에서 부분 신청 가능)
- `item_amt` — 클레임금액 (unit_price × claim_qty)
- `refund_amt` — 환불금액 (COMPLT 시 확정)
- `claim_item_status_cd` / `claim_item_status_cd_before` — 현재·변경 전 클레임항목 상태
- `return_shipping_fee` — 수거배송료 (반품·교환 수거 시)
- `inbound_shipping_fee` — 반입배송료 (판매자 창고 입고 시)
- `exchange_shipping_fee` — 교환상품 발송배송료

**상태별 경우의 수**
- **REQUESTED**: 취소(order_item이 ORDERED·PAID), 반품·교환(DELIVERED·CONFIRMED, 30일 이내). claim_qty ≤ order_qty − cancel_qty 범위에서 부분 수량 신청 가능
- **APPROVED**: 관리자 수동 승인. 취소는 환불 즉시 진행(→ COMPLT), 반품·교환은 수거 단계(→ IN_PICKUP) 이동
- **IN_PICKUP**: 반품·교환 전용. 택배사 수거 요청 접수 후 픽업 완료 전까지. 취소는 물리적 수거 없으므로 이 단계 없음
- **PROCESSING**: 반품 전용. 수거 상품 입고 후 상태 검수 중. 검수 통과 → COMPLT(환불), 불량·훼손 → REJECTED
- **IN_TRANSIT**: 교환 전용. 수거 완료 후 교환 상품 발송 중. 신규 order_item(SHIPPING) 생성과 동시 진행
- **COMPLT 부분(O\*)**: claim_qty < 잔여 활성 수량. cancel_qty·item_cancel_amt 부분 누적, order_item_status_cd 현재 상태 유지
- **COMPLT 전량(O\*\*)**: 누적 cancel_qty = order_qty 달성. order_item_status_cd → CANCELLED 전환
- **REJECTED**: 기한 초과(반품·교환 30일) / 불가 상품 유형(DIGITAL·개봉 FOOD 등) / 반품 검수 불량(파손·훼손) / 관리자 수동 거절
- **CANCELLED**: 고객이 클레임 항목 직접 철회. REQUESTED·APPROVED 단계에서만 가능. IN_PICKUP 진입 후 철회 불가

---

#### 결제 — `od_pay`

### 1-E. 결제 상태 — `od_pay.pay_status_cd`
od_order 단위로 생성되는 결제 레코드 상태. 교환 가격차 추가결제는 신규 od_pay 레코드를 생성한다.
부분환불 흐름: COMPLT → PARTIAL_REFUND (부분) → REFUNDED (전액 완료 시).

| 항목 | PENDING<br>결제대기 | COMPLT<br>결제완료 | FAILED<br>결제실패 | CANCELLED<br>결제취소 | PARTIAL_REFUND<br>부분환불 | REFUNDED<br>전액환불 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O | -  | -  | -  |
| 취소 | - | - | - | O  | O  | O  |
| 반품 | - | - | - | -  | O  | O  |
| 교환 | - | O | - | -  | O  | -  |
| 비고 | 결제 요청 후<br>PG 승인 대기 | 결제 승인 완료.<br>교환 추가결제 완료 | PG 승인 실패 | 취소에 의한<br>전액 결제 취소 | 부분취소·부분반품·<br>교환 가격차 환불 완료 | 전액 환불 완료<br>(전체 취소·전체 반품) |

**주요 컬럼**
- `pay_id` — 결제ID (YYMMDDhhmmss+rand4). 주문당 N건 생성 가능 (분할결제·교환 추가결제)
- `order_id` — 주문ID (od_order 참조. order_item_id는 없음 — 결제는 주문 단위로 생성)
- `pay_method_cd` — 결제수단 코드 (BANK_TRANSFER·VBANK·TOSS·KAKAO·NAVER·MOBILE)
- `pay_channel_cd` — 결제채널 (TOSS 이용 시 세부 채널: CARD·ACCOUNT·KAKAO·NAVER)
- `pay_amt` — 결제 금액 (BIGINT)
- `pay_status_cd` / `pay_status_cd_before` — 현재·변경 전 결제상태
- `pay_date` — 결제 완료일시 (COMPLT 전환 시 기록)
- `pg_company_cd` / `pg_transaction_id` / `pg_approval_no` — PG사·PG 거래ID·PG 승인번호
- `pg_response` — PG 응답 원문 JSON (오류 추적·재처리 시 참조)
- `vbank_account` / `vbank_due_date` / `vbank_deposit_date` — 가상계좌 계좌번호·입금기한·입금확인일시
- `card_no` / `card_issuer_nm` / `installment_month` — 카드번호(마스킹)·카드사명·할부개월수 (0=일시불)
- `refund_amt` — 환불 금액 (부분환불 시 누적. 전액 환불 완료 시 pay_amt와 일치)
- `refund_status_cd` / `refund_date` / `refund_reason` — 환불 상태·완료일시·사유 (PENDING·COMPLT·FAILED)
- `failure_reason` / `failure_code` / `failure_date` — 결제 실패 사유·PG 오류코드·실패일시

---

### 1-F. 환불 상태 — `od_pay.refund_status_cd`
결제 레코드(`od_pay`) 내 환불 처리 상태. `pay_status_cd`가 PARTIAL_REFUND·REFUNDED로 전환될 때 함께 갱신된다.

| 항목 | PENDING<br>환불대기 | COMPLT<br>환불완료 | FAILED<br>환불실패 |
|:---|:---:|:---:|:---:|
| 취소 | O | O | O |
| 반품 | O | O | O |
| 교환 | O | O | O |
| 비고 | 환불 요청 접수.<br>PG 처리 대기 | 환불 승인 완료.<br>refund_date 기록 | PG 환불 실패.<br>수동 재처리 필요 |

---

### 1-G. 결제수단 — `od_pay.pay_method_cd`
고객이 선택한 결제수단. TOSS는 PG사 이름이며 실제 수단은 `pay_channel_cd`로 세분화된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| BANK_TRANSFER | 무통장입금 | 계좌 직접 이체. 관리자 수동 입금 확인 |
| VBANK         | 가상계좌  | PG 발급 1회용 계좌. 입금 확인 자동화 |
| TOSS          | 토스페이먼츠 | PG사. 세부 수단은 pay_channel_cd 참조 |
| KAKAO         | 카카오페이 | 카카오 간편결제 |
| NAVER         | 네이버페이 | 네이버 간편결제 |
| MOBILE        | 핸드폰결제 | 통신사 소액결제 |

---

### 1-H. 결제채널 — `od_pay.pay_channel_cd`
`pay_method_cd = TOSS`일 때만 사용. 토스페이먼츠를 통해 결제되는 세부 수단.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| CARD    | 카드결제  | 신용·체크카드 (card_* 컬럼 사용) |
| ACCOUNT | 계좌이체  | 실시간 계좌이체 |
| KAKAO   | 카카오페이 | 토스 경유 카카오페이 |
| NAVER   | 네이버페이 | 토스 경유 네이버페이 |

---

### 1-I. 카드 유형 — `od_pay.card_type_cd`
카드 결제(`pay_channel_cd = CARD`) 시 카드 종류를 구분. PG 응답에서 자동 수신.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| CREDIT | 신용카드 | 후불 결제 |
| DEBIT  | 직불카드 | 즉시 출금 |
| CHECK  | 체크카드 | 즉시 출금 (은행 연계) |

---

#### 배송 — `od_dliv` · `od_dliv_item`

### 1-J. 배송 상태 — `od_dliv.dliv_status_cd`
출고(OUTBOUND)·반품·교환 수거(INBOUND) 배송 모두 이 코드를 공통으로 사용한다.
`dliv_div_cd`(OUTBOUND/INBOUND)와 `dliv_type_cd`(NORMAL/RETURN/EXCHANGE/EXCHANGE_OUT)로 방향·유형을 구분.

| 항목 | READY<br>출고준비 | PICKED<br>픽업완료 | IN_TRANSIT<br>배송중 | DELIVERED<br>배송완료 | RETURN_REQ<br>반품요청 | RETURNED<br>수거완료 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 주문 | O | O | O  | O  | -  | -  |
| 취소 | - | - | -  | -  | -  | -  |
| 반품 | - | O | O  | -  | O  | O  |
| 교환 | O | O | O  | O  | O  | O  |
| 비고 | 출고 준비 중.<br>교환상품 출고 준비 | 택배사 픽업 완료.<br>반품·교환 수거 픽업 | 택배사 배송 진행.<br>반품 수거 이동.<br>교환상품 발송 | 수령자 인수 완료.<br>교환상품 수령 완료 | 반품·교환<br>수거 요청 접수 | 반품·교환 상품<br>입고 완료 |

**주요 컬럼**
- `dliv_id` — 배송ID (YYMMDDhhmmss+rand4). 1주문 N건 생성 가능 (부분출고·반품·교환)
- `order_id` — 주문ID (od_order 참조)
- `claim_id` — 클레임ID (od_claim 참조. 클레임 배송일 때만 설정)
- `vendor_id` — 출고 업체ID (벤더별 분리출고 시)
- `recv_nm` / `recv_phone` / `recv_zip` / `recv_addr` — 수령자 배송지 (주문 시점 복사본)
- `dliv_div_cd` — 입출고구분 (OUTBOUND=출고 / INBOUND=반품·교환 수거 입고)
- `dliv_type_cd` — 배송유형 (NORMAL·RETURN·EXCHANGE·EXCHANGE_OUT)
- `outbound_courier_cd` / `outbound_tracking_no` — 출고(발송) 택배사·송장번호
- `inbound_courier_cd` / `inbound_tracking_no` — 반입 택배사·송장번호 (반품일 때만)
- `dliv_status_cd` / `dliv_status_cd_before` — 현재·변경 전 배송상태
- `dliv_ship_date` / `dliv_date` — 출고일시 · 배송완료일시
- `shipping_fee` / `shipping_fee_type_cd` — 배송료 · 배송료 구분 (OUTBOUND·RETURN·INBOUND·EXCHANGE)
- `parent_dliv_id` — 부모 배송ID (교환 시 원본 배송 참조)
- `appr_status_cd` / `appr_amt` / `appr_target_cd` / `appr_req_user_id` / `appr_aprv_user_id` — 결재처리·추가결재요청 관련 (관리자 일괄작업)

**주요 컬럼 — `od_dliv_item`** (배송에 포함된 주문상품 명세. 1 od_dliv → N od_dliv_item)
- `dliv_item_id` — 배송항목ID (YYMMDDhhmmss+rand4)
- `dliv_id` — 배송ID (od_dliv 참조)
- `order_item_id` — 주문상품ID (od_order_item 참조)
- `prod_id` / `opt_id_1` / `opt_id_2` — 상품ID · 옵션1·2 값ID
- `unit_price` — 단가 (주문시점 스냅샷)
- `dliv_qty` — 출고수량 (부분출고 시 order_qty보다 적을 수 있음 — 핵심 컬럼)
- `dliv_item_status_cd` / `dliv_item_status_cd_before` — 항목별 배송상태 (DLIV_STATUS 코드 공유)

> `site_id`·`dliv_type_cd`(OUT/IN)는 `od_dliv` JOIN으로 획득 가능한 중복 컬럼이므로 생략.

### 1-K. 입출고 구분 — `od_dliv.dliv_div_cd`
배송 레코드가 출고(발송) 방향인지 입고(수거·반입) 방향인지를 구분.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| OUTBOUND | 출고 | 판매자 → 고객 발송. 정상출고·교환상품 발송 |
| INBOUND  | 입고 | 고객 → 판매자 수거·반입. 반품·교환 수거 |

---

### 1-L. 배송 유형 — `od_dliv.dliv_type_cd`
배송의 목적·성격을 구분. `dliv_div_cd`와 함께 배송 레코드의 방향과 이유를 특정.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| NORMAL       | 정상출고  | 일반 주문 발송 (OUTBOUND) |
| RETURN       | 반품수거  | 반품 클레임 수거 (INBOUND) |
| EXCHANGE     | 교환수거  | 교환 클레임 수거 (INBOUND) |
| EXCHANGE_OUT | 교환발송  | 교환 상품 재발송 (OUTBOUND) |

---

### 1-M. 배송료 구분 — `od_dliv.shipping_fee_type_cd`
배송 레코드에 기록된 배송료가 어떤 성격의 배송료인지를 구분.
누가 부담하는지는 클레임 정책서(od.06~od.07)를 참조.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| OUTBOUND | 출고배송료 | 정상 출고 시 배송료. 주문금액에 포함되어 od_pay로 결제 |
| RETURN   | 반품수거료 | 반품 수거 배송료. 고객·판매자 부담 정책에 따라 배분 |
| INBOUND  | 반입배송료 | 반품 상품 판매자 창고 입고 배송료 |
| EXCHANGE | 교환발송료 | 교환 상품 재발송 배송료 |

> **배송료 결제여부 확인 방법**
> - **OUTBOUND (정상 출고)**: `od_order.outbound_shipping_fee`에 포함되어 주문 결제 시 `od_pay`로 함께 처리됨. `od_dliv`에 별도 결제여부 컬럼 없음
> - **RETURN·INBOUND·EXCHANGE (클레임 배송료)**: `od_dliv`에는 결제여부 컬럼이 없으며, **`od_claim.shipping_fee_paid_yn` / `shipping_fee_paid_date`** 에서 클레임 단위로 정산 완료 여부를 관리

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

---

## 3. 보조 코드 표

### 3-A. 환불 유형 — `od_refund.refund_type_cd`
od_refund 레코드가 어떤 사유로 생성되었는지를 구분. 클레임 처리 흐름에서 자동 설정된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| CANCEL  | 취소환불 | 주문 취소 클레임 처리 완료 후 환불 |
| RETURN  | 반품환불 | 반품 클레임 처리 완료 후 환불 |
| PARTIAL | 부분환불 | 부분 수량/금액 환불 (cancel_qty < order_qty) |
| EXTRA   | 추가환불 | 가격차·배송비 추가 환불 (교환 등) |

---

### 3-B. 귀책 사유 — `od_refund.fault_type_cd`
환불 처리 시 배송료·검수비용 부담 주체를 결정하는 귀책 구분.
클레임 사유 코드(`CLAIM_REASON`)와 연계하여 자동 판정하거나 관리자가 수동 설정한다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| CUST     | 고객귀책   | 단순변심·구매자 과실. 반품 배송료 고객 부담 |
| VENDOR   | 판매자귀책 | 상품 불량·오배송. 반품 배송료 판매자 부담 |
| PLATFORM | 플랫폼귀책 | 시스템·정책 오류. 플랫폼이 비용 부담 |

---

### 3-C. 결재 상태 — `od_order.appr_status_cd` / `od_dliv.appr_status_cd` / `od_claim.appr_status_cd`
관리자 일괄작업의 "추가결재요청" 기능에서 사용되는 내부 결재 흐름 상태.
주문·배송·클레임 각 엔티티에 동일한 코드를 공유한다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| REQ      | 결재요청 | 결재 요청 중. 결재권자 확인 대기 |
| APPROVED | 승인     | 결재 승인 완료 |
| REJECTED | 반려     | 결재 반려. 재요청 가능 |
| DONE     | 완료     | 결재 처리 완료 (실행 반영 완료) |

---

### 3-D. 결재 대상 — `od_order.appr_target_cd` / `od_dliv.appr_target_cd` / `od_claim.appr_target_cd`
추가결재 요청 시 결재 대상이 되는 업무 영역.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| ORDER | 주문     | 주문 관련 결재 (주문금액·취소 등) |
| PROD  | 상품     | 상품 관련 결재 |
| DLIV  | 배송     | 배송 관련 결재 (배송비 등) |
| EXTRA | 추가결제 | 배송비·가격차 추가결제 결재 |

---

### 3-E. 접근 채널 — `od_order.access_channel_cd`
고객이 주문을 생성한 진입 채널. 채널별 전환율·매출 분석에 활용된다.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| WEB_PC      | PC웹       | PC 브라우저 |
| WEB_MOBILE  | 모바일웹   | 모바일 브라우저 |
| APP_IOS     | iOS앱      | iOS 네이티브 앱 |
| APP_ANDROID | 안드로이드앱 | 안드로이드 앱 |

---

### 3-F. 배송비 결제 유형 — `od_dliv.dliv_pay_type_cd` / `pd_dliv_tmplt.dliv_pay_type_cd`
배송비를 발송 전에 결제하는지(선불) 수령 시 지불하는지(착불)를 구분.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| PREPAY | 선불 | 배송비 선불 (주문 결제 시 포함) |
| COD    | 착불 | 배송비 착불 (수령 시 지불) |

---

### 3-G. 배송 방법 — `pd_dliv_tmplt.dliv_method_cd`
배송 템플릿에 설정하는 물리적 배송 방식.

| 코드값 | 코드라벨 | 비고 |
|--------|---------|------|
| COURIER | 택배     | 택배사를 통한 배송 |
| DIRECT  | 직접배송 | 판매자가 직접 배송 |
| PICKUP  | 방문수령 | 고객이 직접 방문하여 수령 |

---

## 변경이력

- 2026-04-18: 초기 작성 — 5개 상태 코드 표 + 4개 상관관계표
- 2026-04-18: 헤딩 형식 변경 (타이틀 좌측·컬럼명 우측) + 설명 plain text 전환
- 2026-04-18: 1-F 클레임 집계 상태 (`od_claim.claim_status_cd`) 추가
- 2026-04-19: 3절 보조 코드 표 추가 — REFUND_TYPE·FAULT_TYPE·APPR_STATUS·APPR_TARGET·ACCESS_CHANNEL·DLIV_PAY_TYPE·DLIV_METHOD (DDL _cd 미정의 코드 보완)
- 2026-04-18: 섹션 순서 재배치 — 집계 상태를 품목 상태 앞으로 이동 (1-A:주문집계→1-B:주문품목, 1-C:클레임집계→1-D:클레임품목)
- 2026-04-18: od_pay 관련 코드 섹션 추가 (1-F:환불상태, 1-G:결제수단, 1-H:결제채널, 1-I:카드유형). 배송상태 1-F→1-J
- 2026-04-18: od_dliv 관련 코드 섹션 추가 (1-K:입출고구분, 1-L:배송유형, 1-M:배송료구분). 배송료 결제여부 안내 포함
- 2026-04-18: 1-B 섹션에 반품·교환 진행 중 claim_item 상태 코드 참조표 추가 (RETURN_REQ/RETURNING/RETURNED/EXCHANGE_COMPLT/PARTIAL_EXCHANGE_COMPLT)
