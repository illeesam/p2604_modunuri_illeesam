package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_settle_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 항목 엔티티
@Comment("정산 항목 (주문항목별 명세)")
public class StSettleItem extends BaseEntity {

    @Id
    @Comment("정산항목ID")
    @Column(name = "settle_item_id", length = 21, nullable = false)
    private String settleItemId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("주문항목ID (od_order_item.order_item_id)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("항목유형 (코드: SETTLE_ITEM_TYPE — SALE/CANCEL/RETURN)")
    @Column(name = "settle_item_type_cd", length = 20)
    private String settleItemTypeCd;

    @Comment("주문일시")
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Comment("주문수량")
    @Column(name = "order_qty")
    private Integer orderQty;

    @Comment("단가")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("소계 (unit_price × order_qty)")
    @Column(name = "item_price")
    private Long itemPrice;

    @Comment("할인금액")
    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Comment("수수료율 (%)")
    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Comment("수수료금액")
    @Column(name = "commission_amt")
    private Long commissionAmt;

    @Comment("항목 정산금액")
    @Column(name = "settle_item_amt")
    private Long settleItemAmt;

}
