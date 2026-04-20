package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmVoucherIssueDto {

    // ── pm_voucher_issue ──────────────────────────────────────────
    private String voucherIssueId;
    private String voucherId;
    private String siteId;
    private String memberId;
    private String voucherCode;
    private LocalDateTime issueDate;
    private LocalDateTime expireDate;
    private LocalDateTime useDate;
    private String orderId;
    private Long useAmt;
    private String voucherIssueStatusCd;
    private String voucherIssueStatusCdBefore;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
