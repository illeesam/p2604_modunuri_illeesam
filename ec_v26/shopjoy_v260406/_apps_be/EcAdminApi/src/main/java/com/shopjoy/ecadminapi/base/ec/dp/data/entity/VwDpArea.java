package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * vw_dp_area 뷰 엔티티 (READ-ONLY)
 * dp_area + dp_ui INNER JOIN 뷰
 * — 영역 조회 시 UI명(ui_nm), UI코드(ui_cd) 등을 별도 JOIN 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_dp_area", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwDpArea {

    // ── dp_area 컬럼 ────────────────────────────────────────────────────────

    @Id
    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "area_cd", length = 50, nullable = false)
    private String areaCd;

    @Column(name = "area_nm", length = 100, nullable = false)
    private String areaNm;

    @Column(name = "area_type_cd", length = 30)
    private String areaTypeCd;

    @Column(name = "area_desc", length = 300)
    private String areaDesc;

    @Column(name = "path_id", length = 21)
    private String pathId;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── dp_ui 컬럼 (JOIN 추가분) ────────────────────────────────────────────

    @Column(name = "ui_cd", length = 50)
    private String uiCd;

    @Column(name = "ui_nm", length = 100)
    private String uiNm;

    @Column(name = "ui_desc", length = 300)
    private String uiDesc;

    @Column(name = "device_type_cd", length = 30)
    private String deviceTypeCd;

    /** dp_ui.use_yn */
    @Column(name = "ui_use_yn", length = 1)
    private String uiUseYn;
}
