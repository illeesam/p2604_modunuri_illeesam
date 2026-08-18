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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_coupon_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 사용 이력 엔티티
@Comment("쿠폰 사용 이력")
public class PmCouponUsage extends BaseEntity {

    @Id
    @Comment("사용이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "coupon_usage_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponUsageId 는 21자 이내여야 합니다.")
    private String couponUsageId;


    @Comment("쿠폰ID (pm_coupon.coupon_id)")
    @Column(name = "coupon_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponId 는 21자 이내여야 합니다.")
    private String couponId;

    @Comment("쿠폰코드 스냅샷")
    @Column(name = "coupon_code", length = 50)
    @Size(max = 50, message = "couponCode 는 50자 이내여야 합니다.")
    private String couponCode;

    @Comment("쿠폰명 스냅샷")
    @Column(name = "coupon_nm", length = 100)
    @Size(max = 100, message = "couponNm 는 100자 이내여야 합니다.")
    private String couponNm;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id, 상품별 쿠폰 적용 시)")
    @Column(name = "order_item_id", length = 21)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("상품ID (pd_prod.prod_id, 쿠폰 적용 상품)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("할인유형 (RATE=정률 / FIXED=정액)")
    @Column(name = "discount_type_cd", length = 20)
    @Size(max = 20, message = "discountTypeCd 는 20자 이내여야 합니다.")
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
