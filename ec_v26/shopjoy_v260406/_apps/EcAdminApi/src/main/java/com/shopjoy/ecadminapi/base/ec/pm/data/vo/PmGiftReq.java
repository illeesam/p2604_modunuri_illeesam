package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmGiftReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String giftId;
    private String siteId;
    private String giftNm;
    private String giftTypeCd;
    private String prodId;
    private Integer giftStock;
    private String giftDesc;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String giftStatusCd;
    private String giftStatusCdBefore;
    private String memGradeCd;
    private Long minOrderAmt;
    private Integer minOrderQty;
    private BigDecimal selfCdivRate;
    private BigDecimal sellerCdivRate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmGift toEntity() {
        return PmGift.builder()
                .giftId(giftId)
                .siteId(siteId)
                .giftNm(giftNm)
                .giftTypeCd(giftTypeCd)
                .prodId(prodId)
                .giftStock(giftStock)
                .giftDesc(giftDesc)
                .startDate(startDate)
                .endDate(endDate)
                .giftStatusCd(giftStatusCd)
                .giftStatusCdBefore(giftStatusCdBefore)
                .memGradeCd(memGradeCd)
                .minOrderAmt(minOrderAmt)
                .minOrderQty(minOrderQty)
                .selfCdivRate(selfCdivRate)
                .sellerCdivRate(sellerCdivRate)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
