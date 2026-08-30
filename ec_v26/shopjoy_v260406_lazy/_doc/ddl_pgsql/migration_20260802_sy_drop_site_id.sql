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

-- ── 뷰 재생성 (site_id 제거 후 — grp_site_id도 제거됨) ──

DROP VIEW IF EXISTS vw_sy_attach    CASCADE;
DROP VIEW IF EXISTS vw_sy_code      CASCADE;
DROP VIEW IF EXISTS vw_sy_role_menu CASCADE;

CREATE OR REPLACE VIEW vw_sy_attach AS
SELECT a.attach_id, a.attach_grp_id, a.file_nm, a.file_size, a.file_ext,
       a.mime_type_cd, a.stored_nm, a.storage_type, a.storage_path,
       a.attach_url, a.cdn_host, a.cdn_img_url, a.cdn_thumb_url,
       a.thumb_file_nm, a.thumb_stored_nm, a.thumb_url, a.thumb_cdn_url,
       a.thumb_generated_yn, a.sort_ord, a.attach_memo, a.physical_path,
       a.reg_by, a.reg_date, a.upd_by, a.upd_date,
       g.attach_grp_code, g.attach_grp_nm, g.file_ext_allow,
       g.max_file_size, g.max_file_count,
       g.storage_path AS grp_storage_path,
       g.use_yn AS grp_use_yn,
       g.sort_ord AS grp_sort_ord
FROM sy_attach a
INNER JOIN sy_attach_grp g ON g.attach_grp_id = a.attach_grp_id;

CREATE OR REPLACE VIEW vw_sy_code AS
SELECT c.code_id, c.code_grp_id,
       g.code_grp, g.grp_nm,
       c.code_value, c.code_label, c.sort_ord, c.use_yn,
       c.parent_code_value, c.child_code_values, c.code_remark,
       c.code_level, c.code_opt1,
       c.reg_by, c.reg_date, c.upd_by, c.upd_date
FROM sy_code c
LEFT JOIN sy_code_grp g ON g.code_grp_id = c.code_grp_id;

CREATE OR REPLACE VIEW vw_sy_role_menu AS
SELECT rm.role_menu_id, rm.role_id, rm.menu_id, rm.perm_level,
       rm.reg_by, rm.reg_date, rm.upd_by, rm.upd_date,
       r.role_code, r.role_nm, r.role_type_cd, r.role_remark,
       r.use_yn AS role_use_yn,
       r.parent_role_id,
       r.sort_ord AS role_sort_ord
FROM sy_role_menu rm
INNER JOIN sy_role r ON r.role_id = rm.role_id;

-- ============================================================
-- 완료 검증:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'shopjoy_2604'
--   AND table_name LIKE 'sy%'
--   AND column_name = 'site_id'
-- ORDER BY table_name;
-- → 결과: 0건 (sy_site 제외)
-- ============================================================
