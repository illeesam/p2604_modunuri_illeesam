# 결제(PAYMENT) 시스템 설계 (2026-04-16)

## 📋 개요

토스페이먼스 기반 멀티채널 결제 시스템 설계. 무통장, 가상계좌, 신용카드, 핸드폰, 간편결제 통합 관리.

---

## 💳 지원 결제 방식

### 1) **무통장입금 (BANK_TRANSFER)**
```
PAY_METHOD_CD = 'BANK_TRANSFER'
PAY_CHANNEL_CD = NULL
상태: PENDING (입금 대기) → COMPLT (입금 확인)
특이사항: PG 사용 안함, 수동 입금 확인
```

### 2) **가상계좌 (VBANK)**
```
PAY_METHOD_CD = 'VBANK'
PAY_CHANNEL_CD = NULL
상태: PENDING (계좌 발급) → COMPLT (입금 확인)
필드: vbank_account, vbank_bank_code, vbank_due_date
특이사항: PG가 계좌번호 발급 → 고객이 해당 계좌로 입금
```

### 3) **토스페이먼스 간편결제 (TOSS)**
```
PAY_METHOD_CD = 'TOSS'
PAY_CHANNEL_CD = 'CARD' | 'ACCOUNT' | 'KAKAO' | 'NAVER'
PG_COMPANY_CD = 'TOSS'
상태: PENDING (결제 진행) → COMPLT (결제 완료)
필드: pg_transaction_id, pg_approval_no, card_no (카드일 경우)
특이사항: 통합 결제 게이트웨이, 채널별 세분화 가능

#### 3-1) 토스페이먼스 - 카드 (TOSS_CARD)
- 신용카드, 체크카드 모두 지원
- 할부 지원 (installment_month)
- 카드사: 신한, 국민, 우리, 하나, 수협 등

#### 3-2) 토스페이먼스 - 계좌이체 (TOSS_ACCOUNT)
- 실시간 이체
- 은행: 신한, 국민, 우리, 하나, 수협 등

#### 3-3) 토스페이먼스 - 카카오페이 (TOSS_KAKAO)
- 카카오페이 전자지갑

#### 3-4) 토스페이먼스 - 네이버페이 (TOSS_NAVER)
- 네이버페이 전자지갑
```

### 4) **핸드폰결제 (MOBILE)**
```
PAY_METHOD_CD = 'MOBILE'
PAY_CHANNEL_CD = NULL
상태: PENDING → COMPLT
특이사항: 휴대폰 소액결제 (토스 미지원 시 별도 PG)
```

### 5) **카카오페이 (KAKAO) - 직결제**
```
PAY_METHOD_CD = 'KAKAO'
PAY_CHANNEL_CD = NULL
PG_COMPANY_CD = 'KAKAO'
상태: PENDING → COMPLT
특이사항: 카카오페이 자체 PG (토스가 아닌 카카오페이 API 직결)
```

### 6) **네이버페이 (NAVER) - 직결제**
```
PAY_METHOD_CD = 'NAVER'
PAY_CHANNEL_CD = NULL
PG_COMPANY_CD = 'NAVER'
상태: PENDING → COMPLT
특이사항: 네이버페이 자체 PG (토스가 아닌 네이버페이 API 직결)
```

---

## 📊 데이터 구조

### ec_payment (결제 마스터)

| 필드 | 타입 | 설명 |
|---|---|---|
| **payment_id** | PK | 결제ID (YYMMDDhhmmss+rand4) |
| **order_id** | FK | 주문ID (1주문 N결제 가능) |
| **pay_method_cd** | CODE | 결제수단 (BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE) |
| **pay_channel_cd** | CODE | 결제채널 (TOSS만: CARD/ACCOUNT/KAKAO/NAVER) |
| **pay_amt** | BIGINT | 결제 금액 |
| **pay_status_cd** | CODE | 결제상태 (PENDING/COMPLT/FAILED/CANCELLED/REFUNDED) |
| **pay_date** | TIMESTAMP | 결제 완료일시 |
| **pg_company_cd** | CODE | PG사 (TOSS/KAKAO/NAVER) |
| **pg_transaction_id** | VARCHAR | PG 거래ID |
| **pg_approval_no** | VARCHAR | PG 승인번호 |
| **pg_response** | TEXT | PG 응답 JSON |
| **vbank_account** | VARCHAR | 가상계좌번호 (VBANK만) |
| **vbank_bank_code** | CODE | 은행코드 (BANK_CODE) |
| **vbank_due_date** | DATE | 입금기한 |
| **vbank_deposit_nm** | VARCHAR | 실제 입금자명 |
| **vbank_deposit_date** | TIMESTAMP | 입금확인일시 |
| **card_no** | VARCHAR | 카드번호 (마스킹) |
| **card_issuer_cd** | CODE | 카드사 코드 |
| **card_type_cd** | CODE | 카드타입 (CREDIT/DEBIT/CHECK) |
| **installment_month** | INT | 할부개월 (0=일시불) |
| **refund_amt** | BIGINT | 환불금액 |
| **refund_status_cd** | CODE | 환불상태 (PENDING/COMPLT/FAILED) |
| **refund_date** | TIMESTAMP | 환불완료일시 |
| **failure_reason** | VARCHAR | 실패사유 |
| **failure_code** | VARCHAR | PG 오류코드 |

