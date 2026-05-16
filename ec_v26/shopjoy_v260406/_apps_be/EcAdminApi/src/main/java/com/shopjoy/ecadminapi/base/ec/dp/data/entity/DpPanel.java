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
@Table(name = "dp_panel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 패널 엔티티
@Comment("디스플레이 패널")
public class DpPanel extends BaseEntity {

    @Id
    @Comment("패널ID (YYMMDDhhmmss+rand4)")
    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("패널명")
    @Column(name = "panel_nm", length = 100, nullable = false)
    private String panelNm;

    @Comment("표시유형 (코드: DISP_TYPE)")
    @Column(name = "panel_type_cd", length = 30)
    private String panelTypeCd;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)")
    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("사용시작일")
    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Comment("사용종료일")
    @Column(name = "use_end_date")
    private LocalDate useEndDate;

    @Comment("상태 (코드: DISP_STATUS)")
    @Column(name = "disp_panel_status_cd", length = 20)
    private String dispPanelStatusCd;

    @Comment("변경 전 패널상태 (코드: DISP_STATUS)")
    @Column(name = "disp_panel_status_cd_before", length = 20)
    private String dispPanelStatusCdBefore;

    @Comment("패널콘텐츠 (JSON - 위젯 목록 및 설정)")
    @Column(name = "content_json", columnDefinition = "TEXT")
    private String contentJson;

}
