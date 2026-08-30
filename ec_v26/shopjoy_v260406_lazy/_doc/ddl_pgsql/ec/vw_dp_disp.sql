-- vw_dp_disp 뷰 DDL
-- 디스플레이 전시 통합 뷰 (UI > UI영역매핑 > 영역 > 영역패널매핑 > 패널 > 패널항목 > 위젯라이브러리)
-- 패널항목(dp_panel_item) 1건 = 결과 1행. 하위가 없는 상위 계층도 LEFT JOIN 으로 노출.

CREATE OR REPLACE VIEW shopjoy_2604.vw_dp_disp AS
SELECT /* ec.dp :: vw_dp_disp */
    -- ── dp_ui (최상위 UI) ──
    u.ui_id                          AS ui_id,
    u.site_id                        AS ui_site_id,
    u.ui_cd                          AS ui_cd,
    u.ui_nm                          AS ui_nm,
    u.ui_desc                        AS ui_desc,
    u.device_type_cd                 AS ui_device_type_cd,
    u.path_id                        AS ui_path_id,
    u.sort_ord                       AS ui_sort_ord,
    u.use_yn                         AS ui_use_yn,
    u.use_start_date                 AS ui_use_start_date,
    u.use_end_date                   AS ui_use_end_date,

    -- ── dp_ui_area (UI-영역 매핑) ──
    ua.ui_area_id                    AS ui_area_id,
    ua.area_sort_ord                 AS ui_area_sort_ord,
    ua.visibility_targets            AS ui_area_visibility_targets,
    ua.disp_env                      AS ui_area_disp_env,
    ua.disp_yn                       AS ui_area_disp_yn,
    ua.disp_start_dt                 AS ui_area_disp_start_dt,
    ua.disp_end_dt                   AS ui_area_disp_end_dt,
    ua.use_yn                        AS ui_area_use_yn,

    -- ── dp_area (영역) ──
    a.area_id                        AS area_id,
    a.site_id                        AS area_site_id,
    a.area_cd                        AS area_cd,
    a.area_nm                        AS area_nm,
    a.area_type_cd                   AS area_type_cd,
    a.area_desc                      AS area_desc,
    a.path_id                        AS area_path_id,
    a.use_yn                         AS area_use_yn,
    a.use_start_date                 AS area_use_start_date,
    a.use_end_date                   AS area_use_end_date,

    -- ── dp_area_panel (영역-패널 매핑) ──
    ap.area_panel_id                 AS area_panel_id,
    ap.panel_sort_ord                AS area_panel_sort_ord,
    ap.visibility_targets            AS area_panel_visibility_targets,
    ap.disp_yn                       AS area_panel_disp_yn,
    ap.disp_start_dt                 AS area_panel_disp_start_dt,
    ap.disp_end_dt                   AS area_panel_disp_end_dt,
    ap.disp_env                      AS area_panel_disp_env,
    ap.use_yn                        AS area_panel_use_yn,

    -- ── dp_panel (패널) ──
    p.panel_id                       AS panel_id,
    p.site_id                        AS panel_site_id,
    p.panel_nm                       AS panel_nm,
    p.panel_type_cd                  AS panel_type_cd,
    p.path_id                        AS panel_path_id,
    p.visibility_targets             AS panel_visibility_targets,
    p.use_yn                         AS panel_use_yn,
    p.use_start_date                 AS panel_use_start_date,
    p.use_end_date                   AS panel_use_end_date,
    p.disp_panel_status_cd           AS panel_status_cd,

    -- ── dp_panel_item (패널 항목 = 위젯 인스턴스) ──
    pi.panel_item_id                 AS panel_item_id,
    pi.widget_type_cd                AS panel_item_widget_type_cd,
    pi.widget_title                  AS panel_item_widget_title,
    pi.title_show_yn                 AS panel_item_title_show_yn,
    pi.widget_lib_ref_yn             AS panel_item_widget_lib_ref_yn,
    pi.content_type_cd               AS panel_item_content_type_cd,
    pi.sort_ord                      AS panel_item_sort_ord,
    pi.visibility_targets            AS panel_item_visibility_targets,
    pi.disp_yn                       AS panel_item_disp_yn,
    pi.disp_start_dt                 AS panel_item_disp_start_dt,
    pi.disp_end_dt                   AS panel_item_disp_end_dt,
    pi.disp_env                      AS panel_item_disp_env,
    pi.use_yn                        AS panel_item_use_yn,

    -- ── dp_widget_lib (위젯 라이브러리, 참조형 항목만) ──
    wl.widget_lib_id                 AS widget_lib_id,
    wl.site_id                       AS widget_lib_site_id,
    wl.widget_code                   AS widget_lib_code,
    wl.widget_nm                     AS widget_lib_nm,
    wl.widget_type_cd                AS widget_lib_type_cd,
    wl.thumbnail_url                 AS widget_lib_thumbnail_url,
    wl.is_system                     AS widget_lib_is_system,
    wl.sort_ord                      AS widget_lib_sort_ord,
    wl.use_yn                        AS widget_lib_use_yn
FROM shopjoy_2604.dp_ui u
    LEFT JOIN shopjoy_2604.dp_ui_area    ua ON ua.ui_id        = u.ui_id
    LEFT JOIN shopjoy_2604.dp_area       a  ON a.area_id       = ua.area_id
    LEFT JOIN shopjoy_2604.dp_area_panel ap ON ap.area_id      = a.area_id
    LEFT JOIN shopjoy_2604.dp_panel      p  ON p.panel_id      = ap.panel_id
    LEFT JOIN shopjoy_2604.dp_panel_item pi ON pi.panel_id     = p.panel_id
    LEFT JOIN shopjoy_2604.dp_widget_lib wl ON wl.widget_lib_id = pi.widget_lib_id
ORDER BY
    u.site_id, u.sort_ord, u.ui_id,
    ua.area_sort_ord, a.area_id,
    ap.panel_sort_ord, p.panel_id,
    pi.sort_ord, pi.panel_item_id;

COMMENT ON VIEW shopjoy_2604.vw_dp_disp IS '디스플레이 전시 통합 뷰 (UI>영역>패널>항목>위젯라이브러리, 패널항목 1건=1행)';
