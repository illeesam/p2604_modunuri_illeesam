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
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_coupon", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 엔티티
@Comment("쿠폰")
public class PmCoupon extends BaseEntity {

    @Id
    @Comment("쿠폰ID (YYMMDDhhmmss+rand4)")
    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("쿠폰코드")
    @Column(name = "coupon_cd", length = 50, nullable = false)
    private String couponCd;

    @Comment("쿠폰명")
    @Column(name = "coupon_nm", length = 100, nullable = false)
    private String couponNm;

    @Comment("쿠폰유형 (코드: COUPON_TYPE)")
    @Column(name = "coupon_type_cd", length = 20, nullable = false)
    private String couponTypeCd;

    @Comment("할인률 (%)")
    @Column(name = "discount_rate")
    private BigDecimal discountRate;

    @Comment("할인금액")
    @Column(name = "discount_amt")
    private Long discountAmt;

    @Comment("최소주문금액")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("최소주문수량 (NULL=제한없음)")
    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Comment("최대할인한도 (NULL=무제한)")
    @Column(name = "max_discount_amt")
    private Long maxDiscountAmt;

    @Comment("총발급한도 (NULL=무제한)")
    @Column(name = "issue_limit")
    private Integer issueLimit;

    @Comment("발급된 개수")
    @Column(name = "issue_cnt")
    private Integer issueCnt;

    @Comment("회원당 최대발급수 (NULL=무제한)")
    @Column(name = "max_issue_per_mem")
    private Integer maxIssuePerMem;

    @Comment("쿠폰설명")
    @Column(name = "coupon_desc", columnDefinition = "TEXT")
    private String couponDesc;

    @Comment("유효기간 시작")
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Comment("유효기간 종료")
    @Column(name = "valid_to")
    private LocalDate validTo;

    @Comment("상태 (코드: COUPON_STATUS)")
    @Column(name = "coupon_status_cd", length = 20)
    private String couponStatusCd;

    @Comment("변경 전 쿠폰상태 (코드: COUPON_STATUS)")
    @Column(name = "coupon_status_cd_before", length = 20)
    private String couponStatusCdBefore;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("적용대상 (코드: COUPON_TARGET)")
    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Comment("적용대상값")
    @Column(name = "target_value", length = 200)
    private String targetValue;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
    private String memGradeCd;

    @Comment("자사(사이트) 분담율 (%) — 기본 100%")
    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Comment("판매자(업체) 분담율 (%) — 기본 0%")
    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Comment("판매자 분담 비고")
    @Column(name = "seller_cdiv_remark", length = 300)
    private String sellerCdivRemark;

    @Comment("PC 채널 적용여부 Y/N")
    @Column(name = "dvc_pc_yn", length = 1)
    private String dvcPcYn;

    @Comment("모바일WEB 적용여부 Y/N")
    @Column(name = "dvc_mweb_yn", length = 1)
    private String dvcMwebYn;

    @Comment("모바일APP 적용여부 Y/N")
    @Column(name = "dvc_mapp_yn", length = 1)
    private String dvcMappYn;

    @Comment("메모")
    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

}
