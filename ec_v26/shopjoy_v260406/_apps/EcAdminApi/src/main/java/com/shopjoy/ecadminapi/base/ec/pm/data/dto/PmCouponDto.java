package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 쿠폰 DTO
public class PmCouponDto {

    // ── pm_coupon ────────────────────────────────────────────────
    private String couponId;
    private String siteId;
    private String couponCd;
    private String couponNm;
    private String couponTypeCd;
    private BigDecimal discountRate;
    private Long   discountAmt;
    private Long   minOrderAmt;
    private Integer minOrderQty;
    private Long   maxDiscountAmt;
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

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String couponTypeCdNm;
    private String couponStatusCdNm;
    private String targetTypeCdNm;
    private String memGradeCdNm;
}
