package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_claim_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 클레임 아이템 엔티티
public class OdClaimItem {

    @Id
    @Column(name = "claim_item_id", length = 21, nullable = false)
    private String claimItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Column(name = "prod_option", length = 500)
    private String prodOption;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "claim_qty")
    private Integer claimQty;

    @Column(name = "item_amt")
    private Long itemAmt;

    @Column(name = "refund_amt")
    private Long refundAmt;

    @Column(name = "claim_item_status_cd", length = 20)
    private String claimItemStatusCd;

    @Column(name = "claim_item_status_cd_before", length = 20)
    private String claimItemStatusCdBefore;

    @Column(name = "return_shipping_fee")
    private Long returnShippingFee;

    @Column(name = "inbound_shipping_fee")
    private Long inboundShippingFee;

    @Column(name = "exchange_shipping_fee")
    private Long exchangeShippingFee;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}