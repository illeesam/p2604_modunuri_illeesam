package com.shopjoy.ecBeBo.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "giftCondId 는 21자 이내여야 합니다.")
    private String giftCondId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21, nullable = false)
    @Size(max = 21, message = "giftId 는 21자 이내여야 합니다.")
    private String giftId;


    @Comment("조건유형 (코드: COND_TYPE_CD)")
    @Column(name = "cond_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "condTypeCd 는 20자 이내여야 합니다.")
    private String condTypeCd;

    @Comment("최소주문금액 (ORDER_AMT 조건)")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("대상유형 (PRODUCT/CATEGORY/MEMBER_GRADE)")
    @Column(name = "target_type_cd", length = 20)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("대상ID")
    @Column(name = "target_id", length = 21)
    @Size(max = 21, message = "targetId 는 21자 이내여야 합니다.")
    private String targetId;

}
