package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyRoleDto {

    // ── sy_role ──────────────────────────────────────────
    private String roleId;
    private String siteId;
    private String roleCode;
    private String roleNm;
    private String parentRoleId;
    private String roleTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String restrictPerm;
    private String roleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
