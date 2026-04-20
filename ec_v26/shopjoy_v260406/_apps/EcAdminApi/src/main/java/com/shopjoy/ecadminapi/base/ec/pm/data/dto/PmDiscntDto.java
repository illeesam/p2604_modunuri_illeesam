package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmDiscntDto {

    // ── pm_discnt ──────────────────────────────────────────
    private String discntId;
    private String siteId;
    private String discntNm;
    private String discntTypeCd;
    private String discntTargetCd;
    private BigDecimal discntValue;
    private Long minOrderAmt;
    private Integer minOrderQty;
    private Long maxDiscntAmt;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String discntStatusCd;
    private String discntStatusCdBefore;
    private String discntDesc;
    private String memGradeCd;
    private BigDecimal selfCdivRate;
    private BigDecimal sellerCdivRate;
    private String dvcPcYn;
    private String dvcMwebYn;
    private String dvcMappYn;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
