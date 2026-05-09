package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class DpWidgetLibDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String pathId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String widgetLibId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String widgetLibId;
        private String siteId;
        private String widgetCode;
        private String widgetNm;
        private String widgetTypeCd;
        private String widgetLibDesc;
        private String pathId;
        private String thumbnailUrl;
        private String widgetContent;
        private String widgetConfigJson;
        private String isSystem;
        private Integer sortOrd;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
