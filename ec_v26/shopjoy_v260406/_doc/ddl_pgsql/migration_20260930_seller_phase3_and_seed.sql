-- ═══════════════════════════════════════════════════════════
--  셀러(seller_id) 컨셉 Phase 3 조기착수 — 정산/환불 seller_id 확장 + 창고 테이블 + 샘플 데이터
--  작성일: 2026-09-30
--  전제  : migration_20260929_seller_phase1.sql 적용 완료(mb_seller/mb_seller_member 존재)
--
--  포함 범위:
--    1) st_* 정산 7개 테이블에 seller_id 컬럼 추가 + 기존 vendor_id 데이터 백필
--       (od_refund는 seller_id 불필요 — order_id/claim_id를 통해 이미 간접 조회 가능한 정규화
--        구조라 컬럼 추가하지 않음. 정산 시 od_refund 금액은 st_settle.total_return_amt로 집계)
--    2) mb_seller_warehouse(판매자 창고/출고지·반품지) 신규 테이블
--    3) 샘플 데이터: 개인 셀러 3건(기존 테스트 회원과 연결), 업체 셀러 일부에 담당자 연결,
--       정산 샘플, 창고 샘플
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) st_* 7개 테이블 seller_id 확장 + 백필
-- ───────────────────────────────────────────────────────────
-- vendor_id가 NOT NULL이던 3개 테이블(st_settle/st_settle_item/st_settle_pay) — 개인 셀러는
-- vendor_id가 없는(NULL) 게 정상이라 nullable로 완화한다. seller_id가 새 단일 기준.
ALTER TABLE shopjoy_2604.st_settle        ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE shopjoy_2604.st_settle_item   ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE shopjoy_2604.st_settle_pay    ALTER COLUMN vendor_id DROP NOT NULL;

ALTER TABLE shopjoy_2604.st_settle        ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_settle_item   ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_settle_config ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_settle_pay    ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_settle_raw    ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_recon         ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);
ALTER TABLE shopjoy_2604.st_erp_voucher   ADD COLUMN IF NOT EXISTS seller_id VARCHAR(21);

COMMENT ON COLUMN shopjoy_2604.st_settle.seller_id        IS '판매자ID (mb_seller.seller_id) — 정산 대상 단일 기준';
COMMENT ON COLUMN shopjoy_2604.st_settle_item.seller_id   IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_config.seller_id IS '판매자ID (mb_seller.seller_id, NULL=전체 기준)';
COMMENT ON COLUMN shopjoy_2604.st_settle_pay.seller_id    IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.st_settle_raw.seller_id    IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.st_recon.seller_id         IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.st_erp_voucher.seller_id   IS '판매자ID (mb_seller.seller_id)';

