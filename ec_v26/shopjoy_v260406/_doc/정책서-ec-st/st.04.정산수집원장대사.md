# 713. 정산수집원장 및 대사 정책

## 목적
주문·클레임 완료 건을 기반으로 정산 원천 데이터를 수집하고, 정산 계산값과 실제 결제금액을 대사(對査)하여 불일치를 관리하는 정책 정의

## 범위
- 관련 역할: 정산 담당자(원장 수집·대사 검토·불일치 해소), 시스템(자동 수집 배치)
- 관련 시스템: 정산 관리, 주문 처리, 클레임 처리, 결제

## 주요 정책

### 1. 정산수집원장 자동 수집 (st_settle_raw)
- **수집 트리거**:
  - 배송 상태 `DELIVERED` (배송완료) 전환 시 → `od_order_item` 기반 수집
  - 클레임 완료(취소/반품/교환 처리 완료) 시 → `od_claim_item` 기반 수집
- 수집 즉시 `raw_status_cd: PENDING` 으로 등록
- 동일 주문 항목 중복 수집 방지 (od_order_item_id UNIQUE 체크)

### 2. 수집 원장 구성 항목
수집 시 아래 금액 전체를 원장에 저장:
- 판매금액, 배송비, 프로모션 할인액, 쿠폰 할인액, 상품권 사용액
- 캐쉬(충전금) 사용액, 마일리지(적립금) 사용액, 사은품 지급 원가
- 결제수단별 실결제금액 (무통장/가상계좌/간편결제 등)
- `settle_target_amt`: 정산 대상 금액 (판매액 - 플랫폼 부담 프로모션 제외)
- `settle_fee_rate`: 해당 업체·카테고리 기준 수수료율
- `settle_fee_amt`: 수수료 계산액 (`settle_target_amt × settle_fee_rate`)
- `settle_amt`: 최종 정산금 (`settle_target_amt - settle_fee_amt`)
- `settle_period`: 정산 귀속 기간 (YYYY-MM 형식)

### 3. 업체 유형 (vendor_type_cd)
- **SALE**: 일반 판매 업체 기준 정산
- **DLIV**: 배송 관련 별도 정산 (배송비 수수료 등)
- **EXTERNAL**: 외부 연동 업체 (외부 결제사 등)

### 4. 수집 상태 흐름 (raw_status_cd)
```
PENDING → COLLECTED → SETTLED
              └→ EXCLUDED (수동 제외)
```
- **PENDING**: 수집 완료, 정산 집계 대기
- **COLLECTED**: 정산 집계(`st_settle`) 처리 중 또는 완료 대기
- **SETTLED**: `st_settle`에 반영 완료
- **EXCLUDED**: 오류·중복·수동 제외 처리 (사유 기록 필수)

### 5. 정산 집계 연결
- `raw_status_cd: PENDING` 건 전체를 기준으로 `st_settle` (업체별 월 정산) 집계 실행
- 집계 완료 시 해당 원장 레코드 → `SETTLED` 전환
- `settle_period` 기준으로 월별 집계, 동일 기간 재집계 시 SETTLED 레코드 제외

### 5-1. 타월(他月) 주문 환불의 수집원장 처리
- **원칙**: 환불은 **환불 확정 시점의 settle_period(YYYY-MM)**에 귀속
  - 예: 1월 주문 → 3월 환불 확정 → `settle_period = 2025-03`
- **원장 수집**: `raw_type_cd = CLAIM`, 금액 컬럼 음수(-) 저장
  - `settle_target_amt = -10,000` (환불 원금)
  - `settle_fee_amt = -수수료` (수수료 환급)
  - `settle_amt = -(settle_target_amt의 절대값 - 수수료 절대값)`
- **집계 반영**: 3월 `st_settle`의 `total_return_amt`에 누적, `total_claim_cnt` +1
- **1월 정산**: `CLOSED` 상태 유지, 재오픈 없음 (불변 원칙)
- **마이너스 정산 대응**: `final_settle_amt < 0` 발생 시 → `st_settle_adj`로 다음 달 이월 처리

### 6. 정산 대사 (st_recon)
- **대사 목적**: 정산 계산값(`expected_amt`) vs 실제 결제금액(`actual_amt`) 비교, 불일치 탐지
- **대사 유형 (recon_type_cd)**:
  - `ORDER`: 주문금액 대사
  - `PAY`: 결제금액 대사 (PG사 정산내역 비교)
  - `CLAIM`: 클레임 환불금 대사
  - `VENDOR`: 업체별 정산액 대사
- **대사 결과**:
  - `MATCHED`: 기대액 = 실제액, 정상
  - `MISMATCH`: 불일치 발생, 담당자 검토 필요
  - `RESOLVED`: 담당자 확인·처리 완료

### 7. 불일치(MISMATCH) 처리 흐름
```
대사 실행 → diff_amt 계산 (expected_amt - actual_amt)
  diff_amt = 0 → MATCHED
  diff_amt ≠ 0 → MISMATCH 생성
    → 담당자 검토 (resolved_by, resolved_date 기록)
    → 원인 파악 후 st_settle_adj(조정) 또는 st_settle_etc_adj(기타조정) 반영
    → RESOLVED 전환
```
- `diff_amt > 0`: 기대금액(계산값)이 실제보다 큼 (과소 수취)
- `diff_amt < 0`: 실제금액이 기대보다 큼 (과다 수취)

