-- migration: od_pay 샘플 결제 데이터 INSERT
-- 2026-07-05
-- 배경: od_pay 테이블에 샘플 데이터가 없어 클레임 계산 모달의 "결제 상세 정보"가 빈 상태로 표시됨
-- 목적: 테스트용 주문에 결제 내역을 추가하여 UI 동작 검증

SET search_path TO shopjoy_2604;

-- 기존 주문 목록 확인 쿼리 (실행 전 아래 쿼리로 order_id 목록 확인 권장)
-- SELECT order_id, order_no, pay_amt, order_status_cd FROM od_order ORDER BY reg_date DESC LIMIT 20;

-- 기존 od_pay 데이터 확인 쿼리
-- SELECT order_id, pay_method_cd, pay_amt, pay_status_cd FROM od_pay ORDER BY reg_date DESC LIMIT 20;

-- ────────────────────────────────────────────────────────────────────────
-- 아래 INSERT는 실제 od_order에 존재하는 order_id 기반이어야 함
-- order_id는 od_order 테이블에서 실제 값을 조회하여 교체해야 함
-- ────────────────────────────────────────────────────────────────────────

-- 주문별 결제 데이터 INSERT (실제 order_id로 교체 필요)
-- INSERT INTO od_pay (
--     pay_id, site_id, order_id, pay_div_cd, pay_dir_cd, pay_occur_type_cd,
--     pay_method_cd, pay_amt, balance_amt, pay_status_cd, pay_date,
--     pg_company_cd, pg_transaction_id, card_no, card_issuer_nm,
--     reg_by, reg_date, upd_by, upd_date
-- ) VALUES
-- (
--     'PAY' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHHMMSS') || '0001',
--     'SITE000001',
--     'ORD-2026-025',  -- ← 실제 order_id로 교체
--     'ORDER', 'DEPOSIT', 'ORDER',
--     'CARD', 89000, 89000, 'PAID', NOW() - INTERVAL '5 days',
--     'TOSS', 'PG_TRANS_20260701_001', '****-****-****-5678', '신한카드',
--     'admin01', NOW(), 'admin01', NOW()
-- );

-- 자동 INSERT: od_order 테이블에 있는 첫 10개 주문에 카드 결제 데이터 추가
-- (이미 od_pay가 있는 주문은 skip)
INSERT INTO od_pay (
    pay_id, site_id, order_id, pay_div_cd, pay_dir_cd, pay_occur_type_cd,
    pay_method_cd, pay_amt, balance_amt, pay_status_cd, pay_date,
    pg_company_cd, pg_transaction_id, card_no, card_issuer_nm,
    installment_month,
    reg_by, reg_date, upd_by, upd_date
)
SELECT
    'PAY' || TO_CHAR(o.reg_date, 'YYYYMMDD') || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY o.reg_date) AS TEXT), 8, '0') AS pay_id,
    o.site_id,
    o.order_id,
    'ORDER'   AS pay_div_cd,
    'DEPOSIT' AS pay_dir_cd,
    'ORDER'   AS pay_occur_type_cd,
    'CARD'    AS pay_method_cd,
    COALESCE(o.pay_amt, 0) AS pay_amt,
    COALESCE(o.pay_amt, 0) AS balance_amt,
    'PAID'    AS pay_status_cd,
    o.reg_date + INTERVAL '5 minutes' AS pay_date,
    'TOSS'    AS pg_company_cd,
    'PG-TOSS-' || SUBSTRING(o.order_id FROM 5) AS pg_transaction_id,
    '****-****-****-' || LPAD(CAST(ABS(HASHTEXT(o.order_id)) % 10000 AS TEXT), 4, '0') AS card_no,
    '신한카드'  AS card_issuer_nm,
    0           AS installment_month,
    'admin01'  AS reg_by,
    NOW()      AS reg_date,
    'admin01'  AS upd_by,
    NOW()      AS upd_date
FROM od_order o
WHERE NOT EXISTS (
    SELECT 1 FROM od_pay p WHERE p.order_id = o.order_id AND p.pay_div_cd = 'ORDER'
)
ORDER BY o.reg_date DESC
LIMIT 20;

-- 결과 확인
SELECT
    p.pay_id, p.order_id, p.pay_method_cd,
    p.pay_amt, p.pay_status_cd,
    (SELECT o.order_no FROM od_order o WHERE o.order_id = p.order_id) AS order_no
FROM od_pay p
ORDER BY p.reg_date DESC
LIMIT 20;