CREATE INDEX IF NOT EXISTS idx_st_settle_seller        ON shopjoy_2604.st_settle (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_item_seller   ON shopjoy_2604.st_settle_item (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_config_seller ON shopjoy_2604.st_settle_config (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_pay_seller    ON shopjoy_2604.st_settle_pay (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_settle_raw_seller    ON shopjoy_2604.st_settle_raw (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_recon_seller         ON shopjoy_2604.st_recon (seller_id);
CREATE INDEX IF NOT EXISTS idx_st_erp_voucher_seller   ON shopjoy_2604.st_erp_voucher (seller_id);

-- FK (참조 테이블 존재 시에만, 이미 있으면 스킵)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['st_settle','st_settle_item','st_settle_config','st_settle_pay','st_settle_raw','st_recon','st_erp_voucher']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_schema='shopjoy_2604' AND table_name=t AND constraint_name = 'fk_'||t||'_seller')
    THEN
      EXECUTE format('ALTER TABLE shopjoy_2604.%I ADD CONSTRAINT fk_%I_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id)', t, t);
    END IF;
  END LOOP;
END $$;

-- 백필: 기존 vendor_id 값 → 대응 mb_seller.seller_id
UPDATE shopjoy_2604.st_settle        s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL;
UPDATE shopjoy_2604.st_settle_item   s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL;
UPDATE shopjoy_2604.st_settle_config s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL AND s.vendor_id IS NOT NULL;
UPDATE shopjoy_2604.st_settle_pay    s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL;
UPDATE shopjoy_2604.st_settle_raw    s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL AND s.vendor_id IS NOT NULL;
UPDATE shopjoy_2604.st_recon         s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL AND s.vendor_id IS NOT NULL;
UPDATE shopjoy_2604.st_erp_voucher   s SET seller_id = ms.seller_id FROM shopjoy_2604.mb_seller ms WHERE ms.vendor_id = s.vendor_id AND s.seller_id IS NULL AND s.vendor_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────
-- 2) mb_seller_warehouse — 판매자 창고(출고지/반품지)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.mb_seller_warehouse (
    warehouse_id   VARCHAR(21)  NOT NULL PRIMARY KEY,
    seller_id      VARCHAR(21)  NOT NULL,
    warehouse_nm   VARCHAR(100) NOT NULL,
    zip_code       VARCHAR(10),
    addr           VARCHAR(200),
    addr_detail    VARCHAR(200),
    contact_nm     VARCHAR(50),
    contact_phone  VARCHAR(20),
    is_default     CHAR(1),
    is_return_addr CHAR(1),
    use_yn         CHAR(1),
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP DEFAULT NOW(),
    reg_site_id    VARCHAR(21),
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP
);
COMMENT ON TABLE  shopjoy_2604.mb_seller_warehouse                 IS '판매자 창고(출고지/반품지)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_warehouse.warehouse_id        IS 'PK';
COMMENT ON COLUMN shopjoy_2604.mb_seller_warehouse.seller_id            IS '판매자ID (mb_seller.seller_id)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_warehouse.warehouse_nm         IS '창고명';
COMMENT ON COLUMN shopjoy_2604.mb_seller_warehouse.is_default           IS '기본 출고지 여부 Y/N (셀러당 1개 권장)';
COMMENT ON COLUMN shopjoy_2604.mb_seller_warehouse.is_return_addr       IS '반품지로도 사용 여부 Y/N';

CREATE INDEX IF NOT EXISTS idx_mb_seller_warehouse_seller ON shopjoy_2604.mb_seller_warehouse (seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mb_seller_warehouse_default ON shopjoy_2604.mb_seller_warehouse(seller_id) WHERE is_default='Y';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE table_schema='shopjoy_2604' AND table_name='mb_seller_warehouse' AND constraint_name='fk_mb_seller_warehouse_seller')
  THEN
    ALTER TABLE shopjoy_2604.mb_seller_warehouse
      ADD CONSTRAINT fk_mb_seller_warehouse_seller FOREIGN KEY (seller_id) REFERENCES shopjoy_2604.mb_seller (seller_id);
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────
-- 3) 샘플 데이터 — 개인 셀러 3건(기존 테스트 회원 재사용) + 업체 셀러 담당자 연결 + 정산/창고 샘플
--    기존 테스트 계정(claude-dp-test, claude-dp-test2~5)을 재사용한다 — 실 고객 데이터 아님,
--    2026-09-13 dp 위젯 작업 때 만들어진 테스트 전용 회원.
-- ───────────────────────────────────────────────────────────

-- 3-1) 개인 셀러 3건
-- (정산/환불 정보는 mb_seller에 컬럼을 추가하지 않고 st_settle 체계로 통합하기로 했으므로
--  settle_bank_* 필드만 채운다 — 환불계좌는 별도로 안 두고 정산계좌와 동일하게 취급)
INSERT INTO shopjoy_2604.mb_seller (seller_id, seller_nm, seller_type_cd, seller_status_cd, settle_bank_nm, settle_bank_account, settle_bank_holder, reg_by, reg_date)
SELECT 'SEL260930000001', 'ClaudeTest 셀러샵', 'INDIVIDUAL', 'ACTIVE', '국민은행', '123456-01-123456', 'ClaudeTest', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller WHERE seller_id = 'SEL260930000001');
INSERT INTO shopjoy_2604.mb_seller (seller_id, seller_nm, seller_type_cd, seller_status_cd, settle_bank_nm, settle_bank_account, settle_bank_holder, reg_by, reg_date)
SELECT 'SEL260930000002', 'ClaudeTest2 소품샵', 'INDIVIDUAL', 'ACTIVE', '신한은행', '110-234-567890', 'ClaudeTest2', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller WHERE seller_id = 'SEL260930000002');
INSERT INTO shopjoy_2604.mb_seller (seller_id, seller_nm, seller_type_cd, seller_status_cd, settle_bank_nm, settle_bank_account, settle_bank_holder, reg_by, reg_date)
SELECT 'SEL260930000003', 'ClaudeTest3 핸드메이드', 'INDIVIDUAL', 'PENDING', NULL, NULL, NULL, 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller WHERE seller_id = 'SEL260930000003');

