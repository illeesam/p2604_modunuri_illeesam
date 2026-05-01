package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmGiftDto {

    // ── pm_gift ──────────────────────────────────────────
    private String giftId;
    private String siteId;
    private String giftNm;
    private String giftTypeCd;
    private String prodId;
    private Integer giftStock;
    private String giftDesc;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String giftStatusCd;
    private String giftStatusCdBefore;
    private String memGradeCd;
    private Long minOrderAmt;
    private Integer minOrderQty;
    private BigDecimal selfCdivRate;
    private BigDecimal sellerCdivRate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
