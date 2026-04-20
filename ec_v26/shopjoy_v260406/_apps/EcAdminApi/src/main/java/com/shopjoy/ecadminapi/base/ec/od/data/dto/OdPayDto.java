package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 결제 DTO
public class OdPayDto {

    // ── od_pay ───────────────────────────────────────────────────
    private String payId;
    private String siteId;
    private String orderId;
    private String memberId;
    private String payStatusCd;
    private String payStatusCdBefore;
    private String payMethodCd;
    private String payDirCd;
    private String payChannelCd;
    private Long   payAmt;
    private Long   refundAmt;
    private String refundStatusCd;
    private LocalDateTime refundDate;
    private String pgTransactionId;
    private String pgOrderId;
    private String pgResultCd;
    private String pgResultMsg;
    private LocalDateTime payDate;
    private String cardNo;
    private String cardTypeCd;
    private Integer cardInstallMonth;
    private String vbankBankCode;
    private String vbankAccountNo;
    private String vbankAccountNm;
    private LocalDateTime vbankExpireDate;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: od_order ───────────────────────────────────────────
    private String memberNm;
    private LocalDateTime orderDate;
    private String orderStatusCd;

    // ── JOIN: mb_member ──────────────────────────────────────────
    private String memberEmail;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String payStatusCdNm;
    private String payMethodCdNm;
    private String payDirCdNm;
    private String payChannelCdNm;
    private String refundStatusCdNm;
    private String vbankBankCodeNm;
    private String cardTypeCdNm;
}
