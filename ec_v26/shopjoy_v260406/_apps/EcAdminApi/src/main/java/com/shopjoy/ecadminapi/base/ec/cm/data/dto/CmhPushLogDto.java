package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmhPushLogDto {

    // ── cmh_push_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String channelCd;
    private String templateId;
    private String memberId;
    private String recvAddr;
    private String pushLogTitle;
    private String pushLogContent;
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
