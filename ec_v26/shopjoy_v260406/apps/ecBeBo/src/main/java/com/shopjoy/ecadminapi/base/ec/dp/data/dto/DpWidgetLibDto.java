package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class DpWidgetLibDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 1) private String useYn;  // 사용여부 Y/N 필터
        @Size(max = 21) private String widgetLibId;  // 위젯라이브러리ID 필터
        @Size(max = 30) private String widgetTypeCd;  // 위젯유형 필터 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String widgetLibId;  // 위젯라이브러리ID (YYMMDDhhmmss+rand4)
        private String widgetCode;  // 위젯코드
        private String widgetNm;  // 위젯명
        private String widgetTypeCd;  // 위젯유형 — WIDGET_TYPE_CD {image_banner:이미지 배너, product_slider:상품 슬라이더, chart_pie:차트(Pie) 등}
        private String widgetLibDesc;  // 위젯라이브러리설명
        private String pathId;  // 점(.) 구분 표시경로
        private String thumbnailUrl;  // 미리보기 썸네일URL
        private String widgetContent;  // 위젯내용 (HTML 에디터, 3개 테이블 통일)
        private String widgetConfigJson;  // 위젯설정 (JSON, 3개 테이블 통일)
        private String isSystem;  // 시스템기본위젯 Y/N
        private Integer sortOrd;  // 정렬순서
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
