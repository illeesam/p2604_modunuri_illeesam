package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * vw_dp_panel_item 뷰 엔티티 (READ-ONLY)
 * dp_panel_item + dp_panel + dp_area + dp_ui 4단계 INNER JOIN 뷰
 * — 패널항목 조회 시 패널명(panel_nm), 영역명(area_nm), UI명(ui_nm) 등을 별도 JOIN 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_dp_panel_item", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwDpPanelItem {

    // ── dp_panel_item 컬럼 ──────────────────────────────────────────────────

    @Id
    @Column(name = "panel_item_id", length = 21, nullable = false)
    private String panelItemId;


    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Column(name = "widget_lib_id", length = 21)
    private String widgetLibId;

    @Column(name = "widget_type_cd", length = 30)
    private String widgetTypeCd;

    @Column(name = "widget_title", length = 200)
    private String widgetTitle;

    @Column(name = "widget_content", columnDefinition = "TEXT")
    private String widgetContent;

    @Column(name = "title_show_yn", length = 1)
    private String titleShowYn;

    @Column(name = "widget_lib_ref_yn", length = 1)
    private String widgetLibRefYn;

    @Column(name = "content_type_cd", length = 30)
    private String contentTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Column(name = "disp_start_dt")
    private LocalDateTime dispStartDt;

    @Column(name = "disp_end_dt")
    private LocalDateTime dispEndDt;

    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "reg_site_id", length = 21)
    private String regSiteId;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── dp_panel 컬럼 (JOIN 추가분) ─────────────────────────────────────────

    @Column(name = "panel_nm", length = 100)
    private String panelNm;

    @Column(name = "panel_type_cd", length = 30)
    private String panelTypeCd;

    @Column(name = "area_id", length = 21)
    private String areaId;

    @Column(name = "disp_panel_status_cd", length = 20)
    private String dispPanelStatusCd;

    // ── dp_area 컬럼 (JOIN 추가분) ──────────────────────────────────────────

    @Column(name = "area_cd", length = 50)
    private String areaCd;

    @Column(name = "area_nm", length = 100)
    private String areaNm;

    @Column(name = "ui_id", length = 21)
    private String uiId;

    // ── dp_ui 컬럼 (JOIN 추가분) ────────────────────────────────────────────

    @Column(name = "ui_cd", length = 50)
    private String uiCd;

    @Column(name = "ui_nm", length = 100)
    private String uiNm;
}
