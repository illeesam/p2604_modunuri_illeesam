package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdClaimItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String claimItemId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String claimItemId;
        private String siteId;
        private String claimId;
        private String orderItemId;
        private String prodId;
        private String prodNm;
        private String prodOption;
        private Long unitPrice;
        private Integer claimQty;
        private Long itemAmt;
        private Long refundAmt;
        private String claimItemStatusCd;
        private String claimItemStatusCdBefore;
        private Long returnShippingFee;
        private Long inboundShippingFee;
        private Long exchangeShippingFee;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
