package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_event_benefit", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 이벤트 혜택 엔티티
public class PmEventBenefit {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}