package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleItemDto {

    // ── st_settle_item ──────────────────────────────────────────
    private String settleItemId;
    private String settleId;
    private String siteId;
    private String orderId;
    private String orderItemId;
    private String vendorId;
    private String prodId;
    private String settleItemTypeCd;
    private LocalDateTime orderDate;
    private Integer orderQty;
    private Long unitPrice;
    private Long itemPrice;
    private Long discntAmt;
    private BigDecimal commissionRate;
    private Long commissionAmt;
    private Long settleItemAmt;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
