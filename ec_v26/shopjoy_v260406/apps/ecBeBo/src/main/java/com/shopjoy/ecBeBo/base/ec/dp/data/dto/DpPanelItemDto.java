package com.shopjoy.ecBeBo.base.ec.dp.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class DpPanelItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String panelItemId;  // 패널항목ID 필터
        @Size(max = 21) private String panelId;  // 패널ID 필터
        private List<String> panelIds;                 // 상위 FK 다건 IN
        @Size(max = 21) private String widgetLibId;  // 위젯라이브러리ID 필터
        @Size(max = 30) private String widgetTypeCd;  // 위젯유형 필터 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String panelItemId;  // 패널항목ID (YYMMDDhhmmss+rand4)
        private String panelId;  // 패널ID (dp_panel.panel_id)
        private String widgetLibId;  // 위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)
        private String widgetTypeCd;  // 위젯유형 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
        private String widgetTitle;  // 위젯타이틀
        private String widgetContent;  // 위젯내용 (HTML 에디터)
        private String titleShowYn;  // 타이틀표시여부 Y/N
        private String widgetLibRefYn;  // 위젯라이브러리참조여부 Y/N
        private String contentTypeCd;  // 콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)
        private Integer sortOrd;  // 항목정렬순서
        private String widgetConfigJson;  // 위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)
        private String visibilityTargets;  // 공개대상 (^CODE^CODE^ 형식)
        private String dispYn;  // 전시여부 Y/N (배치로 자동 관리)
        private LocalDateTime dispStartDt;  // 전시시작일시
        private LocalDateTime dispEndDt;  // 전시종료일시
        private String dispEnv;  // 전시 환경 (^PROD^DEV^TEST^ 형식)
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