-- 3-2) 개인 셀러 ↔ 회원 연결 (본인=OWNER=대표=기본셀러)
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000001', 'SEL260930000001', member_id, 'OWNER', 'Y', 'Y', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_member WHERE login_id = 'claude-dp-test'
AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller_member WHERE seller_member_id = 'SM260930000001');
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000002', 'SEL260930000002', member_id, 'OWNER', 'Y', 'Y', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_member WHERE login_id = 'claude-dp-test2'
AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller_member WHERE seller_member_id = 'SM260930000002');
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000003', 'SEL260930000003', member_id, 'OWNER', 'Y', 'Y', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_member WHERE login_id = 'claude-dp-test3'
AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller_member WHERE seller_member_id = 'SM260930000003');

-- 3-3) 업체 셀러(기존 17건 중 2곳) 담당자로 테스트 회원 연결 — 회원 1명(test4)이 여러 셀러에
--      속하는 N:M 사례, test5는 1개 업체에만 STAFF로 연결(대표 아님)
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000004', s.seller_id, m.member_id, 'STAFF', 'Y', 'Y', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_seller s, shopjoy_2604.mb_member m
WHERE s.seller_type_cd='COMPANY' AND m.login_id='claude-dp-test4'
ORDER BY s.reg_date LIMIT 1
ON CONFLICT DO NOTHING;
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000005', s.seller_id, m.member_id, 'STAFF', 'N', 'N', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_seller s, shopjoy_2604.mb_member m
WHERE s.seller_type_cd='COMPANY' AND m.login_id='claude-dp-test4'
ORDER BY s.reg_date OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;
INSERT INTO shopjoy_2604.mb_seller_member (seller_member_id, seller_id, member_id, role_cd, is_main, is_default, status_cd, reg_by, reg_date)
SELECT 'SM260930000006', s.seller_id, m.member_id, 'STAFF', 'N', 'Y', 'ACTIVE', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_seller s, shopjoy_2604.mb_member m
WHERE s.seller_type_cd='COMPANY' AND m.login_id='claude-dp-test5'
ORDER BY s.reg_date OFFSET 2 LIMIT 1
ON CONFLICT DO NOTHING;

-- 3-4) 창고 샘플 — 개인 셀러 2곳 + 업체 셀러 1곳 기본 출고지
INSERT INTO shopjoy_2604.mb_seller_warehouse (warehouse_id, seller_id, warehouse_nm, zip_code, addr, addr_detail, contact_nm, contact_phone, is_default, is_return_addr, use_yn, reg_by, reg_date)
SELECT 'WH260930000001', 'SEL260930000001', '자택 출고지', '06236', '서울특별시 강남구 테헤란로 152', '3층', 'ClaudeTest', '010-1111-2222', 'Y', 'Y', 'Y', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller_warehouse WHERE warehouse_id='WH260930000001');
INSERT INTO shopjoy_2604.mb_seller_warehouse (warehouse_id, seller_id, warehouse_nm, zip_code, addr, addr_detail, contact_nm, contact_phone, is_default, is_return_addr, use_yn, reg_by, reg_date)
SELECT 'WH260930000002', 'SEL260930000002', '작업실 출고지', '13529', '경기도 성남시 분당구 판교역로 235', '2층 201호', 'ClaudeTest2', '010-3333-4444', 'Y', 'Y', 'Y', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.mb_seller_warehouse WHERE warehouse_id='WH260930000002');
INSERT INTO shopjoy_2604.mb_seller_warehouse (warehouse_id, seller_id, warehouse_nm, zip_code, addr, addr_detail, contact_nm, contact_phone, is_default, is_return_addr, use_yn, reg_by, reg_date)
SELECT 'WH260930000003', s.seller_id, '본사 물류센터', '16827', '경기도 용인시 기흥구 신갈로 105', '물류동 1층', '물류팀', '031-555-6666', 'Y', 'N', 'Y', 'MIGRATION_20260930', NOW()
FROM shopjoy_2604.mb_seller s WHERE s.seller_type_cd='COMPANY' ORDER BY s.reg_date LIMIT 1
ON CONFLICT DO NOTHING;

