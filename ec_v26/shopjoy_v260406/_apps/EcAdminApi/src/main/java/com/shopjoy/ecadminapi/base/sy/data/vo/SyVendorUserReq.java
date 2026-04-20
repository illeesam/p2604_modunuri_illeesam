package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorUserReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public SyVendorUser toEntity() {
        return SyVendorUser.builder()
                .vendorUserId(vendorUserId)
                .siteId(siteId)
                .vendorId(vendorId)
                .userId(userId)
                .roleId(roleId)
                .memberNm(memberNm)
                .positionCd(positionCd)
                .vendorUserDeptNm(vendorUserDeptNm)
                .vendorUserPhone(vendorUserPhone)
                .vendorUserMobile(vendorUserMobile)
                .vendorUserEmail(vendorUserEmail)
                .birthDate(birthDate)
                .isMain(isMain)
                .authYn(authYn)
                .joinDate(joinDate)
                .leaveDate(leaveDate)
                .vendorUserStatusCd(vendorUserStatusCd)
                .vendorUserRemark(vendorUserRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
