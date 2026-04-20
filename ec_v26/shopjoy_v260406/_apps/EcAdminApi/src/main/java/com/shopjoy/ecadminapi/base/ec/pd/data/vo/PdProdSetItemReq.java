package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdSetItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PdProdSetItem toEntity() {
        return PdProdSetItem.builder()
                .setItemId(setItemId)
                .siteId(siteId)
                .setProdId(setProdId)
                .itemProdId(itemProdId)
                .itemSkuId(itemSkuId)
                .itemNm(itemNm)
                .itemQty(itemQty)
                .itemDesc(itemDesc)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
