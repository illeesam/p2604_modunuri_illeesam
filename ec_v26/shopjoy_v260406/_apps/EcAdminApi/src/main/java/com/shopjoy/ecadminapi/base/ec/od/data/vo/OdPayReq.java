package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdPayReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String payId;
    private String siteId;
    private String orderId;
    private String claimId;
    private String payDivCd;
    private String payDirCd;
    private String payOccurTypeCd;
    private String payMethodCd;
    private String payChannelCd;
    private Long payAmt;
    private String payStatusCd;
    private String payStatusCdBefore;
    private LocalDateTime payDate;
    private String pgCompanyCd;
    private String pgTransactionId;
    private String pgApprovalNo;
    private String pgResponse;
    private String vbankAccount;
    private String vbankBankCode;
    private String vbankBankNm;
    private String vbankHolderNm;
    private LocalDate vbankDueDate;
    private String vbankDepositNm;
    private LocalDateTime vbankDepositDate;
    private String cardNo;
    private String cardIssuerCd;
    private String cardIssuerNm;
    private String cardTypeCd;
    private Integer installmentMonth;
    private Long refundAmt;
    private String refundStatusCd;
    private String refundStatusCdBefore;
    private LocalDateTime refundDate;
    private String refundReason;
    private String failureReason;
    private String failureCode;
    private LocalDateTime failureDate;
    private String memo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdPay toEntity() {
        return OdPay.builder()
                .payId(payId)
                .siteId(siteId)
                .orderId(orderId)
                .claimId(claimId)
                .payDivCd(payDivCd)
                .payDirCd(payDirCd)
                .payOccurTypeCd(payOccurTypeCd)
                .payMethodCd(payMethodCd)
                .payChannelCd(payChannelCd)
                .payAmt(payAmt)
                .payStatusCd(payStatusCd)
                .payStatusCdBefore(payStatusCdBefore)
                .payDate(payDate)
                .pgCompanyCd(pgCompanyCd)
                .pgTransactionId(pgTransactionId)
                .pgApprovalNo(pgApprovalNo)
                .pgResponse(pgResponse)
                .vbankAccount(vbankAccount)
                .vbankBankCode(vbankBankCode)
                .vbankBankNm(vbankBankNm)
                .vbankHolderNm(vbankHolderNm)
                .vbankDueDate(vbankDueDate)
                .vbankDepositNm(vbankDepositNm)
                .vbankDepositDate(vbankDepositDate)
                .cardNo(cardNo)
                .cardIssuerCd(cardIssuerCd)
                .cardIssuerNm(cardIssuerNm)
                .cardTypeCd(cardTypeCd)
                .installmentMonth(installmentMonth)
                .refundAmt(refundAmt)
                .refundStatusCd(refundStatusCd)
                .refundStatusCdBefore(refundStatusCdBefore)
                .refundDate(refundDate)
                .refundReason(refundReason)
                .failureReason(failureReason)
                .failureCode(failureCode)
                .failureDate(failureDate)
                .memo(memo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
