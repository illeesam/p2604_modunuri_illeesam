package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 항목 엔티티
public class StSettleItem {

    @Id
    @Column(name = "settle_item_id", length = 21, nullable = false)
    private String settleItemId;

    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "settle_item_type_cd", length = 20)
    private String settleItemTypeCd;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "order_qty")
    private Integer orderQty;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "item_price")
    private Long itemPrice;

    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Column(name = "commission_amt")
    private Long commissionAmt;

    @Column(name = "settle_item_amt")
    private Long settleItemAmt;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}