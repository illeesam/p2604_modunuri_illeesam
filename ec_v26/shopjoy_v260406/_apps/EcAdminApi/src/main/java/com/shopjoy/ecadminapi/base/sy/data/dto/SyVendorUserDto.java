package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorUserDto {

    // ── sy_vendor_user ──────────────────────────────────────────
    private String vendorUserId;
    private String siteId;
    private String vendorId;
    private String userId;
    private String roleId;
    private String memberNm;
    private String positionCd;
    private String vendorUserDeptNm;
    private String vendorUserPhone;
    private String vendorUserMobile;
    private String vendorUserEmail;
    private LocalDate birthDate;
    private String isMain;
    private String authYn;
    private LocalDate joinDate;
    private LocalDate leaveDate;
    private String vendorUserStatusCd;
    private String vendorUserRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
