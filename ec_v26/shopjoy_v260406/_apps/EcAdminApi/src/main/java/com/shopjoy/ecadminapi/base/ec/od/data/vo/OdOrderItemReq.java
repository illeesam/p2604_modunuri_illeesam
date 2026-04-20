package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class OdOrderItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String orderItemId;
    private String siteId;
    private String orderId;
    private String prodId;
    private String skuId;
    private String optItemId1;
    private String optItemId2;
    private String prodNm;
    private String brandNm;
    private String dlivTmpltId;
    private Long normalPrice;
    private Long unitPrice;
    private Integer orderQty;
    private Long itemOrderAmt;
    private Integer cancelQty;
    private Long itemCancelAmt;
    private Integer completQty;
    private Long itemCompletedAmt;
    private Long orgUnitPrice;
    private Long orgItemOrderAmt;
    private Long orgDiscountAmt;
    private Long orgShippingFee;
    private BigDecimal saveRate;
    private Long saveUseAmt;
    private Long saveSchdAmt;
    private String orderItemStatusCd;
    private String orderItemStatusCdBefore;
    private String claimYn;
    private String buyConfirmYn;
    private LocalDate buyConfirmSchdDate;
    private LocalDateTime buyConfirmDate;
    private String settleYn;
    private LocalDateTime settleDate;
    private String reserveSaleYn;
    private LocalDateTime reserveDlivSchdDate;
    private String bundleGroupId;
    private BigDecimal bundlePriceRate;
    private String giftId;
    private Long outboundShippingFee;
    private String dlivCourierCd;
    private String dlivTrackingNo;
    private LocalDateTime dlivShipDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdOrderItem toEntity() {
        return OdOrderItem.builder()
                .orderItemId(orderItemId)
                .siteId(siteId)
                .orderId(orderId)
                .prodId(prodId)
                .skuId(skuId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .prodNm(prodNm)
                .brandNm(brandNm)
                .dlivTmpltId(dlivTmpltId)
                .normalPrice(normalPrice)
                .unitPrice(unitPrice)
                .orderQty(orderQty)
                .itemOrderAmt(itemOrderAmt)
                .cancelQty(cancelQty)
                .itemCancelAmt(itemCancelAmt)
                .completQty(completQty)
                .itemCompletedAmt(itemCompletedAmt)
                .orgUnitPrice(orgUnitPrice)
                .orgItemOrderAmt(orgItemOrderAmt)
                .orgDiscountAmt(orgDiscountAmt)
                .orgShippingFee(orgShippingFee)
                .saveRate(saveRate)
                .saveUseAmt(saveUseAmt)
                .saveSchdAmt(saveSchdAmt)
                .orderItemStatusCd(orderItemStatusCd)
                .orderItemStatusCdBefore(orderItemStatusCdBefore)
                .claimYn(claimYn)
                .buyConfirmYn(buyConfirmYn)
                .buyConfirmSchdDate(buyConfirmSchdDate)
                .buyConfirmDate(buyConfirmDate)
                .settleYn(settleYn)
                .settleDate(settleDate)
                .reserveSaleYn(reserveSaleYn)
                .reserveDlivSchdDate(reserveDlivSchdDate)
                .bundleGroupId(bundleGroupId)
                .bundlePriceRate(bundlePriceRate)
                .giftId(giftId)
                .outboundShippingFee(outboundShippingFee)
                .dlivCourierCd(dlivCourierCd)
                .dlivTrackingNo(dlivTrackingNo)
                .dlivShipDate(dlivShipDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
