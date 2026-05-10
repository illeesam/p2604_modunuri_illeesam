package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmVoucherDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String voucherId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String voucherId;
        private String siteId;
        private String voucherNm;
        private String voucherTypeCd;
        private BigDecimal voucherValue;
        private Long minOrderAmt;
        private Long maxDiscntAmt;
        private Integer expireMonth;
        private String voucherStatusCd;
        private String voucherStatusCdBefore;
        private String voucherDesc;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
