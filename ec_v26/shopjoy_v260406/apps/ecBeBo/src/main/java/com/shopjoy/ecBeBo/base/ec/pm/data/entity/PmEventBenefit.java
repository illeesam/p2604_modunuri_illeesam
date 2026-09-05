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
@Table(name = "pm_event_benefit", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 혜택 엔티티
@Comment("이벤트 혜택")
public class PmEventBenefit extends BaseEntity {

    @Id
    @Comment("혜택ID")
    @Column(name = "event_benefit_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventBenefitId 는 21자 이내여야 합니다.")
    private String eventBenefitId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("이벤트ID")
    @Column(name = "event_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventId 는 21자 이내여야 합니다.")
    private String eventId;

    @Comment("혜택명")
    @Column(name = "benefit_nm", length = 100, nullable = false)
    @Size(max = 100, message = "benefitNm 는 100자 이내여야 합니다.")
    private String benefitNm;

    @Comment("혜택유형 (코드: BENEFIT_TYPE_CD)")
    @Column(name = "benefit_type_cd", length = 20)
    @Size(max = 20, message = "benefitTypeCd 는 20자 이내여야 합니다.")
    private String benefitTypeCd;

    @Comment("조건 설명")
    @Column(name = "condition_desc", length = 200)
    @Size(max = 200, message = "conditionDesc 는 200자 이내여야 합니다.")
    private String conditionDesc;

    @Comment("혜택 값")
    @Column(name = "benefit_value", length = 100)
    @Size(max = 100, message = "benefitValue 는 100자 이내여야 합니다.")
    private String benefitValue;

    @Comment("연결 쿠폰ID")
    @Column(name = "coupon_id", length = 21)
    @Size(max = 21, message = "couponId 는 21자 이내여야 합니다.")
    private String couponId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
