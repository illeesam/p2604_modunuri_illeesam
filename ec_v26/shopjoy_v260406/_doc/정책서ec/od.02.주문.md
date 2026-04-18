# 313. 주문 관리 정책

## 목적
주문 생성, 처리, 변경에 대한 정책 정의

## 범위
- 주문 상태 관리
- 주문 결제 관리
- 주문 취소/환불
- 주문 배송 추적

## 설계 원칙: order_item이 기준 단위

> **부분반품·부분교환·부분배송** 등 item별 독립 처리가 필요하므로
> `od_order_item.order_item_status_cd` 가 실제 라이프사이클의 **소스 오브 트루스**.
> `od_order.order_status_cd` 는 order_item 상태를 집계한 **요약 상태** (빠른 조회·필터용).

## 주문 상태 (ORDER_STATUS) — od_order 집계 상태

| 상태 | 코드 | 설명 | item 상태 기준 |
|------|------|------|--------------|
| 결제대기 | PENDING | 결제 대기 중 | 전체 ORDERED |
| 결제완료 | PAID | 결제 완료 | 전체 PAID |
| 배송준비중 | PREPARING | 상품 준비 중 | 1개 이상 PREPARING |
| 배송중 | SHIPPED | 배송 진행 중 | 1개 이상 SHIPPING |
| 배송완료 | COMPLT | 배송 완료 / 구매확정 | 전체 DELIVERED 이상 |
| 취소 | CANCELLED | 주문 취소 | 전체 CANCELLED |
| 반품 | RETURNED | 전체 반품 | 전체 RETURNED |

> 부분배송·부분취소·부분반품 시 order_status_cd는 **가장 앞선(활성) item 상태**를 반영.
> 예: 3개 중 1개 SHIPPING, 2개 DELIVERED → order_status_cd = SHIPPED

## 품목 상태 구조 — 두 컬럼이 독립적으로 공존

```
od_order_item.order_item_status_cd   ← 주문 흐름 (항상 유지)
od_claim_item.claim_item_status_cd   ← 클레임 흐름 (클레임 발생 시만 존재)
```

> 부분반품 예시: order_qty=3, claim_qty=1
> → order_item.order_item_status_cd = **DELIVERED** (유지)
> → claim_item.claim_item_status_cd = **RETURNING** (수거 진행 중)
> → order_item.cancel_qty = 0 → 1 (반품 완료 시 누적)

### `od_order_item.order_item_status_cd` — 주문 흐름 전용
| 상태 | 코드 | 전이 조건 |
|------|------|---------|
| 주문완료 | ORDERED | 주문 접수 (결제 대기) — 초기값 |
| 결제완료 | PAID | 결제 승인 완료 |
| 배송준비중 | PREPARING | 판매자 출고 준비 시작 |
| 배송중 | SHIPPING | 송장번호 등록 / 택배사 픽업 |
| 배송완료 | DELIVERED | 택배사 배송완료 스캔 |
| 구매확정 | CONFIRMED | 고객 확정 또는 7일 자동 확정 |
| 전량취소 | CANCELLED | `cancel_qty = order_qty` 확정 시 (전량 취소·반품 완료) |

### `od_claim_item.claim_item_status_cd` — 클레임 흐름 전용
| 상태 | 코드 | 전이 조건 |
|------|------|---------|
| 요청 | REQUESTED | 클레임 신청 접수 — 초기값 |
| 승인 | APPROVED | 관리자 승인 |
| 수거중 | IN_PICKUP | 반품·교환 수거 진행 (반품·교환 전용) |
| 검수중 | PROCESSING | 입고 후 검수 (반품 전용) |
| 교환발송중 | IN_TRANSIT | 교환상품 배송 중 (교환 전용) |
| 완료 | COMPLT | 클레임 처리 완료 |
| 거절 | REJECTED | 클레임 불가 처리 |
| 철회 | CANCELLED | 고객이 클레임 취소 |

### 수량 추적 필드 (od_order_item)
| 필드 | 설명 |
|------|------|
| `order_qty` | 원 주문 수량 |
| `cancel_qty` | 취소·반품 완료된 누적 수량 |
| `item_cancel_amt` | 취소·반품 완료된 누적 금액 |
| `item_order_amt` | 원 주문 금액 (unit_price × order_qty) |

## 주요 정책

### 1. 주문 생성
- **필수항목**:
  - 상품 (최소 1개)
  - 수량
  - 수령자 정보 (이름, 연락처, 주소)
  - 배송메모 (선택)
- **초기상태**: PENDING
- **자동만료**: 미결제 상태 24시간 후 자동 취소

### 2. 주문 가격 정책

#### 2-1. 금액 계산
- **상품합계금액**: 상품 판매가 × 수량
  - 각 상품의 판매가는 판매자가 책정
  - 옵션 추가금액 포함
