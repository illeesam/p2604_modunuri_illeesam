package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StSettleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String settleId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleId;
        private String siteId;
        private String vendorId;
        private String settleYm;
        private LocalDateTime settleStartDate;
        private LocalDateTime settleEndDate;
        private Long totalOrderAmt;
        private Long totalReturnAmt;
        private Integer totalClaimCnt;
        private Long totalDiscntAmt;
        private BigDecimal commissionRate;
        private Long commissionAmt;
        private Long settleAmt;
        private Long adjAmt;
        private Long etcAdjAmt;
        private Long finalSettleAmt;
        private String settleStatusCd;
        private String settleStatusCdBefore;
        private String settleMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
