package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "cm_dashboard_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 차트 패널 정의")
public class CmDashboardItem extends BaseEntity {

    @Id
    @Comment("패널ID")
    @Column(name = "dashboard_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardItemId 는 21자 이내여야 합니다.")
    private String dashboardItemId;


    @Comment("대시보드ID (cm_dashboard.dashboard_id FK)")
    @Column(name = "dashboard_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardId 는 21자 이내여야 합니다.")
    private String dashboardId;

    @Comment("패널 키 (COMP0101, sales, xview 등)")
    @Column(name = "item_key", length = 50, nullable = false)
    @Size(max = 50, message = "itemKey 는 50자 이내여야 합니다.")
    private String itemKey;

    @Comment("패널명 (화면 표시용)")
    @Column(name = "item_nm", length = 100, nullable = false)
    @Size(max = 100, message = "itemNm 는 100자 이내여야 합니다.")
    private String itemNm;

    @Comment("항목유형 (KPI:숫자카드 / CHART:차트 / TABLE:목록)")
    @Column(name = "item_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "itemTypeCd 는 20자 이내여야 합니다.")
    private String itemTypeCd;

    @Comment("차트종류 (bar/line/pie/radar/heatmap/scatter). item_type_cd=CHART 일 때만 유효")
    @Column(name = "chart_type_cd", length = 30)
    @Size(max = 30, message = "chartTypeCd 는 30자 이내여야 합니다.")
    private String chartTypeCd;

    @Comment("실데이터 소스명 (CmDashboardDataSourceRegistry 등록명). 비우면 cm_dashboard_item_data 사용")
    @Column(name = "data_source_cd", length = 50)
    @Size(max = 50, message = "dataSourceCd 는 50자 이내여야 합니다.")
    private String dataSourceCd;

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
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("시리즈 설정 JSON 배열 [{name,color,type,...}]")
    @Column(name = "series_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "seriesJson 는 500,000자 이내여야 합니다.")
    private String seriesJson;

    @Comment("ECharts 옵션 오버라이드 JSON (xAxis/yAxis/legend 등 부분)")
    @Column(name = "option_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "optionJson 는 500,000자 이내여야 합니다.")
    private String optionJson;

    @Comment("실시간 차트 여부 (Y/N)")
    @Column(name = "realtime_yn", length = 1)
    @Size(max = 1, message = "realtimeYn 는 1자 이내여야 합니다.")
    private String realtimeYn;

    @Comment("실시간 차트 설정 JSON {intervalMs,maxPoints,apiUrl,thresholds,brushEnabled,smoothing}")
    @Column(name = "realtime_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "realtimeJson 는 500,000자 이내여야 합니다.")
    private String realtimeJson;
}
