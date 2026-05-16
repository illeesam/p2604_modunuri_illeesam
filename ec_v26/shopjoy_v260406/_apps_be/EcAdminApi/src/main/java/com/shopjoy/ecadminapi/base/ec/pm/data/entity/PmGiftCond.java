package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_gift_cond", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사은품 지급 조건 엔티티
@Comment("사은품 지급 조건")
public class PmGiftCond extends BaseEntity {

    @Id
    @Comment("사은품조건ID")
    @Column(name = "gift_cond_id", length = 21, nullable = false)
    private String giftCondId;

    @Comment("사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21, nullable = false)
    private String giftId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("조건유형 (코드: GIFT_COND_TYPE)")
    @Column(name = "cond_type_cd", length = 20, nullable = false)
    private String condTypeCd;

    @Comment("최소주문금액 (ORDER_AMT 조건)")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)")
    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Comment("대상ID")
    @Column(name = "target_id", length = 21)
    private String targetId;

}
