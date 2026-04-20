package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmGiftIssueDto {

    // ── pm_gift_issue ──────────────────────────────────────────
    private String giftIssueId;
    private String giftId;
    private String siteId;
    private String memberId;
    private String orderId;
    private LocalDateTime issueDate;
    private String giftIssueStatusCd;
    private String giftIssueStatusCdBefore;
    private String giftIssueMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
