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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "dp_panel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 패널 엔티티
@Comment("디스플레이 패널")
public class DpPanel extends BaseEntity {

    @Id
    @Comment("패널ID (YYMMDDhhmmss+rand4)")
    @Column(name = "panel_id", length = 21, nullable = false)
    @Size(max = 21, message = "panelId 는 21자 이내여야 합니다.")
    private String panelId;


    @Comment("영역ID (dp_area.area_id)")
    @Column(name = "area_id", length = 21)
    @Size(max = 21, message = "areaId 는 21자 이내여야 합니다.")
    private String areaId;

    @Comment("패널명")
    @Column(name = "panel_nm", length = 100, nullable = false)
    @Size(max = 100, message = "panelNm 는 100자 이내여야 합니다.")
    private String panelNm;

    @Comment("표시유형 (코드: PANEL_TYPE_CD)")
    @Column(name = "panel_type_cd", length = 30)
    @Size(max = 30, message = "panelTypeCd 는 30자 이내여야 합니다.")
    private String panelTypeCd;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("공개대상 (코드: VISIBILITY_TARGETS, ^CODE^CODE^ 형식)")
    @Column(name = "visibility_targets", length = 200)
    @Size(max = 100, message = "visibilityTargets 는 100자 이내여야 합니다.")
    private String visibilityTargets;

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

    @Comment("상태 (코드: DISP_PANEL_STATUS_CD)")
    @Column(name = "disp_panel_status_cd", length = 20)
    @Size(max = 20, message = "dispPanelStatusCd 는 20자 이내여야 합니다.")
    private String dispPanelStatusCd;

    @Comment("변경 전 패널상태 (코드: DISP_PANEL_STATUS_CD)")
    @Column(name = "disp_panel_status_cd_before", length = 20)
    @Size(max = 20, message = "dispPanelStatusCdBefore 는 20자 이내여야 합니다.")
    private String dispPanelStatusCdBefore;

    @Comment("패널콘텐츠 (JSON - 위젯 목록 및 설정)")
    @Column(name = "content_json", columnDefinition = "TEXT")
    @Size(max = 50000, message = "contentJson 는 50000자 이내여야 합니다.")
    private String contentJson;

}
