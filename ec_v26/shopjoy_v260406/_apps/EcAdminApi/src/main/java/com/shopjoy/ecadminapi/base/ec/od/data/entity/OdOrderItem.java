package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_order_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 주문 아이템(상품) 엔티티
public class OdOrderItem {

    @Id
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Column(name = "opt_item_id_1", length = 20)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 20)
    private String optItemId2;

    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Column(name = "brand_nm", length = 100)
    private String brandNm;

    @Column(name = "dliv_tmplt_id", length = 21)
    private String dlivTmpltId;

    @Column(name = "normal_price")
    private Long normalPrice;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "order_qty")
    private Integer orderQty;

    @Column(name = "item_order_amt")
    private Long itemOrderAmt;

    @Column(name = "cancel_qty")
    private Integer cancelQty;

    @Column(name = "item_cancel_amt")
    private Long itemCancelAmt;

    @Column(name = "complet_qty")
    private Integer completQty;

    @Column(name = "item_completed_amt")
    private Long itemCompletedAmt;

    @Column(name = "org_unit_price")
    private Long orgUnitPrice;

    @Column(name = "org_item_order_amt")
    private Long orgItemOrderAmt;

    @Column(name = "org_discount_amt")
    private Long orgDiscountAmt;

    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Column(name = "save_use_amt")
    private Long saveUseAmt;

    @Column(name = "save_schd_amt")
    private Long saveSchdAmt;

    @Column(name = "order_item_status_cd", length = 20)
    private String orderItemStatusCd;

    @Column(name = "order_item_status_cd_before", length = 20)
    private String orderItemStatusCdBefore;

    @Column(name = "claim_yn", length = 1)
    private String claimYn;

    @Column(name = "buy_confirm_yn", length = 1)
    private String buyConfirmYn;

    @Column(name = "buy_confirm_schd_date")
    private LocalDate buyConfirmSchdDate;

    @Column(name = "buy_confirm_date")
    private LocalDateTime buyConfirmDate;

    @Column(name = "settle_yn", length = 1)
    private String settleYn;

    @Column(name = "settle_date")
    private LocalDateTime settleDate;

    @Column(name = "reserve_sale_yn", length = 1)
    private String reserveSaleYn;

    @Column(name = "reserve_dliv_schd_date")
    private LocalDateTime reserveDlivSchdDate;

    @Column(name = "bundle_group_id", length = 36)
    private String bundleGroupId;

    @Column(name = "bundle_price_rate")
    private BigDecimal bundlePriceRate;

    @Column(name = "gift_id", length = 21)
    private String giftId;

    @Column(name = "outbound_shipping_fee")
    private Long outboundShippingFee;

    @Column(name = "dliv_courier_cd", length = 30)
    private String dlivCourierCd;

    @Column(name = "dliv_tracking_no", length = 100)
    private String dlivTrackingNo;

    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}