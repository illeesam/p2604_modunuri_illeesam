# 714. 정산 ERP 전표 정책

## 목적
정산 확정 후 회계 처리를 위한 ERP 전표 생성·전송·대사 정책 정의

## 범위
- 관련 역할: 정산 담당자(전표 생성·확정), 회계 담당자(ERP 대사·검토), 시스템(ERP 연동 배치)
- 관련 시스템: 정산 관리, ERP(회계 시스템), 대사 관리

## 주요 정책

### 1. ERP 전표 생성 시점
- **트리거**: 정산 마감(`settle_status_cd = CLOSED`) 확정 후 전표 생성 가능
- **생성 단위**: 업체별 × 정산년월(settle_ym) × 전표유형(erp_voucher_type_cd)
- **생성 방식**: 담당자 수동 생성 또는 마감 배치 자동 생성
- **대차 균형 필수**: `total_debit_amt = total_credit_amt` 검증 후 CONFIRMED 전환

### 2. 전표 유형 (ERP_VOUCHER_TYPE)
| 유형 | 코드 | 생성 기준 | 설명 |
|------|------|---------|------|
| 정산전표 | SETTLE | st_settle.final_settle_amt | 업체 정산 확정액 |
| 환불전표 | RETURN | st_settle.total_return_amt | 당월 환불 차감분 |
| 조정전표 | ADJ | st_settle_adj + st_settle_etc_adj | 수동 조정 및 기타 조정 |
| 지급전표 | PAY | st_settle_pay.pay_amt | 업체 지급 처리 |

### 3. 전표 상태 흐름 (ERP_VOUCHER_STATUS)
```
DRAFT(작성중) → CONFIRMED(확정) → SENT(ERP전송) → MATCHED(대사일치)
                                        └→ MISMATCH(불일치) → (수정 후) → SENT
                                        └→ ERROR(전송오류)  → (재전송) → SENT
```
- **DRAFT**: 전표 라인 입력 중, 대차 균형 미확인
- **CONFIRMED**: 대차 균형(총차변 = 총대변) 검증 완료, ERP 전송 대기
- **SENT**: ERP 전송 완료, `erp_voucher_no` 수신
- **MATCHED**: ERP 대사 결과 일치
- **MISMATCH**: ERP 대사 결과 불일치, 담당자 검토 필요
- **ERROR**: ERP 전송 실패, 재전송 필요

### 4. 분개 라인 구성 원칙 (st_erp_voucher_line)
- 전표 1건 = 복수 라인 (최소 2개: 차변 1개 + 대변 1개)
- 라인별 차변/대변 중 **하나만** 입력 (상호 배타적)
- `account_cd`: 사전 정의된 ERP 계정과목 코드 사용
- `cost_center_cd` / `profit_center_cd`: 관리 회계 차원 정보

#### 정산전표 분개 예시 (업체 정산 1,000,000원, 수수료 50,000원)
```
차변: 매출채권         1,000,000  (account_cd: 110100)
대변: 매출액             950,000  (account_cd: 400100)
대변: 수수료수입          50,000  (account_cd: 400200)
```

#### 지급전표 분개 예시
```
차변: 미지급금          950,000   (account_cd: 250100)
대변: 보통예금          950,000   (account_cd: 101200)
```

### 5. ERP 전표 대사 (stErpReconMng)
- **대사 목적**: 정산 시스템 계산값 vs ERP 실제 전표금액 비교, 불일치 탐지
- **대사 기준**: `erp_voucher_no` 기준으로 ERP 전표와 1:1 매핑
- **대사 결과**:
  - `MATCHED`: 금액 일치 → 정상
  - `MISMATCH`: 금액 불일치 → 담당자 수정 후 재전송
- **처리 원칙**: `MISMATCH` 미해소 건은 다음 정산 지급 차단

### 6. 재전송 정책
- ERP 전송 실패(`ERROR`) 시 1시간 간격 자동 재시도 3회
- 3회 실패 시 담당자 알림, 수동 처리
- 재전송 시 기존 `erp_voucher_no` 초기화 후 신규 채번

## 상태 코드

### ERP_VOUCHER_TYPE (전표 유형)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| ERP_VOUCHER_TYPE | SETTLE | 정산전표 | 업체 정산 확정액 전표 |
| ERP_VOUCHER_TYPE | RETURN | 환불전표 | 당월 환불 차감분 전표 |
| ERP_VOUCHER_TYPE | ADJ | 조정전표 | 수동 조정 및 기타 조정 전표 |
| ERP_VOUCHER_TYPE | PAY | 지급전표 | 업체 지급 처리 전표 |

### ERP_VOUCHER_STATUS (전표 상태)
| 코드그룹 | 코드값 | 라벨 | 설명 |
|---------|--------|------|------|
| ERP_VOUCHER_STATUS | DRAFT | 작성중 | 분개 입력 중, 대차 미확인 |
| ERP_VOUCHER_STATUS | CONFIRMED | 확정 | 대차 균형 검증 완료 |
| ERP_VOUCHER_STATUS | SENT | 전송완료 | ERP 전송 완료, erp_voucher_no 수신 |
| ERP_VOUCHER_STATUS | MATCHED | 대사일치 | ERP 대사 결과 일치 |
| ERP_VOUCHER_STATUS | MISMATCH | 대사불일치 | 금액 불일치, 담당자 검토 필요 |
| ERP_VOUCHER_STATUS | ERROR | 전송오류 | ERP 전송 실패 |

## 관련 테이블
| 테이블명 | 한글설명 |
|---------|---------|
| st_erp_voucher | ERP 전표 마스터 (전표 헤더, 유형·상태·금액 합계) |
| st_erp_voucher_line | ERP 전표 라인 (분개 항목, 계정/차변/대변) |
| st_settle | 정산 마스터 (전표 생성 기준 원천) |
| st_settle_pay | 정산 지급 (지급전표 생성 기준) |
| st_settle_adj | 정산 조정 (조정전표 생성 기준) |

## 제약사항
- `CONFIRMED` 전환 조건: `total_debit_amt = total_credit_amt` (대차 균형 필수)
- `SENT` 상태 이후 라인 수정 불가 (재전송 시 CONFIRMED 복귀 후 수정)
- `MISMATCH` 미해소 건 존재 시 해당 업체 정산 지급(`PAID`) 차단
- 동일 `settle_id` + `erp_voucher_type_cd` 조합 중복 생성 불가

## 변경이력
- 2026-04-18: 초기 작성
