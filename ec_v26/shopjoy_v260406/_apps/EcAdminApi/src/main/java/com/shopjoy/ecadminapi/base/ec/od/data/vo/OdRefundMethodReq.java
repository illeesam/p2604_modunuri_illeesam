package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdRefundMethodReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String refundMethodId;
    private String siteId;
    private String refundId;
    private String orderId;
    private String payMethodCd;
    private Integer refundPriority;
    private Long refundAmt;
    private Long refundAvailAmt;
    private String refundStatusCd;
    private String refundStatusCdBefore;
    private LocalDateTime refundDate;
    private String payId;
    private String pgRefundId;
    private String pgResponse;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdRefundMethod toEntity() {
        return OdRefundMethod.builder()
                .refundMethodId(refundMethodId)
                .siteId(siteId)
                .refundId(refundId)
                .orderId(orderId)
                .payMethodCd(payMethodCd)
                .refundPriority(refundPriority)
                .refundAmt(refundAmt)
                .refundAvailAmt(refundAvailAmt)
                .refundStatusCd(refundStatusCd)
                .refundStatusCdBefore(refundStatusCdBefore)
                .refundDate(refundDate)
                .payId(payId)
                .pgRefundId(pgRefundId)
                .pgResponse(pgResponse)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
