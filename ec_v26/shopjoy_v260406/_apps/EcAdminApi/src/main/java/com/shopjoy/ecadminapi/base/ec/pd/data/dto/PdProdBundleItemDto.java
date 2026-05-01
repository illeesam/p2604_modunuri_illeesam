package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdBundleItemDto {

    // ── pd_prod_bundle_item ──────────────────────────────────────────
    private String bundleItemId;
    private String siteId;
    private String bundleProdId;
    private String itemProdId;
    private String itemSkuId;
    private Integer itemQty;
    private BigDecimal priceRate;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
