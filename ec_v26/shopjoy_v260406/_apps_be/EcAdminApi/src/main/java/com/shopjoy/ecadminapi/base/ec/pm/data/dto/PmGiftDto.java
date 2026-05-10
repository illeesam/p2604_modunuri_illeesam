package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmGiftDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String giftId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String giftId;
        private String siteId;
        private String giftNm;
        private String giftTypeCd;
        private String prodId;
        private Integer giftStock;
        private String giftDesc;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String giftStatusCd;
        private String giftStatusCdBefore;
        private String memGradeCd;
        private Long minOrderAmt;
        private Integer minOrderQty;
        private BigDecimal selfCdivRate;
        private BigDecimal sellerCdivRate;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
