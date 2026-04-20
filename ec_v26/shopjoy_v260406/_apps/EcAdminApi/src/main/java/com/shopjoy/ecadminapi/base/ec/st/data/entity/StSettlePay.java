package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_pay", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 지급 엔티티
public class StSettlePay {

    @Id
    @Column(name = "settle_pay_id", length = 21, nullable = false)
    private String settlePayId;

    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "pay_amt", nullable = false)
    private Long payAmt;

    @Column(name = "pay_method_cd", length = 20)
    private String payMethodCd;

    @Column(name = "bank_nm", length = 50)
    private String bankNm;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "bank_holder", length = 50)
    private String bankHolder;

    @Column(name = "pay_status_cd", length = 20)
    private String payStatusCd;

    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Column(name = "pay_by", length = 20)
    private String payBy;

    @Lob
    @Column(name = "settle_pay_memo", columnDefinition = "TEXT")
    private String settlePayMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}