package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 주문 DTO
public class OdOrderDto {

    // ── od_order ─────────────────────────────────────────────────
    private String  orderId;
    private String  siteId;
    private String  memberId;
    private String  memberNm;
    private String  ordererEmail;
    private Long    totalAmt;
    private Long    payAmt;
    private Long    discntAmt;
    private Long    couponDiscntAmt;
    private Long    saveUseAmt;
    private Long    shippingFee;
    private String  orderStatusCd;
    private String  orderStatusCdBefore;
    private String  payMethodCd;
    private String  dlivStatusCd;
    private String  couponId;
    private String  recvNm;
    private String  recvPhone;
    private String  recvZip;
    private String  recvAddr;
    private String  recvAddrDetail;
    private String  recvMemo;
    private String  refundBankCd;
    private String  refundAccountNo;
    private String  refundAccountNm;
    private String  accessChannelCd;
    private String  apprStatusCd;
    private String  apprStatusCdBefore;
    private Long    apprAmt;
    private String  apprTargetCd;
    private String  apprTargetNm;
    private String  apprReason;
    private String  apprReqUserId;
    private LocalDateTime apprReqDate;
    private String  apprAprvUserId;
    private LocalDateTime apprAprvDate;
    private String  memo;
    private LocalDateTime orderDate;
    private String  regBy;
    private LocalDateTime regDate;
    private String  updBy;
    private LocalDateTime updDate;

    // ── JOIN: mb_member ──────────────────────────────────────────
    private String memberEmail;
    private String memberPhoneOrigin;
    private String gradeCd;
    private Long   totalPurchaseAmt;

    // ── JOIN: sy_site ────────────────────────────────────────────
    private String siteNm;

    // ── JOIN: pm_coupon ──────────────────────────────────────────
    private String couponNm;
    private String couponTypeCd;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String orderStatusCdNm;
    private String payMethodCdNm;
    private String dlivStatusCdNm;
    private String accessChannelCdNm;
    private String apprStatusCdNm;
    private String refundBankCdNm;
    private String apprTargetCdNm;
}
