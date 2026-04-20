package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdOrderReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String orderId;
    private String siteId;
    private String memberId;
    private String memberNm;
    private String ordererEmail;
    private String orderGradeCd;
    private LocalDateTime orderDate;
    private String accessChannelCd;
    private Long totalAmt;
    private Long totalDiscountAmt;
    private Long couponDiscountAmt;
    private Long cacheUseAmt;
    private Long shippingSaveUseAmt;
    private Long outboundShippingFee;
    private Long payAmt;
    private Long orgTotalAmt;
    private Long orgTotalDiscountAmt;
    private Long orgShippingFee;
    private Long orgCacheUseAmt;
    private Long orgPayAmt;
    private String payMethodCd;
    private LocalDateTime payDate;
    private String orderStatusCd;
    private String orderStatusCdBefore;
    private String recvNm;
    private String recvPhone;
    private String recvZip;
    private String recvAddr;
    private String recvAddrDetail;
    private String recvMemo;
    private String entrancePwd;
    private String refundBankCd;
    private String refundAccountNo;
    private String refundAccountNm;
    private String couponId;
    private String memo;
    private String dlivCourierCd;
    private String dlivTrackingNo;
    private String dlivStatusCd;
    private String dlivStatusCdBefore;
    private LocalDateTime dlivShipDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String apprStatusCd;
    private String apprStatusCdBefore;
    private Long apprAmt;
    private String apprTargetCd;
    private String apprTargetNm;
    private String apprReason;
    private String apprReqUserId;
    private LocalDateTime apprReqDate;
    private String apprAprvUserId;
    private LocalDateTime apprAprvDate;

    public OdOrder toEntity() {
        return OdOrder.builder()
                .orderId(orderId)
                .siteId(siteId)
                .memberId(memberId)
                .memberNm(memberNm)
                .ordererEmail(ordererEmail)
                .orderGradeCd(orderGradeCd)
                .orderDate(orderDate)
                .accessChannelCd(accessChannelCd)
                .totalAmt(totalAmt)
                .totalDiscountAmt(totalDiscountAmt)
                .couponDiscountAmt(couponDiscountAmt)
                .cacheUseAmt(cacheUseAmt)
                .shippingSaveUseAmt(shippingSaveUseAmt)
                .outboundShippingFee(outboundShippingFee)
                .payAmt(payAmt)
                .orgTotalAmt(orgTotalAmt)
                .orgTotalDiscountAmt(orgTotalDiscountAmt)
                .orgShippingFee(orgShippingFee)
                .orgCacheUseAmt(orgCacheUseAmt)
                .orgPayAmt(orgPayAmt)
                .payMethodCd(payMethodCd)
                .payDate(payDate)
                .orderStatusCd(orderStatusCd)
                .orderStatusCdBefore(orderStatusCdBefore)
                .recvNm(recvNm)
                .recvPhone(recvPhone)
                .recvZip(recvZip)
                .recvAddr(recvAddr)
                .recvAddrDetail(recvAddrDetail)
                .recvMemo(recvMemo)
                .entrancePwd(entrancePwd)
                .refundBankCd(refundBankCd)
                .refundAccountNo(refundAccountNo)
                .refundAccountNm(refundAccountNm)
                .couponId(couponId)
                .memo(memo)
                .dlivCourierCd(dlivCourierCd)
                .dlivTrackingNo(dlivTrackingNo)
                .dlivStatusCd(dlivStatusCd)
                .dlivStatusCdBefore(dlivStatusCdBefore)
                .dlivShipDate(dlivShipDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .apprStatusCd(apprStatusCd)
                .apprStatusCdBefore(apprStatusCdBefore)
                .apprAmt(apprAmt)
                .apprTargetCd(apprTargetCd)
                .apprTargetNm(apprTargetNm)
                .apprReason(apprReason)
                .apprReqUserId(apprReqUserId)
                .apprReqDate(apprReqDate)
                .apprAprvUserId(apprAprvUserId)
                .apprAprvDate(apprAprvDate)
                .build();
    }
}
