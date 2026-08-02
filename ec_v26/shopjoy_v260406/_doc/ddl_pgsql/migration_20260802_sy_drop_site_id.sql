-- ============================================================
-- 2026-08-02  sy_* / syh_* 테이블에서 site_id 컬럼 일괄 제거
-- 배경: sy 도메인은 단일 플랫폼 운영 → 테이블별 site_id 격리 불필요
--       (ec 도메인은 2026-05-17 완료, sy 도메인은 이번 마이그레이션으로 완료)
-- 주의: sy_site 테이블의 site_id 는 PK 이므로 제외
-- 실행 전: EcAdminApi 애플리케이션 중단 권장 (JPA 스키마 불일치 방지)
-- 실행 후: ./gradlew clean build -x test → 재기동
-- ============================================================

SET search_path = shopjoy_2604;

-- ── sy 도메인 ─────────────────────────────────────────────

ALTER TABLE sy_alarm            DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_attach           DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_attach_grp       DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_batch            DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_bbm              DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_bbs              DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_brand            DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_code             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_code_grp         DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_contact          DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_dept             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_i18n             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_i18n_msg         DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_menu             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_notice           DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_path             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_prop             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_role             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_role_menu        DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_template         DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_user             DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_user_pref        DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_user_role        DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_vendor           DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_vendor_brand     DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_vendor_content   DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_vendor_user      DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_vendor_user_role DROP COLUMN IF EXISTS site_id;
ALTER TABLE sy_voc              DROP COLUMN IF EXISTS site_id;

-- ── syh 이력 도메인 ────────────────────────────────────────

ALTER TABLE syh_access_error_log  DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_access_log        DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_alarm_send_hist   DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_api_log           DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_batch_hist        DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_batch_log         DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_ext_test_log      DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_send_email_log    DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_send_msg_log      DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_user_login_log    DROP COLUMN IF EXISTS site_id;
ALTER TABLE syh_user_token_log    DROP COLUMN IF EXISTS site_id;

-- ── 뷰 재생성 (컬럼 제거 후 컬럼 참조가 사라지므로 재생성 필요) ──
-- vw_sy_attach, vw_sy_code, vw_sy_role_menu 는 뷰 정의 파일 참조 후 재실행
-- (뷰 DDL: _doc/ddl_pgsql/sy/vw_sy_*.sql)

-- ============================================================
-- 완료 검증:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND table_name LIKE 'sy%'
--   AND column_name = 'site_id'
-- ORDER BY table_name;
-- → 결과: 0건 (sy_site 제외)
-- ============================================================
