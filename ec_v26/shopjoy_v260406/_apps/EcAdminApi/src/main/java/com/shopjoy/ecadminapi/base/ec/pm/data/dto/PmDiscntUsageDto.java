package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmDiscntUsageDto {

    // ── pm_discnt_usage ──────────────────────────────────────────
    private String discntUsageId;
    private String siteId;
    private String discntId;
    private String discntNm;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private String discntTypeCd;
    private BigDecimal discntValue;
    private Long discntAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
