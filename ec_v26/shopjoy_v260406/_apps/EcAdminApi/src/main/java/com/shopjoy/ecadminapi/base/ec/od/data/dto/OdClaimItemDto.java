package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdClaimItemDto {

    // ── od_claim_item ──────────────────────────────────────────
    private String claimItemId;
    private String siteId;
    private String claimId;
    private String orderItemId;
    private String prodId;
    private String prodNm;
    private String prodOption;
    private Long unitPrice;
    private Integer claimQty;
    private Long itemAmt;
    private Long refundAmt;
    private String claimItemStatusCd;
    private String claimItemStatusCdBefore;
    private Long returnShippingFee;
    private Long inboundShippingFee;
    private Long exchangeShippingFee;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
