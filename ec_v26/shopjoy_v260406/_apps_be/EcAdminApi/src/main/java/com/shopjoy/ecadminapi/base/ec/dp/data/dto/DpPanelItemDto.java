package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class DpPanelItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String panelItemId;
        @Size(max = 21) private String panelId;
        private List<String> panelIds;                 // 상위 FK 다건 IN
        @Size(max = 21) private String widgetLibId;
        @Size(max = 30) private String widgetTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String panelItemId;
        private String panelId;
        private String widgetLibId;
        private String widgetTypeCd;
        private String widgetTitle;
        private String widgetContent;
        private String titleShowYn;
        private String widgetLibRefYn;
        private String contentTypeCd;
        private Integer sortOrd;
        private String widgetConfigJson;
        private String visibilityTargets;
        private String dispYn;
        private LocalDateTime dispStartDt;
        private LocalDateTime dispEndDt;
        private String dispEnv;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
