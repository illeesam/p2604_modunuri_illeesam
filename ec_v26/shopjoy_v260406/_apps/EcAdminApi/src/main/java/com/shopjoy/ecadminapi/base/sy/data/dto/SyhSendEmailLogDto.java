package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhSendEmailLogDto {

    // ── syh_send_email_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String templateId;
    private String templateCode;
    private String memberId;
    private String userId;
    private String fromAddr;
    private String toAddr;
    private String ccAddr;
    private String bccAddr;
    private String subject;
    private String content;
    private String params;
    private String resultCd;
    private String failReason;
    private LocalDateTime sendDate;
    private String refTypeCd;
    private String refId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