### ec_payment_hist (결제 변경 이력)

| 필드 | 타입 | 설명 |
|---|---|---|
| **payment_hist_id** | PK | 이력ID |
| **payment_id** | FK | 결제ID |
| **pay_status_cd_before** | CODE | 변경 전 상태 |
| **pay_status_cd_after** | CODE | 변경 후 상태 |
| **chg_type_cd** | CODE | 변경유형 (APPROVE/COMPLETE/FAIL/REFUND/CANCEL/RETRY) |
| **chg_reason** | VARCHAR | 변경사유 |
| **pg_response** | TEXT | PG 응답 JSON |
| **refund_amt** | BIGINT | 환불금액 (환불 시만) |
| **chg_date** | TIMESTAMP | 변경일시 |

---

## 🔄 결제 상태 흐름

### 정상 결제
```
PENDING (결제 진행)
  ↓
COMPLT (결제 완료)
```

### 결제 실패
```
PENDING (결제 진행)
  ↓
FAILED (결제 실패)
  ↓
RETRY (재시도) → COMPLT 또는 FAILED
```

### 환불
```
COMPLT (결제 완료)
  ↓
REFUNDED (환불)
```

### 취소
```
PENDING (결제 진행)
  ↓
CANCELLED (취소)
```

---

## 💰 결제 금액 흐름

### 주문 생성 → 결제 생성
```
ORDER 생성
  ↓
ORDER.pay_price = 상품가 + 배송비
  ↓
PAYMENT 생성 (pay_amt = ORDER.pay_price)
  ↓
PAYMENT.pay_status_cd = 'PENDING'
```

### 결제 완료
```
PAYMENT.pay_status_cd = 'PENDING'
  ↓
PG로부터 승인 콜백
  ↓
PAYMENT 업데이트
  - pay_status_cd = 'COMPLT'
  - pg_transaction_id, pg_approval_no 저장
  - pay_date 기록
  ↓
ORDER.order_status_cd = 'PAID' 변경
```

### 부분결제 (분할 결제)
```
ORDER 생성 (pay_price = 100,000)
  ↓
PAYMENT #1 생성 (pay_amt = 50,000) - 선금
  PAYMENT #2 생성 (pay_amt = 50,000) - 잔금
  ↓
#1 COMPLT → 배송 시작
#2 COMPLT → 배송 완료
```

### 환불
```
ORDER (paid) → CLAIM (return) 요청
  ↓
PAYMENT.refund_status_cd = 'PENDING'
PAYMENT.refund_amt = X원
  ↓
PG에 환불 요청
  ↓
PAYMENT_HIST 생성 (chg_type = 'REFUND')
PAYMENT.refund_status_cd = 'COMPLT'
PAYMENT.refund_date 기록
  ↓
ORDER.pay_price 차감 또는 CLAIM.refund_amt로 계산
```

---

## 📋 코드 테이블 정의

### PAY_METHOD (결제수단)
```
BANK_TRANSFER    = 무통장입금
VBANK            = 가상계좌
TOSS             = 토스페이먼스
KAKAO            = 카카오페이 (직결제)
NAVER            = 네이버페이 (직결제)
MOBILE           = 핸드폰결제
CACHE            = 적립금 (별도)
```

### PAY_CHANNEL (결제채널 - TOSS한정)
```
CARD             = 신용카드/체크카드
ACCOUNT          = 계좌이체
KAKAO            = 카카오페이 (토스 경유)
NAVER            = 네이버페이 (토스 경유)
```

### PAY_STATUS (결제상태)
```
PENDING          = 결제 진행 중
COMPLT        = 결제 완료
FAILED           = 결제 실패
CANCELLED        = 결제 취소 (사용자)
REFUNDED         = 환불 완료
```

### PAYMENT_CHG_TYPE (결제변경유형)
```
APPROVE          = PG 승인
COMPLETE         = 결제 완료 처리
FAIL             = 결제 실패
REFUND           = 환불 처리
CANCEL           = 주문 취소
RETRY            = 재시도
```

