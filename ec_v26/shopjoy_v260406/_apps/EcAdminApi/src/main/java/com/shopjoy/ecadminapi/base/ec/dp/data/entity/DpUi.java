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
@Table(name = "dp_ui", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 UI 엔티티
public class DpUi extends BaseEntity {

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

    @Column(name = "path_id", length = 21)
    private String pathId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

}
