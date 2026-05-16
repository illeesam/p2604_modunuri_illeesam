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
import java.util.List;

public class PmCouponDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String couponId;
        private List<String> couponIds;                // PK 다건 IN
        @Size(max = 21) private String memberId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String couponId;
        private String siteId;
        private String couponCd;
        private String couponNm;
        private String couponTypeCd;
        private BigDecimal discountRate;
        private Long discountAmt;
        private Long minOrderAmt;
        private Integer minOrderQty;
        private Long maxDiscountAmt;
        private Integer issueLimit;
        private Integer issueCnt;
        private Integer maxIssuePerMem;
        private String couponDesc;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String couponStatusCd;
        private String couponStatusCdBefore;
        private String useYn;
        private String targetTypeCd;
        private String targetValue;
        private String memGradeCd;
        private BigDecimal selfCdivRate;
        private BigDecimal sellerCdivRate;
        private String sellerCdivRemark;
        private String dvcPcYn;
        private String dvcMwebYn;
        private String dvcMappYn;
        private String memo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String couponTypeCdNm;
        private String couponStatusCdNm;
        private String targetTypeCdNm;
        private String memGradeCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
