package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdSetItemDto {

    // ── pd_prod_set_item ──────────────────────────────────────────
    private String setItemId;
    private String siteId;
    private String setProdId;
    private String itemProdId;
    private String itemSkuId;
    private String itemNm;
    private Integer itemQty;
    private String itemDesc;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
