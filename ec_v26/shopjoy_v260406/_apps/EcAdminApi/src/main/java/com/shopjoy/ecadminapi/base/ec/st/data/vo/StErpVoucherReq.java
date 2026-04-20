package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StErpVoucherReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public StErpVoucher toEntity() {
        return StErpVoucher.builder()
                .erpVoucherId(erpVoucherId)
                .siteId(siteId)
                .vendorId(vendorId)
                .settleId(settleId)
                .settleYm(settleYm)
                .erpVoucherTypeCd(erpVoucherTypeCd)
                .erpVoucherStatusCd(erpVoucherStatusCd)
                .erpVoucherStatusCdBefore(erpVoucherStatusCdBefore)
                .voucherDate(voucherDate)
                .erpVoucherDesc(erpVoucherDesc)
                .totalDebitAmt(totalDebitAmt)
                .totalCreditAmt(totalCreditAmt)
                .erpSendDate(erpSendDate)
                .erpVoucherNo(erpVoucherNo)
                .erpResMsg(erpResMsg)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
