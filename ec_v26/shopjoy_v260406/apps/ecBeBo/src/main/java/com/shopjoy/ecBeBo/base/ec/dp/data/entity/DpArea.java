package com.shopjoy.ecBeBo.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "areaId 는 21자 이내여야 합니다.")
    private String areaId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("UIID (dp_ui.ui_id)")
    @Column(name = "ui_id", length = 21, nullable = false)
    @Size(max = 21, message = "uiId 는 21자 이내여야 합니다.")
    private String uiId;


    @Comment("영역코드 (예: MAIN_TOP, SIDEBAR_MID)")
    @Column(name = "area_cd", length = 50, nullable = false)
    @Size(max = 50, message = "areaCd 는 50자 이내여야 합니다.")
    private String areaCd;

    @Comment("영역명")
    @Column(name = "area_nm", length = 100, nullable = false)
    @Size(max = 100, message = "areaNm 는 100자 이내여야 합니다.")
    private String areaNm;

    @Comment("영역유형 (코드: AREA_TYPE_CD)")
    @Column(name = "area_type_cd", length = 30)
    @Size(max = 30, message = "areaTypeCd 는 30자 이내여야 합니다.")
    private String areaTypeCd;

    @Comment("영역설명")
    @Column(name = "area_desc", length = 300)
    @Size(max = 300, message = "areaDesc 는 300자 이내여야 합니다.")
    private String areaDesc;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("사용시작일")
    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Comment("사용종료일")
    @Column(name = "use_end_date")
    private LocalDate useEndDate;

}
