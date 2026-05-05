-- ═══════════════════════════════════════════════════════════
--  CHAR(N) → VARCHAR(N) 일괄 마이그레이션 (N > 1)
--  대상 스키마: shopjoy_2604
--  작성일: 2026-05-04
-- ═══════════════════════════════════════════════════════════
--  배경:
--   PostgreSQL 의 CHAR(N) (bpchar) 은 JPA Entity 의 String + length=N 매핑과
--   타입 검증에서 불일치 발생. Hibernate 는 VARCHAR(N) 을 기대.
--   이전 migration_char_to_varchar.sql 은 CHAR(1) 만 처리.
--   이 파일은 CHAR(2 이상) 를 처리.
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───── ec.st ─────
ALTER TABLE st_erp_voucher ALTER COLUMN settle_ym TYPE VARCHAR(6);
ALTER TABLE st_settle      ALTER COLUMN settle_ym TYPE VARCHAR(6);

-- ═══════════════════════════════════════════════════════════
--  검증 쿼리
-- ═══════════════════════════════════════════════════════════
-- 남은 bpchar 컬럼 (CHAR 류) 확인 (0건이어야 정상):
-- SELECT table_name, column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND data_type = 'character'
-- ORDER BY table_name, column_name;
