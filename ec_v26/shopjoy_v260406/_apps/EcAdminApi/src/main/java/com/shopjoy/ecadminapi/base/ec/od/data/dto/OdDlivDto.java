package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdDlivDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String dlivId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivId;
        private String siteId;
        private String orderId;
        private String vendorId;
        private String dlivTypeCd;
        private String dlivDivCd;
        private String dlivStatusCd;
        private String dlivStatusCdBefore;
        private String outboundCourierCd;
        private String outboundTrackingNo;
        private LocalDateTime dlivShipDate;
        private LocalDateTime dlivDate;
        private Long shippingFee;
        private String inboundCourierCd;
        private String inboundTrackingNo;
        private LocalDateTime inboundDate;
        private String recvNm;
        private String recvPhone;
        private String recvZip;
        private String recvAddr;
        private String recvAddrDetail;
        private String recvMemo;
        private String dlivMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String memberNm;
        private LocalDateTime orderDate;
        private String orderStatusCd;
        private String vendorNm;
        private String vendorTel;
        private String dlivStatusCdNm;
        private String dlivTypeCdNm;
        private String dlivDivCdNm;
        private String outboundCourierCdNm;
        private String inboundCourierCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
