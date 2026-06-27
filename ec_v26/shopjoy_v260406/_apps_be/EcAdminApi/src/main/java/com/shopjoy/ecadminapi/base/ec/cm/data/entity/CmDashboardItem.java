package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_dashboard_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 차트 패널 정의")
public class CmDashboardItem extends BaseEntity {

    @Id
    @Comment("패널ID")
    @Column(name = "dashboard_item_id", length = 21, nullable = false)
    private String dashboardItemId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("대시보드ID (cm_dashboard.dashboard_id FK)")
    @Column(name = "dashboard_id", length = 21, nullable = false)
    private String dashboardId;

    @Comment("패널 키 (COMP0101, sales, xview 등)")
    @Column(name = "item_key", length = 50, nullable = false)
    private String itemKey;

    @Comment("패널명 (화면 표시용)")
    @Column(name = "item_nm", length = 100, nullable = false)
    private String itemNm;

    @Comment("차트 유형 (bar/line/pie/scatter/kpi/heatmap 등)")
    @Column(name = "chart_type", length = 30)
    private String chartType;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("CSS Grid 열 시작 위치 (1-based, grid-column-start)")
    @Column(name = "grid_col_start")
    private Integer gridColStart;

    @Comment("CSS Grid 열 끝 위치 (grid-column-end, 미지정 시 auto)")
    @Column(name = "grid_col_end")
    private Integer gridColEnd;

    @Comment("CSS Grid 행 시작 위치 (1-based, grid-row-start)")
    @Column(name = "grid_row_start")
    private Integer gridRowStart;

    @Comment("CSS Grid 행 끝 위치 (grid-row-end, 미지정 시 auto)")
    @Column(name = "grid_row_end")
    private Integer gridRowEnd;

    @Comment("패널 너비 (열 span 수, 기본 1)")
    @Column(name = "panel_width")
    private Integer panelWidth;

    @Comment("패널 높이 (행 span 수, 기본 1)")
    @Column(name = "panel_height")
    private Integer panelHeight;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("시리즈 설정 JSON 배열 [{name,color,type,...}]")
    @Column(name = "series_json", columnDefinition = "TEXT")
    private String seriesJson;

    @Comment("ECharts 옵션 오버라이드 JSON (xAxis/yAxis/legend 등 부분)")
    @Column(name = "option_json", columnDefinition = "TEXT")
    private String optionJson;

    @Comment("실시간 차트 여부 (Y/N)")
    @Column(name = "realtime_yn", length = 1)
    private String realtimeYn;

    @Comment("실시간 차트 설정 JSON {intervalMs,maxPoints,apiUrl,thresholds,brushEnabled,smoothing}")
    @Column(name = "realtime_json", columnDefinition = "TEXT")
    private String realtimeJson;
}
