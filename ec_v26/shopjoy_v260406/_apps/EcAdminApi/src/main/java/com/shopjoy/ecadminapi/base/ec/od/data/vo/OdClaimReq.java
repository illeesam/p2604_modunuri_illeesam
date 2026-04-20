package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdClaimReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String claimId;
    private String siteId;
    private String orderId;
    private String memberId;
    private String memberNm;
    private String claimTypeCd;
    private String claimStatusCd;
    private String claimStatusCdBefore;
    private String reasonCd;
    private String reasonDetail;
    private String prodNm;
    private String customerFaultYn;
    private String claimCancelYn;
    private LocalDateTime claimCancelDate;
    private String claimCancelReasonCd;
    private String claimCancelReasonDetail;
    private String refundMethodCd;
    private Long refundAmt;
    private Long refundProdAmt;
    private Long refundShippingAmt;
    private Long refundSaveAmt;
    private String refundBankCd;
    private String refundAccountNo;
    private String refundAccountNm;
    private LocalDateTime requestDate;
    private LocalDateTime procDate;
    private String procUserId;
    private String memo;
    private Long addShippingFee;
    private String addShippingFeeChargeCd;
    private String addShippingFeeReason;
    private String collectNm;
    private String collectPhone;
    private String collectZip;
    private String collectAddr;
    private String collectAddrDetail;
    private String collectReqMemo;
    private LocalDateTime collectSchdDate;
    private Long returnShippingFee;
    private String returnCourierCd;
    private String returnTrackingNo;
    private String returnStatusCd;
    private String returnStatusCdBefore;
    private Long inboundShippingFee;
    private String inboundCourierCd;
    private String inboundTrackingNo;
    private String inboundDlivId;
    private String exchRecvNm;
    private String exchRecvPhone;
    private String exchRecvZip;
    private String exchRecvAddr;
    private String exchRecvAddrDetail;
    private String exchRecvReqMemo;
    private Long exchangeShippingFee;
    private String exchangeCourierCd;
    private String exchangeTrackingNo;
    private String outboundDlivId;
    private Long totalShippingFee;
    private String shippingFeePaidYn;
    private LocalDateTime shippingFeePaidDate;
    private String shippingFeeMemo;
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

    public OdClaim toEntity() {
        return OdClaim.builder()
                .claimId(claimId)
                .siteId(siteId)
                .orderId(orderId)
                .memberId(memberId)
                .memberNm(memberNm)
                .claimTypeCd(claimTypeCd)
                .claimStatusCd(claimStatusCd)
                .claimStatusCdBefore(claimStatusCdBefore)
                .reasonCd(reasonCd)
                .reasonDetail(reasonDetail)
                .prodNm(prodNm)
                .customerFaultYn(customerFaultYn)
                .claimCancelYn(claimCancelYn)
                .claimCancelDate(claimCancelDate)
                .claimCancelReasonCd(claimCancelReasonCd)
                .claimCancelReasonDetail(claimCancelReasonDetail)
                .refundMethodCd(refundMethodCd)
                .refundAmt(refundAmt)
                .refundProdAmt(refundProdAmt)
                .refundShippingAmt(refundShippingAmt)
                .refundSaveAmt(refundSaveAmt)
                .refundBankCd(refundBankCd)
                .refundAccountNo(refundAccountNo)
                .refundAccountNm(refundAccountNm)
                .requestDate(requestDate)
                .procDate(procDate)
                .procUserId(procUserId)
                .memo(memo)
                .addShippingFee(addShippingFee)
                .addShippingFeeChargeCd(addShippingFeeChargeCd)
                .addShippingFeeReason(addShippingFeeReason)
                .collectNm(collectNm)
                .collectPhone(collectPhone)
                .collectZip(collectZip)
                .collectAddr(collectAddr)
                .collectAddrDetail(collectAddrDetail)
                .collectReqMemo(collectReqMemo)
                .collectSchdDate(collectSchdDate)
                .returnShippingFee(returnShippingFee)
                .returnCourierCd(returnCourierCd)
                .returnTrackingNo(returnTrackingNo)
                .returnStatusCd(returnStatusCd)
                .returnStatusCdBefore(returnStatusCdBefore)
                .inboundShippingFee(inboundShippingFee)
                .inboundCourierCd(inboundCourierCd)
                .inboundTrackingNo(inboundTrackingNo)
                .inboundDlivId(inboundDlivId)
                .exchRecvNm(exchRecvNm)
                .exchRecvPhone(exchRecvPhone)
                .exchRecvZip(exchRecvZip)
                .exchRecvAddr(exchRecvAddr)
                .exchRecvAddrDetail(exchRecvAddrDetail)
                .exchRecvReqMemo(exchRecvReqMemo)
                .exchangeShippingFee(exchangeShippingFee)
                .exchangeCourierCd(exchangeCourierCd)
                .exchangeTrackingNo(exchangeTrackingNo)
                .outboundDlivId(outboundDlivId)
                .totalShippingFee(totalShippingFee)
                .shippingFeePaidYn(shippingFeePaidYn)
                .shippingFeePaidDate(shippingFeePaidDate)
                .shippingFeeMemo(shippingFeeMemo)
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
