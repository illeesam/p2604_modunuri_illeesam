package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmDiscntUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String discntUsageId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String discntUsageId;
        private String siteId;
        private String discntId;
        private String discntNm;
        private String memberId;
        private String orderId;
        private String orderItemId;
        private String prodId;
        private String discntTypeCd;
        private BigDecimal discntValue;
        private Long discntAmt;
        private LocalDateTime usedDate;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
