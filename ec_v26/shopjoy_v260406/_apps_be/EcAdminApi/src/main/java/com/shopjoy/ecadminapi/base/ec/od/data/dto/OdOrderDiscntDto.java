package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OdOrderDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderDiscntId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderDiscntId;
        private String siteId;
        private String orderId;
        private String discntTypeCd;
        private String couponId;
        private String couponIssueId;
        private BigDecimal discntRate;
        private Long discntAmt;
        private Long baseItemAmt;
        private String restoreYn;
        private Long restoreAmt;
        private LocalDateTime restoreDate;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
