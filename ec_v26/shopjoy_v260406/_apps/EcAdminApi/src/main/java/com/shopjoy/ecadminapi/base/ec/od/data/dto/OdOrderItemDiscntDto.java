package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class OdOrderItemDiscntDto {

    // ── od_order_item_discnt ──────────────────────────────────────────
    private String itemDiscntId;
    private String siteId;
    private String orderId;
    private String orderItemId;
    private String discntTypeCd;
    private String couponId;
    private String couponIssueId;
    private BigDecimal discntRate;
    private Long unitDiscntAmt;
    private Long totalDiscntAmt;
    private Integer orderQty;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
