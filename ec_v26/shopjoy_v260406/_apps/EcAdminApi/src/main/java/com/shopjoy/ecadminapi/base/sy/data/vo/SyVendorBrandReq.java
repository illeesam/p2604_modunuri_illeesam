package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class SyVendorBrandReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public SyVendorBrand toEntity() {
        return SyVendorBrand.builder()
                .vendorBrandId(vendorBrandId)
                .siteId(siteId)
                .vendorId(vendorId)
                .brandId(brandId)
                .isMain(isMain)
                .contractCd(contractCd)
                .startDate(startDate)
                .endDate(endDate)
                .commissionRate(commissionRate)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .vendorBrandRemark(vendorBrandRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
