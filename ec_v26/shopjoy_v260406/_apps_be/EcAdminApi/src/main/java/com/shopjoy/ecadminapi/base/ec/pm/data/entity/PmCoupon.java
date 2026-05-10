package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_coupon", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 엔티티
public class PmCoupon extends BaseEntity {

    @Id
    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "coupon_cd", length = 50, nullable = false)
    private String couponCd;

    @Column(name = "coupon_nm", length = 100, nullable = false)
    private String couponNm;

    @Column(name = "coupon_type_cd", length = 20, nullable = false)
    private String couponTypeCd;

    @Column(name = "discount_rate")
    private BigDecimal discountRate;

    @Column(name = "discount_amt")
    private Long discountAmt;

    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Column(name = "max_discount_amt")
    private Long maxDiscountAmt;

    @Column(name = "issue_limit")
    private Integer issueLimit;

    @Column(name = "issue_cnt")
    private Integer issueCnt;

    @Column(name = "max_issue_per_mem")
    private Integer maxIssuePerMem;

    @Column(name = "coupon_desc", columnDefinition = "TEXT")
    private String couponDesc;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "coupon_status_cd", length = 20)
    private String couponStatusCd;

    @Column(name = "coupon_status_cd_before", length = 20)
    private String couponStatusCdBefore;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Column(name = "target_value", length = 200)
    private String targetValue;

    @Column(name = "mem_grade_cd", length = 20)
    private String memGradeCd;

    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Column(name = "seller_cdiv_remark", length = 300)
    private String sellerCdivRemark;

    @Column(name = "dvc_pc_yn", length = 1)
    private String dvcPcYn;

    @Column(name = "dvc_mweb_yn", length = 1)
    private String dvcMwebYn;

    @Column(name = "dvc_mapp_yn", length = 1)
    private String dvcMappYn;

    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

}
