package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdRefundReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String refundId;
    private String siteId;
    private String orderId;
    private String claimId;
    private String refundTypeCd;
    private Long refundProdAmt;
    private Long refundCouponAmt;
    private Long refundShipAmt;
    private Long refundSaveAmt;
    private Long refundCacheAmt;
    private Long totalRefundAmt;
    private String refundStatusCd;
    private String refundStatusCdBefore;
    private LocalDateTime refundReqDate;
    private LocalDateTime refundCompltDate;
    private String faultTypeCd;
    private String refundReason;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdRefund toEntity() {
        return OdRefund.builder()
                .refundId(refundId)
                .siteId(siteId)
                .orderId(orderId)
                .claimId(claimId)
                .refundTypeCd(refundTypeCd)
                .refundProdAmt(refundProdAmt)
                .refundCouponAmt(refundCouponAmt)
                .refundShipAmt(refundShipAmt)
                .refundSaveAmt(refundSaveAmt)
                .refundCacheAmt(refundCacheAmt)
                .totalRefundAmt(totalRefundAmt)
                .refundStatusCd(refundStatusCd)
                .refundStatusCdBefore(refundStatusCdBefore)
                .refundReqDate(refundReqDate)
                .refundCompltDate(refundCompltDate)
                .faultTypeCd(faultTypeCd)
                .refundReason(refundReason)
                .memo(memo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
