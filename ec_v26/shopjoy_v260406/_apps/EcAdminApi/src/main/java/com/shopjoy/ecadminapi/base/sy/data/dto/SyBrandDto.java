package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBrandDto {

    // ── sy_brand ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
