package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBrandReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String brandId;
    private String siteId;
    private String brandCode;
    private String brandNm;
    private String brandEnNm;
    private String dispPath;
    private String logoUrl;
    private String vendorId;
    private Integer sortOrd;
    private String useYn;
    private String brandRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyBrand toEntity() {
        return SyBrand.builder()
                .brandId(brandId)
                .siteId(siteId)
                .brandCode(brandCode)
                .brandNm(brandNm)
                .brandEnNm(brandEnNm)
                .dispPath(dispPath)
                .logoUrl(logoUrl)
                .vendorId(vendorId)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .brandRemark(brandRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
