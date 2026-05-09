package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdRefundMethodDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String refundMethodId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String refundMethodId;
        private String siteId;
        private String refundId;
        private String orderId;
        private String payMethodCd;
        private Integer refundPriority;
        private Long refundAmt;
        private Long refundAvailAmt;
        private String refundStatusCd;
        private String refundStatusCdBefore;
        private LocalDateTime refundDate;
        private String payId;
        private String pgRefundId;
        private String pgResponse;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