### REFUND_STATUS (환불상태)
```
PENDING          = 환불 대기
COMPLT        = 환불 완료
FAILED           = 환불 실패
```

### CARD_TYPE (카드타입)
```
CREDIT           = 신용카드
DEBIT            = 체크카드
CHECK            = 기타
```

### BANK_CODE (은행코드)
```
SHINHAN          = 신한은행
KOOKMIN          = 국민은행
WOORI            = 우리은행
HANA             = 하나은행
SUHYUP           = 수협
KOREA_CITI       = 씨티은행
DAEGU            = 대구은행
BUSAN            = 부산은행
...등
```

---

## 🔐 보안 규칙

| 항목 | 규칙 |
|---|---|
| **카드번호** | 마스킹 저장 (1234-****-****-5678) |
| **PG 응답** | JSON으로 암호화 저장 |
| **Refund Token** | PG로부터 받은 토큰 따로 저장 (환불 시 필요) |
| **HTTPS** | PG 통신 필수 |
| **접근 제어** | 결제 정보 조회 권한 제한 |

---

## 🚀 통합 포인트

### PG 연동 (토스페이먼스)
```
1. 클라이언트 → PAYMENT 테이블에 임시 record 생성
2. 결제 페이지로 redirect (pay_status_cd = 'PENDING')
3. 사용자 결제 진행
4. 토스 서버 → 우리 서버 콜백 URL로 결과 전송
5. PAYMENT_HIST 생성 + PAYMENT 업데이트
6. ORDER.order_status_cd = 'PAID' 변경
```

### 환불 처리
```
1. 관리자가 CLAIM 승인 (refund_amt 결정)
2. PAYMENT.refund_status_cd = 'PENDING'
3. 환불 API 호출 (PG에 환불 요청)
4. PG로부터 승인 → PAYMENT_HIST 생성
5. PAYMENT.refund_status_cd = 'COMPLT'
```

---

## 📝 샘플 데이터 흐름

### 예1: 신용카드 결제
```
ORDER 생성 (order_id='202604161234abcd', pay_price=100,000)
  ↓
PAYMENT 생성 (payment_id='202604161234xyz1', 
              pay_method_cd='TOSS', 
              pay_channel_cd='CARD', 
              pay_amt=100000,
              pay_status_cd='PENDING')
  ↓
사용자: 토스페이먼스 결제 버튼 → 카드 입력
  ↓
토스 서버 → 콜백
  ↓
PAYMENT 업데이트
  - pay_status_cd='COMPLT'
  - pg_transaction_id='toss_12345678'
  - pg_approval_no='ABC123'
  - pay_date=NOW()
  - card_no='1234-****-****-5678'
  - card_issuer_nm='신한'
  
PAYMENT_HIST 생성
  - chg_type_cd='COMPLETE'
  
ORDER 업데이트
  - order_status_cd='PAID'
```

### 예2: 가상계좌
```
PAYMENT 생성 (pay_method_cd='VBANK', pay_status_cd='PENDING')
  ↓
PG에서 계좌 발급
  ↓
PAYMENT 업데이트
  - vbank_account='123-456-789012'
  - vbank_bank_code='SHINHAN'
  - vbank_due_date='2026-04-23'
  
고객 메일로 계좌번호 안내
  ↓
고객이 해당 계좌로 입금
  ↓
PG → 우리 서버 입금 알림 콜백
  ↓
PAYMENT 업데이트
  - pay_status_cd='COMPLT'
  - vbank_deposit_nm='홍길동'
  - vbank_deposit_date=NOW()
```

### 예3: 환불 (반품)
```
CLAIM 생성 (claim_type_cd='RETURN', claim_status_cd='REQUESTED')
  ↓
관리자 승인
  ↓
PAYMENT 업데이트
  - refund_status_cd='PENDING'
  - refund_amt=100000
  
환불 API 호출 (PG에 100,000원 환불 요청)
  ↓
PG 승인 → 콜백
  ↓
PAYMENT_HIST 생성 (chg_type_cd='REFUND')
PAYMENT 업데이트
  - refund_status_cd='COMPLT'
  - refund_date=NOW()
  
CLAIM 업데이트
  - claim_status_cd='PROCESSING'
```

---

## ✨ 특징

- ✅ **멀티채널**: 다양한 결제 수단 지원
- ✅ **분할결제**: 1주문 N결제 가능
- ✅ **토스 통합**: 토스페이먼스 기반 통합 결제
- ✅ **환불추적**: 환불 상태 및 이력 완벽 관리
- ✅ **보안**: 카드번호 마스킹, PG 데이터 암호화
- ✅ **감시**: 모든 결제 상태 변경을 HIST로 추적
