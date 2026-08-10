package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Entity
@Table(name = "pm_coupon_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("쿠폰 적용 상품 전개 (배치 생성)")
public class PmCouponProd {

    /* 대리키 PK — (coupon_id, prod_id) 복합키였으나 정책에 따라 단일 PK + UNIQUE 로 전환.
       유일성은 pm_coupon_prod_uk_coupon_id_prod_id_x2 가 계속 보장한다. */
    @Id
    @Comment("쿠폰상품ID (PK)")
    @Column(name = "coupon_prod_id", length = 21, nullable = false)
    private String couponProdId;

    @Comment("쿠폰ID (pm_coupon.coupon_id)")
    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("배치 생성일시")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
