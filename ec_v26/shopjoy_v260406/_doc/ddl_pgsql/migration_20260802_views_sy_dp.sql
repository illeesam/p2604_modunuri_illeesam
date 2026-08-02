-- migration_20260802_views_sy_dp.sql
-- vw_sy_code: LEFT JOIN -> INNER JOIN
-- vw_sy_attach, vw_sy_role_menu, vw_dp_area, vw_dp_panel, vw_dp_panel_item 신규 생성

-- ============================================================
-- 작업 0: vw_sy_code (LEFT JOIN -> INNER JOIN)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_sy_code;
CREATE VIEW shopjoy_2604.vw_sy_code AS
SELECT
    c.code_id, c.site_id, c.code_grp_id,
    g.code_grp,
    c.code_value, c.code_label, c.sort_ord, c.use_yn,
    c.parent_code_value, c.child_code_values, c.code_remark,
    c.code_level, c.code_opt1,
    c.reg_by, c.reg_date, c.upd_by, c.upd_date
FROM shopjoy_2604.sy_code c
INNER JOIN shopjoy_2604.sy_code_grp g ON g.code_grp_id = c.code_grp_id;

-- ============================================================
-- 작업 1: vw_sy_attach (sy_attach + sy_attach_grp)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_sy_attach;
CREATE VIEW shopjoy_2604.vw_sy_attach AS
SELECT
    a.attach_id,
    a.site_id,
    a.attach_grp_id,
    a.file_nm,
    a.file_size,
    a.file_ext,
    a.mime_type_cd,
    a.stored_nm,
    a.storage_type,
    a.storage_path,
    a.attach_url,
    a.cdn_host,
    a.cdn_img_url,
    a.cdn_thumb_url,
    a.thumb_file_nm,
    a.thumb_stored_nm,
    a.thumb_url,
    a.thumb_cdn_url,
    a.thumb_generated_yn,
    a.sort_ord,
    a.attach_memo,
    a.physical_path,
    a.reg_by,
    a.reg_date,
    a.upd_by,
    a.upd_date,
    g.attach_grp_code,
    g.attach_grp_nm,
    g.file_ext_allow,
    g.max_file_size,
    g.max_file_count,
    g.storage_path    AS grp_storage_path,
    g.use_yn          AS grp_use_yn,
    g.sort_ord        AS grp_sort_ord,
    g.site_id         AS grp_site_id
FROM shopjoy_2604.sy_attach a
INNER JOIN shopjoy_2604.sy_attach_grp g ON g.attach_grp_id = a.attach_grp_id;

-- ============================================================
-- 작업 2: vw_sy_role_menu (sy_role_menu + sy_role)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_sy_role_menu;
CREATE VIEW shopjoy_2604.vw_sy_role_menu AS
SELECT
    rm.role_menu_id,
    rm.site_id,
    rm.role_id,
    rm.menu_id,
    rm.perm_level,
    rm.reg_by,
    rm.reg_date,
    rm.upd_by,
    rm.upd_date,
    r.role_code,
    r.role_nm,
    r.role_type_cd,
    r.role_remark,
    r.use_yn         AS role_use_yn,
    r.parent_role_id,
    r.sort_ord       AS role_sort_ord
FROM shopjoy_2604.sy_role_menu rm
INNER JOIN shopjoy_2604.sy_role r ON r.role_id = rm.role_id;

-- ============================================================
-- 작업 3: vw_dp_area (dp_area + dp_ui)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_dp_area;
CREATE VIEW shopjoy_2604.vw_dp_area AS
SELECT
    a.area_id,
    a.ui_id,
    a.site_id,
    a.area_cd,
    a.area_nm,
    a.area_type_cd,
    a.area_desc,
    a.path_id,
    a.use_yn,
    a.use_start_date,
    a.use_end_date,
    a.reg_by,
    a.reg_date,
    a.upd_by,
    a.upd_date,
    u.ui_cd,
    u.ui_nm,
    u.ui_desc,
    u.device_type_cd,
    u.use_yn         AS ui_use_yn
FROM shopjoy_2604.dp_area a
INNER JOIN shopjoy_2604.dp_ui u ON u.ui_id = a.ui_id;

-- ============================================================
-- 작업 4: vw_dp_panel (dp_panel + dp_area + dp_ui)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_dp_panel;
CREATE VIEW shopjoy_2604.vw_dp_panel AS
SELECT
    p.panel_id,
    p.site_id,
    p.area_id,
    p.panel_nm,
    p.panel_type_cd,
    p.path_id,
    p.visibility_targets,
    p.use_yn,
    p.use_start_date,
    p.use_end_date,
    p.disp_panel_status_cd,
    p.disp_panel_status_cd_before,
    p.content_json,
    p.reg_by,
    p.reg_date,
    p.upd_by,
    p.upd_date,
    a.area_cd,
    a.area_nm,
    a.area_desc,
    a.ui_id,
    a.area_type_cd,
    u.ui_cd,
    u.ui_nm,
    u.ui_desc
FROM shopjoy_2604.dp_panel p
INNER JOIN shopjoy_2604.dp_area a ON a.area_id = p.area_id
INNER JOIN shopjoy_2604.dp_ui   u ON u.ui_id   = a.ui_id;

-- ============================================================
-- 작업 5: vw_dp_panel_item (dp_panel_item + dp_panel + dp_area + dp_ui)
-- ============================================================
DROP VIEW IF EXISTS shopjoy_2604.vw_dp_panel_item;
CREATE VIEW shopjoy_2604.vw_dp_panel_item AS
SELECT
    pi.panel_item_id,
    pi.site_id,
    pi.panel_id,
    pi.widget_lib_id,
    pi.widget_type_cd,
    pi.widget_title,
    pi.widget_content,
    pi.title_show_yn,
    pi.widget_lib_ref_yn,
    pi.content_type_cd,
    pi.sort_ord,
    pi.widget_config_json,
    pi.visibility_targets,
    pi.disp_yn,
    pi.disp_start_dt,
    pi.disp_end_dt,
    pi.disp_env,
    pi.use_yn,
    pi.reg_by,
    pi.reg_date,
    pi.upd_by,
    pi.upd_date,
    p.panel_nm,
    p.panel_type_cd,
    p.area_id,
    p.disp_panel_status_cd,
    a.area_cd,
    a.area_nm,
    a.ui_id,
    u.ui_cd,
    u.ui_nm
FROM shopjoy_2604.dp_panel_item pi
INNER JOIN shopjoy_2604.dp_panel p ON p.panel_id = pi.panel_id
INNER JOIN shopjoy_2604.dp_area  a ON a.area_id  = p.area_id
INNER JOIN shopjoy_2604.dp_ui    u ON u.ui_id    = a.ui_id;
