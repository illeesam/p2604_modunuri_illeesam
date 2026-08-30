-- ============================================================================
-- 마이그레이션: VIEW 정의의 bare JOIN → INNER JOIN 명시
--
-- 배경: sy.55.mybatis쿼리테이블별칭정책.md §5 신설 — JOIN 종류(INNER/LEFT/RIGHT/FULL)를
--       항상 명시한다. 아래 4개 뷰는 정의에 순수 JOIN(=INNER JOIN)을 쓰고 있었다.
--
-- ⚠ PostgreSQL 특성: CREATE VIEW 시점에 INNER JOIN 이라고 적어도, 뷰는 파싱된 쿼리
--   트리로 저장되고 pg_get_viewdef() 로 되돌려 보여줄 때 INNER 키워드는 항상 생략되어
--   그냥 JOIN 으로 정규화된다(LEFT/RIGHT/FULL 은 유지됨). 즉 이 마이그레이션을 실행해도
--   \d+ 나 DB 클라이언트로 다시 열어보면 "JOIN" 으로 보이는 게 정상이며 버그가 아니다.
--   이 파일(소스 텍스트)에 INNER JOIN 을 남겨 의도를 문서화하는 데 의미가 있다.
--
-- 대상: vw_dp_area / vw_dp_panel / vw_dp_panel_item / vw_sy_role_menu
--   (SELECT 컬럼 목록·순서·별칭은 기존과 완전히 동일 — JOIN 키워드만 교체.
--    CREATE OR REPLACE VIEW 라 뷰 OID·의존 객체·권한 유지됨)
--
-- 참고: vw_dp_disp / vw_sy_code 는 이미 LEFT JOIN 을 명시하고 있어 대상 아님.
--
-- 일자: 2026-08-19
-- ============================================================================

CREATE OR REPLACE VIEW shopjoy_2604.vw_dp_area AS
SELECT a.area_id, a.ui_id, a.area_cd, a.area_nm, a.area_type_cd, a.area_desc, a.path_id,
       a.use_yn, a.use_start_date, a.use_end_date, a.reg_by, a.reg_date, a.reg_site_id, a.upd_by, a.upd_date,
       u.ui_cd, u.ui_nm, u.ui_desc, u.device_type_cd, u.use_yn AS ui_use_yn
FROM shopjoy_2604.dp_area a
INNER JOIN shopjoy_2604.dp_ui u ON u.ui_id::text = a.ui_id::text;

CREATE OR REPLACE VIEW shopjoy_2604.vw_dp_panel AS
SELECT p.panel_id, p.area_id, p.panel_nm, p.panel_type_cd, p.path_id, p.visibility_targets, p.use_yn,
       p.use_start_date, p.use_end_date, p.disp_panel_status_cd, p.disp_panel_status_cd_before, p.content_json,
       p.reg_by, p.reg_date, p.reg_site_id, p.upd_by, p.upd_date,
       a.area_cd, a.area_nm, a.area_desc, a.ui_id, a.area_type_cd,
       u.ui_cd, u.ui_nm, u.ui_desc
FROM shopjoy_2604.dp_panel p
INNER JOIN shopjoy_2604.dp_area a ON a.area_id::text = p.area_id::text
INNER JOIN shopjoy_2604.dp_ui u ON u.ui_id::text = a.ui_id::text;

CREATE OR REPLACE VIEW shopjoy_2604.vw_dp_panel_item AS
SELECT pi.panel_item_id, pi.panel_id, pi.widget_lib_id, pi.widget_type_cd, pi.widget_title, pi.widget_content,
       pi.title_show_yn, pi.widget_lib_ref_yn, pi.content_type_cd, pi.sort_ord, pi.widget_config_json,
       pi.visibility_targets, pi.disp_yn, pi.disp_start_dt, pi.disp_end_dt, pi.disp_env, pi.use_yn,
       pi.reg_by, pi.reg_date, pi.reg_site_id, pi.upd_by, pi.upd_date,
       p.panel_nm, p.panel_type_cd, p.area_id, p.disp_panel_status_cd,
       a.area_cd, a.area_nm, a.ui_id,
       u.ui_cd, u.ui_nm
FROM shopjoy_2604.dp_panel_item pi
INNER JOIN shopjoy_2604.dp_panel p ON p.panel_id::text = pi.panel_id::text
INNER JOIN shopjoy_2604.dp_area a ON a.area_id::text = p.area_id::text
INNER JOIN shopjoy_2604.dp_ui u ON u.ui_id::text = a.ui_id::text;

CREATE OR REPLACE VIEW shopjoy_2604.vw_sy_role_menu AS
SELECT rm.role_menu_id, rm.role_id, rm.menu_id, rm.perm_level, rm.reg_by, rm.reg_date, rm.upd_by, rm.upd_date,
       r.role_code, r.role_nm, r.role_type_cd, r.role_remark, r.use_yn AS role_use_yn, r.parent_role_id, r.sort_ord AS role_sort_ord
FROM shopjoy_2604.sy_role_menu rm
INNER JOIN shopjoy_2604.sy_role r ON r.role_id::text = rm.role_id::text;

-- 부수 작업: 위 4개 뷰 + vw_dp_disp / vw_sy_code / zzvw_table_info / zzvi_* 전체
-- 컬럼 한글명·공통코드 그룹 주석 → migration_view_column_comments.sql 참조 (같은 날 별도 적용)
