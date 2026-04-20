package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_coupon_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 쿠폰 사용 이력 엔티티
public class PmCouponUsage {

    @Id
    @Column(name = "usage_id", length = 21, nullable = false)
    private String usageId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "coupon_nm", length = 100)
    private String couponNm;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "discount_type_cd", length = 20)
    private String discountTypeCd;

    @Column(name = "discount_value")
    private Integer discountValue;

    @Column(name = "discount_amt")
    private Long discountAmt;

    @Column(name = "used_date")
    private LocalDateTime usedDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}