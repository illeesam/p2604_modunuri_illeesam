package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_ui_area", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 UI-영역 매핑 엔티티
@Comment("디스플레이 UI-영역 매핑")
public class DpUiArea extends BaseEntity {

    @Id
    @Comment("UI영역ID (YYMMDDhhmmss+rand4)")
    @Column(name = "ui_area_id", length = 21, nullable = false)
    private String uiAreaId;

    @Comment("UIID (dp_ui.ui_id)")
    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Comment("영역ID (dp_area.area_id)")
    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Comment("영역정렬순서")
    @Column(name = "area_sort_ord")
    private Integer areaSortOrd;

    @Comment("공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)")
    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Comment("전시 환경 (^PROD^DEV^TEST^ 형식)")
    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Comment("전시여부 (Y/N) - 배치로 자동 관리")
    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Comment("전시시작일")
    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Comment("전시시작시간")
    @Column(name = "disp_start_time")
    private LocalTime dispStartTime;

    @Comment("전시종료일")
    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Comment("전시종료시간")
    @Column(name = "disp_end_time")
    private LocalTime dispEndTime;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
