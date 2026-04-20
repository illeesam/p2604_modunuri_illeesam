package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_pay", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 결제 엔티티
public class OdPay {

    @Id
    @Column(name = "pay_id", length = 21, nullable = false)
    private String payId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Column(name = "pay_div_cd", length = 20)
    private String payDivCd;

    @Column(name = "pay_dir_cd", length = 20)
    private String payDirCd;

    @Column(name = "pay_occur_type_cd", length = 20)
    private String payOccurTypeCd;

    @Column(name = "pay_method_cd", length = 20, nullable = false)
    private String payMethodCd;

    @Column(name = "pay_channel_cd", length = 20)
    private String payChannelCd;

    @Column(name = "pay_amt", nullable = false)
    private Long payAmt;

    @Column(name = "pay_status_cd", length = 20)
    private String payStatusCd;

    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Column(name = "pg_company_cd", length = 20)
    private String pgCompanyCd;

    @Column(name = "pg_transaction_id", length = 100)
    private String pgTransactionId;

    @Column(name = "pg_approval_no", length = 50)
    private String pgApprovalNo;

    @Lob
    @Column(name = "pg_response", columnDefinition = "TEXT")
    private String pgResponse;

    @Column(name = "vbank_account", length = 20)
    private String vbankAccount;

    @Column(name = "vbank_bank_code", length = 10)
    private String vbankBankCode;

    @Column(name = "vbank_bank_nm", length = 50)
    private String vbankBankNm;

    @Column(name = "vbank_holder_nm", length = 50)
    private String vbankHolderNm;

    @Column(name = "vbank_due_date")
    private LocalDate vbankDueDate;

    @Column(name = "vbank_deposit_nm", length = 50)
    private String vbankDepositNm;

    @Column(name = "vbank_deposit_date")
    private LocalDateTime vbankDepositDate;

    @Column(name = "card_no", length = 20)
    private String cardNo;

    @Column(name = "card_issuer_cd", length = 20)
    private String cardIssuerCd;

    @Column(name = "card_issuer_nm", length = 50)
    private String cardIssuerNm;

    @Column(name = "card_type_cd", length = 20)
    private String cardTypeCd;

    @Column(name = "installment_month")
    private Integer installmentMonth;

    @Column(name = "refund_amt")
    private Long refundAmt;

    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Column(name = "refund_reason", length = 300)
    private String refundReason;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Column(name = "failure_date")
    private LocalDateTime failureDate;

    @Column(name = "memo", length = 300)
    private String memo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}