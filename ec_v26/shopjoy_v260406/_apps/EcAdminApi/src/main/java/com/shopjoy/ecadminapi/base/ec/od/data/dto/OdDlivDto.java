package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 배송 DTO
public class OdDlivDto {

    // ── od_dliv ──────────────────────────────────────────────────
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
    private Long   shippingFee;
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

    // ── JOIN: od_order ───────────────────────────────────────────
    private String memberNm;
    private LocalDateTime orderDate;
    private String orderStatusCd;

    // ── JOIN: sy_vendor ──────────────────────────────────────────
    private String vendorNm;
    private String vendorTel;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String dlivStatusCdNm;
    private String dlivTypeCdNm;
    private String dlivDivCdNm;
    private String outboundCourierCdNm;
    private String inboundCourierCdNm;
}