-- 3-5) 정산 샘플 — 개인 셀러 1곳에 완료(PAID) 1건 + 진행중(DRAFT) 1건
INSERT INTO shopjoy_2604.st_settle (settle_id, seller_id, vendor_id, settle_ym, settle_start_date, settle_end_date,
    total_order_amt, total_return_amt, total_discnt_amt, commission_rate, commission_amt, settle_amt, adj_amt, etc_adj_amt, final_settle_amt,
    settle_status_cd, simul_yn, reg_by, reg_date)
SELECT 'STL260930000001', 'SEL260930000001', NULL, '202608', '2026-08-01 00:00:00', '2026-08-31 23:59:59',
    850000, 50000, 30000, 10.0, 77000, 693000, 0, 0, 693000,
    'PAID', 'Y', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.st_settle WHERE settle_id='STL260930000001');
INSERT INTO shopjoy_2604.st_settle (settle_id, seller_id, vendor_id, settle_ym, settle_start_date, settle_end_date,
    total_order_amt, total_return_amt, total_discnt_amt, commission_rate, commission_amt, settle_amt, adj_amt, etc_adj_amt, final_settle_amt,
    settle_status_cd, simul_yn, reg_by, reg_date)
SELECT 'STL260930000002', 'SEL260930000001', NULL, '202609', '2026-09-01 00:00:00', '2026-09-30 23:59:59',
    420000, 0, 15000, 10.0, 40500, 364500, 0, 0, 364500,
    'DRAFT', 'Y', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.st_settle WHERE settle_id='STL260930000002');

-- 3-6) 지급 샘플 — PAID된 STL260930000001의 실제 지급 내역
INSERT INTO shopjoy_2604.st_settle_pay (settle_pay_id, settle_id, seller_id, pay_amt, pay_method_cd, bank_nm, bank_account, bank_holder, pay_status_cd, pay_date, pay_by, reg_by, reg_date)
SELECT 'STP260930000001', 'STL260930000001', 'SEL260930000001', 693000, 'BANK_TRANSFER', '국민은행', '123456-01-123456', 'ClaudeTest', 'COMPLT', '2026-09-05 10:00:00', 'MIGRATION_20260930', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.st_settle_pay WHERE settle_pay_id='STP260930000001');

-- 3-7) 정산기준(수수료율) 샘플 — 개인 셀러는 업체보다 수수료율을 살짝 높게(15%) 설정
INSERT INTO shopjoy_2604.st_settle_config (settle_config_id, seller_id, vendor_id, settle_cycle_cd, settle_day, commission_rate, min_settle_amt, use_yn, reg_by, reg_date)
SELECT 'STC260930000001', 'SEL260930000001', NULL, 'MONTHLY', 5, 15.0, 10000, 'Y', 'MIGRATION_20260930', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.st_settle_config WHERE settle_config_id='STC260930000001');

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT seller_type_cd, count(*) FROM shopjoy_2604.mb_seller GROUP BY seller_type_cd;
-- SELECT * FROM shopjoy_2604.mb_seller_member ORDER BY reg_date DESC;
-- SELECT * FROM shopjoy_2604.mb_seller_warehouse;
-- SELECT settle_id, seller_id, vendor_id, settle_status_cd, final_settle_amt FROM shopjoy_2604.st_settle ORDER BY reg_date DESC LIMIT 5;
-- SELECT count(*) FROM shopjoy_2604.st_settle WHERE vendor_id IS NOT NULL AND seller_id IS NULL; -- 0이어야 정상
