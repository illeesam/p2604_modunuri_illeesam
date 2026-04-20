package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbhMemberLoginLogDto {

    // ── mbh_member_login_log ──────────────────────────────────────────
    private String logId;
    private String siteId;
    private String memberId;
    private String loginId;
    private LocalDateTime loginDate;
    private String resultCd;
    private Integer failCnt;
    private String ip;
    private String device;
    private String os;
    private String browser;
    private String country;
    private String accessToken;
    private LocalDateTime accessTokenExp;
    private String refreshToken;
    private LocalDateTime refreshTokenExp;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
