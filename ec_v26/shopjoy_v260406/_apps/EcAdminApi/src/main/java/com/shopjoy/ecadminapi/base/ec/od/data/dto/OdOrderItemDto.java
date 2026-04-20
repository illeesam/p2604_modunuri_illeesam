package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 주문 아이템(상품) DTO
public class OdOrderItemDto {

    // ── od_order_item ────────────────────────────────────────────
    private String  orderItemId;
    private String  siteId;
    private String  orderId;
    private String  prodId;
    private String  skuId;
    private String  optItemId1;
    private String  optItemId2;
    private String  prodNm;
    private String  brandNm;
    private String  dlivTmpltId;
    private Long    normalPrice;
    private Long    unitPrice;
    private Integer orderQty;
    private Long    itemOrderAmt;
    private Integer cancelQty;
    private Long    itemCancelAmt;
    private Integer completQty;
    private Long    itemCompletedAmt;
    private Long    orgUnitPrice;
    private Long    orgItemOrderAmt;
    private Long    orgDiscountAmt;
    private Long    orgShippingFee;
    private BigDecimal saveRate;
    private Long    saveUseAmt;
    private Long    saveSchdAmt;
    private String  orderItemStatusCd;
    private String  orderItemStatusCdBefore;
    private String  claimYn;
    private String  buyConfirmYn;
    private LocalDate buyConfirmSchdDate;
    private LocalDateTime buyConfirmDate;
    private String  settleYn;
    private LocalDateTime settleDate;
    private String  reserveSaleYn;
    private LocalDateTime reserveDlivSchdDate;
    private String  bundleGroupId;
    private BigDecimal bundlePriceRate;
    private String  giftId;
    private Long    outboundShippingFee;
    private String  dlivCourierCd;
    private String  dlivTrackingNo;
    private LocalDateTime dlivShipDate;
    private String  regBy;
    private LocalDateTime regDate;
    private String  updBy;
    private LocalDateTime updDate;

    // ── JOIN: pd_prod ────────────────────────────────────────────
    private String thumbnailUrl;
    private Long   salePriceCurrent;
    private String prodNmCurrent;

    // ── JOIN: pd_prod_sku ────────────────────────────────────────
    private String skuCode;

    // ── JOIN: pd_prod_opt_item (x2) ──────────────────────────────
    private String optItemNm1;
    private String optItemNm2;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String orderItemStatusCdNm;
    private String dlivCourierCdNm;
}
