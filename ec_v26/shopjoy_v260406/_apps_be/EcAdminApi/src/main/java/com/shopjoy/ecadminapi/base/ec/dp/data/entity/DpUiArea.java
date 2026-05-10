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
@Table(name = "dp_ui_area", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 UI-영역 매핑 엔티티
public class DpUiArea extends BaseEntity {

    @Id
    @Column(name = "ui_area_id", length = 21, nullable = false)
    private String uiAreaId;

    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Column(name = "area_sort_ord")
    private Integer areaSortOrd;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
