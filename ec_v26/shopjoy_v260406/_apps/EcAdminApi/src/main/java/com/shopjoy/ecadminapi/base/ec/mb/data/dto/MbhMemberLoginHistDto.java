package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbhMemberLoginHistDto {

    // ── mbh_member_login_hist ──────────────────────────────────────────
    private String loginHistId;
    private String siteId;
    private String memberId;
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
