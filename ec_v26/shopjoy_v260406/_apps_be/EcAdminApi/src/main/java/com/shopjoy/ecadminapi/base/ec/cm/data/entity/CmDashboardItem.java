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

    /* ── 3레벨 트리 (2026-08-21) ───────────────────────────────────────────
       한 행이 차트/시리즈/항목 중 하나다. 상하관계는 parent_dashboard_item_id 로 잇는다.
       PK(dashboard_item_id)는 대체키를 유지하고, 사람이 쓰는 조립코드는 item_code 에 둔다 —
       이름·순서를 바꿔도 PK 가 흔들리지 않아 붙어있는 데이터가 깨지지 않는다. */

    @Comment("상위 정의행 (series→chart, item→series). chart 는 NULL")
    @Column(name = "parent_dashboard_item_id", length = 21)
    @Size(max = 21, message = "parentDashboardItemId 는 21자 이내여야 합니다.")
    private String parentDashboardItemId;

    @Comment("위젯유형 (KPI/CHART/TABLE) — 구 item_type_cd 값")
    @Column(name = "widget_type_cd", length = 20)
    @Size(max = 20, message = "widgetTypeCd 는 20자 이내여야 합니다.")
    private String widgetTypeCd;

    @Comment("레벨 번호 1:차트 / 2:시리즈 / 3:항목 (item_type_cd 의 숫자 표현)")
    @Column(name = "key_level", nullable = false)
    private Integer keyLevel;

    @Comment("이 레벨의 키명 (chart038 / series01 / item01). 조립코드 item_key 의 마지막 조각")
    @Column(name = "key_nm", length = 50, nullable = false)
    @Size(max = 50, message = "keyNm 는 50자 이내여야 합니다.")
    private String keyNm;

    @Comment("표시 색상 (#RRGGBB). 시리즈 레벨에서 주로 사용")
    @Column(name = "item_color", length = 20)
    @Size(max = 20, message = "itemColor 는 20자 이내여야 합니다.")
    private String itemColor;

    @Comment("3레벨 축 성격 (CATEGORY:항목행 생성 / DATE:yyyymmdd 를 축으로 사용). chart 레벨만")
    @Column(name = "axis_type_cd", length = 20)
    @Size(max = 20, message = "axisTypeCd 는 20자 이내여야 합니다.")
    private String axisTypeCd;

    @Comment("레벨 조립코드 chart001-series01-item01 (전역 UNIQUE). 화면·연동·데이터 연결의 기준 키")
    @Column(name = "item_key", length = 150)
    @Size(max = 150, message = "itemKey 는 150자 이내여야 합니다.")
    private String itemKey;

    @Comment("패널명 (화면 표시용)")
    @Column(name = "item_nm", length = 100, nullable = false)
    @Size(max = 100, message = "itemNm 는 100자 이내여야 합니다.")
    private String itemNm;

    @Comment("레벨 (chart:차트 / series:시리즈 / item:항목). 위젯유형은 widget_type_cd 로 이동")
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

    /* 각 레벨 이름을 공통코드에서 고르려면 lvl1/lvl2_code_grp 에 코드그룹을 지정(비우면 직접입력).
       구조 자체는 series_json/cols_json 이 아니라 하위 "행" 이 갖는다 (2026-08-21 JSON 폐기). */

    @Comment("2레벨(시리즈) 이름 선택용 공통코드그룹. NULL=직접입력")
    @Column(name = "lvl1_code_grp", length = 50)
    @Size(max = 50, message = "lvl1CodeGrp 는 50자 이내여야 합니다.")
    private String lvl1CodeGrp;

    @Comment("3레벨(항목) 이름 선택용 공통코드그룹. NULL=직접입력")
    @Column(name = "lvl2_code_grp", length = 50)
    @Size(max = 50, message = "lvl2CodeGrp 는 50자 이내여야 합니다.")
    private String lvl2CodeGrp;

    /* 항목관리 화면의 미리보기용 값. 실제 집계값(cm_dashboard_item_data)과는 별개이며,
       구조를 짜면서 넣어 본 숫자를 다음에 열었을 때 그대로 보기 위해 함께 저장한다. */
    @Comment("미리보기 시뮬레이션 값/스타일 JSON {values:[[..]],style:\"css\"} — 실제 집계값 아님")
    @Column(name = "sim_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "simJson 는 500,000자 이내여야 합니다.")
    private String simJson;

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

    /* ── 조회 전용 (DB 컬럼 아님) ──────────────────────────────────────────
       series_json/cols_json 을 폐기(2026-08-21)하면서, 차트를 그릴 때 필요한 시리즈·항목
       정보를 하위 "행" 에서 모아 여기에 담아 내려준다. 화면은 이 배열만 보면 된다. */
    @jakarta.persistence.Transient
    private java.util.List<java.util.Map<String, Object>> series;

    @jakarta.persistence.Transient
    private java.util.List<java.util.Map<String, Object>> cols;
}
