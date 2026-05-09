package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmCouponIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String issueId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String issueId;
        private String siteId;
        private String couponId;
        private String memberId;
        private LocalDateTime issueDate;
        private String useYn;
        private LocalDateTime useDate;
        private String orderId;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String couponNm;
        private String couponCd;
        private String couponTypeCd;
        private BigDecimal discountRate;
        private Long discountAmt;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String memberNm;
        private String memberEmail;
        private String memberPhone;
        private String couponTypeCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
