package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyRoleMenuDto {

    // ── sy_role_menu ──────────────────────────────────────────
    private String roleMenuId;
    private String siteId;
    private String roleId;
    private String menuId;
    private Integer permLevel;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
