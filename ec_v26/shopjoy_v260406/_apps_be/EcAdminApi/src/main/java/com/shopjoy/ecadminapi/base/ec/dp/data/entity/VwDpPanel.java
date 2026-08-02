package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * vw_dp_panel 뷰 엔티티 (READ-ONLY)
 * dp_panel + dp_area + dp_ui 3단계 INNER JOIN 뷰
 * — 패널 조회 시 영역명(area_nm), UI명(ui_nm) 등을 별도 JOIN 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_dp_panel", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwDpPanel {

    // ── dp_panel 컬럼 ────────────────────────────────────────────────────────

    @Id
    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "area_id", length = 21)
    private String areaId;

    @Column(name = "panel_nm", length = 100, nullable = false)
    private String panelNm;

    @Column(name = "panel_type_cd", length = 30)
    private String panelTypeCd;

    @Column(name = "path_id", length = 21)
    private String pathId;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

    @Column(name = "disp_panel_status_cd", length = 20)
    private String dispPanelStatusCd;

    @Column(name = "disp_panel_status_cd_before", length = 20)
    private String dispPanelStatusCdBefore;

    @Column(name = "content_json", columnDefinition = "TEXT")
    private String contentJson;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── dp_area 컬럼 (JOIN 추가분) ──────────────────────────────────────────

    @Column(name = "area_cd", length = 50)
    private String areaCd;

    @Column(name = "area_nm", length = 100)
    private String areaNm;

    @Column(name = "area_desc", length = 300)
    private String areaDesc;

    @Column(name = "ui_id", length = 21)
    private String uiId;

    @Column(name = "area_type_cd", length = 30)
    private String areaTypeCd;

    // ── dp_ui 컬럼 (JOIN 추가분) ────────────────────────────────────────────

    @Column(name = "ui_cd", length = 50)
    private String uiCd;

    @Column(name = "ui_nm", length = 100)
    private String uiNm;

    @Column(name = "ui_desc", length = 300)
    private String uiDesc;
}
