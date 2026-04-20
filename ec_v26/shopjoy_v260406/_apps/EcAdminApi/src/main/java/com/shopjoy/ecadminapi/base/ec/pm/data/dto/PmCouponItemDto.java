package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCouponItemDto {

    // ── pm_coupon_item ──────────────────────────────────────────
    private String couponItemId;
    private String couponId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
