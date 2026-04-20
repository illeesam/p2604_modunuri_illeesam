package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdRefundDto {

    // ── od_refund ──────────────────────────────────────────
    private String refundId;
    private String siteId;
    private String orderId;
    private String claimId;
    private String refundTypeCd;
    private Long refundProdAmt;
    private Long refundCouponAmt;
    private Long refundShipAmt;
    private Long refundSaveAmt;
    private Long refundCacheAmt;
    private Long totalRefundAmt;
    private String refundStatusCd;
    private String refundStatusCdBefore;
    private LocalDateTime refundReqDate;
    private LocalDateTime refundCompltDate;
    private String faultTypeCd;
    private String refundReason;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
