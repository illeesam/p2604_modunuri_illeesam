package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_erp_voucher", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// ERP 전표 엔티티
public class StErpVoucher {

    @Id
    @Column(name = "erp_voucher_id", length = 21, nullable = false)
    private String erpVoucherId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Column(name = "settle_ym", length = 6)
    private String settleYm;

    @Column(name = "erp_voucher_type_cd", length = 20, nullable = false)
    private String erpVoucherTypeCd;

    @Column(name = "erp_voucher_status_cd", length = 20)
    private String erpVoucherStatusCd;

    @Column(name = "erp_voucher_status_cd_before", length = 20)
    private String erpVoucherStatusCdBefore;

    @Column(name = "voucher_date", nullable = false)
    private LocalDate voucherDate;

    @Column(name = "erp_voucher_desc", length = 500)
    private String erpVoucherDesc;

    @Column(name = "total_debit_amt")
    private Long totalDebitAmt;

    @Column(name = "total_credit_amt")
    private Long totalCreditAmt;

    @Column(name = "erp_send_date")
    private LocalDateTime erpSendDate;

    @Column(name = "erp_voucher_no", length = 50)
    private String erpVoucherNo;

    @Column(name = "erp_res_msg", length = 500)
    private String erpResMsg;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}