package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StErpVoucherDto {

    // ── st_erp_voucher ──────────────────────────────────────────
    private String erpVoucherId;
    private String siteId;
    private String vendorId;
    private String settleId;
    private String settleYm;
    private String erpVoucherTypeCd;
    private String erpVoucherStatusCd;
    private String erpVoucherStatusCdBefore;
    private LocalDate voucherDate;
    private String erpVoucherDesc;
    private Long totalDebitAmt;
    private Long totalCreditAmt;
    private LocalDateTime erpSendDate;
    private String erpVoucherNo;
    private String erpResMsg;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
