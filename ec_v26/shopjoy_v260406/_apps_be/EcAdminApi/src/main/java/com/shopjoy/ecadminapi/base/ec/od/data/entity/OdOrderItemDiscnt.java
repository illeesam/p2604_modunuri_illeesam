package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_order_item_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 아이템 할인 엔티티
public class OdOrderItemDiscnt extends BaseEntity {

    @Id
    @Column(name = "item_discnt_id", length = 21, nullable = false)
    private String itemDiscntId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "discnt_type_cd", length = 30, nullable = false)
    private String discntTypeCd;

    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Column(name = "discnt_rate")
    private BigDecimal discntRate;

    @Column(name = "unit_discnt_amt")
    private Long unitDiscntAmt;

    @Column(name = "total_discnt_amt")
    private Long totalDiscntAmt;

    @Column(name = "order_qty")
    private Integer orderQty;

}
