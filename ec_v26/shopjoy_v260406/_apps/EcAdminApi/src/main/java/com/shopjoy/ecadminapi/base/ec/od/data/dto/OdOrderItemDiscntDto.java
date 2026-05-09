package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OdOrderItemDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String itemDiscntId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String itemDiscntId;
        private String siteId;
        private String orderId;
        private String orderItemId;
        private String discntTypeCd;
        private String couponId;
        private String couponIssueId;
        private BigDecimal discntRate;
        private Long unitDiscntAmt;
        private Long totalDiscntAmt;
        private Integer orderQty;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
