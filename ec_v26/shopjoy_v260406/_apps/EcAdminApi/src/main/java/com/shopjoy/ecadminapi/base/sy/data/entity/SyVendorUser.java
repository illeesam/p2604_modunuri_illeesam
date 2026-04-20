package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_vendor_user", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 업체 사용자 엔티티
public class SyVendorUser {

    @Id
    @Column(name = "vendor_user_id", length = 21, nullable = false)
    private String vendorUserId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "user_id", length = 21)
    private String userId;

    @Column(name = "role_id", length = 21)
    private String roleId;

    @Column(name = "member_nm", length = 50, nullable = false)
    private String memberNm;

    @Column(name = "position_cd", length = 20)
    private String positionCd;

    @Column(name = "vendor_user_dept_nm", length = 100)
    private String vendorUserDeptNm;

    @Column(name = "vendor_user_phone", length = 20)
    private String vendorUserPhone;

    @Column(name = "vendor_user_mobile", length = 20, nullable = false)
    private String vendorUserMobile;

    @Column(name = "vendor_user_email", length = 100, nullable = false)
    private String vendorUserEmail;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_main", length = 1)
    private String isMain;

    @Column(name = "auth_yn", length = 1)
    private String authYn;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "leave_date")
    private LocalDate leaveDate;

    @Column(name = "vendor_user_status_cd", length = 20)
    private String vendorUserStatusCd;

    @Column(name = "vendor_user_remark", length = 500)
    private String vendorUserRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}