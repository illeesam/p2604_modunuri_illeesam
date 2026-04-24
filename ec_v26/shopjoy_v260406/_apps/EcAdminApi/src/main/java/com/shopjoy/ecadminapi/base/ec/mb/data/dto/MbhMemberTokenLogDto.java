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
    private String accessToken;
    private LocalDateTime tokenExp;
    private String prevToken;
    private String refreshToken;
    private String ip;
    private String deviceInfo;
    private String revokeReason;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN ─────────────────────────────────────────────────────────
    private String siteNm;
    private String memberNm;
    private String actionCdNm;
    private String tokenTypeCdNm;
}
