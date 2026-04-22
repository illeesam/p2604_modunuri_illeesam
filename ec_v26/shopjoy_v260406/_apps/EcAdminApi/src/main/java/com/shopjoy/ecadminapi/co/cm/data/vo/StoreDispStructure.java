package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 전시 구조 데이터 VO
 * - UI > Area > Panel > Widget 계층 구조
 * - ec_disp_ui, ec_disp_area, ec_disp_panel, ec_disp_widget 테이블 기반
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreDispStructure {

    // 전시 UI 구조: ui > area > panel > widget
    private List<UiInfo> uis;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UiInfo {
        private String uiId;          // UI ID
        private String uiNm;          // UI명
        private String uiStatusCd;    // 상태 (ACTIVE, INACTIVE)
        private String uiSortOrd;     // 정렬 순서
        private List<AreaInfo> areas; // 영역 목록

        @Getter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AreaInfo {
            private String areaId;      // 영역 ID
            private String areaNm;      // 영역명
            private String areaStatusCd; // 상태
            private String areaSortOrd;  // 정렬 순서
            private List<PanelInfo> panels; // 패널 목록

            @Getter
            @Builder
            @NoArgsConstructor
            @AllArgsConstructor
            public static class PanelInfo {
                private String panelId;     // 패널 ID
                private String panelNm;     // 패널명
                private String panelStatusCd; // 상태
                private String panelSortOrd; // 정렬 순서
                private List<WidgetInfo> widgets; // 위젯 목록
            }
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WidgetInfo {
        private String widgetId;           // 위젯 ID
        private String widgetNm;           // 위젯명
        private String widgetTypeCd;       // 위젯 타입 (image_banner, product_slider 등)
        private String widgetStatusCd;     // 상태
        private String widgetSortOrd;      // 정렬 순서
        private Map<String, Object> widgetConfig; // 위젯 설정
    }
}
