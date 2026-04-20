package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCouponUsageDto {

    // ── pm_coupon_usage ──────────────────────────────────────────
    private String usageId;
    private String siteId;
    private String couponId;
    private String couponCode;
    private String couponNm;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private String discountTypeCd;
    private Integer discountValue;
    private Long discountAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
