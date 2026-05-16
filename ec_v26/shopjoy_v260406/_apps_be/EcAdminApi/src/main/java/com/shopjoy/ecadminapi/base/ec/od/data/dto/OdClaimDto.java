package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdClaimDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String claimId;
        @Size(max = 21) private String memberId;
        @Size(max = 50) private String claimStatusCd;
        @Size(max = 50) private String claimTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
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
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private LocalDateTime orderDate;
        private String orderStatusCd;
        private String payMethodCd;
        private String recvNm;
        private String recvPhone;
        private String recvAddr;
        private String memberEmail;
        private String memberPhoneOrigin;
        private String claimTypeCdNm;
        private String claimStatusCdNm;
        private String refundMethodCdNm;
        private String refundBankCdNm;
        private String returnCourierCdNm;
        private String returnStatusCdNm;
        private String inboundCourierCdNm;
        private String exchangeCourierCdNm;
        private String apprStatusCdNm;
        private String apprTargetCdNm;
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<OdClaimItemDto.Item> claimItems;   // 클레임상품 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
