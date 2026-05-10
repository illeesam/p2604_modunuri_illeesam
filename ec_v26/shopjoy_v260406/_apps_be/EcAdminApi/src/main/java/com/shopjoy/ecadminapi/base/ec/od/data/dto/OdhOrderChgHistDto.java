package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdhOrderChgHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderChgHistId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderChgHistId;
        private String siteId;
        private String orderId;
        private String chgTypeCd;
        private String chgField;
        private String beforeVal;
        private String afterVal;
        private String chgReason;
        private String chgUserId;
        private LocalDateTime chgDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
