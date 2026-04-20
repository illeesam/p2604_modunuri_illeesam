package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

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
