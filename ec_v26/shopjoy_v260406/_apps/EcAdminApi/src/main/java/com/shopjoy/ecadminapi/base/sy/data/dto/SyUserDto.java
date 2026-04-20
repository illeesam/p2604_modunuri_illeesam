package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyUserDto {

    // ── sy_user ──────────────────────────────────────────
    private String userId;
    private String siteId;
    private String loginId;
    private String userPassword;
    private String userNm;
    private String userEmail;
    private String userPhone;
    private String deptId;
    private String roleId;
    private String userStatusCd;
    private LocalDateTime lastLogin;
    private Integer loginFailCnt;
    private String userMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String authMethodCd;
    private LocalDateTime lastLoginDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
