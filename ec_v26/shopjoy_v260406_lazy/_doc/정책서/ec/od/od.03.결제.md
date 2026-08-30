# od.03. 결제 관리 정책

## 목적
다양한 결제수단 통합 관리, 입금확인 자동화·수동 처리 기준, 부족·초과 입금 처리 정책 정의.

## 범위
결제수단 관리 / PG 연동 및 승인 / 입금확인 / 부족·초과 입금 처리 / 환불 처리

## 관련 테이블
- `od_pay(결제)` — 결제 마스터 (pay_id, pay_method_cd, refund_amt, refund_status_cd)
- `od_pay_mtd(마이페이지 등록 결제수단)` — 회원별 카드/계좌 토큰 저장
- `od_pay_status_hist(결제 상태 이력)` — 결제상태 변경 이력
- `od_pay_chg_hist(결제 변경 이력)` — 결제 변경 이력
- `od_refund(환불)` — 환불 건별 마스터 (클레임 1건 = 환불 1건, 총환불금액·귀책유형)
- `od_refund_method(환불수단 내역)` — 수단별 환불금액 및 처리 상태 (우선순위: 카드1→캐쉬2→적립금3)

---

## 1. 결제수단별 입금확인 정책

### 1-1. 무통장입금 (BANK_TRANSFER)

| 항목 | 내용 |
|---|---|
| 입금확인 방식 | **관리자 수동 확인** (은행 입금내역과 `pay_amt` 대조) |
| COMPLT 전환 | 관리자 수동 처리 |
| 입금기한 | 주문일로부터 1일 (기한 초과 시 자동 취소) |
| 환불 | 입금자명·계좌로 수동 환불 |

**부족입금(미달) 처리**
- 관리자가 입금내역 대조 시 금액 불일치 발견
- `pay_status_cd = PENDING` 유지
- 고객에게 추가입금 안내 또는 주문 취소 처리
- 추가입금 대기 기한: 입금기한과 동일 (1일). 기한 내 미충족 시 자동 취소

**초과입금 처리**
- 관리자가 초과액 확인 → `pay_status_cd → COMPLT` 처리
- 초과액은 캐시(충전금) 적립 또는 환불 중 고객 선택

---

### 1-2. 가상계좌 (VBANK)

| 항목 | 내용 |
|---|---|
| 입금확인 방식 | **PG 웹훅 자동 통보** → `vbank_deposit_date` 기록 → `pay_status_cd → COMPLT` 자동 전환 |
| COMPLT 전환 | 웹훅 수신 후 자동 |
| 입금기한 | 주문일로부터 1일 (`vbank_due_date`). 초과 시 자동 만료·취소 |
| 은행 | 국민·우리·신한·하나·농협 등 PG 제공 은행 |

**부족입금(미달) 처리**
> ⚠️ **설계 주의**: 현재 `od_pay`에 `vbank_deposit_amt`(실제 입금액) 컬럼이 없음.
> PG 웹훅 payload의 `pg_response` JSON에서 실제 입금액을 파싱해 `pay_amt`와 비교하는 검증 로직이 애플리케이션 레이어에 반드시 필요.

- 실제 입금액 < `pay_amt`: 웹훅 수신 후 `pay_status_cd = PENDING` 유지. 관리자 알람 발송
- 추가입금 대기 기한: `vbank_due_date` 기준 (연장 불가)
- 기한 내 미충족 시 자동 취소

**초과입금 처리**
- 실제 입금액 > `pay_amt`: `pay_status_cd → COMPLT` 처리
- 초과액은 캐시(충전금) 적립 또는 환불

---

### 1-3. 토스페이먼츠 (TOSS)

| 항목 | 내용 |
|---|---|
| 입금확인 방식 | **PG 실시간 승인 응답** → 즉시 `pay_status_cd → COMPLT` |
| 세부 채널 (`pay_channel_cd`) | CARD / ACCOUNT / KAKAO / NAVER |
| 할부 | 최대 12개월 (50,000원 이상) |
| PG 응답 저장 | `pg_response` (JSON), `pg_transaction_id`, `pg_approval_no` |

부족·초과 입금 개념 없음 — 승인 금액 = `pay_amt` 일치 보장 (PG가 검증).

---

### 1-4. 카카오페이 (KAKAO) / 네이버페이 (NAVER)

| 항목 | 내용 |
|---|---|
| 입금확인 방식 | **PG 실시간 승인 응답** → 즉시 `pay_status_cd → COMPLT` |
| 사전 등록 | 사용자 앱에서 카드 등록 후 1클릭 결제 |
| 환불 | PG 통해 자동 처리 |

부족·초과 입금 개념 없음 — 승인 금액 = `pay_amt` 일치 보장.

---

### 1-5. 핸드폰결제 (MOBILE)

| 항목 | 내용 |
|---|---|
| 입금확인 방식 | **통신사 콜백 자동 승인** → `pay_status_cd → COMPLT` |
| 한도 | 통신사별 월 한도 (성인 기준 최대 100만원) |
| 환불 | 통신사 정산 주기에 따라 처리 (즉시 환불 불가) |

---

## 2. 결제 프로세스

```
주문 생성
  └→ od_pay 생성 (pay_status_cd = PENDING)
       └→ [수단별 분기]
            ├ BANK_TRANSFER: 입금 대기 → 관리자 확인 → COMPLT (수동)
            ├ VBANK:         입금 대기 → PG 웹훅 수신 → 금액 검증 → COMPLT (자동)
            └ TOSS/KAKAO/NAVER/MOBILE: PG 실시간 승인 → COMPLT (자동)
```

**실패 처리**
- PG 승인 실패 → `pay_status_cd = FAILED`, `failure_code` / `failure_reason` / `failure_date` 기록
- 자동 재시도: 1회 (동일 수단)
- 재결제 가능 기간: 24시간 (이후 주문 취소)

---

## 3. 환불 정책

| 항목 | 내용 |
|---|---|
| 환불 상태 | `refund_status_cd` — PENDING / COMPLT / FAILED |
| 환불 가능 조건 | `pay_status_cd = COMPLT` 또는 `PARTIAL_REFUND` 상태에서만 가능 |
| 환불 기한 | 결제일로부터 60일 |
| 부분환불 흐름 | COMPLT → PARTIAL_REFUND (누적) → REFUNDED (pay_amt 전액 완료 시) |

**수단별 환불 방식**

| 수단 | 환불 방식 | 소요 기간 |
|---|---|---|
| BANK_TRANSFER | 입금자 계좌로 수동 이체 | 1~3 영업일 |
| VBANK | PG 환불 API 자동 처리 | 1~2 영업일 |
| TOSS / KAKAO / NAVER | PG 환불 API 자동 처리 | 3~5 영업일 (카드사 기준) |
| MOBILE | 통신사 정산 주기에 따라 처리 | 익월 요금 차감 |

---

## 4. 보안 정책

- 카드번호 마스킹 저장 (`card_no`: `****-****-****-5678`)
- 중요정보 TLS 암호화 전송
- PCI DSS 기준 준수
- 모든 결제 이력 `od_pay_status_hist` / `od_pay_chg_hist` 기록

---

## 변경이력

- 2026-04-16: 초기 작성
- 2026-04-18: 결제수단별 입금확인 정책 추가 (수동·자동 구분, 부족·초과 입금 처리 기준)
- 2026-04-19: 관련 테이블 od_refund / od_refund_method 추가. 테이블명(코멘트) 형식 통일
