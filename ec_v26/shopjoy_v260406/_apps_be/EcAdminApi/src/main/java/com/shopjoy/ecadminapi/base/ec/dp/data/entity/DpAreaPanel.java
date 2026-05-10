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
@Table(name = "dp_area_panel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 영역-패널 매핑 엔티티
public class DpAreaPanel extends BaseEntity {

    @Id
    @Column(name = "area_panel_id", length = 21, nullable = false)
    private String areaPanelId;

    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Column(name = "panel_sort_ord")
    private Integer panelSortOrd;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
