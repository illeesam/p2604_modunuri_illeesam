package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_coupon_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 사용 이력 엔티티
@Comment("쿠폰 사용 이력")
public class PmCouponUsage extends BaseEntity {

    @Id
    @Comment("사용이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "usage_id", length = 21, nullable = false)
    private String usageId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("쿠폰ID (pm_coupon.coupon_id)")
    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Comment("쿠폰코드 스냅샷")
    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Comment("쿠폰명 스냅샷")
    @Column(name = "coupon_nm", length = 100)
    private String couponNm;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)")
    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Comment("상품ID (pd_prod.prod_id, 쿠폰 적용 상품)")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("할인유형 (RATE=정률 / FIXED=정액)")
    @Column(name = "discount_type_cd", length = 20)
    private String discountTypeCd;

    @Comment("할인값 (정률: % / 정액: 원)")
    @Column(name = "discount_value")
    private Integer discountValue;

    @Comment("실할인금액")
    @Column(name = "discount_amt")
    private Long discountAmt;

    @Comment("사용일시")
    @Column(name = "used_date")
    private LocalDateTime usedDate;

}
