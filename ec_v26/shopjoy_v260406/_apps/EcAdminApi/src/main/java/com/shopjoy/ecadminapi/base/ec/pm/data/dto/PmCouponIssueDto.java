package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 쿠폰 발행 DTO
public class PmCouponIssueDto {

    // ── pm_coupon_issue ──────────────────────────────────────────
    private String issueId;
    private String siteId;
    private String couponId;
    private String memberId;
    private LocalDateTime issueDate;
    private String useYn;
    private LocalDateTime useDate;
    private String orderId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: pm_coupon ──────────────────────────────────────────
    private String couponNm;
    private String couponCd;
    private String couponTypeCd;
    private BigDecimal discountRate;
    private Long   discountAmt;
    private LocalDate validFrom;
    private LocalDate validTo;

    // ── JOIN: mb_member ──────────────────────────────────────────
    private String memberNm;
    private String memberEmail;
    private String memberPhone;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String couponTypeCdNm;
}
