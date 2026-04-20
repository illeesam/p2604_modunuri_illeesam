package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbhMemberTokenLogDto {

    // ── mbh_member_token_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String memberId;
    private String loginLogId;
    private String actionCd;
    private String tokenTypeCd;
    private String token;
    private LocalDateTime tokenExp;
    private String prevToken;
    private String ip;
    private String device;
    private String revokeReason;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