### 8. od_pay 입출금 구분 및 PAY 대사 처리

`od_pay`에는 명시적인 입출금 구분 컬럼(`pay_div_cd` 등)이 없다.
한 레코드 안에서 입금(고객 → 시스템)과 출금(시스템 → 고객)이 공존하는 구조.

| 방향 | 컬럼 | 상태 코드 | 대사 방향 |
|---|---|---|---|
| **입금** (고객 결제) | `pay_amt` + `pay_status_cd` | PENDING → COMPLT | `expected_amt`에 (+) 반영 |
| **출금** (환불) | `refund_amt` + `refund_status_cd` | PENDING → COMPLT | `expected_amt`에 (-) 반영 |

**PAY 대사 기준값 계산**
```
expected_amt(PAY) = Σ pay_amt(COMPLT) - Σ refund_amt(refund_status_cd=COMPLT)
```
- 교환 추가결제: 신규 `od_pay` 레코드로 생성 → 별도 (+) 입금으로 집계
- 부분환불: `pay_status_cd = PARTIAL_REFUND` → `refund_amt` 누적값 사용
- 전액환불: `pay_status_cd = REFUNDED` → `refund_amt = pay_amt`

**주의: 수단별 대사 구분**
- `BANK_TRANSFER`: 관리자 수동 확인 → 입금 시점 불명확. PG 정산내역 아닌 은행 입금내역으로 대사
- `VBANK`: `vbank_deposit_date` 기준 자동 대사. `vbank_deposit_amt` 컬럼 없어 `pg_response` JSON 파싱 필요
- `TOSS·KAKAO·NAVER·MOBILE`: PG 정산내역(`pg_transaction_id` 기준)으로 자동 대사

---

### 9. 대사 자동화
- 월 정산 마감 후 배치 실행으로 전체 대사 자동 수행
- `MISMATCH` 건 발생 시 정산 담당자 알림 발송
- `MISMATCH` 미해소 건은 정산 지급(`PAID`) 처리 차단

## 상태 코드

### RAW_STATUS (수집원장 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| RAW_STATUS | PENDING | 대기 | 수집 완료, 정산 집계 전 |
| RAW_STATUS | COLLECTED | 수집됨 | 집계 처리 중 |
| RAW_STATUS | SETTLED | 정산완료 | st_settle에 반영 완료 |
| RAW_STATUS | EXCLUDED | 제외 | 수동 제외 처리 |

### RAW_TYPE (수집 원천)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| RAW_TYPE | ORDER | 주문 | od_order_item 기반 |
| RAW_TYPE | CLAIM | 클레임 | od_claim_item 기반 |

### VENDOR_TYPE (업체 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| VENDOR_TYPE | SALE | 판매 | 일반 판매 업체 |
| VENDOR_TYPE | DLIV | 배송 | 배송비 정산 대상 |
| VENDOR_TYPE | EXTERNAL | 외부 | 외부 연동 업체 |

### RECON_STATUS (대사 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| RECON_STATUS | MATCHED | 일치 | 기대액 = 실제액 |
| RECON_STATUS | MISMATCH | 불일치 | 차이 발생, 담당자 검토 필요 |
| RECON_STATUS | RESOLVED | 해소 | 담당자 확인 및 처리 완료 |

### RECON_TYPE (대사 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| RECON_TYPE | ORDER | 주문 | 주문금액 대사 |
| RECON_TYPE | PAY | 결제 | PG사 결제금액 대사 |
| RECON_TYPE | CLAIM | 클레임 | 환불금 대사 |
| RECON_TYPE | VENDOR | 업체 | 업체별 정산액 대사 |

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| st_settle_raw | 정산수집원장 (주문·클레임 완료 건 원천 데이터) |
| st_recon | 정산 대사 (기대액 vs 실제액 비교, 불일치 추적) |
| st_settle | 정산 마스터 (업체별 월 정산 집계 결과) |
| od_order_item | 주문 항목 (ORDER 유형 수집 원천) |
| od_claim_item | 클레임 항목 (CLAIM 유형 수집 원천) |

## 제약사항
- 동일 `od_order_item_id` 중복 수집 불가 (UNIQUE 제약)
- `EXCLUDED` 처리 시 제외 사유 기록 필수
- `MISMATCH` 미해소 건 존재 시 해당 업체 정산 지급(`PAID`) 처리 차단
- `diff_amt` 계산: `expected_amt - actual_amt` (양수 = 과소수취, 음수 = 과다수취)
- `RESOLVED` 전환 시 `resolved_by` (처리자) 및 `resolved_date` 반드시 기록

## 변경이력
- 2026-04-18: 초기 작성
- 2026-04-18: 타월 주문 환불 수집원장 처리 정책 추가 (5-1항 신설), 음수 원장 귀속 원칙 및 마이너스 정산 대응 정의
- 2026-04-18: od_pay 입출금 구분 및 PAY 대사 처리 기준 추가 (8항 신설)
