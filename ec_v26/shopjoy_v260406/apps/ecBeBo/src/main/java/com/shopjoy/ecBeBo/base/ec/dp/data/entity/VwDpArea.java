package com.shopjoy.ecBeBo.base.ec.dp.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "areaId 는 21자 이내여야 합니다.")
    private String areaId;

    @Column(name = "ui_id", length = 21, nullable = false)
    @Size(max = 21, message = "uiId 는 21자 이내여야 합니다.")
    private String uiId;


    @Column(name = "area_cd", length = 50, nullable = false)
    @Size(max = 50, message = "areaCd 는 50자 이내여야 합니다.")
    private String areaCd;

    @Column(name = "area_nm", length = 100, nullable = false)
    @Size(max = 100, message = "areaNm 는 100자 이내여야 합니다.")
    private String areaNm;

    @Column(name = "area_type_cd", length = 30)
    @Size(max = 30, message = "areaTypeCd 는 30자 이내여야 합니다.")
    private String areaTypeCd;

    @Column(name = "area_desc", length = 300)
    @Size(max = 300, message = "areaDesc 는 300자 이내여야 합니다.")
    private String areaDesc;

    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

    @Column(name = "reg_by", length = 30)
    @Size(max = 30, message = "regBy 는 30자 이내여야 합니다.")
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "reg_site_id", length = 21)
    @Size(max = 21, message = "regSiteId 는 21자 이내여야 합니다.")
    private String regSiteId;

    @Column(name = "upd_by", length = 30)
    @Size(max = 30, message = "updBy 는 30자 이내여야 합니다.")
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── dp_ui 컬럼 (JOIN 추가분) ────────────────────────────────────────────

    @Column(name = "ui_cd", length = 50)
    @Size(max = 50, message = "uiCd 는 50자 이내여야 합니다.")
    private String uiCd;

    @Column(name = "ui_nm", length = 100)
    @Size(max = 100, message = "uiNm 는 100자 이내여야 합니다.")
    private String uiNm;

    @Column(name = "ui_desc", length = 300)
    @Size(max = 300, message = "uiDesc 는 300자 이내여야 합니다.")
    private String uiDesc;

    @Column(name = "device_type_cd", length = 30)
    @Size(max = 30, message = "deviceTypeCd 는 30자 이내여야 합니다.")
    private String deviceTypeCd;

    /** dp_ui.use_yn */
    @Column(name = "ui_use_yn", length = 1)
    @Size(max = 1, message = "uiUseYn 는 1자 이내여야 합니다.")
    private String uiUseYn;
}
