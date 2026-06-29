-- migration: od_pay 에 payment_key / pg_provider / balance_amt 컬럼 추가
-- 2026-06-29
-- 배경: 토스 부분취소 지원을 위해
--   1) payment_key  — 토스 발급 paymentKey (취소/조회 식별자)
--   2) pg_provider  — PG 제공자 식별자 (toss_widget / kakao / naver 등)
--   3) balance_amt  — 잔여 취소 가능 금액 (부분취소마다 토스 balanceAmount 동기화)

SET search_path TO shopjoy_2604;

-- 1) 토스 paymentKey (결제창 후 토스가 발급하는 고유키)
ALTER TABLE od_pay
    ADD COLUMN IF NOT EXISTS payment_key VARCHAR(200);

COMMENT ON COLUMN od_pay.payment_key IS '토스 paymentKey (결제창 후 토스 발급 — 취소/조회 시 사용)';

-- 2) PG 제공자 식별자 (pg_company_cd 보다 세분화된 widget 구분용)
ALTER TABLE od_pay
    ADD COLUMN IF NOT EXISTS pg_provider VARCHAR(50);

COMMENT ON COLUMN od_pay.pg_provider IS 'PG 제공자 식별자 (toss_widget/kakao/naver 등 프론트 전달값)';

-- 3) 잔여 취소 가능 금액 (결제 직후 pay_amt 로 초기화, 부분취소마다 감소)
ALTER TABLE od_pay
    ADD COLUMN IF NOT EXISTS balance_amt BIGINT DEFAULT 0;

COMMENT ON COLUMN od_pay.balance_amt IS '잔여 취소 가능 금액 (pay_amt - 누적취소액 = 부분취소 후 토스 balanceAmount)';

-- 4) 기존 행 초기화: balance_amt = pay_amt (미취소 상태 가정)
UPDATE od_pay
SET    balance_amt = pay_amt
WHERE  balance_amt = 0
  AND  pay_status_cd NOT IN ('CANCELED', 'REFUNDED');

-- 5) payment_key 조회 인덱스 (취소 시 paymentKey로 od_pay 조회)
CREATE INDEX IF NOT EXISTS idx_od_pay_payment_key
    ON od_pay (payment_key)
    WHERE payment_key IS NOT NULL;

-- 확인 쿼리
-- SELECT column_name, data_type, character_maximum_length, column_default
-- FROM   information_schema.columns
-- WHERE  table_schema = 'shopjoy_2604'
--   AND  table_name   = 'od_pay'
--   AND  column_name IN ('payment_key', 'pg_provider', 'balance_amt')
-- ORDER  BY ordinal_position;
