package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class DpAreaPanelDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String areaPanelId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String areaPanelId;
        private String areaId;
        private String panelId;
        private Integer panelSortOrd;
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
