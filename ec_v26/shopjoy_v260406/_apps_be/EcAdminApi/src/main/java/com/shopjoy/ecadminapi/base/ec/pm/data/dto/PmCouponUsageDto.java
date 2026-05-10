package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmCouponUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String usageId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String usageId;
        private String siteId;
        private String couponId;
        private String couponCode;
        private String couponNm;
        private String memberId;
        private String orderId;
        private String orderItemId;
        private String prodId;
        private String discountTypeCd;
        private Integer discountValue;
        private Long discountAmt;
        private LocalDateTime usedDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
