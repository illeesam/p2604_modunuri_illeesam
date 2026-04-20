package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmCouponReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String couponId;
    private String siteId;
    private String couponCd;
    private String couponNm;
    private String couponTypeCd;
    private BigDecimal discountRate;
    private Long discountAmt;
    private Long minOrderAmt;
    private Integer minOrderQty;
    private Long maxDiscountAmt;
    private Integer issueLimit;
    private Integer issueCnt;
    private Integer maxIssuePerMem;
    private String couponDesc;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String couponStatusCd;
    private String couponStatusCdBefore;
    private String useYn;
    private String targetTypeCd;
    private String targetValue;
    private String memGradeCd;
    private BigDecimal selfCdivRate;
    private BigDecimal sellerCdivRate;
    private String sellerCdivRemark;
    private String dvcPcYn;
    private String dvcMwebYn;
    private String dvcMappYn;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmCoupon toEntity() {
        return PmCoupon.builder()
                .couponId(couponId)
                .siteId(siteId)
                .couponCd(couponCd)
                .couponNm(couponNm)
                .couponTypeCd(couponTypeCd)
                .discountRate(discountRate)
                .discountAmt(discountAmt)
                .minOrderAmt(minOrderAmt)
                .minOrderQty(minOrderQty)
                .maxDiscountAmt(maxDiscountAmt)
                .issueLimit(issueLimit)
                .issueCnt(issueCnt)
                .maxIssuePerMem(maxIssuePerMem)
                .couponDesc(couponDesc)
                .validFrom(validFrom)
                .validTo(validTo)
                .couponStatusCd(couponStatusCd)
                .couponStatusCdBefore(couponStatusCdBefore)
                .useYn(useYn)
                .targetTypeCd(targetTypeCd)
                .targetValue(targetValue)
                .memGradeCd(memGradeCd)
                .selfCdivRate(selfCdivRate)
                .sellerCdivRate(sellerCdivRate)
                .sellerCdivRemark(sellerCdivRemark)
                .dvcPcYn(dvcPcYn)
                .dvcMwebYn(dvcMwebYn)
                .dvcMappYn(dvcMappYn)
                .memo(memo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
