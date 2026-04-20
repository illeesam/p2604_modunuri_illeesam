package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdhProdSkuStockHistDto {

    // ── pdh_prod_sku_stock_hist ──────────────────────────────────────────
    private String histId;
    private String siteId;
    private String skuId;
    private String prodId;
    private Integer stockBefore;
    private Integer stockAfter;
    private Integer chgQty;
    private String chgReasonCd;
    private String chgReason;
    private String orderItemId;
    private String chgBy;
    private LocalDateTime chgDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
