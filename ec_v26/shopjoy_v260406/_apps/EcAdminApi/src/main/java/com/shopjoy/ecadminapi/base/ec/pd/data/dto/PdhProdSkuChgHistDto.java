package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdhProdSkuChgHistDto {

    // ── pdh_prod_sku_chg_hist ──────────────────────────────────────────
    private String histId;
    private String siteId;
    private String skuId;
    private String prodId;
    private String chgTypeCd;
    private String beforeVal;
    private String afterVal;
    private String chgReason;
    private String chgBy;
    private LocalDateTime chgDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
