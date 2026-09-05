package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_coupon_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 대상 상품 엔티티
@Comment("쿠폰 적용 대상 항목 (상품/카테고리/판매자/브랜드)")
public class PmCouponItem extends BaseEntity {

    @Id
    @Comment("쿠폰항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "coupon_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponItemId 는 21자 이내여야 합니다.")
    private String couponItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("쿠폰ID (pm_coupon.coupon_id)")
    @Column(name = "coupon_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponId 는 21자 이내여야 합니다.")
    private String couponId;


    @Comment("대상유형 (코드: PROMO_TARGET_TYPE — PRODUCT/CATEGORY/VENDOR/BRAND)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("대상ID (prod_id / category_id / vendor_id / brand_id)")
    @Column(name = "target_id", length = 21, nullable = false)
    @Size(max = 21, message = "targetId 는 21자 이내여야 합니다.")
    private String targetId;

}
