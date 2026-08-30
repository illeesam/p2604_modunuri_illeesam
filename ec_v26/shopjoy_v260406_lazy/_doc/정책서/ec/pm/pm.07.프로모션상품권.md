# 516. 프로모션 상품권 정책

## 목적
금액권·정률권 형태의 상품권을 발급하고, 코드 기반 단일 사용 및 만료 처리를 포함한 상품권 운영 정책 정의

## 범위
- 관련 역할: 관리자(상품권 발급·관리), 회원(상품권 코드 입력 및 사용)
- 관련 시스템: 프로모션 관리, 주문 결제 처리

## 주요 정책

### 1. 상품권 마스터 등록
- 관리자가 상품권 유형·금액·기간 설정 후 저장 → `voucher_status_cd: INACTIVE`
- 활성화 처리 시 `ACTIVE` 전환, 이후 개별 발급(`pm_voucher_issue`) 가능
- `end_date` 경과 또는 관리자 수동 처리 시 `EXPIRED`

### 2. 상품권 유형 (voucher_type_cd)
- **AMOUNT (금액권)**: 권면 금액(`voucher_value`) 그대로 주문금액에서 차감
  - `max_discnt_amt`: 미사용 (권면금액이 곧 할인 한도)
  - 예: 10,000원권 → 결제 시 10,000원 차감
- **RATE (정률권)**: 주문금액의 일정 비율(%) 할인
  - `voucher_value`: 할인율 (예: 15 → 15%)
  - `max_discnt_amt`: 정률 할인 상한, 계산액 초과 시 상한액 적용
  - 예: 15%권, 상한 20,000원, 주문 200,000원 → 30,000원 계산 → 20,000원 적용

### 3. 최소 주문금액 (min_order_amt)
- 설정 시 해당 금액 미만 주문에는 상품권 사용 불가
- 0 또는 NULL이면 금액 제한 없이 사용 가능

### 4. 상품권 발급 (pm_voucher_issue)
- 마스터 기준으로 개별 코드(`voucher_code`) 단위 발급
- `voucher_code`: UNIQUE 제약, 코드 중복 발급 불가
- 발급 시 `voucher_issue_status_cd: ISSUED`, `issue_date` 기록
- `expire_date` = `issue_date` + `expire_month` (개월 기산)

### 5. 상품권 사용 흐름
```
회원이 voucher_code 입력 → 유효성 검증
  (ISSUED 상태 + expire_date 미경과 + min_order_amt 충족)
→ 할인액 계산 (AMOUNT: voucher_value / RATE: 주문액×rate, max 상한)
→ 주문 생성 및 결제 처리
→ pm_voucher_issue 상태 USED, use_date / order_id / use_amt 기록
```

### 6. 만료 처리
- `expire_date` < 현재 날짜인 `ISSUED` 상태 코드 → 배치로 `EXPIRED` 자동 전환
- `EXPIRED` 코드는 사용 불가, 환불·연장 불가 (정책상 예외 없음)
- 사용 완료(`USED`) 코드는 만료 처리 대상에서 제외

### 7. 취소·환불 시 처리
- 상품권 사용 주문이 취소될 경우 해당 `pm_voucher_issue`를 `ISSUED` 상태로 복원
- `use_date`, `order_id`, `use_amt` 초기화, 재사용 가능 상태로 전환
- 단, 취소 시 `expire_date` 이미 경과한 경우에는 `EXPIRED` 처리 (복원 불가)

## 상태 코드

### VOUCHER_STATUS (상품권 마스터 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| VOUCHER_STATUS | ACTIVE | 활성 | 발급 가능, 신규 코드 생성 허용 |
| VOUCHER_STATUS | INACTIVE | 비활성 | 발급 중단, 기발급 코드는 사용 가능 |
| VOUCHER_STATUS | EXPIRED | 만료 | 마스터 기간 종료 |

### VOUCHER_TYPE (상품권 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| VOUCHER_TYPE | AMOUNT | 금액권 | 권면금액 고정 차감 |
| VOUCHER_TYPE | RATE | 정률권 | 비율(%) 할인, max_discnt_amt 상한 |

### VOUCHER_ISSUE_STATUS (발급 코드 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| VOUCHER_ISSUE_STATUS | ISSUED | 발급됨 | 미사용, 유효 기간 내 사용 가능 |
| VOUCHER_ISSUE_STATUS | USED | 사용완료 | 1회 사용 후 재사용 불가 |
| VOUCHER_ISSUE_STATUS | EXPIRED | 만료 | 유효기간 초과, 사용 불가 |
| VOUCHER_ISSUE_STATUS | CANCELLED | 취소 | 관리자 수동 취소 |

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| pm_voucher | 상품권 마스터 (유형·금액·기간·상한 기본 설정) |
| pm_voucher_issue | 상품권 발급 및 사용 이력 (코드 단위 상태 추적) |

## 제약사항
- `voucher_code` 는 UNIQUE, 동일 코드 중복 발급 불가
- `USED` 상태 코드는 재사용 불가 (단, 주문 취소 시 ISSUED 복원 예외)
- `EXPIRED` 코드는 어떤 경우에도 사용 불가, 연장 불가
- `RATE` 유형은 `max_discnt_amt` 설정 권장
- `min_order_amt` 미충족 주문에 코드 입력 시 오류 반환
- 상품권은 1주문 1코드 사용 원칙 (복수 코드 동시 사용 불가)

## 변경이력
- 2026-04-18: 초기 작성