- **할인금액**: 쿠폰할인, 카테고리할인 적용
- **배송금액**:
  - **판매사별 배송비**: 각 판매사마다 독립적으로 계산
    - 판매사별 기본 배송료: 3,000원
    - 무료배송 기준액 이상 무료
    - 도서산간 추가요금
  - **복수 판매사 주문**: 판매사 수만큼 배송료 누적 계산
    - 예: 판매사 2개 주문 시 배송료 6,000원 (3,000원 × 2)
  - **배송료 예시**:
    | 판매사수 | 기본배송료 | 합계 |
    |---------|----------|-----|
    | 1개 | 3,000원 | 3,000원 |
    | 2개 | 3,000원 × 2 | 6,000원 |
    | 3개 | 3,000원 × 3 | 9,000원 |
- **실결제금액**: 상품합계금액 - 할인금액 + 배송금액

#### 2-2. 적립금
- **적립**: 구매 후 포인트 적립 (실결제금액의 1%)

### 3. 품목(order_item) 상태 전이

```
ORDERED → PAID → PREPARING → SHIPPING → DELIVERED → CONFIRMED
   │         │                                │
   ↓         ↓                                ↓
CANCEL_REQ  CANCEL_REQ               RETURN_REQ / EXCHANGE_REQ
   ↓         ↓                                ↓
CANCELLED  CANCELLED          RETURNING/EXCHANGING → RETURNED/EXCHANGED
```

| 현재 상태 | 전이 가능 상태 | 조건 |
|---------|-------------|------|
| ORDERED | PAID | 결제 승인 |
| ORDERED | CANCEL_REQ | 고객 취소 신청 |
| PAID | PREPARING | 판매자 출고 준비 |
| PAID | CANCEL_REQ | 배송 전 취소 신청 |
| PREPARING | SHIPPING | 송장번호 등록 |
| SHIPPING | DELIVERED | 택배사 배송완료 |
| DELIVERED | CONFIRMED | 고객 확정 또는 7일 자동 |
| DELIVERED | RETURN_REQ | 반품 신청 (30일 이내) |
| DELIVERED | EXCHANGE_REQ | 교환 신청 (30일 이내) |
| CONFIRMED | RETURN_REQ | 반품 신청 (30일 이내) |
| CONFIRMED | EXCHANGE_REQ | 교환 신청 (30일 이내) |
| CANCEL_REQ | CANCELLED | 취소 처리 완료 |
| RETURN_REQ | RETURNING | 수거 시작 |
| RETURNING | RETURNED | 반품 완료 |
| EXCHANGE_REQ | EXCHANGING | 수거 시작 |
| EXCHANGING | EXCHANGED | 교환 완료 |

### 4. 부분배송
- **지원여부**: 여러 판매자 상품은 부분배송 가능
- **배송료**: 각 배송별로 독립 계산
- **추적**: order_item별로 배송 상태 추적

### 5. 주문 취소 정책
- **결제전 취소**: 제한 없음 (PENDING → CANCELLED)
- **결제후 취소**: 배송 전에만 가능 (PAID → CANCELLED)
  - 결제 환불 처리
  - 수수료 차감
- **배송중 취소**: 불가능 (고객센터 문의)
- **완료후 취소**: 불가능 (반품/교환으로 처리)

## 주요 필드
| 필드 | 설명 | 규칙 |
|------|------|------|
| order_id | 주문ID | YYMMDDhhmmss+rand4 |
| member_id | 회원ID | 로그인 회원 필수 |
| order_date | 주문일시 | TIMESTAMP 기본: 현재 |
| total_price | 상품합계 | BIGINT 기본값 0 |
| discount_amt | 할인금액 | BIGINT 기본값 0 |
| coupon_discount | 쿠폰할인 | BIGINT 기본값 0 |
| cache_use | 적립금사용 | BIGINT 기본값 0 |
| pay_price | 실결제금액 | BIGINT 기본값 0 |
| order_status_cd | 상태 | ORDER_STATUS 코드 |
| order_status_cd_before | 변경전상태 | 상태변경 추적 |
| recv_nm | 수령자명 | 필수 |
| recv_phone | 수령자연락처 | 필수 |
| recv_addr | 수령자주소 | 필수 |
| dliv_status_cd | 배송상태 | DLIV_STATUS 코드 |

## 코드 정보

### `od_order.order_status_cd` — 주문 집계 상태
| 코드값 | 코드라벨 | 설명 |
|--------|---------|------|
| PENDING | 결제대기 | 주문 생성, 결제 대기 중 |
| PAID | 결제완료 | 결제 완료 |
| PREPARING | 배송준비중 | 1개 이상 item이 배송 준비 중 |
| SHIPPED | 배송중 | 1개 이상 item이 배송 중 |
| COMPLT | 배송완료/구매확정 | 전체 item DELIVERED 이상 |
| CANCELLED | 취소완료 | 전체 item 취소 완료 |
| RETURNED | 반품완료 | 전체 item 반품 완료 |

### `od_order_item.order_item_status_cd` — 품목 주문 상태 (순수 주문 흐름 전용)

> 클레임 상태는 이 컬럼에 포함하지 않음.
> 부분반품 진행 중이어도 order_item은 DELIVERED 유지 → 클레임 상태는 `od_claim_item.claim_item_status_cd` 가 별도 관리.
> 전량 취소·반품 완료 시에만 CANCELLED 로 전환.

