package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class DpWidgetDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String widgetId;
        @Size(max = 21) private String widgetLibId;
        @Size(max = 30) private String widgetTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String widgetId;
        private String widgetLibId;
        private String siteId;
        private String widgetNm;
        private String widgetTypeCd;
        private String widgetDesc;
        private String widgetTitle;
        private String widgetContent;
        private String titleShowYn;
        private String widgetLibRefYn;
        private String widgetConfigJson;
        private String previewImgUrl;
        private Integer sortOrd;
        private String useYn;
        private String dispEnv;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
