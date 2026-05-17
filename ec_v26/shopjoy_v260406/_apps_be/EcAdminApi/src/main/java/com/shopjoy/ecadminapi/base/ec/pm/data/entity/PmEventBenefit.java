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
@Table(name = "pm_event_benefit", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 혜택 엔티티
@Comment("이벤트 혜택")
public class PmEventBenefit extends BaseEntity {

    @Id
    @Comment("혜택ID")
    @Column(name = "benefit_id", length = 21, nullable = false)
    private String benefitId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("이벤트ID")
    @Column(name = "event_id", length = 21, nullable = false)
    private String eventId;

    @Comment("혜택명")
    @Column(name = "benefit_nm", length = 100, nullable = false)
    private String benefitNm;

    @Comment("혜택유형 (코드: BENEFIT_TYPE)")
    @Column(name = "benefit_type_cd", length = 20)
    private String benefitTypeCd;

    @Comment("조건 설명")
    @Column(name = "condition_desc", length = 200)
    private String conditionDesc;

    @Comment("혜택 값")
    @Column(name = "benefit_value", length = 100)
    private String benefitValue;

    @Comment("연결 쿠폰ID")
    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
