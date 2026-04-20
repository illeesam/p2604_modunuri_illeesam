package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhUserLoginHistDto {

    // ── syh_user_login_hist ──────────────────────────────────────────
    private String loginHistId;
    private String siteId;
    private String userId;
    private LocalDateTime loginDate;
    private String ip;
    private String device;
    private String resultCd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
