package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdDlivReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String dlivId;
    private String siteId;
    private String orderId;
    private String claimId;
    private String vendorId;
    private String memberId;
    private String memberNm;
    private String recvNm;
    private String recvPhone;
    private String recvZip;
    private String recvAddr;
    private String recvAddrDetail;
    private String dlivDivCd;
    private String dlivTypeCd;
    private String dlivPayTypeCd;
    private String outboundCourierCd;
    private String outboundTrackingNo;
    private String inboundCourierCd;
    private String inboundTrackingNo;
    private String dlivStatusCd;
    private String dlivStatusCdBefore;
    private LocalDateTime dlivShipDate;
    private LocalDateTime dlivDate;
    private String dlivMemo;
    private Long shippingFee;
    private Long orgShippingFee;
    private Long shippingDiscountAmt;
    private String shippingFeeTypeCd;
    private String parentDlivId;
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

    public OdDliv toEntity() {
        return OdDliv.builder()
                .dlivId(dlivId)
                .siteId(siteId)
                .orderId(orderId)
                .claimId(claimId)
                .vendorId(vendorId)
                .memberId(memberId)
                .memberNm(memberNm)
                .recvNm(recvNm)
                .recvPhone(recvPhone)
                .recvZip(recvZip)
                .recvAddr(recvAddr)
                .recvAddrDetail(recvAddrDetail)
                .dlivDivCd(dlivDivCd)
                .dlivTypeCd(dlivTypeCd)
                .dlivPayTypeCd(dlivPayTypeCd)
                .outboundCourierCd(outboundCourierCd)
                .outboundTrackingNo(outboundTrackingNo)
                .inboundCourierCd(inboundCourierCd)
                .inboundTrackingNo(inboundTrackingNo)
                .dlivStatusCd(dlivStatusCd)
                .dlivStatusCdBefore(dlivStatusCdBefore)
                .dlivShipDate(dlivShipDate)
                .dlivDate(dlivDate)
                .dlivMemo(dlivMemo)
                .shippingFee(shippingFee)
                .orgShippingFee(orgShippingFee)
                .shippingDiscountAmt(shippingDiscountAmt)
                .shippingFeeTypeCd(shippingFeeTypeCd)
                .parentDlivId(parentDlivId)
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
