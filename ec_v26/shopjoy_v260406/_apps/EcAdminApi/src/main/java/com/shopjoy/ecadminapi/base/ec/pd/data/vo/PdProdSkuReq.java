package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdSkuReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String skuId;
    private String siteId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String skuCode;
    private Long addPrice;
    private Integer prodOptStock;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdSku toEntity() {
        return PdProdSku.builder()
                .skuId(skuId)
                .siteId(siteId)
                .prodId(prodId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .skuCode(skuCode)
                .addPrice(addPrice)
                .prodOptStock(prodOptStock)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
