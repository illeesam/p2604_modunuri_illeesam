package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 전시 위젯 목록 VO
 * - dp_widget_lib 및 dp_panel_item 참조 위젯 메타데이터
 * - 위젯 라이브러리 정보 및 사용현황
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreDispWidgets {

    // 위젯 라이브러리 목록
    private List<WidgetInfo> widgets;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WidgetInfo {
        private String widgetLibId;           // 위젯라이브러리ID
        private String widgetLibNm;           // 위젯라이브러리명
        private String widgetTypeCd;          // 위젯타입코드
        private String widgetLibDesc;         // 위젯라이브러리설명
        private String widgetLibStatusCd;     // 위젯라이브러리상태코드
        private String widgetLibSortOrd;      // 정렬순서
        private String usageCount;            // 사용횟수
        private String regDate;               // 등록일시
        private String modDate;               // 수정일시
    }
}
