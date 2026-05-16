package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_order_item_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 아이템 할인 엔티티
@Comment("주문상품할인 내역 (즉시할인·상품쿠폰)")
public class OdOrderItemDiscnt extends BaseEntity {

    @Id
    @Comment("주문상품할인ID (YYMMDDhhmmss+rand4)")
    @Column(name = "item_discnt_id", length = 21, nullable = false)
    private String itemDiscntId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Comment("할인유형코드 (코드: ORDER_ITEM_DISCNT_TYPE — ITEM_DISCNT/ITEM_COUPON)")
    @Column(name = "discnt_type_cd", length = 30, nullable = false)
    private String discntTypeCd;

    @Comment("쿠폰ID (pm_coupon.coupon_id — ITEM_COUPON인 경우)")
    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Comment("쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ITEM_COUPON인 경우)")
    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Comment("할인율 (% — 비율할인인 경우)")
    @Column(name = "discnt_rate")
    private BigDecimal discntRate;

    @Comment("1개당 할인금액")
    @Column(name = "unit_discnt_amt")
    private Long unitDiscntAmt;

    @Comment("전체 할인금액 (unit_discnt_amt × order_qty)")
    @Column(name = "total_discnt_amt")
    private Long totalDiscntAmt;

    @Comment("주문수량 스냅샷")
    @Column(name = "order_qty")
    private Integer orderQty;

}
