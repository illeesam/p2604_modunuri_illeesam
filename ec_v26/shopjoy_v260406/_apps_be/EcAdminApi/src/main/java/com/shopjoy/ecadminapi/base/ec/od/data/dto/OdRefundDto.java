package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdRefundDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String refundId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String refundId;
        private String siteId;
        private String orderId;
        private String claimId;
        private String refundTypeCd;
        private Long refundProdAmt;
        private Long refundCouponAmt;
        private Long refundShipAmt;
        private Long refundSaveAmt;
        private Long refundCacheAmt;
        private Long totalRefundAmt;
        private String refundStatusCd;
        private String refundStatusCdBefore;
        private LocalDateTime refundReqDate;
        private LocalDateTime refundCompltDate;
        private String faultTypeCd;
        private String refundReason;
        private String memo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
