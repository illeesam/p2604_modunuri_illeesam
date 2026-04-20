package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmVoucherDto {

    // ── pm_voucher ──────────────────────────────────────────
    private String voucherId;
    private String siteId;
    private String voucherNm;
    private String voucherTypeCd;
    private BigDecimal voucherValue;
    private Long minOrderAmt;
    private Long maxDiscntAmt;
    private Integer expireMonth;
    private String voucherStatusCd;
    private String voucherStatusCdBefore;
    private String voucherDesc;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
