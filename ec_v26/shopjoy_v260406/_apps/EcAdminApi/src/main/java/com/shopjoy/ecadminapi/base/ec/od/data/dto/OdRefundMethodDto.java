package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdRefundMethodDto {

    // ── od_refund_method ──────────────────────────────────────────
    private String refundMethodId;
    private String siteId;
    private String refundId;
    private String orderId;
    private String payMethodCd;
    private Integer refundPriority;
    private Long refundAmt;
    private Long refundAvailAmt;
    private String refundStatusCd;
    private String refundStatusCdBefore;
    private LocalDateTime refundDate;
    private String payId;
    private String pgRefundId;
    private String pgResponse;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
