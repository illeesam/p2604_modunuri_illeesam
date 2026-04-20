package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyUserRoleDto {

    // ── sy_user_role ──────────────────────────────────────────
    private String userRoleId;
    private String userId;
    private String roleId;
    private String grantUserId;
    private LocalDateTime grantDate;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String userRoleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
