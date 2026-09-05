package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.*;

/**
 * 위젯 렌더용 한 행 — {@code col1~9} 짝(Nm=라벨/Num=값) 형태를 유지하는 <b>전송 전용</b> DTO.
 *
 * <p>실제 저장(3레벨 {@code cm_dashboard_item}+{@code cm_dashboard_data})은 "행 하나 = 좌표 하나 =
 * 값 하나" 로 정규화되어 있지만, 프론트(cmDashWidgetUtil)와 실시간 집계
 * ({@link com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardDataSourceRegistry})는 여전히
 * "한 차트 = 한 행에 여러 지표(col1~9)" 형태를 편하게 소비한다. 이 클래스는 그 형태로
 * <b>pivot(집계 후 옆으로 펼치기)</b> 한 결과만 담는다 — 절대 저장되지 않는다(JPA 엔티티 아님).</p>
 *
 * <ul>
 *   <li>KPI   — 마지막 행의 col1Num 이 값, col1Nm 이 라벨. 2행이면 앞 행 대비 증감이 표시된다</li>
 *   <li>CHART — col1Nm 이 X축 라벨, col1Num~ 이 시리즈 값</li>
 *   <li>TABLE — 항목(3레벨) 순서대로 컬럼이 된다</li>
 * </ul>
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CmDashboardWidgetRow {

    private String dashboardId;   // 값을 낸 정의행(주로 시리즈=lvl2) ID
    private String compId;        // 차트의 item_key (구 compId 자리)
    private String yyyymmdd;
    private String siteNo;
    private String siteNm;
    private String uiNm;
    private String deptId;
    private String deptNm;
    private String userId;
    private String userNm;

    private String col1Nm;  private Double col1Num;
    private String col2Nm;  private Double col2Num;
    private String col3Nm;  private Double col3Num;
    private String col4Nm;  private Double col4Num;
    private String col5Nm;  private Double col5Num;
    private String col6Nm;  private Double col6Num;
    private String col7Nm;  private Double col7Num;
    private String col8Nm;  private Double col8Num;
    private String col9Nm;  private Double col9Num;

    public void setNm(int k, String v) {
        switch (k) {
            case 1 -> col1Nm = v; case 2 -> col2Nm = v; case 3 -> col3Nm = v;
            case 4 -> col4Nm = v; case 5 -> col5Nm = v; case 6 -> col6Nm = v;
            case 7 -> col7Nm = v; case 8 -> col8Nm = v; case 9 -> col9Nm = v;
            default -> { }
        }
    }

    public void setNum(int k, Double v) {
        switch (k) {
            case 1 -> col1Num = v; case 2 -> col2Num = v; case 3 -> col3Num = v;
            case 4 -> col4Num = v; case 5 -> col5Num = v; case 6 -> col6Num = v;
            case 7 -> col7Num = v; case 8 -> col8Num = v; case 9 -> col9Num = v;
            default -> { }
        }
    }
}
