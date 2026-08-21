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

/**
 * 대시보드 차트 패널 정의 — 3레벨 트리(2026-08-21).
 *
 * <p>한 행이 차트/시리즈/항목 중 하나다. 상하관계는 {@code parent_dashboard_item_id} 로 잇는다.
 * PK({@code dashboard_item_id})는 대체키를 유지하고, 사람이 쓰는 조립코드는 {@code item_key} 에
 * 둔다 — 이름·순서를 바꿔도 PK 가 흔들리지 않아 붙어있는 데이터가 깨지지 않는다.</p>
 *
 * <p>구조 자체는 {@code series_json/cols_json} 이 아니라 하위 "행" 이 갖는다(JSON 폐기).
 * 각 레벨 이름을 공통코드에서 고르려면 {@code lvl1/lvl2_code_grp} 에 코드그룹을 지정(비우면 직접입력).</p>
 *
 * <p>화면이 이 항목의 필드 일부만 보내는 부분수정(예: 시리즈표시방법만 저장)이 흔하다. 이 경우
 * {@code CmDashboardItemService.saveOneBase()} 의 "U" 분기가 JPA 엔티티를 fetch 해 덮어쓰는 대신
 * {@link com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmDashboardItemRepository#updateSelective}
 * (QueryDSL) 로 넘어온 필드만 UPDATE 문의 SET 절에 담는다 — 나머지 컬럼은 SQL 에 아예 등장하지
 * 않으므로 실제 안 바뀐 값이 "이 컬럼도 바뀐 것"처럼 보이는 감사·트리거·CDC 오탐이 없다.</p>
 */
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

    @Comment("대시보드ID (cm_dashboard FK)")
    @Column(name = "dashboard_id", length = 21, nullable = false)
    @Size(max = 21, message = "dashboardId 는 21자 이내여야 합니다.")
    private String dashboardId;

    @Comment("레벨 조립코드 chart001-series01-item01. 화면·연동에서 읽기 쉬운 키, 전역 UNIQUE")
    @Column(name = "item_key", length = 150, nullable = false)
    @Size(max = 150, message = "itemKey 는 150자 이내여야 합니다.")
    private String itemKey;

    @Comment("패널명 (화면 표시용)")
    @Column(name = "item_nm", length = 100, nullable = false)
    @Size(max = 100, message = "itemNm 는 100자 이내여야 합니다.")
    private String itemNm;

    @Comment("레벨 (chart:차트 / series:시리즈 / item:항목)")
    @Column(name = "item_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "itemTypeCd 는 20자 이내여야 합니다.")
    private String itemTypeCd;

    @Comment("레벨 번호 1:차트 / 2:시리즈 / 3:항목 (item_type_cd 의 숫자 표현)")
    @Column(name = "key_level", nullable = false)
    private Integer keyLevel;

    @Comment("이 레벨의 키명 (chart038 / series01 / item01). 조립코드 item_key 의 마지막 조각")
    @Column(name = "key_nm", length = 50, nullable = false)
    @Size(max = 50, message = "keyNm 는 50자 이내여야 합니다.")
    private String keyNm;

    @Comment("상위 정의행 (series→chart, item→series). chart 는 NULL")
    @Column(name = "parent_dashboard_item_id", length = 21)
    @Size(max = 21, message = "parentDashboardItemId 는 21자 이내여야 합니다.")
    private String parentDashboardItemId;

    @Comment("위젯유형 (KPI/CHART/TABLE)")
    @Column(name = "widget_type_cd", length = 20)
    @Size(max = 20, message = "widgetTypeCd 는 20자 이내여야 합니다.")
    private String widgetTypeCd;

    @Comment("3레벨 축 성격 (CATEGORY:항목행 생성 / DATE:yyyymmdd 를 축으로 사용). chart 레벨만. 렌더링 힌트 — 값은 항상 3레벨에 붙는다")
    @Column(name = "axis_type_cd", length = 20)
    @Size(max = 20, message = "axisTypeCd 는 20자 이내여야 합니다.")
    private String axisTypeCd;

    @Comment("차트종류 (bar/line/pie/radar/heatmap/scatter). widget_type_cd=CHART 일 때만 유효")
    @Column(name = "chart_type_cd", length = 30)
    @Size(max = 30, message = "chartTypeCd 는 30자 이내여야 합니다.")
    private String chartTypeCd;

    @Comment("시리즈를 데이터관리 그리드의 행(ROW,기본)에 둘지 열(COL)에 둘지. chart(1레벨)에서만 유효. ROW=시리즈가 행·항목이 열 / COL=항목이 행·시리즈가 열")
    @Column(name = "series_orient_cd", length = 10)
    @Size(max = 10, message = "seriesOrientCd 는 10자 이내여야 합니다.")
    private String seriesOrientCd;

    @Comment("표시 색상 (#RRGGBB). 시리즈 레벨에서 주로 사용")
    @Column(name = "item_color", length = 20)
    @Size(max = 20, message = "itemColor 는 20자 이내여야 합니다.")
    private String itemColor;

    @Comment("2레벨(시리즈) 이름 선택용 공통코드그룹 (sy_code_grp.code_grp). NULL=직접입력")
    @Column(name = "lvl1_code_grp", length = 50)
    @Size(max = 50, message = "lvl1CodeGrp 는 50자 이내여야 합니다.")
    private String lvl1CodeGrp;

    @Comment("3레벨(항목) 이름 선택용 공통코드그룹 (sy_code_grp.code_grp). NULL=직접입력")
    @Column(name = "lvl2_code_grp", length = 50)
    @Size(max = 50, message = "lvl2CodeGrp 는 50자 이내여야 합니다.")
    private String lvl2CodeGrp;

    @Comment("실데이터 소스명 (CmDashboardDataSourceRegistry 등록명). 비우면 cm_dashboard_data 사용")
    @Column(name = "data_source_cd", length = 50)
    @Size(max = 50, message = "dataSourceCd 는 50자 이내여야 합니다.")
    private String dataSourceCd;

    @Comment("자동수집여부(Y/N, 기본 N). Y면 배치가 실 EC 테이블을 집계해 값을 채운다(SyStatsDashboardJob). chart(1레벨)에서만 의미")
    @Column(name = "auto_collect_yn", length = 1)
    @Size(max = 1, message = "autoCollectYn 는 1자 이내여야 합니다.")
    private String autoCollectYn;

    @Comment("데이터관리 그리드 편집여부(Y/N, 기본 Y). 자동수집(auto_collect_yn=Y) 항목은 보통 N — 배치가 채운 값을 사람이 덮어쓰지 않도록")
    @Column(name = "editable_yn", length = 1)
    @Size(max = 1, message = "editableYn 는 1자 이내여야 합니다.")
    private String editableYn;

    @Comment("이 차트의 값을 찾는 기준 차원 키. 콤마로 나눈 조회조건 토큰 목록(값 없는 존재여부 표기) — 예: site_id,yyyymm(월별) / site_id,yyyymmdd(일별) / site_id,yyyy(연도별) / site_id,yyyymm,prod_id,vendor_id. 날짜 토큰명(yyyy/yyyymm/yyyymmdd) 자체가 기간구분을 겸한다(2026-08-21 개편, period_type_cd:M 같은 별도 토큰 폐기). 비어있으면 기본값 적용: site_id,yyyymm. chart(1레벨)에서만 의미")
    @Column(name = "input_opts", length = 200)
    @Size(max = 200, message = "inputOpts 는 200자 이내여야 합니다.")
    private String inputOpts;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("ECharts 옵션 오버라이드 JSON (xAxis/yAxis/legend 등 부분)")
    @Column(name = "option_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "optionJson 는 500,000자 이내여야 합니다.")
    private String optionJson;

    /* 항목관리 화면의 미리보기용 값. 실제 집계값(cm_dashboard_data)과는 별개이며,
       구조를 짜면서 넣어 본 숫자를 다음에 열었을 때 그대로 보기 위해 함께 저장한다. */
    @Comment("미리보기 시뮬레이션 값/스타일 JSON {values:[[..]],style:\"css\"} — 실제 집계값 아님(cm_dashboard_data 와 별개)")
    @Column(name = "sim_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "simJson 는 500,000자 이내여야 합니다.")
    private String simJson;

    @Comment("실시간 차트 여부 (Y/N)")
    @Column(name = "realtime_yn", length = 1)
    @Size(max = 1, message = "realtimeYn 는 1자 이내여야 합니다.")
    private String realtimeYn;

    @Comment("실시간 차트 설정 JSON {intervalMs,maxPoints,apiUrl,thresholds,brushEnabled,smoothing}")
    @Column(name = "realtime_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "realtimeJson 는 500,000자 이내여야 합니다.")
    private String realtimeJson;

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

    /* ── 조회 전용 (DB 컬럼 아님) ──────────────────────────────────────────
       series_json/cols_json 을 폐기(2026-08-21)하면서, 차트를 그릴 때 필요한 시리즈·항목
       정보를 하위 "행" 에서 모아 여기에 담아 내려준다. 화면은 이 배열만 보면 된다. */
    @jakarta.persistence.Transient
    private java.util.List<java.util.Map<String, Object>> series;

    @jakarta.persistence.Transient
    private java.util.List<java.util.Map<String, Object>> cols;
}
