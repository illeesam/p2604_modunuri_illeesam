package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhUserTokenLogDto {

    // ── syh_user_token_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String userId;
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
    private LocalDateTime accessTokenExp;
    private String uiNm;
    private String cmdNm;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN ─────────────────────────────────────────────────────────
    private String siteNm;
    private String userNm;
    private String actionCdNm;
    private String tokenTypeCdNm;
}