| 코드값 | 코드라벨 | 설명 |
|--------|---------|------|
| ORDERED   | 주문완료   | 주문 접수, 결제 대기 — 초기값 |
| PAID      | 결제완료   | 결제 승인 완료 |
| PREPARING | 배송준비중 | 판매자 출고 준비 시작 |
| SHIPPING  | 배송중     | 송장번호 등록 / 택배사 픽업 |
| DELIVERED | 배송완료   | 택배사 배송완료 스캔 |
| CONFIRMED | 구매확정   | 고객 확정 또는 7일 자동 확정 |
| CANCELLED | 전량취소   | 전체 수량 취소·반품 완료 (cancel_qty = order_qty) |

### `od_claim_item.claim_item_status_cd` — 클레임 항목 상태 (order_item과 별도 독립)

> order_item 1건에 대해 부분수량 클레임도 가능. claim_item이 진행 중이어도 order_item 상태는 유지.
> claim_qty + cancel_qty 로 수량 추적.

| 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 설명 |
|:---:|:---:|:---:|--------|---------|------|
| O | O | O | REQUESTED  | 요청      | 클레임 신청 접수 |
| O | O | O | APPROVED   | 승인      | 관리자 승인 |
| - | O | O | IN_PICKUP  | 수거중    | 반품상품 수거 진행 중 |
| - | O | - | PROCESSING | 검수중    | 입고 후 상품 검수 중 |
| - | - | O | IN_TRANSIT | 교환발송중 | 교환상품 배송 중 |
| O | O | O | COMPLT     | 완료      | 클레임 처리 완료 |
| O | O | O | REJECTED   | 거절      | 클레임 불가 처리 |
| O | O | O | CANCELLED  | 철회      | 고객이 클레임 취소 |

### `od_claim.claim_status_cd` — 클레임 상태
| 취소 | 반품 | 교환 | 코드값 | 코드라벨 | 설명 |
|:---:|:---:|:---:|--------|---------|------|
| O | O | O | REQUESTED  | 요청      | 클레임 신청 접수 |
| O | O | O | APPROVED   | 승인      | 관리자 승인 |
| - | O | O | IN_PICKUP  | 수거중    | 반품상품 수거 진행 중 |
| - | O | - | PROCESSING | 검수중    | 입고 후 상품 검수 중 |
| - | - | O | IN_TRANSIT | 교환발송중 | 교환상품 배송 중 |
| O | O | O | COMPLT     | 완료      | 클레임 처리 완료 |
| O | O | O | REJECTED   | 거절      | 클레임 불가 처리 |
| O | O | O | CANCELLED  | 철회      | 고객이 클레임 취소 |

### `od_claim.claim_type_cd` — 클레임 유형
| 코드값 | 코드라벨 | 설명 |
|--------|---------|------|
| CANCEL | 취소 | 배송 전 주문 취소 |
| RETURN | 반품 | 배송 후 반품 |
| EXCHANGE | 교환 | 배송 후 교환 |

### `od_dliv.dliv_status_cd` — 배송 상태
| 코드값 | 코드라벨 | 설명 |
|--------|---------|------|
| READY | 출고준비 | 출고 준비 중 |
| PICKED | 픽업완료 | 택배사 픽업 완료 |
| IN_TRANSIT | 배송중 | 택배사 배송 진행 |
| DELIVERED | 배송완료 | 수령자 인수 완료 |
| RETURN_REQ | 반품요청 | 반품 수거 요청 |
| RETURNED | 반품완료 | 반품 수거 완료 |

### `od_pay.pay_status_cd` — 결제 상태
| 코드값 | 코드라벨 | 설명 |
|--------|---------|------|
| PENDING | 결제대기 | 결제 대기 중 |
| COMPLT | 결제완료 | 결제 승인 완료 |
| FAILED | 결제실패 | 결제 승인 실패 |
| CANCELLED | 결제취소 | 결제 취소 처리 |
| PARTIAL_REFUND | 부분환불 | 부분 환불 완료 |
| REFUNDED | 환불완료 | 전액 환불 완료 |

## 관련 테이블
- od_order: 주문 기본 정보
- od_order_item: 주문 상품 목록
- od_pay: 결제 정보
- od_dliv: 배송 정보
- od_claim: 반품/교환 정보

## 변경이력
- 2026-04-16: 초기 작성
- 2026-04-16: 판매사별 배송비 정책 추가 (판매사별 3,000원 배송료), 코드정보 추가 (ORDER_STATUS, DLIV_STATUS, PAY_STATUS)
- 2026-04-16: 금액 표현 통일 (가격/금액 분리), DDL 컬럼 변경 (total_amt, coupon_discount_amt, cache_use_amt, pay_amt)
- 2026-04-18: order_item 기준단위 설계 원칙 추가, ORDER_ITEM_STATUS 14개 코드 정의
- 2026-04-18: 코드 테이블 전체 실제 컬럼명 표기, claim_status_cd 취소·반품·교환 적용 여부(O/-) 추가
