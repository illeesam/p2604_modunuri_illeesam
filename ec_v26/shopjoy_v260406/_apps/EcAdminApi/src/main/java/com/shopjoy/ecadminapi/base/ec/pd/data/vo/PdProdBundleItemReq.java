package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PdProdBundleItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PdProdBundleItem toEntity() {
        return PdProdBundleItem.builder()
                .bundleItemId(bundleItemId)
                .siteId(siteId)
                .bundleProdId(bundleProdId)
                .itemProdId(itemProdId)
                .itemSkuId(itemSkuId)
                .itemQty(itemQty)
                .priceRate(priceRate)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
