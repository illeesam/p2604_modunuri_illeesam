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
@Table(name = "dp_ui_area", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 전시 UI-영역 매핑 엔티티
public class DpUiArea {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}