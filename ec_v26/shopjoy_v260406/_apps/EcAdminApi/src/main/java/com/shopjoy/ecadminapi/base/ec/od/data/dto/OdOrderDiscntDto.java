package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class OdOrderDiscntDto {

    // ── od_order_discnt ──────────────────────────────────────────
    private String orderDiscntId;
    private String siteId;
    private String orderId;
    private String discntTypeCd;
    private String couponId;
    private String couponIssueId;
    private BigDecimal discntRate;
    private Long discntAmt;
    private Long baseItemAmt;
    private String restoreYn;
    private Long restoreAmt;
    private LocalDateTime restoreDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
