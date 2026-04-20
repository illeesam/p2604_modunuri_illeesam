package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StErpVoucherLineDto {

    // ── st_erp_voucher_line ──────────────────────────────────────────
    private String erpVoucherLineId;
    private String erpVoucherId;
    private Integer lineNo;
    private String accountCd;
    private String accountNm;
    private String costCenterCd;
    private String profitCenterCd;
    private Long debitAmt;
    private Long creditAmt;
    private String refTypeCd;
    private String refId;
    private String lineMemo;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
