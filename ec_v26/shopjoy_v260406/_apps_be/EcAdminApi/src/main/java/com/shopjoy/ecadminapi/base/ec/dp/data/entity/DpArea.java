package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_area", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 영역 엔티티
@Comment("디스플레이 영역")
public class DpArea extends BaseEntity {

    @Id
    @Comment("영역ID (YYMMDDhhmmss+rand4)")
    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Comment("UIID (dp_ui.ui_id)")
    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("영역코드 (예: MAIN_TOP, SIDEBAR_MID)")
    @Column(name = "area_cd", length = 50, nullable = false)
    private String areaCd;

    @Comment("영역명")
    @Column(name = "area_nm", length = 100, nullable = false)
    private String areaNm;

    @Comment("영역유형 (코드: DISP_AREA_TYPE)")
    @Column(name = "area_type_cd", length = 30)
    private String areaTypeCd;

    @Comment("영역설명")
    @Column(name = "area_desc", length = 300)
    private String areaDesc;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("사용시작일")
    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Comment("사용종료일")
    @Column(name = "use_end_date")
    private LocalDate useEndDate;

}
