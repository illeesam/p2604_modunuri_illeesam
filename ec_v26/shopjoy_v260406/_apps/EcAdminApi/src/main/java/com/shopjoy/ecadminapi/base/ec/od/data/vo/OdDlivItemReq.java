package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdDlivItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String dlivItemId;
    private String siteId;
    private String dlivId;
    private String orderItemId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String dlivTypeCd;
    private Long unitPrice;
    private Integer dlivQty;
    private String dlivItemStatusCd;
    private String dlivItemStatusCdBefore;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdDlivItem toEntity() {
        return OdDlivItem.builder()
                .dlivItemId(dlivItemId)
                .siteId(siteId)
                .dlivId(dlivId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .dlivTypeCd(dlivTypeCd)
                .unitPrice(unitPrice)
                .dlivQty(dlivQty)
                .dlivItemStatusCd(dlivItemStatusCd)
                .dlivItemStatusCdBefore(dlivItemStatusCdBefore)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
