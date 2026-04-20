package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdClaimItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String claimItemId;
    private String siteId;
    private String claimId;
    private String orderItemId;
    private String prodId;
    private String prodNm;
    private String prodOption;
    private Long unitPrice;
    private Integer claimQty;
    private Long itemAmt;
    private Long refundAmt;
    private String claimItemStatusCd;
    private String claimItemStatusCdBefore;
    private Long returnShippingFee;
    private Long inboundShippingFee;
    private Long exchangeShippingFee;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdClaimItem toEntity() {
        return OdClaimItem.builder()
                .claimItemId(claimItemId)
                .siteId(siteId)
                .claimId(claimId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .prodNm(prodNm)
                .prodOption(prodOption)
                .unitPrice(unitPrice)
                .claimQty(claimQty)
                .itemAmt(itemAmt)
                .refundAmt(refundAmt)
                .claimItemStatusCd(claimItemStatusCd)
                .claimItemStatusCdBefore(claimItemStatusCdBefore)
                .returnShippingFee(returnShippingFee)
                .inboundShippingFee(inboundShippingFee)
                .exchangeShippingFee(exchangeShippingFee)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
