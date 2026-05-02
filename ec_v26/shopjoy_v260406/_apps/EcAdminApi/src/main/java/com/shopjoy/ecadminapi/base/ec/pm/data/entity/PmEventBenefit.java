package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_event_benefit", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 혜택 엔티티
public class PmEventBenefit extends BaseEntity {

    @Id
    @Column(name = "benefit_id", length = 21, nullable = false)
    private String benefitId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "event_id", length = 21, nullable = false)
    private String eventId;

    @Column(name = "benefit_nm", length = 100, nullable = false)
    private String benefitNm;

    @Column(name = "benefit_type_cd", length = 20)
    private String benefitTypeCd;

    @Column(name = "condition_desc", length = 200)
    private String conditionDesc;

    @Column(name = "benefit_value", length = 100)
    private String benefitValue;

    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

}
