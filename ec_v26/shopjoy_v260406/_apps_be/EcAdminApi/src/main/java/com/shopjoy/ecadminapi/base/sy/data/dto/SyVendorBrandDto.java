package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorBrandDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String brandId;
        @Size(max = 21) private String vendorBrandId;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_brand ──────────────────────────────────────────
        private String vendorBrandId;
        private String siteId;
        private String vendorId;
        private String brandId;
        private String isMain;
        private String contractCd;
        private LocalDate startDate;
        private LocalDate endDate;
        private BigDecimal commissionRate;
        private Integer sortOrd;
        private String useYn;
        private String vendorBrandRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;
        private String brandNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
