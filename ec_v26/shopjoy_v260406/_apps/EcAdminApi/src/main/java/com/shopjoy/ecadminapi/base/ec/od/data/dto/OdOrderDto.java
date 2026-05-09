package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdOrderDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderId;
        @Size(max = 21) private String memberId;
        @Size(max = 50) private String orderStatusCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderId;
        private String siteId;
        private String memberId;
        private String memberNm;
        private String ordererEmail;
        private Long totalAmt;
        private Long payAmt;
        private Long discntAmt;
        private Long couponDiscntAmt;
        private Long saveUseAmt;
        private Long shippingFee;
        private String orderStatusCd;
        private String orderStatusCdBefore;
        private String payMethodCd;
        private String dlivStatusCd;
        private String couponId;
        private String recvNm;
        private String recvPhone;
        private String recvZip;
        private String recvAddr;
        private String recvAddrDetail;
        private String recvMemo;
        private String refundBankCd;
        private String refundAccountNo;
        private String refundAccountNm;
        private String accessChannelCd;
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
        private String memo;
        private LocalDateTime orderDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String memberEmail;
        private String memberPhoneOrigin;
        private String gradeCd;
        private Long totalPurchaseAmt;
        private String siteNm;
        private String couponNm;
        private String couponTypeCd;
        private String orderStatusCdNm;
        private String payMethodCdNm;
        private String dlivStatusCdNm;
        private String accessChannelCdNm;
        private String apprStatusCdNm;
        private String refundBankCdNm;
        private String apprTargetCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
