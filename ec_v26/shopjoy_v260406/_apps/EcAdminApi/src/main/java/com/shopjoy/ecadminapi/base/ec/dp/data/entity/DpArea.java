package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "dp_area", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 영역 엔티티
public class DpArea extends BaseEntity {

    @Id
    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "area_cd", length = 50, nullable = false)
    private String areaCd;

    @Column(name = "area_nm", length = 100, nullable = false)
    private String areaNm;

    @Column(name = "area_type_cd", length = 30)
    private String areaTypeCd;

    @Column(name = "area_desc", length = 300)
    private String areaDesc;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

}
