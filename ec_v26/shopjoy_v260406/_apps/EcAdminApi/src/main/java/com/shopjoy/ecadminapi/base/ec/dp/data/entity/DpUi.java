package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dp_ui", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 전시 UI 엔티티
public class DpUi {

    @Id
    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "ui_cd", length = 50, nullable = false)
    private String uiCd;

    @Column(name = "ui_nm", length = 100, nullable = false)
    private String uiNm;

    @Column(name = "ui_desc", length = 300)
    private String uiDesc;

    @Column(name = "device_type_cd", length = 30)
    private String deviceTypeCd;

    @Column(name = "ui_path", length = 200)
    private String uiPath;

    @Column(name = "sort_ord")
    private Integer sortOrd;

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

}