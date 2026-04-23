package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorUserRoleDto {

    // ── sy_vendor_user_role ─────────────────────────────────────
    private String vendorUserRoleId;
    private String vendorId;
    private String userId;
    private String roleId;
    private String grantUserId;
    private LocalDateTime grantDate;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String vendorUserRoleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN ────────────────────────────────────────────────────
    private String vendorNm;
    private String memberNm;
    private String roleNm;
    private String grantUserNm;
}
