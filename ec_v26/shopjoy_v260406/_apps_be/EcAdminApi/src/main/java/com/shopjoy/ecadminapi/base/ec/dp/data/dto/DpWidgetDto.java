package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class DpWidgetDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String widgetId;  // 위젯ID 필터
        @Size(max = 21) private String widgetLibId;  // 위젯라이브러리ID 필터
        @Size(max = 30) private String widgetTypeCd;  // 위젯유형 필터 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String widgetId;  // 위젯ID (YYMMDDhhmmss+rand4)
        private String widgetLibId;  // 위젯라이브러리ID (dp_widget_lib.widget_lib_id, 참조 선택사항)
        private String widgetNm;  // 위젯명
        private String widgetTypeCd;  // 위젯유형 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
        private String widgetDesc;  // 위젯설명
        private String widgetTitle;  // 위젯타이틀
        private String widgetContent;  // 위젯내용 (HTML 에디터)
        private String titleShowYn;  // 타이틀표시여부 Y/N
        private String widgetLibRefYn;  // 위젯라이브러리참조여부 Y/N
        private String widgetConfigJson;  // 위젯추가설정 (JSON)
        private String thumbnailUrl;  // 미리보기 썸네일URL
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String dispEnv;  // 전시 환경 (^PROD^DEV^TEST^ 형식)
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
