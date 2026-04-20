package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmSaveIssueDto {

    // ── pm_save_issue ──────────────────────────────────────────
    private String saveIssueId;
    private String siteId;
    private String memberId;
    private String saveIssueTypeCd;
    private Long saveAmt;
    private BigDecimal saveRate;
    private String refTypeCd;
    private String refId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private LocalDateTime expireDate;
    private String issueStatusCd;
    private String issueStatusCdBefore;
    private String saveMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
