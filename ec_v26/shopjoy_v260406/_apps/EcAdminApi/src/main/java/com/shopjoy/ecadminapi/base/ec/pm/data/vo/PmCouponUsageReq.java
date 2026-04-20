package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCouponUsageReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String usageId;
    private String siteId;
    private String couponId;
    private String couponCode;
    private String couponNm;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private String discountTypeCd;
    private Integer discountValue;
    private Long discountAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmCouponUsage toEntity() {
        return PmCouponUsage.builder()
                .usageId(usageId)
                .siteId(siteId)
                .couponId(couponId)
                .couponCode(couponCode)
                .couponNm(couponNm)
                .memberId(memberId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .discountTypeCd(discountTypeCd)
                .discountValue(discountValue)
                .discountAmt(discountAmt)
                .usedDate(usedDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
