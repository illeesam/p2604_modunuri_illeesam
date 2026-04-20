package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 상품 SKU DTO
public class PdProdSkuDto {

    // ── pd_prod_sku ──────────────────────────────────────────────
    private String skuId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String skuCode;
    private Long   addPrice;
    private Integer stock;
    private String useYn;
    private Integer sortNo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: pd_prod_opt_item (x2) ──────────────────────────────
    private String optItemNm1;
    private String optItemNm2;
}
