package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorBrandDto {

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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
