package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_area_panel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 영역-패널 매핑 엔티티
@Comment("디스플레이 영역-패널 매핑")
public class DpAreaPanel extends BaseEntity {

    @Id
    @Comment("영역패널ID (YYMMDDhhmmss+rand4)")
    @Column(name = "area_panel_id", length = 21, nullable = false)
    private String areaPanelId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("영역ID (dp_area.area_id)")
    @Column(name = "area_id", length = 21, nullable = false)
    private String areaId;

    @Comment("패널ID (dp_panel.panel_id)")
    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Comment("패널정렬순서")
    @Column(name = "panel_sort_ord")
    private Integer panelSortOrd;

    @Comment("공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)")
    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Comment("전시여부 (Y/N) - 배치로 자동 관리")
    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Comment("전시시작일시")
    @Column(name = "disp_start_dt")
    private LocalDateTime dispStartDt;

    @Comment("전시종료일시")
    @Column(name = "disp_end_dt")
    private LocalDateTime dispEndDt;

    @Comment("전시 환경 (^PROD^DEV^TEST^ 형식)")
    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
