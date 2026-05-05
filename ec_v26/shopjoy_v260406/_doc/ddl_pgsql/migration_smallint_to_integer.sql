-- ═══════════════════════════════════════════════════════════
--  SMALLINT → INTEGER 일괄 마이그레이션
--  대상 스키마: shopjoy_2604
--  작성일: 2026-05-04
-- ═══════════════════════════════════════════════════════════
--  배경:
--   PostgreSQL 의 SMALLINT (int2) 는 JPA Entity 의 Integer 타입과 매핑 불일치.
--   Hibernate 는 Integer → INTEGER (int4) 를 기대.
--   "wrong column type encountered ... found [int2] but expecting [integer]" 해결 목적.
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver):
--    SET search_path TO shopjoy_2604;
--    아래 스크립트 실행
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───── ec.mb ─────
ALTER TABLE mbh_member_login_log ALTER COLUMN fail_cnt        TYPE INTEGER;

-- ───── ec.pd ─────
ALTER TABLE pd_category          ALTER COLUMN category_depth  TYPE INTEGER;

-- ───── ec.od ─────
ALTER TABLE od_refund_method     ALTER COLUMN refund_priority TYPE INTEGER;

-- ───── sy ─────
ALTER TABLE syh_user_login_log   ALTER COLUMN fail_cnt        TYPE INTEGER;
ALTER TABLE syh_api_log          ALTER COLUMN http_status     TYPE INTEGER;
ALTER TABLE sy_role_menu         ALTER COLUMN perm_level      TYPE INTEGER;
ALTER TABLE sy_user              ALTER COLUMN login_fail_cnt  TYPE INTEGER;

-- ═══════════════════════════════════════════════════════════
--  검증 쿼리
-- ═══════════════════════════════════════════════════════════
-- 남은 SMALLINT 컬럼 확인 (0건이어야 정상):
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND data_type = 'smallint'
-- ORDER BY table_name, column_name;
